<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { formatPrice, getFinanceSettings } from '../utils/PriceEngine';
import { useCartStore } from '../stores/useCartStore';
import { usePageBuilderStore } from '../stores/usePageBuilderStore';
import { useGamification } from '../composables/useGamification';
import { useTranslation } from '../composables/useTranslation';
import { useTranslate } from '../composables/useTranslate';
import { useRecentlyViewed } from '../composables/useRecentlyViewed';
import LiveVisitorBadge from '../components/common/LiveVisitorBadge.vue';
import InventoryWidget from '../components/common/InventoryWidget.vue';
import api from '../utils/api';
import LazyImage from '../components/common/LazyImage.vue';

const route = useRoute();
const cartStore = useCartStore();
const { userDiscountRate, userLoyaltyLevel, formatDiscountedPrice, getRetailKgs, getDiscountedKgs } = useGamification();
const pbStore = usePageBuilderStore();
const { tField } = useTranslation();
const { t, locale } = useTranslate();

// Accordion title/content are array items on the product; their translations
// live in product.translations[locale].accordions (matched by `key`), NOT on
// the individual accordion object — so tField(acc, …) couldn't reach them and
// the Russian/base text leaked through. Resolve from the product map by key.
const accField = (acc: any, field: 'title' | 'content'): string => {
  let tr: any = product.value?.translations;
  if (typeof tr === 'string') { try { tr = JSON.parse(tr); } catch { tr = null; } }
  const arr = tr?.[locale.value]?.accordions;
  if (Array.isArray(arr)) {
    const match = arr.find((x: any) => x?.key === acc.key);
    const v = match?.[field];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return acc[field] || '';
};

// Free shipping threshold — fixed KGS amount (single source of
// truth, matches cart + checkout).
const freeShippingThreshold = computed(() => {
  const fs = getFinanceSettings();
  return Number(fs.checkoutShippingThresholdKgs) || 9000;
});

const product = ref<any>(null);
const loading = ref(true);
const currentImageIndex = ref(0);
const quantity = ref(1);
const expandedAccordion = ref<string>('benefits');
const justAdded = ref(false);

// Admin's per-section GÖRÜNÜR/GİZLİ toggle (isOpen) controls whether a
// section reaches the storefront at all — hidden sections (isOpen === false)
// are filtered out here rather than just rendered collapsed.
const visibleAccordions = computed(() => (product.value?.accordions || []).filter((acc: any) => acc.isOpen !== false));

// Magnifier and Lightbox state
const isZooming = ref(false);
const zoomStyle = ref({});
const isLightboxOpen = ref(false);

onMounted(async () => {
  if (pbStore.cartBlocks.length === 0) {
    pbStore.fetchBlocks();
  }

  if (route.params.id === 'demo') {
    product.value = {
      id: 'demo',
      name: 'Örnek Premium Takviye',
      description: 'Bu sayfa Sayfa Tasarımcısı (Page Builder) önizlemesi için özel olarak oluşturulmuş bir demo içeriğidir.',
      basePriceKgs: 4390,
      stockQuantity: 100,
      images: ['https://images.unsplash.com/photo-1550572017-edb9b478d1eb?auto=format&fit=crop&q=80&w=800'],
      benefits: [],
      accordions: [],
      usage: ''
    };
    loading.value = false;
    return;
  }

  try {
    const res = await api.get(`/products/${route.params.id}`);
    if (res.data) {
      product.value = res.data;
      product.value.images = (res.data.images || [])
        .map((i: any) => (typeof i === 'string' ? i : i?.imageUrl))
        .filter(Boolean);
      if (product.value.images.length === 0) {
        product.value.images = ['https://via.placeholder.com/800'];
      }
      // Track this view in the "Recently viewed" strip on the home
      // page. The composable dedupes + caps locally; safe to call
      // on every navigation into this PDP.
      trackProductView(product.value);
    }
  } catch (e) {
    console.error('Failed to load product details', e);
  } finally {
    loading.value = false;
  }
});

// Quantity handlers
const increaseQty = () => { if (product.value && quantity.value < product.value.stockQuantity) quantity.value++; };
const decreaseQty = () => { if (quantity.value > 1) quantity.value--; };

// Recently-viewed tracking. The composable dedupes + caps at 8 so
// the home page strip stays light and we don't spam localStorage.
const recent = useRecentlyViewed();
const trackProductView = (p: any) => {
  if (!p?.id) return;
  const firstImg = Array.isArray(p.images) ? p.images[0] : '';
  recent.track({
    id: p.id,
    name: tField(p, 'name') || p.name || '',
    basePriceKgs: Number(p.basePriceKgs) || 0,
    imageUrl: typeof firstImg === 'string' ? firstImg : (firstImg?.imageUrl || ''),
    slug: p.slug
  });
};

const addToCart = () => {
  if (!product.value) return;
  cartStore.addToCart({
    id: product.value.id,
    name: tField(product.value, 'name') || product.value.name,
    basePriceKgs: Number(product.value.basePriceKgs),
    imageUrl: product.value.images[0]
  }, quantity.value);

  justAdded.value = true;
  setTimeout(() => { justAdded.value = false; }, 2000);
};

const priceKgs = computed(() => {
  return product.value?.basePriceKgs ? getDiscountedKgs(product.value.basePriceKgs) : 0;
});
const isLowStock = computed(() => product.value && product.value.stockQuantity > 0 && product.value.stockQuantity <= 5);
const isOutOfStock = computed(() => product.value && product.value.stockQuantity === 0);

const toggleAccordion = (id: string) => {
  expandedAccordion.value = expandedAccordion.value === id ? '' : id;
};

// Magnifier Logic
const onMouseMove = (e: MouseEvent) => {
  if (window.innerWidth < 900) return; // disable on mobile
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  
  zoomStyle.value = {
    transformOrigin: `${x}% ${y}%`,
    transform: 'scale(2)'
  };
};

const onMouseEnter = () => {
  if (window.innerWidth >= 900) isZooming.value = true;
};
const onMouseLeave = () => {
  isZooming.value = false;
  zoomStyle.value = { transform: 'scale(1)' };
};

// Scroll for FBB
const showFloatingBar = ref(false);
const handleScroll = () => {
  showFloatingBar.value = window.scrollY > 400;
};

onMounted(() => { window.addEventListener('scroll', handleScroll, { passive: true }); });
onUnmounted(() => { window.removeEventListener('scroll', handleScroll); });

const onLightboxKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isLightboxOpen.value) isLightboxOpen.value = false;
};
onMounted(() => window.addEventListener('keydown', onLightboxKeydown));
onUnmounted(() => window.removeEventListener('keydown', onLightboxKeydown));
</script>

