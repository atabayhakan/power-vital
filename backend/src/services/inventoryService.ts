// Inventory service — soft-reservations + recent-orders ring
// buffer for the realtime stock + FOMO widgets.
//
// Two responsibilities, both pure in-memory (single PM2
// process, no Redis):
//
//   1. Soft-reservations. When a customer adds an item to the
//      cart we don't decrement the DB stock — we hold a soft
//      reservation for 15 minutes. The reservation is released
//      when the cart mutates, the user logs out, or the
//      timeout fires. The "available" stock we report on the
//      PDP is `dbStock - activeReservations`.
//
//   2. Recent-orders ring buffer. The Order model records the
//      product id at creation time; this service keeps the
//      last N (productId, count) deltas so the PDP can render
//      "3 people bought this in the last 10 minutes" without
//      having to query the full Order table on every render.
//
// A daily 24h cleanup cron runs at boot to keep the ring
// buffer bounded — the last 50 orders per product, dropping
// anything older than 7 days.

const RESERVATION_TTL_MS = 15 * 60 * 1000;
const RING_MAX_PER_PRODUCT = 50;
const RING_MAX_AGE_MS = 7 * 24 * 60 * 1000;

// Live binding so tests can shorten the timeout without
// rewriting the module. Production code never touches these.
let liveReservationTtlMs = RESERVATION_TTL_MS;

interface Reservation {
  productId: string;
  qty: number;
  expiresAt: number;
}

interface OrderRing {
  productId: string;
  at: number; // ms epoch
}

// sessionId -> Map<productId, Reservation> so each tab has
// its own per-product reservation count.
const reservations = new Map<string, Map<string, Reservation>>();

// productId -> ordered list of recent order timestamps (newest
// at the end). We keep them as a plain array — 50 entries per
// product is tiny and array.shift is O(n) but n is bounded.
const orderRings = new Map<string, number[]>();

let cleanupHandle: NodeJS.Timeout | null = null;

/** Reserve `qty` units of a product for a tab/session. The
 *  sessionId is per-tab (frontend generates it). The quantity
 *  is the new total in the cart — we replace any prior
 *  reservation for the same (session, product) pair. Returns
 *  the new "available" count for the product (dbStock minus
 *  all OTHER active reservations). */
export const reserve = (
  productId: string,
  qty: number,
  sessionId: string,
  dbStock: number
): { available: number; reserved: number } => {
  if (!productId || !sessionId || !isFinite(qty) || qty < 0) {
    return { available: Math.max(0, dbStock), reserved: 0 };
  }
  const now = Date.now();
  let bag = reservations.get(sessionId);
  if (!bag) {
    bag = new Map();
    reservations.set(sessionId, bag);
  }
  bag.set(productId, { productId, qty, expiresAt: now + liveReservationTtlMs });
  return computeAvailable(productId, dbStock);
};

/** Drop a tab/session's reservation for a single product —
 *  call this when the user removes the item from the cart
 *  (or logs out / closes the tab). */
export const release = (
  productId: string,
  sessionId: string,
  dbStock: number
): { available: number; reserved: number } => {
  const bag = reservations.get(sessionId);
  if (bag) bag.delete(productId);
  if (bag && bag.size === 0) reservations.delete(sessionId);
  return computeAvailable(productId, dbStock);
};

/** Drop ALL reservations for a session — used when the
 *  session logs out, closes, or completes checkout. */
export const releaseSession = (sessionId: string): void => {
  reservations.delete(sessionId);
};

/** Compute the available count for a product by summing all
 *  active reservations across all sessions. */
const computeAvailable = (
  productId: string,
  dbStock: number
): { available: number; reserved: number } => {
  const now = Date.now();
  let reserved = 0;
  for (const bag of reservations.values()) {
    const r = bag.get(productId);
    if (!r) continue;
    if (now > r.expiresAt) {
      bag.delete(productId);
      continue;
    }
    reserved += r.qty;
  }
  const available = Math.max(0, dbStock - reserved);
  return { available, reserved };
};

