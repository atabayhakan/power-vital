// Pure-logic tests for useRecentlyViewed. We mock localStorage and
// verify the FIFO-with-dedupe + cap-at-8 behaviour that the home
// page strip depends on.
import { describe, it, expect, beforeEach, vi } from 'vitest';

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

// We need to reset the module-level shared state between describes
// because the composable caches its initial value from localStorage.
vi.resetModules();

const make = (id: string, name = `Product ${id}`, basePriceUsd = 10, imageUrl = '/uploads/x.webp') => ({
  id, name, basePriceUsd, imageUrl
});

describe('useRecentlyViewed — track + persistence', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.resetModules();
  });

  it('starts empty when localStorage is empty', async () => {
    const mod = await import('../src/composables/useRecentlyViewed');
    const { recent, isEmpty, count } = mod.useRecentlyViewed();
    expect(recent.value).toEqual([]);
    expect(isEmpty.value).toBe(true);
    expect(count.value).toBe(0);
  });

  it('appends new items to the front of the list', async () => {
    const mod = await import('../src/composables/useRecentlyViewed');
    const { track, recent } = mod.useRecentlyViewed();
    track(make('a'));
    track(make('b'));
    expect(recent.value.map(p => p.id)).toEqual(['b', 'a']);
  });

  it('moves an already-tracked product back to the front', async () => {
    const mod = await import('../src/composables/useRecentlyViewed');
    const { track, recent } = mod.useRecentlyViewed();
    track(make('a'));
    track(make('b'));
    track(make('c'));
    track(make('a')); // re-view a
    expect(recent.value.map(p => p.id)).toEqual(['a', 'c', 'b']);
  });

  it('caps the list at 8 items (MAX_ITEMS)', async () => {
    const mod = await import('../src/composables/useRecentlyViewed');
    const { track, recent } = mod.useRecentlyViewed();
    for (let i = 0; i < 12; i++) {
      track(make(`p${i}`));
    }
    expect(recent.value.length).toBe(8);
    // Most recent first
    expect(recent.value[0].id).toBe('p11');
    expect(recent.value[7].id).toBe('p4');
  });

  it('persists to localStorage', async () => {
    const mod = await import('../src/composables/useRecentlyViewed');
    const { track } = mod.useRecentlyViewed();
    track(make('a', 'Vitamin C'));
    const stored = JSON.parse(localStorageMock.getItem('pv_recently_viewed') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].id).toBe('a');
    expect(stored[0].name).toBe('Vitamin C');
  });

  it('reads existing entries back on next use', async () => {
    // Pre-seed storage and import a fresh module to simulate a new visit
    localStorageMock.setItem('pv_recently_viewed', JSON.stringify([
      { id: 'seed1', name: 'Seed 1', basePriceUsd: 5, imageUrl: '/x.webp', viewedAt: 1 }
    ]));
    vi.resetModules();
    const mod = await import('../src/composables/useRecentlyViewed');
    const { recent } = mod.useRecentlyViewed();
    expect(recent.value.length).toBe(1);
    expect(recent.value[0].id).toBe('seed1');
  });

  it('clear() empties the list and storage', async () => {
    const mod = await import('../src/composables/useRecentlyViewed');
    const { track, clear, isEmpty, recent } = mod.useRecentlyViewed();
    track(make('a'));
    track(make('b'));
    expect(recent.value.length).toBe(2);
    clear();
    expect(isEmpty.value).toBe(true);
    expect(localStorageMock.getItem('pv_recently_viewed')).toBe('[]');
  });

  it('ignores products without an id', async () => {
    const mod = await import('../src/composables/useRecentlyViewed');
    const { track, recent } = mod.useRecentlyViewed();
    // @ts-expect-error testing runtime guard
    track({ id: '', name: 'broken', basePriceUsd: 1, imageUrl: '' });
    expect(recent.value.length).toBe(0);
  });

  it('records viewedAt timestamp in ms epoch', async () => {
    const mod = await import('../src/composables/useRecentlyViewed');
    const { track, recent } = mod.useRecentlyViewed();
    const before = Date.now();
    track(make('a'));
    const after = Date.now();
    expect(recent.value[0].viewedAt).toBeGreaterThanOrEqual(before);
    expect(recent.value[0].viewedAt).toBeLessThanOrEqual(after);
  });
});
