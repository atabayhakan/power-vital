<script setup lang="ts">
// CompareBadge — a small pill that sits in the navbar next to the
// cart icon. Hidden when the comparison list is empty; pulses
// briefly when a new product is added so the user notices.
import { ref, watch } from 'vue';
import { useCompare } from '../../composables/useCompare';
import { useTranslate } from '../../composables/useTranslate';

const compare = useCompare();
const { t } = useTranslate();

const isPulsing = ref(false);
let pulseTimeout: number | null = null;

const openDrawer = () => {
  window.dispatchEvent(new CustomEvent('pv-open-compare'));
};

watch(() => compare.count.value, (newCount, oldCount) => {
  if (newCount > (oldCount || 0)) {
    if (pulseTimeout) window.clearTimeout(pulseTimeout);
    isPulsing.value = true;
    pulseTimeout = window.setTimeout(() => { isPulsing.value = false; }, 600);
  }
});
</script>

<template>
  <button
    v-show="compare.count.value > 0"
    class="cb-badge"
    :class="{ 'is-pulsing': isPulsing }"
    type="button"
    :aria-label="t('compare.openDrawer')"
    :title="t('compare.openDrawer')"
    @click="openDrawer"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h12"/>
      <path d="M17 18l3-3-3-3"/>
    </svg>
    <span class="cb-count">{{ compare.count.value }}</span>
  </button>
</template>

<style scoped>
.cb-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px 8px 10px;
  background: rgba(188, 74, 60, 0.10);
  border: 1.5px solid rgba(188, 74, 60, 0.30);
  color: var(--pv-red, #BC4A3C);
  border-radius: 999px;
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.82rem;
  transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
}
.cb-badge:hover {
  background: rgba(188, 74, 60, 0.18);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(188, 74, 60, 0.18);
}
.cb-badge:active { transform: scale(0.96); }

.cb-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  background: var(--pv-red, #BC4A3C);
  color: #fff;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0;
}

.cb-badge.is-pulsing {
  animation: cbPulse 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes cbPulse {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.18); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .cb-badge.is-pulsing { animation: none; }
}
</style>
