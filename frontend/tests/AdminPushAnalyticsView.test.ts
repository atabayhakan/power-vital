// Component tests for AdminPushAnalyticsView — verifies KPI cards,
// 14-day chart, by-event table, and top actors list rendering.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));

import axios from 'axios';
import AdminPushAnalyticsView from '../src/views/AdminPushAnalyticsView.vue';

const mockedAxios = axios as unknown as { get: ReturnType<typeof vi.fn> };

const analyticsResponse = {
  generatedAt: '2026-06-19T15:00:00Z',
  totalBroadcasts: 42,
  activeSubscribers: 156,
  byEventKey: [
    { eventKey: 'order_paid',   broadcastCount: 15, sent: 28, expired: 2, failed: 0 },
    { eventKey: 'withdrawal_approved', broadcastCount: 8,  sent: 12, expired: 1, failed: 1 },
    { eventKey: 'custom',       broadcastCount: 19, sent: 35, expired: 3, failed: 0 }
  ],
  byDay: [
    { date: '2026-06-06', sent: 10, expired: 1, failed: 0, broadcasts: 3 },
    { date: '2026-06-07', sent: 18, expired: 0, failed: 1, broadcasts: 5 },
    { date: '2026-06-08', sent: 25, expired: 2, failed: 0, broadcasts: 7 },
    { date: '2026-06-09', sent: 15, expired: 0, failed: 0, broadcasts: 4 }
  ],
  topActors: [
    { actorId: 'a1', actor: { id: 'a1', name: 'Ali Admin', email: 'ali@pv.kg', role: 'admin' }, broadcastCount: 25, sent: 48, failed: 1 },
    { actorId: 'a2', actor: { id: 'a2', name: 'Ayşe Yönetici', email: 'ayse@pv.kg', role: 'admin' }, broadcastCount: 17, sent: 27, failed: 0 }
  ]
};

