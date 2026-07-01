<script setup lang="ts">
// ShareWishlistDialog — a centered modal that lets the visitor
// share their wishlist via WhatsApp / Telegram / Email or by
// copying a short URL. The QR is generated on demand from the
// URL (lazy import keeps the bundle small for the 99% of
// visitors who never open this dialog).
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useShareWishlist } from '../../composables/useShareWishlist';
import { useTranslate } from '../../composables/useTranslate';
import { useFavorites } from '../../composables/useFavorites';
import { formatPrice } from '../../utils/PriceEngine';
import LazyImage from '../common/LazyImage.vue';

const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const { items, shareUrl, body, channels, copy, open } = useShareWishlist();
const { t } = useTranslate();
const favorites = useFavorites();

const qrDataUrl = ref('');
const isCopied = ref(false);
let copyTimeout: number | null = null;

const close = () => emit('close');

// Generate the QR lazily — only when the dialog is visible AND
// the visitor actually opens the QR tab. Stays out of the way
// for the WhatsApp-first majority.
const ensureQr = async () => {
  if (qrDataUrl.value || !shareUrl.value) return;
  try {
    const QRCode = await import('qrcode');
    qrDataUrl.value = await QRCode.toDataURL(shareUrl.value, {
      width: 220,
      margin: 1,
      color: { dark: '#18181b', light: '#ffffff' }
    });
  } catch {
    // No QR available (offline / test env). The URL text + copy
    // button remain usable.
    qrDataUrl.value = '';
  }
};

const onCopy = async () => {
  const ok = await copy();
  if (!ok) return;
  isCopied.value = true;
  if (copyTimeout) window.clearTimeout(copyTimeout);
  copyTimeout = window.setTimeout(() => { isCopied.value = false; }, 2000);
};

const onChannel = (channelId: 'whatsapp' | 'telegram' | 'email') => {
  const ch = channels.find((c) => c.id === channelId);
  if (ch) open(ch);
};

const removeOne = (id: string) => favorites.remove(id);

