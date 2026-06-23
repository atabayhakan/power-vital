<script setup lang="ts">
// PushSettings — account-level opt-in/out for browser push notifications.
//
// Shows a status card + opt-in button when the browser is supported,
// a help message when permission is denied, and a per-event preferences
// list once the user is subscribed. All toggles write to
// /api/v1/push/preferences (keyed per eventKey).
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { usePushSubscription } from '../../composables/usePushSubscription';
import axios from 'axios';

const { state, isSubscribed, error, subscribe, unsubscribe, onSwMessage } = usePushSubscription();

interface Prefs { [event: string]: boolean }

const EVENT_KEYS = [
  { key: 'order_paid',      label: 'Siparişim ödendi',          icon: '💳' },
  { key: 'order_shipped',   label: 'Siparişim kargoda',          icon: '📦' },
  { key: 'order_completed', label: 'Siparişim tamamlandı',       icon: '✅' },
  { key: 'order_cancelled', label: 'Siparişim iptal edildi',     icon: '❌' },
  { key: 'withdrawal_approved', label: 'Çekim talebim onaylandı', icon: '✅' },
  { key: 'withdrawal_rejected', label: 'Çekim talebim reddedildi', icon: '⚠️' }
];

const prefs = ref<Prefs>({});
const loading = ref(false);
const info = ref('');

const stateMessage = computed(() => {
  switch (state.value) {
    case 'unsupported': return 'Tarayıcınız Web Push desteklemiyor.';
    case 'denied':      return 'Bildirim izni reddedildi. Tarayıcı ayarlarından açabilirsiniz.';
    case 'error':       return error.value || 'Bilinmeyen bir hata oluştu.';
    case 'granted':     return 'Bildirimler aktif.';
    case 'prompt':      return 'Tarayıcı izin diyaloğu bekleniyor.';
    default:            return '';
  }
});

const stateColor = computed(() => {
  switch (state.value) {
    case 'granted': return '#10B981';
    case 'denied':
    case 'unsupported':
    case 'error':   return '#EF4444';
    default:        return '#F59E0B';
  }
});

const loadPrefs = async () => {
  if (!isSubscribed.value) return;
  loading.value = true;
  try {
    const res = await axios.get('/api/v1/push/preferences');
    prefs.value = res.data.preferences || {};
  } catch (e: any) {
    info.value = 'Tercihler yüklenemedi.';
  } finally {
    loading.value = false;
  }
};

const togglePref = async (key: string, value: boolean) => {
  // Optimistic update
  const before = prefs.value[key];
  prefs.value = { ...prefs.value, [key]: value };
  try {
    const next = { ...prefs.value };
    if (value) delete next[key]; // default = on, so don't store true
    else next[key] = false;
    await axios.put('/api/v1/push/preferences', next);
    prefs.value = next;
    info.value = value ? '🔔 Açıldı' : '🔕 Kapatıldı';
    setTimeout(() => { info.value = ''; }, 2000);
  } catch {
    prefs.value = { ...prefs.value, [key]: before }; // rollback
    info.value = 'Tercih kaydedilemedi.';
  }
};

const isOn = (key: string): boolean => {
  // Default-on: missing key = true
  return prefs.value[key] !== false;
};

const onEnable = async () => {
  const ok = await subscribe();
  if (ok) await loadPrefs();
};

const onDisable = async () => {
  await unsubscribe();
  prefs.value = {};
};

let off: (() => void) | null = null;
onMounted(() => {
  loadPrefs();
  // When user clicks a notification while the app is already open,
  // route them to the target URL via vue-router.
  off = onSwMessage((url) => {
    if (url) window.location.href = url;
  });
});
onUnmounted(() => { off?.(); });
</script>

