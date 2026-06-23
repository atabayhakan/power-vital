<script setup lang="ts">
// AdminScheduledView — manage future-dated broadcast jobs.
//
// Lists pending / dispatched / cancelled / failed jobs with their
// target summary, and lets admin:
//   • Schedule a new job (POST /push/schedule)
//   • Cancel a pending job (DELETE /push/scheduled/:id)
//   • Trigger the scheduler tick immediately (POST /push/scheduled-tick)
//
// Backend: GET /push/scheduled, POST /push/schedule, DELETE /push/scheduled/:id
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { useTranslate } from '../composables/useTranslate';

const { t } = useTranslate();

type JobStatus = 'pending' | 'dispatched' | 'cancelled' | 'failed';
type TargetMode = 'single' | 'multi' | 'segment';

interface ScheduledJob {
  id: string;
  actorId: string | null;
  actor: { id: string; name: string; email: string } | null;
  note: string | null;
  status: JobStatus;
  targetMode: TargetMode;
  segmentRole: string | null;
  title: string;
  body: string;
  url: string;
  eventKey: string;
  tag: string | null;
  scheduledAt: string;
  dispatchedAt: string | null;
  cancelledAt: string | null;
  resultParentBroadcastId: string | null;
  createdAt: string;
}

// ── Compose form state ────────────────────────────────────────────────
const targetMode = ref<TargetMode>('segment');
const segmentRole = ref<string>('customer');
const title = ref('');
const body = ref('');
const url = ref('/');
const eventKey = ref('custom');
const tag = ref('');
const note = ref('');
// Local ISO string for <input type="datetime-local">.
// We add 60 seconds to satisfy the server's "at least 60s in future" rule.
const defaultScheduledAt = (): string => {
  const d = new Date(Date.now() + 5 * 60 * 1000); // 5 min from now
  // Strip seconds for nicer display
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
};
const scheduledAt = ref<string>(defaultScheduledAt());

const isSending = ref(false);
const errorMsg = ref('');
const lastResult = ref<{ id: string; targetCount: number; scheduledAt: string } | null>(null);

const canSend = computed(() => {
  if (isSending.value) return false;
  if (!title.value.trim() || !body.value.trim()) return false;
  if (!scheduledAt.value) return false;
  const t = new Date(scheduledAt.value).getTime();
  if (t <= Date.now() + 60_000) return false;  // 60s min lead
  return true;
});

// ── List state ────────────────────────────────────────────────────────
const jobs = ref<ScheduledJob[]>([]);
const isLoading = ref(false);
const filterStatus = ref<JobStatus | ''>('');
const isRunningTick = ref(false);

const fetchJobs = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const params: any = { limit: 100 };
    if (filterStatus.value) params.status = filterStatus.value;
    const res = await axios.get('/api/v1/push/scheduled', { params });
    jobs.value = res.data.rows || [];
  } catch (e: any) {
    errorMsg.value = e.response?.data?.error || 'Listesi alınamadı';
  } finally {
    isLoading.value = false;
  }
};

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
      eventKey: eventKey.value,
      tag: tag.value.trim() || undefined,
      note: note.value.trim() || undefined,
      scheduledAt: new Date(scheduledAt.value).toISOString()
    };
    if (targetMode.value === 'segment') {
      payload.role = segmentRole.value;
    }
    // (Single + multi modes can be added later via the same user picker
    //  used in AdminBroadcastView; for now we keep scheduling focused
    //  on segment sends since that's the most common operator use case.)
    const res = await axios.post('/api/v1/push/schedule', payload);
    lastResult.value = res.data;
    // Reset form
    title.value = '';
    body.value = '';
    tag.value = '';
    note.value = '';
    scheduledAt.value = defaultScheduledAt();
    fetchJobs();
  } catch (e: any) {
    errorMsg.value = e.response?.data?.error || 'Planlama başarısız';
  } finally {
    isSending.value = false;
  }
};

const cancelJob = async (id: string) => {
  if (!confirm('Bu planlı broadcast iptal edilsin mi?')) return;
  try {
    await axios.delete(`/api/v1/push/scheduled/${id}`);
    fetchJobs();
  } catch (e: any) {
    errorMsg.value = e.response?.data?.error || 'İptal başarısız';
  }
};

const runTickNow = async () => {
  if (isRunningTick.value) return;
  isRunningTick.value = true;
  try {
    await axios.post('/api/v1/push/scheduled-tick');
    await fetchJobs();
  } finally {
    isRunningTick.value = false;
  }
};

