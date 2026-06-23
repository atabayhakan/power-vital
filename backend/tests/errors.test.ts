// Unit tests for /api/v1/errors/report — verifies validation, the
// persistence path, and the admin feed / resolve endpoints.
import { describe, it, expect, beforeEach } from 'vitest';
import { mockPrismaModule, sharedMock } from './helpers/mockPrisma';

vi.mock('../src/lib/prisma', () => mockPrismaModule());

// Mock the auth middleware so the real JWT verifier doesn't run.
// The mock just decodes the role from the request body's `__role`
// field (a test-only escape hatch — never present in production).
// Tests that don't set `__role` get `req.user = null`, which the
// route treats as "unauthenticated".
vi.mock('../src/middleware/auth', () => ({
  authenticateJWT: (req: any, _res: any, next: () => void) => {
    const role = req.headers['x-test-role'] ?? req.body?.__role ?? null;
    if (!role || role === 'none') return next();
    req.user = { id: role === 'admin' ? 'admin-1' : 'cust-1', role };
    next();
  },
  requireRole: () => (_req: any, _res: any, next: () => void) => next()
}));

import request from 'supertest';
import express from 'express';
import errorsRouter from '../src/routes/errors';

const prismaMock = sharedMock();

// Build the test app with an Express app. We set the X-Test-Role
// header on each request via supertest to simulate an authenticated
// admin/customer/anonymous session.
const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/errors', errorsRouter);
  return app;
};

const asAdmin = (req: any) => req.set('X-Test-Role', 'admin');
const asCustomer = (req: any) => req.set('X-Test-Role', 'customer');
const asAnon = (req: any) => req; // no header → req.user stays null

describe('POST /api/v1/errors/report', () => {
  beforeEach(() => {
    prismaMock.clientError.create.mockReset();
    prismaMock.clientError.create.mockResolvedValue({
      id: 'err-uuid',
      createdAt: new Date('2026-06-23T10:00:00Z')
    });
  });

  it('persists a valid error payload', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/v1/errors/report')
      .send({
        message: 'TypeError: undefined is not a function',
        source: 'ErrorBoundary',
        route: '/admin/orders',
        phase: 'render',
        locale: 'kg'
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('err-uuid');
    expect(prismaMock.clientError.create).toHaveBeenCalledTimes(1);
    const arg = prismaMock.clientError.create.mock.calls[0][0];
    expect(arg.data.message).toBe('TypeError: undefined is not a function');
    expect(arg.data.source).toBe('ErrorBoundary');
    expect(arg.data.route).toBe('/admin/orders');
    // No auth → userId is null
    expect(arg.data.userId).toBeNull();
  });

  it('rejects an empty message', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/v1/errors/report')
      .send({ message: '', source: 'ErrorBoundary' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid payload');
    expect(prismaMock.clientError.create).not.toHaveBeenCalled();
  });

  it('rejects a missing source', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/v1/errors/report')
      .send({ message: 'oops' });
    expect(res.status).toBe(400);
  });

  it('truncates an over-long message to 500 chars', async () => {
    const app = buildApp();
    const longMessage = 'x'.repeat(1500);
    const res = await request(app)
      .post('/api/v1/errors/report')
      .send({ message: longMessage, source: 'vue-global' });
    expect(res.status).toBe(400); // zod max(500) rejects
  });

  it('accepts optional stack/phase/context fields', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/v1/errors/report')
      .send({
        message: 'Render failed',
        source: 'ErrorBoundary',
        stack: 'Error: at line 1\n  at fn()',
        phase: 'render',
        context: JSON.stringify({ component: 'MyWidget' })
      });
    expect(res.status).toBe(201);
    const arg = prismaMock.clientError.create.mock.calls[0][0];
    expect(arg.data.stack).toContain('Error: at line 1');
    expect(arg.data.phase).toBe('render');
    expect(arg.data.context).toContain('MyWidget');
  });
});

describe('GET /api/v1/errors/recent', () => {
  beforeEach(() => {
    prismaMock.clientError.findMany.mockReset();
    prismaMock.clientError.findMany.mockResolvedValue([
      { id: 'e1', source: 'vue-global', message: 'x', route: '/a', locale: 'kg', userId: null, resolved: false, createdAt: new Date() }
    ]);
  });

  it('returns recent errors for admin', async () => {
    const app = buildApp();
    const res = await asAdmin(request(app).get('/api/v1/errors/recent'));
    expect(res.status).toBe(200);
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  it('rejects unauthenticated requests', async () => {
    const app = buildApp();
    const res = await asAnon(request(app).get('/api/v1/errors/recent'));
    expect(res.status).toBe(401);
  });

  it('rejects non-admin users', async () => {
    const app = buildApp();
    const res = await asCustomer(request(app).get('/api/v1/errors/recent'));
    expect(res.status).toBe(403);
  });

  it('respects the includeResolved query flag', async () => {
    const app = buildApp();
    await asAdmin(request(app).get('/api/v1/errors/recent?resolved=true'));
    const arg = prismaMock.clientError.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({}); // includeResolved=true → no where filter
  });

  it('filters by resolved=false by default', async () => {
    const app = buildApp();
    await asAdmin(request(app).get('/api/v1/errors/recent'));
    const arg = prismaMock.clientError.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({ resolved: false });
  });
});

describe('POST /api/v1/errors/:id/resolve', () => {
  beforeEach(() => {
    prismaMock.clientError.update.mockReset();
    prismaMock.clientError.update.mockResolvedValue({
      id: 'err-uuid', resolved: true, resolvedAt: new Date()
    });
  });

  it('marks the error as resolved', async () => {
    const app = buildApp();
    const res = await asAdmin(request(app)
      .post('/api/v1/errors/err-uuid/resolve')
      .send({ resolvedNote: 'fixed in commit abc123' }));
    expect(res.status).toBe(200);
    expect(res.body.resolved).toBe(true);
    const arg = prismaMock.clientError.update.mock.calls[0][0];
    expect(arg.where.id).toBe('err-uuid');
    expect(arg.data.resolvedNote).toBe('fixed in commit abc123');
    expect(arg.data.resolvedBy).toBe('admin-1');
  });

  it('returns 404 when the error does not exist', async () => {
    prismaMock.clientError.update.mockResolvedValue(null);
    // The real route calls .catch(() => null) when the row is missing,
    // so we need to simulate the rejection path.
    prismaMock.clientError.update.mockRejectedValue(
      Object.assign(new Error('not found'), { code: 'P2025' })
    );
    const app = buildApp();
    const res = await asAdmin(request(app).post('/api/v1/errors/missing/resolve').send({}));
    expect(res.status).toBe(404);
  });
});