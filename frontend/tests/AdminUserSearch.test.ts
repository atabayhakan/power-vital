// AdminUserSearch — component integration tests (admin pickers).
//
// We don't re-test the underlying useSearchAutocomplete composable
// (covered in useSearchAutocomplete.test.ts). These tests verify the
// component-level concerns: emits, accessibility attributes, key
// handling, and the click → select flow.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import { mockOpenApiMock, typedResponse } from './helpers/mockOpenApi';

vi.mock('../src/api/openapi-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/api/openapi-client')>();
  return { ...actual, ...mockOpenApiMock() };
});

const api = mockOpenApiMock();

// Stub localStorage so the token lookup doesn't crash.
vi.stubGlobal('localStorage', {
  getItem: () => 'test-token',
  setItem: () => {},
  removeItem: () => {}
});

// Note: vue-i18n is globally mocked in tests/setup.ts — admin.role.* keys
// resolve from tests/__fixtures__/tr.json so we get real translations.

import AdminUserSearch from '../src/components/AdminUserSearch.vue';

beforeEach(() => {
  api.apiGet.mockReset();
});

const mockSearchResponse = (results: any[]) => {
  api.apiGet.mockResolvedValueOnce(
    typedResponse({ query: 'ali', count: results.length, results })
  );
};

describe('AdminUserSearch — empty state', () => {
  it('shows the search input with the i18n placeholder', () => {
    const w = mount(AdminUserSearch);
    const input = w.find('input.aus-input');
    expect(input.exists()).toBe(true);
    expect(input.attributes('type')).toBe('search');
    expect(input.attributes('autocomplete')).toBe('off');
  });

  it('has ARIA combobox attributes wired up', () => {
    const w = mount(AdminUserSearch);
    const input = w.find('input.aus-input');
    expect(input.attributes('aria-autocomplete')).toBe('list');
    expect(input.attributes('aria-expanded')).toBe('false');
    expect(input.attributes('aria-controls')).toBe('aus-listbox');
  });
});

describe('AdminUserSearch — search results', () => {
  it('renders one list item per result', async () => {
    mockSearchResponse([
      { id: 'u-1', name: 'Ali Yılmaz', email: 'ali@pv.kg', role: 'customer',
        walletKgs: 500, walletUsd: 5, isActive: true }
    ]);
    const w = mount(AdminUserSearch);
    w.find('input.aus-input').setValue('ali');
    // Wait for debounce + fetch
    await new Promise(r => setTimeout(r, 250));
    await flushPromises();

    const items = w.findAll('.aus-item');
    expect(items.length).toBe(1);
    expect(items[0].text()).toContain('Ali Yılmaz');
    expect(items[0].text()).toContain('ali@pv.kg');
  });

  it('emits "select" with the clicked user', async () => {
    const user = { id: 'u-1', name: 'Ali Yılmaz', email: 'ali@pv.kg', role: 'customer',
      walletKgs: 500, walletUsd: 5, isActive: true };
    mockSearchResponse([user]);
    const w = mount(AdminUserSearch);
    w.find('input.aus-input').setValue('ali');
    await new Promise(r => setTimeout(r, 250));
    await flushPromises();

    await w.find('.aus-item').trigger('mousedown');
    const emitted = w.emitted('select');
    expect(emitted).toBeTruthy();
    expect((emitted![0][0] as any).id).toBe('u-1');
  });

  it('shows the loading state while the request is in flight', async () => {
    // Slow response — never resolves
    api.apiGet.mockReturnValueOnce(new Promise(() => {}));
    const w = mount(AdminUserSearch);
    w.find('input.aus-input').setValue('ali');
    await new Promise(r => setTimeout(r, 250));
    await flushPromises();
    expect(w.text()).toContain('Yükleniyor');
  });

  it('drops the dropdown when the API returns no results', async () => {
    mockSearchResponse([]);
    const w = mount(AdminUserSearch);
    w.find('input.aus-input').setValue('zzz');
    await new Promise(r => setTimeout(r, 300));
    await flushPromises();
    // When results=[], isOpen stays false so the dropdown isn't shown —
    // the input simply doesn't expand. Verify by checking the list is empty
    // and there's no error toast (success state, just nothing to show).
    expect(w.findAll('.aus-item')).toHaveLength(0);
    expect(w.text()).not.toContain('Sonuç bulunamadı'); // explicit "no results" only shown when isOpen=true
  });
});

describe('AdminUserSearch — role chip', () => {
  it('renders the role with the correct colour class', async () => {
    mockSearchResponse([
      { id: 'u-1', name: 'Admin User', email: 'a@x', role: 'admin',
        walletKgs: 0, walletUsd: 0, isActive: true }
    ]);
    const w = mount(AdminUserSearch);
    w.find('input.aus-input').setValue('admin'); // 5 chars — passes minLength=2
    await new Promise(r => setTimeout(r, 300));
    await flushPromises();
    const chip = w.find('.aus-role');
    expect(chip.exists()).toBe(true);
    expect(chip.classes()).toContain('aus-role--admin');
  });

  it('shows a warning icon when the user is inactive', async () => {
    mockSearchResponse([
      { id: 'u-1', name: 'Banned', email: 'b@x', role: 'customer',
        walletKgs: 0, walletUsd: 0, isActive: false }
    ]);
    const w = mount(AdminUserSearch);
    w.find('input.aus-input').setValue('banned');
    await new Promise(r => setTimeout(r, 300));
    await flushPromises();
    expect(w.find('.aus-flag').exists()).toBe(true);
  });
});