<template>
  <div class="pdp-container">
    <!-- Loading & Error -->
    <div v-if="loading" class="pdp-loading clay-inset">
      <span class="pdp-loading__spinner" aria-hidden="true"/>
      <span>{{ t('product.loading') }}</span>
    </div>
    <div v-else-if="!product" class="pdp-error clay-inset">
      <span class="pdp-error__icon" aria-hidden="true">⚠️</span>
      <p>{{ t('product.notFound') }}</p>
    </div>

    <!-- Content -->
    <div v-else class="pdp-grid">
      <!-- Left: Gallery -->
      <section class="pdp-gallery" :aria-label="t('common.productImage')">
        <div 
          class="pdp-gallery__main"
          @mousemove="onMouseMove"
          @mouseenter="onMouseEnter"
          @mouseleave="onMouseLeave"
          @click="isLightboxOpen = true"
        >
          <div class="pdp-gallery__zoom-wrapper" :class="{ 'is-zooming': isZooming }" :style="isZooming ? zoomStyle : {}">
              <LazyImage
                :src="product.images[currentImageIndex]"
                :alt="product.name"
                :eager="true"
                sizes="(max-width: 1024px) 100vw, 50vw"
                class="pdp-gallery__img"
              />
          </div>
          <span v-if="isLowStock" class="pdp-gallery__urgency urgency-pulse">
            ⚠️ {{ t('product.lowStockWarning', { count: product.stockQuantity }) }}
          </span>
          <div class="pdp-gallery__expand-hint" aria-hidden="true">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </div>
        </div>
        
        <div class="pdp-gallery__thumbs" v-if="product.images.length > 1">
          <button
            v-for="(img, idx) in product.images"
            :key="idx"
            class="pdp-gallery__thumb"
            :class="{ 'pdp-gallery__thumb--active': currentImageIndex === idx }"
            :aria-label="`Görsel ${Number(idx) + 1}`"
            @click="currentImageIndex = Number(idx)"
          >
            <div class="pdp-gallery__thumb-liquid" aria-hidden="true"/>
            <img :src="img" :alt="`${product.name} görsel ${Number(idx) + 1}`" loading="lazy" />
          </button>
        </div>
      </section>

      <!-- Right: Details -->
      <section class="pdp-info">
        <nav class="pdp-breadcrumbs" aria-label="Breadcrumb">
          <router-link to="/">{{ t('nav.home') }}</router-link> / <router-link to="/katalog">{{ t('nav.catalog') }}</router-link>
        </nav>
        
        <div class="pdp-info__header">
          <h1 class="pdp-info__title">{{ tField(product, 'name') || product.name }}</h1>
          <p class="pdp-info__desc">{{ tField(product, 'description') || product.description }}</p>
        </div>

        <!-- Rating -->
        <div class="pdp-rating" :aria-label="t('product.ratingLabel') + ': 4.8 / 5'">
          <span class="pdp-rating__stars" aria-hidden="true">★★★★★</span>
          <span class="pdp-rating__score">4.8</span>
          <span class="pdp-rating__count">({{ t('product.reviewCount', { n: 124 }) }})</span>
        </div>

        <!-- Price & Stock -->
        <div class="pdp-price glass-panel">
          <div v-if="userDiscountRate > 0" class="gamified-price-box">
            <span class="pdp-old-price">{{ formatPrice(getRetailKgs(product?.basePriceKgs)) }} KGS</span>
            <div class="pdp-level-price">
              <span class="pdp-current-price">{{ formatDiscountedPrice(product?.basePriceKgs) }} KGS</span>
              <span class="level-badge">Senin Level {{ userLoyaltyLevel }} Fiyatın!</span>
            </div>
          </div>
          <div v-else>
            <span class="pdp-current-price">{{ formatPrice(getRetailKgs(product?.basePriceKgs)) }} KGS</span>
          </div>
          <div class="pdp-stock" :class="{ 'pdp-stock--available': !isOutOfStock }">
            <span class="pdp-stock__dot" :class="{ 'pdp-stock__pulse': isLowStock }" aria-hidden="true"/>
            {{ isOutOfStock ? t('product.outOfStockInline') : t('product.inStockCount', { count: product.stockQuantity }) }}
          </div>

          <!-- Live visitor count — ticks every 30s while the PDP is open.
               Hidden when nobody else is here so the row stays quiet. -->
          <LiveVisitorBadge v-if="product?.id" :product-id="product.id" />

          <!-- Realtime stock + FOMO strip. Shows "X people bought
               this in the last 10 minutes" and a thin urgency bar
               that fills based on (dbStock - active reservations). -->
          <InventoryWidget v-if="product?.id" :product-id="product.id" />

          <!-- Shipping estimate — a single line that sets clear
               expectations: "Get it tomorrow in Bishkek, 3-5 days
               elsewhere". The threshold message above this row already
               shows the 100$ free-shipping value, so we don't repeat it
               here — just the timing. -->
          <div class="pdp-shipping">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <span class="pdp-shipping__text">
              <strong>{{ t('product.shippingBishkek') }}</strong>
              <span class="pdp-shipping__sep">·</span>
              <span>{{ t('product.shippingOther') }}</span>
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="pdp-actions">
          <div class="pdp-qty">
            <button class="pdp-qty__btn" @click="decreaseQty" :aria-label="t('common.decreaseQty')">−</button>
            <div class="pdp-qty__value-wrapper">
               <Transition name="slide-up" mode="out-in">
                 <span :key="quantity" class="pdp-qty__value">{{ quantity }}</span>
               </Transition>
            </div>
            <button class="pdp-qty__btn" @click="increaseQty" :aria-label="t('common.increaseQty')">+</button>
          </div>
          <button
            class="btn-primary pdp-cart-btn shimmer-btn"
            @click="addToCart"
            :disabled="isOutOfStock"
            :class="{ 'is-added': justAdded }"
          >
            <Transition name="cta-swap" mode="out-in">
              <span v-if="justAdded" key="added" class="pdp-cart-btn__content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                {{ t('product.added') }}
              </span>
              <span v-else key="default" class="pdp-cart-btn__content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                {{ isOutOfStock ? t('product.outOfStock') : t('product.addToCart') }}
              </span>
            </Transition>
          </button>
        </div>

        <!-- 2026: Glassmorphism Accordions with Grid Transition -->
        <div class="pdp-details">
          <div class="pdp-info__accordions" v-if="visibleAccordions.length || product.benefits?.length || product.usage">

            <!-- Benefits -->
            <div class="pdp-accordion" :class="{ 'is-open': expandedAccordion === 'benefits' }" v-if="product.benefits?.length">
              <button class="pdp-accordion__header" @click="toggleAccordion('benefits')" :aria-expanded="expandedAccordion === 'benefits'">
                <span class="pdp-accordion__title">🌟 {{ t('product.benefits') }}</span>
                <span class="pdp-accordion__chevron">▾</span>
              </button>
              <div class="pdp-accordion__grid-wrapper">
                <div class="pdp-accordion__body">
                  <ul class="benefit-list">
                    <li v-for="(benefit, idx) in product.benefits" :key="idx">
                      <strong>{{ typeof benefit === 'string' ? benefit : (benefit.title || benefit) }}</strong>
                      <span v-if="benefit && benefit.description">: {{ benefit.description }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Usage -->
            <div class="pdp-accordion" :class="{ 'is-open': expandedAccordion === 'usage' }" v-if="product.usage">
              <button class="pdp-accordion__header" @click="toggleAccordion('usage')" :aria-expanded="expandedAccordion === 'usage'">
                <span class="pdp-accordion__title">🥄 {{ t('product.usage') }}</span>
                <span class="pdp-accordion__chevron">▾</span>
              </button>
              <div class="pdp-accordion__grid-wrapper">
                <div class="pdp-accordion__body">
                  <p>{{ tField(product, 'usage') || product.usage }}</p>
                </div>
              </div>
            </div>

            <!-- Dynamic Accordions — only sections the admin marked visible
                 (acc.isOpen !== false) are shown to customers at all; isOpen
                 doubles as "visible on storefront" per the admin form's
                 GÖRÜNÜR/GİZLİ toggle. Keyed by acc.key (the stable identity
                 from the backend), not acc.id — accordion objects never had
                 an id field, so every section previously shared `undefined`
                 as its key, making all of them expand/collapse together. -->
            <div class="pdp-accordion" :class="{ 'is-open': expandedAccordion === acc.key }" v-for="acc in visibleAccordions" :key="acc.key">
              <button class="pdp-accordion__header" @click="toggleAccordion(acc.key)" :aria-expanded="expandedAccordion === acc.key">
                <span class="pdp-accordion__title">
                  <span v-if="acc.icon" style="margin-right: 8px;">{{ acc.icon }}</span>
                  {{ accField(acc, 'title') }}
                </span>
                <span class="pdp-accordion__chevron">▾</span>
              </button>
              <div class="pdp-accordion__grid-wrapper">
                <div class="pdp-accordion__body">
                  <div v-html="accField(acc, 'content')"/>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>


    <!-- 2026: Floating Buy Bar -->
    <Transition name="fbb-slide">
      <div v-if="showFloatingBar && product" class="pdp-fbb">
        <div class="pdp-fbb__inner">
          <div class="pdp-fbb__info">
            <img :src="product.images[0]" :alt="product.name" class="pdp-fbb__img" loading="lazy" />
            <div class="pdp-fbb__text">
              <span class="pdp-fbb__price">{{ formatPrice(priceKgs) }} KGS</span>
              <span class="pdp-fbb__badge" v-if="priceKgs >= freeShippingThreshold">📦 {{ t('product.freeShipping') }}</span>
            </div>
          </div>
          <button class="btn-primary pdp-fbb__btn shimmer-btn" @click="addToCart" :disabled="isOutOfStock" :class="{ 'is-added': justAdded }">
            <span v-if="justAdded">{{ t('product.added') }} ✓</span>
            <span v-else>{{ t('product.addToCart') }} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Lightbox -->
    <Transition name="lightbox-fade">
      <div v-if="isLightboxOpen && product" class="pdp-lightbox" @click="isLightboxOpen = false">
        <button class="pdp-lightbox__close" :aria-label="t('common.close')">✕</button>
        <img :src="product.images[currentImageIndex]" :alt="product.name" class="pdp-lightbox__img" @click.stop />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.pdp-container {
  max-width: var(--container-max, 1440px);
  margin: 0 auto;
  padding: var(--space-3xl) var(--container-padding) calc(var(--space-4xl) + var(--space-2xl)) var(--container-padding);
}

.pdp-loading, .pdp-error {
  display: flex; align-items: center; justify-content: center; gap: var(--space-md);
  padding: var(--space-3xl);
  font-family: var(--font-body); font-size: 1.1rem; color: var(--text-secondary);
  border-radius: var(--radius-lg);
}
.pdp-loading__spinner {
  width: 24px; height: 24px;
  border: 3px solid var(--surface-inset); border-top-color: var(--pv-red); border-radius: 50%;
  animation: pdp-spin 0.8s linear infinite;
}
@keyframes pdp-spin { to { transform: rotate(360deg); } }

/* Grid */
.pdp-grid { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); gap: var(--space-3xl); align-items: start; }

