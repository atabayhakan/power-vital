// Pure-logic tests for the inventory service. We exercise the
// in-memory map directly (no DB, no HTTP) so the test runs
// instantly and surfaces the actual semantics of:
//   • soft-reservation dedupe by (session, product)
//   • available = dbStock - sum(active reservations)
//   • release() drops just the matching reservation
//   • recordOrder() powers the FOMO ring buffer
//   • cleanup() drops expired reservations AND old orders
import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

describe('inventoryService — reserve + getAvailability', () => {
  it('returns the full dbStock when no reservations are held', async () => {
    const mod = await import('../src/services/inventoryService');
    expect(mod.getAvailability('p-1', 10)).toEqual({ available: 10, reserved: 0 });
  });

  it('subtracts the reserved qty from available', async () => {
    const mod = await import('../src/services/inventoryService');
    const r = mod.reserve('p-1', 2, 'sess-A', 10);
    expect(r).toEqual({ available: 8, reserved: 2 });
  });

  it('sums reservations across multiple sessions', async () => {
    const mod = await import('../src/services/inventoryService');
    mod.reserve('p-1', 2, 'sess-A', 10);
    mod.reserve('p-1', 3, 'sess-B', 10);
    const r = mod.reserve('p-1', 1, 'sess-C', 10);
    expect(r).toEqual({ available: 4, reserved: 6 });
  });

  it('dedupes by (session, product) — same session + product replaces qty', async () => {
    const mod = await import('../src/services/inventoryService');
    mod.reserve('p-1', 1, 'sess-A', 10);
    mod.reserve('p-1', 3, 'sess-A', 10);
    expect(mod.getAvailability('p-1', 10)).toEqual({ available: 7, reserved: 3 });
  });

  it('isolates products — reservations on p-1 do not affect p-2', async () => {
    const mod = await import('../src/services/inventoryService');
    mod.reserve('p-1', 5, 'sess-A', 10);
    expect(mod.getAvailability('p-2', 10)).toEqual({ available: 10, reserved: 0 });
  });

  it('release() drops a single (session, product) reservation', async () => {
    const mod = await import('../src/services/inventoryService');
    mod.reserve('p-1', 3, 'sess-A', 10);
    mod.reserve('p-1', 2, 'sess-B', 10);
    mod.release('p-1', 'sess-A', 10);
    expect(mod.getAvailability('p-1', 10)).toEqual({ available: 8, reserved: 2 });
  });

  it('releaseSession() drops all reservations for the session', async () => {
    const mod = await import('../src/services/inventoryService');
    mod.reserve('p-1', 1, 'sess-A', 10);
    mod.reserve('p-2', 2, 'sess-A', 10);
    mod.reserve('p-3', 3, 'sess-B', 10);
    mod.releaseSession('sess-A');
    expect(mod.getAvailability('p-1', 10).reserved).toBe(0);
    expect(mod.getAvailability('p-2', 10).reserved).toBe(0);
    expect(mod.getAvailability('p-3', 10).reserved).toBe(3);
  });

  it('clamps available to >= 0 even when reservations exceed stock', async () => {
    const mod = await import('../src/services/inventoryService');
    mod.reserve('p-1', 5, 'sess-A', 3);
    mod.reserve('p-1', 5, 'sess-B', 3);
    expect(mod.getAvailability('p-1', 3).available).toBe(0);
    expect(mod.getAvailability('p-1', 3).reserved).toBe(10);
  });

  it('rejects malformed inputs gracefully', async () => {
    const mod = await import('../src/services/inventoryService');
    // @ts-expect-error runtime guard
    expect(mod.reserve('', 1, 'sess', 10).available).toBe(10);
    // @ts-expect-error runtime guard
    expect(mod.reserve('p-1', -1, 'sess', 10).available).toBe(10);
    // @ts-expect-error runtime guard
    expect(mod.reserve('p-1', 1, '', 10).available).toBe(10);
  });

  it('drops expired reservations during getAvailability', async () => {
    const mod = await import('../src/services/inventoryService');
    const orig = mod.__test.RESERVATION_TTL_MS;
    mod.__test.RESERVATION_TTL_MS = 30;

    mod.reserve('p-1', 5, 'sess-A', 10);
    expect(mod.getAvailability('p-1', 10).reserved).toBe(5);
    await new Promise((r) => setTimeout(r, 60));
    expect(mod.getAvailability('p-1', 10).reserved).toBe(0);
    expect(mod.getAvailability('p-1', 10).available).toBe(10);

    mod.__test.RESERVATION_TTL_MS = orig;
  });
});

describe('inventoryService — FOMO ring buffer', () => {
  it('counts orders within the window', async () => {
    const mod = await import('../src/services/inventoryService');
    mod.recordOrder('p-1', Date.now() - 5 * 60 * 1000);
    mod.recordOrder('p-1', Date.now() - 2 * 60 * 1000);
    mod.recordOrder('p-1', Date.now() - 30 * 1000);
    expect(mod.recentOrderCount('p-1', 10 * 60 * 1000)).toBe(3);
  });

  it('ignores orders outside the window', async () => {
    const mod = await import('../src/services/inventoryService');
    mod.recordOrder('p-1', Date.now() - 60 * 60 * 1000); // 1h ago
    mod.recordOrder('p-1', Date.now() - 2 * 60 * 1000);   // 2min ago
    expect(mod.recentOrderCount('p-1', 10 * 60 * 1000)).toBe(1);
  });

  it('returns the most recent order timestamp', async () => {
    const mod = await import('../src/services/inventoryService');
    const t1 = Date.now() - 1000;
    const t2 = Date.now() - 500;
    const t3 = Date.now() - 100;
    mod.recordOrder('p-1', t1);
    mod.recordOrder('p-1', t2);
    mod.recordOrder('p-1', t3);
    expect(mod.lastOrderAt('p-1')).toBe(t3);
  });

  it('returns null when no orders exist', async () => {
    const mod = await import('../src/services/inventoryService');
    expect(mod.lastOrderAt('nonexistent')).toBeNull();
    expect(mod.recentOrderCount('nonexistent')).toBe(0);
  });

  it('cleanup() drops orders older than 7 days', async () => {
    const mod = await import('../src/services/inventoryService');
    mod.recordOrder('p-1', Date.now() - 8 * 24 * 60 * 60 * 1000); // 8d ago
    mod.recordOrder('p-1', Date.now() - 1000);                        // recent
    const result = mod.__test.cleanup();
    expect(result.ordersDropped).toBeGreaterThanOrEqual(1);
    expect(mod.recentOrderCount('p-1', 30 * 24 * 60 * 60 * 1000)).toBe(1);
  });
});

describe('inventoryService — full lifecycle', () => {
  it('cart-add → cart-remove restores the original availability', async () => {
    const mod = await import('../src/services/inventoryService');
    mod.reserve('p-1', 1, 'sess-A', 10);
    mod.reserve('p-1', 1, 'sess-B', 10);
    expect(mod.getAvailability('p-1', 10).available).toBe(8);

    // "Sess-A" removes the item from their cart
    mod.release('p-1', 'sess-A', 10);
    expect(mod.getAvailability('p-1', 10).available).toBe(9);

    // "Sess-B" completes checkout — release the whole session
    mod.releaseSession('sess-B');
    expect(mod.getAvailability('p-1', 10).available).toBe(10);

    // Sess-A buys → record an order → FOMO counter ticks up
    mod.recordOrder('p-1');
    expect(mod.recentOrderCount('p-1', 10 * 60 * 1000)).toBe(1);
  });
});
