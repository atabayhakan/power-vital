// /health and /health/ready — observability for load balancers + humans.
//
//   GET /health       — liveness: process is up, basic info, no DB call (fast)
//   GET /health/ready — readiness: DB reachable? Returns 503 if not.
//
// Liveness should be cheap; readiness can be slow. Keep them separate.
import { Request, Response, Router } from 'express';
import prisma from '../lib/prisma';
import { logger } from '../utils/logger';

const router = Router();

const startedAt = Date.now();

router.get('/', (req: Request, res: Response) => {
  const mem = process.memoryUsage();
  res.status(200).json({
    status: 'ok',
    service: 'pv-backend',
    env: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
    memory: {
      rssMB: Math.round(mem.rss / 1024 / 1024),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024)
    }
  });
});

router.get('/ready', async (req: Request, res: Response) => {
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  // DB ping — single trivial query
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (err: any) {
    checks.database = { ok: false, error: err?.message || 'Unknown error' };
    req.log?.error({ err: err?.message }, 'health: database ping failed');
  }

  const allOk = Object.values(checks).every(c => c.ok);
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ready' : 'degraded',
    checks
  });
});

export default router;