/* Cap the gallery column on wide viewports so the product image
   doesn't dominate the layout. Mobile (<900px) collapses to one column
   in the @media query below. */
@media (min-width: 901px) {
  .pdp-gallery { max-width: 540px; }
}

/* ═══ GALLERY ═══ */
.pdp-gallery { display: flex; flex-direction: column; gap: var(--space-md); position: sticky; top: 100px; }
.pdp-gallery__main {
  position: relative; aspect-ratio: 1; border-radius: var(--radius-lg);
  background: var(--surface-white); display: flex; align-items: center; justify-content: center;
  box-shadow: var(--clay-shadow-md); cursor: zoom-in; overflow: hidden;
}
.pdp-gallery__zoom-wrapper {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  overflow: hidden; padding: var(--space-lg); box-sizing: border-box;
}
/* :deep() — the main image is a <LazyImage> child component, so its inner
   <picture>/<img> are in a different style scope and a plain descendant
   selector can't size them (left the main image blank). */
.pdp-gallery__main :deep(picture) {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
}
.pdp-gallery__main :deep(img),
.pdp-gallery__main .pdp-gallery__img {
  width: 100%; height: 100%; max-width: 100%; max-height: 100%;
  object-fit: contain; display: block;
  transition: transform 0.1s ease-out;
}
.pdp-gallery__main :deep(img.is-zooming) { padding: 0; width: 100%; height: 100%; }

