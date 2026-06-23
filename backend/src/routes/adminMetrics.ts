// GET /api/v1/admin/metrics — admin-only metrics dashboard endpoint.
//
// Returns the current snapshot of every counter + histogram. The
// frontend dashboard polls this every 5 seconds; data resets on
// process restart (that's fine — operators expect "live" data, not
// historical).
//
// For long-term retention, pipe the same payload to Prometheus /
// OpenTelemetry / a database-backed TSDB. Out of scope here.
import { Router, Request, Response } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { collectMetrics, resetAllMetrics } from '../utils/metrics';
import { logger } from '../utils/logger';

const router = Router();

router.get('/', authenticateJWT, requireRole('admin'), (req: Request, res: Response) => {
  const data = collectMetrics();
  res.json(data);
});

// Reset all metrics. Behind a guard to make the call intentional.
// Useful for ops: "clear the counters, run a synthetic load, see what
// the dashboard reports".
router.post('/reset', authenticateJWT, requireRole('admin'), (req: any, res: Response) => {
  resetAllMetrics();
  logger.warn({ userId: req.user?.id }, 'metrics reset by admin');
  res.json({ ok: true });
});

export default router;
