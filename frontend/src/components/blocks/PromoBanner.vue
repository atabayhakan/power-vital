<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useTranslate } from '../../composables/useTranslate';
import LazyImage from '../common/LazyImage.vue';

const { t } = useTranslate();

const props = defineProps({
  productName: { type: String, default: '' },
  description: { type: String, default: '' },
  oldPrice: { type: String, default: '' },
  newPrice: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  countdownHours: { type: [String, Number], default: 5 },
  /* 🛡️ ProductPicker sets this to a real product UUID after selection.
     When missing (legacy/manual config), we fall back to a name-based
     search via the catalog instead of going to /product/<garbage>. */
  productId: { type: String, default: '' },
  /* Support multi-deal: pass an array of deals as JSON string or use defaults */
  deals: { type: Array as () => Deal[], default: null }
});

interface Deal {
  id: string;
  name: string;
  desc?: string;
  oldPrice: string;
  newPrice: string;
  image: string;
  hours?: number;
  productId?: string;
}

const router = useRouter();

/* Build deal list: use props.deals if provided, otherwise build single deal from individual props */
const dealList = ref<Deal[]>([]);

const buildDeals = () => {
  if (props.deals && props.deals.length > 0) {
    dealList.value = props.deals.map((d) => ({
      ...d,
      hours: d.hours ?? (Number(props.countdownHours) || 5)
    }));
  } else {
    dealList.value = [{
      // Use productId as the primary id (real backend UUID), fall back
      // to a name-based slug only when no productId is available.
      id: props.productId || slugify(props.productName) || 'deal',
      name: props.productName,
      desc: props.description,
      oldPrice: props.oldPrice,
      newPrice: props.newPrice,
      image: props.imageUrl,
      hours: Number(props.countdownHours) || 5,
      productId: props.productId
    }];
  }
};

/* Convert a product name into a URL-safe slug for fallback navigation */
const slugify = (s: string): string => {
  if (!s) return '';
  // Turkish character map (avoid stripping İ/ı/Ü/ü/Ö/ö/Ç/ç/Ş/ş/Ğ/ğ)
  const tr: Record<string, string> = {
    'ı': 'i', 'İ': 'I', 'ü': 'u', 'Ü': 'U', 'ö': 'o', 'Ö': 'O',
    'ç': 'c', 'Ç': 'C', 'ş': 's', 'Ş': 'S', 'ğ': 'g', 'Ğ': 'G'
  };
  return s
    .split('')
    .map(c => tr[c] || c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
};

/* Live countdown */
const countdowns = ref<{ h: number; m: number; s: number }[]>([]);
let timerInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  buildDeals();
  
  // Init countdown for each deal
  countdowns.value = dealList.value.map(d => ({
    h: d.hours ?? 5,
    m: Math.floor(Math.random() * 59),
    s: Math.floor(Math.random() * 59)
  }));

  timerInterval = setInterval(() => {
    countdowns.value = countdowns.value.map(c => {
      let total = c.h * 3600 + c.m * 60 + c.s - 1;
      if (total <= 0) total = 0;
      return {
        h: Math.floor(total / 3600),
        m: Math.floor((total % 3600) / 60),
        s: total % 60
      };
    });
  }, 1000);
});

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval);
});

const pad = (n: number) => String(n).padStart(2, '0');

const goToDeal = (deal: Deal) => {
  // 🛡️ Routing fix: if the deal has a real productId (UUID), go to that
  // product page. Otherwise (legacy/manual config), search the catalog
  // by the slugified product name so the user lands on a relevant page
  // instead of "Ürün bulunamadı".
  if (deal.productId) {
    router.push(`/product/${deal.productId}`);
  } else {
    const q = encodeURIComponent(deal.name);
    router.push(`/katalog?q=${q}`);
  }
};

/* Discount percentage
   Accepts both string ("1200 KGS") and number (1200) inputs — DB rows
   sometimes store prices as raw numbers (ProductPicker auto-fill) and
   sometimes as strings. Without this guard, `oldP.replace` throws on
   numbers and the whole component fails to mount. */
const toNumber = (val: any): number => {
  if (typeof val === 'number') return isFinite(val) ? val : 0;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^\d.-]/g, '');
    const n = parseFloat(cleaned);
    return isFinite(n) ? n : 0;
  }
  return 0;
};
const calcDiscount = (oldP: any, newP: any): number => {
  const oldN = toNumber(oldP);
  const newN = toNumber(newP);
  if (!oldN || !newN) return 0;
  return Math.round(((oldN - newN) / oldN) * 100);
};
</script>

