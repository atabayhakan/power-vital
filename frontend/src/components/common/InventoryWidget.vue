<script setup lang="ts">
// InventoryWidget — combines two real-time PDP widgets into a
// single block: the FOMO "X people bought this recently" strip
// and the stock urgency bar. Both are driven by useInventory
// which polls the inventory service every 20s.
//
// We deliberately keep this compact — a 1-2 line FOMO strip
// + a thin progress bar — because on a PDP the eye spends
// most of its time on the product photo, not the side rail.
import { computed } from 'vue';
import { useInventory } from '../../composables/useInventory';
import { useTranslate } from '../../composables/useTranslate';

const props = defineProps<{ productId: string }>();
const { t } = useTranslate();
const { state, isOutOfStock } = useInventory(() => props.productId);

// % of dbStock still available — drives the urgency bar
// fill. When the bar is mostly empty the user reads "almost
// sold out" without us having to label it.
const fillPercent = computed(() => {
  const total = state.value.dbStock + state.value.reserved;
  if (total <= 0) return 0;
  return Math.max(2, Math.min(100, Math.round((state.value.available / total) * 100)));
});

const urgencyLevel = computed<'normal' | 'low' | 'critical' | 'out'>(() => {
  if (isOutOfStock.value) return 'out';
  const a = state.value.available;
  if (a <= 3) return 'critical';
  if (a <= 5 || fillPercent.value <= 20) return 'low';
  return 'normal';
});

const recentCount = computed(() => state.value.recentOrders);

// "X people bought this in the last 10 minutes" — only
// shown when there's at least one recent order.
const fomoText = computed(() => {
  const n = recentCount.value;
  if (n <= 0) return null;
  if (n === 1) return t('inventory.fomoOne');
  if (n < 5) return t('inventory.fomoFew', { count: n });
  return t('inventory.fomoMany', { count: n });
});
</script>

<template>
  <div class="iw" :class="['iw--' + urgencyLevel]">
    <!-- FOMO strip -->
    <div v-if="fomoText" class="iw-fomo" role="status" aria-live="polite">
      <span class="iw-fomo-dot" aria-hidden="true" />
      <span class="iw-fomo-emoji" aria-hidden="true">🔥</span>
      <span class="iw-fomo-text">{{ fomoText }}</span>
    </div>

    <!-- Stock urgency bar -->
    <div v-if="!isOutOfStock" class="iw-stock" role="status">
      <div class="iw-stock-head">
        <span class="iw-stock-label">{{ t('inventory.leftInStock', { count: state.available }) }}</span>
        <span v-if="urgencyLevel === 'critical'" class="iw-stock-warn">
          ⚡ {{ t('inventory.almostGone') }}
        </span>
      </div>
      <div class="iw-bar" :aria-valuenow="state.available" :aria-valuemin="0" :aria-valuemax="state.dbStock + state.reserved" role="progressbar">
        <div class="iw-bar-fill" :style="{ width: fillPercent + '%' }" />
      </div>
    </div>

    <!-- Out of stock -->
    <div v-else class="iw-out" role="status">
      <span aria-hidden="true">⛔</span>
      {{ t('inventory.outOfStockNotice') }}
    </div>
  </div>
</template>

<style scoped>
.iw {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-family: var(--font-body);
}

.iw-fomo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.08) 100%);
  border: 1px solid rgba(245, 158, 11, 0.30);
  color: #b45309;
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: 999px;
  white-space: nowrap;
  width: fit-content;
  max-width: 100%;
  animation: iwFomoPop 0.4s ease-out;
}
@keyframes iwFomoPop {
  0%   { transform: scale(0.85); opacity: 0; }
  100% { transform: scale(1);    opacity: 1; }
}
.iw-fomo-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.6);
  flex-shrink: 0;
  animation: iwFomoPulse 1.4s ease-in-out infinite;
}
@keyframes iwFomoPulse {
  0%, 100% { transform: scale(1);   opacity: 1; }
  50%      { transform: scale(1.4); opacity: 0.5; }
}
.iw-fomo-emoji { font-size: 0.95rem; line-height: 1; }
.iw-fomo-text { line-height: 1.3; }

.iw-stock {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
}
.iw-stock-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--text-secondary, #3f3f46);
}
.iw-stock-label { font-weight: 600; }
.iw-stock-warn {
  color: #dc2626;
  font-weight: 700;
  font-size: 0.74rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  animation: iwWarn 1.2s ease-in-out infinite;
}
@keyframes iwWarn {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.55; }
}

.iw-bar {
  position: relative;
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  overflow: hidden;
}
.iw-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(90deg, #2D8A56 0%, #38b673 100%);
}
.iw--low .iw-bar-fill {
  background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
}
.iw--critical .iw-bar-fill {
  background: linear-gradient(90deg, #dc2626 0%, #f87171 100%);
  animation: iwCritical 0.8s ease-in-out infinite;
}
@keyframes iwCritical {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.65; }
}

.iw-out {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.25);
  color: #dc2626;
  font-weight: 700;
  font-size: 0.88rem;
  border-radius: 10px;
  width: fit-content;
}

@media (prefers-reduced-motion: reduce) {
  .iw-fomo-dot, .iw-stock-warn, .iw-fomo { animation: none; }
  .iw--critical .iw-bar-fill { animation: none; }
}
</style>
