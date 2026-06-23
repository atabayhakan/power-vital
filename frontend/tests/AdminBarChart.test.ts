// AdminBarChart — horizontal bar chart tests.
//
// Verifies:
//   • Empty data → "no data" message
//   • Rows render in DESC order regardless of input order
//   • maxRows caps the visible list
//   • Each row shows the value formatted with K/M suffix
//   • Custom badge (e.g. role chip) renders next to the label
import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));
vi.mock('../src/composables/useAdminRealtime', () => ({
  useAdminRealtime: () => ({
    on: () => () => {}, onMany: () => () => {}, toastOn: () => () => {},
    connected: { value: true }, lastEvent: { value: null }, dispose: () => {}
  })
}));

import AdminBarChart from '../src/components/AdminBarChart.vue';

describe('AdminBarChart', () => {
  it('shows the empty state when no rows', async () => {
    const w = mount(AdminBarChart, { props: { title: 't', data: [] } });
    await flushPromises();
    expect(w.text()).toContain('Henüz veri yok');
    expect(w.findAll('.abc-row')).toHaveLength(0);
  });

  it('renders one row per item', async () => {
    const w = mount(AdminBarChart, {
      props: { title: 't', data: [
        { label: 'A', value: 1000 },
        { label: 'B', value: 500 },
        { label: 'C', value: 100 }
      ] }
    });
    await flushPromises();
    expect(w.findAll('.abc-row')).toHaveLength(3);
  });

  it('sorts rows by value DESC regardless of input order', async () => {
    const w = mount(AdminBarChart, {
      props: { title: 't', data: [
        { label: 'C', value: 100 },
        { label: 'A', value: 1000 },
        { label: 'B', value: 500 }
      ] }
    });
    await flushPromises();
    const labels = w.findAll('.abc-row__label').map((l) => l.text());
    expect(labels).toEqual(['A', 'B', 'C']);
  });

  it('caps the rendered rows to maxRows', async () => {
    const data = Array.from({ length: 20 }, (_, i) => ({ label: `Row ${i}`, value: 1000 - i }));
    const w = mount(AdminBarChart, {
      props: { title: 't', data, maxRows: 5 }
    });
    await flushPromises();
    expect(w.findAll('.abc-row')).toHaveLength(5);
  });

  it('renders the unit suffix in the value column', async () => {
    const w = mount(AdminBarChart, {
      props: { title: 't', data: [{ label: 'A', value: 1500 }], unit: 'KGS' }
    });
    await flushPromises();
    expect(w.text()).toContain('1.5K KGS');
  });

  it('renders a badge when one is supplied', async () => {
    const w = mount(AdminBarChart, {
      props: { title: 't', data: [{ label: 'Alice', value: 500, badge: 'admin' }] }
    });
    await flushPromises();
    expect(w.find('.abc-row__badge').text()).toBe('admin');
  });

  it('renders the rank number on the left of each row', async () => {
    const w = mount(AdminBarChart, {
      props: { title: 't', data: [
        { label: 'A', value: 100 },
        { label: 'B', value: 50 }
      ] }
    });
    await flushPromises();
    const ranks = w.findAll('.abc-rank').map((r) => r.text());
    expect(ranks).toEqual(['1', '2']);
  });
});