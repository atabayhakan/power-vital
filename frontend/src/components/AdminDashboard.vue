<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { apiGet } from '@/api/openapi-client';
import type { PieDatum, CategoryAnalyticsRow } from './AdminPieChart.vue';
import type { BarDatum, TopCustomerRow, TopProductRow } from './AdminBarChart.vue';
import { useAdminRealtime } from '../composables/useAdminRealtime';
import AdminMetricsWidget from './AdminMetricsWidget.vue';
import AdminChartWidget from './AdminChartWidget.vue';
import AdminPieChart from './AdminPieChart.vue';
import AdminBarChart from './AdminBarChart.vue';

const router = useRouter();
const { t } = useI18n();
const isLoading = ref(true);
const error = ref('');
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// ═══ ANALYTICS DATA (pie + bar charts) ═══
// Cached for the duration of the dashboard session — analytics don't
// change minute-to-minute so a 60s refresh window is plenty.
const categoriesBreakdown = ref<PieDatum[]>([]);
const topCustomers = ref<BarDatum[]>([]);
const topProducts = ref<BarDatum[]>([]);

type CategoriesResponse = { categories: (CategoryAnalyticsRow & { revenueKgs: number })[] };
type TopCustomersResponse = { customers: (TopCustomerRow & { totalKgs: number; role?: string })[] };
type TopProductsResponse = { products: (TopProductRow & { barcode: string; categoryName?: string })[] };

const fetchAnalytics = async () => {
  try {
    const [resCats, resCust, resProd] = await Promise.all([
      apiGet('/api/v1/admin/analytics/categories', { query: { days: 30 } }),
      apiGet('/api/v1/admin/analytics/top-customers', { query: { days: 30 } }),
      apiGet('/api/v1/admin/analytics/top-products', { query: { days: 30 } }),
    ]);
    const catList = ((resCats.data as unknown as CategoriesResponse).categories || [])
      .filter((c) => c.revenueKgs > 0);
    categoriesBreakdown.value = catList.map((c) => ({
      name: c.categoryName, value: c.revenueKgs,
    }));
    topCustomers.value = ((resCust.data as unknown as TopCustomersResponse).customers || []).map((c) => ({
      label: c.name, sublabel: c.email, value: c.totalKgs, badge: c.role,
    }));
    topProducts.value = ((resProd.data as unknown as TopProductsResponse).products || []).map((p) => {
      const cat = p.categoryName ? ' · ' + p.categoryName : '';
      return { label: p.name, sublabel: p.barcode + cat, value: p.unitsSold };
    });
  } catch (e) {
    console.warn('analytics fetch failed:', e);
  }
};

// ═══ LIVE STATS ═══
type DashboardStats = {
  totalRevenue: number; completedRevenue: number; todayRevenue: number;
  totalOrders: number; pendingOrders: number; completedOrders: number;
  paidOrders: number; cancelledOrders: number; todayOrderCount: number;
  totalProducts: number; totalUsers: number; distributors: number;
  customers: number; newUsersThisWeek: number; lowStockCount: number;
};
const stats = ref<DashboardStats>({
  totalRevenue: 0, completedRevenue: 0, todayRevenue: 0,
  totalOrders: 0, pendingOrders: 0, completedOrders: 0, paidOrders: 0, cancelledOrders: 0, todayOrderCount: 0,
  totalProducts: 0, totalUsers: 0, distributors: 0, customers: 0, newUsersThisWeek: 0, lowStockCount: 0
});
type RecentOrder = {
  id: string; customerName: string; totalKgs: number;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunded';
  createdAt: string;
};
const recentOrders = ref<RecentOrder[]>([]);
const lowStockAlerts = ref<Array<{ id: string; name: string; stock: number }>>([]);

const fmtKgs = (n: number) => Math.round(n).toLocaleString('ru-RU');

