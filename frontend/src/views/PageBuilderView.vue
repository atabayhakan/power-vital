<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { usePageBuilderStore } from '../stores/usePageBuilderStore';

import draggable from 'vuedraggable';

import { resolveComponent } from '../utils/componentRegistry';
import { calculatePrice } from '../utils/PriceEngine';
import ProductPickerModal from '../components/ProductPickerModal.vue';
import { blocksForPage, getBlockDef, getBlockName, getBlockIcon, type BuilderPage } from '../utils/blockCatalog';

// 🛡️ CSS Bleed Fix: Storefront bileşenleri --clay-shadow, --glass-bg vb.
// design token'lara ihtiyaç duyar. Bu import olmadan canvas bembeyaz kalıyor.
import '../style.css';

const store = usePageBuilderStore();

type PageType = 'storefront' | 'product' | 'cart';
const selectedPage = ref<PageType>('storefront');

const activeBlocks = computed({
  get: () => {
    if (selectedPage.value === 'storefront') return store.storefrontBlocks;
    if (selectedPage.value === 'product') return store.productBlocks;
    return store.cartBlocks;
  },
  set: (val) => {
    if (selectedPage.value === 'storefront') store.storefrontBlocks = val;
    else if (selectedPage.value === 'product') store.productBlocks = val;
    else store.cartBlocks = val;
  }
});

// --- SAVE STATE (UI feedback) ---
const saveStatus = ref<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle');
const lastSavedAt = ref<Date | null>(null);

// Drag and Drop State with Vue Draggable
const onDragEnd = (e: any) => {
  if (e.oldIndex !== undefined && e.newIndex !== undefined && e.oldIndex !== e.newIndex) {
    store.reorderBlocks(selectedPage.value, e.oldIndex, e.newIndex);
    triggerDebouncedSave();
  }
};

// Selected Block for Editing
const selectedBlockId = ref<string | null>(null);
const selectedBlock = computed(() => {
  return activeBlocks.value.find(b => b.id === selectedBlockId.value) || null;
});

const selectBlock = (id: string) => {
  selectedBlockId.value = id;
};

const toggleVisibility = (id: string) => {
  store.toggleVisibility(selectedPage.value, id);
  triggerDebouncedSave();
};

// ═══ Editable draft (caret-safe + IME-safe field editing) ═══
// Inputs bind to this LOCAL reactive copy via v-model — not the store computed.
// Binding directly to the store made every keystroke replace the blocks array
// (target.value = [...]), re-running selectedBlock/editableEntries and writing
// the value back into the input, which reset the caret and broke Turkish/IME
// character composition. The draft decouples editing from that churn; a single
// deep watch pushes changes back to the store for live preview + autosave.
const draft = reactive<Record<string, any>>({});

const syncDraftFromBlock = () => {
  for (const k of Object.keys(draft)) delete draft[k];
  if (selectedBlock.value?.data) Object.assign(draft, selectedBlock.value.data);
};

// Reset the draft only when the SELECTED block changes (not on every keystroke).
watch(() => selectedBlock.value?.id, syncDraftFromBlock, { immediate: true });

// Push edits to the store (live preview + debounced save). Skips no-op syncs
// (e.g. right after selecting a block) by comparing against the stored values.
watch(draft, () => {
  if (!selectedBlockId.value || !selectedBlock.value?.data) return;
  const cur = selectedBlock.value.data as Record<string, any>;
  let changed = false;
  for (const k of Object.keys(draft)) {
    if (String(cur[k] ?? '') !== String(draft[k] ?? '')) { changed = true; break; }
  }
  if (!changed) return;
  store.updateBlockData(selectedPage.value, selectedBlockId.value, { ...draft });
  triggerDebouncedSave();
}, { deep: true });

// ═══ Block Library (add new blocks) ═══
const libraryOpen = ref(false);
const availableBlocks = computed(() => blocksForPage(selectedPage.value as BuilderPage));
const isSingletonUsed = (type: string) =>
  !!getBlockDef(type)?.singleton && activeBlocks.value.some(b => b.type === type);

const addNewBlock = (type: string) => {
  const def = getBlockDef(type);
  if (!def) return;
  if (isSingletonUsed(type)) return;
  const id = store.addBlock(selectedPage.value, type, def.defaultData);
  selectedBlockId.value = id;
  libraryOpen.value = false;
  triggerDebouncedSave();
};

const duplicateBlockById = (id: string) => {
  const newId = store.duplicateBlock(selectedPage.value, id);
  if (newId) selectedBlockId.value = newId;
  triggerDebouncedSave();
};

const moveBlockBy = (id: string, dir: -1 | 1) => {
  store.moveBlock(selectedPage.value, id, dir);
  triggerDebouncedSave();
};

const blockToDelete = ref<string | null>(null);
const confirmDelete = (id: string) => { blockToDelete.value = id; };
const cancelDelete = () => { blockToDelete.value = null; };

const onModalKeydown = (e: KeyboardEvent) => {
  if (e.key !== 'Escape') return;
  if (libraryOpen.value) libraryOpen.value = false;
  else if (blockToDelete.value) cancelDelete();
};
onMounted(() => window.addEventListener('keydown', onModalKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onModalKeydown));
const performDelete = () => {
  if (!blockToDelete.value) return;
  if (selectedBlockId.value === blockToDelete.value) selectedBlockId.value = null;
  store.removeBlock(selectedPage.value, blockToDelete.value);
  blockToDelete.value = null;
  triggerDebouncedSave();
};

