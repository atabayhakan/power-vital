// useCompare — localStorage-backed list of products the visitor
// wants to compare side-by-side. Capped at MAX_ITEMS (4) to keep
// the comparison table readable and the storage tiny. Used by:
//   • ProductCard "Compare" toggle button
//   • GlobalNavbar "Compare (n)" pill that opens the CompareDrawer
//   • CompareDrawer itself (render the table)
//
// We deliberately do NOT add the comparison list to the cart
// abandonment tracker — the visitor may be browsing with the
// intent to buy, but the comparison isn't a buying signal on
// its own. Keeping it out of the heartbeat keeps the cart push
// copy focused ("you left X in your cart").
import { ref, computed } from 'vue';

const STORAGE_KEY = 'pv_compare';
const MAX_ITEMS = 4;

export interface CompareItem {
  id: string;
  name: string;
  imageUrl: string;
  basePriceKgs: number;
  category?: string;
  slug?: string;
}

// Module-level shared state so every component that calls
// useCompare() sees the same list (no Pinia for this — too small).
const items = ref<CompareItem[]>([]);
let initialized = false;

const readStored = (): CompareItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
};

const writeStored = (list: CompareItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
  } catch { /* private mode / quota */ }
};

const initializeOnce = (): void => {
  if (initialized) return;
  initialized = true;
  items.value = readStored();
};

export function useCompare() {
  initializeOnce();

  const has = (id: string): boolean => items.value.some((i) => i.id === id);
  const count = computed(() => items.value.length);
  const isFull = computed(() => items.value.length >= MAX_ITEMS);
  const isEmpty = computed(() => items.value.length === 0);
  const recent = computed(() => items.value);
  const max = MAX_ITEMS;

  const toggle = (product: CompareItem): { added: boolean; reason?: 'full' } => {
    const existing = items.value.find((i) => i.id === product.id);
    if (existing) {
      items.value = items.value.filter((i) => i.id !== product.id);
      writeStored(items.value);
      return { added: false };
    }
    if (items.value.length >= MAX_ITEMS) {
      return { added: false, reason: 'full' };
    }
    items.value = [...items.value, product].slice(0, MAX_ITEMS);
    writeStored(items.value);
    return { added: true };
  };

  const add = (product: CompareItem): { added: boolean; reason?: 'full' | 'duplicate' } => {
    if (has(product.id)) return { added: false, reason: 'duplicate' };
    if (items.value.length >= MAX_ITEMS) return { added: false, reason: 'full' };
    items.value = [...items.value, product].slice(0, MAX_ITEMS);
    writeStored(items.value);
    return { added: true };
  };

  const remove = (id: string): void => {
    items.value = items.value.filter((i) => i.id !== id);
    writeStored(items.value);
  };

  const clear = (): void => {
    items.value = [];
    writeStored([]);
  };

  return { recent, count, isEmpty, isFull, has, add, remove, toggle, clear, max };
}

export default useCompare;