// Keyboard close (Esc) — kept simple, no focus trap needed
// because the dialog is full-screen modal.
const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) close();
};
onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <Transition name="sw-fade">
    <div v-if="isOpen" class="sw-backdrop" @click.self="close" role="presentation">
      <div class="sw-dialog" role="dialog" aria-modal="true" :aria-label="t('share.title')">
        <header class="sw-head">
          <h2 class="sw-title">
            <span class="sw-emoji" aria-hidden="true">💌</span>
            {{ t('share.title') }}
          </h2>
          <button class="sw-close" @click="close" :aria-label="t('common.close')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </header>

        <div v-if="items.length === 0" class="sw-empty">
          <span class="sw-empty-icon" aria-hidden="true">💝</span>
          <p class="sw-empty-title">{{ t('share.emptyTitle') }}</p>
          <p class="sw-empty-sub">{{ t('share.emptySub') }}</p>
          <button class="sw-cta sw-cta--primary" @click="close">{{ t('share.continueBrowsing') }}</button>
        </div>

        <div v-else class="sw-body">
          <!-- Item previews — gives the visitor (and the recipient
               when they preview the link) a sense of what's being
               shared before they tap a channel. -->
          <ul class="sw-items">
            <li v-for="f in items" :key="f.id" class="sw-item">
              <span class="sw-thumb">
                <LazyImage v-if="f.imageUrl" :src="f.imageUrl" :alt="f.name" :width="56" :height="56" />
                <span v-else class="sw-noimg">📦</span>
              </span>
              <div class="sw-info">
                <span class="sw-name">{{ f.name }}</span>
                <span class="sw-price">{{ formatPrice(f.basePriceKgs) }} KGS</span>
              </div>
              <button class="sw-remove" @click="removeOne(f.id)" :aria-label="t('share.removeFromList')">✕</button>
            </li>
          </ul>

          <!-- Share channels -->
          <div class="sw-section">
            <h3 class="sw-section-title">{{ t('share.shareVia') }}</h3>
            <div class="sw-channels">
              <button class="sw-channel" @click="onChannel('whatsapp')">
                <span class="sw-channel-icon" aria-hidden="true">💬</span>
                <span class="sw-channel-label">WhatsApp</span>
              </button>
              <button class="sw-channel" @click="onChannel('telegram')">
                <span class="sw-channel-icon" aria-hidden="true">✈️</span>
                <span class="sw-channel-label">Telegram</span>
              </button>
              <button class="sw-channel" @click="onChannel('email')">
                <span class="sw-channel-icon" aria-hidden="true">✉️</span>
                <span class="sw-channel-label">Email</span>
              </button>
            </div>
          </div>

          <!-- Copy link + QR -->
          <div class="sw-section">
            <h3 class="sw-section-title">{{ t('share.orCopyLink') }}</h3>
            <div class="sw-link-row">
              <input
                class="sw-link-input"
                type="text"
                readonly
                :value="shareUrl"
                @focus="(e: any) => e.target.select()"
              />
              <button
                class="sw-copy"
                :class="{ 'is-copied': isCopied }"
                @click="onCopy"
              >
                {{ isCopied ? '✓ ' + t('share.copied') : t('share.copy') }}
              </button>
            </div>
            <details class="sw-qr-wrap" @toggle="(e: any) => { if (e.target.open) void ensureQr(); }">
              <summary class="sw-qr-toggle">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <path d="M14 14h3v3h-3zM18 18h3v3h-3z"/>
                </svg>
                {{ t('share.showQr') }}
              </summary>
              <div v-if="qrDataUrl" class="sw-qr">
                <img :src="qrDataUrl" :alt="t('share.qrAlt')" />
                <p class="sw-qr-hint">{{ t('share.scanHint') }}</p>
              </div>
            </details>
          </div>

          <!-- Preview text (collapsed by default — useful when
               verifying what the WhatsApp message will look like). -->
          <details class="sw-preview">
            <summary class="sw-preview-toggle">{{ t('share.previewMessage') }}</summary>
            <pre class="sw-preview-body">{{ body }}</pre>
          </details>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.sw-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.sw-dialog {
  background: var(--surface-white, #fff);
  border-radius: 20px;
  width: 100%;
  max-width: 540px;
  max-height: 92vh;
  overflow-y: auto;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.30);
}

