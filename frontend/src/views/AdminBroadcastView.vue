<script setup lang="ts">
// AdminBroadcastView — admin operator tool for Web Push.
//
// Two tabs:
//   1. Compose — pick a user, write a notification, send it (POST /api/v1/push/broadcast)
//   2. History — view recent broadcasts with filters (GET /api/v1/push/broadcast-history)
//
// Backend contract:
//   POST /api/v1/push/broadcast         { userId, title, body, url?, eventKey, note? }
//   GET  /api/v1/push/broadcast-history ?limit&actorId&targetId&eventKey&since
// Both return { sent, expired, failed } or { rows, count } respectively.
import { ref, computed, onMounted, watch } from 'vue';
import { apiGet, apiPost } from '@/api/openapi-client';
import { useTranslate } from '../composables/useTranslate';

const { t } = useTranslate();

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface BroadcastResult {
  sent: number;
  expired: number;
  failed: number;
  skipped?: string;
  // Multi-target only:
  parentBroadcastId?: string;
  targetCount?: number;
  totalSent?: number;
  totalExpired?: number;
  totalFailed?: number;
  totalSkipped?: number;
  perTarget?: Array<{ userId: string; sent: number; expired: number; failed: number; skipped?: string }>;
}

interface HistoryRow {
  id: string;
  actorId: string | null;
  actor: { id: string; name: string; email: string } | null;
  targetId: string;
  target: { id: string; name: string; email: string };
  eventKey: string;
  sent: number;
  expired: number;
  failed: number;
  note: string | null;
  parentBroadcastId: string | null;
  createdAt: string;
}

// A group = a single multi-target broadcast.
// All rows sharing the same parentBroadcastId collapse into one row in
// the "groups" view; clicking expands to show the per-target breakdown.
// (See the live definition below — this comment kept for orientation.)

// ── Tabs ──────────────────────────────────────────────────────────────
type Tab = 'compose' | 'history';
const activeTab = ref<Tab>('compose');

// ── Compose form ──────────────────────────────────────────────────────
type TargetMode = 'single' | 'multi' | 'segment';
const targetMode = ref<TargetMode>('single');

const userQuery = ref('');
const userResults = ref<UserRow[]>([]);
const selectedUser = ref<UserRow | null>(null);           // single-mode
const selectedUsers = ref<UserRow[]>([]);                  // multi-mode
const segmentRole = ref<string>('customer');               // segment-mode
const isSearching = ref(false);
const isResolvingSegment = ref(false);

const title = ref('');
const body = ref('');
const url = ref('/');
const eventKey = ref('custom');
const tag = ref('');
const note = ref('');

const isSending = ref(false);
const lastResult = ref<BroadcastResult | null>(null);
const errorMsg = ref('');

const EVENT_KEYS = [
  { value: 'custom',                label: 'Özel (custom)',              icon: '📣' },
  { value: 'order_paid',            label: 'Sipariş ödendi',              icon: '💳' },
  { value: 'order_shipped',         label: 'Sipariş kargoda',             icon: '📦' },
  { value: 'order_completed',       label: 'Sipariş tamamlandı',          icon: '✅' },
  { value: 'order_cancelled',       label: 'Sipariş iptal',               icon: '❌' },
  { value: 'withdrawal_approved',   label: 'Çekim onaylandı',             icon: '✅' },
  { value: 'withdrawal_rejected',   label: 'Çekim reddedildi',            icon: '⚠️' },
  { value: 'promo',                 label: 'Promosyon',                    icon: '🎁' }
];

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const searchUsers = async () => {
  if (searchTimer) clearTimeout(searchTimer);
  const q = userQuery.value.trim();
  if (q.length < 2) {
    userResults.value = [];
    return;
  }
  searchTimer = setTimeout(async () => {
    isSearching.value = true;
    try {
      const { data } = await apiGet('/api/v1/admin/users', { query: { search: q, limit: 20 } });
      // Envelope is { items, total, page, limit, hasMore } — extract the
      // row array. Fall back to a raw array for safety on legacy responses.
      const payload = data as unknown as { items?: UserRow[]; users?: UserRow[] };
      userResults.value = Array.isArray(payload) ? payload : (payload?.items ?? payload?.users ?? []);
    } catch (e: any) {
      errorMsg.value = 'Kullanıcı arama hatası';
      userResults.value = [];
    } finally {
      isSearching.value = false;
    }
  }, 250);
};

const pickUser = (u: UserRow) => {
  if (targetMode.value === 'single') {
    selectedUser.value = u;
    userResults.value = [];
    userQuery.value = '';
  } else if (targetMode.value === 'multi') {
    // Dedupe by id
    if (!selectedUsers.value.some(x => x.id === u.id)) {
      selectedUsers.value = [...selectedUsers.value, u];
    }
    userResults.value = [];
    userQuery.value = '';
  }
};

const removeUser = (id: string) => {
  selectedUsers.value = selectedUsers.value.filter(u => u.id !== id);
};

const clearUser = () => {
  selectedUser.value = null;
  selectedUsers.value = [];
};

// Resolve segment-mode users — used by the broadcastScheduler via a separate
// resolve handler; for now the broadcast composer accepts a role string and
// lets the backend resolve targets server-side. Left as a TODO.

const onModeChange = (mode: TargetMode) => {
  targetMode.value = mode;
  selectedUser.value = null;
  selectedUsers.value = [];
  userQuery.value = '';
  userResults.value = [];
};

const canSend = computed(() => {
  if (isSending.value) return false;
  if (title.value.trim().length === 0 || body.value.trim().length === 0) return false;
  if (targetMode.value === 'single') return !!selectedUser.value;
  if (targetMode.value === 'multi')   return selectedUsers.value.length > 0;
  if (targetMode.value === 'segment') return segmentRole.value.length > 0;
  return false;
});

const targetCountLabel = computed(() => {
  if (targetMode.value === 'single') return selectedUser.value ? '1 alıcı' : '— alıcı yok';
  if (targetMode.value === 'multi')   return `${selectedUsers.value.length} alıcı seçildi`;
  if (targetMode.value === 'segment') return `Tüm ${segmentRole.value || '?'} kullanıcılar (max 500)`;
  return '';
});

