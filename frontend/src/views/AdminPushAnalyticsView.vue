<script setup lang="ts">
// AdminPushAnalyticsView — operator dashboard for Web Push performance.
//
// Four panels:
//   1. Top stats: total broadcasts, active subscribers, sent / expired / failed
//   2. By event key — table with sent/expired/failed per event
//   3. Last 14 days trend — ASCII bar chart (no chart library)
//   4. Top senders — most active admins (last 30 days)
//
// Backend: GET /api/v1/push/analytics
import { ref, computed, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { usePolling } from '../composables/usePolling';
import { useTranslate } from '../composables/useTranslate';

const { t } = useTranslate();

interface ByEventKey {
  eventKey: string;
  broadcastCount: number;
  sent: number;
  expired: number;
  failed: number;
}

interface ByDay {
  date: string;
  sent: number;
  expired: number;
  failed: number;
  broadcasts: number;
}

interface TopActor {
  actorId: string | null;
  actor: { id: string; name: string; email: string; role: string } | null;
  broadcastCount: number;
  sent: number;
  failed: number;
}

interface AnalyticsResponse {
  generatedAt: string;
  totalBroadcasts: number;
  activeSubscribers: number;
  byEventKey: ByEventKey[];
  byDay: ByDay[];
  topActors: TopActor[];
}

const data = ref<AnalyticsResponse | null>(null);
const errorMsg = ref('');

const fetchData = async () => {
  try {
    const res = await axios.get('/api/v1/push/analytics');
    data.value = res.data;
    errorMsg.value = '';
  } catch (e: any) {
    errorMsg.value = e.response?.data?.error || 'Analitik yüklenemedi';
  }
};

// Auto-refresh every 30s, pause when tab is hidden.
const {
  isPolling,
  lastUpdated,
  pollCount,
  isPaused,
  refresh
} = usePolling(fetchData, {
  interval: 30000,
  immediate: true,
  pauseOnHidden: true,
  retryOnError: true,
  retryDelay: 10000
});

const isLoading = isPolling;

const fmtTime = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
};

// Aggregate stats
const totals = computed(() => {
  const d = data.value;
  if (!d) return { sent: 0, expired: 0, failed: 0, deliveries: 0 };
  return {
    sent: d.byEventKey.reduce((s, x) => s + x.sent, 0),
    expired: d.byEventKey.reduce((s, x) => s + x.expired, 0),
    failed: d.byEventKey.reduce((s, x) => s + x.failed, 0),
    deliveries: d.byEventKey.reduce((s, x) => s + x.sent + x.expired + x.failed, 0)
  };
});

const deliveryRate = computed(() => {
  const t = totals.value;
  if (t.deliveries === 0) return 0;
  return (t.sent / t.deliveries) * 100;
});

const errorRate = computed(() => {
  const t = totals.value;
  if (t.deliveries === 0) return 0;
  return ((t.failed + t.expired) / t.deliveries) * 100;
});

// ── Drill-down ────────────────────────────────────────────────────────
// Click an event row → fetch hourly breakdown + top failure reasons.
interface EventDetail {
  generatedAt: string;
  eventKey: string;
  hours: number;
  totals: { sent: number; expired: number; failed: number; count: number };
  hourly: Array<{ hour: string; sent: number; expired: number; failed: number; count: number }>;
  topReasons: Array<{ reason: string; count: number }>;
  recent: Array<{
    id: string; sent: number; expired: number; failed: number;
    createdAt: string; targetId: string;
    target: { id: string; name: string; email: string }
  }>;
}

const drillDown = ref<EventDetail | null>(null);
const isLoadingDrillDown = ref(false);
const drillDownEventKey = ref<string>('');
const drillDownHours = ref<number>(24);

const openDrillDown = async (eventKey: string) => {
  drillDownEventKey.value = eventKey;
  drillDown.value = null;
  isLoadingDrillDown.value = true;
  try {
    const res = await axios.get('/api/v1/push/analytics/event-detail', {
      params: { eventKey, hours: drillDownHours.value }
    });
    drillDown.value = res.data;
  } catch (e: any) {
    errorMsg.value = e.response?.data?.error || 'Drill-down yüklenemedi';
  } finally {
    isLoadingDrillDown.value = false;
  }
};

