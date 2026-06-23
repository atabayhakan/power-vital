// Unit tests for cacheStats — verifies the X-Cache header observer
// counts HIT / MISS / BYPASS responses correctly and rolls them up by
// route in the snapshot.
import { describe, it, expect, beforeEach } from 'vitest';
import { EventEmitter } from 'events';
import {
  cacheStatsMiddleware,
  getCacheStats,
  resetCacheStats
} from '../src/utils/cacheStats';

interface FakeRes extends EventEmitter {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  getHeader: (name: string) => string | undefined;
  headers: Record<string, string>;
  end: () => void;
}

const createFakeRes = (): FakeRes => {
  const r: any = new EventEmitter();
  r.statusCode = 200;
  r.headers = {};
  r.setHeader = (name: string, value: string) => { r.headers[name] = value; };
  r.getHeader = (name: string) => r.headers[name];
  r.end = () => {};
  return r;
};

describe('cacheStats', () => {
  beforeEach(() => {
    resetCacheStats();
  });

  it('counts HIT when X-Cache: HIT header is present', () => {
    const middleware = cacheStatsMiddleware;
    const req = { path: '/api/v1/store-reviews', method: 'GET' };
    const res = createFakeRes();
    let nextCalled = false;
    middleware(req as any, res as any, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
    // Simulate handler setting the header before response finishes.
    res.setHeader('X-Cache', 'HIT');
    res.emit('finish');
    const stats = getCacheStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(0);
    expect(stats.bypasses).toBe(0);
    expect(stats.byRoute).toContainEqual({ route: '/api/v1/store-reviews', hits: 1, misses: 0, bypasses: 0 });
  });

  it('counts MISS when X-Cache: MISS header is present', () => {
    const req = { path: '/api/v1/reviews/product/abc', method: 'GET' };
    const res = createFakeRes();
    const middleware = cacheStatsMiddleware;
    middleware(req as any, res as any, () => {});
    res.setHeader('X-Cache', 'MISS');
    res.emit('finish');
    const stats = getCacheStats();
    expect(stats.misses).toBe(1);
    expect(stats.hits).toBe(0);
  });

  it('counts BYPASS when X-Cache: BYPASS header is present', () => {
    const req = { path: '/api/v1/products', method: 'GET' };
    const res = createFakeRes();
    cacheStatsMiddleware(req as any, res as any, () => {});
    res.setHeader('X-Cache', 'BYPASS');
    res.emit('finish');
    const stats = getCacheStats();
    expect(stats.bypasses).toBe(1);
  });

  it('does NOT count responses without an X-Cache header', () => {
    const req = { path: '/api/v1/auth/login', method: 'POST' };
    const res = createFakeRes();
    cacheStatsMiddleware(req as any, res as any, () => {});
    // No X-Cache header set — route doesn't cache.
    res.emit('finish');
    const stats = getCacheStats();
    expect(stats.total).toBe(0);
    expect(stats.hitRatio).toBe(0);
  });

  it('computes the hit ratio correctly', () => {
    const middleware = cacheStatsMiddleware;
    for (let i = 0; i < 3; i++) {
      const req = { path: '/api/v1/store-reviews', method: 'GET' };
      const res = createFakeRes();
      middleware(req as any, res as any, () => {});
      res.setHeader('X-Cache', i === 0 ? 'MISS' : 'HIT');
      res.emit('finish');
    }
    const stats = getCacheStats();
    expect(stats.total).toBe(3);
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.hitRatio).toBeCloseTo(0.6667, 3);
  });

  it('resetCacheStats zeroes all counters', () => {
    const middleware = cacheStatsMiddleware;
    const req = { path: '/api/v1/store-reviews', method: 'GET' };
    const res = createFakeRes();
    middleware(req as any, res as any, () => {});
    res.setHeader('X-Cache', 'HIT');
    res.emit('finish');
    expect(getCacheStats().hits).toBe(1);
    resetCacheStats();
    expect(getCacheStats().hits).toBe(0);
    expect(getCacheStats().misses).toBe(0);
    expect(getCacheStats().bypasses).toBe(0);
  });

  it('rolls up hits/misses by route, merging multiple methods', () => {
    const middleware = cacheStatsMiddleware;
    // Two GETs that hit, one POST that misses — all on /api/v1/store-reviews.
    for (let i = 0; i < 2; i++) {
      const req = { path: '/api/v1/store-reviews', method: 'GET' };
      const res = createFakeRes();
      middleware(req as any, res as any, () => {});
      res.setHeader('X-Cache', 'HIT');
      res.emit('finish');
    }
    const req = { path: '/api/v1/store-reviews', method: 'POST' };
    const res = createFakeRes();
    middleware(req as any, res as any, () => {});
    res.setHeader('X-Cache', 'MISS');
    res.emit('finish');
    const stats = getCacheStats();
    expect(stats.byRoute).toContainEqual({ route: '/api/v1/store-reviews', hits: 2, misses: 1, bypasses: 0 });
  });
});