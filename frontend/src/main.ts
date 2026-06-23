import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import i18n from './i18n'
import { applyUiOverrides } from './utils/uiOverrides'
import { reportError } from './utils/errorTracking'
import { initSentry } from './utils/sentry'
// Quill CSS is now lazy-injected by PageManageView on mount so the
// public bundle (~30 KB) skips it entirely. See views/PageManageView.vue.

// ═══ GLOBAL AXIOS CONFIG (Antigravity: single config for all API calls) ═══
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '/'; // Uses Render/Railway API URL in production, proxy locally

// Auto-inject auth token on every request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  const lang = localStorage.getItem('pv_lang') || 'kg'
  if (config.headers) {
    if (token) config.headers.Authorization = `Bearer ${token}`
    config.headers['Accept-Language'] = lang
  }
  return config
})

const app = createApp(App)
const pinia = createPinia()

// Global error handler — catches uncaught errors from setup functions,
// watchers, lifecycle hooks that aren't wrapped in ErrorBoundary.
// Logs to console + emits a custom event so monitoring (e.g. Sentry
// hookup in the future) can pick it up without changes here.
app.config.errorHandler = (err, _instance, info) => {
  reportError(err instanceof Error ? err : new Error(String(err)), {
    route: router.currentRoute.value.fullPath,
    tags: { component: 'vue-global', phase: info }
  });
};

// Async errors (failing promises in setup, watchers, etc.) bubble up
// to this listener only if no per-call .catch() is attached.
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason instanceof Error
    ? event.reason
    : new Error(typeof event.reason === 'string' ? event.reason : JSON.stringify(event.reason));
  reportError(reason, {
    tags: { component: 'window-unhandledrejection' }
  });
});

app.use(pinia)
app.use(router)
app.use(i18n)
app.mount('#app')

// Sentry init is lazy and async — it doesn't block mount. If the DSN
// is missing or init fails, errorTracking.ts still works against the
// backend /errors/report endpoint. See utils/sentry.ts for the
// fail-open contract.
void initSentry(app, router)

// Merge admin-edited UI-string overrides over the bundled locale defaults.
// Non-blocking: runs after mount and applies reactively once it resolves.
applyUiOverrides(i18n)
