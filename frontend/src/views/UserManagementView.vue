<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiGet, apiPut, apiPost } from '@/api/openapi-client';
import ConfirmModal from '../components/ConfirmModal.vue';
import BulkActionBar from '../components/BulkActionBar.vue';
import AdminUserSearch from '../components/AdminUserSearch.vue';
import { useImpersonation } from '../composables/useImpersonation';
import { useI18n } from 'vue-i18n';
import { downloadCsv } from '../utils/csvDownload';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const users = ref<any[]>([]);
const allUsers = ref<any[]>([]);
const isLoading = ref(true);
const editMode = ref<string | null>(null);
const selectedIds = ref<string[]>([]);

const roleFilter = ref((route.query.role as string) || 'all');
const pageTitle = computed(() => 'Kullanıcı Merkezi');
const tabs = [
  { id: 'all', label: 'Tüm Kullanıcılar' },
  { id: 'customer', label: 'Müşteriler' },
  { id: 'distributor', label: 'Distribütörler' },
  { id: 'dealer', label: 'Bayiler' },
  { id: 'admin,cashier', label: 'Personel (Yetkili)' }
];

const pageSubtitle = computed(() => 'Sistemdeki tüm müşterileri, distribütörleri ve personeli bu God Mode arayüzünden kolayca yönetin.');

// ── Impersonation ─────────────────────────────────────────────────────
const { start: startImpersonation } = useImpersonation();
const isImpersonatingId = ref<string | null>(null);
const impersonateReason = ref<string>('');
const showImpersonateModal = ref(false);
const impersonateTarget = ref<{ id: string; name: string; email: string; role: string } | null>(null);

// ── Focus highlight ──────────────────────────────────────────────────
// When AdminUserSearch picks a user we flash the row for 2 seconds so
// the admin immediately sees which row was selected (especially useful
// when the table is long and the search → scroll target is offscreen).
const FLASH_DURATION_MS = 2000;
const flashUserId = ref<string | null>(null);
let flashTimer: ReturnType<typeof setTimeout> | null = null;
const flashRow = (userId: string) => {
  if (flashTimer) clearTimeout(flashTimer);
  flashUserId.value = userId;
  flashTimer = setTimeout(() => {
    flashUserId.value = null;
    flashTimer = null;
  }, FLASH_DURATION_MS);
};

const focusUser = (user: { id: string; name: string; email: string; role: string }) => {
  // The user we got from AdminUserSearch isn't in our local `users` array
  // yet (it may have just been created). Try to find them; if not present
  // we re-fetch and let the table scroll to them on the next render.
  const existing = users.value.find((u) => u.id === user.id);
  if (existing) {
    editMode.value = existing.id;
    selectedIds.value = [existing.id];
    flashRow(existing.id);
    // Scroll the row into view after the next paint.
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-user-row="${existing.id}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return;
  }
  // Fallback: re-fetch the user list (the typeahead hit might be a freshly
  // created account that the cached allUsers array doesn't have yet).
  fetchUsers().then(() => {
    const after = users.value.find((u) => u.id === user.id);
    if (after) {
      editMode.value = after.id;
      selectedIds.value = [after.id];
      flashRow(after.id);
    }
  });
};

// Cleanup on unmount
import { onUnmounted } from 'vue';
onUnmounted(() => {
  if (flashTimer) clearTimeout(flashTimer);
  window.removeEventListener('keydown', onImpersonateModalKeydown);
});

const onImpersonateModalKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && showImpersonateModal.value) showImpersonateModal.value = false;
};
onMounted(() => window.addEventListener('keydown', onImpersonateModalKeydown));

const openImpersonate = (user: any) => {
  impersonateTarget.value = { id: user.id, name: user.name, email: user.email, role: user.role };
  impersonateReason.value = '';
  showImpersonateModal.value = true;
};

const confirmImpersonate = async () => {
  if (!impersonateTarget.value) return;
  isImpersonatingId.value = impersonateTarget.value.id;
  try {
    await startImpersonation(impersonateTarget.value.id, impersonateReason.value || undefined);
    showImpersonateModal.value = false;
    // Navigate to the customer-facing account dashboard so the admin
    // sees exactly what the user sees. The ImpersonationBanner will
    // appear automatically because sessionStorage now has a session.
    router.push('/account');
  } catch (e: any) {
    alert(e?.response?.data?.error || 'İmpersonation başlatılamadı');
  } finally {
    isImpersonatingId.value = null;
  }
};

