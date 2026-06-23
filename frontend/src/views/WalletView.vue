<script setup lang="ts">
import { computed } from 'vue';
import { useCurrentUser } from '../composables/useCurrentUser';
import { useTranslate } from '../composables/useTranslate';

const currentUser = useCurrentUser();
const { t } = useTranslate();
const user = computed(() => currentUser.value);

// Loyalty tier thresholds (USD cumulative spend → level + permanent discount)
const thresholds = [
  { level: 1, spend: 100, discount: 5 },
  { level: 2, spend: 250, discount: 10 },
  { level: 3, spend: 500, discount: 15 },
  { level: 4, spend: 750, discount: 20 },
  { level: 5, spend: 1000, discount: 25 },
];

const level = computed(() => Number(user.value?.loyaltyLevel || 0));
const spend = computed(() => Number(user.value?.cumulativeSpendUsd || 0));
const discount = computed(() => Number(user.value?.dynamicDiscountRate || 0));
const walletKgs = computed(() => Number((user.value as any)?.walletBalanceKgs || 0));

const tierClass = computed(() => `tier-${level.value}`);

const nextLevelData = computed(() => {
  if (level.value >= 5) return null;
  const nextTarget = thresholds.find(t => t.level === level.value + 1);
  if (!nextTarget) return null;
  const amountNeeded = Math.max(0, nextTarget.spend - spend.value);
  const progressPct = Math.min(100, Math.max(0, (spend.value / nextTarget.spend) * 100));
  return { targetLevel: nextTarget.level, amountNeeded, targetDiscount: nextTarget.discount, progressPct };
});

const usd = (n: number) => '$' + n.toFixed(2);
const kgs = (n: number) => Math.round(n).toLocaleString('ru-RU') + ' KGS';
</script>