.pdp-gallery__expand-hint {
  position: absolute; top: 16px; right: 16px; width: 40px; height: 40px;
  background: rgba(255,255,255,0.8); backdrop-filter: blur(8px);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  color: var(--text-primary); opacity: 0; transform: scale(0.8); transition: all var(--duration-normal) var(--ease-spring);
  pointer-events: none;
}
.pdp-gallery__main:hover .pdp-gallery__expand-hint { opacity: 1; transform: scale(1); }

.pdp-gallery__urgency {
  position: absolute; top: 16px; left: 16px; background: var(--color-error); color: white;
  padding: 6px 14px; border-radius: var(--radius-pill); font-size: 0.75rem; font-weight: 800;
  font-family: var(--font-display); letter-spacing: 0.04em; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4); z-index: 1;
}

.pdp-gallery__thumbs { display: flex; gap: var(--space-md); overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
.pdp-gallery__thumbs::-webkit-scrollbar { display: none; }
.pdp-gallery__thumb {
  position: relative; width: 88px; height: 88px; flex-shrink: 0;
  border-radius: var(--radius-md); cursor: pointer; border: none; padding: 0;
  background: var(--surface-white); box-shadow: var(--clay-shadow-xs); overflow: hidden;
}
.pdp-gallery__thumb img { position: relative; z-index: 2; width: 100%; height: 100%; object-fit: contain; padding: var(--space-sm); }

/* Liquid ring */
.pdp-gallery__thumb-liquid {
  position: absolute; inset: 0; z-index: 1; opacity: 0;
  border: 3px solid var(--pv-red); border-radius: var(--radius-md);
  transition: opacity var(--duration-normal);
}
.pdp-gallery__thumb--active .pdp-gallery__thumb-liquid { opacity: 1; box-shadow: inset 0 0 8px rgba(188,74,60,0.3); }

/* ═══ LIGHTBOX ═══ */
.pdp-lightbox {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center; cursor: zoom-out;
}
.pdp-lightbox__img { max-width: 90vw; max-height: 90vh; object-fit: contain; cursor: default; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.5)); }
.pdp-lightbox__close {
  position: absolute; top: 24px; right: 24px; width: 48px; height: 48px;
  background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 50%;
  font-size: 1.5rem; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; justify-content: center;
}
.pdp-lightbox__close:hover { background: rgba(255,255,255,0.2); }

