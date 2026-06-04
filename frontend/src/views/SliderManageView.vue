<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

interface Slide {
  id: string; title: string; subtitle: string | null;
  buttonText: string | null; buttonLink: string | null;
  imageUrl: string; sortOrder: number; isActive: boolean;
}

const slides = ref<Slide[]>([]);
const editing = ref<Slide | null>(null);
const form = ref({ title: '', subtitle: '', buttonText: '', buttonLink: '', imageUrl: '', sortOrder: 0, isActive: true });
const loading = ref(false);
const imgUploading = ref(false);

const token = () => localStorage.getItem('token') || '';
const headers = () => ({ Authorization: `Bearer ${token()}` });

const fetchSlides = async () => {
  try {
    const res = await axios.get('/api/v1/slides/all', { headers: headers() });
    slides.value = res.data;
  } catch (e) { console.error('Slide yüklenemedi:', e); }
};

const resetForm = () => {
  form.value = { title: '', subtitle: '', buttonText: '', buttonLink: '', imageUrl: '', sortOrder: 0, isActive: true };
  editing.value = null;
};

const editSlide = (s: Slide) => {
  editing.value = s;
  form.value = { title: s.title, subtitle: s.subtitle || '', buttonText: s.buttonText || '', buttonLink: s.buttonLink || '', imageUrl: s.imageUrl, sortOrder: s.sortOrder, isActive: s.isActive };
};

const saveSlide = async () => {
  loading.value = true;
  try {
    if (editing.value) {
      await axios.put(`/api/v1/slides/${editing.value.id}`, form.value, { headers: headers() });
    } else {
      await axios.post('/api/v1/slides', form.value, { headers: headers() });
    }
    resetForm();
    await fetchSlides();
  } catch (e: any) { alert('Hata: ' + (e.response?.data?.error || e.message)); }
  loading.value = false;
};

const deleteSlide = async (id: string) => {
  if (!confirm('Bu slide silinecek. Emin misiniz?')) return;
  try {
    await axios.delete(`/api/v1/slides/${id}`, { headers: headers() });
    await fetchSlides();
  } catch (e: any) { alert('Slide silinemedi: ' + (e.response?.data?.error || e.message)); }
};

const uploadSliderImage = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.[0]) return;
  imgUploading.value = true;
  try {
    const fd = new FormData();
    fd.append('file', input.files[0]);
    const res = await axios.post('/api/v1/upload/hires', fd, {
      headers: { ...headers(), 'Content-Type': 'multipart/form-data' }
    });
    form.value.imageUrl = res.data.url;
  } catch (err: any) { alert('Yükleme hatası: ' + (err.response?.data?.error || err.message)); }
  imgUploading.value = false;
};

onMounted(fetchSlides);
</script>

<template>
  <div class="admin-page animate-fade-in">
    <header class="topbar"><h2>🖼️ Slider Yönetimi</h2></header>

    <!-- Form -->
    <div class="form-card glass-panel">
      <h3>{{ editing ? '✏️ Slide Düzenle' : '➕ Yeni Slide Ekle' }}</h3>
      <form @submit.prevent="saveSlide" class="slide-form">
        <div class="form-row">
          <div class="field"><label>Başlık *</label><input v-model="form.title" required /></div>
          <div class="field"><label>Alt Başlık</label><input v-model="form.subtitle" /></div>
        </div>
        <div class="form-row">
          <div class="field"><label>Buton Metni</label><input v-model="form.buttonText" placeholder="Ürünleri Keşfet" /></div>
          <div class="field"><label>Buton Linki</label><input v-model="form.buttonLink" placeholder="/register veya #products" /></div>
        </div>
        <div class="form-row">
          <div class="field" style="flex:2">
            <label>Görsel URL</label>
            <input v-model="form.imageUrl" placeholder="https://... veya yükle →" />
          </div>
          <div class="field" style="flex:0 0 auto; justify-content:flex-end">
            <label>&nbsp;</label>
            <label class="upload-btn">
              {{ imgUploading ? '⏳...' : '📤 Yükle' }}
              <input type="file" accept="image/*" @change="uploadSliderImage" :disabled="imgUploading" hidden />
            </label>
          </div>
        </div>
        <div v-if="form.imageUrl" class="img-preview">
          <img :src="form.imageUrl" alt="Önizleme" />
        </div>
        <div class="form-row">
          <div class="field"><label>Sıralama</label><input v-model.number="form.sortOrder" type="number" /></div>
          <div class="field chk"><label><input type="checkbox" v-model="form.isActive" /> Aktif</label></div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? 'Kaydediliyor...' : 'Kaydet' }}</button>
          <button type="button" class="btn-secondary" v-if="editing" @click="resetForm">İptal</button>
        </div>
      </form>
    </div>

    <!-- List -->
    <div class="slides-list glass-panel">
      <h3>Mevcut Slider'lar ({{ slides.length }})</h3>
      <div v-if="slides.length === 0" class="empty">Henüz slider eklenmemiş.</div>
      <div v-for="s in slides" :key="s.id" class="slide-row">
        <img :src="s.imageUrl" class="slide-thumb" />
        <div class="slide-info">
          <strong>{{ s.title }}</strong>
          <small>{{ s.subtitle || '—' }}</small>
          <span class="status" :class="s.isActive ? 'on' : 'off'">{{ s.isActive ? 'Aktif' : 'Pasif' }}</span>
        </div>
        <div class="slide-actions">
          <button class="btn-sm" @click="editSlide(s)">✏️</button>
          <button class="btn-sm danger" @click="deleteSlide(s.id)">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page { flex: 1; padding: 32px; overflow-y: auto; }
.topbar { margin-bottom: 24px; }
.topbar h2 { font-size: 24px; font-weight: 700; }
.form-card, .slides-list { padding: 24px; margin-bottom: 24px; }
.form-card h3, .slides-list h3 { margin-bottom: 20px; font-size: 16px; }
.slide-form { display: flex; flex-direction: column; gap: 16px; }
.form-row { display: flex; gap: 16px; }
.field { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.field.full { flex: 2; }
.field label { font-size: 13px; font-weight: 600; color: var(--color-text-muted); }
.field input { padding: 10px 14px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; color: var(--color-text-main); font-size: 14px; outline: none; }
.field input:focus { border-color: var(--color-primary); }
.chk { flex: 0; justify-content: flex-end; }
.chk label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.form-actions { display: flex; gap: 12px; }
.btn-primary { padding: 10px 24px; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
.btn-secondary { padding: 10px 24px; background: rgba(255,255,255,.05); color: var(--color-text-muted); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; cursor: pointer; }
.slide-row { display: flex; align-items: center; gap: 16px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,.05); }
.slide-thumb { width: 100px; height: 56px; object-fit: cover; border-radius: 6px; }
.slide-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.slide-info strong { font-size: 14px; }
.slide-info small { font-size: 12px; color: var(--color-text-muted); }
.status { font-size: 11px; font-weight: 600; }
.status.on { color: var(--color-accent-success); }
.status.off { color: var(--color-accent-danger); }
.slide-actions { display: flex; gap: 8px; }
.btn-sm { padding: 6px 12px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 6px; cursor: pointer; color: var(--color-text-main); }
.btn-sm.danger:hover { background: rgba(245,54,92,.2); }
.empty { padding: 24px; text-align: center; color: var(--color-text-muted); }
.upload-btn { display: inline-block; padding: 10px 18px; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; text-align: center; }
.img-preview { margin-top: 8px; }
.img-preview img { max-width: 100%; max-height: 180px; border-radius: 8px; border: 1px solid rgba(255,255,255,.1); }
</style>
