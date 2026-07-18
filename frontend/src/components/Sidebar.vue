<script setup lang="ts">
// Sidebar — reorganised admin nav (2026-06).
//
// Structure (admin):
//   📊 Genel Bakış           → /admin
//   🛒 Operasyonlar          → orders, payouts, pos
//   👥 İnsanlar              → users, network, bonus, simulation
//   📦 Katalog               → products, categories
//   🎨 İçerik (CMS)          → page-builder, pages, slider, media, reviews
//   🏢 Sistem                → İzleme (analytics, logs)
//                              Otomasyon (broadcast, scheduled, cart-recovery)
//                              Yapılandırma (i18n, finance, site-settings)
//
// Distributor sees a slimmed-down version (Dashboard / Network / Bonus / POS).
// Customer sees the standard account menu.
//
// Notes:
//   • The three System subgroups are rendered as <details>/<summary>
//     accordions so they collapse on small screens and never get
//     rendered twice (the old version duplicated /admin three times).
//   • Mobile drawer keeps the standard nav. The 4-item shortcut
//     row at the top of the old drawer is removed — it duplicated
//     the same items appearing lower in the drawer.
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMlm } from '../composables/useMlm';
import { useAuthStore } from '../stores/useAuthStore';
import { useTranslate } from '../composables/useTranslate';
import LanguageSwitcher from './LanguageSwitcher.vue';

const { t } = useTranslate();

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { isMlmEnabled, fetchMlmStatus } = useMlm();

const isMobileOpen = ref(false);
const toggleMobileMenu = () => { isMobileOpen.value = !isMobileOpen.value; };
const closeMobile = () => { isMobileOpen.value = false; };

onMounted(() => { fetchMlmStatus(); });

const isAdmin = computed(() => authStore.userRole === 'admin');
const isCashier = computed(() => authStore.userRole === 'cashier');
const isDistributor = computed(() => authStore.userRole === 'distributor');
const isCustomer = computed(() => authStore.userRole === 'customer');


const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
const goToHome = () => { router.push('/'); };

const isActive = (path: string) => route.path === path;
const isActivePrefix = (prefix: string) => route.path === prefix || route.path.startsWith(prefix + '/');

// Auto-expand the System subgroup that contains the active route
const systemOpen = ref({
  monitoring: true,
  automation: true,
  config: true
});
watch(() => route.path, (p) => {
  if (p.startsWith('/admin-push-analytics') || p === '/admin-logs') systemOpen.value.monitoring = true;
  if (p.startsWith('/admin-broadcast') || p === '/admin-scheduled' || p === '/admin-cart-recovery') systemOpen.value.automation = true;
  if (p === '/i18n' || p.startsWith('/i18n/') || p === '/finance-settings' || p === '/site-settings') systemOpen.value.config = true;
}, { immediate: true });
</script>

