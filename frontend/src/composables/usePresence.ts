// usePresence — small composable that lets a Vue component
// "live tick" a product's visitor count. The component sets a
// productId and the composable:
//   1. generates (or reads) a per-tab session id
//   2. POSTs a heartbeat to /api/v1/presence every 30s
//   3. polls GET /api/v1/presence/:id every 60s for the current
//      count of OTHER active sessions (so the badge doesn't
//      count its own tab)
//
// We poll rather than use a WebSocket / SSE channel because
// the overhead of a long-lived connection per product page
// doesn't pay for itself when a 60s refresh is plenty fresh for
// the social-proof use case.

import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import axios from 'axios';

const SESSION_KEY = 'pv_presence_session';
const HEARTBEAT_MS = 30 * 1000;
const POLL_MS = 60 * 1000;

const getOrCreateSessionId = (): string => {
  if (typeof window === 'undefined') return 'srv';
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
      ? (crypto as any).randomUUID()
      : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `s-${Date.now()}`;
  }
};

export function usePresence(productIdSource: () => string | null | undefined) {
  const count = ref(0);
  const isLive = ref(false);
  let heartbeatHandle: number | null = null;
  let pollHandle: number | null = null;
  let currentProductId: string | null = null;

  const heartbeat = async (productId: string, sessionId: string) => {
    if (!productId || !sessionId) return;
    try {
      await axios.post('/api/v1/presence', { productId, sessionId }, {
        headers: { 'X-Silent-Error': '1' }
      });
    } catch {
      // Silent — the visitor-counter is a nice-to-have, never break the PDP.
    }
  };

  const fetchCount = async (productId: string) => {
    if (!productId) return;
    try {
      const res = await axios.get(`/api/v1/presence/${encodeURIComponent(productId)}`, {
        headers: { 'X-Silent-Error': '1' }
      });
      const total = Number(res.data?.count) || 0;
      // The server includes OUR session in the count; subtract
      // 1 so the badge shows "people OTHER than you".
      count.value = Math.max(0, total - 1);
      isLive.value = true;
    } catch {
      isLive.value = false;
    }
  };

  const start = (productId: string) => {
    if (currentProductId === productId) return;
    stop();
    currentProductId = productId;
    if (typeof window === 'undefined' || !productId) return;
    const sessionId = getOrCreateSessionId();
    // Fire immediately, then on the heartbeat interval.
    void heartbeat(productId, sessionId);
    void fetchCount(productId);
    heartbeatHandle = window.setInterval(() => heartbeat(productId, sessionId), HEARTBEAT_MS);
    pollHandle = window.setInterval(() => fetchCount(productId), POLL_MS);
  };

  const stop = () => {
    if (typeof window !== 'undefined') {
      if (heartbeatHandle) window.clearInterval(heartbeatHandle);
      if (pollHandle) window.clearInterval(pollHandle);
    }
    heartbeatHandle = null;
    pollHandle = null;
    currentProductId = null;
  };

  // React to productId changes from the parent. PDPs and the
  // product grid both pass a getter so route-driven changes
  // (e.g. next/prev arrow on PDP) re-trigger the heartbeat
  // for the new product without unmounting the component.
  watch(productIdSource, (newId) => {
    if (newId) start(newId);
    else stop();
  });

  onMounted(() => {
    const id = productIdSource();
    if (id) start(id);
  });
  onBeforeUnmount(stop);

  return { count, isLive, start, stop };
}

export default usePresence;
