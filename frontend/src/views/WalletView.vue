<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useCurrentUser } from '../composables/useCurrentUser';
import { useTranslate } from '../composables/useTranslate';
import { apiGet, apiPost } from '../api/openapi-client';
import type { components } from '../api/types';

const currentUser = useCurrentUser();
const { t, locale } = useTranslate();
const user = computed(() => currentUser.value);

// Loyalty tier thresholds (KGS cumulative spend → level + permanent discount)
const thresholds = [
  { level: 1, spend: 9000, discount: 5 },
  { level: 2, spend: 22000, discount: 10 },
  { level: 3, spend: 44000, discount: 15 },
  { level: 4, spend: 66000, discount: 20 },
  { level: 5, spend: 88000, discount: 25 },
];

const level = computed(() => Number(user.value?.loyaltyLevel || 0));
const spend = computed(() => Number(user.value?.cumulativeSpendKgs || 0));
const discount = computed(() => Number(user.value?.dynamicDiscountRate || 0));

const tierClass = computed(() => `tier-${level.value}`);

const nextLevelData = computed(() => {
  if (level.value >= 5) return null;
  const nextTarget = thresholds.find(t => t.level === level.value + 1);
  if (!nextTarget) return null;
  const amountNeeded = Math.max(0, nextTarget.spend - spend.value);
  const progressPct = Math.min(100, Math.max(0, (spend.value / nextTarget.spend) * 100));
  return { targetLevel: nextTarget.level, amountNeeded, targetDiscount: nextTarget.discount, progressPct };
});

