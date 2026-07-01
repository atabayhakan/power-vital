<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const API = '/api/v1';

interface Product { id: string; barcode: string; name: string; basePriceKgs: number; stockQuantity: number; }
interface CartItem { product: Product; quantity: number; }

const products = ref<Product[]>([]);
const cart = ref<CartItem[]>([]);
const searchQuery = ref('');
const loading = ref(true);
const processing = ref(false);
const lastReceipt = ref<any>(null);
const paymentMethod = ref<'cash' | 'qr_transfer'>('cash');

onMounted(async () => {
  try {
    const res = await axios.get(`${API}/products`);
    products.value = res.data;
  } catch { products.value = []; }
  loading.value = false;
});

/* ─── Search (by name or barcode) ─── */
const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value;
  const q = searchQuery.value.toLowerCase();
  return products.value.filter(p =>
    p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q)
  );
});

/* ─── Cart ─── */
const addToCart = (p: Product) => {
  const existing = cart.value.find(c => c.product.id === p.id);
  if (existing) { existing.quantity++; } else { cart.value.push({ product: p, quantity: 1 }); }
};
const removeFromCart = (idx: number) => cart.value.splice(idx, 1);
const updateQty = (idx: number, delta: number) => {
  cart.value[idx].quantity += delta;
  if (cart.value[idx].quantity <= 0) cart.value.splice(idx, 1);
};

const cartTotal = computed(() => cart.value.reduce((s, c) => s + Number(c.product.basePriceKgs) * c.quantity, 0));
const cartCount = computed(() => cart.value.reduce((s, c) => s + c.quantity, 0));

/* ─── Checkout ─── */
const targetUser = ref<any>(null);
const searchUserQuery = ref('');
const userSearchResults = ref<any[]>([]);

const searchUsers = async () => {
  if (searchUserQuery.value.length < 3) {
    userSearchResults.value = [];
    return;
  }
  try {
    const res = await axios.get(`${API}/checkout/search-users?q=${searchUserQuery.value}`);
    userSearchResults.value = res.data;
  } catch (err) {
    console.error('Kullanıcı arama hatası', err);
  }
};

const selectUser = (user: any) => {
  targetUser.value = user;
  searchUserQuery.value = '';
  userSearchResults.value = [];
};

const completeSale = async () => {
  if (cart.value.length === 0) return;
  processing.value = true;
  try {
    const payload: any = {
      cart: cart.value.map(c => ({ productId: c.product.id, quantity: c.quantity })),
      orderType: 'pos',
      paymentMethod: paymentMethod.value
    };

    if (targetUser.value) {
      payload.targetUserId = targetUser.value.id;
      payload.customerName = targetUser.value.name;
      payload.customerPhone = targetUser.value.phone || '-';
    } else {
      payload.customerName = 'POS Satış';
      payload.customerPhone = '-';
    }

    const res = await axios.post(`${API}/checkout`, payload);
    lastReceipt.value = {
      orderId: res.data.orderId,
      total: res.data.totalKgs || cartTotal.value, // Backend'in indirimli hesapladığı tutar dönebilir
      items: [...cart.value],
      time: new Date().toLocaleTimeString('tr-TR'),
      method: paymentMethod.value,
      customer: targetUser.value ? targetUser.value.name : 'Anonim'
    };
    cart.value = [];
    targetUser.value = null; // Sıfırla
    // Refresh product stock
    const pRes = await axios.get(`${API}/products`);
    products.value = pRes.data;
  } catch (err: any) {
    alert(err.response?.data?.error || t('pos.saleFailed'));
  }
  processing.value = false;
};

/* ─── Barcode scanner (Enter key) ─── */
const onBarcodeInput = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    const found = products.value.find(p => p.barcode === searchQuery.value.trim());
    if (found) { addToCart(found); searchQuery.value = ''; }
  }
};

const fmtPrice = (n: number) => Math.round(n).toLocaleString('ru-RU') + ' сом';
</script>

