<script setup lang="ts">
import { useCartStore } from '../stores/useCartStore';
import { useRouter } from 'vue-router';
import { computed, ref, onMounted, onUnmounted } from 'vue';
import api from '../utils/api';
import { formatPrice } from '../utils/PriceEngine';
import { useGamification } from '../composables/useGamification';
import { useTranslation } from '../composables/useTranslation';
import { useTranslate } from '../composables/useTranslate';

const cartStore = useCartStore();
const { getDiscountedKgs } = useGamification();
const { tField } = useTranslation();
const { t } = useTranslate();
const router = useRouter();

const closeCart = () => { cartStore.isCartOpen = false; };
const closeCartAndExplore = () => { closeCart(); router.push('/katalog'); };
const goToCheckout = () => { closeCart(); router.push('/checkout'); };

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && cartStore.isCartOpen) closeCart();
};
onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));

// Free shipping uses the SINGLE source of truth from the cart store
// (KGS equivalent of the configured $100 USD threshold — matches checkout).
const remainingForFreeShipping = computed(() => cartStore.remainingForFreeShipping);
const shippingProgressPercent = computed(() => cartStore.shippingProgressPercent);

// Dynamic Upsell Logic
const upsellProduct = ref<any>(null);
const upsellAdding = ref(false);

onMounted(async () => {
  try {
    const res = await api.get('/products?limit=5');
    if (res.data && res.data.length > 0) {
      upsellProduct.value = res.data.find((p: any) => p.basePriceUsd < 20) || res.data[0];
    }
  } catch (e) {
    console.error('Failed to load upsell product', e);
  }
});

const addUpsell = () => {
  if (upsellProduct.value) {
    upsellAdding.value = true;
    cartStore.addToCart({
      id: upsellProduct.value.id,
      name: tField(upsellProduct.value, 'name') || upsellProduct.value.name,
      basePriceUsd: upsellProduct.value.basePriceUsd,
      imageUrl: upsellProduct.value.images?.[0]?.imageUrl || upsellProduct.value.images?.[0]
    });
    setTimeout(() => { upsellAdding.value = false; }, 600);
  }
};

let touchStartY = 0;
const onTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
const onTouchMove = (e: TouchEvent) => {
  if (e.touches[0].clientY - touchStartY > 100) closeCart();
};
</script>