describe('AdminPushAnalyticsView', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('initial render', () => {
    it('renders header + subtitle', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: analyticsResponse });
      const w = mount(AdminPushAnalyticsView);
      await flushPromises();
      expect(w.text()).toContain('Push Analitik');
      expect(w.text()).toContain('Web Push bildirim');
    });

    it('fetches analytics on mount', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: analyticsResponse });
      mount(AdminPushAnalyticsView);
      await flushPromises();
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/push/analytics');
    });

    it('shows error message when fetch fails', async () => {
      mockedAxios.get = vi.fn().mockRejectedValue({
        response: { status: 500, data: { error: 'DB down' } }
      });
      const w = mount(AdminPushAnalyticsView);
      await flushPromises();
      expect(w.text()).toContain('DB down');
    });
  });

  describe('KPI cards', () => {
    it('renders 7 KPI tiles (broadcasts + subscribers + sent + expired + failed + delivery + error rate)', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: analyticsResponse });
      const w = mount(AdminPushAnalyticsView);
      await flushPromises();
      const kpis = w.findAll('.pa-kpi');
      expect(kpis.length).toBe(7);
    });

    it('shows totalBroadcasts and activeSubscribers', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: analyticsResponse });
      const w = mount(AdminPushAnalyticsView);
      await flushPromises();
      expect(w.text()).toContain('42');  // totalBroadcasts
      expect(w.text()).toContain('156'); // activeSubscribers
    });

    it('sums sent/expired/failed across all event keys', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: analyticsResponse });
      const w = mount(AdminPushAnalyticsView);
      await flushPromises();
      // sent = 28 + 12 + 35 = 75
      // expired = 2 + 1 + 3 = 6
      // failed = 0 + 1 + 0 = 1
      // total = 82, deliveryRate = 75/82 = 91.5%
      expect(w.text()).toContain('75');  // delivered
      expect(w.text()).toContain('6');   // expired
      expect(w.text()).toContain('1');   // failed
      expect(w.text()).toMatch(/91\.5/); // delivery rate
    });
  });

  describe('14-day chart', () => {
    it('renders one row per day', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: analyticsResponse });
      const w = mount(AdminPushAnalyticsView);
      await flushPromises();
      const rows = w.findAll('.pa-chart-row');
      expect(rows.length).toBe(4);
    });

    it('renders ASCII bar chart characters (█ + ░)', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: analyticsResponse });
      const w = mount(AdminPushAnalyticsView);
      await flushPromises();
      const bars = w.findAll('.pa-chart-bar');
      const text = bars.map(b => b.text()).join('');
      expect(text).toMatch(/[█░]/);
    });

    it('normalizes bars to the max value (longest bar = max day)', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: analyticsResponse });
      const w = mount(AdminPushAnalyticsView);
      await flushPromises();
      const bars = w.findAll('.pa-chart-bar');
      // Find longest (max day = 25 pushes on 2026-06-08)
      const lengths = bars.map(b => b.text().replace(/░/g, '').length);
      const max = Math.max(...lengths);
      expect(max).toBeGreaterThan(20);  // at least ~80% of width=32
    });
  });

  describe('by event key table', () => {
    it('renders one row per event key', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: analyticsResponse });
      const w = mount(AdminPushAnalyticsView);
      await flushPromises();
      const rows = w.findAll('.pa-tbl tbody tr');
      expect(rows.length).toBe(3);
    });

    it('displays event keys as pills', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: analyticsResponse });
      const w = mount(AdminPushAnalyticsView);
      await flushPromises();
      expect(w.text()).toContain('order_paid');
      expect(w.text()).toContain('withdrawal_approved');
      expect(w.text()).toContain('custom');
    });
  });

  describe('top senders list', () => {
    it('renders an ordered list with ranks', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: analyticsResponse });
      const w = mount(AdminPushAnalyticsView);
      await flushPromises();
      const actors = w.findAll('.pa-actor');
      expect(actors.length).toBe(2);
      expect(actors[0].text()).toContain('Ali Admin');
      expect(actors[0].text()).toContain('1'); // rank
      expect(actors[1].text()).toContain('Ayşe Yönetici');
      expect(actors[1].text()).toContain('2'); // rank
    });

    it('shows broadcast count + sent + failed for each actor', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: analyticsResponse });
      const w = mount(AdminPushAnalyticsView);
      await flushPromises();
      const firstActor = w.findAll('.pa-actor')[0];
      expect(firstActor.text()).toContain('25 broadcast');
      expect(firstActor.text()).toContain('48 ✓');
      expect(firstActor.text()).toContain('1 ✗');
    });
  });

  describe('empty state', () => {
    it('shows empty hint when no event keys', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({
        data: { ...analyticsResponse, byEventKey: [], byDay: [], topActors: [] }
      });
      const w = mount(AdminPushAnalyticsView);
      await flushPromises();
      expect(w.text()).toContain('Henüz broadcast verisi yok');
    });
  });

  describe('refresh', () => {
    it('re-fetches when refresh button clicked', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: analyticsResponse });
      const w = mount(AdminPushAnalyticsView);
      await flushPromises();
      vi.clearAllMocks();
      const btn = w.find('.pa-refresh');
      await btn.trigger('click');
      await flushPromises();
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/push/analytics');
    });
  });

  describe('drill-down modal', () => {
    const drillResponse = {
      generatedAt: '2026-06-19T16:00:00Z',
      eventKey: 'order_paid',
      hours: 24,
      totals: { sent: 28, expired: 2, failed: 0, count: 5 },
      hourly: [
        { hour: '2026-06-19T00', sent: 5, expired: 0, failed: 0, count: 1 },
        { hour: '2026-06-19T08', sent: 18, expired: 2, failed: 0, count: 3 },
        { hour: '2026-06-19T16', sent: 5, expired: 0, failed: 0, count: 1 }
      ],
      topReasons: [
        { reason: 'subscription expired (404)', count: 2 }
      ],
      recent: [
        {
          id: 'r1', sent: 1, expired: 0, failed: 0,
          createdAt: '2026-06-19T16:00:00Z', targetId: 'u1',
          target: { id: 'u1', name: 'User 1', email: 'u1@x.com' }
        }
      ]
    };

    it('opens drill-down modal when event row is clicked', async () => {
      mockedAxios.get = vi.fn().mockImplementation((url: string) => {
        if (String(url).includes('event-detail')) {
          return Promise.resolve({ data: drillResponse });
        }
        return Promise.resolve({ data: analyticsResponse });
      });
      const w = mount(AdminPushAnalyticsView, { attachTo: document.body });
      await flushPromises();
      await flushPromises();
      await flushPromises();

      const eventRow = w.findAll('.pa-row-clickable')[0];
      expect(eventRow.exists()).toBe(true);
      await eventRow.trigger('click');
      await flushPromises();
      await flushPromises();
      await flushPromises();

      // Teleport renders into document.body, not into the wrapper.
      const modal = document.querySelector('.pa-modal');
      expect(modal).not.toBeNull();
      expect(modal!.textContent).toContain('order_paid');
      expect(modal!.textContent).toContain('Drill-down');
      w.unmount();
    });

    it('drill-down modal shows hourly buckets', async () => {
      mockedAxios.get = vi.fn().mockImplementation((url: string) => {
        if (String(url).includes('event-detail')) return Promise.resolve({ data: drillResponse });
        return Promise.resolve({ data: analyticsResponse });
      });
      const w = mount(AdminPushAnalyticsView, { attachTo: document.body });
      await flushPromises();
      const eventRow = w.findAll('.pa-row-clickable')[0];
      await eventRow.trigger('click');
      await flushPromises();
      await flushPromises();
      await flushPromises();

      const hourlyRows = document.querySelectorAll('.pa-hourly-row');
      expect(hourlyRows.length).toBe(3);
      w.unmount();
    });

    it('drill-down modal shows failure reasons table', async () => {
      mockedAxios.get = vi.fn().mockImplementation((url: string) => {
        if (String(url).includes('event-detail')) return Promise.resolve({ data: drillResponse });
        return Promise.resolve({ data: analyticsResponse });
      });
      const w = mount(AdminPushAnalyticsView, { attachTo: document.body });
      await flushPromises();
      const eventRow = w.findAll('.pa-row-clickable')[0];
      await eventRow.trigger('click');
      await flushPromises();
      await flushPromises();
      await flushPromises();

      const reasonRows = document.querySelectorAll('.pa-tbl--small tbody tr');
      expect(reasonRows.length).toBeGreaterThan(0);
      expect(document.body.textContent).toContain('subscription expired');
      w.unmount();
    });

    it('changes hours filter when chip clicked (6h / 24h / 72h / 168h)', async () => {
      const drillCalls: any[] = [];
      mockedAxios.get = vi.fn().mockImplementation((url: string, cfg?: any) => {
        if (String(url).includes('event-detail')) {
          drillCalls.push(cfg);
          return Promise.resolve({ data: { ...drillResponse, hours: cfg?.params?.hours ?? 24 } });
        }
        return Promise.resolve({ data: analyticsResponse });
      });
      const w = mount(AdminPushAnalyticsView, { attachTo: document.body });
      await flushPromises();
      const eventRow = w.findAll('.pa-row-clickable')[0];
      await eventRow.trigger('click');
      await flushPromises();
      await flushPromises();
      await flushPromises();

      // Find the "7g" chip in the teleported modal (lives in document.body).
      const chips = Array.from(document.querySelectorAll('.pa-modal-filters button'));
      const chip7d = chips.find(b => (b.textContent || '').trim() === '7g') as HTMLButtonElement | undefined;
      expect(chip7d).toBeTruthy();
      chip7d!.click();
      await flushPromises();
      await flushPromises();

      expect(drillCalls.length).toBeGreaterThanOrEqual(2);
      const last = drillCalls[drillCalls.length - 1];
      expect(last?.params?.hours).toBe(168);
      w.unmount();
    });

    it('closes drill-down modal when ✕ button clicked', async () => {
      mockedAxios.get = vi.fn().mockImplementation((url: string) => {
        if (String(url).includes('event-detail')) return Promise.resolve({ data: drillResponse });
        return Promise.resolve({ data: analyticsResponse });
      });
      const w = mount(AdminPushAnalyticsView, { attachTo: document.body });
      await flushPromises();
      const eventRow = w.findAll('.pa-row-clickable')[0];
      await eventRow.trigger('click');
      await flushPromises();
      await flushPromises();
      await flushPromises();

      expect(document.querySelector('.pa-modal')).not.toBeNull();
      const closeBtn = document.querySelector('.pa-modal-close') as HTMLButtonElement | null;
      expect(closeBtn).not.toBeNull();
      closeBtn!.click();
      await flushPromises();

      expect(document.querySelector('.pa-modal')).toBeNull();
      w.unmount();
    });
  });
});
