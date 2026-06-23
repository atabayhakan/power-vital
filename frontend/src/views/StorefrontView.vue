<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import { usePageBuilderStore } from '../stores/usePageBuilderStore';
import { useRouter, useRoute } from 'vue-router';
import { useMlm } from '../composables/useMlm';
import { resolveComponent } from '../utils/componentRegistry';
import { useTranslate } from '../composables/useTranslate';
import FeaturedReviews from '../components/home/FeaturedReviews.vue';
import RecentlyViewed from '../components/home/RecentlyViewed.vue';
import CountdownBanner from '../components/home/CountdownBanner.vue';

const { t } = useTranslate();

// ═══ USP / Trust strip — theme-level value props (always visible) ═══
const uspItems = [
  { key: 'shipping', icon: 'M3 7h11v8H3zM14 10h4l3 3v2h-7M5.5 18.5a1.5 1.5 0 103 0M16.5 18.5a1.5 1.5 0 103 0' },
  { key: 'secure', icon: 'M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6zM9 12l2 2 4-4' },
  { key: 'fast', icon: 'M13 2L3 14h7l-1 8 10-12h-7z' },
  { key: 'authentic', icon: 'M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 19l-4.8 2.5.9-5.4L4.2 8.7l5.4-.8z' },
];

// ═══ Stores & Composables ═══
const pbStore = usePageBuilderStore();
const router = useRouter();
const route = useRoute();
const { isMlmEnabled, fetchMlmStatus } = useMlm();

const referralUsername = ref<string | null>(null);

// ═══ Bento Grid Size Map — 2026 Asymmetric Layout ═══
// Maps normalized block type → bento column class.
// Desktop strategy: each bento pair (Şampiyon+Yorumlar, Günün Fırsatı+MLM, Çok Satan+Cross-sell)
// is given full-width (12 cols). At 1024-768px breakpoint the 12-col grid collapses to 2 cols
// (1fr 1fr) so each block pairs up. Below 768px everything is single column.
const bentoSizeMap: Record<string, string> = {
  hero_slider_block: 'bento-full',
  hero_slider:       'bento-full',
  categorygridblock: 'bento-full',
  categories:        'bento-full',
  productgridblock:  'bento-full',
  featured_products: 'bento-full',
  crosssellgrid:     'bento-full',
  cross_sell:        'bento-full',
  promobanner:       'bento-full',
  deal_of_the_day:   'bento-full',
  reviewsection:     'bento-full',
  testimonials:      'bento-full',
  trust_badges:      'bento-full',
  productshowcase:   'bento-full',
  product_showcase:  'bento-full',
  certificates:      'bento-full',
  sertifikalar:      'bento-full',
  certificatesblock: 'bento-full',
  partners:          'bento-full',
  partnersblock:     'bento-full',
};

// ═══ Section Band Color Map ═══
// Maps block type → extra CSS class for full-bleed background rhythm
const bandColorMap: Record<string, string> = {
  hero_slider_block:   'band--hero',
  hero_slider:         'band--hero',
  categorygridblock:   'band--light',
  reviewsection:       'band--alt',
  testimonials:        'band--alt',
  certificatesblock:   'band--alt',
  certificates:        'band--alt',
  sertifikalar:        'band--alt',
  crosssellgrid:       'band--warm',
  cross_sell:          'band--warm',
};

const getBandClass = (type: string): string => {
  const key = type.toLowerCase().replace(/-/g, '_');
  return bandColorMap[key] ?? '';
};

/**
 * Returns the bento grid column class for a given block type.
 * Falls back to full-width if the type is unknown.
 */
const getBentoClass = (type: string): string => {
  const key = type.toLowerCase().replace(/-/g, '_');
  return bentoSizeMap[key] ?? 'bento-full';
};

// ═══ Active (Visible + Sorted) Blocks ═══
const activeBlocks = computed(() => {
  // Filter out any blocks whose component was removed from the registry
  // (e.g. campaignticker — fully decommissioned). We resolve by type so
  // any block pointing to a missing component is silently hidden instead
  // of rendering a "Bileşen Bulunamadı" placeholder.
  return pbStore.storefrontBlocks
    .filter(b => b.visible && resolveComponent(b.type))
    .sort((a, b) => a.position - b.position);
});

