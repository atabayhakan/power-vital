// useAdminRealtime — composable tests.
// Verifies:
//   • Singleton EventSource — multiple consumers share one connection
//   • Per-event-type handler dispatch
//   • One handler throwing does not break others
//   • Connection state (connected) is reactive

import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';

// Fake EventSource — let tests drive open / message / error / named events
type Listener = (e: any) => void;
class FakeEventSource {
  static instances: FakeEventSource[] = [];
  url: string;
  readyState = 0;
  listeners: Record<string, Listener[]> = {};
  withCredentials = false;

  constructor(url: string, init?: { withCredentials?: boolean }) {
    this.url = url;
    this.withCredentials = !!init?.withCredentials;
    FakeEventSource.instances.push(this);
  }
  addEventListener(t: string, fn: Listener) { (this.listeners[t] ||= []).push(fn); }
  removeEventListener(t: string, fn: Listener) {
    this.listeners[t] = (this.listeners[t] || []).filter(l => l !== fn);
  }
  close() { this.readyState = 2; }
  __fire(type: string, data: any = {}) {
    for (const fn of this.listeners[type] || []) fn({ data: JSON.stringify(data) });
  }
  __open() {
    this.readyState = 1;
    for (const fn of this.listeners['open'] || []) fn({});
  }
  __error() {
    this.readyState = 2;
    for (const fn of this.listeners['error'] || []) fn({});
  }
}

beforeAll(() => {
  vi.stubGlobal('EventSource', FakeEventSource);
});

afterEach(() => {
  // Reset module state (caches the singleton _es + refcount) and clear
  // EventSource instances so each test starts with a clean slate.
  vi.resetModules();
  FakeEventSource.instances = [];
});

const installPlugins = () => [
  {
    install(app: any) {
      app.config.globalProperties.$t = (k: string) => k;
      app.provide('toast', { info: vi.fn(), success: vi.fn(), error: vi.fn() });
    }
  }
];

const mountConsumer = async (setup: (rt: any) => void) => {
  const mod = await import('../src/composables/useAdminRealtime');
  let rt: any;
  const Comp = defineComponent({
    setup() { rt = mod.useAdminRealtime(); setup(rt); return () => h('div'); }
  });
  const w = mount(Comp, { global: { plugins: installPlugins() } });
  await flushPromises();
  return { w, rt, es: FakeEventSource.instances[0] };
};

describe('useAdminRealtime — connection', () => {
  it('opens one EventSource to /api/v1/admin/events with credentials', async () => {
    const { w } = await mountConsumer((rt) => rt.on('new_order', () => {}));
    expect(FakeEventSource.instances.length).toBe(1);
    expect(FakeEventSource.instances[0].url).toBe('/api/v1/admin/events');
    expect(FakeEventSource.instances[0].withCredentials).toBe(true);
    w.unmount();
  });

  it('shares a single connection across multiple consumers', async () => {
    const a = await mountConsumer((rt) => rt.on('new_order', () => {}));
    const b = await mountConsumer((rt) => rt.on('new_order', () => {}));
    expect(FakeEventSource.instances.length).toBe(1);
    a.w.unmount();
    b.w.unmount();
  });

  it('connected ref becomes true after EventSource fires open', async () => {
    const { w, rt, es } = await mountConsumer((rt) => rt.on('new_order', () => {}));
    expect(rt.connected.value).toBe(false);
    es.__open();
    await flushPromises();
    expect(rt.connected.value).toBe(true);
    w.unmount();
  });

  it('connected ref becomes false after EventSource fires error', async () => {
    const { w, rt, es } = await mountConsumer((rt) => rt.on('new_order', () => {}));
    es.__open();
    await flushPromises();
    expect(rt.connected.value).toBe(true);
    es.__error();
    await flushPromises();
    expect(rt.connected.value).toBe(false);
    w.unmount();
  });
});

describe('useAdminRealtime — handler dispatch', () => {
  it('dispatches a new_order event to the registered handler', async () => {
    const handler = vi.fn();
    const { w, es } = await mountConsumer((rt) => rt.on('new_order', handler));
    // Production payload shape — server sends { type, data, ts } in the
    // JSON body and the event NAME separately as `event: new_order`.
    es.__fire('new_order', { type: 'new_order', data: { orderId: 'o-1', totalKgs: 1500 }, ts: 1000 });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toMatchObject({
      type: 'new_order',
      data: { orderId: 'o-1', totalKgs: 1500 }
    });
    w.unmount();
  });

  it('does not deliver an event to handlers of a different type', async () => {
    const orderHandler = vi.fn();
    const paymentHandler = vi.fn();
    const { w, es } = await mountConsumer((rt) => {
      rt.on('new_order', orderHandler);
      rt.on('payment_received', paymentHandler);
    });
    es.__fire('new_order', { type: 'new_order', data: { orderId: 'o-1' }, ts: 1 });
    expect(orderHandler).toHaveBeenCalledTimes(1);
    expect(paymentHandler).not.toHaveBeenCalled();
    w.unmount();
  });

  it('a throwing handler does not break sibling handlers', async () => {
    const noisy = vi.fn(() => { throw new Error('boom'); });
    const good = vi.fn();
    const { w, es } = await mountConsumer((rt) => {
      rt.on('new_order', noisy);
      rt.on('new_order', good);
    });
    expect(() => es.__fire('new_order', { type: 'new_order', data: {}, ts: 1 })).not.toThrow();
    expect(noisy).toHaveBeenCalledTimes(1);
    expect(good).toHaveBeenCalledTimes(1);
    w.unmount();
  });
});
