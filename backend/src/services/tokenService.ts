// Refresh token service.
//
// Flow:
//   1. POST /auth/login            → access (15m) + refresh (7d) + family
//   2. POST /auth/refresh          → rotate (revoke old, issue new in same family)
//   3. POST /auth/logout           → revoke the family
//   4. Refresh token reuse on /auth/refresh → REVOKE WHOLE FAMILY
//      (this is the "replay detection" — if a stolen token is replayed,
//       the legitimate user trying to rotate it later will trigger this
//       branch and invalidate every token the attacker has).
//
// Storage: only the SHA-256 of the raw token is stored in MySQL. The raw
// token only ever lives in the HttpOnly cookie on the client. A DB leak
// therefore does NOT leak valid tokens.

import { createHash, randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { logger } from '../utils/logger';

const ACCESS_TTL_SECONDS = 15 * 60;          // 15 minutes (auto-refreshed on 401 via the 7-day refresh token)
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
if (!ACCESS_SECRET || !REFRESH_SECRET) {
  // Don't throw at module load — tests may stub these. Routes call sign
  // only after auth, so missing secret only matters at request time.
  logger.warn('JWT_SECRET / REFRESH_TOKEN_SECRET not set — token signing will fail');
}

export interface AccessTokenPayload {
  id: string;
  role: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  // We use a "sub" claim with the row's id (so we can revoke individually
  // + cross-check the SHA-256 hash before honouring rotation)
  sub: string;        // = RefreshToken.id
  uid: string;        // = userId
  fam: string;        // = family
  jti: string;        // = unique row token id (== sub for simplicity)
  type: 'refresh';
}

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

/** Generate a cryptographically random refresh-token string. */
export const generateRefreshTokenString = (): string =>
  randomBytes(48).toString('base64url'); // 64 chars

/** Hash a raw refresh token for DB storage / lookup. */
export const hashRefreshToken = (raw: string): string => sha256(raw);

/** Sign a short-lived access token (15 min). */
export const signAccessToken = (payload: { id: string; role: string }): string => {
  if (!ACCESS_SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.sign(
    { ...payload, type: 'access' },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL_SECONDS }
  );
};

/** Sign a long-lived refresh token (7 days). */
export const signRefreshToken = (payload: RefreshTokenPayload): string => {
  if (!REFRESH_SECRET) throw new Error('REFRESH_TOKEN_SECRET is not set');
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TTL_SECONDS });
};

/** Verify an access token. Throws on invalid/expired. */
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  if (!ACCESS_SECRET) throw new Error('JWT_SECRET is not set');
  const decoded = jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
  if (decoded.type !== 'access') throw new Error('Wrong token type');
  return decoded;
};

/** Verify a refresh token. Throws on invalid/expired. */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  if (!REFRESH_SECRET) throw new Error('REFRESH_TOKEN_SECRET is not set');
  const decoded = jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
  if (decoded.type !== 'refresh') throw new Error('Wrong token type');
  return decoded;
};

/** Issue a fresh refresh token + DB row for a user. */
export const issueRefreshToken = async (params: {
  userId: string;
  family?: string;
  ip?: string;
  userAgent?: string;
}) => {
  const raw = generateRefreshTokenString();
  const tokenHash = hashRefreshToken(raw);
  const family = params.family || randomBytes(16).toString('base64url');
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);
  const row = await prisma.refreshToken.create({
    data: {
      userId: params.userId,
      tokenHash,
      family,
      expiresAt,
      issuedToIp: params.ip,
      userAgent: params.userAgent
    }
  });
  const jwtToken = signRefreshToken({
    sub: row.id,
    uid: params.userId,
    fam: family,
    jti: row.id,
    type: 'refresh'
  });
  return { row, raw, jwt: jwtToken, family, expiresAt };
};

/**
 * Rotate a refresh token: revoke the old, issue a new one in the same family.
 * If the supplied raw token's row is already revoked (REPLAY), revoke the
 * entire family and throw.
 */
export const rotateRefreshToken = async (params: {
  raw: string;
  ip?: string;
  userAgent?: string;
}) => {
  const tokenHash = hashRefreshToken(params.raw);
  const row = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!row) {
    // Token never existed (or hash doesn't match any row). Don't leak info.
    throw new RefreshError('invalid_token', 'Refresh token is invalid');
  }
  if (row.expiresAt < new Date()) {
    throw new RefreshError('expired', 'Refresh token has expired');
  }
  if (row.revokedAt) {
    // REPLAY DETECTION: token was already used or explicitly revoked.
    // Invalidate the entire family — the attacker (or legit user whose
    // token was stolen) can't keep rotating.
    logger.warn({
      userId: row.userId,
      family: row.family,
      tokenId: row.id
    }, 'refresh token replay detected — revoking family');
    await prisma.refreshToken.updateMany({
      where: { family: row.family, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    throw new RefreshError('replay_detected', 'Refresh token reuse detected; please log in again');
  }

  // Happy path: mark old as revoked (replacedBy will be set when the new row is created),
  // then issue a new one in the same family.
  const { row: newRow, raw: newRaw, jwt: newJwt, family } = await issueRefreshToken({
    userId: row.userId,
    family: row.family,
    ip: params.ip,
    userAgent: params.userAgent
  });
  await prisma.refreshToken.update({
    where: { id: row.id },
    data: { revokedAt: new Date(), replacedBy: newRow.id }
  });
  return { row: newRow, raw: newRaw, jwt: newJwt, family, userId: row.userId };
};

/** Revoke a single refresh token (used by logout). Also revokes the family
 *  to invalidate any parallel sessions the same user had open. */
export const revokeRefreshToken = async (raw: string): Promise<void> => {
  const tokenHash = hashRefreshToken(raw);
  const row = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!row) return; // already gone
  await prisma.refreshToken.updateMany({
    where: { family: row.family, revokedAt: null },
    data: { revokedAt: new Date() }
  });
};

export class RefreshError extends Error {
  constructor(public code: 'invalid_token' | 'expired' | 'replay_detected', message: string) {
    super(message);
    this.name = 'RefreshError';
  }
}

export const TOKEN_TTL = {
  access: ACCESS_TTL_SECONDS,
  refresh: REFRESH_TTL_SECONDS
} as const;
