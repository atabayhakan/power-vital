<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import { useCartStore } from '../stores/useCartStore';
import { formatPrice } from '../utils/PriceEngine';
import { useGamification } from '../composables/useGamification';
import { useTranslate } from '../composables/useTranslate';
import { useTranslation } from '../composables/useTranslation';
import LazyImage from '../components/common/LazyImage.vue';

const { t } = useTranslate();
const { tField } = useTranslation();

const router = useRouter();
const route = useRoute();
const cartStore = useCartStore();
const { getDiscountedKgs } = useGamification();
const allProducts = ref<any[]>([]);
const categories = ref<any[]>([]);
const loading = ref(true);
const justAdded = ref<string | null>(null);

// Read ?cat=... from query string (slug OR id)
const initialCat = (route.query.cat as string) || 'all';
const activeFilter = ref(initialCat);

// Helper: detect if a value is a URL (not a real emoji)
const isUrl = (val: string | null | undefined): boolean =>
  !!val && (val.startsWith('http') || val.startsWith('/') || val.startsWith('data:'));

const filters = computed(() => {
  const base = [{ id: 'all', slug: 'all', name: t('catalog.all'), icon: '✨', iconIsUrl: false }];
  return [
    ...base,
    ...categories.value.map((c: any) => ({
      id: c.id,
      slug: c.slug || c.id,
      name: tField(c, 'name') || c.name,
      icon: c.iconEmoji || '📦',
      iconIsUrl: isUrl(c.iconEmoji)
    }))
  ];
});

// Map activeFilter (slug or 'all' or id) to categoryId for filtering
const resolveCategoryId = (filter: string): string | null => {
  if (filter === 'all') return null;
  const cat = categories.value.find((c: any) => c.id === filter || c.slug === filter);
  return cat?.id || null;
};

const filteredProducts = computed(() => {
  const catId = resolveCategoryId(activeFilter.value);
  if (!catId) return allProducts.value; // 'all' OR unknown filter
  // Filter by categoryId — strict equality
  const matched = allProducts.value.filter((p: any) => p.categoryId === catId);
  // FALLBACK: if no products in this category, show all products
  return matched.length > 0 ? matched : allProducts.value;
});

const isShowingFallback = computed(() => {
  const catId = resolveCategoryId(activeFilter.value);
  if (!catId) return false;
  return allProducts.value.filter((p: any) => p.categoryId === catId).length === 0;
});

// Sync URL when filter changes (deep linking + browser back button)
watch(activeFilter, (newVal) => {
  const currentCat = route.query.cat || 'all';
  if (newVal !== currentCat) {
    router.replace({ query: newVal === 'all' ? {} : { cat: newVal } });
  }
});

// Listen for browser back/forward navigation
watch(() => route.query.cat, (newCat) => {
  const val = (newCat as string) || 'all';
  if (val !== activeFilter.value) activeFilter.value = val;
});