const kgs = (n: number) => Math.round(n).toLocaleString('ru-RU') + ' KGS';
const fmtAmount = (n: number | string, cur: string) => Number(n).toLocaleString('ru-RU') + ' ' + cur;
const dateLocaleMap: Record<string, string> = { tr: 'tr-TR', ru: 'ru-RU', kg: 'ru-RU' };
const fmtDate = (d: string) => new Date(d).toLocaleDateString(dateLocaleMap[locale.value] || 'tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

type FinanceWithdrawal = components['schemas']['FinanceWithdrawal'];
type WithdrawalsEnvelope = components['schemas']['PaginationEnvelope<FinanceWithdrawal>'];
type WithdrawCurrency = 'KGS' | 'USD';

// ── Bakiye — store snapshot yerine sunucudan TAZE çekilir 🛡️ ──
// İlk boyama için store değeriyle başlanır, mount'ta /finance/wallet ile üzerine yazılır.
const walletKgs = ref(Number((user.value as any)?.walletBalanceKgs || 0));
const walletUsd = ref(Number((user.value as any)?.walletBalanceUsd || 0));
const balanceLoading = ref(true);
const balanceError = ref('');

const fetchBalance = async () => {
  balanceLoading.value = true;
  balanceError.value = '';
  try {
    const r = await apiGet('/api/v1/finance/wallet');
    const d = r.data as { walletBalanceKgs?: number | string; walletBalanceUsd?: number | string };
    walletKgs.value = Number(d?.walletBalanceKgs || 0);
    walletUsd.value = Number(d?.walletBalanceUsd || 0);
  } catch (err: any) {
    balanceError.value = err?.response?.data?.error || t('wallet.balanceLoadError');
  } finally {
    balanceLoading.value = false;
  }
};

// ── Çekim talebi formu ──
const wdAmount = ref<number | null>(null);
const wdCurrency = ref<WithdrawCurrency>('KGS');
const wdBankInfo = ref('');
const wdTouched = ref(false);
const wdConfirming = ref(false);
const wdSubmitting = ref(false);
const wdError = ref('');
const wdSuccess = ref('');

// USD seçeneği sadece USD bakiyesi varsa gösterilir
const usdAvailable = computed(() => walletUsd.value > 0);
const availableForCurrency = computed(() => (wdCurrency.value === 'USD' ? walletUsd.value : walletKgs.value));

const wdValidationError = computed(() => {
  const amt = Number(wdAmount.value);
  if (!amt || amt <= 0) return t('wallet.errAmountPositive');
  if (amt > availableForCurrency.value) return t('wallet.errAmountExceeds');
  return '';
});

const onCurrencyChange = () => {
  // 🛡️ USD bakiyesi sıfırlanırsa seçim KGS'ye geri düşer
  if (wdCurrency.value === 'USD' && !usdAvailable.value) wdCurrency.value = 'KGS';
  wdConfirming.value = false;
};

const submitWithdraw = async () => {
  wdTouched.value = true;
  wdError.value = '';
  wdSuccess.value = '';
  if (wdValidationError.value) return;

  // İlk tıklama onay adımını açar; ikinci tıklama (Evet, Gönder) gerçek isteği atar
  if (!wdConfirming.value) {
    wdConfirming.value = true;
    return;
  }

  wdSubmitting.value = true;
  try {
    const res = await apiPost('/api/v1/finance/withdraw', {
      amount: Number(wdAmount.value),
      currency: wdCurrency.value,
      bankInfo: wdBankInfo.value.trim() || null
    });
    if (res.status === 201) {
      wdSuccess.value = t('wallet.withdrawSuccess');
      wdAmount.value = null;
      wdBankInfo.value = '';
      wdTouched.value = false;
      wdConfirming.value = false;
      // 🚀 Bakiye ve liste anında tazelenir — polling gerekmez
      await Promise.all([fetchBalance(), fetchRequests(1)]);
    }
  } catch (err: any) {
    // Backend mesajını (özellikle yetersiz bakiye) yutmadan kullanıcıya göster
    wdError.value = err?.response?.data?.error || t('wallet.withdrawError');
    wdConfirming.value = false;
  } finally {
    wdSubmitting.value = false;
  }
};

// ── Çekim talepleri listesi (sayfalı) ──
const REQ_LIMIT = 5;
const requests = ref<FinanceWithdrawal[]>([]);
const reqTotal = ref(0);
const reqPage = ref(1);
const reqHasMore = ref(false);
const reqLoading = ref(true);
const reqError = ref('');

const reqPages = computed(() => Math.max(1, Math.ceil(reqTotal.value / REQ_LIMIT)));

const fetchRequests = async (page = reqPage.value) => {
  reqLoading.value = true;
  reqError.value = '';
  try {
    const r = await apiGet('/api/v1/finance/withdrawals', { query: { page, limit: REQ_LIMIT } });
    const data = r.data as WithdrawalsEnvelope;
    requests.value = data.items;
    reqTotal.value = data.total;
    reqPage.value = data.page;
    reqHasMore.value = data.hasMore;
  } catch (err: any) {
    reqError.value = err?.response?.data?.error || t('wallet.requestsLoadError');
  } finally {
    reqLoading.value = false;
  }
};

const statusLabel = (status: string) => {
  if (status === 'approved') return t('wallet.statusApproved');
  if (status === 'rejected') return t('wallet.statusRejected');
  return t('wallet.statusPending');
};

onMounted(() => {
  fetchBalance();
  fetchRequests(1);
});
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
            <span class="wlt-stat__value">{{ kgs(spend) }}</span>
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
          <p class="wlt-progress__text">{{ t('wallet.remainingToNext', { amount: kgs(nextLevelData.amountNeeded) }) }}</p>
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
              <span class="wlt-step__spend">{{ t('wallet.spendLabel', { amount: kgs(th.spend) }) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══ BALANCE + WITHDRAW + TIPS ═══ -->
      <aside class="wlt-side">
        <section class="wlt-card wlt-balance">
          <div class="wlt-card__head">
            <h2 class="wlt-card__title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
              {{ t('wallet.cashBalance') }}
            </h2>
          </div>
          <div v-if="balanceLoading" class="wlt-balance__amount wlt-skeleton">…</div>
          <template v-else-if="!balanceError">
            <div class="wlt-balance__amount">{{ kgs(walletKgs) }}</div>
            <div v-if="walletUsd > 0" class="wlt-balance__usd">
              <span class="wlt-balance__usd-label">{{ t('wallet.usdBalance') }}</span>
              <strong>{{ fmtAmount(walletUsd, 'USD') }}</strong>
            </div>
          </template>
          <div v-else class="wlt-inline-error">
            <span>{{ balanceError }}</span>
            <button class="wlt-retry" @click="fetchBalance">{{ t('wallet.retry') }}</button>
          </div>
          <span class="wlt-balance__label">{{ t('wallet.availableBalance') }}</span>
          <p class="wlt-balance__info">{{ t('wallet.balanceInfo') }}</p>
        </section>

        <!-- ═══ WITHDRAWAL REQUEST CARD ═══ -->
        <section class="wlt-card wlt-withdraw">
          <div class="wlt-card__head">
            <h2 class="wlt-card__title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><polyline points="5 12 12 5 19 12"/><path d="M5 21h14"/></svg>
              {{ t('wallet.withdrawTitle') }}
            </h2>
          </div>
          <p class="wlt-withdraw__desc">{{ t('wallet.withdrawDesc') }}</p>

          <div class="wlt-field">
            <label class="wlt-field__label" for="wd-amount">{{ t('wallet.amountLabel') }}</label>
            <div class="wlt-amount-row">
              <input
                id="wd-amount"
                v-model.number="wdAmount"
                type="number"
                min="0"
                step="any"
                class="wlt-input"
                :placeholder="t('wallet.amountPlaceholder')"
                :disabled="wdSubmitting"
                @input="wdConfirming = false"
              />
              <!-- USD seçeneği sadece USD bakiyesi varken sunulur -->
              <select
                v-if="usdAvailable"
                v-model="wdCurrency"
                class="wlt-input wlt-currency"
                :aria-label="t('wallet.currencyLabel')"
                :disabled="wdSubmitting"
                @change="onCurrencyChange"
              >
                <option value="KGS">KGS</option>
                <option value="USD">USD</option>
              </select>
              <span v-else class="wlt-currency-static">KGS</span>
            </div>
            <span class="wlt-field__hint">{{ t('wallet.availableForWithdraw', { amount: fmtAmount(availableForCurrency, wdCurrency) }) }}</span>
            <span v-if="wdTouched && wdValidationError" class="wlt-field__error">{{ wdValidationError }}</span>
          </div>

          <div class="wlt-field">
            <label class="wlt-field__label" for="wd-bank">{{ t('wallet.bankInfoLabel') }}</label>
            <textarea
              id="wd-bank"
              v-model="wdBankInfo"
              class="wlt-input wlt-textarea"
              rows="2"
              maxlength="500"
              :placeholder="t('wallet.bankInfoPlaceholder')"
              :disabled="wdSubmitting"
            />
          </div>

          <!-- ⚠️ Tutar anında düşülür; ret durumunda otomatik iade edilir -->
          <p class="wlt-warn">{{ t('wallet.withdrawWarn') }}</p>

          <div v-if="wdConfirming" class="wlt-confirm">
            <p class="wlt-confirm__text">{{ t('wallet.withdrawConfirmText', { amount: fmtAmount(Number(wdAmount), wdCurrency) }) }}</p>
            <div class="wlt-confirm__actions">
              <button class="wlt-btn wlt-btn--primary" :disabled="wdSubmitting" @click="submitWithdraw">
                {{ wdSubmitting ? t('wallet.withdrawSubmitting') : t('wallet.confirmYes') }}
              </button>
              <button class="wlt-btn wlt-btn--ghost" :disabled="wdSubmitting" @click="wdConfirming = false">
                {{ t('wallet.confirmNo') }}
              </button>
            </div>
          </div>
          <button v-else class="wlt-btn wlt-btn--primary wlt-btn--block" :disabled="wdSubmitting" @click="submitWithdraw">
            {{ t('wallet.withdrawSubmit') }}
          </button>

          <p v-if="wdError" class="wlt-feedback wlt-feedback--error">{{ wdError }}</p>
          <p v-if="wdSuccess" class="wlt-feedback wlt-feedback--success">{{ wdSuccess }}</p>
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

    <!-- ═══ ÇEKİM TALEPLERİM (kullanıcının kendi talepleri) ═══ -->
    <section class="wlt-card wlt-requests">
      <div class="wlt-card__head">
        <h2 class="wlt-card__title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          {{ t('wallet.myRequests') }}
        </h2>
        <button class="wlt-refresh" :disabled="reqLoading" @click="fetchRequests()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          {{ t('wallet.refresh') }}
        </button>
      </div>

      <div v-if="reqLoading" class="wlt-requests__state">{{ t('wallet.loadingRequests') }}</div>
      <div v-else-if="reqError" class="wlt-requests__state wlt-requests__state--error">
        <span>{{ reqError }}</span>
        <button class="wlt-retry" @click="fetchRequests()">{{ t('wallet.retry') }}</button>
      </div>
      <div v-else-if="requests.length === 0" class="wlt-requests__state">{{ t('wallet.noRequests') }}</div>

      <template v-else>
        <ul class="wlt-req-list">
          <li v-for="rq in requests" :key="rq.id" class="wlt-req">
            <div class="wlt-req__main">
              <span class="wlt-req__amount">{{ fmtAmount(rq.amount, rq.currency) }}</span>
              <span v-if="rq.bankInfo" class="wlt-req__bank" :title="rq.bankInfo">{{ rq.bankInfo }}</span>
            </div>
            <div class="wlt-req__meta">
              <span class="wlt-badge" :class="`wlt-badge--${rq.status}`">{{ statusLabel(rq.status) }}</span>
              <!-- Reddedilen taleplerde tutar cüzdana iade edilir -->
              <span v-if="rq.status === 'rejected'" class="wlt-req__refund">{{ t('wallet.refundedNote') }}</span>
              <time class="wlt-req__date" :datetime="rq.createdAt">{{ fmtDate(rq.createdAt) }}</time>
            </div>
          </li>
        </ul>

        <div v-if="reqPages > 1" class="wlt-pager">
          <button class="wlt-btn wlt-btn--ghost" :disabled="reqPage <= 1 || reqLoading" @click="fetchRequests(reqPage - 1)">
            {{ t('wallet.prev') }}
          </button>
          <span class="wlt-pager__info">{{ t('wallet.pageInfo', { page: reqPage, pages: reqPages }) }}</span>
          <button class="wlt-btn wlt-btn--ghost" :disabled="!reqHasMore || reqLoading" @click="fetchRequests(reqPage + 1)">
            {{ t('wallet.next') }}
          </button>
        </div>
      </template>
    </section>
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
.wlt-balance__info { font-size: 0.84rem; color: #9ca3af; line-height: 1.55; margin: 16px 0 0; }
.wlt-balance__usd { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px; font-size: 0.9rem; color: #374151; }
.wlt-balance__usd-label { font-size: 0.74rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.4px; }
.wlt-skeleton { color: #d1d5db; }
.wlt-inline-error { display: flex; flex-direction: column; align-items: center; gap: 8px; margin: 12px 0; font-size: 0.86rem; color: #b91c1c; }
.wlt-retry { padding: 6px 14px; border: 1.5px solid #e5e7eb; background: #fff; color: #374151; border-radius: 10px; font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.15s; }
.wlt-retry:hover { border-color: #BC4A3C; color: #BC4A3C; }

/* Withdraw card */
.wlt-withdraw__desc { margin: -6px 0 18px; font-size: 0.86rem; color: #6b7280; line-height: 1.5; }
.wlt-field { margin-bottom: 14px; }
.wlt-field__label { display: block; font-size: 0.78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 7px; }
.wlt-amount-row { display: flex; gap: 8px; }
.wlt-input { width: 100%; padding: 11px 13px; border: 1.5px solid #e5e7eb; border-radius: 12px; font-family: 'Inter', sans-serif; font-size: 0.95rem; color: #111827; background: #fff; transition: border-color 0.15s, box-shadow 0.15s; }
.wlt-input:focus { outline: none; border-color: #BC4A3C; box-shadow: 0 0 0 3px rgba(188,74,60,0.1); }
.wlt-input:disabled { background: #f9fafb; color: #9ca3af; }
.wlt-currency { width: auto; flex-shrink: 0; font-weight: 700; cursor: pointer; }
.wlt-currency-static { display: flex; align-items: center; padding: 0 14px; border: 1.5px solid #e5e7eb; border-radius: 12px; background: #f9fafb; font-weight: 800; font-size: 0.85rem; color: #6b7280; }
.wlt-textarea { resize: vertical; min-height: 56px; line-height: 1.45; }
.wlt-field__hint { display: block; margin-top: 6px; font-size: 0.78rem; color: #9ca3af; }
.wlt-field__error { display: block; margin-top: 6px; font-size: 0.8rem; font-weight: 600; color: #b91c1c; }
.wlt-warn { margin: 4px 0 16px; padding: 11px 13px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; font-size: 0.8rem; line-height: 1.5; color: #92400e; }

.wlt-btn { padding: 11px 18px; border-radius: 12px; font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.15s; border: 1.5px solid transparent; }
.wlt-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.wlt-btn--primary { background: linear-gradient(135deg, #D4665A, #BC4A3C); color: #fff; border: none; }
.wlt-btn--primary:not(:disabled):hover { filter: brightness(1.06); box-shadow: 0 6px 16px rgba(188,74,60,0.28); }
.wlt-btn--ghost { background: #fff; color: #4b5563; border-color: #e5e7eb; }
.wlt-btn--ghost:not(:disabled):hover { border-color: #BC4A3C; color: #BC4A3C; }
.wlt-btn--block { width: 100%; }

.wlt-confirm { background: #fdf4f2; border: 1px solid #f3dcd6; border-radius: 14px; padding: 14px 16px; }
.wlt-confirm__text { margin: 0 0 12px; font-size: 0.88rem; font-weight: 600; color: #7c2d12; line-height: 1.45; }
.wlt-confirm__actions { display: flex; gap: 10px; }
.wlt-confirm__actions .wlt-btn { flex: 1; }

.wlt-feedback { margin: 12px 0 0; padding: 10px 13px; border-radius: 12px; font-size: 0.84rem; line-height: 1.45; }
.wlt-feedback--error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
.wlt-feedback--success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }

/* Requests list */
.wlt-requests { margin-top: 20px; }
.wlt-refresh { display: inline-flex; align-items: center; gap: 6px; padding: 7px 13px; border: 1.5px solid #e5e7eb; background: #fff; color: #4b5563; border-radius: 10px; font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.15s; }
.wlt-refresh:not(:disabled):hover { border-color: #BC4A3C; color: #BC4A3C; }
.wlt-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
.wlt-requests__state { padding: 26px 0; text-align: center; font-size: 0.9rem; color: #9ca3af; }
.wlt-requests__state--error { color: #b91c1c; display: flex; flex-direction: column; align-items: center; gap: 10px; }

.wlt-req-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.wlt-req { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 13px 4px; border-bottom: 1px solid #f3f1ee; }
.wlt-req:last-child { border-bottom: none; }
.wlt-req__main { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.wlt-req__amount { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1rem; color: #111827; }
.wlt-req__bank { font-size: 0.78rem; color: #9ca3af; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 320px; }
.wlt-req__meta { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.wlt-req__refund { font-size: 0.74rem; font-weight: 600; color: #b91c1c; }
.wlt-req__date { font-size: 0.78rem; color: #9ca3af; }

/* Status badges: beklemede→amber, onaylandı→yeşil, reddedildi→kırmızı */
.wlt-badge { display: inline-flex; align-items: center; padding: 4px 11px; border-radius: 100px; font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 0.74rem; white-space: nowrap; }
.wlt-badge--pending { background: #fef3c7; color: #b45309; }
.wlt-badge--approved { background: #dcfce7; color: #15803d; }
.wlt-badge--rejected { background: #fee2e2; color: #b91c1c; }

.wlt-pager { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 16px; padding-top: 14px; border-top: 1px dashed #ece7e1; }
.wlt-pager__info { font-size: 0.82rem; font-weight: 600; color: #6b7280; }

/* Tips */
.wlt-tip-list { list-style: none; margin: 14px 0 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.wlt-tip-list li { display: flex; gap: 11px; align-items: flex-start; font-size: 0.88rem; color: #4b5563; line-height: 1.45; }
.wlt-tip__dot { flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: #fdf0ee; color: #BC4A3C; font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 0.78rem; display: flex; align-items: center; justify-content: center; }

@media (max-width: 900px) {
  .wlt-grid { grid-template-columns: 1fr; }
  .wlt-title { font-size: 1.6rem; }
  .wlt-step__spend { display: none; }
  .wlt-req { flex-direction: column; align-items: flex-start; gap: 8px; }
  .wlt-req__bank { max-width: 100%; }
}
</style>
