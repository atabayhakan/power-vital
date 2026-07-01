// Manual Translation Center tests — pure logic helpers (parseTr, extractBaseValues)
// + getCoverageStats() with a mocked prisma.
//
// DB-free: we mock prisma at the module level so the test runs without
// a MySQL connection. The mocked `count()` and `findMany()` return
// per-test data so we exercise the coverage calculation paths.
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Inline mock factory — vi.hoisted runs the createMockPrisma() callback
// before any imports resolve, so by the time prisma.ts is loaded, the
// mock module already has the singleton ready.
const { __mockPrisma } = vi.hoisted(() => {
  // Re-implement the model factory here so we don't depend on import
  // ordering in the vi.mock factory below.
  const makeModel = () => ({
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    update: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    upsert: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    count: vi.fn().mockResolvedValue(0),
    groupBy: vi.fn().mockResolvedValue([]),
    aggregate: vi.fn().mockResolvedValue({}),
    findFirstOrThrow: vi.fn().mockRejectedValue(new Error('not found')),
    findUniqueOrThrow: vi.fn().mockRejectedValue(new Error('not found')),
  });
  const KNOWN = [
    'user', 'product', 'category', 'order', 'orderItem', 'transaction',
    'withdrawalRequest', 'priceRule', 'productImage', 'productReview',
    'storeReview', 'cartAbandonment', 'heroSlide', 'siteSettings',
    'systemConfig', 'page', 'media', 'mediaFolder',
    'pushSubscription', 'pushBroadcast', 'pushScheduled', 'broadcastLog',
    'impersonationSession', 'adminBroadcast', 'weeklyCycle', 'userWeeklyStats',
  ];
  const prisma: any = {};
  for (const name of KNOWN) prisma[name] = makeModel();
  prisma.$transaction = vi.fn(async (arg: any) => {
    if (typeof arg === 'function') return await arg(prisma);
    if (Array.isArray(arg)) {
      const out: unknown[] = [];
      for (const op of arg) out.push(await op);
      return out;
    }
    return undefined;
  });
  prisma.$disconnect = vi.fn().mockResolvedValue(undefined);
  prisma.$connect = vi.fn().mockResolvedValue(undefined);
  prisma.$executeRaw = vi.fn().mockResolvedValue(0);
  prisma.$queryRaw = vi.fn().mockResolvedValue([]);
  return { __mockPrisma: prisma };
});

vi.mock('../src/lib/prisma', () => ({ default: __mockPrisma }));

import { DEFAULT_LOCALE, AI_TARGET_LOCALES, isSupportedLocale, normaliseLocale } from '../src/i18n/locales';
import prisma from '../src/lib/prisma';
import type { MockPrisma } from './helpers/mockPrisma';
import { getCoverageStats } from '../src/i18n/TranslationCenter';
import { parseTr, extractBaseValues } from '../src/i18n/fields';
import { TRANSLATABLE_MODELS } from '../src/i18n/fields';

const db = prisma as unknown as MockPrisma;

describe('Locale helpers', () => {
  it('exposes the expected default locale', () => {
    expect(DEFAULT_LOCALE).toBe('tr');
  });

  it('AI targets (used by /stats) are ru + kg (en is admin-only)', () => {
    expect(AI_TARGET_LOCALES).toEqual(['ru', 'kg']);
  });

  it('isSupportedLocale validates against the list', () => {
    expect(isSupportedLocale('tr')).toBe(true);
    expect(isSupportedLocale('ru')).toBe(true);
    expect(isSupportedLocale('kg')).toBe(true);
    expect(isSupportedLocale('en')).toBe(true);
    expect(isSupportedLocale('de')).toBe(false);
    expect(isSupportedLocale('xx')).toBe(false);
  });

  it('normaliseLocale returns TR for empty/invalid input', () => {
    expect(normaliseLocale(null)).toBe('tr');
    expect(normaliseLocale(undefined)).toBe('tr');
    expect(normaliseLocale('')).toBe('tr');
    expect(normaliseLocale('xx')).toBe('tr');
    expect(normaliseLocale('RU')).toBe('ru');
    expect(normaliseLocale('KG')).toBe('kg');
    expect(normaliseLocale('ky')).toBe('tr');
  });
});

