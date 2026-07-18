<script setup lang="ts">
// SupportInboxView — admin triage inbox for ContactMessage rows.
// Close sibling of AdminErrorsView (per-row note map, in-place row patching
// so one action doesn't refetch the whole page) + FinancePayoutsView table UX.
import { computed, onMounted, reactive, ref } from 'vue';
import { apiGet, apiPut } from '@/api/openapi-client';
import type { components } from '../api/types';
import { useTranslate } from '../composables/useTranslate';

type ContactMessage = components['schemas']['AdminContactMessage'];
type InboxEnvelope = components['schemas']['PaginationEnvelope<AdminContactMessage>'];
type StatusFilter = 'new' | 'read' | 'resolved' | 'all';

const { t, locale } = useTranslate();

const LIMIT = 10;
const items = ref<ContactMessage[]>([]);
const total = ref(0);
const page = ref(1);
const hasMore = ref(false);
const isLoading = ref(true);
const loadError = ref('');
const filter = ref<StatusFilter>('new');

const expandedId = ref<string | null>(null);
const busyId = ref<string | null>(null);
const actionError = ref('');
// Satır bazlı not haritası — bir satıra yazarken diğerleri etkilenmez
const noteDrafts = reactive<Record<string, string>>({});
const noteSavedId = ref<string | null>(null);

const pages = computed(() => Math.max(1, Math.ceil(total.value / LIMIT)));

