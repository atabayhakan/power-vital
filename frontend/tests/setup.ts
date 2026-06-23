// Vitest setup — runs before every test file.
//
// Polyfills browser APIs that happy-dom doesn't ship by default and
// exposes Vue runtime via globalThis.Vue so composable tests that
// use defineComponent/createApp/h don't need a separate `from 'vue'`
// import (which would fail when the test runs without vue plugin resolver).
import { vi, beforeAll, afterEach } from 'vitest';
import { createI18n } from 'vue-i18n';
import TR from './__fixtures__/tr.json';

// Build a global vue-i18n instance. Tests can install it via
// `global.plugins: [__i18n]` when mounting components.
const __i18n = createI18n({
  legacy: false,
  locale: 'tr',
  fallbackLocale: 'tr',
  messages: { tr: TR }
});
;(globalThis as any).__VITEST_I18N__ = __i18n;

// 🧪 Test-environment i18n dictionary. We use a static sync import so
// the JSON is available synchronously when useTranslate's t() runs
// inside a component test.
//
// We also stub the composable so `t()` returns the real TR strings
// instead of the key (matching what users see in production).
// Per-test vi.mock overrides still win when a test needs custom behaviour.

// Configure a global Vue app with vue-i18n so any test can call
// useI18n() directly without mounting it manually. We use the same
// TR dict so t('admin.dashboard.title') returns the real string.
import { createApp } from 'vue';
const __app = createApp({});
__app.use((globalThis as any).__VITEST_I18N__);
__app.mount = () => null; // never actually mount — components create their own apps

vi.mock('../src/composables/useTranslate', () => ({
  useTranslate: () => ({
    t: (key: string, params?: Record<string, any>) => {
      const parts = key.split('.');
      let v: any = TR;
      for (const p of parts) v = v?.[p];
      if (typeof v === 'string') {
        return params ? v.replace(/\{(\w+)\}/g, (_: string, k: string) => String(params[k] ?? '')) : v;
      }
      return key;
    },
    td: (o: any, f: string) => o?.[f] ?? '',
    locale: { value: 'tr' },
    setLocale: () => {},
    FALLBACK_ORDER: ['tr', 'ru', 'kg', 'en']
  })
}));

// Mock vue-i18n's useI18n too — components call useI18n().t() but the
// global vue-i18n instance above doesn't have every key registered.
// Returning the key (when missing) would break component tests that
// look for translated text in the DOM.
vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<any>('vue-i18n');
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string, params?: Record<string, any>) => {
        const parts = key.split('.');
        let v: any = TR;
        for (const p of parts) v = v?.[p];
        if (typeof v === 'string') {
          return params ? v.replace(/\{(\w+)\}/g, (_: string, k: string) => String(params[k] ?? '')) : v;
        }
        return key;
      },
      locale: { value: 'tr' },
      locales: { value: ['tr'] },
      tField: (o: any, f: string) => o?.[f]
    })
  };
});

vi.mock('../src/composables/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, any>) => {
      const parts = key.split('.');
      let v: any = TR;
      for (const p of parts) v = v?.[p];
      if (typeof v === 'string') {
        return params ? v.replace(/\{(\w+)\}/g, (_: string, k: string) => String(params[k] ?? '')) : v;
      }
      return key;
    },
    tField: (o: any, f: string) => o?.[f]
  })
}));

// Set on globalThis too so the production composable's test fallback can
// find it. (Redundant with vi.mock above, but safe.)
(globalThis as any).__TR_DICT__ = TR;
if (typeof global !== 'undefined') (global as any).__TR_DICT__ = TR;

// Vue runtime — loaded via dynamic require so ESM resolution issues
// don't block the setup file. Exposed globally for tests that use
// defineComponent/createApp/h without importing vue directly.
;(globalThis as any).Vue = require('vue')

// IntersectionObserver polyfill — LazyImage uses it.
class MockIntersectionObserver {
  callback: IntersectionObserverCallback
  elements: Element[] = []
  constructor(cb: IntersectionObserverCallback) { this.callback = cb }
  observe(el: Element) {
    this.elements.push(el)
    this.callback(
      [{ isIntersecting: true, target: el } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    )
  }
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}
;(globalThis as any).IntersectionObserver = MockIntersectionObserver

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as any).ResizeObserver = MockResizeObserver

;(globalThis as any).matchMedia = (query: string) => ({
  matches: false, media: query, onchange: null,
  addEventListener: vi.fn(), removeEventListener: vi.fn(),
  addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn()
})

beforeAll(() => {
  vi.stubGlobal('console', {
    ...console,
    log: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  })
})

afterEach(() => {
  vi.clearAllMocks()
})