.lightbox-fade-enter-active, .lightbox-fade-leave-active { transition: opacity 0.3s ease; }
.lightbox-fade-enter-from, .lightbox-fade-leave-to { opacity: 0; }

/* ═══ INFO ═══ */
.pdp-info { display: flex; flex-direction: column; gap: var(--space-lg); }
.pdp-breadcrumbs { font-family: var(--font-body); font-size: 0.85rem; color: var(--text-muted); }
.pdp-breadcrumbs a { color: var(--text-secondary); text-decoration: none; transition: color var(--duration-fast); }
.pdp-breadcrumbs a:hover { color: var(--pv-red); }
.pdp-breadcrumbs span { color: var(--text-primary); font-weight: 600; }

.pdp-title { font-family: var(--font-display); font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 900; color: var(--text-primary); line-height: 1.15; letter-spacing: -0.03em; margin: 0; }
.pdp-desc { font-family: var(--font-body); font-size: 1.05rem; color: var(--text-secondary); line-height: 1.65; margin: 0; }

.pdp-rating { display: flex; align-items: center; gap: var(--space-sm); }
.pdp-rating__stars { color: var(--color-star); font-size: 1.2rem; letter-spacing: 2px; }
.pdp-rating__score { font-family: var(--font-display); font-weight: 800; font-size: 1rem; color: var(--text-primary); }
.pdp-rating__count { font-family: var(--font-body); font-size: 0.85rem; color: var(--text-muted); }

