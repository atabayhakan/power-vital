<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useTranslate } from '../composables/useTranslate';

const { t } = useTranslate();
const cartItemCount = ref(0);
const lastScrollY = ref(0);
const visible = ref(true);

const updateCartCount = () => {
  const saved = localStorage.getItem('pv_cart');
  if (saved) {
    try {
      const items = JSON.parse(saved);
      cartItemCount.value = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
    } catch { cartItemCount.value = 0; }
  } else {
    cartItemCount.value = 0;
  }
};

// 2026: Smart auto-hide on scroll down, show on scroll up
const handleScroll = () => {
  const y = window.scrollY;
  if (y < 80) { visible.value = true; return; }
  if (y > lastScrollY.value + 8) visible.value = false;  // scrolling down
  else if (y < lastScrollY.value - 8) visible.value = true; // scrolling up
  lastScrollY.value = y;
};

onMounted(() => {
  updateCartCount();
  window.addEventListener('cart-updated', updateCartCount);
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('cart-updated', updateCartCount);
  window.removeEventListener('scroll', handleScroll);
});

const openCart = () => {
  window.dispatchEvent(new CustomEvent('open-cart'));
};
</script>

<template>
  <nav class="bottom-nav mobile-only" :class="{ 'is-hidden': !visible }">
    <router-link to="/" class="bn-item" active-class="is-active">
      <span class="bn-icon-wrap">
        <span class="bn-icon">🏠</span>
        <span class="bn-dot"/>
      </span>
      <span class="bn-label">{{ t('bottomNav.home') }}</span>
    </router-link>

    <router-link to="/katalog" class="bn-item" active-class="is-active">
      <span class="bn-icon-wrap">
        <span class="bn-icon">💊</span>
        <span class="bn-dot"/>
      </span>
      <span class="bn-label">{{ t('bottomNav.catalog') }}</span>
    </router-link>

    <a
      href="https://wa.me/996771898889?text=%D0%A1%D0%B0%D0%BB%D0%B0%D0%BC%D0%B0%D1%82%D1%81%D1%8B%D0%B7%D0%B1%D1%8B%2C%20Power%20Vital!"
      target="_blank"
      rel="noopener noreferrer"
      class="bn-whatsapp"
      aria-label="WhatsApp"
      @click.stop
    >
      <span class="bn-wa-pulse" aria-hidden="true"/>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.6 14.2c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.5-.4zM12 2C6.5 2 2 6.5 2 12c0 1.7.5 3.4 1.3 4.8L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.2.8.9-3.1-.2-.3c-.9-1.4-1.4-3-1.4-4.6 0-4.6 3.7-8.4 8.4-8.4s8.4 3.7 8.4 8.4-3.7 8.6-8.3 8.6z"/>
      </svg>
    </a>

    <button class="bn-item bn-item--cart" @click="openCart">
      <span class="bn-icon-wrap">
        <span class="bn-icon">🛒</span>
        <span class="bn-badge" v-if="cartItemCount > 0">{{ cartItemCount }}</span>
        <span class="bn-dot"/>
      </span>
      <span class="bn-label">{{ t('bottomNav.cart') }}</span>
    </button>

    <router-link to="/login" class="bn-item" active-class="is-active">
      <span class="bn-icon-wrap">
        <span class="bn-icon">👤</span>
        <span class="bn-dot"/>
      </span>
      <span class="bn-label">{{ t('bottomNav.account') }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-bottom-nav, 99);
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  height: 72px;
  background: var(--glass-bg-heavy, rgba(249, 246, 241, 0.95));
  backdrop-filter: var(--glass-blur-heavy, blur(40px) saturate(200%));
  -webkit-backdrop-filter: var(--glass-blur-heavy);
  border-top: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.08);
  padding-bottom: env(safe-area-inset-bottom, 0);
  transform: translateY(0);
  transition: transform var(--duration-normal) var(--ease-smooth);
}
.bottom-nav.is-hidden {
  transform: translateY(100%);
}

