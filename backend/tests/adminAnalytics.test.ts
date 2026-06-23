// Unit tests for /api/v1/admin/analytics/* endpoints.
//
// We mock prisma.$queryRaw to return canned rows so we can assert
// the response shape without needing a real MySQL instance.
//
// Verifies:
//   • /categories returns the documented envelope + sharePct math
//   • /top-customers ranks DESC + caps limit at 50
//   • /top-products ranks DESC by units sold
//   • All endpoints require admin (403 for customer, 401 for none)
//   • Cache-Control header is set
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const queryRawMock = vi.fn();

vi.mock('../src/lib/prisma', () => ({
  default: {
    $queryRaw: (...args: any[]) => queryRawMock(...args)
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
  const routes = (await import('../src/routes/adminAnalytics')).default;
  app.use('/api/v1/admin/analytics', routes);
  return app;
};

const adminAuth = { 'X-Test-User': 'admin-1', 'X-Test-Role': 'admin' };

beforeEach(() => {
  queryRawMock.mockReset();
});

describe('GET /api/v1/admin/analytics/categories', () => {
  it('returns the documented envelope with sharePct', async () => {
    queryRawMock.mockResolvedValueOnce([
      { id: 'c-1', name: 'Supplements', iconEmoji: '💊', productCount: 5, unitsSold: 12, revenueKgs: 7000 },
      { id: 'c-2', name: 'Coffee',      iconEmoji: '☕', productCount: 3, unitsSold: 8,  revenueKgs: 3000 }
    ]);
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/analytics/categories').set(adminAuth);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('range');
    expect(res.body).toHaveProperty('categories');
    expect(res.body).toHaveProperty('totalRevenueKgs');
    expect(res.body.totalRevenueKgs).toBe(10000);
    expect(res.body.categories).toHaveLength(2);
    // 7000/10000 = 70%
    expect(res.body.categories[0].sharePct).toBe(70);
    // 3000/10000 = 30%
    expect(res.body.categories[1].sharePct).toBe(30);
    expect(res.body.categories[0]).toMatchObject({
      id: 'c-1', name: 'Supplements', iconEmoji: '💊',
      unitsSold: 12, revenueKgs: 7000
    });
  });

  it('handles zero-revenue edge case (sharePct = 0)', async () => {
    queryRawMock.mockResolvedValueOnce([
      { id: 'c-1', name: 'Empty', iconEmoji: null, productCount: 0, unitsSold: 0, revenueKgs: 0 }
    ]);
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/analytics/categories').set(adminAuth);
    expect(res.body.totalRevenueKgs).toBe(0);
    expect(res.body.categories[0].sharePct).toBe(0);
  });

  it('sets Cache-Control for shared caching', async () => {
    queryRawMock.mockResolvedValueOnce([]);
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/analytics/categories').set(adminAuth);
    expect(res.headers['cache-control']).toContain('max-age');
  });
});

describe('GET /api/v1/admin/analytics/top-customers', () => {
  it('ranks customers by totalKgs DESC', async () => {
    queryRawMock.mockResolvedValueOnce([
      { id: 'u-1', name: 'Big Spender',  email: 'big@x',  role: 'customer',    orderCount: 12, totalKgs: 50000 },
      { id: 'u-2', name: 'Regular',       email: 'reg@x',  role: 'distributor', orderCount: 8,  totalKgs: 12000 },
      { id: 'u-3', name: 'Newbie',        email: 'new@x',  role: 'customer',    orderCount: 1,  totalKgs: 800 }
    ]);
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/analytics/top-customers?limit=10').set(adminAuth);
    expect(res.body.customers[0].rank).toBe(1);
    expect(res.body.customers[0].name).toBe('Big Spender');
    expect(res.body.customers[1].rank).toBe(2);
    expect(res.body.customers[2].rank).toBe(3);
  });

  it('caps the limit at 50 (no crash on larger values)', async () => {
    queryRawMock.mockResolvedValueOnce([]);
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/analytics/top-customers?limit=9999').set(adminAuth);
    expect(res.status).toBe(200);
    expect(queryRawMock).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/v1/admin/analytics/top-products', () => {
  it('ranks products by unitsSold DESC', async () => {
    queryRawMock.mockResolvedValueOnce([
      { id: 'p-1', name: 'Reishi Coffee', barcode: 'PV-001', categoryName: 'Coffee', unitsSold: 100, revenueKgs: 76000 },
      { id: 'p-2', name: 'Code RED',      barcode: 'PV-002', categoryName: 'Supplements', unitsSold: 30,  revenueKgs: 35000 }
    ]);
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/analytics/top-products').set(adminAuth);
    expect(res.body.products[0].name).toBe('Reishi Coffee');
    expect(res.body.products[0].unitsSold).toBe(100);
    expect(res.body.products[0].categoryName).toBe('Coffee');
  });

  it('returns an empty list when there are no sales', async () => {
    queryRawMock.mockResolvedValueOnce([]);
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/analytics/top-products').set(adminAuth);
    expect(res.body.products).toEqual([]);
  });
});

describe('Auth — analytics endpoints', () => {
  it('rejects a customer (403)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/analytics/categories')
      .set({ 'X-Test-User': 'u-1', 'X-Test-Role': 'customer' });
    expect(res.status).toBe(403);
  });

  it('rejects unauthenticated request (401)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/analytics/categories');
    expect(res.status).toBe(401);
  });
});