const closeDrillDown = () => {
  drillDown.value = null;
  drillDownEventKey.value = '';
};

const onDrillDownKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && drillDownEventKey.value) closeDrillDown();
};
onMounted(() => window.addEventListener('keydown', onDrillDownKeydown));
onUnmounted(() => window.removeEventListener('keydown', onDrillDownKeydown));

const changeDrillDownHours = async (h: number) => {
  drillDownHours.value = h;
  await openDrillDown(drillDownEventKey.value);
};

const maxHourlySent = computed(() => {
  if (!drillDown.value) return 0;
  return Math.max(1, ...drillDown.value.hourly.map(h => h.sent));
});

const hourLabel = (iso: string): string => {
  const d = new Date(iso + ':00:00Z');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('tr-TR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const drillDownRate = computed(() => {
  if (!drillDown.value) return 0;
  const t = drillDown.value.totals;
  const del = t.sent + t.expired + t.failed;
  if (del === 0) return 0;
  return (t.sent / del) * 100;
});

// ASCII bar chart for 14-day trend
const maxDaySent = computed(() => {
  return Math.max(1, ...(data.value?.byDay.map(d => d.sent) || [0]));
});

const barChar = (n: number, max: number, width = 32): string => {
  if (max === 0) return '·'.repeat(width);
  const filled = Math.round((n / max) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
};

const eventIcon = (key: string): string => {
  const map: Record<string, string> = {
    order_paid: '💳', order_shipped: '📦', order_completed: '✅',
    order_cancelled: '❌', order_refunded: '↩️',
    withdrawal_approved: '✅', withdrawal_rejected: '⚠️',
    promo: '🎁', custom: '📣', test: '🧪'
  };
  return map[key] || '📣';
};

const dayLabel = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' });
};

onMounted(fetchData);
</script>

