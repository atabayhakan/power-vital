<script setup lang="ts">
// AdminI18nView — Çeviri Merkezi ana sayfası (2026-06 redesign).
//
// Sadece 6 model kartı + her kartta "Eksik" badge.
// Kart tıklanınca /i18n/{model} sayfasına yönlendirir (AdminI18nProductView
// gibi) — orada inline 4-kolon editör var.
//
// Burada liste/inline edit yok — sadece giriş noktası.
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { apiGet } from '@/api/openapi-client';
import { useTranslate } from '../composables/useTranslate';

const router = useRouter();
const { t } = useTranslate();

interface ModelStat {
  model: string;
  totalRecords: number;
  sampledRecords: number;
  coveragePct: number;
  totalSlots: number;
  filledSlots: number;
}

const stats = ref<ModelStat[]>([]);
const isLoading = ref(false);
const errorMsg = ref('');

const load = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const { data } = await apiGet('/api/v1/admin/i18n/stats');
    stats.value = (data as unknown as { stats: ModelStat[] }).stats;
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.error || e.message;
  } finally {
    isLoading.value = false;
  }
};

onMounted(load);

const MODELS: { value: string; label: string; icon: string; route: string; description: string }[] = [
  { value: 'Product', label: 'Ürünler', icon: '💊', route: '/i18n/products', description: 'Ürün adı, açıklama, faydalar, accordion' },
  { value: 'Category', label: 'Kategoriler', icon: '🗂️', route: '/i18n/categories', description: 'Kategori adı ve açıklaması' },
  { value: 'Page', label: 'Sayfalar', icon: '📄', route: '/i18n/pages', description: 'CMS sayfaları (Hakkımızda, vb.)' },
  { value: 'HeroSlide', label: 'Slider / Banner', icon: '🖼️', route: '/i18n/sliders', description: 'Anasayfa slider başlık ve alt yazı' },
  { value: 'StoreReview', label: 'Mağaza Yorumları', icon: '💬', route: '/i18n/store-reviews', description: 'Mağaza değerlendirmeleri' },
  { value: 'SiteSettings', label: 'Site Ayarları', icon: '⚙️', route: '/i18n/site-settings', description: 'Genel mağaza ayarları' }
];

const stat = (model: string): ModelStat | undefined => stats.value.find((s) => s.model === model);

const overallCoverage = computed(() => {
  if (stats.value.length === 0) return 0;
  const total = stats.value.reduce((a, s) => a + s.totalSlots, 0);
  const filled = stats.value.reduce((a, s) => a + s.filledSlots, 0);
  return total > 0 ? Math.round((filled / total) * 100) : 100;
});

const colorForCoverage = (pct: number) =>
  pct >= 90 ? 'linear-gradient(135deg, #10b981, #34d399)' :
  pct >= 60 ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' :
              'linear-gradient(135deg, #ef4444, #f87171)';

const statusLabel = (pct: number) =>
  pct >= 90 ? t('admin.i18n.statusExcellent') : pct >= 60 ? t('admin.i18n.statusGood') : t('admin.i18n.statusLow');

const goTo = (route: string) => router.push(route);
</script>

<template>
  <div class="i18n animate-fade-in">
    <header class="i18n-head">
      <div>
        <h1>🌍 {{ t('admin.i18n.title') }} <span class="i18n-tag">Manuel</span></h1>
        <p class="i18n-sub">{{ t('admin.i18n.subtitle') }}</p>
      </div>
      <div class="i18n-head-actions">
        <button class="iv-btn" :disabled="isLoading" @click="load">
          <span :class="{ spin: isLoading }">↻</span> {{ t('admin.i18n.refresh') }}
        </button>
      </div>
    </header>

    <p v-if="errorMsg" class="iv-error">⚠️ {{ errorMsg }}</p>

    <!-- Big overall coverage -->
    <div v-if="stats.length" class="i18n-overall" :style="{ background: colorForCoverage(overallCoverage) }">
      <div class="overall-label">{{ t('admin.i18n.overallCoverage') }}</div>
      <div class="overall-value">%{{ overallCoverage }}</div>
      <div class="overall-status">{{ statusLabel(overallCoverage) }}</div>
    </div>

    <!-- Model cards — each routes to a dedicated translation list page -->
    <div v-if="stats.length" class="i18n-models">
      <button
        v-for="m in MODELS"
        :key="m.value"
        class="model-card"
        @click="goTo(m.route)"
      >
        <span class="model-icon">{{ m.icon }}</span>
        <span class="model-label">{{ m.label }}</span>
        <span class="model-coverage" :style="{ background: colorForCoverage(stat(m.value)?.coveragePct ?? 0) }">
          %{{ stat(m.value)?.coveragePct ?? 0 }}
        </span>
        <span class="model-status">{{ statusLabel(stat(m.value)?.coveragePct ?? 0) }}</span>
        <span class="model-desc">{{ m.description }}</span>
        <span class="model-cta">{{ t('admin.i18n.openCta') }}</span>
      </button>

      <!-- UI strings: the static storefront text (buttons, nav, system
           messages). Editable from a dedicated flat key/value editor — not
           tied to a DB model, so no backend coverage stat. -->
      <button class="model-card model-card--ui" @click="goTo('/i18n/ui-strings')">
        <span class="model-icon">🔤</span>
        <span class="model-label">{{ t('admin.i18n.uiStringsTitle') }}</span>
        <span class="model-coverage model-coverage--ui">{{ t('admin.i18n.uiStringsBadge') }}</span>
        <span class="model-status">{{ t('admin.i18n.uiStringsDesc1') }}</span>
        <span class="model-desc">{{ t('admin.i18n.uiStringsDesc2') }}</span>
        <span class="model-cta">{{ t('admin.i18n.openCta') }}</span>
      </button>
    </div>

    <div v-else-if="isLoading" class="i18n-empty">⏳ {{ t('admin.i18n.loading') }}</div>
  </div>