const blockIndex = (id: string) => activeBlocks.value.findIndex(b => b.id === id);

// ═══ Product Picker (Günün Fırsatı) ═══
const pickerOpen = ref(false);

const openProductPicker = () => {
  if (selectedBlock.value?.type !== 'promobanner' && selectedBlock.value?.type !== 'deal_of_the_day') return;
  pickerOpen.value = true;
};

const handleProductPicked = (product: any) => {
  if (!selectedBlockId.value) return;
  const priceKgs = Number(product.basePriceKgs || 0);
  const kgs = priceKgs > 0 ? Math.round(calculatePrice(priceKgs)) : 0;
  const oldKgs = kgs > 0 ? Math.round((kgs * 1.30) / 10) * 10 : '';
  const thumb = product.images?.[0]?.imageUrl || '';

  store.updateBlockData(selectedPage.value, selectedBlockId.value, {
    productName: product.name,
    imageUrl: thumb,
    newPrice: kgs > 0 ? String(kgs) : '',
    oldPrice: oldKgs ? String(oldKgs) : '',
    productId: product.id
  });
  syncDraftFromBlock(); // reflect picked product in the editable inputs
  triggerDebouncedSave();
  pickerOpen.value = false;
};

// --- DEBOUNCED API SAVE with status tracking ---
let saveTimeout: any = null;
const triggerDebouncedSave = () => {
  saveStatus.value = 'pending';
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    await flushSave();
  }, 800);
};

let inFlight = false;
let needsResave = false;
const flushSave = async () => {
  if (inFlight) {
    needsResave = true;
    return;
  }
  inFlight = true;
  saveStatus.value = 'saving';
  try {
    await store.saveBlocks();
    lastSavedAt.value = new Date();
    saveStatus.value = 'saved';
    console.warn('[API] Blocks saved at', lastSavedAt.value.toLocaleTimeString());
  } catch (e) {
    console.error('[API] Save failed', e);
    saveStatus.value = 'error';
  } finally {
    inFlight = false;
    if (needsResave) {
      needsResave = false;
      saveStatus.value = 'pending';
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(flushSave, 200);
    }
  }
};

const manualSave = async () => {
  if (saveTimeout) { clearTimeout(saveTimeout); saveTimeout = null; }
  await flushSave();
};

const onBeforeUnloadHandler = (e: BeforeUnloadEvent) => {
  if (saveStatus.value === 'pending' || saveStatus.value === 'saving') {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.stringify({
        homepageBlocks: {
          storefront: store.storefrontBlocks,
          product: store.productBlocks,
          cart: store.cartBlocks
        }
      });
      if (navigator.sendBeacon && token) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/v1/settings?beacon=1&token=' + encodeURIComponent(token), blob);
      }
    } catch { /* beacon best-effort */ }
    e.preventDefault();
    e.returnValue = '';
  }
};

onMounted(async () => {
  await store.fetchBlocks();
  saveStatus.value = 'idle';
  lastSavedAt.value = new Date();
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', onBeforeUnloadHandler);
  }
});

onBeforeUnmount(() => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
    flushSave();
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('beforeunload', onBeforeUnloadHandler);
  }
});

// UI Mapping Helpers
const getFieldLabel = (key: string) => {
  const map: Record<string, string> = {
    text: 'Kayan Yazı Metni',
    speed: 'Hız',
    bgColor: 'Arka Plan Rengi',
    textColor: 'Yazı Rengi',
    title: 'Başlık',
    columns: 'Sütun Sayısı (Izgara)',
    showPrice: 'Fiyatı Göster',
    autoplay: 'Otomatik Oynat',
    interval: 'Süre (ms)',
    showArrows: 'Okları Göster',
    zoomEnabled: 'Yakınlaştırma Aktif',
    showThumbnails: 'Küçük Resimleri Göster',
    allowNew: 'Yorum Eklemeye İzin Ver',
    showRatings: 'Puanları Göster',
    productName: 'Ürün Adı',
    description: 'Açıklama / Metin',
    buttonText: 'Buton Metni',
    limit: 'Ürün Gösterim Limiti',
    categoryId: 'Kategori ID (Filtrelemek için)',
    oldPrice: 'Eski Fiyat (Üstü Çizili)',
    newPrice: 'Yeni Fiyat (İndirimli)',
    imageUrl: 'Görsel URL Adresi',
    countdownHours: 'Geri Sayım (Saat)',
    freeShippingThreshold: 'Ücretsiz Kargo Limiti (KGS)',
    upsellProductName: 'Önerilen Ürün Adı (Upsell)',
    upsellProductPrice: 'Önerilen Ürün Fiyatı',
    upsellProductImage: 'Önerilen Ürün Görseli',
    showCategoryText: 'Kategori İsimlerini Göster'
  };
  return map[key] || key;
};

// Internal keys we never expose as editable fields
const HIDDEN_FIELD_KEYS = new Set(['productId']);
const fieldKeys = computed(() => {
  if (!selectedBlock.value?.data) return [] as string[];
  return Object.keys(selectedBlock.value.data).filter(k => !HIDDEN_FIELD_KEYS.has(k));
});