<template>
  <div class="pa-view">
    <header class="pa-head">
      <div>
        <h1 class="pa-title">📊 Push Analitik</h1>
        <p class="pa-sub">{{ t('admin.pushAnalytics.subtitle') }}</p>
      </div>
      <div class="pa-meta">
        <router-link to="/admin-broadcast" class="pa-link">
          📣 {{ t('admin.pushAnalytics.backToBroadcast') }} →
        </router-link>
        <button class="pa-refresh" :disabled="isLoading" @click="refresh">
          {{ isLoading ? '⏳' : '🔄' }} Yenile
        </button>
        <span v-if="lastUpdated" class="pa-gen">
          Son: {{ fmtTime(lastUpdated.toISOString()) }}
          <span v-if="isPaused" class="pa-paused">{{ t('admin.pushAnalytics.paused') }}</span>
        </span>
        <span v-if="pollCount > 0" class="pa-poll-count">
          #{{ pollCount }}
        </span>
      </div>
    </header>

    <p v-if="errorMsg" class="pa-error">⚠️ {{ errorMsg }}</p>

    <!-- Top KPI cards -->
    <section v-if="data" class="pa-kpis">
      <div class="pa-kpi">
        <span class="pa-kpi-num">{{ data.totalBroadcasts }}</span>
        <span class="pa-kpi-label">Toplam Broadcast</span>
      </div>
      <div class="pa-kpi">
        <span class="pa-kpi-num">{{ data.activeSubscribers }}</span>
        <span class="pa-kpi-label">Aktif Subscriber</span>
      </div>
      <div class="pa-kpi pa-kpi--ok">
        <span class="pa-kpi-num">{{ totals.sent }}</span>
        <span class="pa-kpi-label">✅ Teslim Edildi</span>
      </div>
      <div class="pa-kpi pa-kpi--warn">
        <span class="pa-kpi-num">{{ totals.expired }}</span>
        <span class="pa-kpi-label">🗑️ Süresi Dolmuş</span>
      </div>
      <div class="pa-kpi pa-kpi--err">
        <span class="pa-kpi-num">{{ totals.failed }}</span>
        <span class="pa-kpi-label">❌ Başarısız</span>
      </div>
      <div class="pa-kpi">
        <span class="pa-kpi-num">{{ deliveryRate.toFixed(1) }}%</span>
        <span class="pa-kpi-label">{{ t('admin.pushAnalytics.deliveryRate') }}</span>
      </div>
      <div class="pa-kpi">
        <span class="pa-kpi-num">{{ errorRate.toFixed(1) }}%</span>
        <span class="pa-kpi-label">{{ t('admin.pushAnalytics.errorRate') }}</span>
      </div>
    </section>

    <!-- 14-day trend (ASCII bar chart) -->
    <section v-if="data && data.byDay.length" class="pa-card">
      <h3 class="pa-h">{{ t('admin.pushAnalytics.chartTitle') }}</h3>
      <div class="pa-chart">
        <div v-for="d in data.byDay" :key="d.date" class="pa-chart-row">
          <span class="pa-chart-label">{{ dayLabel(d.date) }}</span>
          <span class="pa-chart-bar" :title="`${d.sent} push`">{{ barChar(d.sent, maxDaySent) }}</span>
          <span class="pa-chart-num">{{ d.sent }}</span>
          <span v-if="d.failed > 0" class="pa-chart-warn">(+{{ d.failed }} ✗)</span>
        </div>
      </div>
      <p class="pa-chart-note">
        {{ t('admin.pushAnalytics.chartLegend') }}
      </p>
    </section>

    <!-- By event key -->
    <section v-if="data && data.byEventKey.length" class="pa-card">
      <h3 class="pa-h">{{ t('admin.pushAnalytics.byEvent') }}</h3>
      <table class="pa-tbl">
        <thead>
          <tr>
            <th>Event</th>
            <th>Broadcasts</th>
            <th>Teslim</th>
            <th>Süresi Dolmuş</th>
            <th>Başarısız</th>
            <th>Başarı %</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data.byEventKey" :key="row.eventKey" class="pa-row-clickable" @click="openDrillDown(row.eventKey)">
            <td>
              <span class="pa-event-pill">{{ eventIcon(row.eventKey) }} {{ row.eventKey }}</span>
            </td>
            <td>{{ row.broadcastCount }}</td>
            <td class="pa-cell-ok">{{ row.sent }}</td>
            <td class="pa-cell-warn">{{ row.expired }}</td>
            <td class="pa-cell-err">{{ row.failed }}</td>
            <td>
              <span class="pa-rate" :class="rateClass(row.sent, row.sent + row.expired + row.failed)">
                {{ rowRate(row.sent, row.sent + row.expired + row.failed) }}%
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Top senders -->
    <section v-if="data && data.topActors.length" class="pa-card">
      <h3 class="pa-h">{{ t('admin.pushAnalytics.topAdmins') }}</h3>
      <ol class="pa-actors">
          <li v-for="(a, i) in data.topActors" :key="a?.actorId ?? i" class="pa-actor">
          <span class="pa-actor-rank">{{ i + 1 }}</span>
          <div class="pa-actor-info">
            <div class="pa-actor-name">
              {{ a.actor?.name || '(silinmiş admin)' }}
            </div>
            <div class="pa-actor-email">{{ a.actor?.email || '—' }}</div>
          </div>
          <div class="pa-actor-stats">
            <span class="pa-actor-bc">{{ a.broadcastCount }} broadcast</span>
            <span class="pa-actor-sent">{{ a.sent }} ✓</span>
            <span v-if="a.failed > 0" class="pa-actor-failed">{{ a.failed }} ✗</span>
          </div>
        </li>
      </ol>
    </section>

    <section v-if="data && !data.byEventKey.length" class="pa-empty">
      <p>{{ t('admin.pushAnalytics.empty') }}</p>
      <p class="pa-empty-hint">{{ t('admin.pushAnalytics.emptyHint') }}</p>
    </section>

    <!-- Auto-refresh footer -->
    <footer class="pa-footer">
      <span>🔄 30 saniyede bir otomatik yenilenir (tab gizliyken duraklar)</span>
    </footer>

    <!-- Drill-down modal -->
    <Teleport v-if="drillDownEventKey" to="body">
      <div class="pa-modal-backdrop" @click.self="closeDrillDown">
        <div class="pa-modal">
          <header class="pa-modal-head">
            <h3>
              <span class="pa-event-pill">{{ eventIcon(drillDownEventKey) }} {{ drillDownEventKey }}</span>
              Drill-down
            </h3>
            <button class="pa-modal-close" @click="closeDrillDown">✕</button>
          </header>

          <div class="pa-modal-filters">
            <span>{{ t('admin.pushAnalytics.timeRange') }}</span>
            <button :class="{ 'pa-chip-active': drillDownHours === 6 }"  @click="changeDrillDownHours(6)">6s</button>
            <button :class="{ 'pa-chip-active': drillDownHours === 24 }" @click="changeDrillDownHours(24)">24s</button>
            <button :class="{ 'pa-chip-active': drillDownHours === 72 }" @click="changeDrillDownHours(72)">3g</button>
            <button :class="{ 'pa-chip-active': drillDownHours === 168 }" @click="changeDrillDownHours(168)">7g</button>
          </div>

          <div v-if="isLoadingDrillDown" class="pa-modal-loading">{{ t('admin.pushAnalytics.loading') }}</div>

          <div v-else-if="drillDown" class="pa-modal-body">
            <!-- Sub-KPIs -->
            <div class="pa-subkpis">
              <div class="pa-subkpi">
                <span class="pa-subkpi-num">{{ drillDown.totals.sent }}</span>
                <span class="pa-subkpi-label">✅ Teslim</span>
              </div>
              <div class="pa-subkpi">
                <span class="pa-subkpi-num">{{ drillDown.totals.expired }}</span>
                <span class="pa-subkpi-label">🗑️ Süresi Dolmuş</span>
              </div>
              <div class="pa-subkpi">
                <span class="pa-subkpi-num">{{ drillDown.totals.failed }}</span>
                <span class="pa-subkpi-label">❌ Başarısız</span>
              </div>
              <div class="pa-subkpi">
                <span class="pa-subkpi-num">{{ drillDown.totals.count }}</span>
                <span class="pa-subkpi-label">Broadcast</span>
              </div>
              <div class="pa-subkpi">
                <span class="pa-subkpi-num">{{ drillDownRate.toFixed(1) }}%</span>
                <span class="pa-subkpi-label">Teslim Oranı</span>
              </div>
            </div>

            <!-- Hourly chart -->
            <h4>⏰ Saatlik Trend</h4>
            <div class="pa-hourly-chart">
              <div v-for="h in drillDown.hourly" :key="h.hour" class="pa-hourly-row">
                <span class="pa-hourly-label">{{ hourLabel(h.hour) }}</span>
                <span class="pa-hourly-bar" :title="`${h.sent} push`">{{ barChar(h.sent, maxHourlySent) }}</span>
                <span class="pa-hourly-num">{{ h.sent }}</span>
                <span v-if="h.failed > 0" class="pa-hourly-warn">+{{ h.failed }} ✗</span>
                <span v-if="h.expired > 0" class="pa-hourly-expired">+{{ h.expired }} ⏰</span>
              </div>
            </div>

            <!-- Top failure reasons -->
            <h4 v-if="drillDown.topReasons.length">{{ t('admin.pushAnalytics.topErrors') }}</h4>
            <table v-if="drillDown.topReasons.length" class="pa-tbl pa-tbl--small">
              <thead>
                <tr><th>Sebep</th><th>Adet</th></tr>
              </thead>
              <tbody>
                <tr v-for="r in drillDown.topReasons" :key="r.reason">
                  <td class="pa-reason-cell">{{ r.reason }}</td>
                  <td>{{ r.count }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Recent broadcasts -->
            <h4>📋 Son Broadcast'lar ({{ drillDown.recent.length }})</h4>
            <table class="pa-tbl pa-tbl--small">
              <thead>
                <tr>
                  <th>Saat</th><th>Hedef</th><th>Sonuç</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in drillDown.recent" :key="r.id">
                  <td class="pa-time">{{ fmtTime(r.createdAt) }}</td>
                  <td>
                    <div class="pa-person-name">{{ r.target?.name }}</div>
                    <div class="pa-person-email">{{ r.target?.email }}</div>
                  </td>
                  <td>
                    <div class="pa-counts">
                      <span class="pa-count pa-count--ok" v-if="r.sent > 0">{{ r.sent }}✓</span>
                      <span class="pa-count pa-count--warn" v-if="r.expired > 0">{{ r.expired }}⏰</span>
                      <span class="pa-count pa-count--err" v-if="r.failed > 0">{{ r.failed }}✗</span>
                      <span class="pa-count pa-count--muted" v-if="r.sent + r.expired + r.failed === 0">—</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts">
// Helper for rate column — exported so the template can call it.
export function rowRate(sent: number, total: number): string {
  if (total === 0) return '—';
  return ((sent / total) * 100).toFixed(1);
}
export function rateClass(sent: number, total: number): string {
  if (total === 0) return '';
  const pct = (sent / total) * 100;
  if (pct >= 90) return 'pa-rate--ok';
  if (pct >= 70) return 'pa-rate--warn';
  return 'pa-rate--err';
}
</script>

<style scoped>
.pa-view {
  padding: 1.5rem; max-width: 1200px; margin: 0 auto;
  /* 🛡️ Scroll fix — admin layout (App.vue) is 100vh flex with overflow:hidden
     on .main-content. Without our own scroll container the long analytics
     page (KPIs + 14-day chart + by-event table) gets clipped. */
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  box-sizing: border-box;
}
.pa-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;
}
.pa-title { font-size: 1.5rem; font-weight: 600; margin: 0 0 0.25rem; }
.pa-sub { font-size: 0.85rem; opacity: 0.7; margin: 0; max-width: 700px; }
.pa-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; }
.pa-refresh {
  padding: 0.5rem 0.9rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.15);
  background: transparent; cursor: pointer; font-size: 0.85rem; font-weight: 500;
  color: inherit;
}
.pa-link {
  font-size: 0.85rem; font-weight: 600; color: #3b82f6; text-decoration: none;
  white-space: nowrap; align-self: center;
}
.pa-link:hover { text-decoration: underline; }
.pa-refresh:hover:not(:disabled) { background: rgba(0,0,0,0.04); }
.pa-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
.pa-gen { font-size: 0.7rem; opacity: 0.55; display: flex; flex-direction: column; align-items: flex-end; gap: 0.2rem; }
.pa-paused {
  font-size: 0.65rem; color: #F59E0B; font-weight: 600;
  display: inline-block; margin-top: 0.1rem;
}
.pa-poll-count {
  font-size: 0.65rem; opacity: 0.45;
  font-family: ui-monospace, monospace;
}
.pa-error {
  padding: 0.75rem 1rem; border-radius: 10px; margin-bottom: 1rem;
  background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3);
  font-size: 0.9rem;
}

