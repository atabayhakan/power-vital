import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

// ────────────────────────────────────────────────────────────────────────────
// useTranslate — unified translation composable
//
// Provides:
//   • t(key)        → UI string lookup (falls back through TR → RU → KG)
//   • td(obj, f)    → translate a DATA field of an object using its `translations`
//                       JSON map (e.g. product.name in current locale)
//   • locale        → current locale code
//   • setLocale(c)  → switch + persist + emit
// ────────────────────────────────────────────────────────────────────────────

const FALLBACK_ORDER = ['tr', 'ru', 'kg', 'en'];

const STORAGE_KEY = 'pv_lang';

const readLocale = (): string => {
  if (typeof localStorage === 'undefined') return 'kg';
  return localStorage.getItem(STORAGE_KEY) || 'kg';
};

const writeLocale = (code: string) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, code);
    document?.documentElement?.setAttribute('lang', code);
  }
};

export function useTranslate() {
  const { locale, messages, t: i18nT } = useI18n();

  const currentLocale = computed(() => (locale.value || 'kg').slice(0, 2));

  const setLocale = (code: string) => {
    const lower = code.slice(0, 2);
    if (FALLBACK_ORDER.includes(lower)) {
      locale.value = lower;
      writeLocale(lower);
      // notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pv-locale-change', { detail: lower }));
      }
    }
  };

  /**
   * Translate a UI string key with fallback chain.
   * Usage: t('cart.addToCart')  →  returns string in active locale (or TR fallback).
   */
  const t = (key: string, params?: Record<string, unknown>): string => {
    const active = currentLocale.value;
    // Try active, then fallback chain
    for (const code of [active, ...FALLBACK_ORDER.filter(c => c !== active)]) {
      const msgs = messages.value?.[code] as any;
      if (!msgs) continue;
      const val = lookupNested(msgs, key);
      if (typeof val === 'string' && val.length > 0) {
        return interpolate(val, params);
      }
    }
    // Final fallback: vue-i18n t (handles ICU-style and runtime lookup)
    try {
      const out = i18nT(key, params as any);
      if (typeof out === 'string' && out && !out.includes('translation missing')) return out;
    } catch { /* fall through to default */ }
    // 🧪 Test fallback: if we're in a vitest worker, the setup file has
    // synced globalThis.__TR_DICT__. Use it so component tests render
    // the real TR strings without booting vue-i18n.
    if (typeof globalThis !== 'undefined' && (globalThis as any).__TR_DICT__) {
      const val = lookupNested((globalThis as any).__TR_DICT__, key);
      if (typeof val === 'string') return interpolate(val, params);
      // Helpful debug log (comment out in production)
       
      console.warn('[useTranslate.test] dict miss:', key, 'val=', val);
    } else {
       
      console.warn('[useTranslate.test] no __TR_DICT__; returning key', key);
    }
    return key;
  };

  /**
   * Translate a field on a data object. The object should have a `translations`
   * map: { ru: { name: '...' }, kg: { name: '...' } }.
   * Falls back through locale chain then to the base field.
   */
  const td = (obj: any, field: string): string => {
    if (!obj) return '';
    const active = currentLocale.value;
    const tMap = parseTranslations(obj.translations);
    for (const code of [active, ...FALLBACK_ORDER.filter(c => c !== active)]) {
      const v = tMap?.[code]?.[field];
      if (typeof v === 'string' && v.trim().length > 0) return v;
    }
    const base = obj[field];
    if (typeof base === 'string') return base;
    return '';
  };

  return { t, td, locale: currentLocale, setLocale, FALLBACK_ORDER };
}

const lookupNested = (obj: any, path: string): any => {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
};

const parseTranslations = (raw: any): any => {
  if (!raw) return null;
  let map: any = raw;
  if (typeof map === 'string') {
    try { map = JSON.parse(map); } catch { return null; }
  }
  if (!map || typeof map !== 'object') return null;
  // 🛡️ Legacy data: per-locale values may themselves be stringified JSON
  // (e.g. translations.ru = '{"name":"..."}'). Normalise to objects so field
  // lookups (tMap[code][field]) work regardless of how the data was written.
  for (const k of Object.keys(map)) {
    if (typeof map[k] === 'string') {
      try { map[k] = JSON.parse(map[k]); } catch { /* leave as-is */ }
    }
  }
  return map;
};

const interpolate = (s: string, params?: Record<string, unknown>): string => {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_m, key) => {
    const v = params[key];
    return v == null ? `{${key}}` : String(v);
  });
};

export const __test__ = { FALLBACK_ORDER, STORAGE_KEY, readLocale };
export { STORAGE_KEY, readLocale };