</template>

<style scoped>
.i18n {
  padding: 32px;
  max-width: 1280px;
  margin: 0 auto;
  color: #1a1a1a;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  box-sizing: border-box;
}
.i18n::-webkit-scrollbar { width: 8px; }
.i18n::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.18); border-radius: 4px; }

.i18n-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.i18n-head h1 { font-size: 1.6rem; font-weight: 800; margin: 0 0 6px; color: #1a1a1a; display: flex; align-items: center; gap: 10px; }
.i18n-tag { font-size: 0.7rem; background: #BC4A3C; color: #fff; padding: 2px 8px; border-radius: 999px; font-weight: 700; letter-spacing: 0.04em; }
.i18n-sub { color: #525252; margin: 0; font-size: 0.9rem; max-width: 700px; line-height: 1.5; }
.i18n-head-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.iv-btn {
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid #d6d2c8; background: #fff; color: #1a1a1a;
  font-family: inherit; font-size: 0.85rem; font-weight: 600;
  padding: 8px 14px; border-radius: 10px; cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.iv-btn:hover { background: #f3efe7; border-color: #a8a39a; }
.iv-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.iv-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 10px 14px; border-radius: 10px; margin-bottom: 16px; font-size: 0.88rem; }
.spin { display: inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.i18n-overall {
  display: flex; flex-direction: column; align-items: flex-start; justify-content: center;
  color: #fff; padding: 28px 32px; border-radius: 16px; margin-bottom: 32px;
  min-height: 140px;
}
.overall-label { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.85); }
.overall-value { font-size: 3.5rem; font-weight: 900; line-height: 1; margin: 8px 0; }
.overall-status { font-size: 0.95rem; font-weight: 700; }

.i18n-models {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.model-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto auto auto;
  gap: 6px 12px;
  padding: 20px;
  background: #fff;
  border: 1px solid #e8e4d8;
  border-radius: 14px;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
  color: #1a1a1a;
}
.model-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #BC4A3C;
}
.model-icon { grid-row: 1; font-size: 2rem; line-height: 1; }
.model-label { grid-row: 1; grid-column: 2; font-size: 1.05rem; font-weight: 800; }
.model-coverage { grid-row: 1; grid-column: 3; color: #fff; font-weight: 800; padding: 4px 10px; border-radius: 999px; font-size: 0.85rem; align-self: center; }
.model-status { grid-row: 2; grid-column: 2 / span 2; font-size: 0.78rem; color: #737373; }
.model-desc { grid-row: 3; grid-column: 1 / span 3; font-size: 0.85rem; color: #525252; line-height: 1.4; margin-top: 4px; }
.model-cta {
  grid-row: 4; grid-column: 1 / span 3;
  margin-top: 8px;
  font-size: 0.85rem; font-weight: 700; color: #BC4A3C;
  display: flex; align-items: center; gap: 4px;
}

.model-card--ui { border-color: #BC4A3C; background: linear-gradient(180deg, #fff, #fdf6f4); }
.model-coverage--ui { background: linear-gradient(135deg, #BC4A3C, #d4675a); letter-spacing: 0.06em; }

.i18n-empty { padding: 48px 16px; text-align: center; color: #525252; }
</style>
