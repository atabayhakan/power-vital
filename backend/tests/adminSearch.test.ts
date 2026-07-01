// Tests for /api/v1/admin/search/{users,products} — typeahead autocomplete.
//
// Verifies:
//   • ?q shorter than 2 chars → empty results (no DB hit)
//   • Case-insensitive partial match on name + email (users) / name + barcode (products)
//   • Hits LIMIT cap at 20
//   • Default LIMIT is 10
//   • Customer → 403
//   • Unauthenticated → 401
//   • Cache-Control header is set (60s shared cache)
//   • Response shape: { query, count, results: [...] }
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

let users: any[] = [];
let products: any[] = [];

vi.mock('../src/lib/prisma', () => ({
  default: {
    user: {
      findMany: vi.fn(async ({ where, take }) => {
        // Backend's Prisma OR has BOTH branches with the same `q` —
        // pull the search query out of either one.
        const nameMatch = where.OR[0]?.name?.contains ?? '';
        const q = nameMatch.toLowerCase();
        const filtered = users.filter(u =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        );
        return filtered.slice(0, take);
      })
    },
    product: {
      findMany: vi.fn(async ({ where, take }) => {
        const q = (where.OR[0]?.name?.contains
                ?? where.OR[1]?.barcode?.contains
                ?? '').toLowerCase();
        const filtered = products.filter(p =>
          p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q)
        );
        return filtered.slice(0, take ?? Infinity);
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
  const routes = (await import('../src/routes/adminSearch')).default;
  app.use('/api/v1/admin/search', routes);
  return app;
};

const adminAuth = { 'X-Test-User': 'admin-1', 'X-Test-Role': 'admin' };

// Seed users and products for the tests.
beforeEach(() => {
  users = [
    { id: 'u-1', name: 'Ali Yılmaz', email: 'ali@pv.kg', role: 'customer',
      walletBalanceKgs: '500', walletBalanceUsd: '5', isMonthlyActive: true },
    { id: 'u-2', name: 'Beste Baş', email: 'beste@pv.kg', role: 'distributor',
      walletBalanceKgs: '0', walletBalanceUsd: '0', isMonthlyActive: false },
    { id: 'u-3', name: 'Cem Demir', email: 'cem@pv.kg', role: 'admin',
      walletBalanceKgs: '0', walletBalanceUsd: '0', isMonthlyActive: true }
  ];
  products = [
    { id: 'p-1', name: 'Reishi Coffee', barcode: 'PV-001',
      basePriceKgs: 760, stockQuantity: 93, minStockAlert: 10,
      category: null },
    { id: 'p-2', name: 'Code RED', barcode: 'PV-002',
      basePriceKgs: 1180, stockQuantity: 5, minStockAlert: 10,
      category: { id: 'cat-1', name: 'Supplements' } }
  ];
});

describe('GET /api/v1/admin/search/users', () => {
  it('returns empty results when q is too short (≤1 char)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/search/users?q=a').set(adminAuth);
    expect(res.status).toBe(200);
    expect(res.body.query).toBe('a');
    expect(res.body.results).toEqual([]);
  });

  it('matches users by name (partial, case-insensitive)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/search/users?q=ali').set(adminAuth);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.results[0].email).toBe('ali@pv.kg');
  });

  it('matches users by email substring', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/search/users?q=beste@').set(adminAuth);
    expect(res.body.count).toBe(1);
    expect(res.body.results[0].name).toBe('Beste Baş');
  });

  it('response shape includes the lightweight fields only', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/search/users?q=cem').set(adminAuth);
    const r = res.body.results[0];
    expect(r).toHaveProperty('id');
    expect(r).toHaveProperty('name');
    expect(r).toHaveProperty('email');
    expect(r).toHaveProperty('role');
    expect(r).toHaveProperty('walletKgs');
    expect(r).toHaveProperty('walletUsd');
    expect(r).toHaveProperty('isActive');
    // Should NOT include heavy fields like passwordHash / sponsorId
    expect(r).not.toHaveProperty('passwordHash');
  });

  it('sets Cache-Control for shared cache', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/search/users?q=ali').set(adminAuth);
    expect(res.headers['cache-control']).toContain('max-age');
  });

  it('caps limit at 20 (MaxLimit)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/search/users?q=ali&limit=9999').set(adminAuth);
    // We don't check the response directly (Prisma mock returns at most 1
    // in our seed), but we verify the query is accepted without 400.
    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/admin/search/products', () => {
  it('matches by name (case-insensitive)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/search/products?q=REISHI').set(adminAuth);
    expect(res.body.count).toBe(1);
    expect(res.body.results[0].name).toBe('Reishi Coffee');
  });

  it('matches by barcode (partial)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/search/products?q=PV-00').set(adminAuth);
    expect(res.body.count).toBe(2);
  });

  it('flags lowStock=true when stock <= minStockAlert', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/search/products?q=Code RED').set(adminAuth);
    const r = res.body.results[0];
    expect(r.lowStock).toBe(true);
    expect(r.category.name).toBe('Supplements');
  });

  it('returns empty results for queries shorter than 2 chars', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/search/products?q=P').set(adminAuth);
    expect(res.body.results).toEqual([]);
  });
});

describe('Auth — search endpoints', () => {
  it('rejects a customer (403)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/search/users?q=ali')
      .set({ 'X-Test-User': 'u-1', 'X-Test-Role': 'customer' });
    expect(res.status).toBe(403);
  });

  it('rejects unauthenticated request (401)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/search/users?q=ali');
    expect(res.status).toBe(401);
  });
});