const fetchUsers = async () => {
  isLoading.value = true;
  try {
    const { data } = await apiGet('/api/v1/admin/users');
    // Backend returns a paginated envelope { items, total, ... }.
    allUsers.value = (data as unknown as { items?: unknown[] })?.items ?? (data as unknown as unknown[]);
    applyFilter();
  } catch (error) {
    console.error('Failed to fetch users', error);
  } finally {
    isLoading.value = false;
  }
};

const applyFilter = () => {
  if (roleFilter.value === 'all') {
    users.value = allUsers.value;
  } else {
    const roles = roleFilter.value.split(',');
    users.value = allUsers.value.filter(u => roles.includes(u.role));
  }
  selectedIds.value = [];
};

const setTab = (tabId: string) => {
  roleFilter.value = tabId;
};

watch(roleFilter, applyFilter);

const saveUser = async (user: any) => {
  try {
    await apiPut(`/api/v1/admin/users/${user.id}` as '/api/v1/admin/users/{id}', {
      role: user.role,
      isMonthlyActive: user.isMonthlyActive,
      walletBalanceKgs: user.walletBalanceKgs,
      walletBalanceUsd: user.walletBalanceUsd
    });
    editMode.value = null;
    fetchUsers();
  } catch (error) {
    console.error('Failed to update user', error);
  }
};

const toggleSelect = (id: string) => {
  const i = selectedIds.value.indexOf(id);
  if (i >= 0) selectedIds.value.splice(i, 1);
  else selectedIds.value.push(id);
};

const bulkAction = (event: string) => {
  if (event === 'delete') {
    // Modal handled in template via v-if
  } else if (event === 'export') {
    console.warn('[Bulk] Export selected users:', selectedIds.value);
  } else if (event === 'message') {
    console.warn('[Bulk] Message selected users:', selectedIds.value);
  }
};

// New BulkActionBar dual API: { action, endpoint, ids, method, body, download }
const onBulkRun = async (payload: { action: any; ids: string[] }) => {
  const { action, ids } = payload;
  if (ids.length === 0) return;

  if (action.download) {
    // CSV export
    await downloadCsv(action.endpoint, action.download);
    return;
  }

  if (action.endpoint && action.body) {
    // Bulk operation (e.g. delete)
    try {
      const res = await apiPost('/api/v1/admin/bulk/delete', {
        ...action.body,
        ids,
      } as { kind: 'users' | 'products' | 'orders'; ids: string[] });
      const payload = res.data as unknown as { deleted?: number; updated?: number };
      console.warn(`[Bulk] ${action.label}: ${payload.deleted ?? payload.updated} updated`);
      await fetchUsers();
    } catch (e) {
      console.error(`[Bulk] ${action.label} failed:`, e);
    }
  }
};

const deleteSelected = async () => {
  console.warn('[Bulk] Deleting:', selectedIds.value);
  // TODO: backend endpoint
  showBulkDelete.value = false;
  selectedIds.value = [];
};

const showBulkDelete = ref(false);

onMounted(fetchUsers);
</script>

