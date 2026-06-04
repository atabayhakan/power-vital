<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import QRCode from 'qrcode';

const router = useRouter();

/* ─── Types ─── */
interface CartItem { productId: string; name: string; price: number; quantity: number; image: string; }

/* ─── State ─── */
const step = ref(1); // 1=form, 2=QR+pay, 3=upload, 4=result
const cart = ref<CartItem[]>([]);
const form = ref({ name: '', phone: '', address: '' });
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

/* ─── Load cart from localStorage ─── */
onMounted(() => {
  const saved = localStorage.getItem('pv_cart');
  if (saved) {
    try { cart.value = JSON.parse(saved); } catch {}
  }
  if (cart.value.length === 0) {
    // Demo cart fallback for testing
    cart.value = [
      { productId: 'demo', name: 'Demo Ürün', price: 2000, quantity: 1, image: '' }
    ];
  }
});

const cartTotal = computed(() => cart.value.reduce((s, i) => s + i.price * i.quantity, 0));

/* ─── Step 1: Submit order ─── */
const submitOrder = async () => {
  error.value = '';
  if (!form.value.name || !form.value.phone) { error.value = 'Ad ve telefon zorunlu.'; return; }

  try {
    const res = await axios.post('/api/v1/checkout', {
      cart: cart.value.map(i => ({ productId: i.productId, quantity: i.quantity })),
      customerName: form.value.name,
      customerPhone: form.value.phone,
      address: form.value.address
    });
    orderId.value = res.data.orderId;
    totalKgs.value = res.data.totalKgs;
    bankInfo.value = res.data.bankInfo;
    qrPayload.value = res.data.qrPayload;

    // Generate QR code
    qrDataUrl.value = await QRCode.toDataURL(qrPayload.value, { width: 280, margin: 2, color: { dark: '#18181b', light: '#ffffff' } });

    step.value = 2;
    localStorage.removeItem('pv_cart'); // Clear cart after order
  } catch (e: any) {
    error.value = e.response?.data?.error || 'Sipariş oluşturulamadı.';
  }
};

/* ─── Step 2→3: Go to upload ─── */
const goToUpload = () => { step.value = 3; };

/* ─── Step 3: File selected ─── */
const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    receiptFile.value = input.files[0];
    receiptPreview.value = URL.createObjectURL(input.files[0]);
  }
};

/* ─── Step 3: Upload receipt ─── */
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

    // Auto-trigger verification
    verifying.value = true;
    const vRes = await axios.post(`/api/v1/checkout/${orderId.value}/verify`);
    verifyResult.value = vRes.data;
    step.value = 4;
  } catch (e: any) {
    error.value = e.response?.data?.error || 'Yükleme başarısız.';
  }
  uploading.value = false;
  verifying.value = false;
};

const fmtPrice = (n: number) => Math.round(n).toLocaleString('ru-RU') + ' сом';
</script>