<template>
  <section class="ps-card">
    <header class="ps-head">
      <h3>🔔 Anlık Bildirimler (Push)</h3>
      <span class="ps-state" :style="{ background: stateColor }">
        {{ state }}
      </span>
    </header>

    <p v-if="stateMessage" class="ps-msg">{{ stateMessage }}</p>
    <p v-if="info" class="ps-info">✓ {{ info }}</p>

    <div v-if="!isSubscribed" class="ps-actions">
      <button
        v-if="state !== 'unsupported' && state !== 'denied'"
        class="ps-btn ps-btn--primary"
        @click="onEnable"
        :disabled="state === 'prompt'"
      >
        🔔 Bildirimleri Aç
      </button>
      <p v-else class="ps-help">
        Tarayıcı ayarlarından bu site için bildirim iznini açıp sayfayı yenileyin.
      </p>
    </div>

    <div v-else class="ps-events">
      <p class="ps-hint">Aşağıdaki olaylardan hangilerinde bildirim almak istiyorsunuz?</p>
      <ul class="ps-list">
        <li v-for="ev in EVENT_KEYS" :key="ev.key" class="ps-row">
          <span class="ps-row-label">
            <span class="ps-icon">{{ ev.icon }}</span>
            {{ ev.label }}
          </span>
          <button
            class="ps-toggle"
            :class="{ 'ps-toggle--on': isOn(ev.key) }"
            @click="togglePref(ev.key, !isOn(ev.key))"
          >
            <span class="ps-toggle-knob" />
          </button>
        </li>
      </ul>

      <button class="ps-btn ps-btn--ghost" @click="onDisable">
        Tüm bildirimleri kapat
      </button>
    </div>
  </section>
</template>

<style scoped>
.ps-card {
  background: var(--surface-1, rgba(255,255,255,0.02));
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 14px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}
.ps-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.ps-head h3 { margin: 0; font-size: 1.05rem; font-weight: 600; }
.ps-state {
  font-size: 0.7rem; font-weight: 700; color: #fff; padding: 0.2rem 0.6rem;
  border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px;
}
.ps-msg { font-size: 0.85rem; opacity: 0.85; margin: 0 0 0.75rem; }
.ps-info { font-size: 0.85rem; color: #10B981; margin: 0 0 0.75rem; }
.ps-help { font-size: 0.85rem; opacity: 0.7; margin: 0; }
.ps-actions { display: flex; flex-direction: column; gap: 0.5rem; }
.ps-btn {
  padding: 0.6rem 1rem; border-radius: 10px; border: 1px solid rgba(0,0,0,0.1);
  background: var(--surface-2, rgba(255,255,255,0.05)); color: inherit;
  cursor: pointer; font-weight: 600; font-size: 0.9rem;
}
.ps-btn--primary { background: var(--pv-red, #BC4A3C); color: #fff; border-color: transparent; }
.ps-btn--primary:hover:not(:disabled) { filter: brightness(1.1); }
.ps-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ps-btn--ghost { background: transparent; margin-top: 0.5rem; }

.ps-events { margin-top: 0.5rem; }
.ps-hint { font-size: 0.85rem; opacity: 0.7; margin: 0 0 0.75rem; }
.ps-list { list-style: none; padding: 0; margin: 0 0 0.75rem; }
.ps-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.6rem 0; border-bottom: 1px solid rgba(0,0,0,0.05);
}
.ps-row:last-child { border-bottom: none; }
.ps-row-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
.ps-icon { font-size: 1.1rem; }

.ps-toggle {
  position: relative; width: 44px; height: 24px; border-radius: 12px;
  background: rgba(0,0,0,0.15); border: none; cursor: pointer;
  transition: background 0.2s;
}
.ps-toggle--on { background: var(--pv-red, #BC4A3C); }
.ps-toggle-knob {
  position: absolute; top: 2px; left: 2px; width: 20px; height: 20px;
  border-radius: 50%; background: #fff; transition: transform 0.2s;
}
.ps-toggle--on .ps-toggle-knob { transform: translateX(20px); }
</style>
