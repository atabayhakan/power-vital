// Admin bulk actions + CSV export.
//
// Endpoints (all admin-only):
//   GET  /admin/bulk/orders.csv           → orders export (date-range filter)
//   GET  /admin/bulk/users.csv            → users export
//   GET  /admin/bulk/products.csv         → products export (with stock + i18n status)
//   GET  /admin/bulk/withdrawals.csv      → withdrawals export
//   POST /admin/bulk/orders/status       → bulk-update order statuses
//   POST /admin/bulk/users/role           → bulk-update user roles
//   POST /admin/bulk/products/category    → bulk-move products to a category
//
// All write operations are transactional, audit-logged via adminEvents,
// and return a summary of what changed so the UI can show a toast.

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { validate } from '../validators';
import { adminEvents } from './adminEvents';
import { toCsv, CsvColumn } from '../utils/csv';
import { logger } from '../utils/logger';
import prisma from '../lib/prisma';

const router = Router();

// ─── Schemas ────────────────────────────────────────────────────────────

const OrderStatusEnum = z.enum(['pending', 'paid', 'shipped', 'completed', 'cancelled']);
const RoleEnum = z.enum(['customer', 'distributor', 'cashier', 'admin', 'dealer']);

const BulkOrderStatusSchema = z.object({
  orderIds: z.array(z.string().min(8)).min(1).max(500),
  status: OrderStatusEnum,
  note: z.string().max(500).optional()
});

const BulkUserRoleSchema = z.object({
  userIds: z.array(z.string().min(8)).min(1).max(500),
  role: RoleEnum
});

const BulkProductCategorySchema = z.object({
  productIds: z.array(z.string().min(8)).min(1).max(500),
  categoryId: z.string().min(8).nullable()
});

const IdArraySchema = z.object({
  ids: z.array(z.string().min(8)).min(1).max(500)
});

// ─── Helpers ────────────────────────────────────────────────────────────

const sendCsv = (res: Response, filename: string, csv: string) => {
  // Force browsers to download instead of opening inline.
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.send(csv);
};

const safeDate = (d: Date | string | null | undefined): string => {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return isNaN(dt.getTime()) ? '' : dt.toISOString();
};

const dateRangeWhere = (req: Request) => {
  const sinceStr = String(req.query.since || '');
  const untilStr = String(req.query.until || '');
  const since = sinceStr ? new Date(sinceStr) : null;
  const until = untilStr ? new Date(untilStr) : null;
  const out: { createdAt?: { gte?: Date; lt?: Date } } = {};
  if (since && !isNaN(since.getTime())) out.createdAt = { ...out.createdAt, gte: since };
  if (until && !isNaN(until.getTime())) out.createdAt = { ...out.createdAt, lt: until };
  return out;
};

// ════════ CSV EXPORTS ════════

