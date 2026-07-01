<script setup lang="ts">
// CartRecoveryView — admin dashboard for the cart-abandonment
// pipeline + FOMO counters + presence. Auto-refreshes every 30s.
//
// Layout:
//   • 4 KPI cards (pending / notified / converted / conversion %)
//   • Money-at-risk vs money-recovered stat strip
//   • Live presence + recent orders strip
//   • Top-abandoned products table
//   • Recent activity table + per-row "Notify now" action
//
// The view is read-only by default but exposes two power-user
// actions: a global "Sweep now" button (forces the 5-min
// sweeper to run on demand) and per-row "Send reminder" (the
// admin can target a specific abandoned cart). SMTP is
// optional — if not configured, the email channel becomes a
// jsonTransport fallback (logged only) and the UI shows a
// small banner so the admin knows emails aren't going out.
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import axios from 'axios';
import { useAdminMetrics } from '../composables/useAdminMetrics';
import { useTranslate } from '../composables/useTranslate';
import { formatPrice } from '../utils/PriceEngine';

const { t } = useTranslate();
const { state, isLoading, error, refresh } = useAdminMetrics();

// All admin dashboard strings live under `admin.cartRecovery.*`
// so the legacy `admin.dashboard` block (POS / orders / etc.)
// stays untouched. We re-export `t` with the namespace prepended
// so the template stays terse.
const t2 = (key: string, params?: Record<string, unknown>) =>
  t(`admin.cartRecovery.${key}`, params);

const lastUpdated = ref<Date | null>(null);
let tickHandle: number | null = null;

const updateTimestamp = () => {
  if (state.value) lastUpdated.value = new Date();
};

onMounted(() => {
  // The composable's onMounted kicks off the first fetch; mirror
  // that here so the "updated X seconds ago" line is accurate
  // from the very first response.
  const initial = setInterval(updateTimestamp, 1000);
  setTimeout(() => { clearInterval(initial); updateTimestamp(); }, 1500);
  tickHandle = window.setInterval(updateTimestamp, 1000);
});
onBeforeUnmount(() => {
  if (tickHandle) window.clearInterval(tickHandle);
});

const lastUpdatedAgo = computed(() => {
  if (!lastUpdated.value) return '—';
  const sec = Math.floor((Date.now() - lastUpdated.value.getTime()) / 1000);
  if (sec < 5) return t2('justNow');
  if (sec < 60) return t2('secondsAgo', { n: sec });
  const min = Math.floor(sec / 60);
  return t2('minutesAgo', { n: min });
});

const k = computed(() => state.value);

const formatKgs = (n: number): string => `${formatPrice(n)} KGS`;

const formatRelative = (iso: string): string => {
  const ts = new Date(iso).getTime();
  if (!isFinite(ts)) return '—';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return t2('secondsAgo', { n: diff });
  const min = Math.floor(diff / 60);
  if (min < 60) return t2('minutesAgo', { n: min });
  const h = Math.floor(min / 60);
  if (h < 24) return t2('hoursAgo', { n: h });
  const d = Math.floor(h / 24);
  return t2('daysAgo', { n: d });
};

const statusLabel = (s: string): string => {
  return t2(`status.${s}`);
};
const statusClass = (s: string): string => `crv-status crv-status--${s}`;

// Skeleton state — used by the template's initial-load guard.
const isInitialLoad = computed(() => isLoading.value && !state.value);
void isInitialLoad.value; // retained for the future skeleton branch

// Localised "live" label for the recent-orders strip
const recentOrdersLabel = computed(() => {
  const n = k.value?.recentOrdersLast10m ?? 0;
  if (n === 0) return t2('recentOrders.none');
  if (n === 1) return t2('recentOrders.one');
  return t2('recentOrders.many', { n });
});

const presenceLabel = computed(() => {
  const n = k.value?.activeSessions ?? 0;
  if (n === 0) return t2('presence.none');
  if (n === 1) return t2('presence.one');
  return t2('presence.many', { n });
});