.bn-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-decoration: none;
  color: var(--text-muted);
  min-height: 56px; /* 2026: 56x56 touch target */
  padding: 8px 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
  font-family: var(--font-body);
  transition: color var(--duration-fast) var(--ease-smooth);
  -webkit-tap-highlight-color: transparent;
}

/* 2026: iPhone-style raised center button. The BottomNav has 5 columns
   (Home, Catalog, WhatsApp, Cart, Account) — the WhatsApp slot is slightly
   wider so its circle can sit proud of the bar, just like the classic
   iPhone home button. The svg + pulse live on top of the nav glass. */
.bn-whatsapp {
  flex: 1.15;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  margin-top: -22px; /* raise the button so it overlaps the top edge */
  min-height: 56px;
}
.bn-whatsapp svg {
  width: 30px;
  height: 30px;
  color: #fff;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15));
}
.bn-whatsapp::before {
  content: '';
  position: absolute;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: linear-gradient(135deg, #25D366 0%, #1ebe5a 100%);
  box-shadow:
    0 6px 18px rgba(37, 211, 102, 0.45),
    0 2px 6px rgba(0, 0, 0, 0.12),
    inset 0 -2px 4px rgba(0, 0, 0, 0.12),
    inset 0 2px 3px rgba(255, 255, 255, 0.18);
  z-index: 1;
  transition: transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.bn-whatsapp:hover::before {
  transform: scale(1.05);
  box-shadow:
    0 10px 24px rgba(37, 211, 102, 0.55),
    0 4px 10px rgba(0, 0, 0, 0.15),
    inset 0 -2px 4px rgba(0, 0, 0, 0.12),
    inset 0 2px 3px rgba(255, 255, 255, 0.18);
}
.bn-whatsapp:active::before {
  transform: scale(0.94);
}
.bn-wa-pulse {
  position: absolute;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: rgba(37, 211, 102, 0.5);
  animation: bnWaPulse 2.4s ease-out infinite;
  z-index: 0;
  pointer-events: none;
}
@keyframes bnWaPulse {
  0%   { transform: scale(1);    opacity: 0.55; }
  100% { transform: scale(1.55); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .bn-wa-pulse { animation: none; opacity: 0; }
  .bn-whatsapp::before { transition: none; }
}
.bn-item:active {
  transform: scale(0.92);
}
.bn-item.is-active {
  color: var(--pv-red);
}
.bn-item.is-active .bn-dot {
  opacity: 1;
  transform: scaleX(1);
}
.bn-item.is-active .bn-icon {
  filter: grayscale(0);
  opacity: 1;
  transform: scale(1.1);
}

/* Icon wrapper with dot indicator */
.bn-icon-wrap {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bn-icon {
  font-size: 1.5rem;
  filter: grayscale(1);
  opacity: 0.5;
  transition: all var(--duration-fast) var(--ease-spring);
  line-height: 1;
}
.bn-dot {
  position: absolute;
  bottom: -2px;
  left: 50%;
  width: 16px;
  height: 3px;
  background: var(--pv-red);
  border-radius: var(--radius-pill);
  transform: translateX(-50%) scaleX(0);
  opacity: 0;
  transition: all var(--duration-normal) var(--ease-clay);
  box-shadow: 0 0 8px var(--pv-red-glow);
}

/* 2026: Cart badge — prominent pulsing */
.bn-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: var(--pv-red);
  color: var(--text-on-brand);
  font-size: 0.7rem;
  font-weight: 800;
  font-family: var(--font-display);
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--surface-card);
  box-shadow: 0 2px 6px rgba(188, 74, 60, 0.4);
  animation: badge-pop 0.4s var(--ease-clay);
}

@keyframes badge-pop {
  0% { transform: scale(0); }
  60% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.bn-label {
  font-size: 0.7rem; /* 2026: 11.2px — readable for older users */
  font-weight: 700;
  letter-spacing: 0.02em;
  font-family: var(--font-display);
}

.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .mobile-only {
    display: flex;
  }
}

/* 2026: Sub-pixel safe area inset for iOS 17+ */
@supports (padding: max(0px)) {
  .bottom-nav {
    padding-bottom: max(env(safe-area-inset-bottom, 0), 8px);
  }
}
</style>
