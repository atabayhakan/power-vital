<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import axios from 'axios';

const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits(['close', 'select']);

const token = () => localStorage.getItem('token') || '';
const authHeaders = () => token() ? { Authorization: `Bearer ${token()}` } : {};

interface MediaItem {
  id: string;
  folderId: string | null;
  filename: string;
  originalName?: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface MediaFolder {
  id: string;
  name: string;
}

const mediaList = ref<MediaItem[]>([]);
const folders = ref<MediaFolder[]>([]);
const activeFolderId = ref<string | null>(null);

const isDragging = ref(false);
const isUploading = ref(false);
const newFolderName = ref('');
const isCreatingFolder = ref(false);
const uploadError = ref('');

const fetchFolders = async () => {
  try {
    const res = await axios.get('/api/v1/upload/folders', { headers: authHeaders() });
    folders.value = res.data;
  } catch (error) {
    console.error('Failed to fetch folders:', error);
  }
};

const fetchMedia = async () => {
  try {
    const res = await axios.get('/api/v1/upload', { headers: authHeaders() });
    mediaList.value = res.data;
  } catch (error) {
    console.error('Failed to fetch media:', error);
  }
};

const fileInput = ref<HTMLInputElement | null>(null);
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.value = ''; // reset so picking same file works
    fileInput.value.click();
  }
};

const createFolder = async () => {
  if (!newFolderName.value.trim()) return;
  try {
    const res = await axios.post('/api/v1/upload/folders', { name: newFolderName.value }, { headers: authHeaders() });
    folders.value.unshift(res.data);
    newFolderName.value = '';
    isCreatingFolder.value = false;
    activeFolderId.value = res.data.id;
  } catch (error: any) {
    alert(error.response?.data?.error || 'Klasör oluşturulamadı.');
  }
};

const deleteFolder = async (id: string, name: string) => {
  if (!confirm(`'${name}' klasörünü silmek istediğinize emin misiniz?`)) return;
  try {
    await axios.delete(`/api/v1/upload/folders/${id}`, { headers: authHeaders() });
    folders.value = folders.value.filter(f => f.id !== id);
    if (activeFolderId.value === id) activeFolderId.value = null;
    await fetchMedia();
  } catch (error) {
    alert('Klasör silinemedi.');
  }
};

const filteredMedia = computed(() => {
  return mediaList.value.filter(m => m.folderId === activeFolderId.value);
});

const uploadFiles = async (files: File[]) => {
  if (files.length === 0) return;
  isUploading.value = true;
  uploadError.value = '';
  const formData = new FormData();
  // Backend expects 'files' (multi-file)
  files.forEach(f => formData.append('files', f));
  if (activeFolderId.value) formData.append('folderId', activeFolderId.value);

  try {
    const res = await axios.post('/api/v1/upload', formData, {
      headers: { ...authHeaders() },
      maxBodyLength: 200 * 1024 * 1024,
      maxContentLength: 200 * 1024 * 1024,
      timeout: 5 * 60 * 1000
    });
    const uploaded = res.data?.uploaded ?? 0;
    const failed = res.data?.failed ?? 0;
    if (failed > 0) {
      uploadError.value = `${uploaded} yüklendi, ${failed} hata`;
    }
    await fetchMedia();
  } catch (e: any) {
    console.error('Upload failed:', e);
    const msg = e.response?.data?.error || e.message;
    if (e.code === 'ECONNABORTED') {
      uploadError.value = 'Zaman aşımı. Daha küçük dosya deneyin.';
    } else if (e.response?.status === 413) {
      uploadError.value = 'Dosya çok büyük (maks 8MB/dosya).';
    } else {
      uploadError.value = 'Yükleme hatası: ' + msg;
    }
  } finally {
    isUploading.value = false;
  }
};

const onDrop = async (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    await uploadFiles(Array.from(files));
  }
};

const onFileSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    await uploadFiles(Array.from(target.files));
  }
};

const deleteMedia = async (id: string) => {
  if (!confirm('Silmek istediğinize emin misiniz?')) return;
  try {
    await axios.delete(`/api/v1/upload/${id}`, { headers: authHeaders() });
    mediaList.value = mediaList.value.filter(m => m.id !== id);
  } catch (error) {
    alert('Silme işlemi başarısız.');
  }
};