const getStatusBadge = (status: RecentOrder['status']) => {
  const map: Record<RecentOrder['status'], { label: string; cls: string }> = {
    pending:   { label: t('admin.statusPending'), cls: 'st-pending' },
    paid:      { label: t('admin.statusPaid'), cls: 'st-paid' },
    shipped:   { label: t('admin.statusShipped'), cls: 'st-shipped' },
    completed: { label: t('admin.statusCompleted'), cls: 'st-completed' },
    cancelled: { label: t('admin.statusCancelled'), cls: 'st-cancelled' },
    refunded:  { label: t('admin.statusRefunded'), cls: 'st-refunded' },
  };
  return map[status] || { label: status, cls: 'st-default' };
};

const fetchDashboard = async (showFeedback = false) => {
  isLoading.value = true;
  try {
    const { data } = await apiGet('/api/v1/admin/dashboard');
    const d = data as unknown as {
      stats: DashboardStats;
      recentOrders: RecentOrder[];
      lowStockAlerts: Array<{ id: string; name: string; stock: number }>;
    };
    stats.value = d.stats;
    recentOrders.value = d.recentOrders || [];
    lowStockAlerts.value = d.lowStockAlerts || [];
    error.value = '';
    lastRefreshed.value = new Date();
    if (showFeedback) triggerRefreshToast('Sistem Verileri Güncellendi ✓');
  } catch (e: any) {
    error.value = e.response?.data?.error || 'Veri yüklenemedi';
  } finally {
    setTimeout(() => { isLoading.value = false; }, 400);
  }
};

// ── Real-time push (SSE) ──────────────────────────────────────────────
// When the backend publishes an event (new_order, payment, OCR pending,
// withdrawal, etc.) we refresh the dashboard and surface a toast.
const realtime = useAdminRealtime();
realtime.toastOn(
  ['new_order', 'payment_received', 'ocr_pending', 'withdrawal_request', 'withdrawal_approved', 'withdrawal_rejected', 'low_stock'],
  {
    new_order: (e) => `🛒 Yeni sipariş: ${e.data.totalKgs} KGS — ${e.data.customerName}`,
    payment_received: (e) => `✅ Ödeme alındı: ${e.data.totalKgs} KGS`,
    ocr_pending: '⚠️ Manuel kontrol gerekli: dekont tutarı uyuşmuyor',
    withdrawal_request: (e) => `💰 Yeni çekim talebi: ${e.data.amount} ${e.data.currency}`,
    withdrawal_approved: '✅ Çekim onaylandı',
    withdrawal_rejected: '❌ Çekim reddedildi',
    low_stock: (e) => `📦 Düşük stok: ${e.data.name}`
  }
);
realtime.onMany(
  ['new_order', 'payment_received', 'withdrawal_request', 'withdrawal_approved', 'withdrawal_rejected', 'low_stock'],
  () => { fetchDashboard(); } // auto-refresh the dashboard
);

// Analytics: refresh debounced on new_order/payment (categories/customer
// totals will shift). debounceTimer is shared with the dashboard timer.
let analyticsTimer: any = null;
const debouncedAnalytics = () => {
  if (analyticsTimer) clearTimeout(analyticsTimer);
  analyticsTimer = setTimeout(() => fetchAnalytics(), 2000);
};
realtime.onMany(['new_order', 'payment_received'], debouncedAnalytics);
realtime.on('ocr_pending', () => { fetchDashboard(); });
realtime.on('reconnected', () => {
  fetchDashboard(); // catch up on whatever happened while disconnected
});

const lastRefreshed = ref<Date | null>(null);
const showRefreshToast = ref(false);
let refreshToastTimeout: any = null;
const triggerRefreshToast = (_msg: string) => {
  showRefreshToast.value = true;
  if (refreshToastTimeout) clearTimeout(refreshToastTimeout);
  refreshToastTimeout = setTimeout(() => { showRefreshToast.value = false; }, 2000);
};

const manualRefresh = () => fetchDashboard(true);
const goTo = (path: string) => router.push(path);

