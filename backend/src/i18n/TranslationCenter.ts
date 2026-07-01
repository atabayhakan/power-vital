import { createHash } from 'crypto';
import prisma from '../lib/prisma';
import { AI_TARGET_LOCALES, DEFAULT_LOCALE, LocaleCode, isSupportedLocale, LOCALES } from './locales';
import { ModelFieldSchema, TRANSLATABLE_MODELS } from './fields';
import { translateContent } from '../services/aiTranslator';
import { logger } from '../utils/logger';

// ────────────────────────────────────────────────────────────────────────────
// Source-change detection
//
// Each record's `translations` JSON carries a reserved `_src` map holding a
// short fingerprint of the Turkish source text that produced the current
// translations, e.g. { _src: { name: "a1b2…", description: "c3d4…" } }.
//
// When the Turkish source is edited, its fingerprint changes and the affected
// field is re-translated for every target locale. When nothing changes, the
// fingerprint matches and NO AI call is made (zero cost). `_src` is never a
// locale, so locale readers (buildPlan, frontend) ignore it.
// ────────────────────────────────────────────────────────────────────────────
const SRC_KEY = '_src';
const srcHash = (s: string): string =>
  createHash('sha1').update(String(s ?? '').trim()).digest('hex').slice(0, 16);

/** Snapshot the fingerprints of every translatable source field on a record. */
const computeSourceSnapshot = (base: Record<string, any>, schema: ModelFieldSchema): Record<string, any> => {
  const snap: Record<string, any> = {};
  for (const f of schema.scalarFields) {
    const v = base[f];
    if (typeof v === 'string' && v.trim().length > 0) snap[f] = srcHash(v);
  }
  for (const arr of schema.arrayFields || []) {
    const list = Array.isArray(base[arr.name]) ? base[arr.name] : [];
    if (arr.itemType === 'string') {
      // For string arrays we just hash each entry directly
      snap[arr.name] = list
        .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
        .map((s: string) => srcHash(s));
    } else {
      snap[arr.name] = list.map((item: any) => {
        const o: Record<string, any> = {};
        if (arr.matchBy === 'key' && item?.key != null) o.key = item.key;
        for (const sub of (arr.fields || [])) {
          const bv = item?.[sub];
          if (typeof bv === 'string' && bv.trim().length > 0) o[sub] = srcHash(bv);
        }
        return o;
      });
    }
  }
  return snap;
};

// ────────────────────────────────────────────────────────────────────────────
// TranslationCenter
//
// Central service that:
//   1. Reads existing translations for a model record
//   2. Identifies missing scalar + array fields per target locale
//   3. Calls the AI translator to fill them in batch
//   4. Persists the result on the record's `translations` TEXT column
//
// Used by:
//   • Model PUT/POST routes → translateOnSave (best-effort, async fire-and-forget)
//   • Admin /admin/i18n/translate POST endpoint (synchronous, returns stats)
//   • /admin/i18n/stats endpoint (read-only)
// ────────────────────────────────────────────────────────────────────────────

interface TranslateResult {
  ok: boolean;
  filledScalars: Record<string, string[]>;
  filledArrays: Record<string, Record<string, Record<string, string>>>;
  skipped: string[];
  error?: string;
}

