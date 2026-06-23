// Impersonation service — admin can act as any non-admin user for
// a bounded session (60 minutes hard cap, 15 minutes of inactivity).
//
// SECURITY MODEL:
//   • Only roles=['admin'] can start an impersonation session.
//   • Admins CANNOT impersonate other admins (prevents escalation).
//   • Every request made DURING impersonation is logged with the
//     original admin's actorId (audit trail preserved).
//   • The active session ID travels in the `X-Impersonation-Session`
//     header; we re-validate it on every request to prevent session
//     smuggling after expiry.
//
// The Express middleware `attachImpersonation` (middleware/auth.ts)
// swaps req.user to the target's identity when the header is valid.
// Routes that need to know the REAL admin (e.g. audit trails) read
// `req.realAdmin`.

import prisma from '../lib/prisma';
import { logger } from '../utils/logger';

export const MAX_SESSION_MS = 60 * 60 * 1000;       // 60 min hard cap
export const INACTIVITY_MS  = 15 * 60 * 1000;        // 15 min idle timeout

// In-memory last-activity tracker for the inactivity timeout. The app runs as a
// single PM2 fork, so a process-local Map is sufficient and avoids a DB write on
// every impersonated request. On a restart the map resets — the worst case is a
// session falling back to the DB-backed 60-minute hard cap, which is still bounded.
const lastSeenAt = new Map<string, number>();

export interface ActiveSession {
  id: string;
  adminId: string;
  targetId: string;
  startedAt: Date;
  expiresAt: Date;
  lastSeenAt: Date;
}

/**
 * Start a new impersonation session. Returns the session object
 * (with expiresAt) so the admin knows how long they have.
 */
export const startImpersonation = async (input: {
  adminId: string;
  targetId: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ id: string; expiresAt: Date; targetName: string; targetEmail: string }> => {
  // Sanity: cannot impersonate self, cannot impersonate another admin.
  if (input.adminId === input.targetId) {
    throw new ImpersonationError('cannot_impersonate_self', 'Admin cannot impersonate themselves');
  }
  const target = await prisma.user.findUnique({
    where: { id: input.targetId },
    select: { id: true, name: true, email: true, role: true }
  });
  if (!target) throw new ImpersonationError('target_not_found', 'Target user not found');
  if (target.role === 'admin') {
    throw new ImpersonationError('cannot_impersonate_admin', 'Cannot impersonate other admins');
  }

  // End any prior active sessions for this admin (one at a time).
  await prisma.impersonationSession.updateMany({
    where: { adminId: input.adminId, endedAt: null },
    data: { endedAt: new Date(), endedByAdmin: false }
  });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + MAX_SESSION_MS);

  const session = await prisma.impersonationSession.create({
    data: {
      admin: { connect: { id: input.adminId } },
      target: { connect: { id: input.targetId } },
      reason: input.reason?.slice(0, 500),
      ipAddress: input.ipAddress?.slice(0, 64),
      userAgent: input.userAgent?.slice(0, 500),
      expiresAt
    }
  });

  logger.info({
    sessionId: session.id,
    adminId: input.adminId,
    targetId: input.targetId,
    targetName: target.name,
    expiresAt
  }, 'impersonation started');

  return {
    id: session.id,
    expiresAt,
    targetName: target.name,
    targetEmail: target.email
  };
};

/**
 * End an impersonation session. Returns the number of sessions ended.
 * When `adminId` is provided, the session is only ended if it belongs to that
 * admin — an admin cannot end another admin's session by knowing its id.
 * Pass `adminId = undefined` for internal/system expiry (e.g. inactivity).
 */
export const endImpersonation = async (
  sessionId: string,
  adminId?: string,
  endedByAdmin = true
): Promise<number> => {
  const where: any = { id: sessionId, endedAt: null };
  if (adminId) where.adminId = adminId;
  const result = await prisma.impersonationSession.updateMany({
    where,
    data: { endedAt: new Date(), endedByAdmin }
  });
  if (result.count > 0) {
    lastSeenAt.delete(sessionId);
    logger.info({ sessionId, adminId, endedByAdmin }, 'impersonation ended');
  }
  return result.count;
};

/**
 * Look up a session and refresh lastSeenAt (used by middleware on
 * every request). Returns null if the session is invalid, expired,
 * or has been ended.
 */
export const touchSession = async (sessionId: string): Promise<ActiveSession | null> => {
  const session = await prisma.impersonationSession.findUnique({
    where: { id: sessionId },
    select: { id: true, adminId: true, targetId: true, startedAt: true, expiresAt: true, endedAt: true }
  });
  if (!session || session.endedAt) return null;

  const now = new Date();
  const nowMs = now.getTime();
  if (now > session.expiresAt) {
    // Auto-expire on read (hard 60-minute cap).
    await prisma.impersonationSession.update({
      where: { id: sessionId },
      data: { endedAt: now, endedByAdmin: false }
    });
    lastSeenAt.delete(sessionId);
    return null;
  }

  // Inactivity timeout: if the last seen activity was more than INACTIVITY_MS
  // ago, end the session. The first request after a restart seeds the map from
  // `now` (no stored value), so an idle session is bounded by the hard cap then.
  const seen = lastSeenAt.get(sessionId);
  if (seen !== undefined && nowMs - seen > INACTIVITY_MS) {
    await prisma.impersonationSession.update({
      where: { id: sessionId },
      data: { endedAt: now, endedByAdmin: false }
    });
    lastSeenAt.delete(sessionId);
    return null;
  }
  lastSeenAt.set(sessionId, nowMs);

  return {
    id: session.id,
    adminId: session.adminId,
    targetId: session.targetId,
    startedAt: session.startedAt,
    expiresAt: session.expiresAt,
    lastSeenAt: now
  };
};

/**
 * List active + recent sessions for an admin. Used by the audit UI.
 */
export const listSessionsForAdmin = async (adminId: string, limit = 50) => {
  return prisma.impersonationSession.findMany({
    where: { adminId },
    orderBy: { startedAt: 'desc' },
    take: limit,
    include: { target: { select: { id: true, name: true, email: true, role: true } } }
  });
};

/**
 * List all sessions across admins. Used by super-admin audit page.
 */
export const listAllSessions = async (limit = 100) => {
  return prisma.impersonationSession.findMany({
    orderBy: { startedAt: 'desc' },
    take: limit,
    include: {
      admin:  { select: { id: true, name: true, email: true, role: true } },
      target: { select: { id: true, name: true, email: true, role: true } }
    }
  });
};

export class ImpersonationError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'ImpersonationError';
  }
}