// ── Helpers ───────────────────────────────────────────────────────────
const fmtDateTime = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
};

const isPast = (iso: string): boolean => new Date(iso).getTime() < Date.now();

const statusBadge = (status: JobStatus): { label: string; cls: string } => {
  const map: Record<JobStatus, { label: string; cls: string }> = {
    pending:    { label: '⏳ Bekliyor',     cls: 'sc-pending' },
    dispatched: { label: '✅ Gönderildi',   cls: 'sc-dispatched' },
    cancelled:  { label: '❌ İptal',         cls: 'sc-cancelled' },
    failed:     { label: '⚠️ Başarısız',     cls: 'sc-failed' }
  };
  return map[status];
};

const EVENT_KEYS = [
  { value: 'custom',          label: 'Özel' },
  { value: 'order_paid',      label: 'Sipariş Ödendi' },
  { value: 'order_shipped',   label: 'Kargoda' },
  { value: 'withdrawal_approved', label: 'Çekim Onaylandı' },
  { value: 'promo',           label: 'Promosyon' }
];

onMounted(fetchJobs);
</script>

<template>
  <div class="sc-view">
    <header class="sc-head">
      <div>
        <h1 class="sc-title">{{ t('admin.scheduled.title') }}</h1>
        <p class="sc-sub">{{ t('admin.scheduled.subtitle') }}</p>
      </div>
      <div class="sc-meta">
        <button class="sc-btn sc-btn--ghost" :disabled="isRunningTick" @click="runTickNow">
          {{ isRunningTick ? '⏳ Çalışıyor…' : '⚡ Tick Now' }}
        </button>
        <button class="sc-btn sc-btn--ghost" @click="fetchJobs" :disabled="isLoading">
          🔄 Yenile
        </button>
      </div>
    </header>

    <p v-if="errorMsg" class="sc-error">⚠️ {{ errorMsg }}</p>

    <!-- Compose form -->
    <section class="sc-card">
      <h3 class="sc-h">{{ t('admin.scheduled.newJobTitle') }}</h3>

      <div class="sc-row">
        <label class="sc-label sc-label--half">
          <span>Segment (hedef rol)</span>
          <select v-model="segmentRole" class="sc-input">
            <option value="customer">👤 Tüm müşteriler</option>
            <option value="distributor">🤝 Tüm distribütörler</option>
            <option value="cashier">💵 Tüm kasiyerler</option>
            <option value="dealer">🏪 Tüm bayiler</option>
          </select>
        </label>

        <label class="sc-label sc-label--half">
          <span>Event Key</span>
          <select v-model="eventKey" class="sc-input">
            <option v-for="k in EVENT_KEYS" :key="k.value" :value="k.value">{{ k.label }}</option>
          </select>
        </label>
      </div>

      <label class="sc-label">
        <span>{{ t('admin.broadcast.fieldTitle') }}</span>
        <input v-model="title" class="sc-input" placeholder="🔔 Planlı kampanya" maxlength="80" />
      </label>

      <label class="sc-label">
        <span>Mesaj</span>
        <textarea v-model="body" class="sc-input sc-input--area" placeholder="Planlı bildirim gövdesi…" maxlength="2000" rows="2" />
      </label>

      <div class="sc-row">
        <label class="sc-label sc-label--half">
          <span>Hedef URL</span>
          <input v-model="url" class="sc-input" placeholder="/promo" />
        </label>
        <label class="sc-label sc-label--half">
          <span>Tag</span>
          <input v-model="tag" class="sc-input" placeholder="promo-q3" maxlength="40" />
        </label>
      </div>

      <div class="sc-row">
        <label class="sc-label sc-label--half">
          <span>📅 Zamanlanan Tarih (en az 1 dakika sonra)</span>
          <input v-model="scheduledAt" type="datetime-local" class="sc-input" />
        </label>
        <label class="sc-label sc-label--half">
          <span>Audit Note</span>
          <input v-model="note" class="sc-input" placeholder="Q3 promo campaign" maxlength="100" />
        </label>
      </div>

      <div v-if="lastResult" class="sc-result">
        {{ t('admin.scheduled.jobPlanned') }} <strong>{{ lastResult.id.slice(0, 8) }}…</strong>
        ({{ lastResult.targetCount }} alıcı,
        {{ fmtDateTime(lastResult.scheduledAt) }})
      </div>

      <footer class="sc-actions">
        <button class="sc-btn sc-btn--primary" :disabled="!canSend" @click="send">
          <span v-if="isSending">{{ t('admin.scheduled.scheduling') }}</span>
          <span v-else>{{ t('admin.scheduled.scheduleCta') }}</span>
        </button>
      </footer>
    </section>

    <!-- Job list -->
    <section class="sc-card">
      <div class="sc-list-header">
        <h3 class="sc-h" style="margin: 0">{{ t('admin.scheduled.jobsListTitle', { n: jobs.length }) }}</h3>
        <select v-model="filterStatus" @change="fetchJobs" class="sc-input sc-input--small">
          <option value="">Tümü</option>
          <option value="pending">⏳ Bekliyor</option>
          <option value="dispatched">✅ Gönderildi</option>
          <option value="cancelled">{{ t('admin.scheduled.colCancelled') }}</option>
          <option value="failed">⚠️ Başarısız</option>
        </select>
      </div>

      <div v-if="isLoading" class="sc-empty">{{ t('admin.scheduled.loading') }}</div>
      <div v-else-if="!jobs.length" class="sc-empty">
        <p>{{ t('admin.scheduled.empty') }}</p>
        <p class="sc-empty-hint">{{ t('admin.scheduled.emptyHint') }}</p>
      </div>
      <table v-else class="sc-tbl">
        <thead>
          <tr>
            <th>Planlanan</th>
            <th>Event</th>
            <th>Başlık</th>
            <th>Hedef</th>
            <th>Durum</th>
            <th>Admin</th>
            <th>Note</th>
            <th/>
          </tr>
        </thead>
        <tbody>
          <tr v-for="job in jobs" :key="job.id" :class="{ 'sc-row--past': isPast(job.scheduledAt) && job.status === 'pending' }">
            <td>
              <div>{{ fmtDateTime(job.scheduledAt) }}</div>
              <small v-if="isPast(job.scheduledAt) && job.status === 'pending'" class="sc-past-warning">
                ⚠️ Süresi geçmiş, bir sonraki tick'i bekliyor
              </small>
            </td>
            <td><span class="sc-event-pill">{{ job.eventKey }}</span></td>
            <td class="sc-title-cell">
              <div class="sc-job-title">{{ job.title }}</div>
              <small class="sc-job-body">{{ job.body.slice(0, 60) }}{{ job.body.length > 60 ? '…' : '' }}</small>
            </td>
            <td>
              <span class="sc-target-pill">
                {{ job.targetMode === 'segment' ? job.segmentRole : job.targetMode }}
              </span>
            </td>
            <td>
              <span class="sc-status-pill" :class="statusBadge(job.status).cls">
                {{ statusBadge(job.status).label }}
              </span>
            </td>
            <td>
              <div v-if="job.actor" class="sc-person">
                <div class="sc-person-name">{{ job.actor.name }}</div>
              </div>
              <span v-else class="sc-muted">(silinmiş)</span>
            </td>
            <td class="sc-note-cell">
              <code v-if="job.note">{{ job.note }}</code>
              <span v-else class="sc-muted">—</span>
            </td>
            <td>
              <button
                v-if="job.status === 'pending'"
                class="sc-btn sc-btn--danger sc-btn--small"
                @click="cancelJob(job.id)"
                title="İptal"
              >
                İptal
              </button>
              <router-link
                v-else-if="job.resultParentBroadcastId"
                :to="`/admin-broadcast?parent=${job.resultParentBroadcastId}`"
                class="sc-link"
              >
                Sonuç →
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.sc-view {
  padding: 1.5rem; max-width: 1200px; margin: 0 auto;
  /* 🛡️ Scroll fix — admin layout (App.vue) is 100vh flex with overflow:hidden
     on .main-content. Without our own scroll container the long scheduled
     jobs list (filters + 4 status tables) gets clipped. */
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  box-sizing: border-box;
}
.sc-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;
}
.sc-title { font-size: 1.5rem; font-weight: 600; margin: 0 0 0.25rem; }
.sc-sub { font-size: 0.85rem; opacity: 0.7; margin: 0; max-width: 700px; }
.sc-meta { display: flex; gap: 0.5rem; }

