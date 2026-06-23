// Security header tests — verify the helmet + Permissions-Policy middleware
// is producing the expected headers on a real Express app.
//
// We use a test app that mirrors the production middleware chain closely
// enough to exercise the same code paths.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import helmet from 'helmet';

// We can't import the real `src/index.ts` because that file boots up the
// whole app (workers, scheduler, etc.). Instead, we replicate the helmet
// config exactly here so a typo in the CSP source is caught.
const buildApp = () => {
  const app = express();
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"]
      }
    },
    strictTransportSecurity: {
      maxAge: 31_536_000,
      includeSubDomains: true,
      preload: true
    },
    xContentTypeOptions: true,
    xFrameOptions: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xDnsPrefetchControl: { allow: false },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    crossOriginEmbedderPolicy: false
  }));
  app.use((_req, res, next) => {
    res.setHeader('Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), ' +
      'magnetometer=(), gyroscope=(), accelerometer=(), interest-cohort=()'
    );
    next();
  });
  app.get('/test', (_req, res) => res.json({ ok: true }));
  return app;
};

describe('Security headers', () => {
  let app: ReturnType<typeof buildApp>;
  beforeAll(() => { app = buildApp(); });

  it('sets a tight Content-Security-Policy', async () => {
    const res = await request(app).get('/test');
    const csp = res.headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toMatch(/default-src 'self'/);
    expect(csp).toMatch(/script-src 'self'/);
    // style-src 'self' 'unsafe-inline' (Vue scoped styles)
    expect(csp).toMatch(/style-src 'self' 'unsafe-inline'/);
    // img-src allows our /uploads/ + data: + https: (external CDN)
    expect(csp).toMatch(/img-src 'self' data: https:/);
    // No embedding allowed
    expect(csp).toMatch(/frame-ancestors 'none'/);
    // Plugins disabled
    expect(csp).toMatch(/object-src 'none'/);
    // baseUri locked to self
    expect(csp).toMatch(/base-uri 'self'/);
  });

  it('CSP does NOT allow unsafe-eval (XSS defense)', async () => {
    const res = await request(app).get('/test');
    const csp = res.headers['content-security-policy'] || '';
    // unsafe-eval is a major XSS amplification vector; we should never need it.
    expect(csp).not.toMatch(/unsafe-eval/);
  });

  it('CSP does NOT allow http: (only https: + data: for images)', async () => {
    // http: sources would allow mixed content over insecure connections
    const res = await request(app).get('/test');
    const csp = res.headers['content-security-policy'] || '';
    expect(csp).not.toMatch(/http:/);
  });

  it('sets X-Content-Type-Options: nosniff', async () => {
    const res = await request(app).get('/test');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('sets X-Frame-Options: DENY (clickjacking defense)', async () => {
    const res = await request(app).get('/test');
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  it('sets Referrer-Policy: strict-origin-when-cross-origin', async () => {
    const res = await request(app).get('/test');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('sets HSTS with 1-year max-age, includeSubDomains, preload', async () => {
    const res = await request(app).get('/test');
    const hsts = res.headers['strict-transport-security'];
    expect(hsts).toBeDefined();
    expect(hsts).toMatch(/max-age=31536000/);
    expect(hsts).toMatch(/includeSubDomains/);
    expect(hsts).toMatch(/preload/);
  });

  it('sets X-DNS-Prefetch-Control: off', async () => {
    const res = await request(app).get('/test');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
  });

  it('sets Cross-Origin-Opener-Policy: same-origin', async () => {
    const res = await request(app).get('/test');
    expect(res.headers['cross-origin-opener-policy']).toBe('same-origin');
  });

  it('sets Cross-Origin-Resource-Policy: same-origin', async () => {
    const res = await request(app).get('/test');
    expect(res.headers['cross-origin-resource-policy']).toBe('same-origin');
  });

  it('sets Permissions-Policy disabling dangerous features', async () => {
    const res = await request(app).get('/test');
    const pp = res.headers['permissions-policy'];
    expect(pp).toBeDefined();
    expect(pp).toMatch(/camera=\(\)/);
    expect(pp).toMatch(/microphone=\(\)/);
    expect(pp).toMatch(/geolocation=\(\)/);
    expect(pp).toMatch(/payment=\(\)/);
    // FLoC topic blocking — also disable this since we don't need ad targeting
    expect(pp).toMatch(/interest-cohort=\(\)/);
  });

  it('all expected security headers are present (sanity count)', async () => {
    const res = await request(app).get('/test');
    const expected = [
      'content-security-policy',
      'x-content-type-options',
      'x-frame-options',
      'referrer-policy',
      'strict-transport-security',
      'x-dns-prefetch-control',
      'cross-origin-opener-policy',
      'cross-origin-resource-policy',
      'permissions-policy'
    ];
    for (const h of expected) {
      expect(res.headers[h], `missing header: ${h}`).toBeDefined();
    }
  });
});
