<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCategoryStore, type Category } from '../stores/useCategoryStore';
import MediaSelectorModal from '../components/MediaSelectorModal.vue';
import { useTranslate } from '../composables/useTranslate';

const catStore = useCategoryStore();
const { t } = useTranslate();

onMounted(() => {
  catStore.fetchCategories();
});

const newCatTitle = ref('');
const newCatImageUrl = ref('');
const newCatTranslations = ref<any>({});
const imgUploading = ref(false);

// ═══ EDIT MODE STATE ═══
const isEditing = ref(false);
const currentEditId = ref<string | null>(null);
const isSaving = ref(false);

const resetForm = () => {
  newCatTitle.value = '';
  newCatImageUrl.value = '';
  newCatTranslations.value = {};
  isEditing.value = false;
  currentEditId.value = null;
};

const initiateEdit = (cat: Category) => {
  isEditing.value = true;
  currentEditId.value = cat.id;
  newCatTitle.value = cat.name;
  newCatTranslations.value = typeof cat.translations === 'string' ? JSON.parse(cat.translations) : (cat.translations || {});
  // iconEmoji is reused as the image URL field for backward compat with old data
  newCatImageUrl.value = cat.imageUrl || cat.iconEmoji || '';
  // Smoothly scroll the form into view
  setTimeout(() => {
    document.querySelector('.add-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 50);
};

const cancelEdit = () => {
  resetForm();
};

const uploadImage = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.[0]) return;
  imgUploading.value = true;
  try {
    const fd = new FormData();
    Array.from(input.files).forEach(f => fd.append('files', f));
    const token = localStorage.getItem('token') || '';
    const res = await fetch('/api/v1/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: fd
    });
    const data = await res.json();
    const url = data?.results?.[0]?.url;
    if (url) newCatImageUrl.value = url;
  } catch (err) {
    console.error('Upload error:', err);
    alert('Yükleme hatası');
  } finally {
    imgUploading.value = false;
    input.value = '';
  }
};

// Helper: check if string is a URL (not a real emoji)
const isUrl = (val: string | null | undefined): boolean =>
  !!val && (val.startsWith('http') || val.startsWith('/') || val.startsWith('data:'));

// Category translations are generated automatically server-side on save +
// continuous TranslationSweeper. No manual translate action needed.

const saveCategory = async () => {
  if (!newCatTitle.value) return;
  isSaving.value = true;
  try {
    // Only set iconEmoji if it's a real emoji (not a URL)
    const emojiIcon = isUrl(newCatImageUrl.value) ? null : (newCatImageUrl.value || null);
    if (isEditing.value && currentEditId.value) {
      // UPDATE — preserves foreign-key relationships with products
      const payload: Partial<Category> = {
        name: newCatTitle.value,
        imageUrl: newCatImageUrl.value || null,
        iconEmoji: emojiIcon,
        translations: newCatTranslations.value
      };
      await catStore.updateCategory(currentEditId.value, payload);
      alert('Kategori güncellendi ✓');
    } else {
      // CREATE
      const cat = await catStore.addCategory(newCatTitle.value, emojiIcon || '🏷️', newCatImageUrl.value || null);
      if (cat?.id) {
        // Update with imageUrl and translations
        await catStore.updateCategory(cat.id, { 
          imageUrl: newCatImageUrl.value || null, 
          iconEmoji: emojiIcon || null,
          translations: newCatTranslations.value
        });
      }
      alert('Kategori eklendi ✓');
    }
    resetForm();
  } catch (err: any) {
    alert('Hata: ' + (err.response?.data?.error || err.message || 'Bilinmeyen hata'));
  } finally {
    isSaving.value = false;
  }
};

const isMediaModalOpen = ref(false);
const handleMediaSelect = (url: string) => {
  newCatImageUrl.value = url;
};

