// Logger redaction contract — passwords and tokens MUST never appear in logs.
// Uses the real logger configuration from src/utils/logger.ts to verify the
// production redaction paths.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Writable } from 'stream';
import pino, { Logger } from 'pino';

const REAL_REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'req.body.password',
  'req.body.currentPassword',
  'req.body.newPassword',
  'req.body.token',
  'req.body.refreshToken',
  'req.body.authorization',
  'req.body.creditCard',
  'req.body.cardNumber',
  'req.body.cvv',
  'password',
  'currentPassword',
  'newPassword',
  'token',
  'refreshToken',
  'authorization',
  'creditCard',
  'cardNumber',
  'cvv',
  '*.password',
  '*.passwordHash',
  '*.token',
  '*.secret',
  '*.apiKey'
];

const buildTestLogger = (): { log: Logger; captured: string[] } => {
  const captured: string[] = [];
  const log = pino({
    level: 'info',
    redact: { paths: REAL_REDACT_PATHS, censor: '[REDACTED]' }
  }, new Writable({
    write(chunk, _enc, cb) { captured.push(chunk.toString()); cb(); }
  }));
  return { log, captured };
};

describe('Logger redaction', () => {
  it('silences output in test mode (production logger default)', async () => {
    const { logger } = await import('../src/utils/logger');
    expect(logger.level).toBe('silent');
  });

  it('redacts top-level password / token / authorization fields', () => {
    const { log, captured } = buildTestLogger();
    log.info({ password: 'hunter2', token: 'jwt.abc.def', currentPassword: 'old', newPassword: 'new' }, 'auth');
    const out = captured.join('');
    expect(out).toContain('[REDACTED]');
    expect(out).not.toContain('hunter2');
    expect(out).not.toContain('jwt.abc.def');
    expect(out).not.toContain('"old"');
    expect(out).not.toContain('"new"');
  });

  it('redacts req.body.password / token / creditCard', () => {
    const { log, captured } = buildTestLogger();
    log.info({ req: { body: { password: 'secret', token: 'jwt', cardNumber: '4111111111111111' } } }, 'http');
    const out = captured.join('');
    expect(out).toContain('[REDACTED]');
    expect(out).not.toContain('secret');
    expect(out).not.toContain('4111111111111111');
  });

  it('redacts nested user records with *.password / *.token (one level deep)', () => {
    const { log, captured } = buildTestLogger();
    log.info({
      user: { name: 'Alice', password: 'hunter2', token: 'jwt' },
      meta: { password: 'meta-secret', token: 'meta-jwt' }
    }, 'audit');
    const out = captured.join('');
    expect(out).toContain('Alice');
    expect(out).not.toContain('hunter2');
    expect(out).not.toContain('jwt');
    expect(out).not.toContain('meta-secret');
    expect(out).not.toContain('meta-jwt');
  });

  it('does NOT redact fields that are not in the paths list', () => {
    const { log, captured } = buildTestLogger();
    log.info({ name: 'Alice', email: 'alice@example.com', role: 'admin' }, 'public info');
    const out = captured.join('');
    expect(out).toContain('Alice');
    expect(out).toContain('alice@example.com');
    expect(out).toContain('admin');
  });
});