// GET /admin/bulk/orders.csv?since=&until=
router.get('/orders.csv', authenticateJWT, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: dateRangeWhere(req),
      include: {
        user: { select: { name: true, email: true, role: true } },
        items: { include: { product: { select: { name: true, barcode: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10_000 // safety cap
    });
    const cols: CsvColumn<any>[] = [
      { header: 'order_id',     value: (o) => o.id },
      { header: 'created_at',   value: (o) => safeDate(o.createdAt) },
      { header: 'status',       value: (o) => o.status },
      { header: 'customer',     value: (o) => o.user?.name || '' },
      { header: 'email',        value: (o) => o.user?.email || o.customerEmail || '' },
      { header: 'phone',        value: (o) => o.customerPhone || '' },
      { header: 'total_kgs',    value: (o) => Number(o.totalKgs).toFixed(2) },
      { header: 'currency',     value: (o) => o.currency },
      { header: 'item_count',   value: (o) => o.items.length },
      { header: 'items',        value: (o) => o.items.map((it: any) =>
        `${it.quantity}× ${it.product?.name || it.productId}`).join(' | ') },
      { header: 'address',      value: (o) => o.address || '' },
      { header: 'note',         value: (o) => o.note || '' }
    ];
    sendCsv(res, `orders-${Date.now()}.csv`, toCsv(orders, cols));
  } catch (e: any) {
    logger.error({ err: e }, 'export orders CSV error');
    res.status(500).json({ error: 'Failed to export orders' });
  }
});

// GET /admin/bulk/users.csv?role=
router.get('/users.csv', authenticateJWT, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const role = String(req.query.role || '').trim();
    const where: any = {};
    if (['customer', 'distributor', 'cashier', 'admin', 'dealer'].includes(role)) {
      where.role = role;
    }
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true,
        walletBalanceKgs: true, walletBalanceUsd: true,
        cumulativeSpendKgs: true, loyaltyLevel: true,
        isMonthlyActive: true, createdAt: true,
        sponsor: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10_000
    });
    const cols: CsvColumn<any>[] = [
      { header: 'user_id',          value: (u) => u.id },
      { header: 'name',             value: (u) => u.name },
      { header: 'email',            value: (u) => u.email },
      { header: 'role',             value: (u) => u.role },
      { header: 'wallet_kgs',       value: (u) => Number(u.walletBalanceKgs || 0).toFixed(2) },
      { header: 'wallet_usd',       value: (u) => Number(u.walletBalanceUsd || 0).toFixed(2) },
      { header: 'cumulative_kgs',   value: (u) => Number(u.cumulativeSpendKgs || 0).toFixed(2) },
      { header: 'loyalty_level',    value: (u) => u.loyaltyLevel ?? 0 },
      { header: 'monthly_active',   value: (u) => u.isMonthlyActive ? 'yes' : 'no' },
      { header: 'sponsor',          value: (u) => u.sponsor?.name || '' },
      { header: 'created_at',       value: (u) => safeDate(u.createdAt) }
    ];
    sendCsv(res, `users-${Date.now()}.csv`, toCsv(users, cols));
  } catch (e: any) {
    logger.error({ err: e }, 'export users CSV error');
    res.status(500).json({ error: 'Failed to export users' });
  }
});

// GET /admin/bulk/products.csv?categoryId=&lowStock=
router.get('/products.csv', authenticateJWT, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const categoryId = String(req.query.categoryId || '').trim();
    const lowStock = req.query.lowStock === '1';
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true, name: true, barcode: true,
        basePriceKgs: true,
        stockQuantity: true, minStockAlert: true,
        category: { select: { name: true } },
        createdAt: true, updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10_000
    });
    const filtered = lowStock
      ? products.filter((p) => p.stockQuantity <= (p.minStockAlert ?? 5))
      : products;
    const cols: CsvColumn<any>[] = [
      { header: 'product_id',  value: (p) => p.id },
      { header: 'barcode',     value: (p) => p.barcode || '' },
      { header: 'name',        value: (p) => p.name },
      { header: 'category',    value: (p) => p.category?.name || '' },
      { header: 'price_kgs',   value: (p) => Number(p.basePriceKgs).toFixed(2) },
      { header: 'stock',       value: (p) => p.stockQuantity },
      { header: 'low_stock',   value: (p) => p.stockQuantity <= (p.minStockAlert ?? 10) ? 'yes' : 'no' },
      { header: 'created_at',  value: (p) => safeDate(p.createdAt) },
      { header: 'updated_at',  value: (p) => safeDate(p.updatedAt) }
    ];
    sendCsv(res, `products-${Date.now()}.csv`, toCsv(filtered, cols));
  } catch (e: any) {
    logger.error({ err: e }, 'export products CSV error');
    res.status(500).json({ error: 'Failed to export products' });
  }
});

// GET /admin/bulk/withdrawals.csv
router.get('/withdrawals.csv', authenticateJWT, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const reqs = await prisma.withdrawalRequest.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10_000
    });
    const cols: CsvColumn<any>[] = [
      { header: 'request_id',    value: (w) => w.id },
      { header: 'created_at',    value: (w) => safeDate(w.createdAt) },
      { header: 'user',          value: (w) => w.user?.name || '' },
      { header: 'email',         value: (w) => w.user?.email || '' },
      { header: 'amount',        value: (w) => Number(w.amount).toFixed(2) },
      { header: 'currency',      value: (w) => w.currency },
      { header: 'status',        value: (w) => w.status },
      { header: 'processed_at',  value: (w) => safeDate(w.processedAt) },
      { header: 'note',          value: (w) => w.adminNote || '' }
    ];
    sendCsv(res, `withdrawals-${Date.now()}.csv`, toCsv(reqs, cols));
  } catch (e: any) {
    logger.error({ err: e }, 'export withdrawals CSV error');
    res.status(500).json({ error: 'Failed to export withdrawals' });
  }
});

