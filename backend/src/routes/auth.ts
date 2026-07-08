import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { authenticateJWT } from '../middleware/auth';
import { validate, RegisterSchema, LoginSchema, ChangePasswordSchema, RefreshTokenSchema, ProfileUpdateSchema, ProfileUpdateInput } from '../validators';
import { logger } from '../utils/logger';
import { limit, RATE_LIMITS } from '../utils/rateLimit';
import {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  RefreshError,
  TOKEN_TTL
} from '../services/tokenService';
import { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } from '../utils/refreshCookie';

const router = Router();

// bcrypt work factor. 12 (~250ms/hash on modern hardware) is the current
// OWASP-recommended floor. Existing cost-10 hashes still verify fine —
// bcrypt encodes the cost in the hash, so bcrypt.compare is agnostic; only
// newly created hashes use the higher factor.
const BCRYPT_ROUNDS = 12;

// /api/v1/auth/register — 3/hour per IP
router.post('/register', limit(RATE_LIMITS.auth.register), validate({ body: RegisterSchema }), async (req: Request, res: Response) => {
  try {
    const { name, email, password, sponsorId } = req.body as {
      name: string; email: string; password: string; sponsorId?: string | null;
    };

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const role = 'customer'; // Gamified Ascension: All new users start as customers

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        sponsorId: sponsorId || null,
        role,
      }
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    logger.error({ err: error }, 'Registration Error:');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// /api/v1/auth/login — 5/15min per IP (brute-force resistant)
// Issues: short-lived access token (15m) + long-lived refresh token (7d).
// The refresh token is also set as an HttpOnly cookie for browser clients.
router.post('/login', limit(RATE_LIMITS.auth.login), validate({ body: LoginSchema }), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const accessToken = signAccessToken({ id: user.id, role: user.role });
    const { raw: refreshRaw, jwt: refreshJwt } = await issueRefreshToken({
      userId: user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // HttpOnly cookie so the browser SPA can refresh automatically.
    // The raw token is also returned in JSON for non-browser clients
    // (mobile apps, curl, server-to-server).
    setRefreshCookie(res, refreshRaw);

    res.json({
      message: 'Login successful',
      accessToken,
      token: accessToken, // legacy alias (deprecated) — existing frontends still work
      refreshToken: refreshJwt,
      expiresIn: TOKEN_TTL.access,
      refreshExpiresIn: TOKEN_TTL.refresh,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        city: user.city,
        birthDate: user.birthDate,
        walletBalanceKgs: user.walletBalanceKgs,
        walletBalanceUsd: user.walletBalanceUsd,
        cumulativeSpendKgs: user.cumulativeSpendKgs,
        loyaltyLevel: user.loyaltyLevel,
        dynamicDiscountRate: user.dynamicDiscountRate
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Login Error:');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// /api/v1/auth/refresh — Rotate the refresh token
// Reads the raw refresh token from EITHER:
//   • the HttpOnly cookie (set by /login), OR
//   • the request body (for non-browser clients)
// Then validates + rotates. If the supplied token has already been used
// (replay), the entire family is revoked and 401 is returned.
router.post('/refresh', limit({ name: 'auth:refresh', max: 30, windowSeconds: 60 }), validate({ body: RefreshTokenSchema }), async (req: Request, res: Response) => {
  try {
    const raw = (req.body?.refreshToken as string | undefined) || (req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined);
    if (!raw) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const { raw: newRaw, jwt: newJwt, userId } = await rotateRefreshToken({
      raw,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    const accessToken = signAccessToken({ id: user.id, role: user.role });

    setRefreshCookie(res, newRaw);

    res.json({
      accessToken,
      refreshToken: newJwt,
      expiresIn: TOKEN_TTL.access,
      refreshExpiresIn: TOKEN_TTL.refresh,
      tokenType: 'Bearer'
    });
  } catch (err) {
    if (err instanceof RefreshError) {
      // Replay or invalid — kill the cookie so the browser drops it too.
      clearRefreshCookie(res);
      const status = err.code === 'replay_detected' ? 401 : 401;
      return res.status(status).json({ error: err.message, code: err.code });
    }
    logger.error({ err }, 'Refresh Error');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// /api/v1/auth/logout — Revoke the refresh token (and its whole family).
// Access tokens issued before this call will remain valid until they
// expire (15 min) — for immediate invalidation we'd need a JWT denylist,
// which is overkill for a logout button.
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const raw = (req.body?.refreshToken as string | undefined) || (req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined);
    if (raw) {
      await revokeRefreshToken(raw);
    }
    clearRefreshCookie(res);
    res.json({ message: 'Logged out' });
  } catch (err) {
    logger.error({ err }, 'Logout Error');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// /api/v1/users/me
router.get('/me', authenticateJWT, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        city: true,
        birthDate: true,
        walletBalanceKgs: true,
        walletBalanceUsd: true,
        cumulativeSpendKgs: true,
        loyaltyLevel: true,
        dynamicDiscountRate: true,
        sponsorId: true,
        createdAt: true
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/v1/auth/me — self-service profile edit (name/phone/address/city/
// birthDate only; email/role/wallet/loyalty are never editable here).
router.put('/me', authenticateJWT, validate({ body: ProfileUpdateSchema }), async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { name, phone, address, city, birthDate } = req.body as ProfileUpdateInput;
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(city !== undefined ? { city } : {}),
        ...(birthDate !== undefined ? { birthDate: birthDate ? new Date(birthDate) : null } : {})
      },
      select: {
        id: true, name: true, email: true, role: true,
        phone: true, address: true, city: true, birthDate: true,
        walletBalanceKgs: true, walletBalanceUsd: true,
        cumulativeSpendKgs: true, loyaltyLevel: true, dynamicDiscountRate: true,
        sponsorId: true, createdAt: true
      }
    });
    res.json(user);
  } catch (error) {
    logger.error({ err: error }, 'Update Profile Error:');
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/v1/auth/network - Fetch Distributor Downline (Network Tree)
// Recursive: kendi upline'dan başlayarak N-seviye ağacı getirir
router.get('/network', authenticateJWT, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    // Authenticated kullanıcının kendisini root kabul et, yoksa admin fallback
    let rootUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        walletBalanceUsd: true,
        walletBalanceKgs: true
      }
    });

    // Eğer user bulunamazsa, ilk admin/distributor'u root yap
    if (!rootUser) {
      rootUser = await prisma.user.findFirst({
        where: { OR: [{ role: 'admin' }, { role: 'distributor' }] },
        select: {
          id: true,
          name: true,
          role: true,
          walletBalanceUsd: true,
          walletBalanceKgs: true
        }
      });
    }

    if (!rootUser) {
      return res.status(404).json({ error: 'No root network found' });
    }

    // Recursive ağaç kurucusu — depth limit ile sonsuz döngüyü engelle
    const MAX_DEPTH = 8;
    async function buildSubtree(uid: string, depth: number): Promise<any[]> {
      if (depth >= MAX_DEPTH) return [];
      const children = await prisma.user.findMany({
        where: { sponsorId: uid },
        select: {
          id: true,
          name: true,
          role: true,
          walletBalanceUsd: true,
          walletBalanceKgs: true,
          isMonthlyActive: true,
          createdAt: true
        },
        orderBy: { createdAt: 'asc' }
      });
      // Map each child and attach their subtree
      const result: any[] = [];
      for (const child of children) {
        const subtree = await buildSubtree(child.id, depth + 1);
        result.push({ ...child, children: subtree });
      }
      return result;
    }

    const children = await buildSubtree(rootUser.id, 0);

    res.json({
      ...rootUser,
      children,
      totalDownline: await prisma.user.count({ where: { sponsorId: rootUser.id } })
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Fetch Network Error:');
    res.status(500).json({ error: 'Failed to fetch network tree' });
  }
});

// PUT /api/v1/auth/change-password — 5/hour per user
router.put('/change-password', authenticateJWT, limit(RATE_LIMITS.auth.changePwd), validate({ body: ChangePasswordSchema }), async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    logger.error({ err: error }, 'Change Password Error:');
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
