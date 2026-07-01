<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import { calculatePrice } from '../utils/PriceEngine';
import MediaSelectorModal from '../components/MediaSelectorModal.vue';

interface AccordionEntry {
  key: string; icon: string; title: string; content: string; isOpen: boolean; sortOrder: number;
}
interface Product {
  id: string; barcode: string; name: string; description: string;
  basePriceKgs: string; stockQuantity: number; minStockAlert: number;
  categoryId: string | null; category?: { id: string; name: string } | null;
  images?: { id: string; imageUrl: string }[];
  accordions?: AccordionEntry[] | null;
  benefits?: string[] | null;
  translations?: any | null;
}
interface Category { id: string; name: string; slug: string; }

const products = ref<Product[]>([]);
const productQuery = ref('');

// Local filter (the storefront search bar — different from the admin
// typeahead which goes through /admin/search/products). Filtering
// client-side is fine here because we already have the full list in
// memory and the catalogue is small (<1000 SKUs in practice).
const filteredProducts = computed(() => {
  const q = productQuery.value.trim().toLowerCase();
  if (!q) return products.value;
  return products.value.filter((p) =>
    p.name?.toLowerCase().includes(q) ||
    p.barcode?.toLowerCase().includes(q) ||
    (p as any).translations?.tr?.name?.toLowerCase().includes(q)
  );
});
const categories = ref<Category[]>([]);
const { t } = useI18n();
const isLoading = ref(true);
const isSaving = ref(false);
const isModalOpen = ref(false);
const editingProductId = ref<string | null>(null);
const imgUploading = ref(false);
const isMediaModalOpen = ref(false);

const showUploadToast = (msg: string) => {
  const toastEl = document.createElement('div');
  toastEl.textContent = msg;
  toastEl.style.cssText = 'position:fixed;bottom:24px;right:24px;background:rgba(16,185,129,0.95);color:#fff;padding:12px 24px;border-radius:12px;font-weight:700;z-index:99999;box-shadow:0 8px 32px rgba(16,185,129,0.3);font-family:Outfit,sans-serif;backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1);';
  document.body.appendChild(toastEl);
  setTimeout(() => toastEl.remove(), 2500);
};

const token = () => localStorage.getItem('token') || '';
const headers = () => ({ Authorization: `Bearer ${token()}` });

const form = ref({
  barcode: '', name: '', description: '', basePriceKgs: 0, stockQuantity: 0, minStockAlert: 10,
  categoryId: '', imageUrls: [] as string[],
  accordions: [] as AccordionEntry[],
  benefits: [] as string[],
  translations: {} as any
});

const parseBenefits = (raw: any): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(b => typeof b === 'string' && b.trim().length > 0);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(b => typeof b === 'string' && b.trim().length > 0) : [];
    } catch { return []; }
  }
  return [];
};

const parseAccordions = (raw: any): AccordionEntry[] => {
  let arr: any[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === 'string') {
    try { arr = JSON.parse(raw); } catch { /* keep arr = [] */ }
  }
  if (!Array.isArray(arr) || arr.length === 0) return [];
  return arr.filter(a => a && typeof a === 'object').map((a, i) => ({
    key: String(a.key || 'custom_' + (i + 1)),
    icon: String(a.icon || '📄'),
    title: String(a.title || 'Bölüm ' + (i + 1)),
    content: String(a.content || ''),
    isOpen: !!a.isOpen,
    sortOrder: Number(a.sortOrder) || (i + 1)
  }));
};

const fetchProducts = async () => {
  isLoading.value = true;
  try {
    const [pRes, cRes] = await Promise.all([
      axios.get('/api/v1/products', { headers: headers() }),
      axios.get('/api/v1/categories', { headers: headers() })
    ]);
    products.value = (pRes.data || []).filter((p: Product) => p.id !== 'default-product' && p.barcode !== '000000');
    categories.value = cRes.data;
  } catch (e) {
    console.error('Failed to fetch:', e);
  } finally {
    isLoading.value = false;
  }
};

