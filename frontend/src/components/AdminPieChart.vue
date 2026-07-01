<script setup lang="ts">
// AdminPieChart — zero-dep SVG donut chart.
//
// Why hand-rolled SVG instead of recharts / chart.js?
//   • We render small charts with a fixed palette (≤ 8 slices).
//   • recharts pulls 150+ kB and overkill for a donut chart we render
//     once per dashboard load.
//   • SVG gives us crisp rendering at any DPI + real <text> nodes for
//     screen readers, no canvas.
//
// Colour palette is intentionally fixed (not data-driven) so a slice
// always shows up with the same colour across pages — easier to point
// at "the Supplements slice" in a screenshot.
//
// Props:
//   • data: [{ name, value, color? }] — value is a non-negative number.
//     Items with value === 0 are skipped (don't draw a zero-width arc).
//   • title / subtitle — shown in the card header.
//   • unit — symbol for the center label (default "KGS").
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

export interface PieDatum {
  name: string;
  value: number;
  /** Optional override colour. Falls back to the palette. */
  color?: string;
}

/**
 * Compatible with the backend `CategoryAnalytics` schema returned by
 * GET /api/v1/admin/analytics/categories:
 *   { categoryId, categoryName, revenue, orderCount, sharePct }
 * Map `categoryName` → `name`, `revenue` → `value` before passing.
 */
export type CategoryAnalyticsRow = {
  categoryId: string;
  categoryName: string;
  revenue: number;
  orderCount: number;
  sharePct: number;
};

const props = withDefaults(defineProps<{
  data: PieDatum[];
  title: string;
  subtitle?: string;
  unit?: string;
  centerValue?: string;
  centerLabel?: string;
}>(), { unit: 'KGS', centerValue: undefined, centerLabel: undefined });

// 8-colour palette. Tuned for a warm-light admin surface; works in
// light + dark contexts.
const PALETTE = [
  '#b91c1c', // red
  '#1d4ed8', // blue
  '#047857', // green
  '#c2410c', // orange
  '#7c3aed', // purple
  '#0891b2', // cyan
  '#db2777', // pink
  '#a16207'  // amber
];

const filtered = computed(() =>
  props.data
    .filter((d) => Number(d.value) > 0)
    .map((d, i) => ({
      ...d,
      color: d.color ?? PALETTE[i % PALETTE.length]
    }))
);

const total = computed(() => filtered.value.reduce((s, d) => s + d.value, 0));

// SVG arc math: convert (start, end) percentages into an SVG path
// arc command. We use the "large-arc" + "sweep" flags so the donut
// reads clockwise.
const SIZE = 200;
const RADIUS = 80;
const INNER_RADIUS = 50;
const CX = SIZE / 2;
const CY = SIZE / 2;

const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const arcPath = (startPct: number, endPct: number, rOuter: number, rInner: number) => {
  if (endPct - startPct >= 1) return '';
  const startAngle = startPct * 360;
  const endAngle = endPct * 360;
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const outerStart = polarToCartesian(CX, CY, rOuter, startAngle);
  const outerEnd = polarToCartesian(CX, CY, rOuter, endAngle);
  const innerEnd = polarToCartesian(CX, CY, rInner, endAngle);
  const innerStart = polarToCartesian(CX, CY, rInner, startAngle);
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z'
  ].join(' ');
};

const slices = computed(() => {
  if (total.value === 0) return [];
  let cursor = 0;
  return filtered.value.map((d) => {
    const fraction = d.value / total.value;
    const start = cursor;
    const end = cursor + fraction;
    cursor = end;
    return {
      ...d,
      path: arcPath(start, end, RADIUS, INNER_RADIUS),
      fraction
    };
  });
});

const fmtValue = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toLocaleString('ru-RU');
};

const centerLabelText = computed(() => props.centerLabel ?? t('admin.pie.total'));
const centerValueText = computed(() => props.centerValue ?? fmtValue(total.value));
</script>

