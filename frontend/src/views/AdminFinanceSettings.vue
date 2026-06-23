<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getFinanceSettings, saveFinanceSettings, fetchFinanceSettings, type SmoothingMode } from '../utils/PriceEngine';
import api from '../utils/api';
import { useTranslate } from '../composables/useTranslate';

const { t } = useTranslate();

const rate = ref(88.5);
const mode = ref<SmoothingMode>('NEAREST_100');
const autoRateFetch = ref(true);
const isSaved = ref(false);
const isFetching = ref(false);
const fetchError = ref<string | null>(null);
const lastFetchInfo = ref<{ rate: number; source: string; updatedAt: string } | null>(null);

const mbankAccount = ref('');
const kaspiAccount = ref('');
const optimaAccount = ref('');
const customQrUrl = ref('');

const checkoutShippingThresholdUsd = ref(100);
const checkoutContinueShoppingText = ref('');
const checkoutShippingCheckboxText = ref('');
const checkoutFreeShippingSuccessText = ref('');

const testUsd = ref(25);

const simulatedPrice = computed(() => {
  const raw = testUsd.value * rate.value;
  let final = raw;
  switch (mode.value) {
    case 'NEAREST_50': {
      const rounded = Math.round(raw / 50) * 50;
      final = rounded === 0 && raw > 0 ? 50 : rounded;
      break;
    }
    case 'NEAREST_100': {
      const rounded = Math.round(raw / 100) * 100;
      final = rounded === 0 && raw > 0 ? 100 : rounded;
      break;
    }
    case 'PSYCHOLOGICAL_90': {
      const nearest100 = Math.round(raw / 100) * 100;
      const fPrice = nearest100 > 10 ? nearest100 - 10 : Number(raw.toFixed(2));
      final = fPrice <= 0 && raw > 0 ? 90 : fPrice;
      break;
    }
  }
  return { raw: Number(raw.toFixed(2)), final };
});

const lastUpdatedFormatted = computed(() => {
  if (!lastFetchInfo.value?.updatedAt) return 'Henüz çekilmedi';
  const d = new Date(lastFetchInfo.value.updatedAt);
  return d.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'medium' });
});

const isStale = computed(() => {
  if (!lastFetchInfo.value?.updatedAt) return true;
  const ageMs = Date.now() - new Date(lastFetchInfo.value.updatedAt).getTime();
  return ageMs > 24 * 60 * 60 * 1000; // older than 24h
});

onMounted(async () => {
  const settings = getFinanceSettings();
  rate.value = settings.exchangeRate;
  mode.value = settings.smoothingMode;
  autoRateFetch.value = settings.autoRateFetch !== false;
  mbankAccount.value = settings.mbankAccount || '';
  kaspiAccount.value = settings.kaspiAccount || '';
  optimaAccount.value = settings.optimaAccount || '';
  customQrUrl.value = settings.customQrUrl || '';
  checkoutShippingThresholdUsd.value = settings.checkoutShippingThresholdUsd ?? 100;
  checkoutContinueShoppingText.value = settings.checkoutContinueShoppingText || 'Siparişiniz 100$ altında kaldı. Alışverişe devam etmek için tıklayınız.';
  checkoutShippingCheckboxText.value = settings.checkoutShippingCheckboxText || 'Siparişi ödemesini yapıyorum, 100$ altında sipariş verdiğim için kargo ücretini ödemeyi kabul ediyorum.';
  checkoutFreeShippingSuccessText.value = settings.checkoutFreeShippingSuccessText || '🎉 Tebrikle, kargonuz ücretsizdir!';
  
  if (settings.lastRateUpdate) {
    lastFetchInfo.value = {
      rate: settings.exchangeRate,
      source: settings.rateSource || 'cache',
      updatedAt: settings.lastRateUpdate
    };
  }
  // Re-fetch to make sure we have the latest
  await fetchFinanceSettings();
  const s2 = getFinanceSettings();
  rate.value = s2.exchangeRate;
  if (s2.lastRateUpdate) {
    lastFetchInfo.value = {
      rate: s2.exchangeRate,
      source: s2.rateSource || 'cache',
      updatedAt: s2.lastRateUpdate
    };
  }
});

