// useRecentlyViewed — tracks the last N products a visitor has opened
// in PDP. Persists in localStorage so the strip survives a refresh
// and even an anonymous return visit.
//
// Used by:
//   • ProductDetailView — calls `track(product)` on mount
//   • HomeView / StorefrontView — reads `recent` to render the
//     "Recently viewed" strip
//
// Capacity is intentionally small (8) so localStorage stays light
// and the strip never feels overwhelming. Duplicates move the
// product back to the front (typical "recent activity" UX).
import { ref, computed } from 'vue';

const STORAGE_KEY = 'pv_recently_viewed';
const MAX_ITEMS = 8;

// Module-level shared state so every component that calls
// useRecentlyViewed() sees the same list.
const items = ref<RecentProduct[]>([]);
let initialized = false;

export interface RecentProduct {
  id: string;
  name: string;
  basePriceUsd: number;
  imageUrl: string;
  slug?: string;
  viewedAt: number; // ms epoch
}

const readStored = (): RecentProduct[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
};

const writeStored = (list: RecentProduct[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
  } catch { /* localStorage may be unavailable (private mode, quota) */ }
};

const initializeOnce = () => {
  if (initialized) return;
  initialized = true;
  items.value = readStored();
};

export function useRecentlyViewed() {
  initializeOnce();

  /**
   * Record a product view. If the product is already in the list
   * we move it to the front and update its timestamp + name (the
   * shopper may have re-saved it with a new translation).
   */
  const track = (product: Omit<RecentProduct, 'viewedAt'>): void => {
    if (!product?.id) return;
    const now = Date.now();
    const filtered = items.value.filter((p) => p.id !== product.id);
    const next: RecentProduct[] = [{ ...product, viewedAt: now }, ...filtered].slice(0, MAX_ITEMS);
    items.value = next;
    writeStored(next);
  };

  /**
   * Clear all entries. Exposed for a future "clear history" button
   * (admin tools, GDPR). Currently not wired in the UI.
   */
  const clear = (): void => {
    items.value = [];
    writeStored([]);
  };

  const count = computed(() => items.value.length);
  const recent = computed(() => items.value);
  const isEmpty = computed(() => items.value.length === 0);

  return { recent, count, isEmpty, track, clear, MAX_ITEMS };
}

export default useRecentlyViewed;