const openModal = (product?: Product) => {
  if (product) {
    editingProductId.value = product.id;
    form.value = {
      barcode: product.barcode, name: product.name,
      description: product.description || '',
      basePriceKgs: parseFloat(product.basePriceKgs),
      stockQuantity: product.stockQuantity,
      minStockAlert: product.minStockAlert ?? 10,
      categoryId: product.categoryId || '',
      imageUrls: product.images?.map(i => i.imageUrl) || [],
      accordions: parseAccordions(product.accordions),
      benefits: parseBenefits(product.benefits),
      translations: typeof product.translations === 'string' ? JSON.parse(product.translations) : (product.translations || {})
    };
  } else {
    editingProductId.value = null;
    form.value = {
      barcode: '', name: '', description: '', basePriceKgs: 0, stockQuantity: 0, minStockAlert: 10,
      categoryId: '', imageUrls: [], accordions: [], benefits: [], translations: {}
    };
  }
  isModalOpen.value = true;
};

const closeModal = () => { isModalOpen.value = false; editingProductId.value = null; };

const onModalKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isModalOpen.value) closeModal();
};
onMounted(() => window.addEventListener('keydown', onModalKeydown));
onUnmounted(() => window.removeEventListener('keydown', onModalKeydown));

const uploadImage = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.[0]) return;
  imgUploading.value = true;
  try {
    const fd = new FormData();
    Array.from(input.files).forEach(f => fd.append('files', f));
    const res = await axios.post('/api/v1/upload', fd, { headers: { ...headers() } });
    const newUrls = (res.data?.results || []).map((r: any) => r.url).filter(Boolean);
    if (newUrls.length === 0 && res.data?.url) newUrls.push(res.data.url);
    form.value.imageUrls = [...form.value.imageUrls, ...newUrls];
    const uploaded = res.data?.uploaded ?? newUrls.length;
    if (uploaded > 0) showUploadToast(`✓ ${uploaded} görsel yüklendi`);
  } catch (err: any) {
    alert('Yükleme hatası: ' + (err.response?.data?.error || err.message));
  }
  imgUploading.value = false;
  input.value = '';
};

const removeImage = (idx: number) => form.value.imageUrls = form.value.imageUrls.filter((_, i) => i !== idx);

const onMediaSelected = (url: string) => {
  if (!form.value.imageUrls.includes(url)) {
    form.value.imageUrls = [...form.value.imageUrls, url];
    showUploadToast('✓ Görsel kütüphaneden eklendi');
  } else {
    showUploadToast('Bu görsel zaten ekli');
  }
};

const addBenefit = () => form.value.benefits.push('');
const removeBenefit = (idx: number) => form.value.benefits.splice(idx, 1);
const moveBenefitUp = (idx: number) => {
  if (idx > 0) [form.value.benefits[idx - 1], form.value.benefits[idx]] = [form.value.benefits[idx], form.value.benefits[idx - 1]];
};
const moveBenefitDown = (idx: number) => {
  if (idx < form.value.benefits.length - 1) [form.value.benefits[idx + 1], form.value.benefits[idx]] = [form.value.benefits[idx], form.value.benefits[idx + 1]];
};

// Translations are now generated automatically server-side (auto-translate on
// save + continuous TranslationSweeper). No manual translate action needed.

const addAccordion = () => {
  const newKey = 'custom_' + (form.value.accordions.length + 1) + '_' + Date.now().toString(36);
  form.value.accordions.push({ key: newKey, icon: '📄', title: 'Yeni Bölüm', content: '', isOpen: false, sortOrder: form.value.accordions.length + 1 });
};
const removeAccordion = (idx: number) => {
  if (!confirm('Bu bölümü silmek istediğinize emin misiniz?')) return;
  form.value.accordions.splice(idx, 1);
  form.value.accordions.forEach((a, i) => { a.sortOrder = i + 1; });
};
const moveAccordionUp = (idx: number) => {
  if (idx > 0) {
    [form.value.accordions[idx - 1], form.value.accordions[idx]] = [form.value.accordions[idx], form.value.accordions[idx - 1]];
    form.value.accordions.forEach((a, i) => { a.sortOrder = i + 1; });
  }
};
const moveAccordionDown = (idx: number) => {
  if (idx < form.value.accordions.length - 1) {
    [form.value.accordions[idx + 1], form.value.accordions[idx]] = [form.value.accordions[idx], form.value.accordions[idx + 1]];
    form.value.accordions.forEach((a, i) => { a.sortOrder = i + 1; });
  }
};
const toggleAccordionOpen = (idx: number) => {
  form.value.accordions[idx].isOpen = !form.value.accordions[idx].isOpen;
};

