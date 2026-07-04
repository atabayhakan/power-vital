<script setup lang="ts">
// AdminErrorsView — admin-only error feed.
//
// Pulls from /api/v1/client-logs/recent and lets the admin mark each
// error as resolved with an optional note. Uses ErrorBoundary so a
// broken card doesn't take down the whole page.
import { ref, reactive, onMounted } from 'vue';
import { apiGet, apiPost } from '@/api/openapi-client';
import ErrorBoundary from '../components/ErrorBoundary.vue';

interface ClientErrorRow {
  id: string;
  source: string;
  message: string;
  route: string | null;
  locale: string | null;
  userId: string | null;
  resolved: boolean;
  createdAt: string;
}

const errors = ref<ClientErrorRow[]>([]);
const isLoading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');
const includeResolved = ref(false);
const resolvingId = ref<string | null>(null);
// Keyed by row id, not a single shared ref, so typing a note in one
// row's input doesn't leak into every other row's input.
const resolveNotes = reactive<Record<string, string>>({});

const load = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  successMsg.value = '';
  try {
    const query: Record<string, string | number> = { limit: 200 };
    if (includeResolved.value) query.resolved = 'true';
    // "/client-logs/" not "/errors/": the old segment matched ad-block
    // filter-list telemetry patterns, which silently blocked these calls
    // in-browser for admins running an ad blocker (request never left the
    // machine — nothing in nginx, no visible error). Cast: the generated
    // OpenAPI path types only know the legacy /errors mount.
    const { data } = await (apiGet as any)('/api/v1/client-logs/recent', { query });
    errors.value = (data as { errors: ClientErrorRow[] }).errors;
  } catch (e: any) {
    errorMsg.value = e.response?.data?.error || 'Hata kayıtları alınamadı';
  } finally {
    isLoading.value = false;
  }
};

const fmtDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString();
  } catch { return iso; }
};

const resolve = async (id: string) => {
  resolvingId.value = id;
  errorMsg.value = '';
  successMsg.value = '';
  try {
    // The id is dynamic (route param), so the literal-path typing in
    // openapi-client can't see this specific value. We cast to `any`
    // only at the call site to keep the rest of the function strict.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (apiPost as any)(`/api/v1/client-logs/${id}/resolve`, { resolvedNote: resolveNotes[id] || undefined });
    delete resolveNotes[id];
    await load();
    successMsg.value = 'Çözüldü olarak işaretlendi.';
  } catch (e: any) {
    errorMsg.value = e.response?.data?.error || 'Çözüldü olarak işaretlenemedi';
  } finally {
    resolvingId.value = null;
  }
};

onMounted(load);
</script>

<template>
  <ErrorBoundary>
    <section class="clay-surface admin-errors">
      <header class="ae-head">
        <h2>İstemci Hata Kayıtları</h2>
        <label class="ae-toggle">
          <input type="checkbox" v-model="includeResolved" @change="load" />
          Çözülmüş olanları da göster
        </label>
        <button type="button" class="ae-btn" @click="load" :disabled="isLoading">
          {{ isLoading ? 'Yükleniyor…' : 'Yenile' }}
        </button>
      </header>

      <p v-if="errorMsg" class="ae-error">{{ errorMsg }}</p>
      <p v-if="successMsg" class="ae-success">{{ successMsg }}</p>

      <p v-if="!isLoading && errors.length === 0" class="ae-empty">
        Aktif hata kaydı yok 🎉
      </p>

      <ul v-else class="ae-list">
        <li v-for="row in errors" :key="row.id" :class="['ae-row', { 'ae-row--resolved': row.resolved }]">
          <div class="ae-row-head">
            <span :class="['ae-source', `ae-source--${row.source}`]">{{ row.source }}</span>
            <span v-if="row.route" class="ae-route">{{ row.route }}</span>
            <span v-if="row.locale" class="ae-locale">{{ row.locale }}</span>
            <time class="ae-time">{{ fmtDate(row.createdAt) }}</time>
          </div>
          <pre class="ae-message">{{ row.message }}</pre>
          <div class="ae-actions">
            <input v-model="resolveNotes[row.id]" type="text" placeholder="Çözüm notu (opsiyonel)" class="ae-note" />
            <button type="button"
                    class="ae-resolve"
                    :disabled="row.resolved || resolvingId === row.id"
                    @click="resolve(row.id)">
              {{ row.resolved ? 'Çözüldü' : 'Çözüldü olarak işaretle' }}
            </button>
          </div>
        </li>
      </ul>
    </section>
  </ErrorBoundary>
</template>

<style scoped>
.admin-errors {
  padding: 1.5rem;
  margin: 1rem;
}
.ae-head {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.ae-head h2 {
  margin: 0;
  flex: 1;
}
.ae-toggle {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.875rem;
}
.ae-btn {
  padding: 0.4rem 0.8rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
.ae-error {
  color: #b00020;
  background: #fff5f5;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}
.ae-success {
  color: #1a7a1a;
  background: #f2fbf2;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}
.ae-empty {
  color: #1a7a1a;
  text-align: center;
  padding: 1.5rem;
}
.ae-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.ae-row {
  padding: 0.75rem 1rem;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
}
.ae-row--resolved {
  opacity: 0.6;
  background: #f9f9f9;
}
.ae-row-head {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}
.ae-source {
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  background: #eee;
  font-weight: 600;
}
.ae-source--ErrorBoundary { background: #ffe6e6; color: #b00020; }
.ae-source--vue-global { background: #fff3cd; color: #856404; }
.ae-source--window-unhandledrejection { background: #f8d7da; color: #721c24; }
.ae-route {
  font-family: monospace;
  background: #f5f5f5;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}
.ae-locale { color: #555; }
.ae-time { color: #999; margin-left: auto; }
.ae-message {
  font-size: 0.875rem;
  margin: 0.5rem 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #222;
  font-family: monospace;
}
.ae-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.ae-note {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.875rem;
}
.ae-resolve {
  padding: 0.4rem 0.8rem;
  border: 1px solid #1a7a1a;
  background: #1a7a1a;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}
.ae-resolve:disabled {
  background: #aaa;
  border-color: #aaa;
  cursor: not-allowed;
}
</style>