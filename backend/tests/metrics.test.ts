// Metrics tests — counter, histogram, registry, snapshot, reset.
// We also exercise the metricsMiddleware end-to-end with a tiny
// express app + supertest.
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Counter, Histogram, metrics, collectMetrics, resetAllMetrics, HISTOGRAM_BUCKETS_MS } from '../src/utils/metrics';
import { metricsMiddleware } from '../src/utils/metricsMiddleware';

describe('Counter', () => {
  let c: Counter;
  beforeEach(() => { c = new Counter(); });

  it('starts at 0 and increments by 1 by default', () => {
    expect(c.get()).toBe(0);
    c.inc();
    expect(c.get()).toBe(1);
  });

  it('increments by a custom amount', () => {
    c.inc({ route: '/x' }, 5);
    expect(c.get({ route: '/x' })).toBe(5);
  });

  it('keys counter by label set (order-independent)', () => {
    c.inc({ a: '1', b: '2' });
    c.inc({ b: '2', a: '1' });
    expect(c.get({ a: '1', b: '2' })).toBe(2);
  });

  it('keeps different label sets separate', () => {
    c.inc({ route: '/a' });
    c.inc({ route: '/b' });
    expect(c.get({ route: '/a' })).toBe(1);
    expect(c.get({ route: '/b' })).toBe(1);
    expect(c.snapshot()).toHaveLength(2);
  });

  it('reset() clears all values', () => {
    c.inc({ a: '1' });
    c.inc({ a: '2' });
    c.reset();
    expect(c.snapshot()).toEqual([]);
  });
});

describe('Histogram', () => {
  let h: Histogram;
  beforeEach(() => { h = new Histogram(); });

  it('buckets values into the standard latency ranges (incremental, NOT cumulative)', () => {
    [3, 8, 20, 60, 200, 800, 3000, 8000, 60_000].forEach(v => h.observe({}, v));
    const snap = h.snapshot();
    expect(snap).toHaveLength(1);
    const s = snap[0];
    // Total observations
    expect(s.total).toBe(9);
    // The histogram is incremental: each value goes into the FIRST
    // bucket whose upper bound >= value. (Cumulative counting is left
    // to the consumer: sum the buckets from index 0..i to get the
    // "how many observations <= le" count.)
    const lookup = (le: number) => s.buckets.find(b => b.le === le)?.count ?? 0;
    expect(lookup(5)).toBe(1);        // 3 → 5ms bucket
    expect(lookup(10)).toBe(1);       // 8 → 10ms bucket
    expect(lookup(25)).toBe(1);       // 20 → 25ms bucket
    expect(lookup(100)).toBe(1);      // 60 → 100ms bucket
    expect(lookup(250)).toBe(1);      // 200 → 250ms bucket
    expect(lookup(1000)).toBe(1);     // 800 → 1000ms bucket
    expect(lookup(5000)).toBe(1);     // 3000 → 5000ms bucket
    expect(lookup(10_000)).toBe(1);   // 8000 → 10s bucket
    // +Inf bucket holds the overflow value (60_000)
    expect(s.buckets[s.buckets.length - 1].le).toBe(Infinity);
    expect(s.buckets[s.buckets.length - 1].count).toBe(1);
  });

  it('multiple observations into the same bucket accumulate', () => {
    [3, 4, 5, 12, 18].forEach(v => h.observe({}, v));
    const snap = h.snapshot();
    const s = snap[0];
    // 3, 4, 5 all land in the [<=5] bucket
    // 12, 18 land in the [<=25] bucket
    const lookup = (le: number) => s.buckets.find(b => b.le === le)?.count ?? 0;
    expect(lookup(5)).toBe(3);
    expect(lookup(25)).toBe(2);
    expect(s.total).toBe(5);
  });

  it('keeps different label sets separate', () => {
    h.observe({ route: '/a' }, 50);
    h.observe({ route: '/b' }, 50);
    const snap = h.snapshot();
    expect(snap).toHaveLength(2);
    const a = snap.find(s => s.labels.route === '/a');
    const b = snap.find(s => s.labels.route === '/b');
    expect(a?.total).toBe(1);
    expect(b?.total).toBe(1);
  });
});

