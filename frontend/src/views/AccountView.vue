<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useCurrentUser } from '../composables/useCurrentUser';
import { useAuthStore } from '../stores/useAuthStore';
import api from '../utils/api';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useTranslate } from '../composables/useTranslate';
import { useTranslation } from '../composables/useTranslation';
import { useCartStore } from '../stores/useCartStore';
import { useGamification } from '../composables/useGamification';
import { formatPrice } from '../utils/PriceEngine';
import LazyImage from '../components/common/LazyImage.vue';
import PushSettings from '../components/common/PushSettings.vue';

const currentUser = useCurrentUser();
const authStore = useAuthStore();
const router = useRouter();
const cartStore = useCartStore();
const { t, locale } = useTranslate();
const { tField } = useTranslation();
const { userDiscountRate, userLoyaltyLevel, getDiscountedKgs } = useGamification();

const user = computed(() => currentUser.value);
const recentOrders = ref<any[]>([]);
const totalOrderCount = ref(0);
const recommended = ref<any[]>([]);
const justAdded = ref<Set<string>>(new Set());

const dateLocaleMap: Record<string, string> = { tr: 'tr-TR', ru: 'ru-RU', kg: 'ru-RU' };
const fmtDate = (d: string) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString(dateLocaleMap[locale.value] || 'tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Loyalty tier from level
const tier = computed(() => {
  const lvl = userLoyaltyLevel.value;
  if (lvl >= 3) return { key: 'tierPlatinum', cls: 'platinum' };
  if (lvl === 2) return { key: 'tierGold', cls: 'gold' };
  if (lvl === 1) return { key: 'tierSilver', cls: 'silver' };
  return { key: 'tierBronze', cls: 'bronze' };
});

const walletKgs = computed(() => Number((user.value as any)?.walletBalanceKgs) || 0);

// ═══ Loyalty progress — how much spend until the next permanent-discount tier ═══
const loyaltyThresholds = [
  { level: 1, spend: 9000, discount: 5 },
  { level: 2, spend: 22000, discount: 10 },
  { level: 3, spend: 44000, discount: 15 },
  { level: 4, spend: 66000, discount: 20 },
  { level: 5, spend: 88000, discount: 25 },
];
const spendKgs = computed(() => Number((user.value as any)?.cumulativeSpendKgs || 0));
const nextLevel = computed(() => {
  const lvl = Number(user.value?.loyaltyLevel || 0);
  if (lvl >= 5) return null; // already at the top tier
  const next = loyaltyThresholds.find(th => th.level === lvl + 1);
  if (!next) return null;
  const remaining = Math.max(0, next.spend - spendKgs.value);
  const pct = Math.min(100, Math.max(3, (spendKgs.value / next.spend) * 100));
  return { targetLevel: next.level, remaining, targetDiscount: next.discount, pct };
});

const roleLabel = computed(() => {
  const r = authStore.userRole;
  if (r === 'distributor') return t('account.roleDistributor');
  if (r === 'admin') return t('account.roleAdmin');
  return t('account.roleCustomer');
});

const orderStatusLabel = (s: string) => {
  const map: Record<string, string> = {
    pending: 'orders.pending', paid: 'orders.paid', shipped: 'orders.shipped',
    completed: 'orders.completed', cancelled: 'orders.cancelled', refunded: 'orders.refunded',
  };
  return map[s] ? t(map[s]) : s;
};

const fallbackProducts = [
  { id: 'd1', name: 'Power Vital Karadut Özü', basePriceKgs: 1300, images: [{ imageUrl: 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/abdf396c-433e-4dc4-ae67-5c43f805b42d/1080/karadut-01.webp' }] },
  { id: 'd2', name: 'Power Vital Omega 3', basePriceKgs: 1800, images: [{ imageUrl: 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/33ad56e8-87bc-4af9-b202-1a893bdea410/1080/omega30.webp' }] },
  { id: 'd3', name: 'Power Vital Magnezyum', basePriceKgs: 2200, images: [] },
  { id: 'd4', name: 'Collagen Tripeptide', basePriceKgs: 1950, images: [] },
];

onMounted(async () => {
  if (!user.value) { router.push('/login'); return; }

  try {
    const res = await api.get('/orders');
    // /orders now returns a paginated envelope { items, total, ... } (was a
    // bare array). Extract the row array, and prefer the envelope's `total`
    // for the count since the returned page is capped.
    const payload = res.data;
    const list = Array.isArray(payload) ? payload : (payload?.items ?? []);
    totalOrderCount.value = (payload && typeof payload.total === 'number') ? payload.total : list.length;
    recentOrders.value = list.slice(0, 4);
  } catch (err) {
    console.error('Failed to load orders', err);
  }

  try {
    const res = await axios.get('/api/v1/products?limit=4');
    recommended.value = (res.data && res.data.length) ? res.data.slice(0, 4) : fallbackProducts;
  } catch {
    recommended.value = fallbackProducts;
  }
});

const productImg = (p: any) => p.images?.[0]?.imageUrl || '';
const productPrice = (p: any) => formatPrice(getDiscountedKgs(Number(p.basePriceKgs || 0)));

const addToCart = (p: any) => {
  cartStore.addToCart({
    id: p.id,
    name: tField(p, 'name') || p.name,
    basePriceKgs: Number(p.basePriceKgs),
    imageUrl: productImg(p),
  }, 1);
  const next = new Set(justAdded.value).add(p.id);
  justAdded.value = next;
  setTimeout(() => { const s = new Set(justAdded.value); s.delete(p.id); justAdded.value = s; }, 1500);
};

const goProduct = (id: string) => { if (!String(id).startsWith('d')) router.push(`/product/${id}`); };
const logout = () => { authStore.logout(); router.push('/login'); };
</script>

<template>
  <div class="acc">
   <div class="acc__inner">
    <!-- ═══ WELCOME ═══ -->
    <header class="acc-hero">
      <div class="acc-hero__text">
        <h1 class="acc-hero__title">{{ t('account.welcomeBack') }}, <span>{{ user?.name }}</span> 👋</h1>
        <p class="acc-hero__sub">{{ t('account.welcomeSub') }}</p>
      </div>
      <div class="acc-hero__actions">
        <router-link to="/katalog" class="acc-btn acc-btn--primary">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          {{ t('account.continueShopping') }}
        </router-link>
        <button class="acc-btn acc-btn--ghost" @click="logout">{{ t('account.logout') }}</button>
      </div>
    </header>

    <!-- ═══ STAT TILES ═══ -->
    <div class="acc-stats">
      <router-link to="/account/wallet" class="acc-stat acc-stat--link" :class="'tier-' + tier.cls">
        <span class="acc-stat__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
        </span>
        <span class="acc-stat__value">{{ t('account.' + tier.key) }}</span>
        <span class="acc-stat__label">{{ t('account.loyaltyLevel') }}</span>
      </router-link>

      <router-link to="/account/wallet" class="acc-stat acc-stat--link">
        <span class="acc-stat__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
        </span>
        <span class="acc-stat__value">%{{ userDiscountRate }}</span>
        <span class="acc-stat__label">{{ t('account.yourDiscount') }}</span>
      </router-link>

      <router-link to="/orders" class="acc-stat acc-stat--link">
        <span class="acc-stat__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>
        </span>
        <span class="acc-stat__value">{{ totalOrderCount }}</span>
        <span class="acc-stat__label">{{ t('account.totalOrders') }}</span>
      </router-link>

      <router-link to="/account/wallet" class="acc-stat acc-stat--link">
        <span class="acc-stat__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
        </span>
        <span class="acc-stat__value">{{ Math.round(walletKgs).toLocaleString('ru-RU') }} <small>KGS</small></span>
        <span class="acc-stat__label">{{ t('account.walletBalance') }}</span>
      </router-link>
    </div>

    <!-- ═══ LOYALTY PROGRESS ═══ -->
    <router-link to="/account/wallet" class="acc-progress" v-if="nextLevel">
      <div class="acc-progress__top">
        <span class="acc-progress__label">🎯 {{ t('account.nextLevelLabel', { level: nextLevel.targetLevel }) }}</span>
        <span class="acc-progress__disc">%{{ nextLevel.targetDiscount }} {{ t('account.discountWord') }}</span>
      </div>
      <div class="acc-progress__bar"><div class="acc-progress__fill" :style="{ width: nextLevel.pct + '%' }"/></div>
      <p class="acc-progress__hint">{{ t('account.remainingHint', { amount: formatPrice(nextLevel.remaining) + ' KGS' }) }}</p>
    </router-link>
    <div class="acc-progress acc-progress--max" v-else>
      <span class="acc-progress__crown">👑</span>
      <p class="acc-progress__maxmsg">{{ t('account.maxLevelMsg') }}</p>
    </div>

    <!-- ═══ CAMPAIGN BANNER ═══ -->
    <router-link to="/katalog" class="acc-campaign">
      <div class="acc-campaign__glow"/>
      <div class="acc-campaign__text">
        <span class="acc-campaign__tag">🔥 {{ t('account.campaignTitle') }}</span>
        <h2 class="acc-campaign__title">{{ t('account.campaignDesc') }}</h2>
      </div>
      <span class="acc-campaign__cta">
        {{ t('account.campaignCta') }}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </span>
    </router-link>

    <!-- ═══ RECOMMENDED PRODUCTS ═══ -->
    <section class="acc-section">
      <div class="acc-section__head">
        <div>
          <h2 class="acc-section__title">{{ t('account.recommendedTitle') }}</h2>
          <p class="acc-section__sub">{{ t('account.recommendedSub') }}</p>
        </div>
        <router-link to="/katalog" class="acc-link">{{ t('account.viewAll') }} →</router-link>
      </div>

      <div class="acc-products">
        <article v-for="p in recommended" :key="p.id" class="acc-prod" @click="goProduct(p.id)">
          <div class="acc-prod__img">
            <LazyImage v-if="productImg(p)" :src="productImg(p)" :alt="tField(p, 'name') || p.name" width="400" height="400" sizes="(max-width: 600px) 50vw, 25vw" class="acc-prod__img-el" />
            <span v-else class="acc-prod__noimg">💊</span>
          </div>
          <div class="acc-prod__body">
            <h3 class="acc-prod__name">{{ tField(p, 'name') || p.name }}</h3>
            <div class="acc-prod__price">{{ productPrice(p) }} <span>KGS</span></div>
            <button class="acc-prod__cta" :class="{ 'is-added': justAdded.has(p.id) }" @click.stop="addToCart(p)">
              <template v-if="justAdded.has(p.id)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {{ t('catalog.added') }}
              </template>
              <template v-else>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                {{ t('storefront.addToCart') }}
              </template>
            </button>
          </div>
        </article>
      </div>
    </section>

    <!-- ═══ ORDERS + PROFILE ═══ -->
    <div class="acc-grid">
      <!-- Orders -->
      <section class="acc-card">
        <div class="acc-card__head">
          <h2 class="acc-card__title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>
            {{ t('account.recentOrders') }}
          </h2>
          <router-link to="/orders" class="acc-link">{{ t('account.viewAll') }} →</router-link>
        </div>

        <div v-if="recentOrders.length === 0" class="acc-empty">
          <span class="acc-empty__icon">🛍️</span>
          <h3>{{ t('account.emptyOrdersTitle') }}</h3>
          <p>{{ t('account.emptyOrdersText') }}</p>
          <router-link to="/katalog" class="acc-btn acc-btn--primary">{{ t('account.startShopping') }}</router-link>
        </div>
        <div v-else class="acc-orders">
          <router-link v-for="o in recentOrders" :key="o.id" to="/orders" class="acc-order">
            <span class="acc-order__icon">🧾</span>
            <span class="acc-order__info">
              <span class="acc-order__id">#{{ String(o.id).slice(0, 8).toUpperCase() }}</span>
              <span class="acc-order__date">{{ fmtDate(o.createdAt) }}</span>
            </span>
            <span class="acc-order__status" :class="o.status">{{ orderStatusLabel(o.status) }}</span>
            <span class="acc-order__total">{{ Number(o.totalKgs).toFixed(0) }} <small>KGS</small></span>
          </router-link>
        </div>
      </section>

      <!-- Profile -->
      <section class="acc-card">
        <div class="acc-card__head">
          <h2 class="acc-card__title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            {{ t('account.profileInfo') }}
          </h2>
        </div>
        <div class="acc-profile">
          <div class="acc-field">
            <label>{{ t('account.name') }}</label>
            <div class="acc-field__val">{{ user?.name }}</div>
          </div>
          <div class="acc-field">
            <label>{{ t('account.email') }}</label>
            <div class="acc-field__val">{{ user?.email }}</div>
          </div>
          <div class="acc-field">
            <label>{{ t('account.role') }}</label>
            <div class="acc-field__val acc-field__val--role">{{ roleLabel }}</div>
          </div>
          <router-link to="/account/wallet" class="acc-btn acc-btn--soft acc-profile__wallet">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            {{ t('account.loyaltyCta') }}
          </router-link>
        </div>
      </section>

      <!-- Web Push opt-in (only meaningful for customers/distributors) -->
      <section v-if="user && authStore.userRole !== 'admin'" class="acc-section">
        <PushSettings />
      </section>
    </div>
   </div>
  </div>
</template>

<style scoped>
.acc {
  /* Scroll container inside the dashboard layout (.main-content is overflow:hidden) */
  height: 100%;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  font-family: 'Inter', system-ui, sans-serif;
  color: #1f2937;
  -webkit-overflow-scrolling: touch;
}
.acc__inner {
  max-width: 1160px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

/* ═══ HERO ═══ */
.acc-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}
.acc-hero__title { font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 800; margin: 0 0 6px; letter-spacing: -0.03em; color: #111827; }
.acc-hero__title span { color: #BC4A3C; }
.acc-hero__sub { margin: 0; color: #6b7280; font-size: 0.98rem; max-width: 540px; line-height: 1.5; }
.acc-hero__actions { display: flex; gap: 10px; flex-shrink: 0; }

.acc-btn { display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px; border-radius: 12px; font-family: 'Outfit', sans-serif; font-size: 0.92rem; font-weight: 700; cursor: pointer; text-decoration: none; border: none; transition: transform 0.12s, filter 0.15s, box-shadow 0.15s; white-space: nowrap; }
.acc-btn--primary { background: linear-gradient(135deg, #D4665A, #BC4A3C); color: #fff; box-shadow: 0 6px 18px rgba(188,74,60,0.3); }
.acc-btn--primary:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(188,74,60,0.4); }
.acc-btn--ghost { background: #fff; color: #6b7280; border: 1px solid #e5e7eb; }
.acc-btn--ghost:hover { color: #BC4A3C; border-color: #e7c6bf; }
.acc-btn--soft { background: #fdf4f2; color: #BC4A3C; }
.acc-btn--soft:hover { background: #f9e7e3; }

/* ═══ STAT TILES ═══ */
.acc-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.acc-stat { background: #fff; border: 1px solid #ececec; border-radius: 18px; padding: 20px; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); position: relative; overflow: hidden; }
.acc-stat__icon { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 11px; background: #fdf0ee; color: #BC4A3C; margin-bottom: 4px; }
.acc-stat__value { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 800; color: #111827; line-height: 1.1; }
.acc-stat__value small { font-size: 0.8rem; color: #9ca3af; font-weight: 600; }
.acc-stat__label { font-size: 0.82rem; color: #6b7280; font-weight: 500; }
/* Clickable stat tiles — navigate to the related page */
.acc-stat--link { text-decoration: none; color: inherit; cursor: pointer; transition: transform 0.14s, box-shadow 0.14s, border-color 0.14s; }
.acc-stat--link:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,0.07); border-color: #e7c6bf; }
.acc-stat--link:active { transform: translateY(-1px); }
/* Tier accents */
.acc-stat.tier-bronze .acc-stat__icon { background: #f6ede3; color: #b07a43; }
.acc-stat.tier-silver .acc-stat__icon { background: #eef1f4; color: #7c8794; }
.acc-stat.tier-gold .acc-stat__icon { background: #fbf3da; color: #c79a2a; }
.acc-stat.tier-platinum .acc-stat__icon { background: #eaf4f3; color: #2d8a86; }

/* ═══ LOYALTY PROGRESS ═══ */
.acc-progress {
  display: block; text-decoration: none;
  background: #fff; border: 1px solid #ececec; border-radius: 18px;
  padding: 16px 20px; margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: transform 0.14s, box-shadow 0.14s, border-color 0.14s;
}
.acc-progress:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(0,0,0,0.06); border-color: #e7c6bf; }
.acc-progress__top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.acc-progress__label { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 0.95rem; color: #111827; }
.acc-progress__disc { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 0.82rem; color: #BC4A3C; background: #fdf0ee; padding: 3px 11px; border-radius: 100px; white-space: nowrap; }
.acc-progress__bar { height: 10px; background: #f1ece6; border-radius: 100px; overflow: hidden; }
.acc-progress__fill { height: 100%; border-radius: 100px; background: linear-gradient(90deg, #E0823E, #BC4A3C); transition: width 0.7s cubic-bezier(0.16,1,0.3,1); box-shadow: 0 0 8px rgba(188,74,60,0.45); }
.acc-progress__hint { margin: 9px 0 0; font-size: 0.85rem; color: #6b7280; line-height: 1.4; }
.acc-progress--max { display: flex; align-items: center; gap: 12px; background: linear-gradient(120deg, #fbf3da, #fdf0ee); border-color: #f3dcd6; }
.acc-progress__crown { font-size: 1.7rem; flex-shrink: 0; }
.acc-progress__maxmsg { margin: 0; font-family: 'Outfit', sans-serif; font-weight: 700; color: #111827; font-size: 0.95rem; }

/* ═══ CAMPAIGN BANNER ═══ */
.acc-campaign {
  position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;
  padding: 26px 28px; margin-bottom: 30px;
  /* Brighter, more inviting warm gradient (was a dark muddy brown) */
  background: linear-gradient(120deg, #A0341F 0%, #BC4A3C 46%, #E0823E 120%);
  border-radius: 22px; text-decoration: none;
  box-shadow: 0 14px 36px rgba(188, 74, 60, 0.32);
  transition: transform 0.18s, box-shadow 0.18s;
}
.acc-campaign:hover { transform: translateY(-2px); box-shadow: 0 18px 44px rgba(154, 58, 46, 0.36); }
.acc-campaign__glow { position: absolute; top: -40%; right: -5%; width: 280px; height: 280px; background: radial-gradient(circle, rgba(255,180,150,0.35), transparent 65%); pointer-events: none; }
.acc-campaign__text { position: relative; z-index: 1; }
.acc-campaign__tag { display: inline-block; font-family: 'Outfit', sans-serif; font-size: 0.8rem; font-weight: 800; color: #ffd9c9; letter-spacing: 0.3px; margin-bottom: 6px; }
.acc-campaign__title { font-family: 'Outfit', sans-serif; font-size: 1.3rem; font-weight: 800; color: #fff; margin: 0; max-width: 560px; line-height: 1.25; }
.acc-campaign__cta { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; background: #fff; color: #BC4A3C; border-radius: 100px; font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 0.95rem; flex-shrink: 0; box-shadow: 0 6px 18px rgba(0,0,0,0.15); }
.acc-campaign:hover .acc-campaign__cta svg { transform: translateX(4px); }
.acc-campaign__cta svg { transition: transform 0.2s; }

/* ═══ SECTIONS ═══ */
.acc-section { margin-bottom: 30px; }
.acc-section__head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 16px; gap: 12px; }
.acc-section__title { font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 800; color: #111827; margin: 0; }
.acc-section__sub { margin: 2px 0 0; color: #9ca3af; font-size: 0.88rem; }
.acc-link { color: #BC4A3C; font-weight: 700; font-size: 0.88rem; text-decoration: none; white-space: nowrap; }
.acc-link:hover { text-decoration: underline; }

/* ═══ PRODUCTS ═══ */
.acc-products { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.acc-prod { background: #fff; border: 1px solid #ececec; border-radius: 18px; overflow: hidden; cursor: pointer; transition: transform 0.16s, box-shadow 0.16s, border-color 0.16s; display: flex; flex-direction: column; }
.acc-prod:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,0.08); border-color: #e7c6bf; }
.acc-prod__img { aspect-ratio: 1 / 1; background: #f7f4ef; display: flex; align-items: center; justify-content: center; overflow: hidden; }
/* :deep() — the <img> is inside the <LazyImage> child component's scope, so a
   plain `.acc-prod__img img` selector couldn't reach it and the square product
   images were rendered at their 400×400 attr size and cropped by the box. */
.acc-prod__img :deep(picture) { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.acc-prod__img :deep(img) { width: 100%; height: 100%; object-fit: contain; padding: 14px; box-sizing: border-box; }
.acc-prod__noimg { font-size: 2.6rem; opacity: 0.5; }
.acc-prod__body { padding: 14px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.acc-prod__name { font-family: 'Outfit', sans-serif; font-size: 0.92rem; font-weight: 700; color: #1f2937; margin: 0; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.4em; }
.acc-prod__price { font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 800; color: #BC4A3C; margin-top: auto; }
.acc-prod__price span { font-size: 0.72rem; color: #9ca3af; font-weight: 600; }
.acc-prod__cta { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 9px; border: none; border-radius: 10px; background: #1f2937; color: #fff; font-family: 'Outfit', sans-serif; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: filter 0.15s, background 0.2s; }
.acc-prod__cta:hover { filter: brightness(1.15); }
.acc-prod__cta.is-added { background: #2d8a56; }

/* ═══ GRID: ORDERS + PROFILE ═══ */
.acc-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; }
.acc-card { background: #fff; border: 1px solid #ececec; border-radius: 20px; padding: 22px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.acc-card__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.acc-card__title { display: flex; align-items: center; gap: 9px; font-family: 'Outfit', sans-serif; font-size: 1.05rem; font-weight: 800; color: #111827; margin: 0; }
.acc-card__title svg { color: #BC4A3C; }

.acc-empty { text-align: center; padding: 28px 16px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.acc-empty__icon { font-size: 2.6rem; opacity: 0.55; }
.acc-empty h3 { font-family: 'Outfit', sans-serif; font-size: 1.05rem; font-weight: 800; color: #374151; margin: 4px 0 0; }
.acc-empty p { color: #9ca3af; font-size: 0.9rem; margin: 0 0 10px; max-width: 280px; line-height: 1.5; }

.acc-orders { display: flex; flex-direction: column; gap: 10px; }
.acc-order { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid #f0f0f0; border-radius: 13px; text-decoration: none; transition: background 0.15s, border-color 0.15s; }
.acc-order:hover { background: #faf8f5; border-color: #e7c6bf; }
.acc-order__icon { font-size: 1.1rem; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #f7f4ef; border-radius: 9px; flex-shrink: 0; }
.acc-order__info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.acc-order__id { font-family: 'Outfit', sans-serif; font-weight: 700; color: #1f2937; font-size: 0.88rem; }
.acc-order__date { font-size: 0.78rem; color: #9ca3af; }
.acc-order__status { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; padding: 4px 10px; border-radius: 100px; flex-shrink: 0; }
.acc-order__status.pending { background: #fef3c7; color: #b45309; }
.acc-order__status.paid { background: #dbeafe; color: #1d4ed8; }
.acc-order__status.shipped { background: #ede9fe; color: #6d28d9; }
.acc-order__status.completed { background: #d1fae5; color: #047857; }
.acc-order__status.cancelled { background: #fee2e2; color: #b91c1c; }
.acc-order__status.refunded { background: #f3f4f6; color: #6b7280; }
.acc-order__total { font-family: 'Outfit', sans-serif; font-weight: 800; color: #1f2937; font-size: 0.95rem; flex-shrink: 0; }
.acc-order__total small { font-size: 0.68rem; color: #9ca3af; font-weight: 600; }

.acc-profile { display: flex; flex-direction: column; gap: 14px; }
.acc-field { display: flex; flex-direction: column; gap: 5px; }
.acc-field label { font-size: 0.74rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.4px; }
.acc-field__val { background: #f7f4ef; border: 1px solid #efece6; padding: 11px 14px; border-radius: 11px; color: #1f2937; font-size: 0.92rem; font-weight: 500; }
.acc-field__val--role { color: #BC4A3C; font-weight: 700; background: #fdf4f2; border-color: #f3dcd6; }
.acc-profile__wallet { margin-top: 4px; justify-content: center; }

/* ═══ RESPONSIVE ═══ */
@media (max-width: 980px) {
  .acc-stats { grid-template-columns: repeat(2, 1fr); }
  .acc-products { grid-template-columns: repeat(2, 1fr); }
  .acc-grid { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .acc { padding: 20px 16px 48px; }
  .acc-hero__title { font-size: 1.5rem; }
  .acc-hero__actions { width: 100%; }
  /* min-width:0 overrides the flex-item default (min-width:auto), which was
     otherwise forcing each button to at least its content's un-wrapped width —
     with the long "Соодалашууну улантуу" label that alone ate ~75% of the row,
     leaving "Чыгуу" squeezed to a sliver instead of the intended 50/50 split. */
  .acc-hero__actions .acc-btn { flex: 1; min-width: 0; justify-content: center; white-space: normal; text-align: center; }
  .acc-campaign__cta { width: 100%; justify-content: center; }
}
</style>
