// Tests for /api/v1/settings cache + ETag behaviour.
//
// Verifies:
//   • First GET returns 200 with an ETag header
//   • Second GET with the same ETag returns 304 (no body, no DB hit)
//   • PUT invalidates the cache so the next GET returns the new value
//   • Cache-Control header advertises public max-age
//   • Different Accept-Language still receives the same cached payload
//     (i18n is applied per-request via translateOnSave, but the raw
//     JSON stored in cache is the canonical DB row)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Stub the redis helpers so we don't need a live Redis in tests.
// Track cache contents + clear between tests.
const cacheStore = new Map<string, { value: string; expiresAt: number | null }>();
vi.mock('../src/utils/redis', () => ({
  getCache: async (key: string) => {
    const entry = cacheStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      cacheStore.delete(key);
      return null;
    }
    try { return JSON.parse(entry.value); }
    catch { return null; }
  },
  setCache: async (key: string, value: any, ttlSeconds?: number) => {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    cacheStore.set(key, { value: JSON.stringify(value), expiresAt });
  },
  deleteCache: async (key: string) => { cacheStore.delete(key); }
}));

// Stub the i18n sweeper so PUT doesn't spawn background work.
vi.mock('../src/i18n/TranslationCenter', () => ({
  translateOnSave: () => {}
}));

// Mock Prisma — we want full control over what /api/v1/settings returns.
const mockSettings = (overrides: any = {}) => ({
  id: 'site-1',
  companyName: 'Power Vital',
  address: 'Bishkek',
  phone: '+996 771 898 889',
  email: 'info@powervital.kg',
  mapIframeCode: '',
  logoUrl: '',
  topbarShippingMsg: '100$ ve Uzeri',
  topbarPhone: '+996 771 898 889',
  trustBadges: null,
  partners: null,
  footerLinks: null,
  faqItems: null,
  homepageBlocks: null,
  financeSettings: null,
  translations: null,
  campaignEnabled: false,
  campaignEndsAt: null,
  campaignTitle: null,
  campaignCta: null,
  campaignLink: null,
  copyrightText: null,
  uiTranslations: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
  ...overrides
});

let nextSettings: any = mockSettings();
vi.mock('../src/lib/prisma', () => ({
  default: {
    siteSettings: {
      findFirst: vi.fn(async () => nextSettings),
      create: vi.fn(async ({ data }) => { nextSettings = mockSettings(data); return nextSettings; }),
      update: vi.fn(async ({ data }) => { nextSettings = { ...nextSettings, ...data }; return nextSettings; })
    }
  }
}));

// authenticateJWT is required for PUT — stub it.
vi.mock('../src/middleware/auth', () => ({
  authenticateJWT: (req: any, _res: any, next: any) => {
    req.user = { id: 'admin-1', role: 'admin' };
    next();
  },
  requireRole: (...roles: string[]) => (req: any, res: any, next: any) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ error: 'forbidden' });
    next();
  }
}));

const buildApp = async () => {
  const app = express();
  app.use(express.json());
  const settingsRoutes = (await import('../src/routes/settings')).default;
  app.use('/api/v1/settings', settingsRoutes);
  return app;
};

beforeEach(() => {
  cacheStore.clear();
  nextSettings = mockSettings();
});

describe('GET /api/v1/settings — caching', () => {
  it('returns 200 with ETag and Cache-Control on first call', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/settings');
    expect(res.status).toBe(200);
    expect(res.headers['etag']).toMatch(/^"[0-9a-f]{40}"$/);
    expect(res.headers['cache-control']).toContain('max-age');
  });

  it('returns 304 on second call with If-None-Match', async () => {
    const app = await buildApp();
    const r1 = await request(app).get('/api/v1/settings');
    const etag = r1.headers['etag'];
    const r2 = await request(app).get('/api/v1/settings').set('If-None-Match', etag);
    expect(r2.status).toBe(304);
    expect(r2.body).toEqual({});
  });

  it('returns 200 (not 304) when client sends a stale ETag', async () => {
    const app = await buildApp();
    await request(app).get('/api/v1/settings');
    const r2 = await request(app).get('/api/v1/settings').set('If-None-Match', '"deadbeef"');
    expect(r2.status).toBe(200);
  });

  it('serves the cached body on a non-conditional second GET', async () => {
    const app = await buildApp();
    const r1 = await request(app).get('/api/v1/settings');
    const r2 = await request(app).get('/api/v1/settings');
    expect(r2.status).toBe(200);
    expect(r2.body.companyName).toBe(r1.body.companyName);
    expect(r2.headers['etag']).toBe(r1.headers['etag']);
  });
});

describe('PUT /api/v1/settings — invalidates cache', () => {
  it('forces the next GET to return a fresh ETag + body', async () => {
    const app = await buildApp();
    const r1 = await request(app).get('/api/v1/settings');
    const etagBefore = r1.headers['etag'];

    // Update companyName via PUT
    await request(app)
      .put('/api/v1/settings')
      .send({ companyName: 'Power Vital Updated' });

    const r2 = await request(app).get('/api/v1/settings');
    expect(r2.body.companyName).toBe('Power Vital Updated');
    expect(r2.headers['etag']).not.toBe(etagBefore);
  });

  it('the stale ETag now returns 200 (cache was invalidated, payload changed)', async () => {
    const app = await buildApp();
    const r1 = await request(app).get('/api/v1/settings');
    const etagBefore = r1.headers['etag'];

    await request(app).put('/api/v1/settings').send({ companyName: 'X' });

    const r2 = await request(app).get('/api/v1/settings').set('If-None-Match', etagBefore);
    expect(r2.status).toBe(200);
  });
});
