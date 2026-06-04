<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const isLoading = ref(true);
const error = ref('');
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// ═══ LIVE STATS ═══
const stats = ref({
  totalRevenue: 0, completedRevenue: 0, todayRevenue: 0,
  totalOrders: 0, pendingOrders: 0, completedOrders: 0, paidOrders: 0, cancelledOrders: 0, todayOrderCount: 0,
  totalProducts: 0, totalUsers: 0, distributors: 0, customers: 0, newUsersThisWeek: 0, lowStockCount: 0
});
const recentOrders = ref<any[]>([]);
const lowStockAlerts = ref<any[]>([]);

const fmtKgs = (n: number) => Math.round(n).toLocaleString('ru-RU');

const getStatusBadge = (status: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    pending:   { label: 'Ожидание 🕒', cls: 'st-pending' },
    paid:      { label: 'Оплачен 💳', cls: 'st-paid' },
    shipped:   { label: 'Отправлен 🚚', cls: 'st-shipped' },
    completed: { label: 'Выполнен ✅', cls: 'st-completed' },
    cancelled: { label: 'Отменён ❌', cls: 'st-cancelled' },
    refunded:  { label: 'Возврат 🔄', cls: 'st-refunded' },
  };
  return map[status] || { label: status, cls: 'st-default' };
};

const fetchDashboard = async () => {
  try {
    const res = await axios.get('/api/v1/admin/dashboard');
    const d = res.data;
    stats.value = d.stats;
    recentOrders.value = d.recentOrders || [];
    lowStockAlerts.value = d.lowStockAlerts || [];
    error.value = '';
  } catch (e: any) {
    error.value = e.response?.data?.error || 'Dashboard verisi yüklenemedi';
    console.error('Dashboard fetch:', e);
  } finally {
    isLoading.value = false;
  }
};

const goTo = (path: string) => router.push(path);
const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Сейчас';
  if (mins < 60) return `${mins} мин.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч.`;
  return `${Math.floor(hrs / 24)} дн.`;
};

onMounted(() => {
  fetchDashboard();
  // Auto refresh every 30 seconds
  refreshTimer = setInterval(fetchDashboard, 30000);
});
onUnmounted(() => { if (refreshTimer) clearInterval(refreshTimer); });
</script>