// Field element type is decided by the field KEY (stable), never by the current
// value length — otherwise an input would morph into a textarea mid-typing and
// drop focus. Booleans stay a <select> regardless of their current value.
const TEXTAREA_FIELD_KEYS = new Set(['description', 'content', 'text', 'subtitle', 'answer', 'message', 'bodytext']);
const isTextareaKey = (k: string) => {
  const lk = k.toLowerCase();
  return TEXTAREA_FIELD_KEYS.has(lk) || lk.includes('description') || lk.includes('content') || lk.includes('paragraph');
};
const fieldType = (key: string): 'color' | 'boolean' | 'speed' | 'columns' | 'picker' | 'textarea' | 'text' => {
  const lk = key.toLowerCase();
  if (lk.includes('color')) return 'color';
  if (key === 'speed') return 'speed';
  if (key === 'columns') return 'columns';
  const v = draft[key];
  if (v === true || v === false || v === 'true' || v === 'false') return 'boolean';
  if (key === 'productName' && (selectedBlock.value?.type === 'promobanner' || selectedBlock.value?.type === 'deal_of_the_day')) return 'picker';
  if (isTextareaKey(key)) return 'textarea';
  return 'text';
};
const isWide = (key: string) => {
  const t = fieldType(key);
  return t === 'textarea' || t === 'picker';
};

const getDisplayName = (type: string) => getBlockName(type);

const dispatchCartEvent = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-cart'));
  }
};

// Responsive Preview State
const previewMode = ref<'desktop' | 'mobile'>('desktop');
</script>

