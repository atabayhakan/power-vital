<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useTranslation } from '../../composables/useTranslation';
import { useTranslate } from '../../composables/useTranslate';
import { srcsetFor } from '../../composables/useImageSrcset';

const isExternal = (url: string) => /^https?:\/\//i.test(url || '');

const { tField } = useTranslation();
const { t } = useTranslate();
const props = defineProps<{ data?: any }>();

interface Slide {
  id: string;
  displayMode: 'IMAGE_ONLY' | 'WITH_TEXT';
  title: string;
  subtitle: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  overlayOpacity: number;
  isActive: boolean;
}

const slides = ref<Slide[]>([]);
const currentSlide = ref(0);
const prevSlideIdx = ref(-1);
const isPaused = ref(false);
const isTransitioning = ref(false);
const progress = ref(0);
const router = useRouter();
let autoplayTimer: ReturnType<typeof setInterval> | null = null;
let progressTimer: ReturnType<typeof setInterval> | null = null;

// Touch tracking
const touchStartX = ref(0);
const touchEndX = ref(0);

const AUTOPLAY_MS = 6000;
const TRANSITION_MS = 1200;

const isTextLayered = (s: Slide) => (s.displayMode || 'IMAGE_ONLY') === 'WITH_TEXT';

const fallbackSlides: Slide[] = [
  { id: '1', displayMode: 'WITH_TEXT', title: 'Hücresel Devrim Başladı', subtitle: 'Power Vital ile enerjini %100\'e çıkar.', buttonText: 'Şimdi İncele', buttonLink: '/kategori/vitaminler', imageUrl: 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/abdf396c-433e-4dc4-ae67-5c43f805b42d/1080/karadut-01.webp', mobileImageUrl: null, overlayOpacity: 55, isActive: true },
  { id: '2', displayMode: 'IMAGE_ONLY', title: 'Lipozomal Teknoloji', subtitle: null, buttonText: null, buttonLink: '/urun/omega3', imageUrl: 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/33ad56e8-87bc-4af9-b202-1a893bdea410/1080/omega30.webp', mobileImageUrl: null, overlayOpacity: 0, isActive: true }
];

const displaySlides = computed(() => {
  const active = slides.value.filter(s => s.isActive !== false);
  return active.length > 0 ? active : fallbackSlides;
});

const goToSlide = (idx: number) => {
  if (isTransitioning.value || idx === currentSlide.value) return;
  isTransitioning.value = true;
  prevSlideIdx.value = currentSlide.value;
  currentSlide.value = idx;
  progress.value = 0;
  setTimeout(() => { isTransitioning.value = false; }, TRANSITION_MS);
};

const nextSlide = () => {
  goToSlide((currentSlide.value + 1) % displaySlides.value.length);
};
const prevSlideAction = () => {
  goToSlide((currentSlide.value - 1 + displaySlides.value.length) % displaySlides.value.length);
};

// Autoplay + progress bar
const startAutoplay = () => {
  stopAutoplay();
  progress.value = 0;
  const tickMs = 30;
  progressTimer = setInterval(() => {
    if (!isPaused.value) {
      progress.value += (tickMs / AUTOPLAY_MS) * 100;
      if (progress.value >= 100) {
        progress.value = 0;
        nextSlide();
      }
    }
  }, tickMs);
};
const stopAutoplay = () => {
  if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
  if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
};

const onMouseEnter = () => { isPaused.value = true; };
const onMouseLeave = () => { isPaused.value = false; };

// Touch/swipe handlers
const onTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.changedTouches[0].screenX;
};
const onTouchEnd = (e: TouchEvent) => {
  touchEndX.value = e.changedTouches[0].screenX;
  const diff = touchStartX.value - touchEndX.value;
  if (Math.abs(diff) > 50) {
    if (diff > 0) nextSlide();
    else prevSlideAction();
  }
};

// Navigate
const onSlideClick = (slide: Slide) => {
  if (isTextLayered(slide)) return;
  if (slide.buttonLink) {
    if (slide.buttonLink.startsWith('http')) window.open(slide.buttonLink, '_blank');
    else router.push(slide.buttonLink);
  }
};
const onCtaClick = (e: Event, slide: Slide) => {
  e.stopPropagation();
  if (slide.buttonLink) {
    if (slide.buttonLink.startsWith('http')) window.open(slide.buttonLink, '_blank');
    else router.push(slide.buttonLink);
  }
};

onMounted(async () => {
  try {
    const res = await axios.get('/api/v1/slides');
    slides.value = res.data;
  } catch {
    slides.value = fallbackSlides;
  }
  startAutoplay();
});

onBeforeUnmount(() => { stopAutoplay(); });
</script>

<template>
  <section
    class="cine-slider"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
    role="region"
    aria-label="Hero Slider"
    :style="props.data?.bgColor ? { backgroundColor: props.data.bgColor } : { backgroundColor: 'transparent' }"
  >
    <!-- Slides -->
    <div class="cine-slider__stage">
      <div
        v-for="(slide, idx) in displaySlides"
        :key="slide.id"
        class="cine-slide"
        :class="{
          'is-active': currentSlide === idx,
          'is-leaving': prevSlideIdx === idx && isTransitioning,
          'is-text-layered': isTextLayered(slide),
          'is-image-only': !isTextLayered(slide)
        }"
      >
        <!-- Blurred backdrop fills the letterbox so the FULL (contained) banner
             is shown without cropping, while still looking full-bleed. -->
        <div class="cine-slide__bg" :style="{ backgroundImage: `url(${slide.imageUrl})` }"/>
        <!-- Image with Ken Burns — AVIF + WebP responsive srcset -->
        <picture class="cine-slide__picture">
          <source
            v-if="!isExternal(slide.imageUrl)"
            type="image/avif"
            :srcset="srcsetFor(slide.imageUrl, 'avif')"
            sizes="100vw"
          />
          <source
            v-if="!isExternal(slide.imageUrl)"
            type="image/webp"
            :srcset="srcsetFor(slide.imageUrl, 'webp')"
            sizes="100vw"
          />
          <source media="(max-width: 768px)" :srcset="slide.mobileImageUrl || slide.imageUrl" />
          <source media="(min-width: 769px)" :srcset="slide.imageUrl" />
          <img
            :src="slide.imageUrl"
            :alt="tField(slide, 'title') || slide.title || 'Kampanya görseli'"
            class="cine-slide__image"
            loading="lazy"
            decoding="async"
            fetchpriority="high"
          />
        </picture>

        <!-- IMAGE_ONLY: full clickable -->
        <button
          v-if="!isTextLayered(slide)"
          class="cine-slide__fullclick"
          @click="onSlideClick(slide)"
          :aria-label="tField(slide, 'title') || slide.title || 'Kampanyaya git'"
        />

        <!-- WITH_TEXT: overlay + content -->
        <template v-if="isTextLayered(slide)">
          <div
            class="cine-slide__overlay"
            :style="{ '--overlay-opacity': (slide.overlayOpacity || 50) / 100 }"
          />
          <div class="cine-slide__content">
            <h2 class="cine-slide__title">{{ tField(slide, 'title') || slide.title }}</h2>
            <p v-if="slide.subtitle" class="cine-slide__subtitle">{{ tField(slide, 'subtitle') || slide.subtitle }}</p>
            <div class="cine-slide__cta-row">
              <button
                v-if="slide.buttonText && slide.buttonLink"
                class="cine-slide__cta"
                @click="onCtaClick($event, slide)"
              >
                {{ tField(slide, 'buttonText') || slide.buttonText }}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>

              <!-- Secondary CTA — always available "shop all" escape hatch -->
              <button
                class="cine-slide__cta cine-slide__cta--secondary"
                @click.stop="router.push('/katalog')"
              >
                {{ t('hero.viewCatalog') }}
              </button>
            </div>

            <!-- Trust microcopy under CTA -->
            <ul class="cine-slide__trust">
              <li><span class="cine-slide__trust-check">✓</span>{{ t('usp.shippingTitle') }}</li>
              <li><span class="cine-slide__trust-check">✓</span>{{ t('usp.authenticTitle') }}</li>
              <li><span class="cine-slide__trust-check">✓</span>{{ t('usp.secureTitle') }}</li>
            </ul>
          </div>
        </template>
      </div>
    </div>

    <!-- Navigation -->
    <nav v-if="displaySlides.length > 1" class="cine-slider__nav">
      <button class="cine-slider__arrow" @click="prevSlideAction" aria-label="Önceki">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>

      <!-- Slide counter -->
      <div class="cine-slider__counter">
        <span class="cine-slider__current">{{ String(currentSlide + 1).padStart(2, '0') }}</span>
        <span class="cine-slider__sep">/</span>
        <span class="cine-slider__total">{{ String(displaySlides.length).padStart(2, '0') }}</span>
      </div>

      <button class="cine-slider__arrow" @click="nextSlide" aria-label="Sonraki">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </nav>

    <!-- Progress bar -->
    <div v-if="displaySlides.length > 1" class="cine-slider__progress">
      <div class="cine-slider__progress-fill" :style="{ width: progress + '%' }"/>
    </div>
  </section>
