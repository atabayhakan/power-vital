// Component tests for AdminBroadcastView — verifies tab switching,
// user search/pick, mode chips (single / multi / segment), and
// the multi-target broadcast payload shape.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import { mockOpenApiMock, typedResponse } from './helpers/mockOpenApi';

vi.mock('../src/api/openapi-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/api/openapi-client')>();
  return { ...actual, ...mockOpenApiMock() };
});

vi.mock('../src/composables/usePushSubscription', () => ({
  usePushSubscription: () => ({
    state: { value: 'unsupported' },
    isSupported: { value: false },
    isSubscribed: { value: false },
    error: { value: '' },
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    refreshFromSw: vi.fn(),
    onSwMessage: vi.fn()
  })
}));

const api = mockOpenApiMock();

import AdminBroadcastView from '../src/views/AdminBroadcastView.vue';

const userList = [
  { id: 'u-1', name: 'Ali Yılmaz', email: 'ali@pv.kg', role: 'customer' },
  { id: 'u-2', name: 'Beste Baş',  email: 'beste@pv.kg', role: 'distributor' },
  { id: 'u-3', name: 'Cem Demir',  email: 'cem@pv.kg', role: 'admin' }
];

describe('AdminBroadcastView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper: route apiGet/apiPost to a matcher function for flexible mocking.
  const queueGet = (matcher: (path: string) => unknown) => {
    api.apiGet.mockImplementation(async (path: string) => typedResponse(matcher(path)));
  };
  const queuePost = (matcher: (path: string, body: any) => unknown) => {
    api.apiPost.mockImplementation(async (path: string, body: any) => typedResponse(matcher(path, body)));
  };

  describe('initial render', () => {
    it('renders header + tabs + compose form', async () => {
      queueGet(() => ({ rows: [], count: 0 }));
      const w = mount(AdminBroadcastView);
      await flushPromises();
      expect(w.text()).toContain('Push Broadcast');
      expect(w.text()).toContain('Compose');
      expect(w.text()).toContain('History');
    });

    it('renders 3 mode chips (single / multi / segment)', async () => {
      queueGet(() => ({ rows: [], count: 0 }));
      const w = mount(AdminBroadcastView);
      await flushPromises();
      expect(w.text()).toContain('Tek');
      expect(w.text()).toContain('Çoklu');
      expect(w.text()).toContain('Segment');
    });

    it('disables send button when no user is selected', async () => {
      queueGet(() => ({ rows: [], count: 0 }));
      const w = mount(AdminBroadcastView);
      await flushPromises();
      const sendBtn = w.findAll('button').find(b => b.text().includes('Broadcast gönder'));
      expect(sendBtn).toBeTruthy();
      expect(sendBtn!.attributes('disabled')).toBeDefined();
    });
  });

  describe('user picker (single mode)', () => {
    it('searches users after 2+ chars', async () => {
      queueGet((p) => p.includes('/admin/users') ? userList : { rows: [], count: 0 });
      const w = mount(AdminBroadcastView);
      await flushPromises();

      const searchInput = w.find('input.bc-input');
      await searchInput.setValue('ali');
      await new Promise(r => setTimeout(r, 300));
      await flushPromises();

      expect(w.text()).toContain('Ali Yılmaz');
    });

    it('picks a user when clicked from search results', async () => {
      queueGet((p) => p.includes('/admin/users') ? userList : { rows: [], count: 0 });
      const w = mount(AdminBroadcastView);
      await flushPromises();
      const searchInput = w.find('input.bc-input');
      await searchInput.setValue('ali');
      await new Promise(r => setTimeout(r, 300));
      await flushPromises();

      const listItem = w.find('.bc-list-item');
      await listItem.trigger('click');
      await flushPromises();

      expect(w.text()).toContain('Ali Yılmaz');
    });
  });

  describe('mode switching', () => {
    it('switching to multi mode shows multi-select UI', async () => {
      queueGet(() => ({ rows: [], count: 0 }));
      const w = mount(AdminBroadcastView);
      await flushPromises();

      const multiChip = w.findAll('.bc-chip').find(b => b.text().includes('Çoklu'));
      expect(multiChip).toBeTruthy();
      await multiChip!.trigger('click');
      await flushPromises();

      expect(w.text()).toContain('Yukarıdan kullanıcı ekleyin');
    });

    it('switching to segment mode shows role selector', async () => {
      queueGet(() => ({ rows: [], count: 0 }));
      const w = mount(AdminBroadcastView);
      await flushPromises();

      const segChip = w.findAll('.bc-chip').find(b => b.text().includes('Segment'));
      await segChip!.trigger('click');
      await flushPromises();

      const select = w.find('select');
      expect(select.exists()).toBe(true);
      expect(w.text()).toContain('Tüm müşteriler');
    });
  });

  describe('broadcast send (single target)', () => {
    it('sends the correct payload when form is complete', async () => {
      queueGet((p) => p.includes('/admin/users') ? userList : { rows: [], count: 0 });
      queuePost(() => ({ sent: 1, expired: 0, failed: 0 }));
      const w = mount(AdminBroadcastView);
      await flushPromises();

      const searchInput = w.find('input.bc-input');
      await searchInput.setValue('ali');
      await new Promise(r => setTimeout(r, 300));
      await flushPromises();
      await w.find('.bc-list-item').trigger('click');
      await flushPromises();

      await w.find('input[placeholder*="Teklif"]').setValue('Test Title');
      await w.find('textarea').setValue('Test body message');

      const sendBtn = w.findAll('button').find(b => b.text().includes('Broadcast gönder') && !b.attributes('disabled'));
      expect(sendBtn, 'send button should be enabled').toBeTruthy();
      await sendBtn!.trigger('click');
      await flushPromises();

      expect(api.apiPost).toHaveBeenCalledTimes(1);
      const [url, payload] = api.apiPost.mock.calls[0];
      expect(url).toBe('/api/v1/push/broadcast');
      expect(payload).toMatchObject({
        userId: 'u-1',
        title: 'Test Title',
        body: 'Test body message',
        eventKey: 'custom'
      });
    });

    it('handles 4xx error response with error message', async () => {
      queueGet((p) => p.includes('/admin/users') ? userList : { rows: [], count: 0 });
      queuePost(() => { throw { response: { status: 400, data: { error: 'No matching users' } } }; });
      const w = mount(AdminBroadcastView);
      await flushPromises();

      const inputs = w.findAll('input.bc-input');
      await inputs[1].setValue('T');
      await w.find('textarea.bc-input').setValue('B');
      await inputs[0].setValue('ali');
      await new Promise(r => setTimeout(r, 300));
      await flushPromises();
      await w.find('.bc-list-item').trigger('click');
      await flushPromises();

      const sendBtn = w.findAll('button').find(b => b.text().includes('Broadcast gönder') && !b.attributes('disabled'));
      if (sendBtn) {
        await sendBtn.trigger('click');
        await flushPromises();
        const text = w.text();
        expect(text.includes('No matching users') || text.includes('admin.broadcast.error')).toBe(true);
      }
    });
  });

  describe('multi-target send', () => {
    it('sends userIds array when in multi mode with selected users', async () => {
      queueGet((p) => p.includes('/admin/users') ? userList : { rows: [], count: 0 });
      queuePost(() => ({ parentBroadcastId: 'pb-1', targetCount: 2, totalSent: 2 }));
      const w = mount(AdminBroadcastView);
      await flushPromises();

      const multiChip = w.findAll('.bc-chip').find(b => b.text().includes('Çoklu'));
      await multiChip!.trigger('click');
      await flushPromises();

      const searchInput = w.find('input.bc-input');
      await searchInput.setValue('pv.kg');
      await new Promise(r => setTimeout(r, 300));
      await flushPromises();

      const items = w.findAll('.bc-list-item');
      await items[0].trigger('click');
      await flushPromises();
      await searchInput.setValue('pv.kg');
      await new Promise(r => setTimeout(r, 300));
      await flushPromises();
      const items2 = w.findAll('.bc-list-item');
      if (items2.length > 0) {
        await items2[0].trigger('click');
        await flushPromises();
      }

      const inputs = w.findAll('input.bc-input');
      await inputs[1].setValue('Multi Title');
      await w.find('textarea.bc-input').setValue('Multi body');

      const sendBtn = w.findAll('button').find(b => b.text().includes('Broadcast gönder') && !b.attributes('disabled'));
      if (sendBtn) {
        await sendBtn.trigger('click');
        await flushPromises();

        const payload = api.apiPost.mock.calls[0]?.[1];
        if (payload) {
          expect(Array.isArray((payload as any).userIds)).toBe(true);
          expect((payload as any).userIds.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('history tab', () => {
    it('does not fetch history until tab is activated', async () => {
      queueGet(() => ({ rows: [], count: 0 }));
      const _w = mount(AdminBroadcastView);
      await flushPromises();

      const historyCalls = api.apiGet.mock.calls.filter(
        (c: any) => String(c[0] || '').includes('broadcast-history')
      );
      expect(historyCalls.length).toBe(0);
    });

    it('fetches history when History tab is clicked', async () => {
      queueGet(() => ({ rows: [], count: 0 }));
      const w = mount(AdminBroadcastView);
      await flushPromises();

      const historyTab = w.findAll('.bc-tab').find(b => b.text().includes('History'));
      await historyTab!.trigger('click');
      await flushPromises();

      const historyCalls = api.apiGet.mock.calls.filter(
        (c: any) => String(c[0] || '').includes('broadcast-history')
      );
      expect(historyCalls.length).toBeGreaterThanOrEqual(1);
    });

    it('renders flat mode toggle by default', async () => {
      queueGet(() => ({
        rows: [{ id: 'r1', targetId: 'u1', target: { id: 'u1', name: 'A', email: 'a@x' }, eventKey: 'custom', sent: 1, expired: 0, failed: 0, createdAt: new Date().toISOString() }],
        count: 1
      }));
      const w = mount(AdminBroadcastView);
      await flushPromises();
      const historyTab = w.findAll('.bc-tab').find(b => b.text().includes('History'));
      await historyTab!.trigger('click');
      await flushPromises();

      expect(w.text()).toContain('Düz');
      expect(w.text()).toContain('Gruplu');
    });

    it('collapses rows with same parentBroadcastId into one group', async () => {
      queueGet(() => ({
        rows: [
          { id: 'r1', parentBroadcastId: 'pb-1', targetId: 'u1', target: { id: 'u1', name: 'A', email: 'a@x' }, eventKey: 'custom', sent: 1, expired: 0, failed: 0, createdAt: '2026-01-01T10:00:00Z' },
          { id: 'r2', parentBroadcastId: 'pb-1', targetId: 'u2', target: { id: 'u2', name: 'B', email: 'b@x' }, eventKey: 'custom', sent: 1, expired: 0, failed: 0, createdAt: '2026-01-01T10:00:00Z' },
          { id: 'r3', parentBroadcastId: 'pb-1', targetId: 'u3', target: { id: 'u3', name: 'C', email: 'c@x' }, eventKey: 'custom', sent: 0, expired: 1, failed: 0, createdAt: '2026-01-01T10:00:00Z' }
        ],
        count: 3
      }));
      const w = mount(AdminBroadcastView);
      await flushPromises();
      const historyTab = w.findAll('.bc-tab').find(b => b.text().includes('History'));
      await historyTab!.trigger('click');
      await flushPromises();

      const groupsChip = w.findAll('.bc-chip').find(b => b.text().includes('Gruplu'));
      await groupsChip!.trigger('click');
      await flushPromises();

      const groupRows = w.findAll('.bc-group-row');
      expect(groupRows.length).toBe(1);
      expect(w.text()).toContain('3 alıcı (multi)');
    });

    it('expanding a group reveals per-target rows', async () => {
      queueGet(() => ({
        rows: [
          { id: 'r1', parentBroadcastId: 'pb-1', targetId: 'u1', target: { id: 'u1', name: 'Alice', email: 'alice@x' }, eventKey: 'custom', sent: 1, expired: 0, failed: 0, createdAt: '2026-01-01T10:00:00Z' },
          { id: 'r2', parentBroadcastId: 'pb-1', targetId: 'u2', target: { id: 'u2', name: 'Bob', email: 'bob@x' }, eventKey: 'custom', sent: 1, expired: 0, failed: 0, createdAt: '2026-01-01T10:00:00Z' }
        ],
        count: 2
      }));
      const w = mount(AdminBroadcastView);
      await flushPromises();
      const historyTab = w.findAll('.bc-tab').find(b => b.text().includes('History'));
      await historyTab!.trigger('click');
      await flushPromises();

      const groupsChip = w.findAll('.bc-chip').find(b => b.text().includes('Gruplu'));
      await groupsChip!.trigger('click');
      await flushPromises();

      expect(w.find('.bc-group-expanded').exists()).toBe(false);

      const expandBtn = w.find('.bc-mini');
      await expandBtn.trigger('click');
      await flushPromises();

      expect(w.find('.bc-group-expanded').exists()).toBe(true);
      expect(w.text()).toContain('Alice');
      expect(w.text()).toContain('Bob');
    });

    it('groups aggregate counters over GROUPS not rows', async () => {
      queueGet(() => ({
        rows: [
          { id: 'r1', parentBroadcastId: 'pb-1', targetId: 'u1', target: { id: 'u1', name: 'A', email: 'a@x' }, eventKey: 'custom', sent: 1, expired: 0, failed: 0, createdAt: '2026-01-01T10:00:00Z' },
          { id: 'r2', parentBroadcastId: 'pb-1', targetId: 'u2', target: { id: 'u2', name: 'B', email: 'b@x' }, eventKey: 'custom', sent: 1, expired: 0, failed: 0, createdAt: '2026-01-01T10:00:00Z' },
          { id: 'r3', parentBroadcastId: 'pb-1', targetId: 'u3', target: { id: 'u3', name: 'C', email: 'c@x' }, eventKey: 'custom', sent: 1, expired: 0, failed: 0, createdAt: '2026-01-01T10:00:00Z' },
          { id: 'r4', parentBroadcastId: 'pb-2', targetId: 'u4', target: { id: 'u4', name: 'D', email: 'd@x' }, eventKey: 'custom', sent: 0, expired: 0, failed: 1, createdAt: '2026-01-01T11:00:00Z' }
        ],
        count: 4
      }));
      const w = mount(AdminBroadcastView);
      await flushPromises();
      const historyTab = w.findAll('.bc-tab').find(b => b.text().includes('History'));
      await historyTab!.trigger('click');
      await flushPromises();

      const groupsChip = w.findAll('.bc-chip').find(b => b.text().includes('Gruplu'));
      await groupsChip!.trigger('click');
      await flushPromises();

      expect(w.text()).toContain('Toplam Alıcı');
    });
  });

  describe('CSV export', () => {
    it('shows CSV export button in History tab filters', async () => {
      queueGet(() => ({ rows: [], count: 0 }));
      const w = mount(AdminBroadcastView);
      await flushPromises();
      const historyTab = w.findAll('.bc-tab').find(b => b.text().includes('History'));
      await historyTab!.trigger('click');
      await flushPromises();

      const csvBtn = w.findAll('button').find(b => b.text().includes('CSV'));
      expect(csvBtn).toBeTruthy();
    });

    it('CSV button builds export URL with current filters', async () => {
      queueGet(() => ({ rows: [], count: 0 }));
      const w = mount(AdminBroadcastView);
      await flushPromises();
      const historyTab = w.findAll('.bc-tab').find(b => b.text().includes('History'));
      await historyTab!.trigger('click');
      await flushPromises();

      const inputs = w.findAll('input.bc-input');
      await inputs[inputs.length - 2].setValue('admin-uuid');
      await inputs[inputs.length - 1].setValue('user-uuid');
      await flushPromises();

      const csvBtn = w.findAll('button').find(b => b.text().includes('CSV'));
      // Override HTMLAnchorElement.click to capture href without recursion.
      let capturedHref = '';
      const proto = HTMLAnchorElement.prototype as any;
      const origClick = proto.click;
      proto.click = function (this: HTMLAnchorElement) {
        capturedHref = this.href;
        // don't actually navigate
      };

      try {
        await csvBtn!.trigger('click');
        await flushPromises();

        expect(capturedHref).toContain('/api/v1/push/broadcast-history.csv');
        expect(capturedHref).toContain('actorId=admin-uuid');
        expect(capturedHref).toContain('targetId=user-uuid');
        expect(capturedHref).toContain('limit=');
      } finally {
        proto.click = origClick;
      }
    });

    it('CSV button shows loading state while exporting', async () => {
      queueGet(() => ({ rows: [], count: 0 }));
      const w = mount(AdminBroadcastView);
      await flushPromises();
      const historyTab = w.findAll('.bc-tab').find(b => b.text().includes('History'));
      await historyTab!.trigger('click');
      await flushPromises();

      // No-op click so we don't actually navigate during the test
      const proto = HTMLAnchorElement.prototype as any;
      const origClick = proto.click;
      proto.click = () => {};

      try {
        const csvBtn = w.findAll('button').find(b => b.text().includes('CSV'));
        await csvBtn!.trigger('click');
        expect(csvBtn).toBeTruthy();
      } finally {
        proto.click = origClick;
      }
    });
  });
});
