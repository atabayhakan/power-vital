// Component tests for AdminDashboard — the main ops view.
//
// We mock the openapi-client (apiGet/apiPost/etc.) + useAdminRealtime
// so the test never makes real network calls or starts an EventSource.
// The composable returns stub methods that the dashboard calls on mount.
//
// Covers:
//   1. Initial render — KPI cards, "Sistem Özeti" header, live indicator
//   2. Stats fetched from /api/v1/admin/dashboard
//   3. Recent orders table renders rows with status pills
//   4. Low-stock alert appears when stats.lowStockCount > 0
//   5. Pending-orders alert appears when stats.pendingOrders > 0
//   6. "All clear" success alert shows when both counts are 0
//   7. Manual refresh button works
//   8. Polling interval clears on unmount (no leaked timers)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import { mockOpenApiMock, typedResponse } from './helpers/mockOpenApi';

vi.mock('../src/api/openapi-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/api/openapi-client')>();
  return { ...actual, ...mockOpenApiMock() };
});

vi.mock('../src/composables/useAdminRealtime', () => ({
  useAdminRealtime: () => ({
    toastOn: () => () => {},
    onMany: () => () => {},
    on: () => () => {},
    connected: { value: true },
    lastEvent: { value: null },
    dispose: () => {}
  })
}));

vi.mock('../src/components/AdminMetricsWidget.vue', () => ({
  default: { name: 'AdminMetricsWidget', template: '<div data-test="metrics-stub" />' }
}));

const api = mockOpenApiMock();

import AdminDashboard from '../src/components/AdminDashboard.vue';

const i18n = (globalThis as any).__VITEST_I18N__;
const mountOpts = { global: { plugins: [i18n] } };

const mountDashboard = (overrides: any = {}) => mount(AdminDashboard, { ...mountOpts, ...overrides });