<template>
  <div class="user-management animate-fade-in">
    <header class="page-header god-mode-header">
      <div class="header-left">
        <h2>{{ pageTitle }}</h2>
        <p class="text-muted">{{ pageSubtitle }}</p>
      </div>
      <div class="header-actions">
        <!-- Typeahead user search — picks a specific user to focus on.
             On select, the user is opened for inline edit (the row is
             scrolled into view + edit mode flips to inline). -->
        <div class="user-search-wrap">
          <AdminUserSearch @select="focusUser" />
        </div>
        <button class="btn btn-ghost" @click="fetchUsers">🔄 Yenile</button>
        <button class="btn btn-primary">+ Yeni Ekle</button>
      </div>
    </header>

    <div class="god-mode-tabs">
      <button 
        v-for="tab in tabs" :key="tab.id"
        :class="['gm-tab', { active: roleFilter === tab.id }]"
        @click="setTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="admin-panel-grid">
      <div class="panel">
        <BulkActionBar
          :selected-count="selectedIds.length"
          :total-count="users.length"
          :actions="[
            { label: t('admin.bulk.exportCsv'), icon: '📊', variant: 'ghost',
              endpoint: '/api/v1/admin/bulk/users.csv', download: `users-${Date.now()}.csv` },
            { label: t('admin.bulk.exportSelected'), icon: '✉️', variant: 'ghost',
              endpoint: '/api/v1/admin/bulk/users.csv', download: `users-selected-${Date.now()}.csv` },
            { label: t('admin.bulk.delete'), icon: '🗑️', variant: 'danger',
              endpoint: '/api/v1/admin/bulk/delete', method: 'POST',
              body: { kind: 'users' }, id: 'user' }
          ]"
          @select-all="selectedIds = users.map(u => u.id)"
          @clear-selection="selectedIds = []"
          @run="onBulkRun"
          @action="bulkAction"
        />

        <div v-if="isLoading" class="loading-state">Yükleniyor...</div>

        <div v-else class="table-responsive">
          <table class="admin-data-table">
            <thead>
              <tr>
                <th class="col-check"><input type="checkbox" :checked="selectedIds.length === users.length && users.length > 0" @change="(e: any) => e.target.checked ? selectedIds = users.map(u => u.id) : selectedIds = []" /></th>
                <th>Ad Soyad</th>
                <th>Email</th>
                <th>Rol & Seviye</th>
                <th>Toplam Harcama</th>
                <th>Kalıcı İndirim</th>
                <th>Durum (Aktiflik)</th>
                <th>KGS Bakiye</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id" :class="{ 'is-selected': selectedIds.includes(user.id), 'is-flash': flashUserId === user.id }" :data-user-row="user.id">
                <td class="col-check">
                  <input type="checkbox" :checked="selectedIds.includes(user.id)" @change="toggleSelect(user.id)" />
                </td>
                <td>
                  <div class="user-info">
                    <span class="user-name">{{ user.name }}</span>
                    <span class="sponsor" v-if="user.sponsor">Sponsor: {{ user.sponsor.name }}</span>
                  </div>
                </td>
                <td>{{ user.email }}</td>

                <template v-if="editMode === user.id">
                  <td>
                    <select v-model="user.role" class="admin-input">
                      <option value="admin">Admin</option>
                      <option value="distributor">Distribütör</option>
                      <option value="dealer">Bayi</option>
                      <option value="customer">Müşteri</option>
                    </select>
                  </td>
                  <td>
                    <input type="checkbox" v-model="user.isMonthlyActive" /> Aktif
                  </td>
                  <td>
                    <input type="number" v-model="user.walletBalanceKgs" class="admin-input" style="width: 80px;" />
                  </td>
                  <td>
                    <input type="number" v-model="user.walletBalanceUsd" class="admin-input" style="width: 80px;" />
                  </td>
                  <td>
                    <button class="btn btn-primary" @click="saveUser(user)">Kaydet</button>
                    <button class="btn btn-ghost" @click="editMode = null">İptal</button>
                  </td>
                </template>

                <template v-else>
                  <td>
                    <div class="role-level-box">
                      <span :class="['role-badge', user.role]">{{ user.role.toUpperCase() }}</span>
                      <span v-if="user.loyaltyLevel > 0" class="level-pill">Lvl {{ user.loyaltyLevel }}</span>
                    </div>
                  </td>
                  <td class="money">{{ Number(user.cumulativeSpendKgs || 0).toLocaleString() }} KGS</td>
                  <td class="money discount-col">%{{ Number(user.dynamicDiscountRate || 0) }}</td>
                  <td>
                    <span :class="['status-badge', user.isMonthlyActive ? 'active' : 'inactive']">
                      {{ user.isMonthlyActive ? '🟢 Aktif' : '🔴 Pasif' }}
                    </span>
                  </td>
                  <td class="money">{{ Number(user.walletBalanceKgs).toLocaleString() }} KGS</td>
                  <td>
                    <button class="action-btn icon-only" @click="editMode = user.id" title="Düzenle">✏️</button>
                    <button class="action-btn icon-only text-danger" title="Sil" @click="toggleSelect(user.id); showBulkDelete = true;">🗑️</button>
                    <button
                      v-if="user.role !== 'admin'"
                      class="action-btn icon-only"
                      :class="{ 'imp-btn--busy': isImpersonatingId === user.id }"
                      :disabled="isImpersonatingId === user.id"
                      :title="user.role === 'admin' ? 'Admin impersonation yapılamaz' : 'Bu kullanıcı olarak görüntüle'"
                      @click="openImpersonate(user)"
                    >
                      {{ isImpersonatingId === user.id ? '⏳' : '👁️' }}
                    </button>
                  </td>
                </template>
              </tr>
              <tr v-if="users.length === 0">
                <td colspan="8" class="empty-row">
                  <div class="empty-state">
                    <div class="icon">👥</div>
                    <p>Bu kategoride kullanıcı yok.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Impersonate modal -->
    <Teleport v-if="showImpersonateModal" to="body">
      <div class="imp-modal-backdrop" @click.self="showImpersonateModal = false">
        <div class="imp-modal">
          <h3>👁️ İmpersonation başlat</h3>
          <p>
            Aşağıdaki kullanıcı olarak <strong>60 dakika</strong> boyunca
            görüntüleneceksiniz:
          </p>
          <div class="imp-modal-target">
            <strong>{{ impersonateTarget?.name }}</strong>
            <span>{{ impersonateTarget?.email }}</span>
            <em class="imp-modal-role">{{ impersonateTarget?.role }}</em>
          </div>
          <label class="imp-modal-label">
            <span>Sebep (opsiyonel, audit log'a yazılır)</span>
            <textarea
              v-model="impersonateReason"
              class="admin-input"
              rows="3"
              maxlength="500"
              placeholder="örn. Destek talebi #42 — ödeme iadesi inceleniyor"
            />
          </label>
          <p class="imp-modal-warning">
            ⚠️ Bu oturum boyunca yaptığınız her işlem audit log'a
            <strong>sizin admin kimliğinizle</strong> kaydedilecek.
            İşlemi bitirmek için üstteki turuncu "İmpersonation'ı bitir"
            butonunu kullanın.
          </p>
          <div class="imp-modal-actions">
            <button class="imp-btn imp-btn--ghost" @click="showImpersonateModal = false">
              İptal
            </button>
            <button class="imp-btn imp-btn--primary" @click="confirmImpersonate">
              🚀 İmpersonation'ı başlat
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toplu Sil Onay Modalı -->
    <ConfirmModal
      :is-open="showBulkDelete"
      variant="danger"
      title="Toplu Silme İşlemi"
      :message="`${selectedIds.length} kullanıcıyı silmek üzeresiniz. Bu işlem geri alınamaz.`"
      :details="[
        'Kullanıcı hesapları tamamen silinir',
        'İlişkili siparişler orphan (yetim) kalır',
        'Sponsor zincirleri bozulabilir'
      ]"
      confirm-text="SİL"
      cancel-text="Vazgeç"
      @cancel="showBulkDelete = false"
      @confirm="deleteSelected"
    />
  </div>