<template>
<div class="pos">
  <div class="pos-header panel" style="--panel-padding: 16px 24px; margin-bottom: 20px;">
    <h1>⚡ {{ t('pos.title') }}</h1>
    <span class="pos-time">{{ new Date().toLocaleDateString('ru-RU') }}</span>
  </div>

  <div class="pos-grid">
    <!-- LEFT: Product Catalog -->
    <div class="pos-catalog panel">
      <input v-model="searchQuery" @keydown="onBarcodeInput" class="pos-search"
        :placeholder="'🔍 ' + t('pos.searchPlaceholder')" autofocus />

      <div class="pos-products" v-if="!loading">
        <button v-for="p in filteredProducts" :key="p.id" class="pos-product-btn dark-inset" @click="addToCart(p)"
          :class="{ 'low-stock': p.stockQuantity <= 5 }">
          <span class="pos-p-name">{{ p.name }}</span>
          <span class="pos-p-price">{{ fmtPrice(Number(p.basePriceKgs)) }}</span>
          <span class="pos-p-stock">{{ t('pos.stockLeft') }} {{ p.stockQuantity }}</span>
        </button>
      </div>
      <div v-else class="pos-loading">{{ t('pos.loading') }}</div>
    </div>

    <!-- RIGHT: Cart + Checkout -->
    <div class="pos-cart-panel panel">
      <div class="pos-cart-header">
        <h2>🛒 {{ t('pos.cartTitle') }} ({{ cartCount }})</h2>
      </div>

      <!-- MÜŞTERİ / DİSTRİBÜTÖR ARAMA -->
      <div class="pos-user-search dark-inset" style="padding: 12px; margin-bottom: 12px; border-radius: 8px;">
        <div v-if="targetUser" class="pos-target-user" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-weight: bold; color: var(--accent-blue);">{{ targetUser.name }}</span>
            <span style="font-size: 0.8rem; margin-left: 8px; padding: 2px 6px; background: rgba(255,255,255,0.1); border-radius: 4px;">
              {{ targetUser.role === 'distributor' ? 'Distribütör' : 'Müşteri' }}
            </span>
            <div style="font-size: 0.8rem; color: #aaa; margin-top: 4px;">
              {{ targetUser.role === 'distributor' ? 'İndirim & PV uygulanacak' : 'Standart Perakende' }}
            </div>
          </div>
          <button @click="targetUser = null" style="background: var(--danger-color); color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">✕ İptal</button>
        </div>
        <div v-else>
          <div style="display: flex; gap: 8px;">
            <input v-model="searchUserQuery" @input="searchUsers" placeholder="Müşteri/Distribütör Ara (isim/tel)..." class="pos-search" style="flex: 1; padding: 8px; margin: 0; font-size: 0.9rem;" />
          </div>
          <div v-if="userSearchResults.length > 0" style="margin-top: 8px; background: var(--bg-dark); border-radius: 4px; max-height: 120px; overflow-y: auto;">
            <div v-for="u in userSearchResults" :key="u.id" @click="selectUser(u)" style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; display: flex; justify-content: space-between;">
              <span>{{ u.name }}</span>
              <span style="color: var(--accent-blue); font-size: 0.8rem;">{{ t('admin.role.' + u.role) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="pos-cart-items" v-if="cart.length">
        <div v-for="(item, i) in cart" :key="item.product.id" class="pos-cart-row dark-inset">
          <div class="pos-cart-info">
            <span class="pos-cart-name">{{ item.product.name }}</span>
            <span class="pos-cart-unit">{{ fmtPrice(Number(item.product.basePriceKgs)) }} × {{ item.quantity }}</span>
          </div>
          <div class="pos-cart-actions">
            <button @click="updateQty(i, -1)" class="pos-qty-btn">−</button>
            <span class="pos-qty">{{ item.quantity }}</span>
            <button @click="updateQty(i, 1)" class="pos-qty-btn">+</button>
            <button @click="removeFromCart(i)" class="pos-remove">✕</button>
          </div>
          <span class="pos-cart-line-total">{{ fmtPrice(Number(item.product.basePriceKgs) * item.quantity) }}</span>
        </div>
      </div>
      <div v-else class="pos-cart-empty">
        <span class="empty-icon">🛒</span>
        <p>{{ t('pos.emptyCart') }}</p>
      </div>

      <!-- Total + Payment -->
      <div class="pos-bottom-section">
        <div class="pos-total">
          <span>{{ t('pos.total') }}</span> <b>{{ fmtPrice(cartTotal) }}</b>
        </div>
        <div class="pos-pay-method">
          <button :class="{ active: paymentMethod === 'cash' }" @click="paymentMethod = 'cash'">💵 {{ t('pos.cash') }}</button>
          <button :class="{ active: paymentMethod === 'qr_transfer' }" @click="paymentMethod = 'qr_transfer'">📱 {{ t('pos.qrTransfer') }}</button>
        </div>
        <button class="pos-checkout-btn" :disabled="cart.length === 0 || processing" @click="completeSale">
          {{ processing ? t('pos.processing') : '✅ ' + t('pos.checkoutBtn') }}
        </button>

        <!-- Last receipt -->
        <div v-if="lastReceipt" class="pos-receipt dark-inset">
          <h3>🧾 {{ t('pos.lastReceipt') }}</h3>
          <div class="pos-receipt-row" v-for="ri in lastReceipt.items" :key="ri.product.id">
            {{ ri.product.name }} × {{ ri.quantity }} = {{ fmtPrice(Number(ri.product.basePriceKgs) * ri.quantity) }}
          </div>
          <div class="pos-receipt-total">{{ t('pos.receiptTotal') }} {{ fmtPrice(lastReceipt.total) }} ({{ lastReceipt.method === 'cash' ? t('pos.receiptCash') : t('pos.receiptQr') }})</div>
          <small>{{ lastReceipt.time }} • #{{ lastReceipt.orderId?.slice(0,8) }}</small>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<style scoped>
.pos { height: 100%; width: 100%; overflow: hidden; display: flex; flex-direction: column; background: #0e1117; color: #f8f9fa; font-family: 'Outfit', 'Inter', sans-serif; padding: 20px; gap: 20px; }

.glass-panel-header { display: none; }
.glass-panel { display: none; }
.dark-inset { background: rgba(0, 0, 0, 0.2); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05); }

.pos-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; }
.pos-header h1 { font-size: 22px; font-weight: 800; margin: 0; color: #fff; }
.pos-time { color: #a1a1aa; font-size: 14px; font-weight: 500; }

.pos-grid { display: grid; grid-template-columns: 1.5fr 1fr; flex: 1; overflow: hidden; gap: 20px; }

/* Catalog */
.pos-catalog { display: flex; flex-direction: column; overflow: hidden; padding: 20px; }
.pos-search { padding: 16px 20px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #fff; font-size: 16px; outline: none; font-family: inherit; margin-bottom: 20px; transition: border-color 0.2s; }
.pos-search:focus { border-color: #16a34a; box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2); }
.pos-products { flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; align-content: start; padding-right: 8px; }
.pos-products::-webkit-scrollbar { width: 6px; }
.pos-products::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }

.pos-product-btn { padding: 16px; cursor: pointer; text-align: left; transition: all .2s; display: flex; flex-direction: column; gap: 6px; color: #f8f9fa; }
.pos-product-btn:hover { border-color: #16a34a; background: rgba(22, 163, 74, 0.1); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
.pos-product-btn:active { transform: translateY(0); }
.pos-product-btn.low-stock { border-color: rgba(245, 158, 11, 0.3); }
.pos-p-name { font-size: 15px; font-weight: 700; line-height: 1.3; color: #fff; }
.pos-p-price { font-size: 18px; font-weight: 800; color: #4ade80; }
.pos-p-stock { font-size: 12px; color: #a1a1aa; }
.pos-loading { padding: 40px; text-align: center; color: #a1a1aa; font-size: 16px; }

/* Cart panel */
.pos-cart-panel { display: flex; flex-direction: column; overflow: hidden; padding: 20px; }
.pos-cart-header { padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 16px; }
.pos-cart-header h2 { font-size: 20px; font-weight: 800; margin: 0; color: #fff; }

.pos-cart-items { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-right: 8px; }
.pos-cart-items::-webkit-scrollbar { width: 6px; }
.pos-cart-items::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }

.pos-cart-row { display: flex; align-items: center; gap: 12px; padding: 16px; }
.pos-cart-info { flex: 1; }
.pos-cart-name { font-size: 15px; font-weight: 700; display: block; color: #fff; margin-bottom: 4px; }
.pos-cart-unit { font-size: 13px; color: #a1a1aa; }
.pos-cart-actions { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 8px; }
.pos-qty-btn { width: 32px; height: 32px; background: rgba(255,255,255,0.1); border: none; color: #fff; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 700; transition: background 0.2s; }
.pos-qty-btn:hover { background: rgba(255,255,255,0.2); }
.pos-qty { font-size: 16px; font-weight: 600; min-width: 24px; text-align: center; }
.pos-remove { background: none; border: none; color: #f43f5e; font-size: 16px; cursor: pointer; padding: 8px; transition: transform 0.2s; }
.pos-remove:hover { transform: scale(1.1); }
.pos-cart-line-total { font-size: 16px; font-weight: 800; color: #4ade80; min-width: 90px; text-align: right; }

.pos-cart-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; color: #a1a1aa; gap: 12px; }
.empty-icon { font-size: 48px; opacity: 0.5; }
.pos-cart-empty p { font-size: 15px; font-weight: 500; }

/* Bottom Checkout Section */
.pos-bottom-section { margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; }
.pos-total { display: flex; justify-content: space-between; align-items: center; font-size: 20px; font-weight: 600; color: #fff; margin-bottom: 20px; }
.pos-total b { color: #4ade80; font-size: 28px; font-weight: 800; }

.pos-pay-method { display: flex; gap: 12px; margin-bottom: 20px; }
.pos-pay-method button { flex: 1; padding: 14px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: #a1a1aa; border-radius: 12px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all .2s; }
.pos-pay-method button:hover { background: rgba(255,255,255,0.05); }
.pos-pay-method button.active { border-color: #16a34a; color: #4ade80; background: rgba(22, 163, 74, 0.15); box-shadow: 0 0 0 1px #16a34a; }

.pos-checkout-btn { width: 100%; padding: 18px; background: linear-gradient(135deg, #16a34a, #15803d); color: #fff; border: none; border-radius: 12px; font-size: 18px; font-weight: 800; cursor: pointer; transition: all .2s; box-shadow: 0 8px 24px rgba(22, 163, 74, 0.3); margin-bottom: 16px; }
.pos-checkout-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(22, 163, 74, 0.4); }
.pos-checkout-btn:active { transform: translateY(0); }
.pos-checkout-btn:disabled { background: #3f3f46; color: #a1a1aa; box-shadow: none; cursor: not-allowed; transform: none; }

.pos-receipt { padding: 16px; }
.pos-receipt h3 { font-size: 14px; font-weight: 700; color: #a1a1aa; margin: 0 0 12px 0; display: flex; align-items: center; gap: 6px; }
.pos-receipt-row { font-size: 13px; padding: 4px 0; color: #e4e4e7; border-bottom: 1px dashed rgba(255,255,255,0.1); }
.pos-receipt-total { font-weight: 800; color: #4ade80; margin-top: 12px; font-size: 15px; }
.pos-receipt small { color: #71717a; font-size: 11px; display: block; margin-top: 8px; }

@media (max-width: 900px) {
  .pos-grid { grid-template-columns: 1fr; }
  .pos-catalog { max-height: 50vh; }
  .pos-products { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
  .pos-header h1 { font-size: 18px; }
}
@media (max-width: 480px) {
  .pos { padding: 10px; gap: 10px; }
  .pos-products { grid-template-columns: repeat(2, 1fr); }
  .pos-cart-line-total { min-width: 60px; font-size: 14px; }
  .pos-total b { font-size: 22px; }
}
</style>
