<script setup lang="ts">
import { ref, shallowRef, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useTranslate } from '../../composables/useTranslate';
import { useTranslation } from '../../composables/useTranslation';

const props = defineProps<{
  title?: string;
  showCategoryText?: string;
}>();

const router = useRouter();
const { t } = useTranslate();
const { tField } = useTranslation();

interface Category {
  id: string;
  name: string;
  slug: string;
  iconEmoji: string | null;
  imageUrl: string | null;
  isActive: boolean;
}

const loading = ref(true);

// Only shown when the live /api/v1/categories call fails or returns no
// active rows — still needs real translations (rendered via tField, same
// as live category data) so an RU/KG visitor doesn't see Turkish names
// during a backend outage.
const fallbackCategories: Category[] = [
  { id: '1', name: 'Vitamin & Mineraller', slug: 'vitaminler', iconEmoji: '💊', imageUrl: null, isActive: true, translations: { ru: { name: 'Витамины и минералы' }, kg: { name: 'Витаминдер жана минералдар' } } } as unknown as Category,
  { id: '2', name: 'Kolajen Ürünleri', slug: 'kolajen', iconEmoji: '✨', imageUrl: null, isActive: true, translations: { ru: { name: 'Коллагеновые продукты' }, kg: { name: 'Коллаген азыктары' } } } as unknown as Category,
  { id: '3', name: 'Bağışıklık', slug: 'bagisiklik', iconEmoji: '🛡️', imageUrl: null, isActive: true, translations: { ru: { name: 'Иммунитет' }, kg: { name: 'Иммунитет' } } } as unknown as Category,
  { id: '4', name: 'Enerji & Odaklanma', slug: 'enerji', iconEmoji: '⚡', imageUrl: null, isActive: true, translations: { ru: { name: 'Энергия и концентрация' }, kg: { name: 'Энергия жана топтолуу' } } } as unknown as Category
];

const displayCategories = shallowRef<Category[]>([]);
const failedImages = ref<Set<string>>(new Set());
const onImageError = (id: string) => {
  failedImages.value = new Set(failedImages.value).add(id);
};

const fetchCategories = async () => {
  try {
    const res = await axios.get('/api/v1/categories');
    const list = (res.data || []).filter((c: Category) => c.isActive !== false);
    displayCategories.value = list.length > 0 ? list : fallbackCategories;
  } catch {
    displayCategories.value = fallbackCategories;
  } finally {
    loading.value = false;
  }
};

const goToCategory = (cat: Category) => {
  router.push({ path: '/katalog', query: { cat: cat.slug || cat.id } });
};

onMounted(fetchCategories);
</script>

<template>
  <section class="catg">
    <h2 class="catg__title">{{ title || t('storefront.categories') }}</h2>
    <p class="catg__subtitle">{{ t('storefront.categoriesSubtitle') }}</p>

    <div class="catg__grid">
      <button
        v-for="cat in displayCategories"
        :key="cat.id"
        class="catg__card"
        @click="goToCategory(cat)"
      >
        <!-- Full-bleed background image -->
        <img
          v-if="cat.imageUrl && !failedImages.has(cat.id)"
          :src="cat.imageUrl"
          :alt="tField(cat, 'name') || cat.name"
          class="catg__bg-image"
          loading="lazy"
          @error="onImageError(cat.id)"
        />
        <!-- Fallback: gradient + emoji when no image or image failed -->
        <div v-else class="catg__bg-fallback" :class="`catg__bg-fallback--${cat.id.slice(-1) || '1'}`">
          <span v-if="cat.iconEmoji" class="catg__fallback-emoji">{{ cat.iconEmoji }}</span>
        </div>

        <!-- Overlay label/arrow only for the emoji fallback. Designed banner
             images already carry their own category name + CTA, so we show
             them clean and full (no scrim/label covering the artwork). -->
        <template v-if="props.showCategoryText !== 'false' && (!cat.imageUrl || failedImages.has(cat.id))">
        <div class="catg__scrim" aria-hidden="true"/>

        <div class="catg__content">
          <h3 class="catg__name">{{ tField(cat, 'name') || cat.name }}</h3>
          <svg class="catg__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
        </template>
      </button>
    </div>
  </section>