/* Glass Panel for Price */
.glass-panel {
  padding: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-sm);
  border-radius: var(--radius-md); background: rgba(255,255,255,0.4);
  backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.6); box-shadow: var(--clay-shadow-sm);
}

.pdp-old-price {
  font-size: 1.4rem;
  color: var(--text-muted);
  text-decoration: line-through;
  display: block;
  margin-bottom: 5px;
}

.gamified-price-box {
  display: flex;
  flex-direction: column;
}

.pdp-level-price {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.level-badge {
  background: var(--pv-red);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
}

.pdp-current-price { font-family: var(--font-display); font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 900; color: var(--pv-red); line-height: 1; }

.pdp-stock { display: flex; align-items: center; gap: var(--space-sm); font-family: var(--font-body); font-weight: 600; font-size: 0.9rem; color: var(--color-error); }
.pdp-stock--available { color: var(--color-success); }
.pdp-stock__dot { width: 10px; height: 10px; border-radius: 50%; background: currentColor; box-shadow: 0 0 var(--space-sm) currentColor; flex-shrink: 0; }
.pdp-stock__pulse { animation: red-pulse 1.5s infinite; }

/* Shipping estimate row — sits right under the stock indicator */
.pdp-shipping {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 10px 12px;
  background: color-mix(in oklab, var(--color-success, #2D8A56) 8%, transparent);
  border: 1px solid color-mix(in oklab, var(--color-success, #2D8A56) 18%, transparent);
  border-radius: 10px;
  font-family: var(--font-body);
  font-size: 0.88rem;
  color: var(--text-secondary, #3f3f46);
  line-height: 1.3;
}
.pdp-shipping svg { color: var(--color-success, #2D8A56); flex-shrink: 0; }
.pdp-shipping__text { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.pdp-shipping__sep { opacity: 0.5; font-weight: 700; }
.pdp-shipping strong { font-weight: 700; color: var(--color-success, #2D8A56); }
@keyframes red-pulse { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }

/* Actions */
.pdp-actions { display: flex; gap: var(--space-md); margin-top: var(--space-sm); }
.pdp-qty { display: flex; align-items: center; border-radius: var(--radius-pill); background: var(--surface-white); box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid var(--surface-inset); }
.pdp-qty__btn { width: 56px; height: 60px; border: none; background: transparent; font-family: var(--font-display); font-size: 1.5rem; cursor: pointer; color: var(--text-primary); transition: background var(--duration-fast); }
.pdp-qty__btn:hover { background: var(--surface-inset); }
.pdp-qty__btn:active { transform: scale(0.92); }

.pdp-qty__value-wrapper { width: 48px; height: 60px; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; }
.pdp-qty__value { font-family: var(--font-display); font-weight: 800; font-size: 1.2rem; color: var(--text-primary); position: absolute; }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-up-enter-from { transform: translateY(100%); opacity: 0; }
.slide-up-leave-to { transform: translateY(-100%); opacity: 0; }

.pdp-cart-btn { flex: 1; height: 60px; border-radius: var(--radius-pill); font-size: 1.1rem; font-weight: 800; font-family: var(--font-display); position: relative; overflow: hidden; }
.pdp-cart-btn.is-added { background: var(--color-success); box-shadow: inset 2px 2px 4px rgba(255,255,255,0.3), 0 10px 32px rgba(16, 185, 129, 0.4); }
.pdp-cart-btn__content { display: inline-flex; align-items: center; gap: 8px; position: relative; z-index: 2; }

/* Shimmer on button */
.shimmer-btn::before {
  content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transform: skewX(-20deg); animation: shimmer-btn-anim 3s infinite; pointer-events: none; z-index: 1;
}
@keyframes shimmer-btn-anim { 100% { left: 200%; } }

.cta-swap-enter-active, .cta-swap-leave-active { transition: opacity var(--duration-fast), transform var(--duration-fast) var(--ease-spring); }
.cta-swap-enter-from { opacity: 0; transform: translateY(10px) scale(0.9); }
.cta-swap-leave-to { opacity: 0; transform: translateY(-10px) scale(0.9); }

/* ═══ ACCORDIONS ═══ */
.pdp-details { display: flex; flex-direction: column; gap: var(--space-md); margin-top: var(--space-lg); }
.pdp-accordion { border-radius: var(--radius-lg); background: rgba(255,255,255,0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.6); box-shadow: var(--clay-shadow-sm); overflow: hidden; }
.pdp-accordion__header { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: var(--space-lg) var(--space-xl); background: transparent; border: none; cursor: pointer; font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--text-primary); transition: background var(--duration-fast); }
.pdp-accordion__header:hover { background: rgba(255,255,255,0.5); }
.pdp-accordion__icon { margin-right: 8px; display: inline-block; }
.floating-icon { animation: float-icon 3s ease-in-out infinite; }
@keyframes float-icon { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }

.pdp-accordion__chevron { font-size: 1.2rem; color: var(--text-muted); transition: transform 0.4s var(--ease-spring); }
.pdp-accordion.is-open .pdp-accordion__chevron { transform: rotate(180deg); color: var(--pv-red); }

/* CSS Grid Accordion Transition */
.pdp-accordion__grid-wrapper { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.4s var(--ease-spring); }
.pdp-accordion.is-open .pdp-accordion__grid-wrapper { grid-template-rows: 1fr; }
.pdp-accordion__body { overflow: hidden; }
.pdp-accordion__body > * { padding: 0 var(--space-xl) var(--space-lg); }

.pdp-accordion__body p { font-family: var(--font-body); color: var(--text-secondary); line-height: 1.65; font-size: 1rem; margin: 0; }
.pdp-benefits { padding-left: 0; list-style: none; display: flex; flex-direction: column; gap: var(--space-sm); font-family: var(--font-body); font-size: 1rem; line-height: 1.6; }
.pdp-benefits li { position: relative; padding-left: 28px; font-weight: 500; }
.pdp-benefits li::before { content: '✓'; position: absolute; left: 0; top: 0; color: var(--color-success); font-weight: 900; width: 20px; height: 20px; background: rgba(16,185,129,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; }

/* ═══ FLOATING BUY BAR ═══ */
.pdp-fbb { position: fixed; bottom: calc(24px + env(safe-area-inset-bottom, 0)); left: 50%; transform: translateX(-50%); z-index: var(--z-fbb, 98); width: 92%; max-width: 600px; padding: 8px; background: rgba(255,255,255,0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.5); border-radius: var(--radius-pill); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15); }
.pdp-fbb__inner { display: flex; justify-content: space-between; align-items: center; gap: var(--space-md); padding: 0 4px; }
.pdp-fbb__info { display: flex; align-items: center; gap: 12px; flex: 1; }
.pdp-fbb__img { width: 44px; height: 44px; border-radius: 50%; object-fit: contain; background: white; border: 1px solid var(--surface-inset); padding: 4px; }
.pdp-fbb__text { display: flex; flex-direction: column; }
.pdp-fbb__price { font-family: var(--font-display); font-size: 1.1rem; font-weight: 900; color: var(--text-primary); line-height: 1.2; }
.pdp-fbb__badge { font-size: 0.7rem; font-weight: 800; color: var(--color-success); text-transform: uppercase; letter-spacing: 0.5px; }
.pdp-fbb__btn { padding: 10px 24px; border-radius: var(--radius-pill); font-size: 0.95rem; display: inline-flex; align-items: center; gap: 6px; }

.fbb-slide-enter-active { transition: transform 0.6s var(--ease-spring), opacity 0.4s; }
.fbb-slide-leave-active { transition: transform 0.4s var(--ease-smooth), opacity 0.3s; }
.fbb-slide-enter-from { transform: translateX(-50%) translateY(150px); opacity: 0; }
.fbb-slide-leave-to { transform: translateX(-50%) translateY(150px); opacity: 0; }

@media (max-width: 900px) {
  .pdp-container { padding: var(--space-2xl) var(--space-md) calc(140px + env(safe-area-inset-bottom)) var(--space-md); }
  .pdp-grid { grid-template-columns: 1fr; gap: var(--space-2xl); }
  .pdp-gallery { position: static; }
  .pdp-gallery__main { pointer-events: none; } /* disable zoom on mobile */
  .pdp-gallery__expand-hint { display: none; }
  .pdp-title { font-size: clamp(1.5rem, 6vw, 2rem); }
  .pdp-actions { flex-direction: column; }
  .pdp-qty { align-self: stretch; justify-content: space-between; }
  .pdp-qty__btn { width: 64px; }
  .pdp-fbb { bottom: 16px; width: calc(100% - 32px); }
  .pdp-fbb__price { font-size: 1rem; }
  .pdp-fbb__btn { padding: 10px 16px; font-size: 0.9rem; }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}

/* Daily-offer strip lives below the product info so it doesn't push the
   add-to-cart CTA off-screen. On mobile the banner stretches full-width
   and stacks above the floating buy bar (z-index still below the bar). */
.pdp-promo {
  max-width: var(--container-max, 1440px);
  margin: 0 auto var(--space-3xl);
  padding: 0 var(--space-md);
}
</style>