.sw-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  background: var(--surface-white, #fff);
  z-index: 1;
  border-radius: 20px 20px 0 0;
}
.sw-title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary, #18181b);
}
.sw-emoji { font-size: 1.2rem; }
.sw-close {
  background: transparent;
  border: none;
  color: var(--text-secondary, #3f3f46);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sw-close:hover { background: rgba(0, 0, 0, 0.05); color: var(--text-primary, #18181b); }

.sw-body {
  padding: 16px 22px 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sw-empty {
  padding: 32px 22px;
  text-align: center;
}
.sw-empty-icon { font-size: 3rem; opacity: 0.5; display: block; margin-bottom: 12px; }
.sw-empty-title { font-family: var(--font-display); font-weight: 800; font-size: 1.05rem; margin: 0 0 6px; color: var(--text-primary, #18181b); }
.sw-empty-sub { font-size: 0.88rem; color: var(--text-muted, #71717a); margin: 0 0 18px; }

.sw-items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  padding: 8px;
  background: #fafafa;
}
.sw-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface-white, #fff);
  border-radius: 10px;
  padding: 6px 8px;
}
.sw-thumb {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 8px;
  background: #fafafa;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sw-noimg { font-size: 1rem; opacity: 0.4; }
.sw-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.sw-name { font-size: 0.85rem; font-weight: 600; color: var(--text-primary, #18181b); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sw-price { font-family: var(--font-display); font-weight: 800; font-size: 0.82rem; color: var(--pv-red, #BC4A3C); }
.sw-remove {
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-secondary, #3f3f46);
  width: 26px;
  height: 26px;
  border-radius: 50%;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sw-remove:hover { background: var(--color-error, #dc2626); color: #fff; }

.sw-section { display: flex; flex-direction: column; gap: 10px; }
.sw-section-title {
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted, #71717a);
  margin: 0;
}

.sw-channels {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.sw-channel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  background: var(--surface-white, #fff);
  border-radius: 14px;
  cursor: pointer;
  font-family: var(--font-body);
  transition: transform 0.15s, border-color 0.15s, background 0.15s;
}
.sw-channel:hover { transform: translateY(-2px); border-color: var(--pv-red, #BC4A3C); background: rgba(188, 74, 60, 0.05); }
.sw-channel:active { transform: scale(0.97); }
.sw-channel-icon { font-size: 1.5rem; line-height: 1; }
.sw-channel-label { font-weight: 700; font-size: 0.82rem; color: var(--text-primary, #18181b); }

.sw-link-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.sw-link-input {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border: 1.5px solid rgba(0, 0, 0, 0.10);
  border-radius: 10px;
  font-family: 'SF Mono', Menlo, monospace;
  font-size: 0.78rem;
  background: #fafafa;
  color: var(--text-primary, #18181b);
  outline: none;
}
.sw-link-input:focus { border-color: var(--pv-red, #BC4A3C); background: #fff; }
.sw-copy {
  padding: 0 16px;
  border: none;
  background: var(--pv-red, #BC4A3C);
  color: #fff;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.86rem;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, transform 0.15s;
}
.sw-copy:hover { background: var(--pv-red-dark, #A0341F); }
.sw-copy:active { transform: scale(0.96); }
.sw-copy.is-copied { background: var(--color-success, #2D8A56); }

.sw-qr-wrap { margin-top: 4px; }
.sw-qr-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary, #3f3f46);
  cursor: pointer;
  user-select: none;
  padding: 4px 0;
}
.sw-qr-toggle:hover { color: var(--text-primary, #18181b); }
.sw-qr {
  margin-top: 10px;
  padding: 14px;
  background: #fafafa;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.sw-qr img { width: 200px; height: 200px; border-radius: 8px; }
.sw-qr-hint { font-size: 0.78rem; color: var(--text-muted, #71717a); margin: 0; }

.sw-preview { margin-top: 4px; }
.sw-preview-toggle {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary, #3f3f46);
  cursor: pointer;
  user-select: none;
  padding: 4px 0;
}
.sw-preview-toggle:hover { color: var(--text-primary, #18181b); }
.sw-preview-body {
  margin: 8px 0 0;
  padding: 10px 12px;
  background: #fafafa;
  border-radius: 10px;
  font-family: 'SF Mono', Menlo, monospace;
  font-size: 0.78rem;
  white-space: pre-wrap;
  color: var(--text-primary, #18181b);
  border: 1px solid rgba(0, 0, 0, 0.05);
  max-height: 200px;
  overflow-y: auto;
}

.sw-cta {
  padding: 10px 18px;
  border-radius: 999px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  margin-top: 4px;
}
.sw-cta--primary { background: var(--pv-red, #BC4A3C); color: #fff; }
.sw-cta--primary:hover { background: var(--pv-red-dark, #A0341F); }

.sw-fade-enter-active, .sw-fade-leave-active { transition: opacity 0.25s ease; }
.sw-fade-enter-from, .sw-fade-leave-to { opacity: 0; }

@media (max-width: 600px) {
  .sw-channels { grid-template-columns: 1fr; }
  .sw-link-row { flex-direction: column; }
  .sw-copy { padding: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .sw-fade-enter-active, .sw-fade-leave-active { transition: none; }
  .sw-channel, .sw-copy { transition: none; }
}
</style>