// ── Admin actions ────────────────────────────────────────────────
// "Sweep now" forces a single sweeper tick instead of waiting
// for the 5-minute cron. Useful when the admin wants to test
// a new template or close out the night manually.
const isSweeping = ref(false);
const sweepError = ref('');
const sweepInfo = ref('');
const sweepNow = async () => {
  isSweeping.value = true;
  sweepError.value = '';
  sweepInfo.value = '';
  try {
    const res = await axios.post('/api/v1/admin/cart-recovery/sweep');
    const { notified, emailed, expired, skipped, errors } = res.data;
    sweepInfo.value = `✓ ${notified} push, ${emailed} email, ${expired} expired, ${skipped} skipped${errors ? `, ${errors} errors` : ''}`;
    await refresh();
  } catch (e: any) {
    sweepError.value = e.response?.data?.error || e.message || 'Sweep failed';
  } finally {
    isSweeping.value = false;
  }
};

// Per-row "Send reminder now" — flips the row's lastActivityAt
// back into the 1h window, then runs the sweeper. Returns a
// per-row toast with push/email outcome.
const rowActionInFlight = ref<string | null>(null);
const rowActionInfo = ref<Record<string, { ok: boolean; msg: string }>>({});
const sendReminderForRow = async (rowId: string) => {
  rowActionInFlight.value = rowId;
  try {
    const res = await axios.post(`/api/v1/admin/cart-recovery/${rowId}/notify`);
    const { sentPush, sentEmail } = res.data;
    rowActionInfo.value[rowId] = {
      ok: true,
      msg: `📤 push:${sentPush}${sentEmail ? ' ✉️' : ''}`
    };
    await refresh();
  } catch (e: any) {
    rowActionInfo.value[rowId] = {
      ok: false,
      msg: e.response?.data?.error || e.message || 'Failed'
    };
  } finally {
    rowActionInFlight.value = null;
  }
};

// "Test email" — sends a templated abandoned-cart email to
// whatever address the admin types. Useful when SMTP is newly
// configured and the admin wants to confirm delivery.
const showEmailDialog = ref(false);
const testEmailAddress = ref('');
const testEmailLocale = ref<'kg' | 'ru' | 'tr' | 'en'>('ru');
const isSendingTest = ref(false);
const testEmailResult = ref('');
const sendTestEmail = async () => {
  if (!testEmailAddress.value || !testEmailAddress.value.includes('@')) {
    testEmailResult.value = '⚠️ Geçersiz email';
    return;
  }
  isSendingTest.value = true;
  testEmailResult.value = '';
  try {
    const res = await axios.post('/api/v1/admin/cart-recovery/test-email', {
      email: testEmailAddress.value,
      locale: testEmailLocale.value
    });
    if (res.data.fallback) {
      testEmailResult.value = '⚠️ SMTP yapılandırılmamış — mesaj loglandı';
    } else {
      testEmailResult.value = `✓ Gönderildi (${res.data.id || 'ok'})`;
    }
  } catch (e: any) {
    testEmailResult.value = e.response?.data?.error || e.message || 'Test başarısız';
  } finally {
    isSendingTest.value = false;
  }
};

// We surface the SMTP status from the latest KPI fetch so the
// admin knows whether email is real or just log-only.
const emailConfigured = computed(() => Boolean((state.value as any)?.emailConfigured));
</script>