<template>
<div class="co">
  <!-- Nav -->
  <nav class="co-nav"><div class="wrap co-nav-row">
    <router-link to="/" class="co-brand">Power<span>Vital</span></router-link>
    <div class="co-steps-indicator">
      <span :class="{ active: step >= 1 }">1. Bilgiler</span>
      <span class="sep">→</span>
      <span :class="{ active: step >= 2 }">2. Ödeme</span>
      <span class="sep">→</span>
      <span :class="{ active: step >= 3 }">3. Dekont</span>
      <span class="sep">→</span>
      <span :class="{ active: step >= 4 }">4. Sonuç</span>
    </div>
  </div></nav>

  <main class="wrap co-main">

    <!-- ═══ STEP 1: Order Form ═══ -->
    <div v-if="step === 1" class="co-card fade-in">
      <h1>Sipariş Bilgileri</h1>
      <p class="co-sub">Teslimat bilgilerinizi girin ve siparişinizi onaylayın.</p>

      <!-- Cart Summary -->
      <div class="co-cart-summary">
        <div v-for="item in cart" :key="item.productId" class="co-cart-row">
          <span class="co-cart-name">{{ item.name }}</span>
          <span class="co-cart-qty">× {{ item.quantity }}</span>
          <span class="co-cart-price">{{ fmtPrice(item.price * item.quantity) }}</span>
        </div>
        <div class="co-cart-total">
          <b>Toplam:</b> <b>{{ fmtPrice(cartTotal) }}</b>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="submitOrder" class="co-form">
        <div class="co-field"><label>Ad Soyad *</label><input v-model="form.name" required placeholder="Aydos Toktogulov" /></div>
        <div class="co-field"><label>Telefon *</label><input v-model="form.phone" required placeholder="+996 555 123 456" /></div>
        <div class="co-field"><label>Teslimat Adresi</label><input v-model="form.address" placeholder="Bişkek, Çüy pr. 123, Daire 5" /></div>
        <p v-if="error" class="co-error">{{ error }}</p>
        <button type="submit" class="co-btn">Siparişi Oluştur →</button>
      </form>
    </div>

    <!-- ═══ STEP 2: QR Payment ═══ -->
    <div v-if="step === 2" class="co-card fade-in">
      <h1>Ödeme Yapın</h1>
      <p class="co-sub">Aşağıdaki banka bilgilerine havale/EFT yapın veya QR kodu bankacılık uygulamanızla okutun.</p>

      <div class="co-pay-grid">
        <!-- QR -->
        <div class="co-qr-box">
          <img :src="qrDataUrl" alt="QR Code" class="co-qr-img" />
          <p class="co-qr-label">QR Kodu tarayın</p>
        </div>

        <!-- Bank Info -->
        <div class="co-bank-info">
          <div class="co-bank-row"><span class="co-bank-label">Tutar:</span><b class="co-bank-amount">{{ fmtPrice(totalKgs) }}</b></div>
          <div class="co-bank-row"><span class="co-bank-label">Banka:</span><span>{{ bankInfo.bankName }}</span></div>
          <div class="co-bank-row"><span class="co-bank-label">Hesap No:</span><span class="mono">{{ bankInfo.accountNumber }}</span></div>
          <div class="co-bank-row"><span class="co-bank-label">Alıcı:</span><span>{{ bankInfo.accountName }}</span></div>
          <div class="co-bank-row"><span class="co-bank-label">Sipariş No:</span><span class="mono">#{{ orderId.slice(0,8) }}</span></div>

          <div class="co-methods">
            <span class="co-method-title">Desteklenen Uygulamalar:</span>
            <div class="co-method-tags">
              <span v-for="m in bankInfo.paymentMethods" :key="m" class="co-method-tag">{{ m }}</span>
            </div>
          </div>
        </div>
      </div>

      <button class="co-btn" @click="goToUpload">✅ Havale Yaptım — Dekont Yükle →</button>
    </div>

    <!-- ═══ STEP 3: Upload Receipt ═══ -->
    <div v-if="step === 3" class="co-card fade-in">
      <h1>Dekont Yükleme</h1>
      <p class="co-sub">Bankacılık uygulamanızdan aldığınız transfer dekontunun ekran görüntüsünü yükleyin.</p>

      <div class="co-upload-zone" @click="fileInput?.click()" :class="{ 'has-file': receiptPreview }">
        <template v-if="!receiptPreview">
          <div class="co-upload-icon">📤</div>
          <p>Dekont fotoğrafını seçmek için tıklayın</p>
          <small>PNG, JPG veya PDF — Max 5MB</small>
        </template>
        <img v-else :src="receiptPreview" class="co-upload-preview" />
      </div>
      <input ref="fileInput" type="file" accept="image/*,.pdf" @change="onFileChange" style="display:none" />

      <p v-if="error" class="co-error">{{ error }}</p>

      <button class="co-btn" @click="uploadReceipt" :disabled="!receiptFile || uploading || verifying">
        <template v-if="uploading">📤 Yükleniyor...</template>
        <template v-else-if="verifying">🔍 Doğrulanıyor (OCR)...</template>
        <template v-else>🔍 Yükle & Doğrula</template>
      </button>
    </div>

    <!-- ═══ STEP 4: Result ═══ -->
    <div v-if="step === 4" class="co-card fade-in">
      <template v-if="verifyResult?.verified">
        <div class="co-result-icon success">✅</div>
        <h1>Ödeme Onaylandı!</h1>
        <p class="co-sub">Siparişiniz başarıyla doğrulandı. En kısa sürede kargoya verilecektir.</p>
        <div class="co-result-details">
          <div class="co-bank-row"><span class="co-bank-label">Sipariş No:</span><span class="mono">#{{ orderId.slice(0,8) }}</span></div>
          <div class="co-bank-row"><span class="co-bank-label">Tutar:</span><b>{{ fmtPrice(totalKgs) }}</b></div>
          <div class="co-bank-row"><span class="co-bank-label">Durum:</span><span class="status-paid">ONAYLANDI</span></div>
        </div>
      </template>
      <template v-else>
        <div class="co-result-icon pending">⏳</div>
        <h1>İnceleme Bekliyor</h1>
        <p class="co-sub">Dekontunuz yüklendi ancak otomatik doğrulama eşleşmedi. Yönetici en kısa sürede manuel kontrol yapacaktır.</p>
        <div class="co-result-details">
          <div class="co-bank-row"><span class="co-bank-label">Sipariş No:</span><span class="mono">#{{ orderId.slice(0,8) }}</span></div>
          <div class="co-bank-row"><span class="co-bank-label">Durum:</span><span class="status-pending">BEKLEMEDE</span></div>
        </div>
      </template>
      <router-link to="/" class="co-btn co-btn-outline">← Ana Sayfaya Dön</router-link>
    </div>

  </main>
</div>
</template>

<style scoped>
.co {
  min-height: 100vh; width: 100vw; background: #f7f7f8;
  font-family: 'Inter', system-ui, sans-serif; color: #18181b;
  overflow-y: auto;
}
.wrap { max-width: 720px; margin: 0 auto; padding: 0 20px; }

