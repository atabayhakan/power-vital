<script setup lang="ts">
// AdminMetricsWidget — top-of-dashboard live ops panel.
//
// Shows:
//   • Endpoint table: route, method, total requests, error rate, p95
//   • System: uptime, memory, active SSE connections
//   • Top slow endpoints (from latency histogram totals)
// Auto-refreshes:
//   • On every admin realtime event (new_order, etc.) — instant
//   • Every 5 seconds via polling — fallback
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { apiGet } from '@/api/openapi-client';
import { useAdminRealtime } from '../composables/useAdminRealtime';
import { useTranslate } from '../composables/useTranslate';

const { t } = useTranslate();

interface MetricsSnapshot {
  timestamp: number;
  uptimeSeconds: number;
  memoryMB: { rss: number; heapUsed: number };
  http: {
    requests: Array<{ labels: { route: string; method: string; status: string }; value: number }>;
    duration: Array<{
      labels: { route: string; method: string };
      total: number;
      buckets: Array<{ le: number; count: number }>;
    }>;
  };
  sse: { activeConnections: number };
  auth: {
    refreshTokensIssued: Array<{ value: number }>;
    refreshTokensReplayed: Array<{ value: number }>;
  };
  notifications: { sent: Array<{ labels: { event?: string }; value: number }> };
  search: { byStrategy: Array<{ labels: { strategy?: string }; value: number }> };
  db?: { slowQueries: number; n1Detections: number };
  cache?: {
    total: number;
    hits: number;
    misses: number;
    bypasses: number;
    hitRatio: number;
    byRoute: Array<{ route: string; hits: number; misses: number; bypasses: number }>;
  };
}

const metrics = ref<MetricsSnapshot | null>(null);
const isLoading = ref(false);
const errorMsg = ref('');
const lastUpdated = ref<Date | null>(null);

const refresh = async () => {
  isLoading.value = true;
  try {
    const { data } = await apiGet('/api/v1/admin/metrics');
    metrics.value = data as unknown as MetricsSnapshot;
    errorMsg.value = '';
    lastUpdated.value = new Date();
  } catch (e: any) {
    errorMsg.value = e.response?.data?.error || t('admin.metrics.fetchError');
  } finally {
    isLoading.value = false;
  }
};

// ── Aggregations ──────────────────────────────────────────────────────
interface EndpointSummary {
  route: string;
  method: string;
  total: number;
  errors: number;
  p95: number;
  errorRate: number;
}

const endpointRows = computed<EndpointSummary[]>(() => {
  if (!metrics.value) return [];
  const counts = new Map<string, { total: number; errors: number }>();
  for (const r of metrics.value.http.requests) {
    const k = `${r.labels.method} ${r.labels.route}`;
    const cur = counts.get(k) ?? { total: 0, errors: 0 };
    cur.total += r.value;
    if (r.labels.status === '4xx' || r.labels.status === '5xx') cur.errors += r.value;
    counts.set(k, cur);
  }
  // Add p95 from the duration histogram
  const durByKey = new Map<string, number>();
  for (const d of metrics.value.http.duration) {
    const k = `${d.labels.method} ${d.labels.route}`;
    durByKey.set(k, p95FromBuckets(d.buckets, d.total));
  }
  return Array.from(counts.entries())
    .map(([key, v]) => {
      const [method, ...rest] = key.split(' ');
      const route = rest.join(' ');
      return {
        route, method,
        total: v.total,
        errors: v.errors,
        p95: durByKey.get(key) ?? 0,
        errorRate: v.total > 0 ? v.errors / v.total : 0
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);
});

/**
 * Approximate p95 from a cumulative histogram.
 * Walks the buckets in order, finds the bucket that crosses the
 * 95% threshold, and returns its upper bound. Cheap and good enough
 * for an at-a-glance dashboard.
 */
const p95FromBuckets = (buckets: Array<{ le: number; count: number }>, total: number): number => {
  if (total === 0) return 0;
  let cumulative = 0;
  const target = total * 0.95;
  for (const b of buckets) {
    cumulative += b.count;
    if (cumulative >= target) return b.le === Infinity ? 10_000 : b.le;
  }
  return 10_000;
};

const fmtUptime = (s: number): string => {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  const h = Math.floor(s / 3600);
  return `${h}h ${Math.floor((s % 3600) / 60)}m`;
};

const fmtPct = (n: number): string => `${(n * 100).toFixed(1)}%`;

const routeHitRatio = (r: { hits: number; misses: number; bypasses: number }): number => {
  const total = r.hits + r.misses + r.bypasses;
  return total > 0 ? r.hits / total : 0;
};

const totalRequests = computed(() =>
  endpointRows.value.reduce((sum, r) => sum + r.total, 0)
);
const totalErrors = computed(() =>
  endpointRows.value.reduce((sum, r) => sum + r.errors, 0)
);
const overallErrorRate = computed(() =>
  totalRequests.value > 0 ? totalErrors.value / totalRequests.value : 0
);

// ── Lifecycle ────────────────────────────────────────────────────────
const realtime = useAdminRealtime();
realtime.onMany(
  ['new_order', 'payment_received', 'ocr_pending', 'withdrawal_request', 'withdrawal_approved', 'withdrawal_rejected', 'low_stock'],
  () => { refresh(); }
);

let pollHandle: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  refresh();
  // Fallback poll every 30s — SSE fires refresh() on relevant events,
  // this is just a safety net for missed events / background tabs.
  pollHandle = setInterval(refresh, 30_000);
});
onUnmounted(() => {
  if (pollHandle) clearInterval(pollHandle);
});
</script>