// Resolves the category's image URL (imageUrl takes priority, falls back to iconEmoji if it's a URL)
const getCategoryIconUrl = (cat: Category): string | undefined => {
  const url = cat.imageUrl || (cat.iconEmoji && /^https?:\/\//.test(cat.iconEmoji) ? cat.iconEmoji : null);
  return url || undefined;
};
</script>

<template>
  <div class="admin-page animate-fade-in">
    <header class="topbar">
      <h2>{{ t('admin.category.title') }}</h2>
      <p class="subtitle">{{ t('admin.category.subtitle') }}</p>
    </header>

    <div class="admin-panel-grid">
      <!-- Add / Edit Category Panel -->
      <div class="panel" :class="{ 'is-editing': isEditing }">
        <h3>{{ isEditing ? '✏️ Kategoriyi Düzenle' : 'Yeni Kategori Ekle' }}</h3>
        <form @submit.prevent="saveCategory" class="add-form">
          <div class="field">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="margin:0;">{{ t('admin.category.name') }}</label>
            </div>
            <input v-model="newCatTitle" placeholder="Örn: Protein Tozları" required />
          </div>
          <div class="field">
            <label>{{ t('admin.category.imageTitle') }}</label>
            <div class="upload-wrapper">
              <input v-model="newCatImageUrl" placeholder="https://... veya emoji" />
              <label class="btn-sm upload-btn">
                {{ imgUploading ? '⏳' : 'Yükle' }}
                <input type="file" accept="image/*" @change="uploadImage" :disabled="imgUploading" hidden />
              </label>
              <button
                type="button"
                class="btn-sm library-btn"
                @click="isMediaModalOpen = true"
                title="Mevcut görseli kütüphaneden seç"
              >📁 K. Seç</button>
            </div>
            <small class="hint">{{ t('admin.category.imageHint') }}</small>
            <div v-if="newCatImageUrl && (newCatImageUrl.startsWith('http') || newCatImageUrl.startsWith('/uploads/'))" class="img-preview">
              <img :src="newCatImageUrl" alt="Önizleme" />
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="isSaving">
              {{ isSaving ? 'Kaydediliyor...' : (isEditing ? '💾 Güncelle' : 'Ekle') }}
            </button>
            <button v-if="isEditing" type="button" class="btn-cancel" @click="cancelEdit" :disabled="isSaving">
              İptal
            </button>
          </div>
        </form>
      </div>

      <!-- Categories List -->
      <div class="panel">
        <h3>{{ t('admin.category.ordering') }}</h3>
        <p class="help-text">{{ t('admin.category.orderingHint') }}</p>

        <transition-group name="list" tag="div" class="cat-list">
          <div
            v-for="(cat, index) in catStore.categories"
            :key="cat.id"
            class="cat-item clay-inset"
            :class="{ 'is-hidden': !cat.isActive, 'is-current-edit': isEditing && currentEditId === cat.id }"
          >
            <div class="cat-left">
              <span class="cat-icon">
                <img
                  v-if="getCategoryIconUrl(cat)"
                  :src="getCategoryIconUrl(cat) || ''"
                  class="icon-img"
                />
                <template v-else>{{ cat.iconEmoji }}</template>
              </span>
              <span class="cat-title">{{ cat.name }}</span>
              <span v-if="isEditing && currentEditId === cat.id" class="edit-badge">Düzenleniyor</span>
            </div>

            <div class="cat-actions">
              <button class="action-btn toggle-btn" @click="catStore.toggleVisibility(cat.id)" :title="cat.isActive ? 'Gizle' : 'Göster'">
                {{ cat.isActive ? '👁️' : '👁️‍🗨️' }}
              </button>
              <button class="action-btn move-btn" @click="catStore.moveCategory(index, 'up')" :disabled="index === 0">↑</button>
              <button class="action-btn move-btn" @click="catStore.moveCategory(index, 'down')" :disabled="index === catStore.categories.length - 1">↓</button>
              <button
                class="action-btn edit-btn"
                @click="initiateEdit(cat)"
                :title="isEditing && currentEditId === cat.id ? 'Şu an düzenleniyor' : 'Düzenle'"
              >✏️</button>
              <button class="action-btn delete-btn" @click="catStore.deleteCategory(cat.id)">🗑️</button>
            </div>
          </div>
        </transition-group>
      </div>
    </div>

    <MediaSelectorModal
      :is-open="isMediaModalOpen"
      @close="isMediaModalOpen = false"
      @select="handleMediaSelect"
    />
  </div>
</template>

<style scoped>
.admin-page { flex: 1; padding: 32px; overflow-y: auto; }
.topbar { margin-bottom: 32px; }
.topbar h2 { font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 800; margin: 0 0 8px 0; }
.subtitle { color: #a1a1aa; font-family: 'Montserrat', sans-serif; font-size: 0.95rem; }

h3 { font-family: 'Outfit', sans-serif; font-size: 1.3rem; margin-bottom: 24px; font-weight: 700; }
.help-text { font-size: 0.85rem; color: #a1a1aa; margin-bottom: 16px; }

/* Form */
.add-form { display: flex; flex-direction: column; gap: 20px; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field label { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #a1a1aa; letter-spacing: 1px; }
.field input { padding: 12px 16px; background: rgba(128, 128, 128, 0.05); border: 1px solid rgba(128, 128, 128, 0.2); border-radius: 12px; color: inherit; font-family: 'Montserrat', sans-serif; font-size: 1rem; outline: none; transition: border-color 0.2s; }
.field input:focus { border-color: #BC4A3C; }

.hint { font-size: 11px; color: #a1a1aa; margin-top: 2px; }

/* Image preview */
.img-preview { margin-top: 8px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1); height: 120px; display: flex; align-items: center; justify-content: center; background: #000; }
.img-preview img { width: 100%; height: 100%; object-fit: cover; }

.btn-primary {
  padding: 14px;
  background: linear-gradient(135deg, #FF3B30 0%, #D8412F 100%);
  color: #fff; font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1rem;
  border: none; border-radius: 12px; cursor: pointer; transition: transform 0.2s;
  flex: 1;
}
.btn-primary:active { transform: scale(0.96); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

/* Edit-mode visual cue: blue accent on the left panel */
.panel.is-editing {
  border: 1px solid rgba(96, 165, 250, 0.4);
  box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.08), var(--clay-shadow-md);
  transition: all 0.3s;
}
.panel.is-editing h3 { color: #93c5fd; }

/* Form actions row: primary + secondary Cancel */
.form-actions { display: flex; gap: 12px; }

.btn-cancel {
  padding: 14px 18px;
  background: transparent;
  border: 1px solid rgba(128, 128, 128, 0.2);
  color: inherit; font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 0.95rem;
  border-radius: 12px; cursor: pointer; transition: all 0.2s;
  min-width: 100px;
}
.btn-cancel:hover:not(:disabled) {
  background: rgba(128, 128, 128, 0.1);
  border-color: rgba(128, 128, 128, 0.4);
}
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

/* "Editing" badge next to category name in list */
.edit-badge {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
  background: rgba(96, 165, 250, 0.18); color: #93c5fd;
  border: 1px solid rgba(96, 165, 250, 0.35);
  padding: 2px 8px; border-radius: 6px; flex-shrink: 0;
}

/* Active edit row in list — subtle highlight */
.cat-item.is-current-edit {
  border: 1px solid rgba(96, 165, 250, 0.5) !important;
  background: rgba(96, 165, 250, 0.06) !important;
}

/* ═══ TIGHT FLEXBOX UPLOAD (Yükle + K. Seç) ═══ */
.upload-wrapper { display: flex; gap: 0.5rem; align-items: stretch; }
.upload-wrapper input { flex: 1; min-width: 0; }

.upload-btn {
  padding: 0 14px; background: rgba(128,128,128,0.1);
  border: 1px solid rgba(128,128,128,0.2); border-radius: 12px; cursor: pointer;
  font-size: 12px; font-weight: 700; color: inherit;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; margin: 0; flex-shrink: 0; white-space: nowrap;
}
.upload-btn:hover:not(:disabled) {
  background: rgba(128,128,128,0.2);
  transform: translateY(-1px);
}
.upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.library-btn {
  padding: 0 10px; background: rgba(56, 89, 138, 0.12);
  border: 1px solid rgba(96, 165, 250, 0.25); border-radius: 12px;
  color: #93c5fd; font-size: 11px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 4px;
  transition: all 0.2s; margin: 0; flex-shrink: 0; white-space: nowrap;
  font-family: 'Outfit', sans-serif; letter-spacing: 0.2px;
  min-height: 46px;
  box-shadow: inset 1px 1px 2px rgba(96, 165, 250, 0.15), inset -1px -1px 2px rgba(0,0,0,0.3);
}
.library-btn:hover:not(:disabled) {
  background: rgba(56, 89, 138, 0.22);
  border-color: rgba(96, 165, 250, 0.5);
  color: #bfdbfe;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(56, 89, 138, 0.3), inset 1px 1px 2px rgba(96, 165, 250, 0.2);
}
.library-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* List */
.cat-list { display: flex; flex-direction: column; gap: 12px; }
.cat-item {
  display: flex; justify-content: space-between; align-items: center; padding: 16px 20px;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.cat-item.is-hidden { opacity: 0.5; filter: grayscale(1); }

.cat-left { display: flex; align-items: center; gap: 16px; }
.cat-icon { font-size: 1.5rem; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; }
.icon-img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 4px; }
.cat-title { font-family: 'Outfit', sans-serif; font-size: 1.1rem; font-weight: 700; }

.cat-actions { display: flex; gap: 8px; }
.action-btn { width: 36px; height: 36px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1rem; transition: background 0.2s; color: inherit; }
.action-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.toggle-btn { background: rgba(128, 128, 128, 0.1); }
.toggle-btn:hover { background: rgba(128, 128, 128, 0.2); }
.move-btn { background: rgba(128, 128, 128, 0.05); }
.move-btn:hover:not(:disabled) { background: rgba(128, 128, 128, 0.15); }
.edit-btn { background: rgba(96, 165, 250, 0.12); color: #93c5fd; }
.edit-btn:hover { background: rgba(96, 165, 250, 0.22); }
.delete-btn { background: rgba(245, 54, 92, 0.1); color: #f5365c; }
.delete-btn:hover { background: rgba(245, 54, 92, 0.2); }

.list-move,
.list-enter-active,
.list-leave-active { transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.list-enter-from,
.list-leave-to { opacity: 0; transform: translateY(30px) scale(0.95); }
.list-leave-active { position: absolute; }
</style>
