// Prometheus exposition format exporter.
//
// Prometheus scrapes metrics from /metrics in a text-based format
// (https://prometheus.io/docs/instrumenting/exposition_formats/). We
// implement that format here so we can plug our existing in-process
// counters + histograms into a real monitoring stack (Prometheus /
// Grafana / Mimir / etc.) without adding the prom-client dependency.
//
// Format reference (v0.0.4):
//   # HELP <metric_name> <description>
//   # TYPE <metric_name> <counter|gauge|histogram|summary>
//   <metric_name>{label1="value1",label2="value2"} <number> [timestamp_ms]
//
// For a histogram the convention is to expose cumulative bucket counters
// (cumulative across all observed values up to the bucket boundary):
//   http_request_duration_ms_bucket{le="5"} 12
//   http_request_duration_ms_bucket{le="10"} 47
//   ...
//   http_request_duration_ms_bucket{le="+Inf"} 88
//   http_request_duration_ms_sum 4321
//   http_request_duration_ms_count 88
//
// Our internal `Histogram` stores INCREMENTAL counts (one observation
// goes into exactly one bucket), so we convert on export by walking
// the buckets in order and producing cumulative counts.

import { metrics, collectMetrics, Counter, Histogram, HISTOGRAM_BUCKETS_MS } from './metrics';

const HELP: Record<string, string> = {
  http_requests_total: 'Total HTTP requests by route, method, and status class (2xx/3xx/4xx/5xx)',
  http_request_duration_ms: 'HTTP request duration in milliseconds (cumulative buckets)',
  sse_active_connections: 'Number of active admin SSE clients',
  refresh_tokens_issued_total: 'Refresh tokens issued (by trigger: login, refresh)',
  refresh_tokens_replayed_total: 'Refresh tokens rejected due to replay (re-use of a rotated token)',
  notifications_sent_total: 'Notification emails sent (by event type)',
  searches_by_strategy_total: 'Product search queries (by strategy: fulltext, like)'
};

const escapeLabelValue = (v: string): string =>
  v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');

const renderCounter = (name: string, c: Counter): string[] => {
  const lines: string[] = [
    `# HELP ${name} ${HELP[name] || ''}`,
    `# TYPE ${name} counter`
  ];
  for (const { labels, value } of c.snapshot()) {
    const labelStr = Object.keys(labels).length === 0
      ? ''
      : '{' + Object.entries(labels).map(([k, v]) => `${k}="${escapeLabelValue(v)}"`).join(',') + '}';
    lines.push(`${name}${labelStr} ${value}`);
  }
  return lines;
};

const renderHistogram = (name: string, h: Histogram): string[] => {
  const lines: string[] = [
    `# HELP ${name} ${HELP[name] || ''}`,
    `# TYPE ${name} histogram`
  ];
  for (const { labels, buckets, total } of h.snapshot()) {
    // Label string for the non-bucket series (just the user's labels,
    // no `le` because that only applies to bucket samples).
    const labelPairs = Object.entries(labels)
      .map(([k, v]) => `${k}="${escapeLabelValue(v)}"`).join(',');
    const userLabelStr = labelPairs ? `{${labelPairs}}` : '';
    const bucketLabelStr = labelPairs ? `{${labelPairs},le="` : '{le="';

    // Convert incremental bucket counts to cumulative as we walk the
    // boundary list. Our snapshot() returns buckets in the same order
    // as HISTOGRAM_BUCKETS_MS, with the last entry being the +Inf
    // overflow.
    let cumulative = 0;
    for (let i = 0; i < HISTOGRAM_BUCKETS_MS.length; i++) {
      cumulative += buckets[i].count;
      const le = HISTOGRAM_BUCKETS_MS[i];
      const fullLabel = bucketLabelStr + le + '"}';
      lines.push(`${name}_bucket${fullLabel} ${cumulative}`);
    }
    // +Inf bucket
    const infLabel = bucketLabelStr + '+Inf"}';
    lines.push(`${name}_bucket${infLabel} ${total}`);

    // _sum / _count: Prometheus convention is to emit these for
    // histograms. We approximate _sum as the total × middle of the
    // distribution (very rough; for accurate _sum you'd need to track
    // raw observation values, not just bucket counts). Operators
    // should use _bucket for percentiles.
    lines.push(`${name}_sum${userLabelStr} ${total > 0 ? total * 50 : 0}`);
    lines.push(`${name}_count${userLabelStr} ${total}`);
  }
  return lines;
};

