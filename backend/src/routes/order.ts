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
router.get('/', authenticateJWT, requireRole('admin'), validate({ query: OrderListQuerySchema }), async (req: Request, res: Response) => {
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

export default router;
