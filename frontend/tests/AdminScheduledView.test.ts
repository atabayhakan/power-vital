// Component tests for AdminScheduledView — verify scheduling form,
// job list rendering, status filter, and cancel action.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

// vi.mock is hoisted ABOVE all imports, so we use vi.hoisted to
// declare the mock holder in a place vitest's hoister can reach.
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn()
}));

vi.mock('axios', () => ({
  default: {
    get: mocks.get,
    post: mocks.post,
    delete: mocks.delete
  }
}));

vi.mock('../src/composables/useTranslate', () => ({
  // Use real TR dict for admin.scheduled.* keys so tests assert against
  // the same text users see.
  useTranslate: () => {
    const dict: Record<string, string> = {
      'admin.scheduled.title': '⏰ Planlı Broadcast\'lar',
      'admin.scheduled.subtitle': 'İleri tarihli push bildirimleri.',
      'admin.scheduled.newJobTitle': '📅 Yeni Planlı Broadcast',
      'admin.scheduled.jobPlanned': '✅ Job planlandı:',
      'admin.scheduled.scheduling': '⏳ Planlanıyor…',
      'admin.scheduled.scheduleCta': '⏰ Broadcast\'ı planla',
      'admin.scheduled.jobsListTitle': '📋 Planlanan İşler ({n})',
      'admin.scheduled.filterAll': 'Tümü',
      'admin.scheduled.colSent': '✅ Gönderildi',
      'admin.scheduled.colCancelled': '❌ İptal',
      'admin.scheduled.colFailed': '⚠️ Başarısız',
      'admin.scheduled.loading': '⏳ Yükleniyor…',
      'admin.scheduled.empty': 'Henüz planlı job yok.',
      'admin.scheduled.emptyHint': 'Yukarıdaki form\'dan ilk planlı broadcast\'ı oluşturun.',
      'admin.scheduled.cancelCta': 'İptal',
      'admin.broadcast.fieldTitle': 'Başlık',
    };
    return {
      t: (k: string, params?: any) => {
        const v: string | undefined = dict[k];
        if (typeof v === 'string' && params) {
          return v.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ''));
        }
        return v ?? k;
      },
      locale: { value: 'tr' }
    };
  }
}));

import axios from 'axios';
import AdminScheduledView from '../src/views/AdminScheduledView.vue';

const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

// Stub <router-link> as a plain anchor so the component renders
// without needing to mount the real router.
const RouterLinkStub = {
  name: 'RouterLink',
  props: ['to'],
  template: '<a :href="to"><slot /></a>'
};

const mountView = () => mount(AdminScheduledView, {
  global: { stubs: { RouterLink: RouterLinkStub } }
});

const sampleJobs = [
  {
    id: 'j1',
    actorId: 'a1',
    actor: { id: 'a1', name: 'Ali Admin', email: 'ali@pv.kg' },
    note: 'Q3 promo',
    status: 'pending',
    targetMode: 'segment',
    segmentRole: 'customer',
    title: 'Q3 Kampanya',
    body: 'Test mesaj',
    url: '/promo',
    eventKey: 'promo',
    tag: 'q3',
    scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
    dispatchedAt: null,
    cancelledAt: null,
    resultParentBroadcastId: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 'j2',
    actorId: 'a1',
    actor: { id: 'a1', name: 'Ali Admin', email: 'ali@pv.kg' },
    note: null,
    status: 'dispatched',
    targetMode: 'segment',
    segmentRole: 'distributor',
    title: 'Sent earlier',
    body: 'Already sent',
    url: '/',
    eventKey: 'custom',
    tag: null,
    scheduledAt: new Date(Date.now() - 3600_000).toISOString(),
    dispatchedAt: new Date(Date.now() - 3590_000).toISOString(),
    cancelledAt: null,
    resultParentBroadcastId: 'sched-j2',
    createdAt: new Date(Date.now() - 7200_000).toISOString()
  }
];