const parseTr = (raw: any): Record<string, any> => {
  if (!raw) return {};
  let map: any = raw;
  if (typeof map === 'string') {
    try { map = JSON.parse(map); } catch { return {}; }
  }
  if (!map || typeof map !== 'object') return {};
  // 🛡️ Legacy normalisation: older writes stored each per-locale value as a
  // stringified JSON object (translations.ru = '{"name":"..."}'). Parse those
  // back to objects so merges/lookups work and we re-persist the correct shape.
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

const stringifyTr = (obj: Record<string, any>): string => JSON.stringify(obj);

/**
 * Build the "what to translate" plan for a given record.
 */
const buildPlan = (
  base: Record<string, any>,
  existingTranslations: any,
  schema: ModelFieldSchema,
  targets: LocaleCode[]
): {
  scalars: { locale: LocaleCode; field: string; text: string }[];
  arrays: { locale: LocaleCode; field: string; key: string; fieldInItem: string; text: string }[];
} => {
  const plan: { scalars: { locale: LocaleCode; field: string; text: string }[]; arrays: { locale: LocaleCode; field: string; key: string; fieldInItem: string; text: string }[] } = { scalars: [], arrays: [] };
  const parsed = parseTr(existingTranslations);
  const srcMap = (parsed[SRC_KEY] && typeof parsed[SRC_KEY] === 'object') ? parsed[SRC_KEY] as Record<string, any> : {};

  for (const locale of targets) {
    if (!isSupportedLocale(locale)) continue;
    const langTr = (parsed?.[locale] || {}) as Record<string, any>;

    // Scalars — each target locale is evaluated independently so a value that
    // exists in one locale (e.g. RU) does NOT block filling the same field in
    // another locale (e.g. KG). This is what lets partial translations complete.
    for (const f of schema.scalarFields) {
      const v = base[f];
      if (typeof v !== 'string' || v.trim().length === 0) continue;
      const hasValue = typeof langTr[f] === 'string' && langTr[f].trim().length > 0;
      // sourceChanged is true only when a baseline fingerprint exists AND it no
      // longer matches the current Turkish text (i.e. the admin edited it).
      // Missing baseline (legacy data) → treated as unchanged to avoid re-billing.
      const sourceChanged = srcMap[f] !== undefined && srcMap[f] !== srcHash(v);
      // Translate if this locale lacks a value OR the source text was edited.
      if (hasValue && !sourceChanged) continue;
      plan.scalars.push({ locale, field: f, text: v });
    }

    // Arrays
    for (const arr of schema.arrayFields || []) {
      const baseList = Array.isArray(base[arr.name]) ? base[arr.name] : [];
      if (baseList.length === 0) continue;
      const localeArr = Array.isArray(langTr[arr.name]) ? langTr[arr.name] : [];
      const srcArr = Array.isArray(srcMap[arr.name]) ? srcMap[arr.name] : [];
      const isStringArray = arr.itemType === 'string';

      for (let idx = 0; idx < baseList.length; idx++) {
        const item = baseList[idx] as any;
        const id = arr.matchBy === 'key' ? item?.key : String(idx);
        if (id == null) continue;
        const localeItem = localeArr.find((x: any) =>
          arr.matchBy === 'key' ? x?.key === id : String(localeArr.indexOf(x)) === String(idx)
        );
        const srcItem = arr.matchBy === 'key'
          ? srcArr.find((x: any) => x?.key === id)
          : srcArr[idx];

        if (isStringArray) {
          // Item is a plain string — translate it directly. localeItem is
          // also expected to be a string (not an object).
          const baseVal = item;
          if (typeof baseVal !== 'string' || baseVal.trim().length === 0) continue;
          const hasValue = typeof localeItem === 'string' && localeItem.trim().length > 0;
          const sourceChanged = typeof srcItem === 'string' && srcItem !== srcHash(baseVal);
          if (hasValue && !sourceChanged) continue;
          plan.arrays.push({ locale, field: arr.name, key: String(id), fieldInItem: 'value', text: baseVal });
        } else {
          // Item is { [subField]: string }
          for (const subField of (arr.fields || [])) {
            const baseVal = item?.[subField];
            if (typeof baseVal !== 'string' || baseVal.trim().length === 0) continue;
            const hasValue = localeItem && typeof localeItem[subField] === 'string' && localeItem[subField].trim().length > 0;
            const sourceChanged = srcItem?.[subField] !== undefined && srcItem[subField] !== srcHash(baseVal);
            if (hasValue && !sourceChanged) continue;
            plan.arrays.push({ locale, field: arr.name, key: String(id), fieldInItem: subField, text: baseVal });
          }
        }
      }
    }
  }

  return plan;
};

/**
 * Translate the planned items in batches (one call per unique source text,
 * reused across locales).
 */
const executePlan = async (plan: ReturnType<typeof buildPlan>): Promise<{
  scalarsFilled: Record<string, string[]>;
  arraysFilled: Record<string, Record<string, Record<string, string>>>;
}> => {
  const scalarsFilled: Record<string, string[]> = {};
  const arraysFilled: Record<string, Record<string, Record<string, string>>> = {};

  // Gather unique source texts and the locales they need
  const uniqueTexts = new Map<string, LocaleCode[]>();
  const push = (text: string, locale: LocaleCode) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    let list = uniqueTexts.get(trimmed);
    if (!list) { list = []; uniqueTexts.set(trimmed, list); }
    if (!list.includes(locale)) list.push(locale);
  };
  for (const s of plan.scalars) push(s.text, s.locale);
  for (const a of plan.arrays) push(a.text, a.locale);

  // Cache results so identical text isn't sent twice
  const cache = new Map<string, Record<string, string>>();

  for (const [text, locales] of uniqueTexts.entries()) {
    try {
      const out = await translateContent(text, locales);
      cache.set(text, out || {});
    } catch (e: any) {
      console.warn('[TranslationCenter] batch failed:', e?.message || e);
      cache.set(text, {});
    }
  }

  // Apply cached results
  for (const s of plan.scalars) {
    const v = cache.get(s.text.trim())?.[s.locale];
    if (v && v.trim().length > 0) {
      (scalarsFilled[s.locale] ||= []).push(s.field); // mark field as filled
    }
  }
  for (const a of plan.arrays) {
    const v = cache.get(a.text.trim())?.[a.locale];
    if (!v || v.trim().length === 0) continue;
    if (!arraysFilled[a.locale]) arraysFilled[a.locale] = {} as any;
    const byLocale: any = arraysFilled[a.locale];
    if (!byLocale[a.field]) byLocale[a.field] = {} as any;
    const byField: any = byLocale[a.field];
    if (!byField[a.key]) byField[a.key] = {} as any;
    const byKey: any = byField[a.key];
    byKey[a.fieldInItem] = v;
  }

  return { scalarsFilled, arraysFilled };
};

