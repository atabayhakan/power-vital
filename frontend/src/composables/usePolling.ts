// usePolling — generic interval-driven polling composable with:
//   • Configurable interval (default 30s)
//   • Pause when document is hidden (visibilitychange API)
//   • Manual refresh + immediate fetch on mount
//   • Tracks isPolling, lastUpdated, error states
//   • Cleanup on unmount
import { ref, onMounted, onUnmounted, type Ref } from 'vue';

export interface UsePollingOptions {
  interval?: number;
  immediate?: boolean;
  pauseOnHidden?: boolean;
  dedupe?: boolean;
  retryOnError?: boolean;
  retryDelay?: number;
}

export interface UsePollingReturn {
  isPolling: Ref<boolean>;
  lastUpdated: Ref<Date | null>;
  error: Ref<string>;
  pollCount: Ref<number>;
  isPaused: Ref<boolean>;
  refresh: () => Promise<void>;
  start: () => void;
  stop: () => void;
}

export const usePolling = (
  fn: () => Promise<unknown>,
  options: UsePollingOptions = {}
): UsePollingReturn => {
  const {
    interval = 30000,
    immediate = true,
    pauseOnHidden = true,
    dedupe = true,
    retryOnError = true,
    retryDelay = 5000
  } = options;

  const isPolling = ref(false);
  const lastUpdated = ref<Date | null>(null);
  const error = ref('');
  const pollCount = ref(0);
  const isPaused = ref(false);

  let timer: ReturnType<typeof setTimeout> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let visibilityHandler: (() => void) | null = null;

  const clearTimers = () => {
    if (timer) { clearTimeout(timer); timer = null; }
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
  };

  const schedule = (delay: number) => {
    clearTimers();
    timer = setTimeout(tick, delay);
  };

  const tick = async () => {
    if (isPaused.value) {
      schedule(interval);
      return;
    }
    if (dedupe && isPolling.value) {
      schedule(interval);
      return;
    }
    isPolling.value = true;
    try {
      await fn();
      lastUpdated.value = new Date();
      error.value = '';
    } catch (e: any) {
      error.value = String(e?.message || e || 'Polling failed');
      if (retryOnError) {
        schedule(retryDelay);
        return;
      }
    } finally {
      isPolling.value = false;
      pollCount.value++;
    }
    schedule(interval);
  };

  const refresh = async () => {
    await tick();
  };

  const start = () => {
    if (timer) return;
    if (immediate) tick();
    else schedule(interval);
  };

  const stop = () => {
    clearTimers();
  };

  if (typeof document !== 'undefined' && pauseOnHidden) {
    isPaused.value = document.visibilityState === 'hidden';
    visibilityHandler = () => {
      isPaused.value = document.visibilityState === 'hidden';
      if (!isPaused.value) {
        tick();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
  }

  onMounted(() => start());
  onUnmounted(() => {
    stop();
    if (visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityHandler);
    }
  });

  return {
    isPolling,
    lastUpdated,
    error,
    pollCount,
    isPaused,
    refresh,
    start,
    stop
  };
};

export default usePolling;