/* KPI cards */
.pa-kpis {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.6rem; margin-bottom: 1rem;
}
.pa-kpi {
  background: rgba(0,0,0,0.04); border-radius: 10px; padding: 0.7rem 0.9rem;
  display: flex; flex-direction: column; gap: 0.2rem;
  border-left: 3px solid rgba(0,0,0,0.15);
}
.pa-kpi--ok   { border-left-color: #10B981; }
.pa-kpi--warn { border-left-color: #F59E0B; }
.pa-kpi--err  { border-left-color: #EF4444; }
.pa-kpi-num { font-size: 1.4rem; font-weight: 700; }
.pa-kpi-label { font-size: 0.7rem; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.5px; }

/* Card */
.pa-card {
  background: var(--surface-1, rgba(255,255,255,0.02));
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 14px; padding: 1.25rem; margin-bottom: 1rem;
}
.pa-h { font-size: 1rem; font-weight: 600; margin: 0 0 0.85rem; }

/* ASCII chart */
.pa-chart {
  display: flex; flex-direction: column; gap: 0.3rem;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.78rem;
}
.pa-chart-row {
  display: grid;
  grid-template-columns: 80px 1fr 60px auto;
  gap: 0.5rem; align-items: center;
}
.pa-chart-label { opacity: 0.7; font-size: 0.72rem; }
.pa-chart-bar { letter-spacing: -1px; opacity: 0.85; white-space: nowrap; }
.pa-chart-num { font-weight: 700; text-align: right; }
.pa-chart-warn { color: #EF4444; font-size: 0.7rem; opacity: 0.85; }
.pa-chart-note { font-size: 0.7rem; opacity: 0.5; margin: 0.85rem 0 0; font-style: italic; }

/* Table */
.pa-tbl { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.pa-tbl th {
  text-align: left; padding: 0.5rem 0.7rem; font-size: 0.7rem;
  text-transform: uppercase; opacity: 0.6;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}
.pa-tbl td { padding: 0.5rem 0.7rem; border-bottom: 1px solid rgba(0,0,0,0.04); }
.pa-tbl tr:hover td { background: rgba(0,0,0,0.02); }
.pa-event-pill {
  display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px;
  background: rgba(0,0,0,0.08); font-size: 0.78rem; font-weight: 500;
}
.pa-cell-ok   { color: #10B981; font-weight: 600; }
.pa-cell-warn { color: #F59E0B; font-weight: 600; }
.pa-cell-err  { color: #EF4444; font-weight: 600; }
.pa-rate {
  display: inline-block; padding: 0.1rem 0.45rem; border-radius: 4px;
  font-size: 0.78rem; font-weight: 600;
  background: rgba(0,0,0,0.08);
}
.pa-rate--ok   { background: rgba(16, 185, 129, 0.15); color: #10B981; }
.pa-rate--warn { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
.pa-rate--err  { background: rgba(239, 68, 68, 0.15); color: #EF4444; }

/* Top actors list */
.pa-actors {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 0.5rem;
}
.pa-actor {
  display: flex; align-items: center; gap: 0.85rem;
  padding: 0.65rem 0.85rem;
  background: rgba(0,0,0,0.03); border-radius: 10px;
}
.pa-actor-rank {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: var(--pv-red, #BC4A3C);
  color: #fff; font-weight: 700; font-size: 0.85rem;
  flex-shrink: 0;
}
.pa-actor-info { flex: 1; min-width: 0; }
.pa-actor-name { font-weight: 600; font-size: 0.88rem; }
.pa-actor-email { font-size: 0.72rem; opacity: 0.6; }
.pa-actor-stats { display: flex; gap: 0.5rem; font-size: 0.78rem; flex-shrink: 0; }
.pa-actor-bc { opacity: 0.7; }
.pa-actor-sent { color: #10B981; font-weight: 600; }
.pa-actor-failed { color: #EF4444; font-weight: 600; }

.pa-empty {
  text-align: center; padding: 4rem 1rem; opacity: 0.65;
  background: var(--surface-1, rgba(255,255,255,0.02));
  border-radius: 14px;
}
.pa-empty p { margin: 0; }
.pa-empty-hint { font-size: 0.8rem; opacity: 0.7; margin-top: 0.4rem; }

/* Clickable event row */
.pa-row-clickable { cursor: pointer; transition: background 0.15s; }
.pa-row-clickable:hover td { background: rgba(76, 175, 80, 0.06); }

/* Drill-down modal */
.pa-modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px); display: flex;
  align-items: center; justify-content: center;
  z-index: 10000;
}
.pa-modal {
  background: var(--surface-1, #fff); color: inherit;
  border-radius: 14px; width: 92%; max-width: 800px;
  max-height: 88vh; overflow: hidden; display: flex; flex-direction: column;
  box-shadow: 0 24px 70px rgba(0,0,0,0.4);
}
.pa-modal-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.25rem; border-bottom: 1px solid rgba(0,0,0,0.08);
  flex-shrink: 0;
}
.pa-modal-head h3 { margin: 0; font-size: 1.05rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
.pa-modal-close {
  background: transparent; border: 1px solid rgba(0,0,0,0.15);
  width: 32px; height: 32px; border-radius: 8px; cursor: pointer;
  font-size: 1rem; color: inherit;
}
.pa-modal-close:hover { background: rgba(239, 68, 68, 0.1); border-color: #EF4444; color: #EF4444; }

.pa-modal-filters {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  font-size: 0.85rem; flex-shrink: 0;
}
.pa-modal-filters > span { opacity: 0.6; margin-right: 0.3rem; }
.pa-modal-filters button {
  padding: 0.3rem 0.7rem; border-radius: 6px; border: 1px solid rgba(0,0,0,0.15);
  background: transparent; color: inherit; font-size: 0.8rem; cursor: pointer;
}
.pa-chip-active {
  background: var(--pv-red, #BC4A3C) !important;
  color: #fff !important; border-color: transparent !important;
}

.pa-modal-loading { padding: 4rem; text-align: center; opacity: 0.7; }

.pa-modal-body {
  padding: 1rem 1.25rem; overflow-y: auto; flex: 1;
}
.pa-modal-body h4 {
  font-size: 0.85rem; font-weight: 700; margin: 1rem 0 0.5rem;
  text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7;
}

.pa-subkpis {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 0.5rem;
}
.pa-subkpi {
  background: rgba(0,0,0,0.04); border-radius: 8px; padding: 0.6rem 0.75rem;
  display: flex; flex-direction: column; gap: 0.15rem;
}
.pa-subkpi-num { font-size: 1.2rem; font-weight: 700; }
.pa-subkpi-label { font-size: 0.68rem; opacity: 0.65; text-transform: uppercase; letter-spacing: 0.4px; }

.pa-hourly-chart {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.75rem; max-height: 260px; overflow-y: auto;
}
.pa-hourly-row {
  display: grid; grid-template-columns: 110px 1fr 50px auto auto;
  gap: 0.4rem; align-items: center; padding: 1px 0;
}
.pa-hourly-label { opacity: 0.7; font-size: 0.7rem; }
.pa-hourly-bar { letter-spacing: -1px; opacity: 0.85; white-space: nowrap; }
.pa-hourly-num { font-weight: 700; text-align: right; }
.pa-hourly-warn { color: #EF4444; font-size: 0.7rem; opacity: 0.85; }
.pa-hourly-expired { color: #F59E0B; font-size: 0.7rem; opacity: 0.85; }

.pa-tbl--small { font-size: 0.78rem; }
.pa-tbl--small th { padding: 0.35rem 0.5rem; font-size: 0.65rem; }
.pa-tbl--small td { padding: 0.4rem 0.5rem; }
.pa-reason-cell {
  font-family: ui-monospace, monospace; font-size: 0.7rem;
  max-width: 480px; word-break: break-word;
}
.pa-time { font-family: ui-monospace, monospace; white-space: nowrap; font-size: 0.72rem; }
.pa-counts { display: flex; gap: 0.25rem; }
.pa-count {
  display: inline-block; padding: 0.05rem 0.35rem; border-radius: 3px;
  font-size: 0.7rem; font-weight: 600; color: #fff;
}
.pa-count--ok    { background: #10B981; }
.pa-count--warn  { background: #F59E0B; }
.pa-count--err   { background: #EF4444; }
.pa-count--muted { background: rgba(0,0,0,0.15); color: inherit; }
.pa-person-name { font-weight: 600; font-size: 0.78rem; }
.pa-person-email { font-size: 0.7rem; opacity: 0.6; }
.pa-footer {
  text-align: center; padding: 0.75rem;
  font-size: 0.75rem; opacity: 0.55; font-style: italic;
  border-top: 1px solid rgba(0,0,0,0.06);
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .pa-chart-row { grid-template-columns: 60px 1fr 50px; gap: 0.4rem; }
  .pa-chart-warn { display: none; }
}
</style>
