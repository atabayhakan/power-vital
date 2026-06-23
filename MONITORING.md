# Monitoring (Prometheus + Grafana)

## Mimari

```
┌──────────────────┐  scrape :9100  ┌──────────────────┐
│  pv-backend      │───────────────▶│  Prometheus       │
│  :3000/api       │                 │  :9090            │
│  :3000/metrics   │                 │  TSDB (long-term) │
└──────────────────┘                 └────────┬──────────┘
                                              │ PromQL
                                              ▼
                                     ┌──────────────────┐
                                     │  Grafana          │
                                     │  :3001            │
                                     │  Dashboards       │
                                     └──────────────────┘
```

## Prometheus scrape config

`prometheus.yml` (on the Prometheus host):

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'pv-backend'
    # Restrict at the network layer — /metrics is unauthenticated.
    # Either:
    #   • nginx allows only internal IPs (10.0.0.0/8, 172.16.0.0/12)
    #   • Or run Prometheus on the same docker network
    metrics_path: /metrics
    static_configs:
      - targets: ['pv-prod.internal:3000']
        labels:
          service: 'pv-backend'
          env: 'production'
```

Restart Prometheus after the config change:
```bash
docker restart prometheus
# or
systemctl reload prometheus
```

## Endpoints

| URL | Purpose | Auth |
|---|---|---|
| `GET /metrics` | Prometheus scrape target | None (network-restricted) |
| `GET /api/v1/admin/metrics` | Same data, JSON for the admin dashboard | Admin only |
| `GET /health/ready` | Liveness + DB ping | None |

## Exposed metrics

| Metric | Type | Labels | Source |
|---|---|---|---|
| `pv_uptime_seconds` | gauge | – | `process.uptime()` |
| `pv_memory_rss_bytes` | gauge | – | `process.memoryUsage().rss` |
| `pv_memory_heap_used_bytes` | gauge | – | `process.memoryUsage().heapUsed` |
| `pv_sse_active_connections` | gauge | – | `metrics.sseActiveConnections` |
| `pv_refresh_tokens_issued_total` | counter | – | `tokenService` |
| `pv_refresh_tokens_replayed_total` | counter | – | `tokenService` (replay detection) |
| `pv_notifications_sent_total` | counter | – | `notificationService` |
| `pv_searches_by_strategy_total` | counter | – | `searchService` |
| `http_requests_total` | counter | `route`, `method`, `status` | `metricsMiddleware` |
| `http_request_duration_ms_bucket` | histogram | `le`, `route`, `method` | `metricsMiddleware` |
| `http_request_duration_ms_sum` | histogram | `route`, `method` | approximation |
| `http_request_duration_ms_count` | histogram | `route`, `method` | exact count |

## Useful PromQL queries

```promql
# Request rate (per second, per route, last 5 min)
sum by (route) (rate(http_requests_total[5m]))

# Error rate (5xx as % of all requests)
sum by (route) (rate(http_requests_total{status="5xx"}[5m]))
  / sum by (route) (rate(http_requests_total[5m])) * 100

# p95 request latency (per route)
histogram_quantile(0.95,
  sum by (le, route) (rate(http_request_duration_ms_bucket[5m]))
)

# Active SSE clients
pv_sse_active_connections

# Refresh-token replay rate (security signal!)
rate(pv_refresh_tokens_replayed_total[5m])

