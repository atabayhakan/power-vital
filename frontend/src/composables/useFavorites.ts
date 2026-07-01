// useFavorites — central source of truth for the visitor's
// wishlist. Mirrors the useCompare / useRecentlyViewed pattern:
// module-level shared state backed by localStorage so every
// component on the page sees the same list.
//
// Distinct from useCompare:
//   • favorites are unbounded (useCompare caps at 4)
//   • favorites persist forever (useRecentlyViewed caps at 8)
//   • favorites are PERSISTED + shareable (see useShareWishlist)
import { ref, computed, onMounted } from 'vue';

const STORAGE_KEY = 'pv_favorites';

export interface FavoriteItem {
  id: string;
  name: string;
  imageUrl: string;
  basePriceKgs: number;
  addedAt: number; // ms epoch — used to keep the list chronologically ordered
}

const items = ref<FavoriteItem[]>([]);
let initialized = false;

const readStored = (): FavoriteItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((i: any) => i && typeof i.id === 'string')
      .map((i: any) => ({
        id: i.id,
        name: String(i.name || ''),
        imageUrl: String(i.imageUrl || ''),
        basePriceKgs: Number(i.basePriceKgs) || 0,
        addedAt: Number(i.addedAt) || Date.now()
      }));
  } catch {
    return [];
  }
};

const writeStored = (list: FavoriteItem[]): void => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* noop */ }
};

const initializeOnce = () => {
  if (initialized) return;
  initialized = true;
  if (typeof window === 'undefined') return;
  items.value = readStored();
};

export function useFavorites() {
  // Always run the initialiser so non-component callers (e.g.
  // tests) get the same hydrated state as a mounted component.
  // `onMounted` is a no-op outside a component setup() but
  // doesn't throw, so we can call it unconditionally too.
  initializeOnce();
  if (typeof window !== 'undefined') {
    onMounted(initializeOnce);
  }

  const has = (id: string): boolean => items.value.some((i) => i.id === id);
  const count = computed(() => items.value.length);
  const isEmpty = computed(() => items.value.length === 0);
  const recent = computed(() => items.value);

  const add = (product: Omit<FavoriteItem, 'addedAt'>): void => {
    if (!product?.id) return;
    if (has(product.id)) return;
    const next = [...items.value, { ...product, addedAt: Date.now() }];
    items.value = next;
    writeStored(next);
  };

  const remove = (id: string): void => {
    const next = items.value.filter((i) => i.id !== id);
    items.value = next;
    writeStored(next);
  };

  const toggle = (product: Omit<FavoriteItem, 'addedAt'>): { added: boolean } => {
    if (has(product.id)) {
      remove(product.id);
      return { added: false };
    }
    add(product);
    return { added: true };
  };

  const clear = (): void => {
    items.value = [];
    writeStored([]);
  };

  /**
   * Replace the current list with a hydrated array (e.g. when a
   * shared wishlist link is opened). The list is merged with
   * any pre-existing items by id (the new ones win on conflict).
   */
  const hydrate = (incoming: Omit<FavoriteItem, 'addedAt'>[]): number => {
    const map = new Map<string, FavoriteItem>();
    for (const i of items.value) map.set(i.id, i);
    for (const i of incoming) {
      if (!i?.id) continue;
      map.set(i.id, { ...i, addedAt: Date.now() });
    }
    const next = Array.from(map.values());
    items.value = next;
    writeStored(next);
    return next.length;
  };

  return { recent, count, isEmpty, has, add, remove, toggle, clear, hydrate };
}

export default useFavorites;