describe('parseTr — translations column shape', () => {
  it('returns empty object for null/empty input', () => {
    expect(parseTr(null)).toEqual({});
    expect(parseTr(undefined)).toEqual({});
    expect(parseTr('')).toEqual({});
  });

  it('parses JSON string into an object', () => {
    const out = parseTr(JSON.stringify({ ru: { name: 'X' } }));
    expect(out.ru.name).toBe('X');
  });

  it('normalises legacy stringified per-locale values back to objects', () => {
    const out = parseTr(JSON.stringify({ ru: '{"name":"X"}' }));
    expect(out.ru).toEqual({ name: 'X' });
  });

  it('leaves non-object string values untouched (e.g. plain-text stored as string)', () => {
    const out = parseTr(JSON.stringify({ ru: 'just a label' }));
    expect(out.ru).toBe('just a label');
  });
});

describe('extractBaseValues — TR source extraction', () => {
  it('returns scalar values from the record', () => {
    const schema = TRANSLATABLE_MODELS.Category;
    const base = extractBaseValues({ name: 'Vitaminler', translations: '{}' }, schema);
    expect(base.name).toBe('Vitaminler');
  });

  it('parses JSON-encoded array fields', () => {
    const schema = TRANSLATABLE_MODELS.Product;
    const base = extractBaseValues(
      { name: 'X', accordions: JSON.stringify([{ key: 'storage', title: 'A', content: 'B' }]) },
      schema
    );
    expect(base.accordions).toEqual([{ key: 'storage', title: 'A', content: 'B' }]);
  });

  it('returns [] for missing array fields', () => {
    const schema = TRANSLATABLE_MODELS.Product;
    const base = extractBaseValues({ name: 'X' }, schema);
    expect(base.accordions).toEqual([]);
    expect(base.benefits).toEqual([]);
  });
});

describe('getCoverageStats', () => {
  // Per-test setup: re-prime the singleton mock so each test starts
  // from a known state. We don't mockReset because the singleton's
  // default implementations (mockResolvedValue([])) live in the mock
  // factory — mockReset would strip them, requiring a re-`mockImplementation`
  // per call. Instead we layer mockResolvedValueOnce on top so the test's
  // data is consumed exactly once.
  beforeEach(() => {
    for (const name of Object.keys(db)) {
      if (typeof (db as any)[name]?.findMany === 'function') {
        ((db as any)[name].findMany as any).mockReset();
        ((db as any)[name].count as any).mockReset();
        // Re-prime defaults so an un-mocked call still resolves cleanly.
        ((db as any)[name].findMany as any).mockResolvedValue([]);
        ((db as any)[name].count as any).mockResolvedValue(0);
      }
    }
  });

  it('returns an array with one entry per translatable model', async () => {
    // Set up: 1 record in each known model. Use mockResolvedValue so
    // the default config is replaced for the test duration.
    for (const name of Object.keys(db)) {
      if (typeof (db as any)[name]?.findMany === 'function') {
        ((db as any)[name].count as any).mockResolvedValue(1);
        ((db as any)[name].findMany as any).mockResolvedValue([
          { id: 'mock-1', translations: null, name: 'Mock', description: '' }
        ]);
      }
    }

    const stats = await getCoverageStats();
    expect(Array.isArray(stats)).toBe(true);
    expect(stats.length).toBeGreaterThan(0);
    for (const entry of stats) {
      expect(entry).toHaveProperty('model');
      expect(entry).toHaveProperty('totalRecords');
      expect(entry).toHaveProperty('coveragePct');
      expect(entry.coveragePct).toBeGreaterThanOrEqual(0);
      expect(entry.coveragePct).toBeLessThanOrEqual(100);
    }
  });

  it('reports 100% coverage for records with all locales pre-filled', async () => {
    db.category.count.mockResolvedValue(1);
    db.category.findMany.mockResolvedValue([
      {
        id: 'cat-1',
        name: 'Cat',
        slug: 'cat',
        translations: JSON.stringify({ ru: { name: 'Кот' }, kg: { name: 'Кот' } })
      }
    ]);

    const stats = await getCoverageStats();
    const cat = stats.find((s: any) => s.model === 'Category');
    expect(cat.coveragePct).toBe(100);
  });
});
