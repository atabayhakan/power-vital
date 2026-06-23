import { defineStore } from 'pinia';
import { ref, shallowRef, computed, watch, triggerRef } from 'vue';
import axios from 'axios';
import { calculatePrice, getFinanceSettings } from '../utils/PriceEngine';
import { useCurrentUser } from '../composables/useCurrentUser';

export interface CartItem {
  id: string;
  name: string;
  basePriceUsd: number;
  quantity: number;
  imageUrl?: string;
}

export const useCartStore = defineStore('cart', () => {
  const LOCAL_KEY = 'pv_cart';
  // Free shipping is ALWAYS the KGS equivalent of the configured USD threshold
  // (default $100), matching the checkout logic exactly — single source of truth.

  const loadInitial = (): CartItem[] => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => ({
            ...item,
            basePriceUsd: Number(item.basePriceUsd) || 0,
            quantity: Number(item.quantity) || 1
          }));
        }
        return [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // 🚀 PERF: shallowRef + array reference change. Deep reactivity gereksiz.
  // Computed'lar shallowRef üzerinde çalışmaya devam eder (iterasyon reactive tetikler).
  const items = shallowRef<CartItem[]>(loadInitial());
  const isCartOpen = ref(false);

  // Sadece array reference değişiminde localStorage'a yaz. (Önceki: deep watch = O(n) serialize)
  watch(items, (newVal) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(newVal));
    }
  });

  // Stable per-browser id for the cart-abandonment dedupe. Set
  // once on first hydration, then persisted in localStorage so
  // the same anonymous visitor is recognised across reloads.
  const GUEST_ID_KEY = 'pv_guest_id';
  const INV_SESSION_KEY = 'pv_inv_session';
  const getOrCreateGuestId = (): string => {
    if (typeof window === 'undefined') return 'srv';
    try {
      const existing = localStorage.getItem(GUEST_ID_KEY);
      if (existing) return existing;
      // crypto.randomUUID exists in all modern browsers; fall
      // back to a timestamp-based id on the off chance it's
      // missing.
      const id = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
        ? (crypto as any).randomUUID()
        : `g-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(GUEST_ID_KEY, id);
      return id;
    } catch {
      return `g-${Date.now()}`;
    }
  };

  // Shared session id for inventory reservations (soft-hold
  // 15min so other shoppers see fresh "available" counts). We
  // re-use the same session id for cart-abandonment and
  // inventory — the server doesn't care that they're the same
  // string, it just keys off it.
  const getOrCreateSessionId = (): string => {
    if (typeof window === 'undefined') return 'srv';
    try {
      const existing = sessionStorage.getItem(INV_SESSION_KEY);
      if (existing) return existing;
      const id = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
        ? (crypto as any).randomUUID()
        : `i-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(INV_SESSION_KEY, id);
      return id;
    } catch {
      return `i-${Date.now()}`;
    }
  };

  /**
   * Send a low-priority heartbeat to the cart-abandonment
   * endpoint so the server can schedule a push notification
   * if the user walks away. Best-effort: we swallow errors
   * because the UI must never break because of a network blip.
   *
   * We debounce by 2 seconds so a rapid "add 5 items" spree
   * doesn't fire 5 requests. The server already dedupes the
   * cart snapshot, but no point wasting the round trip.
   */
  let heartbeatHandle: number | null = null;
  const sendHeartbeat = async () => {
    if (typeof window === 'undefined') return;
    try {
      const currentUser = useCurrentUser();
      const snapshot = {
        items: items.value.map((i) => ({
          id: i.id,
          name: i.name,
          imageUrl: i.imageUrl,
          basePriceUsd: Number(i.basePriceUsd) || 0,
          quantity: i.quantity
        })),
        totals: { usd: cartTotalUsd.value, kgs: cartTotalKgs.value }
      };
      // Make sure the cookie is set for guest identification.
      // Cookies are HttpOnly-disabled here because the endpoint
      // reads the value from a regular cookie parser middleware.
      if (!currentUser.value?.id) {
        const gid = getOrCreateGuestId();
        document.cookie = `pv_guest_id=${gid}; path=/; max-age=31536000; samesite=lax`;
      }
      await axios.post('/api/v1/cart/heartbeat', snapshot, {
        // Don't bubble auth errors to the global interceptor.
        headers: { 'X-Silent-Error': '1' }
      }).catch(() => { /* intentionally swallowed */ });
    } catch {
      // Never let the heartbeat break the cart UI.
    }
  };

  /**
   * Convert a successful order into a "the user came back" signal
   * so the sweeper marks the abandonment row as converted (for
   * analytics) and stops nagging.
   */
  const markConverted = async () => {
    if (typeof window === 'undefined') return;
    try {
      await axios.post('/api/v1/cart/converted', {}, {
        headers: { 'X-Silent-Error': '1' }
      }).catch(() => { /* ignored */ });
    } catch { /* noop */ }
  };

  /**
   * Tell the server the cart was emptied (manually, or after
   * checkout). The sweeper will skip this visitor for any
   * pre-existing pending row.
   */
  const sendCleared = async () => {
    if (typeof window === 'undefined') return;
    try {
      await axios.post('/api/v1/cart/cleared', {}, {
        headers: { 'X-Silent-Error': '1' }
      }).catch(() => { /* ignored */ });
    } catch { /* noop */ }
  };

  const scheduleHeartbeat = () => {
    if (heartbeatHandle !== null) window.clearTimeout(heartbeatHandle);
    heartbeatHandle = window.setTimeout(() => {
      heartbeatHandle = null;
      void sendHeartbeat();
    }, 2000);
  };

  // Event Listener for toggling cart
  if (typeof window !== 'undefined') {
    window.addEventListener('open-cart', () => {
      isCartOpen.value = true;
    });
    window.addEventListener('close-cart', () => {
      isCartOpen.value = false;
    });
  }

  // Reserve a soft hold on the inventory so concurrent shoppers
  // see a fresh "available" count. Silent on failure — the
  // UX is a nice-to-have, never block the cart.
  const reserveInventory = async (productId: string, qty: number) => {
    if (typeof window === 'undefined' || !productId || qty < 1) return;
    try {
      const sessionId = getOrCreateSessionId();
      await axios.post('/api/v1/inventory/reserve', {
        productId, qty, sessionId
      }, { headers: { 'X-Silent-Error': '1' } });
    } catch { /* noop */ }
  };

  const releaseInventory = async (productId: string) => {
    if (typeof window === 'undefined' || !productId) return;
    try {
      const sessionId = getOrCreateSessionId();
      await axios.post('/api/v1/inventory/release', {
        productId, sessionId
      }, { headers: { 'X-Silent-Error': '1' } });
    } catch { /* noop */ }
  };

  const addToCart = (product: { id: string; name: string; basePriceUsd: number; imageUrl?: string }, qty = 1) => {
    const current = items.value;
    const existing = current.find(item => item.id === product.id);
    let next: CartItem[];
    if (existing) {
      next = current.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
      );
    } else {
      next = [...current, { ...product, quantity: qty }];
    }
    items.value = next;
    triggerRef(items);
    isCartOpen.value = true;
    scheduleHeartbeat();
    // Refresh the soft-hold with the new total quantity
    const finalQty = next.find((i) => i.id === product.id)?.quantity || qty;
    void reserveInventory(product.id, finalQty);
  };

  const removeFromCart = (id: string) => {
    items.value = items.value.filter(item => item.id !== id);
    scheduleHeartbeat();
    void releaseInventory(id);
  };

  const updateQuantity = (id: string, delta: number) => {
    const current = items.value;
    const item = current.find(i => i.id === id);
    if (!item) return;
    if (item.quantity + delta <= 0) {
      removeFromCart(id);
      return;
    }
    items.value = current.map(i =>
      i.id === id ? { ...i, quantity: i.quantity + delta } : i
    );
    scheduleHeartbeat();
    const newQty = current.find((i) => i.id === id)?.quantity || 0;
    void reserveInventory(id, newQty);
  };

  const clearCart = () => {
    items.value = [];
    void sendCleared();
  };

  const cartItemCount = computed(() =>
    items.value.reduce((acc, item) => acc + item.quantity, 0)
  );

  const cartTotalUsd = computed(() =>
    items.value.reduce((acc, item) => acc + ((item.basePriceUsd || 0) * item.quantity), 0)
  );

  const cartTotalKgs = computed(() => {
    const currentUser = useCurrentUser();
    const discountRate = currentUser.value?.dynamicDiscountRate ?? 0;
    return items.value.reduce((acc, item) => acc + (calculatePrice(item.basePriceUsd || 0, discountRate) * item.quantity), 0);
  });

  // Threshold in USD (from finance settings, default 100) and its KGS equivalent.
  const freeShippingThresholdUsd = computed(() => {
    const fs = getFinanceSettings();
    return Number(fs.checkoutShippingThresholdUsd) || 100;
  });

  const freeShippingThresholdKgs = computed(() => {
    const fs = getFinanceSettings();
    const rate = Number(fs.exchangeRate) || 88.5;
    return freeShippingThresholdUsd.value * rate;
  });

  const isFreeShipping = computed(() => cartTotalUsd.value >= freeShippingThresholdUsd.value);

  const shippingProgressPercent = computed(() => {
    if (isFreeShipping.value) return 100;
    if (freeShippingThresholdUsd.value <= 0) return 100;
    return Math.min(100, (cartTotalUsd.value / freeShippingThresholdUsd.value) * 100);
  });

  // Remaining amount to reach free shipping, expressed in KGS for display.
  const remainingForFreeShipping = computed(() => {
    const remainingUsd = Math.max(0, freeShippingThresholdUsd.value - cartTotalUsd.value);
    const rate = Number(getFinanceSettings().exchangeRate) || 88.5;
    return remainingUsd * rate;
  });

  return {
    items,
    isCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    markConverted,
    sendHeartbeat,
    sendCleared,
    cartItemCount,
    cartTotalUsd,
    cartTotalKgs,
    freeShippingThresholdUsd,
    freeShippingThresholdKgs,
    isFreeShipping,
    shippingProgressPercent,
    remainingForFreeShipping
  };
});