const send = async () => {
  if (!canSend.value) return;
  isSending.value = true;
  errorMsg.value = '';
  lastResult.value = null;
  try {
    const payload: any = {
      title: title.value.trim(),
      body: body.value.trim(),
      url: url.value.trim() || '/',
      eventKey: eventKey.value
    };
    if (targetMode.value === 'single') {
      payload.userId = selectedUser.value!.id;
    } else if (targetMode.value === 'multi') {
      payload.userIds = selectedUsers.value.map(u => u.id);
    } else if (targetMode.value === 'segment') {
      payload.role = segmentRole.value;
    }
    if (note.value.trim()) payload.note = note.value.trim();

    const { data } = await apiPost('/api/v1/push/broadcast', payload);
    lastResult.value = data as BroadcastResult;
    // Success heuristic for single-target: sent > 0.
    // For multi: totalSent > 0.
    const anySent = ((data as BroadcastResult).totalSent ?? (data as BroadcastResult).sent ?? 0) > 0;
    if (anySent) {
      title.value = '';
      body.value = '';
      url.value = '/';
      eventKey.value = 'custom';
      tag.value = '';
      note.value = '';
    }
  } catch (e: any) {
    errorMsg.value = e.response?.data?.error || e.message || 'Gönderim hatası';
  } finally {
    isSending.value = false;
  }
};

const testToMe = async () => {
  isSending.value = true;
  errorMsg.value = '';
  try {
    const { data } = await apiPost('/api/v1/push/test', {
      message: title.value.trim() ? `${title.value} — ${body.value}` : (body.value || undefined)
    });
    lastResult.value = data as BroadcastResult;
  } catch (e: any) {
    errorMsg.value = e.response?.data?.error || e.message || 'Test hatası';
  } finally {
    isSending.value = false;
  }
};

const presets = [
  { title: '🎁 Sana Özel %20 İndirim',     body: 'Power Vital\'de seçili ürünlerde %20 indirim seni bekliyor. Hemen incele!', url: '/katalog', eventKey: 'promo', tag: 'promo' },
  { title: '⏰ Siparişin bekliyor',          body: 'Sepetinde ürün bıraktın. Tamamlamaya ne dersin?',                       url: '/cart',   eventKey: 'custom', tag: 'cart-abandon' },
  { title: '🌟 Yeni ürün: Collagen',         body: 'Cilt bakım rutinini güçlendir. Yeni Collagen serisi sadece bizde.',     url: '/urun/collagen-tripeptide', eventKey: 'promo', tag: 'new-product' }
];

const applyPreset = (p: typeof presets[number]) => {
  title.value = p.title;
  body.value = p.body;
  url.value = p.url;
  eventKey.value = p.eventKey;
  tag.value = p.tag;
};

// ── History panel ─────────────────────────────────────────────────────
const historyRows = ref<HistoryRow[]>([]);
const historyCount = ref(0);
const isLoadingHistory = ref(false);
const historyError = ref('');

const filterEventKey = ref<string>(''); // '' = all
const filterLimit = ref<number>(50);
const filterActorId = ref<string>('');
const filterTargetId = ref<string>('');

const fetchHistory = async () => {
  isLoadingHistory.value = true;
  historyError.value = '';
  try {
    const query: Record<string, string | number> = { limit: filterLimit.value };
    if (filterEventKey.value) query.eventKey = filterEventKey.value;
    if (filterActorId.value.trim()) query.actorId = filterActorId.value.trim();
    if (filterTargetId.value.trim()) query.targetId = filterTargetId.value.trim();
    const { data } = await apiGet('/api/v1/push/broadcast-history', { query });
    // Backend returns a cursor envelope { items, nextCursor, hasMore }. Tolerate
    // a legacy { rows, count } shape too so history never silently shows empty.
    const payload = data as unknown as { items?: HistoryRow[]; rows?: HistoryRow[]; count?: number };
    historyRows.value = payload.items || payload.rows || [];
    historyCount.value = payload.count || historyRows.value.length;
  } catch (e: any) {
    historyError.value = e.response?.data?.error || e.message || 'Geçmiş yüklenemedi';
  } finally {
    isLoadingHistory.value = false;
  }
};

const totalSent = computed(() => historyRows.value.reduce((s, r) => s + r.sent, 0));
const totalExpired = computed(() => historyRows.value.reduce((s, r) => s + r.expired, 0));
const totalFailed = computed(() => historyRows.value.reduce((s, r) => s + r.failed, 0));

// View mode: 'flat' shows every row individually; 'groups' collapses
// all rows with the same parentBroadcastId into a single row.
type HistoryMode = 'flat' | 'groups';
const historyMode = ref<HistoryMode>('flat');

interface BroadcastGroup {
  parentBroadcastId: string;
  createdAt: string;
  actor: HistoryRow['actor'];
  eventKey: string;
  note: string | null;
  targetCount: number;
  sent: number;
  expired: number;
  failed: number;
  targets: HistoryRow[];
}

// Group rows by parentBroadcastId. Rows without a parentBroadcastId
// (single-target broadcasts) each become their own group of size 1.
const broadcastGroups = computed<BroadcastGroup[]>(() => {
  const byParent = new Map<string, HistoryRow[]>();
  for (const row of historyRows.value) {
    const key = row.parentBroadcastId || `single-${row.id}`;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(row);
  }
  const groups: BroadcastGroup[] = [];
  for (const [, rows] of byParent) {
    // All rows in a group share the same parentBroadcastId, actor,
    // eventKey, and createdAt (they were inserted in one transaction).
    const first = rows[0];
    groups.push({
      parentBroadcastId: first.parentBroadcastId || first.id,
      createdAt: first.createdAt,
      actor: first.actor,
      eventKey: first.eventKey,
      note: first.note,
      targetCount: rows.length,
      sent:     rows.reduce((s, r) => s + r.sent, 0),
      expired:  rows.reduce((s, r) => s + r.expired, 0),
      failed:   rows.reduce((s, r) => s + r.failed, 0),
      targets: rows
    });
  }
  // Newest group first
  return groups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
});

