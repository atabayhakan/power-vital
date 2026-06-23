<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { apiGet, apiPut } from '@/api/openapi-client';
import ConfirmModal from '../components/ConfirmModal.vue';
import BulkActionBar from '../components/BulkActionBar.vue';
import { useI18n } from 'vue-i18n';
import { downloadCsv } from '../utils/csvDownload';

interface Withdrawal {
  id: string;
  userId: string;
  user?: { name: string; email: string };
  amount: string;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
  bankInfo?: string;
  createdAt: string;
}

const { t } = useI18n();
const withdrawals = ref<Withdrawal[]>([]);
const isLoading = ref(true);
const selectedIds = ref<string[]>([]);

// Modal state
const showApproveModal = ref(false);
const showRejectModal = ref(false);
const activeWithdrawal = ref<Withdrawal | null>(null);

const pendingCount = computed(() => withdrawals.value.filter(w => w.status === 'pending').length);
const totalAmount = computed(() => {
  const pending = withdrawals.value.filter(w => w.status === 'pending');
  return pending.reduce((sum, w) => sum + Number(w.amount), 0);
});

const fetchWithdrawals = async () => {
  try {
    const { data } = await apiGet('/api/v1/admin/withdrawals');
    // Backend returns a paginated envelope { items, total, ... }.
    withdrawals.value = (data as unknown as { items?: Withdrawal[] })?.items ?? (data as unknown as Withdrawal[]);
  } catch (error) {
    console.error('Failed to fetch withdrawals', error);
  } finally {
    isLoading.value = false;
  }
};

const toggleSelect = (id: string) => {
  const i = selectedIds.value.indexOf(id);
  if (i >= 0) selectedIds.value.splice(i, 1);
  else selectedIds.value.push(id);
};

const openApprove = (w: Withdrawal) => {
  activeWithdrawal.value = w;
  showApproveModal.value = true;
};

const openReject = (w: Withdrawal) => {
  activeWithdrawal.value = w;
  showRejectModal.value = true;
};

const performStatusUpdate = async (status: 'approved' | 'rejected') => {
  if (!activeWithdrawal.value) return;
  const id = activeWithdrawal.value.id;
  try {
    await apiPut(`/api/v1/admin/withdrawals/${id}` as '/api/v1/admin/withdrawals/{id}', { status });
    fetchWithdrawals();
  } catch (error) {
    alert('İşlem başarısız: ' + ((error as any).response?.data?.error || 'Bilinmeyen hata'));
  }
  showApproveModal.value = false;
  showRejectModal.value = false;
  activeWithdrawal.value = null;
};

const fmtDate = (d: string) => new Date(d).toLocaleString('tr-TR');
const fmtAmount = (n: string | number) => Number(n).toLocaleString('tr-TR');

const onBulkRun = async (payload: { action: any; ids: string[] }) => {
  const { action } = payload;
  if (action.download) {
    await downloadCsv(action.endpoint, action.download);
  }
};

onMounted(fetchWithdrawals);
</script>

