<script setup lang="ts">
// CountdownPreview — admin-only live preview of the hero banner.
// Renders a smaller, light-themed strip that mirrors the public
// CountdownBanner's structure so the admin sees what visitors will.
import { computed } from 'vue';
import { useCountdown } from '../../composables/useCountdown';

const props = defineProps<{
  endsAt: string;   // "2026-12-31T23:59" (datetime-local) or ISO
  title: string;
  cta: string;
}>();

// Coerce the datetime-local string into a Date the composable
// can consume. Empty / invalid input -> far-future so the preview
// shows a clean "00:00:00:00" state instead of crashing.
const target = computed(() => {
  if (!props.endsAt) return new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const d = new Date(props.endsAt);
  return isNaN(d.getTime()) ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) : d;
});

const { days, hours, minutes, seconds, ended } = useCountdown(target.value);

const pad = (n: number) => String(n).padStart(2, '0');
</script>

<template>
  <div class="cpv-wrap" role="status">
    <span class="cpv-flame" aria-hidden="true">🔥</span>
    <span class="cpv-title">{{ title || 'Kampanya başlığı' }}</span>
    <span class="cpv-clock">
      <span class="cpv-cell"><b>{{ pad(days) }}</b><span class="cpv-unit">gün</span></span>
      <span class="cpv-sep">:</span>
      <span class="cpv-cell"><b>{{ pad(hours) }}</b><span class="cpv-unit">sa</span></span>
      <span class="cpv-sep">:</span>
      <span class="cpv-cell"><b>{{ pad(minutes) }}</b><span class="cpv-unit">dk</span></span>
      <span class="cpv-sep">:</span>
      <span class="cpv-cell"><b>{{ pad(seconds) }}</b><span class="cpv-unit">sn</span></span>
    </span>
    <span class="cpv-cta">{{ cta || 'Satın Al' }} →</span>
    <span v-if="ended" class="cpv-ended">⏰ Süre doldu — banner yayında görünmeyecek</span>
  </div>
</template>

<style scoped>
.cpv-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  background: linear-gradient(135deg, #BC4A3C 0%, #D9633E 50%, #BC4A3C 100%);
  color: #fff;
  padding: 10px 14px;
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 0.88rem;
  box-shadow: 0 4px 12px rgba(188, 74, 60, 0.25);
}
.cpv-flame { font-size: 1.05rem; line-height: 1; }
.cpv-title { font-weight: 800; letter-spacing: 0.02em; }
.cpv-clock {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.18);
  padding: 3px 8px;
  border-radius: 999px;
  font-family: 'SF Mono', Menlo, monospace;
  font-variant-numeric: tabular-nums;
}
.cpv-cell { display: inline-flex; align-items: baseline; gap: 3px; }
.cpv-cell b { font-weight: 800; }
.cpv-unit { opacity: 0.85; font-size: 0.72rem; }
.cpv-sep { font-weight: 800; opacity: 0.6; }
.cpv-cta {
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.8rem;
}
.cpv-ended {
  display: block;
  width: 100%;
  background: rgba(0, 0, 0, 0.18);
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  text-align: center;
  margin-top: 4px;
}
</style>
