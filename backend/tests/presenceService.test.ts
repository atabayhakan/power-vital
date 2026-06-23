// Pure-logic tests for the presence service. We exercise the
// in-memory map directly (no DB, no HTTP) so the test runs
// instantly and surfaces the actual behaviour of:
//   • dedupe by sessionId
//   • expiry sweep drops stale entries
//   • getAllCounts() sorts descending and only returns > 0
//   • sweep() returns the dropped + remaining counts
import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

describe('presenceService — heartbeat + count', () => {
  it('returns 0 for an unseen product', async () => {
    const mod = await import('../src/services/presenceService');
    expect(mod.getCount('p-1')).toBe(0);
  });

  it('counts a single session as 1', async () => {
    const mod = await import('../src/services/presenceService');
    mod.recordHeartbeat('p-1', 'sess-A');
    expect(mod.getCount('p-1')).toBe(1);
  });

  it('dedupes by sessionId — repeat pings stay at 1', async () => {
    const mod = await import('../src/services/presenceService');
    mod.recordHeartbeat('p-1', 'sess-A');
    mod.recordHeartbeat('p-1', 'sess-A');
    mod.recordHeartbeat('p-1', 'sess-A');
    expect(mod.getCount('p-1')).toBe(1);
  });

  it('counts each unique sessionId separately', async () => {
    const mod = await import('../src/services/presenceService');
    mod.recordHeartbeat('p-1', 'sess-A');
    mod.recordHeartbeat('p-1', 'sess-B');
    mod.recordHeartbeat('p-1', 'sess-C');
    expect(mod.getCount('p-1')).toBe(3);
  });

  it('isolates counts between products', async () => {
    const mod = await import('../src/services/presenceService');
    mod.recordHeartbeat('p-1', 'sess-A');
    mod.recordHeartbeat('p-1', 'sess-B');
    mod.recordHeartbeat('p-2', 'sess-C');
    expect(mod.getCount('p-1')).toBe(2);
    expect(mod.getCount('p-2')).toBe(1);
    expect(mod.getCount('p-3')).toBe(0);
  });

  it('rejects inputs missing the required fields', async () => {
    const mod = await import('../src/services/presenceService');
    // @ts-expect-error testing runtime guard
    expect(mod.recordHeartbeat('', 'sess-A')).toBe(0);
    // @ts-expect-error testing runtime guard
    expect(mod.recordHeartbeat('p-1', '')).toBe(0);
    expect(mod.recordHeartbeat('p-1', 'sess-A')).toBe(1); // still works after invalid
  });

  it('returns the live count from the heartbeat call itself', async () => {
    const mod = await import('../src/services/presenceService');
    expect(mod.recordHeartbeat('p-1', 'sess-A')).toBe(1);
    expect(mod.recordHeartbeat('p-1', 'sess-B')).toBe(2);
    expect(mod.recordHeartbeat('p-2', 'sess-C')).toBe(1);
  });
});

describe('presenceService — expiry sweep', () => {
  it('drops sessions whose lastSeen is older than the timeout', async () => {
    const mod = await import('../src/services/presenceService');
    // Shorten the timeout for a deterministic test.
    const orig = mod.__test.PRESENCE_TIMEOUT_MS;
    mod.__test.PRESENCE_TIMEOUT_MS = 50;

    mod.recordHeartbeat('p-1', 'sess-A');
    mod.recordHeartbeat('p-1', 'sess-B');
    expect(mod.getCount('p-1')).toBe(2);

    // Wait past the timeout
    await new Promise((r) => setTimeout(r, 80));
    // A fresh heartbeat re-arms session-B but leaves session-A stale.
    mod.recordHeartbeat('p-1', 'sess-B');
    expect(mod.getCount('p-1')).toBe(1);

    mod.__test.PRESENCE_TIMEOUT_MS = orig;
  });

  it('sweep() returns the dropped + remaining counts', async () => {
    const mod = await import('../src/services/presenceService');
    const orig = mod.__test.PRESENCE_TIMEOUT_MS;
    mod.__test.PRESENCE_TIMEOUT_MS = 30;

    mod.recordHeartbeat('p-1', 'sess-A');
    mod.recordHeartbeat('p-1', 'sess-B');
    mod.recordHeartbeat('p-2', 'sess-C');
    await new Promise((r) => setTimeout(r, 60));

    const result = mod.sweep();
    expect(result.dropped).toBe(3);
    expect(result.remaining).toBe(0);

    mod.__test.PRESENCE_TIMEOUT_MS = orig;
  });
});

describe('presenceService — getAllCounts', () => {
  it('returns products sorted by count desc, skipping zero counts', async () => {
    const mod = await import('../src/services/presenceService');
    mod.recordHeartbeat('p-A', 's1');
    mod.recordHeartbeat('p-A', 's2');
    mod.recordHeartbeat('p-A', 's3');
    mod.recordHeartbeat('p-B', 's4');
    mod.recordHeartbeat('p-B', 's5');
    mod.recordHeartbeat('p-C', 's6');
    // p-D intentionally has no sessions

    const all = mod.getAllCounts();
    expect(all.length).toBe(3);
    expect(all[0]).toEqual({ productId: 'p-A', count: 3 });
    expect(all[1]).toEqual({ productId: 'p-B', count: 2 });
    expect(all[2]).toEqual({ productId: 'p-C', count: 1 });
  });

  it('returns an empty array when no one is online', async () => {
    const mod = await import('../src/services/presenceService');
    expect(mod.getAllCounts()).toEqual([]);
  });
});
