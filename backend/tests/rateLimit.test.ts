// Rate limit tests — verify the factory produces working middleware
// (returns 429 after N requests, sets standard headers, scopes by IP+route).
// We use a real Express app + supertest + a tiny in-memory store.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { limit, RATE_LIMITS } from '../src/utils/rateLimit';
import { logger } from '../src/utils/logger';

const buildApp = (path: string, spec = RATE_LIMITS.auth.login) => {
  const app = express();
  // Trust the loopback IP for X-Forwarded-For (test runs locally)
  app.set('trust proxy', 'loopback');
  app.use((req: Request, _res: Response, next) => {
    (req as any).user = undefined; // fresh user context per request
    next();
  });
  app.post(path, limit(spec), (_req, res) => res.json({ ok: true }));
  return app;
};

describe('rate limit middleware', () => {
  describe('basic limit enforcement', () => {
    it('allows up to N requests then returns 429', async () => {
      const app = buildApp('/api/v1/test/basic', { name: 'basic', max: 3, windowSeconds: 60 });
      // 3 requests OK
      for (let i = 0; i < 3; i++) {
        const res = await request(app).post('/api/v1/test/basic');
        expect(res.status).toBe(200);
      }
      // 4th is throttled
      const blocked = await request(app).post('/api/v1/test/basic');
      expect(blocked.status).toBe(429);
      expect(blocked.body).toMatchObject({
        error: expect.any(String),
        limit: 3,
        windowSeconds: 60,
        retryAfter: expect.any(Number)
      });
    });

    it('sets standard RateLimit-* headers', async () => {
      const app = buildApp('/api/v1/test/headers', { name: 'headers', max: 5, windowSeconds: 60 });
      const res = await request(app).post('/api/v1/test/headers');
      expect(res.status).toBe(200);
      // RFC draft headers (set by standardHeaders: true)
      expect(res.headers['ratelimit-limit']).toBe('5');
      expect(res.headers['ratelimit-remaining']).toBe('4');
      expect(res.headers['ratelimit-reset']).toBeDefined();
    });

    it('sets Retry-After header on 429', async () => {
      const app = buildApp('/api/v1/test/retry', { name: 'retry', max: 1, windowSeconds: 60 });
      await request(app).post('/api/v1/test/retry'); // use the 1
      const blocked = await request(app).post('/api/v1/test/retry');
      expect(blocked.status).toBe(429);
      expect(blocked.headers['retry-after']).toBeDefined();
    });
  });

  describe('key isolation', () => {
    it('different IPs get independent buckets', async () => {
      const app = buildApp('/api/v1/test/ips', { name: 'ips', max: 2, windowSeconds: 60 });
      // Simulate two different IPs via X-Forwarded-For
      const ip1 = await request(app).post('/api/v1/test/ips').set('X-Forwarded-For', '10.0.0.1');
      const ip1b = await request(app).post('/api/v1/test/ips').set('X-Forwarded-For', '10.0.0.1');
      const ip2 = await request(app).post('/api/v1/test/ips').set('X-Forwarded-For', '10.0.0.2');
      expect(ip1.status).toBe(200);
      expect(ip1b.status).toBe(200);
      expect(ip2.status).toBe(200); // different IP, fresh bucket
    });

    it('different routes get independent buckets for the same IP', async () => {
      // Build an app with two routes under the same IP
      const app = express();
      app.set('trust proxy', 'loopback');
      app.post('/api/v1/test/route-a', limit({ name: 'route-a', max: 1, windowSeconds: 60 }), (_req, res) => res.json({ ok: 'a' }));
      app.post('/api/v1/test/route-b', limit({ name: 'route-b', max: 1, windowSeconds: 60 }), (_req, res) => res.json({ ok: 'b' }));

      await request(app).post('/api/v1/test/route-a').set('X-Forwarded-For', '10.0.0.5');
      const a2 = await request(app).post('/api/v1/test/route-a').set('X-Forwarded-For', '10.0.0.5');
      const b1 = await request(app).post('/api/v1/test/route-b').set('X-Forwarded-For', '10.0.0.5');
      expect(a2.status).toBe(429); // a exhausted
      expect(b1.status).toBe(200); // b still has its own bucket
    });
  });

  describe('perUser mode', () => {
    it('scopes the bucket to req.user.id when present', async () => {
      const app = express();
      app.set('trust proxy', 'loopback');
      // Stub user injection: even-odd users alternate
      app.use((req, _res, next) => {
        (req as any).user = { id: req.header('X-Test-User') };
        next();
      });
      app.post('/api/v1/test/peruser', limit({ name: 'peruser', max: 1, windowSeconds: 60, perUser: true }), (_req, res) => res.json({ ok: true }));

      // User 1: 1 OK, 2nd blocked
      const u1a = await request(app).post('/api/v1/test/peruser').set('X-Test-User', 'user-1');
      const u1b = await request(app).post('/api/v1/test/peruser').set('X-Test-User', 'user-1');
      expect(u1a.status).toBe(200);
      expect(u1b.status).toBe(429);

      // User 2 from the same IP gets a fresh bucket
      const u2a = await request(app).post('/api/v1/test/peruser').set('X-Test-User', 'user-2');
      expect(u2a.status).toBe(200);
    });
  });

  describe('preset shapes (RATE_LIMITS)', () => {
    it('auth.login = 5 per 15 minutes', () => {
      expect(RATE_LIMITS.auth.login).toEqual({ name: 'auth:login', max: 5, windowSeconds: 900, perUser: false });
    });
    it('auth.register = 3 per hour', () => {
      expect(RATE_LIMITS.auth.register).toEqual({ name: 'auth:register', max: 3, windowSeconds: 3600, perUser: false });
    });
    it('ai.translate = 20 per minute (per user)', () => {
      expect(RATE_LIMITS.ai.translate).toEqual({ name: 'ai:translate', max: 20, windowSeconds: 60, perUser: true });
    });
    it('ocr.verify = 10 per minute', () => {
      expect(RATE_LIMITS.ocr.verify).toEqual({ name: 'ocr:verify', max: 10, windowSeconds: 60, perUser: false });
    });
    it('reviews.submit = 3 per hour (per user)', () => {
      expect(RATE_LIMITS.reviews.submit).toEqual({ name: 'reviews:submit', max: 3, windowSeconds: 3600, perUser: true });
    });
  });

  describe('logging', () => {
    it('logs a warning when a request is throttled', async () => {
      const warnSpy = vi.spyOn(logger, 'warn');
      const app = buildApp('/api/v1/test/log', { name: 'log-test', max: 1, windowSeconds: 60 });
      await request(app).post('/api/v1/test/log');
      await request(app).post('/api/v1/test/log');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 'log-test' }),
        'rate limit exceeded'
      );
      warnSpy.mockRestore();
    });
  });
});

// vitest's vi import — pulled in late so the file parses even if we add
// describe blocks before it.
import { vi } from 'vitest';