/** Read-only: current available + reserved counts for a
 *  product. Public API for the GET /inventory/:id endpoint. */
export const getAvailability = (
  productId: string,
  dbStock: number
): { available: number; reserved: number } => {
  return computeAvailable(productId, dbStock);
};

/** Record a successful order (called by the checkout success
 *  path, NOT by the cart add). This is what powers the
 *  "3 people bought this in the last 10 minutes" FOMO banner. */
export const recordOrder = (productId: string, at: number = Date.now()): void => {
  if (!productId) return;
  let ring = orderRings.get(productId);
  if (!ring) {
    ring = [];
    orderRings.set(productId, ring);
  }
  ring.push(at);
  // Trim to RING_MAX_PER_PRODUCT
  if (ring.length > RING_MAX_PER_PRODUCT) {
    ring.splice(0, ring.length - RING_MAX_PER_PRODUCT);
  }
};

/** How many orders landed in the last N minutes? Used by
 *  the FOMO banner. */
export const recentOrderCount = (productId: string, windowMs: number = 10 * 60 * 1000): number => {
  const ring = orderRings.get(productId);
  if (!ring || ring.length === 0) return 0;
  const cutoff = Date.now() - windowMs;
  let count = 0;
  for (let i = ring.length - 1; i >= 0; i--) {
    if (ring[i] >= cutoff) count++;
    else break; // ring is sorted ascending
  }
  return count;
};

/** Return the most recent order timestamp — used to render
 *  "X minutes ago". */
export const lastOrderAt = (productId: string): number | null => {
  const ring = orderRings.get(productId);
  if (!ring || ring.length === 0) return null;
  return ring[ring.length - 1];
};

/** Periodic cleanup. Drops expired reservations (would-be
 *  leaked memory) and orders older than 7 days. Runs every
 *  5 minutes. */
const cleanup = (): { reservationsDropped: number; ordersDropped: number } => {
  const now = Date.now();
  let reservationsDropped = 0;
  for (const [sid, bag] of reservations) {
    for (const [pid, r] of bag) {
      if (now > r.expiresAt) {
        bag.delete(pid);
        reservationsDropped++;
      }
    }
    if (bag.size === 0) reservations.delete(sid);
  }
  let ordersDropped = 0;
  const orderCutoff = now - RING_MAX_AGE_MS;
  for (const [pid, ring] of orderRings) {
    const before = ring.length;
    // Drop from the front while they're older than the cutoff.
    while (ring.length > 0 && ring[0] < orderCutoff) ring.shift();
    ordersDropped += before - ring.length;
    if (ring.length === 0) orderRings.delete(pid);
  }
  return { reservationsDropped, ordersDropped };
};

export const startInventoryCleanup = (): () => void => {
  if (cleanupHandle) return () => stopInventoryCleanup();
  cleanupHandle = setInterval(cleanup, 5 * 60 * 1000);
  return () => stopInventoryCleanup();
};

export const stopInventoryCleanup = (): void => {
  if (cleanupHandle) {
    clearInterval(cleanupHandle);
    cleanupHandle = null;
  }
};

/** Test-only: reset all in-memory state. */
export const __resetForTests = (): void => {
  reservations.clear();
  orderRings.clear();
};

export const __test = {
  get RESERVATION_TTL_MS() { return RESERVATION_TTL_MS; },
  set RESERVATION_TTL_MS(v: number) { liveReservationTtlMs = v; },
  RING_MAX_PER_PRODUCT,
  RING_MAX_AGE_MS,
  reservations,
  orderRings,
  cleanup
};

export default {
  reserve,
  release,
  releaseSession,
  getAvailability,
  recordOrder,
  recentOrderCount,
  lastOrderAt,
  startInventoryCleanup,
  stopInventoryCleanup
};