// ── Export-to-PDF ────────────────────────────────────────────────────
// We open a hidden print-friendly window and trigger window.print().
// The user picks "Save as PDF" in the OS print dialog. No jsPDF dep
// needed — the browser's built-in PDF renderer does the work, which
// keeps the bundle small and the layout pixel-perfect.
const exportPdf = () => {
  if (typeof window === 'undefined') return;
  const w = window.open('', '_blank', 'width=1280,height=900');
  if (!w) {
    alert('Lütfen pop-up engeli kapatın ve tekrar deneyin.');
    return;
  }

  // Format helpers — duplicated from the live dashboard so the printed
  // page is self-contained (no external CSS).
  const fmtKgs = (n: number) => Math.round(n).toLocaleString('ru-RU');
  const fmtDate = (d: string) => new Date(d).toLocaleString('tr-TR');
  const statsAny = stats.value as Record<string, number> | null;
  const totalRevenue = statsAny?.totalRevenue ?? 0;
  const completedRevenue = statsAny?.completedRevenue ?? 0;
  const todayRevenue = statsAny?.todayRevenue ?? 0;
  const totalOrders = statsAny?.totalOrders ?? 0;
  const pendingOrders = statsAny?.pendingOrders ?? 0;
  const totalUsers = statsAny?.totalUsers ?? 0;
  const distributors = statsAny?.distributors ?? 0;
  const newUsersThisWeek = statsAny?.newUsersThisWeek ?? 0;
  const lowStockCount = statsAny?.lowStockCount ?? 0;

  const recentRowsHtml = (recentOrders.value as Array<Record<string, unknown>>)
    .slice(0, 20)
    .map((o) => `
      <tr>
        <td>#${String(o.id).slice(0, 8).toUpperCase()}</td>
        <td>${String(o.customerName ?? '—')}</td>
        <td>${fmtKgs(Number(o.totalKgs ?? 0))} KGS</td>
        <td>${String(o.status ?? '—')}</td>
        <td>${fmtDate(String(o.createdAt))}</td>
      </tr>`).join('');

  const generatedAt = new Date().toLocaleString('tr-TR');

  w.document.write(`<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>Power Vital — Admin Dashboard Raporu</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1a1a; padding: 32px; max-width: 1100px; margin: 0 auto; }
  h1 { font-size: 24px; margin: 0 0 4px; color: #b94a3c; }
  .meta { color: #6b7280; font-size: 12px; margin-bottom: 24px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .kpi { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
  .kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 8px; }
  .kpi-value { font-size: 24px; font-weight: 800; color: #1a1a1a; }
  .kpi-sub { font-size: 12px; color: #6b7280; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
  th { background: #f9fafb; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 11px; }
  @media print { .no-print { display: none; } body { padding: 0; } }
</style>
</head>
<body>
  <div class="no-print" style="position:fixed;top:8px;right:8px;background:#b94a3c;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer;z-index:9999" onclick="window.print()">📄 PDF olarak kaydet</div>
  <h1>Power Vital — Admin Dashboard Raporu</h1>
  <div class="meta">Oluşturuldu: ${generatedAt} · powervital.kg</div>

  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-label">Toplam Ciro</div><div class="kpi-value">${fmtKgs(totalRevenue)} KGS</div><div class="kpi-sub">Onaylı: ${fmtKgs(completedRevenue)}</div></div>
    <div class="kpi"><div class="kpi-label">Bugün Ciro</div><div class="kpi-value">${fmtKgs(todayRevenue)} KGS</div><div class="kpi-sub">${statsAny?.todayOrderCount ?? 0} yeni sipariş</div></div>
    <div class="kpi"><div class="kpi-label">Siparişler</div><div class="kpi-value">${totalOrders}</div><div class="kpi-sub">${pendingOrders} bekleyen</div></div>
    <div class="kpi"><div class="kpi-label">Kullanıcılar</div><div class="kpi-value">${totalUsers}</div><div class="kpi-sub">${distributors} distribütör · +${newUsersThisWeek} bu hafta</div></div>
  </div>

  <h2 style="font-size:16px;margin:24px 0 8px">Son Siparişler (en yeni 20)</h2>
  <table>
    <thead><tr><th>Sipariş No</th><th>Müşteri</th><th>Tutar</th><th>Durum</th><th>Tarih</th></tr></thead>
    <tbody>${recentRowsHtml || '<tr><td colspan="5" style="text-align:center;color:#9ca3af">Henüz sipariş yok</td></tr>'}</tbody>
  </table>

  ${lowStockCount > 0 ? `<h2 style="font-size:16px;margin:24px 0 8px">⚠️ Düşük Stok Uyarısı (${lowStockCount} ürün)</h2><p style="color:#b45309">Bu ürünlerin stoğu kritik seviyede. Detaylar için admin paneli ziyaret edin.</p>` : ''}

  <div class="footer">Power Vital Admin Panel · Bu rapor sistem tarafından otomatik oluşturuldu.</div>
</body>
</html>`);
  w.document.close();
  // Wait for layout, then trigger print. setTimeout 0 lets the
  // window finish parsing + initial paint before opening the OS dialog.
  setTimeout(() => { w.print(); }, 250);
};

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('admin.timeNow');
  if (mins < 60) return `${mins} dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} saat önce`;
  return `${Math.floor(hrs / 24)} gün önce`;
};

