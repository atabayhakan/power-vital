<script setup lang="ts">
// ErrorBoundary — catches render / lifecycle errors in a child subtree
// and shows a recovery UI instead of a blank page.
//
// Usage:
//   <ErrorBoundary>
//     <RiskyComponent />
//   </ErrorBoundary>
//
// Props:
//   • silent — if true, only emits 'error' event without rendering the
//     fallback UI. Useful for nested boundaries (page-level + section-level).
//
// Why a custom boundary (not just `app.config.errorHandler`)?
//   • App-level handler crashes the whole tree. Boundaries localize the
//     blast radius so one broken widget doesn't kill the dashboard.
//   • We can scope which UI strings / actions to expose for recovery.
import { ref, onErrorCaptured } from 'vue';
import { useRoute } from 'vue-router';
import { useCurrentUser } from '../composables/useCurrentUser';
import { reportError } from '../utils/errorTracking';

interface Props {
  silent?: boolean;
  fallbackTitle?: string;
  fallbackMessage?: string;
}
const props = withDefaults(defineProps<Props>(), {
  silent: false,
  fallbackTitle: 'Bir şeyler ters gitti',
  fallbackMessage: 'Bu bölüm yüklenirken beklenmeyen bir hata oluştu. Sayfayı yenilemeyi deneyin.'
});

const emit = defineEmits<{
  (e: 'error', err: Error, info: string): void;
  (e: 'reset'): void;
}>();

const error = ref<Error | null>(null);
const info = ref<string>('');
const route = useRoute();
const currentUser = useCurrentUser();

onErrorCaptured((err: Error, _instance, errorInfo: string) => {
  error.value = err;
  info.value = errorInfo;
  reportError(err, {
    route: route.fullPath,
    userId: currentUser.value?.id ?? null,
    locale: typeof localStorage !== 'undefined' ? localStorage.getItem('pv_lang') ?? undefined : undefined,
    tags: { component: 'ErrorBoundary', phase: errorInfo }
  });
  emit('error', err, errorInfo);
  // Stop propagation so the failure doesn't bubble up to the root.
  return false;
});

const handleRetry = (): void => {
  error.value = null;
  info.value = '';
  emit('reset');
};

const handleReload = (): void => {
  window.location.reload();
};
</script>

<template>
  <slot v-if="!error || silent" />
  <div v-else class="error-boundary clay-surface">
    <div class="eb-icon">⚠️</div>
    <h3 class="eb-title">{{ props.fallbackTitle }}</h3>
    <p class="eb-message">{{ props.fallbackMessage }}</p>
    <details v-if="error.message" class="eb-details">
      <summary>Hata detayı</summary>
      <pre class="eb-stack">{{ error.message }}
{{ info }}</pre>
    </details>
    <div class="eb-actions">
      <button type="button" class="eb-btn eb-btn--primary" @click="handleRetry">
        Tekrar Dene
      </button>
      <button type="button" class="eb-btn" @click="handleReload">
        Sayfayı Yenile
      </button>
    </div>
  </div>
</template>

<style scoped>
.error-boundary {
  padding: 1.5rem;
  border: 1px solid #f4c2c2;
  border-radius: 12px;
  background: #fff8f8;
  margin: 1rem 0;
  text-align: center;
}
.eb-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
.eb-title {
  margin: 0 0 0.5rem;
  color: #b00020;
  font-size: 1.1rem;
}
.eb-message {
  margin: 0 0 1rem;
  color: #444;
}
.eb-details {
  text-align: left;
  margin: 0.5rem auto 1rem;
  max-width: 600px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 0.5rem;
}
.eb-stack {
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-word;
  color: #666;
  max-height: 200px;
  overflow: auto;
  margin: 0.5rem 0 0;
}
.eb-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}
.eb-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.875rem;
}
.eb-btn:hover {
  background: #f5f5f5;
}
.eb-btn--primary {
  background: #d32f2f;
  color: #fff;
  border-color: #d32f2f;
}
.eb-btn--primary:hover {
  background: #b71c1c;
}
</style>