const dateLocaleMap: Record<string, string> = { tr: 'tr-TR', ru: 'ru-RU', kg: 'ru-RU' };
const fmtDate = (d?: string) => d
  ? new Date(d).toLocaleString(dateLocaleMap[locale.value] || 'tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '';

const fetchMessages = async (p = page.value) => {
  isLoading.value = true;
  loadError.value = '';
  try {
    const query: { page: number; limit: number; status?: 'new' | 'read' | 'resolved' } = { page: p, limit: LIMIT };
    if (filter.value !== 'all') query.status = filter.value;
    const r = await apiGet('/api/v1/admin/contact-messages', { query });
    const data = r.data as unknown as InboxEnvelope;
    items.value = data.items;
    total.value = data.total;
    page.value = data.page;
    hasMore.value = data.hasMore;
  } catch (err: any) {
    loadError.value = err?.response?.data?.error || t('inbox.loadError');
  } finally {
    isLoading.value = false;
  }
};

const setFilter = (f: StatusFilter) => {
  if (filter.value === f) return;
  filter.value = f;
  expandedId.value = null;
  fetchMessages(1);
};

const toggleExpand = (m: ContactMessage) => {
  expandedId.value = expandedId.value === m.id ? null : (m.id || null);
  if (expandedId.value && m.id && noteDrafts[m.id] === undefined) {
    noteDrafts[m.id] = m.adminNote || '';
  }
};

// 🚀 Yerinde yama: tek satır güncellenir, tüm tablo yeniden çekilmez
const patchRow = (updated: ContactMessage) => {
  const i = items.value.findIndex(x => x.id === updated.id);
  if (i >= 0) items.value[i] = updated;
};

const setStatus = async (m: ContactMessage, status: 'new' | 'read' | 'resolved') => {
  if (!m.id) return;
  busyId.value = m.id;
  actionError.value = '';
  try {
    const r = await apiPut(`/api/v1/admin/contact-messages/${m.id}` as '/api/v1/admin/contact-messages/{id}', { status });
    patchRow(r.data as unknown as ContactMessage);
    // Aktif filtreden düşen satırlar listeden kalksın (örn. "Yeni" sekmesinde okundu yapılan)
    if (filter.value !== 'all' && status !== filter.value) {
      await fetchMessages();
    }
  } catch (err: any) {
    actionError.value = err?.response?.data?.error || t('inbox.actionError');
  } finally {
    busyId.value = null;
  }
};

const saveNote = async (m: ContactMessage) => {
  if (!m.id) return;
  busyId.value = m.id;
  actionError.value = '';
  noteSavedId.value = null;
  try {
    const draft = noteDrafts[m.id] ?? '';
    const r = await apiPut(`/api/v1/admin/contact-messages/${m.id}` as '/api/v1/admin/contact-messages/{id}', { adminNote: draft.trim() || null });
    patchRow(r.data as unknown as ContactMessage);
    noteSavedId.value = m.id;
    setTimeout(() => { if (noteSavedId.value === m.id) noteSavedId.value = null; }, 2500);
  } catch (err: any) {
    actionError.value = err?.response?.data?.error || t('inbox.actionError');
  } finally {
    busyId.value = null;
  }
};

const statusLabel = (s?: string) => {
  if (s === 'read') return t('inbox.statusRead');
  if (s === 'resolved') return t('inbox.statusResolved');
  return t('inbox.statusNew');
};

const messagePreview = (text?: string) => {
  const v = (text || '').replace(/\s+/g, ' ').trim();
  return v.length > 90 ? v.slice(0, 90) + '…' : v;
};

onMounted(() => fetchMessages(1));
</script>

<template>
  <div class="sib animate-fade-in">
    <header class="sib-head">
      <div>
        <h2 class="sib-title">🎧 {{ t('inbox.title') }}</h2>
        <p class="sib-sub">{{ t('inbox.subtitle') }}</p>
      </div>
      <button class="sib-btn sib-btn--ghost" :disabled="isLoading" @click="fetchMessages()">
        🔄 {{ t('inbox.refresh') }}
      </button>
    </header>

    <!-- Durum filtre sekmeleri -->
    <div class="sib-tabs">
      <button
        v-for="f in (['new', 'read', 'resolved', 'all'] as StatusFilter[])"
        :key="f"
        class="sib-tab"
        :class="{ 'is-active': filter === f }"
        @click="setFilter(f)"
      >
        {{ t(`inbox.tab_${f}`) }}
      </button>
      <span class="sib-total">{{ t('inbox.totalInfo', { total }) }}</span>
    </div>

    <p v-if="actionError" class="sib-error">{{ actionError }}</p>

    <div class="sib-panel">
      <div v-if="isLoading" class="sib-state">{{ t('inbox.loading') }}</div>
      <div v-else-if="loadError" class="sib-state sib-state--error">
        <span>{{ loadError }}</span>
        <button class="sib-btn sib-btn--ghost" @click="fetchMessages()">{{ t('inbox.refresh') }}</button>
      </div>
      <div v-else-if="items.length === 0" class="sib-state">
        <div class="sib-state__icon">📭</div>
        <p>{{ t('inbox.empty') }}</p>
      </div>

      <template v-else>
        <table class="sib-table">
          <thead>
            <tr>
              <th>{{ t('inbox.colDate') }}</th>
              <th>{{ t('inbox.colFrom') }}</th>
              <th>{{ t('inbox.colSource') }}</th>
              <th>{{ t('inbox.colSubject') }}</th>
              <th>{{ t('inbox.colMessage') }}</th>
              <th>{{ t('inbox.colStatus') }}</th>
              <th>{{ t('inbox.colActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="m in items" :key="m.id">
              <tr class="sib-row" :class="{ 'is-expanded': expandedId === m.id }">
                <td class="sib-date">{{ fmtDate(m.createdAt) }}</td>
                <td>
                  <div class="sib-from">
                    <span class="sib-from__name">{{ m.user?.name || m.name || t('inbox.guest') }}</span>
                    <span class="sib-from__email">{{ m.user?.email || m.email || '—' }}</span>
                  </div>
                </td>
                <td>
                  <span class="sib-source" :class="`sib-source--${m.source}`">
                    {{ m.source === 'support' ? t('inbox.sourceSupport') : t('inbox.sourceContact') }}
                  </span>
                </td>
                <td class="sib-subject">{{ m.subject || '—' }}</td>
                <td class="sib-preview">{{ messagePreview(m.message) }}</td>
                <td>
                  <span class="sib-badge" :class="`sib-badge--${m.status}`">{{ statusLabel(m.status) }}</span>
                </td>
                <td class="sib-actions">
                  <button class="sib-btn sib-btn--ghost" @click="toggleExpand(m)">
                    {{ expandedId === m.id ? t('inbox.close') : t('inbox.expand') }}
                  </button>
                  <button
                    v-if="m.status === 'new'"
                    class="sib-btn sib-btn--info"
                    :disabled="busyId === m.id"
                    @click="setStatus(m, 'read')"
                  >{{ t('inbox.markRead') }}</button>
                  <button
                    v-if="m.status !== 'resolved'"
                    class="sib-btn sib-btn--success"
                    :disabled="busyId === m.id"
                    @click="setStatus(m, 'resolved')"
                  >{{ t('inbox.markResolved') }}</button>
                  <button
                    v-if="m.status === 'resolved'"
                    class="sib-btn sib-btn--warn"
                    :disabled="busyId === m.id"
                    @click="setStatus(m, 'new')"
                  >{{ t('inbox.reopen') }}</button>
                </td>
              </tr>

              <!-- Genişleyen detay satırı -->
              <tr v-if="expandedId === m.id" class="sib-detail">
                <td colspan="7">
                  <div class="sib-detail__grid">
                    <div class="sib-detail__block">
                      <h4>{{ t('inbox.messageLabel') }}</h4>
                      <p class="sib-detail__message">{{ m.message }}</p>
                    </div>
                    <div class="sib-detail__block">
                      <h4>{{ t('inbox.contactInfoLabel') }}</h4>
                      <dl class="sib-kv">
                        <div v-if="m.name"><dt>{{ t('inbox.colFrom') }}</dt><dd>{{ m.name }}</dd></div>
                        <div v-if="m.email"><dt>E-posta</dt><dd>{{ m.email }}</dd></div>
                        <div v-if="m.phone"><dt>{{ t('inbox.phoneLabel') }}</dt><dd>{{ m.phone }}</dd></div>
                        <div v-if="m.locale"><dt>{{ t('inbox.localeLabel') }}</dt><dd>{{ m.locale }}</dd></div>
                        <div v-if="m.userId"><dt>{{ t('inbox.userIdLabel') }}</dt><dd><code>{{ m.userId }}</code></dd></div>
                      </dl>
                    </div>
                    <div class="sib-detail__block sib-detail__block--note">
                      <h4>{{ t('inbox.noteLabel') }}</h4>
                      <textarea
                        v-model="noteDrafts[m.id!]"
                        class="sib-note"
                        rows="3"
                        maxlength="2000"
                        :placeholder="t('inbox.notePlaceholder')"
                      />
                      <div class="sib-note__row">
                        <button class="sib-btn sib-btn--primary" :disabled="busyId === m.id" @click="saveNote(m)">
                          {{ t('inbox.noteSave') }}
                        </button>
                        <span v-if="noteSavedId === m.id" class="sib-note__saved">✓ {{ t('inbox.noteSaved') }}</span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <div v-if="pages > 1" class="sib-pager">
          <button class="sib-btn sib-btn--ghost" :disabled="page <= 1 || isLoading" @click="fetchMessages(page - 1)">
            {{ t('inbox.prev') }}
          </button>
          <span class="sib-pager__info">{{ t('inbox.pageInfo', { page, pages }) }}</span>
          <button class="sib-btn sib-btn--ghost" :disabled="!hasMore || isLoading" @click="fetchMessages(page + 1)">
            {{ t('inbox.next') }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.sib { padding: 32px; display: flex; flex-direction: column; gap: 18px; overflow-y: auto; font-family: 'Inter', system-ui, sans-serif; }

.sib-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.sib-title { font-family: 'Outfit', sans-serif; font-size: 1.35rem; font-weight: 800; margin: 0 0 4px; color: var(--color-text-main, #18181b); }
.sib-sub { margin: 0; font-size: 0.85rem; color: var(--color-text-muted, #a1a1aa); }

.sib-tabs { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.sib-tab { padding: 8px 16px; border-radius: 100px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: var(--color-text-muted, #a1a1aa); font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 0.82rem; cursor: pointer; transition: all 0.15s; }
.sib-tab:hover { border-color: #BC4A3C; color: #fff; }
.sib-tab.is-active { background: linear-gradient(135deg, #D4665A, #BC4A3C); border-color: transparent; color: #fff; }
.sib-total { margin-left: auto; font-size: 0.8rem; color: var(--color-text-muted, #a1a1aa); }

.sib-error { margin: 0; padding: 10px 14px; border-radius: 10px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 0.85rem; }

.sib-panel { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 18px; }
.sib-state { text-align: center; padding: 48px 16px; color: var(--color-text-muted, #a1a1aa); font-size: 0.9rem; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.sib-state--error { color: #ef4444; }
.sib-state__icon { font-size: 42px; opacity: 0.5; }
.sib-state p { margin: 0; }

.sib-table { width: 100%; border-collapse: collapse; }
.sib-table th { text-align: left; padding: 10px 12px; color: var(--color-text-muted, #a1a1aa); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.sib-table td { padding: 12px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: top; }
.sib-row:hover { background: rgba(255,255,255,0.02); }
.sib-row.is-expanded { background: rgba(188,74,60,0.05); }
.sib-date { white-space: nowrap; color: var(--color-text-muted, #a1a1aa); font-size: 12px; }

.sib-from { display: flex; flex-direction: column; }
.sib-from__name { font-weight: 600; color: var(--color-text-main, #e4e4e7); }
.sib-from__email { font-size: 11px; color: var(--color-text-muted, #a1a1aa); }

.sib-source { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.sib-source--contact { background: rgba(59,130,246,0.12); color: #60a5fa; }
.sib-source--support { background: rgba(168,85,247,0.12); color: #c084fc; }

.sib-subject { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sib-preview { max-width: 260px; color: var(--color-text-muted, #a1a1aa); font-size: 12px; }

.sib-badge { display: inline-block; padding: 4px 11px; border-radius: 100px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.sib-badge--new { background: rgba(245,158,11,0.12); color: #f59e0b; }
.sib-badge--read { background: rgba(59,130,246,0.12); color: #60a5fa; }
.sib-badge--resolved { background: rgba(16,185,129,0.12); color: #10b981; }

.sib-actions { white-space: nowrap; }
.sib-btn { padding: 7px 12px; border-radius: 8px; cursor: pointer; border: none; font-size: 12px; font-weight: 700; font-family: 'Outfit', sans-serif; margin: 0 4px 4px 0; transition: all 0.15s; }
.sib-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.sib-btn--ghost { background: rgba(255,255,255,0.05); color: var(--color-text-muted, #a1a1aa); border: 1px solid rgba(255,255,255,0.1); }
.sib-btn--ghost:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: #fff; }
.sib-btn--info { background: rgba(59,130,246,0.12); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); }
.sib-btn--info:hover:not(:disabled) { background: rgba(59,130,246,0.2); }
.sib-btn--success { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
.sib-btn--success:hover:not(:disabled) { background: rgba(16,185,129,0.2); }
.sib-btn--warn { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
.sib-btn--warn:hover:not(:disabled) { background: rgba(245,158,11,0.2); }
.sib-btn--primary { background: linear-gradient(135deg, #D4665A, #BC4A3C); color: #fff; }
.sib-btn--primary:hover:not(:disabled) { filter: brightness(1.08); }

.sib-detail td { background: rgba(188,74,60,0.03); border-bottom: 1px solid rgba(255,255,255,0.06); }
.sib-detail__grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 20px; padding: 8px 4px; }
.sib-detail__block h4 { margin: 0 0 10px; font-family: 'Outfit', sans-serif; font-size: 0.78rem; font-weight: 800; color: var(--color-text-muted, #a1a1aa); text-transform: uppercase; letter-spacing: 0.5px; }
.sib-detail__message { margin: 0; font-size: 0.9rem; line-height: 1.6; color: var(--color-text-main, #e4e4e7); white-space: pre-wrap; word-break: break-word; }

.sib-kv { margin: 0; display: flex; flex-direction: column; gap: 8px; }
.sib-kv div { display: flex; gap: 8px; font-size: 0.84rem; }
.sib-kv dt { color: var(--color-text-muted, #a1a1aa); min-width: 86px; font-weight: 600; }
.sib-kv dd { margin: 0; color: var(--color-text-main, #e4e4e7); word-break: break-all; }
.sib-kv code { font-size: 0.76rem; background: rgba(0,0,0,0.25); padding: 2px 6px; border-radius: 5px; }

.sib-note { width: 100%; padding: 10px 12px; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; background: rgba(0,0,0,0.2); color: var(--color-text-main, #e4e4e7); font-family: 'Inter', sans-serif; font-size: 0.86rem; resize: vertical; box-sizing: border-box; }
.sib-note:focus { outline: none; border-color: #BC4A3C; }
.sib-note__row { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
.sib-note__saved { font-size: 0.8rem; font-weight: 700; color: #10b981; }

.sib-pager { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 16px; padding-top: 14px; border-top: 1px dashed rgba(255,255,255,0.08); }
.sib-pager__info { font-size: 0.82rem; font-weight: 600; color: var(--color-text-muted, #a1a1aa); }

@media (max-width: 1100px) {
  .sib-detail__grid { grid-template-columns: 1fr; }
  .sib-preview { max-width: 140px; }
}
</style>