<template>
  <div class="pb-workspace">
    <!-- ════════ LEFT PANEL ════════ -->
    <aside class="pb-panel">
      <header class="pb-head">
        <div class="pb-head__titles">
          <h1 class="pb-title">Sayfa Tasarımcısı</h1>
          <p class="pb-sub">Canlı önizleme ile sayfa bölümlerini düzenleyin</p>
        </div>

        <div class="pb-tabs" role="tablist">
          <button class="pb-tab" :class="{ active: selectedPage === 'storefront' }" @click="selectedPage = 'storefront'; selectedBlockId = null">Ana Sayfa</button>
          <button class="pb-tab" :class="{ active: selectedPage === 'product' }" @click="selectedPage = 'product'; selectedBlockId = null">Ürün Sayfası</button>
          <button class="pb-tab" :class="{ active: selectedPage === 'cart' }" @click="selectedPage = 'cart'; selectedBlockId = null">Sepet</button>
        </div>

        <!-- Save status bar -->
        <div class="pb-save" :class="`is-${saveStatus}`">
          <div class="pb-save__status">
            <span class="pb-save__dot"/>
            <span class="pb-save__label">
              <template v-if="saveStatus === 'idle'">Hazır</template>
              <template v-else-if="saveStatus === 'pending'">Değişiklik var — otomatik kaydedilecek…</template>
              <template v-else-if="saveStatus === 'saving'">Kaydediliyor…</template>
              <template v-else-if="saveStatus === 'saved'">
                Kaydedildi
                <span v-if="lastSavedAt" class="pb-save__time">{{ lastSavedAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }}</span>
              </template>
              <template v-else-if="saveStatus === 'error'">Kayıt başarısız — tekrar deneyin</template>
            </span>
          </div>
          <button class="pb-save__btn" :disabled="saveStatus === 'saving'" @click="manualSave" title="Tüm değişiklikleri şimdi kaydet">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
            Kaydet
          </button>
        </div>
      </header>

      <!-- Layers / sections -->
      <section class="pb-section">
        <div class="pb-section__head">
          <h2 class="pb-section__title">Bölümler <span class="pb-count">{{ activeBlocks.length }}</span></h2>
          <button class="pb-add-btn" @click="libraryOpen = true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Blok Ekle
          </button>
        </div>

        <draggable
          :model-value="activeBlocks"
          @update:model-value="onDragEnd"
          item-key="id"
          handle=".pb-card__grip"
          :delay="120"
          :delayOnTouchOnly="true"
          class="pb-layers"
        >
          <template #item="{ element: block, index }">
            <div
              class="pb-card"
              :class="{ 'is-selected': selectedBlockId === block.id, 'is-hidden': !block.visible }"
              @click="selectBlock(block.id)"
            >
              <span class="pb-card__grip" title="Sürükleyerek sırala">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>
              </span>
              <span class="pb-card__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <path v-for="(d, i) in getBlockIcon(block.type)" :key="i" :d="d" />
                </svg>
              </span>
              <span class="pb-card__body">
                <span class="pb-card__name">{{ getDisplayName(block.type) }}</span>
                <span class="pb-card__meta">{{ getBlockDef(block.type)?.description || ('Bölüm ' + (index + 1)) }}</span>
              </span>
              <span class="pb-card__actions">
                <button class="pb-icon-btn" :title="block.visible ? 'Gizle' : 'Göster'" @click.stop="toggleVisibility(block.id)">
                  <svg v-if="block.visible" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
                <button class="pb-icon-btn" title="Kopyala" @click.stop="duplicateBlockById(block.id)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
                <button class="pb-icon-btn pb-icon-btn--danger" title="Sil" @click.stop="confirmDelete(block.id)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </span>
            </div>
          </template>
        </draggable>

        <div v-if="activeBlocks.length === 0" class="pb-empty-layers">
          <p>Bu sayfada henüz bölüm yok.</p>
          <button class="pb-add-btn pb-add-btn--ghost" @click="libraryOpen = true">İlk bloğu ekleyin</button>
        </div>
      </section>

      <!-- Settings -->
      <section class="pb-section pb-section--settings">
        <h2 class="pb-section__title">
          {{ selectedBlock ? getDisplayName(selectedBlock.type) + ' Ayarları' : 'Bölüm Ayarları' }}
        </h2>

        <div v-if="selectedBlock" class="pb-form">
          <div class="pb-field" :class="{ 'full': isWide(key) }" v-for="key in fieldKeys" :key="key">
            <label class="pb-flabel">{{ getFieldLabel(key) }}</label>

            <input
              v-if="fieldType(key) === 'color'"
              type="color" class="pb-input pb-input--color" v-model="draft[key]"
            />

            <select v-else-if="fieldType(key) === 'boolean'" class="pb-input" v-model="draft[key]">
              <option value="true">Evet (Açık)</option>
              <option value="false">Hayır (Kapalı)</option>
            </select>

            <select v-else-if="fieldType(key) === 'speed'" class="pb-input" v-model="draft[key]">
              <option value="slow">Yavaş</option>
              <option value="normal">Normal</option>
              <option value="fast">Hızlı</option>
            </select>

            <div v-else-if="fieldType(key) === 'columns'" class="pb-range-group">
              <input type="range" min="4" max="12" step="1" class="pb-range" v-model="draft[key]" />
              <span class="pb-range-val">{{ draft[key] }}</span>
            </div>

            <!-- Promo banner: product picker -->
            <div v-else-if="fieldType(key) === 'picker'" class="pb-picker-row">
              <input type="text" class="pb-input" v-model="draft[key]" placeholder="Örn: Premium Kolajen Kompleksi" />
              <button type="button" class="pb-pick-btn" @click="openProductPicker" title="Kayıtlı ürünler arasından seç">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                Ürün Seç
              </button>
              <span v-if="selectedBlock?.data?.productId" class="pb-pick-badge">✓ Seçili</span>
            </div>

            <textarea
              v-else-if="fieldType(key) === 'textarea'"
              class="pb-input pb-input--textarea" rows="4" v-model="draft[key]"
            />

            <input v-else type="text" class="pb-input" v-model="draft[key]" />
          </div>

          <p v-if="fieldKeys.length === 0" class="pb-empty">Bu blok için düzenlenebilir ayar yok.</p>
        </div>
        <div v-else class="pb-empty">
          Ayarları görmek için bir bölüm seçin — sol listeden veya sağdaki önizlemeden tıklayın.
        </div>
      </section>
    </aside>

    <!-- ════════ RIGHT: CANVAS ════════ -->
    <main class="pb-canvas">
      <div class="pb-canvas__bar">
        <div class="pb-canvas__title">
          <span class="pb-live-dot"/>
          Canlı Önizleme
        </div>
        <div class="pb-device-toggle">
          <button class="pb-device" :class="{ active: previewMode === 'desktop' }" @click="previewMode = 'desktop'" title="Masaüstü">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </button>
          <button class="pb-device" :class="{ active: previewMode === 'mobile' }" @click="previewMode = 'mobile'" title="Mobil">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2.5"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
          </button>
        </div>
      </div>

      <div class="pb-canvas__viewport">
        <div class="pb-scaler" :class="previewMode">
          <div class="pb-frame" :class="previewMode">
            <!-- STOREFRONT / PRODUCT -->
            <div class="storefront-canvas-wrapper" v-if="selectedPage === 'storefront' || selectedPage === 'product'">
              <transition-group name="block-list">
                <div
                  v-for="(block, index) in activeBlocks"
                  :key="block.id"
                  class="pb-cblock"
                  :class="{ 'is-hidden': !block.visible, 'is-selected': selectedBlockId === block.id }"
                >
                  <component :is="resolveComponent(block.type)" v-bind="block.data" :data="block.data" v-if="resolveComponent(block.type)" />
                  <div v-else class="component-missing">Bileşen Bulunamadı: {{ block.type }}</div>

                  <!-- Selection / hover overlay -->
                  <div class="pb-cblock__overlay" @click="selectBlock(block.id)">
                    <span class="pb-cblock__tag">{{ getDisplayName(block.type) }}</span>
                    <div class="pb-cblock__bar" @click.stop>
                      <button class="pb-cb-btn" title="Yukarı taşı" :disabled="index === 0" @click="moveBlockBy(block.id, -1)">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                      </button>
                      <button class="pb-cb-btn" title="Aşağı taşı" :disabled="index === activeBlocks.length - 1" @click="moveBlockBy(block.id, 1)">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      <span class="pb-cb-sep"/>
                      <button class="pb-cb-btn" :title="block.visible ? 'Gizle' : 'Göster'" @click="toggleVisibility(block.id)">
                        <svg v-if="block.visible" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      </button>
                      <button class="pb-cb-btn" title="Kopyala" @click="duplicateBlockById(block.id)">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      </button>
                      <button class="pb-cb-btn pb-cb-btn--danger" title="Sil" @click="confirmDelete(block.id)">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </transition-group>

              <!-- Canvas empty state -->
              <div v-if="activeBlocks.length === 0" class="pb-canvas-empty">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                <h3>Sayfa boş</h3>
                <p>"Blok Ekle" ile ilk bölümünüzü ekleyin.</p>
                <button class="pb-add-btn" @click="libraryOpen = true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                  Blok Ekle
                </button>
              </div>
            </div>

            <!-- CART PREVIEW -->
            <div class="storefront-canvas-wrapper" v-if="selectedPage === 'cart'">
              <div class="pb-cart-preview">
                <h3>Sepet Ayarları Önizlemesi</h3>
                <p>Düzenlediğiniz ayarlar anında yan sepete (Side Cart) yansır. Test için sepeti açın.</p>
                <button class="pb-add-btn" @click="dispatchCartEvent">Sepeti Aç / Test Et</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ════════ BLOCK LIBRARY MODAL ════════ -->
    <transition name="pb-fade">
      <div v-if="libraryOpen" class="pb-modal-overlay" @click.self="libraryOpen = false">
        <div class="pb-modal">
          <div class="pb-modal__head">
            <div>
              <h3 class="pb-modal__title">Blok Kütüphanesi</h3>
              <p class="pb-modal__sub">Sayfaya eklemek istediğiniz bölümü seçin</p>
            </div>
            <button class="pb-modal__close" @click="libraryOpen = false" title="Kapat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="pb-library">
            <button
              v-for="def in availableBlocks"
              :key="def.type"
              class="pb-lib-card"
              :class="{ 'is-disabled': isSingletonUsed(def.type) }"
              :disabled="isSingletonUsed(def.type)"
              @click="addNewBlock(def.type)"
            >
              <span class="pb-lib-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path v-for="(d, i) in def.icon" :key="i" :d="d" />
                </svg>
              </span>
              <span class="pb-lib-card__name">{{ def.name }}</span>
              <span class="pb-lib-card__desc">{{ def.description }}</span>
              <span v-if="isSingletonUsed(def.type)" class="pb-lib-card__used">Zaten ekli</span>
              <span v-else class="pb-lib-card__add">+ Ekle</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ════════ DELETE CONFIRM ════════ -->
    <transition name="pb-fade">
      <div v-if="blockToDelete" class="pb-modal-overlay" @click.self="cancelDelete">
        <div class="pb-confirm">
          <div class="pb-confirm__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </div>
          <h3 class="pb-confirm__title">Bölümü sil?</h3>
          <p class="pb-confirm__text">
            <strong>{{ getDisplayName(activeBlocks[blockIndex(blockToDelete)]?.type || '') }}</strong>
            bölümü sayfadan kaldırılacak. Bu işlem geri alınamaz.
          </p>
          <div class="pb-confirm__actions">
            <button class="pb-btn-ghost" @click="cancelDelete">Vazgeç</button>
            <button class="pb-btn-danger" @click="performDelete">Evet, sil</button>
          </div>
        </div>
      </div>
    </transition>

    <ProductPickerModal :open="pickerOpen" @close="pickerOpen = false" @select="handleProductPicked" />
  </div>
