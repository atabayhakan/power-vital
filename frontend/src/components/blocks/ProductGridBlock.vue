<script setup lang="ts">
import { shallowRef, ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { formatPrice } from '../../utils/PriceEngine';
import { useCartStore } from '../../stores/useCartStore';
import { useGamification } from '../../composables/useGamification';
import { useTranslation } from '../../composables/useTranslation';
import { useTranslate } from '../../composables/useTranslate';
import { srcsetFor } from '../../composables/useImageSrcset';
import { useCompare } from '../../composables/useCompare';
import { useToast } from '../../composables/useToast';

const isExternal = (url: string) => /^https?:\/\//i.test(url || '');

const { tField } = useTranslation();
const { t } = useTranslate();
const props = defineProps<{
  data?: any;
  title?: string;
  limit?: number;
}>();

// Default (non-custom) titles fall through to the localized heading so the
// section translates with the language switch. A genuinely custom admin title
// is preserved as-is.
const DEFAULT_TITLES = ['çok satan ürünler', 'çok satanlar', 'öne çıkan ürünler', 'хиты продаж', 'көп сатылгандар'];
const headingText = computed(() => {
  const raw = (props.data?.title || props.title || '').trim();
  if (!raw || DEFAULT_TITLES.includes(raw.toLowerCase())) return t('storefront.bestSellers');
  return raw;
});

const router = useRouter();
const cartStore = useCartStore();
const { getDiscountedKgs } = useGamification();
const products = shallowRef<any[]>([]);

// ═══ Micro-interaction state ═══
const justAdded = ref<Set<string>>(new Set());
// Load persisted favorites
import { useFavorites } from '../../composables/useFavorites';
const favStore = useFavorites();
const toggleFavorite = (e: Event, p: any) => {
  e.stopPropagation();
  const firstImg = p.images?.[0]?.imageUrl || p.images?.[0] || '';
  favStore.toggle({
    id: p.id,
    name: tField(p, 'name') || p.name || '',
    imageUrl: typeof firstImg === 'string' ? firstImg : '',
    basePriceUsd: Number(p.basePriceUsd) || 0
  });
};

// Discount % from compare-at price if present (real data only — never fabricated)
const discountPercent = (p: any): number => {
  const base = Number(p.basePriceUsd || 0);
  const compare = Number(p.compareAtPriceUsd || p.oldPriceUsd || 0);
  if (compare > base && base > 0) return Math.round((1 - base / compare) * 100);
  return 0;
};

// Low-stock badge. Treat any value 0 < stock <= 5 as "running out" and
// show a red "⚡ Son N" callout. Out-of-stock (0) is handled separately
// (CTA disabled).
//
// Field name resolution (in order of preference):
//   • `stockQuantity` — Prisma Product model (current schema, line 106)
//   • `stock`         — legacy / external catalogue payloads
//   • `inventory`     — older Power Vital product shape
//   • `quantity`      — fallback for arbitrary API responses
// Resolve the tracked stock, or `null` when the payload carries NO stock
// field at all (the offline fallback list below, or a curated snapshot saved
// by the page builder). A missing field must NEVER be read as "0 / sold out"
// — that was the bug that flagged every best-seller as out-of-stock on the
// home page while the catalogue (which only checks an explicit 0) looked fine.
const rawStock = (p: any): number | null => {
  const raw = p.stockQuantity ?? p.stock ?? p.inventory ?? p.quantity;
  if (raw === undefined || raw === null || raw === '') return null;
  const n = Number(raw);
  return isFinite(n) && n >= 0 ? Math.floor(n) : null;
};
const stockCount = (p: any): number => {
  const n = rawStock(p);
  return n === null ? 0 : n;
};
const isLowStock = (p: any): boolean => {
  const n = rawStock(p);
  return n !== null && n > 0 && n <= 5;
};
// Only an explicitly tracked zero counts as out-of-stock. Unknown ⇒ available.
const isOutOfStock = (p: any): boolean => {
  const n = rawStock(p);
  return n !== null && n <= 0;
};

// Compare toggle — add/remove a product from the comparison
// drawer. We surface a soft toast when the visitor tries to
// exceed MAX_ITEMS so they know why nothing happened.
const compare = useCompare();
const toast = useToast();
const onCompareToggle = (e: Event, p: any) => {
  e.stopPropagation();
  const firstImg = p.images?.[0]?.imageUrl || p.images?.[0] || '';
  const result = compare.toggle({
    id: p.id,
    name: tField(p, 'name') || p.name || '',
    imageUrl: typeof firstImg === 'string' ? firstImg : '',
    basePriceUsd: Number(p.basePriceUsd) || 0,
    category: p.category?.name || p.category || '',
    slug: p.slug
  });
  if (result.reason === 'full') {
    toast.error('Compare', 'Максимум 4 товара');
  } else if (result.added) {
    toast.success('Compare', '✓ ' + (tField(p, 'name') || p.name));
  }
};

onMounted(async () => {
  try {
    const queryLimit = props.data?.limit || props.limit || 8;
    const catQuery = props.data?.categoryId ? `&categoryId=${props.data.categoryId}` : '';
    const res = await axios.get(`/api/v1/products?limit=${queryLimit}${catQuery}`);
    products.value = res.data;
  } catch (err) {
    // Fallback if no backend
    products.value = [
      {
        id: '1',
        name: 'Power Vital Karadut Özü',
        basePriceUsd: 14.99,
        images: [
          { imageUrl: 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/abdf396c-433e-4dc4-ae67-5c43f805b42d/1080/karadut-01.webp' },
          { imageUrl: 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/abdf396c-433e-4dc4-ae67-5c43f805b42d/1080/karadut-01.webp' }
        ]
      },
      {
        id: '2',
        name: 'Power Vital Omega 3',
        basePriceUsd: 20.50,
        images: [
          { imageUrl: 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/33ad56e8-87bc-4af9-b202-1a893bdea410/1080/omega30.webp' }
        ]
      },
      {
        id: '3',
        name: 'Power Vital Magnezyum',
        basePriceUsd: 25.00,
        images: [
          { imageUrl: 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/b0668799-333b-4bd0-9c9b-508ed5ed5ff3/1080/magnezyum-calisma-yuzeyi-1.webp' }
        ]
      }
    ];
  }
});

const getKgsPrice = (p: any): string => {
  return formatPrice(getDiscountedKgs(Number(p.basePriceUsd || 0)));
};

const hasSecondImage = (p: any): boolean => {
  return p.images && p.images.length >= 2 && !!p.images[1]?.imageUrl;
};

const goToProduct = (id: string) => {
  router.push(`/product/${id}`);
};

const handleQuickView = (e: Event, p: any) => {
  e.stopPropagation();
  router.push(`/product/${p.id}`);
};

const addToCart = (e: Event, p: any) => {
  e.stopPropagation();
  const img = p.images && p.images.length > 0 ? p.images[0].imageUrl : '';
  cartStore.addToCart({
    id: p.id,
    name: tField(p, 'name') || p.name,
    basePriceUsd: Number(p.basePriceUsd),
    imageUrl: img
  }, 1);

  // Dual-state feedback (1.5s revert)
  const next = new Set(justAdded.value).add(p.id);
  justAdded.value = next;
  setTimeout(() => {
    const s = new Set(justAdded.value); s.delete(p.id); justAdded.value = s;
  }, 1500);
};
</script>

<template>
  <section class="pgb-section">
    <h2 class="pgb-heading">{{ headingText }}</h2>
    <p class="pgb-subheading">{{ t('storefront.bestSellersSubtitle') }}</p>

    <div class="pgb-grid">
      <article
        v-for="(p, idx) in products"
        :key="p.id"
        class="pgb-card clay-surface"
        @click="goToProduct(p.id)"
      >
        <!-- Image area with dual-image hover -->
        <div class="pgb-img-wrap">
          <!-- Badges (top-left) -->
          <div class="pgb-badges">
            <span v-if="discountPercent(p) > 0" class="pgb-badge pgb-badge--sale">-%{{ discountPercent(p) }}</span>
            <span v-else-if="isLowStock(p)" class="pgb-badge pgb-badge--low">⚡ {{ t('card.lowStock', { n: stockCount(p) }) }}</span>
            <span v-else-if="idx < 2" class="pgb-badge pgb-badge--best">★ {{ t('card.bestSeller') }}</span>
          </div>

          <!-- Compare + favorite buttons (top-right) -->
          <div class="pgb-top-actions">
            <button
              class="pgb-compare"
              :class="{ 'is-active': compare.has(p.id), 'is-disabled': !compare.has(p.id) && compare.isFull.value }"
              :disabled="!compare.has(p.id) && compare.isFull.value"
              @click="(e) => onCompareToggle(e, p)"
              :aria-label="compare.has(p.id) ? t('compare.removeFromCompare') : t('compare.addToCompare')"
              :title="compare.has(p.id) ? t('compare.removeFromCompare') : t('compare.addToCompare')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18M3 12h18M3 18h12"/>
                <path d="M17 18l3-3-3-3"/>
              </svg>
            </button>
            <button
              class="pgb-fav"
              :class="{ 'is-active': favStore.has(p.id) }"
              @click="(e) => toggleFavorite(e, p)"
              :aria-label="t('card.favorite')"
            >
              <svg width="18" height="18" viewBox="0 0 24 24"                 :fill="favStore.has(p.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>

          <div class="pgb-img-container clay-inset">
            <!-- Primary image — AVIF + WebP responsive srcset -->
            <picture v-if="p.images?.length > 0 && !isExternal(p.images[0].imageUrl)">
              <source type="image/avif" :srcset="srcsetFor(p.images[0].imageUrl, 'avif')" sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 25vw" />
              <source type="image/webp" :srcset="srcsetFor(p.images[0].imageUrl, 'webp')" sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 25vw" />
              <img
                :src="p.images[0].imageUrl"
                :alt="tField(p, 'name') || p.name"
                loading="lazy"
                decoding="async"
                class="pgb-img pgb-img--primary"
                :class="{ 'pgb-img--zoom-only': !hasSecondImage(p) }"
              />
            </picture>
            <img
              v-else-if="p.images?.length > 0"
              :src="p.images[0].imageUrl"
              :alt="tField(p, 'name') || p.name"
              loading="lazy"
              decoding="async"
              class="pgb-img pgb-img--primary"
              :class="{ 'pgb-img--zoom-only': !hasSecondImage(p) }"
            />
            <!-- Secondary image (crossfade on hover) -->
            <picture v-if="hasSecondImage(p) && !isExternal(p.images[1].imageUrl)">
              <source type="image/avif" :srcset="srcsetFor(p.images[1].imageUrl, 'avif')" sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 25vw" />
              <source type="image/webp" :srcset="srcsetFor(p.images[1].imageUrl, 'webp')" sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 25vw" />
              <img
                :src="p.images[1].imageUrl"
                :alt="`${tField(p, 'name') || p.name}`"
                loading="lazy"
                decoding="async"
                class="pgb-img pgb-img--secondary"
              />
            </picture>
            <img
              v-else-if="hasSecondImage(p)"
              :src="p.images[1].imageUrl"
              :alt="`${tField(p, 'name') || p.name}`"
              loading="lazy"
              decoding="async"
              class="pgb-img pgb-img--secondary"
            />
            <!-- No-image placeholder -->
            <span v-if="!p.images?.length" class="pgb-no-img">{{ t('card.noImage') }}</span>
          </div>

          <!-- Quick-view overlay -->
          <button
            class="pgb-quickview"
            @click="(e) => handleQuickView(e, p)"
            :aria-label="t('card.quickView')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>{{ t('card.quickView') }}</span>
          </button>
        </div>

        <!-- Product info -->
        <div class="pgb-info">
          <h3 class="pgb-name">{{ tField(p, 'name') || p.name }}</h3>

          <!-- Star ratings (hardcoded 5 stars) -->
          <div class="pgb-stars" aria-label="5 / 5">
            <svg v-for="n in 5" :key="n" class="pgb-star-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>

          <!-- Pricing: KGS prominent -->
          <div class="pgb-price">
            <span class="pgb-price-kgs">{{ getKgsPrice(p) }} KGS</span>
          </div>

          <!-- Add to cart CTA with added-state feedback -->
          <button
            class="pgb-cta"
            :class="{ 'is-added': justAdded.has(p.id), 'is-out': isOutOfStock(p) }"
            :disabled="isOutOfStock(p)"
            @click="(e) => addToCart(e, p)"
          >
            <Transition name="pgb-cta-swap" mode="out-in">
              <span v-if="isOutOfStock(p)" key="out" class="pgb-cta-inner">
                <span>{{ t('card.outOfStock') }}</span>
              </span>
              <span v-else-if="justAdded.has(p.id)" key="added" class="pgb-cta-inner">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span>{{ t('card.added') }}</span>
              </span>
              <span v-else key="default" class="pgb-cta-inner">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <span>{{ t('storefront.addToCart') }}</span>
              </span>
            </Transition>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
/* ── Section ── */
.pgb-section {
  padding: var(--space-3xl, 64px) var(--container-padding, 24px);
  max-width: var(--container-max, 1280px);
  margin: 0 auto;
}

.pgb-heading {
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 900;
  color: var(--text-primary);
  text-align: center;
  margin: 0 0 var(--space-xs, 6px) 0;
  letter-spacing: -0.5px;
  line-height: 1.15;
}
.pgb-subheading {
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--text-muted);
  text-align: center;
  margin: 0 0 var(--space-2xl, 40px) 0;
}

/* ── Badges (top-left) ── */
.pgb-badges {
  position: absolute;
  top: var(--space-md, 16px);
  left: var(--space-md, 16px);
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 6px;
  pointer-events: none;
}
.pgb-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: var(--radius-pill, 999px);
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(4px);
}
.pgb-badge--best { background: var(--pv-gradient, #BC4A3C); }
.pgb-badge--sale { background: var(--color-success, #2D8A56); }
.pgb-badge--low {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff;
  font-weight: 800;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.35);
}

/* ── Compare + favorite stack (top-right) ── */
.pgb-top-actions {
  position: absolute;
  top: var(--space-md, 16px);
  right: var(--space-md, 16px);
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.pgb-compare {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--text-secondary);
  cursor: pointer;
  box-shadow: var(--clay-shadow-sm);
  transition: transform var(--duration-fast) var(--ease-spring),
              color var(--duration-fast), background var(--duration-fast);
}
.pgb-compare:hover { transform: scale(1.12); color: var(--pv-red); }
.pgb-compare:active { transform: scale(0.92); }
.pgb-compare.is-active { color: #fff; background: var(--pv-red, #BC4A3C); border-color: var(--pv-red, #BC4A3C); }
.pgb-compare.is-disabled { opacity: 0.35; cursor: not-allowed; }
.pgb-compare.is-disabled:hover { transform: none; color: var(--text-secondary); }

.pgb-fav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--text-secondary);
  cursor: pointer;
  box-shadow: var(--clay-shadow-sm);
  transition: transform var(--duration-fast) var(--ease-spring),
              color var(--duration-fast), background var(--duration-fast);
}
.pgb-fav:hover { transform: scale(1.12); color: var(--pv-red); }
.pgb-fav:active { transform: scale(0.92); }
.pgb-fav.is-active { color: var(--pv-red); background: #fff; }

/* ── Responsive Grid ── */
.pgb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-xl, 24px);
}

/* ── Card ── */
.pgb-card {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-xl, 24px);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--duration-normal, 0.3s) var(--ease-spring, cubic-bezier(0.175, 0.885, 0.32, 1.275));
  position: relative;
}

.pgb-card:hover {
  transform: translateY(-6px) scale(1.01);
}

/* ── Image Wrap (contains img + overlay) ── */
.pgb-img-wrap {
  position: relative;
  overflow: hidden;
}

.pgb-img-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Product images are SQUARE — use a square box so they fit naturally
     (like the catalog) instead of a horizontal rectangle that cropped them. */
  aspect-ratio: 1 / 1;
  padding: var(--space-sm, 8px);
  overflow: hidden;
  margin: var(--space-sm, 12px);
  border-radius: var(--radius-lg, 20px);
}

/* ── Dual-image system ── */
.pgb-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: var(--space-sm, 8px);
  box-sizing: border-box;
  transition: opacity var(--duration-normal, 0.4s) var(--ease-smooth, ease),
              transform var(--duration-slow, 0.6s) var(--ease-smooth, ease);
}
.pgb-img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pgb-img--primary {
  opacity: 1;
  z-index: 2;
}

