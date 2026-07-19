<script setup lang="ts">
import { ref, watch } from 'vue';
import axios from 'axios';
import LazyImage from '../common/LazyImage.vue';
import { useIntersectionObserver } from '../../composables/useIntersectionObserver';
import { useCartStore } from '../../stores/useCartStore';
import { useTranslation } from '../../composables/useTranslation';
import { formatPrice } from '../../utils/PriceEngine';

const props = defineProps<{
  title?: string;
  limit?: string | number;
  categoryId?: string;
}>();

const cartStore = useCartStore();
const { tField } = useTranslation();

// Lazy-mount the entire grid once the user scrolls within 200px of it —
// also gates the product fetch so an admin-added-but-offscreen block
// doesn't cost a request until it's actually about to be seen.
const sectionRef = ref<HTMLElement | null>(null);
const shouldRender = useIntersectionObserver(sectionRef, { rootMargin: '300px' });

const crossSells = ref<any[]>([]);
const justAdded = ref<Set<string>>(new Set());

const fetchProducts = async () => {
  try {
    const params: Record<string, string | number> = { limit: props.limit || 4 };
    if (props.categoryId) params.categoryId = props.categoryId;
    const res = await axios.get('/api/v1/products', { params });
    crossSells.value = res.data || [];
  } catch (e) {
    console.error('Failed to load cross-sell products', e);
  }
};

watch(shouldRender, (v) => { if (v && crossSells.value.length === 0) fetchProducts(); }, { immediate: true });

const addToCart = (p: any) => {
  cartStore.addToCart({
    id: p.id,
    name: tField(p, 'name') || p.name,
    basePriceKgs: Number(p.basePriceKgs),
    imageUrl: p.images?.[0]?.imageUrl || p.images?.[0] || ''
  }, 1);
  const next = new Set(justAdded.value).add(p.id);
  justAdded.value = next;
  setTimeout(() => {
    const s = new Set(justAdded.value); s.delete(p.id); justAdded.value = s;
  }, 1500);
};
</script>

<template>
  <section ref="sectionRef" class="str-crosssell-section" style="min-height: 200px">
    <h2 class="section-title">{{ title || 'Çok Satanlar' }}</h2>

    <div v-if="shouldRender" class="xsell-grid">
      <article v-for="xs in crossSells" :key="xs.id" class="xsell-card clay-surface clay-lift">
        <div class="xs-img-box clay-inset">
          <LazyImage :src="xs.images?.[0]?.imageUrl || xs.images?.[0] || ''" :alt="tField(xs, 'name') || xs.name" width="1080" height="1080" class="xs-img" />
        </div>
        <div class="xs-info">
          <h3 class="xs-title">{{ tField(xs, 'name') || xs.name }}</h3>
          <div class="xs-stars">★★★★★</div>
          <div class="xs-price">{{ formatPrice(Number(xs.basePriceKgs)) }} KGS</div>
          <button class="xs-cta" :class="{ 'is-added': justAdded.has(xs.id) }" @click="addToCart(xs)">
            {{ justAdded.has(xs.id) ? '✓ Eklendi' : 'SEPETE EKLE' }}
          </button>
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
.xs-cta.is-added { background: var(--pv-green, #2e7d32); border-color: var(--pv-green, #2e7d32); color: #fff; }

@media (max-width: 640px) {
  .xsell-grid { grid-template-columns: 1fr; }
}
</style>