// When in groups mode, the total stats aggregate over GROUPS not rows.
const groupAggregate = computed(() => {
  const g = broadcastGroups.value;
  return {
    groupCount: g.length,
    targetCount: g.reduce((s, x) => s + x.targetCount, 0),
    sent: g.reduce((s, x) => s + x.sent, 0),
    expired: g.reduce((s, x) => s + x.expired, 0),
    failed: g.reduce((s, x) => s + x.failed, 0)
  };
});

const expandedGroups = ref<Set<string>>(new Set());

const toggleGroup = (id: string) => {
  if (expandedGroups.value.has(id)) expandedGroups.value.delete(id);
  else expandedGroups.value.add(id);
  expandedGroups.value = new Set(expandedGroups.value);
};

const isMultiTarget = (g: BroadcastGroup): boolean => g.targetCount > 1;

const fmtTime = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'medium' });
};

const clearFilters = () => {
  filterEventKey.value = '';
  filterActorId.value = '';
  filterTargetId.value = '';
  filterLimit.value = 50;
  fetchHistory();
};

// ── CSV export ────────────────────────────────────────────────────────
// Builds the same query URL as fetchHistory but appends .csv extension
// so the server returns text/csv with Content-Disposition attachment.
// Browser triggers a file download via the temporary <a download> trick.
const exportCsvUrl = computed(() => {
  const params = new URLSearchParams();
  params.set('limit', String(Math.max(filterLimit.value, 1000))); // export all
  if (filterEventKey.value)            params.set('eventKey', filterEventKey.value);
  if (filterActorId.value.trim())      params.set('actorId', filterActorId.value.trim());
  if (filterTargetId.value.trim())     params.set('targetId', filterTargetId.value.trim());
  // Cookie auth is sent automatically with same-origin <a> click.
  return `/api/v1/push/broadcast-history.csv?${params.toString()}`;
});

const isExporting = ref(false);

const exportCsv = async () => {
  if (isExporting.value) return;
  isExporting.value = true;
  try {
    // Hidden anchor triggers the browser's native download UI
    // (filename, save dialog) consistently across browsers.
    const a = document.createElement('a');
    a.href = exportCsvUrl.value;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      isExporting.value = false;
    }, 200);
  } catch {
    isExporting.value = false;
  }
};

const eventIcon = (key: string): string => {
  return EVENT_KEYS.find(k => k.value === key)?.icon || '📣';
};

// ── Tab change refreshes history ──────────────────────────────────────
watch(activeTab, (tab) => {
  if (tab === 'history' && historyRows.value.length === 0) {
    fetchHistory();
  }
});

onMounted(() => {
  // Don't fetch history on mount — wait until user clicks the tab.
});
</script>

