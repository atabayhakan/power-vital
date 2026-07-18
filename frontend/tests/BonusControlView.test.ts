// Component tests for BonusControlView — verifies the demo-data fallback is
// gone (fetch failure shows a real error + retry, NOT fake config) and that
// the referral toggle is bound to the real backend field `isFastStartActive`
// (the old `isReferralActive` key does not exist in SystemConfig and its
// saves 400'd against the strict SystemConfigUpdateSchema).
//
// axios is mocked so no real network calls happen.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';

vi.mock('axios', () => ({
  default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), create: vi.fn(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn() })) }
}));

import BonusControlView from '../src/views/BonusControlView.vue';

const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

const i18n = (globalThis as any).__VITEST_I18N__;
const mountOpts = { global: { plugins: [i18n] } };

const LIVE_CONFIG = {
  isMlmEnabled: true,
  isFastStartActive: true,
  fastStartRates: '[10,5,2]',
  isUnilevelActive: true,
  unilevelRates: '[5,5,5]',
  isOverdriveActive: false,
  overdrivePoolPct: '5',
  maxPayoutLimitPct: '30'
};

const LIVE_STATS = { totalRevenue: '50000', totalBonus: '14000', currentPayoutRatio: '28' };

const liveResponse = () => Promise.resolve({ data: { config: { ...LIVE_CONFIG }, stats: { ...LIVE_STATS } } });

describe('BonusControlView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
    localStorage.setItem('token', 'test-token');
  });

  it('shows a real error with retry on fetch failure — NO demo content', async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { data: { error: 'Connection refused' } } });
    const w = mount(BonusControlView, mountOpts);
    await flushPromises();

    expect(w.text()).toContain('Yapılandırma yüklenemedi');
    expect(w.text()).toContain('Connection refused');
    // The old demo fallback would have rendered the full panel — it must not.
    expect(w.text()).not.toContain('MLM Motor Durumu');
    expect(w.find('.admin-panel-grid').exists()).toBe(false);

    // Retry recovers with live data
    mockedAxios.get.mockImplementation(liveResponse);
    const retryBtn = w.findAll('button').find(b => b.text().includes('Tekrar Dene'));
    await retryBtn!.trigger('click');
    await flushPromises();
    expect(w.text()).toContain('MLM Motor Durumu');
  });

  it('renders live config values, with the referral toggle bound to isFastStartActive', async () => {
    mockedAxios.get.mockImplementation(liveResponse);
    const w = mount(BonusControlView, mountOpts);
    await flushPromises();

    expect(w.text()).toContain('MLM Motor Durumu');
    expect(w.text()).toContain('50000');
    expect(w.text()).toContain('14000');

    const toggles = w.findAll('.toggle-btn');
    // Module order: fast start (referans), unilevel, overdrive
    expect(toggles[0].text()).toBe('AÇIK');   // isFastStartActive: true
    expect(toggles[1].text()).toBe('AÇIK');   // isUnilevelActive: true
    expect(toggles[2].text()).toBe('KAPALI'); // isOverdriveActive: false
  });

  it('toggling the referral module saves with the isFastStartActive key', async () => {
    mockedAxios.get.mockImplementation(liveResponse);
    mockedAxios.put.mockResolvedValue({ data: { ok: true } });
    const w = mount(BonusControlView, mountOpts);
    await flushPromises();

    await w.findAll('.toggle-btn')[0].trigger('click');
    await flushPromises();

    expect(mockedAxios.put).toHaveBeenCalledTimes(1);
    const [url, payload] = mockedAxios.put.mock.calls[0];
    expect(url).toBe('/api/v1/system/config');
    expect(payload.isFastStartActive).toBe(false); // flipped from live true
    expect(payload).not.toHaveProperty('isReferralActive');
    expect(payload.fastStartRates).toEqual([10, 5, 2]);
    expect(payload.unilevelRates).toEqual([5, 5, 5]);
    expect(payload.isUnilevelActive).toBe(true);
    expect(payload.isOverdriveActive).toBe(false);
  });
});
