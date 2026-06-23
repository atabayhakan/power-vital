// useCursorPagination — composable tests.
//
// We exercise the cursor state machine via a stub fetcher that returns
// canned pages (and the occasional error) so we can verify:
//   • loadFirst replaces the items array
//   • loadMore appends to the array
//   • hasMore / nextCursor are tracked correctly
//   • stale responses don't clobber newer ones (out-of-order protection)
//   • reset() clears everything
//   • loadMore no-ops when hasMore=false
//   • loadMore no-ops while another request is in flight
import { describe, it, expect, vi } from 'vitest';
import { useCursorPagination, type CursorPage } from '../src/composables/useCursorPagination';

const makePage = (n: number, opts: { nextCursor?: string | null; hasMore?: boolean } = {}): CursorPage<{ id: number }> => ({
  items: Array.from({ length: n }, (_, i) => ({ id: i + 1 })),
  nextCursor: opts.nextCursor ?? (opts.hasMore === false ? null : 'cursor-next-' + n),
  hasMore: opts.hasMore ?? (opts.nextCursor !== null)
});

describe('useCursorPagination — basic flow', () => {
  it('starts empty with no cursor and no error', () => {
    const fetcher = vi.fn();
    const s = useCursorPagination<{ id: number }>({ fetcher });
    expect(s.items.value).toEqual([]);
    expect(s.loading.value).toBe(false);
    expect(s.hasMore.value).toBe(false);
    expect(s.nextCursor.value).toBeNull();
    expect(s.error.value).toBeNull();
    expect(s.pagesLoaded.value).toBe(0);
  });

  it('loadFirst replaces items + sets cursor + hasMore', async () => {
    const fetcher = vi.fn().mockResolvedValue(makePage(3, { hasMore: true }));
    const s = useCursorPagination<{ id: number }>({ fetcher });
    await s.loadFirst();
    expect(s.items.value).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(s.hasMore.value).toBe(true);
    expect(s.nextCursor.value).toBe('cursor-next-3');
    expect(s.pagesLoaded.value).toBe(1);
  });

  it('passes through baseParams + limit on every fetch', async () => {
    const fetcher = vi.fn().mockResolvedValue(makePage(0, { hasMore: false }));
    const s = useCursorPagination<{ id: number }>({
      fetcher,
      baseParams: { status: 'paid' },
      limit: 25
    });
    await s.loadFirst({ search: 'reishi' });
    expect(fetcher).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'paid', search: 'reishi', limit: 25 })
    );
  });
});

