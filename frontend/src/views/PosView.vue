<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

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
const completeSale = async () => {
  if (cart.value.length === 0) return;
  processing.value = true;
  try {
    const res = await axios.post(`${API}/checkout`, {
      cart: cart.value.map(c => ({ productId: c.product.id, quantity: c.quantity })),
      customerName: 'POS Satış',
      customerPhone: '-',
      orderType: 'pos',
      paymentMethod: paymentMethod.value
    });
    lastReceipt.value = {
      orderId: res.data.orderId,
      total: cartTotal.value,
      items: [...cart.value],
      time: new Date().toLocaleTimeString('tr-TR'),
      method: paymentMethod.value
    };
    cart.value = [];
    // Refresh product stock
    const pRes = await axios.get(`${API}/products`);
    products.value = pRes.data;
  } catch (err: any) {
    alert(err.response?.data?.error || 'Satış başarısız!');
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
  <div class="pos-header">
    <h1>⚡ POS — Быстрая Продажа</h1>
    <span class="pos-time">{{ new Date().toLocaleDateString('ru-RU') }}</span>
  </div>

  <div class="pos-grid">
    <!-- LEFT: Product Catalog -->
    <div class="pos-catalog">
      <input v-model="searchQuery" @keydown="onBarcodeInput" class="pos-search"
        placeholder="🔍 Поиск по названию или штрихкоду..." autofocus />

      <div class="pos-products" v-if="!loading">
        <button v-for="p in filteredProducts" :key="p.id" class="pos-product-btn" @click="addToCart(p)"
          :class="{ 'low-stock': p.stockQuantity <= 5 }">
          <span class="pos-p-name">{{ p.name }}</span>
          <span class="pos-p-price">{{ fmtPrice(Number(p.basePriceKgs)) }}</span>
          <span class="pos-p-stock">Ост: {{ p.stockQuantity }}</span>
        </button>
      </div>
      <div v-else class="pos-loading">Загрузка...</div>
    </div>

    <!-- RIGHT: Cart + Checkout -->
    <div class="pos-cart-panel">
      <div class="pos-cart-header">
        <h2>🛒 Чек ({{ cartCount }})</h2>
      </div>

      <div class="pos-cart-items" v-if="cart.length">
        <div v-for="(item, i) in cart" :key="item.product.id" class="pos-cart-row">
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
      <div v-else class="pos-cart-empty">Чек пуст. Нажмите на товар для добавления.</div>

      <!-- Total + Payment -->
      <div class="pos-total">
        <span>ИТОГО:</span> <b>{{ fmtPrice(cartTotal) }}</b>
      </div>
      <div class="pos-pay-method">
        <button :class="{ active: paymentMethod === 'cash' }" @click="paymentMethod = 'cash'">💵 Наличные</button>
        <button :class="{ active: paymentMethod === 'qr_transfer' }" @click="paymentMethod = 'qr_transfer'">📱 QR/Перевод</button>
      </div>
      <button class="pos-checkout-btn" :disabled="cart.length === 0 || processing" @click="completeSale">
        {{ processing ? 'Обработка...' : '✅ Завершить продажу' }}
      </button>

      <!-- Last receipt -->
      <div v-if="lastReceipt" class="pos-receipt">
        <h3>Последний чек</h3>
        <div class="pos-receipt-row" v-for="ri in lastReceipt.items" :key="ri.product.id">
          {{ ri.product.name }} × {{ ri.quantity }} = {{ fmtPrice(Number(ri.product.basePriceKgs) * ri.quantity) }}
        </div>
        <div class="pos-receipt-total">Итого: {{ fmtPrice(lastReceipt.total) }} ({{ lastReceipt.method === 'cash' ? 'Нал.' : 'QR' }})</div>
        <small>{{ lastReceipt.time }} • #{{ lastReceipt.orderId?.slice(0,8) }}</small>
      </div>
    </div>
  </div>
</div>
</template>

<style scoped>
.pos { height: 100%; width: 100%; overflow: hidden; display: flex; flex-direction: column; background: #0e1117; color: #f0f0f0; font-family: 'Inter', sans-serif; }
.pos-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-bottom: 1px solid #1e2130; }
.pos-header h1 { font-size: 18px; font-weight: 700; }
.pos-time { color: #8b92a5; font-size: 13px; }

.pos-grid { display: grid; grid-template-columns: 1.5fr 1fr; flex: 1; overflow: hidden; }

/* Catalog */
.pos-catalog { display: flex; flex-direction: column; border-right: 1px solid #1e2130; overflow: hidden; }
.pos-search { padding: 14px 16px; background: #161923; border: none; border-bottom: 1px solid #1e2130; color: #f0f0f0; font-size: 15px; outline: none; font-family: inherit; }
.pos-search:focus { background: #1a1e2e; }
.pos-products { flex: 1; overflow-y: auto; padding: 10px; display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; align-content: start; }
.pos-product-btn { background: #1a1e2e; border: 1px solid #2a2e3e; border-radius: 8px; padding: 14px 12px; cursor: pointer; text-align: left; transition: all .15s; display: flex; flex-direction: column; gap: 4px; color: #f0f0f0; }
.pos-product-btn:hover { border-color: #16a34a; background: #1e2538; }
.pos-product-btn.low-stock { border-color: #f59e0b33; }
.pos-p-name { font-size: 13px; font-weight: 600; line-height: 1.3; }
.pos-p-price { font-size: 15px; font-weight: 700; color: #16a34a; }
.pos-p-stock { font-size: 11px; color: #8b92a5; }
.pos-loading { padding: 40px; text-align: center; color: #8b92a5; }

/* Cart panel */
.pos-cart-panel { display: flex; flex-direction: column; overflow: hidden; }
.pos-cart-header { padding: 14px 16px; border-bottom: 1px solid #1e2130; }
.pos-cart-header h2 { font-size: 16px; font-weight: 700; }
.pos-cart-items { flex: 1; overflow-y: auto; padding: 8px 12px; }
.pos-cart-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #1a1e2e; }
.pos-cart-info { flex: 1; }
.pos-cart-name { font-size: 13px; font-weight: 600; display: block; }
.pos-cart-unit { font-size: 11px; color: #8b92a5; }
.pos-cart-actions { display: flex; align-items: center; gap: 4px; }
.pos-qty-btn { width: 26px; height: 26px; background: #2a2e3e; border: none; color: #f0f0f0; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 700; }
.pos-qty { font-size: 14px; min-width: 20px; text-align: center; }
.pos-remove { background: none; border: none; color: #f5365c; font-size: 14px; cursor: pointer; padding: 4px; }
.pos-cart-line-total { font-size: 13px; font-weight: 700; color: #16a34a; min-width: 80px; text-align: right; }
.pos-cart-empty { padding: 30px; text-align: center; color: #52525b; font-size: 13px; flex: 1; display: flex; align-items: center; justify-content: center; }

.pos-total { display: flex; justify-content: space-between; padding: 14px 16px; border-top: 1px solid #1e2130; font-size: 18px; }
.pos-total b { color: #16a34a; font-size: 22px; }

.pos-pay-method { display: flex; gap: 6px; padding: 0 16px 10px; }
.pos-pay-method button { flex: 1; padding: 10px; background: #1a1e2e; border: 1px solid #2a2e3e; color: #8b92a5; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all .15s; }
.pos-pay-method button.active { border-color: #16a34a; color: #16a34a; background: #16a34a11; }

.pos-checkout-btn { margin: 0 16px 12px; padding: 14px; background: #16a34a; color: #fff; border: none; border-radius: 8px; font-size: 16px; font-weight: 700; cursor: pointer; transition: background .2s; }
.pos-checkout-btn:hover { background: #15803d; }
.pos-checkout-btn:disabled { opacity: .4; cursor: not-allowed; }

.pos-receipt { margin: 0 16px 12px; padding: 12px; background: #1a1e2e; border-radius: 8px; border: 1px solid #2a2e3e; }
.pos-receipt h3 { font-size: 12px; color: #8b92a5; margin-bottom: 6px; }
.pos-receipt-row { font-size: 12px; padding: 2px 0; }
.pos-receipt-total { font-weight: 700; color: #16a34a; margin-top: 6px; font-size: 13px; }
.pos-receipt small { color: #52525b; font-size: 11px; }

@media (max-width: 768px) {
  .pos-grid { grid-template-columns: 1fr; }
  .pos-catalog { max-height: 50vh; border-right: none; border-bottom: 1px solid #1e2130; }
  .pos-products { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
  .pos-header h1 { font-size: 15px; }
}
@media (max-width: 480px) {
  .pos-products { grid-template-columns: repeat(2, 1fr); }
  .pos-cart-line-total { min-width: 60px; font-size: 12px; }
}
</style>
