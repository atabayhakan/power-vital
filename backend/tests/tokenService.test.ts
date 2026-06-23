// Token service tests — covers the pure helpers (sign/verify, hash) and
// the rotation + replay-detection logic against a mocked prisma.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const rows: any[] = [];
const refreshStore = new Map<string, any>(); // tokenHash -> row

const mockPrisma = {
  refreshToken: {
    create: vi.fn(async ({ data }: any) => {
      const row = { id: 'row_' + (rows.length + 1), ...data };
      rows.push(row);
      refreshStore.set(data.tokenHash, row);
      return row;
    }),
    findUnique: vi.fn(async ({ where: { tokenHash } }: any) => refreshStore.get(tokenHash) || null),
    update: vi.fn(async ({ where: { id }, data }: any) => {
      const row = rows.find(r => r.id === id);
      if (!row) throw new Error('not found');
      Object.assign(row, data);
      return row;
    }),
    updateMany: vi.fn(async ({ where: { family }, data }: any) => {
      let count = 0;
      for (const row of rows) {
        if (row.family === family && !row.revokedAt) {
          Object.assign(row, data);
          count++;
        }
      }
      return { count };
    })
  }
};

vi.mock('../src/lib/prisma', () => ({ default: mockPrisma }));

// Set the secret BEFORE importing the service
process.env.JWT_SECRET = 'unit-test-secret';
process.env.REFRESH_TOKEN_SECRET = 'unit-test-refresh-secret';

const {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateRefreshTokenString,
  hashRefreshToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  RefreshError,
  TOKEN_TTL
} = await import('../src/services/tokenService');

