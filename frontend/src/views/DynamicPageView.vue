<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useTranslation } from '../composables/useTranslation';

const route = useRoute();
const router = useRouter();
const { tField } = useTranslation();
const API = import.meta.env.VITE_API_URL || '/api/v1';

const page = ref<any>(null);
const loading = ref(true);
const error = ref(false);

const loadPage = async (slug: string) => {
  loading.value = true;
  error.value = false;
  try {
    const res = await axios.get(`${API}/pages/${slug}`);
    if (res.data.status !== 'published') {
      error.value = true;
    } else {
      page.value = res.data;
      document.title = `${tField(page.value, 'title') || page.value.title} | Power Vital`;
    }
  } catch (err) {
    console.error('Sayfa bulunamadı', err);
    error.value = true;
  }
  loading.value = false;
};

onMounted(() => {
  loadPage(route.params.slug as string);
});

watch(() => route.params.slug, (newSlug) => {
  if (newSlug) loadPage(newSlug as string);
});
</script>

<template>
  <div class="dynamic-page-container">
    <div v-if="loading" class="loading-state">
      <div class="loader"/>
      <p>Yükleniyor...</p>
    </div>
    
    <div v-else-if="error" class="error-state panel">
      <h1>404</h1>
      <h2>Sayfa Bulunamadı</h2>
      <p>Aradığınız sayfa mevcut değil veya yayından kaldırılmış olabilir.</p>
      <button @click="router.push('/')" class="btn-primary">Ana Sayfaya Dön</button>
    </div>

    <div v-else class="page-content-wrapper panel dark-inset">
      <h1 class="page-title glow-text">{{ tField(page, 'title') || page.title }}</h1>
      <div class="page-body ql-editor" v-html="tField(page, 'content') || page.content"/>
    </div>
  </div>
</template>

<style scoped>
.dynamic-page-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: 60vh;
}

.loading-state, .error-state {
  text-align: center;
  padding: 60px 20px;
}

.error-state h1 {
  font-size: 5rem;
  color: var(--danger-color);
  margin-bottom: 10px;
}

.page-content-wrapper {
  padding: 40px;
  border-radius: 16px;
  background: var(--bg-dark);
}

.page-title {
  font-size: 2.5rem;
  margin-bottom: 30px;
  color: var(--accent-blue);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-bottom: 20px;
}

/* Base Quill Editor Styles for frontend viewing */
.page-body {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #ddd;
}

.page-body :deep(h1), 
.page-body :deep(h2), 
.page-body :deep(h3) {
  color: var(--text-color);
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.page-body :deep(p) {
  margin-bottom: 1em;
}

.page-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 20px 0;
}

.page-body :deep(iframe) {
  width: 100%;
  min-height: 400px;
  border-radius: 8px;
  border: none;
  margin: 20px 0;
}

.page-body :deep(blockquote) {
  border-left: 4px solid var(--accent-blue);
  padding-left: 16px;
  margin-left: 0;
  color: #aaa;
  font-style: italic;
  background: rgba(54, 162, 235, 0.05);
  padding: 16px;
  border-radius: 0 8px 8px 0;
}

.page-body :deep(a) {
  color: var(--accent-blue);
  text-decoration: underline;
}

.loader {
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid var(--accent-blue);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .page-content-wrapper {
    padding: 20px;
  }
  .page-title {
    font-size: 2rem;
  }
}
</style>