</template>

<style scoped>
/* ═══ CINEMATIC SLIDER ═══ */
.cine-slider {
  position: relative;
  width: 100%;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: transparent;
  box-shadow: none;
  cursor: grab;
}
.cine-slider:active {
  cursor: grabbing;
}

/* Desktop aspect */
@media (min-width: 769px) {
  .cine-slider {
    aspect-ratio: 16 / 7;
    max-height: 600px;
  }
}
@media (min-width: 1600px) {
  .cine-slider { max-height: 520px; }
}

/* Mobile */
@media (max-width: 768px) {
  .cine-slider {
    margin: 4px var(--space-xs, 8px);
    width: calc(100% - var(--space-sm, 16px));
    aspect-ratio: 16 / 9;
    max-height: 45vh;
    min-height: 200px;
    border-radius: var(--radius-lg);
  }
}

/* ═══ STAGE ═══ */
.cine-slider__stage {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* ═══ SLIDE ═══ */
.cine-slide {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  /* Wipe transition: clipPath from right to left */
  clip-path: inset(0 100% 0 0);
  transition: clip-path 1.2s var(--ease-kinetic);
}

.cine-slide.is-active {
  z-index: 3;
  pointer-events: auto;
  clip-path: inset(0 0 0 0);
}

.cine-slide.is-leaving {
  z-index: 2;
  pointer-events: none;
  clip-path: inset(0 0 0 0);
}

/* Blurred backdrop — a cover-fitted, blurred copy of the same banner that fills
   the letterbox left by object-fit: contain, so the full image reads cleanly. */
.cine-slide__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(28px) saturate(1.1) brightness(0.92);
  transform: scale(1.15); /* hide blurred edges */
}

