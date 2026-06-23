<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '../utils/api';
import { useToast } from '../composables/useToast';
import { useTranslate } from '../composables/useTranslate';

const toast = useToast();
const { t } = useTranslate();
const reviews = ref<any[]>([]);
const storeReviews = ref<any[]>([]);
const isLoading = ref(true);

const filterStatus = ref('all'); // 'all', 'pending', 'published', 'rejected'
const currentTab = ref('product'); // 'product', 'store'

const fetchReviews = async () => {
  try {
    isLoading.value = true;
    if (currentTab.value === 'product') {
      const res = await api.get('/reviews/admin/all');
      reviews.value = res.data?.items ?? res.data;
    } else {
      const res = await api.get('/store-reviews/admin/all');
      storeReviews.value = res.data?.items ?? res.data;
    }
  } catch (e: any) {
    console.error(e);
    toast.error('Hata', 'Yorumlar yüklenirken hata oluştu');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchReviews();
});

const filteredList = computed(() => {
  const source = currentTab.value === 'product' ? reviews.value : storeReviews.value;
  if (filterStatus.value === 'all') return source;
  return source.filter(r => r.status === filterStatus.value);
});

const switchTab = (tab: string) => {
  currentTab.value = tab;
  fetchReviews();
};

const setStatus = async (id: string, status: string) => {
  try {
    const endpoint = currentTab.value === 'product' ? `/reviews/admin/${id}/status` : `/store-reviews/admin/${id}/status`;
    await api.put(endpoint, { status });
    toast.success('Başarılı', `Yorum durumu güncellendi: ${status}`);
    fetchReviews();
  } catch (e) {
    toast.error('Hata', 'Durum güncellenemedi');
  }
};

