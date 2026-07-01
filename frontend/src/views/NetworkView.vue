<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import NetworkTreeNode from '../components/mlm/NetworkTreeNode.vue';

const rootNetwork = ref<any>(null);
const isLoading = ref(true);

const fetchNetwork = async () => {
  try {
    const res = await axios.get('/api/v1/auth/network', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    rootNetwork.value = res.data;
  } catch (e) {
    console.error('Failed to fetch network:', e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchNetwork();
});
</script>

<template>
  <div class="network-content animate-fade-in">
    <div class="header-row">
      <div>
        <h2>🌲 Distribütör Ağacı</h2>
        <p class="text-muted">MLM ağ yapısı, ekip hacmi ve alt distribütörler.</p>
      </div>
      <button class="btn-primary">+ Yeni Kayıt Linki Oluştur 🔗</button>
    </div>

    <div v-if="isLoading" class="loading dark-card">Ağ verileri yükleniyor...</div>

    <div v-else-if="rootNetwork" class="tree-container dark-card">
      <div class="tree">
        <ul>
          <NetworkTreeNode :node="rootNetwork" is-root />
        </ul>
      </div>
    </div>

    <div v-else class="loading dark-card">Ağ verisi bulunamadı.</div>
  </div>
</template>

<style scoped>
.network-content {
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: var(--text-on-dark);
  /* 🛡️ Scroll fix — admin layout (App.vue) is 100vh flex with overflow:hidden
     on .main-content. Without our own scroll container the long
     distributor tree + sidebar get clipped at the bottom. */
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  box-sizing: border-box;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loading {
  padding: 40px;
  text-align: center;
  color: var(--text-on-dark-secondary);
}

.tree-container {
  overflow-x: auto;
  padding: 40px;
  display: flex;
  justify-content: center;
}

.tree ul {
  list-style-type: none;
}

@media (max-width: 768px) {
  .tree-container { padding: 16px; }
  .header-row { flex-direction: column; gap: 12px; align-items: stretch; }
}
</style>
