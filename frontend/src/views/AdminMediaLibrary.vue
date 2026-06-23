<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useTranslate } from '../composables/useTranslate';

const { t } = useTranslate();

interface MediaItem {
  id: string;
  folderId: string | null;
  filename: string;
  originalName: string;
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
const uploadProgress = ref({ current: 0, total: 0 });

const newFolderName = ref('');
const isCreatingFolder = ref(false);

const fetchFolders = async () => {
  try {
    const res = await axios.get('/api/v1/upload/folders');
    folders.value = res.data;
  } catch (error) {
    console.error('Failed to fetch folders:', error);
  }
};

const fetchMedia = async () => {
  try {
    const res = await axios.get('/api/v1/upload');
    mediaList.value = res.data;
  } catch (error) {
    console.error('Failed to fetch media:', error);
  }
};

const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.value = ''; // reset so picking same file again works
    fileInput.value.click();
  }
};

const createFolder = async () => {
  if (!newFolderName.value.trim()) return;
  try {
    const res = await axios.post('/api/v1/upload/folders', { name: newFolderName.value });
    folders.value.unshift(res.data);
    newFolderName.value = '';
    isCreatingFolder.value = false;
    activeFolderId.value = res.data.id;
  } catch (error: any) {
    alert(error.response?.data?.error || 'Klasör oluşturulamadı.');
  }
};