.pgb-img--secondary {
  opacity: 0;
  z-index: 1;
}

/* On hover: crossfade to second image */
.pgb-card:hover .pgb-img--primary:not(.pgb-img--zoom-only) {
  opacity: 0;
}

.pgb-card:hover .pgb-img--secondary {
  opacity: 1;
}

/* If no second image, subtle scale zoom on primary */
.pgb-card:hover .pgb-img--zoom-only {
  transform: scale(1.08);
}

.pgb-no-img {
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* ── Quick-view overlay ── */
.pgb-quickview {
  position: absolute;
  bottom: var(--space-lg, 20px);
  left: 50%;
  transform: translateX(-50%) translateY(12px);
  display: flex;
  align-items: center;
  gap: var(--space-xs, 6px);
  padding: var(--space-xs, 8px) var(--space-md, 16px);
  background: var(--glass-bg, rgba(255, 255, 255, 0.85));
  backdrop-filter: var(--glass-blur, blur(12px));
  -webkit-backdrop-filter: var(--glass-blur, blur(12px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.4));
  border-radius: var(--radius-pill, 100px);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.02em;
  cursor: pointer;
  opacity: 0;
  z-index: 10;
  transition: opacity var(--duration-fast, 0.2s) var(--ease-smooth, ease),
              transform var(--duration-fast, 0.2s) var(--ease-smooth, ease);
  box-shadow: var(--glass-shadow, 0 4px 16px rgba(0, 0, 0, 0.08));
  white-space: nowrap;
}

.pgb-card:hover .pgb-quickview {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.pgb-quickview:hover {
  background: var(--surface-white, #fff);
}

.pgb-quickview:active {
  transform: translateX(-50%) scale(0.95);
}

/* ── Product Info ── */
.pgb-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: var(--space-md, 16px) var(--space-md, 16px) var(--space-lg, 20px);
  gap: var(--space-xs, 6px);
}

.pgb-name {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Star Ratings ── */
.pgb-stars {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: var(--space-2xs, 2px) 0 var(--space-xs, 6px);
}

.pgb-star-icon {
  color: var(--color-star, #FFB300);
  flex-shrink: 0;
}

/* ── Pricing ── */
.pgb-pricing {
  display: flex;
  align-items: baseline;
  gap: var(--space-sm, 10px);
  margin-bottom: var(--space-md, 16px);
}

.pgb-price-kgs {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--pv-red, #BC4A3C);
  line-height: 1;
}

.pgb-price-usd {
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-muted, #a1a1aa);
  text-decoration: line-through;
  line-height: 1;
}

/* ── Add-to-Cart CTA ── */
.pgb-cta {
  margin-top: auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs, 8px);
  padding: var(--space-sm, 12px) var(--space-md, 16px);
  background: linear-gradient(135deg, var(--pv-red, #FF3B30) 0%, var(--pv-red-dark, #D8412F) 100%);
  color: var(--surface-white, #ffffff);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.03em;
  border: none;
  border-radius: var(--radius-pill, 100px);
  cursor: pointer;
  transition: filter var(--duration-fast, 0.2s) var(--ease-smooth, ease),
              transform var(--duration-fast, 0.15s) var(--ease-kinetic, ease);
  box-shadow: var(--clay-shadow-sm, 0 4px 12px rgba(216, 65, 47, 0.3));
}

.pgb-cta:hover {
  filter: brightness(1.1);
  box-shadow: var(--pv-red-glow, 0 8px 24px rgba(216, 65, 47, 0.45));
}

.pgb-cta:active {
  transform: translateY(2px) scale(0.96);
  box-shadow: var(--clay-inset);
}

.pgb-cta.is-out,
.pgb-cta:disabled {
  background: #cbd5e1;
  color: #f8fafc;
  cursor: not-allowed;
  filter: grayscale(0.4);
  box-shadow: none;
}
.pgb-cta.is-out:hover,
.pgb-cta:disabled:hover {
  filter: grayscale(0.4) brightness(1);
  box-shadow: none;
}

/* Added-state feedback */
.pgb-cta.is-added {
  background: linear-gradient(135deg, var(--color-success, #2D8A56) 0%, #1f6b40 100%);
  box-shadow: 0 4px 16px rgba(45, 138, 86, 0.4);
}
.pgb-cta-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs, 8px);
}
.pgb-cta-swap-enter-active,
.pgb-cta-swap-leave-active {
  transition: opacity 0.18s ease, transform 0.18s var(--ease-spring, ease);
}
.pgb-cta-swap-enter-from { opacity: 0; transform: translateY(6px); }
.pgb-cta-swap-leave-to { opacity: 0; transform: translateY(-6px); }

/* ── Mobile: single column ── */
@media (max-width: 640px) {
  .pgb-section {
    padding: var(--space-2xl, 40px) var(--space-md, 16px);
  }

  .pgb-heading {
    font-size: 1.6rem;
    margin-bottom: var(--space-xl, 28px);
  }

  .pgb-grid {
    grid-template-columns: 1fr;
    gap: var(--space-lg, 20px);
  }

  .pgb-img-container {
    /* keep it square on mobile too (aspect-ratio inherited from base) */
    height: auto;
  }
}
</style>
