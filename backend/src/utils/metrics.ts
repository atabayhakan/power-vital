// In-process metrics — counters, histograms, and per-route aggregates.
//
// Why in-process (not Prometheus / OpenTelemetry)?
//   • Zero dependencies (no prom-client, no OTel SDK)
//   • The admin dashboard already has a /api/v1/admin/* auth contract
//   • Single PM2 process → no fan-out concerns
//   • Plenty fast for ~100 req/s (which is our current peak)
//
// If you outgrow this (multi-worker, very high RPS, long retention),
// swap for prom-client with the same counter/histogram API.
//
// Design:
//   • Counters — monotonically increasing, with optional labels
//     (e.g. route + method + status class)
//   • Histograms — for latency / size distributions
//     Buckets are pre-defined; we always include the standard 5/10/25/...
//     to make percentile reads easy.
//   • All state is in-memory; lost on process restart. That's fine —
//     we only use these for live admin dashboards.

import { getLifetimeQueryStats, resetLifetimeQueryStats } from './prismaQueryLogger';
import { getCacheStats, resetCacheStats } from './cacheStats';

export const HISTOGRAM_BUCKETS_MS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10_000];

// ── Counter ──────────────────────────────────────────────────────────────
export class Counter {
  private values = new Map<string, number>();

  inc(labels: Record<string, string> = {}, amount = 1): void {
    const k = labelKey(labels);
    this.values.set(k, (this.values.get(k) ?? 0) + amount);
  }

  get(labels: Record<string, string> = {}): number {
    return this.values.get(labelKey(labels)) ?? 0;
  }

  snapshot(): Array<{ labels: Record<string, string>; value: number }> {
    return Array.from(this.values.entries()).map(([k, value]) => ({
      labels: parseKey(k),
      value
    }));
  }

  reset(): void { this.values.clear(); }
}

const labelKey = (labels: Record<string, string>): string => {
  const keys = Object.keys(labels).sort();
  if (keys.length === 0) return '';
  return keys.map(k => `${k}=${labels[k]}`).join('|');
};

const parseKey = (k: string): Record<string, string> => {
  if (!k) return {};
  const out: Record<string, string> = {};
  for (const part of k.split('|')) {
    const [key, ...rest] = part.split('=');
    out[key] = rest.join('=');
  }
  return out;
};

// ── Histogram ───────────────────────────────────────────────────────────
export class Histogram {
  // bucket → count, plus an overflow bucket (+Inf)
  private buckets: Map<string, number[]> = new Map();

  observe(labels: Record<string, string>, valueMs: number): void {
    const k = labelKey(labels);
    let counts = this.buckets.get(k);
    if (!counts) {
      counts = new Array(HISTOGRAM_BUCKETS_MS.length + 1).fill(0);
      this.buckets.set(k, counts);
    }
    // Increment the first bucket whose upper bound >= value
    for (let i = 0; i < HISTOGRAM_BUCKETS_MS.length; i++) {
      if (valueMs <= HISTOGRAM_BUCKETS_MS[i]) { counts[i]++; return; }
    }
    // Overflow bucket
    counts[counts.length - 1]++;
  }

  /** Returns cumulative counts: bucket[i] = how many observations <= HISTOGRAM_BUCKETS_MS[i] */
  snapshot(): Array<{ labels: Record<string, string>; buckets: { le: number; count: number }[]; total: number }> {
    return Array.from(this.buckets.entries()).map(([k, counts]) => {
      const total = counts.reduce((a, b) => a + b, 0);
      const buckets = HISTOGRAM_BUCKETS_MS.map((le, i) => ({ le, count: counts[i] }));
      // The overflow bucket is the +Inf bound
      buckets.push({ le: Infinity, count: counts[counts.length - 1] });
      return { labels: parseKey(k), buckets, total };
    });
  }

  reset(): void { this.buckets.clear(); }
}

// ── Metric registry ─────────────────────────────────────────────────────
// Pre-defined counters/histograms that the middleware populates. Other
// modules (e.g. notificationService) can grab the relevant counter and
// .inc() it directly.

export const metrics = {
  /** Total HTTP requests by route+method+status_class (2xx/3xx/4xx/5xx) */
  httpRequestsTotal: new Counter(),
  /** Request duration in milliseconds, by route+method */
  httpRequestDurationMs: new Histogram(),
  /** Number of active SSE / admin connections (gauge-like) */
  sseActiveConnections: new Counter(),
  /** Refresh tokens issued (issued, replayed, family-revoked) */
  refreshTokensIssued: new Counter(),
  refreshTokensReplayed: new Counter(),
  /** Notification emails sent (per event type) */
  notificationsSent: new Counter(),
  /** Search queries (per strategy) */
  searchesByStrategy: new Counter()
};

/**
 * Snapshot everything as a plain JSON object for the /admin/metrics endpoint.
 * Counters and histograms are serialized with their label sets.
 */
export const collectMetrics = () => ({
  timestamp: Date.now(),
  uptimeSeconds: Math.round(process.uptime()),
  memoryMB: {
    rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
    heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
  },
  http: {
    requests: metrics.httpRequestsTotal.snapshot(),
    duration: metrics.httpRequestDurationMs.snapshot()
  },
  sse: {
    activeConnections: metrics.sseActiveConnections.get({})
  },
  auth: {
    refreshTokensIssued: metrics.refreshTokensIssued.snapshot(),
    refreshTokensReplayed: metrics.refreshTokensReplayed.snapshot()
  },
  notifications: {
    sent: metrics.notificationsSent.snapshot()
  },
  search: {
    byStrategy: metrics.searchesByStrategy.snapshot()
  },
  // Database query observability — see utils/prismaQueryLogger.ts.
  // Counts reset only on process restart (or admin /reset hook).
  db: getLifetimeQueryStats(),
  // Cache observability — see utils/cacheStats.ts. Counts HIT/MISS/BYPASS
  // responses by route via the cacheStatsMiddleware listener.
  cache: getCacheStats()
});

/**
 * Reset every metric. Used by tests; the admin endpoint can also expose
 * this behind an "are you sure" guard for ops use.
 */
export const resetAllMetrics = (): void => {
  metrics.httpRequestsTotal.reset();
  metrics.httpRequestDurationMs.reset();
  metrics.sseActiveConnections.reset();
  metrics.refreshTokensIssued.reset();
  metrics.refreshTokensReplayed.reset();
  metrics.notificationsSent.reset();
  metrics.searchesByStrategy.reset();
  resetLifetimeQueryStats();
  resetCacheStats();
};