const deleteFolder = async (id: string, name: string) => {
  if (!confirm(`'${name}' klasörünü silmek istediğinize emin misiniz? İçindeki görseller "Genel" klasörüne taşınacaktır.`)) return;
  try {
    await axios.delete(`/api/v1/upload/folders/${id}`);
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

const uploadFiles = async (files: File[]) => {
  if (files.length === 0) return;
  isUploading.value = true;
  uploadProgress.value = { current: 0, total: files.length };

  // Helper to build a fresh FormData per attempt — once a request body is sent
  // the underlying ReadableStream is consumed and cannot be re-sent, so a 401
  // retry must be issued with a brand-new FormData using the SAME File refs
  // (File objects can be appended to new FormData as many times as needed).
  const buildFormData = () => {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    if (activeFolderId.value) {
      fd.append('folderId', activeFolderId.value);
    }
    return fd;
  };

  // Proactive refresh: if the access token might be stale (admin sitting on
  // this page > 15 min) we ask the server for a new one before attempting
  // a potentially-irrecoverable 200MB upload. The refresh endpoint uses the
  // 7-day HttpOnly cookie; if it fails the user will be redirected to /login.
  const tryRefresh = async (): Promise<boolean> => {
    try {
      const r = await axios.post('/api/v1/auth/refresh', {});
      const tok = r.data?.accessToken;
      if (tok) {
        localStorage.setItem('token', tok);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const attempt = async () => {
    return axios.post('/api/v1/upload', buildFormData(), {
      // Do NOT set Content-Type manually — axios will set the correct multipart/form-data with boundary
      onUploadProgress: (e) => {
        if (e.total) {
          const pct = Math.round((e.loaded / e.total) * 100);
          uploadProgress.value = { current: pct, total: 100 };
        }
      },
      // Larger payload limit for batch uploads
      maxBodyLength: 200 * 1024 * 1024,
      maxContentLength: 200 * 1024 * 1024,
      timeout: 5 * 60 * 1000 // 5 min for large batches
    });
  };

  try {
    let res;
    try {
      res = await attempt();
    } catch (err: any) {
      // 401: access token expired mid-session. Refresh once with a brand-new
      // FormData (the previous attempt's body is unreplayable) and retry.
      if (err?.response?.status === 401) {
        const refreshed = await tryRefresh();
        if (refreshed) {
          res = await attempt();
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }
    await fetchMedia();
    const uploaded = res.data?.uploaded ?? 0;
    const failed = res.data?.failed ?? 0;
    if (failed > 0) {
      showToast(`⚠️ ${uploaded} yüklendi, ${failed} hata`);
    } else {
      showToast(`✓ ${uploaded} dosya başarıyla yüklendi`);
    }
  } catch (error: any) {
    console.error('Upload failed:', error);
    let msg = 'Dosya(lar) yüklenemedi.';
    if (error.code === 'ECONNABORTED') {
      msg = 'Yükleme zaman aşımına uğradı (5 dk). Daha küçük dosyalar veya daha az dosya deneyin.';
    } else if (error.response?.status === 413) {
      msg = 'Dosya(lar) çok büyük. Maks. 8MB/dosya, 20 dosya. Lütfen azaltın.';
    } else if (error.response?.status === 401) {
      msg = 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.';
    } else if (error.response?.data?.error) {
      msg = error.response.data.error;
    } else if (error.message) {
      msg = `Hata: ${error.message}`;
    }
    showToast(`✕ ${msg}`);
  } finally {
    isUploading.value = false;
    uploadProgress.value = { current: 0, total: 0 };
  }
};

const deleteMedia = async (id: string) => {
  if (!confirm('Bu medyayı silmek istediğinize emin misiniz?')) return;
  try {
    await axios.delete(`/api/v1/upload/${id}`);
    mediaList.value = mediaList.value.filter(m => m.id !== id);
  } catch (error) {
    console.error('Delete failed:', error);
    alert('Silme işlemi başarısız.');
  }
};

const moveToFolder = async (mediaId: string, folderId: string | null) => {
  try {
    await axios.put(`/api/v1/upload/${mediaId}/move`, { folderId });
    await fetchMedia();
  } catch (error) {
    alert('Taşıma işlemi başarısız.');
  }
};

const copyUrl = async (url: string) => {
  // Strategy 1: Modern async clipboard API (requires HTTPS or localhost + user gesture)
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      showToast('URL Kopyalandı: ' + url);
      return;
    }
  } catch (err) {
    // Fall through to legacy method
    console.warn('Clipboard API failed, trying fallback', err);
  }

  // Strategy 2: Legacy execCommand fallback (works on http://IP and inside iframes)
  try {
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '1px';
    textarea.style.height = '1px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, url.length);
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (successful) {
      showToast('URL Kopyalandı: ' + url);
    } else {
      showToast('Kopyalanamadı — URL: ' + url);
    }
  } catch (err) {
    console.error('Copy failed:', err);
    showToast('Kopyalanamadı — URL: ' + url);
  }
};

const toastMsg = ref('');
const toastTimeout = ref<any>(null);
const showToast = (msg: string) => {
  toastMsg.value = msg;
  if (toastTimeout.value) clearTimeout(toastTimeout.value);
  toastTimeout.value = setTimeout(() => { toastMsg.value = ''; }, 2500);
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const getDisplayName = (m: MediaItem) => m.originalName || m.filename;

// Image load error fallback
const onImgError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  // Replace broken image with a placeholder
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent) {
    parent.classList.add('img-broken');
    const placeholder = parent.querySelector('.img-placeholder') || document.createElement('div');
    placeholder.className = 'img-placeholder';
    placeholder.innerHTML = '🖼️<br/><small>Önizleme yok</small>';
    if (!parent.querySelector('.img-placeholder')) {
      parent.appendChild(placeholder);
    }
  }
};

onMounted(async () => {
  await fetchFolders();
  await fetchMedia();
});
</script>

<template>
  <div class="media-library-view">
    <div class="header">
      <h1 class="page-title">{{ t('admin.media.title') }}</h1>
      <p class="page-desc">{{ t('admin.media.subtitle') }}</p>
    </div>

    <div class="library-layout">
      <!-- FOLDERS SIDEBAR -->
      <div class="folders-sidebar">
        <div class="folders-header">
          <h3>{{ t('admin.media.folders') }}</h3>
          <button class="btn-new-folder" @click="isCreatingFolder = !isCreatingFolder">+</button>
        </div>

        <div v-if="isCreatingFolder" class="new-folder-form">
          <input type="text" v-model="newFolderName" placeholder="Klasör Adı" @keyup.enter="createFolder" />
          <button @click="createFolder" class="btn-create">{{ t('admin.media.create') }}</button>
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
        <div
          class="upload-zone"
          :class="{ 'is-dragging': isDragging, 'is-uploading': isUploading }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop="onDrop"
          @click="triggerFileInput"
        >
          <input type="file" ref="fileInput" @change="onFileSelect" accept="image/*" multiple hidden />
          <div class="upload-content">
            <span class="upload-icon">{{ isUploading ? '⏳' : '☁️' }}</span>
            <h3>{{ isUploading ? 'Yükleniyor...' : 'Birden fazla dosya sürükleyebilir veya seçebilirsiniz' }}</h3>
            <p v-if="!isUploading">
              {{ activeFolderId ? `'${folders.find(f => f.id === activeFolderId)?.name}' klasörüne` : 'Genel klasörüne' }}
              · Maks. 20 dosya, 8MB/dosya · JPG, PNG, WebP
            </p>
            <div v-if="isUploading" class="upload-progress">
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: uploadProgress.current + '%' }"/>
              </div>
              <span class="progress-text">%{{ uploadProgress.current }}</span>
            </div>
          </div>
        </div>

        <div class="media-grid">
          <div v-for="media in filteredMedia" :key="media.id" class="media-card">
            <div class="media-preview">
              <img
                :src="media.url"
                :alt="getDisplayName(media)"
                class="media-thumb"
                loading="lazy"
                @error="onImgError($event)"
              />
              <div class="media-actions">
                <button class="action-btn copy-btn" @click="copyUrl(media.url)" title="URL'yi Kopyala">🔗 URL</button>
                <button class="action-btn delete-btn" @click="deleteMedia(media.id)" title="Sil">🗑️</button>
              </div>
            </div>
            <div class="media-info">
              <div class="filename" :title="getDisplayName(media)">
                {{ getDisplayName(media) }}
              </div>
              <div v-if="getDisplayName(media) !== media.filename" class="internal-name" :title="media.filename">
                📁 {{ media.filename }}
              </div>

              <div class="meta-row">
                <div class="meta">
                  <span>{{ formatSize(media.size) }}</span>
                  <span>{{ formatDate(media.createdAt) }}</span>
                </div>
                <!-- Move to Folder Selector -->
                <select class="folder-select" @change="moveToFolder(media.id, ($event.target as HTMLSelectElement).value)">
                  <option value="" :selected="media.folderId === null">Genel</option>
                  <option v-for="f in folders" :key="f.id" :value="f.id" :selected="media.folderId === f.id">
                    {{ f.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div v-if="filteredMedia.length === 0 && !isUploading" class="empty-state">
            {{ t('admin.media.empty') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Toast notification -->
    <Transition name="toast">
      <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.media-library-view {
  padding: 32px;
  color: #fff;
  /* 🛡️ Scroll fix — admin layout (App.vue) is 100vh flex with overflow:hidden
     on .main-content. Without our own scroll container the long Media
     Library view gets clipped at the bottom. */
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  box-sizing: border-box;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header { margin-bottom: 24px; flex-shrink: 0; }
.page-title { font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 800; margin: 0 0 8px 0; }
.page-desc { color: #a1a1aa; font-size: 15px; margin: 0; }

.library-layout {
  display: flex;
  gap: 24px;
  flex: 1;
  overflow: hidden;
}

/* FOLDERS SIDEBAR */
.folders-sidebar {
  width: 260px;
  background: rgba(30, 30, 35, 0.7);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.05);
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}
.folders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.folders-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
.btn-new-folder {
  background: var(--color-primary);
  color: white;
  border: none;
  width: 28px; height: 28px;
  border-radius: 8px;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-new-folder:hover { background: var(--color-secondary); transform: scale(1.05); }

.new-folder-form {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.new-folder-form input {
  flex: 1;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
}
.btn-create {
  background: #10b981;
  border: none;
  color: white;
  border-radius: 6px;
  padding: 0 10px;
  font-size: 12px;
  cursor: pointer;
}

.folder-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
.folder-list li {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #a1a1aa;
}
.folder-list li:hover { background: rgba(255,255,255,0.05); color: #fff; }
.folder-list li.active {
  background: rgba(var(--color-primary-rgb, 230,57,70), 0.15);
  color: var(--color-secondary);
  font-weight: 600;
  border-left: 3px solid var(--color-primary);
}
.btn-del-folder {
  background: transparent; border: none; font-size: 14px; cursor: pointer;
  opacity: 0; transition: opacity 0.2s;
}
.folder-list li:hover .btn-del-folder { opacity: 1; }
.btn-del-folder:hover { transform: scale(1.2); }

/* MAIN CONTENT */
.library-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-right: 8px;
}

.upload-zone {
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  background: rgba(0,0,0,0.2);
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 24px;
  flex-shrink: 0;
}
.upload-zone:hover, .upload-zone.is-dragging {
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb, 230,57,70), 0.05);
  transform: scale(1.005);
}
.upload-zone.is-uploading {
  cursor: progress;
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb, 230,57,70), 0.08);
}
.upload-icon {
  font-size: 36px; display: block; margin-bottom: 8px;
  animation: uploadPulse 1.4s ease-in-out infinite;
}
.upload-zone.is-uploading .upload-icon { animation-duration: 0.8s; }
@keyframes uploadPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: 0.85; }
}
.upload-content h3 { margin: 0 0 4px 0; font-size: 16px; }
.upload-content p { margin: 0; color: #a1a1aa; font-size: 13px; }

.upload-progress {
  margin-top: 16px;
  display: flex; align-items: center; gap: 12px;
  max-width: 360px; margin-left: auto; margin-right: auto;
}
.progress-track {
  flex: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), #ff7a85);
  transition: width 0.2s ease-out;
  box-shadow: 0 0 8px rgba(230,57,70,0.5);
}
.progress-text { font-size: 12px; font-weight: 700; color: var(--color-primary); min-width: 36px; }

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  align-content: start;
}

.media-card {
  background: #18181b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}
.media-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.2); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }

.media-preview {
  width: 100%;
  height: 140px;
  background: linear-gradient(135deg, #1f1f23 0%, #18181b 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  transition: transform 0.3s ease;
}
.media-card:hover .media-thumb { transform: scale(1.05); }

/* Fallback when image fails to load */
.media-preview.img-broken {
  background: rgba(239, 68, 68, 0.08);
}
.img-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #71717a;
  font-size: 24px;
  text-align: center;
}
.img-placeholder small {
  font-size: 10px;
  margin-top: 4px;
  opacity: 0.7;
}

.media-actions {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex; align-items: center; justify-content: center; gap: 12px;
  opacity: 0; transition: opacity 0.2s; backdrop-filter: blur(2px);
}
.media-card:hover .media-actions { opacity: 1; }

.action-btn { border: none; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 700; cursor: pointer; }
.copy-btn { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); }
.copy-btn:hover { background: rgba(255,255,255,0.2); }
.delete-btn { background: #ef4444; color: #fff; }

.media-info { padding: 12px; }
.filename {
  font-size: 12px; font-weight: 700; margin-bottom: 2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  color: #fff;
}
.internal-name {
  font-size: 10px; color: #71717a; font-family: 'JetBrains Mono', monospace;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed rgba(255,255,255,0.06);
}

.meta-row { display: flex; flex-direction: column; gap: 8px; }
.meta { display: flex; justify-content: space-between; font-size: 10px; color: #71717a; }

.folder-select {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  border-radius: 4px;
  padding: 4px;
  font-size: 11px;
  width: 100%;
}
.folder-select option { background: #18181b; }

.empty-state {
  grid-column: 1 / -1; text-align: center; padding: 40px; color: #71717a;
  background: rgba(0,0,0,0.2); border-radius: 12px; font-style: italic;
}

/* Toast */
.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: #1f1f23; color: #fff; padding: 12px 20px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1); font-size: 13px; font-weight: 600;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4); z-index: 9999;
  max-width: 90vw; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(20px); }

@media (max-width: 768px) {
  .media-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
  .upload-zone { padding: 20px 16px; }
  .upload-content h3 { font-size: 14px; }
}
</style>
