<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import LazyImage from '../common/LazyImage.vue';

const props = defineProps<{
  product?: any;
  defaultGallery?: string[];
}>();

const emit = defineEmits(['add-to-cart']);

const quantity = ref(1);
const mainImage = ref('');
const thumbnails = ref<string[]>([]);

const resolvedProduct = computed(() => {
  return props.product || {
    id: 'demo',
    name: 'Örnek Premium Ürün',
    basePriceUsd: 49.90,
    basePriceKgs: 4500,
    oldPriceKgs: 5500,
    stockQuantity: 100,
    images: [{ imageUrl: 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/b0668799-333b-4bd0-9c9b-508ed5ed5ff3/1080/magnezyum-calisma-yuzeyi-1.webp' }]
  };
});

watch(() => resolvedProduct.value, (newVal) => {
  if (newVal) {
    if (newVal.images && newVal.images.length > 0) {
      thumbnails.value = newVal.images.map((i: any) => i.imageUrl || i);
    } else if (props.defaultGallery && props.defaultGallery.length > 0) {
      thumbnails.value = [...props.defaultGallery];
    } else {
      thumbnails.value = ['https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/b0668799-333b-4bd0-9c9b-508ed5ed5ff3/1080/magnezyum-calisma-yuzeyi-1.webp'];
    }
    mainImage.value = thumbnails.value[0];
  }
}, { immediate: true });

const selectImage = (img: string) => {
  mainImage.value = img;
};

const increment = () => quantity.value++;
const decrement = () => { if (quantity.value > 1) quantity.value--; };

const formatPrice = (p: number) => p ? p.toLocaleString('ru-RU') + ' KGS' : '0 KGS';

const accordions = ref([
  { title: 'Ürün Açıklaması', content: 'Vücudunuzun ihtiyacı olan tüm esansiyel vitaminleri ve mineralleri lipozomal teknoloji ile hücrelerinize doğrudan taşır.', isOpen: true },
  { title: 'Kullanım Önerisi', content: 'Günde 1 saşe 1 bardak suya karıştırılarak tok karnına tüketilmesi tavsiye edilir.', isOpen: false },
  { title: 'Aktif Bileşenler', content: 'C Vitamini, Çinko, Magnezyum, B Kompleks Vitaminleri.', isOpen: false }
]);

const toggleAccordion = (index: number) => {
  accordions.value[index].isOpen = !accordions.value[index].isOpen;
};

const triggerAddToCart = () => {
  emit('add-to-cart', quantity.value);
};
</script>

<template>
  <section class="cms-product-showcase">
    <!-- LEFT: Media Showcase -->
    <div class="str-media-col">
      <div class="str-thumb-gallery">
        <button class="thumb-arrow">▲</button>
        <div 
          v-for="(img, idx) in thumbnails" 
          :key="idx" 
          class="str-thumb clay-inset"
          :class="{ 'is-active': mainImage === img }"
          @click="selectImage(img)"
        >
          <LazyImage :src="img" alt="Thumbnail" width="80" height="80" class="str-thumb__img" />
        </div>
        <button class="thumb-arrow">▼</button>
      </div>
      <div class="str-main-img clay-surface">
        <LazyImage :src="mainImage" :alt="resolvedProduct?.name || 'Ürün Görseli'" :eager="true" width="800" height="800" sizes="(max-width: 1024px) 100vw, 50vw" class="str-main__img" />
      </div>
    </div>

    <!-- RIGHT: Buy Box -->
    <div class="str-info-col" v-if="resolvedProduct">
      <h1 class="str-title">{{ resolvedProduct.name }}</h1>
      
      <div class="str-rating-row">
        <div class="str-stars">★★★★★</div>
        <span class="str-review-link">124 Değerlendirme</span>
      </div>

      <div class="str-price-box">
        <span class="str-old-price" v-if="resolvedProduct.oldPriceKgs">{{ formatPrice(resolvedProduct.oldPriceKgs) }}</span>
        <span class="str-new-price">{{ formatPrice(resolvedProduct.basePriceKgs) }}</span>
      </div>

      <!-- Action Row -->
      <div class="str-action-row">
        <div class="str-qty-box clay-inset">
          <button class="qty-btn" @click="decrement">-</button>
          <span class="qty-val">{{ quantity }}</span>
          <button class="qty-btn" @click="increment">+</button>
        </div>
        
        <button class="str-cta-btn" @click="triggerAddToCart">
          <span class="cta-text">SEPETE EKLE</span>
          <div class="cta-glow"/>
        </button>
        
        <button class="str-heart-btn clay-surface">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#BC4A3C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      <!-- Trust Badges -->
      <div class="str-trust-row">
        <div class="trust-badge">
          <span class="t-icon">⚡</span><span class="t-text">Aynı Gün Kargo</span>
        </div>
        <div class="trust-badge">
          <span class="t-icon">⭐</span><span class="t-text">100K+ Mutlu Müşteri</span>
        </div>
      </div>

      <!-- Accordion -->
      <div class="str-accordions">
        <div 
          v-for="(acc, i) in accordions" 
          :key="i" 
          class="str-accordion clay-surface"
          :class="{ 'is-open': acc.isOpen }"
        >
          <div class="acc-head" @click="toggleAccordion(i)">
            <span class="acc-title">{{ acc.title }}</span>
            <span class="acc-icon">{{ acc.isOpen ? '−' : '+' }}</span>
          </div>
          <div class="acc-body" :style="{ maxHeight: acc.isOpen ? '200px' : '0' }">
            <div class="acc-content">{{ acc.content }}</div>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
/* Display font for headings, prices, and CTAs */
h1, .str-new-price, .cta-text, .qty-val, .acc-title {
  font-family: var(--font-display);
}

.cms-product-showcase {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  margin: 40px 0;
}

/* Left: Media */
.str-media-col { display: flex; gap: 16px; height: 600px; }
.str-thumb-gallery { display: flex; flex-direction: column; gap: 12px; width: 80px; }
.thumb-arrow { background: transparent; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer; padding: 4px; }
.str-thumb { width: 80px; height: 80px; padding: 6px; cursor: pointer; transition: all var(--duration-fast) var(--ease-smooth); border: 2px solid transparent; }
.str-thumb.is-active { border-color: var(--pv-red); }
.str-thumb :deep(img) { width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply; }
.str-main-img { flex: 1; padding: 24px; display: flex; align-items: center; justify-content: center; }
.str-main-img :deep(img) { width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply; }

/* Right: Buy Box */
.str-info-col { display: flex; flex-direction: column; gap: 20px; }
.str-title { font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1.2; letter-spacing: -0.5px; }
.str-rating-row { display: flex; align-items: center; gap: 12px; }
.str-stars { color: var(--color-star); font-size: 1.1rem; letter-spacing: 2px; }
.str-review-link { color: var(--pv-red); font-weight: 600; font-size: 0.9rem; text-decoration: underline; }
.str-price-box { display: flex; align-items: baseline; gap: 16px; }
.str-old-price { font-size: 1.4rem; color: var(--text-muted); text-decoration: line-through; font-weight: 500; }
.str-new-price { font-size: 2.4rem; font-weight: 900; color: var(--pv-red); }

/* Action Row */
.str-action-row { display: flex; gap: 16px; margin-top: 10px; height: 64px; }
.str-qty-box { display: flex; align-items: center; justify-content: space-between; width: 140px; padding: 0 8px; }
.qty-btn { width: 40px; height: 40px; border: none; background: transparent; font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; transition: transform var(--duration-fast) var(--ease-kinetic); }
.qty-btn:active { transform: scale(0.9); }
.qty-val { font-size: 1.4rem; font-weight: 800; }
.str-cta-btn {
  position: relative; flex: 1; border: none; border-radius: var(--radius-md);
  background: var(--pv-gradient); color: #fff; cursor: pointer;
  box-shadow: var(--clay-brand-inset), var(--clay-shadow-md);
  transition: transform var(--duration-fast) var(--ease-spring);
  display: flex; align-items: center; justify-content: center;
}
.str-cta-btn:active { transform: scale(0.96); }
.cta-text { font-size: 1.2rem; font-weight: 900; letter-spacing: 1px; z-index: 2; }
.cta-glow { position: absolute; inset: -4px; background: var(--pv-gradient); filter: blur(12px); opacity: 0.4; z-index: 1; transition: opacity var(--duration-fast) var(--ease-smooth); }
.str-cta-btn:hover .cta-glow { opacity: 0.6; }
.str-heart-btn { width: 64px; height: 64px; border: none; border-radius: var(--radius-md); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform var(--duration-fast) var(--ease-kinetic); }
.str-heart-btn:active { transform: scale(0.9); }

/* Trust Badges & Accordions */
.str-trust-row { display: flex; justify-content: space-between; gap: 12px; margin-top: 16px; padding: 16px 0; border-top: 1px solid var(--surface-inset); border-bottom: 1px solid var(--surface-inset); }
.trust-badge { display: flex; align-items: center; gap: 8px; }
.t-icon { font-size: 1.4rem; }
.t-text { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
.str-accordions { display: flex; flex-direction: column; gap: 12px; margin-top: 10px; }
.str-accordion { border-radius: var(--radius-md); overflow: hidden; transition: box-shadow var(--duration-fast) var(--ease-smooth); }
.acc-head { padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none; }
.acc-title { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); }
.acc-icon { font-size: 1.4rem; color: var(--pv-red); font-weight: 400; transition: transform var(--duration-fast) var(--ease-smooth); }
.is-open .acc-icon { transform: rotate(180deg); }
.acc-body { transition: max-height var(--duration-normal) var(--ease-smooth); overflow: hidden; }
.acc-content { padding: 0 20px 20px 20px; font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6; }

@media (max-width: 992px) {
  .cms-product-showcase { grid-template-columns: 1fr; }
  .str-media-col { height: auto; flex-direction: column-reverse; }
  .str-thumb-gallery { flex-direction: row; width: 100%; justify-content: center; }
}
@media (max-width: 640px) {
  .str-action-row { flex-wrap: wrap; height: auto; }
  .str-qty-box, .str-cta-btn { width: 100%; flex: none; height: 54px; }
}
</style>
