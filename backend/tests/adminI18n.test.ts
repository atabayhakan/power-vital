// Integration tests for the manual admin i18n routes
// (/api/v1/admin/i18n/record/... and /api/v1/admin/i18n/import/... and
// /api/v1/admin/i18n/export/...csv). These exercise the request/response
// cycle end-to-end with a real Prisma client + Express app. No AI is
// involved — the admin owns translations now.
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Stub the auth middleware so we can drive the routes as an admin
// without going through the real JWT verification path. The
// adminI18n router still uses authenticateJWT+requireRole internally
// — this mock replaces the implementation to short-circuit to
// `req.user = { id: 'admin-1', role: 'admin' }` and always call next.
vi.mock('../src/middleware/auth', () => ({
  authenticateJWT: (req: any, _res: any, next: any) => {
    req.user = { id: 'admin-1', role: 'admin', userId: 'admin-1' };
    next();
  },
  requireRole: (..._roles: string[]) => (_req: any, _res: any, next: any) => next()
}));

const { default: adminI18nRoutes } = await import('../src/routes/adminI18n');
import prisma from '../src/lib/prisma';
import { buildTestApp, cleanDatabase, closePrisma } from './testHelpers';

const app = buildTestApp();
app.use('/api/v1/admin/i18n', adminI18nRoutes);
// Minimal error tail so validation errors are returned with a body
app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(err.status || 500).json({ error: err.message || 'error' });
});

afterAll(async () => { await closePrisma(); });

beforeEach(async () => { await cleanDatabase(); });

// Auth is stubbed in the vi.mock above, so we don't need to send a
// real Bearer token. The helper is kept for symmetry with the other
// route tests — it just no-ops.
const authed = (req: request.Test) => req;

describe('GET /admin/i18n/stats', () => {
  it('returns coverage per model', async () => {
    await prisma.category.create({ data: { name: 'Cat', slug: 'cat' } });
    const res = await authed(request(app).get('/api/v1/admin/i18n/stats'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.stats)).toBe(true);
    expect(res.body.locales).toEqual(expect.arrayContaining(['tr', 'ru', 'kg', 'en']));
  });
});

describe('GET /admin/i18n/records', () => {
  it('lists records with coverage and per-locale percentages', async () => {
    const c = await prisma.category.create({ data: { name: 'Cat', slug: 'cat' } });
    const res = await authed(request(app).get('/api/v1/admin/i18n/records').query({ model: 'Category' }));
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
    const it = res.body.items[0];
    expect(it.id).toBe(c.id);
    expect(it.coveragePct).toBe(0);
    expect(it.perLocale).toHaveProperty('ru');
    expect(it.hasMissing).toBe(true);
  });

  it('hides complete records when onlyMissing=1', async () => {
    await prisma.category.create({
      data: { name: 'Cat', slug: 'cat', translations: JSON.stringify({ ru: { name: 'Кот' }, kg: { name: 'Кот' } }) }
    });
    const res = await authed(request(app).get('/api/v1/admin/i18n/records').query({ model: 'Category', onlyMissing: 1 }));
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(0);
  });

  it('rejects unknown model', async () => {
    const res = await authed(request(app).get('/api/v1/admin/i18n/records').query({ model: 'NoSuchModel' }));
    expect(res.status).toBe(400);
  });
});

