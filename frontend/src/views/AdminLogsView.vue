<script setup lang="ts">
// AdminLogsView — live tail of the structured (pino) log file.
//
// Polls /api/v1/admin/logs every 5s with the current filter set.
// Supports level-filter, substring search, and expandable JSON rows
// (for inspecting requestId, err, userId, route, etc.).
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { apiGet } from '@/api/openapi-client';
import { useTranslate } from '../composables/useTranslate';

const { t } = useTranslate();

interface LogEntry {
  ts: number;
  level: string;
  msg: string;
  raw: string;
  requestId?: string;
  userId?: string;
  route?: string;
  err?: string;
  errStack?: string;
  [k: string]: unknown;
}

const logs = ref<LogEntry[]>([]);
const isLoading = ref(false);
const errorMsg = ref('');
const lastUpdated = ref<Date | null>(null);

const level = ref<string>(''); // '' = no filter
const query = ref<string>('');
const expanded = ref<Set<number>>(new Set());

// Local "high-water mark" — we send `since=lastTs+1` so each poll only
// fetches new lines. On the first poll since=0 (give me the last 200).
const lastTs = ref<number>(0);

const LEVELS: Array<{ v: string; label: string; color: string }> = [
  { v: '',      label: 'Tümü',   color: '#94a3b8' },
  { v: 'debug', label: 'Debug',  color: '#94a3b8' },
  { v: 'info',  label: 'Info',   color: '#3b82f6' },
  { v: 'warn',  label: 'Warn',   color: '#f59e0b' },
  { v: 'error', label: 'Error',  color: '#ef4444' },
  { v: 'fatal', label: 'Fatal',  color: '#dc2626' }
];

const levelColor = (l: string): string => {
  return LEVELS.find(x => x.v === l)?.color ?? '#94a3b8';
};

const fmtTime = (ts: number): string => {
  if (!ts) return '—';
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
};

const refresh = async () => {
  isLoading.value = true;
  try {
    const params: Record<string, string | number> = { limit: 200 };
    if (level.value) params.level = level.value;
    if (query.value) params.q = query.value;
    if (lastTs.value) params.since = lastTs.value;
    const { data } = await apiGet('/api/v1/admin/logs', { query: params });
    // New entries first (server returns chronological — reverse for display)
    const fresh = ((data as unknown as { logs?: LogEntry[] }).logs || []).slice().reverse();
    if (fresh.length) {
      logs.value = [...fresh, ...logs.value].slice(0, 500);
      const newest = fresh[fresh.length - 1];
      if (newest?.ts) lastTs.value = newest.ts;
    }
    errorMsg.value = '';
    lastUpdated.value = new Date();
  } catch (e: any) {
    errorMsg.value = e.response?.data?.error || 'Loglar alınamadı';
  } finally {
    isLoading.value = false;
  }
};

const toggleExpand = (idx: number) => {
  if (expanded.value.has(idx)) expanded.value.delete(idx);
  else expanded.value.add(idx);
  // Trigger reactivity (Set is reactive but Vue's reactivity needs trigger)
  expanded.value = new Set(expanded.value);
};

const copyRow = async (row: LogEntry) => {
  try {
    await navigator.clipboard.writeText(row.raw);
  } catch { /* clipboard not available */ }
};

const clearFilters = () => {
  level.value = '';
  query.value = '';
  lastTs.value = 0;
  refresh();
};

const filtered = computed(() => {
  // The server already filters, but if the user changes the search
  // client-side we re-apply to avoid a round-trip per keystroke.
  let list = logs.value;
  if (level.value) list = list.filter(l => l.level === level.value);
  if (query.value) {
    const q = query.value.toLowerCase();
    list = list.filter(l =>
      (l.msg || '').toLowerCase().includes(q) ||
      (l.requestId || '').toLowerCase().includes(q) ||
      (l.route || '').toLowerCase().includes(q) ||
      (l.userId || '').toLowerCase().includes(q) ||
      (l.err || '').toLowerCase().includes(q)
    );
  }
  return list;
});