/**
 * Merge AI results into the existing translations object (preserving manually
 * edited entries) and return the new JSON string + which slots got filled.
 */
const mergeResults = (
  base: Record<string, any>,
  existingRaw: any,
  schema: ModelFieldSchema,
  scalarsFilled: Record<string, string[]>,
  arraysFilled: Record<string, Record<string, Record<string, string>>>
): Record<string, any> => {
  const merged = parseTr(existingRaw);

  for (const [locale, fields] of Object.entries(scalarsFilled)) {
    merged[locale] ||= {};
    for (const f of fields) {
      // We don't have the translated text here; re-derive via buildPlan/executePlan
      // pair: easier is to pass through full result objects. Re-running is wasteful,
      // so we instead change signature: caller passes the full translation outputs.
    }
  }
  return merged;
};

/**
 * Apply plan results to the translations object and persist.
 */
const persistTranslations = async (
  prismaModel: any,
  recordId: string,
  base: Record<string, any>,
  existingRaw: any,
  schema: ModelFieldSchema,
  plan: ReturnType<typeof buildPlan>,
  cache: Map<string, Record<string, string>>,
  targets: LocaleCode[]
): Promise<{ updated: Record<string, any>; filled: TranslateResult }> => {
  const merged = parseTr(existingRaw);
  const filled: TranslateResult = { ok: true, filledScalars: {}, filledArrays: {}, skipped: [] };

  for (const s of plan.scalars) {
    const v = cache.get(s.text.trim())?.[s.locale];
    // Skip empty results AND source-text echoes (the AI translator falls back
    // to returning the source text on a total failure). Leaving the slot empty
    // lets the continuous sweeper retry later instead of poisoning the record
    // with untranslated Turkish text.
    if (!v || v.trim().length === 0 || v.trim() === s.text.trim()) { filled.skipped.push(`${s.locale}.${s.field}`); continue; }
    merged[s.locale] ||= {};
    merged[s.locale][s.field] = v;
    (filled.filledScalars[s.locale] ||= []).push(s.field);
  }

  for (const a of plan.arrays) {
    const v = cache.get(a.text.trim())?.[a.locale];
    if (!v || v.trim().length === 0 || v.trim() === a.text.trim()) { filled.skipped.push(`${s_locale(a)}.${a.field}[${a.key}].${a.fieldInItem}`); continue; }
    merged[a.locale] ||= {};
    merged[a.locale][a.field] ||= [];
    const localeArr: any[] = merged[a.locale][a.field];
    const idx = Number(a.key);
    const isStringArray = a.fieldInItem === 'value';
    if (isStringArray) {
      // Plain string array (e.g. benefits): write by index, padding gaps so the
      // translated value always lands at the SAME position as its source. Using
      // push() would shift indices when a middle item is skipped (e.g. a failed
      // translation), mapping benefits[2]'s text onto benefits[1].
      if (Number.isFinite(idx)) {
        while (localeArr.length <= idx) localeArr.push('');
        localeArr[idx] = v;
      } else {
        localeArr.push(v);
      }
    } else {
      let item = localeArr.find((x: any) =>
        a.key === 'index' ? String(localeArr.indexOf(x)) === a.key : x?.key === a.key
      );
      if (!item) {
        item = a.key === 'index' ? {} : { key: a.key };
        localeArr.push(item);
      }
      item[a.fieldInItem] = v;
    }
    if (!filled.filledArrays[a.locale]) filled.filledArrays[a.locale] = {} as any;
    const byLocale: any = filled.filledArrays[a.locale];
    if (!byLocale[a.field]) byLocale[a.field] = {} as any;
    const byField: any = byLocale[a.field];
    if (!byField[a.key]) byField[a.key] = {} as any;
    const byKey: any = byField[a.key];
    byKey[a.fieldInItem] = v;
  }

  // Advance the source fingerprint ONLY for fields whose EVERY target locale was
  // (re)written this round. A field where a locale failed (e.g. quota) keeps its
  // previous fingerprint, so the next sweep retries instead of locking in a stale
  // translation. Untouched, already-complete fields keep their existing value.
  const newSrc: Record<string, any> = (merged[SRC_KEY] && typeof merged[SRC_KEY] === 'object') ? { ...merged[SRC_KEY] } : {};
  for (const f of schema.scalarFields) {
    const v = base[f];
    if (typeof v !== 'string' || v.trim().length === 0) continue;
    if (targets.every(loc => (filled.filledScalars[loc] || []).includes(f))) newSrc[f] = srcHash(v);
  }
  for (const arr of schema.arrayFields || []) {
    const list = Array.isArray(base[arr.name]) ? base[arr.name] : [];
    const oldArr = Array.isArray(newSrc[arr.name]) ? newSrc[arr.name] : [];
    newSrc[arr.name] = list.map((item: any, idx: number) => {
      const id = arr.matchBy === 'key' ? item?.key : String(idx);
      const prev = arr.matchBy === 'key' ? (oldArr.find((x: any) => x?.key === id) || {}) : (oldArr[idx] || {});
      const o: Record<string, any> = { ...prev };
      if (arr.matchBy === 'key' && item?.key != null) o.key = item.key;
      for (const sub of (arr.fields || [])) {
        const bv = item?.[sub];
        if (typeof bv !== 'string' || bv.trim().length === 0) continue;
        if (targets.every(loc => !!(filled.filledArrays as any)[loc]?.[arr.name]?.[String(id)]?.[sub])) o[sub] = srcHash(bv);
      }
      return o;
    });
  }
  merged[SRC_KEY] = newSrc;

  await prismaModel.update({
    where: { id: recordId },
    data: { translations: stringifyTr(merged) }
  });

  return { updated: merged, filled };
};

