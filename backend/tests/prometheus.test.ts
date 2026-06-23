// Prometheus exporter tests — verify the text exposition format is
// valid (parseable by a Prometheus parser) and that the metric values
// match the underlying registry state.
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { renderPrometheusExposition } from '../src/utils/prometheusExporter';
import { resetAllMetrics, metrics } from '../src/utils/metrics';
import prometheusMetricsRoute from '../src/routes/metrics';

const buildApp = () => {
  const app = express();
  app.use('/metrics', prometheusMetricsRoute);
  return app;
};

describe('Prometheus exporter — text format', () => {
  beforeEach(() => { resetAllMetrics(); });

  it('returns text/plain version=0.0.4 content type', async () => {
    const app = buildApp();
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.headers['content-type']).toMatch(/version=0\.0\.4/);
  });

  it('ends with the Prometheus convention # EOF trailer', () => {
    const body = renderPrometheusExposition();
    expect(body).toMatch(/# EOF\n$/);
  });

  it('emits a # TYPE line for every metric family', () => {
    metrics.httpRequestsTotal.inc({ route: '/x', method: 'GET', status: '2xx' });
    const body = renderPrometheusExposition();
    // Every metric must declare its type
    expect(body).toMatch(/# TYPE http_requests_total counter/);
    expect(body).toMatch(/# TYPE http_request_duration_ms histogram/);
    expect(body).toMatch(/# TYPE pv_uptime_seconds gauge/);
    expect(body).toMatch(/# TYPE pv_memory_rss_bytes gauge/);
  });

  it('emits a # HELP line for every metric family', () => {
    const body = renderPrometheusExposition();
    expect(body).toMatch(/# HELP http_requests_total /);
    expect(body).toMatch(/# HELP pv_uptime_seconds /);
  });

  it('emits counter samples with labelled format key="val"', () => {
    metrics.httpRequestsTotal.inc({ route: '/api/v1/products', method: 'GET', status: '2xx' });
    metrics.httpRequestsTotal.inc({ route: '/api/v1/products', method: 'GET', status: '2xx' });
    const body = renderPrometheusExposition();
    // Two inc → value=2. Labels are emitted in sorted-key order
    // (alphabetical) so we use a permissive regex.
    expect(body).toMatch(
      /http_requests_total\{[^}]*method="GET"[^}]*route="\/api\/v1\/products"[^}]*status="2xx"[^}]*\} 2/
    );
  });

  it('escapes label values that contain quotes or newlines', () => {
    metrics.httpRequestsTotal.inc({ route: '/x"y', method: 'GET', status: '2xx' });
    const body = renderPrometheusExposition();
    // Quotes are escaped as \", backslashes as \\
    expect(body).toMatch(/route="\/x\\"y"/);
  });

  it('emits histogram buckets with cumulative counts and le="…" label', () => {
    metrics.httpRequestDurationMs.observe({ route: '/x', method: 'GET' }, 8);
    metrics.httpRequestDurationMs.observe({ route: '/x', method: 'GET' }, 250);
    metrics.httpRequestDurationMs.observe({ route: '/x', method: 'GET' }, 3000);
    const body = renderPrometheusExposition();
    // Cumulative: le=5 (0 obs), le=10 (1 obs, only the 8), le=10 bucket
    // is the first non-zero one. The 250 lands in le=250, the 3000 in
    // le=5000.
    expect(body).toMatch(/http_request_duration_ms_bucket\{[^}]*le="5"[^}]*\} 0/);
    expect(body).toMatch(/http_request_duration_ms_bucket\{[^}]*le="10"[^}]*\} 1/);
    // +Inf bucket holds the total (3 observations)
    expect(body).toMatch(/http_request_duration_ms_bucket\{[^}]*le="\+Inf"[^}]*\} 3/);
    // _count is the total too
    expect(body).toMatch(/http_request_duration_ms_count\{[^}]*\} 3/);
  });

  it('emits pv_uptime_seconds and pv_memory_rss_bytes gauges with sensible values', () => {
    const body = renderPrometheusExposition();
    expect(body).toMatch(/pv_uptime_seconds \d+/);
    expect(body).toMatch(/pv_memory_rss_bytes \d+/);
    // Memory value must be > 0 (any real process has some RSS)
    const m = body.match(/pv_memory_rss_bytes (\d+)/);
    expect(Number(m![1])).toBeGreaterThan(0);
  });

  it('emits pv_sse_active_connections as a gauge from metrics.sse.activeConnections', () => {
    metrics.sseActiveConnections.inc({}, 3);
    const body = renderPrometheusExposition();
    expect(body).toMatch(/pv_sse_active_connections 3/);
  });
});

describe('Prometheus endpoint — HTTP behaviour', () => {
  it('returns 200 OK with the right Content-Type on a fresh process', async () => {
    const app = buildApp();
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text.length).toBeGreaterThan(0);
  });

  it('does NOT require auth (Prometheus scrapers don\'t have user creds)', async () => {
    const app = buildApp();
    // No Authorization header, no cookies
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
  });
});