<template>
  <div>
    <div class="cart-overlay" :class="{ 'is-active': cartStore.isCartOpen }" @click="closeCart"/>

    <div class="slide-cart glass-cart" :class="{ 'is-open': cartStore.isCartOpen }" role="dialog" :aria-label="t('common.cartDialog')">
      <div class="cart-drag-handle show-mobile" @touchstart="onTouchStart" @touchmove="onTouchMove"/>

      <div class="cart-header">
        <h2>🛍️ {{ t('cart.myCart') }} <span class="cart-count">({{ cartStore.cartItemCount }})</span></h2>
        <button class="close-btn btn-icon" @click="closeCart" :aria-label="t('common.closeCart')">✕</button>
      </div>

      <div class="shipping-progress" v-if="cartStore.items.length > 0">
        <div class="shipping-text-wrapper">
          <p class="shipping-text" v-if="remainingForFreeShipping > 0">
            {{ t('cart.freeShippingAdd', { amount: formatPrice(remainingForFreeShipping) + ' KGS' }) }} 📦
          </p>
          <p class="shipping-text success-text" v-else>🎉 {{ t('cart.freeShippingDone') }}</p>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" :style="{ width: shippingProgressPercent + '%' }">
            <div class="progress-glow"/>
          </div>
        </div>
      </div>

      <div class="cart-empty" v-if="cartStore.items.length === 0">
        <div class="empty-illustration">🛒</div>
        <h3>{{ t('cart.emptyTitle') }}</h3>
        <p>{{ t('cart.emptySub') }}</p>
        <button class="btn-primary" @click="closeCartAndExplore">{{ t('cart.explore') }}</button>
      </div>

      <TransitionGroup tag="div" name="cart-item" class="cart-items" v-else>
        <div class="cart-item glass-item" v-for="item in cartStore.items" :key="item.id">
          <div class="item-img" :style="{ backgroundImage: `url(${item.imageUrl || ''})` }"/>
          <div class="item-details">
            <h4 class="item-name">{{ item.name }}</h4>
            <div class="item-price">{{ formatPrice(getDiscountedKgs(item.basePriceUsd)) }} KGS</div>
            <div class="item-bottom">
              <div class="qty-controls glass-controls">
                <button class="qty-btn" @click="cartStore.updateQuantity(item.id, -1)">−</button>
                <div class="qty-val-wrapper"><span class="qty-value" :key="item.quantity">{{ item.quantity }}</span></div>
                <button class="qty-btn" @click="cartStore.updateQuantity(item.id, 1)">+</button>
              </div>
              <button class="remove-btn btn-icon" @click="cartStore.removeFromCart(item.id)">{{ t('cart.remove') }}</button>
            </div>
          </div>
        </div>

        <!-- In-Cart Upsell -->
        <div class="upsell-container glass-item" v-if="upsellProduct && !cartStore.items.find(i => i.id === upsellProduct.id)" key="upsell">
          <div class="upsell-badge pulse-badge">{{ t('cart.forYou') }}</div>
          <div class="upsell-row">
            <div class="upsell-img" :style="{ backgroundImage: `url(${upsellProduct.images?.[0]?.imageUrl || upsellProduct.images?.[0] || ''})` }"/>
            <div class="upsell-info">
              <h5 class="upsell-name">{{ tField(upsellProduct, 'name') || upsellProduct.name }}</h5>
              <span class="upsell-price">{{ formatPrice(getDiscountedKgs(upsellProduct.basePriceUsd)) }} KGS</span>
            </div>
            <button class="upsell-add-btn" :class="{'is-adding': upsellAdding}" @click="addUpsell">+</button>
          </div>
        </div>
      </TransitionGroup>

      <div class="cart-footer glass-footer" v-if="cartStore.items.length > 0">
        <div class="total-row">
          <span>{{ t('cart.subtotal') }}</span>
          <span class="total-price">{{ formatPrice(cartStore.cartTotalKgs) }} <span class="total-currency">KGS</span></span>
        </div>
        <button class="checkout-btn btn-primary btn-block shimmer-btn" @click="goToCheckout">
          {{ t('cart.secureCheckout') }} →
        </button>
        <p class="secure-checkout">🔒 {{ t('cart.sslSecure') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cart-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px); opacity: 0; visibility: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); z-index: 900;
}
.cart-overlay.is-active { opacity: 1; visibility: visible; }

.slide-cart {
  position: fixed; top: 0; right: 0; height: 100dvh; width: 440px; max-width: 100vw;
  background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(24px) saturate(180%);
  z-index: 1000; transform: translateX(100%); transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.5s;
  visibility: hidden;
  display: flex; flex-direction: column; box-shadow: -10px 0 40px rgba(0,0,0,0.1);
  border-left: 1px solid rgba(255,255,255,0.4);
}
.slide-cart.is-open { transform: translateX(0); visibility: visible; }

.cart-drag-handle { width: 48px; height: 5px; background: rgba(0,0,0,0.2); border-radius: 10px; margin: 12px auto 0; flex-shrink: 0; }

.cart-header { display: flex; align-items: center; justify-content: space-between; padding: 24px; border-bottom: 1px solid rgba(0,0,0,0.05); }
.cart-header h2 { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0; }
.cart-count { color: var(--text-muted); font-size: 1.1rem; }
.close-btn { font-size: 1.4rem; color: var(--text-primary); background: rgba(0,0,0,0.05); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.close-btn:hover { background: rgba(0,0,0,0.1); transform: rotate(90deg); }

.shipping-progress { padding: 16px 24px; background: rgba(0,0,0,0.02); flex-shrink: 0; }
.shipping-text-wrapper { min-height: 24px; margin-bottom: 8px; }
.shipping-text { font-size: 0.9rem; color: var(--text-secondary); margin: 0; text-align: center; }
.shipping-text strong { color: var(--pv-red); font-family: var(--font-display); }
.success-text { color: var(--color-success); font-weight: 800; animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes pop { 0% { transform: scale(0.9); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
.progress-bar-bg { height: 6px; background: rgba(0,0,0,0.05); border-radius: 6px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: var(--color-success); border-radius: 6px; position: relative; transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.progress-glow { position: absolute; top: 0; right: 0; bottom: 0; width: 40px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent); animation: progress-shine 2s infinite; }
@keyframes progress-shine { 100% { transform: translateX(40px); } }

.cart-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 16px; }
.empty-illustration { font-size: 4rem; opacity: 0.5; filter: grayscale(1); }

.cart-items { flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
.cart-items::-webkit-scrollbar { width: 6px; }
.cart-items::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 6px; }

.glass-item { background: rgba(255,255,255,0.6); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.8); border-radius: 16px; padding: 16px; display: flex; gap: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); transition: transform 0.3s; }
.glass-item:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }

