<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

interface Product {
  id: string; barcode: string; name: string; description: string;
  basePriceUsd: string; basePriceKgs: string; stockQuantity: number;
  categoryId: string | null; category?: { id: string; name: string } | null;
  images?: { id: string; imageUrl: string }[];
}
interface Category { id: string; name: string; slug: string; }

const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const isLoading = ref(true);
const isSaving = ref(false);
const isModalOpen = ref(false);
const editingProductId = ref<string | null>(null);
const imgUploading = ref(false);

const token = () => localStorage.getItem('token') || '';
const headers = () => ({ Authorization: `Bearer ${token()}` });

const form = ref({
  barcode: '', name: '', description: '', basePriceUsd: 0, stockQuantity: 0,
  categoryId: '', imageUrls: [] as string[]
});

const fetchProducts = async () => {
  isLoading.value = true;
  try {
    const [pRes, cRes] = await Promise.all([
      axios.get('/api/v1/products', { headers: headers() }),
      axios.get('/api/v1/categories', { headers: headers() })
    ]);
    products.value = pRes.data;
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
      basePriceUsd: parseFloat(product.basePriceUsd),
      stockQuantity: product.stockQuantity,
      categoryId: product.categoryId || '',
      imageUrls: product.images?.map(i => i.imageUrl) || []
    };
  } else {
    editingProductId.value = null;
    form.value = { barcode: '', name: '', description: '', basePriceUsd: 0, stockQuantity: 0, categoryId: '', imageUrls: [] };
  }
  isModalOpen.value = true;
};

const closeModal = () => { isModalOpen.value = false; editingProductId.value = null; };

const uploadImage = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.[0]) return;
  imgUploading.value = true;
  try {
    const fd = new FormData();
    fd.append('file', input.files[0]);
    const res = await axios.post('/api/v1/upload', fd, {
      headers: { ...headers(), 'Content-Type': 'multipart/form-data' }
    });
    form.value.imageUrls.push(res.data.url);
  } catch (err: any) { alert('Yükleme hatası: ' + (err.response?.data?.error || err.message)); }
  imgUploading.value = false;
  input.value = ''; // Reset file input
};

const removeImage = (idx: number) => form.value.imageUrls.splice(idx, 1);

const saveProduct = async () => {
  if (!form.value.barcode || !form.value.name) {
    alert('Barkod ve ürün adı zorunludur.');
    return;
  }
  isSaving.value = true;
  try {
    const payload = { ...form.value, categoryId: form.value.categoryId || undefined };
    if (editingProductId.value) {
      await axios.put(`/api/v1/products/${editingProductId.value}`, payload, { headers: headers() });
    } else {
      await axios.post('/api/v1/products', payload, { headers: headers() });
    }
    await fetchProducts();
    closeModal();
  } catch (e: any) {
    alert('Ürün kaydedilemedi: ' + (e.response?.data?.error || e.message));
  } finally {
    isSaving.value = false;
  }
};

const deleteProduct = async (id: string) => {
  if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
  try {
    await axios.delete(`/api/v1/products/${id}`, { headers: headers() });
    await fetchProducts();
  } catch { alert('Ürün silinemedi.'); }
};

const fmtKgs = (n: any) => Math.round(Number(n)).toLocaleString('ru-RU');
onMounted(fetchProducts);
</script>

