<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useTranslation } from '../composables/useTranslation';
import { useTranslate } from '../composables/useTranslate';
import { formatPrice } from '../utils/PriceEngine';
import { useCartStore } from '../stores/useCartStore';

const settings = ref<any>({});
const topbarPhone = ref('');
const { tField } = useTranslation();
const { t } = useTranslate();
const cart = useCartStore();

const topbarShippingMsg = computed(() => tField(settings.value, 'topbarShippingMsg') || '');

/* 🛡️ Defensive strip: legacy DB rows had emoji prefixes like
   "📞 +996 771 898 889". We strip everything before the first digit/+
   so the value is always a clean phone number. Custom SVG icon handles
   the visual representation. */
const cleanPhone = (raw: string): string => {
  if (!raw) return '';
  // Remove everything before the first + or digit
  const m = raw.match(/[+\d][\d\s\-()]*/);
  return m ? m[0].trim() : raw.trim();
};

onMounted(async () => {
  try {
    const res = await axios.get('/api/v1/settings');
    if (res.data) {
      settings.value = res.data;
      topbarPhone.value = cleanPhone(res.data.topbarPhone || '');
    }
  } catch (e) {
    console.error('Failed to load topbar settings', e);
  }
});

/* Show the live progress bar only when the visitor has items in cart and
   hasn't crossed the free-shipping threshold yet. The bar fills toward 100%
   as cart grows, so the topbar becomes a passive "add $X more for free ship"
   nudge without taking extra space below it. */
const showProgress = computed(() => {
  if (!cart.items?.length) return false;
  return !cart.isFreeShipping;
});

const progressPercent = computed(() => Math.round(cart.shippingProgressPercent || 0));

/* Amount the visitor still needs to add, in KGS. */
const remainingForFreeShipping = computed(() => `${formatPrice(cart.remainingForFreeShipping)} KGS`);
</script>

<template>
  <div class="global-topbar" v-if="topbarShippingMsg || topbarPhone">
    <div class="topbar-shimmer" aria-hidden="true"/>
    <div class="topbar-mesh" aria-hidden="true"/>
    <div class="topbar-container">
      <!-- Left: Shipping message with icon + (optional) progress bar -->
      <div class="topbar-left">
        <div class="shipping-msg">
          <span class="truck-bubble" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
              <path d="M15 18H9"/>
              <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
              <circle cx="17" cy="18" r="2"/>
              <circle cx="7" cy="18" r="2"/>
            </svg>
          </span>
          <span v-if="topbarShippingMsg" class="marquee-text">{{ topbarShippingMsg }}</span>
        </div>

        <div v-if="showProgress" class="topbar-progress" :title="`${progressPercent}% to free shipping`">
          <div class="topbar-progress__fill" :style="{ width: progressPercent + '%' }"/>
          <span class="topbar-progress__hint">
            +{{ remainingForFreeShipping }} →
          </span>
        </div>

        <div v-else-if="cart.items?.length && cart.isFreeShipping" class="topbar-progress topbar-progress--done">
          <span class="topbar-progress__check">✓</span>
          <span class="topbar-progress__hint">{{ t('cart.freeShippingDone') }}</span>
        </div>
      </div>

      <!-- Right: Phone CTA -->
      <div class="topbar-right">
        <a v-if="topbarPhone" :href="'tel:' + topbarPhone.replace(/[^0-9+]/g, '')" class="phone-link">
          <span class="phone-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span class="phone-pulse" aria-hidden="true"/>
          </span>
          <span class="phone-number">{{ topbarPhone }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ═══ 2026 PREMIUM TOPBAR ═══
   The topbar is the visitor's first read of the brand promise: free
   shipping above the configured KGS threshold. We layer a deep red gradient, a moving
   shimmer, a soft mesh pattern, a frosted glass content row, and an
   optional live progress bar that nudges the visitor toward the
   threshold without stealing screen real estate. */
.global-topbar {
  /* Layered: deep base + radial highlights at both ends for depth */
  background:
    radial-gradient(120% 200% at 0% 50%, rgba(255, 138, 102, 0.45) 0%, transparent 55%),
    radial-gradient(120% 200% at 100% 50%, rgba(95, 20, 14, 0.6) 0%, transparent 55%),
    linear-gradient(
      100deg,
      #D25445 0%,
      #C8432F 28%,
      #A03323 60%,
      #8A2A1B 100%
    );
  background-size: 200% 100%, 200% 100%, 200% 100%;
  background-position: 0% 50%, 100% 50%, 0% 50%;
  animation:
    topbarGradient 14s ease-in-out infinite,
    topbarFadeIn 0.5s var(--ease-smooth, ease) backwards;

  color: #fff;
  font-family: var(--font-body, 'Inter', sans-serif);
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.015em;
  padding: 0;
  width: 100%;
  position: relative;
  z-index: 101;
  overflow: hidden;
  box-shadow:
    0 4px 20px rgba(160, 50, 35, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 0 -1px 0 rgba(0, 0, 0, 0.18);
}

/* Subtle shimmer pass — bright light streak moving across the topbar */
.topbar-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    100deg,
    transparent 30%,
    rgba(255, 255, 255, 0.22) 50%,
    transparent 70%
  );
  background-size: 200% 100%;
  animation: topbarShimmer 6s linear infinite;
  pointer-events: none;
  mix-blend-mode: overlay;
}