</template>

<style scoped>
.catg {
  padding: var(--space-4xl) 0 var(--space-3xl) 0; /* generous breathing room (no ticker above) */
}

.catg__title {
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: 900;
  color: var(--text-primary);
  text-align: center;
  margin: 0 0 var(--space-xs) 0;
  letter-spacing: -0.03em;
}

.catg__subtitle {
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--text-muted);
  text-align: center;
  margin: 0 0 var(--space-2xl) 0;
}

.catg__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--space-lg);
}

/* ═══ CARD — horizontal banner tile. Height follows the image's natural
   aspect so the full landscape artwork fits with no crop and no letterbox. ═══ */
.catg__card {
  position: relative;
  display: block;
  padding: 0;
  cursor: pointer;
  border: 1px solid var(--border-subtle, rgba(220, 215, 205, 0.4));
  border-radius: var(--radius-xl);
  background: #ffffff;
  overflow: hidden;
  box-shadow: var(--clay-shadow-md);
  backface-visibility: hidden;
  -webkit-font-smoothing: subpixel-antialiased;
  transition:
    transform var(--duration-normal) var(--ease-spring),
    box-shadow var(--duration-normal) var(--ease-smooth);
}

.catg__card:hover {
  transform: translateY(-6px);
  box-shadow: var(--clay-shadow-lg);
}
.catg__card:active {
  transform: translateY(-2px) scale(0.99);
}

/* ═══ BANNER IMAGE — full width, natural height (fits completely) ═══ */
.catg__bg-image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  image-rendering: high-quality;
  -webkit-font-smoothing: subpixel-antialiased;
}

/* Fallback: solid gradient + emoji (landscape, matches banner shape) */
.catg__bg-fallback {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
}
.catg__bg-fallback--1 { background: linear-gradient(135deg, #a8e6cf 0%, #88d8a8 100%); }
.catg__bg-fallback--2 { background: linear-gradient(135deg, #fccde2 0%, #f8a4c8 100%); }
.catg__bg-fallback--3 { background: linear-gradient(135deg, #a8d4f5 0%, #7abcf0 100%); }
.catg__bg-fallback--4 { background: linear-gradient(135deg, #ffe0b2 0%, #ffcc80 100%); }
.catg__fallback-emoji { font-size: 3.5rem; }

/* ═══ SCRIM — bottom gradient for label readability over full-bleed image ═══ */
.catg__scrim {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.62) 0%,
    rgba(0, 0, 0, 0.28) 28%,
    rgba(0, 0, 0, 0.02) 52%,
    transparent 70%
  );
}

/* ═══ CONTENT — label + arrow at bottom ═══ */
.catg__content {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-md) var(--space-lg);
  color: #fff;
}

.catg__name {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 800;
  color: #fff;
  text-align: left;
  margin: 0;
  line-height: 1.2;
  letter-spacing: -0.01em;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.35);
}

.catg__arrow {
  color: #fff;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 50%;
  padding: 7px;
  flex-shrink: 0;
  transition:
    background var(--duration-fast),
    transform var(--duration-normal) var(--ease-spring);
}
.catg__card:hover .catg__arrow {
  background: rgba(188, 74, 60, 0.95);
  border-color: rgba(188, 74, 60, 1);
  transform: translateX(4px);
}

/* ═══ RESPONSIVE — auto-fill handles columns; force single column on phones
   so each horizontal banner shows full-width and readable. ═══ */
@media (max-width: 640px) {
  .catg { padding: var(--space-2xl) 0; }
  .catg__grid { grid-template-columns: 1fr; gap: var(--space-md); }
  .catg__name { font-size: 0.92rem; }
  .catg__content { padding: var(--space-sm) var(--space-sm) var(--space-md); }
  .catg__arrow { padding: 6px; }
}
</style>
