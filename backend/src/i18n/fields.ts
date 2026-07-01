import { LocaleCode, DEFAULT_LOCALE, LOCALES } from './locales';

// ────────────────────────────────────────────────────────────────────────────
// Translation field registry.
//
// Models whose records carry user-editable multilingual text declare their
// translatable fields here. TranslationCenter uses this metadata to:
//   • know which JSON path holds translated values per model
//   • know which top-level fields to feed to the AI translator
//   • know which fields are arrays of sub-objects that need per-item translation
// ────────────────────────────────────────────────────────────────────────────

export type ScalarField = string;
export type ArrayFieldItem = Record<string, unknown> & { key?: string };

export interface ModelFieldSchema {
  /** Prisma model name (used for stats + debug only) */
  model: string;
  /** Top-level scalar fields that can be translated */
  scalarFields: string[];
  /** JSON path (relative to the translations root) where arrays of sub-objects live, e.g. "accordions" */
  arrayFields?: ArrayFieldSchema[];
  /**
   * Field to sort list/export queries by (always descending — newest or
   * highest first). Defaults to 'updatedAt', which most models have, but
   * Category has no timestamp fields at all and HeroSlide only has
   * createdAt — sorting by a field the model doesn't have throws a Prisma
   * "Unknown argument" error, so those two must override this.
   */
  sortField?: string;
}

export interface ArrayFieldSchema {
  /** Name of the array (e.g. "accordions") inside translations[locale] */
  name: string;
  /**
   * How to identify each item across locales:
   *   - 'key'   — stable id (e.g. accordion.key = "storage")
   *   - 'index' — position in the array
   */
  matchBy: 'key' | 'index';
  /**
   * Item shape:
   *   - 'object' (default) — each item is `{ [subField]: string }` and we
   *     translate `fields` inside it
   *   - 'string'           — each item is a plain string; we translate it
   *     directly without wrapping in a subField
   */
  itemType?: 'object' | 'string';
  /** For 'object': sub-fields to translate. Ignored when itemType='string'. */
  fields?: string[];
}

export const TRANSLATABLE_MODELS: Record<string, ModelFieldSchema> = {
  Product: {
    model: 'Product',
    scalarFields: ['name', 'description'],
    arrayFields: [
      { name: 'accordions', matchBy: 'key', itemType: 'object', fields: ['title', 'content'] },
      // `benefits` is a JSON array of plain strings ("Faydaları" list).
      // Each item is just a string, so itemType='string' tells the
      // TranslationCenter to translate the value directly.
      { name: 'benefits', matchBy: 'index', itemType: 'string' }
    ]
  },
  Category: {
    model: 'Category',
    scalarFields: ['name'],
    sortField: 'sortOrder'
  },
  HeroSlide: {
    model: 'HeroSlide',
    scalarFields: ['title', 'subtitle', 'buttonText'],
    sortField: 'createdAt'
  },
  SiteSettings: {
    model: 'SiteSettings',
    scalarFields: ['companyName', 'address', 'topbarShippingMsg', 'copyrightText', 'campaignTitle', 'campaignCta'],
    // FAQ items (admin-managed) auto-translate into translations[locale].faqItems
    // (matched positionally). trustBadges / partners / footerLinks translations
    // are still managed as nested JSON written elsewhere.
    arrayFields: [
      { name: 'faqItems', matchBy: 'index', fields: ['q', 'a'] }
    ]
  },
  Page: {
    model: 'Page',
    scalarFields: ['title', 'content']
  },
  ProductReview: {
    model: 'ProductReview',
    scalarFields: ['text']
  },
  StoreReview: {
    model: 'StoreReview',
    scalarFields: ['text']
  }
};

/**
 * Walk a `translations[locale]` JSON object and return the percentage of
 * translatable fields that have a non-empty value (0..1).
 */
