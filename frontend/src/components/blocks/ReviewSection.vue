<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '../../utils/api';
import { useRoute } from 'vue-router';
import { useTranslation } from '../../composables/useTranslation';
import { useTranslate } from '../../composables/useTranslate';

const { tField } = useTranslation();
const { t, locale } = useTranslate();

const dateLocaleMap: Record<string, string> = { tr: 'tr-TR', ru: 'ru-RU', kg: 'ru-RU' };

defineProps<{
  allowNew?: boolean;
}>();

const route = useRoute();
const reviews = ref<any[]>([]);

// ═══ Curated fallback testimonials — shown on the storefront when no DB reviews
// exist yet (consistent with the app's fallback-data pattern for products/categories).
// Names are proper nouns; review text is fully localized via i18n keys. ═══
const fallbackTestimonials = computed(() => ([
  { id: 'fb1', name: 'Aizada K.', rating: 5, text: t('reviews.t1Text'), createdAt: '2026-05-12', _fallback: true },
  { id: 'fb2', name: 'Elena V.', rating: 5, text: t('reviews.t2Text'), createdAt: '2026-04-28', _fallback: true },
  { id: 'fb3', name: 'Murat A.', rating: 4, text: t('reviews.t3Text'), createdAt: '2026-04-09', _fallback: true },
]));

const isProductPage = computed(() => !!(route.params.id || route.query.id));

// What we actually render: real reviews if any, else curated testimonials on the storefront
const displayReviews = computed(() =>
  reviews.value.length > 0 ? reviews.value : (isProductPage.value ? [] : fallbackTestimonials.value)
);

// Avatar helpers — initials + deterministic warm color
const getInitials = (name: string) => {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
};
const avatarColors = ['#BC4A3C', '#D4A373', '#2D8A56', '#9A3A2E', '#D4665A', '#B45309'];
const avatarColor = (name: string) => {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) % avatarColors.length;
  return avatarColors[h];
};

const fetchReviews = async () => {
  const productId = route.params.id || route.query.id;
  try {
    if (productId) {
      const res = await api.get(`/reviews/product/${productId}`);
      reviews.value = res.data;
    } else {
      const res = await api.get('/store-reviews');
      reviews.value = res.data;
    }
  } catch (e) {
    console.error('Failed to load reviews:', e);
  }
};

onMounted(() => {
  fetchReviews();
});

const averageRating = computed(() => {
  if (displayReviews.value.length === 0) return 0;
  const sum = displayReviews.value.reduce((acc, r) => acc + r.rating, 0);
  return (sum / displayReviews.value.length).toFixed(1);
});

/* ── Pagination Logic ──────────────────────────────── */
const itemsPerPage = 5;
const currentPage = ref(1);

const totalPages = computed(() => Math.ceil(displayReviews.value.length / itemsPerPage));

const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return displayReviews.value.slice(start, start + itemsPerPage);
});

const setPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

/* ── Form state ────────────────────────────────────── */
const showForm = ref(false);
const formName = ref('');
const formRating = ref(0);
const formText = ref('');
const hoverRating = ref(0);
const isSubmitting = ref(false);

/* ── Toast state ───────────────────────────────────── */
const showToast = ref(false);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function openForm() { showForm.value = true; }
function closeForm() { showForm.value = false; resetForm(); }
function resetForm() { formName.value = ''; formRating.value = 0; formText.value = ''; hoverRating.value = 0; }

