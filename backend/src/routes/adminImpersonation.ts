// Admin impersonation routes — start/stop a bounded session.
//
// All routes require admin role. The actual swap of req.user happens
// in authenticateJWT when the client sends X-Impersonation-Session
// on subsequent requests.
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { validate } from '../validators';
import {
  startImpersonation,
  endImpersonation,
  listSessionsForAdmin,
  listAllSessions,
  ImpersonationError
} from '../services/impersonationService';
import { logger } from '../utils/logger';
import { parseCursor, afterCursorWhere, splitPage } from '../utils/cursorPaginate';

const router = Router();

// All endpoints below require admin auth (real or impersonation).
// Impersonation endpoints themselves cannot be reached while
// impersonating — that's by design. We add an extra guard.
const requireRealAdmin = (req: any, res: Response, next: any) => {
  if (req.realAdmin) {
    return res.status(403).json({
      error: 'Cannot manage impersonation while already impersonating. Stop the current session first.'
    });
  }
  next();
};

const StartSchema = z.object({
  targetId: z.string().min(8).max(64),
  reason: z.string().max(500).optional()
});

// POST /admin/impersonate — start an impersonation session.
router.post('/impersonate',
  authenticateJWT,
  requireRole('admin'),
  requireRealAdmin,
  validate({ body: StartSchema }),
  async (req: any, res: Response) => {
    try {
      const ipAddress = (req.ip || req.headers['x-forwarded-for'] || '').toString().slice(0, 64);
      const userAgent = (req.headers['user-agent'] || '').toString().slice(0, 500);

      const session = await startImpersonation({
        adminId: req.user.userId,
        targetId: req.body.targetId,
        reason: req.body.reason,
        ipAddress,
        userAgent
      });

      // Set the response header so the client can echo it back on
      // subsequent requests (alternative to localStorage for SSR-safe
      // flows).
      res.setHeader('X-Impersonation-Session', session.id);
      res.status(201).json(session);
    } catch (e: any) {
      if (e instanceof ImpersonationError) {
        return res.status(400).json({ error: e.message, code: e.code });
      }
      logger.error({ err: e }, 'start impersonation failed');
      res.status(500).json({ error: 'Failed to start impersonation' });
    }
  }
);

// DELETE /admin/impersonate/:sessionId — end an active session.
// Admin can only end sessions they own (session.adminId === req.user.userId).
router.delete('/impersonate/:sessionId',
  authenticateJWT,
  requireRole('admin'),
  requireRealAdmin,
  async (req: any, res: Response) => {
    const { sessionId } = req.params;
    // Scope to the calling admin's own sessions — an admin cannot end another
    // admin's session by guessing/knowing its id.
    const ended = await endImpersonation(sessionId, req.user.userId, true);
    if (ended === 0) {
      return res.status(404).json({ error: 'No active session with that ID' });
    }
    res.json({ ok: true, ended });
  }
);

// GET /admin/impersonation/sessions — audit log of recent sessions
// for the calling admin. Cursor-paginated so deep scrolling (e.g. an
// admin reviewing the last 6 months of sessions) stays O(1) per page.
router.get('/impersonation/sessions',
  authenticateJWT,
  requireRole('admin'),
  requireRealAdmin,
  async (req: any, res: Response) => {
    try {
      const { cursor, limit, take } = parseCursor(req.query as any, 50);
      const where: any = { adminId: req.user.userId };
      if (cursor) {
        // Append the cursor pagination WHERE on top of the admin filter.
        Object.assign(where, { AND: afterCursorWhere(cursor, 'startedAt') });
      }
      const sessions = await prisma.impersonationSession.findMany({
        where,
        orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
        take,
        include: {
          target: { select: { id: true, name: true, email: true, role: true } }
        }
      });
      const { items, nextCursor, hasMore } = splitPage(sessions, limit, 'startedAt');
      res.json({ items, nextCursor, hasMore });
    } catch (error) {
      logger.error({ err: error }, 'List impersonation sessions error');
      res.status(500).json({ error: 'Failed to list sessions' });
    }
  }
);

// GET /admin/impersonation/status — current impersonation status.
// Returns the active session for the calling admin (or null when not
// impersonating). The frontend's `useImpersonation` polls this on mount
// to hydrate the sticky banner without a full page reload.
router.get('/status',
  authenticateJWT,
  async (req: any, res: Response) => {
    try {
      const sessions = await listSessionsForAdmin(req.user.userId, 1);
      const active = sessions.find(s => !s.endedAt && s.expiresAt && new Date(s.expiresAt).getTime() > Date.now());
      if (!active) {
        return res.json({ active: false });
      }
      res.json({
        active: true,
        sessionId: active.id,
        targetId: active.targetId,
        targetName: active.target?.name ?? null,
        targetEmail: active.target?.email ?? null,
        expiresAt: active.expiresAt,
        startedAt: active.startedAt
      });
    } catch (e: any) {
      logger.error({ err: e }, 'read impersonation status failed');
      res.status(500).json({ error: 'Failed to read impersonation status' });
    }
  }
);

// GET /admin/impersonation/all — super-admin view of every session.
// Kept as a separate endpoint so we can add additional RBAC later
// (e.g. only super-admins can see this).
router.get('/impersonation/all',
  authenticateJWT,
  requireRole('admin'),
  requireRealAdmin,
  async (req: any, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const sessions = await listAllSessions(limit);
    res.json({ rows: sessions, count: sessions.length });
  }
);

export default router;
