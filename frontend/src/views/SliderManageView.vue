<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../utils/api';
import MediaSelectorModal from '../components/MediaSelectorModal.vue';
import { useTranslate } from '../composables/useTranslate';

const { t } = useTranslate();

interface Slide {
  id: string; title: string; subtitle: string | null;
  buttonText: string | null; buttonLink: string | null;
  imageUrl: string; sortOrder: number; isActive: boolean;
  displayMode: string; mobileImageUrl: string | null;
  scheduledStart: string | null; scheduledEnd: string | null;
  overlayOpacity: number;
  translations?: Record<string, any>;
}

const slides = ref<Slide[]>([]);
const editing = ref<Slide | null>(null);

// 🛡️ Backend zod schema (validators.HeroSlideCreateSchema) requires:
//   displayMode: enum "IMAGE_ONLY" | "TEXT_OVERLAY" | "BUTTON_LINK"
//   imageUrl:    z.string().url()  ← must be a FULL URL, not "/uploads/..."
//   buttonLink:  z.string().url()  ← same — internal paths must be converted
//   overlayOpacity: int (0-100) — we map 0-100% to that scale
// See the validators file: backend/src/validators/slide.ts
const DISPLAY_MODES = ['IMAGE_ONLY', 'TEXT_OVERLAY', 'BUTTON_LINK'] as const;

const defaultForm = () => ({
  title: '', subtitle: '', buttonText: '', buttonLink: '',
  imageUrl: '', mobileImageUrl: '', sortOrder: 0, isActive: true,
  displayMode: 'IMAGE_ONLY' as typeof DISPLAY_MODES[number],
  scheduledStart: '', scheduledEnd: '', overlayOpacity: 0,
  translations: {} as Record<string, any>
});

const form = ref(defaultForm());
const loading = ref(false);
const imgUploading = ref<{desktop: boolean, mobile: boolean}>({ desktop: false, mobile: false });

// Media Library selector state
const isMediaModalOpen = ref(false);
const activeTargetField = ref<'desktop' | 'mobile' | null>(null);

const openMediaLibrary = (target: 'desktop' | 'mobile') => {
  activeTargetField.value = target;
  isMediaModalOpen.value = true;
};

const onMediaLibrarySelect = (url: string) => {
  if (activeTargetField.value === 'desktop') {
    form.value.imageUrl = url;
  } else if (activeTargetField.value === 'mobile') {
    form.value.mobileImageUrl = url;
  }
  activeTargetField.value = null;
};

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().slice(0, 16);
};

const fetchSlides = async () => {
  try {
    const res = await api.get('/slides/all');
    slides.value = res.data;
  } catch (e) { console.error('Slide yüklenemedi:', e); }
};

const resetForm = () => {
  form.value = defaultForm();
  editing.value = null;
};

const editSlide = (s: Slide) => {
  editing.value = s;
  form.value = {
    title: s.title, subtitle: s.subtitle || '', buttonText: s.buttonText || '', buttonLink: s.buttonLink || '',
    imageUrl: s.imageUrl, mobileImageUrl: s.mobileImageUrl || '', sortOrder: s.sortOrder, isActive: s.isActive,
    // Old DB rows may have legacy "WITH_TEXT" — treat as TEXT_OVERLAY on read.
    displayMode: (DISPLAY_MODES as readonly string[]).includes(s.displayMode || '')
      ? (s.displayMode as typeof DISPLAY_MODES[number])
      : 'IMAGE_ONLY',
    overlayOpacity: s.overlayOpacity || 0,
    scheduledStart: formatDateTime(s.scheduledStart), scheduledEnd: formatDateTime(s.scheduledEnd),
    translations: (typeof s.translations === 'string' ? JSON.parse(s.translations) : s.translations) || {}
  };
};

// Convert "/foo/bar" → "https://www.powervital.kg/foo/bar" so the backend's
// z.string().url() validator accepts it. Already-absolute URLs are passed
// through unchanged. The preview line in the form already shows the full
// resolved URL, so the user sees where the link will actually go.
const toAbsoluteUrl = (raw: string): string => {
  const v = (raw || '').trim();
  if (!v) return v;
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith('/')) return window.location.origin + v;
  return v;
};

