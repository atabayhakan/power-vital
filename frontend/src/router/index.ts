import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/useAuthStore';
import DistributorDashboard from '../views/DistributorDashboard.vue';
import StorefrontView from '../views/StorefrontView.vue';
import ProductDetailView from '../views/ProductDetailView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import ContactView from '../views/ContactView.vue';
import AboutView from '../views/AboutView.vue';
import PosView from '../views/PosView.vue';
import OrdersView from '../views/OrdersView.vue';
import NetworkView from '../views/NetworkView.vue';
import BonusControlView from '../views/BonusControlView.vue';
import ProductsView from '../views/ProductsView.vue';
import SimulationView from '../views/SimulationView.vue';
// SliderManageView is loaded via dynamic import() in routes
import SiteSettingsView from '../views/SiteSettingsView.vue';
import CheckoutView from '../views/CheckoutView.vue';
import NotFoundView from '../views/NotFoundView.vue';
// PageBuilderView is loaded via dynamic import() in routes
import CatalogView from '../views/CatalogView.vue';
import AccountView from '../views/AccountView.vue';
import UserManagementView from '../views/UserManagementView.vue';
import FinancePayoutsView from '../views/FinancePayoutsView.vue';
import axios from 'axios';

// ═══ MLM Route Names (for kill switch guard) ═══
// Handled by meta.mlm now

// Admin-only views are loaded lazily so their dependencies (charts,
// editors, admin-only libs) don't ship to storefront visitors.
const AdminMediaLibrary = () => import('../views/AdminMediaLibrary.vue');
const AdminI18nView = () => import('../views/AdminI18nView.vue');
const AdminLogsView = () => import('../views/AdminLogsView.vue');
const AdminBroadcastView = () => import('../views/AdminBroadcastView.vue');
const AdminPushAnalyticsView = () => import('../views/AdminPushAnalyticsView.vue');
const AdminScheduledView = () => import('../views/AdminScheduledView.vue');