const s_locale = (a: any) => a.locale;

/**
 * Public: translate missing fields for a record. Returns what was filled.
 */
export const translateRecord = async (
  modelName: keyof typeof TRANSLATABLE_MODELS,
  recordId: string,
  options?: { targets?: LocaleCode[]; sourceLocale?: LocaleCode }
): Promise<TranslateResult> => {
  const schema = TRANSLATABLE_MODELS[modelName];
  if (!schema) return { ok: false, filledScalars: {}, filledArrays: {}, skipped: [], error: 'Unknown model' };

  const targets = (options?.targets || AI_TARGET_LOCALES).filter(isSupportedLocale);
  if (targets.length === 0) return { ok: true, filledScalars: {}, filledArrays: {}, skipped: [] };

  // Pull the Prisma delegate from the singleton
  const prismaAny: any = prisma;
  const delegate = prismaAny[lowerFirst(modelName)];
  if (!delegate) return { ok: false, filledScalars: {}, filledArrays: {}, skipped: [], error: 'Prisma model not found' };

  const record = await delegate.findUnique({ where: { id: recordId } });
  if (!record) return { ok: false, filledScalars: {}, filledArrays: {}, skipped: [], error: 'Record not found' };

  const base = extractBaseValues(record, schema);
  const plan = buildPlan(base, record.translations, schema, targets);
  if (plan.scalars.length === 0 && plan.arrays.length === 0) {
    // Nothing to translate (already complete / unchanged) — make sure the source
    // fingerprint baseline exists so future Turkish edits are detected. No AI cost.
    await ensureSourceSnapshot(delegate, recordId, base, record.translations, schema);
    return { ok: true, filledScalars: {}, filledArrays: {}, skipped: [] };
  }

  // Build cache
  const uniqueTexts = new Map<string, LocaleCode[]>();
  for (const s of plan.scalars) {
    const t = s.text.trim();
    if (!t) continue;
    if (!uniqueTexts.has(t)) uniqueTexts.set(t, []);
    if (!uniqueTexts.get(t)!.includes(s.locale)) uniqueTexts.get(t)!.push(s.locale);
  }
  for (const a of plan.arrays) {
    const t = a.text.trim();
    if (!t) continue;
    if (!uniqueTexts.has(t)) uniqueTexts.set(t, []);
    if (!uniqueTexts.get(t)!.includes(a.locale)) uniqueTexts.get(t)!.push(a.locale);
  }
  const cache = new Map<string, Record<string, string>>();
  for (const [text, locales] of uniqueTexts.entries()) {
    try {
      const out = await translateContent(text, locales);
      cache.set(text, out || {});
    } catch (e: any) {
      console.warn('[TranslationCenter] translate failed for "' + text.slice(0, 30) + '...":', e?.message);
      cache.set(text, {});
    }
  }

  const { updated, filled } = await persistTranslations(delegate, recordId, base, record.translations, schema, plan, cache, targets);
  return filled;
};