// 🛡️ overlayOpacity is rendered as 0-100% in the UI slider for a more
// intuitive experience (visitors understand "60% darker"). Backend stores
// the same 0-100 scale as int. If the schema ever changes to 0-1 floats
// we only have to update this one mapping.
const toOverlay = (uiPercent: number): number => Math.max(0, Math.min(100, Math.round(Number(uiPercent) || 0)));

const saveSlide = async () => {
  loading.value = true;
  try {
    const payload = {
      ...form.value,
      imageUrl: toAbsoluteUrl(form.value.imageUrl),
      mobileImageUrl: form.value.mobileImageUrl ? toAbsoluteUrl(form.value.mobileImageUrl) : '',
      buttonLink: form.value.buttonLink ? toAbsoluteUrl(form.value.buttonLink) : '',
      overlayOpacity: toOverlay(form.value.overlayOpacity),
      scheduledStart: form.value.scheduledStart ? new Date(form.value.scheduledStart).toISOString() : null,
      scheduledEnd: form.value.scheduledEnd ? new Date(form.value.scheduledEnd).toISOString() : null
    };

    if (editing.value) {
      await api.put(`/slides/${editing.value.id}`, payload);
    } else {
      await api.post('/slides', payload);
    }
    resetForm();
    await fetchSlides();
  } catch (e: any) {
    // Show zod issues path-by-path so the admin knows which field to fix.
    const issues = e.response?.data?.issues as Array<{ path: string; message: string }> | undefined;
    if (issues?.length) {
      alert('Hata:\n' + issues.map(i => `• ${i.path}: ${i.message}`).join('\n'));
    } else {
      alert('Hata: ' + (e.response?.data?.error || e.message));
    }
  }
  loading.value = false;
};

const deleteSlide = async (id: string) => {
  if (!confirm('Bu slide silinecek. Emin misiniz?')) return;
  try {
    await api.delete(`/slides/${id}`);
    await fetchSlides();
  } catch (e: any) { alert('Slide silinemedi: ' + (e.response?.data?.error || e.message)); }
};

const uploadSliderImage = async (e: Event, type: 'desktop' | 'mobile') => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.[0]) return;
  imgUploading.value[type] = true;
  try {
    const fd = new FormData();
    fd.append('file', input.files[0]);
    const res = await api.post('/upload/hires', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (type === 'desktop') form.value.imageUrl = res.data.url;
    else form.value.mobileImageUrl = res.data.url;
  } catch (err: any) { alert('Yükleme hatası: ' + (err.response?.data?.error || err.message)); }
  imgUploading.value[type] = false;
};

// Slider translations are generated automatically server-side on save +
// continuous TranslationSweeper. No manual translate action needed.

onMounted(fetchSlides);
</script>