onMounted(() => {
  fetchDashboard();
  fetchAnalytics();
  // Fallback poll every 60s — SSE is the primary real-time channel,
  // this just catches anything the EventSource might have missed while
  // the tab was hidden (browsers throttle background tabs).
  refreshTimer = setInterval(fetchDashboard, 60_000);
});
onUnmounted(() => { if (refreshTimer) clearInterval(refreshTimer); });
</script>

<template>
  <div class="dashboard-content">

    <!-- Header -->
    <header class="topbar">
      <div class="topbar-left">
        <h1 class="page-title">Sistem Özeti</h1>
        <div class="live-indicator" :class="{ 'live-indicator--off': !realtime.connected }">
          <span class="pulse-dot"/>
          <span class="live-text">{{ realtime.connected ? t('admin.liveOnline') : t('admin.liveOffline') }}</span>
        </div>
      </div>
      <div class="actions">
        <span class="last-sync" v-if="lastRefreshed && !isLoading">
          Son senkronizasyon: {{ lastRefreshed.toLocaleTimeString('tr-TR') }}
        </span>
        <button class="action-btn" @click="manualRefresh" :disabled="isLoading">
          <svg v-if="!isLoading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 2.13-5.83L2 9"/></svg>
          <span v-else class="spinner-mini"/>
          {{ isLoading ? 'Yükleniyor...' : 'Yenile' }}
        </button>
        <button class="action-btn" @click="exportPdf" :disabled="isLoading" title="Dashboard raporunu PDF olarak indir">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          PDF
        </button>
        <button class="btn-primary glow-btn" @click="goTo('/pos')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
          POS Aç
        </button>
      </div>
    </header>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <!-- KPI Grid -->
    <div class="kpi-grid">
      <!-- Total Revenue -->
      <div class="kpi-card glass-panel revenue-card">
        <div class="kpi-header">
          <span class="kpi-title">Toplam Ciro</span>
          <div class="kpi-icon">💰</div>
        </div>
        <div class="kpi-body">
          <div class="kpi-val">{{ fmtKgs(stats.totalRevenue) }} <span>KGS</span></div>
          <div class="kpi-sub">Onaylı: <strong>{{ fmtKgs(stats.completedRevenue) }}</strong></div>
        </div>
        <div class="card-glow"/>
      </div>

      <!-- Today's Revenue -->
      <div class="kpi-card glass-panel today-card">
        <div class="kpi-header">
          <span class="kpi-title">Bugün Ciro</span>
          <div class="kpi-icon">📈</div>
        </div>
        <div class="kpi-body">
          <div class="kpi-val">{{ fmtKgs(stats.todayRevenue) }} <span>KGS</span></div>
          <div class="kpi-sub">{{ stats.todayOrderCount }} Yeni Sipariş</div>
        </div>
        <div class="card-glow"/>
      </div>

      <!-- Orders -->
      <div class="kpi-card glass-panel">
        <div class="kpi-header">
          <span class="kpi-title">Sipariş Durumu</span>
          <div class="kpi-icon">📦</div>
        </div>
        <div class="kpi-body">
          <div class="kpi-val">{{ stats.totalOrders }} <span>Adet</span></div>
          <div class="kpi-sub stat-row">
            <span class="text-warning">⏳ {{ stats.pendingOrders }} Bekleyen</span>
            <span class="text-success">✅ {{ stats.completedOrders }} Biten</span>
          </div>
        </div>
      </div>

      <!-- Users -->
      <div class="kpi-card glass-panel">
        <div class="kpi-header">
          <span class="kpi-title">Ağ Büyümesi</span>
          <div class="kpi-icon">👥</div>
        </div>
        <div class="kpi-body">
          <div class="kpi-val">{{ stats.totalUsers }} <span>Kişi</span></div>
          <div class="kpi-sub">
            <span class="text-success">🔥 +{{ stats.newUsersThisWeek }} Bu Hafta</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="main-grid">
      <!-- Recent Orders Table -->
      <div class="glass-panel table-panel">
        <div class="panel-header">
          <h2>Son İşlemler</h2>
          <button class="link-btn" @click="goTo('/orders')">Tümünü Gör →</button>
        </div>
        
        <div class="table-wrap">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Sipariş No</th>
                <th>Müşteri</th>
                <th>Tutar</th>
                <th>Durum</th>
                <th>Zaman</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in recentOrders" :key="o.id">
                <td class="mono-text">#{{ o.id.slice(0, 8).toUpperCase() }}</td>
                <td class="font-medium">{{ o.customerName }}</td>
                <td class="font-bold text-white">{{ fmtKgs(o.totalKgs) }} KGS</td>
                <td><span class="status-badge" :class="getStatusBadge(o.status).cls">{{ getStatusBadge(o.status).label }}</span></td>
                <td class="text-muted">{{ timeAgo(o.createdAt) }}</td>
              </tr>
              <tr v-if="recentOrders.length === 0">
                <td colspan="5" class="empty-state">Henüz sipariş bulunmuyor.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right Sidebar: Alerts -->
      <div class="glass-panel alerts-panel">
        <div class="panel-header">
          <h2>Sistem Uyarıları</h2>
        </div>

        <div class="alerts-list">
          <div class="alert-item alert-warning" v-if="stats.lowStockCount > 0">
            <div class="alert-icon">⚠️</div>
            <div class="alert-content">
              <strong>Kritik Stok Uyarısı</strong>
              <p>{{ stats.lowStockCount }} ürün bitmek üzere.</p>
              <ul class="low-stock-list" v-if="lowStockAlerts.length">
                <li v-for="p in lowStockAlerts.slice(0, 5)" :key="p.id">
                  <span class="ls-name">{{ p.name }}</span>
                  <span class="ls-stock" :class="{ 'ls-stock--critical': p.stock <= 3 }">{{ p.stock }} adet</span>
                  <button class="ls-goto" @click="goTo(`/products?focus=${p.id}`)" :title="`${p.name} ürününe git`">→</button>
                </li>
                <li v-if="lowStockAlerts.length > 5" class="ls-more">+{{ lowStockAlerts.length - 5 }} daha...</li>
              </ul>
            </div>
            <button class="alert-action" @click="goTo('/products')" :title="'Tüm ürünleri yönet'">→</button>
          </div>
          
          <div class="alert-item alert-info" v-if="stats.pendingOrders > 0">
            <div class="alert-icon">⏳</div>
            <div class="alert-content">
              <strong>Bekleyen Siparişler</strong>
              <p>{{ stats.pendingOrders }} işlem onay bekliyor.</p>
            </div>
            <button class="alert-action" @click="goTo('/orders')">→</button>
          </div>

          <div class="alert-item alert-success" v-if="stats.lowStockCount === 0 && stats.pendingOrders === 0">
            <div class="alert-icon">✅</div>
            <div class="alert-content">
              <strong>Sistem Stabil</strong>
              <p>Müdahale gerektiren işlem yok.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- KPI trends chart — 30-day revenue / orders / new users (auto-refreshes on SSE events) -->
    <AdminChartWidget :initial-days="30" />

    <!-- Business-intelligence row: category breakdown + top customers + top products -->
    <div class="dashboard-row">
      <AdminPieChart
        :title="t('admin.pie.title')"
        :subtitle="t('admin.pie.subtitle')"
        :data="categoriesBreakdown"
        unit="KGS"
      />
      <AdminBarChart
        :title="t('admin.bar.topCustomers')"
        :subtitle="t('admin.bar.topCustomersSub')"
        :data="topCustomers"
        unit="KGS"
      />
      <AdminBarChart
        :title="t('admin.bar.topProducts')"
        :subtitle="t('admin.bar.topProductsSub')"
        :data="topProducts"
      />
    </div>

    <!-- Live metrics widget — moved to the bottom (auto-refreshes on realtime events + 5s polling) -->
    <AdminMetricsWidget />

    <!-- Toast Feedback -->
    <div class="feedback-toast" :class="{ 'show': showRefreshToast }">
      <span class="icon">✨</span> Senkronize Edildi
    </div>
  </div>
