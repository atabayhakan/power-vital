<script setup lang="ts">
import { ref, computed } from 'vue';
import axios from 'axios';
import { useCartStore } from '../stores/useCartStore';
import { useCurrentUser } from '../composables/useCurrentUser';
import { getFinanceSettings } from '../utils/PriceEngine';
import { useTranslate } from '../composables/useTranslate';

const { t } = useTranslate();

const cartStore = useCartStore();
const currentUser = useCurrentUser();

const financeSettings = getFinanceSettings();
const thresholdKgs = financeSettings.checkoutShippingThresholdKgs ?? 9000;
const continueShoppingText = financeSettings.checkoutContinueShoppingText || 'Siparişiniz 9.000 сом altında kaldı. Alışverişe devam etmek için tıklayınız.';
const shippingCheckboxText = financeSettings.checkoutShippingCheckboxText || 'Siparişi ödemesini yapıyorum, 9.000 сом altında sipariş verdiğim için kargo ücretini ödemeyi kabul ediyorum.';
const freeShippingSuccessText = financeSettings.checkoutFreeShippingSuccessText || '🎉 Tebrikle, kargonuz ücretsizdir!';

const shippingAccepted = ref(false);
const orderTotalKgs = computed(() => cartStore.cartTotalKgs);
const isUnderThreshold = computed(() => orderTotalKgs.value > 0 && orderTotalKgs.value < thresholdKgs);
const isFreeShipping = computed(() => orderTotalKgs.value >= thresholdKgs);

const step = ref(1); // 1=form, 2=QR+pay, 3=upload, 4=result
const form = ref({ name: '', phone: '', email: '', address: '' });
const orderId = ref('');
const totalKgs = ref(0);
const bankInfo = ref<any>({});
const qrPayload = ref('');
const qrDataUrl = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const receiptFile = ref<File | null>(null);
const receiptPreview = ref('');
const uploading = ref(false);
const verifying = ref(false);
const verifyResult = ref<any>(null);
const error = ref('');
const shakeError = ref(false);

const isLoggedIn = computed(() => !!currentUser.value?.id);

// Lightweight email validation — we only check basic shape, the
// backend Zod schema is the source of truth and re-validates.
const isEmailValid = computed(() => {
  const e = form.value.email.trim();
  if (!e) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
});

const triggerError = (msg: string) => {
  error.value = msg;
  shakeError.value = true;
  setTimeout(() => { shakeError.value = false; }, 600);
};

const submitOrder = async () => {
  error.value = '';
  if (!form.value.name || !form.value.phone) { triggerError(t('checkout.errorNamePhone')); return; }
  if (!isEmailValid.value) { triggerError(t('checkout.errorEmail')); return; }
  if (cartStore.items.length === 0) { triggerError(t('checkout.errorEmptyCart')); return; }

  try {
    const res = await axios.post('/api/v1/checkout', {
      cart: cartStore.items.map(i => ({ productId: i.id, quantity: i.quantity })),
      customerName: form.value.name,
      customerPhone: form.value.phone,
      customerEmail: form.value.email.trim() || undefined,
      address: form.value.address
    });
    orderId.value = res.data.orderId;
    totalKgs.value = res.data.totalKgs;
    bankInfo.value = res.data.bankInfo;
    qrPayload.value = res.data.qrPayload;
    
    if (bankInfo.value.customQrUrl) {
      qrDataUrl.value = bankInfo.value.customQrUrl;
    } else {
      const QRCode = await import('qrcode');
      qrDataUrl.value = await QRCode.toDataURL(qrPayload.value, { width: 280, margin: 2, color: { dark: '#18181b', light: '#ffffff' } });
    }

    step.value = 2;
    // Mark the abandonment as converted BEFORE clearing the
    // local cart so the server can match by (userId, guestId)
    // against the still-active row.
    cartStore.markConverted();
    // Record the order for the FOMO ring buffer ("3 people
    // bought this in the last 10 minutes"). Silent — the PDP
    // counter is a nice-to-have, never block the success flow.
    try {
      await axios.post('/api/v1/inventory/admin/record-order', {
        productIds: cartStore.items.map((i) => i.id)
      });
    } catch { /* noop */ }
    cartStore.clearCart();
  } catch (e: any) {
    triggerError(e.response?.data?.error || t('checkout.errorOrderFail'));
  }
};

const goToUpload = () => { step.value = 3; };

const isPdfReceipt = computed(() => receiptFile.value?.type === 'application/pdf');

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    receiptFile.value = input.files[0];
    receiptPreview.value = URL.createObjectURL(input.files[0]);
  }
};