<template>
  <div class="admin-page animate-fade-in">
    <header class="topbar">
      <div>
        <h2>🖼️ Kurumsal Slider Yönetimi</h2>
        <p class="subtitle">Pazarlama kampanyalarınızı esnek görünümler ve zamanlama ile yönetin.</p>
      </div>
      <router-link to="/cms/page-builder" class="cross-link">
        🧱 {{ t('admin.cms.goPageBuilder') }} →
      </router-link>
    </header>

    <div class="admin-panel-grid">
      <!-- Form -->
      <div class="form-card panel">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0;">{{ editing ? '✏️ Kampanya Düzenle' : '➕ Yeni Kampanya Ekle' }}</h3>
        </div>
        
        <form @submit.prevent="saveSlide" class="slide-form">
          <!-- Toggle Switch -->
          <div class="mode-toggle">
            <button type="button" :class="{active: form.displayMode === 'IMAGE_ONLY'}" @click="form.displayMode = 'IMAGE_ONLY'">Sadece Görsel</button>
            <button type="button" :class="{active: form.displayMode === 'TEXT_OVERLAY'}" @click="form.displayMode = 'TEXT_OVERLAY'">Metin Katmanlı</button>
          </div>

          <!-- Metin Katmanlı Alanlar -->
          <template v-if="form.displayMode === 'TEXT_OVERLAY'">
            <div class="form-row">
              <div class="field"><label>Ana Başlık *</label><input v-model="form.title" required /></div>
              <div class="field"><label>Alt Başlık</label><input v-model="form.subtitle" /></div>
            </div>
            <div class="form-row">
              <div class="field"><label>Buton Metni</label><input v-model="form.buttonText" placeholder="Örn: Ürünleri İncele" /></div>
              <div class="field"><label>Buton Linki</label><input v-model="form.buttonLink" placeholder="/kategori/x" /></div>
            </div>
            <div class="form-row">
              <div class="field range-field">
                <label>Görsel Karartma Oranı ({{ form.overlayOpacity }}%)</label>
                <input type="range" v-model.number="form.overlayOpacity" min="0" max="100" />
                <small>Metinlerin daha iyi okunabilmesi için arka plana siyah transparan bir katman atar.</small>
              </div>
            </div>
          </template>

          <!-- Sadece Görsel Alanları -->
          <template v-else>
            <div class="form-row">
              <div class="field"><label>Kampanya Yönlendirme Linki</label><input v-model="form.buttonLink" placeholder="/urun/x" /></div>
              <div class="field" style="visibility: hidden"><label>&nbsp;</label><input disabled /></div> <!-- Spacer for grid -->
            </div>
          </template>

          <hr class="divider" />

          <!-- Görsel Yüklemeleri -->
          <div class="form-row">
            <div class="field">
              <label>Masaüstü Görsel (Yatay) *</label>
              <div class="upload-wrapper">
                <input v-model="form.imageUrl" placeholder="https://..." required />
                <label class="btn-sm upload-btn">
                  {{ imgUploading.desktop ? '⏳' : 'Yükle' }}
                  <input type="file" accept="image/*" @change="(e) => uploadSliderImage(e, 'desktop')" :disabled="imgUploading.desktop" hidden />
                </label>
                <button
                  type="button"
                  class="btn-sm library-btn"
                  @click="openMediaLibrary('desktop')"
                  :disabled="imgUploading.desktop"
                  title="Mevcut görseli kütüphaneden seç"
                >📁 K. Seç</button>
              </div>
              <div v-if="form.imageUrl" class="img-preview"><img :src="form.imageUrl" /></div>
            </div>
            <div class="field">
              <label>Mobil Görsel (Dikey - Opsiyonel)</label>
              <div class="upload-wrapper">
                <input v-model="form.mobileImageUrl" placeholder="https://..." />
                <label class="btn-sm upload-btn">
                  {{ imgUploading.mobile ? '⏳' : 'Yükle' }}
                  <input type="file" accept="image/*" @change="(e) => uploadSliderImage(e, 'mobile')" :disabled="imgUploading.mobile" hidden />
                </label>
                <button
                  type="button"
                  class="btn-sm library-btn"
                  @click="openMediaLibrary('mobile')"
                  :disabled="imgUploading.mobile"
                  title="Mevcut görseli kütüphaneden seç"
                >📁 K. Seç</button>
              </div>
              <div v-if="form.mobileImageUrl" class="img-preview mobile-preview"><img :src="form.mobileImageUrl" /></div>
            </div>
          </div>

          <hr class="divider" />

          <!-- Otomasyon & Zamanlama -->
          <div class="form-row">
            <div class="field"><label>Yayın Başlangıcı (Opsiyonel)</label><input type="datetime-local" v-model="form.scheduledStart" /></div>
            <div class="field"><label>Yayın Bitişi (Opsiyonel)</label><input type="datetime-local" v-model="form.scheduledEnd" /></div>
          </div>

          <div class="form-row status-row">
            <div class="field order-field"><label>Sıralama</label><input v-model.number="form.sortOrder" type="number" /></div>
            <div class="field chk"><label><input type="checkbox" v-model="form.isActive" /> Yayında (Aktif)</label></div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? 'Kaydediliyor...' : 'Kaydet' }}</button>
            <button type="button" class="btn-secondary" v-if="editing" @click="resetForm">İptal</button>
          </div>
        </form>
      </div>

      <!-- List -->
      <div class="slides-list panel">
        <h3>Yayındaki ve Bekleyen Kampanyalar ({{ slides.length }})</h3>
        <div v-if="slides.length === 0" class="empty">Henüz kampanya eklenmemiş.</div>
        
        <div class="slide-list-container">
          <div v-for="s in slides" :key="s.id" class="slide-row" :class="{'inactive': !s.isActive}">
            <div class="slide-thumb-wrapper">
              <img :src="s.imageUrl" class="slide-thumb" />
              <div class="mode-badge">{{ s.displayMode === 'IMAGE_ONLY' ? 'Görsel' : 'Metinli' }}</div>
            </div>
            
            <div class="slide-info">
              <strong>{{ s.displayMode === 'TEXT_OVERLAY' ? s.title : 'Özel Görsel Kampanyası' }}</strong>
              <div class="meta-info">
                <span v-if="s.scheduledStart">🕒 Bşl: {{ new Date(s.scheduledStart).toLocaleDateString() }}</span>
                <span v-if="s.scheduledEnd">Bts: {{ new Date(s.scheduledEnd).toLocaleDateString() }}</span>
              </div>
              <span class="status" :class="s.isActive ? 'on' : 'off'">{{ s.isActive ? 'Aktif' : 'Pasif' }}</span>
            </div>
            
            <div class="slide-actions">
              <button class="btn-sm" @click="editSlide(s)">✏️</button>
              <button class="btn-sm danger" @click="deleteSlide(s.id)">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Media Library Selector Modal -->
    <MediaSelectorModal
      :isOpen="isMediaModalOpen"
      @close="isMediaModalOpen = false; activeTargetField = null"
      @select="onMediaLibrarySelect"
    />
  </div>