<template>
  <section class="dotd">
    <!-- Section header -->
    <div class="dotd__header">
      <div class="dotd__header-left">
        <span class="dotd__fire">🔥</span>
        <h2 class="dotd__title">{{ t('promo.title') }}</h2>
      </div>
      <p class="dotd__hint" v-if="countdowns[0]">
        <span class="dotd__clock-icon">⏱</span>
        {{ pad(countdowns[0].h) }}:{{ pad(countdowns[0].m) }}:{{ pad(countdowns[0].s) }} {{ t('promo.remaining') }}
      </p>
    </div>

    <!-- Deal cards — responsive row -->
    <div class="dotd__grid" :class="{ 'dotd__grid--multi': dealList.length > 1 }">
      <article
        v-for="(deal, idx) in dealList"
        :key="deal.id"
        class="dotd__card clay-surface"
        @click="goToDeal(deal)"
      >
        <!-- Image -->
        <div class="dotd__img-wrap">
          <LazyImage :src="deal.image" :alt="deal.name" width="600" height="400" class="dotd__img" />
          <!-- Discount badge -->
          <span class="dotd__discount" v-if="calcDiscount(deal.oldPrice, deal.newPrice)">
            %{{ calcDiscount(deal.oldPrice, deal.newPrice) }}
          </span>
        </div>

        <!-- Info -->
        <div class="dotd__info">
          <h3 class="dotd__name">{{ deal.name }}</h3>
          <p class="dotd__desc" v-if="deal.desc">{{ deal.desc }}</p>

          <!-- Timer compact -->
          <div class="dotd__timer" v-if="countdowns[idx]">
            <div class="dotd__timer-digit">
              <span>{{ pad(countdowns[idx].h) }}</span>
              <small>{{ t('promo.hours') }}</small>
            </div>
            <span class="dotd__timer-sep">:</span>
            <div class="dotd__timer-digit">
              <span>{{ pad(countdowns[idx].m) }}</span>
              <small>{{ t('promo.minutes') }}</small>
            </div>
            <span class="dotd__timer-sep">:</span>
            <div class="dotd__timer-digit">
              <span>{{ pad(countdowns[idx].s) }}</span>
              <small>{{ t('promo.seconds') }}</small>
            </div>
          </div>

          <!-- Price + CTA row -->
          <div class="dotd__bottom">
            <div class="dotd__prices">
              <span class="dotd__old">{{ deal.oldPrice }}</span>
              <span class="dotd__new">{{ deal.newPrice }}</span>
            </div>
            <button class="dotd__cta" @click.stop="goToDeal(deal)">
              {{ t('promo.grab') }}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.dotd {
  padding: var(--space-lg) 0;
}

/* ─── Header ─── */
.dotd__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.dotd__header-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.dotd__fire {
  font-size: 1.4rem;
  animation: fireWiggle 1.5s ease-in-out infinite;
}

@keyframes fireWiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-8deg) scale(1.1); }
  75% { transform: rotate(8deg) scale(1.1); }
}

.dotd__title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.dotd__hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--pv-red);
  margin: 0;
  background: rgba(188, 74, 60, 0.08);
  padding: 6px 14px;
  border-radius: var(--radius-pill);
}

.dotd__clock-icon {
  font-size: 0.9rem;
}

/* ─── Grid ─── */
.dotd__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-lg);
}

.dotd__grid--multi {
  grid-template-columns: repeat(2, 1fr);
}

/* ─── Card ─── */
.dotd__card {
  display: flex;
  align-items: stretch;
  gap: var(--space-lg);
  padding: var(--space-lg);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition:
    transform var(--duration-normal) var(--ease-spring),
    box-shadow var(--duration-normal) var(--ease-smooth);
}

.dotd__card:hover {
  transform: translateY(-3px);
  box-shadow: var(--clay-shadow-lg);
}

/* Subtle warm glow on hover */
.dotd__card::after {
  content: '';
  position: absolute;
  top: -30%;
  right: -10%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(188,74,60,0.06) 0%, transparent 70%);
  border-radius: 50%;
  opacity: 0;
  transition: opacity var(--duration-normal);
  pointer-events: none;
}
.dotd__card:hover::after {
  opacity: 1;
}

/* ─── Image ─── */
.dotd__img-wrap {
  position: relative;
  width: 180px;
  min-height: 180px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--surface-inset);
  box-shadow: var(--clay-inset);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* :deep() is required because the <img> is rendered inside the <LazyImage>
   child component (its own style scope) — a plain `.dotd__img-wrap img`
   scoped selector can't reach it, which left the image unsized (600×400,
   object-fit: fill) and clipped to a corner (looked like an empty box). */