const saveSettings = async () => {
  await saveFinanceSettings({
    exchangeRate: rate.value,
    smoothingMode: mode.value,
    autoRateFetch: autoRateFetch.value,
    mbankAccount: mbankAccount.value,
    kaspiAccount: kaspiAccount.value,
    optimaAccount: optimaAccount.value,
    customQrUrl: customQrUrl.value,
    checkoutShippingThresholdUsd: checkoutShippingThresholdUsd.value,
    checkoutContinueShoppingText: checkoutContinueShoppingText.value,
    checkoutShippingCheckboxText: checkoutShippingCheckboxText.value,
    checkoutFreeShippingSuccessText: checkoutFreeShippingSuccessText.value
  });
  isSaved.value = true;
  setTimeout(() => isSaved.value = false, 3000);
};

const fetchNow = async () => {
  isFetching.value = true;
  fetchError.value = null;
  try {
    const res = await api.post('/finance/exchange-rate/refresh');
    if (res.data?.rate) {
      rate.value = Number(res.data.rate);
      lastFetchInfo.value = {
        rate: Number(res.data.rate),
        source: res.data.source || 'provider',
        updatedAt: res.data.updatedAt || new Date().toISOString()
      };
      // Persist smoothed/manual mode preferences alongside the fresh rate
      await saveFinanceSettings({
        exchangeRate: rate.value,
        smoothingMode: mode.value,
        autoRateFetch: autoRateFetch.value,
        rateSource: res.data.source,
        lastRateUpdate: res.data.updatedAt,
        mbankAccount: mbankAccount.value,
        kaspiAccount: kaspiAccount.value,
        optimaAccount: optimaAccount.value,
        customQrUrl: customQrUrl.value,
        checkoutShippingThresholdUsd: checkoutShippingThresholdUsd.value,
        checkoutContinueShoppingText: checkoutContinueShoppingText.value,
        checkoutShippingCheckboxText: checkoutShippingCheckboxText.value,
        checkoutFreeShippingSuccessText: checkoutFreeShippingSuccessText.value
      });
      isSaved.value = true;
      setTimeout(() => isSaved.value = false, 3000);
    }
  } catch (e: any) {
    const detail = e?.response?.data?.message || e?.response?.data?.error || e?.message;
    fetchError.value = detail || 'Kur çekilemedi';
    console.error('Fetch rate failed:', e);
  } finally {
    isFetching.value = false;
  }
};
</script>

