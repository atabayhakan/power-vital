import axios from 'axios';

/**
 * Fetch the admin's UI-string overrides and merge them into vue-i18n so any
 * on-screen text edited from the Translation Center takes effect without a
 * rebuild. Best-effort and non-blocking: if the request fails the storefront
 * simply keeps its bundled defaults.
 *
 * The overrides arrive as nested per-locale objects, e.g.
 *   { tr: { cart: { addToCart: '...' } }, ru: {...}, kg: {...} }
 * which is exactly the shape vue-i18n's deep `mergeLocaleMessage` expects.
 */
const UI_LOCALES = ['tr', 'ru', 'kg'] as const;

export async function applyUiOverrides(i18n: any): Promise<void> {
  try {
    const res = await axios.get('/api/v1/settings/ui-i18n', { timeout: 8000 });
    const overrides = res.data || {};
    for (const loc of UI_LOCALES) {
      const msg = overrides[loc];
      if (msg && typeof msg === 'object' && Object.keys(msg).length > 0) {
        i18n.global.mergeLocaleMessage(loc, msg);
      }
    }
  } catch {
    /* keep bundled defaults — overrides are a best-effort enhancement */
  }
}