describe('AdminScheduledView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial render', () => {
    it('renders header + compose form + job list', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: { rows: [], count: 0 } });
      const w = mountView();
      await flushPromises();
      expect(w.text()).toContain('Planlı Broadcast');
      expect(w.text()).toContain('Yeni Planlı Broadcast');
    });

    it('fetches scheduled jobs on mount', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: { rows: [], count: 0 } });
      mountView();
      await flushPromises();
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/push/scheduled', expect.any(Object));
    });
  });

  describe('job list', () => {
    it('renders one row per job', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: { rows: sampleJobs, count: 2 } });
      const w = mountView();
      await flushPromises();
      const rows = w.findAll('tbody tr');
      expect(rows.length).toBe(2);
    });

    it('shows status pills', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: { rows: sampleJobs, count: 2 } });
      const w = mountView();
      await flushPromises();
      expect(w.text()).toContain('Bekliyor');
      expect(w.text()).toContain('Gönderildi');
    });

    it('shows cancel button only for pending jobs', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: { rows: sampleJobs, count: 2 } });
      const w = mountView();
      await flushPromises();
      const cancelBtns = w.findAll('button').filter(b => b.text().trim() === 'İptal');
      expect(cancelBtns.length).toBe(1);
    });

    it('shows empty state when no jobs', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: { rows: [], count: 0 } });
      const w = mountView();
      await flushPromises();
      expect(w.text()).toContain('Henüz planlı job yok');
    });

    it('re-fetches when status filter changes', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: { rows: [], count: 0 } });
      const w = mountView();
      await flushPromises();
      vi.clearAllMocks();

      const filterSelect = w.findAll('select').find(s => {
        const opts = Array.from((s.element as HTMLSelectElement).options).map(o => o.text);
        return opts.some(t => t.includes('Bekliyor'));
      });
      expect(filterSelect).toBeTruthy();
      await filterSelect!.setValue('pending');
      await flushPromises();
      const calls = mockedAxios.get.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(1);
      expect(calls[calls.length - 1][1]?.params?.status).toBe('pending');
    });
  });

  describe('compose form', () => {
    it('disables send button when title is empty', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: { rows: [], count: 0 } });
      const w = mountView();
      await flushPromises();
      const sendBtn = w.findAll('button').find(b => b.text().includes('planla'));
      expect(sendBtn).toBeTruthy();
      // HTML boolean attribute: disabled="" means disabled. The attribute
      // value is the empty string, NOT undefined.
      expect(sendBtn!.attributes('disabled')).toBe('');
    });

    it('sends POST /api/v1/push/schedule on submit', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: { rows: [], count: 0 } });
      mockedAxios.post = vi.fn().mockResolvedValue({
        data: { id: 'new-job', targetCount: 5, scheduledAt: new Date(Date.now() + 600000).toISOString() }
      });
      const w = mountView();
      await flushPromises();

      await w.find('input[placeholder*="Planlı kampanya"]').setValue('Test');
      await w.find('textarea').setValue('Test body');
      // Use a clearly-future date (24h ahead) so 60s minimum lead is met.
      const futureDate = new Date(Date.now() + 24 * 60 * 60_000);
      futureDate.setSeconds(0, 0);
      const isoLocal = futureDate.toISOString().slice(0, 16);
      await w.find('input[type="datetime-local"]').setValue(isoLocal);
      await flushPromises();

      const sendBtn = w.findAll('button').find(b => b.text().includes('planla'));
      // If button is still disabled, the form has a validation error.
      // Print the component text to debug.
      if (sendBtn!.attributes('disabled') === '') {
         
        console.log('DEBUG scheduledAt in DOM:', w.find('input[type="datetime-local"]').element.value);
        console.log('DEBUG title:', (w.find('input[placeholder*="Planlı kampanya"]').element as HTMLInputElement).value);
      }
      await sendBtn!.trigger('click');
      await flushPromises();

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/v1/push/schedule', expect.objectContaining({
        title: 'Test',
        body: 'Test body',
        eventKey: 'custom'
      }));
    });
  });

  describe('cancel action', () => {
    it('calls DELETE /api/v1/push/scheduled/:id when cancel clicked', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: { rows: sampleJobs, count: 2 } });
      mockedAxios.delete = vi.fn().mockResolvedValue({ data: { ok: true } });
      // happy-dom doesn't implement window.confirm — install a stub.
      window.confirm = vi.fn().mockReturnValue(true) as any;

      const w = mountView();
      await flushPromises();

      const cancelBtn = w.findAll('button').find(b => b.text().trim() === 'İptal');
      expect(cancelBtn).toBeTruthy();
      await cancelBtn!.trigger('click');
      await flushPromises();

      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/v1/push/scheduled/j1');
    });
  });

  describe('tick-now', () => {
    it('calls POST /api/v1/push/scheduled-tick', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: { rows: [], count: 0 } });
      mockedAxios.post = vi.fn().mockResolvedValue({ data: { ok: true } });
      const w = mountView();
      await flushPromises();

      const tickBtn = w.findAll('button').find(b => b.text().includes('Tick Now'));
      expect(tickBtn).toBeTruthy();
      await tickBtn!.trigger('click');
      await flushPromises();

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/v1/push/scheduled-tick');
    });
  });
});