<template>
  <div class="admin-page animate-fade-in">
    <header class="topbar">
      <h2>{{ t('admin.finance.title') }}</h2>
      <p class="subtitle">{{ t('admin.finance.subtitle') }}</p>
    </header>

    <div class="admin-panel-grid">
      <!-- Settings Panel -->
      <div class="panel">
        <h3>{{ t('admin.finance.engineSection') }}</h3>
        <form @submit.prevent="saveSettings" class="finance-form">
          <div class="field">
            <label>{{ t('admin.finance.exchangeRate') }}</label>
            <div class="input-with-button">
              <input type="number" step="0.01" v-model="rate" required />
              <button
                type="button"
                class="btn-fetch"
                :disabled="isFetching"
                @click="fetchNow"
                :title="isFetching ? 'Kur çekiliyor...' : 'NBKR veya exchangerate-api.com\'dan güncel kuru çek'"
              >
                <svg v-if="!isFetching" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                <svg v-else class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <span>{{ isFetching ? 'Çekiliyor…' : 'Şimdi Çek' }}</span>
              </button>
            </div>

            <div v-if="lastFetchInfo" class="rate-meta" :class="{ 'is-stale': isStale }">
              <span class="rate-meta__dot" :class="{ 'is-stale': isStale }"/>
              <span class="rate-meta__source">
                Kaynak: <strong>{{ lastFetchInfo.source }}</strong>
              </span>
              <span class="rate-meta__sep">•</span>
              <span class="rate-meta__time">
                Son: <strong>{{ lastUpdatedFormatted }}</strong>
              </span>
              <span v-if="isStale" class="rate-meta__warn">⚠ 24 saatten eski</span>
            </div>
            <div v-if="fetchError" class="rate-error">
              ⚠ Kur çekilemedi: {{ fetchError }}
            </div>
          </div>

          <div class="field">
            <label>{{ t('admin.finance.smoothingMode') }}</label>
            <select v-model="mode" class="clay-select">
              <option value="NONE">{{ t('admin.finance.smoothNone') }}</option>
              <option value="NEAREST_50">{{ t('admin.finance.smooth50') }}</option>
              <option value="NEAREST_100">{{ t('admin.finance.smooth100') }}</option>
              <option value="PSYCHOLOGICAL_90">Psikolojik Fiyatlama (sonu 90)</option>
            </select>
          </div>

          <div class="field toggle-field">
            <label class="toggle-label">
              <input type="checkbox" v-model="autoRateFetch" />
              <span class="toggle-track"><span class="toggle-thumb"/></span>
              <span class="toggle-text">
                <strong>{{ t('admin.finance.autoFetch') }}</strong>
                <small>{{ t('admin.finance.autoFetchHint') }}</small>
              </span>
            </label>
          </div>

          <div class="clay-inset" style="margin-top: 24px; display: flex; flex-direction: column; gap: 16px;">
            <h3>{{ t('admin.finance.manualPaySection') }}</h3>
            <p class="help-text" style="margin-bottom:0">{{ t('admin.finance.manualPayHint') }}</p>
            
            <div class="field">
              <label>{{ t('admin.finance.mbankAccount') }}</label>
              <input type="text" v-model="mbankAccount" placeholder="Örn: +996 771 898 889" />
            </div>
            
            <div class="field">
              <label>{{ t('admin.finance.kaspiAccount') }}</label>
              <input type="text" v-model="kaspiAccount" placeholder="Örn: +7 701 123 4567" />
            </div>

            <div class="field">
              <label>{{ t('admin.finance.optimaAccount') }}</label>
              <input type="text" v-model="optimaAccount" placeholder="Örn: 1280700100283947" />
            </div>

            <div class="field">
              <label>{{ t('admin.finance.customQr') }}</label>
              <input type="text" v-model="customQrUrl" placeholder="https://siteniz.com/qr.png" />
              <small style="color: #a1a1aa; font-size: 0.8rem; margin-top: 4px;">{{ t('admin.finance.customQrHint') }}</small>
            </div>
          </div>

          <div class="clay-inset" style="margin-top: 24px; display: flex; flex-direction: column; gap: 16px;">
            <h3>{{ t('admin.finance.shippingSection') }}</h3>
            <p class="help-text" style="margin-bottom:0">{{ t('admin.finance.shippingHint') }}</p>
            
            <div class="field">
              <label>{{ t('admin.finance.thresholdUsd') }}</label>
              <input type="number" step="0.01" v-model="checkoutShippingThresholdUsd" placeholder="Örn: 100" />
            </div>
            
            <div class="field">
              <label>{{ t('admin.finance.continueText') }}</label>
              <input type="text" v-model="checkoutContinueShoppingText" placeholder="Örn: Siparişiniz 100$ altında kaldı. Alışverişe devam etmek için tıklayınız." />
            </div>

            <div class="field">
              <label>{{ t('admin.finance.checkboxText') }}</label>
              <input type="text" v-model="checkoutShippingCheckboxText" placeholder="Örn: Siparişi ödemesini yapıyorum, 100$ altında sipariş verdiğim için kargo ücretini ödemeyi kabul ediyorum." />
            </div>

            <div class="field">
              <label>{{ t('admin.finance.freeShippingText') }}</label>
              <input type="text" v-model="checkoutFreeShippingSuccessText" placeholder="Örn: 🎉 Tebrikle, kargonuz ücretsizdir!" />
            </div>
          </div>

          <button type="submit" class="btn-primary">AYARLARI KAYDET</button>
          <div v-if="isSaved" class="success-msg">{{ t('admin.finance.savedToast') }}</div>
        </form>
      </div>

      <!-- Simulation Panel -->
      <div class="panel sim-panel">
        <h3>{{ t('admin.finance.simSection') }}</h3>
        <p class="help-text">{{ t('admin.finance.simHint') }}</p>

        <div class="sim-box clay-inset">
          <div class="field">
            <label>{{ t('admin.finance.testPrice') }}</label>
            <div class="input-with-icon">
              <span class="icon">$</span>
              <input type="number" v-model="testUsd" />
            </div>
          </div>

          <div class="sim-results">
            <div class="result-row">
              <span class="lbl">{{ t('admin.finance.simRaw') }}</span>
              <span class="val raw-val">{{ simulatedPrice.raw }} KGS</span>
            </div>
            <div class="result-row total">
              <span class="lbl">{{ t('admin.finance.simFinal') }}</span>
              <span class="val final-val">{{ simulatedPrice.final }} KGS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page { flex: 1; padding: 32px; overflow-y: auto; color: #fff; }
.topbar { margin-bottom: 32px; }
.topbar h2 { font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 800; color: #f4f4f5; margin: 0 0 8px 0; }
.subtitle { color: #a1a1aa; font-family: 'Montserrat', sans-serif; font-size: 0.95rem; }

.clay-inset {
  background-color: #121214;
  border-radius: 12px;
  box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.6), inset -4px -4px 8px rgba(39, 39, 42, 0.2);
  padding: 24px;
}

h3 { font-family: 'Outfit', sans-serif; font-size: 1.3rem; margin-bottom: 24px; color: #f4f4f5; font-weight: 700; }
.help-text { font-size: 0.85rem; color: #a1a1aa; margin-bottom: 16px; }

/* Form */
.finance-form { display: flex; flex-direction: column; gap: 24px; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field label { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #a1a1aa; letter-spacing: 1px; }
.field input, .clay-select {
  padding: 12px 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px; color: #fff; font-family: 'Montserrat', sans-serif; font-size: 1rem; outline: none; transition: border-color 0.2s;
}
.field input:focus, .clay-select:focus { border-color: #BC4A3C; }
.clay-select option { background: #18181b; color: #fff; }

/* Number input + fetch button combo */
.input-with-button {
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.input-with-button input { flex: 1; }

.btn-fetch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #93c5fd;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  border-radius: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}
.btn-fetch:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%);
  border-color: rgba(59, 130, 246, 0.7);
  color: #bfdbfe;
}
.btn-fetch:disabled { opacity: 0.5; cursor: wait; }
.spin { animation: rotate 0.8s linear infinite; }
@keyframes rotate { to { transform: rotate(360deg); } }

/* Rate metadata line */
.rate-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
  font-size: 0.8rem;
  color: #a1a1aa;
  font-family: 'Montserrat', sans-serif;
}
.rate-meta__dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
  flex-shrink: 0;
}
.rate-meta__dot.is-stale { background: #f59e0b; box-shadow: 0 0 8px rgba(245, 158, 11, 0.5); }
.rate-meta__source strong, .rate-meta__time strong { color: #e4e4e7; font-weight: 700; }
.rate-meta__sep { color: #52525b; }
.rate-meta.is-stale .rate-meta__source strong, .rate-meta.is-stale .rate-meta__time strong { color: #fbbf24; }
.rate-meta__warn { color: #fbbf24; font-weight: 700; }

.rate-error {
  margin-top: 6px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 0.85rem;
}

/* Toggle switch */
.toggle-field { padding: 16px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; }
.toggle-label { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; text-transform: none; letter-spacing: 0; }
.toggle-label input { display: none; }
.toggle-track {
  flex-shrink: 0;
  width: 44px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  position: relative;
  transition: background 0.2s;
  margin-top: 2px;
}
.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s, background 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
.toggle-label input:checked + .toggle-track { background: #BC4A3C; }
.toggle-label input:checked + .toggle-track .toggle-thumb { transform: translateX(20px); }
.toggle-text { display: flex; flex-direction: column; gap: 2px; }
.toggle-text strong { color: #f4f4f5; font-size: 0.9rem; text-transform: none; letter-spacing: 0; font-weight: 700; }
.toggle-text small { color: #a1a1aa; font-size: 0.78rem; line-height: 1.4; font-weight: 400; }

.input-with-icon { position: relative; display: flex; align-items: center; }
.input-with-icon .icon { position: absolute; left: 16px; color: #a1a1aa; font-weight: 700; }
.input-with-icon input { padding-left: 36px; width: 100%; }

.btn-primary {
  padding: 16px;
  background: linear-gradient(135deg, #FF3B30 0%, #D8412F 100%);
  color: #fff; font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem;
  border: none; border-radius: 12px; cursor: pointer; transition: transform 0.2s;
  box-shadow: inset 2px 2px 6px rgba(255, 255, 255, 0.2), inset -2px -2px 6px rgba(0, 0, 0, 0.6);
}
.btn-primary:active { transform: scale(0.96); }

.success-msg { color: #10b981; font-weight: 600; font-size: 0.9rem; text-align: center; }

/* Simulation */
.sim-results { margin-top: 24px; display: flex; flex-direction: column; gap: 16px; border-top: 1px dashed rgba(255, 255, 255, 0.1); padding-top: 24px; }
.result-row { display: flex; justify-content: space-between; align-items: center; font-family: 'Outfit', sans-serif; }
.result-row .lbl { color: #a1a1aa; font-weight: 600; }
.raw-val { font-size: 1.2rem; color: #71717a; text-decoration: line-through; }
.total .lbl { color: #f4f4f5; font-size: 1.1rem; }
.final-val { font-size: 2rem; font-weight: 900; color: #BC4A3C; }

/* Keep the live simulation visible while scrolling the long settings form.
   The grid already uses align-items: start, so the sticky cell works inside
   the scrollable .admin-page. Only on the 2-column layout (≥900px). */
@media (min-width: 900px) {
  .sim-panel {
    position: sticky;
    top: 24px;
    align-self: start;
  }
}
</style>