const selectMedia = (url: string) => {
  emit('select', url);
  emit('close');
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    fetchFolders();
    fetchMedia();
  }
});
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content clay-surface">
      <div class="modal-header">
        <h2>🖼️ Medya Seçici</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="library-layout">
        <!-- FOLDERS SIDEBAR -->
        <div class="folders-sidebar">
          <div class="folders-header">
            <h3>📁 Klasörler</h3>
            <button class="btn-new-folder" @click="isCreatingFolder = !isCreatingFolder">+</button>
          </div>

          <div v-if="isCreatingFolder" class="new-folder-form">
            <input type="text" v-model="newFolderName" placeholder="Klasör Adı" @keyup.enter="createFolder" />
            <button @click="createFolder" class="btn-create">✓</button>
          </div>

          <ul class="folder-list">
            <li :class="{ active: activeFolderId === null }" @click="activeFolderId = null">
              <span>📦 Genel (Root)</span>
            </li>
            <li v-for="folder in folders" :key="folder.id" :class="{ active: activeFolderId === folder.id }" @click="activeFolderId = folder.id">
              <span>📁 {{ folder.name }}</span>
              <button class="btn-del-folder" @click.stop="deleteFolder(folder.id, folder.name)" title="Sil">🗑️</button>
            </li>
          </ul>
        </div>

        <!-- MAIN CONTENT -->
        <div class="library-main">
          <div class="upload-zone" :class="{ 'is-dragging': isDragging, 'is-uploading': isUploading }" @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop="onDrop" @click="triggerFileInput">
            <input type="file" ref="fileInput" @change="onFileSelect" accept="image/*" multiple hidden />
            <div class="upload-content">
              <h3>{{ isUploading ? '⏳ Yükleniyor...' : '📤 Buraya sürükle veya tıkla (çoklu seçim)' }}</h3>
              <p v-if="uploadError" class="upload-error">{{ uploadError }}</p>
            </div>
          </div>

          <div class="media-grid">
            <div v-for="media in filteredMedia" :key="media.id" class="media-card">
              <div class="media-preview" :style="{ backgroundImage: `url(${media.url})` }">
                <div class="media-actions">
                  <button class="action-btn select-btn" @click="selectMedia(media.url)">Seç</button>
                  <button class="action-btn delete-btn" @click="deleteMedia(media.id)">🗑️</button>
                </div>
              </div>
            </div>

            <div v-if="filteredMedia.length === 0 && !isUploading" class="empty-state">
              Görsel yok.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
  z-index: 1000; display: flex; align-items: center; justify-content: center;
}

.modal-content {
  width: 90vw; max-width: 1000px; height: 80vh;
  background: #18181b; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;
  display: flex; flex-direction: column; overflow: hidden;
}

.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.05);
}
.modal-header h2 { margin: 0; font-size: 20px; color: #fff; font-family: 'Outfit', sans-serif; }
.close-btn { background: transparent; border: none; color: #fff; font-size: 20px; cursor: pointer; }

.library-layout { display: flex; flex: 1; overflow: hidden; }

/* SIDEBAR */
.folders-sidebar {
  width: 220px; background: rgba(0,0,0,0.2); border-right: 1px solid rgba(255,255,255,0.05);
  padding: 16px; overflow-y: auto;
}
.folders-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; color: #fff; }
.folders-header h3 { margin: 0; font-size: 14px; }
.btn-new-folder { background: var(--color-primary); color: white; border: none; border-radius: 6px; width: 24px; height: 24px; cursor: pointer; }

.new-folder-form { display: flex; gap: 8px; margin-bottom: 16px; }
.new-folder-form input { flex: 1; padding: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 4px; font-size: 12px; }
.btn-create { background: #10b981; border: none; color: #fff; border-radius: 4px; padding: 0 8px; cursor: pointer; }

.folder-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
.folder-list li { padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; color: #a1a1aa; display: flex; justify-content: space-between; align-items: center; }
.folder-list li:hover { background: rgba(255,255,255,0.05); color: #fff; }
.folder-list li.active { background: rgba(188,74,60, 0.2); color: #fff; font-weight: bold; }
.btn-del-folder { background: transparent; border: none; opacity: 0; cursor: pointer; }
.folder-list li:hover .btn-del-folder { opacity: 1; }

/* MAIN */
.library-main { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; }
.upload-zone { border: 2px dashed rgba(255,255,255,0.2); border-radius: 12px; padding: 20px; text-align: center; color: #a1a1aa; cursor: pointer; margin-bottom: 20px; transition: 0.2s; }
.upload-zone:hover { border-color: var(--color-primary); background: rgba(188,74,60,0.05); }

.media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px; }
.media-card { background: #27272a; border-radius: 12px; overflow: hidden; height: 140px; position: relative; }
.media-preview { width: 100%; height: 100%; background-size: cover; background-position: center; }

.media-actions {
  position: absolute; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(2px);
  display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10px; opacity: 0; transition: 0.2s;
}
.media-card:hover .media-actions { opacity: 1; }

.action-btn { padding: 8px 16px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; width: 80%; }
.select-btn { background: var(--color-primary); color: #fff; }
.delete-btn { background: #ef4444; color: #fff; }

.empty-state { grid-column: 1 / -1; text-align: center; color: #71717a; padding: 40px; }
.upload-error { color: #ef4444; font-size: 12px; margin-top: 8px; }
.upload-zone.is-uploading { border-color: var(--color-primary); background: rgba(188,74,60,0.05); }
</style>