<template>
  <div class="apc-card clay-surface">
    <header class="apc-head">
      <div>
        <h3 class="apc-title">{{ title }}</h3>
        <p v-if="subtitle" class="apc-sub">{{ subtitle }}</p>
      </div>
    </header>

    <div v-if="total === 0" class="apc-empty">📭 {{ t('admin.chart.noData') }}</div>
    <div v-else class="apc-body">
      <svg
        class="apc-svg"
        :viewBox="`0 0 ${SIZE} ${SIZE}`"
        role="img"
        :aria-label="title"
      >
        <g v-if="filtered.length === 0">
          <!-- empty background ring -->
          <circle :cx="CX" :cy="CY" :r="(RADIUS + INNER_RADIUS) / 2"
            fill="none" stroke="#f3f4f6" :stroke-width="RADIUS - INNER_RADIUS" />
        </g>
        <path
          v-for="(s, i) in slices"
          :key="i"
          :d="s.path"
          :fill="s.color"
          class="apc-slice"
        >
          <title>{{ s.name }}: {{ fmtValue(s.value) }} {{ unit }} ({{ (s.fraction * 100).toFixed(1) }}%)</title>
        </path>
        <!-- center text -->
        <text :x="CX" :y="CY - 4" text-anchor="middle" class="apc-center-value">
          {{ centerValueText }}
        </text>
        <text :x="CX" :y="CY + 14" text-anchor="middle" class="apc-center-label">
          {{ centerLabelText }} {{ unit }}
        </text>
      </svg>

      <ul class="apc-legend">
        <li
          v-for="(s, i) in slices"
          :key="i"
          class="apc-legend__item"
        >
          <span class="apc-legend__swatch" :style="{ background: s.color }"/>
          <span class="apc-legend__name">{{ s.name }}</span>
          <span class="apc-legend__pct">{{ (s.fraction * 100).toFixed(1) }}%</span>
          <span class="apc-legend__val">{{ fmtValue(s.value) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.apc-card {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;
  padding: 1rem 1.25rem;
  height: 100%; display: flex; flex-direction: column;
}
.apc-head { margin-bottom: 0.75rem; }
.apc-title { font-size: 1.05rem; font-weight: 700; margin: 0; color: #1a1a1a; }
.apc-sub { font-size: 0.78rem; color: #6b7280; margin: 0.2rem 0 0; }

.apc-empty {
  text-align: center; padding: 2.5rem 1rem; color: #6b7280; font-size: 0.9rem;
}

.apc-body {
  display: grid; grid-template-columns: minmax(160px, 200px) 1fr;
  gap: 1rem; align-items: center; flex: 1;
}
.apc-svg { width: 100%; height: auto; max-height: 220px; }
.apc-slice {
  transition: opacity 0.15s, transform 0.15s;
  transform-origin: 100px 100px;
}
.apc-slice:hover { opacity: 0.85; }
.apc-center-value {
  font-size: 18px; font-weight: 800; fill: #1a1a1a;
}
.apc-center-label {
  font-size: 10px; fill: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;
}

.apc-legend {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 0.35rem;
  font-size: 0.85rem;
  max-height: 220px; overflow-y: auto;
}
.apc-legend__item {
  display: grid; grid-template-columns: 12px 1fr auto auto;
  align-items: center; gap: 0.5rem;
}
.apc-legend__swatch {
  width: 12px; height: 12px; border-radius: 3px;
}
.apc-legend__name {
  font-weight: 600; color: #1a1a1a;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.apc-legend__pct {
  color: #6b7280; font-family: ui-monospace, monospace; font-size: 0.78rem;
}
.apc-legend__val {
  color: #1a1a1a; font-weight: 700; font-family: ui-monospace, monospace;
  font-size: 0.85rem;
}

@media (max-width: 640px) {
  .apc-body { grid-template-columns: 1fr; }
  .apc-legend { max-height: none; }
}
</style>
