// Component tests for AdminLoginView — verifies the secure gateway form
// (email + password) and error states. We mock the auth store so no
// real network calls happen.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

const mockAuth = {
  user: null,
  token: null,
  userRole: 'guest',
  loginAsAdmin: vi.fn()
};
vi.mock('../src/stores/useAuthStore', () => ({
  useAuthStore: () => mockAuth
}));

import AdminLoginView from '../src/views/AdminLoginView.vue';

const i18n = (globalThis as any).__VITEST_I18N__;
const mountOpts = { global: { plugins: [i18n] } };
const mountView = () => mount(AdminLoginView, mountOpts);

describe('AdminLoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.href assignment so we don't navigate during tests.
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, href: '' }
    });
  });

  it('renders the secure gateway title and helper text', async () => {
    const w = mountView();
    await flushPromises();
    expect(w.text()).toContain('Sistem Kontrol Odası');
    expect(w.text()).toContain('Yetkilendirilmiş personel');
  });

  it('renders both inputs (email + password) with proper labels', async () => {
    const w = mountView();
    await flushPromises();
    const inputs = w.findAll('input');
    expect(inputs.length).toBe(2);
    // First input is text/email, second is password.
    expect(inputs[0].attributes('type')).toMatch(/text|email/);
    expect(inputs[1].attributes('type')).toBe('password');
  });

  it('renders the submit button (initial state shows "GÜVENLİ GİRİŞ")', async () => {
    const w = mountView();
    await flushPromises();
    expect(w.text()).toContain('GÜVENLİ GİRİŞ');
    const submitBtn = w.findAll('button[type="submit"]')[0];
    expect(submitBtn).toBeTruthy();
  });

  it('shows validation error when either field is empty', async () => {
    const w = mountView();
    await flushPromises();
    const form = w.find('form');
    await form.trigger('submit.prevent');
    await flushPromises();
    expect(w.text()).toContain('Kimlik doğrulama bilgileri eksik');
    expect(mockAuth.loginAsAdmin).not.toHaveBeenCalled();
  });

  it('calls loginAsAdmin with entered credentials', async () => {
    mockAuth.loginAsAdmin.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    const w = mountView();
    await flushPromises();
    const inputs = w.findAll('input');
    await inputs[0].setValue('admin@powervital.org');
    await inputs[1].setValue('Secret#Pass123');
    const form = w.find('form');
    await form.trigger('submit.prevent');
    await flushPromises();
    expect(mockAuth.loginAsAdmin).toHaveBeenCalledWith('admin@powervital.org', 'Secret#Pass123');
  });

  it('redirects to /admin on successful login', async () => {
    mockAuth.loginAsAdmin.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    const w = mountView();
    await flushPromises();
    const inputs = w.findAll('input');
    await inputs[0].setValue('admin@x.kg');
    await inputs[1].setValue('pass');
    const form = w.find('form');
    await form.trigger('submit.prevent');
    await flushPromises();
    expect(window.location.href).toBe('/admin');
  });

  it('shows error message when loginAsAdmin rejects', async () => {
    mockAuth.loginAsAdmin.mockRejectedValue(new Error('E-posta veya şifre hatalı'));
    const w = mountView();
    await flushPromises();
    const inputs = w.findAll('input');
    await inputs[0].setValue('wrong@x.kg');
    await inputs[1].setValue('badpass');
    const form = w.find('form');
    await form.trigger('submit.prevent');
    await flushPromises();
    expect(w.text()).toContain('E-posta veya şifre hatalı');
  });

  it('renders the "back to store" link text', async () => {
    const w = mountView();
    await flushPromises();
    // We don't try to assert on href/to because router-link needs a
    // router instance to render as <a>. The visible text is enough.
    expect(w.text()).toContain('Mağazaya Dön');
  });
});
