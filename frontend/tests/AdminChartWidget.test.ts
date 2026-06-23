// AdminChartWidget — component tests for the KPI trend chart.
//
// We mock the openapi-client + the realtime composable so the test
// never hits the network. The chart is SVG so we assert on rendered
// markup (paths, circles) rather than canvas pixels.
//
// Covers:
//   1. Renders the KPI summary cards from the totals payload
//   2. Renders SVG lines for each series
//   3. Switches the time window on tab click + re-fetches
//   4. Shows loading + error states correctly
//   5. Defensive: zero-data response renders the empty state
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import { mockOpenApiMock, typedResponse } from './helpers/mockOpenApi';

vi.mock('../src/api/openapi-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/api/openapi-client')>();
  return { ...actual, ...mockOpenApiMock() };
});

vi.mock('../src/composables/useAdminRealtime', () => ({
  useAdminRealtime: () => ({
    on: () => () => {},
    onMany: () => () => {},
    toastOn: () => () => {},
    connected: { value: true },
    lastEvent: { value: null },
    dispose: () => {}
  })
}));

const api = mockOpenApiMock();

import AdminChartWidget from '../src/components/AdminChartWidget.vue';

// 7 daily buckets ending today — enough to exercise X-axis labels + paths.
const buildTrendsResponse = (overrides: any = {}) => ({
  range: { from: '2026-06-15', to: '2026-06-22', days: 7 },
  daily: [
    { date: '2026-06-15', revenue: 1000, orders: 5, completedOrders: 3, newUsers: 2 },
    { date: '2026-06-16', revenue: 2500, orders: 9, completedOrders: 6, newUsers: 4 },
    { date: '2026-06-17', revenue: 1500, orders: 4, completedOrders: 2, newUsers: 1 },
    { date: '2026-06-18', revenue: 4000, orders: 12, completedOrders: 8, newUsers: 5 },
    { date: '2026-06-19', revenue: 3200, orders: 8, completedOrders: 5, newUsers: 3 },
    { date: '2026-06-20', revenue: 2800, orders: 7, completedOrders: 4, newUsers: 2 },
    { date: '2026-06-21', revenue: 5000, orders: 14, completedOrders: 10, newUsers: 6 }
  ],
  totals: { revenue: 20000, orders: 59, completedOrders: 38, newUsers: 23 },
  ...overrides
});

const mountWidget = (props: any = {}) => {
  return mount(AdminChartWidget, { props });
};

beforeEach(() => {
  api.apiGet.mockReset();
});

describe('AdminChartWidget — initial render', () => {
  it('shows the loading state while the first request is in flight', async () => {
    api.apiGet.mockReturnValue(new Promise(() => {})); // never resolves
    const w = mountWidget();
    await flushPromises();
    expect(w.text()).toContain('Yükleniyor');
  });

  it('renders KPI cards with the totals payload after the first fetch', async () => {
    api.apiGet.mockResolvedValue(typedResponse(buildTrendsResponse()));
    const w = mountWidget();
    await flushPromises();
    // Revenue formatted as "20K ₽" (20000 → 20.0K)
    expect(w.text()).toContain('20');
    expect(w.text()).toContain('₽');
    expect(w.text()).toContain('59'); // orders
    expect(w.text()).toContain('23'); // newUsers
  });

  it('renders one SVG path per series (revenue / orders / users)', async () => {
    api.apiGet.mockResolvedValue(typedResponse(buildTrendsResponse()));
    const w = mountWidget();
    await flushPromises();
    const paths = w.findAll('path.ac-line');
    expect(paths.length).toBe(3);
    expect(paths[0].classes()).toContain('ac-line--revenue');
    expect(paths[1].classes()).toContain('ac-line--orders');
    expect(paths[2].classes()).toContain('ac-line--users');
  });

  it('renders one circle data point per day for revenue', async () => {
    api.apiGet.mockResolvedValue(typedResponse(buildTrendsResponse()));
    const w = mountWidget();
    await flushPromises();
    const points = w.findAll('circle.ac-point');
    expect(points.length).toBe(7); // 7 daily buckets
  });

  it('renders a legend listing all three series', async () => {
    api.apiGet.mockResolvedValue(typedResponse(buildTrendsResponse()));
    const w = mountWidget();
    await flushPromises();
    expect(w.text()).toContain('Gelir');
    expect(w.text()).toContain('Sipariş');
    expect(w.text()).toContain('Kullanıcı');
  });
});

describe('AdminChartWidget — time-window switch', () => {
  it('re-fetches when the user clicks a different day tab', async () => {
    api.apiGet.mockResolvedValue(typedResponse(buildTrendsResponse()));
    const w = mountWidget({ initialDays: 7 });
    await flushPromises();
    expect(api.apiGet).toHaveBeenCalledTimes(1);
    expect(api.apiGet.mock.calls[0][0]).toBe('/api/v1/admin/trends');
    expect((api.apiGet.mock.calls[0][1] as any).query).toEqual({ days: 7 });

    // Click the 30g tab
    const tabs = w.findAll('.ac-tab');
    const tab30 = tabs.find((t) => t.text().includes('30g'));
    expect(tab30).toBeTruthy();
    await tab30!.trigger('click');
    await flushPromises();

    expect(api.apiGet).toHaveBeenCalledTimes(2);
    expect((api.apiGet.mock.calls[1][1] as any).query).toEqual({ days: 30 });
  });

  it('highlights the active tab', async () => {
    api.apiGet.mockResolvedValue(typedResponse(buildTrendsResponse()));
    const w = mountWidget({ initialDays: 14 });
    await flushPromises();
    const tabs = w.findAll('.ac-tab');
    const tab14 = tabs.find((t) => t.text().includes('14g'));
    expect(tab14!.classes()).toContain('ac-tab--active');
  });
});

describe('AdminChartWidget — error + empty states', () => {
  it('shows the error message when the fetch rejects', async () => {
    api.apiGet.mockRejectedValue(new Error('Network down'));
    const w = mountWidget();
    await flushPromises();
    expect(w.text()).toContain('Network down');
  });

  it('shows the empty state when daily is empty', async () => {
    api.apiGet.mockResolvedValue(
      typedResponse({ range: { from: 'x', to: 'y', days: 0 }, daily: [], totals: { revenue: 0, orders: 0, newUsers: 0, completedOrders: 0 } })
    );
    const w = mountWidget();
    await flushPromises();
    expect(w.text()).toContain('Henüz veri yok');
  });
});