/* ═══ IMAGE — Ken Burns ═══ */
.cine-slide__picture {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  overflow: hidden;
  z-index: 1;
}

.cine-slide__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain; /* show the FULL banner (was cover, which cropped it) */
  object-position: center;
  /* Ken Burns: start zoomed in, pan slightly */
  transform: scale(1.05); /* Reduced scale to prevent blur */
  transition: transform 8s ease-out;
  /* Removed will-change and backface-visibility as they cause rasterization blur in Chrome */
}

.cine-slide.is-active .cine-slide__image {
  transform: scale(1.0);
}

/* Alternate Ken Burns direction per slide */
.cine-slide:nth-child(even) .cine-slide__image {
  transform: scale(1.05);
}
.cine-slide:nth-child(even).is-active .cine-slide__image {
  transform: scale(1.0);
}

/* IMAGE_ONLY: crisp, no ken burns at all to preserve text quality */
.cine-slide.is-image-only .cine-slide__image {
  transform: scale(1.0);
  transition: none;
}
.cine-slide.is-image-only.is-active .cine-slide__image {
  transform: scale(1.0);
}

/* Mobile: disable ken burns for performance */
@media (max-width: 768px) {
  .cine-slide__image {
    transform: scale(1) !important;
    transition: none !important;
  }
}

/* ═══ OVERLAY ═══ */
.cine-slide__overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(
    160deg,
    rgba(0, 0, 0, calc(0.7 * var(--overlay-opacity, 0.5))) 0%,
    rgba(0, 0, 0, calc(0.3 * var(--overlay-opacity, 0.5))) 40%,
    rgba(0, 0, 0, calc(0.05 * var(--overlay-opacity, 0.5))) 100%
  );
}

/* ═══ FULL CLICK (IMAGE_ONLY) ═══ */
.cine-slide__fullclick {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 4;
}
.cine-slide__fullclick:hover { background: rgba(255,255,255,0.03); }
.cine-slide__fullclick:focus-visible {
  outline: 3px solid var(--pv-red);
  outline-offset: -3px;
}

/* ═══ CONTENT ═══ */
.cine-slide__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  height: 100%;
  padding: var(--space-3xl) var(--space-4xl);
  max-width: 640px;
}

/* ═══ TITLE — Clean reveal ═══ */
.cine-slide__title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 3.6rem);
  font-weight: 900;
  line-height: 1.08;
  letter-spacing: -0.03em;
  color: #FFFFFF;
  margin-bottom: var(--space-lg);
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.7s var(--ease-kinetic), transform 0.7s var(--ease-kinetic);
  transition-delay: 0.3s;
}
.cine-slide.is-active .cine-slide__title {
  opacity: 1;
  transform: translateY(0);
}

/* ═══ SUBTITLE ═══ */
.cine-slide__subtitle {
  font-family: var(--font-body);
  font-size: clamp(0.95rem, 1.8vw, 1.15rem);
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: var(--space-xl);
  max-width: 460px;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s var(--ease-kinetic), transform 0.6s var(--ease-kinetic);
  transition-delay: 0.55s;
}
.cine-slide.is-active .cine-slide__subtitle {
  opacity: 1;
  transform: translateY(0);
}

/* ═══ CTA ROW (primary + secondary) ═══ */
.cine-slide__cta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-md);
}

/* ═══ CTA BUTTON ═══ */
.cine-slide__cta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: var(--pv-gradient);
  color: var(--text-on-brand);
  border: none;
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--clay-brand-inset), 0 8px 28px var(--pv-red-glow);
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s var(--ease-kinetic), transform 0.6s var(--ease-kinetic);
  transition-delay: 0.75s;
}
.cine-slide.is-active .cine-slide__cta {
  opacity: 1;
  transform: translateY(0);
}

