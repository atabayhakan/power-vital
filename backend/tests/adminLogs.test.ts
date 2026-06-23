// Admin logs route tests — tail filtering, level filter, query string.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// We point LOG_FILE at a temp file BEFORE importing the admin route so
// that `LOG_FILE_PATH` (read at import time) is the temp path.
const tmpDir = join(tmpdir(), `pv-logs-${Date.now()}`);
const logPath = join(tmpDir, 'test.log');
process.env.LOG_FILE = logPath;

// Stub authenticateJWT + requireRole to short-circuit auth
vi.mock('../src/middleware/auth', () => ({
  authenticateJWT: (req: any, _res: any, next: any) => {
    req.user = { id: 'admin-1', role: 'admin' };
    next();
  },
  requireRole: (..._roles: string[]) => (_req: any, _res: any, next: any) => next()
}));

// Now import the route — it will read LOG_FILE at module load
const { default: adminLogsRoute, ...rest } = await import('../src/routes/adminLogs');
void rest;

const buildApp = () => {
  const app = express();
  app.use('/api/v1/admin/logs', adminLogsRoute);
  return app;
};

const writeLogs = async (lines: string[]) => {
  await fs.mkdir(tmpDir, { recursive: true });
  await fs.writeFile(logPath, lines.join('\n') + '\n');
};

describe('admin logs — tail + filter', () => {
  beforeAll(async () => {
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterAll(async () => {
    try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch {}
  });

  it('returns 503 when LOG_FILE is unset (we set it, so we get 200)', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/v1/admin/logs');
    expect(res.status).toBe(200);
    expect(res.body.logFile).toBe(logPath);
  });

  it('returns parsed log entries with ts/level/msg', async () => {
    const now = Date.now();
    const lines = [
      JSON.stringify({ time: now - 3000, level: 'info', msg: 'first' }),
      JSON.stringify({ time: now - 2000, level: 'warn', msg: 'second', extra: { x: 1 } }),
      JSON.stringify({ time: now - 1000, level: 'error', msg: 'third', err: 'boom' })
    ];
    await writeLogs(lines);
    const app = buildApp();
    const res = await request(app).get('/api/v1/admin/logs?limit=10');
    expect(res.status).toBe(200);
    expect(res.body.returned).toBe(3);
    // Returned in chronological order
    expect(res.body.logs[0].msg).toBe('first');
    expect(res.body.logs[1].level).toBe('warn');
    expect(res.body.logs[1].extra).toEqual({ x: 1 });
    expect(res.body.logs[2].level).toBe('error');
    expect(res.body.logs[2].err).toBe('boom');
  });

  it('filters by minimum level (info → includes warn + error)', async () => {
    const now = Date.now();
    await writeLogs([
      JSON.stringify({ time: now, level: 'debug', msg: 'should be excluded' }),
      JSON.stringify({ time: now, level: 'info', msg: 'should be included' }),
      JSON.stringify({ time: now, level: 'warn', msg: 'warn-included' }),
      JSON.stringify({ time: now, level: 'error', msg: 'err-included' })
    ]);
    const app = buildApp();
    const res = await request(app).get('/api/v1/admin/logs?level=info&limit=10');
    expect(res.status).toBe(200);
    const msgs = res.body.logs.map((l: any) => l.msg);
    expect(msgs).toContain('should be included');
    expect(msgs).toContain('warn-included');
    expect(msgs).toContain('err-included');
    expect(msgs).not.toContain('should be excluded');
  });

  it('filters by substring search', async () => {
    const now = Date.now();
    await writeLogs([
      JSON.stringify({ time: now, level: 'info', msg: 'user logged in' }),
      JSON.stringify({ time: now, level: 'info', msg: 'order placed' }),
      JSON.stringify({ time: now, level: 'info', msg: 'user logged out' })
    ]);
    const app = buildApp();
    const res = await request(app).get('/api/v1/admin/logs?q=logged');
    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(2);
    expect(res.body.logs.map((l: any) => l.msg)).toEqual(['user logged in', 'user logged out']);
  });

  it('filters by since timestamp (only newer)', async () => {
    const now = Date.now();
    await writeLogs([
      JSON.stringify({ time: now - 5000, level: 'info', msg: 'old' }),
      JSON.stringify({ time: now, level: 'info', msg: 'new' })
    ]);
    const app = buildApp();
    const res = await request(app).get(`/api/v1/admin/logs?since=${now - 1000}`);
    expect(res.status).toBe(200);
    const msgs = res.body.logs.map((l: any) => l.msg);
    expect(msgs).toEqual(['new']);
  });

  it('respects the limit parameter (caps at 1000)', async () => {
    const lines = Array.from({ length: 50 }, (_, i) =>
      JSON.stringify({ time: Date.now() - i, level: 'info', msg: `m${i}` })
    );
    await writeLogs(lines);
    const app = buildApp();
    const res = await request(app).get('/api/v1/admin/logs?limit=5');
    expect(res.body.logs).toHaveLength(5);
  });

  it('skips malformed lines silently', async () => {
    await writeLogs([
      'this is not JSON',
      JSON.stringify({ time: Date.now(), level: 'info', msg: 'valid' }),
      '{half-baked'
    ]);
    const app = buildApp();
    const res = await request(app).get('/api/v1/admin/logs?limit=10');
    expect(res.body.logs).toHaveLength(1);
    expect(res.body.logs[0].msg).toBe('valid');
  });

  it('returns empty array if log file exists but is empty', async () => {
    await writeLogs([]);
    const app = buildApp();
    const res = await request(app).get('/api/v1/admin/logs');
    expect(res.status).toBe(200);
    expect(res.body.logs).toEqual([]);
  });
});