/* Nav */
.co-nav { background: #fff; border-bottom: 1px solid #eaeaec; position: sticky; top: 0; z-index: 100; }
.co-nav-row { display: flex; align-items: center; justify-content: space-between; height: 58px; }
.co-brand { text-decoration: none; font-size: 20px; font-weight: 800; color: #18181b; }
.co-brand span { color: #16a34a; }

.co-steps-indicator { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #a1a1aa; }
.co-steps-indicator span.active { color: #18181b; font-weight: 600; }
.co-steps-indicator .sep { color: #d4d4d8; }

/* Main */
.co-main { padding: 32px 20px 60px; }
.co-card { background: #fff; border: 1px solid #eaeaec; border-radius: 12px; padding: 32px; }
.co-card h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
.co-sub { color: #52525b; font-size: 14px; margin-bottom: 24px; }

/* Fade in */
.fade-in { animation: fadeUp .35s ease-out; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

/* Cart Summary */
.co-cart-summary { background: #fafafa; border: 1px solid #eaeaec; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
.co-cart-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 14px; }
.co-cart-name { flex: 1; }
.co-cart-qty { color: #a1a1aa; margin: 0 12px; }
.co-cart-price { font-weight: 600; }
.co-cart-total { display: flex; justify-content: space-between; border-top: 1px solid #eaeaec; padding-top: 10px; margin-top: 8px; font-size: 16px; }

/* Form */
.co-form { display: flex; flex-direction: column; gap: 14px; }
.co-field { display: flex; flex-direction: column; gap: 5px; }
.co-field label { font-size: 13px; font-weight: 600; color: #52525b; }
.co-field input { padding: 12px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; transition: border .2s; background: #fafafa; font-family: inherit; }
.co-field input:focus { border-color: #16a34a; background: #fff; }

/* Buttons */
.co-btn { display: block; width: 100%; padding: 14px; background: #18181b; color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; transition: background .2s; text-align: center; text-decoration: none; margin-top: 16px; }
.co-btn:hover { background: #16a34a; }
.co-btn:disabled { opacity: .5; cursor: not-allowed; }
.co-btn-outline { background: transparent; color: #18181b; border: 1.5px solid #eaeaec; }
.co-btn-outline:hover { border-color: #18181b; background: transparent; }

.co-error { color: #ef4444; font-size: 13px; font-weight: 500; margin: 4px 0; }

/* Payment Grid */
.co-pay-grid { display: grid; grid-template-columns: auto 1fr; gap: 28px; margin-bottom: 16px; align-items: start; }
.co-qr-box { text-align: center; }
.co-qr-img { width: 200px; height: 200px; border-radius: 12px; border: 1px solid #eaeaec; }
.co-qr-label { font-size: 12px; color: #a1a1aa; margin-top: 8px; }

.co-bank-info { display: flex; flex-direction: column; gap: 10px; }
.co-bank-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; padding: 6px 0; border-bottom: 1px solid #f4f4f5; }
.co-bank-label { color: #71717a; font-size: 13px; }
.co-bank-amount { font-size: 22px; color: #16a34a; }
.mono { font-family: 'SF Mono', 'Menlo', monospace; font-size: 13px; letter-spacing: .5px; }

.co-methods { margin-top: 8px; }
.co-method-title { font-size: 12px; color: #a1a1aa; }
.co-method-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.co-method-tag { padding: 4px 10px; background: #f0fdf4; color: #16a34a; font-size: 11px; font-weight: 600; border-radius: 4px; }

/* Upload Zone */
.co-upload-zone { border: 2px dashed #d4d4d8; border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; transition: border-color .2s; min-height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.co-upload-zone:hover { border-color: #16a34a; }
.co-upload-zone.has-file { padding: 12px; border-style: solid; border-color: #16a34a; }
.co-upload-icon { font-size: 42px; margin-bottom: 10px; }
.co-upload-zone p { font-size: 14px; color: #52525b; margin: 0; }
.co-upload-zone small { font-size: 12px; color: #a1a1aa; }
.co-upload-preview { max-height: 280px; max-width: 100%; border-radius: 8px; object-fit: contain; }

/* Result */
.co-result-icon { font-size: 56px; text-align: center; margin-bottom: 12px; }
.co-result-icon.success { color: #16a34a; }
.co-result-icon.pending { color: #f59e0b; }
.co-result-details { background: #fafafa; border: 1px solid #eaeaec; border-radius: 8px; padding: 16px; margin-top: 16px; }
.status-paid { color: #16a34a; font-weight: 700; }
.status-pending { color: #f59e0b; font-weight: 700; }

/* Responsive */
@media(max-width: 640px) {
  .co-steps-indicator .sep { display: none; }
  .co-steps-indicator { flex-wrap: wrap; gap: 4px; }
  .co-pay-grid { grid-template-columns: 1fr; }
  .co-qr-img { width: 180px; height: 180px; }
  .co-card { padding: 20px; }
}
</style>