.item-img { width: 80px; height: 80px; background-color: white; border-radius: 12px; background-size: contain; background-position: center; background-repeat: no-repeat; border: 1px solid rgba(0,0,0,0.05); }
.item-details { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.item-name { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0; font-family: var(--font-display); line-height: 1.2; }
.item-price { font-size: 1rem; font-weight: 900; color: var(--pv-red); margin-top: 4px; }

.item-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
.glass-controls { display: flex; align-items: center; background: rgba(255,255,255,0.8); border: 1px solid rgba(0,0,0,0.05); border-radius: 20px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
.qty-btn { width: 32px; height: 32px; border: none; background: transparent; font-size: 1.2rem; cursor: pointer; color: var(--text-primary); }
.qty-val-wrapper { width: 24px; text-align: center; font-weight: 700; font-size: 0.95rem; overflow: hidden; }
.remove-btn { color: var(--text-muted); font-size: 0.85rem; font-weight: 600; text-decoration: underline; background: none; border: none; cursor: pointer; }
.remove-btn:hover { color: var(--color-error); }

.cart-item-enter-active, .cart-item-leave-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.cart-item-enter-from { opacity: 0; transform: translateX(30px) scale(0.95); }
.cart-item-leave-to { opacity: 0; transform: scale(0.9); }

/* Upsell */
.upsell-container { position: relative; margin-top: 16px; border: 1px solid rgba(16,185,129,0.3); background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,253,244,0.8)); }
.pulse-badge { position: absolute; top: -12px; left: 16px; background: var(--color-success); color: white; font-size: 0.75rem; font-weight: 800; padding: 4px 12px; border-radius: 20px; box-shadow: 0 4px 12px rgba(16,185,129,0.4); animation: pulse 2s infinite; }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); } 70% { box-shadow: 0 0 0 6px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }
.upsell-row { display: flex; align-items: center; gap: 12px; width: 100%; }
.upsell-img { width: 60px; height: 60px; background-size: contain; background-position: center; background-repeat: no-repeat; border-radius: 8px; background-color: white; }
.upsell-info { flex: 1; }
.upsell-name { font-size: 0.9rem; font-weight: 700; margin: 0; font-family: var(--font-display); }
.upsell-price { font-size: 0.9rem; font-weight: 800; color: var(--color-success); }
.upsell-add-btn { width: 40px; height: 40px; border-radius: 50%; border: none; background: var(--color-success); color: white; font-size: 1.5rem; font-weight: 800; cursor: pointer; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.upsell-add-btn:hover { transform: scale(1.1); box-shadow: 0 8px 16px rgba(16,185,129,0.3); }
.upsell-add-btn.is-adding { transform: rotate(180deg) scale(0.8); opacity: 0.5; }

/* Footer */
.glass-footer { padding: 24px; background: rgba(255,255,255,0.9); border-top: 1px solid rgba(0,0,0,0.05); flex-shrink: 0; }
.total-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 20px; }
.total-row span:first-child { font-size: 1.1rem; font-weight: 600; color: var(--text-secondary); }
.total-price { font-size: 2rem; font-weight: 900; color: var(--text-primary); font-family: var(--font-display); }
.total-currency { font-size: 1rem; color: var(--text-muted); }
.checkout-btn { font-size: 1.1rem; padding: 18px; border-radius: 12px; position: relative; overflow: hidden; }
.shimmer-btn::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); transform: skewX(-20deg); animation: shimmer 3s infinite; }
@keyframes shimmer { 100% { left: 200%; } }
.secure-checkout { text-align: center; margin: 12px 0 0 0; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }

@media (max-width: 640px) { .slide-cart { width: 100vw; border-radius: 24px 24px 0 0; height: 90dvh; top: auto; bottom: 0; transform: translateY(100%); } .slide-cart.is-open { transform: translateY(0); } .cart-header { padding: 16px 24px; } .cart-items { padding: 16px; } .glass-footer { padding: 16px 24px calc(16px + env(safe-area-inset-bottom)); } }
</style>
