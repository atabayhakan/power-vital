// prismaQueryLogger — attach to PrismaClient.$on('query') to log every
// SQL statement the runtime emits. Detects:
//   1. Slow queries — anything over SLOW_MS gets a `warn` log with the
//      query + duration + caller stack hint.
//   2. N+1 patterns — when a single HTTP request fires >MAX_QUERIES_PER_REQ
//      queries against the same model, we emit a single aggregated warn
//      pointing at the request URL so dev/prod operators can see the
//      hotspot. The detector is reset between requests via middleware.
//
// Usage:
//   import { prisma } from './lib/prisma';
//   attachQueryLogger(prisma);
//
//   // In Express middleware chain (before routes):
//   app.use(resetQueryStats);
//   app.use(captureQueryStats);

import type { PrismaClient } from '../../prisma/generated/client';
import { logger } from './logger';

// ── Tunables ────────────────────────────────────────────────────────────────
const SLOW_MS = parseInt(process.env.PRISMA_SLOW_MS || '100', 10);
// 30 queries for a single request is a strong N+1 signal — a normal
// page-level render fires ≤15 even with deep joins.
const N_PLUS_ONE_THRESHOLD = parseInt(process.env.PRISMA_N1_THRESHOLD || '30', 10);
const N_PLUS_ONE_GROUPED = parseInt(process.env.PRISMA_N1_GROUPED || '10', 10);
// Track at most this many distinct models in the N+1 report.
const N_PLUS_ONE_MAX_MODELS = 5;

type ModelCounts = Map<string, { count: number; firstAt: number; lastAt: number }>;

interface RequestStats {
  startMs: number;
  totalQueries: number;
  slowQueries: number;
  byModel: ModelCounts;
  requestPath?: string;
  requestMethod?: string;
}

/**
 * Per-request query stats. Stored on the Express `req` object so the
 * middleware chain and the route handlers can both read it. Reset at
 * the start of each request by the `resetQueryStats` middleware.
 */
declare global {
   
  var __pvQueryStats: RequestStats | undefined;
}

export const resetQueryStats = (): void => {
  globalThis.__pvQueryStats = {
    startMs: Date.now(),
    totalQueries: 0,
    slowQueries: 0,
    byModel: new Map(),
  };
};

export const captureQueryStats = (req: any, _res: any, next: () => void): void => {
  const stats = globalThis.__pvQueryStats;
  if (stats) {
    stats.requestPath = req.originalUrl || req.url;
    stats.requestMethod = req.method;
  }
  next();
};

/** Express middleware — installs both reset + capture in one import. */
export const prismaQueryTracker = {
  reset: (req: any, _res: any, next: () => void) => {
    resetQueryStats();
    if (req) captureQueryStats(req, _res, next);
    else next();
  },
  /** Final report middleware. Logs a summary line per request. */
  finish: (req: any, res: any, next: () => void) => {
    res.on('finish', () => emitSummary());
    next();
  },
};

export function emitSummary(): void {
  const stats = globalThis.__pvQueryStats;
  if (!stats || stats.totalQueries === 0) return;
  const durationMs = Date.now() - stats.startMs;
  const entries = Array.from(stats.byModel.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, N_PLUS_ONE_MAX_MODELS);

  if (stats.slowQueries > 0 || stats.totalQueries > N_PLUS_ONE_THRESHOLD) {
    logger.warn({
      path: stats.requestPath,
      method: stats.requestMethod,
      totalQueries: stats.totalQueries,
      slowQueries: stats.slowQueries,
      durationMs,
      topModels: entries.map(([model, c]) => ({ model, count: c.count })),
    }, 'prismaQueryLogger: heavy request — many or slow queries');
  }

  // N+1 detector: same model queried >= N_PLUS_ONE_GROUPED times.
  const nPlusOne = entries.filter(([, c]) => c.count >= N_PLUS_ONE_GROUPED);
  if (nPlusOne.length > 0) {
    incN1Detection();
    logger.warn({
      path: stats.requestPath,
      nPlusOne: nPlusOne.map(([model, c]) => ({ model, count: c.count })),
    }, 'prismaQueryLogger: N+1 query pattern suspected');
  }

  // Clean up — if the same request handler awaits more queries after
  // res.end (it shouldn't, but just in case) we don't want to
  // double-count. The resetQueryStats middleware will create a fresh
  // stats object for the next request.
  globalThis.__pvQueryStats = undefined;
}

