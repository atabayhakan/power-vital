<script setup lang="ts">
// ImpersonationSessionsModal — audit log of recent impersonation sessions
// for the current admin. Cursor-paginated so an admin who impersonates
// dozens of users per week can scroll back through months of history.
//
// Why a modal and not a dedicated route?
//   • The admin who needs this is currently impersonating (or just
//     stopped) and wants a glanceable history — not a full page reload.
//   • It's a small focused view; a dedicated /admin/impersonation/sessions
//     route is overkill.

import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiGet } from '@/api/openapi-client';
import { useCursorPagination } from '../../composables/useCursorPagination';

const { t } = useI18n();

interface Session {
  id: string;
  adminId: string;
  targetId: string;
  startedAt: string;
  endedAt: string | null;
  expiresAt: string;
  reason?: string;
  target?: { id: string; name: string; email: string; role: string };
}

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const list = useCursorPagination<Session>({
  fetcher: async (params) => {
    const { data } = await apiGet('/api/v1/admin/impersonation/sessions', { query: params });
    return data as unknown as { items: Session[]; nextCursor: string | null; hasMore: boolean };
  },
  limit: 20
});

const refresh = () => list.reset();

// Load the first page whenever the modal opens.
const wasOpen = ref(false);
if (props.open && !wasOpen.value) {
  wasOpen.value = true;
  list.loadFirst();
}
// Watcher so opening the modal later also fires a fresh fetch.
watch(() => props.open, (v) => {
  if (v) list.loadFirst();
});