let pollHandle: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  refresh();
  pollHandle = setInterval(refresh, 5000);
});
onUnmounted(() => {
  if (pollHandle) clearInterval(pollHandle);
});
</script>

<template>
  <div class="log-view">
    <header class="lv-head">
      <div>
        <h1 class="lv-title">{{ t('admin.logs.title') }}</h1>
        <p class="lv-sub">{{ t('admin.logs.subtitle') }}</p>
      </div>
      <div class="lv-meta" v-if="lastUpdated">
        Son yenileme: <strong>{{ lastUpdated.toLocaleTimeString() }}</strong>
        <span v-if="isLoading" class="lv-spinner">↻</span>
      </div>
    </header>

    <!-- Filters -->
    <div class="lv-filters">
      <div class="lv-chips">
        <button
          v-for="l in LEVELS"
          :key="l.v"
          class="lv-chip"
          :class="{ 'lv-chip--active': level === l.v }"
          :style="level === l.v ? { background: l.color, color: '#fff', borderColor: l.color } : { borderColor: l.color, color: l.color }"
          @click="level = l.v; refresh()"
        >
          {{ l.label }}
        </button>
      </div>
      <div class="lv-search">
        <input
          v-model="query"
          @keyup.enter="refresh"
          placeholder="🔍 msg / requestId / route / err içinde ara…"
          class="lv-input"
        />
        <button class="lv-btn" @click="refresh">Ara</button>
        <button class="lv-btn lv-btn--ghost" @click="clearFilters">Temizle</button>
      </div>
    </div>

    <p v-if="errorMsg" class="lv-error">
      ⚠️ {{ errorMsg }}
    </p>

    <!-- Log table -->
    <div class="lv-table-wrap">
      <table v-if="filtered.length" class="lv-table">
        <thead>
          <tr>
            <th>Saat</th>
            <th>Seviye</th>
            <th>Mesaj</th>
            <th>Request</th>
            <th>User</th>
            <th/>
          </tr>
        </thead>
        <tbody>
          <template v-for="(row, i) in filtered" :key="row.ts + '_' + i">
            <tr :class="{ 'lv-row--error': row.level === 'error' || row.level === 'fatal', 'lv-row--warn': row.level === 'warn' }">
              <td class="lv-time">{{ fmtTime(row.ts) }}</td>
              <td>
                <span class="lv-level" :style="{ background: levelColor(row.level) }">{{ row.level }}</span>
              </td>
              <td class="lv-msg">{{ row.msg }}</td>
              <td class="lv-meta-cell">
                <code v-if="row.requestId">{{ row.requestId.slice(0, 8) }}</code>
                <code v-else-if="row.route">{{ row.route }}</code>
              </td>
              <td class="lv-meta-cell">
                <code v-if="row.userId">{{ row.userId.slice(0, 8) }}</code>
              </td>
              <td class="lv-actions">
                <button class="lv-mini" @click="toggleExpand(i)">
                  {{ expanded.has(i) ? '▲' : '▼' }}
                </button>
                <button class="lv-mini" @click="copyRow(row)" title="Kopya">⧉</button>
              </td>
            </tr>
            <tr v-if="expanded.has(i)" class="lv-expanded">
              <td colspan="6">
                <pre class="lv-json">{{ JSON.stringify(row, null, 2) }}</pre>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <div v-else class="lv-empty">
        <p>Henüz log yok</p>
        <p class="lv-empty-hint">Sunucu etkinlikleri burada görünecek (5s gecikmeyle)</p>
      </div>
    </div>

    <p v-if="filtered.length" class="lv-count">
      {{ filtered.length }} log (max 500 bellekte)
    </p>
  </div>
</template>