/**
 * Write the source-text fingerprint baseline for a record that needs no AI work
 * (already fully translated / unchanged). Idempotent: skips the DB write when the
 * stored snapshot already matches. Costs nothing in API terms.
 */
const ensureSourceSnapshot = async (
  delegate: any,
  recordId: string,
  base: Record<string, any>,
  existingRaw: any,
  schema: ModelFieldSchema
): Promise<void> => {
  const parsed = parseTr(existingRaw);
  const desired = computeSourceSnapshot(base, schema);
  if (JSON.stringify(parsed[SRC_KEY] ?? null) === JSON.stringify(desired)) return; // already current
  parsed[SRC_KEY] = desired;
  try {
    await delegate.update({ where: { id: recordId }, data: { translations: stringifyTr(parsed) } });
  } catch (e: any) {
    console.warn('[TranslationCenter] source-snapshot backfill failed:', e?.message || e);
  }
};

/**
 * Fire-and-forget variant — no-op since we moved to manual translation.
 * Kept as a stub so existing route files (product.ts, category.ts, pages.ts,
 * slider.ts, storeReviews.ts, reviews.ts, settings.ts) still import it
 * without breakage. Manual saves go through PATCH /admin/i18n/record.
 */
export const translateOnSave = (
  _modelName: keyof typeof TRANSLATABLE_MODELS,
  _recordId: string,
  _options?: { targets?: LocaleCode[] }
): void => {
  // Intentionally empty. The admin owns translations now.
};