onMounted(async () => {
  try {
    const [prodRes, catRes] = await Promise.all([
      axios.get('/api/v1/products'),
      axios.get('/api/v1/categories')
    ]);
    allProducts.value = prodRes.data;
    categories.value = catRes.data || [];
  } catch (err) {
    allProducts.value = [
      { id: '1', name: 'Karadut, Karamürver, Ahududu Özü - 680gr', basePriceKgs: 1300, images: [{ imageUrl: 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/abdf396c-433e-4dc4-ae67-5c43f805b42d/1080/karadut-01.webp' }] },
      { id: '2', name: 'Collagen Tripeptide', basePriceKgs: 1800, images: [{ imageUrl: 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/33ad56e8-87bc-4af9-b202-1a893bdea410/1080/omega30.webp' }] },
      { id: '3', name: 'Magnezyum Kompleks - Gece ve Gündüz', basePriceKgs: 2200, images: [{ imageUrl: 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/b0668799-333b-4bd0-9b9b-508ed5ed5ff3/1080/magnezyum-calisma-yuzeyi-1.webp' }] },
      { id: '4', name: 'Omega 3 Kapsül', basePriceKgs: 1600, images: [] }
    ];
  } finally {
    loading.value = false;
  }
});

const goToProduct = (id: string) => {
  router.push(`/product/${id}`);
};

const addToCart = (e: Event, p: any) => {
  e.stopPropagation();
  const img = p.images && p.images.length > 0 ? p.images[0].imageUrl : '';
  cartStore.addToCart({
    id: p.id,
    name: p.name,
    basePriceKgs: Number(p.basePriceKgs),
    imageUrl: img
  }, 1);

  // 2026: dual-state feedback (1.4s revert)
  justAdded.value = p.id;
  setTimeout(() => { if (justAdded.value === p.id) justAdded.value = null; }, 1400);
};

const isLowStock = (p: any) => p.stockQuantity > 0 && p.stockQuantity <= 5;
const isOutOfStock = (p: any) => p.stockQuantity === 0;
</script>

<template>
  <div class="catalog-page">
    <header class="cat-header">
      <h1 class="cat-title">{{ t('nav.catalog') }}</h1>
      <p class="cat-sub">{{ allProducts.length }} {{ t('catalog.inStock') }}</p>
    </header>

    <!-- 2026: Horizontal scrollable filter chips with snap (mobile) -->
    <div class="cat-filters scroll-x-hide">
      <button
        v-for="f in filters"
        :key="f.id"
        class="filter-chip"
        :class="{ 'is-active': activeFilter === f.id }"
        @click="activeFilter = f.id"
      >
        <img
          v-if="f.iconIsUrl"
          :src="f.icon || ''"
          class="filter-chip__icon filter-chip__icon--img"
          alt=""
        />
        <span v-else-if="f.icon" class="filter-chip__icon">{{ f.icon }}</span>
        <span>{{ f.name }}</span>
      </button>
    </div>

    <div class="cat-container">
      <div v-if="loading" class="loading">
        <div class="spinner"/>
        <p>{{ t('catalog.loading') }}</p>
      </div>

      <div v-else-if="filteredProducts.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>{{ t('catalog.noProducts') }}</p>
        <button class="btn-secondary" @click="activeFilter = 'all'">{{ t('catalog.all') }}</button>
      </div>

      <div v-if="!loading && isShowingFallback" class="fallback-banner">
        ℹ️ {{ t('catalog.showingFallback') }}
      </div>

      <!-- 2026: Bento grid — featured first item gets span-8 -->
      <div v-else class="prod-grid">
        <article
          v-for="(p, idx) in filteredProducts"
          :key="p.id"
          class="prod-card"
          :class="[idx === 0 ? 'prod-card--featured' : '', isOutOfStock(p) ? 'is-out' : '', isLowStock(p) ? 'is-low' : '']"
          @click="goToProduct(p.id)"
        >
          <div class="prod-img-box">
            <LazyImage
              v-if="p.images?.length > 0"
              :src="p.images[0].imageUrl"
              :alt="p.name"
              width="600"
              height="600"
              sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 25vw"
              class="prod-img"
            />
            <span v-else class="no-img">{{ t('card.noImage') }}</span>

            <!-- 2026: Quick-view overlay (hover) -->
            <div class="prod-quickview">
              <button class="qv-btn" @click.stop="goToProduct(p.id)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Hızlı Bakış
              </button>
            </div>

            <span v-if="isLowStock(p)" class="prod-urgency urgency-pulse">⚠️ Son {{ p.stockQuantity }} {{ t('admin.pcs') }}</span>
            <span v-if="isOutOfStock(p)" class="prod-stock-out">{{ t('catalog.outOfStock') }}</span>
          </div>

          <div class="prod-info">
            <span class="prod-category" v-if="p.category">{{ tField(p.category, 'name') || p.category.name }}</span>
            <h3 class="prod-name">{{ tField(p, 'name') || p.name }}</h3>

            <div class="prod-rating">
              <span class="prod-stars">★★★★★</span>
              <span class="prod-rating__count">(124)</span>
            </div>

            <div class="prod-price-row">
              <span class="prod-price">{{ formatPrice(getDiscountedKgs(p.basePriceKgs)) }} <span class="prod-currency">KGS</span></span>
            </div>

            <!-- 2026: Dual-state CTA -->
            <button
              class="prod-cta"
              :class="{ 'is-added': justAdded === p.id }"
              :disabled="isOutOfStock(p)"
              @click="(e) => addToCart(e, p)"
            >
              <Transition name="cta-swap" mode="out-in">
                <span v-if="justAdded === p.id" key="added" class="cta-content">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  {{ t('catalog.added') }}
                </span>
                <span v-else key="default" class="cta-content">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  {{ isOutOfStock(p) ? t('catalog.outOfStock') : t('catalog.addToCart') }}
                </span>
              </Transition>
            </button>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.catalog-page {
  background-color: var(--surface-page);
  min-height: 100vh;
  padding: var(--space-3xl) 0 var(--space-4xl);
  font-family: var(--font-body);
  color: var(--text-primary);
}

.cat-header {
  padding: 0 var(--container-padding) var(--space-xl);
  text-align: center;
  max-width: var(--container-max);
  margin: 0 auto;
}
.cat-title {
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  font-weight: 900;
  margin: 0 0 var(--space-sm) 0;
  color: var(--text-primary);
  letter-spacing: -0.03em;
  line-height: 1.1;
}
.cat-sub {
  font-size: 1.05rem;
  color: var(--text-secondary);
  margin: 0;
}

/* 2026: Filter chips — pill, claymorphism, active glow */
.cat-filters {
  display: flex;
  gap: var(--space-sm);
  padding: 0 var(--container-padding);
  margin: 0 auto var(--space-2xl);
  max-width: var(--container-max);
}

/* Image-style icon inside filter chip (when category icon is a URL) */
.filter-chip__icon--img {
  width: 18px; height: 18px; border-radius: 4px; object-fit: cover;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  image-rendering: high-quality;
  flex-shrink: 0;
}
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  min-height: 44px;
  border: none;
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-secondary);
  background: var(--surface-card);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-spring);
  box-shadow: var(--clay-shadow-xs);
  white-space: nowrap;
}
.filter-chip:hover {
  color: var(--text-primary);
  transform: translateY(-2px);
  box-shadow: var(--clay-shadow-sm);
}
.filter-chip.is-active {
  background: var(--pv-gradient);
  color: var(--text-on-brand);
  box-shadow: var(--clay-brand-inset), 0 4px 16px var(--pv-red-glow);
  transform: translateY(-1px);
}
.filter-chip__icon {
  font-size: 1rem;
  line-height: 1;
}

.cat-container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--container-padding);
}

/* 2026: Bento grid — 12-col, featured first card spans 8 */
.prod-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-lg);
}
.prod-card {
  grid-column: span 3;
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  cursor: pointer;
  background: var(--surface-card);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: var(--radius-lg);
  box-shadow: var(--clay-shadow-md);
  transition: box-shadow var(--duration-normal) var(--ease-smooth),
              transform var(--duration-normal) var(--ease-spring);
  position: relative;
  overflow: hidden;
}
.prod-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--clay-shadow-lg);
}
.prod-card--featured {
  grid-column: span 6;
}
.prod-card--featured .prod-img-box {
  height: 360px;
}
.prod-card--featured .prod-name {
  font-size: 1.5rem;
}
.prod-card--featured .prod-price {
  font-size: 1.75rem;
}

