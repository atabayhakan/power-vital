<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import { calculatePrice, formatPrice } from '../utils/PriceEngine';

const props = defineProps<{
  open: boolean;
  excludeIds?: string[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select', product: any): void;
}>();

interface Product {
  id: string;
  name: string;
  basePriceUsd: number;
  basePriceKgs?: number;
  stockQuantity?: number;
  images?: { imageUrl: string }[];
  category?: { id: string; name: string } | null;
}

const products = ref<Product[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');
const selectedCategoryId = ref<string>('');
const categories = ref<Array<{ id: string; name: string }>>([]);
const error = ref<string | null>(null);

const fetchProducts = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const res = await axios.get('/api/v1/products', { params: { limit: 200 } });
    products.value = Array.isArray(res.data) ? res.data : [];
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Ürünler yüklenemedi';
  } finally {
    isLoading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const res = await axios.get('/api/v1/categories');
    if (Array.isArray(res.data)) categories.value = res.data;
  } catch {
    /* non-fatal */
  }
};

const filteredProducts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return products.value.filter(p => {
    if (props.excludeIds?.includes(p.id)) return false;
    if (selectedCategoryId.value && p.category?.id !== selectedCategoryId.value) return false;
    if (q) {
      const hay = `${p.name} ${p.category?.name || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
});

const getKgsPrice = (p: Product): string => {
  const usd = Number(p.basePriceUsd || 0);
  if (usd <= 0) return '—';
  return formatPrice(calculatePrice(usd));
};

const getThumb = (p: Product): string => {
  return p.images?.[0]?.imageUrl || '';
};

const isInStock = (p: Product): boolean => {
  return (p.stockQuantity ?? 0) > 0;
};

const handleSelect = (p: Product) => {
  if (!isInStock(p)) {
    error.value = 'Bu ürün stokta yok';
    return;
  }
  emit('select', p);
};

watch(() => props.open, (isOpen) => {
  if (isOpen && products.value.length === 0) {
    fetchProducts();
    fetchCategories();
  }
});

onMounted(() => {
  if (props.open) {
    fetchProducts();
    fetchCategories();
  }
});
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="pp-backdrop" @click.self="emit('close')">
      <div class="pp-modal">
        <header class="pp-header">
          <div class="pp-header__title">
            <span class="pp-header__icon">📦</span>
            <h2>Kayıtlı Üründen Seç</h2>
            <span class="pp-header__count">{{ filteredProducts.length }} ürün</span>
          </div>
          <button class="pp-close" @click="emit('close')" title="Kapat">✕</button>
        </header>

        <div class="pp-toolbar">
          <div class="pp-search">
            <span class="pp-search__icon">🔍</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Ürün adı veya kategori ara..."
              class="pp-search__input"
            />
            <button v-if="searchQuery" class="pp-search__clear" @click="searchQuery = ''" title="Temizle">✕</button>
          </div>
          <select v-model="selectedCategoryId" class="pp-category-select">
            <option value="">Tüm kategoriler</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <div v-if="error" class="pp-error">
          ⚠ {{ error }}
        </div>

        <div v-if="isLoading" class="pp-loading">
          <div class="pp-spinner"/>
          Ürünler yükleniyor...
        </div>

        <div v-else-if="filteredProducts.length === 0" class="pp-empty">
          <span class="pp-empty__icon">🔍</span>
          <p v-if="searchQuery || selectedCategoryId">Aramanızla eşleşen ürün bulunamadı.</p>
          <p v-else>Henüz kayıtlı ürün yok. Önce "Ürünler" sayfasından ürün ekleyin.</p>
        </div>

        <div v-else class="pp-grid">
          <button
            v-for="p in filteredProducts"
            :key="p.id"
            class="pp-card"
            :class="{ 'is-out-of-stock': !isInStock(p) }"
            :disabled="!isInStock(p)"
            @click="handleSelect(p)"
            :title="isInStock(p) ? 'Bu ürünü seç' : 'Stokta yok'"
          >
            <div class="pp-card__thumb">
              <img v-if="getThumb(p)" :src="getThumb(p)" :alt="p.name" loading="lazy" />
              <span v-else class="pp-card__no-img">💊</span>
              <span v-if="!isInStock(p)" class="pp-card__oos-badge">TÜKENDİ</span>
            </div>
            <div class="pp-card__body">
              <h4 class="pp-card__name">{{ p.name }}</h4>
              <div class="pp-card__meta">
                <span v-if="p.category?.name" class="pp-card__cat">{{ p.category.name }}</span>
                <span class="pp-card__sku">#{{ p.id.slice(0, 8) }}</span>
              </div>
              <div class="pp-card__price">
                <strong>{{ getKgsPrice(p) }} KGS</strong>
                <span class="pp-card__usd">${{ Number(p.basePriceUsd || 0).toFixed(2) }}</span>
              </div>
              <div class="pp-card__stock" :class="{ 'is-empty': (p.stockQuantity ?? 0) <= 5 }">
                📦 Stok: {{ p.stockQuantity ?? 0 }}
              </div>
            </div>
            <div v-if="isInStock(p)" class="pp-card__cta">Seç →</div>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.pp-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: pp-fade 0.18s ease-out;
}
@keyframes pp-fade { from { opacity: 0; } to { opacity: 1; } }

.pp-modal {
  background: #18181b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  width: 100%;
  max-width: 920px;
  max-height: 86vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  animation: pp-pop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes pp-pop { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.pp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.3);
}
.pp-header__title { display: flex; align-items: center; gap: 10px; }
.pp-header__icon { font-size: 1.4rem; }
.pp-header__title h2 { font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 700; color: #f4f4f5; margin: 0; }
.pp-header__count {
  padding: 3px 10px;
  background: rgba(188, 74, 60, 0.15);
  border: 1px solid rgba(188, 74, 60, 0.3);
  border-radius: 100px;
  font-size: 11px;
  font-weight: 700;
  color: #fca5a5;
  font-family: 'Outfit', sans-serif;
}
.pp-close {
  width: 36px; height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #a1a1aa;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}
.pp-close:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }

.pp-toolbar {
  display: flex;
  gap: 10px;
  padding: 14px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.2);
}
.pp-search {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}
.pp-search__icon {
  position: absolute;
  left: 14px;
  color: #71717a;
  font-size: 14px;
  pointer-events: none;
}
.pp-search__input {
  width: 100%;
  padding: 10px 38px 10px 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #f4f4f5;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
}
.pp-search__input:focus { border-color: #BC4A3C; }
.pp-search__input::placeholder { color: #71717a; }
.pp-search__clear {
  position: absolute;
  right: 8px;
  width: 24px; height: 24px;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 6px;
  color: #a1a1aa;
  font-size: 11px;
  cursor: pointer;
}
.pp-search__clear:hover { color: #fff; }

.pp-category-select {
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #f4f4f5;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  outline: none;
  min-width: 180px;
  cursor: pointer;
}
.pp-category-select option { background: #18181b; color: #f4f4f5; }

.pp-error {
  margin: 12px 24px 0;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 13px;
}

.pp-loading, .pp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 24px;
  color: #71717a;
  font-size: 14px;
}
.pp-empty__icon { font-size: 48px; opacity: 0.5; }
.pp-spinner {
  width: 32px; height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #BC4A3C;
  border-radius: 50%;
  animation: pp-spin 0.8s linear infinite;
}
@keyframes pp-spin { to { transform: rotate(360deg); } }

.pp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
  padding: 18px 24px 24px;
  overflow-y: auto;
  flex: 1;
}

.pp-card {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  color: inherit;
  overflow: hidden;
  transition: all 0.18s ease;
  position: relative;
}
.pp-card:hover:not(:disabled) {
  background: rgba(188, 74, 60, 0.08);
  border-color: rgba(188, 74, 60, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(188, 74, 60, 0.2);
}
.pp-card:disabled, .pp-card.is-out-of-stock {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(0.5);
}
.pp-card:disabled:hover { transform: none; box-shadow: none; }

.pp-card__thumb {
  position: relative;
  width: 100%;
  height: 130px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  overflow: hidden;
}
.pp-card__thumb img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
}
.pp-card__no-img { font-size: 48px; opacity: 0.5; }
.pp-card__oos-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 3px 8px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.pp-card__body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.pp-card__name {
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #f4f4f5;
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pp-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
}
.pp-card__cat {
  color: #a1a1aa;
  font-weight: 600;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 100px;
}
.pp-card__sku { color: #71717a; font-family: monospace; }

.pp-card__price {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 4px;
}
.pp-card__price strong {
  font-family: 'Outfit', sans-serif;
  font-size: 16px;
  font-weight: 900;
  color: #BC4A3C;
  line-height: 1;
}
.pp-card__usd {
  font-size: 11px;
  color: #71717a;
  text-decoration: line-through;
}

.pp-card__stock {
  font-size: 11px;
  color: #10b981;
  font-weight: 600;
  margin-top: 2px;
}
.pp-card__stock.is-empty { color: #fbbf24; }

.pp-card__cta {
  position: absolute;
  bottom: 12px;
  right: 12px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #FF3B30, #D8412F);
  color: #fff;
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  font-weight: 800;
  border-radius: 6px;
  opacity: 0;
  transition: opacity 0.15s;
}
.pp-card:hover:not(:disabled) .pp-card__cta { opacity: 1; }
</style>
