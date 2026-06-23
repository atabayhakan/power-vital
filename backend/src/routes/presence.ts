// Presence routes — a small REST surface for the live visitor
// counters. Heartbeats come in on POST /api/v1/presence; reads
// go out on GET /api/v1/presence/:productId. The admin endpoint
// GET /api/v1/presence/admin/all returns the top-N product list
// for the dashboard.
//
// No auth on POST/GET (visitors are anonymous by definition);
// the admin endpoint is behind the standard admin role guard.

import { Router, Request, Response } from 'express';
import { recordHeartbeat, getCount, getAllCounts, startPresenceCleanup, sweep } from '../services/presenceService';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';
import { validate } from '../validators';

const router = Router();

// Boot the cleanup cron once (idempotent).
startPresenceCleanup();

/**
 * POST /api/v1/presence
 * Body: { productId, sessionId }
 * Returns: { count }
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { productId, sessionId } = req.body as { productId?: string; sessionId?: string };
    if (!productId || !sessionId) {
      return res.status(400).json({ error: 'productId and sessionId are required' });
    }
    if (typeof productId !== 'string' || productId.length > 191) {
      return res.status(400).json({ error: 'productId is too long' });
    }
    if (typeof sessionId !== 'string' || sessionId.length < 8 || sessionId.length > 191) {
      return res.status(400).json({ error: 'sessionId must be 8-191 chars' });
    }
    const count = recordHeartbeat(productId, sessionId);
    res.json({ count });
  } catch (err: any) {
    logger.error({ err }, 'presence heartbeat error:');
    res.status(500).json({ error: 'Failed to record heartbeat' });
  }
});

/**
 * GET /api/v1/presence/:productId
 * Returns: { count }
 */
router.get('/:productId', (req: Request, res: Response) => {
  try {
    const productId = String(req.params.productId);
    if (!productId || productId.length > 191) {
      return res.status(400).json({ error: 'productId is required' });
    }
    const count = getCount(productId);
    res.json({ count });
  } catch (err: any) {
    logger.error({ err }, 'presence read error:');
    res.status(500).json({ error: 'Failed to read count' });
  }
});

/**
 * GET /api/v1/presence/admin/all
 * Returns: { items: [{ productId, count }], activeSessions, totalSwept }
 */
router.get('/admin/all', authenticateJWT, requireRole('admin'), (_req: Request, res: Response) => {
  try {
    const items = getAllCounts();
    const activeSessions = items.reduce((s, x) => s + x.count, 0);
    res.json({
      items: items.slice(0, 50), // cap at 50 for the admin list
      activeSessions,
      productCount: items.length
    });
  } catch (err: any) {
    logger.error({ err }, 'presence admin read error:');
    res.status(500).json({ error: 'Failed to read presence list' });
  }
});

/**
 * POST /api/v1/presence/admin/sweep
 * Admin-only manual sweep — useful when debugging memory growth.
 */
router.post('/admin/sweep', authenticateJWT, requireRole('admin'), (_req: Request, res: Response) => {
  const result = sweep();
  res.json(result);
});

export default router;
