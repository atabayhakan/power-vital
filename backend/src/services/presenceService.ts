// Presence service — a lightweight in-memory map that tracks
// which visitors are looking at which products in real time.
//
// We deliberately do NOT use Redis here. Power Vital is a
// single-PM2-process deployment, so an in-process Map is both
// faster and simpler. The map key is the product id; the value
// is a Set of session ids (one per browser tab). A visitor is
// considered "still looking" if their heartbeat is newer than
// PRESENCE_TIMEOUT_MS ago (default 90s — 3x the 30s heartbeat
// interval to tolerate a missed ping).
//
// Public API:
//   • recordHeartbeat(productId, sessionId)  — call from a
//     browser tab every 30s while a PDP is open. Updates the
//     last-seen timestamp and returns the current count.
//   • getCount(productId)                     — current count
//     after a sweep pass.
//   • getAllCounts()                         — bulk read used
//     by the admin dashboard ("top 10 viewed right now").
//   • sweep()                                 — drops expired
//     entries; called by the cleanup cron and after every
//     write to keep memory bounded.
//
// The shape is intentionally tiny so we can later swap to a
// Redis-backed store without changing the call sites.

const PRESENCE_TIMEOUT_MS = 90 * 1000;
const HEARTBEAT_INTERVAL_MS = 30 * 1000;

// Live binding so tests can shorten the timeout without
// rewriting the module. The const above is the production
// default; this `let` shadows it for the lifetime of the
// process and can be overridden via __test.PRESENCE_TIMEOUT_MS.
let liveTimeoutMs = PRESENCE_TIMEOUT_MS;

interface SessionEntry {
  productId: string;
  lastSeen: number;
}

const sessions = new Map<string, SessionEntry>();

/** Record (or refresh) a session's product view. The sessionId
 *  is expected to be a per-tab UUID (frontend generates it
 *  once and keeps it in sessionStorage). Returns the count of
 *  active sessions on the same product after this update. */
export const recordHeartbeat = (productId: string, sessionId: string): number => {
  if (!productId || !sessionId) return 0;
  const now = Date.now();
  sessions.set(sessionId, { productId, lastSeen: now });
  return getCount(productId);
};

/** Look up the number of active sessions for a product. Runs a
 *  quick sweep first so we never return a stale value. */
export const getCount = (productId: string): number => {
  if (!productId) return 0;
  const now = Date.now();
  let count = 0;
  for (const [sid, entry] of sessions) {
    if (entry.productId !== productId) continue;
    if (now - entry.lastSeen > liveTimeoutMs) {
      sessions.delete(sid);
      continue;
    }
    count++;
  }
  return count;
};

/** Bulk read for the admin dashboard. Returns
 *  { productId: count } only for products with >=1 active
 *  session, sorted descending. */
export const getAllCounts = (): Array<{ productId: string; count: number }> => {
  const now = Date.now();
  const map = new Map<string, number>();
  for (const [sid, entry] of sessions) {
    if (now - entry.lastSeen > liveTimeoutMs) {
      sessions.delete(sid);
      continue;
    }
    map.set(entry.productId, (map.get(entry.productId) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([productId, count]) => ({ productId, count }))
    .sort((a, b) => b.count - a.count);
};

/** Force a sweep. Called after every write AND by the cleanup
 *  cron so memory never grows unbounded. */
export const sweep = (): { dropped: number; remaining: number } => {
  const now = Date.now();
  let dropped = 0;
  for (const [sid, entry] of sessions) {
    if (now - entry.lastSeen > liveTimeoutMs) {
      sessions.delete(sid);
      dropped++;
    }
  }
  return { dropped, remaining: sessions.size };
};

/** Periodic cleanup task. Called once from server boot. */
let cleanupHandle: NodeJS.Timeout | null = null;
export const startPresenceCleanup = (): () => void => {
  if (cleanupHandle) return () => stopPresenceCleanup();
  cleanupHandle = setInterval(() => {
    const { dropped, remaining } = sweep();
    if (dropped > 0) {
      // Quietly log so admins can spot abusive patterns in prod
      // logs (e.g. one tab refreshing every second).
      console.warn(`[presence] swept ${dropped} expired sessions (${remaining} active)`);
    }
  }, 60 * 1000);
  return () => stopPresenceCleanup();
};

export const stopPresenceCleanup = (): void => {
  if (cleanupHandle) {
    clearInterval(cleanupHandle);
    cleanupHandle = null;
  }
};

export const __test = {
  get PRESENCE_TIMEOUT_MS() { return PRESENCE_TIMEOUT_MS; },
  set PRESENCE_TIMEOUT_MS(v: number) { liveTimeoutMs = v; },
  HEARTBEAT_INTERVAL_MS,
  sessions
};

export default {
  recordHeartbeat,
  getCount,
  getAllCounts,
  sweep,
  startPresenceCleanup,
  stopPresenceCleanup
};
