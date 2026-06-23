<script setup lang="ts">
// TrustStrip — a horizontal row of 4 trust badges that sits right
// under the hero on the home page. Shoppers who land from an ad see
// these within the first scroll, before they decide to keep reading.
//
//   🛡 GMP certified        — quality manufacturing
//   🌿 Natural ingredients  — plant-based / safe formulas
//   🚚 Fast shipping        — 1-2 days in Bishkek
//   ↩  14-day returns       — risk-free purchase
//
// Strings are in vue-i18n (key: trust.*). When a locale is missing a
// key the TR default renders (Vue I18n fallback chain).

import { useTranslate } from '../../composables/useTranslate';
const { t } = useTranslate();

interface Badge {
  icon: string;
  titleKey: string;
  subKey: string;
}

const badges: Badge[] = [
  { icon: '🛡️', titleKey: 'trust.gmpTitle',     subKey: 'trust.gmpSub' },
  { icon: '🌿', titleKey: 'trust.naturalTitle', subKey: 'trust.naturalSub' },
  { icon: '🚚', titleKey: 'trust.shippingTitle', subKey: 'trust.shippingSub' },
  { icon: '↩️', titleKey: 'trust.returnsTitle',  subKey: 'trust.returnsSub' }
];
</script>

<template>
  <section class="trust-strip" aria-label="Trust badges">
    <div class="trust-container">
      <div v-for="b in badges" :key="b.titleKey" class="trust-badge">
        <span class="trust-icon" aria-hidden="true">{{ b.icon }}</span>
        <div class="trust-text">
          <span class="trust-title">{{ t(b.titleKey) }}</span>
          <span class="trust-sub">{{ t(b.subKey) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.trust-strip {
  background:
    linear-gradient(
      180deg,
      color-mix(in oklab, var(--surface-white, #fff) 88%, transparent) 0%,
      color-mix(in oklab, var(--surface-white, #fff) 96%, transparent) 100%
    );
  border-top: 1px solid color-mix(in oklab, var(--pv-red, #BC4A3C) 8%, transparent);
  border-bottom: 1px solid color-mix(in oklab, var(--pv-red, #BC4A3C) 8%, transparent);
  padding: 18px 24px;
  width: 100%;
}

.trust-container {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  align-items: center;
}

.trust-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
  border-radius: 12px;
  transition: background 0.2s ease;
}
.trust-badge:hover {
  background: rgba(188, 74, 60, 0.04);
}

.trust-icon {
  font-size: 1.6rem;
  line-height: 1;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.08));
}

.trust-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.trust-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.92rem;
  color: var(--text-primary, #18181b);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trust-sub {
  font-family: var(--font-body);
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-muted, #71717a);
  line-height: 1.3;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .trust-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .trust-icon { font-size: 1.3rem; }
  .trust-title { font-size: 0.82rem; }
  .trust-sub { font-size: 0.7rem; }
}

@media (prefers-reduced-motion: reduce) {
  .trust-badge { transition: none; }
}
</style>