/* Soft mesh noise pattern — gives the red some texture instead of looking
   like a flat coloured slab. Pure CSS, no asset fetch. */
.topbar-mesh {
  position: absolute;
  inset: 0;
  opacity: 0.18;
  pointer-events: none;
  background-image:
    radial-gradient(circle at 20% 50%, rgba(255,255,255,0.6) 0, transparent 2px),
    radial-gradient(circle at 70% 30%, rgba(255,255,255,0.4) 0, transparent 2px),
    radial-gradient(circle at 40% 80%, rgba(255,255,255,0.3) 0, transparent 2px),
    radial-gradient(circle at 85% 70%, rgba(255,255,255,0.5) 0, transparent 2px);
  background-size: 90px 90px, 60px 60px, 120px 120px, 75px 75px;
  mix-blend-mode: soft-light;
}

@keyframes topbarGradient {
  0%, 100% { background-position: 0% 50%, 100% 50%, 0% 50%; }
  50%      { background-position: 50% 50%, 50% 50%, 100% 50%; }
}
@keyframes topbarShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes topbarFadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.topbar-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 10px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  position: relative;
  z-index: 2; /* above shimmer + mesh */
}

/* ───── Left: shipping message + progress bar ───── */
.topbar-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0; /* allow flex children to shrink */
  flex: 1 1 auto;
}

.shipping-msg {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  font-size: 0.62rem; /* küçültüldü — 2pt daha (kullanıcı isteği) */
  font-weight: 600;
  letter-spacing: 0.01em;
  min-width: 0;
}
.marquee-text {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Truck icon inside a glowing white bubble — instantly readable as
   "delivery" even on a 3-colour gradient. */
.truck-bubble {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.45);
  color: #fff;
  flex-shrink: 0;
  box-shadow:
    0 0 0 4px rgba(255, 255, 255, 0.06),
    0 2px 6px rgba(0, 0, 0, 0.15);
  position: relative;
}
.truck-bubble svg { width: 14px; height: 14px; }
.truck-bubble::after {
  /* slow spin ring — gives the bubble a sense of motion without
     moving the truck icon itself, so the text stays stable. */
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 1.5px solid transparent;
  border-top-color: rgba(255, 255, 255, 0.55);
  border-right-color: rgba(255, 255, 255, 0.25);
  animation: truckSpin 6s linear infinite;
  pointer-events: none;
}
@keyframes truckSpin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Progress bar: subtle hairline track + glowing cream fill. Sits
   underneath the text, only takes ~6px of vertical space. */
.topbar-progress {
  position: relative;
  height: 6px;
  width: min(360px, 60vw);
  background: rgba(0, 0, 0, 0.22);
  border-radius: 999px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
}
.topbar-progress__fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: linear-gradient(90deg, #FFE2C5 0%, #FFF1D6 50%, #FFD89A 100%);
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow:
    0 0 8px rgba(255, 220, 170, 0.7),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  overflow: hidden;
}
.topbar-progress__fill::after {
  /* moving gloss highlight along the fill */
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.55) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: progressGloss 2.4s linear infinite;
}
@keyframes progressGloss {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.topbar-progress__hint {
  position: relative;
  z-index: 1;
  margin-left: 10px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}
.topbar-progress--done {
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.3);
  width: auto;
  height: auto;
  padding: 3px 12px;
  gap: 7px;
}
/* Inside the pill the hint sits right after the check — drop the track
   inset margin so the ✓ and text read as one tight label. */