/**
 * Continuous-sweep helper — kept for the manual "auto-fill from TR"
 * button in the admin UI. Walks up to `limit` records and copies TR
 * text into the requested target locales for every empty slot. The
 * admin then refines each cell. This is a first-draft helper, not
 * a real translation.
 */
export const sweepModel = async (
  modelName: keyof typeof TRANSLATABLE_MODELS,
  limit: number,
  targets: LocaleCode[] = AI_TARGET_LOCALES
): Promise<number> => {
  const schema = TRANSLATABLE_MODELS[modelName];
  if (!schema) return 0;
  const tg = targets.filter(isSupportedLocale);
  if (tg.length === 0) return 0;

  const prismaAny: any = prisma;
  const delegate = prismaAny[lowerFirst(String(modelName))];
  if (!delegate) return 0;

  const select: any = { id: true, translations: true };
  for (const f of schema.scalarFields) select[f] = true;
  for (const arr of schema.arrayFields || []) select[arr.name] = true;

  const rows = await delegate.findMany({ select, take: limit, orderBy: { [schema.sortField || 'updatedAt']: 'desc' } });
  let filled = 0;
  for (const row of rows) {
    const base = ((): Record<string, any> => {
      const o: Record<string, any> = {};
      for (const f of schema.scalarFields) o[f] = row[f];
      for (const arr of schema.arrayFields || []) {
        let raw = row[arr.name];
        if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { raw = []; } }
        o[arr.name] = Array.isArray(raw) ? raw : [];
      }
      return o;
    })();
    const parsed = ((): Record<string, any> => {
      const out: Record<string, any> = {};
      const raw = row.translations;
      if (!raw) return out;
      let map: any = raw;
      if (typeof map === 'string') { try { map = JSON.parse(map); } catch { return out; } }
      if (!map || typeof map !== 'object') return out;
      for (const k of Object.keys(map)) {
        if (typeof map[k] === 'string') {
          try { const p = JSON.parse(map[k]); if (p && typeof p === 'object') { map[k] = p; continue; } } catch { /* */ }
        }
        out[k] = map[k];
      }
      return out;
    })();
    let did = false;
    for (const loc of tg) {
      parsed[loc] = parsed[loc] || {};
      for (const f of schema.scalarFields) {
        const tr = base[f];
        if (typeof tr !== 'string' || tr.trim().length === 0) continue;
        if (typeof parsed[loc][f] === 'string' && (parsed[loc][f] as string).trim().length > 0) continue;
        parsed[loc][f] = tr;
        did = true;
      }
      for (const arr of schema.arrayFields || []) {
        const baseList: any[] = Array.isArray(base[arr.name]) ? base[arr.name] : [];
        if (baseList.length === 0) continue;
        const list: any[] = Array.isArray(parsed[loc][arr.name]) ? parsed[loc][arr.name] : [];
        if (arr.itemType === 'string') {
          for (let i = 0; i < baseList.length; i++) {
            const tr = baseList[i];
            if (typeof tr !== 'string' || tr.trim().length === 0) continue;
            if (typeof list[i] === 'string' && (list[i] as string).trim().length > 0) continue;
            while (list.length <= i) list.push('');
            list[i] = tr;
            did = true;
          }
        } else {
          for (let i = 0; i < baseList.length; i++) {
            const tr = baseList[i];
            const idKey = arr.matchBy === 'key' ? tr?.key : String(i);
            let item = arr.matchBy === 'key' ? list.find((x: any) => x?.key === idKey) : list[i];
            if (!item) {
              item = arr.matchBy === 'key' ? { key: idKey } : {};
              if (arr.matchBy === 'key') list.push(item); else list[i] = item;
            }
            for (const sub of (arr.fields || [])) {
              if (typeof tr?.[sub] !== 'string' || tr[sub].trim().length === 0) continue;
              if (typeof item[sub] === 'string' && (item[sub] as string).trim().length > 0) continue;
              item[sub] = tr[sub];
              did = true;
            }
          }
        }
        parsed[loc][arr.name] = list;
      }
    }
    if (did) {
      await delegate.update({ where: { id: row.id }, data: { translations: JSON.stringify(parsed) } });
      filled++;
    }
  }
  return filled;
};

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * Extract base field values from a Prisma row according to schema metadata.
 */