.sc-card {
  background: var(--surface-1, rgba(255,255,255,0.02));
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 14px; padding: 1.25rem; margin-bottom: 1rem;
}
.sc-h { font-size: 1rem; font-weight: 600; margin: 0 0 0.85rem; }
.sc-row { display: flex; gap: 0.5rem; }
.sc-label { display: block; margin-bottom: 0.75rem; font-size: 0.85rem; }
.sc-label > span { display: block; font-weight: 500; margin-bottom: 0.3rem; opacity: 0.85; }
.sc-label--half { flex: 1; min-width: 0; }
.sc-input {
  width: 100%; padding: 0.5rem 0.75rem; border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.15); background: var(--surface-2, transparent);
  color: inherit; font-size: 0.9rem; box-sizing: border-box; font-family: inherit;
}
.sc-input:focus { outline: 2px solid #4f46e5; outline-offset: -2px; }
.sc-input--area { resize: vertical; min-height: 60px; }
.sc-input--small { padding: 0.3rem 0.5rem; font-size: 0.8rem; max-width: 200px; }

.sc-error {
  padding: 0.75rem 1rem; border-radius: 10px; margin-bottom: 1rem;
  background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3);
  font-size: 0.9rem;
}
.sc-result {
  padding: 0.6rem 0.9rem; border-radius: 10px; margin-bottom: 1rem;
  background: rgba(76, 175, 80, 0.08); border: 1px solid rgba(76, 175, 80, 0.3);
  font-size: 0.9rem;
}
.sc-actions {
  display: flex; gap: 0.75rem; justify-content: flex-end;
  padding-top: 0.5rem; border-top: 1px solid rgba(0,0,0,0.08);
}
.sc-btn {
  padding: 0.6rem 1.2rem; border-radius: 10px; border: 1px solid rgba(0,0,0,0.15);
  background: var(--surface-2, rgba(255,255,255,0.05)); color: inherit;
  cursor: pointer; font-weight: 600; font-size: 0.9rem;
}
.sc-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.sc-btn--primary { background: var(--pv-red, #BC4A3C); color: #fff; border-color: transparent; }
.sc-btn--ghost { background: transparent; }
.sc-btn--danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239, 68, 68, 0.4); }
.sc-btn--small { padding: 0.3rem 0.7rem; font-size: 0.78rem; }

