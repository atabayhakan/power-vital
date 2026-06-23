<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { apiPost } from '@/api/openapi-client';
import { useAuthStore } from '../stores/useAuthStore';
import { useTranslate } from '../composables/useTranslate';
import BulkActionBar, { type BulkAction } from '../components/BulkActionBar.vue';
import { downloadCsv } from '../utils/csvDownload';

const authStore = useAuthStore();
const { t, locale } = useTranslate();
// Staff (admin/cashier) get the management table; everyone else (customer /
// distributor) gets the clean, translated order-history view.
const isStaff = computed(() => authStore.userRole === 'admin' || authStore.userRole === 'cashier');

const orders = ref<any[]>([]);
const isLoading = ref(true);
const activeFilter = ref<'active' | 'all' | 'cancelled'>('active');
const showToast = ref('');
let toastTimeout: any = null;

// ─── Bulk-action selection ────────────────────────────────────────────
const selectedIds = ref<Set<string>>(new Set());
const isAllSelected = computed(() =>
  orders.value.length > 0 && orders.value.every(o => selectedIds.value.has(o.id))
);
const toggleOne = (id: string) => {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);
  selectedIds.value = new Set(selectedIds.value); // trigger reactivity
};
const toggleAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = new Set();
  } else {
    selectedIds.value = new Set(orders.value.map(o => o.id));
  }
};
const clearSelection = () => { selectedIds.value = new Set(); };

// ─── Bulk action definitions ──────────────────────────────────────────
const bulkActions = computed<BulkAction[]>(() => [
  {
    id: 'mark-paid',
    label: t('admin.bulk.markPaid'),
    icon: '💳',
    color: '#10B981',
    endpoint: '/api/v1/admin/bulk/orders/status',
    method: 'POST',
    skipConfirm: false
  },
  {
    id: 'mark-shipped',
    label: t('admin.bulk.markShipped'),
    icon: '🚚',
    color: '#3B82F6',
    endpoint: '/api/v1/admin/bulk/orders/status'
  },
  {
    id: 'mark-completed',
    label: t('admin.bulk.markCompleted'),
    icon: '✅',
    color: '#10B981',
    endpoint: '/api/v1/admin/bulk/orders/status'
  },
  {
    id: 'mark-cancelled',
    label: t('admin.bulk.markCancelled'),
    icon: '❌',
    color: '#6B7280',
    endpoint: '/api/v1/admin/bulk/orders/status'
  }
]);

const bulkConfirmMap: Record<string, string> = {
  'mark-paid':      t('admin.bulk.confirmStatus'),
  'mark-shipped':   t('admin.bulk.confirmStatus'),
  'mark-completed': t('admin.bulk.confirmStatus'),
  'mark-cancelled': t('admin.bulk.confirmStatus')
};

const handleBulkRun = async ({ action, ids }: { action: BulkAction; ids: string[] }) => {
  const targetIds = ids.length > 0 ? ids : Array.from(selectedIds.value);
  if (targetIds.length === 0) return;
  // Apply the per-action confirm text (BulkActionBar uses generic).
  const confirmMsg = (action.id && bulkConfirmMap[action.id]) || action.confirmMessage;
  if (confirmMsg && !(globalThis as any).confirm?.(confirmMsg)) return;
  const status = (action.id ?? '').replace('mark-', ''); // paid|shipped|completed|cancelled
  try {
    const { data } = await apiPost('/api/v1/admin/bulk/orders/status', {
      orderIds: targetIds,
      status: status as 'paid' | 'shipped' | 'completed' | 'cancelled',
    });
    const { updated, requested } = data as unknown as { updated: number; requested: number };
    if (updated === requested) {
      triggerToast(t('admin.bulk.success', { n: updated }));
    } else {
      triggerToast(t('admin.bulk.partialFailure', { updated, requested }));
    }
    clearSelection();
    fetchOrders(true);
  } catch (e: any) {
    console.error('Bulk action failed:', e);
    triggerToast(t('admin.bulk.error', { msg: e?.response?.data?.error || e.message }));
  }
};

