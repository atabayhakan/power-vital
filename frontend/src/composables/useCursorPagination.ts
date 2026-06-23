// useCursorPagination — incremental page loader for admin lists.
//
// Backend returns { items, nextCursor, hasMore } (cursor-based envelope).
// The composable owns:
//   • the accumulated list
//   • the loading / "loading more" flags
//   • error state
//   • a `loadMore()` that appends the next page
//   • a `reset()` for search/filter changes
//
// It does NOT auto-load on scroll — that's a UX concern the view layer
// should add via IntersectionObserver if it wants infinite scroll.
//
// Why a dedicated composable?
//   • Keeps the same boilerplate (ref, flag, error, abort) out of every
//     admin list view (orders, users, reviews, broadcasts, etc).
//   • Single place to fix pagination bugs / race conditions.
//   • Testable in isolation — no axios, no Vue components required.
import { ref, computed, type Ref } from 'vue';

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CursorPaginationOptions {
  /** Default page size (sent as ?limit=). */
  limit?: number;
  /** Extra query params merged into every fetch (e.g. search, filters). */
  baseParams?: Record<string, any>;
}

export interface CursorPaginationState<T> {
  /** All accumulated items across pages. */
  items: Ref<T[]>;
  /** True while the FIRST page is loading (useItems.length === 0). */
  loading: Ref<boolean>;
  /** True while a SUBSEQUENT page is loading (appending). */
  loadingMore: Ref<boolean>;
  /** Last error message (cleared on the next successful fetch). */
  error: Ref<string | null>;
  /** True if the backend says there are more pages. */
  hasMore: Ref<boolean>;
  /** The raw cursor token for the next page (null when done). */
  nextCursor: Ref<string | null>;
  /** Total page count seen so far (for "Page 3 of N" indicators). */
  pagesLoaded: Ref<number>;

  /** Fetch the first page (replaces items). Pass extraParams for one-offs. */
  loadFirst: (extraParams?: Record<string, any>) => Promise<void>;
  /** Fetch the next page using the current cursor (appends to items). */
  loadMore: () => Promise<void>;
  /** Reset state so the next loadFirst() starts fresh. */
  reset: () => void;
}

/**
 * Factory — returns reactive state + action methods for a cursor-paginated
 * list. The `fetcher` is provided by the caller so this composable stays
 * axios-agnostic (tested with a stub fetch).
 *
 * Usage:
 *   const list = useCursorPagination<Product>({
 *     fetcher: async (params) => (await api.get('/admin/products', { params })).data
 *   });
 *   onMounted(() => list.loadFirst({ search: 'reishi' }));
 */
export function useCursorPagination<T>(
  opts: {
    fetcher: (params: Record<string, any>) => Promise<CursorPage<T>>;
  } & CursorPaginationOptions
): CursorPaginationState<T> {
  const defaultLimit = opts.limit ?? 50;

  const items = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const loadingMore = ref(false);
  const error = ref<string | null>(null);
  const hasMore = ref(false);
  const nextCursor = ref<string | null>(null);
  const pagesLoaded = ref(0);

  // Guard against out-of-order responses (the user clicked loadMore twice,
  // older request resolves last → would clobber the newer page). We tag
  // each request with a monotonic id and ignore stale ones.
  let reqId = 0;
  let activeReq = 0;

  const fetchPage = async (cursor: string | null, replace: boolean, extraParams?: Record<string, any>) => {
    const myReq = ++reqId;
    activeReq = myReq;

    if (replace) loading.value = true; else loadingMore.value = true;
    error.value = null;

    const params: Record<string, any> = {
      ...(opts.baseParams ?? {}),
      ...(extraParams ?? {}),
      limit: defaultLimit
    };
    if (cursor) params.cursor = cursor;

    try {
      const page = await opts.fetcher(params);
      // Stale response — newer request has already updated state.
      if (activeReq !== myReq) return;

      if (replace) {
        items.value = page.items;
        pagesLoaded.value = 1;
      } else {
        items.value = items.value.concat(page.items);
        pagesLoaded.value += 1;
      }
      nextCursor.value = page.nextCursor;
      hasMore.value = page.hasMore;
    } catch (e: any) {
      if (activeReq !== myReq) return;
      error.value = e?.message || String(e);
    } finally {
      if (activeReq === myReq) {
        loading.value = false;
        loadingMore.value = false;
      }
    }
  };

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    nextCursor,
    pagesLoaded,
    loadFirst: (extraParams) => fetchPage(null, true, extraParams),
    loadMore: (): Promise<void> => {
      if (!hasMore.value || loadingMore.value || loading.value) return Promise.resolve();
      return fetchPage(nextCursor.value, false);
    },
    reset: () => {
      items.value = [];
      nextCursor.value = null;
      hasMore.value = false;
      error.value = null;
      pagesLoaded.value = 0;
    }
  };
}

/**
 * Convenience computed: "can we ask for more right now?" — false while a
 * request is in flight, when there's nothing left, or when the list is
 * empty (nothing to paginate yet).
 */
export const canLoadMore = (state: CursorPaginationState<any>) =>
  computed(() => state.hasMore.value && !state.loadingMore.value && !state.loading.value);