<template>
  <div class="dashboard-content animate-fade-in">
    <!-- Header -->
    <header class="topbar">
      <div class="topbar-left">
        <h2>📊 Панель Управления</h2>
        <span class="live-dot" title="Обновляется каждые 30 сек">● LIVE</span>
      </div>
      <div class="actions">
        <button class="nb nb-outline nb-sm" @click="fetchDashboard" :disabled="isLoading">🔄 Обновить</button>
        <button class="nb nb-fill nb-sm" @click="goTo('/pos')">🛒 POS</button>
      </div>
    </header>

    <!-- Loading / Error -->
    <div v-if="isLoading && !stats.totalOrders" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка панели…</p>
    </div>
    <div v-if="error" class="error-banner">⚠️ {{ error }}</div>

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card kpi-revenue">
        <div class="kpi-icon">💰</div>
        <div class="kpi-data">
          <span class="kpi-label">Общая выручка</span>
          <span class="kpi-value">{{ fmtKgs(stats.totalRevenue) }} сом</span>
          <span class="kpi-sub">Подтв: {{ fmtKgs(stats.completedRevenue) }} сом</span>
        </div>
      </div>
      <div class="kpi-card kpi-today">
        <div class="kpi-icon">📅</div>
        <div class="kpi-data">
          <span class="kpi-label">Сегодня</span>
          <span class="kpi-value">{{ fmtKgs(stats.todayRevenue) }} сом</span>
          <span class="kpi-sub">{{ stats.todayOrderCount }} заказ(ов)</span>
        </div>
      </div>
      <div class="kpi-card kpi-orders">
        <div class="kpi-icon">📦</div>
        <div class="kpi-data">
          <span class="kpi-label">Заказы</span>
          <span class="kpi-value">{{ stats.totalOrders }}</span>
          <span class="kpi-sub">⏳ {{ stats.pendingOrders }} ожид. · ✅ {{ stats.completedOrders }} выполн.</span>
        </div>
      </div>
      <div class="kpi-card kpi-users">
        <div class="kpi-icon">👥</div>
        <div class="kpi-data">
          <span class="kpi-label">Пользователи</span>
          <span class="kpi-value">{{ stats.totalUsers }}</span>
          <span class="kpi-sub">🆕 +{{ stats.newUsersThisWeek }} за неделю</span>
        </div>
      </div>
      <div class="kpi-card kpi-products">
        <div class="kpi-icon">💊</div>
        <div class="kpi-data">
          <span class="kpi-label">Продукты</span>
          <span class="kpi-value">{{ stats.totalProducts }}</span>
          <span class="kpi-sub" :class="{ 'text-warn': stats.lowStockCount > 0 }">
            {{ stats.lowStockCount > 0 ? '⚠️ ' + stats.lowStockCount + ' мало' : '✅ Склад ОК' }}
          </span>
        </div>
      </div>
      <div class="kpi-card kpi-dist">
        <div class="kpi-icon">🤝</div>
        <div class="kpi-data">
          <span class="kpi-label">Дистрибьюторы</span>
          <span class="kpi-value">{{ stats.distributors }}</span>
          <span class="kpi-sub">{{ stats.customers }} клиент(ов)</span>
        </div>
      </div>
    </div>

    <!-- Main Grid: Recent Orders + Quick Actions -->
    <div class="main-grid">
      <!-- Recent Orders Table -->
      <div class="panel orders-panel">
        <div class="panel-header">
          <h3>🕐 Последние заказы</h3>
          <button class="link-btn" @click="goTo('/orders')">Все заказы →</button>
        </div>
        <div class="table-wrap">
          <table class="dtable">
            <thead>
              <tr><th>№</th><th>Клиент</th><th>Сумма</th><th>Статус</th><th>Время</th></tr>
            </thead>
            <tbody>
              <tr v-for="o in recentOrders" :key="o.id">
                <td class="mono">#{{ o.id.slice(0, 8) }}</td>
                <td>{{ o.customerName }}</td>
                <td><strong>{{ fmtKgs(o.totalKgs) }} сом</strong></td>
                <td><span class="badge" :class="getStatusBadge(o.status).cls">{{ getStatusBadge(o.status).label }}</span></td>
                <td class="time-cell">{{ timeAgo(o.createdAt) }}</td>
              </tr>
              <tr v-if="recentOrders.length === 0">
                <td colspan="5" class="empty-row">Заказов пока нет</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="sidebar-panels">
        <!-- Quick Actions -->
        <div class="panel">
          <h3>⚡ Быстрые действия</h3>
          <div class="quick-grid">
            <button class="quick-btn" @click="goTo('/products')">💊 Продукты</button>
            <button class="quick-btn" @click="goTo('/orders')">📦 Заказы</button>
            <button class="quick-btn" @click="goTo('/slider-manage')">🖼️ Слайдер</button>
            <button class="quick-btn" @click="goTo('/site-settings')">🏢 Настройки</button>
            <button class="quick-btn" @click="goTo('/bonus-control')">⚙️ Система</button>
            <button class="quick-btn" @click="goTo('/pos')">🛒 POS</button>
          </div>
        </div>

        <!-- Low Stock Alerts -->
        <div class="panel" v-if="lowStockAlerts.length > 0">
          <h3>⚠️ Мало на складе</h3>
          <div v-for="p in lowStockAlerts" :key="p.id" class="stock-alert">
            <span class="stock-name">{{ p.name }}</span>
            <span class="stock-qty" :class="{ critical: p.stock <= 5 }">{{ p.stock }} шт.</span>
          </div>
        </div>

        <!-- Order Status Breakdown -->
        <div class="panel">
          <h3>📊 Статус заказов</h3>
          <div class="status-bars">
            <div class="sbar" v-if="stats.totalOrders > 0">
              <div class="sbar-row">
                <span>⏳ Ожидание</span><span>{{ stats.pendingOrders }}</span>
              </div>
              <div class="sbar-fill" :style="{ width: (stats.pendingOrders / stats.totalOrders * 100) + '%' }" style="background:#fbbf24"></div>
            </div>
            <div class="sbar" v-if="stats.totalOrders > 0">
              <div class="sbar-row">
                <span>💳 Оплачен</span><span>{{ stats.paidOrders }}</span>
              </div>
              <div class="sbar-fill" :style="{ width: (stats.paidOrders / stats.totalOrders * 100) + '%' }" style="background:#34d399"></div>
            </div>
            <div class="sbar" v-if="stats.totalOrders > 0">
              <div class="sbar-row">
                <span>✅ Выполнен</span><span>{{ stats.completedOrders }}</span>
              </div>
              <div class="sbar-fill" :style="{ width: (stats.completedOrders / stats.totalOrders * 100) + '%' }" style="background:#16a34a"></div>
            </div>
            <div class="sbar" v-if="stats.totalOrders > 0">
              <div class="sbar-row">
                <span>❌ Отменён</span><span>{{ stats.cancelledOrders }}</span>
              </div>
              <div class="sbar-fill" :style="{ width: (stats.cancelledOrders / stats.totalOrders * 100) + '%' }" style="background:#ef4444"></div>
            </div>
            <p v-if="stats.totalOrders === 0" class="muted-text">Нет данных для отображения</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-content { flex: 1; padding: 28px; overflow-y: auto; }