const extractBaseValues = (record: any, schema: ModelFieldSchema): Record<string, any> => {
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

/**
 * Stats: per-model per-locale coverage for the admin dashboard.
 */
export const getCoverageStats = async () => {
  const out: any[] = [];
  for (const [modelName, schema] of Object.entries(TRANSLATABLE_MODELS)) {
    const prismaAny: any = prisma;
    const delegate = prismaAny[lowerFirst(modelName)];
    if (!delegate) continue;
    const total = await delegate.count();
    const sample = await delegate.findMany({
      take: 500, // cap for performance
      select: { id: true, translations: true, ...Object.fromEntries(schema.scalarFields.map(f => [f, true])), ...Object.fromEntries((schema.arrayFields || []).map(a => [a.name, true])) }
    });
    let totalSlots = 0;
    let filledSlots = 0;
    for (const r of sample) {
      const base = extractBaseValues(r, schema);
      const parsed = parseTr(r.translations);
      for (const locale of AI_TARGET_LOCALES) {
        const langTr = parsed?.[locale] || {};
        for (const f of schema.scalarFields) {
          if (typeof base[f] !== 'string' || base[f].trim().length === 0) continue;
          totalSlots++;
          if (typeof langTr[f] === 'string' && langTr[f].trim().length > 0) filledSlots++;
        }
        for (const arr of schema.arrayFields || []) {
          const baseList = Array.isArray(base[arr.name]) ? base[arr.name] : [];
          const localeArr = Array.isArray(langTr[arr.name]) ? langTr[arr.name] : [];
          if (arr.itemType === 'string') {
            for (let i = 0; i < baseList.length; i++) {
              if (typeof baseList[i] !== 'string' || baseList[i].trim().length === 0) continue;
              totalSlots++;
              const filled = typeof localeArr[i] === 'string' && localeArr[i].trim().length > 0;
              if (filled) filledSlots++;
            }
          } else {
            for (let i = 0; i < baseList.length; i++) {
              for (const sub of (arr.fields || [])) {
                if (typeof baseList[i]?.[sub] !== 'string' || baseList[i][sub].trim().length === 0) continue;
                totalSlots++;
                const id = arr.matchBy === 'key' ? baseList[i].key : String(i);
                const localeItem = localeArr.find((x: any) =>
                  arr.matchBy === 'key' ? x?.key === id : String(localeArr.indexOf(x)) === String(i)
                );
                if (localeItem && typeof localeItem[sub] === 'string' && localeItem[sub].trim().length > 0) filledSlots++;
              }
            }
          }
        }
      }
    }
    const coverage = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 100;
    out.push({
      model: modelName,
      totalRecords: total,
      sampledRecords: sample.length,
      coveragePct: coverage,
      totalSlots,
      filledSlots
    });
  }
  return out;
};
export const TRANSLATABLE_MODEL_NAMES = Object.keys(TRANSLATABLE_MODELS) as (keyof typeof TRANSLATABLE_MODELS)[];

export { LOCALES, DEFAULT_LOCALE };
export type { LocaleCode };