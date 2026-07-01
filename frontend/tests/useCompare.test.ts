// Pure-logic tests for useCompare. Mirrors the useRecentlyViewed
// pattern: hoist localStorage, exercise the composable through
// vi.resetModules, assert the FIFO-with-dedupe + MAX_ITEMS cap.
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

const make = (id: string, name = `P ${id}`, basePriceKgs = 10) => ({
  id, name, imageUrl: '/uploads/x.webp', basePriceKgs
});

beforeEach(() => {
  localStorageMock.clear();
  vi.resetModules();
});

describe('useCompare — add/remove/toggle', () => {
  it('starts empty when localStorage is empty', async () => {
    const mod = await import('../src/composables/useCompare');
    const { recent, count, isEmpty } = mod.useCompare();
    expect(recent.value).toEqual([]);
    expect(count.value).toBe(0);
    expect(isEmpty.value).toBe(true);
  });

  it('add() appends a product to the list', async () => {
    const mod = await import('../src/composables/useCompare');
    const { add, recent } = mod.useCompare();
    add(make('a'));
    add(make('b'));
    expect(recent.value.map(p => p.id)).toEqual(['a', 'b']);
  });

  it('add() returns duplicate=false when the same id is added twice', async () => {
    const mod = await import('../src/composables/useCompare');
    const { add, recent } = mod.useCompare();
    add(make('a'));
    const result = add(make('a'));
    expect(result.added).toBe(false);
    expect(result.reason).toBe('duplicate');
    expect(recent.value.length).toBe(1);
  });

  it('add() refuses beyond MAX_ITEMS (4) and reports reason=full', async () => {
    const mod = await import('../src/composables/useCompare');
    const { add, recent, isFull, max } = mod.useCompare();
    for (let i = 0; i < max; i++) add(make(`p${i}`));
    expect(isFull.value).toBe(true);
    const result = add(make('overflow'));
    expect(result.added).toBe(false);
    expect(result.reason).toBe('full');
    expect(recent.value.length).toBe(max);
  });

  it('toggle() adds when missing, removes when present', async () => {
    const mod = await import('../src/composables/useCompare');
    const { toggle, recent, has } = mod.useCompare();
    const r1 = toggle(make('a'));
    expect(r1.added).toBe(true);
    expect(has('a')).toBe(true);
    const r2 = toggle(make('a'));
    expect(r2.added).toBe(false);
    expect(has('a')).toBe(false);
    expect(recent.value.length).toBe(0);
  });

  it('remove() drops a single product by id', async () => {
    const mod = await import('../src/composables/useCompare');
    const { add, remove, has } = mod.useCompare();
    add(make('a')); add(make('b'));
    remove('a');
    expect(has('a')).toBe(false);
    expect(has('b')).toBe(true);
  });

  it('clear() empties the list and storage', async () => {
    const mod = await import('../src/composables/useCompare');
    const { add, clear, isEmpty } = mod.useCompare();
    add(make('a')); add(make('b'));
    clear();
    expect(isEmpty.value).toBe(true);
    expect(localStorageMock.getItem('pv_compare')).toBe('[]');
  });

  it('persists to localStorage after every mutation', async () => {
    const mod = await import('../src/composables/useCompare');
    const { add } = mod.useCompare();
    add(make('a', 'Vitamin C'));
    const stored = JSON.parse(localStorageMock.getItem('pv_compare') || '[]');
    expect(stored[0].id).toBe('a');
    expect(stored[0].name).toBe('Vitamin C');
  });

  it('reads existing entries back on next use', async () => {
    localStorageMock.setItem('pv_compare', JSON.stringify([
      { id: 'seed', name: 'Seed', imageUrl: '/x.webp', basePriceKgs: 5 }
    ]));
    vi.resetModules();
    const mod = await import('../src/composables/useCompare');
    const { recent, has } = mod.useCompare();
    expect(has('seed')).toBe(true);
    expect(recent.value[0].id).toBe('seed');
  });
});
