// Cache observability — counts HIT/MISS responses by route.
//
// We don't intercept the cache itself — we just observe the response
// headers that route handlers set (X-Cache: HIT / MISS / BYPASS).
// This way, no matter where the cache layer lives (Redis, in-memory,
// upstream nginx), as long as the handler or middleware labels the
// response, we count it.
//
// Why a label-based observer instead of a wrapper?
//   • Cache wrappers force every route to use the same helper API.
//   • Different routes need different TTLs / ETag logic.
//   • A simple middleware that reads the existing header is decoupled
//     enough that we can swap cache backends without touching metrics.
import type { Request, Response, NextFunction } from 'express';

/**
 * Tiny inline counter — kept local to avoid a circular dep with
 * ./metrics.ts (which imports `getCacheStats` from us). The shape
 * matches Counter's public surface (inc/snapshot/reset/labelKey).
 */
class LocalCounter {
  private values = new Map<string, number>();
  inc(labels: Record<string, string> = {}, amount = 1): void {
    const k = Object.keys(labels).sort().map(l => `${l}=${labels[l]}`).join('|');
    this.values.set(k, (this.values.get(k) ?? 0) + amount);
  }
  snapshot(): Array<{ labels: Record<string, string>; value: number }> {
    return Array.from(this.values.entries()).map(([k, value]) => {
      const labels: Record<string, string> = {};
      if (k) {
        for (const pair of k.split('|')) {
          const [lk, lv] = pair.split('=');
          labels[lk] = lv;
        }
      }
      return { labels, value };
    });
  }
  reset(): void { this.values.clear(); }
}

const cacheHits = new LocalCounter();
const cacheMisses = new LocalCounter();
const cacheBypasses = new LocalCounter();

/** Express middleware — install after all routes so it sees final headers. */
export const cacheStatsMiddleware = (_req: Request, res: Response, next: NextFunction): void => {
  // We attach the listener AFTER the response finishes so route handlers
  // have already set X-Cache (or not). The 'finish' event fires once.
  res.on('finish', () => {
    const header = res.getHeader('X-Cache');
    if (typeof header !== 'string') return; // route doesn't cache — skip
    const value = header.toUpperCase();
    if (value === 'HIT') {
      cacheHits.inc({ route: _req.path, method: _req.method });
    } else if (value === 'MISS') {
      cacheMisses.inc({ route: _req.path, method: _req.method });
    } else if (value === 'BYPASS') {
      cacheBypasses.inc({ route: _req.path, method: _req.method });
    }
  });
  next();
};

/** Snapshot for the /admin/metrics endpoint. */
export const getCacheStats = () => {
  const hits = cacheHits.snapshot();
  const misses = cacheMisses.snapshot();
  const bypasses = cacheBypasses.snapshot();

  // Roll up to a single route label, summed across HTTP methods —
  // the dashboard doesn't need method breakdown for cache effectiveness.
  const rollup = (rows: Array<{ labels: Record<string, string>; value: number }>) => {
    const byRoute = new Map<string, number>();
    for (const r of rows) {
      const route = r.labels.route ?? '(unknown)';
      byRoute.set(route, (byRoute.get(route) ?? 0) + r.value);
    }
    return Array.from(byRoute.entries())
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count);
  };

  const hitsByRoute = rollup(hits);
  const missesByRoute = rollup(misses);
  const bypassesByRoute = rollup(bypasses);

  const totalHits = hitsByRoute.reduce((s, r) => s + r.count, 0);
  const totalMisses = missesByRoute.reduce((s, r) => s + r.count, 0);
  const totalBypasses = bypassesByRoute.reduce((s, r) => s + r.count, 0);
  const total = totalHits + totalMisses + totalBypasses;
  const hitRatio = total > 0 ? totalHits / total : 0;

  return {
    total,
    hits: totalHits,
    misses: totalMisses,
    bypasses: totalBypasses,
    hitRatio,
    byRoute: hitsByRoute.map((h, i) => ({
      route: h.route,
      hits: h.count,
      misses: missesByRoute[i]?.count ?? 0,
      bypasses: bypassesByRoute[i]?.count ?? 0
    }))
  };
};

/** Reset for tests / admin /reset hook. */
export const resetCacheStats = (): void => {
  cacheHits.reset();
  cacheMisses.reset();
  cacheBypasses.reset();
};