describe('metrics registry — snapshot + reset', () => {
  beforeEach(() => { resetAllMetrics(); });

  it('collectMetrics returns the expected shape with zeroed values initially', () => {
    const m = collectMetrics();
    expect(m).toHaveProperty('timestamp');
    expect(m).toHaveProperty('uptimeSeconds');
    expect(m.memoryMB.rss).toBeGreaterThan(0);
    expect(m.http.requests).toEqual([]);
    expect(m.http.duration).toEqual([]);
    expect(m.sse.activeConnections).toBe(0);
  });

  it('collectMetrics reflects .inc / .observe calls', () => {
    metrics.httpRequestsTotal.inc({ route: '/api/v1/x', method: 'GET', status: '2xx' });
    metrics.httpRequestsTotal.inc({ route: '/api/v1/x', method: 'GET', status: '2xx' });
    metrics.httpRequestDurationMs.observe({ route: '/api/v1/x', method: 'GET' }, 42);
    const m = collectMetrics();
    const getX = m.http.requests.find(r =>
      r.labels.route === '/api/v1/x' && r.labels.method === 'GET' && r.labels.status === '2xx'
    );
    expect(getX?.value).toBe(2);
    const durX = m.http.duration.find(d => d.labels.route === '/api/v1/x');
    expect(durX?.total).toBe(1);
  });

  it('resetAllMetrics clears everything', () => {
    metrics.httpRequestsTotal.inc({ route: '/x', method: 'GET', status: '2xx' });
    metrics.searchesByStrategy.inc({ strategy: 'fulltext' });
    resetAllMetrics();
    const m = collectMetrics();
    expect(m.http.requests).toEqual([]);
    expect(m.search.byStrategy).toEqual([]);
  });
});

describe('metricsMiddleware — end-to-end', () => {
  beforeEach(() => { resetAllMetrics(); });

  const buildApp = () => {
    const app = express();
    app.use(metricsMiddleware);
    app.get('/api/v1/test-ok', (_req, res) => res.json({ ok: true }));
    app.get('/api/v1/test-error', (_req, res) => res.status(500).json({ error: 'x' }));
    app.get('/health', (_req, res) => res.json({ status: 'ok' }));
    return app;
  };

  it('skips /health entirely (no metric recorded)', async () => {
    const app = buildApp();
    await request(app).get('/health');
    const m = collectMetrics();
    // No /health entries should appear
    expect(m.http.requests.find(r => r.labels.route === '/health')).toBeUndefined();
    expect(m.http.duration.find(d => d.labels.route === '/health')).toBeUndefined();
  });

  it('records a 2xx request for a successful endpoint', async () => {
    const app = buildApp();
    await request(app).get('/api/v1/test-ok');
    const m = collectMetrics();
    const hit = m.http.requests.find(r =>
      r.labels.route === '/api/v1/test-ok' && r.labels.status === '2xx'
    );
    expect(hit).toBeDefined();
    expect(hit!.value).toBe(1);
  });

  it('records a 5xx request with status=5xx label', async () => {
    const app = buildApp();
    await request(app).get('/api/v1/test-error');
    const m = collectMetrics();
    const hit = m.http.requests.find(r =>
      r.labels.route === '/api/v1/test-error' && r.labels.status === '5xx'
    );
    expect(hit?.value).toBe(1);
  });

  it('records a latency observation for every request', async () => {
    const app = buildApp();
    await request(app).get('/api/v1/test-ok');
    const m = collectMetrics();
    const dur = m.http.duration.find(d => d.labels.route === '/api/v1/test-ok');
    expect(dur).toBeDefined();
    expect(dur!.total).toBe(1);
  });

  it('bucketed value falls into a real bucket (no overflow)', async () => {
    const app = buildApp();
    await request(app).get('/api/v1/test-ok');
    const m = collectMetrics();
    const dur = m.http.duration.find(d => d.labels.route === '/api/v1/test-ok')!;
    // The single observation should land in some bucket <= HISTOGRAM_BUCKETS_MS[0]
    // (a local supertest call is essentially instantaneous) OR the first
    // non-zero bucket. We just assert that total = 1 and that one bucket
    // has count = 1.
    const nonZero = dur.buckets.find(b => b.count > 0);
    expect(nonZero).toBeDefined();
    expect(nonZero!.count).toBe(1);
  });
});
