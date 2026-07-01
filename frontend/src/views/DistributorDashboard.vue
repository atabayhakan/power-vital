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
    // /orders now returns a paginated envelope { items, total, ... }; the old
    // `data.length` read undefined → count always rendered 0. Use the
    // envelope total, falling back to a bare-array length for legacy shapes.
    const od: any = ordersRes.data;
    const myOrders = Array.isArray(od) ? od.length : (od?.total ?? od?.items?.length ?? 0);

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

const recentOrders = ref([
  { id: 'ORD-9821', date: '05 Haz 2026', total: '2,300 KGS', status: 'Kargoya Verildi', statusColor: '#10b981' },
  { id: 'ORD-9754', date: '01 Haz 2026', total: '4,600 KGS', status: 'Teslim Edildi', statusColor: '#3b82f6' },
  { id: 'ORD-9610', date: '28 May 2026', total: '1,500 KGS', status: 'Beklemede', statusColor: '#f59e0b' }
]);

// Notifications State
const showNotifications = ref(false);
const notifications = ref([
  { id: 1, title: 'Yeni Seviye!', message: 'Tebrikler, VIP Seviye 2 oldunuz. İndirimleriniz güncellendi.', time: '5 dk önce', isUnread: true, icon: '🌟' },
  { id: 2, title: 'Sipariş Kargoda', message: '#ORD-9821 numaralı siparişiniz kargoya verildi.', time: '2 saat önce', isUnread: true, icon: '📦' },
  { id: 3, title: 'Ağınıza Yeni Katılım', message: 'Sol kolunuza yeni bir distribütör eklendi.', time: '1 gün önce', isUnread: false, icon: '👥' },
  { id: 4, title: 'Sistem Duyurusu', message: 'Hafta sonu bakımı başarıyla tamamlandı.', time: '2 gün önce', isUnread: false, icon: '🛠️' }
]);

import { computed } from 'vue';
const unreadCount = computed(() => notifications.value.filter(n => n.isUnread).length);

const markAllAsRead = () => {
  notifications.value.forEach(n => n.isUnread = false);
};
</script>

<template>
  <div class="dashboard-content animate-fade-in">
    <header class="topbar">
      <h2>Hoş Geldiniz, <span class="text-gradient">{{ userName }}</span></h2>
      <div class="actions relative">
        <div v-if="showNotifications" class="dropdown-overlay" @click="showNotifications = false"/>
        <button class="icon-btn glass-panel notification-btn" @click="showNotifications = !showNotifications">
          🔔
          <span v-if="unreadCount > 0" class="badge glow-badge">{{ unreadCount }}</span>
        </button>

        <!-- Notifications Dropdown -->
        <transition name="dropdown">
          <div v-if="showNotifications" class="notifications-dropdown glass-panel">
            <div class="dropdown-header">
              <h3>Bildirimler</h3>
              <button class="btn-text" @click="markAllAsRead" v-if="unreadCount > 0">Tümünü Okundu İşaretle</button>
            </div>
            <div class="notifications-list">
              <div v-if="notifications.length === 0" class="empty-notif">Bildiriminiz yok.</div>
              <div v-for="notif in notifications" :key="notif.id" class="notification-item" :class="{ 'unread': notif.isUnread }">
                <div class="notif-icon glass-icon">{{ notif.icon }}</div>
                <div class="notif-content">
                  <h4 class="notif-title">{{ notif.title }}</h4>
                  <p class="notif-msg">{{ notif.message }}</p>
                  <span class="notif-time">{{ notif.time }}</span>
                </div>
                <div v-if="notif.isUnread" class="unread-dot"/>
              </div>
            </div>
            <div class="dropdown-footer">
              <button class="btn-text full-width">Tüm Bildirimleri Gör</button>
            </div>
          </div>
        </transition>
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
          </template>
        </div>
      </div>

      <div class="widget glass-panel">
        <h3>Son Siparişlerim</h3>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Sipariş No</th>
                <th>Tarih</th>
                <th>Tutar</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in recentOrders" :key="order.id">
                <td class="mono">{{ order.id }}</td>
                <td>{{ order.date }}</td>
                <td class="bold">{{ order.total }}</td>
                <td>
                  <span class="status-badge" :style="{ backgroundColor: order.statusColor + '20', color: order.statusColor }">
                    {{ order.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
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
  background: rgba(128,128,128,0.1);
  color: inherit;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.icon-btn:hover {
  background: rgba(128, 128, 128, 0.2);
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
  color: var(--color-text-muted);
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
  color: var(--color-text-main);
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

/* Table */
.table-container { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th, .data-table td { padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.data-table th { color: var(--color-text-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
.mono { font-family: monospace; }
.bold { font-weight: 700; color: var(--color-text-main); }
.status-badge { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }

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
/* Notification Dropdown Styles */
.actions.relative {
  position: relative;
}

.notification-btn {
  position: relative;
  font-size: 1.5rem;
  padding: 10px 15px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.notification-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: var(--pv-red, #BC4A3C);
  color: white;
  font-size: 0.75rem;
  font-weight: 800;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-bg-dark);
}

.glow-badge {
  box-shadow: 0 0 10px var(--pv-red, #BC4A3C);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(188, 74, 60, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(188, 74, 60, 0); }
  100% { box-shadow: 0 0 0 0 rgba(188, 74, 60, 0); }
}

.dropdown-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 90;
}

.notifications-dropdown {
  position: absolute;
  top: 60px;
  right: 0;
  width: 380px;
  background: rgba(20, 20, 25, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  z-index: 100;
  overflow: hidden;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.dropdown-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
}

.btn-text {
  background: transparent;
  border: none;
  color: #a1a1aa;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-text:hover { color: #fff; }

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.notifications-list::-webkit-scrollbar { width: 4px; }
.notifications-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

.empty-notif {
  padding: 30px;
  text-align: center;
  color: #71717a;
  font-size: 0.9rem;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  transition: background 0.2s;
  position: relative;
  cursor: pointer;
}

.notification-item:hover { background: rgba(255, 255, 255, 0.02); }
.notification-item.unread { background: rgba(188, 74, 60, 0.05); }

.glass-icon {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 12px;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.notif-content { flex: 1; }
.notif-title { margin: 0 0 4px 0; font-size: 0.95rem; font-weight: 600; color: #fff; }
.notif-msg { margin: 0 0 8px 0; font-size: 0.85rem; color: #a1a1aa; line-height: 1.4; }
.notif-time { font-size: 0.75rem; color: #71717a; font-weight: 500; }

.unread-dot {
  width: 8px; height: 8px;
  background: var(--pv-red, #BC4A3C);
  border-radius: 50%;
  position: absolute;
  top: 22px; right: 20px;
  box-shadow: 0 0 8px var(--pv-red, #BC4A3C);
}

.dropdown-footer {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  text-align: center;
}

.dropdown-footer .btn-text.full-width {
  width: 100%; padding: 8px; color: #fff;
}

/* Transitions */
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.2s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-10px) scale(0.95); }

@media (max-width: 600px) {
  .notifications-dropdown {
    position: fixed;
    top: 70px; left: 10px; right: 10px; width: auto;
  }
}
</style>
