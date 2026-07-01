<script setup lang="ts">
// AdminChartWidget — KPI trends (revenue + orders + new users) over a
// configurable lookback window (default 30 days).
//
// We render with hand-rolled SVG rather than recharts because:
//   • recharts pulls ~150 kB of code that we don't really need for a
//     simple 3-series line chart.
//   • Hand-rolled SVG is straightforward, accessible (real <text>
//     nodes for screen readers), and zero-dep.
//   • It scales crisply at any DPI without us thinking about it.
//
// The chart re-fetches when the user toggles the time window or when
// SSE pushes a "new_order" / "payment_received" event (we wait 1s so
// the backend has finished writing the row before we re-query).
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiGet } from '@/api/openapi-client';
import { useAdminRealtime } from '../composables/useAdminRealtime';

const { t } = useI18n();

type TrendsDailyBucket = {
  date: string;
  revenue: number;
  orders: number;
  completedOrders: number;
  newUsers: number;
};

type TrendsResponse = {
  range: { from: string; to: string; days: number };
  daily: TrendsDailyBucket[];
  totals: { revenue: number; orders: number; newUsers: number; completedOrders: number };
};

const props = withDefaults(defineProps<{
  initialDays?: number;
}>(), { initialDays: 30 });

const days = ref(props.initialDays);
const data = ref<TrendsDailyBucket[]>([]);
const totals = ref<TrendsResponse['totals']>({ revenue: 0, orders: 0, newUsers: 0, completedOrders: 0 });
const loading = ref(false);
const error = ref<string | null>(null);

const fetchTrends = async () => {
  loading.value = true;
  error.value = null;
  try {
    const { data: payload } = await apiGet('/api/v1/admin/trends', {
      query: { days: days.value }
    });
    data.value = (payload as unknown as TrendsResponse).daily || [];
    totals.value = (payload as unknown as TrendsResponse).totals || totals.value;
  } catch (e: any) {
    error.value = e.response?.data?.error || e.message || 'Yüklenemedi';
  } finally {
    loading.value = false;
  }
};

// ── Re-fetch on day-window change ─────────────────────────────────────
watch(days, () => fetchTrends());

// ── SSE-driven soft refresh ───────────────────────────────────────────
// When a new order or payment lands, the totals will be stale by one
// row. We re-fetch (debounced) so the chart updates without the admin
// clicking anything. The 1s delay lets the DB write settle before we
// query.
const realtime = useAdminRealtime();
let refreshTimer: any = null;
const debouncedRefresh = () => {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => fetchTrends(), 1000);
};
const offs: (() => void)[] = [];
onMounted(() => {
  fetchTrends();
  offs.push(realtime.onMany(['new_order', 'payment_received'], debouncedRefresh));
});
onUnmounted(() => {
  offs.forEach((o) => o());
  if (refreshTimer) clearTimeout(refreshTimer);
});

// ── Chart math ───────────────────────────────────────────────────────
// We always render the most recent N days, even if the response
// contains fewer (e.g. brand-new install).
const VISIBLE_DAYS = computed(() => Math.min(days.value, 90));

const chartData = computed(() => {
  const slice = data.value.slice(-VISIBLE_DAYS.value);
  return slice;
});

// Y-axis scale: pick the max value across all 3 series + 10% headroom.
const yMax = computed(() => {
  const values = chartData.value.flatMap((d) => [d.revenue, d.orders, d.newUsers]);
  const max = values.length ? Math.max(...values) : 1;
  return max * 1.1;
});

const fmtRevenue = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M KGS`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K KGS`;
  return `${Math.round(n)} KGS`;
};
const fmtCount = (n: number) => n.toLocaleString('ru-RU');

// ── SVG geometry ─────────────────────────────────────────────────────
// 800 × 320 viewBox — the container scales to width 100%.
const W = 800;
const H = 320;
const PAD = { top: 30, right: 20, bottom: 50, left: 60 };

const innerW = W - PAD.left - PAD.right;
const innerH = H - PAD.top - PAD.bottom;

const xFor = (i: number, total: number) => {
  if (total <= 1) return PAD.left;
  return PAD.left + (i / (total - 1)) * innerW;
};
const yFor = (v: number) => {
  if (yMax.value === 0) return PAD.top + innerH;
  return PAD.top + innerH - (v / yMax.value) * innerH;
};

const revenuePath = computed(() => {
  const pts = chartData.value.map((d, i) => `${xFor(i, chartData.value.length)},${yFor(d.revenue)}`);
  return `M ${pts.join(' L ')}`;
});

const ordersPath = computed(() => {
  const pts = chartData.value.map((d, i) => `${xFor(i, chartData.value.length)},${yFor(d.orders)}`);
  return `M ${pts.join(' L ')}`;
});

const usersPath = computed(() => {
  const pts = chartData.value.map((d, i) => `${xFor(i, chartData.value.length)},${yFor(d.newUsers)}`);
  return `M ${pts.join(' L ')}`;
});

