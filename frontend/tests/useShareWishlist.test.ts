// Pure-logic tests for useShareWishlist. We exercise the URL
// encode/decode + hydrate helpers (the public surface area),
// plus a smoke test for the Vue composable that reads from
// localStorage via useFavorites.
//
// The component itself (modal, QR, channels) is tested through
// a separate DOM test if needed — here we focus on the parts
// that gate correctness: the URL format and the parse-guard
// against malformed input.
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Hoist localStorage so the composable + our helpers work in
// the vitest environment (which otherwise has no DOM).
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => { store[k] = String(v); },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null
};
// @ts-expect-error test shim
globalThis.localStorage = localStorageMock;

// Window.location for the URL builders — we stub it explicitly
// so buildShareUrl returns deterministic values.
const locationStub = { origin: 'https://www.powervital.org' };
(globalThis as any).location = locationStub;

beforeEach(() => {
  localStorageMock.clear();
  vi.resetModules();
});

describe('useShareWishlist — buildShareUrl / hydrateFromUrl', () => {
  it('round-trips a list of favorites', async () => {
    const mod = await import('../src/composables/useShareWishlist');
    const items = [
      { id: 'a', name: 'Vitamin C', imageUrl: '/uploads/x.webp', basePriceKgs: 10, addedAt: 1 },
      { id: 'b', name: 'Omega 3', imageUrl: '', basePriceKgs: 20, addedAt: 2 }
    ];
    const url = mod.buildShareUrl(items);
    expect(url.startsWith('https://www.powervital.org/?w=')).toBe(true);
    const wParam = url.split('?w=')[1];
    const hydrated = mod.hydrateFromUrl(wParam);
    expect(hydrated.length).toBe(2);
    expect(hydrated[0]).toMatchObject({ id: 'a', name: 'Vitamin C', basePriceKgs: 10 });
    expect(hydrated[1]).toMatchObject({ id: 'b', name: 'Omega 3', basePriceKgs: 20 });
  });

  it('returns an empty list when the URL has no w param', async () => {
    const mod = await import('../src/composables/useShareWishlist');
    expect(mod.hydrateFromUrl(null)).toEqual([]);
    expect(mod.hydrateFromUrl(undefined)).toEqual([]);
    expect(mod.hydrateFromUrl('')).toEqual([]);
  });

  it('returns an empty list on malformed base64 / JSON (no throw)', async () => {
    const mod = await import('../src/composables/useShareWishlist');
    expect(mod.hydrateFromUrl('w1.garbage###')).toEqual([]);
    expect(mod.hydrateFromUrl('w1.!!!not-base64!!!')).toEqual([]);
    // Not an array after parsing
    expect(mod.hydrateFromUrl('w1.' + btoa('"a string"'))).toEqual([]);
  });

  it('ignores items that are missing the id field', async () => {
    const mod = await import('../src/composables/useShareWishlist');
    const arr = [
      { i: 'ok-1', n: 'Good', u: '', p: 1 },
      { i: '', n: 'Empty id', u: '', p: 2 },         // rejected
      { n: 'No id at all', u: '', p: 3 },             // rejected
      { i: 'ok-2', n: 'Second', u: '', p: 4 }
    ];
    const url = `https://x.com/?w=w1.${btoa(JSON.stringify(arr))}`;
    const wParam = url.split('?w=')[1];
    const hydrated = mod.hydrateFromUrl(wParam);
    expect(hydrated.length).toBe(2);
    expect(hydrated.map((h: any) => h.id)).toEqual(['ok-1', 'ok-2']);
  });

  it('rejects unknown versions of the share param', async () => {
    const mod = await import('../src/composables/useShareWishlist');
    const payload = btoa(JSON.stringify([{ i: 'a', n: 'X', u: '', p: 1 }]));
    // v2 instead of w1
    const hydrated = mod.hydrateFromUrl(`v2.${payload}`);
    expect(hydrated).toEqual([]);
  });

  it('buildShareUrl returns just the origin when the list is empty', async () => {
    const mod = await import('../src/composables/useShareWishlist');
    const url = mod.buildShareUrl([], 'https://www.powervital.org');
    expect(url).toBe('https://www.powervital.org');
  });
});

describe('useFavorites — localStorage round-trip', () => {
  it('persists and re-hydrates across instances', async () => {
    const mod = await import('../src/composables/useFavorites');
    const f1 = mod.useFavorites();
    f1.add({ id: 'a', name: 'A', imageUrl: '', basePriceKgs: 1 });
    f1.add({ id: 'b', name: 'B', imageUrl: '', basePriceKgs: 2 });
    expect(f1.count.value).toBe(2);

    vi.resetModules();
    const mod2 = await import('../src/composables/useFavorites');
    const f2 = mod2.useFavorites();
    expect(f2.count.value).toBe(2);
    expect(f2.has('a')).toBe(true);
    expect(f2.has('b')).toBe(true);
  });

  it('toggle() returns added=true the first time, added=false the second', async () => {
    const mod = await import('../src/composables/useFavorites');
    const f = mod.useFavorites();
    const r1 = f.toggle({ id: 'x', name: 'X', imageUrl: '', basePriceKgs: 0 });
    expect(r1.added).toBe(true);
    const r2 = f.toggle({ id: 'x', name: 'X', imageUrl: '', basePriceKgs: 0 });
    expect(r2.added).toBe(false);
    expect(f.count.value).toBe(0);
  });

  it('hydrate() merges incoming items with pre-existing ones', async () => {
    const mod = await import('../src/composables/useFavorites');
    const f = mod.useFavorites();
    f.add({ id: 'a', name: 'A', imageUrl: '', basePriceKgs: 1 });
    const total = f.hydrate([
      { id: 'b', name: 'B', imageUrl: '', basePriceKgs: 2 },
      { id: 'a', name: 'A-updated', imageUrl: '', basePriceKgs: 99 }
    ]);
    expect(total).toBe(2);
    expect(f.has('a')).toBe(true);
    expect(f.has('b')).toBe(true);
  });
});
