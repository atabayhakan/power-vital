<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useCurrentUser } from '../composables/useCurrentUser';
import { useAuthStore } from '../stores/useAuthStore';
import { useCartStore } from '../stores/useCartStore';
import { useRouter } from 'vue-router';
import axios from 'axios';

import LanguageSwitcher from './LanguageSwitcher.vue';
import GlobalSearch from './common/GlobalSearch.vue';
import CompareBadge from './common/CompareBadge.vue';
import { useFavorites } from '../composables/useFavorites';
import { useI18n } from 'vue-i18n';

const currentUser = useCurrentUser();
const authStore = useAuthStore();
const cartStore = useCartStore();
const favStore = useFavorites();
const router = useRouter();
const { t } = useI18n();

const openShareDialog = () => {
  window.dispatchEvent(new CustomEvent('pv-open-share-wishlist'));
};

const logoUrl = ref('');
const companyName = ref('Power Vital');
const logoScale = ref(1);

const openAuthModal = () => {
  window.dispatchEvent(new CustomEvent('open-auth-modal'));
};

const logout = () => {
  authStore.logout();
  router.push('/');
};

// 2026: Shrink-on-scroll
const scrolled = ref(false);
const handleScroll = () => {
  scrolled.value = window.scrollY > 40;
};

const fetchSettings = async () => {
  try {
    const res = await axios.get('/api/v1/settings');
    if (res.data) {
      logoUrl.value = res.data.logoUrl || '';
      companyName.value = res.data.companyName || 'Power Vital';
      logoScale.value = typeof res.data.logoScale === 'number' ? res.data.logoScale : 1;
    }
  } catch (e) {
    // console.error('Failed to load settings', _e);
  }
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
  fetchSettings();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <header class="global-navbar" :class="{ 'is-scrolled': scrolled }">
    <div class="nav-container">
      <!-- Logo -->
      <router-link to="/" class="nav-brand" :class="{ 'has-img': logoUrl }">
        <img v-if="logoUrl" :src="logoUrl" :alt="companyName" class="nav-logo-img" :style="{ '--logo-scale': logoScale }" />
        <template v-else>Power<span class="brand-accent">Vital</span></template>
      </router-link>

      <!-- Desktop Links -->
      <nav class="nav-links desktop-only">
        <router-link to="/" class="nav-link">{{ t('nav.home') }}</router-link>
        <router-link to="/katalog" class="nav-link">{{ t('nav.catalog') }}</router-link>
      </nav>

      <!-- Search (desktop only — hidden on mobile to save space) -->
      <div class="nav-search desktop-only">
        <GlobalSearch />
      </div>

      <!-- Actions -->
      <div class="nav-actions">
        <LanguageSwitcher class="lang-switcher" />

        <div class="auth-group desktop-only">
          <template v-if="authStore.userRole === 'guest'">
            <button class="nav-auth-btn guest-btn" @click="openAuthModal">
              {{ t('nav.login') }}
            </button>
          </template>

          <template v-else>
            <div class="user-dropdown">
              <button class="nav-auth-btn user-btn" :aria-label="t('common.account')">
                <span class="user-icon">👤</span>
                <span class="user-name-text">{{ currentUser?.name?.split(' ')[0] || t('nav.dashboard') }}</span>
                <svg class="dropdown-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div class="dropdown-menu">
                <router-link v-if="authStore.userRole === 'admin'" to="/admin" class="dropdown-item admin-glow">
                  <span>👑</span> God Mode Panel
                </router-link>
                <router-link v-else to="/dashboard" class="dropdown-item">
                  <span>📊</span> {{ t('nav.dashboard') }}
                </router-link>
                <button @click="logout" class="dropdown-item text-red">
                  <span>🚪</span> {{ t('nav.logout') }}
                </button>
              </div>
            </div>
          </template>
        </div>

        <CompareBadge class="compare-badge-slot" />

        <button
          class="fav-btn"
          @click="openShareDialog"
          :aria-label="t('share.openDialog')"
          :title="t('share.openDialog')"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" :fill="favStore.has('placeholder') ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span v-if="favStore.count.value > 0" class="fav-count">{{ favStore.count.value }}</span>
        </button>

        <button class="cart-btn" @click="cartStore.isCartOpen = true" :aria-label="t('common.cart')">
          <span class="cart-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          </span>
          <span class="cart-badge" v-if="cartStore.cartItemCount > 0">{{ cartStore.cartItemCount }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.global-navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--surface-card, rgba(255,255,255,0.85));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--surface-inset, rgba(0,0,0,0.05));
  transition: all var(--duration-normal) cubic-bezier(0.4, 0, 0.2, 1);
  padding: 16px 0;
}
.global-navbar.is-scrolled {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  background: rgba(249, 246, 241, 0.98);
}

.nav-container {
  max-width: var(--container-max, 1440px);
  margin: 0 auto;
  padding: 0 var(--container-padding, 32px);
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: height var(--duration-normal) var(--ease-smooth);
}
.is-scrolled .nav-container { height: 60px; }