const saveProduct = async () => {
  if (!form.value.barcode || !form.value.name) return alert(t('alerts.validationError'));
  isSaving.value = true;
  try {
    const cleanBenefits = form.value.benefits.map(b => (b || '').trim()).filter(b => b.length > 0);
    const payload = {
      ...form.value,
      categoryId: form.value.categoryId || undefined,
      accordions: form.value.accordions.map(a => ({ ...a, title: a.title.trim(), content: a.content.trim() })),
      benefits: cleanBenefits
    };
    if (editingProductId.value) {
      await axios.put(`/api/v1/products/${editingProductId.value}`, payload, { headers: headers() });
    } else {
      await axios.post('/api/v1/products', payload, { headers: headers() });
    }
    await fetchProducts();
    closeModal();
    showUploadToast('✓ Ürün başarıyla kaydedildi');
  } catch (e: any) {
    const d = e.response?.data;
    const detail = Array.isArray(d?.issues) && d.issues.length
      ? ': ' + d.issues.map((i: any) => `${i.path || ''} ${i.message}`.trim()).join('; ')
      : '';
    alert(t('alerts.saveError') + (d?.error || e.message) + detail);
  } finally {
    isSaving.value = false;
  }
};

const deleteProduct = async (product: Product) => {
  if (!confirm(`"${product.name}" ürününü silmek istediğinize emin misiniz?\n\nNot: Bu ürünün siparişlerdeki geçmişi de silinir.`)) return;
  const previousList = [...products.value];
  products.value = products.value.filter(p => p.id !== product.id);
  try {
    const res = await axios.delete(`/api/v1/products/${product.id}`, { headers: headers() });
    await fetchProducts();
    const cascaded = res.data?.cascadedItems || 0;
    if (cascaded > 0) showUploadToast(`✓ Ürün silindi (${cascaded} sipariş kalemi temizlendi)`);
    else showUploadToast('✓ Ürün silindi');
  } catch (e: any) {
    products.value = previousList;
    alert('Silme hatası: ' + (e.response?.data?.error || t('alerts.deleteError')));
  }
};

const fmtKgs = (n: any) => Math.round(Number(n)).toLocaleString('ru-RU');
onMounted(fetchProducts);
</script>