const uploadReceipt = async () => {
  if (!receiptFile.value) return;
  uploading.value = true;
  error.value = '';
  try {
    const fd = new FormData();
    fd.append('receipt', receiptFile.value);
    await axios.post(`/api/v1/checkout/${orderId.value}/receipt`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    verifying.value = true;
    const vRes = await axios.post(`/api/v1/checkout/${orderId.value}/verify`);
    verifyResult.value = vRes.data;
    step.value = 4;
  } catch (e: any) {
    triggerError(e.response?.data?.error || t('checkout.errorOrderFail'));
  }
  uploading.value = false;
  verifying.value = false;
};

const fmtPrice = (n: number) => Math.round(n).toLocaleString('ru-RU') + ' KGS';

const fmtAmt = (n: number) => Math.round(n).toLocaleString('ru-RU');

const mismatchTitle = (extracted: number | null | undefined, total: number) => {
  if (extracted == null) return t('checkout.mismatchUnreadable');
  if (extracted < total) return t('checkout.mismatchUnderpaid');
  return t('checkout.mismatchOverpaid');
};

// Localized detail message — built on the client from the amounts so it follows
// the active language (the backend `message` field is Turkish-only and used for
// admin notifications).
const mismatchDetail = (extracted: number | null | undefined, total: number) => {
  if (extracted == null) return t('checkout.detailUnreadable');
  const params = { extracted: fmtAmt(extracted), total: fmtAmt(total) };
  return extracted < total
    ? t('checkout.detailUnderpaid', params)
    : t('checkout.detailOverpaid', params);
};

const copiedTarget = ref('');
const copyAndOpen = async (account: string, deepLink: string, targetName: string) => {
  try {
    await navigator.clipboard.writeText(account);
    copiedTarget.value = targetName;
    setTimeout(() => { copiedTarget.value = ''; }, 2000);
    window.location.href = deepLink;
  } catch (err) {
    console.error('Failed to copy', err);
  }
};
</script>

<template>
<div class="co-page">
  <nav class="co-nav glass-nav">
    <div class="wrap co-nav-row">
      <router-link to="/" class="co-brand" aria-label="Anasayfa">
        Power<span>Vital</span>
      </router-link>
      <div class="co-stepper">
        <div class="step" :class="{ 'is-active': step >= 1, 'is-complete': step > 1 }">
          <span>1</span>
          <span class="step-label">{{ t('checkout.title') }}</span>
        </div>
        <div class="step-divider"/>
        <div class="step" :class="{ 'is-active': step >= 2, 'is-complete': step > 2 }">
          <span>2</span>
          <span class="step-label">{{ t('checkout.paymentTitle') }}</span>
        </div>
        <div class="step-divider"/>
        <div class="step" :class="{ 'is-active': step >= 3, 'is-complete': step > 3 }">
          <span>3</span>
          <span class="step-label">{{ t('checkout.uploadTitle') }}</span>
        </div>
        <div class="step-divider"/>
        <div class="step" :class="{ 'is-active': step >= 4 }">
          <span>4</span>
          <span class="step-label">{{ t('checkout.successTitle') }}</span>
        </div>
      </div>
    </div>
  </nav>

  <main class="wrap co-main">
    <Transition name="fade-slide" mode="out-in">
      <!-- ═══ STEP 1 ═══ -->
      <div v-if="step === 1" class="co-layout" key="step1">
        <div class="co-content">
          <div class="co-card glass-panel">
            <h1 class="co-title">{{ t('checkout.title') }}</h1>
            <p class="co-sub">{{ t('checkout.paymentDesc') }}</p>

            <form @submit.prevent="submitOrder" class="co-form">
              <div class="form-grid">
                <div class="co-field glass-input">
                  <label>{{ t('checkout.name') }}</label>
                  <input v-model="form.name" required :placeholder="t('checkout.namePlaceholder')" />
                </div>
                <div class="co-field glass-input">
                  <label>{{ t('checkout.phone') }}</label>
                  <input v-model="form.phone" required :placeholder="t('checkout.phonePlaceholder')" />
                </div>
              </div>
              <div class="form-grid">
                <div class="co-field glass-input" :class="{ 'has-error': !isEmailValid }">
                  <label>
                    {{ t('checkout.email') }}
                    <span class="optional-tag">{{ t('checkout.optionalTag') }}</span>
                  </label>
                  <input
                    v-model="form.email"
                    type="email"
                    inputmode="email"
                    autocomplete="email"
                    :placeholder="t('checkout.emailPlaceholder')"
                  />
                  <small v-if="!isEmailValid" class="field-hint">{{ t('checkout.errorEmail') }}</small>
                </div>
                <div class="co-field glass-input">
                  <label>{{ t('checkout.address') }}</label>
                  <input v-model="form.address" :placeholder="t('checkout.addressPlaceholder')" />
                </div>
              </div>

              <!-- Guest-checkout hint + login CTA for buyers who
                   don't yet have an account. Visible to anonymous
                   shoppers only; logged-in users skip this row. -->
              <div v-if="!isLoggedIn" class="co-guest-hint">
                <span class="co-guest-icon" aria-hidden="true">👤</span>
                <div class="co-guest-text">
                  <strong>{{ t('checkout.guestCheckout') }}</strong>
                  <span>{{ t('checkout.guestHint') }}</span>
                </div>
                <router-link to="/auth" class="co-guest-cta">
                  {{ t('checkout.signupForDiscount') }}
                </router-link>
              </div>

              <div class="co-trust-badges">
                <div class="trust-badge">🔒 {{ t('checkout.secureShopping') }}</div>
                <div class="trust-badge">🚚 {{ t('checkout.fastDelivery') }}</div>
              </div>

              <p v-if="error" class="co-error" :class="{ 'shake': shakeError }">{{ error }}</p>

              <button type="submit" class="co-cta-btn shimmer-btn" :disabled="cartStore.items.length === 0">
                <span class="cta-text">{{ t('checkout.confirmAndPay').toLocaleUpperCase('tr') }}</span>
                <div class="cta-glow"/>
              </button>
            </form>
          </div>
        </div>

        <aside class="co-sidebar">
          <div class="co-cart-summary glass-panel sticky-sidebar">
            <h2 class="sidebar-title">{{ t('checkout.summary') }}</h2>

            <div v-if="isFreeShipping" class="free-shipping-banner" role="status" aria-live="polite">
              <span class="free-shipping-icon">🎉</span>
              <span class="free-shipping-text">{{ freeShippingSuccessText }}</span>
            </div>

            <template v-if="cartStore.items.length > 0">
              <div class="cart-items-list">
                <div v-for="item in cartStore.items" :key="item.id" class="co-cart-row">
                  <div class="co-cart-img-wrapper">
                     <img :src="item.imageUrl || 'https://via.placeholder.com/60'" class="co-cart-img" />
                     <span class="co-cart-badge">{{ item.quantity }}</span>
                  </div>
                  <div class="co-cart-info">
                    <span class="co-cart-name">{{ item.name }}</span>
                    <span class="co-cart-price">{{ fmtPrice(Number(item.basePriceKgs) * item.quantity) }}</span>
                  </div>
                </div>
              </div>
              <div class="co-cart-total">
                <span class="tot-label">{{ t('checkout.total') }}</span>
                <span class="tot-val">{{ fmtPrice(cartStore.cartTotalKgs) }}</span>
              </div>
            </template>
            <div v-else class="co-cart-empty">
              <span class="empty-icon">🛒</span>
              <p>{{ t('checkout.cartEmpty') }}</p>
              <router-link to="/" class="btn-outline mt-xl" style="display:inline-block">{{ t('checkout.continueShopping') }}</router-link>
            </div>
          </div>
        </aside>
      </div>

      <!-- ═══ STEP 2 ═══ -->
      <div v-else-if="step === 2" class="co-card glass-panel text-center max-w-lg" key="step2">
        <h1 class="co-title">{{ t('checkout.paymentTitle') }}</h1>
        <p class="co-sub">{{ t('checkout.paymentDesc') }}</p>

        <div v-if="isFreeShipping" class="free-shipping-banner free-shipping-banner--lg" role="status" aria-live="polite">
          <span class="free-shipping-icon">🎉</span>
          <span class="free-shipping-text">{{ freeShippingSuccessText }}</span>
        </div>

        <div class="co-pay-container">
          <div class="co-qr-box glass-inset">
            <img :src="qrDataUrl" alt="QR Code" class="co-qr-img" />
            <div class="co-qr-label">{{ t('checkout.scanQr') }}</div>
          </div>

          <div class="co-bank-info glass-inset">
            <div class="co-bank-row"><span class="co-bank-label">{{ t('checkout.total') }}:</span><b class="co-bank-amount">{{ fmtPrice(totalKgs) }}</b></div>
            <div class="co-bank-row"><span class="co-bank-label">{{ t('checkout.bankName') }}:</span><span>{{ bankInfo.bankName }}</span></div>
            <div class="co-bank-row"><span class="co-bank-label">{{ t('checkout.iban') }}:</span><span class="mono">{{ bankInfo.accountNumber }}</span></div>
            <div class="co-bank-row"><span class="co-bank-label">{{ t('checkout.accountName') }}:</span><span>{{ bankInfo.accountName }}</span></div>
            <div class="co-bank-row"><span class="co-bank-label">{{ t('checkout.orderNo') }}:</span><span class="mono">#{{ String(orderId).slice(0,8) }}</span></div>
          </div>
        </div>

        <div class="co-quick-pay" v-if="bankInfo.mbankAccount || bankInfo.kaspiAccount || bankInfo.optimaAccount">
          <p class="co-sub" style="font-size:0.85rem; margin-bottom:12px; color: var(--text-muted);">🚀 {{ t('checkout.quickPay') }}</p>
          <div class="bank-btn-group">
            <button v-if="bankInfo.mbankAccount" class="bank-btn mbank" @click="copyAndOpen(bankInfo.mbankAccount, 'mbank://', 'mbank')">
              <img src="https://www.google.com/s2/favicons?domain=mbank.kg&sz=64" alt="MBank Logo" class="bank-logo-img" />
              <span v-if="copiedTarget === 'mbank'">{{ t('checkout.copied') }}</span><span v-else>{{ t('checkout.openApp', { app: 'MBank' }) }}</span>
            </button>
            <button v-if="bankInfo.kaspiAccount" class="bank-btn kaspi" @click="copyAndOpen(bankInfo.kaspiAccount, 'https://kaspi.kz/', 'kaspi')">
              <img src="https://www.google.com/s2/favicons?domain=kaspi.kz&sz=64" alt="Kaspi Logo" class="bank-logo-img" />
              <span v-if="copiedTarget === 'kaspi'">{{ t('checkout.copied') }}</span><span v-else>{{ t('checkout.openApp', { app: 'Kaspi' }) }}</span>
            </button>
            <button v-if="bankInfo.optimaAccount" class="bank-btn optima" @click="copyAndOpen(bankInfo.optimaAccount, 'optima24://', 'optima')">
              <img src="https://www.google.com/s2/favicons?domain=optimabank.kg&sz=64" alt="Optima Logo" class="bank-logo-img" />
              <span v-if="copiedTarget === 'optima'">{{ t('checkout.copied') }}</span><span v-else>{{ t('checkout.openApp', { app: 'Optima' }) }}</span>
            </button>
          </div>
        </div>

        <div v-if="isUnderThreshold" class="shipping-threshold-box glass-inset" style="margin: 24px 0; padding: 20px; border: 1px solid var(--pv-red); text-align: center;">
          <p style="color: var(--pv-red); font-weight: 700; margin-bottom: 12px; font-size: 1.05rem;">{{ continueShoppingText }}</p>
          <router-link to="/katalog" class="btn-outline" style="display:inline-block; margin-bottom: 24px; border-color: var(--pv-red); color: var(--pv-red);">
            🛒 Alışverişe Devam Et
          </router-link>
          
          <label class="custom-checkbox" style="display: flex; align-items: flex-start; text-align: left; cursor: pointer; gap: 12px;">
            <input type="checkbox" v-model="shippingAccepted" style="margin-top: 4px; width: 20px; height: 20px; flex-shrink: 0; cursor: pointer;" />
            <span style="font-size: 0.95rem; color: var(--text-body); font-weight: 500; line-height: 1.4;">{{ shippingCheckboxText }}</span>
          </label>
        </div>

        <button class="co-cta-btn shimmer-btn" @click="goToUpload" :disabled="isUnderThreshold && !shippingAccepted" :style="isUnderThreshold && !shippingAccepted ? 'opacity: 0.5; cursor: not-allowed; filter: grayscale(1);' : ''">
          <span class="cta-text">✅ {{ t('checkout.sendReceipt').toUpperCase() }}</span>
        </button>
      </div>

      <!-- ═══ STEP 3 ═══ -->
      <div v-else-if="step === 3" class="co-card glass-panel text-center max-w-lg" key="step3">
        <h1 class="co-title">{{ t('checkout.uploadTitle') }}</h1>
        <p class="co-sub">{{ t('checkout.successDesc') }}</p>

        <div class="co-upload-zone" @click="fileInput?.click()" :class="{ 'has-file': receiptPreview }">
          <template v-if="!receiptPreview">
            <div class="co-upload-icon float-anim">📸</div>
            <p class="up-title">{{ t('checkout.uploadHint') }}</p>
            <small class="up-sub">{{ t('checkout.uploadFormats') }}</small>
          </template>
          <div v-else-if="isPdfReceipt" class="co-upload-pdf">
            <span class="co-upload-pdf-icon">📄</span>
            <span class="co-upload-pdf-name">{{ receiptFile?.name }}</span>
          </div>
          <img v-else :src="receiptPreview" class="co-upload-preview" />
        </div>
        <input ref="fileInput" type="file" accept="image/*,.pdf" @change="onFileChange" style="display:none" />

        <p v-if="error" class="co-error" :class="{ 'shake': shakeError }">{{ error }}</p>

        <button class="co-cta-btn shimmer-btn" @click="uploadReceipt" :disabled="!receiptFile || uploading || verifying">
          <span class="cta-text" v-if="uploading">📤 {{ t('checkout.uploading').toUpperCase() }}</span>
          <span class="cta-text" v-else-if="verifying">🤖 {{ t('checkout.verifying').toUpperCase() }}</span>
          <span class="cta-text" v-else>🔍 {{ t('checkout.sendReceipt').toUpperCase() }}</span>
        </button>
      </div>

      <!-- ═══ STEP 4 ═══ -->
      <div v-else-if="step === 4" class="co-card glass-panel text-center max-w-lg" key="step4">
        <div class="result-box">
          <template v-if="verifyResult?.verified">
            <div class="co-result-icon success scale-in">✨</div>
            <h1 class="co-title">{{ t('checkout.successTitle') }}</h1>
            <p class="co-sub">{{ t('checkout.successDesc') }}</p>

            <div class="co-result-details glass-inset">
              <div class="co-bank-row"><span class="co-bank-label">{{ t('checkout.orderNo') }}:</span><span class="mono">#{{ String(orderId).slice(0,8) }}</span></div>
              <div class="co-bank-row"><span class="co-bank-label">{{ t('checkout.total') }}:</span><b style="color: var(--pv-red);">{{ fmtPrice(totalKgs) }}</b></div>
              <div class="co-bank-row"><span class="co-bank-label">{{ t('orders.status') }}:</span><span class="status-badge success">{{ t('orders.completed').toUpperCase() }}</span></div>
            </div>
          </template>
          <template v-else>
            <div class="co-result-icon pending pulse">⏳</div>
            <h1 class="co-title">{{ t('orders.pending') }}</h1>
            <p class="co-sub">{{ t('checkout.verifyFail') }}</p>

            <div v-if="verifyResult" class="verify-alert glass-inset">
              <span class="verify-alert-icon">⚠️</span>
              <div class="verify-alert-body">
                <strong class="verify-alert-title">{{ mismatchTitle(verifyResult.extractedAmount, verifyResult.orderTotal) }}</strong>
                <span class="verify-alert-text">{{ mismatchDetail(verifyResult.extractedAmount, verifyResult.orderTotal) }}</span>
              </div>
            </div>

            <div class="co-result-details glass-inset">
              <div class="co-bank-row"><span class="co-bank-label">{{ t('checkout.orderNo') }}:</span><span class="mono">#{{ String(orderId).slice(0,8) }}</span></div>
              <div class="co-bank-row"><span class="co-bank-label">{{ t('checkout.total') }}:</span><b style="color: var(--pv-red);">{{ fmtPrice(totalKgs) }}</b></div>
              <div v-if="verifyResult?.extractedAmount" class="co-bank-row">
                <span class="co-bank-label">{{ t('checkout.detectedAmount') }}:</span>
                <b :style="{ color: verifyResult.extractedAmount < verifyResult.orderTotal ? '#dc2626' : '#f59e0b' }">{{ verifyResult.extractedAmount.toLocaleString('ru-RU') }} KGS</b>
              </div>
              <div class="co-bank-row"><span class="co-bank-label">{{ t('orders.status') }}:</span><span class="status-badge warning">{{ t('orders.pending').toUpperCase() }}</span></div>
            </div>
          </template>

          <router-link to="/" class="btn-outline mt-xl">← {{ t('notFound.button') }}</router-link>
        </div>
      </div>
    </Transition>
  </main>
</div>
</template>

<style scoped>
/* Background & Layout */
.co-page { min-height: 100vh; width: 100vw; background: linear-gradient(135deg, var(--surface-page), #EAE1D5); font-family: var(--font-body); color: var(--text-body); overflow-x: hidden; }
.wrap { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.max-w-lg { max-width: 680px; margin: 0 auto; }

/* Navigation & Stepper */
.glass-nav { position: sticky; top: 0; z-index: 100; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255, 255, 255, 0.4); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05); }
.co-nav-row { display: flex; align-items: center; justify-content: space-between; height: 80px; }
.co-brand { text-decoration: none; font-size: 1.5rem; font-weight: 900; font-family: var(--font-display); color: var(--text-primary); letter-spacing: -0.5px; }
.co-brand span { color: var(--pv-red); }

.co-stepper { display: flex; align-items: center; gap: 8px; }
.step { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 600; color: var(--text-muted); transition: all 0.3s; }
.step > span { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: rgba(0,0,0,0.05); font-size: 0.8rem; font-weight: 800; }
.step > span.step-label {
  width: auto; height: auto; border-radius: 0; background: none;
  font-size: 0.9rem; font-weight: 600;
}
/* Step label hidden by default on small screens, shown only on the
   active step. This stops the four long Cyrillic/Kyrgyz labels from
   overflowing a 360px viewport and squashing the logo on the left. */
.step-label { display: inline; }
.step.is-active { color: var(--text-primary); }
.step.is-active span { background: var(--pv-red); color: white; box-shadow: 0 0 12px rgba(188,74,60,0.4); }
.step.is-complete { color: var(--color-success); }
.step.is-complete span { background: var(--color-success); color: white; content: "✓"; font-size: 0; }
.step.is-complete span::before { content: "✓"; font-size: 0.9rem; }
.step-divider { width: 32px; height: 2px; background: rgba(0,0,0,0.05); border-radius: 2px; }

/* Main Content */
.co-main { padding: 48px 24px 80px; }
.co-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; align-items: start; }

.glass-panel { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.8); border-radius: 24px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
.glass-input { background: rgba(255, 255, 255, 0.7); border: 2px solid rgba(255, 255, 255, 0.9); border-radius: 12px; transition: all 0.3s; }
.glass-input:focus-within { border-color: var(--pv-red); background: white; box-shadow: 0 4px 12px rgba(188,74,60,0.1); }
.glass-inset { background: rgba(255, 255, 255, 0.4); border: 1px solid rgba(0,0,0,0.05); border-radius: 16px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.02); }