</template>

<style scoped>
.user-management { padding: 32px; display: flex; flex-direction: column; gap: 24px; overflow-y: auto; }

/* Impersonate modal */
.imp-modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 10000;
}
.imp-modal {
  background: var(--surface-1, #fff); border-radius: 12px; padding: 1.75rem;
  max-width: 480px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.4);
}
.imp-modal h3 { margin: 0 0 0.5rem; font-size: 1.1rem; }
.imp-modal p { font-size: 0.88rem; opacity: 0.85; margin: 0.5rem 0; }
.imp-modal-target {
  background: rgba(0,0,0,0.05); border-radius: 8px; padding: 0.75rem;
  margin: 0.85rem 0; display: flex; flex-direction: column; gap: 0.15rem;
}
.imp-modal-role { font-size: 0.7rem; padding: 0.15rem 0.5rem; background: rgba(0,0,0,0.1);
  border-radius: 4px; align-self: flex-start; text-transform: uppercase; margin-top: 0.25rem; }
.imp-modal-label { display: block; margin: 0.85rem 0; font-size: 0.85rem; }
.imp-modal-label > span { display: block; font-weight: 500; margin-bottom: 0.3rem; }
.imp-modal-warning { font-size: 0.78rem; opacity: 0.75; padding: 0.65rem;
  background: rgba(245, 158, 11, 0.08); border-radius: 6px;
  border-left: 3px solid #F59E0B; margin: 0.85rem 0; }
.imp-modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
.imp-btn {
  padding: 0.55rem 1.1rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.15);
  background: transparent; cursor: pointer; font-weight: 600; font-size: 0.88rem;
}
.imp-btn--ghost { color: inherit; }
.imp-btn--primary { background: var(--pv-red, #BC4A3C); color: #fff; border-color: transparent; }
.imp-btn--primary:hover { filter: brightness(1.1); }
.imp-btn--busy { opacity: 0.6; cursor: wait; }

/* GOD MODE HEADER & TABS */
.god-mode-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0px;
  position: sticky;
  top: -32px;
  background: var(--bg-default);
  z-index: 10;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-light);
}

