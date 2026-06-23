<script setup lang="ts">
// FloatingChat — a fixed bottom-right WhatsApp button. Stays in
// place across all pages so the visitor always has a one-tap path
// to a human, no matter how deep they are in the catalogue.
//
// We use a static wa.me link (no API) — opening WhatsApp web/app
// with a pre-filled message keeps the conversation fast. The phone
// number is the public shop number (topbar phone) so visitors who
// see the same number twice trust the brand.
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const phone = ref('+996771898889'); // Sensible default; updated from /settings
const message = ref('');

const cleanPhone = (raw: string): string => (raw || '').replace(/[^0-9]/g, '');

const waLink = computed(() => {
  const num = cleanPhone(phone.value);
  if (!num) return '#';
  const text = encodeURIComponent(message.value || 'Саламатсызбы, Power Vital!');
  return `https://wa.me/${num}?text=${text}`;
});

onMounted(async () => {
  try {
    const res = await axios.get('/api/v1/settings');
    if (res.data?.topbarPhone) {
      phone.value = res.data.topbarPhone;
    }
  } catch {
    // Stay on default — button still works with a generic message.
  }
});
</script>

<template>
  <a
    :href="waLink"
    target="_blank"
    rel="noopener noreferrer"
    class="fc-button"
    aria-label="WhatsApp"
  >
    <span class="fc-pulse" aria-hidden="true"/>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.6 14.2c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.5-.4zM12 2C6.5 2 2 6.5 2 12c0 1.7.5 3.4 1.3 4.8L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.2.8.9-3.1-.2-.3c-.9-1.4-1.4-3-1.4-4.6 0-4.6 3.7-8.4 8.4-8.4s8.4 3.7 8.4 8.4-3.7 8.6-8.3 8.6z"/>
    </svg>
    <span class="fc-label">WhatsApp</span>
  </a>
</template>

<style scoped>
.fc-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 99;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px 12px 14px;
  background: linear-gradient(135deg, #25D366 0%, #1ebe5a 100%);
  color: #fff;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
  border-radius: 999px;
  text-decoration: none;
  box-shadow:
    0 6px 18px rgba(37, 211, 102, 0.4),
    0 2px 6px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    box-shadow 0.2s ease;
}
.fc-button:hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow:
    0 12px 28px rgba(37, 211, 102, 0.5),
    0 4px 10px rgba(0, 0, 0, 0.15);
}
.fc-button:active { transform: scale(0.96); }
.fc-button svg { flex-shrink: 0; }

/* Soft pulse — draws the eye to the button without being noisy */
.fc-pulse {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(37, 211, 102, 0.5);
  animation: fcPulse 2.4s ease-out infinite;
  z-index: -1;
  pointer-events: none;
}
@keyframes fcPulse {
  0%   { transform: scale(1);    opacity: 0.55; }
  100% { transform: scale(1.5);  opacity: 0; }
}

/* Mobile: hidden — WhatsApp is now the raised center button on BottomNav */
@media (max-width: 768px) {
  .fc-button {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fc-pulse { animation: none; opacity: 0; }
  .fc-button { transition: none; }
}
</style>
