// GET /metrics — Prometheus exposition format.
//
// This endpoint is INTENTIONALLY public (no auth) because Prometheus
// scrapers don't carry user credentials. In production, restrict
// access at the network layer:
//   • nginx: allow only internal IPs (e.g. 10.0.0.0/8, 172.16.0.0/12)
//   • Or put /metrics behind a separate internal-only nginx vhost
//
// The body is generated from the in-process metrics registry. The
// /admin/metrics endpoint (which returns the same data as JSON) is
// the human-readable equivalent for the admin dashboard.
import { Router, Request, Response } from 'express';
import { renderPrometheusExposition } from '../utils/prometheusExporter';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(renderPrometheusExposition());
});

export default router;