<template>
  <div class="crv animate-fade-in">
    <header class="crv-head">
      <div>
        <h2>📈 {{ t2('title') }}</h2>
        <p class="crv-sub">{{ t2('subtitle') }}</p>
      </div>
      <div class="crv-head-actions">
        <span class="crv-updated">{{ t2('updated') }}: <b>{{ lastUpdatedAgo }}</b></span>
        <button class="crv-btn crv-btn--ghost" :disabled="isSweeping" @click="sweepNow">
          <span v-if="isSweeping" class="crv-spin">⏳</span>
          <span v-else>🧹</span>
          {{ isSweeping ? 'Sweeping…' : 'Sweep now' }}
        </button>
        <button class="crv-btn crv-btn--ghost" @click="showEmailDialog = true">
          ✉️ Test email
        </button>
        <button class="crv-btn crv-btn--primary" :disabled="isLoading" @click="refresh">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ 'is-spinning': isLoading }">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          {{ t2('refresh') }}
        </button>
      </div>
    </header>

    <!-- Action feedback -->
    <p v-if="sweepError" class="crv-error">⚠️ {{ sweepError }}</p>
    <p v-if="sweepInfo" class="crv-info">✅ {{ sweepInfo }}</p>
    <p v-if="!emailConfigured" class="crv-warn">
      📭 SMTP yapılandırılmamış — email bildirimleri log-only modunda çalışıyor.
      <code>MAIL_HOST</code>, <code>MAIL_USER</code>, <code>MAIL_PASS</code> ortam değişkenlerini .env'e ekleyin.
    </p>

    <p v-if="error" class="crv-error">⚠️ {{ error }}</p>

    <!-- KPI row: 4 cards -->
    <section class="crv-kpis">
      <div class="crv-kpi crv-kpi--pending">
        <span class="crv-kpi-label">{{ t2('kpi.pending') }}</span>
        <span class="crv-kpi-value">{{ k?.pending ?? 0 }}</span>
        <span class="crv-kpi-sub">{{ formatKgs(k?.pendingValueKgs ?? 0) }}</span>
        <span class="crv-kpi-hint">{{ t2('kpi.pendingHint') }}</span>
      </div>
      <div class="crv-kpi crv-kpi--notified">
        <span class="crv-kpi-label">{{ t2('kpi.notified') }}</span>
        <span class="crv-kpi-value">{{ k?.notified ?? 0 }}</span>
        <span class="crv-kpi-sub">{{ t2('kpi.notifiedHint') }}</span>
      </div>
      <div class="crv-kpi crv-kpi--converted">
        <span class="crv-kpi-label">{{ t2('kpi.converted') }}</span>
        <span class="crv-kpi-value">{{ k?.converted ?? 0 }}</span>
        <span class="crv-kpi-sub">{{ formatKgs(k?.recoveredValueKgs ?? 0) }}</span>
        <span class="crv-kpi-hint">{{ t2('kpi.convertedHint') }}</span>
      </div>
      <div class="crv-kpi crv-kpi--rate">
        <span class="crv-kpi-label">{{ t2('kpi.conversionRate') }}</span>
        <span class="crv-kpi-value">{{ Math.round((k?.conversionRate ?? 0) * 100) }}%</span>
        <span class="crv-kpi-sub">{{ t2('kpi.conversionRateHint') }}</span>
        <div class="crv-kpi-bar">
          <div class="crv-kpi-bar-fill" :style="{ width: Math.round((k?.conversionRate ?? 0) * 100) + '%' }" />
        </div>
      </div>
    </section>

    <!-- Live strip: presence + recent orders -->
    <section class="crv-strip">
      <div class="crv-strip-card">
        <span class="crv-strip-icon" aria-hidden="true">👀</span>
        <div class="crv-strip-text">
          <span class="crv-strip-label">{{ t2('presenceLabel') }}</span>
          <span class="crv-strip-value">{{ presenceLabel }}</span>
        </div>
      </div>
      <div class="crv-strip-card">
        <span class="crv-strip-icon" aria-hidden="true">🔥</span>
        <div class="crv-strip-text">
          <span class="crv-strip-label">{{ t2('fomoLabel') }}</span>
          <span class="crv-strip-value">{{ recentOrdersLabel }}</span>
        </div>
      </div>
      <div class="crv-strip-card">
        <span class="crv-strip-icon" aria-hidden="true">⏰</span>
        <div class="crv-strip-text">
          <span class="crv-strip-label">{{ t2('expiredLabel') }}</span>
          <span class="crv-strip-value">{{ k?.expired ?? 0 }}</span>
        </div>
      </div>
    </section>

    <!-- Top abandoned products -->
    <section class="crv-section">
      <h3 class="crv-section-title">🏆 {{ t2('topProducts') }}</h3>
      <div v-if="!k || k.topProducts.length === 0" class="crv-empty">
        {{ t2('noData') }}
      </div>
      <div v-else class="crv-table-wrap">
        <table class="crv-table">
        <thead>
          <tr>
            <th/>
            <th>{{ t2('col.product') }}</th>
            <th class="num">{{ t2('col.abandonedCount') }}</th>
            <th class="num">{{ t2('col.totalValue') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in k.topProducts" :key="p.productId">
            <td class="crv-thumb">
              <img
                v-if="p.imageUrl"
                :src="p.imageUrl"
                :alt="p.name"
                loading="lazy"
                @error="($event.target as HTMLImageElement).style.display='none'; (($event.target as HTMLImageElement).nextElementSibling as HTMLElement | null)?.style && (($event.target as HTMLImageElement).nextElementSibling as HTMLElement)!.style.setProperty('display','flex')"
              />
              <span class="crv-noimg" :style="{ display: p.imageUrl ? 'none' : 'flex' }">📦</span>
            </td>
            <td class="crv-name">{{ p.name }}</td>
            <td class="num"><b>{{ p.abandonedCount }}</b></td>
            <td class="num">{{ formatKgs(p.totalValueKgs) }}</td>
          </tr>
        </tbody>
      </table>
      </div>
    </section>

    <!-- Recent activity -->
    <section class="crv-section">
      <h3 class="crv-section-title">📋 {{ t2('recentActivity') }}</h3>
      <div v-if="!k || k.recent.length === 0" class="crv-empty">
        {{ t2('noData') }}
      </div>
      <div v-else class="crv-table-wrap">
        <table class="crv-table">
        <thead>
          <tr>
            <th>{{ t2('col.product') }}</th>
            <th>{{ t2('col.identity') }}</th>
            <th class="num">{{ t2('col.totalValue') }}</th>
            <th>{{ t2('col.status') }}</th>
            <th>{{ t2('col.lastActivity') }}</th>
            <th/>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in k.recent" :key="r.id">
            <td class="crv-name-cell">
              <span class="crv-mini-thumb">
                <img
                  v-if="r.productImage"
                  :src="r.productImage"
                  :alt="r.productName || '—'"
                  loading="lazy"
                  @error="($event.target as HTMLImageElement).style.display='none'; (($event.target as HTMLImageElement).nextElementSibling as HTMLElement | null)?.style && (($event.target as HTMLImageElement).nextElementSibling as HTMLElement)!.style.setProperty('display','flex')"
                />
                <span class="crv-noimg" :style="{ display: r.productImage ? 'none' : 'flex' }">📦</span>
              </span>
              <span class="crv-name">{{ r.productName || '—' }}</span>
            </td>
            <td>
              <span v-if="r.userId" class="crv-id">👤 {{ r.userId.slice(0, 8) }}…</span>
              <span v-else-if="r.guestId" class="crv-id crv-id--guest">👤 {{ r.guestId.slice(0, 8) }}…</span>
              <span v-else class="crv-id">—</span>
            </td>
            <td class="num">{{ formatKgs(r.cartTotalKgs) }}</td>
            <td><span :class="statusClass(r.status)">{{ statusLabel(r.status) }}</span></td>
            <td class="crv-time">{{ formatRelative(r.lastActivityAt) }}</td>
            <td class="crv-row-actions">
              <button
                v-if="r.userId && r.status !== 'converted'"
                class="crv-btn crv-btn--mini"
                :disabled="rowActionInFlight === r.id"
                :title="rowActionInfo[r.id]?.msg || 'Şimdi hatırlatma gönder'"
                @click="sendReminderForRow(r.id)"
              >
                {{ rowActionInFlight === r.id ? '⏳' : (rowActionInfo[r.id]?.ok ? '✅' : '📤') }}
              </button>
              <span v-else-if="!r.userId" class="crv-row-hint" title="Misafir sepeti — push hedefi yok">👤</span>
              <span v-else-if="r.status === 'converted'" class="crv-row-hint" title="Dönüştürüldü">✓</span>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </section>

    <!-- Test email dialog — Teleport to <body> so the modal escapes
         any overflow:hidden / flex-column clipping the parent might
         impose, and keeps the dialog at the top of the stacking
         context. The dialog itself is fully self-contained. -->
    <Teleport to="body">
      <Transition name="crv-modal">
        <div v-if="showEmailDialog" class="crv-modal-bg" @click.self="showEmailDialog = false">
          <div class="crv-modal" role="dialog" aria-modal="true" aria-label="Test email">
            <header class="crv-modal-head">
              <div class="crv-modal-title">
                <span class="crv-modal-icon">✉️</span>
                <h3>{{ t('admin.cartRecovery.testEmailTitle') || 'Test email gönder' }}</h3>
              </div>
              <button class="crv-modal-close" @click="showEmailDialog = false" aria-label="Kapat">✕</button>
            </header>
            <div class="crv-modal-body">
              <label class="crv-field">
                <span class="crv-field-label">{{ t('admin.cartRecovery.emailRecipient') || 'Alıcı email' }}</span>
                <input v-model="testEmailAddress" type="email" placeholder="admin@powervital.kg" class="crv-input" />
              </label>
              <label class="crv-field">
                <span class="crv-field-label">{{ t('admin.cartRecovery.emailLanguage') || 'Dil' }}</span>
                <select v-model="testEmailLocale" class="crv-input crv-select">
                  <option value="kg">🇰🇬 Кыргызча</option>
                  <option value="ru">🇷🇺 Русский</option>
                  <option value="tr">🇹🇷 Türkçe</option>
                  <option value="en">🇺🇸 English</option>
                </select>
              </label>
              <p v-if="!emailConfigured" class="crv-warn crv-warn--inline">
                📭 {{ t('admin.cartRecovery.smtpFallback') || 'SMTP yapılandırılmamış — mesaj sadece log\'a yazılacak.' }}
              </p>
              <p v-if="testEmailResult" class="crv-info" :class="{ 'crv-info--err': testEmailResult.startsWith('⚠️') }">
                {{ testEmailResult }}
              </p>
            </div>
            <footer class="crv-modal-foot">
              <button class="crv-btn crv-btn--ghost" @click="showEmailDialog = false">{{ t('common.cancel') || 'İptal' }}</button>
              <button class="crv-btn crv-btn--primary" :disabled="isSendingTest" @click="sendTestEmail">
                <span v-if="isSendingTest">⏳</span>
                <span v-else>📤</span>
                {{ isSendingTest ? (t('common.sending') || 'Gönderiliyor…') : (t('admin.cartRecovery.send') || 'Gönder') }}
              </button>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.crv {
  padding: 32px;
  max-width: 1280px;
  margin: 0 auto;
  color: #1a1a1a;
  /* 🛡️ The dashboard layout (App.vue) is a fixed-height 100vh
     flex column with `overflow: hidden` on both .app-layout--dashboard
     and .main-content. Without our own scroll container the long
     CartRecoveryView (KPIs + 2 tables) gets clipped at the bottom
     and the user can't reach the rest. The router-view wrapper is
     a plain block element, so `height: 100%` doesn't reach 100vh
     through the flex chain — we use viewport-relative units plus
     an internal scroll instead, which works regardless of whether
     an ancestor is `display: flex` or `display: block`. */
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  box-sizing: border-box;
}
.crv::-webkit-scrollbar { width: 8px; }
.crv::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.18); border-radius: 4px; }
.crv::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.28); }

