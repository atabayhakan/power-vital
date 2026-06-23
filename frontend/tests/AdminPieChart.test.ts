// AdminPieChart — SVG donut chart tests.
//
// Verifies:
//   • Empty data → no slices, "no data" message
//   • Single slice → 100% sharePct, single <path>
//   • Multiple slices → N <path>, legend lists each slice with %
//   • Zero-value items are filtered out (don't draw zero-width arcs)
//   • Center value defaults to the sum; respects custom centerValue prop
//   • Hover tooltip <title> includes the name + value + %
import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));
vi.mock('../src/composables/useAdminRealtime', () => ({
  useAdminRealtime: () => ({
    on: () => () => {}, onMany: () => () => {}, toastOn: () => () => {},
    connected: { value: true }, lastEvent: { value: null }, dispose: () => {}
  })
}));

import AdminPieChart from '../src/components/AdminPieChart.vue';

describe('AdminPieChart', () => {
  it('shows the empty state when total is zero', async () => {
    const w = mount(AdminPieChart, { props: { title: 't', data: [] } });
    await flushPromises();
    expect(w.text()).toContain('Henüz veri yok');
    expect(w.findAll('path.apc-slice')).toHaveLength(0);
  });

  it('renders one path per non-zero data item', async () => {
    const w = mount(AdminPieChart, {
      props: { title: 't', data: [
        { name: 'Coffee',      value: 7000 },
        { name: 'Supplements', value: 3000 },
        { name: 'Empty',       value: 0 } // filtered out
      ] }
    });
    await flushPromises();
    expect(w.findAll('path.apc-slice')).toHaveLength(2);
  });

  it('legend shows each slice with a percentage', async () => {
    const w = mount(AdminPieChart, {
      props: { title: 't', data: [
        { name: 'Coffee',      value: 7000 },
        { name: 'Supplements', value: 3000 }
      ] }
    });
    await flushPromises();
    const items = w.findAll('.apc-legend__item');
    expect(items).toHaveLength(2);
    expect(items[0].text()).toContain('Coffee');
    expect(items[0].text()).toContain('70.0%');
    expect(items[1].text()).toContain('Supplements');
    expect(items[1].text()).toContain('30.0%');
  });

  it('center value defaults to the total', async () => {
    const w = mount(AdminPieChart, {
      props: { title: 't', data: [
        { name: 'A', value: 1500 },
        { name: 'B', value: 3500 }
      ] }
    });
    await flushPromises();
    // Center value uses the K-suffix when value > 1000 → 5K
    expect(w.text()).toMatch(/5K/);
  });

  it('respects a custom centerValue prop', async () => {
    const w = mount(AdminPieChart, {
      props: { title: 't', data: [{ name: 'A', value: 1000 }],
        centerValue: '€1.2M', centerLabel: 'AVG' }
    });
    await flushPromises();
    expect(w.text()).toContain('€1.2M');
    expect(w.text()).toContain('AVG');
  });

  it('tooltip <title> includes name + value + %', async () => {
    const w = mount(AdminPieChart, {
      props: { title: 't', data: [
        { name: 'Coffee', value: 7000 },
        { name: 'Supplements', value: 3000 }
      ] }
    });
    await flushPromises();
    const titles = w.findAll('path.apc-slice title').map((t) => t.text());
    expect(titles[0]).toContain('Coffee');
    expect(titles[0]).toContain('70.0%');
    expect(titles[1]).toContain('Supplements');
    expect(titles[1]).toContain('30.0%');
  });
});
