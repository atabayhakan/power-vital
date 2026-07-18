import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { touchSession, ImpersonationError } from '../services/impersonationService';

interface AuthRequest extends Request {
  user?: any;
  realAdmin?: { id: string; role: string };  // original admin when impersonating
  impersonationSessionId?: string;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
      return res.status(401).json({ error: 'Token missing' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('FATAL: JWT_SECRET environment variable is not set!');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Cast through `any`: @types/jsonwebtoken's overloads reject the (token,
    // secret, callback) form under strict resolution even though it's valid at
    // runtime. Callback params are already `any`, so no real safety is lost.
    (jwt.verify as any)(token, secret, async (err: any, user: any) => {
      if (err) {
        return res.status(401).json({ error: 'Token is invalid or expired' });
      }
      // 🛡️ Token-type confusion guard. Refresh tokens are signed with the
      // same secret when REFRESH_TOKEN_SECRET is unset (see tokenService),
      // so a stolen refresh JWT would otherwise verify here and act as a
      // 7-day Bearer credential that survives family revocation. Access
      // tokens carry `type: 'access'`; reject anything that declares a
      // different type. Tokens with no type claim are treated as legacy
      // access tokens and still accepted (access TTL is 15m).
      if (user?.type && user.type !== 'access') {
        return res.status(401).json({ error: 'Token is invalid or expired' });
      }
      // Normalise the decoded payload — tokenService signs with `{id, role}`
      // but legacy middleware/helpers expect `userId`. Provide both so
      // every callsite works without touching the sign side.
      const userId = user.userId || user.id || user.uid;
      if (userId && !user.userId) user.userId = userId;
      req.user = user;

      // ── Impersonation swap ──────────────────────────────────────
      // If the request carries a valid X-Impersonation-Session header
      // AND the caller is an admin AND the session is alive, replace
      // req.user with the target's identity. The original admin is
      // kept on req.realAdmin so audit code can attribute actions to
      // the operator.
      const sessionId = req.headers['x-impersonation-session'];
      if (sessionId && typeof sessionId === 'string' && user?.role === 'admin') {
        try {
          const session = await touchSession(sessionId);
          if (!session) {
            return res.status(401).json({ error: 'Impersonation session expired or invalid' });
          }
          if (session.adminId !== user.userId) {
            return res.status(403).json({ error: 'Session does not belong to this admin' });
          }
          // Load target user
          const target = await prisma.user.findUnique({
            where: { id: session.targetId },
            select: { id: true, name: true, email: true, role: true, preferredLocale: true }
          });
          if (!target) {
            return res.status(401).json({ error: 'Impersonation target no longer exists' });
          }
          req.realAdmin = { id: user.userId, role: user.role };
          req.impersonationSessionId = session.id;
          req.user = {
            ...user,
            userId: target.id,
            role: target.role,
            email: target.email,
            // Don't expose impersonation trivially — include marker for
            // downstream tools that need to detect it.
            impersonatedBy: user.userId,
            impersonationSessionId: session.id
          };
        } catch (e: any) {
          if (e instanceof ImpersonationError) {
            return res.status(400).json({ error: e.message, code: e.code });
          }
          return res.status(500).json({ error: 'Impersonation check failed' });
        }
      }
      next();
    });
  } else {
    res.status(401).json({ error: 'Authorization header is missing' });
  }
};

// optionalJWT — attaches req.user when a VALID Bearer access token is present,
// but never rejects the request. Used by public endpoints that behave slightly
// better for logged-in users (e.g. /contact derives name/email from the profile).
// Invalid/expired tokens are ignored (treated as anonymous) — a guest with a
// stale token must still be able to use the public form.
export const optionalJWT = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return next();

  (jwt.verify as any)(token, secret, (err: any, user: any) => {
    if (!err && user && (!user.type || user.type === 'access')) {
      const userId = user.userId || user.id || user.uid;
      if (userId && !user.userId) user.userId = userId;
      req.user = user;
    }
    next();
  });
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Hard guard: admins CANNOT impersonate other admins into admin
    // routes. If we're impersonating, the role check is against the
    // target's role (which is non-admin for impersonation targets),
    // so this naturally rejects admin impersonation escalation.
    next();
  };
};

// Helper used by routes that need to attribute an action to the
// real operator rather than the impersonated user.
export const getActorId = (req: AuthRequest): string => {
  return req.realAdmin?.id || req.user?.userId || 'unknown';
};
