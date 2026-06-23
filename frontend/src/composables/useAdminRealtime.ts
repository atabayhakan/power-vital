// useAdminRealtime — server-sent events client for the admin dashboard.
//
// Connects to /api/v1/admin/events (SSE) and exposes:
//   • a ref of the last received event (for testing / debug widgets)
//   • per-event-type handlers the caller can register
//   • automatic reconnection (browser EventSource native retry)
//
// The composable returns a single instance per Vue app — multiple
// callers share the same connection. This avoids the browser's
// per-origin HTTP/1.1 connection limit (6 per origin) and the server
// fan-out cost.
//
// Lifecycle: the connection is opened on the FIRST call to ensureOpen()
// and closed when the LAST registered listener unsubscribes (and
// `dispose()` is called explicitly by the consumer, e.g. onUnmounted).

import { ref, onUnmounted } from 'vue';
import type { Ref } from 'vue';
import { useToast } from './useToast';

export type AdminEventType =
  | 'new_order'
  | 'payment_received'
  | 'ocr_pending'
  | 'withdrawal_request'
  | 'withdrawal_approved'
  | 'withdrawal_rejected'
  | 'review_pending'
  | 'low_stock'
  | 'connected'   // synthetic, fired when SSE :connected comment arrives
  | 'reconnected' // synthetic, fired after EventSource auto-reconnect
  | 'error'       // synthetic, fired on connection error
  ;

export interface AdminEvent {
  type: AdminEventType;
  data: Record<string, unknown>;
  ts: number;
}

type EventHandler = (e: AdminEvent) => void;

// Module-level singleton state — shared across all consumers
let _es: EventSource | null = null;
let _refCount = 0;
const _handlers: Map<AdminEventType, Set<EventHandler>> = new Map();
const _lastEvent: Ref<AdminEvent | null> = ref(null);
const _connected: Ref<boolean> = ref(false);
let _reconnectAttempts = 0;

const sseUrl = (): string => {
  // Same-origin so cookies (pv_refresh) are sent automatically.
  // Using a relative path keeps the URL correct across dev/staging/prod.
  if (typeof window === 'undefined') return '';
  return '/api/v1/admin/events';
};

/**
 * Open the SSE connection (idempotent — counts references).
 * Native EventSource handles auto-reconnect for us (default: 3s back-off,
 * which we keep — too aggressive back-off hides persistent server issues).
 */
const ensureOpen = () => {
  _refCount += 1;
  if (_es || typeof window === 'undefined') return;
  const url = sseUrl();
  const es = new EventSource(url, { withCredentials: true });
  _es = es;

  // Generic error handler — EventSource auto-reconnects on its own, so
  // we just bump a counter and surface the state.
  es.addEventListener('error', () => {
    _connected.value = false;
    _reconnectAttempts += 1;
    const handlers = _handlers.get('error');
    if (handlers) {
      const errEvent: AdminEvent = {
        type: 'error',
        data: { reconnectAttempts: _reconnectAttempts },
        ts: Date.now()
      };
      for (const fn of handlers) fn(errEvent);
    }
  });

  // We don't have a generic 'message' handler here because we register
  // per-event-type listeners below — EventSource fires them as named
  // events.
  const dispatch = (e: MessageEvent, syntheticType?: AdminEventType) => {
    let parsed: { type?: string; data?: any; ts?: number };
    try {
      parsed = JSON.parse(e.data);
    } catch {
      // Malformed payload — ignore
      return;
    }
    const type = (parsed.type || syntheticType) as AdminEventType;
    if (!type) return;
    const event: AdminEvent = {
      type,
      data: parsed.data || {},
      ts: parsed.ts || Date.now()
    };
    _lastEvent.value = event;
    const handlers = _handlers.get(type);
    if (handlers) {
      for (const fn of handlers) {
        try { fn(event); } catch (err) { /* swallow */ }
      }
    }
  };

  // Each known event type gets its own listener. We use addEventListener
  // (named events) rather than onmessage so the server can send
  // semantic-only events without a JSON wrapper.
  const KNOWN_TYPES: AdminEventType[] = [
    'new_order', 'payment_received', 'ocr_pending',
    'withdrawal_request', 'withdrawal_approved', 'withdrawal_rejected',
    'review_pending', 'low_stock'
  ];
  for (const t of KNOWN_TYPES) {
    es.addEventListener(t, (e) => dispatch(e as MessageEvent, t));
  }

  // The server sends a `: connected` comment frame right after we open.
  // It doesn't fire a named event, so we use onmessage as a fallback to
  // catch it. Comment frames start with `:` and are not data — we ignore
  // the data but treat the onmessage fire as a "connected" signal.
  es.onmessage = () => {
    _connected.value = true;
    _reconnectAttempts = 0;
    const handlers = _handlers.get('connected');
    if (handlers) {
      const event: AdminEvent = { type: 'connected', data: {}, ts: Date.now() };
      for (const fn of handlers) fn(event);
    }
  };
  // EventSource fires 'open' on (re)connect — useful for the reconnected
  // synthetic event.
  es.addEventListener('open', () => {
    _connected.value = true;
    _reconnectAttempts = 0;
    if (_refCount > 0) {
      const handlers = _handlers.get('reconnected');
      if (handlers) {
        const event: AdminEvent = { type: 'reconnected', data: {}, ts: Date.now() };
        for (const fn of handlers) fn(event);
      }
    }
  });
};

