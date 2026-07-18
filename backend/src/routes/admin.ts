import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { validate, AdminUserUpdateSchema, WithdrawalUpdateSchema, IdParamSchema, ContactMessageListQuerySchema, AdminContactMessageUpdateSchema } from '../validators';
import { notifyWithdrawalApproved, notifyWithdrawalRejected } from '../services/notificationService';
import { sendToUser } from '../services/pushService';
import { adminEvents } from './adminEvents';
import { logger } from '../utils/logger';
import { envelope, parsePagination } from '../utils/paginate';

const router = Router();

// GET /api/v1/admin/dashboard — Full dashboard stats (single API call)
router.get('/dashboard', authenticateJWT, async (req: any, res: Response) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Run all queries in parallel for speed (Antigravity)
    const [
      orders,
      products,
      users,
      recentOrders,
      todayOrders,
      lowStockProducts
    ] = await Promise.all([
      // All orders for stats
      prisma.order.findMany({ select: { totalKgs: true, status: true, createdAt: true } }),
      // Product count
      prisma.product.findMany({ select: { id: true, name: true, stockQuantity: true, minStockAlert: true } }),
      // User stats
      prisma.user.findMany({ select: { id: true, role: true, createdAt: true } }),
      // Recent 10 orders with details
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          items: { include: { product: { select: { name: true } } } },
          user: { select: { name: true, email: true } }
        }
      }),
      // Today's orders (excluding cancelled)
      prisma.order.findMany({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          status: { not: 'cancelled' }
        },
        select: { totalKgs: true, status: true }
      }),
      // Low stock products
      prisma.product.findMany({
        where: { stockQuantity: { lte: prisma.product.fields?.minStockAlert || 10 } }
      }).catch(() => [])
    ]);

    // 🛡️ CANCELLED-EXCLUSION: Cancelled orders must NOT inflate revenue
    // (matches: completed / paid / shipped / processing are "real" revenue;
    //  pending is reserved separately; cancelled is excluded everywhere).
    const REVENUE_STATUSES = ['completed', 'paid', 'shipped', 'processing'];
    const revenueOrders = orders.filter(o => REVENUE_STATUSES.includes(o.status));

    const totalRevenue = revenueOrders.reduce((sum, o) => sum + Number(o.totalKgs || 0), 0);
    const completedRevenue = orders
      .filter(o => REVENUE_STATUSES.includes(o.status))
      .reduce((sum, o) => sum + Number(o.totalKgs || 0), 0);

    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const paidOrders = orders.filter(o => o.status === 'paid').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

    const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.totalKgs || 0), 0);

    const totalUsers = users.length;
    const distributors = users.filter(u => u.role === 'distributor').length;
    const customers = users.filter(u => u.role === 'customer').length;

    // New users this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newUsersThisWeek = users.filter(u => new Date(u.createdAt) >= weekAgo).length;

    // Low stock products (quantity <= minStockAlert)
    const lowStock = products.filter(p => p.stockQuantity <= (p.minStockAlert || 10));

    res.json({
      stats: {
        totalRevenue: Math.round(totalRevenue),
        completedRevenue: Math.round(completedRevenue),
        todayRevenue: Math.round(todayRevenue),
        totalOrders: orders.length,
        pendingOrders,
        completedOrders,
        paidOrders,
        cancelledOrders,
        todayOrderCount: todayOrders.length,
        totalProducts: products.length,
        totalUsers,
        distributors,
        customers,
        newUsersThisWeek,
        lowStockCount: lowStock.length,
      },
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        customerName: o.customerName || o.user?.name || '—',
        customerEmail: o.user?.email || '',
        totalKgs: Number(o.totalKgs),
        status: o.status,
        orderType: o.orderType,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt,
        itemCount: o.items?.length || 0,
        items: o.items?.map(i => ({
          productName: i.product?.name || 'Ürün',
          quantity: i.quantity,
          totalPrice: Number(i.totalPriceKgs)
        }))
      })),
      lowStockAlerts: lowStock.map(p => ({
        id: p.id,
        name: p.name,
        stock: p.stockQuantity,
        minAlert: p.minStockAlert
      }))
    });
  } catch (error) {
    logger.error({ err: error }, 'Dashboard Error:');
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// ════════ USER MANAGEMENT ════════
router.get('/users', authenticateJWT, async (req: any, res: Response) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  try {
    const search = String(req.query.search || '').trim();
    const { page, limit, skip, take } = parsePagination(req.query as any, { limit: 50 });

    // Optional search by name/email (LIKE — fast on indexed columns for our scale)
    // MySQL collation is utf8mb4_unicode_ci which is case-insensitive by default.
    const where = search.length >= 2
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } }
          ]
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          walletBalanceKgs: true,
          walletBalanceUsd: true,
          isMonthlyActive: true,
          createdAt: true,
          sponsor: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip, take
      }),
      prisma.user.count({ where })
    ]);
    res.json(envelope(users, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load users' });
  }
});

