<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getFinanceSettings, saveFinanceSettings, fetchFinanceSettings } from '../utils/PriceEngine';
import { useTranslate } from '../composables/useTranslate';

const { t } = useTranslate();

const isSaved = ref(false);

const mbankAccount = ref('');
const kaspiAccount = ref('');
const optimaAccount = ref('');
const customQrUrl = ref('');

const checkoutShippingThresholdKgs = ref(9000);
const checkoutContinueShoppingText = ref('');
const checkoutShippingCheckboxText = ref('');
const checkoutFreeShippingSuccessText = ref('');

onMounted(async () => {
  await fetchFinanceSettings();
  const settings = getFinanceSettings();
  mbankAccount.value = settings.mbankAccount || '';
  kaspiAccount.value = settings.kaspiAccount || '';
  optimaAccount.value = settings.optimaAccount || '';
  customQrUrl.value = settings.customQrUrl || '';
  checkoutShippingThresholdKgs.value = settings.checkoutShippingThresholdKgs ?? 9000;
  checkoutContinueShoppingText.value = settings.checkoutContinueShoppingText || 'Siparişiniz 9.000 сом altında kaldı. Alışverişe devam etmek için tıklayınız.';
  checkoutShippingCheckboxText.value = settings.checkoutShippingCheckboxText || 'Siparişi ödemesini yapıyorum, 9.000 сом altında sipariş verdiğim için kargo ücretini ödemeyi kabul ediyorum.';
  checkoutFreeShippingSuccessText.value = settings.checkoutFreeShippingSuccessText || '🎉 Tebrikle, kargonuz ücretsizdir!';
});

const saveSettings = async () => {
  await saveFinanceSettings({
    mbankAccount: mbankAccount.value,
    kaspiAccount: kaspiAccount.value,
    optimaAccount: optimaAccount.value,
    customQrUrl: customQrUrl.value,
    checkoutShippingThresholdKgs: checkoutShippingThresholdKgs.value,
    checkoutContinueShoppingText: checkoutContinueShoppingText.value,
    checkoutShippingCheckboxText: checkoutShippingCheckboxText.value,
    checkoutFreeShippingSuccessText: checkoutFreeShippingSuccessText.value
  });
  isSaved.value = true;
  setTimeout(() => isSaved.value = false, 3000);
};
</script>

<template>
  <div class="admin-page animate-fade-in">
    <header class="topbar">
      <h2>{{ t('admin.finance.title') }}</h2>
      <p class="subtitle">{{ t('admin.finance.subtitle') }}</p>
    </header>

    <div class="panel" style="max-width: 640px;">
      <form @submit.prevent="saveSettings" class="finance-form">
        <div class="clay-inset" style="display: flex; flex-direction: column; gap: 16px;">
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
            <label>{{ t('admin.finance.thresholdKgs') }}</label>
            <input type="number" step="1" v-model="checkoutShippingThresholdKgs" placeholder="Örn: 9000" />
          </div>

          <div class="field">
            <label>{{ t('admin.finance.continueText') }}</label>
            <input type="text" v-model="checkoutContinueShoppingText" placeholder="Örn: Siparişiniz 9.000 сом altında kaldı. Alışverişe devam etmek için tıklayınız." />
          </div>

          <div class="field">
            <label>{{ t('admin.finance.checkboxText') }}</label>
            <input type="text" v-model="checkoutShippingCheckboxText" placeholder="Örn: Siparişi ödemesini yapıyorum, 9.000 сом altında sipariş verdiğim için kargo ücretini ödemeyi kabul ediyorum." />
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
.field input {
  padding: 12px 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px; color: #fff; font-family: 'Montserrat', sans-serif; font-size: 1rem; outline: none; transition: border-color 0.2s;
}
.field input:focus { border-color: #BC4A3C; }

.btn-primary {
  padding: 16px;
  background: linear-gradient(135deg, #FF3B30 0%, #D8412F 100%);
  color: #fff; font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem;
  border: none; border-radius: 12px; cursor: pointer; transition: transform 0.2s;
  box-shadow: inset 2px 2px 6px rgba(255, 255, 255, 0.2), inset -2px -2px 6px rgba(0, 0, 0, 0.6);
}
.btn-primary:active { transform: scale(0.96); }

.success-msg { color: #10b981; font-weight: 600; font-size: 0.9rem; text-align: center; }
</style>