.crv-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
.crv-head h2 { font-size: 1.6rem; font-weight: 800; margin: 0 0 6px; color: #1a1a1a; }
.crv-sub { color: #525252; margin: 0; font-size: 0.9rem; }

.crv-head-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.crv-updated { color: #525252; font-size: 0.82rem; }
.crv-updated b { color: #1a1a1a; font-weight: 700; }
.crv-refresh {
  display: inline-flex; align-items: center; gap: 6px;
  background: #fff;
  border: 1px solid #d6d2c8;
  color: #1a1a1a;
  font-family: inherit; font-size: 0.85rem; font-weight: 600;
  padding: 8px 14px; border-radius: 10px; cursor: pointer;
  transition: background 0.15s, transform 0.1s, border-color 0.15s;
}
.crv-refresh:hover { background: #f3efe7; border-color: #a8a39a; }
.crv-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
.crv-refresh svg.is-spinning { animation: crvSpin 0.8s linear infinite; }
@keyframes crvSpin { to { transform: rotate(360deg); } }

.crv-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 10px 14px;
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 0.88rem;
  font-weight: 500;
}

.crv-info {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #047857;
  padding: 10px 14px;
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 0.88rem;
  font-weight: 500;
}
.crv-info--err { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }

.crv-warn {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  padding: 10px 14px;
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 0.88rem;
  line-height: 1.5;
  font-weight: 500;
}
.crv-warn code { background: rgba(146, 64, 14, 0.08); padding: 1px 6px; border-radius: 4px; font-size: 0.78rem; color: #78350f; font-family: 'SF Mono', Menlo, monospace; }
.crv-warn--inline { margin-top: 8px; margin-bottom: 0; font-size: 0.82rem; }

/* Generic button — used by Sweep now / Test email / Refresh */
.crv-btn {
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid #d6d2c8;
  background: #fff;
  color: #1a1a1a;
  font-family: inherit; font-size: 0.85rem; font-weight: 600;
  padding: 8px 14px; border-radius: 10px; cursor: pointer;
  transition: background 0.15s, transform 0.1s, box-shadow 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.crv-btn:hover { background: #f3efe7; border-color: #a8a39a; }
.crv-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.crv-btn--primary {
  background: linear-gradient(135deg, #BC4A3C 0%, #A03323 100%);
  color: #fff;
  border-color: transparent;
}
.crv-btn--primary:hover { box-shadow: 0 4px 14px rgba(188, 74, 60, 0.4); }
.crv-btn--ghost { background: #f3efe7; border-color: #d6d2c8; }
.crv-btn--mini { padding: 4px 8px; font-size: 0.78rem; }
.crv-spin { display: inline-block; animation: crvSpin 1s linear infinite; }

/* Per-row action column */
.crv-row-actions { width: 60px; text-align: center; }
.crv-row-hint { color: #a8a39a; font-size: 0.95rem; }

/* Modal — Light theme: cream/white surface with a soft shadow. The
   previous dark-glass look fought with the dashboard chrome and made
   the form fields look like they were floating in space. Cream
   background with rounded corners reads as a real sheet of paper
   and matches the rest of the storefront design system. */
.crv-modal-bg {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 24px;
  animation: crvModalBgIn 0.18s ease;
}
.crv-modal {
  background: #fafaf7;
  color: #1a1a1a;
  border: 1px solid #e5e1d8;
  border-radius: 18px;
  width: 100%;
  max-width: 460px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.25), 0 2px 6px rgba(15, 23, 42, 0.08);
  animation: crvModalIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes crvModalBgIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes crvModalIn {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0)   scale(1); }
}
.crv-modal-head, .crv-modal-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 22px;
}
.crv-modal-head {
  border-bottom: 1px solid #e5e1d8;
  background: linear-gradient(180deg, rgba(188, 74, 60, 0.06) 0%, transparent 100%);
  border-radius: 18px 18px 0 0;
}
.crv-modal-foot {
  border-top: 1px solid #e5e1d8;
  background: #f3efe7;
  border-radius: 0 0 18px 18px;
  justify-content: flex-end;
}
.crv-modal-title {
  display: flex; align-items: center; gap: 10px;
}
.crv-modal-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  background: linear-gradient(135deg, #BC4A3C, #A03323);
  color: #fff;
  border-radius: 8px;
  font-size: 1rem;
  box-shadow: 0 2px 6px rgba(188, 74, 60, 0.3);
}
.crv-modal-head h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #1a1a1a;
  letter-spacing: -0.01em;
}
.crv-modal-close {
  background: #fff;
  border: 1px solid #d6d2c8;
  color: #525252;
  width: 30px; height: 30px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.crv-modal-close:hover { background: #f3efe7; color: #1a1a1a; border-color: #a8a39a; }
.crv-modal-body {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #1a1a1a;
}
.crv-field { display: flex; flex-direction: column; gap: 8px; }
.crv-field-label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #525252;
}
.crv-input {
  background: #fff;
  border: 1px solid #d6d2c8;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.95rem;
  color: #1a1a1a;
  font-family: inherit;
  width: 100%;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.crv-input:focus {
  outline: none;
  border-color: var(--pv-red, #BC4A3C);
  box-shadow: 0 0 0 3px rgba(188, 74, 60, 0.18);
}
.crv-select { appearance: none; cursor: pointer; background-image: linear-gradient(45deg, transparent 50%, #525252 50%), linear-gradient(135deg, #525252 50%, transparent 50%); background-position: calc(100% - 18px) 50%, calc(100% - 13px) 50%; background-size: 5px 5px; background-repeat: no-repeat; padding-right: 32px; }

/* KPI cards */
.crv-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}
.crv-kpi {
  background: #fff;
  border: 1px solid #e5e1d8;
  border-radius: 14px;
  padding: 18px 18px 20px;
  display: flex; flex-direction: column; gap: 4px;
  position: relative;
  overflow: hidden;
  min-height: 120px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.crv-kpi::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: var(--accent, #d6d2c8);
  border-radius: 14px 14px 0 0;
}
.crv-kpi--pending::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.crv-kpi--notified::before { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.crv-kpi--converted::before { background: linear-gradient(90deg, #10b981, #34d399); }
.crv-kpi--rate::before { background: linear-gradient(90deg, var(--pv-red, #BC4A3C), #D9633E); }

.crv-kpi-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #525252; }
.crv-kpi-value { font-family: var(--font-display); font-size: 2rem; font-weight: 900; color: #1a1a1a; line-height: 1; margin-top: 4px; }
.crv-kpi-sub { font-size: 0.85rem; color: #525252; font-weight: 600; }
.crv-kpi-hint { font-size: 0.72rem; color: #737373; margin-top: 2px; line-height: 1.4; }

.crv-kpi-bar {
  height: 5px;
  background: #e5e1d8;
  border-radius: 999px;
  margin-top: auto;
  overflow: hidden;
}
.crv-kpi-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--pv-red, #BC4A3C), #D9633E);
  border-radius: 999px;
  transition: width 0.4s ease;
}

/* Strip */
.crv-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 28px;
}
.crv-strip-card {
  display: flex; align-items: center; gap: 14px;
  background: #fff;
  border: 1px solid #e5e1d8;
  border-radius: 14px;
  padding: 14px 18px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.crv-strip-icon { font-size: 1.5rem; }
.crv-strip-text { display: flex; flex-direction: column; }
.crv-strip-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #525252; }
.crv-strip-value { font-family: var(--font-display); font-size: 1.1rem; font-weight: 800; color: #1a1a1a; margin-top: 2px; }

/* Section + table */
.crv-section { margin-bottom: 28px; }
.crv-section-title {
  font-size: 1.05rem; font-weight: 800;
  margin: 0 0 12px; color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.crv-table-wrap {
  border-radius: 14px;
  overflow: auto;
  background: #fff;
  border: 1px solid #e5e1d8;
  scrollbar-width: thin;
  scrollbar-color: rgba(15, 23, 42, 0.18) transparent;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.crv-table-wrap::-webkit-scrollbar { height: 6px; }
.crv-table-wrap::-webkit-scrollbar-thumb { background: rgba(15, 23, 42, 0.18); border-radius: 3px; }

.crv-table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
}
.crv-table th, .crv-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #efece4;
  font-size: 0.88rem;
  white-space: nowrap;
  color: #1a1a1a;
}
.crv-table tbody tr:last-child td { border-bottom: none; }
.crv-table tbody tr:hover { background: #faf7ef; }
.crv-table th {
  background: #f3efe7;
  font-weight: 700;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #525252;
  position: sticky;
  top: 0;
  z-index: 1;
}
.crv-table td.num, .crv-table th.num { text-align: right; font-variant-numeric: tabular-nums; }

.crv-thumb, .crv-mini-thumb {
  width: 48px; height: 48px; border-radius: 8px; overflow: hidden;
  background: linear-gradient(135deg, #faf7ef, #f3efe7);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  border: 1px solid #e5e1d8;
  position: relative;
}
.crv-mini-thumb { width: 36px; height: 36px; border-radius: 6px; }
.crv-thumb img, .crv-mini-thumb img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
.crv-noimg {
  font-size: 1.1rem;
  opacity: 0.55;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #a8a39a;
  background: linear-gradient(135deg, #faf7ef, #f3efe7);
}

.crv-name-cell { display: flex; align-items: center; gap: 10px; }
.crv-name { font-weight: 600; color: #1a1a1a; }

.crv-id { font-family: 'SF Mono', Menlo, monospace; font-size: 0.78rem; color: #525252; }
.crv-id--guest { color: #a8a39a; }

.crv-time { color: #525252; font-size: 0.82rem; white-space: nowrap; }

.crv-status {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 12px;
  font-size: 0.7rem; font-weight: 700;
  border-radius: 999px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  line-height: 1;
  border: 1px solid transparent;
}
.crv-status::before {
  content: '';
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.crv-status--pending  { background: #fef3c7; color: #92400e; border-color: #fde68a; }
.crv-status--notified { background: #dbeafe; color: #1e40af; border-color: #bfdbfe; }
.crv-status--converted{ background: #d1fae5; color: #065f46; border-color: #a7f3d0; }
.crv-status--expired  { background: #f3f4f6; color: #525252; border-color: #d6d2c8; }

.crv-empty {
  padding: 24px;
  text-align: center;
  color: #525252;
  background: #fff;
  border: 1px dashed #d6d2c8;
  border-radius: 14px;
  font-size: 0.9rem;
}

@media (max-width: 1100px) {
  .crv-kpis { grid-template-columns: repeat(2, 1fr); }
  .crv-strip { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .crv-kpis { grid-template-columns: 1fr; }
  .crv { padding: 20px 16px; }
  .crv-head { flex-direction: column; align-items: stretch; }
  .crv-table th, .crv-table td { padding: 10px 12px; font-size: 0.82rem; }
}
</style>
