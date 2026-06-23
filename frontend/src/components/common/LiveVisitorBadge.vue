<script setup lang="ts">
// LiveVisitorBadge — a small inline pill that says
// "12 people are looking at this right now". The exact number
// is a server-truth count (via usePresence), and the message
// copy is i18n-aware so it reads naturally in TR/RU/KG.
//
// We deliberately don't show 0 ("No one is here") — empty
// reads as a quiet store. The badge is hidden when there's
// nothing to show.
import { computed } from 'vue';
import { usePresence } from '../../composables/usePresence';
import { useTranslate } from '../../composables/useTranslate';

const props = defineProps<{
  productId: string;
  /** Compact layout for product cards vs full PDP. */
  variant?: 'pill' | 'inline';
}>();

const { t } = useTranslate();
const { count, isLive } = usePresence(() => props.productId);

const display = computed(() => {
  const n = count.value;
  if (n <= 0) return null; // hide when nobody else is here
  if (n === 1) return t('presence.oneOther');
  if (n < 5) return t('presence.fewOther', { count: n });
  return t('presence.manyOther', { count: n });
});
</script>

<template>
  <span
    v-if="display && isLive"
    class="lvb"
    :class="['lvb--' + (variant || 'pill'), { 'is-pulsing': count > 0 }]"
    role="status"
    :aria-label="display"
  >
    <span class="lvb-dot" aria-hidden="true">
      <span class="lvb-pulse" />
    </span>
    <span class="lvb-icon" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    </span>
    <span class="lvb-text">{{ display }}</span>
  </span>
</template>

<style scoped>
.lvb {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.78rem;
  letter-spacing: 0.01em;
  color: var(--pv-red, #BC4A3C);
  background: rgba(188, 74, 60, 0.08);
  border: 1px solid rgba(188, 74, 60, 0.20);
  padding: 4px 10px 4px 8px;
  border-radius: 999px;
  user-select: none;
  white-space: nowrap;
  transition: background 0.2s, transform 0.2s;
}
.lvb--inline {
  background: transparent;
  border: none;
  padding: 0;
  color: var(--text-secondary, #3f3f46);
  font-size: 0.82rem;
  gap: 4px;
}
.lvb--inline:hover { background: transparent; }

.lvb-icon { display: inline-flex; opacity: 0.85; }
.lvb-text { line-height: 1; }

.lvb-dot {
  position: relative;
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--pv-red, #BC4A3C);
  box-shadow: 0 0 4px rgba(188, 74, 60, 0.45);
}
.lvb-pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(188, 74, 60, 0.6);
  animation: lvpPulse 1.6s ease-out infinite;
}
@keyframes lvpPulse {
  0%   { transform: scale(1);   opacity: 0.7; }
  100% { transform: scale(2.5); opacity: 0; }
}

.lvb.is-pulsing { animation: lvbPop 0.3s ease-out; }
@keyframes lvbPop {
  0%   { transform: scale(0.95); }
  50%  { transform: scale(1.04); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .lvb-pulse { animation: none; }
  .lvb.is-pulsing { animation: none; }
}
</style>
