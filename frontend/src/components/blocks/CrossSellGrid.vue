<script setup lang="ts">
import { ref } from 'vue';
import LazyImage from '../common/LazyImage.vue';
import { useIntersectionObserver } from '../../composables/useIntersectionObserver';

defineProps<{
  title?: string;
}>();

// Lazy-mount the entire grid once the user scrolls within 200px of it
const sectionRef = ref<HTMLElement | null>(null);
const shouldRender = useIntersectionObserver(sectionRef, { rootMargin: '300px' });

const crossSells = ref([
  { id: '1', name: 'Power Vital Karadut Özü', price: 1200, rating: 48, img: 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/abdf396c-433e-4dc4-ae67-5c43f805b42d/1080/karadut-01.webp' },
  { id: '2', name: 'Power Vital Omega 3', price: 2500, rating: 124, img: 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/33ad56e8-87bc-4af9-b202-1a893bdea410/1080/omega30.webp' },
  { id: '3', name: 'Power Vital Magnezyum', price: 3200, rating: 89, img: 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/b0668799-333b-4bd0-9c9b-508ed5ed5ff3/1080/magnezyum-calisma-yuzeyi-1.webp' },
  { id: '4', name: 'Power Vital D3K2', price: 950, rating: 256, img: 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/abdf396c-433e-4dc4-ae67-5c43f805b42d/1080/karadut-01.webp' }
]);

const formatPrice = (p: number) => p.toLocaleString('ru-RU') + ' KGS';
</script>

<template>
  <section ref="sectionRef" class="str-crosssell-section" style="min-height: 200px">
    <h2 class="section-title">{{ title || 'Çok Satanlar' }}</h2>

    <div v-if="shouldRender" class="xsell-grid">
      <article v-for="xs in crossSells" :key="xs.id" class="xsell-card clay-surface">
        <div class="xs-img-box clay-inset">
          <LazyImage :src="xs.img" :alt="xs.name" width="1080" height="1080" class="xs-img" />
        </div>
        <div class="xs-info">
          <h3 class="xs-title">{{ xs.name }}</h3>
          <div class="xs-stars">★★★★★ <small>({{ xs.rating }})</small></div>
          <div class="xs-price">{{ formatPrice(xs.price) }}</div>
          <button class="xs-cta">SEPETE EKLE</button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.section-title { font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-bottom: var(--space-xl); letter-spacing: -0.03em; font-family: var(--font-display); }

/* .clay-surface and .clay-inset use global utilities */

.xsell-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--space-lg); }
.xsell-card { padding: var(--space-md); display: flex; flex-direction: column; gap: var(--space-md); }
.xs-img-box { padding: var(--space-md); display: flex; align-items: center; justify-content: center; height: 180px; }
/* :deep() — the <img> lives inside the <LazyImage> child component's scope. */
.xs-img-box :deep(img) { max-height: 100%; max-width: 100%; object-fit: contain; mix-blend-mode: multiply; transition: transform var(--duration-slow) var(--ease-kinetic); }
.xsell-card:hover .xs-img-box :deep(img) { transform: scale(1.06); }
.xs-info { display: flex; flex-direction: column; flex: 1; }
.xs-title { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0 0 var(--space-sm) 0; font-family: var(--font-display); line-height: 1.3; }
.xs-stars { color: var(--color-star); font-size: 0.9rem; margin-bottom: var(--space-sm); }
.xs-stars small { color: var(--text-muted); font-family: var(--font-body); }
.xs-price { font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; color: var(--text-primary); margin-bottom: var(--space-md); }
.xs-cta { margin-top: auto; width: 100%; padding: var(--space-sm) var(--space-md); background: transparent; border: 2px solid var(--text-primary); border-radius: var(--radius-sm); font-family: var(--font-display); font-weight: 700; color: var(--text-primary); cursor: pointer; transition: all var(--duration-normal) var(--ease-smooth); }
.xs-cta:hover { background: var(--text-primary); color: var(--surface-white); }

@media (max-width: 640px) {
  .xsell-grid { grid-template-columns: 1fr; }
}
</style>
