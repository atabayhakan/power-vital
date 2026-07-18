// Component tests for SimulationView — verifies the Simulation ↔ live-config
// anchor: mount reads GET /system/config into the simulator inputs, fetch
// failures show a real error + retry (NO silent demo defaults), and
// "Canlıya Al" opens a diff preview that writes NOTHING until confirmed.
//
// axios is mocked so no real network calls happen.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';

vi.mock('axios', () => ({
  default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), create: vi.fn(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn() })) }
}));

import SimulationView from '../src/views/SimulationView.vue';

const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

const i18n = (globalThis as any).__VITEST_I18N__;
const mountOpts = { global: { plugins: [i18n] } };

const LIVE_CONFIG = {
  isMlmEnabled: true,
  isFastStartActive: false,
  fastStartRates: '[12,6,3]',
  isUnilevelActive: true,
  unilevelRates: '[4,4,4]',
  isOverdriveActive: true,
  overdrivePoolPct: '7',
  maxPayoutLimitPct: '25'
};

const liveResponse = () => Promise.resolve({ data: { config: { ...LIVE_CONFIG }, stats: {} } });

const findBtn = (w: any, text: string) =>
  w.findAll('button').find((b: any) => b.text().includes(text));

describe('SimulationView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
    localStorage.setItem('token', 'test-token');
  });

  it('initializes simulator inputs from the live config on mount', async () => {
    mockedAxios.get.mockImplementation(liveResponse);
    const w = mount(SimulationView, mountOpts);
    await flushPromises();

    expect(mockedAxios.get).toHaveBeenCalledWith(
      '/api/v1/system/config',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) })
    );

    const checkboxes = w.findAll('input[type="checkbox"]');
    // Template order: security lock, fast start, unilevel, overdrive
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true);  // security lock (local what-if default)
    expect((checkboxes[1].element as HTMLInputElement).checked).toBe(false); // isFastStartActive from live
    expect((checkboxes[2].element as HTMLInputElement).checked).toBe(true);  // isUnilevelActive from live
    expect((checkboxes[3].element as HTMLInputElement).checked).toBe(true);  // isOverdriveActive from live

    const numbers = w.findAll('input[type="number"]');
    const values = numbers.map(n => (n.element as HTMLInputElement).value);
    expect(values).toContain('25'); // maxPayoutLimitPct from live
    expect(values).toContain('7');  // overdrivePoolPct from live
    // Unilevel is active → its three rate inputs show live [4,4,4]
    expect(values.filter(v => v === '4')).toHaveLength(3);
  });

  it('shows a real error with retry on fetch failure — no silent demo defaults', async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { data: { error: 'DB unreachable' } } });
    const w = mount(SimulationView, mountOpts);
    await flushPromises();

    expect(w.text()).toContain('Canlı yapılandırma yüklenemedi');
    expect(w.text()).toContain('DB unreachable');
    // Config UI is hidden while in error state
    expect(w.find('.dashboard-grid').exists()).toBe(false);

    // Retry recovers
    mockedAxios.get.mockImplementation(liveResponse);
    await findBtn(w, 'Tekrar Dene')!.trigger('click');
    await flushPromises();
    expect(w.find('.dashboard-grid').exists()).toBe(true);
    expect(w.text()).not.toContain('DB unreachable');
  });

  it('apply opens a diff preview and writes NOTHING until confirm', async () => {
    mockedAxios.get.mockImplementation(liveResponse);
    mockedAxios.put.mockResolvedValue({ data: { ok: true } });
    const w = mount(SimulationView, mountOpts);
    await flushPromises();

    // Change one anchored value: enable Fast Start
    const checkboxes = w.findAll('input[type="checkbox"]');
    await checkboxes[1].setValue(true);

    // First click: preview only
    await findBtn(w, 'Geçerli Ayarları Canlıya Al')!.trigger('click');
    await flushPromises();

    expect(mockedAxios.put).not.toHaveBeenCalled();
    expect(w.text()).toContain('Canlıya Alınacak Değişiklikler');
    expect(w.text()).toContain('Hızlı Başlangıç');
    expect(w.text()).toContain('Kapalı'); // old live value
    expect(w.text()).toContain('Açık');   // new simulator value

    // Confirm: merged payload is written
    await findBtn(w, 'Onayla ve Canlıya Yaz')!.trigger('click');
    await flushPromises();

    expect(mockedAxios.put).toHaveBeenCalledTimes(1);
    const [url, payload] = mockedAxios.put.mock.calls[0];
    expect(url).toBe('/api/v1/system/config');
    expect(payload).toEqual({
      isFastStartActive: true,
      fastStartRates: '[12,6,3]',
      isUnilevelActive: true,
      unilevelRates: '[4,4,4]',
      isOverdriveActive: true,
      overdrivePoolPct: 7,
      maxPayoutLimitPct: 25
    });
    expect(w.text()).toContain('Ayarlar canlı sisteme başarıyla yazıldı');
  });

  it('shows an empty-diff notice and never PUTs when nothing changed', async () => {
    mockedAxios.get.mockImplementation(liveResponse);
    const w = mount(SimulationView, mountOpts);
    await flushPromises();

    await findBtn(w, 'Geçerli Ayarları Canlıya Al')!.trigger('click');
    await flushPromises();

    expect(w.text()).toContain('Değişiklik yok');
    expect(findBtn(w, 'Onayla ve Canlıya Yaz')).toBeUndefined();
    expect(mockedAxios.put).not.toHaveBeenCalled();
  });
});