</template>

<style scoped>
/* ════════ WORKSPACE ════════ */
.pb-workspace {
  display: grid;
  grid-template-columns: minmax(380px, 460px) 1fr;
  gap: 20px;
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
  background: #f3f4f6;
  font-family: 'Inter', system-ui, sans-serif;
}

/* ════════ LEFT PANEL ════════ */
.pb-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding-right: 4px;
}

.pb-head { display: flex; flex-direction: column; gap: 14px; }
.pb-title { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.02em; }
.pb-sub { font-size: 13px; color: #6b7280; margin: 2px 0 0; }

.pb-tabs { display: inline-flex; gap: 4px; padding: 4px; background: #e5e7eb; border-radius: 10px; }
.pb-tab { flex: 1; padding: 8px 12px; border: none; background: transparent; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 700; color: #6b7280; border-radius: 7px; cursor: pointer; transition: all 0.18s; }
.pb-tab:hover { color: #111827; }
.pb-tab.active { background: #fff; color: #BC4A3C; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

/* Save bar */
.pb-save { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 12px; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 12.5px; color: #374151; transition: border-color 0.2s, background 0.2s; }
.pb-save.is-pending { border-color: #fcd34d; background: #fffbeb; }
.pb-save.is-saving { border-color: #93c5fd; background: #eff6ff; }
.pb-save.is-saved { border-color: #86efac; background: #f0fdf4; }
.pb-save.is-error { border-color: #fca5a5; background: #fef2f2; color: #b91c1c; }
.pb-save__status { display: flex; align-items: center; gap: 8px; min-width: 0; }
.pb-save__dot { width: 8px; height: 8px; border-radius: 50%; background: #9ca3af; flex-shrink: 0; }
.pb-save.is-pending .pb-save__dot { background: #f59e0b; }
.pb-save.is-saving .pb-save__dot { background: #3b82f6; animation: pb-pulse 1s ease-in-out infinite; }
.pb-save.is-saved .pb-save__dot { background: #10b981; }
.pb-save.is-error .pb-save__dot { background: #ef4444; }
@keyframes pb-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
.pb-save__label { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pb-save__time { color: #9ca3af; font-weight: 400; margin-left: 4px; }
.pb-save__btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 13px; border: none; background: linear-gradient(135deg, #D4665A 0%, #BC4A3C 100%); color: #fff; font-family: 'Outfit', sans-serif; font-size: 12.5px; font-weight: 700; border-radius: 8px; cursor: pointer; flex-shrink: 0; box-shadow: 0 2px 8px rgba(188, 74, 60, 0.3); transition: filter 0.15s, transform 0.1s; }
.pb-save__btn:hover:not(:disabled) { filter: brightness(1.07); }
.pb-save__btn:active:not(:disabled) { transform: scale(0.97); }
.pb-save__btn:disabled { opacity: 0.55; cursor: not-allowed; }

/* Sections */
.pb-section { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.pb-section--settings { flex: 1; }
.pb-section__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.pb-section__title { font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 800; color: #374151; margin: 0; text-transform: uppercase; letter-spacing: 0.6px; display: flex; align-items: center; gap: 8px; }
.pb-count { background: #f3f4f6; color: #6b7280; font-size: 11px; padding: 1px 8px; border-radius: 100px; letter-spacing: 0; }

.pb-add-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 13px; border: none; background: #BC4A3C; color: #fff; font-family: 'Outfit', sans-serif; font-size: 12.5px; font-weight: 700; border-radius: 8px; cursor: pointer; transition: filter 0.15s, transform 0.1s; box-shadow: 0 2px 6px rgba(188,74,60,0.25); }
.pb-add-btn:hover { filter: brightness(1.08); }
.pb-add-btn:active { transform: scale(0.97); }
.pb-add-btn--ghost { background: transparent; color: #BC4A3C; border: 1.5px dashed #d6b3ad; box-shadow: none; }

/* Layer cards */
.pb-layers { display: flex; flex-direction: column; gap: 8px; }
.pb-card { display: flex; align-items: center; gap: 10px; padding: 10px; background: #fff; border: 1px solid #e5e7eb; border-radius: 11px; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s, background 0.15s; }
.pb-card:hover { border-color: #d1d5db; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.pb-card.is-selected { border-color: #BC4A3C; background: #fdf4f2; box-shadow: 0 0 0 1px #BC4A3C; }
.pb-card.is-hidden { opacity: 0.55; }
.pb-card.is-hidden .pb-card__name { text-decoration: line-through; }
.pb-card__grip { display: flex; align-items: center; justify-content: center; color: #b0b4ba; cursor: grab; flex-shrink: 0; }
.pb-card__grip:active { cursor: grabbing; }
.pb-card__icon { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 9px; background: #f3f4f6; color: #BC4A3C; flex-shrink: 0; }
.pb-card.is-selected .pb-card__icon { background: #BC4A3C; color: #fff; }
.pb-card__body { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
.pb-card__name { font-family: 'Outfit', sans-serif; font-size: 13.5px; font-weight: 700; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pb-card__meta { font-size: 11.5px; color: #9ca3af; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pb-card__actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; opacity: 0; transition: opacity 0.15s; }
.pb-card:hover .pb-card__actions, .pb-card.is-selected .pb-card__actions { opacity: 1; }
.pb-icon-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; background: transparent; color: #6b7280; border-radius: 7px; cursor: pointer; transition: background 0.15s, color 0.15s; }
.pb-icon-btn:hover { background: #f3f4f6; color: #111827; }
.pb-icon-btn--danger:hover { background: #fef2f2; color: #dc2626; }

.pb-empty-layers { text-align: center; padding: 20px 12px; color: #9ca3af; font-size: 13px; display: flex; flex-direction: column; gap: 12px; align-items: center; }
.pb-empty-layers p { margin: 0; }

/* Settings form */
.pb-form { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.pb-field { display: flex; flex-direction: column; gap: 6px; }
.pb-field.full { grid-column: 1 / -1; }
.pb-flabel { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; }
.pb-input { background: #fff; border: 1.5px solid #e5e7eb; border-radius: 8px; color: #111827; padding: 9px 11px; font-family: 'Inter', sans-serif; font-size: 13px; outline: none; transition: border-color 0.18s, box-shadow 0.18s; width: 100%; box-sizing: border-box; }
.pb-input:focus { border-color: #BC4A3C; box-shadow: 0 0 0 3px rgba(188,74,60,0.12); }
.pb-input--textarea { resize: vertical; min-height: 80px; }
.pb-input--color { height: 40px; padding: 3px; cursor: pointer; }
.pb-range-group { display: flex; align-items: center; gap: 12px; }
.pb-range { flex: 1; accent-color: #BC4A3C; }
.pb-range-val { background: #f3f4f6; padding: 4px 10px; border-radius: 6px; font-size: 12px; color: #111827; font-weight: 700; }
.pb-empty { font-size: 13px; color: #9ca3af; padding: 14px 0; line-height: 1.5; }

/* Picker row */
.pb-picker-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.pb-picker-row .pb-input { flex: 1; min-width: 180px; }
.pb-pick-btn { display: inline-flex; align-items: center; gap: 6px; padding: 0 13px; min-height: 40px; background: #BC4A3C; color: #fff; font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 800; border: none; border-radius: 9px; cursor: pointer; white-space: nowrap; transition: filter 0.15s; }
.pb-pick-btn:hover { filter: brightness(1.08); }
.pb-pick-badge { display: inline-flex; align-items: center; padding: 4px 10px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 100px; font-size: 11px; font-weight: 700; color: #16a34a; }

/* ════════ CANVAS ════════ */
.pb-canvas { display: flex; flex-direction: column; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.pb-canvas__bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #fff; border-bottom: 1px solid #f0f0f0; }
.pb-canvas__title { display: flex; align-items: center; gap: 9px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 700; color: #111827; }
.pb-live-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 0 0 rgba(16,185,129,0.4); animation: pb-live 2s infinite; }
@keyframes pb-live { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); } 70% { box-shadow: 0 0 0 7px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }
.pb-device-toggle { display: flex; gap: 4px; background: #f3f4f6; padding: 3px; border-radius: 9px; }
.pb-device { display: flex; align-items: center; justify-content: center; width: 34px; height: 30px; border: none; background: transparent; border-radius: 7px; color: #9ca3af; cursor: pointer; transition: all 0.18s; }
.pb-device:hover { color: #374151; }
.pb-device.active { background: #fff; color: #BC4A3C; box-shadow: 0 1px 3px rgba(0,0,0,0.12); }

.pb-canvas__viewport { flex: 1; overflow-y: auto; overflow-x: hidden; background: #e9eaed; display: flex; justify-content: center; align-items: flex-start; padding: 24px; }
.pb-scaler { display: flex; justify-content: center; transform-origin: top center; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); width: 100%; }
.pb-scaler.desktop { transform: scale(0.86); width: 1200px; }
.pb-scaler.mobile { transform: scale(1); width: 100%; padding-bottom: 40px; }

.pb-frame { background: var(--color-bg, #F9F6F1); overflow: hidden; margin: 0 auto; width: 100%; min-height: 800px; border-radius: 18px; box-shadow: 0 20px 60px rgba(0,0,0,0.18); display: flex; flex-direction: column; transition: width 0.4s cubic-bezier(0.4,0,0.2,1), border-radius 0.4s, border 0.4s; }
.pb-frame.mobile { width: 390px; min-height: 812px; border-radius: 38px; border: 11px solid #1f2937; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }

/* Canvas block + selection overlay */
.pb-cblock { position: relative; transition: opacity 0.3s; }
.pb-cblock.is-hidden { opacity: 0.4; filter: grayscale(70%); }
.pb-cblock__overlay { position: absolute; inset: 0; z-index: 5; cursor: pointer; opacity: 0; transition: opacity 0.15s; outline: 2px solid transparent; outline-offset: -2px; }
.pb-cblock:hover .pb-cblock__overlay { opacity: 1; outline-color: rgba(188, 74, 60, 0.5); background: rgba(188, 74, 60, 0.04); }
.pb-cblock.is-selected .pb-cblock__overlay { opacity: 1; outline-color: #BC4A3C; outline-width: 2.5px; }
.pb-cblock__tag { position: absolute; top: 0; left: 0; transform: translateY(-100%); background: #BC4A3C; color: #fff; font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 6px 6px 0 0; white-space: nowrap; }
.pb-cblock__bar { position: absolute; top: 8px; right: 8px; display: flex; align-items: center; gap: 2px; padding: 4px; background: rgba(17, 24, 39, 0.92); backdrop-filter: blur(8px); border-radius: 10px; box-shadow: 0 6px 18px rgba(0,0,0,0.3); }
.pb-cb-btn { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border: none; background: transparent; color: #e5e7eb; border-radius: 7px; cursor: pointer; transition: background 0.15s, color 0.15s; }
.pb-cb-btn:hover:not(:disabled) { background: rgba(255,255,255,0.15); color: #fff; }
.pb-cb-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.pb-cb-btn--danger:hover:not(:disabled) { background: #dc2626; color: #fff; }
.pb-cb-sep { width: 1px; height: 18px; background: rgba(255,255,255,0.2); margin: 0 2px; }

.pb-canvas-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 100px 24px; color: #9ca3af; text-align: center; }
.pb-canvas-empty h3 { font-family: 'Outfit', sans-serif; font-size: 1.1rem; font-weight: 800; color: #6b7280; margin: 6px 0 0; }
.pb-canvas-empty p { margin: 0 0 8px; font-size: 13px; }

.pb-cart-preview { padding: 60px 40px; text-align: center; }
.pb-cart-preview h3 { font-family: 'Outfit', sans-serif; font-size: 1.3rem; color: #111827; margin: 0 0 10px; }
.pb-cart-preview p { color: #6b7280; margin: 0 0 22px; max-width: 460px; margin-inline: auto; line-height: 1.6; }

/* ════════ MODAL / LIBRARY ════════ */
.pb-modal-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(17, 24, 39, 0.5); backdrop-filter: blur(4px); }
.pb-modal { width: 100%; max-width: 720px; max-height: 86vh; display: flex; flex-direction: column; background: #fff; border-radius: 18px; box-shadow: 0 30px 80px rgba(0,0,0,0.35); overflow: hidden; }
.pb-modal__head { display: flex; align-items: flex-start; justify-content: space-between; padding: 22px 24px; border-bottom: 1px solid #f0f0f0; }
.pb-modal__title { font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 800; color: #111827; margin: 0; }
.pb-modal__sub { font-size: 13px; color: #6b7280; margin: 3px 0 0; }
.pb-modal__close { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; background: #f3f4f6; color: #6b7280; border-radius: 9px; cursor: pointer; transition: background 0.15s, color 0.15s; }
.pb-modal__close:hover { background: #e5e7eb; color: #111827; }

.pb-library { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 22px 24px; overflow-y: auto; }
.pb-lib-card { display: flex; flex-direction: column; align-items: flex-start; gap: 7px; padding: 16px; background: #fff; border: 1.5px solid #e5e7eb; border-radius: 13px; cursor: pointer; text-align: left; transition: border-color 0.15s, box-shadow 0.15s, transform 0.12s; position: relative; }
.pb-lib-card:hover:not(.is-disabled) { border-color: #BC4A3C; box-shadow: 0 6px 20px rgba(188,74,60,0.14); transform: translateY(-2px); }
.pb-lib-card.is-disabled { opacity: 0.5; cursor: not-allowed; }
.pb-lib-card__icon { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 11px; background: linear-gradient(135deg, #fdf0ee, #f8e3df); color: #BC4A3C; }
.pb-lib-card__name { font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 800; color: #111827; }
.pb-lib-card__desc { font-size: 11.5px; color: #6b7280; line-height: 1.45; }
.pb-lib-card__add { margin-top: 4px; font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 800; color: #BC4A3C; }
.pb-lib-card__used { margin-top: 4px; font-size: 11px; font-weight: 700; color: #9ca3af; }

/* Confirm dialog */
.pb-confirm { width: 100%; max-width: 400px; background: #fff; border-radius: 16px; padding: 28px; text-align: center; box-shadow: 0 30px 80px rgba(0,0,0,0.35); }
.pb-confirm__icon { display: flex; align-items: center; justify-content: center; width: 52px; height: 52px; margin: 0 auto 14px; border-radius: 50%; background: #fef2f2; color: #dc2626; }
.pb-confirm__title { font-family: 'Outfit', sans-serif; font-size: 1.2rem; font-weight: 800; color: #111827; margin: 0 0 8px; }
.pb-confirm__text { font-size: 13.5px; color: #6b7280; line-height: 1.55; margin: 0 0 22px; }
.pb-confirm__text strong { color: #111827; }
.pb-confirm__actions { display: flex; gap: 10px; }
.pb-btn-ghost, .pb-btn-danger { flex: 1; padding: 11px; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13.5px; font-weight: 700; cursor: pointer; transition: filter 0.15s, background 0.15s; }
.pb-btn-ghost { background: #f3f4f6; border: none; color: #374151; }
.pb-btn-ghost:hover { background: #e5e7eb; }
.pb-btn-danger { background: #dc2626; border: none; color: #fff; }
.pb-btn-danger:hover { filter: brightness(1.08); }

/* Transitions */
.pb-fade-enter-active, .pb-fade-leave-active { transition: opacity 0.2s ease; }
.pb-fade-enter-from, .pb-fade-leave-to { opacity: 0; }
.block-list-move { transition: transform 0.4s cubic-bezier(0.4,0,0.2,1); }

.component-missing { padding: 40px; text-align: center; color: #ef4444; background: rgba(239,68,68,0.08); border: 1px dashed #ef4444; font-weight: 700; }

/* ════════ STOREFRONT CANVAS ISOLATION (unchanged behavior) ════════ */
.storefront-canvas-wrapper {
  display: flex; flex-direction: column; width: 100%;
  font-family: 'Outfit', 'Inter', system-ui, sans-serif;
  color: var(--text-primary, #1A1A1A);
  background: var(--surface-page, #F5F1EB);
  line-height: 1.5; text-align: left; isolation: isolate;
  --color-primary: #BC4A3C; --color-bg: #F5F1EB; --color-text-main: #1A1A1A; --color-text-muted: #6B6560;
  --text-primary: #1A1A1A; --text-body: #3D3D3D; --text-secondary: #6B6560; --text-muted: #9E9890;
  --surface-page: #F5F1EB; --surface-card: #F9F6F1; --surface-inset: #EDE8DF; --surface-white: #FFFFFF;
  --font-display: 'Outfit', sans-serif; --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --radius-sm: 12px; --radius-md: 16px; --radius-lg: 24px; --radius-xl: 32px; --radius-pill: 100px; --pv-red: #BC4A3C;
}
.storefront-canvas-wrapper * { box-sizing: border-box; }
.storefront-canvas-wrapper .global-navbar {
  position: relative; top: 0; width: 100%; max-width: 100%; margin: 0;
  border-radius: var(--radius-pill, 100px);
  background: var(--glass-bg, rgba(249, 246, 241, 0.88));
  backdrop-filter: var(--glass-blur, blur(20px) saturate(180%));
  -webkit-backdrop-filter: var(--glass-blur, blur(20px) saturate(180%));
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: var(--clay-shadow-md, 8px 8px 24px rgba(210, 200, 185, 0.45), -8px -8px 24px rgba(255, 255, 255, 0.85));
}

/* Scrollbars */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.28); }
</style>