// Area fill for revenue (subtle gradient under the line).
const revenueArea = computed(() => {
  if (chartData.value.length === 0) return '';
  const top = chartData.value.map((d, i) => `${xFor(i, chartData.value.length)},${yFor(d.revenue)}`).join(' L ');
  const baseline = ` L ${xFor(chartData.value.length - 1, chartData.value.length)},${PAD.top + innerH}`;
  const start = ` M ${xFor(0, chartData.value.length)},${PAD.top + innerH}`;
  return `${start} L ${top}${baseline} Z`;
});

// X-axis labels: show every ~7 days so they don't crowd.
const xLabels = computed(() => {
  const step = Math.max(1, Math.floor(chartData.value.length / 7));
  return chartData.value
    .map((d, i) => ({ i, date: d.date, visible: i % step === 0 || i === chartData.value.length - 1 }))
    .filter((l) => l.visible);
});

// Y-axis ticks: 4 evenly-spaced values from 0 to yMax.
const yTicks = computed(() => {
  const step = yMax.value / 4;
  return [0, step, step * 2, step * 3, yMax.value];
});

const daysLabel = computed(() => t('admin.chart.lastDays', { n: days.value }));
</script>

<template>
  <div class="ac-card clay-surface">
    <header class="ac-head">
      <h3 class="ac-title">📈 {{ t('admin.chart.title') }}</h3>
      <div class="ac-controls">
        <button
          v-for="opt in [7, 14, 30, 90]"
          :key="opt"
          class="ac-tab"
          :class="{ 'ac-tab--active': days === opt }"
          @click="days = opt"
          :disabled="loading"
        >{{ opt }}g</button>
        <button class="ac-refresh" @click="fetchTrends" :disabled="loading" :aria-label="t('common.refresh')">↻</button>
      </div>
    </header>

    <!-- KPI summary row -->
    <div class="ac-kpis">
      <div class="ac-kpi">
        <span class="ac-kpi__label">{{ t('admin.chart.kpiRevenue') }}</span>
        <span class="ac-kpi__value ac-kpi__value--revenue">{{ fmtRevenue(totals.revenue) }}</span>
        <span class="ac-kpi__sub">{{ daysLabel }}</span>
      </div>
      <div class="ac-kpi">
        <span class="ac-kpi__label">{{ t('admin.chart.kpiOrders') }}</span>
        <span class="ac-kpi__value ac-kpi__value--orders">{{ fmtCount(totals.orders) }}</span>
        <span class="ac-kpi__sub">{{ t('admin.chart.kpiCompleted', { n: totals.completedOrders }) }}</span>
      </div>
      <div class="ac-kpi">
        <span class="ac-kpi__label">{{ t('admin.chart.kpiNewUsers') }}</span>
        <span class="ac-kpi__value ac-kpi__value--users">{{ fmtCount(totals.newUsers) }}</span>
        <span class="ac-kpi__sub">{{ daysLabel }}</span>
      </div>
    </div>

    <!-- Loading / error / chart -->
    <div v-if="loading && data.length === 0" class="ac-state">⏳ {{ t('common.loading') }}</div>
    <div v-else-if="error" class="ac-state ac-state--err">❌ {{ error }}</div>
    <div v-else-if="data.length === 0" class="ac-state">📭 {{ t('admin.chart.noData') }}</div>
    <div v-else class="ac-chart-wrap">
      <svg
        class="ac-chart"
        :viewBox="`0 0 ${W} ${H}`"
        preserveAspectRatio="none"
        role="img"
        :aria-label="t('admin.chart.title')"
      >
        <defs>
          <linearGradient id="ac-revenue-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#b91c1c" stop-opacity="0.7" />
            <stop offset="100%" stop-color="#b91c1c" stop-opacity="0.05" />
          </linearGradient>
        </defs>

        <!-- Background grid -->
        <g class="ac-grid">
          <line
            v-for="(v, i) in yTicks"
            :key="`h-${i}`"
            :x1="PAD.left"
            :x2="W - PAD.right"
            :y1="yFor(v)"
            :y2="yFor(v)"
          />
        </g>

        <!-- Y-axis labels -->
        <g class="ac-yaxis">
          <text
            v-for="(v, i) in yTicks"
            :key="`yt-${i}`"
            :x="PAD.left - 8"
            :y="yFor(v) + 4"
            text-anchor="end"
          >{{ v >= 1000 ? Math.round(v / 100) / 10 + 'K' : Math.round(v) }}</text>
        </g>

        <!-- X-axis labels -->
        <g class="ac-xaxis">
          <text
            v-for="l in xLabels"
            :key="`xt-${l.i}`"
            :x="xFor(l.i, chartData.length)"
            :y="H - PAD.bottom + 18"
            text-anchor="middle"
          >{{ l.date.slice(5) }}</text>
        </g>

        <!-- Revenue area fill -->
        <path :d="revenueArea" class="ac-area-revenue" />

        <!-- Series lines -->
        <path :d="revenuePath" class="ac-line ac-line--revenue" />
        <path :d="ordersPath" class="ac-line ac-line--orders" stroke-dasharray="4 3" />
        <path :d="usersPath" class="ac-line ac-line--users" stroke-dasharray="2 4" />

        <!-- Data points (revenue only — full dots would crowd the chart) -->
        <g class="ac-points">
          <circle
            v-for="(d, i) in chartData"
            :key="`p-${i}`"
            :cx="xFor(i, chartData.length)"
            :cy="yFor(d.revenue)"
            r="2.5"
            class="ac-point"
          >
            <title>{{ d.date }} · {{ fmtRevenue(d.revenue) }} · {{ d.orders }} sipariş</title>
          </circle>
        </g>
      </svg>

      <div class="ac-legend">
        <span class="ac-legend__item">
          <span class="ac-legend__swatch ac-legend__swatch--revenue"/>
          {{ t('admin.chart.legendRevenue') }}
        </span>
        <span class="ac-legend__item">
          <span class="ac-legend__swatch ac-legend__swatch--orders"/>
          {{ t('admin.chart.legendOrders') }}
        </span>
        <span class="ac-legend__item">
          <span class="ac-legend__swatch ac-legend__swatch--users"/>
          {{ t('admin.chart.legendUsers') }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ac-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem 1.25rem;
}
.ac-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 0.75rem;
}
.ac-title { font-size: 1.05rem; font-weight: 700; margin: 0; color: #1a1a1a; }
.ac-controls { display: flex; gap: 0.4rem; align-items: center; }
.ac-tab {
  background: #fafaf7; border: 1px solid #e5e7eb;
  padding: 0.3rem 0.65rem; border-radius: 6px;
  font-size: 0.78rem; font-weight: 600; cursor: pointer;
  color: #4b5563;
}
.ac-tab:hover { background: #f3f4f6; }
.ac-tab--active {
  background: #b91c1c; color: #fff; border-color: #b91c1c;
}
.ac-tab:disabled { opacity: 0.6; cursor: not-allowed; }
.ac-refresh {
  background: none; border: 0; font-size: 1.1rem;
  cursor: pointer; padding: 0.2rem 0.4rem; color: #6b7280;
}
.ac-refresh:hover { color: #1a1a1a; }
.ac-refresh:disabled { opacity: 0.5; }

.ac-kpis {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;
  margin-bottom: 1rem;
}
.ac-kpi {
  padding: 0.65rem 0.85rem;
  background: #fafaf7; border-radius: 8px;
  border: 1px solid #f3f4f6;
}
.ac-kpi__label {
  font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: #6b7280;
}
.ac-kpi__value {
  display: block; font-size: 1.4rem; font-weight: 800; color: #1a1a1a;
  margin-top: 0.2rem; line-height: 1.1;
}
.ac-kpi__value--revenue { color: #b91c1c; }
.ac-kpi__value--orders  { color: #1d4ed8; }
.ac-kpi__value--users   { color: #047857; }
.ac-kpi__sub {
  display: block; font-size: 0.7rem; color: #6b7280; margin-top: 0.15rem;
}

.ac-state {
  text-align: center; padding: 2.5rem 1rem; color: #6b7280; font-size: 0.9rem;
}
.ac-state--err { color: #b91c1c; }

.ac-chart-wrap {
  margin-top: 0.5rem;
}
.ac-chart {
  width: 100%; height: auto; max-height: 360px;
  font-family: ui-monospace, monospace;
}
.ac-grid line { stroke: #f3f4f6; stroke-width: 1; }
.ac-yaxis text, .ac-xaxis text {
  font-size: 11px; fill: #6b7280;
}
.ac-line {
  fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round;
}
.ac-line--revenue { stroke: #b91c1c; }
.ac-line--orders  { stroke: #1d4ed8; }
.ac-line--users   { stroke: #047857; }
.ac-area-revenue { fill: url(#ac-revenue-gradient); opacity: 0.18; }
.ac-points circle { fill: #b91c1c; }

.ac-legend {
  display: flex; gap: 1rem; justify-content: center; margin-top: 0.5rem;
  font-size: 0.78rem; color: #4b5563;
}
.ac-legend__item { display: flex; align-items: center; gap: 0.35rem; }
.ac-legend__swatch {
  display: inline-block; width: 14px; height: 3px; border-radius: 2px;
}
.ac-legend__swatch--revenue { background: #b91c1c; }
.ac-legend__swatch--orders  { background: #1d4ed8; }
.ac-legend__swatch--users   { background: #047857; }

@media (max-width: 640px) {
  .ac-kpis { grid-template-columns: 1fr; }
  .ac-head { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
}
</style>