.topbar-progress--done .topbar-progress__hint { margin-left: 0; }
.topbar-progress--done .topbar-progress__check {
  color: #B6F3C4;
  font-weight: 900;
  font-size: 0.85rem;
}

/* ───── Right: phone CTA ───── */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

/* Phone link — frosted glass pill with a circular icon + pulse ring. */
.phone-link {
  color: #fff;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px 5px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 2px 6px rgba(0, 0, 0, 0.12);
  transition:
    background var(--duration-fast, 0.2s) var(--ease-smooth, ease),
    transform var(--duration-fast, 0.2s) var(--ease-spring, ease),
    box-shadow var(--duration-fast, 0.2s) var(--ease-smooth, ease);
}
.phone-link:hover {
  background: rgba(255, 255, 255, 0.32);
  transform: translateY(-1px) scale(1.02);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 6px 16px rgba(0, 0, 0, 0.22),
    0 0 0 3px rgba(255, 255, 255, 0.08);
}
.phone-link:active { transform: scale(0.98); }

.phone-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #fff;
  color: #A03323;
  flex-shrink: 0;
}
.phone-icon svg { width: 14px; height: 14px; }
.phone-pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  animation: phonePulse 2s ease-out infinite;
  z-index: -1;
}
@keyframes phonePulse {
  0%   { transform: scale(0.9); opacity: 0.55; }
  100% { transform: scale(1.7); opacity: 0; }
}

.phone-number {
  font-weight: 800;
  letter-spacing: 0.04em;
  font-size: 0.85rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  white-space: nowrap;
}

/* ═══ MOBILE ═══ */
@media (max-width: 768px) {
  .global-topbar { padding: 0 !important; }
  .topbar-container {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 5px 8px;
    padding: 8px 10px;
  }
  .topbar-left { width: 100%; align-items: center; gap: 7px; }
  /* On phones the right-side phone CTA collides with the shipping/
     free-shipping message. Hide it — the message is the primary value
     and the right side lives in the bottom nav. */
  .topbar-right { display: none; }
  .shipping-msg {
    /* Kirghiz / Russian locales push the message past 360px; let it
       wrap to a second line and shrink the line-height so the two-line
       block stays compact instead of forcing ellipsis or horizontal
       scroll. font-size is also slightly smaller than other locales
       would need. */
    font-size: 0.6rem;
    line-height: 1.25;
    text-align: center;
    justify-content: center;
    gap: 5px;
  }
  /* Allow the message to wrap; without this it would force-ellipsis a
     Cyrillic word mid-character on a 360px viewport. */
  .marquee-text {
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    text-align: center;
  }
  .truck-bubble { width: 18px; height: 18px; }
  .truck-bubble svg { width: 10px; height: 10px; }
  .topbar-progress {
    width: 100%;
    max-width: 100%;
    height: 5px;
  }
  .topbar-progress__hint { font-size: 0.6rem; margin-left: 6px; }
  /* "Kargo Bedava!" rozeti: sıkışmayı önlemek için net bir hap (pill)
     biçimi — ikon ile metin arası rahat boşluk, ortalanmış, üstte hafif
     ayraç. */
  .topbar-progress--done {
    width: auto;
    max-width: 100%;
    padding: 5px 14px;
    height: auto;
    margin-top: 1px;
    border-radius: 999px;
    gap: 7px;
    font-size: 0.66rem;
  }
  .topbar-progress--done .topbar-progress__hint { margin-left: 0; }
  .topbar-progress--done .topbar-progress__check { font-size: 0.78rem; }
  .phone-link {
    font-size: 0.7rem;
    padding: 2px 9px 2px 3px;
    gap: 4px;
  }
  .phone-icon { width: 18px; height: 18px; }
  .phone-icon svg { width: 10px; height: 10px; }
  .phone-number { font-size: 0.7rem; letter-spacing: 0.02em; }
}

/* ═══ REDUCED MOTION ═══ */
@media (prefers-reduced-motion: reduce) {
  .global-topbar,
  .topbar-shimmer,
  .truck-bubble::after,
  .topbar-progress__fill::after,
  .phone-pulse {
    animation: none !important;
  }
}
</style>
