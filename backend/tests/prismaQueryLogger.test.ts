// Unit tests for prismaQueryLogger — verifies the N+1 detector, slow
// query threshold, and per-request stat reset. We mock Prisma's
// $on('query') event with a tiny fake so we don't need a live DB.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  resetQueryStats,
  captureQueryStats,
  attachQueryLogger,
  getCurrentRequestStats,
  emitSummary,
  getLifetimeQueryStats,
  resetLifetimeQueryStats,
} from '../src/utils/prismaQueryLogger';
import * as loggerModule from '../src/utils/logger';

interface FakeQueryEvent {
  query: string;
  params: string;
  duration: number;
  timestamp: Date;
}

// Minimal Prisma-like surface — just $on to register the listener.
const createFakePrisma = () => {
  const listeners: Array<(e: FakeQueryEvent) => void> = [];
  return {
    $on: (_event: string, cb: (e: FakeQueryEvent) => void) => {
      listeners.push(cb);
      return () => {
        const i = listeners.indexOf(cb);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
    emit: (e: FakeQueryEvent) => { for (const cb of listeners) cb(e); },
    listenerCount: () => listeners.length,
  };
};

describe('prismaQueryLogger', () => {
  beforeEach(() => {
    resetQueryStats();
    // Default the slow threshold low so tests run fast.
    process.env.PRISMA_SLOW_MS = '5';
    process.env.PRISMA_N1_THRESHOLD = '30';
    process.env.PRISMA_N1_GROUPED = '10';
  });
  afterEach(() => {
    resetQueryStats();
    delete process.env.PRISMA_SLOW_MS;
    delete process.env.PRISMA_N1_THRESHOLD;
    delete process.env.PRISMA_N1_GROUPED;
  });

  it('attaches a query listener to Prisma', () => {
    const fake = createFakePrisma();
    attachQueryLogger(fake as any);
    expect(fake.listenerCount()).toBe(1);
  });

  it('counts queries against the active request stats', () => {
    const fake = createFakePrisma();
    attachQueryLogger(fake as any);
    fake.emit({ query: 'SELECT * FROM `Product`', params: '[]', duration: 1, timestamp: new Date() });
    fake.emit({ query: 'SELECT * FROM `Product`', params: '[]', duration: 1, timestamp: new Date() });
    fake.emit({ query: 'SELECT * FROM `Order`', params: '[]', duration: 1, timestamp: new Date() });
    const stats = getCurrentRequestStats();
    expect(stats?.totalQueries).toBe(3);
    expect(stats?.byModel.get('Product')?.count).toBe(2);
    expect(stats?.byModel.get('Order')?.count).toBe(1);
  });

  it('flags slow queries (duration >= PRISMA_SLOW_MS)', () => {
    const fake = createFakePrisma();
    attachQueryLogger(fake as any);
    fake.emit({ query: 'SELECT 1', params: '[]', duration: 200, timestamp: new Date() });
    const stats = getCurrentRequestStats();
    expect(stats?.slowQueries).toBe(1);
    expect(stats?.totalQueries).toBe(1);
  });

  it('does NOT flag fast queries', () => {
    const fake = createFakePrisma();
    attachQueryLogger(fake as any);
    fake.emit({ query: 'SELECT 1', params: '[]', duration: 1, timestamp: new Date() });
    const stats = getCurrentRequestStats();
    expect(stats?.slowQueries).toBe(0);
  });

  it('captures the request path via captureQueryStats', () => {
    captureQueryStats({ originalUrl: '/api/v1/admin/users?page=1', method: 'GET' } as any, null as any, () => {});
    const stats = getCurrentRequestStats();
    expect(stats?.requestPath).toBe('/api/v1/admin/users?page=1');
    expect(stats?.requestMethod).toBe('GET');
  });

  it('resetQueryStats wipes prior state', () => {
    const fake = createFakePrisma();
    attachQueryLogger(fake as any);
    fake.emit({ query: 'SELECT * FROM `Product`', params: '[]', duration: 1, timestamp: new Date() });
    expect(getCurrentRequestStats()?.totalQueries).toBe(1);
    resetQueryStats();
    expect(getCurrentRequestStats()?.totalQueries).toBe(0);
  });

  it('handles unknown table names gracefully (queries with no FROM/INTO/UPDATE)', () => {
    const fake = createFakePrisma();
    attachQueryLogger(fake as any);
    // EXPLAIN / SHOW / SET statements have no table reference.
    fake.emit({ query: 'EXPLAIN SELECT 1', params: '[]', duration: 1, timestamp: new Date() });
    const stats = getCurrentRequestStats();
    // Falls back to "unknown" — we don't crash.
    expect(stats?.byModel.get('unknown')?.count).toBe(1);
  });

  it('emitSummary is a no-op when no queries fired', () => {
    resetQueryStats();
    // Should not throw — emits nothing when stats is empty.
    expect(() => emitSummary()).not.toThrow();
  });

  it('emitSummary logs a heavy request warning when N+1 threshold is exceeded', () => {
    const fake = createFakePrisma();
    attachQueryLogger(fake as any);
    captureQueryStats({ originalUrl: '/api/v1/admin/users', method: 'GET' } as any, null as any, () => {});
    const warnSpy = vi.spyOn(loggerModule.logger, 'warn').mockImplementation(() => undefined as any);
    // Fire 12 Product queries (>= N1_GROUPED=10) to trigger N+1 detector.
    for (let i = 0; i < 12; i++) {
      fake.emit({ query: 'SELECT * FROM `Product`', params: '[]', duration: 1, timestamp: new Date() });
    }
    emitSummary();
    expect(warnSpy).toHaveBeenCalled();
    const messages = warnSpy.mock.calls.map((c) => String(c[1]));
    expect(messages.some((m) => m.includes('N+1'))).toBe(true);
    warnSpy.mockRestore();
  });

  it('process-lifetime slow query counter increments on slow queries', () => {
    const fake = createFakePrisma();
    attachQueryLogger(fake as any);
    resetLifetimeQueryStats();
    // Slow query (>5ms threshold from beforeEach).
    fake.emit({ query: 'SELECT * FROM `Product`', params: '[]', duration: 50, timestamp: new Date() });
    expect(getLifetimeQueryStats().slowQueries).toBe(1);
    // Fast query — should NOT increment.
    fake.emit({ query: 'SELECT * FROM `Product`', params: '[]', duration: 1, timestamp: new Date() });
    expect(getLifetimeQueryStats().slowQueries).toBe(1);
  });

  it('process-lifetime N+1 counter increments when emitSummary detects a pattern', () => {
    const fake = createFakePrisma();
    attachQueryLogger(fake as any);
    resetLifetimeQueryStats();
    captureQueryStats({ originalUrl: '/api/v1/admin/users', method: 'GET' } as any, null as any, () => {});
    const warnSpy = vi.spyOn(loggerModule.logger, 'warn').mockImplementation(() => undefined as any);
    for (let i = 0; i < 12; i++) {
      fake.emit({ query: 'SELECT * FROM `Product`', params: '[]', duration: 1, timestamp: new Date() });
    }
    emitSummary();
    expect(getLifetimeQueryStats().n1Detections).toBe(1);
    warnSpy.mockRestore();
  });

  it('resetLifetimeQueryStats zeroes both counters', () => {
    const fake = createFakePrisma();
    attachQueryLogger(fake as any);
    fake.emit({ query: 'SELECT * FROM `Product`', params: '[]', duration: 50, timestamp: new Date() });
    expect(getLifetimeQueryStats().slowQueries).toBeGreaterThanOrEqual(1);
    resetLifetimeQueryStats();
    expect(getLifetimeQueryStats().slowQueries).toBe(0);
    expect(getLifetimeQueryStats().n1Detections).toBe(0);
  });
});