</template>

<style scoped>
/* ═══ GLOBAL LAYOUT ═══ */
.dashboard-content {
  padding: 32px 40px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Analytics row — pie + 2 bar charts, responsive 3→2→1 columns */
.dashboard-row {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(280px, 1fr) minmax(280px, 1fr);
  gap: 1.25rem;
}
@media (max-width: 1100px) {
  .dashboard-row { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 768px) {
  .dashboard-row { grid-template-columns: 1fr; }
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* ═══ TOPBAR ═══ */
.topbar {
  display: flex; justify-content: space-between; align-items: flex-end;
}
.topbar-left { display: flex; align-items: center; gap: 16px; }
.page-title {
  font-family: var(--font-display); font-size: 2rem; font-weight: 800;
  margin: 0; color: #fff; letter-spacing: -0.5px;
}
.live-indicator {
  display: flex; align-items: center; gap: 6px;
  background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 4px 10px; border-radius: 20px;
}
.pulse-dot { width: 8px; height: 8px; background: #10B981; border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
.live-text { font-size: 0.75rem; font-weight: 800; color: #10B981; text-transform: uppercase; letter-spacing: 1px; }

.actions { display: flex; align-items: center; gap: 16px; }
.last-sync { font-size: 0.8rem; color: rgba(255,255,255,0.4); font-family: var(--font-mono); }

.action-btn {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  color: #fff; padding: 10px 16px; border-radius: 12px;
  font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.action-btn:hover { background: rgba(255,255,255,0.1); transform: translateY(-1px); }

.glow-btn {
  display: flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, var(--pv-red), #933327);
  color: #fff; padding: 10px 20px; border-radius: 12px; border: none;
  font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 16px rgba(188, 74, 60, 0.4);
  transition: all 0.3s;
}
.glow-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(188, 74, 60, 0.6); }

/* ═══ GLASS PANELS ═══ */
.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.2);
  position: relative; overflow: hidden;
}

/* ═══ KPI GRID ═══ */
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; }
.kpi-card { padding: 24px; display: flex; flex-direction: column; justify-content: space-between; min-height: 140px; transition: transform 0.3s; }
.kpi-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.15); }

