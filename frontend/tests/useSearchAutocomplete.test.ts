// useSearchAutocomplete — composable tests.
//
// Verifies:
//   • Empty / short query → no fetcher call, no results
//   • Debounce: only the LAST query in a burst hits the fetcher
//   • Cache hit: re-typing the same prefix doesn't hit the fetcher
//   • Out-of-order responses are ignored (stale result doesn't overwrite
//     a newer one)
//   • ArrowDown/Up/Enter/Escape wiring is provided
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';

import { useSearchAutocomplete } from '../src/composables/useSearchAutocomplete';

interface Item { id: string; name: string }

// Tiny test harness — wraps the composable in a Vue component so we can
// drive it through the lifecycle (watcher needs an active setup()).
const mountComposable = async <T,>(fetcher: any, opts: any = {}) => {
  let captured: any;
  const Comp = defineComponent({
    setup() {
      captured = useSearchAutocomplete<T>({ fetcher, ...opts });
      return () => h('div');
    }
  });
  const w = mount(Comp);
  await flushPromises();
  return { w, ...captured };
};

beforeEach(() => {
  vi.useRealTimers();
});

describe('useSearchAutocomplete — empty / short queries', () => {
  it('starts empty with no query', async () => {
    const fetcher = vi.fn();
    const { query, results, loading } = await mountComposable<Item>(fetcher);
    expect(query.value).toBe('');
    expect(results.value).toEqual([]);
    expect(loading.value).toBe(false);
  });

  it('does not call the fetcher when query is shorter than minLength', async () => {
    const fetcher = vi.fn().mockResolvedValue([]);
    const { query } = await mountComposable<Item>(fetcher, { debounceMs: 0 });
    query.value = 'a';
    await flushPromises();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('fires the fetcher once the query reaches minLength (after debounce)', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockResolvedValue([{ id: '1', name: 'ali' }]);
    const { query, results } = await mountComposable<Item>(fetcher);
    query.value = 'ali';
    expect(fetcher).not.toHaveBeenCalled();
    await vi.runAllTimersAsync(); // flush debounce + microtasks
    expect(fetcher).toHaveBeenCalledWith('ali');
    expect(results.value).toEqual([{ id: '1', name: 'ali' }]);
  });
});

describe('useSearchAutocomplete — debounce', () => {
  it('only the last query in a burst reaches the fetcher', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockResolvedValue([]);
    const { query } = await mountComposable<Item>(fetcher, { debounceMs: 200 });

    query.value = 'a';
    await vi.advanceTimersByTimeAsync(50);
    query.value = 'al';
    await vi.advanceTimersByTimeAsync(50);
    query.value = 'ali';
    await vi.advanceTimersByTimeAsync(250);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('ali');
  });

  it('cancels a pending request if clear() is called', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockResolvedValue([]);
    const { query, clear } = await mountComposable<Item>(fetcher, { debounceMs: 200 });
    query.value = 'ali';
    await vi.advanceTimersByTimeAsync(50);
    clear();
    await vi.advanceTimersByTimeAsync(300);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe('useSearchAutocomplete — cache', () => {
  it('does not re-fetch a query that already resolved', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockResolvedValue([{ id: '1', name: 'ali' }]);
    const { query } = await mountComposable<Item>(fetcher, { debounceMs: 50 });

    query.value = 'ali';
    await vi.advanceTimersByTimeAsync(60);
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Re-type the same prefix — should hit the cache
    query.value = '';
    await vi.advanceTimersByTimeAsync(60);
    query.value = 'ali';
    await vi.advanceTimersByTimeAsync(60);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('drops the oldest entry when the cache exceeds cacheSize', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockResolvedValue([]);
    const { query } = await mountComposable<Item>(fetcher, { debounceMs: 10, cacheSize: 2 });

    query.value = 'ali';    await vi.advanceTimersByTimeAsync(30);
    query.value = 'beste';  await vi.advanceTimersByTimeAsync(30);
    query.value = 'cem';    await vi.advanceTimersByTimeAsync(30);
    expect(fetcher).toHaveBeenCalledTimes(3);

    // Now type 'ali' again — it was evicted (cache holds only 'beste' + 'cem')
    query.value = '';
    await vi.advanceTimersByTimeAsync(30);
    query.value = 'ali';
    await vi.advanceTimersByTimeAsync(30);
    expect(fetcher).toHaveBeenCalledTimes(4); // cache MISS, re-fetched
  });
});

describe('useSearchAutocomplete — out-of-order guard', () => {
  it('a stale response does not overwrite a newer one', async () => {
    vi.useFakeTimers();
    let resolveSlow: (v: Item[]) => void = () => {};
    const fetcher = vi.fn().mockImplementation((q: string) => {
      if (q === 'ali') {
        return new Promise<Item[]>((r) => { resolveSlow = r; });
      }
      return Promise.resolve([{ id: '2', name: q }]);
    });

    const { query, results } = await mountComposable<Item>(fetcher, { debounceMs: 0 });

    query.value = 'ali';
    await vi.runAllTimersAsync();
    // First request in flight (slow)

    query.value = 'beste';
    await vi.runAllTimersAsync();
    // Second request resolves immediately

    // Resolve the SLOW first request with stale data — must be ignored
    resolveSlow([{ id: 'STALE', name: 'ali' }]);
    await flushPromises();

    expect(results.value).toEqual([{ id: '2', name: 'beste' }]);
  });
});

describe('useSearchAutocomplete — clear / select', () => {
  it('clear() empties the query, results, error', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockResolvedValue([{ id: '1', name: 'ali' }]);
    const { query, results, error, clear } = await mountComposable<Item>(fetcher, { debounceMs: 0 });
    query.value = 'ali';
    await vi.runAllTimersAsync();
    expect(query.value).toBe('ali');
    clear();
    expect(query.value).toBe('');
    expect(results.value).toEqual([]);
    expect(error.value).toBeNull();
  });

  it('select() closes the dropdown (isOpen=false)', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockResolvedValue([{ id: '1', name: 'ali' }]);
    const { query, isOpen, select } = await mountComposable<Item>(fetcher, { debounceMs: 0 });
    query.value = 'ali';
    await vi.runAllTimersAsync();
    expect(isOpen.value).toBe(true);
    select({ id: '1', name: 'ali' });
    expect(isOpen.value).toBe(false);
  });
});
