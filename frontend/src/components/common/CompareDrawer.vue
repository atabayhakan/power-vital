<script setup lang="ts">
// CompareDrawer — a slide-in panel from the right that shows the
// products the visitor wants to compare side-by-side. Mirrors the
// SlideOutCart pattern so the UI feels consistent.
//
// The drawer is triggered by the navbar CompareBadge (count pill)
// OR by clicking the "Compare" pill at the bottom of the screen.
// Both dispatch a `pv-open-compare` window event that this
// component listens to.
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCompare } from '../../composables/useCompare';
import { formatPrice } from '../../utils/PriceEngine';
import { useTranslate } from '../../composables/useTranslate';
import { useAuthStore } from '../../stores/useAuthStore';
import { useCartStore } from '../../stores/useCartStore';
import LazyImage from '../common/LazyImage.vue';

const router = useRouter();
const compare = useCompare();
const { t } = useTranslate();
const authStore = useAuthStore();
const cartStore = useCartStore();

const isOpen = ref(false);
const flashId = ref<string | null>(null);

const open = () => { isOpen.value = true; };
const close = () => { isOpen.value = false; };
const toggle = () => { isOpen.value = !isOpen.value; };

// Expose a tiny imperative API on window for the navbar badge
// and other ad-hoc triggers (admin views, deep-link boot, etc.).
onMounted(() => {
  window.addEventListener('pv-open-compare', open);
  window.addEventListener('pv-close-compare', close);
  window.addEventListener('pv-toggle-compare', toggle);
});
onBeforeUnmount(() => {
  window.removeEventListener('pv-open-compare', open);
  window.removeEventListener('pv-close-compare', close);
  window.removeEventListener('pv-toggle-compare', toggle);
});

const cheapest = computed(() => {
  if (compare.recent.value.length < 2) return null;
  return compare.recent.value.reduce((min, p) =>
    (p.basePriceKgs || 0) < (min.basePriceKgs || Infinity) ? p : min
  , compare.recent.value[0]);
});

const addAllToCart = () => {
  if (authStore.userRole === 'guest') {
    // Encourage sign-in but still allow it: open the auth modal
    // and keep the drawer open so the user can come back.
    window.dispatchEvent(new CustomEvent('open-auth-modal'));
    return;
  }
  for (const p of compare.recent.value) {
    cartStore.addToCart({
      id: p.id,
      name: p.name,
      basePriceKgs: p.basePriceKgs,
      imageUrl: p.imageUrl
    }, 1);
  }
  compare.clear();
  isOpen.value = false;
  window.dispatchEvent(new CustomEvent('open-cart'));
};

const removeOne = (id: string) => {
  compare.remove(id);
  flashId.value = id;
  setTimeout(() => { if (flashId.value === id) flashId.value = null; }, 250);
};

const goToProduct = (id: string) => {
  isOpen.value = false;
  router.push(`/product/${id}`);
};

const goToCompare = () => {
  isOpen.value = false;
  router.push('/compare');
};
</script>

<template>
  <Transition name="cd-fade">
    <div v-if="isOpen" class="cd-backdrop" @click="close" aria-hidden="true" />
  </Transition>
  <Transition name="cd-slide">
    <aside v-if="isOpen" class="cd-drawer" role="dialog" aria-label="Product comparison">
      <header class="cd-head">
        <h2 class="cd-title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h12"/>
            <path d="M17 18l3-3-3-3"/>
          </svg>
          {{ t('compare.title') }}
          <span class="cd-count" aria-label="items in compare">({{ compare.count.value }}/{{ compare.max }})</span>
        </h2>
        <button class="cd-close" @click="close" :aria-label="t('common.close')">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </header>

      <div v-if="compare.isEmpty.value" class="cd-empty">
        <span class="cd-empty-icon" aria-hidden="true">📊</span>
        <p class="cd-empty-title">{{ t('compare.emptyTitle') }}</p>
        <p class="cd-empty-sub">{{ t('compare.emptySub') }}</p>
        <button class="cd-cta cd-cta--primary" @click="close">{{ t('compare.continueShopping') }}</button>
      </div>

      <div v-else class="cd-body">
        <div class="cd-grid">
          <article
            v-for="p in compare.recent.value"
            :key="p.id"
            class="cd-cell"
            :class="{ 'is-best': cheapest && cheapest.id === p.id, 'is-flash': flashId === p.id }"
          >
            <button class="cd-remove" @click="removeOne(p.id)" :aria-label="t('compare.removeFromCompare')">✕</button>
            <button class="cd-product" @click="goToProduct(p.id)">
              <div class="cd-img-wrap">
                <LazyImage v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" :width="160" :height="160" />
                <span v-else class="cd-noimg">📦</span>
              </div>
              <span class="cd-cat" v-if="p.category">{{ p.category }}</span>
              <span class="cd-name">{{ p.name }}</span>
              <span class="cd-price" :class="{ 'is-best-price': cheapest && cheapest.id === p.id }">
                {{ formatPrice(p.basePriceKgs) }} KGS
                <span v-if="cheapest && cheapest.id === p.id" class="cd-best-badge">💰 {{ t('compare.bestPrice') }}</span>
              </span>
            </button>
          </article>

          <!-- Empty cells fill the row up to 4 -->
          <div
            v-for="n in (compare.max - compare.recent.value.length)"
            :key="`slot-${n}`"
            class="cd-cell cd-cell--empty"
          >
            <span class="cd-plus" aria-hidden="true">+</span>
            <span class="cd-cell-hint">{{ t('compare.slotHint') }}</span>
          </div>
        </div>

        <footer class="cd-foot">
          <button class="cd-link" @click="compare.clear()">{{ t('compare.clearAll') }}</button>
          <div class="cd-foot-actions">
            <button class="cd-cta cd-cta--ghost" @click="goToCompare">{{ t('compare.viewTable') }}</button>
            <button class="cd-cta cd-cta--primary" :disabled="compare.isEmpty.value" @click="addAllToCart">
              🛒 {{ t('compare.addAllToCart') }}
            </button>
          </div>
        </footer>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.cd-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  backdrop-filter: blur(4px);
}
.cd-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 460px;
  max-width: 95vw;
  background: var(--surface-white, #fff);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.18);
}

