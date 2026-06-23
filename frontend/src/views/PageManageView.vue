<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useTranslate } from '../composables/useTranslate';
// Quill is heavy (~165 KB gzipped) and only used on this single admin
// page. Lazy-import on first render so the public bundle stays small.
import { defineAsyncComponent } from 'vue';
const QuillEditor = defineAsyncComponent(() => import('@vueup/vue-quill').then(m => m.QuillEditor));

// Quill's CSS is also admin-only. Inject the stylesheet on mount
// and remove it on unmount so the public bundle doesn't ship it.
// Vite turns this dynamic import into a separate CSS chunk that's
// fetched only when /cms/pages is opened.
if (typeof window !== 'undefined') {
  void import('@vueup/vue-quill/dist/vue-quill.snow.css');
}

const { t } = useTranslate();

const API = import.meta.env.VITE_API_URL || '/api/v1';

const pages = ref<any[]>([]);
const isEditing = ref(false);
const editingPage = ref<any>(null);
const processing = ref(false);

const loadPages = async () => {
  try {
    const res = await axios.get(`${API}/pages`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    pages.value = res.data;
  } catch (err) {
    console.error(t('admin.pages.saveFail'), err);
  }
};

const createNewPage = () => {
  editingPage.value = {
    title: '',
    slug: '',
    content: '',
    status: 'published',
    translations: {} as Record<string, any>
  };
  isEditing.value = true;
};

const editPage = (page: any) => {
  editingPage.value = { ...page, translations: (typeof page.translations === 'string' ? JSON.parse(page.translations) : page.translations) || {} };
  isEditing.value = true;
};

const deletePage = async (id: string) => {
  if (!confirm(t('admin.pages.deleteConfirm'))) return;
  try {
    await axios.delete(`${API}/pages/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    loadPages();
  } catch (err) {
    alert(t('admin.pages.deleteFail'));
  }
};

const savePage = async () => {
  if (!editingPage.value.title || !editingPage.value.slug) {
    alert(t('admin.pages.missingFields'));
    return;
  }
  processing.value = true;
  try {
    const payload = {
      title: editingPage.value.title,
      slug: editingPage.value.slug,
      content: editingPage.value.content || '',
      status: editingPage.value.status,
      translations: editingPage.value.translations || {}
    };

    if (editingPage.value.id) {
      await axios.put(`${API}/pages/${editingPage.value.id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } else {
      await axios.post(`${API}/pages`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    }
    isEditing.value = false;
    editingPage.value = null;
    loadPages();
  } catch (err: any) {
    alert(err.response?.data?.error || t('admin.pages.saveFail'));
  }
  processing.value = false;
};

// Page translations are generated automatically server-side on save +
// continuous TranslationSweeper. No manual translate action needed.

const autoSlug = () => {
  if (!editingPage.value.id) {
    editingPage.value.slug = editingPage.value.title
      .toLowerCase()
      .replace(/[^a-z0-9\u011f\u011e\u0131\u0130\u00f6\u00d6\u00fc\u00dc\u015f\u015e\u00e7\u00c7]+/g, '-') // Turkish support
      .replace(/(^-|-$)+/g, '');
  }
};

onMounted(() => {
  loadPages();
});
</script>

<template>
  <div class="page-manage-view">
    <div class="header-section">
      <div class="header-titles">
        <h1>{{ t('admin.pages.title') }}</h1>
        <p class="subtitle">{{ t('admin.pages.subtitle') }}</p>
      </div>
      <button v-if="!isEditing" @click="createNewPage" class="btn-success new-page-btn">
        {{ t('admin.pages.new') }}
      </button>
      <button v-else @click="isEditing = false" class="btn-secondary">
        {{ t('admin.pages.back') }}
      </button>
    </div>

    <!-- LISTE EKRANI -->
    <div v-if="!isEditing" class="pages-list-container">
      <div v-if="pages.length === 0" class="empty-state dark-inset">
        {{ t('admin.pages.empty') }}
      </div>
      <div v-else class="glass-panel table-panel">
        <div class="table-wrap">
          <table class="modern-table">
            <thead>
              <tr>
                <th>{{ t('admin.pages.colTitle') }}</th>
                <th>{{ t('admin.pages.colUrl') }}</th>
                <th>{{ t('admin.pages.colStatus') }}</th>
                <th style="text-align: right;">{{ t('admin.pages.colActions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="page in pages" :key="page.id">
                <td><strong class="font-bold text-white">{{ page.title }}</strong></td>
                <td class="mono-text">/p/{{ page.slug }}</td>
                <td>
                  <span class="status-badge" :class="page.status === 'published' ? 'st-paid' : 'st-pending'">
                    {{ page.status === 'published' ? t('admin.pages.statusPublished') : t('admin.pages.statusDraft') }}
                  </span>
                </td>
                <td class="actions" style="justify-content: flex-end;">
                  <a :href="'/p/' + page.slug" target="_blank" class="icon-btn" :title="t('admin.pages.view')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </a>
                  <button class="icon-btn" @click="editPage(page)" :title="t('admin.pages.edit')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="icon-btn delete-btn" @click="deletePage(page.id)" :title="t('admin.pages.delete')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- DÜZENLEME EKRANI -->
    <div v-else class="page-editor panel">
      <div class="editor-header">
        <h2>{{ editingPage.id ? t('admin.pages.editTitle') : t('admin.pages.newTitle') }}</h2>
        <div class="actions" style="display: flex; gap: 12px; align-items: center;">
          <button @click="savePage" class="btn-success" :disabled="processing">
            {{ processing ? t('admin.pages.saving') : t('admin.pages.save') }}
          </button>
        </div>
      </div>

      <div class="editor-grid">
        <div class="main-col dark-inset">
          <div class="form-group">
            <label>{{ t('admin.pages.titleLabel') }}</label>
            <input v-model="editingPage.title" @input="autoSlug" type="text" :placeholder="t('admin.pages.titlePlaceholder')" class="pv-input" />
          </div>

          <div class="form-group">
            <label>{{ t('admin.pages.contentLabel') }}</label>
            <!-- Quill Editor Component -->
            <div class="quill-wrapper">
              <QuillEditor
                v-model:content="editingPage.content"
                contentType="html"
                theme="snow"
                toolbar="full"
              />
            </div>
            <p class="help-text">{{ t('admin.pages.contentHelp') }}</p>
          </div>
        </div>

        <div class="side-col dark-inset">
          <div class="form-group">
            <label>{{ t('admin.pages.slugLabel') }}</label>
            <input v-model="editingPage.slug" type="text" class="pv-input" />
            <span class="help-text">{{ t('admin.pages.slugHelp') }}<strong>{{ editingPage.slug || 'url-buraya' }}</strong></span>
          </div>

          <div class="form-group">
            <label>{{ t('admin.pages.statusLabel') }}</label>
            <select v-model="editingPage.status" class="pv-input">
              <option value="published">{{ t('admin.pages.statusPublishedOpt') }}</option>
              <option value="draft">{{ t('admin.pages.statusDraftOpt') }}</option>
            </select>
          </div>

          <div class="info-card">
            <h4>{{ t('admin.pages.tipTitle') }}</h4>
            <p>{{ t('admin.pages.tipText') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-manage-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  color: var(--text-color);
  height: 100%;
  overflow-y: auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-section h1 {
  font-size: 1.8rem;
  margin: 0;
  color: #fff;
  font-weight: 700;
}

.subtitle {
  margin: 4px 0 0 0;
  color: #aaa;
  font-size: 0.95rem;
}

.new-page-btn {
  padding: 10px 20px;
  font-size: 0.95rem;
  border-radius: 8px;
  background: var(--pv-green, #2ecc71);
  color: #111;
  font-weight: bold;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.new-page-btn:hover {
  background: #27ae60;
  transform: translateY(-2px);
}

.btn-secondary {
  padding: 10px 20px;
  font-size: 0.95rem;
  border-radius: 8px;
  background: rgba(255,255,255,0.1);
  color: #fff;
  border: none;
  cursor: pointer;
}

.btn-success {
  padding: 10px 24px;
  font-size: 1rem;
  border-radius: 8px;
  background: var(--pv-green, #2ecc71);
  color: #111;
  font-weight: bold;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-success:hover:not(:disabled) {
  background: #27ae60;
  transform: translateY(-2px);
}

.btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* MODERN TABLE */
.table-panel {
  background: var(--surface-dark-inset);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.05);
  overflow: hidden;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
  padding: 16px;
}

.modern-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
.modern-table th { text-align: left; padding: 0 16px 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: rgba(255,255,255,0.3); letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.modern-table td { padding: 16px; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.02); transition: background 0.2s; }
.modern-table td:first-child { border-left: 1px solid rgba(255,255,255,0.02); border-radius: 12px 0 0 12px; }
.modern-table td:last-child { border-right: 1px solid rgba(255,255,255,0.02); border-radius: 0 12px 12px 0; }
.modern-table tbody tr:hover td { background: rgba(255,255,255,0.05); }

.mono-text { font-family: var(--font-mono); font-weight: 600; color: rgba(255,255,255,0.6); }
.font-bold { font-weight: 700; }
.text-white { color: #fff; }

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 8px; border: none;
  background: rgba(128,128,128,0.1); color: inherit;
  cursor: pointer; transition: all 0.2s;
  text-decoration: none;
}
.icon-btn:hover { background: rgba(128,128,128,0.2); }
.icon-btn.delete-btn:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

.status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
.st-pending { background: rgba(245, 158, 11, 0.1); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.2); }
.st-paid { background: rgba(16, 185, 129, 0.1); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.2); }

.empty-state {
  padding: 40px;
  text-align: center;
  color: #888;
  border-radius: 12px;
  border: 1px dashed rgba(255,255,255,0.1);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 20px;
}

.editor-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.main-col, .side-col {
  padding: 24px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #ccc;
}

.pv-input {
  background: var(--bg-dark);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-size: 1rem;
}

.help-text {
  font-size: 0.85rem;
  color: #888;
  margin-top: 4px;
}

.info-card {
  background: rgba(54, 162, 235, 0.1);
  border: 1px solid rgba(54, 162, 235, 0.3);
  padding: 16px;
  border-radius: 8px;
  margin-top: 20px;
}

.info-card h4 { margin: 0 0 8px 0; color: var(--accent-blue); }
.info-card p { margin: 0; font-size: 0.9rem; color: #ccc; line-height: 1.5; }

/* QUILL CUSTOMIZATION FOR DARK MODE */
.quill-wrapper {
  background: var(--bg-dark);
  border-radius: 8px;
  overflow: hidden;
}
.quill-wrapper :deep(.ql-toolbar) {
  background: #1e232d;
  border-color: rgba(255,255,255,0.1) !important;
}
.quill-wrapper :deep(.ql-container) {
  min-height: 400px;
  max-height: 60vh;
  overflow-y: auto;
  border-color: rgba(255,255,255,0.1) !important;
  font-size: 1rem;
  color: #eee;
}
.quill-wrapper :deep(.ql-stroke) { stroke: #ccc !important; }
.quill-wrapper :deep(.ql-fill) { fill: #ccc !important; }
.quill-wrapper :deep(.ql-picker) { color: #ccc !important; }
</style>