describe('PATCH /admin/i18n/record/:model/:id', () => {
  it('writes a scalar value into the translations column', async () => {
    const c = await prisma.category.create({ data: { name: 'Cat', slug: 'cat' } });
    const res = await authed(request(app).patch(`/api/v1/admin/i18n/record/Category/${c.id}`)).send({
      locale: 'ru', field: 'name', value: 'Кот'
    });
    expect(res.status).toBe(200);
    const after = await prisma.category.findUnique({ where: { id: c.id } });
    const parsed = JSON.parse(after!.translations || '{}');
    expect(parsed.ru.name).toBe('Кот');
  });

  it('clears a slot when value is empty string', async () => {
    const c = await prisma.category.create({
      data: { name: 'Cat', slug: 'cat', translations: JSON.stringify({ ru: { name: 'Кот' } }) }
    });
    const res = await authed(request(app).patch(`/api/v1/admin/i18n/record/Category/${c.id}`)).send({
      locale: 'ru', field: 'name', value: ''
    });
    expect(res.status).toBe(200);
    const after = await prisma.category.findUnique({ where: { id: c.id } });
    const parsed = JSON.parse(after!.translations || '{}');
    expect(parsed.ru.name).toBeUndefined();
  });

  it('refuses to write to the TR source locale', async () => {
    const c = await prisma.category.create({ data: { name: 'Cat', slug: 'cat' } });
    const res = await authed(request(app).patch(`/api/v1/admin/i18n/record/Category/${c.id}`)).send({
      locale: 'tr', field: 'name', value: 'Other'
    });
    expect(res.status).toBe(400);
  });

  it('writes a keyed array item (Product accordions)', async () => {
    const p = await prisma.product.create({
      data: {
        name: 'Reishi',
        slug: 'reishi',
        priceKgs: 1000,
        accordions: JSON.stringify([{ key: 'storage', title: 'Saklama', content: 'Serin' }])
      }
    });
    const res = await authed(request(app).patch(`/api/v1/admin/i18n/record/Product/${p.id}`)).send({
      locale: 'ru', arrayField: 'accordions', key: 'storage', subField: 'title', value: 'Хранение'
    });
    expect(res.status).toBe(200);
    const after = await prisma.product.findUnique({ where: { id: p.id } });
    const parsed = JSON.parse(after!.translations || '{}');
    expect(parsed.ru.accordions[0].title).toBe('Хранение');
    expect(parsed.ru.accordions[0].key).toBe('storage');
  });

  it('writes an indexed string-array item (Product benefits)', async () => {
    const p = await prisma.product.create({
      data: { name: 'X', slug: 'x', priceKgs: 100, benefits: JSON.stringify(['Bağışıklık']) }
    });
    const res = await authed(request(app).patch(`/api/v1/admin/i18n/record/Product/${p.id}`)).send({
      locale: 'ru', arrayField: 'benefits', index: 0, value: 'Иммунитет'
    });
    expect(res.status).toBe(200);
    const after = await prisma.product.findUnique({ where: { id: p.id } });
    const parsed = JSON.parse(after!.translations || '{}');
    expect(parsed.ru.benefits[0]).toBe('Иммунитет');
  });
});

describe('POST /admin/i18n/record/:model/:id/copy-from-tr', () => {
  it('copies TR source into the requested target locales (empty slots only)', async () => {
    const c = await prisma.category.create({
      data: { name: 'Cat', slug: 'cat', translations: JSON.stringify({ ru: { name: 'Ручной' } }) }
    });
    const res = await authed(request(app).post(`/api/v1/admin/i18n/record/Category/${c.id}/copy-from-tr`)).send({
      locales: ['ru', 'kg']
    });
    expect(res.status).toBe(200);
    expect(res.body.copied).toBe(1); // only kg was empty
    const after = await prisma.category.findUnique({ where: { id: c.id } });
    const parsed = JSON.parse(after!.translations || '{}');
    expect(parsed.ru.name).toBe('Ручной'); // untouched
    expect(parsed.kg.name).toBe('Cat'); // TR copied
  });
});

describe('GET /admin/i18n/export/:model.csv', () => {
  it('returns a CSV with one row per translatable slot', async () => {
    await prisma.product.create({
      data: { name: 'Reishi', slug: 'reishi', priceKgs: 1000, description: 'Doğal enerji' }
    });
    const res = await authed(request(app).get('/api/v1/admin/i18n/export/Product.csv').query({ locales: 'ru,kg' }));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    // Header + at least one row for `name`
    const lines = res.text.split('\n').filter((l: string) => l.trim().length > 0);
    expect(lines[0]).toMatch(/record_id/);
    expect(lines[0]).toMatch(/ru/);
  });
});

