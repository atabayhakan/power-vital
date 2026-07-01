// POST /api/v1/errors/report — accept front-end error reports and
// persist them for admin triage. Open to anonymous users (a broken
// page often happens BEFORE auth finishes), but rate-limited so a
// runaway client can't fill the table.
//
// Why not Sentry / GlitchTip?
//   • Zero external dependency for a single-server deployment.
//   • All PII (user id, route, error message) stays in our MySQL.
//   • The admin can resolve / annotate errors in-app.
//
// Security:
//   • Message is truncated to 500 chars and stack to 32 KB.
//   • Context JSON is truncated to 2 KB.
//   • Rate-limited per IP (60 reports / 5 minutes) — generous for
//     real usage, throttles malicious clients.
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { authenticateJWT } from '../middleware/auth';
import { limit } from '../utils/rateLimit';

const router = Router();

// Only the public, unauthenticated /report endpoint needs abuse
// protection. Scoping it here (rather than at the router mount in
// index.ts) keeps it from also wrapping the admin-only /recent and
// /:id/resolve routes below.
const reportLimiter = limit({
  name: 'errors:report',
  max: 60,
  windowSeconds: 300
});

// Limits — keep generous for "real" crash reports, low enough that a
// malicious client can't fill the table in seconds.
const MAX_MESSAGE = 500;
const MAX_STACK = 32 * 1024;
const MAX_CONTEXT = 2 * 1024;
const MAX_AGENT = 500;
const MAX_ROUTE = 200;

const ReportSchema = z.object({
  // Required — we need at least a message to triage.
  message: z.string().min(1).max(MAX_MESSAGE),
  // Optional but useful — full stack if available.
  stack: z.string().max(MAX_STACK).optional(),
  // Which wrapper reported the error. Free-form string so we don't
  // have to bump the schema every time we add a new ErrorBoundary
  // scope.
  source: z.string().min(1).max(80),
  // Vue lifecycle phase or wrapper hint.
  phase: z.string().max(80).optional(),
  // Current route at the moment of the error.
  route: z.string().max(MAX_ROUTE).optional(),
  // Active locale.
  locale: z.string().max(8).optional(),
  // Free-form context (JSON-serialisable object as a string).
  context: z.string().max(MAX_CONTEXT).optional(),
  // Client-reported timestamp (informational only; we record our own).
  clientTimestamp: z.string().datetime().optional(),
});

router.post('/report', reportLimiter, async (req: Request, res: Response) => {
  const parsed = ReportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid payload', details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;
  const userId = (req as any).user?.id ?? null;
  const uaHeader = req.headers['user-agent'];
  const userAgent: string = (Array.isArray(uaHeader) ? uaHeader[0] : uaHeader ?? '').slice(0, MAX_AGENT);

  try {
    const row = await prisma.clientError.create({
      data: {
        userId,
        source: data.source,
        message: data.message,
        stack: data.stack ?? null,
        phase: data.phase ?? null,
        route: data.route ?? null,
        locale: data.locale ?? null,
        userAgent: userAgent ?? null,
        context: data.context ?? null,
      },
      select: { id: true, createdAt: true },
    });
    logger.warn({
      errId: row.id,
      source: data.source,
      route: data.route,
      messagePreview: data.message.slice(0, 80),
    }, 'client error reported');
    res.status(201).json({ id: row.id, receivedAt: row.createdAt });
  } catch (e: any) {
    logger.error({ err: e.message, source: data.source }, 'failed to persist client error');
    res.status(500).json({ error: 'failed to persist' });
  }
});

// GET /api/v1/errors/recent — admin-only feed of recent errors.
// Used by the AdminEventsView error feed tab. Limit defaults to 50 and
// is hard-capped at 200 so a curious admin can't pull the whole table
// by accident.
router.get('/recent', authenticateJWT, async (req: Request, res: Response) => {
  if (!(req as any).user) {
    res.status(401).json({ error: 'auth required' });
    return;
  }
  const role = (req as any).user?.role;
  if (role !== 'admin') {
    res.status(403).json({ error: 'admin only' });
    return;
  }
  const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 200);
  const includeResolved = req.query.resolved === 'true';

  const rows = await prisma.clientError.findMany({
    where: includeResolved ? {} : { resolved: false },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      source: true,
      message: true,
      route: true,
      locale: true,
      userId: true,
      resolved: true,
      createdAt: true,
    },
  });
  res.json({ errors: rows, total: rows.length });
});

const ResolveSchema = z.object({
  resolvedNote: z.string().max(2000).optional(),
});

// POST /api/v1/errors/:id/resolve — admin marks an error as handled.
router.post('/:id/resolve', authenticateJWT, async (req: Request, res: Response) => {
  if (!(req as any).user) {
    res.status(401).json({ error: 'auth required' });
    return;
  }
  const role = (req as any).user?.role;
  if (role !== 'admin') {
    res.status(403).json({ error: 'admin only' });
    return;
  }
  const parsed = ResolveSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid payload' });
    return;
  }
  const errorId = String(req.params.id ?? '');
  if (!errorId) {
    res.status(400).json({ error: 'id required' });
    return;
  }
  const row = await prisma.clientError.update({
    where: { id: errorId },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: String((req as any).user?.id ?? ''),
      resolvedNote: parsed.data.resolvedNote ?? null,
    },
    select: { id: true, resolved: true, resolvedAt: true },
  }).catch(() => null);
  if (!row) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  res.json(row);
});

export default router;