.dotd__img-wrap :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 8px;
  box-sizing: border-box;
  transition: transform var(--duration-slow) var(--ease-kinetic);
}
.dotd__img-wrap :deep(picture) {
  display: block;
  width: 100%;
  height: 100%;
}

.dotd__card:hover .dotd__img-wrap :deep(img) {
  transform: scale(1.08);
}

.dotd__discount {
  position: absolute;
  top: var(--space-sm);
  left: var(--space-sm);
  background: var(--pv-red);
  color: var(--text-on-brand);
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 900;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px var(--pv-red-glow);
}

/* ─── Info ─── */
.dotd__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-sm);
  min-width: 0;
}

.dotd__name {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.dotd__desc {
  font-family: var(--font-body);
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ─── Compact Timer ─── */
.dotd__timer {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dotd__timer-digit {
  display: flex;
  align-items: baseline;
  gap: 2px;
  background: var(--text-primary);
  color: var(--surface-white);
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  min-width: 42px;
  justify-content: center;
}

.dotd__timer-digit span {
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 900;
  line-height: 1;
}

.dotd__timer-digit small {
  font-family: var(--font-body);
  font-size: 0.55rem;
  font-weight: 700;
  text-transform: uppercase;
  opacity: 0.5;
  letter-spacing: 0.5px;
}

.dotd__timer-sep {
  font-size: 0.85rem;
  font-weight: 900;
  color: var(--text-muted);
  line-height: 1;
}

/* ─── Bottom: Price + CTA ─── */
.dotd__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-top: var(--space-xs);
}

.dotd__prices {
  display: flex;
  align-items: baseline;
  gap: var(--space-sm);
}

.dotd__old {
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--text-muted);
  text-decoration: line-through;
  font-weight: 500;
}

.dotd__new {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--pv-red);
  line-height: 1;
}

.dotd__cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: var(--pv-gradient);
  color: var(--text-on-brand);
  border: none;
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  letter-spacing: 0.3px;
  white-space: nowrap;
  box-shadow: var(--clay-brand-inset), 0 3px 10px var(--pv-red-glow);
  transition: all var(--duration-fast) var(--ease-spring);
}

.dotd__cta:hover {
  transform: translateY(-1px);
  box-shadow: var(--clay-brand-inset), 0 6px 20px var(--pv-red-glow);
}
.dotd__cta:active {
  transform: scale(0.96);
}

/* ─── Multi-deal: make cards slimmer ─── */
.dotd__grid--multi .dotd__card {
  padding: var(--space-md);
  gap: var(--space-md);
}

.dotd__grid--multi .dotd__img-wrap {
  width: 110px;
  min-height: 110px;
}

.dotd__grid--multi .dotd__name {
  font-size: 1.05rem;
}

.dotd__grid--multi .dotd__desc {
  display: none; /* hide desc in multi-mode for compactness */
}

.dotd__grid--multi .dotd__new {
  font-size: 1.2rem;
}

/* ─── Responsive ─── */
@media (max-width: 768px) {
  .dotd__grid--multi {
    grid-template-columns: 1fr;
  }

  /* Stack card vertically: image on top, info below */
  .dotd__card {
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-md);
  }

  .dotd__img-wrap {
    width: 100%;
    min-height: 180px;
    max-height: 220px;
    aspect-ratio: 16/10;
  }

  .dotd__bottom {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    width: 100%;
  }

  .dotd__name {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .dotd__card {
    padding: var(--space-md);
    gap: var(--space-md);
  }

  .dotd__img-wrap {
    width: 100px;
    min-height: 100px;
  }

  /* Aggressive mobile sizing — keep everything within viewport */
  .dotd__name {
    font-size: 0.9rem;
    line-height: 1.3;
  }
  .dotd__desc {
    font-size: 0.78rem;
    line-height: 1.4;
  }
  .dotd__timer {
    gap: 4px;
  }
  .dotd__timer-digit {
    padding: 2px 8px;
    min-width: 40px;
  }
  .dotd__timer-digit span {
    font-size: 1rem;
  }
  .dotd__timer-digit small {
    font-size: 0.55rem;
  }
  .dotd__timer-sep {
    font-size: 1rem;
  }
  .dotd__prices {
    gap: 6px;
  }
  .dotd__old {
    font-size: 0.8rem;
  }
  .dotd__new {
    font-size: 1.05rem;
  }
  .dotd__cta {
    font-size: 0.7rem;
    padding: 6px 14px;
    letter-spacing: 0.4px;
  }
}
</style>