.prod-card.is-out { opacity: 0.6; }
.prod-card.is-low { border-color: rgba(239, 68, 68, 0.2); }

/* Image box with quick-view overlay */
.prod-img-box {
  padding: var(--space-sm, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 220px;
  background: var(--surface-inset);
  box-shadow: var(--clay-inset);
  border-radius: var(--radius-md);
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}
/* :deep() — the <img> is rendered inside the <LazyImage> child component's own
   style scope, so a plain `.prod-img-box img` selector can't reach it. Without
   this the image ignored object-fit:contain and rendered at its 600×600 attr
   size, getting cropped by the 220px box. */
.prod-img-box :deep(picture) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.prod-img-box :deep(img) {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
  transition: transform var(--duration-slow) var(--ease-kinetic);
}
.prod-card--featured .prod-img-box :deep(img) {
  object-fit: contain;
  object-position: center;
}
.prod-card:hover .prod-img-box :deep(img) {
  transform: scale(1.08);
}
.no-img {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.9rem;
}

/* 2026: Quick-view overlay (slide-up) */
.prod-quickview {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.6) 100%);
  opacity: 0;
  transition: opacity var(--duration-normal) var(--ease-smooth);
  pointer-events: none;
}
.prod-card:hover .prod-quickview {
  opacity: 1;
  pointer-events: auto;
}
.qv-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  min-height: 36px;
  background: var(--surface-white);
  color: var(--text-primary);
  border: none;
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transform: translateY(10px);
  transition: transform var(--duration-normal) var(--ease-spring);
  box-shadow: var(--clay-shadow-md);
}
.prod-card:hover .qv-btn {
  transform: translateY(0);
}
.qv-btn:hover {
  color: var(--pv-red);
}