.god-mode-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid var(--border-light);
  margin-bottom: 16px;
}
.gm-tab {
  background: none;
  border: none;
  padding: 12px 24px;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s ease;
}
.gm-tab:hover { color: var(--text-primary); }
.gm-tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.action-btn.icon-only {
  padding: 8px;
  background: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}
.action-btn.icon-only:hover {
  background: var(--surface-hover);
}
.text-danger { color: #ef4444 !important; }
.text-danger:hover { background: #fee2e2 !important; }

.page-header h2 {
  font-size: 20px;
  font-weight: 800;
  margin: 0 0 4px 0;
}

.text-muted { color: var(--color-text-muted, #a1a1aa); font-size: 12px; margin: 0; }

.header-actions { display: flex; gap: 8px; align-items: center; }
.user-search-wrap { width: 280px; }

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  font-size: 13px;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  transition: all 0.15s;
}
.btn-primary { background: linear-gradient(135deg, #BC4A3C, #D8412F); color: white; }
.btn-primary:hover { filter: brightness(1.1); }
.btn-ghost { background: rgba(255,255,255,0.05); color: var(--color-text-muted, #a1a1aa); border: 1px solid rgba(255,255,255,0.1); }
.btn-ghost:hover { background: rgba(255,255,255,0.1); color: #fff; }

.col-check { width: 36px; text-align: center; }
.col-check input[type="checkbox"] { cursor: pointer; accent-color: #BC4A3C; }

.user-info { display: flex; flex-direction: column; }
.user-name { font-weight: 600; color: var(--color-text-main); }
.sponsor { font-size: 11px; color: var(--color-text-muted); }

.role-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(255,255,255,0.1);
}
.role-badge.admin { background: rgba(188, 74, 60, 0.2); color: var(--color-primary); }
.role-badge.distributor { background: rgba(0, 210, 255, 0.1); color: #00d2ff; }
.role-badge.dealer { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
.role-badge.customer { background: rgba(16, 185, 129, 0.1); color: #10b981; }

.status-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.status-badge.active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.status-badge.inactive { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

.money {
  font-family: monospace;
  font-size: 15px;
}

.is-selected { background: rgba(188, 74, 60, 0.06) !important; }

/* Flash highlight when AdminUserSearch picks a row — makes the
   selection obvious even when the table is long and the target
   row is offscreen. Animates for 2s via the .is-flash class which
   is removed by setTimeout in the composable. */
@keyframes row-flash-pulse {
  0%, 100% { background: rgba(188, 74, 60, 0.08); }
  50%      { background: rgba(188, 74, 60, 0.32); box-shadow: inset 4px 0 0 #b94a3c; }
}
.is-flash { animation: row-flash-pulse 0.8s ease-in-out 2.5; }

.empty-state { text-align: center; padding: 40px 0; color: var(--color-text-muted); }
.empty-state .icon { font-size: 48px; margin-bottom: 12px; opacity: 0.5; }
.empty-state p { margin: 0; }

.role-level-box {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: flex-start;
}

.level-pill {
  background: var(--pv-red);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
}

.discount-col {
  color: var(--pv-red);
  font-weight: bold;
}

.action-btn {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}
.action-btn:hover { background: rgba(255,255,255,0.1); }
</style>