<template>
  <div class="bc-view">
    <header class="bc-head">
      <div>
        <h1 class="bc-title">📣 Push Broadcast</h1>
        <p class="bc-sub">{{ t('admin.broadcast.subtitle') }}</p>
      </div>
      <div class="bc-meta">
        <router-link to="/admin-push-analytics" class="bc-link">
          📊 {{ t('admin.broadcast.viewAnalytics') }} →
        </router-link>
        <span class="bc-tag">ADMIN</span>
      </div>
    </header>

    <!-- Tab bar -->
    <nav class="bc-tabs">
      <button
        class="bc-tab"
        :class="{ 'bc-tab--active': activeTab === 'compose' }"
        @click="activeTab = 'compose'"
      >
        ✍️ Compose
      </button>
      <button
        class="bc-tab"
        :class="{ 'bc-tab--active': activeTab === 'history' }"
        @click="activeTab = 'history'"
      >
        📜 History
        <span v-if="historyCount" class="bc-tab-count">{{ historyCount }}</span>
      </button>
    </nav>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- TAB 1: COMPOSE                                                  -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div v-show="activeTab === 'compose'">
      <div class="bc-grid">
        <!-- LEFT: user picker -->
        <section class="bc-card">
          <h3 class="bc-h">{{ t('admin.broadcast.step1Title') }}</h3>

          <!-- Mode chips: single / multi / segment -->
          <div class="bc-mode-chips">
            <button class="bc-chip" :class="{ 'bc-chip--active': targetMode === 'single' }" @click="onModeChange('single')" type="button">
              👤 Tek
            </button>
            <button class="bc-chip" :class="{ 'bc-chip--active': targetMode === 'multi' }" @click="onModeChange('multi')" type="button">
              {{ t('admin.broadcast.tabMulti') }}
            </button>
            <button class="bc-chip" :class="{ 'bc-chip--active': targetMode === 'segment' }" @click="onModeChange('segment')" type="button">
              🎯 Segment
            </button>
          </div>

          <!-- SINGLE mode -->
          <div v-if="targetMode === 'single'">
            <div v-if="selectedUser" class="bc-selected">
              <div class="bc-user">
                <div class="bc-avatar">{{ selectedUser.name?.[0]?.toUpperCase() || '?' }}</div>
                <div class="bc-user-info">
                  <div class="bc-user-name">{{ selectedUser.name }}</div>
                  <div class="bc-user-email">{{ selectedUser.email }}</div>
                  <div class="bc-user-role">{{ selectedUser.role }}</div>
                </div>
              </div>
              <button class="bc-mini" @click="clearUser" title="Değiştir">✕</button>
            </div>

            <div v-else>
              <input v-model="userQuery" @input="searchUsers" @keyup.enter="searchUsers" class="bc-input" placeholder="İsim veya e-posta ile ara (en az 2 karakter)…" />
              <p v-if="isSearching" class="bc-hint">⏳ Aranıyor…</p>
              <ul v-if="userResults.length" class="bc-list">
                <li v-for="u in userResults" :key="u.id" class="bc-list-item" @click="pickUser(u)">
                  <div class="bc-avatar bc-avatar--sm">{{ u.name?.[0]?.toUpperCase() || '?' }}</div>
                  <div>
                    <div class="bc-list-name">{{ u.name }}</div>
                    <div class="bc-list-email">{{ u.email }}</div>
                  </div>
                  <span class="bc-role-pill">{{ u.role }}</span>
                </li>
              </ul>
              <p v-else-if="userQuery.length >= 2 && !isSearching" class="bc-hint">{{ t('admin.broadcast.noResults') }}</p>
            </div>
          </div>

          <!-- MULTI mode -->
          <div v-else-if="targetMode === 'multi'">
            <input v-model="userQuery" @input="searchUsers" @keyup.enter="searchUsers" class="bc-input" :placeholder="t('admin.broadcast.searchPlaceholder')" />
            <p v-if="isSearching" class="bc-hint">{{ t('admin.broadcast.searching') }}</p>
            <ul v-if="userResults.length" class="bc-list">
              <li v-for="u in userResults" :key="u.id" class="bc-list-item" @click="pickUser(u)">
                <div class="bc-avatar bc-avatar--sm">{{ u.name?.[0]?.toUpperCase() || '?' }}</div>
                <div>
                  <div class="bc-list-name">{{ u.name }}</div>
                  <div class="bc-list-email">{{ u.email }}</div>
                </div>
                <span class="bc-role-pill">{{ u.role }}</span>
              </li>
            </ul>

            <div v-if="selectedUsers.length" class="bc-multi-chips">
              <span v-for="u in selectedUsers" :key="u.id" class="bc-multi-chip">
                {{ u.name }}
                <button class="bc-mini bc-mini--inline" @click="removeUser(u.id)" type="button" title="Çıkar">✕</button>
              </span>
            </div>
            <p v-else class="bc-hint">{{ t('admin.broadcast.addUserHint') }}</p>
          </div>

          <!-- SEGMENT mode -->
          <div v-else-if="targetMode === 'segment'">
            <label class="bc-label">
              <span>Hedef rol</span>
              <select v-model="segmentRole" class="bc-input">
                <option value="customer">{{ t('admin.broadcast.segAllCustomers') }}</option>
                <option value="distributor">{{ t('admin.broadcast.segAllDistributors') }}</option>
                <option value="cashier">{{ t('admin.broadcast.segAllCashiers') }}</option>
                <option value="dealer">{{ t('admin.broadcast.segAllResellers') }}</option>
                <option value="admin">{{ t('admin.broadcast.segAllAdmins') }}</option>
              </select>
            </label>
            <p class="bc-hint">
              {{ t('admin.broadcast.segWarn') }}<br/>
              <span v-if="isResolvingSegment">{{ t('admin.broadcast.counting') }}</span>
            </p>
          </div>

          <p class="bc-target-count">{{ targetCountLabel }}</p>
        </section>

        <!-- RIGHT: broadcast form -->
        <section class="bc-card">
          <h3 class="bc-h">2. Bildirim İçeriği</h3>

          <label class="bc-label">
            <span>{{ t('admin.broadcast.fieldTitle') }}</span>
            <input v-model="title" class="bc-input" placeholder="🔔 Power Vital — Özel Teklif" maxlength="80" />
          </label>

          <label class="bc-label">
            <span>Mesaj</span>
            <textarea v-model="body" class="bc-input bc-input--area" placeholder="Bildirim gövdesi… (max 200 karakter)" maxlength="200" rows="3" />
            <span class="bc-counter">{{ body.length }} / 200</span>
          </label>

          <div class="bc-row">
            <label class="bc-label bc-label--half">
              <span>Hedef URL</span>
              <input v-model="url" class="bc-input" placeholder="/orders/123" />
            </label>

            <label class="bc-label bc-label--half">
              <span>Event Key</span>
              <select v-model="eventKey" class="bc-input">
                <option v-for="k in EVENT_KEYS" :key="k.value" :value="k.value">{{ k.icon }} {{ k.label }}</option>
              </select>
            </label>
          </div>

          <div class="bc-row">
            <label class="bc-label bc-label--half">
              <span>Tag (opsiyonel)</span>
              <input v-model="tag" class="bc-input" placeholder="promo, cart-abandon…" maxlength="40" />
            </label>
            <label class="bc-label bc-label--half">
              <span>Audit Note (opsiyonel)</span>
              <input v-model="note" class="bc-input" placeholder="Q3 promo campaign" maxlength="100" />
            </label>
          </div>

          <details class="bc-presets">
            <summary>{{ t('admin.broadcast.templates') }}</summary>
            <div class="bc-preset-grid">
              <button v-for="(p, i) in presets" :key="i" class="bc-preset" type="button" @click="applyPreset(p)">
                <strong>{{ p.title }}</strong>
                <small>{{ p.body }}</small>
              </button>
            </div>
          </details>
        </section>
      </div>

      <!-- Result panel -->
      <section v-if="lastResult || errorMsg" class="bc-result" :class="{ 'bc-result--err': !!errorMsg }">
        <div v-if="errorMsg" class="bc-result-text">⚠️ {{ errorMsg }}</div>
        <div v-else-if="lastResult" class="bc-result-text">
          <!-- Multi-target aggregate -->
          <span v-if="lastResult.targetCount !== undefined">
            📊 Broadcast <strong>{{ lastResult.targetCount }}</strong> alıcıya tamamlandı<br/>
            ✅ Gönderildi: <strong>{{ lastResult.totalSent }}</strong>
            <span v-if="lastResult.totalExpired"> · 🗑️ Süresi dolmuş: {{ lastResult.totalExpired }}</span>
            <span v-if="lastResult.totalFailed"> · ❌ Başarısız: {{ lastResult.totalFailed }}</span>
            <span v-if="lastResult.totalSkipped"> · ⏭️ Atlandı: {{ lastResult.totalSkipped }}</span>
            <br/>
            <code class="bc-pb-id">parent: {{ lastResult.parentBroadcastId }}</code>
          </span>
          <!-- Single target -->
          <span v-else-if="lastResult.skipped">
            ⏭️ Atlandı: <code>{{ lastResult.skipped }}</code>
          </span>
          <span v-else>
            ✅ Gönderildi: <strong>{{ lastResult.sent }}</strong>
            <span v-if="lastResult.expired > 0"> · 🗑️ Süresi dolmuş: {{ lastResult.expired }}</span>
            <span v-if="lastResult.failed > 0"> · ❌ Başarısız: {{ lastResult.failed }}</span>
          </span>
        </div>
      </section>

      <footer class="bc-actions">
        <button type="button" class="bc-btn bc-btn--ghost" @click="testToMe" :disabled="isSending">
          🧪 Kendime test gönder
        </button>
        <button type="button" class="bc-btn bc-btn--primary" @click="send" :disabled="!canSend">
          <span v-if="isSending">⏳ Gönderiliyor…</span>
          <span v-else>📣 Broadcast gönder</span>
        </button>
      </footer>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- TAB 2: HISTORY                                                  -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div v-show="activeTab === 'history'">
      <!-- Filters -->
      <section class="bc-card bc-filters">
        <div class="bc-row">
          <label class="bc-label bc-label--third">
            <span>Event Key</span>
            <select v-model="filterEventKey" class="bc-input">
              <option value="">{{ t('admin.broadcast.filterAll') }}</option>
              <option v-for="k in EVENT_KEYS" :key="k.value" :value="k.value">{{ k.icon }} {{ k.label }}</option>
            </select>
          </label>
          <label class="bc-label bc-label--third">
            <span>Limit</span>
            <select v-model.number="filterLimit" class="bc-input">
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
              <option :value="200">200</option>
            </select>
          </label>
          <label class="bc-label bc-label--third">
            <span>Actor ID (admin)</span>
            <input v-model="filterActorId" class="bc-input" placeholder="admin-uuid (opsiyonel)" />
          </label>
        </div>
        <div class="bc-row">
          <label class="bc-label" style="flex: 1">
            <span>Target ID (alıcı)</span>
            <input v-model="filterTargetId" class="bc-input" placeholder="user-uuid (opsiyonel)" />
          </label>
          <div class="bc-filter-actions">
            <button class="bc-btn bc-btn--ghost" @click="clearFilters">Temizle</button>
            <button class="bc-btn bc-btn--ghost" @click="exportCsv" :disabled="isExporting" title="Broadcast geçmişini CSV olarak indir">
              {{ isExporting ? '⏳ İndiriliyor…' : '📥 CSV' }}
            </button>
            <button class="bc-btn bc-btn--primary" @click="fetchHistory" :disabled="isLoadingHistory">
              {{ isLoadingHistory ? '⏳ Yükleniyor…' : '🔄 Yenile' }}
            </button>
          </div>
        </div>

        <p v-if="historyError" class="bc-result bc-result--err">⚠️ {{ historyError }}</p>

        <!-- View mode toggle -->
        <div class="bc-mode-chips" style="margin-top: 1rem; border-bottom: none; padding-bottom: 0">
          <button class="bc-chip" :class="{ 'bc-chip--active': historyMode === 'flat' }" @click="historyMode = 'flat'" type="button">
            📋 Düz ({{ historyRows.length }} satır)
          </button>
          <button class="bc-chip" :class="{ 'bc-chip--active': historyMode === 'groups' }" @click="historyMode = 'groups'" type="button">
            📦 Gruplu ({{ broadcastGroups.length }} grup)
          </button>
        </div>

        <!-- Aggregate counters (flat = rows, groups = groups) -->
        <div v-if="historyRows.length" class="bc-stats">
          <div class="bc-stat">
            <span class="bc-stat-num">{{ historyMode === 'groups' ? groupAggregate.groupCount : historyCount }}</span>
            <span class="bc-stat-label">{{ historyMode === 'groups' ? 'Toplam Grup' : 'Toplam Broadcast' }}</span>
          </div>
          <div v-if="historyMode === 'groups'" class="bc-stat">
            <span class="bc-stat-num">{{ groupAggregate.targetCount }}</span>
            <span class="bc-stat-label">{{ t('admin.broadcast.totalRecipients') }}</span>
          </div>
          <div class="bc-stat bc-stat--ok">
            <span class="bc-stat-num">{{ historyMode === 'groups' ? groupAggregate.sent : totalSent }}</span>
            <span class="bc-stat-label">{{ t('admin.broadcast.colSent') }}</span>
          </div>
          <div class="bc-stat bc-stat--warn">
            <span class="bc-stat-num">{{ historyMode === 'groups' ? groupAggregate.expired : totalExpired }}</span>
            <span class="bc-stat-label">{{ t('admin.broadcast.colExpired') }}</span>
          </div>
          <div class="bc-stat bc-stat--err">
            <span class="bc-stat-num">{{ historyMode === 'groups' ? groupAggregate.failed : totalFailed }}</span>
            <span class="bc-stat-label">{{ t('admin.broadcast.colFailed') }}</span>
          </div>
        </div>
      </section>

      <!-- History table -->
      <section class="bc-history-table">
        <div v-if="isLoadingHistory" class="bc-empty">{{ t('admin.broadcast.historyLoading') }}</div>
        <div v-else-if="!historyRows.length" class="bc-empty">
          <p>{{ t('admin.broadcast.historyEmpty') }}</p>
          <p class="bc-empty-hint">İlk broadcast'ı Compose sekmesinden gönderin.</p>
        </div>

        <!-- FLAT mode: original row-by-row table -->
        <table v-else-if="historyMode === 'flat'" class="bc-tbl">
          <thead>
            <tr>
              <th>Saat</th>
              <th>Event</th>
              <th>Actor</th>
              <th>Target</th>
              <th>Sonuç</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in historyRows" :key="row.id">
              <td class="bc-time">{{ fmtTime(row.createdAt) }}</td>
              <td>
                <span class="bc-event-pill">
                  {{ eventIcon(row.eventKey) }} {{ row.eventKey }}
                </span>
              </td>
              <td>
                <div v-if="row.actor" class="bc-person">
                  <div class="bc-person-name">{{ row.actor.name }}</div>
                  <div class="bc-person-email">{{ row.actor.email }}</div>
                </div>
                <span v-else class="bc-muted">(silinmiş admin)</span>
              </td>
              <td>
                <div class="bc-person">
                  <div class="bc-person-name">{{ row.target.name }}</div>
                  <div class="bc-person-email">{{ row.target.email }}</div>
                </div>
              </td>
              <td>
                <div class="bc-counts">
                  <span class="bc-count bc-count--ok" v-if="row.sent > 0" :title="row.sent + ' gönderildi'">{{ row.sent }}✓</span>
                  <span class="bc-count bc-count--warn" v-if="row.expired > 0" :title="row.expired + ' süresi dolmuş'">{{ row.expired }}⏰</span>
                  <span class="bc-count bc-count--err" v-if="row.failed > 0" :title="row.failed + ' başarısız'">{{ row.failed }}✗</span>
                  <span class="bc-count bc-count--muted" v-if="row.sent + row.expired + row.failed === 0">—</span>
                </div>
              </td>
              <td class="bc-note-cell">
                <code v-if="row.note">{{ row.note }}</code>
                <span v-else class="bc-muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- GROUPS mode: collapsed multi-target broadcasts -->
        <table v-else class="bc-tbl">
          <thead>
            <tr>
              <th/>
              <th>Saat</th>
              <th>Event</th>
              <th>Actor</th>
              <th>Alıcılar</th>
              <th>Sonuç</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="g in broadcastGroups" :key="g.parentBroadcastId">
              <tr class="bc-group-row" :class="{ 'bc-group-row--expanded': expandedGroups.has(g.parentBroadcastId) }">
                <td>
                  <button
                    v-if="isMultiTarget(g)"
                    class="bc-mini"
                    @click="toggleGroup(g.parentBroadcastId)"
                    :title="expandedGroups.has(g.parentBroadcastId) ? 'Alıcıları gizle' : 'Alıcıları göster'"
                  >
                    {{ expandedGroups.has(g.parentBroadcastId) ? '▼' : '▶' }}
                  </button>
                </td>
                <td class="bc-time">{{ fmtTime(g.createdAt) }}</td>
                <td>
                  <span class="bc-event-pill">
                    {{ eventIcon(g.eventKey) }} {{ g.eventKey }}
                  </span>
                </td>
                <td>
                  <div v-if="g.actor" class="bc-person">
                    <div class="bc-person-name">{{ g.actor.name }}</div>
                    <div class="bc-person-email">{{ g.actor.email }}</div>
                  </div>
                  <span v-else class="bc-muted">(silinmiş admin)</span>
                </td>
                <td>
                  <span class="bc-target-count-pill" :class="{ 'bc-target-count-pill--multi': isMultiTarget(g) }">
                    {{ g.targetCount }} {{ isMultiTarget(g) ? 'alıcı (multi)' : 'alıcı' }}
                  </span>
                </td>
                <td>
                  <div class="bc-counts">
                    <span class="bc-count bc-count--ok" v-if="g.sent > 0" :title="g.sent + ' gönderildi'">{{ g.sent }}✓</span>
                    <span class="bc-count bc-count--warn" v-if="g.expired > 0" :title="g.expired + ' süresi dolmuş'">{{ g.expired }}⏰</span>
                    <span class="bc-count bc-count--err" v-if="g.failed > 0" :title="g.failed + ' başarısız'">{{ g.failed }}✗</span>
                    <span class="bc-count bc-count--muted" v-if="g.sent + g.expired + g.failed === 0">—</span>
                  </div>
                </td>
                <td class="bc-note-cell">
                  <code v-if="g.note">{{ g.note }}</code>
                  <span v-else class="bc-muted">—</span>
                </td>
              </tr>
              <!-- Expanded per-target rows -->
              <tr v-if="isMultiTarget(g) && expandedGroups.has(g.parentBroadcastId)" class="bc-group-expanded">
                <td colspan="7">
                  <table class="bc-tbl bc-tbl--nested">
                    <thead>
                      <tr>
                        <th>Hedef</th>
                        <th>Sonuç</th>
                        <th/>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="t in g.targets" :key="t.id">
                        <td>
                          <div class="bc-person">
                            <div class="bc-person-name">{{ t.target.name }}</div>
                            <div class="bc-person-email">{{ t.target.email }}</div>
                          </div>
                        </td>
                        <td>
                          <div class="bc-counts">
                            <span class="bc-count bc-count--ok" v-if="t.sent > 0">{{ t.sent }}✓</span>
                            <span class="bc-count bc-count--warn" v-if="t.expired > 0">{{ t.expired }}⏰</span>
                            <span class="bc-count bc-count--err" v-if="t.failed > 0">{{ t.failed }}✗</span>
                            <span class="bc-count bc-count--muted" v-if="t.sent + t.expired + t.failed === 0">—</span>
                          </div>
                        </td>
                        <td class="bc-muted" style="font-size: 0.7rem">
                          {{ t.targetId.slice(0, 12) }}…
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </section>
    </div>
  </div>