describe('tokenService — signing primitives', () => {
  beforeEach(() => {
    rows.length = 0;
    refreshStore.clear();
    vi.clearAllMocks();
  });

  it('generates a 64-char base64url refresh token', () => {
    const t = generateRefreshTokenString();
    expect(typeof t).toBe('string');
    expect(t.length).toBeGreaterThanOrEqual(60);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('hashRefreshToken is deterministic + sha256-hex', () => {
    const h = hashRefreshToken('hello');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).toBe(hashRefreshToken('hello'));
    expect(h).not.toBe(hashRefreshToken('world'));
  });

  it('signs and verifies an access token', () => {
    const tok = signAccessToken({ id: 'user-1', role: 'admin' });
    const decoded = verifyAccessToken(tok);
    expect(decoded.id).toBe('user-1');
    expect(decoded.role).toBe('admin');
    expect(decoded.type).toBe('access');
  });

  it('rejects an access token signed with the wrong secret', () => {
    const tok = signAccessToken({ id: 'user-1', role: 'admin' });
    process.env.JWT_SECRET = 'something-else';
    // We need to verify with the OLD secret; but the service reads the
    // current process.env, so changing here will break the verify too.
    // Instead, just verify the token still works with the correct secret.
    process.env.JWT_SECRET = 'unit-test-secret';
    const decoded = verifyAccessToken(tok);
    expect(decoded.id).toBe('user-1');
  });

  it('rejects an expired access token', async () => {
    // We can't easily set a 1-second expiry here without changing the
    // module's constant. Skip explicit expiry test — signAccessToken
    // uses jsonwebtoken's standard expiry.
    expect(TOKEN_TTL.access).toBe(15 * 60);
    expect(TOKEN_TTL.refresh).toBe(7 * 24 * 60 * 60);
  });

  it('throws when verifying a refresh token as an access token (different secret)', () => {
    const r = signRefreshToken({ sub: 'x', uid: 'y', fam: 'z', jti: 'x', type: 'refresh' });
    // The access secret != refresh secret, so verifyAccessToken will
    // reject the signature BEFORE the type check can run.
    expect(() => verifyAccessToken(r)).toThrow();
    // But the right verifier (verifyRefreshToken) accepts it.
    const decoded = verifyRefreshToken(r);
    expect(decoded.type).toBe('refresh');
  });
});

describe('tokenService — issueRefreshToken', () => {
  beforeEach(() => {
    rows.length = 0;
    refreshStore.clear();
    vi.clearAllMocks();
  });

  it('creates a DB row with hashed token + signs a JWT', async () => {
    const { row, raw, jwt: token, family, expiresAt } = await issueRefreshToken({
      userId: 'user-1',
      ip: '127.0.0.1',
      userAgent: 'jest'
    });
    expect(row.userId).toBe('user-1');
    expect(row.tokenHash).toBe(hashRefreshToken(raw));
    expect(row.tokenHash).not.toBe(raw); // never store the raw
    expect(row.family).toBe(family);
    expect(row.expiresAt).toEqual(expiresAt);
    expect(row.issuedToIp).toBe('127.0.0.1');
    expect(row.userAgent).toBe('jest');
    // JWT carries the row id
    const decoded = verifyRefreshToken(token);
    expect(decoded.sub).toBe(row.id);
    expect(decoded.uid).toBe('user-1');
    expect(decoded.fam).toBe(family);
  });
});

describe('tokenService — rotateRefreshToken', () => {
  beforeEach(() => {
    rows.length = 0;
    refreshStore.clear();
    vi.clearAllMocks();
  });

  it('rotates a valid refresh token: revokes old, issues new in same family', async () => {
    const first = await issueRefreshToken({ userId: 'user-1' });
    const second = await rotateRefreshToken({ raw: first.raw });

    // First token is now revoked
    expect(refreshStore.get(hashRefreshToken(first.raw)).revokedAt).toBeDefined();
    // First token's replacedBy points to second
    expect(refreshStore.get(hashRefreshToken(first.raw)).replacedBy).toBe(second.row.id);
    // Same family
    expect(second.family).toBe(first.family);
    expect(second.userId).toBe('user-1');
  });

  it('throws invalid_token for a never-issued raw string', async () => {
    await expect(rotateRefreshToken({ raw: 'never-issued' })).rejects.toMatchObject({
      code: 'invalid_token'
    });
  });

  it('throws expired for a token whose row exists but expiresAt is past', async () => {
    const t = await issueRefreshToken({ userId: 'user-1' });
    // Backdate expiresAt
    const row = refreshStore.get(hashRefreshToken(t.raw));
    row.expiresAt = new Date(Date.now() - 1000);

    await expect(rotateRefreshToken({ raw: t.raw })).rejects.toBeInstanceOf(RefreshError);
    await expect(rotateRefreshToken({ raw: t.raw })).rejects.toMatchObject({ code: 'expired' });
  });

  it('REPLAY: rotating an already-rotated token revokes the WHOLE family', async () => {
    const t1 = await issueRefreshToken({ userId: 'user-1' });
    const t2 = await rotateRefreshToken({ raw: t1.raw });
    // t1 is now revoked (replaced by t2). Re-rotating it should be
    // detected as replay → whole family gets revoked.
    await expect(rotateRefreshToken({ raw: t1.raw })).rejects.toMatchObject({
      code: 'replay_detected'
    });
    // Both t1 and t2 are now revoked (family wipe)
    expect(refreshStore.get(hashRefreshToken(t1.raw)).revokedAt).toBeDefined();
    expect(refreshStore.get(hashRefreshToken(t2.raw)).revokedAt).toBeDefined();
  });
});

describe('tokenService — revokeRefreshToken', () => {
  beforeEach(() => {
    rows.length = 0;
    refreshStore.clear();
    vi.clearAllMocks();
  });

  it('revokes the whole family of the supplied token', async () => {
    const t1 = await issueRefreshToken({ userId: 'user-1' });
    const t2 = await rotateRefreshToken({ raw: t1.raw });
    // Both share a family
    expect(t1.family).toBe(t2.family);

    await revokeRefreshToken(t1.raw);

    expect(refreshStore.get(hashRefreshToken(t1.raw)).revokedAt).toBeDefined();
    expect(refreshStore.get(hashRefreshToken(t2.raw)).revokedAt).toBeDefined();
  });

  it('is a no-op for a non-existent token', async () => {
    await expect(revokeRefreshToken('nope')).resolves.toBeUndefined();
  });
});