.nav-brand {
  text-decoration: none;
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 900;
  letter-spacing: -1.5px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: transform var(--duration-fast) var(--ease-spring), filter 0.3s ease;
  background: linear-gradient(135deg, var(--text-primary) 0%, #a0a0a0 100%);
  -webkit-background-clip: text;
  color: transparent;
  filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.05));
}
.nav-brand.has-img {
  background: transparent;
  -webkit-background-clip: initial;
  color: initial;
  filter: none;
}
.nav-brand:hover { transform: scale(1.02); filter: drop-shadow(0px 4px 8px rgba(0,0,0,0.1)); }
.nav-brand.has-img:hover { filter: none; }
.brand-accent {
  background: linear-gradient(135deg, var(--pv-red) 0%, #993322 100%);
  -webkit-background-clip: text;
  color: transparent;
}
.nav-logo-img {
  --logo-scale: 1;
  max-width: calc(260px * var(--logo-scale));
  height: auto;
  max-height: calc(70px * var(--logo-scale));
  object-fit: contain;
  transition: max-height var(--duration-normal);
  filter: brightness(1.1) contrast(1.2);
  mix-blend-mode: multiply;
}
.is-scrolled .nav-logo-img {
  max-height: calc(50px * var(--logo-scale));
}

.nav-links { display: flex; gap: 32px; }
.nav-link {
  position: relative;
  text-decoration: none;
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.95rem;
  padding: 8px 4px;
  transition: color var(--duration-fast) var(--ease-smooth);
}
/* 2026: Animated underline */
.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: var(--pv-red);
  transition: all var(--duration-normal) var(--ease-clay);
  transform: translateX(-50%);
  border-radius: var(--radius-pill);
}
.nav-link:hover, .nav-link.router-link-active { color: var(--pv-red); }
.nav-link:hover::after, .nav-link.router-link-active::after {
  width: 100%;
}

.nav-actions { display: flex; align-items: center; gap: 8px; }
.lang-switcher { margin-right: 8px; }

.fav-btn,
.cart-btn {
  position: relative;
  background: var(--surface-card);
  border: 1px solid var(--surface-inset);
  width: 48px;
  height: 48px;
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--clay-shadow-xs);
  transition: all var(--duration-fast) var(--ease-clay);
  color: var(--text-primary);
  -webkit-tap-highlight-color: transparent;
}
.cart-btn:hover,
.fav-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: var(--clay-shadow-sm);
  color: var(--pv-red);
}
.cart-btn:active,
.fav-btn:active { transform: scale(0.92); }
.fav-btn { color: var(--pv-red); }
.fav-count {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--pv-red, #BC4A3C);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--surface-white, #fff);
}
.cart-icon { display: flex; }
.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--pv-red);
  color: var(--text-on-brand);
  font-size: 0.7rem;
  font-weight: 800;
  font-family: var(--font-display);
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--surface-card);
  box-shadow: 0 2px 8px rgba(188, 74, 60, 0.4);
  animation: badge-pop 0.4s var(--ease-clay);
}
@keyframes badge-pop { 0% { transform: scale(0); } 60% { transform: scale(1.3); } 100% { transform: scale(1); } }

.auth-group { margin-right: 8px; display: flex; align-items: center; }
.nav-auth-btn {
  border: 1px solid var(--surface-inset);
  background: var(--surface-card);
  padding: 10px 18px;
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--clay-shadow-xs);
  transition: all var(--duration-fast) var(--ease-spring);
  min-height: 44px;
}
.nav-auth-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--clay-shadow-sm);
  color: var(--pv-red);
}
.guest-btn:hover { color: var(--pv-red); }
.user-icon { font-size: 1.1rem; }
.user-name-text {
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dropdown-chevron { transition: transform var(--duration-fast); }

/* User Dropdown */
.user-dropdown { position: relative; }
.user-dropdown::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  height: 12px;
}
.dropdown-menu {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 220px;
  background: var(--surface-card);
  border: 1px solid var(--surface-inset);
  border-radius: var(--radius-lg);
  padding: 8px;
  box-shadow: var(--clay-shadow-md), 0 20px 60px rgba(0, 0, 0, 0.12);
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px);
  transition: all var(--duration-fast) var(--ease-clay);
  z-index: 10;
}
.user-dropdown:hover .dropdown-menu,
.user-dropdown:focus-within .dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.user-dropdown:hover .dropdown-chevron { transform: rotate(180deg); }

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  border: none;
  background: transparent;
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--duration-fast), color var(--duration-fast);
}
.dropdown-item:hover { background: var(--surface-inset); color: var(--text-primary); }
.dropdown-item.text-red { color: var(--color-error); }
.admin-glow {
  background: var(--pv-gradient);
  color: var(--text-on-brand) !important;
  font-weight: 800;
  margin-bottom: 6px;
  box-shadow: 0 4px 12px var(--pv-red-glow);
}
.admin-glow:hover {
  background: var(--pv-gradient) !important;
  color: var(--text-on-brand) !important;
  box-shadow: 0 6px 20px var(--pv-red-glow-strong);
}

.desktop-only { display: flex; }

/* Mobile */
.nav-search {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 520px;
  margin: 0 16px;
}

@media (max-width: 768px) {
  .global-navbar {
    border-radius: 0;
    background: var(--surface-card);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  .nav-container { padding: 0 16px; height: 64px; }
  .is-scrolled .nav-container { height: 56px; }
  .nav-brand { font-size: 1.4rem; }
  .nav-logo-img { max-width: calc(180px * var(--logo-scale)); max-height: calc(44px * var(--logo-scale)); }
  .is-scrolled .nav-logo-img { max-height: calc(36px * var(--logo-scale)); }
  .desktop-only { display: none !important; }
  .cart-btn { width: 44px; height: 44px; }
}
</style>