async function submitReview() {
  if (!formName.value.trim() || formRating.value === 0 || !formText.value.trim()) return;
  const productId = route.params.id || route.query.id;
  
  isSubmitting.value = true;
  try {
    if (productId) {
      await api.post('/reviews', {
        productId,
        name: formName.value,
        rating: formRating.value,
        text: formText.value
      });
    } else {
      await api.post('/store-reviews', {
        name: formName.value,
        rating: formRating.value,
        text: formText.value
      });
    }
    
    showForm.value = false;
    resetForm();

    if (toastTimer) clearTimeout(toastTimer);
    showToast.value = true;
    toastTimer = setTimeout(() => { showToast.value = false; }, 4000);
  } catch (e) {
    console.error('Failed to submit review:', e);
    alert(t('reviews.submitError'));
  } finally {
    isSubmitting.value = false;
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const loc = dateLocaleMap[locale.value] || 'tr-TR';
  return new Date(dateStr).toLocaleDateString(loc, { year: 'numeric', month: 'long', day: 'numeric' });
};
</script>

<template>
  <section class="str-reviews-section">
    <div class="rs-container">
      <h2 class="section-title">{{ t('reviews.title') }}</h2>
      <p class="section-subtitle">{{ t('reviews.subtitle') }}</p>

      <div class="reviews-grid">
      <!-- ── Summary sidebar ────────────────────────── -->
      <div class="reviews-summary clay-surface">
        <div class="sum-score">{{ averageRating }}</div>
        <div class="sum-stars">
          <span v-for="s in 5" :key="s" :class="{ active: s <= Math.round(Number(averageRating)) }">★</span>
        </div>
        <div class="sum-count">{{ t('reviews.basedOn', { count: displayReviews.length }) }}</div>
        <button class="sum-write-btn" @click="openForm">{{ t('reviews.write') }}</button>
      </div>

      <!-- ── Reviews list ───────────────────────────── -->
      <div class="reviews-list">

        <!-- Inline review form -->
        <Transition name="slide-down">
          <div v-if="showForm" class="review-form clay-surface">
            <h3 class="form-title">{{ t('reviews.write') }}</h3>

            <label class="form-label" for="rv-name">{{ t('reviews.yourName') }}</label>
            <input
              id="rv-name"
              v-model="formName"
              class="form-input"
              type="text"
              :placeholder="t('reviews.namePlaceholder')"
            />

            <label class="form-label">{{ t('reviews.yourRating') }}</label>
            <div class="star-selector">
              <span
                v-for="s in 5"
                :key="s"
                class="star-pick"
                :class="{ active: s <= (hoverRating || formRating) }"
                @mouseenter="hoverRating = s"
                @mouseleave="hoverRating = 0"
                @click="formRating = s"
              >★</span>
            </div>

            <label class="form-label" for="rv-text">{{ t('reviews.yourReview') }}</label>
            <textarea
              id="rv-text"
              v-model="formText"
              class="form-textarea"
              rows="4"
              :placeholder="t('reviews.reviewPlaceholder')"
            />

            <div class="form-actions">
              <button class="form-cancel-btn" @click="closeForm">{{ t('reviews.cancel') }}</button>
              <button
                class="form-submit-btn"
                :disabled="!formName.trim() || formRating === 0 || !formText.trim() || isSubmitting"
                @click="submitReview"
              >{{ isSubmitting ? t('reviews.submitting') : t('reviews.submit') }}</button>
            </div>
          </div>
        </Transition>

        <!-- Empty state — only on product pages with no reviews -->
        <div v-if="displayReviews.length === 0" class="empty-state">
          <div class="empty-icon">✨</div>
          <h3 class="empty-title">{{ t('reviews.emptyTitle') }}</h3>
          <p class="empty-text">{{ t('reviews.emptyText') }}</p>
        </div>
        <div v-for="rev in paginatedReviews" :key="rev.id" class="review-card clay-surface">
          <div class="rev-head">
            <div class="rev-author">
              <span class="rev-avatar" :style="{ background: avatarColor(rev.name) }">{{ getInitials(rev.name) }}</span>
              <div class="rev-author-meta">
                <span class="rev-name">{{ rev.name }}</span>
                <span class="rev-verified">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {{ t('reviews.verified') }}
                </span>
              </div>
            </div>
            <span class="rev-date">{{ formatDate(rev.createdAt) }}</span>
          </div>
          <div class="rev-stars">
            <span v-for="s in 5" :key="s" :class="{ active: s <= rev.rating }">★</span>
          </div>
          <p class="rev-text">{{ tField(rev, 'text') || rev.text }}</p>
        </div>

        <div v-if="totalPages > 1" class="rev-pagination">
          <button
            v-for="p in totalPages"
            :key="p"
            class="page-btn"
            :class="{ active: p === currentPage }"
            @click="setPage(p)"
          >
            {{ p }}
          </button>
        </div>
      </div>
    </div>
    </div>

    <!-- Toast notification -->
    <Transition name="toast-fade">
      <div v-if="showToast" class="review-toast">
        ✓ {{ t('reviews.toastSuccess') }}
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.str-reviews-section {
  position: relative;
  padding: var(--space-2xl) 0;
}

.rs-container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--container-padding);
}

.section-title {
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 var(--space-xs);
  letter-spacing: -0.03em;
  font-family: var(--font-display);
  text-align: center;
}

.section-subtitle {
  text-align: center;
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: var(--space-3xl);
}

/* ── Grid layout ───────────────────────────────── */
.reviews-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--space-3xl);
  align-items: start;
}

/* ── Summary sidebar ───────────────────────────── */
.reviews-summary {
  padding: var(--space-2xl) var(--space-xl);
  text-align: center;
  border-radius: var(--radius-2xl);
  background: var(--surface-white);
}

.sum-score {
  font-size: 5rem;
  font-weight: 900;
  color: var(--text-primary);
  line-height: 1;
  font-family: var(--font-display);
  letter-spacing: -0.05em;
}

.sum-stars {
  color: var(--color-star);
  font-size: 1.75rem;
  margin: var(--space-sm) 0;
  letter-spacing: 2px;
}

.sum-count {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: var(--space-xl);
}

.sum-write-btn {
  width: 100%;
  padding: 16px;
  background: var(--pv-gradient);
  border: none;
  color: var(--text-on-brand);
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 800;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-spring);
  box-shadow: 0 4px 16px rgba(188, 74, 60, 0.3);
}

