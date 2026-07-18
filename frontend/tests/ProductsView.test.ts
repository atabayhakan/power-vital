// Component test for ProductsView CSV export — the "CSV Dışa Aktar" button
// added next to the result count. Follows the same auth-header + blob
// pattern as OrdersView/UserManagementView via utils/csvDownload.
//
// axios + csvDownload are mocked so no real network/download happens.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import { downloadCsv } from '../src/utils/csvDownload';

vi.mock('axios', () => ({
  default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn(), create: vi.fn(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn() })) }
}));

vi.mock('../src/utils/api', () => ({
  default: { get: vi.fn(), post: vi.fn() }
}));

vi.mock('../src/utils/PriceEngine', () => ({
  calculatePrice: vi.fn(() => 0)
}));

vi.mock('../src/utils/csvDownload', () => ({
  downloadCsv: vi.fn().mockResolvedValue(undefined),
  pickFilename: () => 'products.csv'
}));

import ProductsView from '../src/views/ProductsView.vue';

const mockedAxios = axios as unknown as { get: ReturnType<typeof vi.fn> };
const mockedDownload = downloadCsv as unknown as ReturnType<typeof vi.fn>;

const i18n = (globalThis as any).__VITEST_I18N__;
const mountOpts = { global: { plugins: [i18n] } };

describe('ProductsView CSV export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === '/api/v1/products') return Promise.resolve({ data: [] });
      if (url === '/api/v1/categories') return Promise.resolve({ data: [] });
      return Promise.reject(new Error('unexpected ' + url));
    });
  });

  it('renders the export button in the table toolbar', async () => {
    const w = mount(ProductsView, mountOpts);
    await flushPromises();
    const btn = w.find('.csv-export-btn');
    expect(btn.exists()).toBe(true);
    expect(btn.text()).toContain('Ürünleri CSV olarak indir');
  });

  it('clicking the button downloads /admin/bulk/products.csv as products.csv', async () => {
    const w = mount(ProductsView, mountOpts);
    await flushPromises();
    await w.find('.csv-export-btn').trigger('click');
    await flushPromises();

    expect(mockedDownload).toHaveBeenCalledTimes(1);
    expect(mockedDownload).toHaveBeenCalledWith({
      url: '/api/v1/admin/bulk/products.csv',
      filename: 'products.csv',
      token: 'test-token'
    });
  });
});
