<script setup lang="ts">
// FeaturedReviews — a compact, premium-looking strip showing the 3 most
// recent published store reviews. Lives on the home page right after
// the product grid so first-time visitors see social proof before they
// hit the footer.
//
// Backend: GET /api/v1/store-reviews (public, returns only published).
// We slice the response to the first 3; backend gives us everything
// ordered by createdAt desc.
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useTranslate } from '../../composables/useTranslate';

interface StoreReview {
  id: string;
  name: string;
  rating: number;
  text: string;
  createdAt: string;
  translations?: string;
}

const { t } = useTranslate();
const reviews = ref<StoreReview[]>([]);
const isLoading = ref(false);
const errorMsg = ref('');

// Localised text helper — read `translations[locale].text` from the
// storeReview if present (post-i18n), else fall back to the base text.
// We can't read t.locale from the i18n t() shorthand, so we read it
// from the document root <html lang="..."> attribute which the i18n
// plugin keeps in sync.
const currentLocale = (): string => {
  const lang = document.documentElement.lang || 'kg';
  return lang.slice(0, 2).toLowerCase();
};

const localisedText = (r: StoreReview): string => {
  if (!r.translations) return r.text;
  try {
    const map = typeof r.translations === 'string' ? JSON.parse(r.translations) : r.translations;
    return map?.[currentLocale()]?.text || r.text;
  } catch {
    return r.text;
  }
};

const starIcons = computed(() => Array.from({ length: 5 }, (_, i) => i));

const fetchReviews = async () => {
  isLoading.value = true;
  try {
    const res = await axios.get('/api/v1/store-reviews');
    if (Array.isArray(res.data)) {
      // Take the 3 most recent (already ordered desc) but skip empty
      // text rows that would render as an empty card.
      reviews.value = res.data.filter((r: any) => r.text && r.text.trim().length > 0).slice(0, 3);
    }
  } catch (e: any) {
    errorMsg.value = e?.message || 'Failed to load reviews';
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchReviews);

const initialOf = (name: string): string => {
  return (name || '?').trim().charAt(0).toUpperCase();
};
</script>

<template>
  <section class="fr-section">
    <header class="fr-head">
      <h2 class="fr-title">⭐ {{ t('reviews.featuredTitle') }}</h2>
      <p class="fr-sub">{{ t('reviews.featuredSub') }}</p>
    </header>

    <div v-if="isLoading" class="fr-loading">
      <div v-for="n in 3" :key="n" class="fr-skel" />
    </div>

    <p v-else-if="errorMsg || reviews.length === 0" class="fr-empty">
      {{ reviews.length === 0 ? t('reviews.empty') : errorMsg }}
    </p>

    <div v-else class="fr-grid">
      <article v-for="r in reviews" :key="r.id" class="fr-card">
        <div class="fr-stars" :aria-label="`${r.rating} / 5`">
          <svg
            v-for="i in starIcons"
            :key="i"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            :fill="i < r.rating ? 'currentColor' : 'none'"
            stroke="currentColor"
            stroke-width="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <blockquote class="fr-text">"{{ localisedText(r) }}"</blockquote>
        <footer class="fr-meta">
          <span class="fr-avatar" aria-hidden="true">{{ initialOf(r.name) }}</span>
          <span class="fr-name">{{ r.name }}</span>
        </footer>
      </article>
    </div>
  </section>
</template>

<style scoped>
.fr-section {
  padding: 56px 24px 64px;
  max-width: 1280px;
  margin: 0 auto;
}

.fr-head { text-align: center; margin-bottom: 32px; }
.fr-title {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 3.6vw, 2.4rem);
  font-weight: 900;
  color: var(--text-primary, #18181b);
  margin: 0;
  letter-spacing: -0.4px;
}
.fr-sub {
  font-family: var(--font-body);
  color: var(--text-muted, #71717a);
  margin-top: 6px;
  font-size: 0.95rem;
}

.fr-loading,
.fr-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.fr-skel {
  height: 200px;
  border-radius: 18px;
  background: linear-gradient(
    100deg,
    rgba(0, 0, 0, 0.04) 30%,
    rgba(0, 0, 0, 0.08) 50%,
    rgba(0, 0, 0, 0.04) 70%
  );
  background-size: 200% 100%;
  animation: frShimmer 1.4s linear infinite;
}
@keyframes frShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.fr-empty {
  text-align: center;
  color: var(--text-muted, #71717a);
  font-family: var(--font-body);
  padding: 32px 0;
}

.fr-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px 20px;
  background: var(--surface-white, #fff);
  border: 1px solid color-mix(in oklab, var(--pv-red, #BC4A3C) 8%, transparent);
  border-radius: 18px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.fr-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(188, 74, 60, 0.10);
}

.fr-stars {
  display: flex;
  gap: 2px;
  color: #f59e0b;
}
.fr-text {
  font-family: var(--font-body);
  font-size: 0.95rem;
  line-height: 1.55;
  color: var(--text-primary, #18181b);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-style: italic;
}
.fr-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}
.fr-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #BC4A3C 0%, #D9633E 100%);
  color: #fff;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.85rem;
  flex-shrink: 0;
}
.fr-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-secondary, #3f3f46);
}

@media (max-width: 768px) {
  .fr-loading,
  .fr-grid { grid-template-columns: 1fr; gap: 14px; }
  .fr-skel { height: 160px; }
}
@media (prefers-reduced-motion: reduce) {
  .fr-skel { animation: none; }
  .fr-card { transition: none; }
}
</style>
