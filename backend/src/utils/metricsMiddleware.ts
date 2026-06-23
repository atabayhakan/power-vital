// Metrics middleware — wraps every request to capture status code +
// duration. Runs AFTER the route handler completes (so res.statusCode
// is set) and before res.end emits the response.
import { Request, Response, NextFunction } from 'express';
import { metrics } from './metrics';

/**
 * Track a single HTTP request's outcome. The label set is small and
 * stable: route template (e.g. /api/v1/products/:id), method, and
 * a coarse status class — never the raw numeric code (which would
 * explode the label cardinality).
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip /health and metrics endpoint itself so health checks don't
  // pollute the dashboard
  if (req.path === '/health' || req.path === '/health/ready' || req.path.startsWith('/api/v1/admin/metrics')) {
    return next();
  }

  // req.route is only populated after Express dispatches. We use the
  // baseUrl + path as a fallback so we still get useful grouping for
  // 404s.
  const startNs = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startNs) / 1_000_000;
    const route = (req as any).route?.path
      ? `${req.baseUrl || ''}${(req as any).route.path}`
      : `${req.baseUrl || ''}${req.path}`;
    const statusClass = `${Math.floor(res.statusCode / 100)}xx`;
    const labels = { route, method: req.method, status: statusClass };
    metrics.httpRequestsTotal.inc(labels);
    metrics.httpRequestDurationMs.observe({ route, method: req.method }, durationMs);
  });
  next();
};