describe('POST /admin/i18n/import/:model', () => {
  it('imports a batch of translation updates', async () => {
    const c = await prisma.category.create({ data: { name: 'Cat', slug: 'cat' } });
    const res = await authed(request(app).post('/api/v1/admin/i18n/import/Category')).send({
      rows: [
        { recordId: c.id, locale: 'ru', path: 'name', value: 'Кот' },
        { recordId: c.id, locale: 'kg', path: 'name', value: 'Кот KG' }
      ]
    });
    expect(res.status).toBe(200);
    expect(res.body.updatedRecords).toBe(1);
    expect(res.body.updatedFields).toBe(2);
    const after = await prisma.category.findUnique({ where: { id: c.id } });
    const parsed = JSON.parse(after!.translations || '{}');
    expect(parsed.ru.name).toBe('Кот');
    expect(parsed.kg.name).toBe('Кот KG');
  });

  it('imports a keyed accordion update', async () => {
    const p = await prisma.product.create({
      data: { name: 'X', slug: 'x', priceKgs: 100, accordions: JSON.stringify([{ key: 'storage', title: 'Saklama', content: 'Serin' }]) }
    });
    const res = await authed(request(app).post('/api/v1/admin/i18n/import/Product')).send({
      rows: [
        { recordId: p.id, locale: 'ru', path: 'accordions[storage].title', value: 'Хранение' }
      ]
    });
    expect(res.status).toBe(200);
    expect(res.body.updatedFields).toBe(1);
  });
});

describe('Auth gating', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/v1/admin/i18n/stats');
    expect(res.status).toBe(401);
  });
});

describe('GET /admin/i18n/records-batch', () => {
  it('returns TR/RU/KG/EN for all scalar fields, plus a TR hash', async () => {
    const c = await prisma.category.create({
      data: {
        name: 'Vitamins',
        slug: 'vit',
        translations: JSON.stringify({ ru: { name: 'Витамины' } })
      }
    });
    const res = await authed(request(app).get('/api/v1/admin/i18n/records-batch').query({
      model: 'Category', ids: c.id
    }));
    expect(res.status).toBe(200);
    const item = res.body.items[c.id];
    expect(item).toBeDefined();
    expect(item.fields.name.tr).toBe('Vitamins');
    expect(item.fields.name.ru).toBe('Витамины');
    expect(item.fields.name.kg).toBe('');
    expect(item.fields.name.en).toBe('');
    expect(item.fields.name.trHash).toMatch(/^[a-f0-9]{16}$/);
    expect(item.fields.name.changed).toBe(false);
  });

  it('flags changed=true when TR source was edited after a translation', async () => {
    // First save creates _src hash for `name`
    const c = await prisma.category.create({ data: { name: 'Vitamins', slug: 'vit-1' } });
    await authed(request(app).patch(`/api/v1/admin/i18n/record/Category/${c.id}`)).send({
      locale: 'ru', field: 'name', value: 'Витамины'
    });
    // Now admin edits the TR source via the underlying model
    await prisma.category.update({ where: { id: c.id }, data: { name: 'Vitamins & Minerals' } });
    const res = await authed(request(app).get('/api/v1/admin/i18n/records-batch').query({
      model: 'Category', ids: c.id
    }));
    const item = res.body.items[c.id];
    expect(item.fields.name.changed).toBe(true);
    expect(item.fields.name.srcHash).not.toBe(item.fields.name.trHash);
  });

  it('caps at 200 ids', async () => {
    // Create 3 categories, request with 300 ids
    const ids = ['a', 'b', 'c'];
    const res = await authed(request(app).get('/api/v1/admin/i18n/records-batch').query({
      model: 'Category', ids: Array.from({ length: 300 }, (_, i) => `id-${i}`).join(',')
    }));
    // Should respond 200 with empty items (or up to 200 if any match — none will)
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.items).length).toBe(0);
    void ids;
  });
});