.sc-list-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 0.85rem;
}

.sc-empty { text-align: center; padding: 4rem 1rem; opacity: 0.65; }
.sc-empty p { margin: 0; }
.sc-empty-hint { font-size: 0.8rem; opacity: 0.7; margin-top: 0.4rem; }

.sc-tbl { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.sc-tbl th {
  text-align: left; padding: 0.5rem 0.7rem; font-size: 0.7rem;
  text-transform: uppercase; opacity: 0.6; border-bottom: 1px solid rgba(0,0,0,0.1);
}
.sc-tbl td { padding: 0.6rem 0.7rem; border-bottom: 1px solid rgba(0,0,0,0.04); vertical-align: top; }
.sc-tbl tr:hover td { background: rgba(0,0,0,0.02); }
.sc-row--past { background: rgba(245, 158, 11, 0.05); }
.sc-past-warning { color: #F59E0B; font-size: 0.7rem; display: block; margin-top: 0.2rem; }
.sc-event-pill {
  display: inline-block; padding: 0.1rem 0.5rem; border-radius: 4px;
  background: rgba(0,0,0,0.08); font-size: 0.78rem;
}
.sc-target-pill {
  display: inline-block; padding: 0.1rem 0.5rem; border-radius: 4px;
  background: rgba(76, 175, 80, 0.15); color: #10B981; font-size: 0.78rem;
}
.sc-status-pill {
  display: inline-block; padding: 0.2rem 0.6rem; border-radius: 12px;
  font-size: 0.72rem; font-weight: 600; white-space: nowrap;
}
.sc-pending    { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
.sc-dispatched { background: rgba(16, 185, 129, 0.15); color: #10B981; }
.sc-cancelled  { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.sc-failed     { background: rgba(245, 158, 11, 0.2); color: #b45309; }

.sc-title-cell { max-width: 280px; }
.sc-job-title { font-weight: 600; }
.sc-job-body { font-size: 0.7rem; opacity: 0.6; display: block; margin-top: 0.15rem; }
.sc-person-name { font-weight: 500; font-size: 0.85rem; }
.sc-note-cell code { font-size: 0.72rem; background: rgba(0,0,0,0.08); padding: 0.1rem 0.3rem; border-radius: 3px; }
.sc-muted { opacity: 0.45; font-size: 0.78rem; }
.sc-link { color: var(--pv-red, #BC4A3C); font-weight: 600; font-size: 0.85rem; text-decoration: none; }
.sc-link:hover { text-decoration: underline; }
</style>