const exportOrdersCsv = async () => {
  try {
    await downloadCsv({
      url: '/api/v1/admin/bulk/orders.csv',
      filename: `orders-${new Date().toISOString().slice(0, 10)}.csv`,
      token: token()
    });
  } catch (e: any) {
    triggerToast(t('admin.bulk.error', { msg: e?.response?.data?.error || e.message }));
  }
};

const dateLocaleMap: Record<string, string> = { tr: 'tr-TR', ru: 'ru-RU', kg: 'ru-RU' };
const fmtDate = (d: string) => new Date(d).toLocaleDateString(dateLocaleMap[locale.value] || 'tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
const statusLabel = (s: string) => {
  const map: Record<string, string> = { pending: 'orders.pending', paid: 'orders.paid', shipped: 'orders.shipped', completed: 'orders.completed', cancelled: 'orders.cancelled', refunded: 'orders.refunded' };
  return map[s] ? t(map[s]) : s;
};
const itemCount = (o: any) => Array.isArray(o.items) ? o.items.reduce((a: number, it: any) => a + (Number(it.quantity) || 1), 0) : (o.itemCount || 0);

const token = () => localStorage.getItem('token') || '';
const headers = () => ({ Authorization: `Bearer ${token()}` });

const fetchOrders = async (silent = false) => {
  if (!silent) isLoading.value = true;
  try {
    const url = activeFilter.value === 'all'
      ? '/api/v1/orders?includeCancelled=true'
      : activeFilter.value === 'cancelled'
        ? '/api/v1/orders?status=cancelled'
        : '/api/v1/orders';
    const res = await axios.get(url, { headers: headers() });
    // Backend now returns a paginated envelope { items, total, page, limit }
    // (was a bare array). Tolerate both shapes so order.id.slice(...) never
    // runs against a non-order value.
    const payload = res.data;
    orders.value = Array.isArray(payload) ? payload : (payload?.items ?? []);
    // Drop any selected ids that no longer match the active filter.
    selectedIds.value = new Set(
      Array.from(selectedIds.value).filter(id => orders.value.some(o => o.id === id))
    );
  } catch (e) {
    console.error('Failed to fetch orders:', e);
    orders.value = [];
  } finally {
    isLoading.value = false;
  }
};

const switchFilter = (filter: 'active' | 'all' | 'cancelled') => {
  activeFilter.value = filter;
  fetchOrders();
};

const triggerToast = (msg: string) => {
  showToast.value = msg;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { showToast.value = ''; }, 2000);
};

const updateStatus = async (id: string, newStatus: string) => {
  try {
    await axios.put(`/api/v1/orders/${id}/status`, { status: newStatus }, { headers: headers() });
    const order = orders.value.find(o => o.id === id);
    if (order) order.status = newStatus;
    triggerToast(`Sipariş güncellendi: ${getStatusText(newStatus)}`);
    // After status change, refetch to respect filter
    setTimeout(() => fetchOrders(true), 500);
  } catch (e) {
    console.error('Failed to update status:', e);
    alert('Durum güncellenemedi.');
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'status-pending';
    case 'paid': return 'status-paid';
    case 'shipped': return 'status-shipped';
    case 'completed': return 'status-completed';
    case 'cancelled': return 'status-cancelled';
    case 'refunded': return 'status-refunded';
    default: return 'status-default';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'Bekliyor 🕒';
    case 'paid': return 'Ödendi 💳';
    case 'shipped': return 'Kargolandı 🚚';
    case 'completed': return 'Tamamlandı ✅';
    case 'cancelled': return 'İptal ❌';
    case 'refunded': return 'İade 🔄';
    default: return status || '—';
  }
};

const fmtPrice = (n: any) => Math.round(Number(n)).toLocaleString('ru-RU') + ' сом';

const orderCount = computed(() => orders.value.length);

onMounted(() => fetchOrders());
</script>