// ═══ IntersectionObserver Composable ═══
let observer: IntersectionObserver | null = null;

const destroyRevealObserver = () => {
  observer?.disconnect();
  observer = null;
};

const initRevealObserver = () => {
  destroyRevealObserver(); // Clean up previous if any
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer?.unobserve(entry.target);
        }
      });
    },
    { root: null, rootMargin: '0px 0px -60px 0px', threshold: 0.08 }
  );

  const revealEls = document.querySelectorAll('.storefront-page .reveal');
  revealEls.forEach((el) => observer?.observe(el));
};

// ═══ Lifecycle ═══
onMounted(async () => {
  await pbStore.fetchBlocks(); // ⬅️ Await fetch to finish!
  await fetchMlmStatus();

  if (route.query.ref) {
    referralUsername.value = route.query.ref as string;
  }

  // Now that fetchBlocks is done and state updated, wait for Vue to render DOM
  await nextTick();
  initRevealObserver();
});

onBeforeUnmount(() => {
  destroyRevealObserver();
});
</script>

<template>
  <main class="storefront-page">

    <!-- ═══ SPONSOR / REFERRAL BANNER ═══ -->
    <aside
      v-if="referralUsername && isMlmEnabled"
      class="sponsor-banner"
      role="banner"
      :aria-label="t('storefront.sponsorAria')"
    >
      <div class="bento-container sponsor-banner__inner">
        <span class="sponsor-banner__icon" aria-hidden="true">🎉</span>
        <span class="sponsor-banner__text">
          <strong>{{ referralUsername }}</strong> {{ t('storefront.sponsorInvite') }}
        </span>
        <button
          class="btn-primary sponsor-banner__cta"
          @click="router.push('/register')"
        >
          {{ t('authModal.tabRegister') }}
        </button>
      </div>
    </aside>

    <!-- ═══ LOADING SKELETON ═══ -->
    <div v-if="pbStore.isPageBuilderLoading" class="bento-container storefront-container skeleton-container">
      <div style="height: 500px; width: 100%; background: var(--surface-inset); border-radius: var(--radius-2xl); animation: skeletonPulse 1.5s infinite; margin-bottom: 24px;"/>
      <div class="bento-grid storefront-grid">
        <div style="height: 300px; width: 100%; background: var(--surface-inset); border-radius: var(--radius-2xl); animation: skeletonPulse 1.5s infinite; animation-delay: 0.2s;"/>
        <div style="height: 300px; width: 100%; background: var(--surface-inset); border-radius: var(--radius-2xl); animation: skeletonPulse 1.5s infinite; animation-delay: 0.4s;"/>
      </div>
    </div>

    <!-- ═══ EMPTY STATE ═══ -->
    <div v-else-if="activeBlocks.length === 0" class="bento-container storefront-container" style="display:flex; justify-content:center; padding: 120px 20px;">
      <div style="text-align:center; color: var(--text-secondary); max-width: 400px;">
        <span style="font-size:3rem; display:block; margin-bottom:16px; opacity:0.5;">🪹</span>
        <h2 style="font-family: var(--font-display); font-size: 1.5rem; color: var(--text-primary); margin-bottom: 8px;">{{ t('storefront.emptyTitle') }}</h2>
        <p style="font-size: 0.95rem;">{{ t('storefront.emptyDesc') }}</p>
      </div>
    </div>

    <!-- ═══ BENTO GRID — DYNAMIC BLOCKS ═══ -->
    <div v-else class="bento-container storefront-container">
      <!-- Countdown banner sits above the first bento block. Renders
           nothing when the target is in the past. -->
      <CountdownBanner />

      <div class="bento-grid storefront-grid">

        <template v-for="(block, idx) in activeBlocks" :key="block.id">
          <section
            :class="['bento-block', 'reveal', getBentoClass(block.type), getBandClass(block.type)]"
            :data-block-type="block.type"
          >
            <component
              :is="resolveComponent(block.type)"
              v-bind="block.data"
              :data="block.data"
              v-if="resolveComponent(block.type)"
            />
            <div v-else class="component-missing">
              Bileşen Bulunamadı: {{ block.type }}
            </div>
          </section>

          <!-- ═══ USP / TRUST STRIP — injected right after the hero (first block) ═══ -->
          <section v-if="idx === 0" class="bento-block bento-full reveal usp-band">
            <ul class="usp-strip">
              <li v-for="item in uspItems" :key="item.key" class="usp-item">
                <span class="usp-item__icon" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path :d="item.icon" />
                  </svg>
                </span>
                <span class="usp-item__text">
                  <span class="usp-item__title">{{ t('usp.' + item.key + 'Title') }}</span>
                  <span class="usp-item__desc">{{ t('usp.' + item.key + 'Desc') }}</span>
                </span>
              </li>
            </ul>
          </section>
        </template>

      </div>
    </div>

    <!-- ═══ FEATURED REVIEWS — first-time visitor social proof ═══
         Sits between the bento grid and the footer so a fresh visitor
         sees real customer voices before scrolling to the trust bar. -->
    <FeaturedReviews />

    <!-- ═══ RECENTLY VIEWED — re-engagement strip ═══
         Hidden when empty (first visit), otherwise shows the last 8
         products the visitor opened. Persists across sessions via
         localStorage. -->
    <RecentlyViewed />

  </main>