const routes = [
  // --- Public Routes ---
  { path: '/', name: 'Storefront', component: StorefrontView, meta: { layout: 'public' } },
  { path: '/katalog', name: 'Catalog', component: CatalogView, meta: { layout: 'public' } },
  { path: '/catalog', redirect: '/katalog' },
  { path: '/product/:id', name: 'ProductDetail', component: ProductDetailView, meta: { layout: 'public' } },
  { path: '/p/:slug', name: 'DynamicPage', component: () => import('../views/DynamicPageView.vue'), meta: { layout: 'public' } },
  { path: '/login', name: 'Login', component: LoginView, meta: { layout: 'public' } },
  { path: '/register', name: 'Register', component: RegisterView, meta: { layout: 'public' } },
  { path: '/iletisim', name: 'Contact', component: ContactView, meta: { layout: 'public' } },
  { path: '/about', name: 'About', component: AboutView, meta: { layout: 'public' } },
  { path: '/checkout', name: 'Checkout', component: CheckoutView, meta: { layout: 'public' } },

  // --- Secure Admin Gateway ---
  { path: '/pv-hq-admin', name: 'AdminLogin', component: () => import('../views/AdminLoginView.vue'), meta: { layout: 'public' } },

  // --- Dashboard Routes ---
  { path: '/account', name: 'AccountDashboard', component: AccountView, meta: { layout: 'dashboard', title: 'Hesabım' } }, // Profile & Orders
  { path: '/account/wallet', name: 'WalletDashboard', component: () => import('../views/WalletView.vue'), meta: { layout: 'dashboard', title: 'Cüzdanım' } }, // Gamification & Wallet
  { path: '/account/support', name: 'Support', component: () => import('../views/SupportView.vue'), meta: { layout: 'dashboard', title: 'Destek' } }, // Support Dashboard
  { path: '/admin', name: 'AdminDashboard', component: () => import('../components/AdminDashboard.vue'), meta: { layout: 'dashboard', role: 'admin', title: 'Yönetim Paneli' } },
  { path: '/dashboard', name: 'DistributorDashboard', component: DistributorDashboard, meta: { layout: 'dashboard', role: 'distributor', title: 'Distribütör Paneli' } },

  // ═══════════════════════════════════════════════════════════════
  //  TRI-MODAL COMMERCE — E-COMMERCE / POS / MLM
  // ═══════════════════════════════════════════════════════════════

  // --- 🛒 RETAIL E-COMMERCE (always active) ---
  { path: '/orders', name: 'Orders', component: OrdersView, meta: { layout: 'dashboard', group: 'retail', title: 'Siparişler' } },
  { path: '/products', name: 'Products', component: ProductsView, meta: { layout: 'dashboard', role: 'admin', group: 'retail', title: 'Ürün Yönetimi' } },
  { path: '/categories', name: 'Categories', component: () => import('../views/AdminCategoryManager.vue'), meta: { layout: 'dashboard', role: 'admin', group: 'retail', title: 'Kategoriler' } },

  // --- 💵 POS / PHYSICAL SALES (cashier + admin) ---
  { path: '/pos', name: 'POS', component: PosView, meta: { layout: 'dashboard', group: 'pos', title: 'POS Terminal' } },

  // --- 🌳 MLM / NETWORK (guarded by kill switch + role) ---
  { path: '/network', name: 'Network', component: NetworkView, meta: { layout: 'dashboard', mlm: true, group: 'mlm', title: 'Distribütör Ağı' } },
  { path: '/bonus-control', name: 'BonusControl', component: BonusControlView, meta: { layout: 'dashboard', role: 'admin', mlm: true, group: 'mlm', title: 'Bonus Kontrolü' } },
  { path: '/simulation', name: 'Simulation', component: SimulationView, meta: { layout: 'dashboard', role: 'admin', mlm: true, group: 'mlm', title: 'Simülasyon' } },

  // ═══════════════════════════════════════════════════════════════
  //  ADMIN MANAGEMENT — People / Finance / System / CMS
  // ═══════════════════════════════════════════════════════════════

  // --- 👥 PEOPLE & ACCESS (admin) ---
  { path: '/user-management', name: 'UserManagement', component: UserManagementView, meta: { layout: 'dashboard', role: 'admin', group: 'people', title: 'Kullanıcılar' } },

  // --- 💰 FINANCE & PAYMENTS (admin) ---
  { path: '/finance-payouts', name: 'FinancePayouts', component: FinancePayoutsView, meta: { layout: 'dashboard', role: 'admin', group: 'finance', title: 'Çekim Talepleri' } },
  { path: '/finance-settings', name: 'FinanceSettings', component: () => import('../views/AdminFinanceSettings.vue'), meta: { layout: 'dashboard', role: 'admin', group: 'finance', title: 'Finansal Ayarlar' } },
  { path: '/support-inbox', name: 'SupportInbox', component: () => import('../views/SupportInboxView.vue'), meta: { layout: 'dashboard', role: 'admin', group: 'system', title: 'Destek Kutusu' } },

  // --- 🏢 SYSTEM (admin) ---
  { path: '/site-settings', name: 'SiteSettings', component: SiteSettingsView, meta: { layout: 'dashboard', role: 'admin', group: 'system', title: 'Site Ayarları' } },
  { path: '/i18n', name: 'I18nCenter', component: AdminI18nView, meta: { layout: 'dashboard', role: 'admin', group: 'system', title: 'Çeviri Merkezi' } },
  // Static UI-strings editor must precede the :model param route so it isn't
  // captured as a model slug.
  { path: '/i18n/ui-strings', name: 'I18nUiStrings', component: () => import('../views/AdminI18nUiStringsView.vue'), meta: { layout: 'dashboard', role: 'admin', group: 'system', title: 'UI Metinleri' } },
  { path: '/i18n/:model', name: 'I18nModel', component: () => import('../views/AdminI18nModelView.vue'), meta: { layout: 'dashboard', role: 'admin', group: 'system', title: 'Çeviri Modeli' } },
  { path: '/admin-logs', name: 'AdminLogs', component: AdminLogsView, meta: { layout: 'dashboard', role: 'admin', group: 'system', title: 'Canlı Log' } },
  { path: '/admin-errors', name: 'AdminErrors', component: () => import('../views/AdminErrorsView.vue'), meta: { layout: 'dashboard', role: 'admin', group: 'system', title: 'İstemci Hataları' } },
  { path: '/admin-broadcast', name: 'AdminBroadcast', component: AdminBroadcastView, meta: { layout: 'dashboard', role: 'admin', group: 'system', title: 'Push Broadcast' } },
  { path: '/admin-push-analytics', name: 'AdminPushAnalytics', component: AdminPushAnalyticsView, meta: { layout: 'dashboard', role: 'admin', group: 'system', title: 'Push Analitik' } },
  { path: '/admin-scheduled', name: 'AdminScheduled', component: AdminScheduledView, meta: { layout: 'dashboard', role: 'admin', group: 'system', title: 'Planlı Broadcast' } },
  { path: '/admin-cart-recovery', name: 'AdminCartRecovery', component: () => import('../views/CartRecoveryView.vue'), meta: { layout: 'dashboard', role: 'admin', group: 'system', title: 'Sepet Kurtarma' } },

  // (Removed) Manual i18n Translation Center — translation is now fully automatic
  // (auto-translate on save + continuous TranslationSweeper worker).

  // --- 🌐 CMS / STOREFRONT MANAGEMENT (admin) ---
  // Nested under /cms/ for logical grouping. Old top-level paths kept as
  // aliases for backwards compatibility with bookmarks / external links.
  { path: '/cms', redirect: '/cms/page-builder' },
  { path: '/cms/page-builder', name: 'PageBuilder', component: () => import('../views/PageBuilderView.vue'), meta: { layout: 'dashboard', role: 'admin', group: 'cms', title: 'Sayfa Kurucu' } },
  { path: '/cms/pages', name: 'PageManage', component: () => import('../views/PageManageView.vue'), meta: { layout: 'dashboard', role: 'admin', group: 'cms', title: 'İçerik Sayfaları' } },
  { path: '/cms/slider-manage', name: 'SliderManage', component: () => import('../views/SliderManageView.vue'), meta: { layout: 'dashboard', role: 'admin', group: 'cms', title: 'Slider Yönetimi' } },
  { path: '/cms/media-library', name: 'MediaLibrary', component: AdminMediaLibrary, meta: { layout: 'dashboard', role: 'admin', group: 'cms', title: 'Medya Kütüphanesi' } },

  { path: '/cms/reviews', name: 'ReviewManager', component: () => import('../views/AdminReviewManager.vue'), meta: { layout: 'dashboard', role: 'admin', group: 'cms', title: 'Yorum Moderasyonu' } },

  // Backwards-compatible redirects (old paths → new CMS paths)
  { path: '/page-builder', redirect: '/cms/page-builder' },
  { path: '/slider-manage', redirect: '/cms/slider-manage' },
  { path: '/media-library', redirect: '/cms/media-library' },


  // --- 404 Catch-All ---
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFoundView, meta: { layout: 'public' } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 🛡️ Reset scroll on every navigation so users always land at the top
  // of the new page (e.g. clicking "Fırsatı Yakala" on the homepage
  // shouldn't inherit the homepage's scroll position and show the footer
  // instead of the product hero). The default Vue Router behaviour
  // preserves the previous scroll position which is rarely what we want
  // for an e-commerce / admin flow.
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' };
    }
    return { top: 0, left: 0 };
  },
});