const ensureClosed = () => {
  if (_refCount > 0) _refCount -= 1;
  if (_refCount > 0) return;
  if (_es) {
    _es.close();
    _es = null;
  }
  _connected.value = false;
};

const subscribe = (type: AdminEventType, fn: EventHandler): (() => void) => {
  let bucket = _handlers.get(type);
  if (!bucket) {
    bucket = new Set();
    _handlers.set(type, bucket);
  }
  bucket.add(fn);
  ensureOpen();
  return () => {
    bucket!.delete(fn);
    ensureClosed();
  };
};

/**
 * Main composable. Call inside `<script setup>` of any component that
 * needs to react to admin events. The composable is safe to call from
 * multiple components — the underlying EventSource is shared.
 *
 * Example:
 *   const { on, lastEvent, connected } = useAdminRealtime();
 *   on('new_order', (e) => {
 *     toast.success(`New order: ${e.data.totalKgs} KGS`);
 *     refreshDashboard();
 *   });
 */
export const useAdminRealtime = () => {
  const toast = useToast();

  /**
   * Register a handler for a specific event type. Returns the unsubscribe
   * function. Auto-cleans on component unmount.
   */
  const on = (type: AdminEventType, fn: EventHandler): (() => void) => {
    const off = subscribe(type, fn);
    onUnmounted(off);
    return off;
  };

  /**
   * Convenience: subscribe to multiple events at once. Returns a single
   * unsubscribe function that detaches all.
   */
  const onMany = (types: AdminEventType[], fn: EventHandler): (() => void) => {
    const offs = types.map(t => subscribe(t, fn));
    const off = () => offs.forEach(o => o());
    onUnmounted(off);
    return off;
  };

  /**
   * Subscribe to "anything interesting" and surface it as a toast.
   * Pass a `messages` map to localise: { new_order: (e) => `Yeni sipariş` }.
   */
  const toastOn = (types: AdminEventType[], messages: Partial<Record<AdminEventType, string | ((e: AdminEvent) => string)>>) => {
    return onMany(types, (e) => {
      const m = messages[e.type];
      if (!m) return;
      const text = typeof m === 'function' ? m(e) : m;
      if (e.type === 'ocr_pending' || e.type === 'withdrawal_request' || e.type === 'review_pending') {
        toast.info(text);
      } else {
        toast.success(text);
      }
    });
  };

  /**
   * Explicit close (e.g. on logout). Usually auto-handled by onUnmounted.
   */
  const dispose = () => {
    ensureClosed();
  };

  return {
    /** Register a per-event handler. Auto-cleans on unmount. */
    on,
    /** Register the same handler for several event types. */
    onMany,
    /** Subscribe + auto-toast with a per-event message. */
    toastOn,
    /** Last event received (reactive). Useful for debug widgets. */
    lastEvent: _lastEvent,
    /** True when the connection is currently open. */
    connected: _connected,
    /** Force-close the connection. */
    dispose
  };
};

export default useAdminRealtime;