<template>
  <div class="metrics-widget clay-surface">
    <header class="mw-head">
      <h3 class="mw-title">📊 {{ t('admin.metrics.title') }}</h3>
      <span v-if="lastUpdated" class="mw-updated">
        {{ t('admin.metrics.lastUpdated', { time: lastUpdated.toLocaleTimeString() }) }}
        <span v-if="isLoading" class="mw-spinner">↻</span>
      </span>
    </header>

    <p v-if="errorMsg" class="mw-error">{{ errorMsg }}</p>

    <template v-if="metrics">
      <!-- System card row -->
      <div class="mw-cards">
        <div class="mw-card">
          <span class="mw-label">{{ t('admin.metrics.uptime') }}</span>
          <span class="mw-value">{{ fmtUptime(metrics.uptimeSeconds) }}</span>
        </div>
        <div class="mw-card">
          <span class="mw-label">{{ t('admin.metrics.memoryRss') }}</span>
          <span class="mw-value">{{ metrics.memoryMB.rss }} MB</span>
        </div>
        <div class="mw-card">
          <span class="mw-label">{{ t('admin.metrics.heap') }}</span>
          <span class="mw-value">{{ metrics.memoryMB.heapUsed }} MB</span>
        </div>
        <div class="mw-card">
          <span class="mw-label">{{ t('admin.metrics.activeSse') }}</span>
          <span class="mw-value">{{ metrics.sse.activeConnections }}</span>
        </div>
        <div class="mw-card mw-card--highlight">
          <span class="mw-label">{{ t('admin.metrics.totalRequests') }}</span>
          <span class="mw-value">{{ totalRequests.toLocaleString() }}</span>
        </div>
        <div class="mw-card" :class="{ 'mw-card--bad': overallErrorRate > 0.05 }">
          <span class="mw-label">{{ t('admin.metrics.errorRate') }}</span>
          <span class="mw-value">{{ fmtPct(overallErrorRate) }}</span>
        </div>
        <!-- Database query observability — see backend/utils/prismaQueryLogger.ts.
             Counts since process start; reset only via admin /reset hook. -->
        <div class="mw-card" :class="{ 'mw-card--bad': (metrics.db?.slowQueries ?? 0) > 0 }">
          <span class="mw-label">{{ t('admin.metrics.slowQuery') }}</span>
          <span class="mw-value">{{ metrics.db?.slowQueries ?? 0 }}</span>
        </div>
        <div class="mw-card" :class="{ 'mw-card--bad': (metrics.db?.n1Detections ?? 0) > 0 }">
          <span class="mw-label">{{ t('admin.metrics.n1Detection') }}</span>
          <span class="mw-value">{{ metrics.db?.n1Detections ?? 0 }}</span>
        </div>
        <!-- Cache hit-rate — see backend/utils/cacheStats.ts.
             A ratio < 50% means Redis is mostly missing and the route
             handler is re-running on every request. -->
        <div class="mw-card"
             :class="{ 'mw-card--bad': (metrics.cache?.hitRatio ?? 0) < 0.5 && (metrics.cache?.total ?? 0) > 10 }">
          <span class="mw-label">{{ t('admin.metrics.cacheHitRatio') }}</span>
          <span class="mw-value">{{ fmtPct(metrics.cache?.hitRatio ?? 0) }}</span>
        </div>
      </div>

      <!-- Cache effectiveness per route (only shown when we have data) -->
      <template v-if="metrics.cache && metrics.cache.byRoute.length > 0">
        <h4 class="mw-section">{{ t('admin.metrics.cacheByRoute') }}</h4>
        <table class="mw-table">
          <thead>
            <tr>
              <th>{{ t('admin.metrics.colRoute') }}</th>
              <th class="num">{{ t('admin.metrics.colHit') }}</th>
              <th class="num">{{ t('admin.metrics.colMiss') }}</th>
              <th class="num">{{ t('admin.metrics.colBypass') }}</th>
              <th class="num">{{ t('admin.metrics.colHitPct') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in metrics.cache.byRoute" :key="r.route">
              <td class="mw-route">{{ r.route }}</td>
              <td class="num">{{ r.hits.toLocaleString() }}</td>
              <td class="num">{{ r.misses.toLocaleString() }}</td>
              <td class="num">{{ r.bypasses.toLocaleString() }}</td>
              <td class="num">
                {{ fmtPct(routeHitRatio(r)) }}
              </td>
            </tr>
          </tbody>
        </table>
      </template>

      <!-- Top endpoints table -->
      <h4 class="mw-section">{{ t('admin.metrics.busiestEndpoints') }}</h4>
      <table class="mw-table">
        <thead>
          <tr>
            <th>{{ t('admin.metrics.colMethod') }}</th>
            <th>{{ t('admin.metrics.colRoute') }}</th>
            <th class="num">{{ t('admin.metrics.colRequests') }}</th>
            <th class="num">{{ t('admin.metrics.colErrors') }}</th>
            <th class="num">{{ t('admin.metrics.colP95') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in endpointRows" :key="r.method + ' ' + r.route">
            <td><span :class="['mw-method', `mw-method--${r.method.toLowerCase()}`]">{{ r.method }}</span></td>
            <td class="mw-route">{{ r.route }}</td>
            <td class="num">{{ r.total.toLocaleString() }}</td>
            <td class="num" :class="{ 'mw-err': r.errors > 0 }">{{ r.errors.toLocaleString() }}</td>
            <td class="num" :class="{ 'mw-slow': r.p95 > 500 }">{{ r.p95 }}ms</td>
          </tr>
          <tr v-if="endpointRows.length === 0">
            <td colspan="5" class="mw-empty">{{ t('admin.metrics.noData') }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Auth + notifications + search summary -->
      <div class="mw-bottom">
        <div class="mw-mini">
          <span class="mw-label">{{ t('admin.metrics.refreshTokenIssued') }}</span>
          <span class="mw-value">
            {{ metrics.auth.refreshTokensIssued.reduce((s, r) => s + r.value, 0) }}
          </span>
        </div>
        <div class="mw-mini" :class="{ 'mw-card--bad': metrics.auth.refreshTokensReplayed.reduce((s, r) => s + r.value, 0) > 0 }">
          <span class="mw-label">{{ t('admin.metrics.replayDetected') }}</span>
          <span class="mw-value">
            {{ metrics.auth.refreshTokensReplayed.reduce((s, r) => s + r.value, 0) }}
          </span>
        </div>
        <div class="mw-mini">
          <span class="mw-label">{{ t('admin.metrics.emailNotification') }}</span>
          <span class="mw-value">
            {{ metrics.notifications.sent.reduce((s, r) => s + r.value, 0) }}
          </span>
        </div>
        <div class="mw-mini">
          <span class="mw-label">{{ t('admin.metrics.searchFulltext') }}</span>
          <span class="mw-value">
            {{ metrics.search.byStrategy.find(s => s.labels.strategy === 'fulltext')?.value ?? 0 }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.metrics-widget {
  padding: 1.25rem 1.5rem;
  border-radius: 16px;
  margin-bottom: 1.5rem;
}
.mw-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1rem;
}
.mw-title { font-size: 1.1rem; font-weight: 600; margin: 0; }
.mw-updated { font-size: 0.75rem; color: var(--text-muted, #888); }
.mw-spinner { display: inline-block; margin-left: 0.4rem; animation: mw-spin 1s linear infinite; }
@keyframes mw-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.mw-error { color: #c33; font-size: 0.85rem; margin: 0 0 0.75rem; }

.mw-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.mw-card {
  background: var(--surface-2, rgba(255,255,255,0.04));
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.mw-card--highlight { background: var(--accent, #4f46e5); color: #fff; }
.mw-card--highlight .mw-label { color: rgba(255,255,255,0.85); }
.mw-card--bad { background: rgba(239, 68, 68, 0.15); color: #fca5a5; }
.mw-label { font-size: 0.7rem; opacity: 0.75; text-transform: uppercase; letter-spacing: 0.04em; }
.mw-value { font-size: 1.15rem; font-weight: 600; font-variant-numeric: tabular-nums; }

.mw-section { font-size: 0.85rem; margin: 1rem 0 0.5rem; opacity: 0.85; font-weight: 500; }
.mw-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.mw-table th, .mw-table td { padding: 0.4rem 0.6rem; text-align: left; border-bottom: 1px solid rgba(0,0,0,0.06); }
.mw-table th { font-size: 0.7rem; text-transform: uppercase; opacity: 0.6; font-weight: 500; }
.mw-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.mw-method {
  display: inline-block; padding: 0.1rem 0.4rem;
  font-size: 0.7rem; font-weight: 600; border-radius: 4px;
  background: rgba(0,0,0,0.08);
}
.mw-method--get { background: #dbeafe; color: #1e40af; }
.mw-method--post { background: #dcfce7; color: #166534; }
.mw-method--put { background: #fef3c7; color: #92400e; }
.mw-method--delete { background: #fee2e2; color: #991b1b; }
.mw-route { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 0.78rem; }
.mw-err { color: #dc2626; }
.mw-slow { color: #f59e0b; font-weight: 600; }
.mw-empty { text-align: center; opacity: 0.6; padding: 1rem; }

.mw-bottom {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0,0,0,0.06);
}
.mw-mini {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}
.mw-mini .mw-value { font-size: 0.9rem; }
</style>
