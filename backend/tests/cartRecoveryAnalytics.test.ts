// Smoke tests for the admin cart-recovery analytics. We mock
// Prisma + the presence/inventory helpers so the service runs
// without a real DB or live counters. The goal isn't full
// coverage of every SQL branch — that's what integration
// tests would cover — but the math (sums, conversion rate,
// cache TTL) must always be right.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const groupByMock = vi.fn();
const aggregateMock = vi.fn();
const findManyMock = vi.fn();

vi.mock('../src/lib/prisma', () => ({
  default: {
    cartAbandonment: {
      groupBy: (...args: any[]) => groupByMock(...args),
      aggregate: (...args: any[]) => aggregateMock(...args),
      findMany: (...args: any[]) => findManyMock(...args)
    },
    product: {
      findMany: (...args: any[]) => findManyMock(...args)
    }
  }
}));

vi.mock('../src/services/presenceService', () => ({
  getAllCounts: () => [
    { productId: 'p-A', count: 3 },
    { productId: 'p-B', count: 1 }
  ]
}));

vi.mock('../src/services/inventoryService', () => ({
  recentOrderCount: (id: string) => (id === 'p-A' ? 2 : 0)
}));

beforeEach(() => {
  vi.resetModules();
  groupByMock.mockReset();
  aggregateMock.mockReset();
  findManyMock.mockReset();
});

describe('cartRecoveryAnalytics — empty state', () => {
  it('returns zeros when no abandonment rows exist', async () => {
    groupByMock.mockResolvedValue([]);
    aggregateMock.mockResolvedValue({ _sum: { cartTotalKgs: null } });
    findManyMock.mockResolvedValue([]);

    const mod = await import('../src/services/cartRecoveryAnalytics');
    const k = await mod.getCartRecoveryKpis();
    expect(k.pending).toBe(0);
    expect(k.notified).toBe(0);
    expect(k.converted).toBe(0);
    expect(k.expired).toBe(0);
    expect(k.conversionRate).toBe(0);
    expect(k.activeSessions).toBe(4);
    expect(k.recentOrdersLast10m).toBe(0);
    expect(k.topProducts).toEqual([]);
    expect(k.recent).toEqual([]);
  });
});

describe('cartRecoveryAnalytics — happy path', () => {
  it('sums status counts and computes the conversion rate', async () => {
    // Two groupBy calls (status + topProducts) — we return
    // different shapes for each via mockImplementationOnce.
    groupByMock
      .mockResolvedValueOnce([
        { status: 'pending', _count: { _all: 5 }, _sum: { cartTotalKgs: 5000 } },
        { status: 'notified', _count: { _all: 3 }, _sum: { cartTotalKgs: 3000 } },
        { status: 'converted', _count: { _all: 2 }, _sum: { cartTotalKgs: 2000 } },
        { status: 'expired', _count: { _all: 7 }, _sum: { cartTotalKgs: 0 } }
      ])
      .mockResolvedValueOnce([
        { lastProductId: 'p-A', _count: { _all: 3 }, _sum: { cartTotalKgs: 3000 } },
        { lastProductId: 'p-B', _count: { _all: 2 }, _sum: { cartTotalKgs: 2000 } }
      ]);

    // Two aggregate calls in service order (converted first,
    // then pending — the order is set in the service body).
    aggregateMock
      .mockResolvedValueOnce({ _sum: { cartTotalKgs: 2000 } })  // converted
      .mockResolvedValueOnce({ _sum: { cartTotalKgs: 8000 } }); // pending

    // findMany: top products + recent activity + recent touched product ids
    findManyMock.mockResolvedValue([]);

    const mod = await import('../src/services/cartRecoveryAnalytics');
    const k = await mod.getCartRecoveryKpis();

    expect(k.pending).toBe(5);
    expect(k.notified).toBe(3);
    expect(k.converted).toBe(2);
    expect(k.expired).toBe(7);
    // notified + converted = 5, conversion = 2/5 = 0.4
    expect(k.conversionRate).toBe(0.4);
    expect(k.pendingValueKgs).toBe(8000);
    expect(k.recoveredValueKgs).toBe(2000);
  });

  it('caches the result for CACHE_TTL_MS (15s)', async () => {
    groupByMock.mockResolvedValue([]);
    aggregateMock.mockResolvedValue({ _sum: { cartTotalKgs: 0 } });
    findManyMock.mockResolvedValue([]);

    const mod = await import('../src/services/cartRecoveryAnalytics');
    // First call: cache miss → loader runs → SQL fires.
    await mod.getCartRecoveryKpis();
    const callsAfterFirst =
      groupByMock.mock.calls.length +
      aggregateMock.mock.calls.length +
      findManyMock.mock.calls.length;
    // Two more calls within the TTL window: cache hits → 0 new calls.
    await mod.getCartRecoveryKpis();
    await mod.getCartRecoveryKpis();
    const callsAfterThree =
      groupByMock.mock.calls.length +
      aggregateMock.mock.calls.length +
      findManyMock.mock.calls.length;
    expect(callsAfterThree).toBe(callsAfterFirst);
    expect(callsAfterFirst).toBeGreaterThan(0); // sanity: the loader DID run
  });

  it('cache hit then miss returns fresh data after TTL', async () => {
    groupByMock.mockResolvedValue([]);
    aggregateMock.mockResolvedValue({ _sum: { cartTotalKgs: 0 } });
    findManyMock.mockResolvedValue([]);

    const mod = await import('../src/services/cartRecoveryAnalytics');
    // Backdate the cache entry to be older than the TTL.
    mod.__test.cache.set('kpis', { at: Date.now() - 20_000, value: null });
    await mod.getCartRecoveryKpis();
    expect(groupByMock).toHaveBeenCalled();
  });
});

describe('cartRecoveryAnalytics — FOMO aggregation', () => {
  it('sums recentOrderCount only for products with abandonment in the last 10 min', async () => {
    groupByMock.mockResolvedValueOnce([]);  // status groupBy
    groupByMock.mockResolvedValueOnce([]);  // topProducts groupBy
    aggregateMock.mockResolvedValue({ _sum: { cartTotalKgs: 0 } });
    // findMany is called in two places:
    //   1. the "topProducts" products fetch
    //   2. the "recent touched" distinct lastProductId fetch
    //   3. the recent activity rows
    // We dispatch by inspecting the `select` shape: the
    // distinct-fetch passes { select: { lastProductId: true }, distinct: [...] }
    findManyMock.mockImplementation((args: any) => {
      if (args?.distinct && Array.isArray(args.distinct) && args.distinct[0] === 'lastProductId') {
        return Promise.resolve([{ lastProductId: 'p-A' }, { lastProductId: 'p-B' }]);
      }
      return Promise.resolve([]);
    });

    const mod = await import('../src/services/cartRecoveryAnalytics');
    const k = await mod.getCartRecoveryKpis();
    // p-A → 2, p-B → 0 (per the inventory mock). Sum = 2.
    expect(k.recentOrdersLast10m).toBe(2);
  });
});