</template>

<style scoped>
.bc-view {
  padding: 1.5rem; max-width: 1200px; margin: 0 auto;
  /* 🛡️ Scroll fix — admin layout (App.vue) is 100vh flex with overflow:hidden
     on .main-content. Without our own scroll container the long Broadcast
     composer + history view gets clipped at the bottom. */
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  box-sizing: border-box;
}
.bc-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;
}
.bc-title { font-size: 1.5rem; font-weight: 600; margin: 0 0 0.25rem; }
.bc-sub { font-size: 0.85rem; opacity: 0.7; margin: 0; max-width: 700px; }
.bc-sub code { background: rgba(0,0,0,0.08); padding: 0.05rem 0.3rem; border-radius: 3px; font-size: 0.75rem; }
.bc-tag {
  background: var(--pv-red, #BC4A3C); color: #fff; padding: 0.25rem 0.6rem;
  border-radius: 6px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.5px;
}
.bc-meta { display: flex; align-items: center; gap: 12px; }
.bc-link {
  font-size: 0.8rem; font-weight: 700; color: #3b82f6; text-decoration: none;
  white-space: nowrap;
}
.bc-link:hover { text-decoration: underline; }

/* Tabs */
.bc-tabs {
  display: flex; gap: 0.25rem; margin-bottom: 1rem;
  border-bottom: 1px solid rgba(0,0,0,0.08);
}
.bc-tab {
  background: transparent; border: none;
  padding: 0.6rem 1.2rem; cursor: pointer; font-size: 0.9rem;
  font-weight: 500; color: inherit; opacity: 0.6;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: opacity 0.15s, border-color 0.15s;
  display: inline-flex; align-items: center; gap: 0.4rem;
}
.bc-tab:hover { opacity: 0.9; }
.bc-tab--active { opacity: 1; border-bottom-color: var(--pv-red, #BC4A3C); }
.bc-tab-count {
  background: var(--pv-red, #BC4A3C); color: #fff;
  font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 999px;
  font-weight: 700; min-width: 18px; text-align: center;
}

.bc-grid {
  display: grid; grid-template-columns: 1fr 1.4fr; gap: 1rem;
  margin-bottom: 1rem;
}
@media (max-width: 900px) { .bc-grid { grid-template-columns: 1fr; } }

.bc-card {
  background: var(--surface-1, rgba(255,255,255,0.02));
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 14px; padding: 1.25rem;
}
.bc-filters { margin-bottom: 1rem; }
.bc-h { font-size: 1rem; font-weight: 600; margin: 0 0 0.85rem; }
.bc-label { display: block; margin-bottom: 0.75rem; font-size: 0.85rem; }
.bc-label > span { display: block; font-weight: 500; margin-bottom: 0.3rem; opacity: 0.85; }
.bc-label--half { flex: 1; min-width: 0; }
.bc-label--third { flex: 1; min-width: 0; }
.bc-row { display: flex; gap: 0.5rem; align-items: flex-end; }
.bc-filter-actions { display: flex; gap: 0.4rem; padding-bottom: 0.75rem; }

.bc-input {
  width: 100%; padding: 0.5rem 0.75rem; border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.15); background: var(--surface-2, transparent);
  color: inherit; font-size: 0.9rem; box-sizing: border-box;
  font-family: inherit;
}
.bc-input:focus { outline: 2px solid #4f46e5; outline-offset: -2px; }
.bc-input--area { resize: vertical; min-height: 70px; }
.bc-counter {
  display: block; text-align: right; font-size: 0.7rem; opacity: 0.6; margin-top: 0.2rem;
}

/* Mode chips (single / multi / segment) */
.bc-mode-chips {
  display: flex; gap: 0.4rem; margin-bottom: 0.85rem;
  border-bottom: 1px solid rgba(0,0,0,0.06); padding-bottom: 0.85rem;
}
.bc-chip {
  flex: 1; padding: 0.4rem 0.6rem; border-radius: 8px;
  border: 1.5px solid rgba(0,0,0,0.15); background: transparent;
  cursor: pointer; font-size: 0.78rem; font-weight: 600;
  color: inherit; transition: all 0.15s;
}
.bc-chip:hover { background: rgba(0,0,0,0.04); }
.bc-chip--active {
  background: var(--pv-red, #BC4A3C); color: #fff; border-color: transparent;
}

/* Multi-user chips list */
.bc-multi-chips {
  display: flex; flex-wrap: wrap; gap: 0.4rem;
  margin-top: 0.6rem; padding: 0.5rem;
  background: rgba(0,0,0,0.03); border-radius: 8px;
  max-height: 220px; overflow-y: auto;
}
.bc-multi-chip {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.25rem 0.5rem 0.25rem 0.65rem;
  background: rgba(76, 175, 80, 0.15); border: 1px solid rgba(76, 175, 80, 0.4);
  border-radius: 999px; font-size: 0.78rem; font-weight: 500;
}
.bc-mini--inline {
  width: 18px; height: 18px; font-size: 0.65rem;
  margin: 0; padding: 0;
}
.bc-target-count {
  font-size: 0.75rem; opacity: 0.65; margin: 0.6rem 0 0;
  font-style: italic;
}
.bc-pb-id {
  display: inline-block; font-size: 0.7rem; opacity: 0.65; margin-top: 0.3rem;
  font-family: ui-monospace, monospace;
}

/* Selected user chip */
.bc-selected {
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 10px; padding: 0.75rem;
}
.bc-user { display: flex; gap: 0.75rem; align-items: center; }
.bc-avatar {
  width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.1);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 1.1rem;
}
.bc-avatar--sm { width: 32px; height: 32px; font-size: 0.85rem; }
.bc-user-info { display: flex; flex-direction: column; gap: 0.1rem; }
.bc-user-name { font-weight: 600; font-size: 0.9rem; }
.bc-user-email { font-size: 0.8rem; opacity: 0.7; }
.bc-user-role {
  font-size: 0.65rem; padding: 0.1rem 0.4rem; border-radius: 3px;
  background: rgba(0,0,0,0.08); align-self: flex-start; text-transform: uppercase;
}
.bc-mini {
  background: transparent; border: 1px solid rgba(0,0,0,0.15);
  width: 28px; height: 28px; border-radius: 6px; cursor: pointer;
  font-size: 0.85rem; color: inherit;
}
.bc-mini:hover { background: rgba(239,68,68,0.1); border-color: #ef4444; color: #ef4444; }

/* Search results */
.bc-list { list-style: none; padding: 0; margin: 0.5rem 0 0; max-height: 280px; overflow-y: auto; }
.bc-list-item {
  display: flex; gap: 0.6rem; align-items: center;
  padding: 0.5rem 0.6rem; border-radius: 8px; cursor: pointer;
  border: 1px solid rgba(0,0,0,0.05); margin-bottom: 0.3rem;
  transition: background 0.15s;
}
.bc-list-item:hover { background: rgba(0,0,0,0.04); }
.bc-list-name { font-weight: 600; font-size: 0.85rem; }
.bc-list-email { font-size: 0.75rem; opacity: 0.65; }
.bc-role-pill {
  margin-left: auto; font-size: 0.65rem; padding: 0.1rem 0.4rem;
  border-radius: 4px; background: rgba(0,0,0,0.08);
}
.bc-hint { font-size: 0.8rem; opacity: 0.65; margin: 0.4rem 0 0; }

/* Presets */
.bc-presets {
  margin-top: 0.75rem; padding: 0.6rem 0.75rem;
  background: rgba(0,0,0,0.04); border-radius: 8px;
}
.bc-presets summary { cursor: pointer; font-size: 0.85rem; font-weight: 500; user-select: none; }
.bc-preset-grid { display: grid; gap: 0.4rem; margin-top: 0.5rem; }
.bc-preset {
  text-align: left; padding: 0.5rem 0.75rem; border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px; background: transparent; cursor: pointer;
  font-size: 0.8rem; display: flex; flex-direction: column; gap: 0.15rem;
  color: inherit;
}
.bc-preset:hover { background: rgba(0,0,0,0.04); }
.bc-preset small { font-size: 0.7rem; opacity: 0.65; }

/* Result panel */
.bc-result {
  padding: 0.75rem 1rem; border-radius: 10px; margin-bottom: 1rem;
  background: rgba(76, 175, 80, 0.08); border: 1px solid rgba(76, 175, 80, 0.3);
  font-size: 0.9rem;
}
.bc-result--err { background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.3); }
.bc-result code { background: rgba(0,0,0,0.1); padding: 0.05rem 0.3rem; border-radius: 3px; font-size: 0.8rem; }

/* Actions */
.bc-actions {
  display: flex; gap: 0.75rem; justify-content: flex-end; flex-wrap: wrap;
  padding-top: 0.5rem; border-top: 1px solid rgba(0,0,0,0.08);
}
.bc-btn {
  padding: 0.7rem 1.4rem; border-radius: 10px; border: 1px solid rgba(0,0,0,0.15);
  background: var(--surface-2, rgba(255,255,255,0.05)); color: inherit;
  cursor: pointer; font-weight: 600; font-size: 0.9rem;
  transition: filter 0.15s, opacity 0.15s;
}
.bc-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.bc-btn--primary { background: var(--pv-red, #BC4A3C); color: #fff; border-color: transparent; }
.bc-btn--primary:hover:not(:disabled) { filter: brightness(1.1); }
.bc-btn--ghost { background: transparent; }

/* Stats panel */
.bc-stats {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.6rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(0,0,0,0.06);
}
.bc-stat {
  background: rgba(0,0,0,0.04); border-radius: 10px; padding: 0.7rem 0.9rem;
  display: flex; flex-direction: column; gap: 0.2rem;
  border-left: 3px solid rgba(0,0,0,0.15);
}
.bc-stat--ok   { border-left-color: #10B981; }
.bc-stat--warn { border-left-color: #F59E0B; }
.bc-stat--err  { border-left-color: #EF4444; }
.bc-stat-num { font-size: 1.4rem; font-weight: 700; }
.bc-stat-label { font-size: 0.7rem; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.5px; }

/* History table */
.bc-history-table {
  background: var(--surface-1, rgba(255,255,255,0.02));
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 14px; overflow: auto;
}
.bc-empty { text-align: center; padding: 4rem 1rem; opacity: 0.65; }
.bc-empty p { margin: 0; }
.bc-empty-hint { font-size: 0.8rem; opacity: 0.7; margin-top: 0.4rem; }

/* Groups view (collapsed multi-target broadcasts) */
.bc-group-row { cursor: default; }
.bc-group-row--expanded { background: rgba(76, 175, 80, 0.04); }
.bc-target-count-pill {
  display: inline-block; padding: 0.15rem 0.5rem;
  border-radius: 4px; background: rgba(0,0,0,0.08);
  font-size: 0.78rem; font-weight: 500;
}
.bc-target-count-pill--multi {
  background: rgba(76, 175, 80, 0.15);
  color: #10B981;
}
.bc-group-expanded td {
  padding: 0.75rem 1.5rem !important;
  background: rgba(0,0,0,0.02);
  border-bottom: 2px solid rgba(0,0,0,0.08);
}
.bc-tbl--nested {
  width: 100%; margin-top: 0.5rem;
  background: var(--surface-2, rgba(255,255,255,0.02));
  border-radius: 8px;
  overflow: hidden;
}
.bc-tbl--nested th {
  font-size: 0.65rem !important;
  padding: 0.4rem 0.7rem !important;
  background: rgba(0,0,0,0.04);
}
.bc-tbl--nested td { padding: 0.45rem 0.7rem !important; }
.bc-tbl {
  width: 100%; border-collapse: collapse;
  font-size: 0.82rem; font-family: ui-monospace, 'SF Mono', Menlo, monospace;
}
.bc-tbl th {
  text-align: left; padding: 0.6rem 0.9rem; font-size: 0.7rem;
  text-transform: uppercase; opacity: 0.6; border-bottom: 1px solid rgba(0,0,0,0.1);
  background: var(--surface-2, rgba(255,255,255,0.02));
  position: sticky; top: 0;
}
.bc-tbl td { padding: 0.55rem 0.9rem; border-bottom: 1px solid rgba(0,0,0,0.04); vertical-align: middle; }
.bc-tbl tr:hover td { background: rgba(0,0,0,0.02); }
.bc-time { white-space: nowrap; opacity: 0.75; font-size: 0.75rem; }
.bc-event-pill {
  display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px;
  background: rgba(0,0,0,0.08); font-size: 0.75rem; font-weight: 500;
}
.bc-person-name { font-weight: 600; font-size: 0.82rem; font-family: var(--font-body, inherit); }
.bc-person-email { font-size: 0.7rem; opacity: 0.6; font-family: var(--font-body, inherit); }
.bc-muted { opacity: 0.4; font-size: 0.75rem; }
.bc-counts { display: flex; gap: 0.3rem; }
.bc-count {
  display: inline-block; padding: 0.1rem 0.45rem; border-radius: 4px;
  font-size: 0.7rem; font-weight: 600; color: #fff;
}
.bc-count--ok    { background: #10B981; }
.bc-count--warn  { background: #F59E0B; }
.bc-count--err   { background: #EF4444; }
.bc-count--muted { background: rgba(0,0,0,0.15); color: inherit; }
.bc-note-cell code {
  font-size: 0.72rem; background: rgba(0,0,0,0.08);
  padding: 0.1rem 0.3rem; border-radius: 3px;
}
</style>