/* Secondary CTA — glass outline, slightly later reveal */
.cine-slide__cta--secondary {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border: 1.5px solid rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(10px) saturate(160%);
  -webkit-backdrop-filter: blur(10px) saturate(160%);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.18);
  transition-delay: 0.85s;
}
.cine-slide__cta--secondary:hover {
  background: rgba(255, 255, 255, 0.22) !important;
  border-color: rgba(255, 255, 255, 0.8);
}
.cine-slide__cta:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--clay-brand-inset), 0 12px 36px var(--pv-red-glow-strong);
}
.cine-slide__cta:active { transform: scale(0.96) !important; }
.cine-slide__cta svg {
  transition: transform var(--duration-fast) var(--ease-spring);
}
.cine-slide__cta:hover svg { transform: translateX(4px); }

/* ═══ TRUST MICROCOPY (under CTA) ═══ */
.cine-slide__trust {
  list-style: none;
  margin: var(--space-lg) 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.6s var(--ease-kinetic), transform 0.6s var(--ease-kinetic);
  transition-delay: 0.9s;
}
.cine-slide.is-active .cine-slide__trust {
  opacity: 1;
  transform: translateY(0);
}
.cine-slide__trust li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.4);
}
.cine-slide__trust-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-success, #2D8A56);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 900;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .cine-slide__trust {
    justify-content: center;
    gap: var(--space-sm);
    margin-top: var(--space-md);
  }
  .cine-slide__trust li { font-size: 0.72rem; }
}

/* ═══ NAVIGATION ═══ */
.cine-slider__nav {
  position: absolute;
  bottom: var(--space-xl);
  right: var(--space-xl);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: var(--glass-blur, blur(20px) saturate(180%));
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.cine-slider__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #FFFFFF;
  cursor: pointer;
  transition: background var(--duration-fast), transform var(--duration-fast) var(--ease-spring);
}
.cine-slider__arrow:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: scale(1.1);
}
.cine-slider__arrow:active { transform: scale(0.9); }

/* Counter (01/03 style) */
.cine-slider__counter {
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.5px;
  min-width: 48px;
  justify-content: center;
}
.cine-slider__current {
  font-size: 1.1rem;
  font-weight: 900;
  color: #FFFFFF;
}
.cine-slider__sep {
  opacity: 0.4;
  margin: 0 2px;
}
.cine-slider__total {
  opacity: 0.5;
}

/* ═══ PROGRESS BAR ═══ */
.cine-slider__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  z-index: 10;
  backdrop-filter: blur(4px);
}
.cine-slider__progress-fill {
  height: 100%;
  background: var(--pv-gradient, linear-gradient(135deg, #BC4A3C 0%, #D8412F 100%));
  transition: width 30ms linear;
  box-shadow: 0 0 12px rgba(188, 74, 60, 0.8), 0 0 4px rgba(188, 74, 60, 0.5);
  border-radius: 0 4px 4px 0;
}

/* ═══ MOBILE OVERRIDES ═══ */
@media (max-width: 768px) {
  .cine-slide__content {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    padding: var(--space-lg) var(--space-md);
    padding-bottom: calc(var(--space-xl) + var(--space-lg));
    justify-content: flex-end;
    align-items: center;
    text-align: center;
    max-width: 100%;
  }

  .cine-slide__overlay {
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.75) 0%,
      rgba(0, 0, 0, 0.2) 50%,
      transparent 100%
    );
  }

  .cine-slide__title {
    font-size: clamp(1.3rem, 6vw, 1.8rem);
    margin-bottom: var(--space-sm);
  }

  .cine-slide__subtitle {
    font-size: clamp(0.85rem, 1.5vw, 1rem);
    margin-bottom: var(--space-lg);
  }

  .cine-slider__nav {
    bottom: var(--space-sm);
    right: var(--space-sm);
    padding: var(--space-3xs) var(--space-xs);
    gap: var(--space-sm);
  }
  .cine-slider__arrow { width: 26px; height: 26px; }
  .cine-slider__counter { font-size: 0.7rem; min-width: 36px; }
  .cine-slider__current { font-size: 0.8rem; }
}

/* ═══ REDUCED MOTION ═══ */
@media (prefers-reduced-motion: reduce) {
  .cine-slide {
    clip-path: inset(0 0 0 0) !important;
    transition: opacity 0.3s ease !important;
    opacity: 0;
  }
  .cine-slide.is-active { opacity: 1; }
  .cine-slide__image {
    transform: none !important;
    transition: none !important;
  }
  .cine-slide__title,
  .cine-slide__subtitle,
  .cine-slide__cta {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
</style>