<template>
  <div class="products-content animate-fade-in">
    <div class="header-row">
      <div>
        <h2>📦 Ürün Yönetimi</h2>
        <p class="subtitle">Ürünlerinizi ekleyin, güncelleyin ve stoklarını yönetin.</p>
      </div>
      <button class="btn-primary" @click="openModal()">+ Yeni Ürün Ekle</button>
    </div>

    <div v-if="isLoading" class="loading glass-panel">Yükleniyor...</div>
    
    <div v-else class="glass-panel table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Barkod</th><th>Ürün Adı</th><th>Kategori</th>
            <th>Fiyat (USD)</th><th>Fiyat (KGS)</th><th>Stok</th><th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td class="mono">{{ product.barcode }}</td>
            <td class="product-name">
              <strong>{{ product.name }}</strong>
              <span class="desc-text" v-if="product.description">{{ product.description }}</span>
            </td>
            <td><span class="cat-badge" v-if="product.category">{{ product.category.name }}</span><span v-else class="text-muted">—</span></td>
            <td class="price">${{ parseFloat(product.basePriceUsd).toFixed(2) }}</td>
            <td class="price-local">{{ fmtKgs(product.basePriceKgs) }} <span>сом</span></td>
            <td>
              <span class="stock-badge" :class="{ 'low-stock': product.stockQuantity < 10 }">
                {{ product.stockQuantity }}
              </span>
            </td>
            <td class="actions">
              <button class="btn-icon edit" @click="openModal(product)">✏️</button>
              <button class="btn-icon delete" @click="deleteProduct(product.id)">🗑️</button>
            </td>
          </tr>
          <tr v-if="products.length === 0">
            <td colspan="7" class="empty-state">Henüz hiç ürün eklenmemiş.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content glass-panel">
        <div class="modal-header">
          <h3>{{ editingProductId ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle' }}</h3>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        
        <form @submit.prevent="saveProduct" class="product-form">
          <div class="form-row">
            <div class="form-group"><label>Barkod *</label><input type="text" v-model="form.barcode" required placeholder="PV-001" /></div>
            <div class="form-group"><label>Ürün Adı *</label><input type="text" v-model="form.name" required placeholder="Premium Kolajen" /></div>
          </div>

          <div class="form-group"><label>Açıklama</label><textarea v-model="form.description" rows="2" placeholder="Ürün detayları..."></textarea></div>

          <div class="form-group">
            <label>Kategori</label>
            <select v-model="form.categoryId">
              <option value="">Seçiniz...</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Fiyat (USD)</label>
              <div class="input-with-icon"><span class="icon">$</span><input type="number" step="0.01" min="0" v-model="form.basePriceUsd" required /></div>
              <small class="hint">KGS fiyatı güncel kura göre otomatik hesaplanır.</small>
            </div>
            <div class="form-group"><label>Stok Miktarı</label><input type="number" min="0" v-model="form.stockQuantity" required /></div>
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
            <label class="upload-btn">
              {{ imgUploading ? '⏳ Yükleniyor...' : '📤 Görsel Yükle (WebP)' }}
              <input type="file" accept="image/*" @change="uploadImage" :disabled="imgUploading" hidden />
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeModal">İptal</button>
            <button type="submit" class="btn-primary" :disabled="isSaving">{{ isSaving ? 'Kaydediliyor...' : 'Kaydet' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.products-content { flex: 1; padding: 32px; display: flex; flex-direction: column; gap: 24px; overflow-y: auto; }
.header-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.subtitle { color: var(--color-text-muted); margin-top: 8px; }
.table-container { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 14px 16px; text-align: left; border-bottom: 1px solid rgba(255,255,255,.05); }
.data-table th { color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: .05em; white-space: nowrap; }
.mono { font-family: monospace; font-size: 12px; }
.product-name strong { display: block; font-size: 14px; }
.desc-text { display: block; font-size: 11px; color: var(--color-text-muted); margin-top: 2px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cat-badge { background: rgba(14,165,233,.15); color: #38bdf8; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
.text-muted { color: var(--color-text-muted); font-size: 12px; }
.price { font-weight: 600; }
.price-local { font-weight: 600; }
.price-local span { font-size: 11px; opacity: .6; }
.stock-badge { background: rgba(34,197,94,.1); color: #22c55e; padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: 700; }
.stock-badge.low-stock { background: rgba(239,68,68,.1); color: #ef4444; }
.actions { display: flex; gap: 6px; }
.btn-icon { background: rgba(255,255,255,.05); border: none; border-radius: 6px; width: 32px; height: 32px; cursor: pointer; transition: all .15s; }
.btn-icon:hover { background: rgba(255,255,255,.1); transform: translateY(-1px); }
.empty-state { text-align: center; padding: 40px !important; color: var(--color-text-muted); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.modal-content { width: 100%; max-width: 560px; padding: 28px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.close-btn { background: transparent; border: none; color: var(--color-text-muted); font-size: 20px; cursor: pointer; }
.product-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group label { font-size: 13px; color: var(--color-text-muted); font-weight: 600; }
.form-group input, .form-group textarea, .form-group select { background: rgba(0,0,0,.2); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 10px 12px; color: #fff; font-family: inherit; font-size: 14px; outline: none; }
.form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: var(--color-primary); }
.form-group select { appearance: auto; }
.input-with-icon { position: relative; display: flex; align-items: center; }
.input-with-icon .icon { position: absolute; left: 12px; color: var(--color-text-muted); }
.input-with-icon input { padding-left: 28px; width: 100%; }
.hint { font-size: 11px; color: var(--color-text-muted); }

/* Images */
.img-gallery { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.img-thumb { position: relative; width: 72px; height: 72px; border-radius: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,.1); }
.img-thumb img { width: 100%; height: 100%; object-fit: cover; }
.img-remove { position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; background: rgba(0,0,0,.7); color: #fff; border: none; border-radius: 50%; cursor: pointer; font-size: 10px; display: flex; align-items: center; justify-content: center; }
.upload-btn { display: inline-block; padding: 8px 16px; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; text-align: center; width: fit-content; }

.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
.btn-secondary { background: transparent; border: 1px solid rgba(255,255,255,.1); color: #fff; padding: 10px 24px; border-radius: 8px; cursor: pointer; }
.btn-secondary:hover { background: rgba(255,255,255,.05); }

@media (max-width: 640px) {
  .form-row { grid-template-columns: 1fr; }
  .header-row { flex-direction: column; align-items: stretch; }
}
</style>