/* Header */
.topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.topbar-left { display: flex; align-items: center; gap: 12px; }
.topbar-left h2 { font-size: 20px; font-weight: 700; }
.live-dot { font-size: 11px; color: #22c55e; animation: pulse 2s infinite; font-weight: 700; }
@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }
.actions { display: flex; gap: 10px; }

/* Loading */
.loading-state { text-align: center; padding: 60px 0; }
.spinner { width: 32px; height: 32px; border: 3px solid rgba(255,255,255,.1); border-top-color: var(--color-primary); border-radius: 50%; animation: spin .7s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg) } }
.error-banner { background: rgba(239,68,68,.12); color: #f87171; padding: 10px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; }

/* KPI Grid */
.kpi-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; margin-bottom: 24px; }
.kpi-card { padding: 18px; border-radius: 12px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06); display: flex; gap: 12px; align-items: flex-start; transition: all .2s; }
.kpi-card:hover { background: rgba(255,255,255,.06); transform: translateY(-2px); }
.kpi-icon { font-size: 28px; line-height: 1; }
.kpi-data { display: flex; flex-direction: column; gap: 3px; }
.kpi-label { font-size: 11px; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
.kpi-value { font-size: 20px; font-weight: 800; color: var(--color-text-main); }
.kpi-sub { font-size: 11px; color: var(--color-text-muted); }
.text-warn { color: #fbbf24 !important; }

/* Main Grid */
.main-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 18px; }

/* Panel */
.panel { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06); border-radius: 12px; padding: 20px; }
.panel h3 { font-size: 14px; font-weight: 700; margin-bottom: 14px; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.panel-header h3 { margin-bottom: 0; }
.link-btn { background: none; border: none; color: var(--color-primary); font-size: 12px; font-weight: 600; cursor: pointer; }
.link-btn:hover { text-decoration: underline; }

/* Table */
.table-wrap { overflow-x: auto; }
.dtable { width: 100%; border-collapse: collapse; }
.dtable th { text-align: left; padding: 8px 12px; font-size: 11px; color: var(--color-text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid rgba(255,255,255,.06); }
.dtable td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,.03); }
.mono { font-family: 'SF Mono', monospace; font-size: 11px; color: var(--color-text-muted); }
.time-cell { font-size: 11px; color: var(--color-text-muted); white-space: nowrap; }
.empty-row { text-align: center; padding: 24px !important; color: var(--color-text-muted); }

.badge { padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.st-pending { background: rgba(251,191,36,.12); color: #fbbf24; }
.st-paid { background: rgba(52,211,153,.12); color: #34d399; }
.st-shipped { background: rgba(0,210,255,.12); color: #00d2ff; }
.st-completed { background: rgba(22,163,74,.12); color: #22c55e; }
.st-cancelled { background: rgba(239,68,68,.12); color: #f87171; }
.st-refunded { background: rgba(168,85,247,.12); color: #c084fc; }
.st-default { background: rgba(156,163,175,.12); color: #9ca3af; }

/* Quick Actions */
.quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.quick-btn { padding: 12px 8px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06); border-radius: 8px; color: var(--color-text-main); font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; text-align: center; }
.quick-btn:hover { background: rgba(0,210,255,.08); border-color: rgba(0,210,255,.2); transform: translateY(-1px); }

/* Low Stock */
.stock-alert { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,.04); font-size: 12px; }
.stock-name { font-weight: 600; }
.stock-qty { font-weight: 700; color: #fbbf24; }
.stock-qty.critical { color: #ef4444; }

/* Status Bars */
.status-bars { display: flex; flex-direction: column; gap: 10px; }
.sbar-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
.sbar-fill { height: 6px; border-radius: 3px; transition: width .5s ease; min-width: 2px; }
.muted-text { font-size: 12px; color: var(--color-text-muted); text-align: center; }

.sidebar-panels { display: flex; flex-direction: column; gap: 14px; }

/* Responsive */
@media (max-width: 1200px) {
  .kpi-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 1024px) {
  .main-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .topbar { flex-direction: column; align-items: stretch; }
  .dashboard-content { padding: 16px; }
}
@media (max-width: 480px) {
  .kpi-grid { grid-template-columns: 1fr; }
}
</style>