const fmtDate = (iso: string) => new Date(iso).toLocaleString('tr-TR');
const fmtDuration = (startIso: string, endIso: string | null) => {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const ms = Math.max(0, end - start);
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return '< 1 dk';
  if (mins < 60) return `${mins} dk`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} sa ${mins % 60} dk`;
};

const visibleItems = computed(() => list.items.value);
</script>

<template>
  <Transition name="imp-modal-fade">
    <div v-if="open" class="imp-modal-backdrop" @click.self="emit('close')">
      <div class="imp-modal" role="dialog" aria-modal="true" :aria-label="t('admin.impersonation.sessionsTitle')">
        <header class="imp-modal__head">
          <h2 class="imp-modal__title">📜 {{ t('admin.impersonation.sessionsTitle') }}</h2>
          <button class="imp-modal__close" @click="emit('close')" aria-label="Close">×</button>
        </header>

        <div class="imp-modal__body">
          <div v-if="list.loading.value && list.items.value.length === 0" class="imp-modal__empty">
            ⏳ {{ t('common.loading') }}
          </div>

          <div v-else-if="list.error.value" class="imp-modal__empty imp-modal__error">
            ❌ {{ list.error.value }}
          </div>

          <div v-else-if="visibleItems.length === 0" class="imp-modal__empty">
            {{ t('admin.impersonation.noSessions') }}
          </div>

          <table v-else class="imp-table">
            <thead>
              <tr>
                <th>{{ t('admin.impersonation.colTarget') }}</th>
                <th>{{ t('admin.impersonation.colStarted') }}</th>
                <th>{{ t('admin.impersonation.colDuration') }}</th>
                <th>{{ t('admin.impersonation.colStatus') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in visibleItems" :key="s.id">
                <td>
                  <div class="imp-target">
                    <span class="imp-target__name">{{ s.target?.name || '—' }}</span>
                    <span class="imp-target__email">{{ s.target?.email || s.targetId }}</span>
                  </div>
                </td>
                <td class="imp-date">{{ fmtDate(s.startedAt) }}</td>
                <td>{{ fmtDuration(s.startedAt, s.endedAt) }}</td>
                <td>
                  <span v-if="s.endedAt" class="imp-tag imp-tag--ended">{{ t('admin.impersonation.statusEnded') }}</span>
                  <span v-else class="imp-tag imp-tag--active">{{ t('admin.impersonation.statusActive') }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="imp-modal__foot">
          <span v-if="list.pagesLoaded.value > 0" class="imp-modal__count">
            {{ t('admin.impersonation.loadedCount', { count: list.items.value.length }) }}
          </span>
          <button
            v-if="list.hasMore.value"
            class="imp-btn imp-btn--primary"
            :disabled="list.loadingMore.value"
            @click="list.loadMore()"
          >
            <span v-if="!list.loadingMore.value">↓ {{ t('admin.impersonation.loadMore') }}</span>
            <span v-else>⏳ {{ t('common.loading') }}</span>
          </button>
          <span v-else-if="!list.loading.value && list.items.value.length > 0" class="imp-modal__end">
            ✓ {{ t('admin.impersonation.endOfList') }}
          </span>
          <button class="imp-btn" @click="refresh" :disabled="list.loading.value">↻ {{ t('common.refresh') }}</button>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.imp-modal-backdrop {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.imp-modal {
  width: 100%; max-width: 880px; max-height: 90vh;
  background: #fff; border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.imp-modal__head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  background: #fafaf7;
}
.imp-modal__title { font-size: 1.15rem; font-weight: 700; margin: 0; }
.imp-modal__close {
  background: none; border: 0; font-size: 1.8rem; line-height: 1;
  cursor: pointer; color: #6b7280; padding: 0 0.4rem;
}
.imp-modal__close:hover { color: #1a1a1a; }
.imp-modal__body {
  flex: 1; overflow-y: auto; padding: 1rem 1.25rem;
}
.imp-modal__foot {
  display: flex; gap: 0.75rem; align-items: center;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid #e5e7eb;
  background: #fafaf7;
}
.imp-modal__count, .imp-modal__end { font-size: 0.85rem; color: #6b7280; flex: 1; }
.imp-modal__empty {
  text-align: center; padding: 3rem 1rem; color: #6b7280;
}
.imp-modal__error { color: #b91c1c; }
.imp-table {
  width: 100%; border-collapse: collapse; font-size: 0.875rem;
}
.imp-table th {
  text-align: left; padding: 0.6rem 0.75rem;
  background: #fafaf7; font-weight: 700; font-size: 0.75rem;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: #6b7280; border-bottom: 1px solid #e5e7eb;
}
.imp-table td {
  padding: 0.75rem; border-bottom: 1px solid #f3f4f6;
}
.imp-table tbody tr:hover { background: #fafaf7; }
.imp-date { font-family: ui-monospace, monospace; font-size: 0.8rem; color: #4b5563; white-space: nowrap; }
.imp-target { display: flex; flex-direction: column; gap: 0.15rem; }
.imp-target__name { font-weight: 600; color: #1a1a1a; }
.imp-target__email { font-size: 0.75rem; color: #6b7280; font-family: ui-monospace, monospace; }
.imp-tag {
  display: inline-block; padding: 0.2rem 0.6rem;
  border-radius: 999px; font-size: 0.72rem; font-weight: 700;
}
.imp-tag--active { background: #fef3c7; color: #92400e; }
.imp-tag--ended  { background: #e5e7eb; color: #4b5563; }
.imp-btn {
  background: #fff; border: 1px solid #d1d5db;
  padding: 0.45rem 0.9rem; border-radius: 6px;
  cursor: pointer; font-size: 0.85rem; font-weight: 600;
  color: #1a1a1a;
}
.imp-btn:hover { background: #f3f4f6; }
.imp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.imp-btn--primary { background: #b91c1c; color: #fff; border-color: #b91c1c; }
.imp-btn--primary:hover { background: #991b1b; }

/* Modal transition */
.imp-modal-fade-enter-active, .imp-modal-fade-leave-active {
  transition: opacity 0.18s ease;
}
.imp-modal-fade-enter-from, .imp-modal-fade-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .imp-modal { max-height: 95vh; }
  .imp-modal__head { padding: 0.75rem 1rem; }
  .imp-modal__body, .imp-modal__foot { padding: 0.75rem 1rem; }
  .imp-table th, .imp-table td { padding: 0.5rem 0.4rem; font-size: 0.8rem; }
}
</style>