const deleteReview = async (id: string) => {
  if (!confirm('Bu yorumu kalıcı olarak silmek istediğinize emin misiniz?')) return;
  try {
    const endpoint = currentTab.value === 'product' ? `/reviews/admin/${id}` : `/store-reviews/admin/${id}`;
    await api.delete(endpoint);
    toast.success('Başarılı', 'Yorum silindi');
    fetchReviews();
  } catch (e) {
    toast.error('Hata', 'Yorum silinemedi');
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

// Review translations are generated automatically server-side (auto-translate
// on save + continuous TranslationSweeper). No manual translate action needed.
</script>

<template>
  <div class="admin-page animate-fade-in">
    <header class="page-header god-mode-header">
      <div class="header-left">
        <h2>💬 Yorum Moderasyonu</h2>
        <p class="text-muted">{{ t('admin.review.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-ghost" @click="fetchReviews">🔄 Yenile</button>
      </div>
    </header>

    <div class="main-tabs">
      <button :class="['main-tab', { active: currentTab === 'product' }]" @click="switchTab('product')">{{ t('admin.review.tabProduct') }}</button>
      <button :class="['main-tab', { active: currentTab === 'store' }]" @click="switchTab('store')">{{ t('admin.review.tabStore') }}</button>
    </div>

    <div class="god-mode-tabs mt-4">
      <button :class="['gm-tab', { active: filterStatus === 'all' }]" @click="filterStatus = 'all'">{{ t('admin.review.filterAll') }}</button>
      <button :class="['gm-tab', { active: filterStatus === 'pending' }]" @click="filterStatus = 'pending'">Bekleyenler</button>
      <button :class="['gm-tab', { active: filterStatus === 'published' }]" @click="filterStatus = 'published'">Onaylananlar</button>
      <button :class="['gm-tab', { active: filterStatus === 'rejected' }]" @click="filterStatus = 'rejected'">Reddedilenler</button>
    </div>

    <div v-if="isLoading" class="loading-state glass-panel">{{ t('admin.review.loading') }}</div>

    <div v-else-if="filteredList.length === 0" class="empty-state glass-panel">
      {{ t('admin.review.empty') }}
    </div>

    <div v-else class="reviews-grid">
      <div v-for="rev in filteredList" :key="rev.id" class="review-card glass-panel" :class="`status-${rev.status}`">
        <div class="rev-header">
          <div class="rev-author">
            <span class="avatar">{{ rev.name.charAt(0).toUpperCase() }}</span>
            <div class="author-info">
              <strong>{{ rev.name }}</strong>
              <span class="date">{{ formatDate(rev.createdAt) }}</span>
            </div>
          </div>
          <div class="rev-status-badge">{{ rev.status === 'pending' ? 'Bekliyor' : rev.status === 'published' ? 'Onaylandı' : 'Reddedildi' }}</div>
        </div>
        
        <div class="rev-product" v-if="currentTab === 'product'">{{ t('admin.review.product') }} {{ rev.product?.name || 'Bilinmeyen Ürün' }}</div>
        <div class="rev-product" v-else>{{ t('admin.review.type') }}</div>
        
        <div class="rev-rating">
          <span v-for="s in 5" :key="s" class="star" :class="{ active: s <= rev.rating }">★</span>
        </div>
        
        <p class="rev-text">"{{ rev.text }}"</p>
        
        <div class="rev-actions">
          <template v-if="rev.status === 'pending'">
            <button class="btn btn-success" @click="setStatus(rev.id, 'published')">✓ Onayla</button>
            <button class="btn btn-danger" @click="setStatus(rev.id, 'rejected')">✕ Reddet</button>
          </template>
          <template v-else-if="rev.status === 'published'">
            <button class="btn btn-warning" @click="setStatus(rev.id, 'pending')">Geri Al (Bekleyen)</button>
            <button class="btn btn-danger" @click="setStatus(rev.id, 'rejected')">✕ Reddet</button>
          </template>
          <template v-else-if="rev.status === 'rejected'">
            <button class="btn btn-success" @click="setStatus(rev.id, 'published')">✓ Onayla</button>
            <button class="btn btn-outline" @click="deleteReview(rev.id)">🗑️ Sil</button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  padding: 32px; display: flex; flex-direction: column; gap: 24px;
  /* 🛡️ Scroll fix — admin layout (App.vue) is 100vh flex with overflow:hidden
     on .main-content. Without our own scroll container the long review
     queue (product + store tabs) gets clipped at the bottom. */
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  box-sizing: border-box;
}

.main-tabs { display: flex; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }
.main-tab { background: none; border: none; color: var(--color-text-muted); padding: 8px 16px; font-size: 1rem; cursor: pointer; transition: 0.2s; border-bottom: 2px solid transparent; }
.main-tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }
.mt-4 { margin-top: 16px; }

.reviews-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
.review-card { padding: 20px; display: flex; flex-direction: column; gap: 16px; border-left: 4px solid transparent; }
.review-card.status-pending { border-left-color: #f59e0b; }
.review-card.status-published { border-left-color: #10b981; }
.review-card.status-rejected { border-left-color: #ef4444; }

.rev-header { display: flex; justify-content: space-between; align-items: center; }
.rev-author { display: flex; align-items: center; gap: 12px; }
.avatar { width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; }
.author-info { display: flex; flex-direction: column; }
.date { font-size: 0.8rem; color: var(--color-text-muted); }

.rev-status-badge { font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 12px; background: rgba(255,255,255,0.05); }
.status-pending .rev-status-badge { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
.status-published .rev-status-badge { color: #10b981; background: rgba(16, 185, 129, 0.1); }
.status-rejected .rev-status-badge { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

.rev-product { font-size: 0.85rem; color: var(--color-primary); font-weight: 500; }
.rev-rating { display: flex; gap: 2px; }
.star { color: #333; font-size: 1.2rem; }
.star.active { color: #fbbf24; }
.rev-text { font-style: italic; color: #ccc; font-size: 0.95rem; line-height: 1.5; flex: 1; }

.rev-actions { display: flex; gap: 8px; margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); }
.btn { flex: 1; padding: 8px; border-radius: 8px; font-size: 0.85rem; cursor: pointer; transition: 0.2s; border: none; font-weight: 600; }
.btn-success { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.btn-success:hover { background: #10b981; color: #fff; }
.btn-danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.btn-danger:hover { background: #ef4444; color: #fff; }
.btn-warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.btn-warning:hover { background: #f59e0b; color: #fff; }
.btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff; }
.btn-outline:hover { background: rgba(255,255,255,0.1); }
</style>
