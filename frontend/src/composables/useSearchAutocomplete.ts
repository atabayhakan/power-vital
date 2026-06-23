// useSearchAutocomplete — debounced typeahead for admin search inputs.
//
// Why this composable instead of just calling axios from each input?
//   • Centralised debounce + cancel logic — prevents out-of-order
//     responses from overwriting newer matches (see useCursorPagination).
//   • In-memory cache of recent queries (5 most recent) — typing the
//     same prefix twice in a row doesn't hit the network.
//   • Standard `results / loading / error / isOpen` shape so the
//     dropdown markup is identical across admin views.
//
// Usage:
//   const { query, results, loading, error, isOpen } = useSearchAutocomplete<User>({
//     fetcher: (q) => api.get('/admin/search/users', { params: { q } }).then(r => r.data.results)
//   });
//   <input v-model="query" />
//   <div v-if="isOpen"><UserCard v-for="u in results" :user="u" /></div>
import { ref, computed, watch, onUnmounted } from 'vue';
import type { Ref } from 'vue';

/**
 * Response envelope returned by /admin/search/{users,products}:
 *   { results: T[], query: string, total: number }
 */
export interface SearchEnvelope<T> {
  results: T[];
  query: string;
  total: number;
}

export interface UseSearchOptions<T> {
  /** Async fetcher — given the trimmed query, returns the results array. */
  fetcher: (q: string) => Promise<T[]>;
  /** Debounce delay in ms (default 200). */
  debounceMs?: number;
  /** Min query length before firing a request (default 2). */
  minLength?: number;
  /** Max recent-query cache size (default 5). */
  cacheSize?: number;
}

export function useSearchAutocomplete<T>(opts: UseSearchOptions<T>) {
  const debounceMs = opts.debounceMs ?? 200;
  const minLength = opts.minLength ?? 2;
  const cacheSize = opts.cacheSize ?? 5;

  const query = ref('');
  const results = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const error = ref<string | null>(null);
  const isOpen = ref(false);
  let activeReq = 0;
  let debounceTimer: any = null;

  // Simple LRU cache: Map preserves insertion order; we delete + re-set
  // to bump a key to "most recent" on cache hits.
  const cache = new Map<string, T[]>();

  const fetchNow = async (q: string) => {
    const myReq = ++activeReq;
    loading.value = true;
    error.value = null;
    try {
      const data = await opts.fetcher(q);
      if (activeReq !== myReq) return; // stale response — ignore
      results.value = data;
      // Cache the result
      cache.delete(q);
      cache.set(q, data);
      while (cache.size > cacheSize) {
        // Drop the OLDEST entry (Map iteration = insertion order)
        const firstKey = cache.keys().next().value;
        if (firstKey === undefined) break;
        cache.delete(firstKey);
      }
      isOpen.value = data.length > 0;
    } catch (e: any) {
      if (activeReq !== myReq) return;
      error.value = e?.message || String(e);
      results.value = [];
      isOpen.value = false;
    } finally {
      if (activeReq === myReq) loading.value = false;
    }
  };

  // Debounced watcher on the query string.
  watch(query, (newQ) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const trimmed = newQ.trim();
    if (trimmed.length < minLength) {
      results.value = [];
      isOpen.value = false;
      loading.value = false;
      error.value = null;
      return;
    }
    // Cache hit? Skip the network call.
    if (cache.has(trimmed)) {
      results.value = cache.get(trimmed)!;
      isOpen.value = true;
      loading.value = false;
      return;
    }
    debounceTimer = setTimeout(() => fetchNow(trimmed), debounceMs);
  });

  const clear = () => {
    query.value = '';
    results.value = [];
    isOpen.value = false;
    error.value = null;
    if (debounceTimer) clearTimeout(debounceTimer);
  };

  const select = (_item: T) => {
    // Caller-supplied selection — they typically push the item into a
    // selected list or navigate. We just close the dropdown.
    isOpen.value = false;
  };

  // Close the dropdown when the input loses focus, BUT only after a
  // short delay so click handlers on dropdown items have a chance to fire.
  const onBlur = () => setTimeout(() => { isOpen.value = false; }, 150);

  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    activeReq++; // invalidate any in-flight request
  });

  const hasQuery = computed(() => query.value.trim().length >= minLength);

  return {
    query,
    results,
    loading,
    error,
    isOpen,
    hasQuery,
    clear,
    select,
    onBlur
  };
}
