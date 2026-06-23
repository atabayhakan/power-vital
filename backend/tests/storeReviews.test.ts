// Unit tests for storeReviews route — focuses on the Redis-backed cache
// layer added for the public GET endpoint. We mock Prisma to avoid DB
// I/O and rely on the in-process memory fallback in utils/redis.ts
// (when REDIS_URL is unreachable, redis.ts auto-switches to Map storage).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaModule, sharedMock } from './helpers/mockPrisma';
import type { MockPrisma } from './helpers/mockPrisma';

vi.mock('../src/lib/prisma', () => mockPrismaModule());
vi.mock('../src/i18n/TranslationCenter', () => ({
  translateOnSave: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../src/middleware/auth', () => ({
  authenticateJWT: (_req: any, _res: any, next: () => void) => next(),
  requireRole: () => (_req: any, _res: any, next: () => void) => next(),
}));

import request from 'supertest';
import express from 'express';
import storeReviewsRouter from '../src/routes/storeReviews';
import { deleteCache } from '../src/utils/redis';

const prismaMock: MockPrisma = sharedMock();

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/store-reviews', storeReviewsRouter);
  return app;
};

describe('storeReviews public GET cache', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset cache between tests so we always start with a cold cache.
    await deleteCache('storeReviews:list:v1');
    prismaMock.storeReview.findMany.mockReset();
  });

  it('returns 200 + X-Cache MISS on first call', async () => {
    prismaMock.storeReview.findMany.mockResolvedValue([
      { id: 'r1', status: 'published', rating: 5 },
    ]);
    const app = buildApp();
    const res = await request(app).get('/api/v1/store-reviews');
    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe('MISS');
    expect(res.headers['cache-control']).toBe('public, max-age=120');
    expect(res.headers['etag']).toBeDefined();
    expect(res.body).toEqual([{ id: 'r1', status: 'published', rating: 5 }]);
    expect(prismaMock.storeReview.findMany).toHaveBeenCalledTimes(1);
  });

  it('returns X-Cache HIT on subsequent calls without hitting Prisma', async () => {
    prismaMock.storeReview.findMany.mockResolvedValue([
      { id: 'r1', status: 'published', rating: 5 },
    ]);
    const app = buildApp();
    await request(app).get('/api/v1/store-reviews');
    const res = await request(app).get('/api/v1/store-reviews');
    expect(res.headers['x-cache']).toBe('HIT');
    // Only the first call should hit Prisma.
    expect(prismaMock.storeReview.findMany).toHaveBeenCalledTimes(1);
  });

  it('returns 304 Not Modified when If-None-Match matches the cached ETag', async () => {
    prismaMock.storeReview.findMany.mockResolvedValue([
      { id: 'r1', status: 'published', rating: 5 },
    ]);
    const app = buildApp();
    const first = await request(app).get('/api/v1/store-reviews');
    const etag = first.headers['etag'];
    const res = await request(app)
      .get('/api/v1/store-reviews')
      .set('If-None-Match', etag);
    expect(res.status).toBe(304);
  });

  it('invalidates cache when a new review is submitted via POST', async () => {
    prismaMock.storeReview.findMany.mockResolvedValue([
      { id: 'r1', status: 'published', rating: 5 },
    ]);
    prismaMock.storeReview.create.mockResolvedValue({
      id: 'r2', name: 'John', rating: 4, text: 'Good', status: 'pending', userId: null,
    });
    const app = buildApp();
    // Prime the cache.
    await request(app).get('/api/v1/store-reviews');
    expect(prismaMock.storeReview.findMany).toHaveBeenCalledTimes(1);
    // Submit a new review — should clear the cache.
    await request(app)
      .post('/api/v1/store-reviews')
      .send({ name: 'John', rating: 4, text: 'Good' });
    // Next GET should be a MISS again.
    const res = await request(app).get('/api/v1/store-reviews');
    expect(res.headers['x-cache']).toBe('MISS');
    expect(prismaMock.storeReview.findMany).toHaveBeenCalledTimes(2);
  });

  it('invalidates cache when admin updates review status', async () => {
    prismaMock.storeReview.findMany.mockResolvedValue([
      { id: 'r1', status: 'published', rating: 5 },
    ]);
    prismaMock.storeReview.update.mockResolvedValue({
      id: 'r1', status: 'pending',
    });
    const app = buildApp();
    await request(app).get('/api/v1/store-reviews');
    // Admin status update (no auth in this unit test — middleware is not mounted,
    // but the route's invalidate hook fires before checking auth).
    await request(app)
      .put('/api/v1/store-reviews/admin/r1/status')
      .send({ status: 'pending' });
    const res = await request(app).get('/api/v1/store-reviews');
    expect(res.headers['x-cache']).toBe('MISS');
  });

  it('invalidates cache when admin deletes a review', async () => {
    prismaMock.storeReview.findMany.mockResolvedValue([
      { id: 'r1', status: 'published', rating: 5 },
    ]);
    prismaMock.storeReview.delete.mockResolvedValue({ id: 'r1' });
    const app = buildApp();
    await request(app).get('/api/v1/store-reviews');
    await request(app).delete('/api/v1/store-reviews/admin/r1');
    const res = await request(app).get('/api/v1/store-reviews');
    expect(res.headers['x-cache']).toBe('MISS');
  });
});