// ═══ Cached MLM status for route guard ═══
let mlmStatusCache: boolean | null = null;
let mlmCacheTime = 0;

const getMlmStatus = async (): Promise<boolean> => {
  // Cache for 60 seconds to avoid hitting API on every navigation
  if (mlmStatusCache !== null && Date.now() - mlmCacheTime < 60000) {
    return mlmStatusCache;
  }
  try {
    const res = await axios.get('/api/v1/system/mlm-status');
    mlmStatusCache = res.data.isMlmEnabled;
    mlmCacheTime = Date.now();
    return mlmStatusCache!;
  } catch {
    return false; // Safe default
  }
};

// Navigation Guard (Vue Router 4 — return pattern, no next())
router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  // 🛡️ Validate the persisted token against the backend on every navigation.
  // If the token expired (or was tampered with) restoreSession() will
  // clear localStorage and reset isAuthenticated back to false. Doing
  // this here, instead of only at app mount, makes sure a stale token
  // can't redirect a returning visitor to /admin or /login.
  if (authStore.isAuthenticated) {
    await authStore.restoreSession();
  }
  const userRole = authStore.userRole;
  const isAuthenticated = authStore.isAuthenticated;

  const fallbackRoute = userRole === 'admin' ? '/admin' : (userRole === 'distributor' ? '/dashboard' : '/account');

  // Prevent authenticated users from seeing auth pages
  if (isAuthenticated && ['/login', '/register', '/pv-hq-admin'].includes(to.path)) {
    if (userRole === 'admin') return '/admin';
    if (userRole === 'distributor') return '/dashboard';
    return '/account';
  }

  // Auth guard — dashboard routes need authentication
  if (to.meta.layout === 'dashboard') {
    if (!isAuthenticated) return '/login'; // Redirect to login
    if (userRole === 'guest') return '/';
  }

  // Role guard — strict checks
  if (to.meta.role === 'admin' && userRole !== 'admin') {
    return fallbackRoute; // Kick out unauthorized users
  }
  
  if (to.meta.role === 'distributor' && userRole !== 'distributor' && userRole !== 'admin') {
    return fallbackRoute; // Kick out customers trying to access distributor dashboard
  }

  // ═══ POS TERMINAL GUARD (Strict Quarantine) ═══
  if (to.path === '/pos') {
    if (userRole !== 'cashier' && userRole !== 'admin') {
      return fallbackRoute; // Kick out unauthorized POS access
    }
  }

  // ═══ MLM KILL SWITCH GUARD ═══
  if (to.meta.mlm) {
    if (userRole !== 'distributor' && userRole !== 'admin') {
      return fallbackRoute; // Kick out unauthorized MLM access
    }

    const mlmEnabled = await getMlmStatus();
    if (!mlmEnabled) {
      return fallbackRoute;
    }
  }

  // Allow navigation
  return true;
});

export default router;