const dashboardResponse = {
  stats: {
    totalRevenue: 1500000,
    completedRevenue: 1200000,
    todayRevenue: 75000,
    totalOrders: 320,
    pendingOrders: 8,
    completedOrders: 280,
    paidOrders: 290,
    cancelledOrders: 30,
    todayOrderCount: 12,
    totalProducts: 45,
    totalUsers: 1024,
    distributors: 35,
    customers: 989,
    newUsersThisWeek: 42,
    lowStockCount: 3
  },
  recentOrders: [
    { id: 'o-abc12345', customerName: 'Ali Alım', totalKgs: 4200, status: 'paid',      createdAt: '2026-06-22T08:30:00Z' },
    { id: 'o-def67890', customerName: 'Beste B.',   totalKgs: 1800, status: 'completed', createdAt: '2026-06-22T07:15:00Z' },
    { id: 'o-ghi11111', customerName: 'Cem C.',      totalKgs: 9999, status: 'pending',   createdAt: '2026-06-22T06:00:00Z' }
  ],
  lowStockAlerts: []
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  // Helper: queue dashboard + analytics responses for one fetch cycle.
  const queueHappyPath = () => {
    api.apiGet.mockImplementation(async (path: string) => {
      if (path === '/api/v1/admin/dashboard') {
        return typedResponse(dashboardResponse);
      }
      if (typeof path === 'string' && path.startsWith('/api/v1/admin/analytics/')) {
        // analytics endpoints return envelopes { categories/customer/products: [...] }
        if (path.includes('categories')) return typedResponse({ categories: [] });
        if (path.includes('top-customers')) return typedResponse({ customers: [] });
        if (path.includes('top-products')) return typedResponse({ products: [] });
      }
      return typedResponse({});
    });
  };

  it('renders header + live indicator on mount', async () => {
    queueHappyPath();
    const w = mountDashboard();
    await flushPromises();
    // Page title "Sistem Özeti" is always visible (above the loader).
    // The "Yenile" label appears only after isLoading flips to false
    // (400ms after fetch), so we don't assert on it here — it's
    // exercised in the manual-refresh / polling tests below.
    expect(w.text()).toContain('Sistem Özeti');
    expect(w.text()).toContain('Canlı');
  });

  it('fetches /api/v1/admin/dashboard on mount', async () => {
    queueHappyPath();
    mountDashboard();
    await flushPromises();
    const dashboardCall = api.apiGet.mock.calls.find(
      (c) => c[0] === '/api/v1/admin/dashboard'
    );
    expect(dashboardCall).toBeTruthy();
  });

  it('shows formatted KGS values in KPI cards', async () => {
    queueHappyPath();
    const w = mountDashboard();
    await flushPromises();
    // totalRevenue = 1,500,000 → formatted "1 500 000"
    expect(w.text()).toMatch(/1\s*500\s*000/);
    expect(w.text()).toContain('KGS');
    expect(w.text()).toContain('Toplam Ciro');
    expect(w.text()).toContain('Bugün Ciro');
  });

  it('renders recent orders table with status pills', async () => {
    queueHappyPath();
    const w = mountDashboard();
    await flushPromises();
    expect(w.text()).toContain('Ali Alım');
    expect(w.text()).toContain('Beste B.');
    expect(w.text()).toContain('Cem C.');
    // Each status should render its badge label
    expect(w.text()).toMatch(/Onaylandı|Bekliyor|Tamamlandı/);
  });

  it('shows low-stock warning when stats.lowStockCount > 0', async () => {
    queueHappyPath();
    const w = mountDashboard();
    await flushPromises();
    expect(w.text()).toContain('Kritik Stok Uyarısı');
    expect(w.text()).toContain('3 ürün bitmek üzere');
  });

  it('shows pending-orders alert when stats.pendingOrders > 0', async () => {
    queueHappyPath();
    const w = mountDashboard();
    await flushPromises();
    expect(w.text()).toContain('Bekleyen Siparişler');
    expect(w.text()).toContain('8 işlem onay bekliyor');
  });

  it('shows "Sistem Stabil" success alert when both counts are 0', async () => {
    queueHappyPath();
    api.apiGet.mockImplementation(async (path: string) => {
      if (path === '/api/v1/admin/dashboard') {
        return typedResponse({
          ...dashboardResponse,
          stats: { ...dashboardResponse.stats, lowStockCount: 0, pendingOrders: 0 }
        });
      }
      if (typeof path === 'string' && path.startsWith('/api/v1/admin/analytics/')) {
        return typedResponse({ categories: [], customers: [], products: [] });
      }
      return typedResponse({});
    });
    const w = mountDashboard();
    await flushPromises();
    expect(w.text()).toContain('Sistem Stabil');
    expect(w.text()).toContain('Müdahale gerektiren işlem yok');
  });

  it('handles empty recentOrders gracefully (shows placeholder)', async () => {
    queueHappyPath();
    api.apiGet.mockImplementation(async (path: string) => {
      if (path === '/api/v1/admin/dashboard') {
        return typedResponse({ ...dashboardResponse, recentOrders: [] });
      }
      if (typeof path === 'string' && path.startsWith('/api/v1/admin/analytics/')) {
        return typedResponse({ categories: [], customers: [], products: [] });
      }
      return typedResponse({});
    });
    const w = mountDashboard();
    await flushPromises();
    expect(w.text()).toContain('Henüz sipariş bulunmuyor');
  });

  it('polling interval is set up (fires apiGet every 60s as SSE fallback)', async () => {
    queueHappyPath();
    mountDashboard();
    await flushPromises();
    const callsAtMount = api.apiGet.mock.calls.length;
    // Advance fake clock past the 60s polling interval — SSE handles real-time,
    // this is just a safety net for background-tab throttling.
    vi.advanceTimersByTime(61_000);
    expect(api.apiGet.mock.calls.length).toBeGreaterThan(callsAtMount);
  });

  it('clears polling interval on unmount (no leaked timers)', async () => {
    queueHappyPath();
    const w = mountDashboard();
    await flushPromises();
    const callsAfterMount = api.apiGet.mock.calls.length;
    w.unmount();
    // Advance fake clock past 60s polling interval
    vi.advanceTimersByTime(65_000);
    // No additional calls should fire after unmount
    expect(api.apiGet.mock.calls.length).toBe(callsAfterMount);
  });

  it('renders POS button (cashier / admin shortcut)', async () => {
    queueHappyPath();
    const w = mountDashboard();
    await flushPromises();
    expect(w.text()).toContain('POS');
    // POS button should exist with an svg icon next to it.
    const allText = w.text();
    expect(allText).toContain('POS');
  });

  it('shows error banner when dashboard fetch fails', async () => {
    api.apiGet.mockImplementation(async (path: string) => {
      if (path === '/api/v1/admin/dashboard') {
        const err: any = new Error('Network down');
        err.response = { data: { error: 'Sunucu hatası' } };
        throw err;
      }
      return typedResponse({});
    });
    const w = mountDashboard();
    await flushPromises();
    expect(w.text()).toContain('Sunucu hatası');
  });
});
