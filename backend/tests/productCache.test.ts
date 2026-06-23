// Tests for GET /api/v1/products caching + ETag.
//
// The cache only covers the "default list" call (no categoryId, page=1,
// limit=100, no search). Other variants pass through unchanged.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const cacheStore = new Map<string, { value: string; expiresAt: number | null }>();
vi.mock('../src/utils/redis', () => ({
  getCache: async (key: string) => {
    const entry = cacheStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      cacheStore.delete(key);
      return null;
    }
    try { return JSON.parse(entry.value); } catch { return null; }
  },
  setCache: async (key: string, value: any, ttlSeconds?: number) => {
    cacheStore.set(key, { value: JSON.stringify(value), expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
  },
  deleteCache: async (key: string) => { cacheStore.delete(key); }
}));

vi.mock('../src/i18n/TranslationCenter', () => ({ translateOnSave: () => {} }));

// Mock Prisma — track findMany calls and return a fixed product list.
const findManyMock = vi.fn();
const updateManyMock = vi.fn();
const deleteManyMock = vi.fn();
vi.mock('../src/lib/prisma', () => ({
  default: {
    product: {
      findMany: (...args: any[]) => findManyMock(...args),
      updateMany: (...args: any[]) => updateManyMock(...args),
      deleteMany: (...args: any[]) => deleteManyMock(...args)
    }
  }
}));

vi.mock('../src/middleware/auth', () => ({
  authenticateJWT: (req: any, _res: any, next: any) => { req.user = { id: 'admin', role: 'admin' }; next(); },
  requireRole: () => (_req: any, _res: any, next: any) => next()
}));

const sampleProducts = [
  { id: 'p1', name: 'Reishi Coffee', barcode: 'Pv-010', stockQuantity: 93, minStockAlert: 10,
    basePriceKgs: 760, basePriceUsd: 8.7, images: [], category: null, translations: null,
    categoryId: null, description: '', accordions: null, benefits: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p2', name: 'Code RED', barcode: 'PV-009', stockQuantity: 38, minStockAlert: 10,
    basePriceKgs: 1180, basePriceUsd: 13.5, images: [], category: null, translations: null,
    categoryId: 'cat-1', description: '', accordions: null, benefits: null, createdAt: new Date(), updatedAt: new Date() }
];

const buildApp = async () => {
  const app = express();
  app.use(express.json());
  const routes = (await import('../src/routes/product')).default;
  app.use('/api/v1/products', routes);
  return app;
};

beforeEach(() => {
  cacheStore.clear();
  findManyMock.mockReset();
  findManyMock.mockResolvedValue(sampleProducts);
  updateManyMock.mockReset().mockResolvedValue({ count: 0 });
  deleteManyMock.mockReset().mockResolvedValue({ count: 0 });
});

describe('GET /api/v1/products — default list cache', () => {
  it('caches the default-list payload + emits ETag', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.headers['etag']).toMatch(/^"[0-9a-f]{40}"$/);
    expect(res.headers['cache-control']).toContain('max-age');
    // DB was hit once
    expect(findManyMock).toHaveBeenCalledTimes(1);
  });

  it('returns 304 on conditional re-fetch (saves the DB read)', async () => {
    const app = await buildApp();
    const r1 = await request(app).get('/api/v1/products');
    const r2 = await request(app).get('/api/v1/products').set('If-None-Match', r1.headers['etag']);
    expect(r2.status).toBe(304);
    // Still only one DB hit total — the second call used the cache.
    expect(findManyMock).toHaveBeenCalledTimes(1);
  });

  it('does NOT cache paginated requests (page=2)', async () => {
    const app = await buildApp();
    await request(app).get('/api/v1/products?page=2');
    await request(app).get('/api/v1/products?page=2');
    expect(findManyMock).toHaveBeenCalledTimes(2);
  });

  it('does NOT cache category-filtered requests', async () => {
    const app = await buildApp();
    await request(app).get('/api/v1/products?categoryId=cat-1');
    await request(app).get('/api/v1/products?categoryId=cat-1');
    expect(findManyMock).toHaveBeenCalledTimes(2);
  });

  it('does NOT cache search results (delegate to search service)', async () => {
    const app = await buildApp();
    await request(app).get('/api/v1/products?search=reishi');
    await request(app).get('/api/v1/products?search=reishi');
    // Each search hit goes through searchProducts() — DB only called for the
    // default-list sub-calls (none here, so 0 calls).
    expect(findManyMock).toHaveBeenCalledTimes(0);
  });
});