</template>

<style scoped>
/* ═══ STOREFRONT PAGE SHELL — 2026 ═══ */
/* 🛡️ Ambient gradients are rendered on body::before (fixed GPU layer)
   for smooth scrolling — see global style.css. This class only sets
   min-height for the storefront page. */
.storefront-page {
  min-height: 100vh;
  min-height: 100dvh;
}

/* ═══ USP / TRUST STRIP — theme-level value props under the hero ═══ */
.usp-band {
  margin-top: var(--space-lg);
}
.usp-strip {
  list-style: none;
  margin: 0;
  padding: var(--space-lg) var(--space-xl);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle, rgba(220, 215, 205, 0.5));
  border-radius: var(--radius-xl);
  box-shadow: var(--clay-shadow-md);
}
.usp-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-xs) var(--space-sm);
  position: relative;
}
/* Vertical divider between items */
.usp-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: calc(-1 * var(--space-md) / 2);
  top: 50%;
  transform: translateY(-50%);
  height: 56%;
  width: 1px;
  background: var(--border-subtle, rgba(0, 0, 0, 0.07));
}
.usp-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border-radius: 14px;
  color: var(--pv-red);
  background: var(--pv-gradient-subtle);
  box-shadow: var(--clay-shadow-sm);
}
.usp-item__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.usp-item__title {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
  letter-spacing: -0.01em;
}
.usp-item__desc {
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
  line-height: 1.3;
}

@media (max-width: 768px) {
  .usp-strip {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm);
    padding: var(--space-md);
  }
  .usp-item:nth-child(2)::after { display: none; }
  .usp-item__icon { width: 40px; height: 40px; }
  .usp-item__title { font-size: 0.85rem; }
  .usp-item__desc { font-size: 0.72rem; }
}

@keyframes skeletonPulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* ═══ CONTAINER & BENTO GRID ═══ */
.storefront-container {
  padding-top: var(--space-lg);
}
@media (max-width: 768px) {
  .storefront-container {
    padding-top: var(--space-sm, 16px);
  }
}

.storefront-grid {
  row-gap: 0; /* bands handle their own spacing */
}

/* ═══ BAND SYSTEM — full-bleed section colors ═══ */
.bento-block {
  min-width: 0;
  padding: 0; /* Let internal components handle their own spacing */
}

/* Hide empty wrappers (e.g. when a block like MLM is disabled and renders a comment node) */
.bento-block:empty,
.bento-block:not(:has(*)) {
  display: none !important;
  padding: 0 !important;
}

/* Hero — no extra padding, component manages its own */
.bento-block.band--hero {
  padding: 0;
  background: none;
}

/* Dark band — deprecated, kept for legacy blocks.
   New blocks should use .band--liquid for the modern look. */