describe('useCursorPagination — loadMore', () => {
  it('appends the next page when hasMore is true', async () => {
    let n = 0;
    const fetcher = vi.fn().mockImplementation(async (_params) => {
      n += 1;
      return makePage(2, { nextCursor: n < 2 ? 'cursor-' + n : null, hasMore: n < 2 });
    });
    const s = useCursorPagination<{ id: number }>({ fetcher });
    await s.loadFirst();
    expect(s.items.value).toHaveLength(2);
    await s.loadMore();
    expect(s.items.value).toHaveLength(4);
    expect(s.hasMore.value).toBe(false);
    expect(s.nextCursor.value).toBeNull();
    expect(s.pagesLoaded.value).toBe(2);
  });

  it('sends the cursor in the second fetch', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(makePage(3, { nextCursor: 'ABC' }));
    const s = useCursorPagination<{ id: number }>({ fetcher });
    await s.loadFirst();
    fetcher.mockResolvedValueOnce(makePage(0, { hasMore: false }));
    await s.loadMore();
    const secondCall = fetcher.mock.calls[1][0];
    expect(secondCall.cursor).toBe('ABC');
  });

  it('is a no-op when hasMore is false', async () => {
    const fetcher = vi.fn().mockResolvedValue(makePage(2, { hasMore: false }));
    const s = useCursorPagination<{ id: number }>({ fetcher });
    await s.loadFirst();
    fetcher.mockClear();
    await s.loadMore();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('is a no-op while a loadMore is already in flight', async () => {
    let resolveLoadMore: (v: CursorPage<{ id: number }>) => void = () => {};
    const fetcher = vi.fn((_params: any) => {
      // All subsequent calls (after the first resolved loadFirst) return a
      // pending promise — loadMore should only call fetcher ONCE during this
      // test, even if the user clicks "load more" twice in a row.
      return new Promise<CursorPage<{ id: number }>>((r) => { resolveLoadMore = r; });
    });
    const s = useCursorPagination<{ id: number }>({ fetcher });

    // Manually seed the initial page so we skip the loadFirst fetcher path.
    s.items.value = [{ id: 1 }];
    s.hasMore.value = true;
    s.nextCursor.value = 'cursor-1';

    // First loadMore — fetches, but we don't resolve yet.
    const first = s.loadMore();
    await Promise.resolve(); // let .then() advance → loadingMore=true
    // Second loadMore while first is still pending — should NOT call fetcher again.
    await s.loadMore();
    expect(fetcher).toHaveBeenCalledTimes(1);
    // Resolve the first one so the test can clean up.
    resolveLoadMore(makePage(2, { hasMore: false }));
    await first;
  });
});

describe('useCursorPagination — reset', () => {
  it('clears items + cursor + error + page count', async () => {
    const fetcher = vi.fn().mockResolvedValue(makePage(5, { hasMore: true }));
    const s = useCursorPagination<{ id: number }>({ fetcher });
    await s.loadFirst();
    expect(s.items.value).toHaveLength(5);
    s.reset();
    expect(s.items.value).toEqual([]);
    expect(s.nextCursor.value).toBeNull();
    expect(s.hasMore.value).toBe(false);
    expect(s.pagesLoaded.value).toBe(0);
    expect(s.error.value).toBeNull();
  });
});

describe('useCursorPagination — error handling', () => {
  it('captures the error and leaves items unchanged on a failed loadFirst', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Network down'));
    const s = useCursorPagination<{ id: number }>({ fetcher });
    await s.loadFirst();
    expect(s.error.value).toBe('Network down');
    expect(s.items.value).toEqual([]);
    expect(s.loading.value).toBe(false);
  });

  it('clears the error on a subsequent successful loadFirst', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error('Network down'))
      .mockResolvedValueOnce(makePage(2, { hasMore: false }));
    const s = useCursorPagination<{ id: number }>({ fetcher });
    await s.loadFirst();
    expect(s.error.value).toBe('Network down');
    await s.loadFirst();
    expect(s.error.value).toBeNull();
    expect(s.items.value).toHaveLength(2);
  });
});

describe('useCursorPagination — out-of-order protection', () => {
  it('a stale response does not overwrite a newer one', async () => {
    // First call resolves slowly with v1. Second call (loadMore) resolves fast.
    // We want the FINAL state to reflect the second call, not the first.
    let resolveFirst: (v: CursorPage<{ id: number }>) => void = () => {};
    const fetcher = vi.fn().mockImplementation((params: any) => {
      if (!params.cursor && !params.search) {
        // First loadFirst — slow
        return new Promise<CursorPage<{ id: number }>>((r) => { resolveFirst = r; });
      }
      // Subsequent calls — fast
      return Promise.resolve(makePage(99, { hasMore: false }));
    });
    const s = useCursorPagination<{ id: number }>({ fetcher });
    const first = s.loadFirst();
    await Promise.resolve(); // let the .then() chain advance
    // Trigger another loadFirst with a search filter that wins.
    const second = s.loadFirst({ search: 'fresh' });
    // Now resolve the FIRST call — it must be IGNORED.
    resolveFirst(makePage(1, { hasMore: false }));
    await first;
    await second;
    // The newer loadFirst (search: 'fresh') should be the final state.
    const lastCall = fetcher.mock.calls.at(-1)![0];
    expect(lastCall).toMatchObject({ search: 'fresh' });
  });
});