<template>
  <div class="wlt">
   <div class="wlt__inner">
    <header class="wlt-head">
      <h1 class="wlt-title">{{ t('wallet.title') }}</h1>
      <p class="wlt-sub">{{ t('wallet.subtitle') }}</p>
    </header>

    <div class="wlt-grid">
      <!-- ═══ LOYALTY CARD ═══ -->
      <section class="wlt-card wlt-loyalty">
        <div class="wlt-card__head">
          <h2 class="wlt-card__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>
            {{ t('wallet.vipProgram') }}
          </h2>
          <span class="wlt-level" :class="tierClass">✦ {{ t('wallet.level') }} {{ level }}</span>
        </div>

        <div class="wlt-stats">
          <div class="wlt-stat">
            <span class="wlt-stat__label">{{ t('wallet.totalSpend') }}</span>
            <span class="wlt-stat__value">{{ usd(spend) }}</span>
          </div>
          <div class="wlt-stat wlt-stat--accent">
            <span class="wlt-stat__label">{{ t('wallet.yourDiscount') }}</span>
            <span class="wlt-stat__value">%{{ discount }}</span>
          </div>
        </div>

        <!-- Progress to next level -->
        <div v-if="nextLevelData" class="wlt-progress">
          <div class="wlt-progress__top">
            <span>{{ t('wallet.targetLevel', { level: nextLevelData.targetLevel }) }}</span>
            <span class="wlt-progress__disc">{{ t('wallet.discountAmount', { n: nextLevelData.targetDiscount }) }}</span>
          </div>
          <div class="wlt-bar"><div class="wlt-bar__fill" :style="{ width: nextLevelData.progressPct + '%' }"/></div>
          <p class="wlt-progress__text">{{ t('wallet.remainingToNext', { amount: usd(nextLevelData.amountNeeded) }) }}</p>
        </div>
        <div v-else class="wlt-max">
          <span class="wlt-max__icon">👑</span>
          <div>
            <h3>{{ t('wallet.maxLevelTitle') }}</h3>
            <p>{{ t('wallet.maxLevelText') }}</p>
          </div>
        </div>

        <!-- ═══ NOVEL: Loyalty roadmap (tier ladder) ═══ -->
        <div class="wlt-roadmap">
          <span class="wlt-roadmap__title">{{ t('wallet.tierRoadmap') }}</span>
          <div class="wlt-steps">
            <div
              v-for="th in thresholds"
              :key="th.level"
              class="wlt-step"
              :class="{ 'is-done': level >= th.level, 'is-current': level + 1 === th.level }"
            >
              <span class="wlt-step__dot">
                <svg v-if="level >= th.level" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span v-else>{{ th.level }}</span>
              </span>
              <span class="wlt-step__disc">%{{ th.discount }}</span>
              <span class="wlt-step__spend">{{ t('wallet.spendLabel', { amount: usd(th.spend) }) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══ BALANCE + TIPS ═══ -->
      <aside class="wlt-side">
        <section class="wlt-card wlt-balance">
          <div class="wlt-card__head">
            <h2 class="wlt-card__title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
              {{ t('wallet.cashBalance') }}
            </h2>
          </div>
          <div class="wlt-balance__amount">
            {{ kgs(walletKgs) }}
          </div>
          <span class="wlt-balance__label">{{ t('wallet.availableBalance') }}</span>
          <p class="wlt-balance__info">{{ t('wallet.balanceInfo') }}</p>
          <button class="wlt-topup" disabled>{{ t('wallet.topUpSoon') }}</button>
        </section>

        <section class="wlt-card wlt-tips">
          <h2 class="wlt-card__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {{ t('wallet.howToEarn') }}
          </h2>
          <ul class="wlt-tip-list">
            <li><span class="wlt-tip__dot">1</span>{{ t('wallet.earnTip1') }}</li>
            <li><span class="wlt-tip__dot">2</span>{{ t('wallet.earnTip2') }}</li>
            <li><span class="wlt-tip__dot">3</span>{{ t('wallet.earnTip3') }}</li>
          </ul>
        </section>
      </aside>
    </div>
   </div>
  </div>
</template>

<style scoped>
.wlt {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  font-family: 'Inter', system-ui, sans-serif;
  color: #1f2937;
  -webkit-overflow-scrolling: touch;
}
.wlt__inner { max-width: 1160px; margin: 0 auto; padding: 32px 24px 64px; }

.wlt-head { margin-bottom: 26px; }
.wlt-title { font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 800; margin: 0 0 6px; letter-spacing: -0.03em; color: #111827; }
.wlt-sub { margin: 0; color: #6b7280; font-size: 0.98rem; }

.wlt-grid { display: grid; grid-template-columns: 1.55fr 1fr; gap: 20px; align-items: start; }
.wlt-side { display: flex; flex-direction: column; gap: 20px; }

.wlt-card { background: #fff; border: 1px solid #ececec; border-radius: 20px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.wlt-card__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; gap: 12px; }
.wlt-card__title { display: flex; align-items: center; gap: 9px; font-family: 'Outfit', sans-serif; font-size: 1.05rem; font-weight: 800; color: #111827; margin: 0; }
.wlt-card__title svg { color: #BC4A3C; }

/* Loyalty card */
.wlt-loyalty { background: linear-gradient(160deg, #fff 0%, #fdf6f4 100%); }
.wlt-level { display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 100px; font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 0.85rem; color: #fff; white-space: nowrap; }
.wlt-level.tier-0 { background: linear-gradient(135deg, #b08a5a, #8a6a3f); }
.wlt-level.tier-1 { background: linear-gradient(135deg, #9aa3ad, #6b7682); }
.wlt-level.tier-2 { background: linear-gradient(135deg, #e3b341, #c4951f); }
.wlt-level.tier-3 { background: linear-gradient(135deg, #6ea8a3, #3d8a86); }
.wlt-level.tier-4 { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
.wlt-level.tier-5 { background: linear-gradient(135deg, #D4665A, #9A3A2E); }

.wlt-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
.wlt-stat { background: #faf8f5; border: 1px solid #f0ece6; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 6px; }
.wlt-stat--accent { background: #fdf0ee; border-color: #f3dcd6; }
.wlt-stat__label { font-size: 0.78rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.4px; }
.wlt-stat__value { font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 800; color: #111827; line-height: 1; }
.wlt-stat--accent .wlt-stat__value { color: #BC4A3C; }

.wlt-progress { background: #faf8f5; border: 1px solid #f0ece6; border-radius: 14px; padding: 16px 18px; }
.wlt-progress__top { display: flex; justify-content: space-between; align-items: center; font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 0.9rem; color: #374151; margin-bottom: 10px; }
.wlt-progress__disc { color: #BC4A3C; }
.wlt-bar { width: 100%; height: 9px; background: #ede8e2; border-radius: 100px; overflow: hidden; margin-bottom: 10px; }
.wlt-bar__fill { height: 100%; background: linear-gradient(90deg, #D4665A, #BC4A3C); border-radius: 100px; transition: width 1.2s cubic-bezier(0.2,0.8,0.2,1); }
.wlt-progress__text { margin: 0; font-size: 0.88rem; color: #6b7280; }

.wlt-max { display: flex; gap: 14px; align-items: center; background: #fdf4f2; border: 1px solid #f3dcd6; border-radius: 14px; padding: 18px; }
.wlt-max__icon { font-size: 2.2rem; }
.wlt-max h3 { font-family: 'Outfit', sans-serif; font-size: 1.05rem; font-weight: 800; color: #111827; margin: 0 0 4px; }
.wlt-max p { margin: 0; font-size: 0.85rem; color: #6b7280; line-height: 1.5; }

/* Roadmap */
.wlt-roadmap { margin-top: 22px; padding-top: 20px; border-top: 1px dashed #e7ddd6; }
.wlt-roadmap__title { display: block; font-family: 'Outfit', sans-serif; font-size: 0.8rem; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
.wlt-steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; position: relative; }
.wlt-step { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
.wlt-step__dot { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: #f0ece6; color: #9ca3af; font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 0.85rem; border: 2px solid transparent; transition: all 0.2s; }
.wlt-step.is-done .wlt-step__dot { background: #2d8a56; color: #fff; }
.wlt-step.is-current .wlt-step__dot { background: #fff; color: #BC4A3C; border-color: #BC4A3C; box-shadow: 0 0 0 4px rgba(188,74,60,0.12); }
.wlt-step__disc { font-family: 'Outfit', sans-serif; font-size: 0.9rem; font-weight: 800; color: #1f2937; }
.wlt-step.is-done .wlt-step__disc { color: #2d8a56; }
.wlt-step__spend { font-size: 0.68rem; color: #9ca3af; line-height: 1.2; }

/* Balance card */
.wlt-balance { text-align: center; }
.wlt-balance .wlt-card__head { justify-content: flex-start; margin-bottom: 14px; }
.wlt-balance__amount { font-family: 'Outfit', sans-serif; font-size: 2.4rem; font-weight: 800; color: #111827; line-height: 1; margin: 8px 0 4px; }
.wlt-balance__label { font-size: 0.78rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.4px; }
.wlt-balance__info { font-size: 0.84rem; color: #9ca3af; line-height: 1.55; margin: 16px 0 18px; }
.wlt-topup { width: 100%; padding: 12px; border: 1.5px solid #e5e7eb; background: #f9fafb; color: #9ca3af; border-radius: 12px; font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 0.9rem; cursor: not-allowed; }

/* Tips */
.wlt-tip-list { list-style: none; margin: 14px 0 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.wlt-tip-list li { display: flex; gap: 11px; align-items: flex-start; font-size: 0.88rem; color: #4b5563; line-height: 1.45; }
.wlt-tip__dot { flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: #fdf0ee; color: #BC4A3C; font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 0.78rem; display: flex; align-items: center; justify-content: center; }

@media (max-width: 900px) {
  .wlt-grid { grid-template-columns: 1fr; }
  .wlt-title { font-size: 1.6rem; }
  .wlt-step__spend { display: none; }
}
</style>