router.put('/users/:id', authenticateJWT, requireRole('admin'), validate({ body: AdminUserUpdateSchema, params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { role, isMonthlyActive, walletBalanceKgs, walletBalanceUsd } = req.body as { role?: string; isMonthlyActive?: boolean; walletBalanceKgs?: number; walletBalanceUsd?: number };
    const user = await prisma.user.update({
      where: { id },
      data: {
        role,
        isMonthlyActive,
        walletBalanceKgs: walletBalanceKgs !== undefined ? Number(walletBalanceKgs) : undefined,
        walletBalanceUsd: walletBalanceUsd !== undefined ? Number(walletBalanceUsd) : undefined
      }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ════════ FINANCE / WITHDRAWALS ════════
router.get('/withdrawals', authenticateJWT, async (req: any, res: Response) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  try {
    const { page, limit, skip, take } = parsePagination(req.query as any, { limit: 50 });
    const [requests, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip, take
      }),
      prisma.withdrawalRequest.count()
    ]);
    res.json(envelope(requests, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load withdrawals' });
  }
});

router.put('/withdrawals/:id', authenticateJWT, requireRole('admin'), validate({ body: WithdrawalUpdateSchema, params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: 'approved' | 'rejected' };
    const request = await prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ error: 'Not found' });

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot change status' });
    }

    // The wallet was ALREADY debited at creation time (finance.ts), with a
    // matching `type: 'withdrawal'` Transaction. We must keep the ledger
    // reconciled with the wallet on both outcomes — and do it atomically.
    const balanceField = request.currency === 'USD' ? 'walletBalanceUsd' : 'walletBalanceKgs';

    const updated = await prisma.$transaction(async (tx) => {
      const w = await tx.withdrawalRequest.update({
        where: { id },
        data: { status }
      });

      if (status === 'rejected') {
        // Refund the wallet AND write a reversing ledger entry so the
        // transaction history reconciles with the wallet balance.
        await tx.user.update({
          where: { id: request.userId },
          data: { [balanceField]: { increment: request.amount } }
        });
        await tx.transaction.create({
          data: {
            userId: request.userId,
            type: 'withdrawal_refund',
            amount: request.amount,
            currency: request.currency,
            description: `Withdrawal request ${request.id.slice(0, 8)} rejected — funds refunded`
          }
        });
      } else if (status === 'approved') {
        // Funds already debited at creation; record the confirmation so the
        // ledger clearly shows the payout was completed.
        await tx.transaction.create({
          data: {
            userId: request.userId,
            type: 'withdrawal_paid',
            amount: 0,
            currency: request.currency,
            description: `Withdrawal request ${request.id.slice(0, 8)} approved & paid out`
          }
        });
      }

      return w;
    });

    res.json(updated);

    // Fire-and-forget admin confirmation + customer push notification
    if (status === 'approved') {
      notifyWithdrawalApproved().catch(() => {});
      adminEvents.publish({
        type: 'withdrawal_approved',
        data: { withdrawalId: request.id, userId: request.userId, amount: Number(request.amount), currency: request.currency }
      });
      // Push to the customer who requested the withdrawal
      sendToUser(request.userId, {
        title: '✅ Çekim talebiniz onaylandı',
        body: `${Number(request.amount).toFixed(2)} ${request.currency} tutarındaki çekim talebiniz onaylandı.`,
        url: '/account/wallet',
        tag: 'withdrawal',
        eventKey: 'withdrawal_approved'
      }).catch(() => {});
    }
    if (status === 'rejected') {
      notifyWithdrawalRejected().catch(() => {});
      adminEvents.publish({
        type: 'withdrawal_rejected',
        data: { withdrawalId: request.id, userId: request.userId, amount: Number(request.amount), currency: request.currency }
      });
      sendToUser(request.userId, {
        title: '⚠️ Çekim talebiniz reddedildi',
        body: 'Çekim talebiniz reddedildi. Detaylar için cüzdanınızı kontrol edin.',
        url: '/account/wallet',
        tag: 'withdrawal',
        eventKey: 'withdrawal_rejected'
      }).catch(() => {});
    }
  } catch (error) {
    logger.error({ err: error }, 'Update withdrawal error:');
    res.status(500).json({ error: 'Failed to update withdrawal' });
  }
});

// GET /api/v1/admin/contact-messages — support inbox (paginated, ?status= filter)
router.get('/contact-messages', authenticateJWT, requireRole('admin'), validate({ query: ContactMessageListQuerySchema }), async (req: Request, res: Response) => {
  try {
    const { status } = req.query as { status?: 'new' | 'read' | 'resolved' };
    const { page, limit, skip, take } = parsePagination(req.query as any, { limit: 50 });

    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip, take
      }),
      prisma.contactMessage.count({ where })
    ]);

    res.json(envelope(items, total, page, limit));
  } catch (error) {
    logger.error({ err: error }, 'Contact messages list error:');
    res.status(500).json({ error: 'Failed to load contact messages' });
  }
});

// PUT /api/v1/admin/contact-messages/:id — status transitions (new/read/resolved) + admin note
router.put('/contact-messages/:id', authenticateJWT, requireRole('admin'), validate({ body: AdminContactMessageUpdateSchema, params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { status, adminNote } = req.body as { status?: 'new' | 'read' | 'resolved'; adminNote?: string | null };

    const existing = await prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        // adminNote: undefined alan dokunulmaz; null → notu temizler
        ...(adminNote !== undefined ? { adminNote } : {})
      },
      include: { user: { select: { name: true, email: true } } }
    });

    res.json(updated);
  } catch (error) {
    logger.error({ err: error }, 'Contact message update error:');
    res.status(500).json({ error: 'Failed to update contact message' });
  }
});

export default router;
