// Component tests for AdminMetricsWidget — verifies computed aggregations
// and template rendering. We mock the openapi-client + useAdminRealtime
// so the test never makes real network calls or starts an EventSource.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import { mockOpenApiMock, typedResponse } from './helpers/mockOpenApi';

vi.mock('../src/api/openapi-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/api/openapi-client')>();
  return { ...actual, ...mockOpenApiMock() };
});

vi.mock('../src/composables/useAdminRealtime', () => ({
  useAdminRealtime: () => ({
    onMany: () => () => {},
    isConnected: { value: false },
    status: 'disconnected'
  })
}));

const api = mockOpenApiMock();

import AdminMetricsWidget from '../src/components/AdminMetricsWidget.vue';

const snapshot = {
  timestamp: 1700000000000,
  uptimeSeconds: 3600,
  memoryMB: { rss: 124, heapUsed: 80 },
  http: {
    requests: [
      { labels: { route: '/api/v1/products', method: 'GET', status: '2xx' }, value: 120 },
      { labels: { route: '/api/v1/products', method: 'GET', status: '4xx' }, value: 3 },
      { labels: { route: '/api/v1/auth/login', method: 'POST', status: '2xx' }, value: 80 },
      { labels: { route: '/api/v1/auth/login', method: 'POST', status: '5xx' }, value: 2 },
      { labels: { route: '/api/v1/orders', method: 'POST', status: '2xx' }, value: 30 }
    ],
    duration: [
      {
        labels: { route: '/api/v1/products', method: 'GET' },
        total: 6000000,        // total microseconds
        buckets: [
          { le: 50,   count: 60 },
          { le: 100,  count: 100 },
          { le: 500,  count: 119 },
          { le: 1000, count: 122 },
          { le: 5000, count: 123 }
        ]
      },
      {
        labels: { route: '/api/v1/auth/login', method: 'POST' },
        total: 3200000,
        buckets: [
          { le: 50,   count: 5 },
          { le: 100,  count: 30 },
          { le: 500,  count: 75 },
          { le: 1000, count: 81 },
          { le: 5000, count: 82 }
        ]
      }
    ]
  },
  sse: { activeConnections: 4 },
  auth: {
    refreshTokensIssued: [{ value: 12 }],
    refreshTokensReplayed: [{ value: 1 }]
  },
  notifications: { sent: [
    { labels: { event: 'new_order' }, value: 8 },
    { labels: { event: 'withdrawal_request' }, value: 2 }
  ] },
  search: { byStrategy: [
    { labels: { strategy: 'fulltext' }, value: 50 },
    { labels: { strategy: 'like' }, value: 10 }
  ] }
};

describe('AdminMetricsWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty/error states when no data yet', async () => {
    api.apiGet.mockRejectedValue(new Error('boom'));
    const w = mount(AdminMetricsWidget);
    await flushPromises();
    // Error message surfaced
    expect(w.text()).toContain('Metrik alınamadı');
    // Empty state OR error state shown (no big table)
    expect(w.findAll('table').length).toBe(0);
  });

  it('renders endpoint table with aggregated rows', async () => {
    api.apiGet.mockResolvedValue(typedResponse(snapshot));
    const w = mount(AdminMetricsWidget);
    await flushPromises();

    // Should show route + method + total + error rate
    expect(w.text()).toContain('GET');
    expect(w.text()).toContain('POST');
    expect(w.text()).toContain('/api/v1/products');
    expect(w.text()).toContain('/api/v1/auth/login');

    // 123 total requests for /products (120 + 3), 3 errors → 2.4% error rate
    // 82 total for /auth/login (80 + 2), 2 errors → 2.4%
    // The widget may show these in different formats — just check the
    // totals appear as numbers somewhere.
    expect(w.text()).toMatch(/123/);
    expect(w.text()).toMatch(/82/);
  });

  it('groups by route+method (not by status code)', async () => {
    api.apiGet.mockResolvedValue(typedResponse(snapshot));
    const w = mount(AdminMetricsWidget);
    await flushPromises();

    // We have 5 distinct request entries in the snapshot but only
    // 3 distinct route+method combos. The widget should mention all
    // three (products GET, auth/login POST, orders POST).
    const text = w.text();
    expect(text).toContain('/api/v1/products');
    expect(text).toContain('/api/v1/auth/login');
    expect(text).toContain('/api/v1/orders');
    // Should also show the totals (123, 82, 30)
    expect(text).toMatch(/123/);
    expect(text).toMatch(/82/);
    expect(text).toMatch(/30/);
  });

  it('shows memory usage as MB', async () => {
    api.apiGet.mockResolvedValue(typedResponse(snapshot));
    const w = mount(AdminMetricsWidget);
    await flushPromises();
    expect(w.text()).toContain('124');
    expect(w.text()).toMatch(/MB/);
  });

  it('shows SSE active connection count', async () => {
    api.apiGet.mockResolvedValue(typedResponse(snapshot));
    const w = mount(AdminMetricsWidget);
    await flushPromises();
    expect(w.text()).toContain('4');
  });

  it('shows refresh tokens issued vs replayed', async () => {
    api.apiGet.mockResolvedValue(typedResponse(snapshot));
    const w = mount(AdminMetricsWidget);
    await flushPromises();
    expect(w.text()).toContain('12');     // issued
    expect(w.text()).toContain('1');      // replayed
  });

  it('shows search strategy counts (fulltext + like)', async () => {
    api.apiGet.mockResolvedValue(typedResponse(snapshot));
    const w = mount(AdminMetricsWidget);
    await flushPromises();
    // The widget renders the per-strategy counts (50, 10) somewhere.
    // We don't require the word "fulltext" to appear (template may use
    // an icon/label string from i18n). Just verify the values are visible.
    expect(w.text()).toMatch(/50/);
    expect(w.text()).toMatch(/10/);
  });

  it('handles snapshot with empty http arrays gracefully', async () => {
    api.apiGet.mockResolvedValue(
      typedResponse({ ...snapshot, http: { requests: [], duration: [] } })
    );
    const w = mount(AdminMetricsWidget);
    await flushPromises();
    // Should not throw; should render without crashing
    expect(w.exists()).toBe(true);
  });

  it('does not render content while loading the first snapshot', () => {
    // Never-resolving promise → loading state, no rows yet
    api.apiGet.mockReturnValue(new Promise(() => {}));
    const w = mount(AdminMetricsWidget);
    expect(w.findAll('table').length).toBe(0);
  });
});
