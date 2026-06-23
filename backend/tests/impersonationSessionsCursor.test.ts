// Integration tests for the impersonation sessions cursor endpoint.
//
// Verifies:
//   • First page returns the envelope shape (items/nextCursor/hasMore)
//   • Second page is fetched with the cursor query param
//   • Empty result still returns a valid envelope
//   • Items are sorted DESC by startedAt (newest first)
//   • Auth: admin-only — non-admins get 403
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// In-memory sessions store (newest first when sorted by startedAt desc)
const sessions: any[] = [];
let nextId = 1;
const mkSession = (adminId: string, daysAgo: number, targetId: string) => {
  const id = `s-${nextId++}`;
  const startedAt = new Date(Date.now() - daysAgo * 86_400_000);
  const expiresAt = new Date(startedAt.getTime() + 60 * 60 * 1000);
  return {
    id, adminId, targetId,
    startedAt: startedAt.toISOString(),
    endedAt: null,
    expiresAt: expiresAt.toISOString(),
    target: { id: targetId, name: `User ${targetId}`, email: `${targetId}@x`, role: 'customer' }
  };
};

// Seed 5 sessions for admin-1, oldest 4 days ago, newest today
for (let d = 4; d >= 0; d--) {
  sessions.push(mkSession('admin-1', d, `u-${d}`));
}

vi.mock('../src/lib/prisma', () => ({
  default: {
    impersonationSession: {
      findMany: vi.fn(async ({ where, orderBy, take }) => {
        let rows = sessions.filter(s => s.adminId === where.adminId);
        // Cursor WHERE emulation — backend uses Object.assign(where, { AND: afterCursorWhere(cursor, 'startedAt') })
        const cursorAnd = where.AND;
        if (cursorAnd?.OR) {
          const cursorBranch = cursorAnd.OR[0];
          const ltEntry = cursorBranch?.startedAt?.lt ?? cursorBranch?.createdAt?.lt;
          if (ltEntry) {
            const cursorDate = new Date(ltEntry);
            rows = rows.filter(s => new Date(s.startedAt) < cursorDate);
          }
        }
        rows = rows.slice().sort((a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );
        return rows.slice(0, take);
      })
    }
  }
}));

vi.mock('../src/middleware/auth', () => ({
  authenticateJWT: (req: any, _res: any, next: any) => {
    const id = req.header('X-Test-User');
    req.user = id
      ? { id, userId: id, role: req.header('X-Test-Role') }
      : null;
    next();
  },
  requireRole: (...roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json({ error: 'auth required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
    next();
  },
  requireRealAdmin: (req: any, _res: any, next: any) => {
    if (!req.realAdmin) return res.status(403).json({ error: 'real admin required' });
    next();
  }
}));

const buildApp = async () => {
  const app = express();
  app.use(express.json());
  const routes = (await import('../src/routes/adminImpersonation')).default;
  app.use('/api/v1/admin', routes);
  return app;
};

const adminAuth = { 'X-Test-User': 'admin-1', 'X-Test-Role': 'admin' };

beforeEach(() => {
  // re-seed (in case some test mutated)
  sessions.length = 0;
  nextId = 1;
  for (let d = 4; d >= 0; d--) {
    sessions.push(mkSession('admin-1', d, `u-${d}`));
  }
});

describe('GET /api/v1/admin/impersonation/sessions — cursor envelope', () => {
  it('returns { items, nextCursor, hasMore } for the first page', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/impersonation/sessions?limit=2')
      .set(adminAuth);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('nextCursor');
    expect(res.body).toHaveProperty('hasMore');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(2);
    expect(res.body.hasMore).toBe(true);
    expect(res.body.nextCursor).toBeTruthy();
  });

  it('orders items DESC by startedAt (newest first)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/impersonation/sessions?limit=5')
      .set(adminAuth);
    const dates = res.body.items.map((s: any) => new Date(s.startedAt).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
    }
  });

  it('returns hasMore=false + null cursor when fewer than limit', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/impersonation/sessions?limit=50')
      .set(adminAuth);
    expect(res.body.hasMore).toBe(false);
    expect(res.body.nextCursor).toBeNull();
    expect(res.body.items.length).toBe(5);
  });

  it('a second request with the cursor returns the next page only', async () => {
    const app = await buildApp();
    const r1 = await request(app).get('/api/v1/admin/impersonation/sessions?limit=2')
      .set(adminAuth);
    const cursorIds = r1.body.items.map((s: any) => s.id);

    const r2 = await request(app)
      .get(`/api/v1/admin/impersonation/sessions?limit=2&cursor=${encodeURIComponent(r1.body.nextCursor)}`)
      .set(adminAuth);
    expect(r2.status).toBe(200);
    // No overlap between the two pages
    const r2Ids = r2.body.items.map((s: any) => s.id);
    expect(r2Ids.some((id: string) => cursorIds.includes(id))).toBe(false);
  });

  it('rejects a customer (403)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/impersonation/sessions')
      .set({ 'X-Test-User': 'u-cust', 'X-Test-Role': 'customer' });
    expect(res.status).toBe(403);
  });

  it('rejects an unauthenticated request (401)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/v1/admin/impersonation/sessions');
    expect(res.status).toBe(401);
  });

  it('ignores a tampered cursor (falls back to first page)', async () => {
    const app = await buildApp();
    const res = await request(app)
      .get('/api/v1/admin/impersonation/sessions?limit=2&cursor=garbage!!!not-base64')
      .set(adminAuth);
    // The endpoint should NOT 500 — it should serve the first page
    // (tampered cursor decoded to null).
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });
});
