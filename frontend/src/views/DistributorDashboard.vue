<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useMlm } from '../composables/useMlm';

const { isMlmEnabled, fetchMlmStatus } = useMlm();
const userName = ref('');
const isLoading = ref(true);
const stats = ref([
  { title: 'Kişisel Ciro (PV)', value: '0 сом', change: 'Bu hafta' },
  { title: 'Cüzdan (KGS)', value: '0 сом', change: 'Mevcut bakiye' },
  { title: 'Siparişlerim', value: '0', change: 'Toplam' },
  { title: 'Cüzdan (USD)', value: '$0', change: 'Mevcut bakiye' }
]);

onMounted(async () => {
  fetchMlmStatus();
  try {
    const meRes = await axios.get('/api/v1/auth/me');
    const user = meRes.data;
    userName.value = user.name || 'Değerli Bayimiz';
    const walletKgs = Math.round(Number(user.walletBalanceKgs || 0));
    const walletUsd = Number(user.walletBalanceUsd || 0).toFixed(2);

    const ordersRes = await axios.get('/api/v1/orders').catch(() => ({ data: [] }));
    const myOrders = ordersRes.data?.length || 0;

    stats.value = [
      { title: 'Kişisel Ciro (PV)', value: walletKgs.toLocaleString('ru-RU') + ' сом', change: 'Bu hafta' },
      { title: 'Cüzdan (KGS)', value: walletKgs.toLocaleString('ru-RU') + ' сом', change: 'Mevcut bakiye' },
      { title: 'Siparişlerim', value: String(myOrders), change: 'Toplam' },
      { title: 'Cüzdan (USD)', value: '$' + walletUsd, change: 'Mevcut bakiye' }
    ];
  } catch (e) {
    userName.value = 'Değerli Bayimiz';
  }
  isLoading.value = false;
});
</script>

<template>
  <div class="dashboard-content animate-fade-in">
    <header class="topbar">
      <h2>Hoş Geldiniz, <span class="text-gradient">{{ userName }}</span></h2>
      <div class="actions">
        <button class="icon-btn glass-panel">🔔</button>
      </div>
    </header>

    <div class="stats-grid">
      <div v-for="(stat, index) in stats" :key="index" class="stat-card glass-panel">
        <h4 class="stat-title">{{ stat.title }}</h4>
        <div class="stat-body">
          <span class="stat-value text-gradient">{{ stat.value }}</span>
          <span class="stat-change">{{ stat.change }}</span>
        </div>
      </div>
    </div>

    <div class="main-widgets">
      <div class="widget glass-panel">
        <h3>Hızlı İşlemler</h3>
        <div class="action-grid">
          <router-link to="/pos" class="action-card">
            <span class="icon">🛒</span><span>Sipariş Gir</span>
          </router-link>
          <router-link to="/orders" class="action-card">
            <span class="icon">📦</span><span>Siparişlerim</span>
          </router-link>
          <!-- MLM-only quick actions -->
          <template v-if="isMlmEnabled">
            <router-link to="/network" class="action-card">
              <span class="icon">👥</span><span>Ağımı Gör</span>
            </router-link>
            <router-link to="/olympics" class="action-card">
              <span class="icon">🚀</span><span>Olimpiyat Koşusu</span>
            </router-link>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.topbar h2 {
  font-size: 28px;
  font-weight: 700;
}

.actions {
  display: flex;
  gap: 16px;
}

.icon-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  color: white;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  padding: 24px;
}

.stat-title {
  color: var(--color-text-muted);
  font-size: 14px;
  margin-bottom: 12px;
}

.stat-body {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
}

.stat-change {
  font-size: 12px;
  color: #888;
}

.main-widgets {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.widget {
  padding: 24px;
}

.widget h3 {
  margin-bottom: 20px;
  font-size: 18px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-decoration: none;
  color: white;
  transition: all 0.3s ease;
  cursor: pointer;
}

.action-card:hover {
  background: rgba(255,255,255,0.1);
  transform: translateY(-3px);
  border-color: var(--color-primary);
}

.action-card .icon {
  font-size: 32px;
}

.action-card span {
  font-size: 14px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.copy-link:hover {
  border-color: var(--color-accent-success);
}
</style>
