// tests/helpers/mockPrisma.ts — DB-free Prisma mock for unit tests.
//
// Usage:
//   vi.mock('../../src/lib/prisma', () => mockPrismaModule());
//
// Why this helper?
//   Many backend unit tests assert on logic that *would* hit the database
//   but don't actually need a real MySQL connection. Mocking prisma at
//   the module level lets the test:
//     1. Run without a live database (CI, local dev without MySQL).
//     2. Define per-test data with `mockPrisma.model.findMany.mockResolvedValue(...)`.
//     3. Skip the slow PrismaClient init (~50ms × every test file).
//
// The mock returns a vi.fn() for every standard operation (findUnique,
// findMany, findFirst, create, update, upsert, delete, deleteMany,
// count, groupBy, aggregate). Each test can override what it needs.
//
// For tests that genuinely need DB (e.g. `cleanDatabase` itself), don't
// apply this mock — they'll fail gracefully with a clear "DB unavailable"
// error so we can mark them as integration-only.

import { vi } from 'vitest';

export interface MockPrismaModel {
  findUnique: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  createMany: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  updateMany: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  deleteMany: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  groupBy: ReturnType<typeof vi.fn>;
  aggregate: ReturnType<typeof vi.fn>;
  findFirstOrThrow: ReturnType<typeof vi.fn>;
  findUniqueOrThrow: ReturnType<typeof vi.fn>;
}

export type MockPrisma = Record<string, MockPrismaModel> & {
  $transaction: ReturnType<typeof vi.fn>;
  $disconnect: ReturnType<typeof vi.fn>;
  $connect: ReturnType<typeof vi.fn>;
  $executeRaw: ReturnType<typeof vi.fn>;
  $queryRaw: ReturnType<typeof vi.fn>;
};

/**
 * Build a fresh mock-prisma instance. The `$transaction` mock runs the
 * first argument as either a callback (tx-style) or an array (sequential
 * batch) — matches PrismaClient's actual behaviour.
 */
export function createMockPrisma(): MockPrisma {
  const makeModel = (): MockPrismaModel => ({
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

  // PrismaClient exposes ~50 models — we don't know them all at compile
  // time, but the standard ones we use in tests are listed below. Tests
  // that need a model not in this list can set it via mockPrisma.someModel =
  // makeModel() before the test runs.
  const KNOWN_MODELS = [
    'user', 'product', 'category', 'order', 'orderItem', 'transaction',
    'withdrawalRequest', 'priceRule', 'productImage', 'productReview',
    'storeReview', 'cartAbandonment', 'heroSlide', 'siteSettings',
    'exchangeRate', 'systemConfig', 'page', 'media', 'mediaFolder',
    'pushSubscription', 'pushBroadcast', 'pushScheduled', 'broadcastLog',
    'impersonationSession', 'adminBroadcast', 'weeklyCycle', 'userWeeklyStats',
    'clientError', 'broadcastJob',
  ];

  const prisma = {} as MockPrisma;
  for (const name of KNOWN_MODELS) {
    (prisma as any)[name] = makeModel();
  }

  // $transaction — supports both (tx) => Promise and array of operations.
  // Tests can override per-call with mockResolvedValueOnce / mockImplementationOnce.
  prisma.$transaction = vi.fn(async (arg: any) => {
    if (typeof arg === 'function') {
      // Pass-through mode — the function gets the prisma client as `tx`.
      // Default: invoke with our mock as the tx (tests can override).
      return await arg(prisma);
    }
    if (Array.isArray(arg)) {
      // Sequential — run each and return the results.
      const results: unknown[] = [];
      for (const op of arg) {
        results.push(await op);
      }
      return results;
    }
    return undefined;
  }) as any;

  prisma.$disconnect = vi.fn().mockResolvedValue(undefined);
  prisma.$connect = vi.fn().mockResolvedValue(undefined);
  prisma.$executeRaw = vi.fn().mockResolvedValue(0);
  prisma.$queryRaw = vi.fn().mockResolvedValue([]);

  return prisma;
}

/**
 * Module-level singleton mock — returned by every `mockPrismaModule()`
 * call. Sharing it across the file lets tests do `mock.product.findMany
 * .mockResolvedValueOnce(...)` and have it visible to the system under
 * test (because both the test file and `src/lib/prisma` resolve to the
 * same object via the mock module cache).
 */
const SHARED_MOCK: MockPrisma = createMockPrisma();

/**
 * Return the mock object that should be assigned to the default export
 * of `src/lib/prisma`. Use this as the factory return of `vi.mock(...)`.
 *
 * The factory must be synchronous (vitest hoists it to the top of the
 * file). We return a singleton that's created once when this helper
 * module is first imported — same instance is reused across all calls
 * within one test file, so per-test mockResolvedValue() configuration
 * persists across test() blocks.
 *
 * Example:
 *   vi.mock('../src/lib/prisma', () => mockPrismaModule());
 *   import prisma from '../src/lib/prisma';
 *   const mock = (prisma as unknown as MockPrisma);
 *   mock.product.findMany.mockResolvedValue([{ id: 1 }]);
 */
export function mockPrismaModule(): { default: MockPrisma } {
  return { default: SHARED_MOCK };
}

/**
 * Direct accessor for tests that want the raw mock without going
 * through the prisma module. Useful when the mock factory can't be
 * applied (e.g. the SUT doesn't import prisma directly).
 */
export function sharedMock(): MockPrisma {
  return SHARED_MOCK;
}