.sum-write-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(188, 74, 60, 0.4);
}

.sum-write-btn:active {
  transform: translateY(1px);
}

/* ── Reviews list ──────────────────────────────── */
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.review-card {
  padding: var(--space-xl);
  border-radius: var(--radius-xl);
  background: var(--surface-white);
}

/* ── Empty State ───────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-4xl) var(--space-2xl);
  text-align: center;
  background: var(--surface-white);
  border-radius: var(--radius-2xl);
  box-shadow: var(--clay-shadow-sm);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--space-md);
  animation: float 3s ease-in-out infinite;
}

.empty-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.empty-text {
  font-size: 1.05rem;
  color: var(--text-secondary);
  margin: 0;
  max-width: 400px;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.rev-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: var(--space-sm);
  min-width: 0;
}

/* Author block: avatar + name + verified badge */
.rev-author {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
}
.rev-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 50%;
  color: #fff;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1rem;
  letter-spacing: 0.5px;
  box-shadow: var(--clay-shadow-sm);
}
.rev-author-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.rev-verified {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-success);
}

.rev-stars {
  color: var(--color-star);
  font-size: 1rem;
  flex-shrink: 0;
  margin-bottom: var(--space-sm);
}

.rev-date {
  font-size: 0.85rem;
  color: var(--text-muted);
  white-space: nowrap;
  min-width: 0;
}

.rev-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.rev-text {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-body);
  margin: 0;
}

/* ── Pagination ────────────────────────────────── */
.rev-pagination {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  align-items: center;
}

.page-btn {
  padding: var(--space-sm) var(--space-md);
  border: none;
  background: var(--surface-inset);
  color: var(--text-primary);
  font-weight: 600;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-smooth);
}

.page-btn:hover {
  background: var(--surface-card);
  box-shadow: var(--clay-shadow-sm);
}

.page-btn.active {
  background: var(--pv-red);
  color: var(--text-on-brand);
  box-shadow: var(--clay-shadow-sm);
}

/* ── Inline review form ────────────────────────── */
.review-form {
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  overflow: hidden;
}

.form-title {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.form-label {
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 2px solid var(--surface-inset);
  border-radius: var(--radius-sm);
  background: var(--surface-inset);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.95rem;
  transition: border-color var(--duration-fast) var(--ease-smooth);
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--pv-red);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

/* ── Star selector ─────────────────────────────── */
.star-selector {
  display: flex;
  gap: var(--space-xs);
}

.star-pick {
  font-size: 1.6rem;
  color: var(--surface-inset);
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-smooth), transform var(--duration-fast) var(--ease-smooth);
  user-select: none;
  line-height: 1;
}

.star-pick:hover {
  transform: scale(1.2);
}

.star-pick.active {
  color: var(--color-star);
}

/* ── Form actions ──────────────────────────────── */
.form-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  margin-top: var(--space-sm);
}

.form-cancel-btn {
  padding: var(--space-sm) var(--space-lg);
  border: 2px solid var(--surface-inset);
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.95rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-smooth);
}

.form-cancel-btn:hover {
  border-color: var(--text-muted);
  color: var(--text-primary);
}

.form-submit-btn {
  padding: var(--space-sm) var(--space-xl);
  border: none;
  background: var(--pv-red);
  color: var(--text-on-brand);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.95rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-smooth);
}

.form-submit-btn:hover:not(:disabled) {
  opacity: 0.9;
  box-shadow: var(--clay-shadow-md);
}

.form-submit-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ── Slide-down transition ─────────────────────── */
.slide-down-enter-active {
  transition: all var(--duration-normal) var(--ease-smooth);
}

.slide-down-leave-active {
  transition: all var(--duration-fast) var(--ease-smooth);
}

.slide-down-enter-from {
  opacity: 0;
  max-height: 0;
  transform: translateY(-12px);
}

.slide-down-enter-to {
  opacity: 1;
  max-height: 600px;
  transform: translateY(0);
}

.slide-down-leave-from {
  opacity: 1;
  max-height: 600px;
  transform: translateY(0);
}

.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-12px);
}

/* ── Toast notification ────────────────────────── */
.review-toast {
  position: absolute;
  bottom: var(--space-xl);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-success);
  color: var(--text-on-brand);
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 600;
  padding: var(--space-sm) var(--space-xl);
  border-radius: 999px;
  box-shadow: var(--clay-shadow-md);
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
}

.str-reviews-section {
  position: relative;
}

/* ── Toast fade transition ─────────────────────── */
.toast-fade-enter-active {
  transition: all var(--duration-normal) var(--ease-smooth);
}

.toast-fade-leave-active {
  transition: all var(--duration-slow) var(--ease-smooth);
}

.toast-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}

.toast-fade-enter-to {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.toast-fade-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}

/* ── Responsive ────────────────────────────────── */
@media (max-width: 992px) {
  .reviews-grid {
    grid-template-columns: 1fr;
  }
}
</style>