export const computeTranslationCoverage = (
  baseValues: Record<string, unknown>,
  translations: Record<string, unknown> | null | undefined
): number => {
  if (!translations || typeof translations !== 'object') return 0;
  const total = Object.keys(baseValues).length;
  if (total === 0) return 1;
  let filled = 0;
  for (const [k, v] of Object.entries(baseValues)) {
    if (v == null) continue;
    const str = typeof v === 'string' ? v : JSON.stringify(v);
    if (str && str.trim().length > 0) filled += str.length > 0 ? 1 : 0;
  }
  // Per-locale count: how many of the base fields exist & are non-empty in this locale
  let covered = 0;
  for (const [k, v] of Object.entries(baseValues)) {
    if (v == null) continue;
    const localeVal = translations?.[k];
    if (localeVal == null) continue;
    const str = typeof localeVal === 'string' ? localeVal : JSON.stringify(localeVal);
    if (str && str.trim().length > 0) covered++;
  }
  return covered / filled;
};

/**
 * Walk every locale entry under translations[locale] and return a flat key
 * set indicating which translation slots are currently populated.
 */
export const collectFilledKeys = (
  translations: any,
  schema: ModelFieldSchema
): { scalars: Set<string>; arrays: Map<string, Set<string>> } => {
  const scalars = new Set<string>();
  const arrays = new Map<string, Set<string>>();
  if (!translations || typeof translations !== 'object') return { scalars, arrays };
  for (const [localeKey, langTr] of Object.entries(translations)) {
    if (localeKey.startsWith('_')) continue; // skip reserved keys (e.g. _src fingerprints)
    if (!langTr || typeof langTr !== 'object') continue;
    const obj = langTr as Record<string, unknown>;
    for (const f of schema.scalarFields) {
      const v = obj[f];
      if (typeof v === 'string' && v.trim().length > 0) scalars.add(f);
    }
    for (const arr of schema.arrayFields || []) {
      const list = obj[arr.name];
      if (Array.isArray(list)) {
        let bucket = arrays.get(arr.name);
        if (!bucket) { bucket = new Set(); arrays.set(arr.name, bucket); }
        if (arr.itemType === 'string') {
          // For string arrays the index is the identity.
          list.forEach((_, i) => bucket!.add(String(i)));
        } else {
          for (const item of list) {
            const id = (item as any)?.[arr.matchBy];
            if (id != null) bucket.add(String(id));
          }
        }
      }
    }
  }
  return { scalars, arrays };
};

export const isLocale = (s: string): s is LocaleCode =>
  (LOCALES as string[]).includes(s);

/**
 * Per-locale variant of collectFilledKeys — returns a map keyed by
 * locale so the manual editor can tell RU apart from KG. The shared
 * `collectFilledKeys` above is a union across locales and is used
 * by the global coverage stat endpoint.
 */
export const getFilledSets = (
  translations: any,
  schema: ModelFieldSchema
): { scalars: Set<string>; arrays: Map<string, Set<string>> } => {
  // The original collectFilledKeys is a union, which is what /stats
  // needs (it asks "is this slot filled ANYWHERE?"). The manual
  // editor wants per-locale data, so the route handler in
  // adminI18n.ts reads parsed[loc] directly. This helper exists
  // for callers that want a per-row union of the same record.
  return collectFilledKeys(translations, schema);
};

/**
 * Lightweight helpers used by the manual admin i18n routes — these
 * are the inlined versions of what TranslationCenter does internally
 * so adminI18n.ts doesn't need to import the AI pipeline.
 */
export const parseTr = (raw: any): Record<string, any> => {
  if (!raw) return {};
  let map: any = raw;
  if (typeof map === 'string') {
    try { map = JSON.parse(map); } catch { return {}; }
  }
  if (!map || typeof map !== 'object') return {};
  for (const k of Object.keys(map)) {
    if (typeof map[k] === 'string') {
      try {
        const parsed = JSON.parse(map[k]);
        if (parsed && typeof parsed === 'object') map[k] = parsed;
      } catch { /* leave as-is */ }
    }
  }
  return map;
};

export const stringifyTr = (obj: Record<string, any>): string => JSON.stringify(obj);

export const extractBaseValues = (record: any, schema: ModelFieldSchema): Record<string, any> => {
  const base: Record<string, any> = {};
  for (const f of schema.scalarFields) base[f] = record[f];
  for (const arr of schema.arrayFields || []) {
    let raw = record[arr.name];
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch { raw = []; }
    }
    base[arr.name] = Array.isArray(raw) ? raw : [];
  }
  return base;
};

export { DEFAULT_LOCALE };