// Unit tests for /api/v1/admin/trends — daily-bucketed aggregates.
//
// Verifies:
//   • Default window is 30 days when ?days= is missing
//   • The number of daily buckets equals ?days (no gaps, no extras)
//   • Totals match the sum of the daily buckets
//   • Cancelled orders do NOT contribute to revenue
//   • Cancelled orders DO count in the orders column (we want to see them)
//   • Completed orders increment the completedOrders counter
//   • Max ?days= is capped (requesting 1000 returns 365)
//   • Non-admin → 403
//   • Empty DB → empty daily array + zero totals (no crash)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

interface FakeOrder {
  totalKgs: any;
  status: string;
  createdAt: Date;
}
interface FakeUser { createdAt: Date }

let orders: FakeOrder[] = [];
let users: FakeUser[] = [];

vi.mock('../src/lib/prisma', () => ({
  default: {
    order: {
      findMany: vi.fn(async ({ where }) => {
        return orders.filter(o => o.createdAt >= where.createdAt.gte && o.createdAt <= where.createdAt.lte);
      })
    },
    user: {
      findMany: vi.fn(async ({ where }) => {
        return users.filter(u => u.createdAt >= where.createdAt.gte && u.createdAt <= where.createdAt.lte);
      })
    }
  }
}));

vi.mock('../src/middleware/auth', () => ({
  authenticateJWT: (req: any, _res: any, next: any) => {
    const id = req.header('X-Test-User');
    req.user = id ? { id, userId: id, role: req.header('X-Test-Role') } : null;
    next();
  },
  requireRole: (...roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json({ error: 'auth required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
    next();
  }
}));

const buildApp = async () => {
  const app = express();
  app.use(express.json());
  const routes = (await import('../src/routes/adminTrends')).default;
  app.use('/api/v1/admin/trends', routes);
  return app;
};

const adminAuth = { 'X-Test-User': 'admin-1', 'X-Test-Role': 'admin' };

// Seed N days of orders/users ending today, with a predictable pattern.
const seedRecent = (days: number) => {
  orders = []; users = [];
  const now = new Date();
  for (let d = 0; d < days; d++) {
    const ts = new Date(now);
    ts.setUTCDate(now.getUTCDate() - d);
    ts.setUTCHours(12, 0, 0, 0);
    // 1 paid order per day, value = 1000 + d
    orders.push({
      totalKgs: (1000 + d).toString(),
      status: d % 7 === 0 ? 'cancelled' : (d % 5 === 0 ? 'completed' : 'paid'),
      createdAt: ts
    });
    // 1 user signup every 3 days
    if (d % 3 === 0) {
      users.push({ createdAt: ts });
    }
  }
};

beforeEach(() => {
  orders = [];
  users = [];
});

describe('GET /api/v1/admin/trends — envelope shape', () => {
  it('returns range + daily + totals', async () => {
    seedRecent(7);
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/trends?days=7').set(adminAuth);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('range');
    expect(res.body).toHaveProperty('daily');
    expect(res.body).toHaveProperty('totals');
    expect(res.body.range.days).toBe(7);
    expect(Array.isArray(res.body.daily)).toBe(true);
  });

  it('emits exactly N daily buckets (no gaps)', async () => {
    seedRecent(30);
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/trends?days=30').set(adminAuth);
    expect(res.body.daily.length).toBe(30);
  });

  it('defaults to 30 days when ?days= is missing', async () => {
    seedRecent(60);
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/trends').set(adminAuth);
    expect(res.body.range.days).toBe(30);
    expect(res.body.daily.length).toBe(30);
  });

  it('caps ?days at 365', async () => {
    seedRecent(400);
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/trends?days=1000').set(adminAuth);
    expect(res.body.range.days).toBe(365);
  });
});

describe('GET /api/v1/admin/trends — aggregation', () => {
  it('cancelled orders do NOT contribute to revenue', async () => {
    // One order every day, all cancelled.
    orders = [];
    const now = new Date();
    for (let d = 0; d < 5; d++) {
      const ts = new Date(now); ts.setUTCDate(now.getUTCDate() - d);
      orders.push({ totalKgs: '5000', status: 'cancelled', createdAt: ts });
    }
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/trends?days=5').set(adminAuth);
    expect(res.body.totals.revenue).toBe(0);
    // They DO count in the orders column
    expect(res.body.totals.orders).toBe(5);
  });

  it('completed orders increment the completedOrders counter', async () => {
    seedRecent(10); // every 5th day is 'completed'
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/trends?days=10').set(adminAuth);
    // d % 7 === 0 → cancelled (d=0, 7)
    // d % 5 === 0 → completed (d=5) — that's the only one (d=0 is taken by cancelled)
    // → 1 completed
    expect(res.body.totals.completedOrders).toBe(1);
  });

  it('totals match the sum of the daily buckets', async () => {
    seedRecent(7);
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/trends?days=7').set(adminAuth);
    const sumOrders = res.body.daily.reduce((s: number, d: any) => s + d.orders, 0);
    const sumRevenue = res.body.daily.reduce((s: number, d: any) => s + d.revenue, 0);
    expect(res.body.totals.orders).toBe(sumOrders);
    expect(Math.round(res.body.totals.revenue * 100) / 100).toBe(Math.round(sumRevenue * 100) / 100);
  });
});

describe('GET /api/v1/admin/trends — auth + empty', () => {
  it('rejects a customer (403)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/trends?days=7')
      .set({ 'X-Test-User': 'u-cust', 'X-Test-Role': 'customer' });
    expect(res.status).toBe(403);
  });

  it('returns empty daily array + zero totals when there is no data', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/trends?days=7').set(adminAuth);
    expect(res.status).toBe(200);
    expect(res.body.daily).toHaveLength(7);
    expect(res.body.totals).toEqual({ revenue: 0, orders: 0, newUsers: 0, completedOrders: 0 });
  });
});