// ════════ BULK OPERATIONS ════════

// POST /admin/bulk/orders/status
router.post('/orders/status',
  authenticateJWT, requireRole('admin'),
  validate({ body: BulkOrderStatusSchema }),
  async (req: Request, res: Response) => {
    try {
      const { orderIds, status, note } = req.body as z.infer<typeof BulkOrderStatusSchema>;
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.order.updateMany({
          where: { id: { in: orderIds } },
          data: { status }
        });
        // Optional audit trail via transaction notes.
        if (note) {
          await tx.transaction.create({
            data: {
              userId: (req as any).user.userId,
              type: 'admin_bulk_note',
              amount: 0,
              currency: 'KGS',
              description: `Bulk status → ${status} for ${orderIds.length} orders. Note: ${note}`
            }
          });
        }
        return updated;
      });
      adminEvents.publish({
        type: 'admin_bulk_action',
        data: { kind: 'orders_status', status, count: result.count, actorId: (req as any).user.userId }
      });
      res.json({ ok: true, updated: result.count, requested: orderIds.length });
    } catch (e: any) {
      logger.error({ err: e }, 'bulk orders status error');
      res.status(500).json({ error: 'Bulk update failed' });
    }
  }
);

// POST /admin/bulk/users/role
router.post('/users/role',
  authenticateJWT, requireRole('admin'),
  validate({ body: BulkUserRoleSchema }),
  async (req: Request, res: Response) => {
    try {
      const { userIds, role } = req.body as z.infer<typeof BulkUserRoleSchema>;
      const updated = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { role }
      });
      adminEvents.publish({
        type: 'admin_bulk_action',
        data: { kind: 'users_role', role, count: updated.count, actorId: (req as any).user.userId }
      });
      res.json({ ok: true, updated: updated.count, requested: userIds.length });
    } catch (e: any) {
      logger.error({ err: e }, 'bulk users role error');
      res.status(500).json({ error: 'Bulk role update failed' });
    }
  }
);

// POST /admin/bulk/products/category
router.post('/products/category',
  authenticateJWT, requireRole('admin'),
  validate({ body: BulkProductCategorySchema }),
  async (req: Request, res: Response) => {
    try {
      const { productIds, categoryId } = req.body as z.infer<typeof BulkProductCategorySchema>;
      const updated = await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { categoryId }
      });
      adminEvents.publish({
        type: 'admin_bulk_action',
        data: {
          kind: 'products_category',
          categoryId,
          count: updated.count,
          actorId: (req as any).user.userId
        }
      });
      res.json({ ok: true, updated: updated.count, requested: productIds.length });
    } catch (e: any) {
      logger.error({ err: e }, 'bulk products category error');
      res.status(500).json({ error: 'Bulk category move failed' });
    }
  }
);

// POST /admin/bulk/delete — generic hard delete for any model. Useful
// for cleaning up test data, but requires an explicit `kind` so the
// admin can't accidentally hit it.
router.post('/delete',
  authenticateJWT, requireRole('admin'),
  validate({ body: IdArraySchema.extend({ kind: z.enum(['orders', 'users', 'products']) }) }),
  async (req: Request, res: Response) => {
    try {
      const { ids, kind } = req.body as { ids: string[]; kind: 'orders' | 'users' | 'products' };
      let deleted = 0;
      if (kind === 'orders') {
        const r = await prisma.order.deleteMany({ where: { id: { in: ids } } });
        deleted = r.count;
      } else if (kind === 'products') {
        const r = await prisma.product.deleteMany({ where: { id: { in: ids } } });
        deleted = r.count;
      } else {
        // Users: only soft-mark inactive (never hard-delete a user).
        const r = await prisma.user.updateMany({
          where: { id: { in: ids } },
          data: { deletedAt: new Date() }
        });
        deleted = r.count;
      }
      adminEvents.publish({
        type: 'admin_bulk_action',
        data: { kind: `delete_${kind}`, count: deleted, actorId: (req as any).user.userId }
      });
      res.json({ ok: true, deleted, requested: ids.length });
    } catch (e: any) {
      logger.error({ err: e }, 'bulk delete error');
      res.status(500).json({ error: 'Bulk delete failed' });
    }
  }
);

export default router;
