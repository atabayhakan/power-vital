import { createRouter, createWebHistory } from 'vue-router';
import AdminDashboard from '../components/AdminDashboard.vue';
import DistributorDashboard from '../views/DistributorDashboard.vue';
import StorefrontView from '../views/StorefrontView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import ContactView from '../views/ContactView.vue';
import AboutView from '../views/AboutView.vue';
import PosView from '../views/PosView.vue';
import OrdersView from '../views/OrdersView.vue';
import NetworkView from '../views/NetworkView.vue';
import BonusControlView from '../views/BonusControlView.vue';
import OlympicsView from '../views/OlympicsView.vue';
import ProductsView from '../views/ProductsView.vue';
import SimulationView from '../views/SimulationView.vue';
import SliderManageView from '../views/SliderManageView.vue';
import SiteSettingsView from '../views/SiteSettingsView.vue';
import CheckoutView from '../views/CheckoutView.vue';
import NotFoundView from '../views/NotFoundView.vue';
import axios from 'axios';

// ═══ MLM Route Names (for kill switch guard) ═══
const MLM_ROUTES = new Set(['Network', 'Olympics', 'Simulation']);

const routes = [
  // --- Public Routes ---
  { path: '/', name: 'Storefront', component: StorefrontView, meta: { layout: 'public' } },
  { path: '/login', name: 'Login', component: LoginView, meta: { layout: 'public' } },
  { path: '/register', name: 'Register', component: RegisterView, meta: { layout: 'public' } },
  { path: '/contact', name: 'Contact', component: ContactView, meta: { layout: 'public' } },
  { path: '/about', name: 'About', component: AboutView, meta: { layout: 'public' } },
  { path: '/checkout', name: 'Checkout', component: CheckoutView, meta: { layout: 'public' } },

  // --- Dashboard Routes ---
  { path: '/admin', name: 'AdminDashboard', component: AdminDashboard, meta: { layout: 'dashboard', role: 'admin' } },
  { path: '/dashboard', name: 'DistributorDashboard', component: DistributorDashboard, meta: { layout: 'dashboard', role: 'distributor' } },

  // --- Core E-Commerce (always active) ---
  { path: '/pos', name: 'POS', component: PosView, meta: { layout: 'dashboard' } },
  { path: '/products', name: 'Products', component: ProductsView, meta: { layout: 'dashboard', role: 'admin' } },
  { path: '/orders', name: 'Orders', component: OrdersView, meta: { layout: 'dashboard' } },

  // --- MLM-Only Routes (guarded by kill switch) ---
  { path: '/network', name: 'Network', component: NetworkView, meta: { layout: 'dashboard', mlm: true } },
  { path: '/olympics', name: 'Olympics', component: OlympicsView, meta: { layout: 'dashboard', mlm: true } },
  { path: '/simulation', name: 'Simulation', component: SimulationView, meta: { layout: 'dashboard', role: 'admin', mlm: true } },

  // --- Admin Config (always active — contains MLM toggle itself) ---
  { path: '/bonus-control', name: 'BonusControl', component: BonusControlView, meta: { layout: 'dashboard', role: 'admin' } },
  
  // --- Admin Pages ---
  { path: '/slider-manage', name: 'SliderManage', component: SliderManageView, meta: { layout: 'dashboard', role: 'admin' } },
  { path: '/site-settings', name: 'SiteSettings', component: SiteSettingsView, meta: { layout: 'dashboard', role: 'admin' } },

  // --- 404 Catch-All ---
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFoundView, meta: { layout: 'public' } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
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
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role') || 'customer';

  // Auth guard — dashboard routes need token
  if (to.meta.layout === 'dashboard') {
    if (!token) return '/login';
    if (userRole === 'customer') return '/';
  }

  // Role guard — admin routes need admin role
  if (to.meta.role === 'admin' && userRole !== 'admin') {
    return '/dashboard';
  }

  // ═══ MLM KILL SWITCH GUARD ═══
  if (to.meta.mlm) {
    const mlmEnabled = await getMlmStatus();
    if (!mlmEnabled) {
      return userRole === 'admin' ? '/admin' : '/dashboard';
    }
  }

  // Allow navigation
  return true;
});

export default router;