<template>
  <div class="finance-payouts animate-fade-in">
    <header class="page-header">
      <div>
        <h2>💳 Çekim Talepleri</h2>
        <p class="text-muted">
          {{ pendingCount }} bekleyen talep ·
          <span class="text-warn">Toplam {{ fmtAmount(totalAmount) }} KGS</span>
        </p>
      </div>
      <div class="header-actions">
        <button class="btn btn-ghost" @click="fetchWithdrawals">🔄 Yenile</button>
      </div>
    </header>

    <div class="admin-panel-grid">
      <div class="panel">
        <BulkActionBar
          :selected-count="selectedIds.length"
          :total-count="withdrawals.filter(w => w.status === 'pending').length"
          :actions="[
            { label: t('admin.bulk.exportCsv'), icon: '📊', variant: 'ghost',
              endpoint: '/api/v1/admin/bulk/withdrawals.csv',
              download: `withdrawals-${Date.now()}.csv` },
            { label: t('admin.bulk.approve'), icon: '✅', variant: 'success', event: 'approve' }
          ]"
          @select-all="selectedIds = withdrawals.filter(w => w.status === 'pending').map(w => w.id)"
          @clear-selection="selectedIds = []"
          @action="(ev) => ev === 'approve' && selectedIds.forEach(id => { const w = withdrawals.find(x => x.id === id); if (w) openApprove(w); })"
          @run="onBulkRun"
        />

        <div v-if="isLoading" class="loading-state">Yükleniyor...</div>

        <div v-else-if="withdrawals.length === 0" class="empty-state">
          <div class="icon">💰</div>
          <p>Henüz bir çekim talebi yok.</p>
        </div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th class="col-check">
                <input type="checkbox" :checked="selectedIds.length > 0 && selectedIds.length === withdrawals.filter(w => w.status === 'pending').length" @change="(e: any) => e.target.checked ? selectedIds = withdrawals.filter(w => w.status === 'pending').map(w => w.id) : selectedIds = []" />
              </th>
              <th>Tarih</th>
              <th>Distribütör</th>
              <th>Tutar</th>
              <th>Hesap Bilgisi</th>
              <th>Durum</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="w in withdrawals" :key="w.id" :class="{ 'is-selected': selectedIds.includes(w.id) }">
              <td class="col-check">
                <input v-if="w.status === 'pending'" type="checkbox" :checked="selectedIds.includes(w.id)" @change="toggleSelect(w.id)" />
              </td>
              <td>{{ fmtDate(w.createdAt) }}</td>
              <td>
                <div class="user-info">
                  <span class="user-name">{{ w.user?.name || 'Bilinmiyor' }}</span>
                  <span class="email">{{ w.user?.email || '' }}</span>
                </div>
              </td>
              <td class="money">{{ fmtAmount(w.amount) }} {{ w.currency }}</td>
              <td><code class="bank-info">{{ w.bankInfo || 'Belirtilmedi' }}</code></td>
              <td>
                <span :class="['status-badge', w.status]">
                  {{ w.status === 'pending' ? '⏳ Bekliyor' : w.status === 'approved' ? '✅ Ödendi' : '❌ Reddedildi' }}
                </span>
              </td>
              <td>
                <template v-if="w.status === 'pending'">
                  <button class="btn btn-success" @click="openApprove(w)">✓ Onayla</button>
                  <button class="btn btn-danger" @click="openReject(w)">✕ Reddet</button>
                </template>
                <span v-else class="text-muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Onay Modalı -->
    <ConfirmModal
      :is-open="showApproveModal"
      variant="success"
      title="Çekim Talebini Onayla"
      :message="activeWithdrawal ? `${activeWithdrawal.user?.name} kullanıcısının ${fmtAmount(activeWithdrawal.amount)} ${activeWithdrawal.currency} tutarındaki çekim talebini onaylamak üzeresiniz.` : ''"
      :details="activeWithdrawal ? [
        `Tutar: ${fmtAmount(activeWithdrawal.amount)} ${activeWithdrawal.currency}`,
        `Hesap: ${activeWithdrawal.bankInfo || 'Belirtilmedi'}`,
        'Kullanıcı cüzdanından düşüm otomatik yapılacak'
      ] : []"
      confirm-text="ONAYLA"
      cancel-text="Vazgeç"
      @cancel="showApproveModal = false"
      @confirm="performStatusUpdate('approved')"
    />

    <!-- Red Modalı -->
    <ConfirmModal
      :is-open="showRejectModal"
      variant="danger"
      title="Çekim Talebini Reddet"
      :message="activeWithdrawal ? `${activeWithdrawal.user?.name} kullanıcısının çekim talebini reddetmek üzeresiniz.` : ''"
      :details="activeWithdrawal ? [
        `Tutar: ${fmtAmount(activeWithdrawal.amount)} ${activeWithdrawal.currency}`,
        'Reddedilen tutar otomatik olarak kullanıcı cüzdanına iade edilecek',
        'Bu işlem kullanıcıya bildirim olarak gönderilir'
      ] : []"
      confirm-text="REDDET"
      cancel-text="Vazgeç"
      @cancel="showRejectModal = false"
      @confirm="performStatusUpdate('rejected')"
    />
  </div>
</template>

<style scoped>
.finance-payouts { padding: 32px; display: flex; flex-direction: column; gap: 24px; overflow-y: auto; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 16px;
  flex-wrap: wrap;
}

.page-header h2 { font-size: 20px; font-weight: 800; margin: 0 0 4px 0; }
.text-muted { color: var(--color-text-muted, #a1a1aa); font-size: 12px; margin: 0; }
.text-warn { color: #fbbf24; font-weight: 700; }

.header-actions { display: flex; gap: 8px; }

.btn {
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  font-size: 13px;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  margin-right: 4px;
  transition: all 0.15s;
}
.btn-ghost { background: rgba(255,255,255,0.05); color: var(--color-text-muted); border: 1px solid rgba(255,255,255,0.1); }
.btn-ghost:hover { background: rgba(255,255,255,0.1); color: #fff; }
.btn-success { background: linear-gradient(135deg, #10b981, #059669); color: white; }
.btn-success:hover { filter: brightness(1.1); }
.btn-danger { background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
.btn-danger:hover { background: rgba(239, 68, 68, 0.2); }

.col-check { width: 36px; text-align: center; }
.col-check input[type="checkbox"] { cursor: pointer; accent-color: #BC4A3C; }

.empty-state { text-align: center; padding: 60px 20px; color: var(--color-text-muted); }
.empty-state .icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
.empty-state p { font-size: 14px; margin: 0; }

.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  text-align: left;
  padding: 10px 12px;
  color: var(--color-text-muted, #a1a1aa);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.data-table td {
  padding: 12px;
  font-size: 13px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.data-table tr:hover { background: rgba(255,255,255,0.02); }
.is-selected { background: rgba(16, 185, 129, 0.06) !important; }

.user-info { display: flex; flex-direction: column; }
.user-name { font-weight: 600; color: var(--color-text-main); }
.email { font-size: 11px; color: var(--color-text-muted); }

.money { font-family: monospace; font-size: 15px; font-weight: 700; color: #10b981; }
.bank-info { background: rgba(0,0,0,0.25); padding: 4px 8px; border-radius: 4px; font-size: 12px; color: #d4d4d8; }

.status-badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; }
.status-badge.pending { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.status-badge.approved { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.status-badge.rejected { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
</style>
