// Tests for GET /api/v1/categories caching + ETag.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const cacheStore = new Map<string, { value: string; expiresAt: number | null }>();
vi.mock('../src/utils/redis', () => ({
  getCache: async (key: string) => {
    const entry = cacheStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) { cacheStore.delete(key); return null; }
    try { return JSON.parse(entry.value); } catch { return null; }
  },
  setCache: async (key: string, value: any, ttlSeconds?: number) => {
    cacheStore.set(key, { value: JSON.stringify(value), expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
  },
  deleteCache: async (key: string) => { cacheStore.delete(key); }
}));

vi.mock('../src/i18n/TranslationCenter', () => ({ translateOnSave: () => {} }));

const findManyMock = vi.fn();
const createMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();
vi.mock('../src/lib/prisma', () => ({
  default: {
    category: {
      findMany: (...a: any[]) => findManyMock(...a),
      create: (...a: any[]) => createMock(...a),
      update: (...a: any[]) => updateMock(...a),
      delete: (...a: any[]) => deleteMock(...a)
    }
  }
}));

vi.mock('../src/middleware/auth', () => ({
  authenticateJWT: (req: any, _res: any, next: any) => { req.user = { id: 'a', role: 'admin' }; next(); },
  requireRole: () => (_req: any, _res: any, next: any) => next()
}));

const sampleCategories = [
  { id: 'cat-1', name: 'Supplements', slug: 'supplements', iconEmoji: '💊', imageUrl: '',
    sortOrder: 0, isActive: true, translations: null, _count: { products: 12 } },
  { id: 'cat-2', name: 'Coffee',      slug: 'coffee',      iconEmoji: '☕', imageUrl: '',
    sortOrder: 1, isActive: true, translations: null, _count: { products: 4 } }
];

const buildApp = async () => {
  const app = express();
  app.use(express.json());
  const routes = (await import('../src/routes/category')).default;
  app.use('/api/v1/categories', routes);
  return app;
};

beforeEach(() => {
  cacheStore.clear();
  findManyMock.mockReset();
  findManyMock.mockResolvedValue(sampleCategories);
  createMock.mockReset().mockResolvedValue({ id: 'cat-3', name: 'New' });
  updateMock.mockReset().mockImplementation(async ({ where, data }) => ({ id: where.id, ...data }));
  deleteMock.mockReset().mockResolvedValue({ id: 'cat-1' });
});

describe('GET /api/v1/categories — caching', () => {
  it('caches the list + emits ETag + sets Cache-Control', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.headers['etag']).toMatch(/^"[0-9a-f]{40}"$/);
    expect(res.headers['cache-control']).toContain('max-age');
    expect(findManyMock).toHaveBeenCalledTimes(1);
  });

  it('returns 304 on If-None-Match without re-querying', async () => {
    const app = await buildApp();
    const r1 = await request(app).get('/api/v1/categories');
    const r2 = await request(app).get('/api/v1/categories').set('If-None-Match', r1.headers['etag']);
    expect(r2.status).toBe(304);
    expect(findManyMock).toHaveBeenCalledTimes(1);
  });

  it('serves the cached body on plain re-fetch', async () => {
    const app = await buildApp();
    const r1 = await request(app).get('/api/v1/categories');
    const r2 = await request(app).get('/api/v1/categories');
    expect(r2.status).toBe(200);
    expect(r2.headers['etag']).toBe(r1.headers['etag']);
    expect(findManyMock).toHaveBeenCalledTimes(1);
  });
});

describe('POST/PUT/DELETE /api/v1/categories — invalidates cache', () => {
  it('POST invalidates the cached list', async () => {
    const app = await buildApp();
    await request(app).get('/api/v1/categories'); // populate cache
    await request(app).post('/api/v1/categories').send({ name: 'New', slug: 'new' });
    // Next GET must hit the DB again
    await request(app).get('/api/v1/categories');
    expect(findManyMock).toHaveBeenCalledTimes(2);
  });

  it('PUT invalidates the cached list', async () => {
    const app = await buildApp();
    await request(app).get('/api/v1/categories');
    await request(app).put('/api/v1/categories/cat-1').send({ name: 'Renamed' });
    await request(app).get('/api/v1/categories');
    expect(findManyMock).toHaveBeenCalledTimes(2);
  });

  it('DELETE invalidates the cached list', async () => {
    const app = await buildApp();
    await request(app).get('/api/v1/categories');
    await request(app).delete('/api/v1/categories/cat-1');
    await request(app).get('/api/v1/categories');
    expect(findManyMock).toHaveBeenCalledTimes(2);
  });
});
