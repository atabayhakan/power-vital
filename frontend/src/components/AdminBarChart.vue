<script setup lang="ts">
// AdminBarChart — horizontal bar chart for ranked lists (top customers,
// top products). Each row is a left-aligned label + a coloured bar
// whose width is proportional to the largest value in the dataset.
//
// Why a hand-rolled SVG bar (not a chart library)?
//   • Sorted, labelled horizontal bars are a 30-line SVG component.
//   • Native <text> + <rect> = accessible and crisp at any DPI.
//   • We avoid the recharts 150+ kB dep for a feature that ships in
//     every admin dashboard.
//
// The data prop expects already-sorted rows; we re-sort DESC defensively
// in case the caller passes them in arbitrary order (e.g. from the
// /top-customers endpoint which is sorted server-side but the client
// may add a "me" row at the top).
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

export interface BarDatum {
  label: string;
  sublabel?: string;
  value: number;
  /** Optional badge text (e.g. role chip). Rendered on the right of the label. */
  badge?: string;
  /** Optional override colour for the bar. */
  color?: string;
}

/**
 * Compatible with the backend `TopCustomer` schema returned by
 * GET /api/v1/admin/analytics/top-customers:
 *   { userId, name, email, totalSpentKgs, orderCount, rank }
 * Map `name` → `label`, `totalSpentKgs` → `value`, `role` → `badge`.
 */
export type TopCustomerRow = {
  userId: string;
  name: string;
  email: string;
  totalSpentKgs: number;
  orderCount: number;
  rank: number;
};

/**
 * Compatible with the backend `TopProduct` schema returned by
 * GET /api/v1/admin/analytics/top-products:
 *   { productId, name, unitsSold, revenueKgs, sharePct, rank }
 * Map `name` → `label`, `revenueKgs` (or `unitsSold`) → `value`.
 */
export type TopProductRow = {
  productId: string;
  name: string;
  unitsSold: number;
  revenueKgs: number;
  sharePct: number;
  rank: number;
};

const props = withDefaults(defineProps<{
  data: BarDatum[];
  title: string;
  subtitle?: string;
  unit?: string;
  /** Cap the rendered bar to N rows. Default 10. */
  maxRows?: number;
}>(), { unit: '', maxRows: 10 });

// Default bar colour — red matches the dashboard accent.
const DEFAULT_BAR = '#b91c1c';

const sorted = computed(() =>
  [...props.data]
    .sort((a, b) => b.value - a.value)
    .slice(0, props.maxRows)
);

const maxValue = computed(() =>
  sorted.value.reduce((m, d) => Math.max(m, d.value), 0) || 1
);

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('ru-RU');
};

// Per-row percentage (relative to the largest value).
const barWidthPct = (v: number) => Math.max(0, Math.min(100, (v / maxValue.value) * 100));
</script>

<template>
  <div class="abc-card clay-surface">
    <header class="abc-head">
      <div>
        <h3 class="abc-title">{{ title }}</h3>
        <p v-if="subtitle" class="abc-sub">{{ subtitle }}</p>
      </div>
    </header>

    <div v-if="sorted.length === 0" class="abc-empty">📭 {{ t('admin.chart.noData') }}</div>

    <ol v-else class="abc-rows">
      <li v-for="(row, i) in sorted" :key="i" class="abc-row">
        <span class="abc-rank">{{ i + 1 }}</span>
        <div class="abc-labels">
          <div class="abc-row__head">
            <span class="abc-row__label">{{ row.label }}</span>
            <span v-if="row.badge" class="abc-row__badge">{{ row.badge }}</span>
          </div>
          <div v-if="row.sublabel" class="abc-row__sublabel">{{ row.sublabel }}</div>
        </div>
        <div class="abc-bar-track">
          <div
            class="abc-bar-fill"
            :style="{
              width: barWidthPct(row.value) + '%',
              background: row.color ?? DEFAULT_BAR
            }"
          />
        </div>
        <span class="abc-row__value">{{ fmt(row.value) }}{{ unit ? ' ' + unit : '' }}</span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.abc-card {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;
  padding: 1rem 1.25rem;
  height: 100%; display: flex; flex-direction: column;
}
.abc-head { margin-bottom: 0.75rem; }
.abc-title { font-size: 1.05rem; font-weight: 700; margin: 0; color: #1a1a1a; }
.abc-sub { font-size: 0.78rem; color: #6b7280; margin: 0.2rem 0 0; }
.abc-empty {
  text-align: center; padding: 2.5rem 1rem; color: #6b7280; font-size: 0.9rem;
}

.abc-rows {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 0.55rem;
}
.abc-row {
  display: grid;
  grid-template-columns: 22px minmax(120px, 1fr) minmax(80px, 1.2fr) auto;
  gap: 0.6rem; align-items: center;
}
.abc-rank {
  font-family: ui-monospace, monospace; font-size: 0.85rem; font-weight: 700;
  color: #6b7280; text-align: right;
}
.abc-labels { min-width: 0; }
.abc-row__head {
  display: flex; gap: 0.4rem; align-items: center;
  overflow: hidden;
}
.abc-row__label {
  font-weight: 600; color: #1a1a1a;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.abc-row__badge {
  font-size: 0.65rem; font-weight: 700;
  padding: 0.05rem 0.4rem; border-radius: 999px;
  background: #fee2e2; color: #991b1b;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.abc-row__sublabel {
  font-size: 0.72rem; color: #6b7280;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-family: ui-monospace, monospace;
}
.abc-bar-track {
  height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden;
  position: relative;
}
.abc-bar-fill {
  height: 100%; border-radius: 4px;
  transition: width 0.3s ease-out;
}
.abc-row__value {
  font-family: ui-monospace, monospace; font-weight: 700; font-size: 0.85rem;
  color: #1a1a1a; text-align: right;
}

@media (max-width: 640px) {
  .abc-row {
    grid-template-columns: 18px 1fr auto;
  }
  .abc-bar-track { display: none; }
}
</style>