.cd-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}
.cd-title {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary, #18181b);
}
.cd-count {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.78rem;
  color: var(--text-muted, #71717a);
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 999px;
  margin-left: 4px;
}
.cd-close {
  background: transparent;
  border: none;
  color: var(--text-secondary, #3f3f46);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cd-close:hover { background: rgba(0, 0, 0, 0.05); color: var(--text-primary, #18181b); }

.cd-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
}

.cd-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  flex: 1;
}

.cd-cell {
  position: relative;
  background: #fafafa;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 12px 10px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.cd-cell.is-best {
  border-color: var(--color-success, #2D8A56);
  background: linear-gradient(180deg, rgba(45, 138, 86, 0.08) 0%, #fafafa 60%);
}
.cd-cell.is-flash { animation: cdFlash 0.25s ease; }
@keyframes cdFlash {
  0% { background: #fef2f2; }
  100% { background: #fafafa; }
}

.cd-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border: none;
  background: rgba(0, 0, 0, 0.08);
  color: var(--text-secondary, #3f3f46);
  border-radius: 50%;
  font-size: 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.cd-remove:hover { background: var(--color-error, #dc2626); color: #fff; }

.cd-product {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  font-family: var(--font-body);
}
.cd-img-wrap {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.cd-noimg { font-size: 1.5rem; opacity: 0.4; }

.cd-cat {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-muted, #71717a);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.cd-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary, #18181b);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cd-price {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--text-primary, #18181b);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.cd-price.is-best-price { color: var(--color-success, #2D8A56); }
.cd-best-badge {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  background: rgba(45, 138, 86, 0.12);
  color: var(--color-success, #2D8A56);
  padding: 2px 6px;
  border-radius: 6px;
  text-transform: uppercase;
}

.cd-cell--empty {
  border: 1px dashed rgba(0, 0, 0, 0.10);
  background: transparent;
  justify-content: center;
  color: var(--text-muted, #71717a);
}
.cd-plus {
  font-size: 1.5rem;
  font-weight: 700;
  opacity: 0.4;
}
.cd-cell-hint {
  font-size: 0.74rem;
  line-height: 1.3;
  opacity: 0.7;
}

.cd-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  margin-top: 16px;
  flex-wrap: wrap;
}
.cd-link {
  background: transparent;
  border: none;
  color: var(--text-muted, #71717a);
  font-size: 0.84rem;
  cursor: pointer;
  text-decoration: underline;
  font-family: var(--font-body);
}
.cd-link:hover { color: var(--color-error, #dc2626); }

.cd-foot-actions {
  display: flex;
  gap: 8px;
}
.cd-cta {
  padding: 10px 16px;
  border-radius: 999px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.86rem;
  border: none;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s, opacity 0.15s;
  white-space: nowrap;
}
.cd-cta:disabled { opacity: 0.5; cursor: not-allowed; }
.cd-cta--primary { background: var(--pv-red, #BC4A3C); color: #fff; }
.cd-cta--primary:hover { background: var(--pv-red-dark, #A0341F); }
.cd-cta--primary:active { transform: scale(0.97); }
.cd-cta--ghost { background: transparent; color: var(--text-primary, #18181b); border: 1.5px solid rgba(0, 0, 0, 0.15); }
.cd-cta--ghost:hover { background: rgba(0, 0, 0, 0.04); }

.cd-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  text-align: center;
}
.cd-empty-icon { font-size: 3rem; opacity: 0.5; margin-bottom: 12px; }
.cd-empty-title { font-family: var(--font-display); font-weight: 800; font-size: 1.05rem; color: var(--text-primary, #18181b); margin: 0 0 6px; }
.cd-empty-sub { font-size: 0.88rem; color: var(--text-muted, #71717a); margin: 0 0 20px; max-width: 280px; }

/* Slide-in from right */
.cd-slide-enter-active, .cd-slide-leave-active { transition: transform 0.32s cubic-bezier(0.22, 0.61, 0.36, 1); }
.cd-slide-enter-from, .cd-slide-leave-to { transform: translateX(100%); }
.cd-fade-enter-active, .cd-fade-leave-active { transition: opacity 0.28s ease; }
.cd-fade-enter-from, .cd-fade-leave-to { opacity: 0; }

@media (max-width: 600px) {
  .cd-grid { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .cd-slide-enter-active, .cd-slide-leave-active,
  .cd-fade-enter-active, .cd-fade-leave-active { transition: none; }
  .cd-cell { transition: none; }
}
</style>