.bento-block.band--dark {
  background: var(--surface-dark);
  padding: var(--space-3xl) var(--container-padding);
  margin: 0 calc(-1 * var(--container-padding));
  width: calc(100% + 2 * var(--container-padding));
  color: var(--text-on-dark);
}

/* 🛡️ Liquid glass band — 2026 frosted-glass effect (generic full-bleed band).
   Lets the ambient page gradient show through while giving the
   section a soft, premium look. */
.bento-block.band--liquid {
  /* Full-bleed: stretch beyond container padding so the glass reaches viewport edges */
  margin: 0 calc(-1 * var(--container-padding));
  width: calc(100% + 2 * var(--container-padding));
  padding: var(--space-3xl) var(--container-padding);
  position: relative;
  /* Frosted glass: semi-transparent white with blur + saturate */
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid rgba(255, 255, 255, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow:
    0 8px 32px rgba(188, 74, 60, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  color: var(--text-primary);
}

/* Light theme override — keep glass effect, just tune colors */
[data-theme="light"] .bento-block.band--liquid {
  background: rgba(255, 255, 255, 0.65);
  border-top-color: rgba(255, 255, 255, 0.7);
  border-bottom-color: rgba(255, 255, 255, 0.4);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

/* Dark theme — make glass slightly darker so text is readable */
[data-theme="dark"] .bento-block.band--liquid {
  background: rgba(40, 30, 25, 0.45);
  border-top-color: rgba(255, 255, 255, 0.12);
  border-bottom-color: rgba(255, 255, 255, 0.06);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  color: var(--text-on-dark, #F5F1EB);
}

/* Alt tone — Reviews, Certificates */
.bento-block.band--alt {
  background: var(--surface-section-alt);
}

/* Warm tone — Cross-sell */
.bento-block.band--warm {
  background: var(--surface-section-warm);
}

.bento-block {
  min-width: 0; /* prevent grid blowout from child overflow */
}

/* ═══ MISSING COMPONENT FALLBACK ═══ */
.component-missing {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  background: var(--surface-inset);
  border: 2px dashed var(--color-error);
  border-radius: var(--radius-lg);
  color: var(--color-error);
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 600;
}

/* ═══ SPONSOR / REFERRAL BANNER ═══ */
.sponsor-banner {
  background: var(--pv-gradient);
  color: var(--text-on-brand);
  padding: var(--space-md) 0;
  font-size: 0.95rem;
  position: relative;
  z-index: 50;
  box-shadow: 0 4px 16px rgba(188, 74, 60, 0.2);
}
.sponsor-banner__inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
}
.sponsor-banner__icon { font-size: 1.5rem; flex-shrink: 0; }
.sponsor-banner__text {
  flex: 1; text-align: center;
  font-family: var(--font-body);
  line-height: 1.4;
  font-weight: 500;
}
.sponsor-banner__text strong { font-weight: 800; }
.sponsor-banner__cta {
  flex-shrink: 0;
  padding: 10px 20px;
  min-height: 44px;
  background: var(--surface-white);
  color: var(--pv-red);
  border: none;
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-clay);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.sponsor-banner__cta:hover { transform: scale(1.05); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2); }
.sponsor-banner__cta:active { transform: scale(0.95); }

/* ═══ RESPONSIVE ═══ */
@media (max-width: 1024px) {
  .storefront-grid { row-gap: var(--space-xl); }
}
@media (max-width: 768px) {
  .sponsor-banner { padding: var(--space-sm) 0; }
  .sponsor-banner__inner {
    flex-direction: column;
    text-align: center;
    gap: var(--space-sm);
  }
  .sponsor-banner__text { font-size: 0.85rem; }
  .sponsor-banner__cta { padding: 8px 16px; font-size: 0.8rem; }
  .storefront-grid {
    row-gap: var(--space-lg);
    /* 🛡️ Force single column on mobile — the global .bento-grid is 12-col
       so even single bento-full blocks end up in the first column. */
    grid-template-columns: 1fr !important;
  }
  .storefront-container { padding: var(--space-md) 0 0; }
}
</style>