<template>
  <div class="products-content">
    <!-- Header -->
    <header class="topbar">
      <div class="topbar-left">
        <h1 class="page-title">📦 Ürün Yönetimi</h1>
        <span class="subtitle">Ürünlerinizi ekleyin, güncelleyin ve stoklarını yönetin.</span>
      </div>
      <div class="actions">
        <!-- Storefront search — client-side filter on the loaded list.
             For larger catalogues (>1000 SKUs) switch to the admin
             typeahead endpoint via AdminProductSearch. -->
        <input
          v-model="productQuery"
          type="search"
          class="admin-input search-input"
          :placeholder="t('admin.search.productPlaceholder', 'Ürün adı veya barkod ile ara…')"
          aria-label="Ürün ara"
        />
        <button class="glow-btn" @click="openModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Yeni Ürün Ekle
        </button>
      </div>
    </header>

    <div v-if="isLoading" class="glass-panel loading-panel">
      <div class="spinner-mini" style="border-color: rgba(255,255,255,0.1); border-top-color: var(--pv-red); width: 30px; height: 30px;"/>
      <p>Ürünler yükleniyor...</p>
    </div>

    <div v-else class="glass-panel table-panel">
      <div class="table-toolbar">
        <span class="result-count">
          <strong>{{ filteredProducts.length }}</strong> / {{ products.length }} ürün
        </span>
        <button v-if="productQuery" class="clear-link" @click="productQuery = ''">✕ Aramayı temizle</button>
      </div>
      <div v-if="filteredProducts.length === 0" class="empty-state">
        <p>🔍 "{{ productQuery }}" için ürün bulunamadı.</p>
      </div>
      <div v-else class="table-wrap">
        <table class="modern-table">
          <thead>
            <tr>
              <th style="width: 60px;">Görsel</th>
              <th>Barkod</th>
              <th>Ürün Adı</th>
              <th>Kategori</th>
              <th>Fiyat (KGS)</th>
              <th>Stok</th>
              <th style="text-align: right;">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in filteredProducts" :key="product.id">
              <td>
                <div class="table-thumb" v-if="product.images && product.images.length > 0">
                  <img :src="product.images[0].imageUrl" :alt="product.name" />
                </div>
                <span v-else class="text-muted" style="font-size: 0.75rem;">—</span>
              </td>
              <td class="mono-text">{{ product.barcode }}</td>
              <td>
                <strong class="product-name font-bold">{{ product.name }}</strong>
                <span class="desc-text" v-if="product.description">{{ product.description }}</span>
              </td>
              <td>
                <span class="cat-badge" v-if="product.category">{{ product.category.name }}</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="font-bold price-kgs-cell">{{ fmtKgs(calculatePrice(Number(product.basePriceKgs), 0)) }} <span class="currency-label">сом</span></td>
              <td>
                <span class="status-badge" :class="product.stockQuantity <= (product.minStockAlert ?? 10) ? 'st-cancelled' : 'st-paid'">
                  {{ product.stockQuantity }}
                </span>
              </td>
              <td class="actions" style="justify-content: flex-end;">
                <button class="icon-btn" @click="openModal(product)" title="Düzenle">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="icon-btn delete-btn" @click="deleteProduct(product)" title="Sil">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
              </td>
            </tr>
            <tr v-if="products.length === 0">
              <td colspan="8" class="empty-state">Henüz hiç ürün eklenmemiş.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="isModalOpen" class="modal-overlay">
      <div class="product-edit-modal">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 12px;">
            <h3>{{ editingProductId ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle' }}</h3>
          </div>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        
        <form @submit.prevent="saveProduct" class="product-form">
          <div class="form-row">
            <div class="form-group"><label>Barkod *</label><input type="text" class="admin-input" v-model="form.barcode" required placeholder="PV-001" /></div>
            <div class="form-group"><label>Ürün Adı *</label><input type="text" class="admin-input" v-model="form.name" required placeholder="Premium Kolajen" /></div>
          </div>

          <div class="form-group"><label>Kısa Açıklama</label><textarea class="admin-input" style="height: 60px; padding: 10px;" v-model="form.description" rows="2" placeholder="Vitrin açıklaması..."/></div>

          <!-- ═══ ÜRÜN DETAY SAYFASI ACCORDIONLARI ═══ -->
          <div class="accordion-section-divider">
            <span>📦 Ürün Detay Sayfası Bölümleri</span>
            <small>Ürün detay sayfasında görünecek sekmeler ve faydalar.</small>
          </div>

          <!-- Faydaları -->
          <div class="form-group">
            <div class="group-header">
              <label><span>✨</span> Faydaları</label>
              <button type="button" @click="addBenefit" class="btn-sm-action">+ Fayda Ekle</button>
            </div>
            <div v-if="form.benefits.length" class="items-list">
              <div v-for="(_, i) in form.benefits" :key="i" class="item-row">
                <div class="sort-controls">
                  <button type="button" @click="moveBenefitUp(i)" :disabled="i === 0" class="sort-btn">▲</button>
                  <button type="button" @click="moveBenefitDown(i)" :disabled="i === form.benefits.length - 1" class="sort-btn">▼</button>
                </div>
                <span class="check-icon">✓</span>
                <textarea class="admin-input" v-model="form.benefits[i]" :placeholder="`Fayda #${i + 1} — Örn: Bağışıklığı güçlendirir`" rows="2" style="flex: 1; min-height: 42px; resize: vertical; padding: 9px 11px;"/>
                <button type="button" @click="removeBenefit(i)" class="btn-icon delete-btn">✕</button>
              </div>
            </div>
            <div v-else class="empty-hint">Henüz fayda eklenmedi.</div>
          </div>

          <!-- Accordions -->
          <div class="form-group">
            <div class="group-header">
              <label><span>📚</span> Accordion Bölümleri</label>
              <button type="button" @click="addAccordion" class="btn-sm-action">+ Yeni Accordion</button>
            </div>
            <div v-if="form.accordions.length === 0" class="empty-hint">Henüz accordion eklenmedi. Sistem varsayılan olarak 4 bölüm ekler.</div>
            <div v-else class="items-list">
              <div v-for="(acc, i) in form.accordions" :key="acc.key + '-' + i" class="accordion-editor" :class="{ 'is-open': acc.isOpen }">
                <div class="acc-row1">
                  <div class="sort-controls">
                    <button type="button" @click="moveAccordionUp(i)" :disabled="i === 0" class="sort-btn">▲</button>
                    <button type="button" @click="moveAccordionDown(i)" :disabled="i === form.accordions.length - 1" class="sort-btn">▼</button>
                  </div>
                  <input type="text" class="admin-input icon-input" v-model="acc.icon" placeholder="📦" />
                  <input type="text" class="admin-input" v-model="acc.title" placeholder="Bölüm başlığı" style="flex: 1; font-weight: 700;" />
                  <button type="button" @click="toggleAccordionOpen(i)" :class="['toggle-pill', acc.isOpen ? 'on' : 'off']" title="Bu bölüm vitrinde görünsün mü?">
                    <span class="toggle-pill__knob"/><span class="toggle-pill__label">{{ acc.isOpen ? 'GÖRÜNÜR' : 'GİZLİ' }}</span>
                  </button>
                  <button type="button" @click="removeAccordion(i)" class="btn-icon delete-btn">✕</button>
                </div>
                <textarea class="admin-input" v-model="acc.content" :placeholder="`Bu bölümün içeriği (${acc.title || 'Bölüm'})`" rows="3"/>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Kategori</label>
              <select class="admin-input" v-model="form.categoryId">
                <option value="">Kategorisiz</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="form-group"><label>Stok Miktarı</label><input type="number" class="admin-input" min="0" v-model="form.stockQuantity" required /></div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Fiyat (KGS)</label>
              <div class="input-with-icon"><span class="icon">сом</span><input type="number" class="admin-input" step="1" min="0" v-model="form.basePriceKgs" required /></div>
            </div>
            <div class="form-group">
              <label>Düşük Stok Eşiği</label>
              <input type="number" class="admin-input" min="0" v-model="form.minStockAlert" />
              <small class="hint">Stok bu sayının altına düşünce "az kaldı" uyarısı gösterilir.</small>
            </div>
          </div>

          <!-- Image Upload -->
          <div class="form-group">
            <label>Ürün Görselleri</label>
            <div class="img-gallery" v-if="form.imageUrls.length">
              <div v-for="(url, i) in form.imageUrls" :key="i" class="img-thumb">
                <img :src="url" :alt="'Ürün görseli ' + (i+1)" />
                <button type="button" class="img-remove" @click="removeImage(i)">✕</button>
              </div>
            </div>
            <div class="upload-actions">
              <label class="upload-btn">
                {{ imgUploading ? '⏳ Yükleniyor...' : '📤 Görsel Yükle (Çoklu)' }}
                <input type="file" accept="image/*" multiple @change="uploadImage" :disabled="imgUploading" hidden />
              </label>
              <button type="button" class="library-btn" @click="isMediaModalOpen = true" :disabled="imgUploading">
                🗂️ Medya Kütüphanesi
              </button>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeModal">İptal</button>
            <button type="submit" class="glow-btn" :disabled="isSaving">{{ isSaving ? 'Kaydediliyor...' : 'Kaydet' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Media Library Selector Modal -->
    <MediaSelectorModal :isOpen="isMediaModalOpen" @close="isMediaModalOpen = false" @select="onMediaSelected" />
  </div>
</template>

<style scoped>
/* ═══ GLOBAL LAYOUT ═══ */
.products-content {
  padding: 32px 40px;
  height: 100%;
  background-color: #f3f4f6;
  color: #111827;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 32px;
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* ═══ TOPBAR ═══ */
.topbar { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.search-input {
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
  color: #fff; padding: 8px 14px; border-radius: 10px;
  font-family: inherit; font-size: 0.9rem; min-width: 240px;
  transition: border-color 0.2s, background 0.2s;
}
.search-input::placeholder { color: rgba(255,255,255,0.4); }
.search-input:focus {
  outline: none; border-color: var(--pv-red);
  background: rgba(255,255,255,0.12);
  box-shadow: 0 0 0 3px rgba(188, 74, 60, 0.15);
}
.table-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 8px 16px; font-size: 0.85rem; color: rgba(255,255,255,0.6);
}
.result-count strong { color: #fff; font-weight: 800; }
.clear-link {
  background: none; border: 0; color: var(--pv-red);
  cursor: pointer; font-size: 0.82rem; font-weight: 600;
  padding: 0;
}
.clear-link:hover { text-decoration: underline; }
.topbar-left { display: flex; flex-direction: column; gap: 4px; }
.page-title { font-family: var(--font-display); font-size: 2rem; font-weight: 800; margin: 0; color: #111827; letter-spacing: -0.5px; }
.subtitle { font-size: 0.9rem; color: #6b7280; font-family: var(--font-body); }
.actions { display: flex; align-items: center; gap: 16px; }

.glow-btn {
  display: flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, var(--pv-red), #933327);
  color: #fff; padding: 10px 20px; border-radius: 12px; border: none;
  font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 16px rgba(188, 74, 60, 0.4);
  transition: all 0.3s;
}
.glow-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(188, 74, 60, 0.6); }

/* ═══ GLASS PANELS & TABLE ═══ */
.glass-panel {
  background: #ffffff;
  border: 1px solid #e5e7eb; border-radius: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}
.loading-panel { padding: 60px; display: flex; flex-direction: column; align-items: center; gap: 16px; color: #6b7280; font-weight: 600; }
.table-panel { padding: 32px; }
.table-wrap { overflow-x: auto; }

.modern-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
.modern-table th { text-align: left; padding: 0 16px 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 1px; border-bottom: 1px solid #e5e7eb; }
.modern-table td { padding: 16px; background: #fafafa; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; transition: background 0.2s; color: #1f2937; }
.modern-table td:first-child { border-left: 1px solid #f3f4f6; border-radius: 12px 0 0 12px; }
.modern-table td:last-child { border-right: 1px solid #f3f4f6; border-radius: 0 12px 12px 0; }
.modern-table tbody tr:hover td { background: #f3f4f6; }

.mono-text { font-family: var(--font-mono); font-weight: 600; font-size: 0.9rem; }
.font-medium { font-weight: 500; }
.font-bold { font-weight: 700; }
.text-white { color: #111; }
.text-muted { opacity: 0.6; font-size: 0.85rem; }
.empty-state { text-align: center; opacity: 0.6; padding: 40px !important; border-radius: 12px !important; }

.product-name { display: block; font-size: 0.95rem; }
.desc-text { display: block; font-size: 0.8rem; opacity: 0.6; margin-top: 4px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cat-badge { background: rgba(56, 189, 248, 0.1); color: #38BDF8; padding: 6px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; border: 1px solid rgba(56, 189, 248, 0.2); white-space: nowrap; display: inline-block; }
.price-kgs-cell { white-space: nowrap; }
.currency-label { font-size: 0.8rem; font-weight: 500; margin-left: 2px; color: #71717A; }

.status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.5px; }
.st-paid { background: rgba(16, 185, 129, 0.1); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.2); }
.st-cancelled { background: rgba(239, 68, 68, 0.1); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.2); }

.actions { display: flex; gap: 8px; align-items: center; }
.icon-btn { background: rgba(128,128,128,0.1); border: 1px solid rgba(128,128,128,0.2); color: inherit; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
.icon-btn:hover { background: rgba(128,128,128,0.2); transform: translateY(-2px); }
.delete-btn { color: #EF4444; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); }
.delete-btn:hover { background: rgba(239, 68, 68, 0.2); }

/* ═══ MODAL ═══ */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
.product-edit-modal { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 24px; width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
.product-edit-modal::-webkit-scrollbar { width: 6px; }
.product-edit-modal::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 6px; }

.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.modal-header h3 { font-size: 1.5rem; font-family: var(--font-display); font-weight: 800; color: #111827; margin: 0; }
.close-btn { background: #f3f4f6; border: none; color: #4b5563; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
.close-btn:hover { background: #e5e7eb; color: #111827; }

.product-form { display: flex; flex-direction: column; gap: 20px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 0.85rem; font-weight: 700; color: #4b5563; letter-spacing: 0.5px; }

.admin-input { background: #f9fafb; border: 1px solid #d1d5db; color: #111827; padding: 12px 16px; border-radius: 12px; font-family: var(--font-body); font-size: 0.95rem; transition: border-color 0.2s; }
.admin-input:focus { outline: none; border-color: var(--pv-red); background: #ffffff; box-shadow: 0 0 0 2px rgba(188, 74, 60, 0.1); }
.input-with-icon { position: relative; display: flex; align-items: center; }
.input-with-icon .icon { position: absolute; left: 16px; color: #9ca3af; font-weight: 700; font-size: 0.9rem; pointer-events: none; }
.input-with-icon input { padding-left: 52px; width: 100%; }

.hint { font-size: 0.8rem; color: #6b7280; }

.accordion-section-divider { margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; flex-direction: column; gap: 4px; }
.accordion-section-divider span { font-size: 1rem; font-weight: 800; color: #111827; }

.group-header { display: flex; justify-content: space-between; align-items: center; }
.btn-sm-action { background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); color: #818CF8; padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 800; cursor: pointer; transition: all 0.2s; }
.btn-sm-action:hover { background: rgba(99, 102, 241, 0.2); color: #fff; }

.items-list { display: flex; flex-direction: column; gap: 8px; }
.item-row { display: flex; gap: 12px; align-items: center; }
.sort-controls { display: flex; flex-direction: column; gap: 2px; }
.sort-btn { background: #f3f4f6; border: 1px solid #e5e7eb; color: #6b7280; width: 24px; height: 16px; font-size: 8px; border-radius: 4px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
.sort-btn:hover:not(:disabled) { color: #111827; background: #e5e7eb; }
.sort-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.check-icon { color: var(--pv-red); font-weight: 800; }

.accordion-editor { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 12px; transition: border-color 0.2s; }
.accordion-editor.is-open { border-color: #10B981; }
.acc-row1 { display: flex; gap: 12px; align-items: center; }
.icon-input { width: 52px; text-align: center; font-size: 1.2rem; padding: 8px; }

.toggle-pill { display: flex; align-items: center; gap: 8px; background: #f3f4f6; border: 1px solid #e5e7eb; padding: 4px 10px 4px 4px; border-radius: 20px; cursor: pointer; }
.toggle-pill__knob { width: 16px; height: 16px; background: #d1d5db; border-radius: 50%; transition: all 0.2s; }
.toggle-pill__label { font-size: 0.7rem; font-weight: 800; color: #6b7280; }
.toggle-pill.on { background: #ecfdf5; border-color: #a7f3d0; }
.toggle-pill.on .toggle-pill__knob { background: #10B981; transform: translateX(2px); }
.toggle-pill.on .toggle-pill__label { color: #059669; }

.empty-hint { font-size: 0.85rem; color: #6b7280; font-style: italic; padding: 8px; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db; text-align: center; }

/* Images */
.img-gallery { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.img-thumb { position: relative; width: 80px; height: 80px; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
.img-thumb img { width: 100%; height: 100%; object-fit: cover; }
.img-remove { position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 50%; font-size: 10px; cursor: pointer; transition: background 0.2s; backdrop-filter: blur(4px); }
.img-remove:hover { background: #EF4444; }

/* Table thumbnail */
.table-thumb { width: 48px; height: 48px; border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb; background: #f9fafb; display: flex; align-items: center; justify-content: center; }
.table-thumb img { width: 100%; height: 100%; object-fit: contain; padding: 2px; }

.upload-actions { display: flex; gap: 12px; }
.upload-btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 20px; background: #f3f4f6; color: #111827; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; border: 1px solid #e5e7eb; }
.upload-btn:hover { background: #e5e7eb; }
.library-btn { background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); color: #0284c7; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
.library-btn:hover { background: rgba(56, 189, 248, 0.2); }

.modal-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 24px; }
.btn-secondary { background: #f9fafb; border: 1px solid #d1d5db; color: #4b5563; padding: 10px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
.btn-secondary:hover { background: #e5e7eb; color: #111827; }

@media (max-width: 768px) {
  .products-content { padding: 24px 16px; margin-top: 60px; }
  .form-row { grid-template-columns: 1fr; }
  .table-panel { padding: 16px; }
  .topbar { flex-direction: column; align-items: flex-start; gap: 16px; }
}
</style>