<template>
  <!-- ════════ CUSTOMER / DISTRIBUTOR: clean translated order history ════════ -->
  <div v-if="!isStaff" class="cust-orders">
   <div class="cust-orders__inner">
    <header class="co-head">
      <div>
        <h1 class="co-title">{{ t('orders.title') }}</h1>
        <p class="co-sub">{{ t('orders.subtitle') }}</p>
      </div>
      <button class="co-refresh" @click="fetchOrders()" :disabled="isLoading">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" :class="{ spin: isLoading }"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        {{ t('orders.refresh') }}
      </button>
    </header>

    <div class="co-filters">
      <button class="co-filter" :class="{ active: activeFilter === 'active' }" @click="switchFilter('active')">{{ t('orders.filterActive') }}</button>
      <button class="co-filter" :class="{ active: activeFilter === 'cancelled' }" @click="switchFilter('cancelled')">{{ t('orders.filterCancelled') }}</button>
      <button class="co-filter" :class="{ active: activeFilter === 'all' }" @click="switchFilter('all')">{{ t('orders.filterAll') }}</button>
    </div>

    <div v-if="isLoading" class="co-loading">{{ t('orders.loading') }}</div>

    <div v-else-if="orders.length === 0" class="co-empty">
      <span class="co-empty__icon">🛍️</span>
      <h3>{{ activeFilter === 'cancelled' ? t('orders.emptyCancelled') : activeFilter === 'all' ? t('orders.emptyAll') : t('orders.emptyActive') }}</h3>
      <p>{{ t('orders.emptyHint') }}</p>
      <router-link to="/katalog" class="co-shop-btn">{{ t('orders.shopNow') }}</router-link>
    </div>

    <div v-else class="co-list">
      <div v-for="order in orders" :key="order.id" class="co-order">
        <span class="co-order__icon">🧾</span>
        <span class="co-order__main">
          <span class="co-order__id">#{{ order.id.slice(0, 8).toUpperCase() }}</span>
          <span class="co-order__meta">{{ fmtDate(order.createdAt) }}<template v-if="itemCount(order)"> · {{ itemCount(order) }} {{ t('orders.items') }}</template></span>
        </span>
        <span class="co-order__status" :class="getStatusColor(order.status)">{{ statusLabel(order.status) }}</span>
        <span class="co-order__total">{{ fmtPrice(order.totalKgs) }}</span>
      </div>
    </div>
   </div>
  </div>

  <!-- ════════ STAFF (admin/cashier): management table ════════ -->
  <div v-else class="orders-content animate-fade-in">
    <div class="header-row">
      <div>
        <h2>📋 Sipariş Yönetimi</h2>
        <p class="subtitle">{{ orderCount }} sipariş listeleniyor</p>
      </div>
      <button class="btn-primary" @click="fetchOrders()" :disabled="isLoading">
        <span v-if="isLoading" class="spinner-mini"/>
        <span v-else>🔄</span>
        {{ isLoading ? 'Yenileniyor...' : 'Yenile' }}
      </button>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button
        class="filter-tab"
        :class="{ active: activeFilter === 'active' }"
        @click="switchFilter('active')"
      >
        ✅ Aktif
      </button>
      <button
        class="filter-tab"
        :class="{ active: activeFilter === 'cancelled' }"
        @click="switchFilter('cancelled')"
      >
        ❌ İptal Edilenler
      </button>
      <button
        class="filter-tab"
        :class="{ active: activeFilter === 'all' }"
        @click="switchFilter('all')"
      >
        🗂️ Tümü
      </button>
    </div>

    <div v-if="isLoading" class="loading panel">Yükleniyor...</div>

    <div v-else>
      <BulkActionBar
        :selected-count="selectedIds.size"
        :actions="bulkActions"
        @clear="clearSelection"
        @run="handleBulkRun"
      />
      <div class="bulk-toolbar">
        <label class="bulk-select-all">
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate.prop="!isAllSelected && selectedIds.size > 0"
            @change="toggleAll"
          />
          <span>{{ isAllSelected ? t('admin.bulk.clearSelection') : t('admin.bulk.selectedMany', { n: orders.length }) }}</span>
        </label>
        <button type="button" class="bulk-csv-btn" @click="exportOrdersCsv">
          📥 {{ t('admin.bulk.ordersExport') }}
        </button>
      </div>
    </div>

    <div class="table-container panel" style="--panel-padding: 0;">
      <table class="orders-table">
        <thead>
          <tr>
            <th class="sel-col">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate.prop="!isAllSelected && selectedIds.size > 0"
                @change="toggleAll"
              />
            </th>
            <th>Sipariş No</th>
            <th>Tür</th>
            <th>Müşteri</th>
            <th>Tutar</th>
            <th>Tarih</th>
            <th>Durum</th>
            <th>İşlem</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id" :class="{ 'is-selected': selectedIds.has(order.id) }">
            <td class="sel-col">
              <input
                type="checkbox"
                :checked="selectedIds.has(order.id)"
                @change="toggleOne(order.id)"
              />
            </td>
            <td class="order-id">#{{ order.id.slice(0, 8) }}</td>
            <td>
              <span v-if="order.orderType === 'ecommerce'" class="badge ecommerce">E-Ticaret 🌐</span>
              <span v-else-if="order.orderType === 'pos'" class="badge pos">POS 🛒</span>
              <span v-else class="badge b2b">B2B 🏢</span>
            </td>
            <td>{{ order.customerName || '—' }}</td>
            <td class="text-gradient fw-bold">{{ fmtPrice(order.totalKgs) }}</td>
            <td>{{ new Date(order.createdAt).toLocaleDateString('tr-TR') }}</td>
            <td>
              <span class="status-badge" :class="getStatusColor(order.status)">
                {{ getStatusText(order.status) }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button
                  v-if="order.status === 'pending'"
                  class="btn-action btn-teal"
                  @click="updateStatus(order.id, 'paid')"
                >Onayla</button>
                <button
                  v-if="order.status === 'paid'"
                  class="btn-action btn-blue"
                  @click="updateStatus(order.id, 'shipped')"
                >Kargola</button>
                <button
                  v-if="order.status === 'shipped'"
                  class="btn-action btn-green"
                  @click="updateStatus(order.id, 'completed')"
                >Teslim</button>
                <button
                  v-if="order.status === 'pending'"
                  class="btn-action btn-red"
                  @click="updateStatus(order.id, 'cancelled')"
                >İptal</button>
                <span v-if="['completed', 'cancelled', 'refunded'].includes(order.status)" class="muted-tag">— İşlem yok</span>
              </div>
            </td>
          </tr>
          <tr v-if="orders.length === 0">
            <td colspan="7" class="empty-state">
              <div class="empty-emoji">📭</div>
              <p v-if="activeFilter === 'cancelled'">Henüz iptal edilen sipariş yok.</p>
              <p v-else-if="activeFilter === 'active'">Aktif sipariş bulunmuyor.</p>
              <p v-else>Henüz hiç sipariş bulunmuyor.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Transition name="toast">
      <div v-if="showToast" class="toast-orders">✓ {{ showToast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
/* ════════ CUSTOMER ORDER HISTORY (light, translated) ════════ */
.cust-orders { height: 100%; width: 100%; overflow-y: auto; overflow-x: hidden; font-family: 'Inter', system-ui, sans-serif; color: #1f2937; -webkit-overflow-scrolling: touch; }
.cust-orders__inner { max-width: 1000px; margin: 0 auto; padding: 32px 24px 64px; }
.co-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 22px; }
.co-title { font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 800; margin: 0 0 6px; letter-spacing: -0.03em; color: #111827; }
.co-sub { margin: 0; color: #6b7280; font-size: 0.98rem; }
.co-refresh { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border: 1px solid #e5e7eb; background: #fff; color: #374151; border-radius: 11px; font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: border-color 0.15s, color 0.15s; }
.co-refresh:hover:not(:disabled) { border-color: #e7c6bf; color: #BC4A3C; }
.co-refresh:disabled { opacity: 0.6; cursor: default; }
.co-refresh svg.spin { animation: co-spin 0.8s linear infinite; }
@keyframes co-spin { to { transform: rotate(360deg); } }

.co-filters { display: inline-flex; gap: 4px; padding: 4px; background: #efeae3; border-radius: 11px; margin-bottom: 20px; }
.co-filter { padding: 8px 16px; border: none; background: transparent; color: #6b7280; font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 0.86rem; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
.co-filter:hover { color: #111827; }
.co-filter.active { background: #fff; color: #BC4A3C; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

.co-loading { padding: 40px; text-align: center; color: #9ca3af; background: #fff; border: 1px solid #ececec; border-radius: 16px; }

.co-empty { text-align: center; padding: 56px 24px; background: #fff; border: 1px solid #ececec; border-radius: 20px; display: flex; flex-direction: column; align-items: center; gap: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.co-empty__icon { font-size: 3rem; opacity: 0.55; }
.co-empty h3 { font-family: 'Outfit', sans-serif; font-size: 1.1rem; font-weight: 800; color: #374151; margin: 6px 0 0; }
.co-empty p { color: #9ca3af; font-size: 0.9rem; margin: 0 0 10px; max-width: 320px; line-height: 1.5; }
.co-shop-btn { display: inline-flex; padding: 11px 22px; border-radius: 12px; background: linear-gradient(135deg, #D4665A, #BC4A3C); color: #fff; text-decoration: none; font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 0.92rem; box-shadow: 0 6px 18px rgba(188,74,60,0.3); transition: transform 0.12s; }
.co-shop-btn:hover { transform: translateY(-2px); }

.co-list { display: flex; flex-direction: column; gap: 10px; }
.co-order { display: flex; align-items: center; gap: 14px; padding: 16px 18px; background: #fff; border: 1px solid #ececec; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); transition: border-color 0.15s, box-shadow 0.15s; }
.co-order:hover { border-color: #e7c6bf; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.co-order__icon { font-size: 1.2rem; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; background: #f7f4ef; border-radius: 11px; flex-shrink: 0; }
.co-order__main { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.co-order__id { font-family: 'Outfit', sans-serif; font-weight: 800; color: #1f2937; font-size: 0.95rem; }
.co-order__meta { font-size: 0.82rem; color: #9ca3af; }
.co-order__status { font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; padding: 5px 12px; border-radius: 100px; flex-shrink: 0; }
.co-order__total { font-family: 'Outfit', sans-serif; font-weight: 800; color: #1f2937; font-size: 1rem; flex-shrink: 0; min-width: 92px; text-align: right; }
/* Light status badge palette (overrides the dark ones for customer view) */
.cust-orders .status-pending { background: #fef3c7; color: #b45309; }
.cust-orders .status-paid { background: #dbeafe; color: #1d4ed8; }
.cust-orders .status-shipped { background: #ede9fe; color: #6d28d9; }
.cust-orders .status-completed { background: #d1fae5; color: #047857; }
.cust-orders .status-cancelled { background: #fee2e2; color: #b91c1c; }
.cust-orders .status-refunded { background: #f3f4f6; color: #6b7280; }

@media (max-width: 560px) {
  .cust-orders__inner { padding: 20px 16px 48px; }
  .co-title { font-size: 1.5rem; }
  .co-order__total { min-width: 72px; font-size: 0.92rem; }
  .co-order__status { font-size: 0.66rem; padding: 4px 9px; }
}

/* ════════ STAFF MANAGEMENT TABLE (unchanged) ════════ */
.orders-content { flex: 1; padding: 32px; display: flex; flex-direction: column; gap: 24px; overflow-y: auto; }
.header-row { display: flex; justify-content: space-between; align-items: center; }
.table-container { overflow-x: auto; border-radius: var(--border-radius, 12px); border: none !important; }
.orders-table { width: 100%; border-collapse: collapse; text-align: left; }
.orders-table th { background: rgba(0,0,0,.2); padding: 18px 24px; color: var(--color-text-muted); font-weight: 600; font-size: 13px; white-space: nowrap; border-bottom: 1px solid rgba(255,255,255,0.05); }
.orders-table td { padding: 18px 24px; border-bottom: 1px solid rgba(255,255,255,.05); vertical-align: middle; font-size: 13px; }
.orders-table tbody tr:hover { background: rgba(255,255,255,.02); }
.order-id { font-family: monospace; font-weight: 600; }
.fw-bold { font-weight: 700; }

.badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap; }
.badge.ecommerce { background: rgba(14,165,233,.2); color: #38bdf8; }
.badge.pos { background: rgba(168,85,247,.2); color: #c084fc; }
.badge.b2b { background: rgba(245,158,11,.2); color: #fbbf24; }

.status-badge { padding: 5px 10px; border-radius: 16px; font-size: 12px; font-weight: 700; white-space: nowrap; }
.status-pending { background: rgba(245,158,11,.2); color: #fbbf24; }
.status-paid { background: rgba(16,185,129,.2); color: #34d399; }
.status-shipped { background: rgba(59,130,246,.2); color: #60a5fa; }
.status-completed { background: rgba(34,197,94,.2); color: #4ade80; }
.status-cancelled { background: rgba(239,68,68,.2); color: #f87171; }
.status-refunded { background: rgba(168,85,247,.2); color: #c084fc; }
.status-default { background: rgba(156,163,175,.2); color: #9ca3af; }

.action-buttons { display: flex; gap: 6px; flex-wrap: wrap; }
.btn-action {
  border: none !important;
  outline: none !important;
  padding: 8px 16px;
  border-radius: var(--clay-radius-btn, 100px);
  cursor: pointer;
  font-weight: 700;
  transition: var(--transition-kinetic);
  color: white;
  font-size: 12px;
  box-shadow: var(--clay-shadow-outset);
  text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.2);
}
.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: var(--clay-shadow-hover);
}
.btn-action:active {
  transform: translateY(1px);
  box-shadow: var(--clay-shadow-inset);
}
.btn-teal { background: #14b8a6; }
.btn-teal:hover { background: #0d9488; }
.btn-blue { background: #3b82f6; }
.btn-blue:hover { background: #2563eb; }
.btn-green { background: #22c55e; }
.btn-green:hover { background: #16a34a; }
.btn-red { background: #ef4444; }
.btn-red:hover { background: #dc2626; }
.empty-state { text-align: center; padding: 40px !important; color: var(--color-text-muted); }

.btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 18px; border: none; border-radius: 8px;
  background: linear-gradient(135deg, var(--color-primary), #FF6B5C);
  color: white; font-weight: 700; font-size: 13px; cursor: pointer;
  box-shadow: 0 4px 12px rgba(230,57,70,0.3); transition: all 0.2s;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(230,57,70,0.4); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.spinner-mini {
  display: inline-block; width: 12px; height: 12px;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.subtitle { color: var(--color-text-muted); font-size: 12px; margin-top: 4px; }

/* Filter Tabs */
.filter-tabs {
  display: flex; gap: 4px; padding: 4px;
  background: rgba(0,0,0,0.2); border-radius: 10px;
  align-self: flex-start;
}
.filter-tab {
  padding: 8px 16px; border: none; background: transparent;
  color: var(--color-text-muted); font-size: 13px; font-weight: 600;
  border-radius: 8px; cursor: pointer; transition: all 0.2s;
}
.filter-tab:hover { color: #fff; background: rgba(255,255,255,0.04); }
.filter-tab.active {
  background: rgba(230,57,70,0.15); color: var(--color-primary);
  box-shadow: inset 0 0 0 1px rgba(230,57,70,0.3);
}

.muted-tag { color: var(--color-text-muted); font-size: 11px; font-style: italic; padding: 4px 8px; }
.empty-emoji { font-size: 40px; margin-bottom: 8px; opacity: 0.5; }

/* Toast */
.toast-orders {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: #1f1f23; color: #fff; padding: 12px 20px; border-radius: 10px;
  border: 1px solid rgba(52,211,153,0.3); font-size: 13px; font-weight: 600;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4); z-index: 9999;
}
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(20px); }

/* ════════ BULK TOOLBAR (select-all + CSV) ════════ */
.bulk-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}
.bulk-select-all {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
  cursor: pointer;
}
.bulk-select-all input { width: 16px; height: 16px; cursor: pointer; }
.bulk-csv-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
  font-weight: 700;
  font-size: 13px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.bulk-csv-btn:hover { background: rgba(59, 130, 246, 0.3); }

.orders-table td.sel-col,
.orders-table th.sel-col {
  width: 36px;
  padding-left: 16px;
  padding-right: 4px;
}
.orders-table input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; }
.orders-table tbody tr.is-selected { background: rgba(59, 130, 246, 0.08); }
.orders-table tbody tr.is-selected:hover { background: rgba(59, 130, 246, 0.14); }
</style>
