// useAdminMetrics — polls the admin cart-recovery endpoint
// every 30s and exposes the typed payload. The dashboard view
// just calls this once and re-uses the reactive refs — keeping
// the network surface tiny (one request per minute per admin
// session).
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { apiGet } from '@/api/openapi-client';
import type { CartRecoveryKpis } from '../types/adminMetrics';

const POLL_MS = 30 * 1000;

const state = ref<CartRecoveryKpis | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
let pollHandle: number | null = null;
let mounted = false;

const fetchOnce = async () => {
  isLoading.value = true;
  try {
    const { data } = await apiGet('/api/v1/admin/cart-recovery');
    state.value = data as unknown as CartRecoveryKpis;
    error.value = null;
  } catch (e: any) {
    error.value = e?.response?.data?.error || e?.message || 'Failed to load';
  } finally {
    isLoading.value = false;
  }
};

const start = () => {
  if (typeof window === 'undefined') return;
  void fetchOnce();
  pollHandle = window.setInterval(fetchOnce, POLL_MS);
};

const stop = () => {
  if (typeof window !== 'undefined' && pollHandle) window.clearInterval(pollHandle);
  pollHandle = null;
};

export function useAdminMetrics() {
  onMounted(() => {
    if (mounted) return;
    mounted = true;
    start();
  });
  onBeforeUnmount(() => {
    mounted = false;
    stop();
  });
  return { state, isLoading, error, refresh: fetchOnce };
}

export default useAdminMetrics;
