import { Router, Request, Response } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import prisma from '../lib/prisma';
import { handleOrderPaidAscension } from '../services/ascensionService';
import { sendToUser } from '../services/pushService';
import { validate, OrderStatusUpdateSchema, OrderListQuerySchema, IdParamSchema } from '../validators';
import { logger } from '../utils/logger';
import { envelope, parsePagination } from '../utils/paginate';

const router = Router();

// NOTE: Legacy POST /checkout has been removed.
// The canonical checkout endpoint lives in src/routes/checkout.ts
// which properly creates OrderItems, deducts stock, and generates QR codes.

// GET /api/v1/orders - Admin Order Listing (with optional status filter)
router.get('/', authenticateJWT, validate({ query: OrderListQuerySchema }), async (req: Request, res: Response) => {
  try {
    const { status, includeCancelled } = req.query as { status?: string; includeCancelled?: boolean };
    const where: any = {};
    // If status is explicitly provided, filter by it
    if (status && typeof status === 'string') {
      where.status = status;
    } else if (includeCancelled !== true) {
      // Default: hide cancelled orders unless user asks to see them
      where.status = { not: 'cancelled' };
    }

    // Ownership scoping: staff (admin / cashier) see every order — this powers
    // the management table. Any other authenticated user (customer / distributor)
    // is restricted to their OWN orders, so the account "Sipariş Geçmişim" view
    // can reuse this endpoint without exposing other customers' orders.
    const role = (req as any).user?.role;
    if (role !== 'admin' && role !== 'cashier') {
      const uid = (req as any).user?.userId;
      if (!uid) return res.json(envelope([], 0, 1, 50));
      where.userId = uid;
    }

    const { page, limit, skip, take } = parsePagination(req.query as any, { limit: 50 });

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.order.count({ where })
    ]);
    res.json(envelope(orders, total, page, limit));
  } catch (error: any) {
    logger.error({ err: error }, 'List Orders Error:');
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/v1/orders/:id — single order detail (items + payment info).
// Ownership-scoped: staff (admin/cashier) may view any order; any other
// authenticated user may only view their OWN order.
router.get('/:id', authenticateJWT, validate({ params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                translations: true,
                images: { select: { imageUrl: true }, orderBy: { sortOrder: 'asc' }, take: 1 }
              }
            }
          }
        }
      }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const role = (req as any).user?.role;
    const isStaff = role === 'admin' || role === 'cashier';
    if (!isStaff && order.userId !== (req as any).user?.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Localise each item's product name to the request locale (TR fallback).
    const lang = (req.headers['accept-language'] as string | undefined)?.slice(0, 2);
    const localiseName = (p: any): string => {
      let name = p?.name ?? '';
      try {
        const tr = typeof p?.translations === 'string' ? JSON.parse(p.translations) : p?.translations;
        if (lang && tr?.[lang]?.name) name = tr[lang].name;
      } catch { /* keep base name */ }
      return name;
    };

    res.json({
      id: order.id,
      status: order.status,
      orderType: order.orderType,
      paymentMethod: order.paymentMethod,
      totalKgs: order.totalKgs,
      totalUsd: order.totalUsd,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      address: order.address,
      receiptImageUrl: order.receiptImageUrl,
      verifiedAt: order.verifiedAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((it: any) => ({
        id: it.id,
        productId: it.productId,
        quantity: it.quantity,
        unitPriceKgs: it.unitPriceKgs,
        totalPriceKgs: it.totalPriceKgs,
        productName: localiseName(it.product),
        productImage: it.product?.images?.[0]?.imageUrl ?? null
      }))
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Order Detail Error:');
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// PUT /api/v1/orders/:id/status - Update Order Status
router.put('/:id/status', authenticateJWT, requireRole('admin'), validate({ body: OrderStatusUpdateSchema, params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };

    const order = await prisma.order.update({
      where: { id: id as string },
      data: { status }
    });

    if (status === 'paid' || status === 'completed') {
      await handleOrderPaidAscension(order.id);
    }

    // Push notification to the customer about the status change.
    const userId = (order as any).userId;
    if (userId && status !== 'pending') {
      const titles: Record<string, string> = {
        paid: '💳 Ödemeniz onaylandı',
        shipped: '📦 Siparişiniz kargoda',
        completed: '✅ Siparişiniz tamamlandı',
        cancelled: '❌ Siparişiniz iptal edildi',
        refunded: '↩️ İade işlemi başlatıldı'
      };
      const urls: Record<string, string> = {
        paid: '/orders',
        shipped: '/orders',
        completed: '/orders',
        cancelled: '/orders',
        refunded: '/orders'
      };
      const title = titles[status];
      if (title) {
        sendToUser(userId, {
          title,
          body: `Sipariş #${(order as any).orderNumber || id.slice(0, 8)} — ${status}`,
          url: urls[status],
          tag: `order-${status}`,
          eventKey: `order_${status}`
        }).catch(() => {});
      }
    }

    res.json({ message: 'Order status updated', order });
  } catch (error: any) {
    logger.error({ err: error }, 'Update Order Status Error:');
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// DELETE /api/v1/orders/:id - permanently delete an order (admin only).
// OrderItems cascade-delete via the schema relation. This is irreversible —
// the frontend gates it behind a confirm dialog.
router.delete('/:id', authenticateJWT, requireRole('admin'), validate({ params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.order.delete({ where: { id } });
    res.json({ ok: true, id });
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Order not found' });
    logger.error({ err: error }, 'Delete Order Error:');
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;