<template>
  <header class="mobile-topbar">
    <button class="mobile-hamburger" @click="toggleMobileMenu" :aria-label="isMobileOpen ? 'Menüyü kapat' : 'Menüyü aç'">
      <span v-if="!isMobileOpen">☰</span>
      <span v-else>✕</span>
    </button>
    <span class="mobile-topbar__title">{{ (route.meta.title as string) || 'Power Vital' }}</span>
  </header>

  <div class="sidebar-overlay" v-if="isMobileOpen" @click="closeMobile"/>

  <aside class="sidebar tactile-dark" :class="{ 'is-mobile-open': isMobileOpen }">
    <div class="logo-area" @click="goToHome">
      <div class="logo-box">
        <h2 class="brand-text">POWER <span class="vital">VITAL</span></h2>
        <span class="brand-badge">HQ</span>
      </div>
    </div>

    <div class="lang-wrap">
      <LanguageSwitcher />
    </div>

    <nav class="nav-links scrollable-nav" @click="closeMobile">

      <!-- ═══ CUSTOMER — Hesabım ═══ -->
      <div v-if="isCustomer" class="nav-group">
        <div class="nav-section-title">{{ t('sidebar.secAccount') }}</div>
        <router-link to="/account" class="nav-item" :class="{ active: isActive('/account') }">
          <span class="icon">👤</span>
          <span class="label">{{ t('sidebar.profile') }}</span>
        </router-link>
        <router-link to="/orders" class="nav-item" :class="{ active: isActivePrefix('/orders') }">
          <span class="icon">📦</span>
          <span class="label">{{ t('sidebar.orderHistory') }}</span>
        </router-link>
        <router-link to="/account/wallet" class="nav-item" :class="{ active: isActive('/account/wallet') }">
          <span class="icon">💳</span>
          <span class="label">{{ t('sidebar.walletRewards') }}</span>
        </router-link>
        <router-link to="/account/support" class="nav-item" :class="{ active: isActive('/account/support') }">
          <span class="icon">🎧</span>
          <span class="label">{{ t('sidebar.support') }}</span>
        </router-link>
      </div>

      <!-- ═══ DISTRIBUTOR ═══ -->
      <div v-if="isDistributor" class="nav-group">
        <div class="nav-section-title">{{ t('sidebar.secDistributor') }}</div>
        <router-link to="/dashboard" class="nav-item" :class="{ active: isActive('/dashboard') }">
          <span class="icon">📊</span>
          <span class="label">{{ t('sidebar.dashboard') }}</span>
        </router-link>
        <router-link to="/orders" class="nav-item" :class="{ active: isActivePrefix('/orders') }">
          <span class="icon">📦</span>
          <span class="label">{{ t('sidebar.orderHistory') }}</span>
        </router-link>
        <router-link to="/account/wallet" class="nav-item" :class="{ active: isActive('/account/wallet') }">
          <span class="icon">💳</span>
          <span class="label">{{ t('sidebar.walletRewards') }}</span>
        </router-link>
        <router-link v-if="isMlmEnabled" to="/network" class="nav-item" :class="{ active: isActive('/network') }">
          <span class="icon">🌳</span>
          <span class="label">{{ t('sidebar.tree') }}</span>
        </router-link>
        <router-link to="/account/support" class="nav-item" :class="{ active: isActive('/account/support') }">
          <span class="icon">🎧</span>
          <span class="label">{{ t('sidebar.support') }}</span>
        </router-link>
      </div>

      <!-- ═══ ADMIN NAV ═══ -->
      <template v-if="isAdmin || isCashier">

        <!-- 📊 Genel Bakış -->
        <div class="nav-group">
          <router-link to="/admin" class="nav-item" :class="{ active: isActive('/admin') }">
            <span class="icon">📊</span>
            <span class="label">{{ t('sidebar.metrics') }}</span>
          </router-link>
        </div>

        <!-- 🛒 Operasyonlar -->
        <div class="nav-group" v-if="isAdmin || isCashier">
          <div class="nav-section-title">{{ t('sidebar.secOps') }}</div>
          <router-link v-if="isAdmin" to="/orders" class="nav-item" :class="{ active: isActivePrefix('/orders') }">
            <span class="icon">🛍️</span>
            <span class="label">{{ t('sidebar.orderMgmt') }}</span>
          </router-link>
          <router-link v-if="isAdmin" to="/finance-payouts" class="nav-item" :class="{ active: isActive('/finance-payouts') }">
            <span class="icon">💸</span>
            <span class="label">{{ t('sidebar.payouts') }}</span>
          </router-link>
          <router-link v-if="isAdmin" to="/support-inbox" class="nav-item" :class="{ active: isActive('/support-inbox') }">
            <span class="icon">🎧</span>
            <span class="label">{{ t('sidebar.supportInbox') }}</span>
          </router-link>
          <router-link to="/pos" class="nav-item" :class="{ active: isActive('/pos') }">
            <span class="icon">💵</span>
            <span class="label">{{ t('sidebar.pos') }}</span>
          </router-link>
        </div>

        <!-- 👥 İnsanlar -->
        <div class="nav-group" v-if="isAdmin">
          <div class="nav-section-title">{{ t('sidebar.secPeople') }}</div>
          <router-link to="/user-management" class="nav-item" :class="{ active: isActive('/user-management') }">
            <span class="icon">👥</span>
            <span class="label">{{ t('sidebar.userCenter') }}</span>
          </router-link>
          <router-link v-if="isMlmEnabled" to="/network" class="nav-item" :class="{ active: isActive('/network') }">
            <span class="icon">🌳</span>
            <span class="label">{{ t('sidebar.tree') }}</span>
          </router-link>
          <router-link v-if="isMlmEnabled" to="/bonus-control" class="nav-item" :class="{ active: isActive('/bonus-control') }">
            <span class="icon">💎</span>
            <span class="label">{{ t('sidebar.bonus') }}</span>
          </router-link>
          <router-link v-if="isMlmEnabled" to="/simulation" class="nav-item" :class="{ active: isActive('/simulation') }">
            <span class="icon">🔮</span>
            <span class="label">{{ t('sidebar.simulation') }}</span>
          </router-link>
        </div>

        <!-- 📦 Katalog -->
        <div class="nav-group" v-if="isAdmin">
          <div class="nav-section-title">{{ t('sidebar.secCatalog') }}</div>
          <router-link to="/products" class="nav-item" :class="{ active: isActive('/products') }">
            <span class="icon">💊</span>
            <span class="label">{{ t('sidebar.products') }}</span>
          </router-link>
          <router-link to="/categories" class="nav-item" :class="{ active: isActive('/categories') }">
            <span class="icon">🗂️</span>
            <span class="label">{{ t('sidebar.categories') }}</span>
          </router-link>
        </div>

        <!-- 🎨 İçerik (CMS) -->
        <div class="nav-group" v-if="isAdmin">
          <div class="nav-section-title">{{ t('sidebar.secCms') }}</div>
          <router-link to="/cms/page-builder" class="nav-item" :class="{ active: isActive('/cms/page-builder') }">
            <span class="icon">🎨</span>
            <span class="label">{{ t('sidebar.pageBuilder') }}</span>
          </router-link>
          <router-link to="/cms/pages" class="nav-item" :class="{ active: isActive('/cms/pages') }">
            <span class="icon">📄</span>
            <span class="label">{{ t('sidebar.contentPages') }}</span>
          </router-link>
          <router-link to="/cms/slider-manage" class="nav-item" :class="{ active: isActive('/cms/slider-manage') }">
            <span class="icon">🖼️</span>
            <span class="label">{{ t('sidebar.sliders') }}</span>
          </router-link>
          <router-link to="/cms/media-library" class="nav-item" :class="{ active: isActive('/cms/media-library') }">
            <span class="icon">📁</span>
            <span class="label">{{ t('sidebar.media') }}</span>
          </router-link>
          <router-link to="/cms/reviews" class="nav-item" :class="{ active: isActive('/cms/reviews') }">
            <span class="icon">💬</span>
            <span class="label">{{ t('sidebar.reviewMod') }}</span>
          </router-link>
        </div>

        <!-- 🏢 Sistem (3 alt grup, collapsed accordion) -->
        <div class="nav-group" v-if="isAdmin">
          <div class="nav-section-title">{{ t('sidebar.secSystem') }}</div>

          <details class="nav-subgroup" :open="systemOpen.monitoring">
            <summary>
              <span class="icon">📈</span>
              <span class="label">{{ t('sidebar.sysMonitoring') }}</span>
            </summary>
            <router-link to="/admin-push-analytics" class="nav-item nav-item--sub" :class="{ active: isActive('/admin-push-analytics') }">
              <span class="icon">📊</span>
              <span class="label">{{ t('sidebar.pushAnalytics') }}</span>
            </router-link>
            <router-link to="/admin-logs" class="nav-item nav-item--sub" :class="{ active: isActive('/admin-logs') }">
              <span class="icon">📜</span>
              <span class="label">{{ t('sidebar.liveLogs') }}</span>
            </router-link>
            <router-link to="/admin-errors" class="nav-item nav-item--sub" :class="{ active: isActive('/admin-errors') }">
              <span class="icon">🐞</span>
              <span class="label">{{ t('sidebar.clientErrors') }}</span>
            </router-link>
          </details>

          <details class="nav-subgroup" :open="systemOpen.automation">
            <summary>
              <span class="icon">⚙️</span>
              <span class="label">{{ t('sidebar.sysAutomation') }}</span>
            </summary>
            <router-link to="/admin-broadcast" class="nav-item nav-item--sub" :class="{ active: isActive('/admin-broadcast') }">
              <span class="icon">📣</span>
              <span class="label">{{ t('sidebar.broadcast') }}</span>
            </router-link>
            <router-link to="/admin-scheduled" class="nav-item nav-item--sub" :class="{ active: isActive('/admin-scheduled') }">
              <span class="icon">⏰</span>
              <span class="label">{{ t('sidebar.scheduled') }}</span>
            </router-link>
            <router-link to="/admin-cart-recovery" class="nav-item nav-item--sub" :class="{ active: isActive('/admin-cart-recovery') }">
              <span class="icon">🛒</span>
              <span class="label">{{ t('sidebar.cartRecovery') }}</span>
            </router-link>
          </details>

          <details class="nav-subgroup" :open="systemOpen.config">
            <summary>
              <span class="icon">🔧</span>
              <span class="label">{{ t('sidebar.sysConfig') }}</span>
            </summary>
            <router-link to="/i18n" class="nav-item nav-item--sub" :class="{ active: isActive('/i18n') }">
              <span class="icon">🌍</span>
              <span class="label">{{ t('sidebar.i18nCenter') }}</span>
            </router-link>
            <router-link to="/i18n/ui-strings" class="nav-item nav-item--sub" :class="{ active: isActive('/i18n/ui-strings') }">
              <span class="icon">🔤</span>
              <span class="label">{{ t('sidebar.i18nUiStrings') }}</span>
            </router-link>
            <router-link to="/finance-settings" class="nav-item nav-item--sub" :class="{ active: isActive('/finance-settings') }">
              <span class="icon">💱</span>
              <span class="label">{{ t('sidebar.finance') }}</span>
            </router-link>
            <router-link to="/site-settings" class="nav-item nav-item--sub" :class="{ active: isActive('/site-settings') }">
              <span class="icon">⚙️</span>
              <span class="label">{{ t('sidebar.storeSettings') }}</span>
            </router-link>
          </details>
        </div>
      </template>

    </nav>

    <!-- User Profile Footer -->
    <div class="user-profile glass-card">
      <div class="avatar">
        <span>{{ isAdmin ? '👑' : isDistributor ? '🤝' : isCashier ? '💼' : '👤' }}</span>
      </div>
      <div class="info">
        <span class="name">{{ isAdmin ? t('sidebar.roleAdmin') : isDistributor ? t('sidebar.roleDistributor') : isCashier ? t('sidebar.roleCashier') : t('sidebar.roleUser') }}</span>
        <span class="status glow-text">{{ isMlmEnabled ? t('sidebar.statusActive') : t('sidebar.statusStandard') }}</span>
      </div>
      <button class="logout-btn" @click="handleLogout" :title="t('sidebar.logout')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
      </button>
    </div>
  </aside>
