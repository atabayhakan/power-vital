// usePushSubscription — register the service worker + subscribe/unsubscribe
// the current browser to Web Push, plus a reactive permission state.
//
// Lifecycle:
//   - On mount: checks Notification.permission + register /sw.js
//   - When permission is granted and the user opts in, fetches the VAPID
//     public key from the server, calls PushManager.subscribe, POSTs the
//     resulting subscription to /api/v1/push/subscribe.
//   - When the user opts out, calls DELETE /api/v1/push/unsubscribe.
//
// All operations are idempotent — repeated calls don't create duplicate
// server rows (the backend uses upsert on endpoint).
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

export type PushState =
  | 'unsupported'   // browser doesn't support push
  | 'idle'          // registered, no permission yet
  | 'prompt'        // user has not answered the prompt
  | 'granted'       // permission granted, subscription live
  | 'denied'        // user blocked notifications
  | 'error';        // transient failure (server returned 5xx etc.)

const SW_URL = '/sw.js';

export const usePushSubscription = () => {
  const state = ref<PushState>('idle');
  const subscription = ref<PushSubscription | null>(null);
  const error = ref<string>('');
  const vapidKey = ref<string>('');

  const isSupported = computed(() =>
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );

  const isSubscribed = computed(() => !!subscription.value);

  const ensureSw = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!isSupported.value) return null;
    try {
      const reg = await navigator.serviceWorker.register(SW_URL, { scope: '/' });
      return reg;
    } catch (e: any) {
      error.value = 'Service worker kayıt hatası: ' + (e?.message || 'bilinmeyen');
      return null;
    }
  };

  const fetchVapidKey = async (): Promise<string | null> => {
    if (vapidKey.value) return vapidKey.value;
    try {
      const res = await axios.get('/api/v1/push/public-key');
      if (res.data?.publicKey) {
        vapidKey.value = res.data.publicKey;
        return vapidKey.value;
      }
      error.value = 'Sunucu VAPID anahtarını döndürmedi.';
      return null;
    } catch {
      error.value = 'Push servisi yapılandırılmamış.';
      return null;
    }
  };

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  };

  // Sync our local `subscription` ref with whatever the SW has — used on mount.
  const refreshFromSw = async () => {
    if (!isSupported.value) { state.value = 'unsupported'; return; }
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    if (!reg) { state.value = 'error'; return; }
    const sub = await reg.pushManager.getSubscription();
    subscription.value = sub;
    state.value = Notification.permission === 'granted' && sub
      ? 'granted'
      : Notification.permission === 'denied'
        ? 'denied'
        : 'idle';
  };

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported.value) return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return await Notification.requestPermission();
  };

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported.value) { state.value = 'unsupported'; return false; }
    error.value = '';
    try {
      // 1. Permission
      const perm = await requestPermission();
      if (perm !== 'granted') {
        state.value = perm === 'denied' ? 'denied' : 'prompt';
        return false;
      }

      // 2. Service worker
      const reg = await ensureSw();
      if (!reg) { state.value = 'error'; return false; }
      await navigator.serviceWorker.ready;

      // 3. VAPID key
      const key = await fetchVapidKey();
      if (!key) { state.value = 'error'; return false; }

      // 4. PushManager.subscribe
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key) as BufferSource
        });
      }
      subscription.value = sub;

      // 5. POST to backend
      const json = sub.toJSON() as any;
      await axios.post('/api/v1/push/subscribe', {
        endpoint: sub.endpoint,
        keys: json.keys,
        userAgent: navigator.userAgent.slice(0, 512)
      });

      state.value = 'granted';
      return true;
    } catch (e: any) {
      error.value = e?.response?.data?.error || e?.message || 'Bilinmeyen hata';
      state.value = 'error';
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!subscription.value) return true;
    try {
      const endpoint = subscription.value.endpoint;
      await subscription.value.unsubscribe();
      await axios.delete('/api/v1/push/unsubscribe', { data: { endpoint } }).catch(() => {});
      subscription.value = null;
      state.value = Notification.permission === 'denied' ? 'denied' : 'idle';
      return true;
    } catch (e: any) {
      error.value = e?.message || 'Unsubscribe hatası';
      return false;
    }
  };

  // SW → page navigation (when notification is clicked on an already-open tab)
  const onSwMessage = (cb: (url: string) => void) => {
    if (!isSupported.value) return () => {};
    const handler = (ev: MessageEvent) => {
      if (ev.data?.type === 'pv-navigate' && ev.data.url) cb(ev.data.url);
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  };

  onMounted(() => {
    refreshFromSw();
  });

  return {
    state: computed(() => state.value),
    subscription,
    isSupported,
    isSubscribed,
    error: computed(() => error.value),
    subscribe,
    unsubscribe,
    refreshFromSw,
    onSwMessage
  };
};