/* 2026: Stock urgency + out-of-stock overlays */
.prod-urgency {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--color-error);
  color: white;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-size: 0.7rem;
  font-weight: 800;
  font-family: var(--font-display);
  letter-spacing: 0.02em;
}
.prod-stock-out {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--text-muted);
  color: white;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-size: 0.7rem;
  font-weight: 800;
  font-family: var(--font-display);
}

.prod-info { display: flex; flex-direction: column; flex: 1; }
.prod-category {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--pv-red);
  margin-bottom: 4px;
}
.prod-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
  font-family: var(--font-display);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.prod-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: var(--space-sm);
}
.prod-stars {
  color: var(--color-star);
  font-size: 0.85rem;
  letter-spacing: 1px;
}
.prod-rating__count {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}
.prod-price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: var(--space-md);
}
.prod-price {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 900;
  color: var(--pv-red);
  line-height: 1;
}
.prod-currency {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-left: 2px;
}
.prod-price-usd {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-decoration: line-through;
  font-weight: 500;
}

/* 2026: Dual-state CTA */
.prod-cta {
  margin-top: auto;
  width: 100%;
  padding: 14px 20px;
  min-height: 48px;
  background: var(--pv-gradient);
  color: var(--text-on-brand);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.9rem;
  border: none;
  border-radius: var(--radius-pill);
  cursor: pointer;
  box-shadow: var(--clay-brand-inset), 0 4px 16px var(--pv-red-glow);
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: all var(--duration-fast) var(--ease-clay);
}
.prod-cta:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.02);
  box-shadow: var(--clay-brand-inset), 0 10px 32px var(--pv-red-glow-strong);
  filter: brightness(1.05);
}
.prod-cta:active:not(:disabled) {
  transform: scale(0.97);
  transition-duration: var(--duration-instant);
}
.prod-cta:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.5);
}
.prod-cta.is-added {
  background: var(--color-success);
  box-shadow: inset 2px 2px 4px rgba(255,255,255,0.3), inset -2px -2px 6px rgba(0,80,40,0.3), 0 4px 16px rgba(16, 185, 129, 0.4);
}
.cta-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.cta-swap-enter-active,
.cta-swap-leave-active {
  transition: opacity var(--duration-fast) var(--ease-smooth), transform var(--duration-fast) var(--ease-smooth);
}
.cta-swap-enter-from { opacity: 0; transform: translateY(6px); }
.cta-swap-leave-to { opacity: 0; transform: translateY(-6px); }

/* Loading + Empty */
.loading {
  text-align: center;
  padding: 80px 20px;
  font-weight: 600;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--surface-inset);
  border-top-color: var(--pv-red);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { text-align: center; padding: 80px 20px; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: 16px; }
.empty-icon { font-size: 64px; opacity: 0.4; }

/* Fallback banner: category has no products, showing all */
.fallback-banner {
  text-align: center; padding: 12px 20px; margin-bottom: 16px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: var(--text-warning); border-radius: 12px;
  font-size: 14px; font-weight: 600;
  font-family: var(--font-body);
}

/* 2026: Tablet — 2 columns */
@media (max-width: 1024px) {
  .prod-card { grid-column: span 4; }
  .prod-card--featured { grid-column: span 8; }
  .prod-card--featured .prod-img-box { height: 280px; }
}

/* 2026: Mobile — single column bento stack */
@media (max-width: 768px) {
  .prod-card { grid-column: span 12; }
  .prod-card--featured { grid-column: span 12; }
  .prod-card--featured .prod-img-box { height: 240px; }
  .prod-card--featured .prod-name { font-size: 1.15rem; }
  .prod-card--featured .prod-price { font-size: 1.5rem; }
  .cat-header { padding: 0 16px var(--space-lg); }
  .cat-filters { padding: 0 16px; }
  .cat-container { padding: 0 16px; }
}
</style>