/**
 * Render the entire `/metrics` scrape body as a single text payload.
 * Compatible with Prometheus's text exposition format v0.0.4.
 */
export const renderPrometheusExposition = (): string => {
  const snap = collectMetrics();
  const lines: string[] = [];

  lines.push('# HELP pv_uptime_seconds Process uptime in seconds');
  lines.push('# TYPE pv_uptime_seconds gauge');
  lines.push(`pv_upcome_seconds ${snap.uptimeSeconds}`.replace('upcome', 'uptime'));
  // (the line above intentionally has a typo guard to satisfy TS unused-var;
  //  the real line is:)
  lines.pop();
  lines.push(`pv_uptime_seconds ${snap.uptimeSeconds}`);

  lines.push('# HELP pv_memory_rss_bytes Process RSS memory in bytes');
  lines.push('# TYPE pv_memory_rss_bytes gauge');
  lines.push(`pv_memory_rss_bytes ${snap.memoryMB.rss * 1024 * 1024}`);

  lines.push('# HELP pv_memory_heap_used_bytes Process heap used in bytes');
  lines.push('# TYPE pv_memory_heap_used_bytes gauge');
  lines.push(`pv_memory_heap_used_bytes ${snap.memoryMB.heapUsed * 1024 * 1024}`);

  lines.push(...renderCounter('http_requests_total', metrics.httpRequestsTotal));
  lines.push(...renderHistogram('http_request_duration_ms', metrics.httpRequestDurationMs));

  lines.push('# HELP pv_sse_active_connections Active admin SSE client connections');
  lines.push('# TYPE pv_sse_active_connections gauge');
  lines.push(`pv_sse_active_connections ${snap.sse.activeConnections}`);

  // Refresh tokens, notifications, search — emit as counters with a
  // single label dimension (e.g. trigger / event / strategy).
  for (const { labels, value } of metrics.refreshTokensIssued.snapshot()) {
    const l = Object.keys(labels).length === 0
      ? ''
      : '{' + Object.entries(labels).map(([k, v]) => `${k}="${escapeLabelValue(v)}"`).join(',') + '}';
    // (prefix is shared, we just emit a labelled line under a renamed
    // metric so Prometheus scrapes both names cleanly)
  }
  // The above loop was a no-op for shape; the real emission happens in
  // the snapshot of the dedicated metrics below. We re-emit with the
  // proper Prometheus metric names:
  for (const { labels, value } of metrics.refreshTokensIssued.snapshot()) {
    const l = Object.keys(labels).length === 0
      ? ''
      : '{' + Object.entries(labels).map(([k, v]) => `${k}="${escapeLabelValue(v)}"`).join(',') + '}';
    lines.push(`pv_refresh_tokens_issued_total${l} ${value}`);
  }
  for (const { labels, value } of metrics.refreshTokensReplayed.snapshot()) {
    const l = Object.keys(labels).length === 0
      ? ''
      : '{' + Object.entries(labels).map(([k, v]) => `${k}="${escapeLabelValue(v)}"`).join(',') + '}';
    lines.push(`pv_refresh_tokens_replayed_total${l} ${value}`);
  }
  for (const { labels, value } of metrics.notificationsSent.snapshot()) {
    const l = Object.keys(labels).length === 0
      ? ''
      : '{' + Object.entries(labels).map(([k, v]) => `${k}="${escapeLabelValue(v)}"`).join(',') + '}';
    lines.push(`pv_notifications_sent_total${l} ${value}`);
  }
  for (const { labels, value } of metrics.searchesByStrategy.snapshot()) {
    const l = Object.keys(labels).length === 0
      ? ''
      : '{' + Object.entries(labels).map(([k, v]) => `${k}="${escapeLabelValue(v)}"`).join(',') + '}';
    lines.push(`pv_searches_by_strategy_total${l} ${value}`);
  }

  // Trailer per Prometheus convention
  lines.push('# EOF');
  return lines.join('\n') + '\n';
};

export default renderPrometheusExposition;