.co-title { font-family: var(--font-display); font-size: 2.2rem; font-weight: 900; color: var(--text-primary); margin: 0 0 12px 0; letter-spacing: -0.02em; line-height: 1.2; }
.co-sub { color: var(--text-secondary); font-size: 1.05rem; margin-bottom: 32px; line-height: 1.6; }

/* Forms */
.co-form { display: flex; flex-direction: column; gap: 24px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.co-field { padding: 12px 16px; display: flex; flex-direction: column; }
.co-field label { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
.co-field input { border: none; background: transparent; font-size: 1.1rem; font-family: var(--font-body); color: var(--text-primary); outline: none; width: 100%; font-weight: 500; }
.co-field input::placeholder { color: rgba(0,0,0,0.2); }
.co-field.has-error input { color: var(--color-error, #dc2626); }
.field-hint { color: var(--color-error, #dc2626); font-size: 0.78rem; font-weight: 600; margin-top: 4px; }
.optional-tag { display: inline-block; padding: 1px 6px; background: rgba(0,0,0,0.06); color: var(--text-muted, #71717a); border-radius: 4px; font-size: 0.65rem; font-weight: 700; text-transform: lowercase; letter-spacing: 0; }

/* Guest-checkout hint row — sits between the form fields and
   the trust badges. Soft callout, not aggressive. */
.co-guest-hint {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: color-mix(in oklab, var(--pv-red, #BC4A3C) 6%, transparent);
  border: 1px dashed color-mix(in oklab, var(--pv-red, #BC4A3C) 30%, transparent);
  border-radius: 12px;
  font-family: var(--font-body);
}
.co-guest-icon { font-size: 1.5rem; line-height: 1; flex-shrink: 0; }
.co-guest-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.co-guest-text strong { color: var(--text-primary, #18181b); font-weight: 700; font-size: 0.95rem; }
.co-guest-text span { color: var(--text-secondary, #3f3f46); font-size: 0.82rem; line-height: 1.4; }
.co-guest-cta {
  flex-shrink: 0;
  padding: 8px 14px;
  background: white;
  border: 1.5px solid var(--pv-red, #BC4A3C);
  color: var(--pv-red, #BC4A3C);
  font-weight: 700;
  font-size: 0.82rem;
  border-radius: 999px;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}
.co-guest-cta:hover { background: var(--pv-red, #BC4A3C); color: white; }

/* Sidebar Summary */
.co-sidebar { position: sticky; top: 120px; }
.sidebar-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; margin: 0 0 24px 0; }
.cart-items-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
.co-cart-row { display: flex; align-items: center; gap: 16px; }
.co-cart-img-wrapper { position: relative; width: 64px; height: 64px; border-radius: 12px; background: white; border: 1px solid rgba(0,0,0,0.05); flex-shrink: 0; }
.co-cart-img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
.co-cart-badge { position: absolute; top: -6px; right: -6px; background: rgba(0,0,0,0.6); color: white; font-size: 0.75rem; font-weight: 800; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.co-cart-info { flex: 1; display: flex; flex-direction: column; }
.co-cart-name { font-weight: 700; font-size: 0.95rem; color: var(--text-primary); font-family: var(--font-display); }
.co-cart-price { font-size: 0.9rem; color: var(--text-secondary); font-weight: 600; margin-top: 4px; }

.co-cart-total { display: flex; justify-content: space-between; align-items: baseline; padding-top: 24px; border-top: 2px dashed rgba(0,0,0,0.1); }
.tot-label { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); }
.tot-val { font-size: 1.8rem; font-family: var(--font-display); font-weight: 900; color: var(--pv-red); }

/* Trust Badges */
.co-trust-badges { display: flex; justify-content: center; gap: 24px; margin: 16px 0; }
.trust-badge { font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; }

/* Free Shipping Success Banner */
.free-shipping-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 20px;
  margin: 0 0 24px 0;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04));
  border: 1.5px solid var(--color-success);
  box-shadow: 0 4px 16px rgba(16,185,129,0.12);
  animation: freeShipPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.free-shipping-banner--lg { padding: 20px 28px; font-size: 1.15rem; }
.free-shipping-icon { font-size: 1.6rem; line-height: 1; }
.free-shipping-banner--lg .free-shipping-icon { font-size: 2rem; }
.free-shipping-text {
  color: var(--color-success);
  font-weight: 800;
  font-family: var(--font-display);
  letter-spacing: 0.2px;
  text-align: center;
  line-height: 1.3;
}
.free-shipping-banner--lg .free-shipping-text { font-size: 1.2rem; }
@keyframes freeShipPop {
  0% { transform: scale(0.85); opacity: 0; }
  60% { transform: scale(1.04); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

/* Buttons & CTA */
.co-cta-btn {
  position: relative; width: 100%; border: none; border-radius: 16px; padding: 22px;
  background: var(--pv-gradient); color: white; cursor: pointer;
  box-shadow: 0 10px 30px rgba(188,74,60,0.3); overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.co-cta-btn:active:not(:disabled) { transform: scale(0.98); }
.co-cta-btn:disabled { filter: grayscale(1); opacity: 0.7; cursor: not-allowed; }
.cta-text { position: relative; z-index: 2; font-family: var(--font-display); font-size: 1.2rem; font-weight: 900; letter-spacing: 1px; }

.shimmer-btn::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); transform: skewX(-20deg); animation: shimmer 3s infinite; z-index: 1; }
@keyframes shimmer { 100% { left: 200%; } }

.btn-outline { display: inline-block; padding: 16px 32px; border: 2px solid rgba(0,0,0,0.1); border-radius: 12px; font-weight: 700; color: var(--text-primary); text-decoration: none; transition: all 0.3s; }
.btn-outline:hover { background: rgba(0,0,0,0.05); }

.mt-xl { margin-top: 40px; }

/* Error & Shake */
.co-error { color: var(--color-error); font-size: 0.95rem; font-weight: 700; text-align: center; margin: 0; }
.shake { animation: shakeAnim 0.5s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shakeAnim { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }

/* Payment & QR Grid */
.co-pay-container { display: grid; grid-template-columns: auto 1fr; gap: 32px; margin-bottom: 32px; text-align: left; }
.co-qr-box { padding: 32px; display: flex; flex-direction: column; align-items: center; border: 2px dashed rgba(0,0,0,0.1); }
.co-qr-img { width: 200px; height: 200px; border-radius: 16px; mix-blend-mode: darken; }
.co-qr-label { margin-top: 16px; font-weight: 700; color: var(--text-secondary); }
.co-bank-info { padding: 32px; display: flex; flex-direction: column; justify-content: center; gap: 16px; }
.co-bank-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 8px; }
.co-bank-row:last-child { border-bottom: none; padding-bottom: 0; }
.co-bank-label { color: var(--text-secondary); font-weight: 600; }
.co-bank-amount { font-size: 2rem; font-family: var(--font-display); font-weight: 900; color: var(--pv-red); }
.mono { font-family: var(--font-mono); font-weight: 700; letter-spacing: 0.5px; }

/* Upload Zone */
.co-upload-zone { border: 3px dashed rgba(0,0,0,0.1); border-radius: 24px; padding: 60px 32px; min-height: 280px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; margin-bottom: 32px; background: rgba(255,255,255,0.4); }
.co-upload-zone:hover { border-color: var(--pv-red); background: rgba(255,255,255,0.8); }
.co-upload-zone.has-file { border-style: solid; border-color: var(--color-success); padding: 16px; }
.co-upload-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.8; }
.float-anim { animation: float 3s ease-in-out infinite; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.up-title { font-size: 1.2rem; font-weight: 800; font-family: var(--font-display); color: var(--text-primary); margin: 0 0 8px 0; }
.up-sub { font-size: 0.95rem; color: var(--text-secondary); }
.co-upload-preview { max-height: 300px; max-width: 100%; border-radius: 12px; object-fit: contain; }
.co-upload-pdf { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 24px; }
.co-upload-pdf-icon { font-size: 56px; }
.co-upload-pdf-name { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); word-break: break-all; max-width: 260px; }

/* Result */
.co-result-icon { font-size: 100px; margin-bottom: 24px; display: inline-block; }
.co-result-icon.success { color: var(--color-success); }
.co-result-icon.pending { color: var(--color-warning); }
.scale-in { animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
@keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.pulse { animation: pulseAnim 2s infinite; }
@keyframes pulseAnim { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }

.co-result-details { padding: 32px; margin-top: 32px; text-align: left; }
.status-badge { padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 0.85rem; letter-spacing: 1px; }
.status-badge.success { background: rgba(16,185,129,0.1); color: var(--color-success); border: 1px solid var(--color-success); }
.status-badge.warning { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }

/* Verify Alert (amount mismatch / unreadable) */
.verify-alert {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 20px;
  margin: 24px 0;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(245,158,11,0.14), rgba(239,68,68,0.08));
  border: 1.5px solid var(--color-warning);
  box-shadow: 0 4px 16px rgba(245,158,11,0.12);
  text-align: left;
}
.verify-alert-icon { font-size: 1.8rem; line-height: 1; flex-shrink: 0; }
.verify-alert-body { display: flex; flex-direction: column; gap: 4px; }
.verify-alert-title { color: var(--text-warning); font-weight: 800; font-family: var(--font-display); font-size: 1.05rem; }
.verify-alert-text { color: var(--text-body); font-size: 0.92rem; line-height: 1.45; }

.co-quick-pay {
  margin-top: 12px;
  margin-bottom: 24px;
}

.bank-btn-group {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.bank-btn {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 8px;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  border: none;
  transition: transform 0.2s, filter 0.2s;
  color: #fff;
}

.bank-logo-img {
  width: 18px;
  height: 18px;
  margin-right: 8px;
  border-radius: 50%;
  background: #fff; /* For contrast if needed */
  padding: 1px;
}

.bank-btn:active {
  transform: scale(0.95);
}

.bank-btn:hover {
  filter: brightness(1.1);
}

.bank-btn.mbank {
  background: #00B36B; /* MBank Green */
  box-shadow: 0 4px 12px rgba(0, 179, 107, 0.3);
}

.bank-btn.kaspi {
  background: #F14635; /* Kaspi Red */
  box-shadow: 0 4px 12px rgba(241, 70, 53, 0.3);
}

.bank-btn.optima {
  background: #E3000F; /* Optima Red */
  box-shadow: 0 4px 12px rgba(227, 0, 15, 0.3);
}

@media (max-width: 600px) {
  .co-pay-container { flex-direction: column; }
}
/* Transitions */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.fade-slide-enter-from { opacity: 0; transform: translateY(20px) scale(0.98); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-20px) scale(0.98); }

@media (max-width: 900px) {
  .co-layout { grid-template-columns: 1fr; }
  .co-sidebar { order: -1; position: static; }
  .co-pay-container { grid-template-columns: 1fr; }
  .glass-panel { padding: 24px; }
  .form-grid { grid-template-columns: 1fr; }
  .co-guest-hint { flex-wrap: wrap; }
  .co-guest-cta { width: 100%; text-align: center; }
}

/* ───── Mobile (<= 600px) ─────
   On phones the four Cyrillic/Kyrgyz step labels force the topbar
   to overflow, squashing the brand logo on the left. Restructure:
     1. Brand logo moves to the top center (its own row)
     2. Stepper drops below as a compact 4-dot row
     3. Only the active step shows its label, the rest are dot-only
     4. Brand becomes tappable and centered, easier thumb reach */
@media (max-width: 600px) {
  .co-nav { padding: 0; }
  .co-nav-row {
    flex-direction: column;
    align-items: stretch;
    height: auto;
    /* Logo hugs the very top — no top padding above the brand row
       (kullanıcı isteği: "logoyu en yukarıya al"). */
    padding: 0 12px 6px;
    gap: 4px;
  }
  .co-brand {
    align-self: center;
    font-size: 1.35rem;
    padding: 2px 0 0;
    margin-top: 0;
  }
  .co-stepper {
    justify-content: space-between;
    gap: 0;
    width: 100%;
  }
  .step { gap: 0; font-size: 0.72rem; flex: 0 0 auto; }
  .step span { width: 26px; height: 26px; font-size: 0.78rem; }
  .step-label { display: none; }
  .step.is-active .step-label {
    display: inline;
    font-size: 0.7rem;
    margin-left: 4px;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .step-divider { flex: 1; min-width: 8px; max-width: 16px; width: auto; }
}
</style>
