// Component tests for ImpersonationBanner.
// We don't mock useImpersonation — instead we mount the component
// and assert against the rendered banner after manipulating sessionStorage.
// This is the most resilient approach across Vitest 4 mock-resolution.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('../composables/useTranslate', () => ({
  useTranslate: () => ({ t: (k: string) => k, locale: { value: 'tr' } })
}));

import ImpersonationBanner from '../src/components/admin/ImpersonationBanner.vue';

const STORAGE_KEY = 'pv_impersonation_session';

const setSession = (s: { sessionId: string; targetId: string; targetName: string; targetEmail: string; expiresAt: string; startedAt: string }) => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
};

const clearSession = () => sessionStorage.removeItem(STORAGE_KEY);

const makeSession = (overrides: Partial<{ targetName: string; targetEmail: string; minutesRemaining: number }> = {}) => {
  const expiresAt = new Date(Date.now() + (overrides.minutesRemaining ?? 30) * 60_000).toISOString();
  return {
    sessionId: 'sess-test',
    targetId: 'user-test',
    targetName: overrides.targetName ?? 'Ali Müşteri',
    targetEmail: overrides.targetEmail ?? 'ali@example.com',
    expiresAt,
    startedAt: new Date().toISOString()
  };
};

describe('ImpersonationBanner', () => {
  beforeEach(() => {
    clearSession();
  });

  afterEach(() => {
    clearSession();
  });

  it('renders nothing when no active session in sessionStorage', async () => {
    const w = mount(ImpersonationBanner);
    await flushPromises();
    expect(w.find('.imp-banner').exists()).toBe(false);
  });

  it('renders banner when sessionStorage has an active session', async () => {
    setSession(makeSession({ targetName: 'Ali', targetEmail: 'ali@x.com' }));
    const w = mount(ImpersonationBanner);
    await flushPromises();
    expect(w.find('.imp-banner').exists()).toBe(true);
    expect(w.text()).toContain('Ali');
    expect(w.text()).toContain('ali@x.com');
  });

  it('shows timer with "dk kaldı" suffix', async () => {
    setSession(makeSession({ minutesRemaining: 7 }));
    const w = mount(ImpersonationBanner);
    await flushPromises();
    expect(w.text()).toMatch(/\d+ dk kaldı/);
  });

  it('shows the impersonation header text', async () => {
    setSession(makeSession());
    const w = mount(ImpersonationBanner);
    await flushPromises();
    expect(w.text()).toContain('İmpersonation modu');
  });

  it('renders the stop button', async () => {
    setSession(makeSession());
    const w = mount(ImpersonationBanner);
    await flushPromises();
    // Two buttons now: "view history" (ghost) and "stop" — pick the stop one
    // by its non-ghost class.
    const buttons = w.findAll('.imp-banner__btn');
    expect(buttons.length).toBe(2);
    const stopBtn = buttons.find((b) => !b.classes('imp-banner__btn--ghost'));
    expect(stopBtn).toBeTruthy();
    expect(stopBtn!.text()).toContain('İmpersonation');
  });
});
