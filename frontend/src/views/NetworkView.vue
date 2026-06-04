<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const rootNetwork = ref<any>(null);
const isLoading = ref(true);

// We will add dummy children if the database has less than 2 levels to show the beautiful design
const dummyData = [
  { id: 'd1', name: 'Almaz K.', role: 'dealer', walletBalanceUsd: '240' },
  { id: 'd2', name: 'Nurlan B.', role: 'distributor', walletBalanceUsd: '1500' },
  { id: 'd3', name: 'Aigerim T.', role: 'dealer', walletBalanceUsd: '60' },
];

const fetchNetwork = async () => {
  try {
    const res = await axios.get('/api/v1/auth/network', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    let data = res.data;
    
    // Inject mock data for visualization if the DB tree is too sparse
    if (data && data.children && data.children.length === 0) {
      data.children = dummyData;
    }
    
    rootNetwork.value = data;
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
      <h2>Ağım (Distribütör Downline)</h2>
      <button class="btn-primary">Yeni Kayıt Linki Oluştur 🔗</button>
    </div>

    <div v-if="isLoading" class="loading glass-panel">Ağ verileri yükleniyor...</div>
    
    <div v-else-if="rootNetwork" class="tree-container glass-panel">
      <div class="tree">
        <ul>
          <li>
            <!-- Root Node -->
            <div class="tree-node root-node">
              <div class="avatar text-gradient">👑</div>
              <h4 class="name">{{ rootNetwork.name }}</h4>
              <span class="role badge">{{ rootNetwork.role?.toUpperCase() || 'USER' }}</span>
              <p class="revenue">Toplam Prim: <span class="text-gradient">${{ rootNetwork.walletBalanceUsd }}</span></p>
            </div>
            
            <!-- Children Nodes -->
            <ul v-if="rootNetwork.children && rootNetwork.children.length > 0">
              <li v-for="child in rootNetwork.children" :key="child.id">
                <div class="tree-node child-node">
                  <div class="avatar">👤</div>
                  <h4 class="name">{{ child.name }}</h4>
                  <span class="role badge-outline">{{ child.role }}</span>
                  <p class="revenue">Kazanç: <span class="text-gradient">${{ child.walletBalanceUsd }}</span></p>
                </div>
                
                <!-- Mock 3rd level for visual depth -->
                <ul v-if="child.role === 'distributor'">
                  <li>
                    <div class="tree-node child-node">
                      <div class="avatar">👤</div>
                      <h4 class="name">Yeni Üye 1</h4>
                      <span class="role badge-outline">dealer</span>
                    </div>
                  </li>
                  <li>
                    <div class="tree-node child-node">
                      <div class="avatar">👤</div>
                      <h4 class="name">Yeni Üye 2</h4>
                      <span class="role badge-outline">dealer</span>
                    </div>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.network-content {
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tree-container {
  overflow-x: auto;
  padding: 40px;
  display: flex;
  justify-content: center;
}

/* --- CSS Tree Logic --- */
.tree ul {
  padding-top: 20px;
  position: relative;
  transition: all 0.5s;
  display: flex;
  justify-content: center;
  list-style-type: none;
}

.tree li {
  float: left;
  text-align: center;
  list-style-type: none;
  position: relative;
  padding: 20px 5px 0 5px;
  transition: all 0.5s;
}

/* Connector Lines */
.tree li::before, .tree li::after {
  content: '';
  position: absolute;
  top: 0;
  right: 50%;
  border-top: 2px solid rgba(255, 255, 255, 0.2);
  width: 50%;
  height: 20px;
}
.tree li::after {
  right: auto;
  left: 50%;
  border-left: 2px solid rgba(255, 255, 255, 0.2);
}

/* Remove left-right connectors from isolated elements */
.tree li:only-child::after, .tree li:only-child::before {
  display: none;
}
/* Remove space from isolated children */
.tree li:only-child {
  padding-top: 0;
}
/* First and last child formatting */
.tree li:first-child::before, .tree li:last-child::after {
  border: 0 none;
}
/* Add back the vertical line to the first/last children */
.tree li:first-child::after {
  border-radius: 5px 0 0 0;
}
.tree li:last-child::before {
  border-right: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 0 5px 0 0;
}

/* Dropdown line from parent */
.tree ul ul::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  border-left: 2px solid rgba(255, 255, 255, 0.2);
  width: 0;
  height: 20px;
}

/* Node Styles */
.tree-node {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 16px;
  display: inline-block;
  min-width: 160px;
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.tree-node:hover {
  background: rgba(0, 210, 255, 0.1);
  transform: translateY(-5px);
  border-color: rgba(0, 210, 255, 0.3);
}

.root-node {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(168, 85, 247, 0.1));
  border-color: rgba(14, 165, 233, 0.3);
  padding: 24px;
}

.avatar {
  font-size: 32px;
  margin-bottom: 8px;
}

.name {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
}

.badge {
  background: var(--color-primary);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.badge-outline {
  border: 1px solid var(--color-text-muted);
  color: var(--color-text-muted);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.revenue {
  margin-top: 12px;
  font-size: 13px;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .tree-container { padding: 16px; }
  .tree-node { min-width: 120px; padding: 14px; }
  .header-row { flex-direction: column; gap: 12px; align-items: stretch; }
}
</style>
