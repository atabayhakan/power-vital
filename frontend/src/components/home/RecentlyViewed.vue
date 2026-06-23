<script setup lang="ts">
// RecentlyViewed — a horizontal carousel of the last 8 products the
// visitor has opened. Lives on the home page, BELOW the featured
// reviews. Empty for first-time visitors (renders nothing).
//
// Re-uses the existing <LazyImage> component for avif/webp variants
// and the currency composable for the price label.
import { useRouter } from 'vue-router';
import { useRecentlyViewed } from '../../composables/useRecentlyViewed';
import { useCurrency } from '../../composables/useCurrency';
import { useTranslate } from '../../composables/useTranslate';
import LazyImage from '../common/LazyImage.vue';

const router = useRouter();
const { recent, isEmpty } = useRecentlyViewed();
const { formatPrice } = useCurrency();
const { t } = useTranslate();

const goToProduct = (id: string) => router.push(`/product/${id}`);
const priceFor = (p: any) => formatPrice(p.basePriceUsd * 90); // 90 KGS/USD; refined by PriceEngine in production
</script>

<template>
  <section v-if="!isEmpty" class="rv-section" aria-label="Recently viewed products">
    <header class="rv-head">
      <h2 class="rv-title">👀 {{ t('recent.title') }}</h2>
    </header>
    <div class="rv-strip">
      <button
        v-for="p in recent"
        :key="p.id"
        class="rv-card"
        type="button"
        @click="goToProduct(p.id)"
      >
        <div class="rv-img-wrap">
          <LazyImage
            v-if="p.imageUrl"
            :src="p.imageUrl"
            :alt="p.name"
            :width="180"
            :height="180"
            class="rv-img"
          />
          <span v-else class="rv-no-img">📦</span>
        </div>
        <span class="rv-name">{{ p.name }}</span>
        <span class="rv-price">{{ priceFor(p) }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.rv-section {
  padding: 40px 24px 56px;
  max-width: 1280px;
  margin: 0 auto;
}
.rv-head { text-align: center; margin-bottom: 20px; }
.rv-title {
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 3vw, 2rem);
  font-weight: 900;
  color: var(--text-primary, #18181b);
  margin: 0;
  letter-spacing: -0.4px;
}

.rv-strip {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 4px 4px 16px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.rv-strip::-webkit-scrollbar { height: 6px; }
.rv-strip::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 3px; }

.rv-card {
  flex: 0 0 180px;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--surface-white, #fff);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  text-align: center;
}
.rv-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 18px rgba(188, 74, 60, 0.10);
  border-color: rgba(188, 74, 60, 0.25);
}

.rv-img-wrap {
  width: 100%;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 10px;
  overflow: hidden;
}
.rv-img { width: 100%; height: 100%; }
.rv-no-img { font-size: 2.2rem; opacity: 0.4; }

.rv-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.86rem;
  color: var(--text-primary, #18181b);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  width: 100%;
}

.rv-price {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--pv-red, #BC4A3C);
}

@media (max-width: 600px) {
  .rv-card { flex: 0 0 140px; padding: 10px; }
  .rv-name { font-size: 0.78rem; }
}

@media (prefers-reduced-motion: reduce) {
  .rv-card { transition: none; }
}
</style>
