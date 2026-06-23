// useInventory — per-product realtime stock + FOMO data for the
// PDP. Polls GET /api/v1/inventory/:id every 20s and exposes
// a few derived booleans for the UI:
//
//   • available   — db stock - other carts' soft reservations
//   • dbStock     — raw DB count (the same number the admin sees)
//   • reserved    — units currently held by other sessions
//   • recentOrders — count of orders in the last 10 minutes
//   • isLowStock  — available <= 5
//   • isOutOfStock — available <= 0
//   • fomo       — "N people bought this in the last 10 min"
//
// Cart-side: the cart store calls `reserve(productId, qty)`
// after every mutation so OTHER shoppers see a fresh
// "available" count. The reservation auto-expires 15 minutes
// after the last cart touch.

import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import axios from 'axios';

const SESSION_KEY = 'pv_inv_session';
const POLL_MS = 20 * 1000;

const getOrCreateSessionId = (): string => {
  if (typeof window === 'undefined') return 'srv';
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
      ? (crypto as any).randomUUID()
      : `i-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `i-${Date.now()}`;
  }
};

export interface InventoryState {
  available: number;
  dbStock: number;
  reserved: number;
  recentOrders: number;
  lastOrderAt: number | null;
  isLive: boolean;
}

export function useInventory(productIdSource: () => string | null | undefined) {
  const state = ref<InventoryState>({
    available: 0,
    dbStock: 0,
    reserved: 0,
    recentOrders: 0,
    lastOrderAt: null,
    isLive: false
  });
  let pollHandle: number | null = null;
  let currentProductId: string | null = null;

  const sessionId = typeof window !== 'undefined' ? getOrCreateSessionId() : 'srv';

  const fetchOnce = async (productId: string) => {
    if (!productId) return;
    try {
      const res = await axios.get(`/api/v1/inventory/${encodeURIComponent(productId)}`, {
        headers: { 'X-Silent-Error': '1' }
      });
      state.value = {
        available: Number(res.data?.available) || 0,
        dbStock: Number(res.data?.dbStock) || 0,
        reserved: Number(res.data?.reserved) || 0,
        recentOrders: Number(res.data?.recentOrders) || 0,
        lastOrderAt: res.data?.lastOrderAt ? Number(res.data.lastOrderAt) : null,
        isLive: true
      };
    } catch {
      // Soft-fail — leave previous state.
    }
  };

  const start = (productId: string) => {
    if (currentProductId === productId) return;
    stop();
    currentProductId = productId;
    if (typeof window === 'undefined' || !productId) return;
    void fetchOnce(productId);
    pollHandle = window.setInterval(() => fetchOnce(productId), POLL_MS);
  };

  const stop = () => {
    if (typeof window !== 'undefined' && pollHandle) window.clearInterval(pollHandle);
    pollHandle = null;
    currentProductId = null;
  };

  // Reserve `qty` units (cart add / qty change) so the server's
  // available count reflects our intent. Silent on failure.
  const reserve = async (productId: string, qty: number) => {
    if (!productId) return;
    try {
      await axios.post('/api/v1/inventory/reserve', {
        productId, qty, sessionId
      }, { headers: { 'X-Silent-Error': '1' } });
    } catch { /* noop */ }
  };

  // Release a single product (cart remove) or the whole
  // session (logout / tab close via sendBeacon).
  const release = async (productId: string) => {
    if (!productId) return;
    try {
      await axios.post('/api/v1/inventory/release', {
        productId, sessionId
      }, { headers: { 'X-Silent-Error': '1' } });
    } catch { /* noop */ }
  };

  const releaseSession = () => {
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) return;
    // sendBeacon works for tab-close where the fetch is
    // already in-flight. The server endpoint accepts a JSON
    // body via sendBeacon via Blob.
    try {
      const blob = new Blob([JSON.stringify({ sessionId })], { type: 'application/json' });
      navigator.sendBeacon('/api/v1/inventory/release-session', blob);
    } catch { /* noop */ }
  };

  // React to productId changes
  watch(productIdSource, (newId) => {
    if (newId) start(newId);
    else stop();
  });

  onMounted(() => {
    const id = productIdSource();
    if (id) start(id);
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', releaseSession);
    }
  });
  onBeforeUnmount(() => {
    stop();
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', releaseSession);
    }
  });

  // Derived booleans for the template
  const isLowStock = computed(() => state.value.available > 0 && state.value.available <= 5);
  const isOutOfStock = computed(() => state.value.available <= 0);

  return { state, isLowStock, isOutOfStock, reserve, release, releaseSession, sessionId };
}

export default useInventory;
