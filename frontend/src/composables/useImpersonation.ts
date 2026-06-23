// useImpersonation — frontend composable for admin impersonation.
//
// Lifecycle:
//   • `sessionId` is stored in sessionStorage so it survives page
//     reloads but is cleared when the tab closes.
//   • axios request interceptor adds X-Impersonation-Session header
//     to every outgoing request when a session is active.
//   • On 401 "session expired" response, we auto-clear and bounce
//     back to admin mode.
//   • Provides start() / stop() / refresh() and reactive state.

import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { apiPost, apiDelete } from '@/api/openapi-client';

export interface ImpersonationState {
  active: boolean;
  sessionId: string | null;
  targetId: string | null;
  targetName: string | null;
  targetEmail: string | null;
  expiresAt: string | null;
  startedAt: string | null;
}

const STORAGE_KEY = 'pv_impersonation_session';

const state = ref<ImpersonationState>({
  active: false,
  sessionId: null,
  targetId: null,
  targetName: null,
  targetEmail: null,
  expiresAt: null,
  startedAt: null
});

const isExpired = computed(() => {
  if (!state.value.expiresAt) return false;
  return new Date(state.value.expiresAt).getTime() < Date.now();
});

let interceptorId: number | null = null;

const installInterceptor = () => {
  if (interceptorId !== null) return;
  interceptorId = axios.interceptors.request.use((config) => {
    if (state.value.sessionId) {
      config.headers['X-Impersonation-Session'] = state.value.sessionId;
    }
    return config;
  });
};

export const uninstallInterceptor = () => {
  if (interceptorId !== null) {
    axios.interceptors.request.eject(interceptorId);
    interceptorId = null;
  }
};

// When a request fails with 401 "session expired", clear state.
const installResponseInterceptor = () => {
  axios.interceptors.response.use(
    (r) => r,
    (err) => {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;
      if (status === 401 && (code === 'session_expired' || err?.response?.data?.error?.includes('Impersonation'))) {
        clearLocal();
      }
      return Promise.reject(err);
    }
  );
};

const saveLocal = () => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      sessionId: state.value.sessionId,
      targetId: state.value.targetId,
      targetName: state.value.targetName,
      targetEmail: state.value.targetEmail,
      expiresAt: state.value.expiresAt,
      startedAt: state.value.startedAt
    }));
  } catch { /* sessionStorage may be disabled */ }
};

const clearLocal = () => {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  state.value = {
    active: false, sessionId: null, targetId: null,
    targetName: null, targetEmail: null, expiresAt: null, startedAt: null
  };
};

export const startImpersonation = async (targetId: string, reason?: string): Promise<void> => {
  // OpenAPI schema declares the request body field as `targetId`.
  const { data } = await apiPost('/api/v1/admin/impersonation/impersonate', {
    targetId,
    reason,
  } as { targetId: string; reason?: string });
  // Response is 201 with no body (per current OpenAPI schema). The
  // session is created server-side; we synthesise a local handle so
  // the UI banner can render immediately. The actual sessionId is
  // returned via the impersonation status endpoint or the SSE-active
  // channel — for now the local id IS the targetId (matches the
  // earlier semantics where sessionId == the user we impersonated).
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const id = (data as unknown as { id?: string; sessionId?: string })?.id
    ?? (data as unknown as { id?: string; sessionId?: string })?.sessionId
    ?? targetId;
  state.value = {
    active: true,
    sessionId: id,
    targetId,
    targetName: null,
    targetEmail: null,
    expiresAt,
    startedAt: now
  };
  saveLocal();
  installInterceptor();
};

export const stopImpersonation = async (): Promise<void> => {
  if (!state.value.sessionId) return;
  const sid = state.value.sessionId;
  try {
    await apiDelete(`/api/v1/admin/impersonation/impersonate/${sid}` as '/api/v1/admin/impersonation/impersonate/{sessionId}');
  } catch {
    // Even if the server call fails, clear locally.
  }
  clearLocal();
};

export const refreshImpersonation = async (): Promise<void> => {
  if (!state.value.sessionId) return;
  // Server doesn't expose a /refresh endpoint yet — the session
  // expiry is fixed at 60 minutes. Future: extend session here.
};

export const useImpersonation = () => {
  // Hydrate from sessionStorage on mount (per-tab session).
  onMounted(() => {
    installResponseInterceptor();
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state.value = {
          active: true,
          sessionId: parsed.sessionId,
          targetId: parsed.targetId,
          targetName: parsed.targetName,
          targetEmail: parsed.targetEmail,
          expiresAt: parsed.expiresAt,
          startedAt: parsed.startedAt
        };
        installInterceptor();
      }
    } catch { /* sessionStorage unavailable */ }
  });

  const minutesRemaining = computed(() => {
    if (!state.value.expiresAt) return 0;
    const ms = new Date(state.value.expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(ms / 60_000));
  });

  return {
    state: computed(() => state.value),
    minutesRemaining,
    isExpired,
    start: startImpersonation,
    stop: stopImpersonation,
    refresh: refreshImpersonation
  };
};

export default useImpersonation;