/**
 * Pull the model name out of a Prisma query string. Examples:
 *   SELECT ... FROM `Product` ...  →  "Product"
 *   SELECT ... FROM `User` WHERE ... → "User"
 *   INSERT INTO `Order` ...        → "Order"
 * Returns "unknown" if we can't parse it (e.g. CTE / subquery).
 */
function extractModel(query: string): string {
  // Prisma emits `FROM "<table>"` and `INSERT INTO "<table>"`. The
  // table name is also the model name (Prisma singular table naming).
  const m = query.match(/(?:FROM|INTO|UPDATE)\s+`?["']?([A-Za-z_][A-Za-z0-9_]*)`?["']?/);
  return m ? m[1] : 'unknown';
}

/**
 * Attach the query logger to a Prisma client. Call once at startup.
 * Idempotent — re-attaching just replaces the listener.
 */
export const attachQueryLogger = (prisma: PrismaClient): void => {
  // Prisma's $on('query') gives us (event: { query, params, duration, timestamp }).
  // The generated client's $on signature is generic over the event name; we cast
  // through unknown because 'query' is the runtime-only channel.
  (prisma as unknown as { $on: (event: string, cb: (e: any) => void) => void })
    .$on('query', (event: any) => {
    // Lazily create stats if the reset middleware hasn't fired yet (e.g.
    // when queries run during app boot, before any request). Without this
    // guard we silently drop pre-request queries.
    let stats = globalThis.__pvQueryStats;
    if (!stats) {
      stats = {
        startMs: Date.now(),
        totalQueries: 0,
        slowQueries: 0,
        byModel: new Map(),
      };
      globalThis.__pvQueryStats = stats;
    }
    const durationMs = Number(event.duration);
    // Re-read each event so tests can override PRISMA_SLOW_MS in beforeEach
    // without re-attaching the listener.
    const slowMs = parseInt(process.env.PRISMA_SLOW_MS || String(SLOW_MS), 10);
    const isSlow = durationMs >= slowMs;

    stats.totalQueries++;
    if (isSlow) {
      stats.slowQueries++;
      processLifetimeSlow.inc();
    }
    const model = extractModel(event.query);
    const cur = stats.byModel.get(model);
    if (cur) {
      cur.count++;
      cur.lastAt = Date.now();
    } else {
      stats.byModel.set(model, { count: 1, firstAt: Date.now(), lastAt: Date.now() });
    }

    if (isSlow) {
      // Log without params (they may contain PII).
      logger.warn({
        durationMs,
        query: event.query.slice(0, 300),
        path: stats?.requestPath,
      }, `prismaQueryLogger: slow query (${durationMs}ms ≥ ${SLOW_MS}ms)`);
    }
  });
};

// ── Process-lifetime counters (feed /admin/metrics dashboard) ───────────
// We keep these separate from the per-request stats so the dashboard can
// show "slow queries in last hour" without keeping per-request state
// around forever. Reset only via process restart (or admin /reset hook).
class LifetimeCounter {
  private count = 0;
  inc(): void { this.count++; }
  get value(): number { return this.count; }
  reset(): void { this.count = 0; }
}
const processLifetimeSlow = new LifetimeCounter();
const processLifetimeN1 = new LifetimeCounter();

/** Called by emitSummary when an N+1 pattern is detected. */
export const incN1Detection = (): void => { processLifetimeN1.inc(); };

/** Snapshot for the admin metrics dashboard. */
export const getLifetimeQueryStats = () => ({
  slowQueries: processLifetimeSlow.value,
  n1Detections: processLifetimeN1.value,
});

/** Reset only the lifetime counters (used by tests + admin /reset hook). */
export const resetLifetimeQueryStats = (): void => {
  processLifetimeSlow.reset();
  processLifetimeN1.reset();
};

/**
 * Periodic in-process snapshot for the admin metrics dashboard. Used
 * by routes/adminMetrics.ts to render a "queries in last 5 minutes"
 * counter. Returns the current request's stats (or null if none).
 */
export const getCurrentRequestStats = (): RequestStats | null => {
  return globalThis.__pvQueryStats ?? null;
};