# Memory usage trend
pv_memory_rss_bytes / 1024 / 1024  # MB
```

## Grafana dashboard

Import-ready dashboard JSON (Grafana 10+):

```json
{
  "title": "Power Vital — Backend",
  "uid": "pv-backend",
  "schemaVersion": 39,
  "version": 1,
  "panels": [
    {
      "type": "stat",
      "title": "Uptime (hours)",
      "gridPos": { "h": 4, "w": 6, "x": 0, "y": 0 },
      "targets": [{
        "expr": "pv_uptime_seconds / 3600",
        "refId": "A"
      }]
    },
    {
      "type": "stat",
      "title": "Memory (MB)",
      "gridPos": { "h": 4, "w": 6, "x": 6, "y": 0 },
      "targets": [{
        "expr": "pv_memory_rss_bytes / 1024 / 1024",
        "refId": "A"
      }]
    },
    {
      "type": "stat",
      "title": "Active SSE clients",
      "gridPos": { "h": 4, "w": 6, "x": 12, "y": 0 },
      "targets": [{
        "expr": "pv_sse_active_connections",
        "refId": "A"
      }]
    },
    {
      "type": "stat",
      "title": "Refresh-token replays (5m)",
      "gridPos": { "h": 4, "w": 6, "x": 18, "y": 0 },
      "fieldConfig": {
        "defaults": {
          "thresholds": {
            "mode": "absolute",
            "steps": [
              { "color": "green", "value": null },
              { "color": "red", "value": 1 }
            ]
          }
        }
      },
      "targets": [{
        "expr": "sum(increase(pv_refresh_tokens_replayed_total[5m]))",
        "refId": "A"
      }]
    },
    {
      "type": "timeseries",
      "title": "Request rate by route (req/s)",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 4 },
      "targets": [{
        "expr": "sum by (route) (rate(http_requests_total[1m]))",
        "legendFormat": "{{route}}",
        "refId": "A"
      }]
    },
    {
      "type": "timeseries",
      "title": "p95 latency by route (ms)",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 4 },
      "targets": [{
        "expr": "histogram_quantile(0.95, sum by (le, route) (rate(http_request_duration_ms_bucket[5m])))",
        "legendFormat": "p95 {{route}}",
        "refId": "A"
      }]
    },
    {
      "type": "timeseries",
      "title": "Error rate (5xx %)",
      "gridPos": { "h": 8, "w": 24, "x": 0, "y": 12 },
      "fieldConfig": {
        "defaults": {
          "unit": "percent",
          "max": 5,
          "thresholds": {
            "mode": "absolute",
            "steps": [
              { "color": "green", "value": null },
              { "color": "orange", "value": 1 },
              { "color": "red", "value": 3 }
            ]
          }
        }
      },
      "targets": [{
        "expr": "sum by (route) (rate(http_requests_total{status=\"5xx\"}[5m])) / sum by (route) (rate(http_requests_total[5m])) * 100",
        "legendFormat": "{{route}}",
        "refId": "A"
      }]
    }
  ]
}
```

To import: **Grafana → Dashboards → New → Import → paste JSON**.

## Alerts

`alertmanager.yml` (or via Grafana unified alerting):

```yaml
groups:
  - name: pv-backend
    rules:
      # 5xx rate > 5% for 5 min
      - alert: HighErrorRate
        expr: |
          sum by (route) (rate(http_requests_total{status="5xx"}[5m]))
            / sum by (route) (rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High 5xx rate on {{ $labels.route }}"

      # p95 latency > 1s for 5 min
      - alert: SlowRequests
        expr: |
          histogram_quantile(0.95,
            sum by (le, route) (rate(http_request_duration_ms_bucket[5m]))
          ) > 1000
        for: 5m
        labels:
          severity: warning

      # Refresh-token replay detected (possible stolen token!)
      - alert: RefreshTokenReplay
        expr: increase(pv_refresh_tokens_replayed_total[5m]) > 0
        for: 1m
        labels:
          severity: critical

      # Memory > 500MB
      - alert: HighMemory
        expr: pv_memory_rss_bytes > 524288000
        for: 10m
        labels:
          severity: warning
```

## Network security (CRITICAL)

`/metrics` is unauthenticated. **You MUST restrict access at the network
layer**:

1. **nginx vhost block** (recommended):
   ```nginx
   # /etc/nginx/sites-enabled/pv-backend
   location /metrics {
     # Allow only Prometheus host
     allow 10.0.5.20;  # prometheus.internal
     deny all;
     proxy_pass http://pv-backend:3000;
   }
   ```

2. **Or** firewall rule (iptables/nftables):
   ```bash
   iptables -A INPUT -p tcp --dport 3000 -s 10.0.5.20 -j ACCEPT
   iptables -A INPUT -p tcp --dport 3000 -j DROP
   ```

3. **Or** separate internal-only nginx vhost on port 9090 that only Prometheus can reach.

**Do not** expose /metrics to the public internet — it leaks your
internal endpoint names and request volumes.

## Why no authentication?

Prometheus scrapers don't carry user credentials by design. The
official guidance is "expose /metrics on an internal-only port or
network segment". We've kept our implementation auth-free to match
the ecosystem's expectations; the network layer is the correct place
to lock this down.
