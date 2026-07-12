// Component tests for AdminErrorsView — verifies that resolving a row
// updates state locally instead of re-fetching the whole list.
//
// Regression covered: resolve() used to call load() again after a
// successful POST, which toggled the page through several extra render
// passes (isLoading flicker on the unrelated "Yenile" button, then the
// whole array replaced) — visible as the row list jumping around on
// every click. The fix updates `errors` in place, so a resolve should
// never trigger a second GET.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router');
  return { ...actual, useRoute: () => ({ fullPath: '/admin-errors' }) };
});

vi.mock('../src/composables/useCurrentUser', () => ({
  useCurrentUser: () => ({ value: null })
}));

import { mockOpenApiMock, typedResponse } from './helpers/mockOpenApi';

vi.mock('../src/api/openapi-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/api/openapi-client')>();
  return { ...actual, ...mockOpenApiMock() };
});

const api = mockOpenApiMock();

import AdminErrorsView from '../src/views/AdminErrorsView.vue';

const sampleErrors = [
  { id: 'err-1', source: 'ErrorBoundary', message: 'boom 1', route: '/', locale: 'tr', userId: null, resolved: false, createdAt: '2026-07-04T06:00:38.000Z' },
  { id: 'err-2', source: 'vue-global', message: 'boom 2', route: '/katalog', locale: 'tr', userId: null, resolved: false, createdAt: '2026-07-04T06:00:37.000Z' }
];

describe('AdminErrorsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolving a row removes it locally without a second GET', async () => {
    api.apiGet.mockResolvedValue(typedResponse({ errors: sampleErrors, total: 2 }));
    const w = mount(AdminErrorsView);
    await flushPromises();

    expect(w.text()).toContain('boom 1');
    expect(w.text()).toContain('boom 2');
    expect(api.apiGet).toHaveBeenCalledTimes(1);

    api.apiPost.mockResolvedValue(typedResponse({ id: 'err-1', resolved: true, resolvedAt: '2026-07-12T00:00:00.000Z' }));
    const buttons = w.findAll('button.ae-resolve');
    await buttons[0].trigger('click');
    await flushPromises();

    // The resolve POST fired for the right row...
    expect(api.apiPost).toHaveBeenCalledWith('/api/v1/client-logs/err-1/resolve', expect.anything());
    // ...but no extra list reload — this is the actual regression check.
    expect(api.apiGet).toHaveBeenCalledTimes(1);

    // Default view hides resolved rows, so err-1 should disappear and
    // err-2 should remain untouched.
    expect(w.text()).not.toContain('boom 1');
    expect(w.text()).toContain('boom 2');
    expect(w.text()).toContain('Çözüldü olarak işaretlendi.');
  });

  it('keeps a resolved row visible (marked resolved) when "show resolved" is on', async () => {
    api.apiGet.mockResolvedValue(typedResponse({ errors: sampleErrors, total: 2 }));
    const w = mount(AdminErrorsView);
    await flushPromises();

    await w.find('.ae-toggle input[type="checkbox"]').setValue(true);
    await flushPromises();
    // Toggling "show resolved" re-queries with resolved=true — that GET
    // is expected; reset the counter before the assertion that matters.
    api.apiGet.mockClear();

    api.apiPost.mockResolvedValue(typedResponse({ id: 'err-1', resolved: true, resolvedAt: '2026-07-12T00:00:00.000Z' }));
    const buttons = w.findAll('button.ae-resolve');
    await buttons[0].trigger('click');
    await flushPromises();

    expect(api.apiGet).not.toHaveBeenCalled();
    expect(w.text()).toContain('boom 1');
    expect(w.text()).toContain('boom 2');
    // The resolved row's button now reads "Çözüldü" and is disabled.
    const rows = w.findAll('li.ae-row');
    const resolvedRow = rows.find(r => r.text().includes('boom 1'))!;
    expect(resolvedRow.classes()).toContain('ae-row--resolved');
    expect(resolvedRow.find('button.ae-resolve').text()).toBe('Çözüldü');
  });
});
