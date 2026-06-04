import { Router, Request, Response } from 'express';
import { PrismaClient } from '../../prisma/generated/client';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient({});

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
      // Today's orders
      prisma.order.findMany({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        select: { totalKgs: true, status: true }
      }),
      // Low stock products
      prisma.product.findMany({
        where: { stockQuantity: { lte: prisma.product.fields?.minStockAlert || 10 } }
      }).catch(() => [])
    ]);

    // Calculate stats
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalKgs || 0), 0);
    const completedRevenue = orders
      .filter(o => ['completed', 'paid', 'shipped'].includes(o.status))
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
    console.error('Dashboard Error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

export default router;
