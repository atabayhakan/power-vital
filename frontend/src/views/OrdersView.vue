<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const orders = ref<any[]>([]);
const isLoading = ref(true);

const token = () => localStorage.getItem('token') || '';
const headers = () => ({ Authorization: `Bearer ${token()}` });

const fetchOrders = async () => {
  isLoading.value = true;
  try {
    const res = await axios.get('/api/v1/orders', { headers: headers() });
    orders.value = res.data;
  } catch (e) {
    console.error('Failed to fetch orders:', e);
    orders.value = [];
  } finally {
    isLoading.value = false;
  }
};

const updateStatus = async (id: string, newStatus: string) => {
  try {
    await axios.put(`/api/v1/orders/${id}/status`, { status: newStatus }, { headers: headers() });
    const order = orders.value.find(o => o.id === id);
    if (order) order.status = newStatus;
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
    default: return status;
  }
};

const fmtPrice = (n: any) => Math.round(Number(n)).toLocaleString('ru-RU') + ' сом';

onMounted(fetchOrders);
</script>

<template>
  <div class="orders-content animate-fade-in">
    <div class="header-row">
      <h2>Sipariş Yönetimi</h2>
      <button class="btn-primary" @click="fetchOrders">Yenile 🔄</button>
    </div>

    <div v-if="isLoading" class="loading glass-panel">Yükleniyor...</div>
    
    <div v-else class="table-container glass-panel">
      <table class="orders-table">
        <thead>
          <tr>
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
          <tr v-for="order in orders" :key="order.id">
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
              </div>
            </td>
          </tr>
          <tr v-if="orders.length === 0">
            <td colspan="7" class="empty-state">Henüz hiç sipariş bulunmuyor.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.orders-content { flex: 1; padding: 32px; display: flex; flex-direction: column; gap: 24px; overflow-y: auto; }
.header-row { display: flex; justify-content: space-between; align-items: center; }
.table-container { overflow-x: auto; border-radius: 12px; }
.orders-table { width: 100%; border-collapse: collapse; text-align: left; }
.orders-table th { background: rgba(0,0,0,.2); padding: 14px 16px; color: var(--color-text-muted); font-weight: 600; font-size: 13px; white-space: nowrap; }
.orders-table td { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.05); vertical-align: middle; font-size: 13px; }
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
.btn-action { border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all .2s; color: white; font-size: 12px; }
.btn-teal { background: #14b8a6; }
.btn-teal:hover { background: #0d9488; }
.btn-blue { background: #3b82f6; }
.btn-blue:hover { background: #2563eb; }
.btn-green { background: #22c55e; }
.btn-green:hover { background: #16a34a; }
.btn-red { background: #ef4444; }
.btn-red:hover { background: #dc2626; }
.empty-state { text-align: center; padding: 40px !important; color: var(--color-text-muted); }
</style>