.kpi-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.kpi-title { font-size: 0.9rem; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; }
.kpi-icon { font-size: 1.5rem; background: rgba(255,255,255,0.05); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 10px; }

.kpi-body { display: flex; flex-direction: column; gap: 4px; z-index: 2; position: relative; }
.kpi-val { font-size: 2.2rem; font-weight: 900; font-family: var(--font-display); color: #fff; letter-spacing: -1px; display: flex; align-items: baseline; gap: 6px; }
.kpi-val span { font-size: 1rem; font-weight: 700; color: rgba(255,255,255,0.4); letter-spacing: 0; }
.kpi-sub { font-size: 0.85rem; color: rgba(255,255,255,0.4); font-weight: 500; }
.kpi-sub strong { color: rgba(255,255,255,0.8); font-weight: 700; }
.stat-row { display: flex; gap: 12px; }

.text-success { color: #10B981 !important; }
.text-warning { color: #F59E0B !important; }

.revenue-card .card-glow { position: absolute; bottom: -50px; right: -50px; width: 150px; height: 150px; background: rgba(188, 74, 60, 0.3); filter: blur(60px); z-index: 0; pointer-events: none; }
.today-card .card-glow { position: absolute; top: -50px; left: -50px; width: 150px; height: 150px; background: rgba(16, 185, 129, 0.2); filter: blur(60px); z-index: 0; pointer-events: none; }

/* ═══ MAIN GRID ═══ */
.main-grid { display: grid; grid-template-columns: 2.5fr 1fr; gap: 24px; }

.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.panel-header h2 { font-size: 1.2rem; font-weight: 800; font-family: var(--font-display); color: #fff; margin: 0; }
.link-btn { background: none; border: none; color: var(--pv-red); font-weight: 700; cursor: pointer; transition: opacity 0.2s; font-size: 0.9rem; }
.link-btn:hover { opacity: 0.8; text-decoration: underline; }

/* Modern Table */
.table-panel { padding: 32px; }
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
.modern-table th { text-align: left; padding: 0 16px 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: rgba(255,255,255,0.3); letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.modern-table td { padding: 16px; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.02); transition: background 0.2s; }
.modern-table td:first-child { border-left: 1px solid rgba(255,255,255,0.02); border-radius: 12px 0 0 12px; }
.modern-table td:last-child { border-right: 1px solid rgba(255,255,255,0.02); border-radius: 0 12px 12px 0; }
.modern-table tbody tr:hover td { background: rgba(255,255,255,0.05); }

.mono-text { font-family: var(--font-mono); font-weight: 600; color: rgba(255,255,255,0.6); }
.font-medium { font-weight: 500; color: rgba(255,255,255,0.8); }
.font-bold { font-weight: 700; }
.text-white { color: #fff; }
.text-muted { color: rgba(255,255,255,0.4); font-size: 0.85rem; }
.empty-state { text-align: center; color: rgba(255,255,255,0.4); padding: 40px !important; border-radius: 12px !important; }

/* Status Badges */
.status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
.st-pending { background: rgba(245, 158, 11, 0.1); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.2); }
.st-paid { background: rgba(16, 185, 129, 0.1); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.2); }
.st-shipped { background: rgba(59, 130, 246, 0.1); color: #3B82F6; border: 1px solid rgba(59, 130, 246, 0.2); }
.st-completed { background: rgba(16, 185, 129, 0.1); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.2); }
.st-cancelled { background: rgba(239, 68, 68, 0.1); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.2); }
.st-default { background: rgba(255,255,255,0.1); color: #fff; }

/* ═══ ALERTS PANEL ═══ */
.alerts-panel { padding: 32px; display: flex; flex-direction: column; }
.alerts-list { display: flex; flex-direction: column; gap: 16px; }
.alert-item { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); }
.alert-warning { border-left: 3px solid #F59E0B; background: linear-gradient(90deg, rgba(245,158,11,0.05), transparent); }
.alert-info { border-left: 3px solid #3B82F6; background: linear-gradient(90deg, rgba(59,130,246,0.05), transparent); }
.alert-success { border-left: 3px solid #10B981; background: linear-gradient(90deg, rgba(16,185,129,0.05), transparent); }

.alert-icon { font-size: 1.5rem; }
.alert-content { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.alert-content strong { font-size: 0.9rem; color: #fff; }
.alert-content p { margin: 0; font-size: 0.8rem; color: rgba(255,255,255,0.5); }

/* Low-stock list inside the warning alert — inline list of up to 5
   products with critical stock count. Each row links to the product
   management page with a focus= query so the admin can jump straight
   to the edit modal. */
.low-stock-list { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-direction: column; gap: 6px; }
.low-stock-list li {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 0.78rem;
}
.ls-name { flex: 1; color: rgba(255,255,255,0.85); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ls-stock { color: #fbbf24; font-weight: 600; font-size: 0.7rem; white-space: nowrap; }
.ls-stock--critical { color: #f87171; }
.ls-goto {
  background: rgba(255,255,255,0.08); border: 0; color: #fff;
  width: 24px; height: 24px; border-radius: 6px;
  cursor: pointer; font-size: 0.85rem; line-height: 1;
  transition: background 0.15s;
}
.ls-goto:hover { background: var(--pv-red, #b94a3c); }
.ls-more { justify-content: center; color: rgba(255,255,255,0.4); font-style: italic; background: transparent; border: 0; }
.alert-action { background: rgba(255,255,255,0.05); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; transition: background 0.2s; }
.alert-action:hover { background: rgba(255,255,255,0.1); }

/* ═══ TOAST ═══ */
.feedback-toast {
  position: fixed; bottom: 32px; right: 32px;
  background: rgba(16, 185, 129, 0.9); color: #fff;
  padding: 12px 24px; border-radius: 30px;
  font-weight: 700; font-size: 0.9rem;
  display: flex; align-items: center; gap: 8px;
  box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
  transform: translateY(100px); opacity: 0; pointer-events: none;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 1000;
}
.feedback-toast.show { transform: translateY(0); opacity: 1; }

.spinner-mini { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* ═══ RESPONSIVE ═══ */
@media (max-width: 1400px) {
  /* Tablet: keep 2-col but tighter */
  .kpi-grid { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
  .main-grid { grid-template-columns: 2fr 1fr; gap: 16px; }
  .table-panel { padding: 24px; }
}
@media (max-width: 1200px) {
  /* Small tablet: stack main grid */
  .main-grid { grid-template-columns: 1fr; }
  .dashboard-content { padding: 24px 20px; }
}
@media (max-width: 900px) {
  /* Mobile: tighter kpi, scroll tables */
  .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .kpi-card { padding: 16px; }
  .kpi-val { font-size: 1.4rem; }
  .kpi-title { font-size: 0.7rem; }
  .panel-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .panel-header h2 { font-size: 1rem; }
}
@media (max-width: 768px) {
  .dashboard-content { padding: 16px 12px; margin-top: 0; /* topbar handles its own spacing */ }
  .topbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 16px;
  }
  .topbar-left { justify-content: space-between; width: 100%; }
  .actions { width: 100%; justify-content: space-between; gap: 8px; }
  .actions .action-btn, .actions .btn-primary { padding: 8px 12px; font-size: 0.8rem; }
  .last-sync { display: none; }  /* saves space */
  .table-panel { padding: 16px; }
  .modern-table th { padding: 0 8px 8px; font-size: 0.65rem; }
  .modern-table td { padding: 12px 8px; font-size: 0.85rem; }
}
@media (max-width: 480px) {
  /* Phone: single-column kpi */
  .kpi-grid { grid-template-columns: 1fr; }
  .kpi-val { font-size: 1.6rem; }
  .quick-actions-grid { grid-template-columns: 1fr !important; }
}
</style>