</template>

<style scoped>
.admin-page { flex: 1; padding: 20px 32px; overflow-y: auto; }
.topbar { margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
.topbar h2 { font-size: 20px; font-weight: 700; margin:0; color: var(--color-text-main); }
.subtitle { color: var(--color-text-muted); font-size: 13px; margin-top: 2px; }
.cross-link {
  font-size: 13px; font-weight: 700; color: #3b82f6; text-decoration: none;
  white-space: nowrap; padding-bottom: 2px;
}
.cross-link:hover { text-decoration: underline; }

.admin-panel-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; align-items: start; }

.form-card { padding: 16px; }
.slides-list { padding: 16px; }

.form-card h3, .slides-list h3 { margin-bottom: 16px; font-size: 16px; font-weight: 700; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px; color: var(--color-text-main); margin-top: 0; }

/* Form Styles */
.slide-form { display: flex; flex-direction: column; gap: 12px; }
.form-row { display: flex; gap: 12px; align-items: flex-end; }
.field { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.field label { font-size: 12px; font-weight: 600; color: var(--color-text-main); }
.field input { padding: 8px 12px; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 6px; color: var(--color-text-main); font-size: 13px; outline: none; transition: all 0.2s; box-shadow: inset 0 1px 2px rgba(0,0,0,0.02); }
.field input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(188, 74, 60, 0.15); background: #fff; }

.divider { border: 0; border-top: 1px dashed var(--glass-border); margin: 4px 0; }

/* Toggle */
.mode-toggle { display: flex; background: var(--glass-bg); border-radius: 8px; padding: 4px; gap: 4px; width: fit-content; margin-bottom: 4px; border: 1px solid var(--glass-border); }
.mode-toggle button { flex: 1; padding: 6px 16px; border: none; background: transparent; color: var(--color-text-muted); font-size: 13px; font-weight: 600; border-radius: 6px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.mode-toggle button.active { background: var(--color-primary); color: #ffffff; box-shadow: 0 2px 6px rgba(188, 74, 60, 0.3); border: none; }

/* Range */
.range-field small { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }
input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 14px; width: 14px; border-radius: 50%; background: var(--color-primary); cursor: pointer; margin-top: -5px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: var(--glass-border); border-radius: 2px; }

/* Uploads */
.upload-wrapper { display: flex; gap: 6px; align-items: stretch; height: 36px; }
.upload-wrapper input { flex: 1; min-width: 0; height: 100%; margin: 0; }
.upload-btn {
  padding: 0 12px; background: var(--color-primary);
  border: none; border-radius: 6px; cursor: pointer;
  font-size: 12px; font-weight: 700; color: #ffffff;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; margin-bottom: 0; flex-shrink: 0; white-space: nowrap;
}
.upload-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(188, 74, 60, 0.3); background: #a63f31; }
.upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.library-btn {
  padding: 0 12px; background: #4a5568;
  border: none; border-radius: 6px;
  color: #ffffff; font-size: 12px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 4px;
  transition: all 0.2s; margin-bottom: 0; flex-shrink: 0; white-space: nowrap;
}
.library-btn:hover:not(:disabled) { background: #2d3748; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
.library-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.img-preview { margin-top: 6px; border-radius: 6px; overflow: hidden; border: 1px solid var(--glass-border); height: 80px; display: flex; align-items: center; justify-content: center; background: var(--glass-bg); }
.img-preview img { width: 100%; height: 100%; object-fit: cover; }
.mobile-preview { width: 60px; margin: 6px auto 0 0; }

/* Status Row */
.status-row { align-items: center; margin-top: 4px; }
.order-field { flex: 0 0 80px; }
.chk { flex: 1; justify-content: flex-start; padding-bottom: 6px; }
.chk label { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 13px; font-weight: 600; color: var(--color-text-main); }
.chk input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--color-primary); cursor: pointer; }

/* Actions */
.form-actions { display: flex; gap: 10px; margin-top: 10px; padding-top: 12px; border-top: 1px solid var(--glass-border); }
.btn-primary { padding: 10px 24px; background: var(--pv-gradient); color: #fff; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 10px rgba(188, 74, 60, 0.2); transition: all 0.2s; font-size: 14px; }
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(188, 74, 60, 0.3); }
.btn-secondary { padding: 10px 24px; background: #fff; color: var(--color-text-main); border: 1px solid var(--glass-border); border-radius: 6px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: all 0.2s; font-size: 14px; }
.btn-secondary:hover { background: #f9f9f9; }

/* List */
.slide-list-container { display: flex; flex-direction: column; gap: 12px; }
.slide-row { display: flex; align-items: stretch; gap: 12px; padding: 12px; background: #fff; border-radius: 10px; border: 1px solid var(--glass-border); box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: transform 0.2s; }
.slide-row:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
.slide-row.inactive { opacity: 0.6; background: #fafafa; }
.slide-thumb-wrapper { position: relative; width: 110px; flex-shrink: 0; }
.slide-thumb { width: 100%; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid var(--glass-border); }
.mode-badge { position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); color: #fff; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
.slide-info { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
.slide-info strong { font-size: 13px; font-weight: 700; color: var(--color-text-main); line-height: 1.2; }
.meta-info { display: flex; gap: 10px; font-size: 11px; color: var(--color-text-muted); }
.status { font-size: 11px; font-weight: 700; margin-top: 2px; display: inline-flex; align-items: center; gap: 4px; }
.status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; }
.status.on { color: var(--color-accent-success); }
.status.on::before { background: var(--color-accent-success); box-shadow: 0 0 6px var(--color-accent-success); }
.status.off { color: var(--color-accent-danger); }
.status.off::before { background: var(--color-accent-danger); box-shadow: 0 0 6px var(--color-accent-danger); }
.slide-actions { display: flex; flex-direction: column; gap: 6px; justify-content: center; }
.btn-sm { padding: 6px; background: #fff; border: 1px solid var(--glass-border); border-radius: 6px; cursor: pointer; color: var(--color-text-main); font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: all 0.2s; }
.btn-sm:hover { background: #f4f4f5; transform: translateY(-1px); }
.btn-sm.danger:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }
.empty { padding: 24px; text-align: center; color: var(--color-text-muted); background: var(--glass-bg); border-radius: 10px; border: 1px dashed var(--glass-border); font-size: 13px; }

@media (max-width: 1024px) {
  .admin-panel-grid { grid-template-columns: 1fr; }
  .form-row { flex-direction: column; gap: 10px; align-items: stretch; }
  .upload-wrapper { flex-direction: column; height: auto; }
  .upload-wrapper input { height: 36px; }
  .upload-btn, .library-btn { width: 100%; padding: 10px; }
}
</style>