</template>

<style scoped>
/* ═══ TACTILE DARK SIDEBAR ═══ */
.sidebar {
  width: 280px;
  flex-shrink: 0;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(16, 16, 20, 0.6);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 10px 0 30px rgba(0, 0, 0, 0.2);
  z-index: 100;
}

.logo-area {
  padding: 24px 20px 16px;
  cursor: pointer;
}
.logo-box {
  display: flex; align-items: baseline; gap: 8px;
  transition: transform 0.3s;
}
.logo-box:hover { transform: translateX(4px); }

.brand-text {
  font-size: 1.4rem;
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.5px;
  margin: 0;
  font-family: var(--font-display);
}
.brand-text .vital { color: var(--pv-red, #BC4A3C); }
.brand-badge {
  font-size: 0.65rem;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, var(--pv-red), #933327);
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 1px;
  box-shadow: 0 0 10px rgba(188, 74, 60, 0.5);
}

.lang-wrap {
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
  transform: scale(0.85);
}

/* Scrollable Nav */
.scrollable-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.scrollable-nav::-webkit-scrollbar { width: 4px; }
.scrollable-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

.nav-group {
  display: flex; flex-direction: column; gap: 2px;
}

.nav-section-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: rgba(255, 255, 255, 0.4);
  margin: 8px 0 4px 12px;
  font-family: var(--font-body);
}

.nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 9px 14px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.92rem;
  font-family: var(--font-body);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid transparent;
}
.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  transform: translateX(4px);
}
.nav-item.active {
  background: linear-gradient(90deg, rgba(188, 74, 60, 0.15) 0%, rgba(188, 74, 60, 0.05) 100%);
  color: #fff;
  border: 1px solid rgba(188, 74, 60, 0.3);
  box-shadow: inset 2px 0 0 var(--pv-red, #BC4A3C);
}
.nav-item.active .icon {
  transform: scale(1.15);
  filter: drop-shadow(0 0 8px rgba(188, 74, 60, 0.6));
}

/* Sub-group item (under a System accordion) */
.nav-item--sub {
  padding-left: 32px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}
.nav-item--sub:hover { color: #fff; }

/* System subgroup accordion */
.nav-subgroup {
  border-radius: 10px;
  margin-bottom: 2px;
}
.nav-subgroup > summary {
  display: flex; align-items: center; gap: 12px;
  padding: 9px 14px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  font-size: 0.92rem;
  cursor: pointer;
  list-style: none;
  transition: background 0.2s;
  user-select: none;
}
.nav-subgroup > summary::-webkit-details-marker { display: none; }
.nav-subgroup > summary::after {
  content: '›';
  margin-left: auto;
  font-size: 1.1rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.4);
  transition: transform 0.2s;
}
.nav-subgroup[open] > summary::after { transform: rotate(90deg); }
.nav-subgroup > summary:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
}
.nav-subgroup > summary .icon { font-size: 1.1rem; }

