<script setup lang="ts">
// PushSettings — account-level opt-in/out for browser push notifications.
//
// Shows a status card + opt-in button when the browser is supported,
// a help message when permission is denied, and a per-event preferences
// list once the user is subscribed. All toggles write to
// /api/v1/push/preferences (keyed per eventKey).
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { usePushSubscription } from '../../composables/usePushSubscription';
import { useTranslate } from '../../composables/useTranslate';
import axios from 'axios';

const { t } = useTranslate();
const { state, isSubscribed, error, subscribe, unsubscribe, onSwMessage } = usePushSubscription();

interface Prefs { [event: string]: boolean }

const EVENT_KEYS = computed(() => [
  { key: 'order_paid',      label: t('push.eventOrderPaid'),      icon: '💳' },
  { key: 'order_shipped',   label: t('push.eventOrderShipped'),   icon: '📦' },
  { key: 'order_completed', label: t('push.eventOrderCompleted'), icon: '✅' },
  { key: 'order_cancelled', label: t('push.eventOrderCancelled'), icon: '❌' },
  { key: 'withdrawal_approved', label: t('push.eventWithdrawalApproved'), icon: '✅' },
  { key: 'withdrawal_rejected', label: t('push.eventWithdrawalRejected'), icon: '⚠️' }
]);

const prefs = ref<Prefs>({});
const loading = ref(false);
const info = ref('');

const stateLabel = computed(() => {
  switch (state.value) {
    case 'unsupported': return t('push.stateUnsupported');
    case 'denied':      return t('push.stateDenied');
    case 'error':       return t('push.stateError');
    case 'granted':     return t('push.stateGranted');
    case 'prompt':      return t('push.statePrompt');
    case 'idle':        return t('push.stateIdle');
    default:            return state.value;
  }
});

const stateMessage = computed(() => {
  switch (state.value) {
    case 'unsupported': return t('push.msgUnsupported');
    case 'denied':      return t('push.msgDenied');
    case 'error':       return error.value || t('push.msgErrorGeneric');
    case 'granted':     return t('push.msgGranted');
    case 'prompt':      return t('push.msgPrompt');
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
    info.value = t('push.prefsLoadError');
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
    info.value = value ? t('push.prefOn') : t('push.prefOff');
    setTimeout(() => { info.value = ''; }, 2000);
  } catch {
    prefs.value = { ...prefs.value, [key]: before }; // rollback
    info.value = t('push.prefsSaveError');
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
      <h3>🔔 {{ t('push.title') }}</h3>
      <span class="ps-state" :style="{ background: stateColor }">
        {{ stateLabel }}
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
        🔔 {{ t('push.enableBtn') }}
      </button>
      <p v-else class="ps-help">
        {{ t('push.deniedHelp') }}
      </p>
    </div>

    <div v-else class="ps-events">
      <p class="ps-hint">{{ t('push.eventsHint') }}</p>
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
        {{ t('push.disableAll') }}
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