<style scoped>
.log-view {
  padding: 1.5rem; max-width: 1400px; margin: 0 auto;
  /* 🛡️ Scroll fix — admin layout (App.vue) is 100vh flex with overflow:hidden
     on .main-content. Without our own scroll container the live log tail
     gets clipped at the bottom and you can't see new errors. */
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  box-sizing: border-box;
}
.lv-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;
}
.lv-title { font-size: 1.5rem; font-weight: 600; margin: 0 0 0.25rem; }
.lv-sub { font-size: 0.85rem; opacity: 0.7; margin: 0; max-width: 700px; }
.lv-meta { font-size: 0.8rem; opacity: 0.75; display: flex; align-items: center; gap: 0.4rem; }
.lv-spinner { display: inline-block; animation: lv-spin 1s linear infinite; }
@keyframes lv-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.lv-filters {
  display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center;
}
.lv-chips { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.lv-chip {
  padding: 0.3rem 0.8rem; border-radius: 999px; border: 1.5px solid;
  background: transparent; cursor: pointer; font-size: 0.8rem; font-weight: 500;
  transition: all 0.15s ease;
}
.lv-chip--active { color: #fff !important; }
.lv-search { display: flex; gap: 0.4rem; flex: 1; min-width: 300px; }
.lv-input {
  flex: 1; padding: 0.4rem 0.75rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.15);
  background: var(--surface-1, transparent); color: inherit; font-size: 0.85rem;
}
.lv-input:focus { outline: 2px solid #4f46e5; outline-offset: -2px; }
.lv-btn {
  padding: 0.4rem 0.9rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.15);
  background: var(--surface-2, rgba(255,255,255,0.04)); color: inherit; cursor: pointer;
  font-size: 0.85rem;
}
.lv-btn:hover { background: rgba(0,0,0,0.06); }
.lv-btn--ghost { background: transparent; }

.lv-error {
  color: #ef4444; background: rgba(239,68,68,0.1);
  padding: 0.6rem 0.9rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 0.75rem;
}

.lv-table-wrap {
  background: var(--surface-1, transparent); border-radius: 12px; overflow: auto;
  border: 1px solid rgba(0,0,0,0.06);
}
.lv-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; font-family: ui-monospace, 'SF Mono', Menlo, monospace; }
.lv-table th {
  text-align: left; padding: 0.5rem 0.9rem; font-size: 0.7rem; text-transform: uppercase;
  opacity: 0.6; border-bottom: 1px solid rgba(0,0,0,0.1); position: sticky; top: 0;
  background: var(--surface-1, #fff);
}
.lv-table td { padding: 0.45rem 0.9rem; border-bottom: 1px solid rgba(0,0,0,0.04); vertical-align: top; }
.lv-time { white-space: nowrap; opacity: 0.7; font-size: 0.75rem; }
.lv-level {
  display: inline-block; padding: 0.1rem 0.5rem; border-radius: 4px;
  font-size: 0.7rem; font-weight: 600; color: #fff; text-transform: uppercase;
}
.lv-msg { word-break: break-word; }
.lv-meta-cell { font-size: 0.75rem; opacity: 0.85; }
.lv-meta-cell code { background: rgba(0,0,0,0.08); padding: 0.1rem 0.3rem; border-radius: 3px; }
.lv-row--error td { background: rgba(239,68,68,0.06); }
.lv-row--warn td { background: rgba(245,158,11,0.06); }
.lv-actions { text-align: right; white-space: nowrap; }
.lv-mini {
  background: transparent; border: 1px solid rgba(0,0,0,0.1);
  width: 24px; height: 24px; border-radius: 4px; cursor: pointer;
  font-size: 0.7rem; color: inherit; margin-left: 0.2rem;
}
.lv-mini:hover { background: rgba(0,0,0,0.06); }
.lv-expanded { background: rgba(0,0,0,0.03); }
.lv-json {
  font-size: 0.75rem; padding: 0.75rem; margin: 0;
  background: rgba(0,0,0,0.05); border-radius: 6px;
  overflow-x: auto; max-height: 320px;
}
.lv-empty { text-align: center; padding: 4rem 1rem; opacity: 0.7; }
.lv-empty-hint { font-size: 0.8rem; opacity: 0.7; margin-top: 0.4rem; }

.lv-count { font-size: 0.75rem; opacity: 0.5; margin-top: 0.75rem; text-align: right; }
</style>