.icon { font-size: 1.1rem; transition: transform 0.3s, filter 0.3s; }
.label { flex: 1; }

/* User Profile Footer */
.user-profile {
  margin: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  transition: background 0.3s;
}
.user-profile:hover { background: rgba(255, 255, 255, 0.06); }

.avatar {
  width: 40px; height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02));
  border: 1px solid rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem;
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.05);
}

.info { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.info .name { font-weight: 700; font-size: 0.9rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.info .status { font-size: 0.75rem; font-weight: 600; color: rgba(255,255,255,0.5); }
.glow-text { color: var(--color-success, #10B981) !important; text-shadow: 0 0 8px rgba(16, 185, 129, 0.4); }

.logout-btn {
  background: transparent; border: none;
  color: rgba(255,255,255,0.4);
  cursor: pointer; padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
}
.logout-btn:hover { background: rgba(239, 68, 68, 0.1); color: #EF4444; }

/* Mobile Topbar — real app-bar (not a floating button over blank space):
   houses the hamburger + current page title, sits flush at the top with
   a background/border of its own so mobile dashboard pages read as a
   proper app screen instead of a loose page under a floating icon. */
.mobile-topbar {
  display: none; position: fixed; top: 0; left: 0; right: 0; height: 56px; z-index: 1000;
  align-items: center; gap: 12px; padding: 0 16px;
  background: rgba(16, 16, 20, 0.92); backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 2px 12px rgba(0,0,0,0.25);
}
.mobile-topbar__title {
  color: #fff; font-weight: 700; font-size: 1.05rem;
  font-family: var(--font-display, inherit);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.mobile-hamburger {
  flex-shrink: 0;
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.14);
  color: #fff;
  width: 40px; height: 40px; border-radius: 10px;
  font-size: 1.3rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}

/* Responsive Mobile */
@media (max-width: 900px) {
  .mobile-topbar { display: flex; }
  .sidebar { position: fixed; left: -300px; transition: left 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  .sidebar.is-mobile-open { left: 0; }
  .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 90; }
}
@media (max-width: 600px) {
  .sidebar { width: 260px; }
  .logo-area { padding: 18px 14px 12px; }
  .brand-text { font-size: 1.2rem; }
  .scrollable-nav { padding: 0 8px 16px; }
  .nav-section-title { margin: 6px 0 4px 8px; font-size: 0.65rem; }
  .nav-item { padding: 8px 10px; font-size: 0.85rem; }
  .nav-item--sub { padding-left: 24px; }
}
</style>
