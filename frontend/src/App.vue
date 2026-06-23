<script setup lang="ts">
import { computed, onMounted, defineAsyncComponent, ref } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from './components/Sidebar.vue';
import SeoHead from './components/SeoHead.vue';
import ToastManager from './components/ToastManager.vue';
import PageLoader from './components/PageLoader.vue';
import ErrorBoundary from './components/ErrorBoundary.vue';
import { useAuthStore } from './stores/useAuthStore';

// Lazy Load Public Components
const GlobalTopbar = defineAsyncComponent(() => import('./components/GlobalTopbar.vue'));
const GlobalNavbar = defineAsyncComponent(() => import('./components/GlobalNavbar.vue'));
const SlideOutCart = defineAsyncComponent(() => import('./components/SlideOutCart.vue'));
const AuthModal = defineAsyncComponent(() => import('./components/AuthModal.vue'));
const BottomNav = defineAsyncComponent(() => import('./components/BottomNav.vue'));
const GlobalFooter = defineAsyncComponent(() => import('./components/GlobalFooter.vue'));
const ImpersonationBanner = defineAsyncComponent(() => import('./components/admin/ImpersonationBanner.vue'));
const FloatingChat = defineAsyncComponent(() => import('./components/common/FloatingChat.vue'));
const CompareDrawer = defineAsyncComponent(() => import('./components/common/CompareDrawer.vue'));
const ShareWishlistDialog = defineAsyncComponent(() => import('./components/common/ShareWishlistDialog.vue'));

import { fetchFinanceSettings } from './utils/PriceEngine';

const route = useRoute();
const isDashboard = computed(() => route.meta.layout === 'dashboard');
const authStore = useAuthStore();

// Share-wishlist dialog is mounted as a singleton (driven by
// the global `pv-open-share-wishlist` event from the navbar
// heart button) so every entry point on the storefront can
// open the same dialog without prop drilling.
const shareDialogOpen = ref(false);
const onOpenShare = () => { shareDialogOpen.value = true; };
onMounted(() => {
  window.addEventListener('pv-open-share-wishlist', onOpenShare);
  // Also auto-open if the URL carries ?w= (the recipient's
  // experience: tap the link → wishlist hydrates → dialog opens).
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('w')) shareDialogOpen.value = true;
  } catch { /* noop */ }
});

onMounted(() => {

  fetchFinanceSettings();

  // 🛡️ SPOOFING FIX: Token varsa backend'den doğrula, role'ü güncelle.
  // localStorage.role'a güvenilmez — sadece backend cevabı ile set edilir.
  if (localStorage.getItem('token')) {
    authStore.restoreSession();
  } else {
    // Token yoksa localStorage'daki tüm auth verilerini temizle (güvenlik)
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userId');
  }
});
</script>

<template>
  <div class="app-layout" :class="[
    isDashboard ? 'app-layout--dashboard' : 'app-layout--storefront',
    isDashboard ? 'admin-light-mode' : ''
  ]">
    <SeoHead v-if="!isDashboard" />
    <Sidebar v-if="isDashboard" />
    <ImpersonationBanner v-if="isDashboard" />
    <PageLoader />
    
    <!-- Public Global UI -->
    <GlobalTopbar v-if="!isDashboard && route.name !== 'Checkout'" />
    <GlobalNavbar v-if="!isDashboard && route.name !== 'Checkout'" />
    <SlideOutCart v-if="(!isDashboard || authStore.userRole !== 'admin') && route.name !== 'Checkout'" />
    <AuthModal v-if="!isDashboard" />

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <ErrorBoundary :key="$route.fullPath">
          <component :is="Component" />
        </ErrorBoundary>
      </router-view>
    </main>
    
    <GlobalFooter v-if="!isDashboard && route.name !== 'Checkout'" />
    <BottomNav v-if="(!isDashboard || authStore.userRole !== 'admin') && route.name !== 'Checkout'" />
    <FloatingChat v-if="!isDashboard" />
    <CompareDrawer v-if="!isDashboard" />
    <ShareWishlistDialog v-if="!isDashboard && shareDialogOpen" :is-open="shareDialogOpen" @close="shareDialogOpen = false" />
    <ToastManager />
  </div>
</template>

<style>
/* Dashboard layout: sidebar + content, full height, no page scroll */
.app-layout--dashboard {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #0A0A0C; /* Tactile Dark Base */
  color: #F4F4F5;
}

/* Public layout: normal page flow with scroll */
.app-layout:not(.app-layout--dashboard) {
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.app-layout--dashboard .main-content {
  flex: 1;
  min-width: 0;
  height: 100vh;
  overflow-y: auto;
  position: relative;
  scroll-behavior: smooth;
}

@media (max-width: 900px) {
  .app-layout--dashboard .main-content {
    padding-top: 64px;
    padding-bottom: 70px;
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Passes constraint to child */
}

</style>
