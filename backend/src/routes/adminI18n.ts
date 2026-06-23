import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { getCoverageStats } from '../i18n/TranslationCenter';
import { LOCALES, isSupportedLocale, LocaleCode } from '../i18n/locales';
import { TRANSLATABLE_MODELS, ModelFieldSchema, extractBaseValues, parseTr, stringifyTr, getFilledSets } from '../i18n/fields';
import { validate, I18nRecordUpdateSchema, I18nImportSchema } from '../validators';
import { logger } from '../utils/logger';

const router = Router();

// All admin i18n endpoints require admin role
router.use(authenticateJWT, requireRole('admin'));

// ────────────────────────────────────────────────────────────────────────────
// Manual Translation Center (AI-free)
//
// We no longer call Gemini / any AI service. The admin types translations
// into the UI and we just persist them into the existing `translations`
// TEXT column on every translatable model. Old Gemini-produced values
// remain in the column untouched — admins can keep, edit, or clear them.
//
// Endpoints
//   GET    /stats                  — coverage per model per locale
//   GET    /records                — paginated list of records (with coverage)
//   GET    /record/:model/:id      — full record incl. TR + translations
//   PATCH  /record/:model/:id      — write a single field value
//   POST   /record/:model/:id/copy-from-tr — copy TR → other locales (admin refines)
//   GET    /export/:model.csv      — download a CSV for offline translation
//   POST   /import/:model          — upload a CSV back in
// ────────────────────────────────────────────────────────────────────────────

// GET /api/v1/admin/i18n/stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getCoverageStats();
    res.json({ locales: LOCALES, stats });
  } catch (e: any) {
    logger.error({ err: e }, 'i18n stats error:');
    res.status(500).json({ error: e?.message || 'Failed to compute stats' });
  }
});

// GET /api/v1/admin/i18n/records?model=Product&onlyMissing=1&search=reishi&page=1&pageSize=20
// Returns a paged summary for the manual editor grid. Each item carries
// the source text (TR fields), the coverage % across the target locales,
// and a flag whether any target locale is missing.
router.get('/records', async (req: Request, res: Response) => {
  try {
    const modelName = String(req.query.model || '');
    const onlyMissing = String(req.query.onlyMissing || '') === '1';
    const search = String(req.query.search || '').trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(5, Number(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const schema: ModelFieldSchema | undefined = (TRANSLATABLE_MODELS as any)[modelName];
    if (!schema) return res.status(400).json({ error: 'Unknown model' });

    const prismaAny: any = prisma;
    const delegate = prismaAny[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
    if (!delegate) return res.status(400).json({ error: 'Prisma model not found' });

    // For a lightweight list we only need the id + first scalar + a
    // trimmed translations object. The full text is loaded on /record/:id
    // when the admin opens a row.
    const firstScalar = schema.scalarFields[0];
    const select: any = { id: true, translations: true };
    if (firstScalar) select[firstScalar] = true;
    for (const arr of schema.arrayFields || []) select[arr.name] = true;

    // We need every scalar + every array to compute coverage.
    for (const f of schema.scalarFields) select[f] = true;

    const [rows, total] = await Promise.all([
      delegate.findMany({ select, take: pageSize, skip, orderBy: { updatedAt: 'desc' } }),
      delegate.count()
    ]);

    const targetLocales = LOCALES.filter((l) => l !== 'tr');

    const items = rows.map((r: any) => {
      const base = extractBaseValues(r, schema);
      const parsed = parseTr(r.translations);
      const { scalars, arrays } = getFilledSets(parsed, schema);

      let totalSlots = 0;
      let filledSlots = 0;
      let hasMissing = false;
      for (const loc of targetLocales) {
        // scalars
        for (const f of schema.scalarFields) {
          const v = base[f];
          if (typeof v !== 'string' || v.trim().length === 0) continue;
          totalSlots++;
          if (scalars.has(f)) filledSlots++;
          else hasMissing = true;
        }
        // arrays
        for (const arr of schema.arrayFields || []) {
          const baseList: any[] = Array.isArray(base[arr.name]) ? base[arr.name] : [];
          const filledArr = arrays.get(arr.name) || new Set<string>();
          if (arr.itemType === 'string') {
            for (let i = 0; i < baseList.length; i++) {
              const bv = baseList[i];
              if (typeof bv !== 'string' || bv.trim().length === 0) continue;
              totalSlots++;
              if (filledArr.has(String(i))) filledSlots++;
              else hasMissing = true;
            }
          } else {
            for (let i = 0; i < baseList.length; i++) {
              for (const sub of (arr.fields || [])) {
                if (typeof baseList[i]?.[sub] !== 'string' || baseList[i][sub].trim().length === 0) continue;
                totalSlots++;
                const id = arr.matchBy === 'key' ? baseList[i].key : String(i);
                if (filledArr.has(`${id}.${sub}`)) filledSlots++;
                else hasMissing = true;
              }
            }
          }
        }
      }

      const coverage = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 100;

      // Per-locale coverage object for the row header pills
      const perLocale: Record<string, number> = {};
      for (const loc of targetLocales) {
        let totalLoc = 0;
        let filledLoc = 0;
        for (const f of schema.scalarFields) {
          const v = base[f];
          if (typeof v !== 'string' || v.trim().length === 0) continue;
          totalLoc++;
          if (typeof parsed?.[loc]?.[f] === 'string' && (parsed[loc][f] as string).trim().length > 0) filledLoc++;
        }
        for (const arr of schema.arrayFields || []) {
          const baseList: any[] = Array.isArray(base[arr.name]) ? base[arr.name] : [];
          const locArr: any[] = Array.isArray(parsed?.[loc]?.[arr.name]) ? parsed[loc][arr.name] : [];
          if (arr.itemType === 'string') {
            for (let i = 0; i < baseList.length; i++) {
              if (typeof baseList[i] !== 'string' || baseList[i].trim().length === 0) continue;
              totalLoc++;
              if (typeof locArr[i] === 'string' && (locArr[i] as string).trim().length > 0) filledLoc++;
            }
          } else {
            for (let i = 0; i < baseList.length; i++) {
              for (const sub of (arr.fields || [])) {
                if (typeof baseList[i]?.[sub] !== 'string' || baseList[i][sub].trim().length === 0) continue;
                totalLoc++;
                const id = arr.matchBy === 'key' ? baseList[i].key : String(i);
                const locItem = locArr.find((x: any) => arr.matchBy === 'key' ? x?.key === id : String(locArr.indexOf(x)) === String(i));
                if (locItem && typeof locItem[sub] === 'string' && (locItem[sub] as string).trim().length > 0) filledLoc++;
              }
            }
          }
        }
        perLocale[loc] = totalLoc > 0 ? Math.round((filledLoc / totalLoc) * 100) : 100;
      }

      // Search by TR text (and RU/KG as a bonus)
      let matchesSearch = true;
      if (search) {
        const q = search.toLowerCase();
        const blob = [
          ...schema.scalarFields.map((f) => base[f]).filter((x) => typeof x === 'string'),
          ...targetLocales.flatMap((loc) => schema.scalarFields.map((f) => parsed?.[loc]?.[f]).filter((x) => typeof x === 'string'))
        ].join(' ').toLowerCase();
        matchesSearch = blob.includes(q);
      }

      // TR source preview for the row header (uses the first scalar as title)
      const title = firstScalar ? (base[firstScalar] || '(başlıksız)') : r.id;

      return {
        id: r.id,
        title,
        coveragePct: coverage,
        perLocale,
        hasMissing,
        updatedAt: r.updatedAt,
        matchesSearch
      };
    })
    .filter((it: any) => (!onlyMissing || it.hasMissing) && it.matchesSearch);

    res.json({ total, page, pageSize, items });
  } catch (e: any) {
    logger.error({ err: e }, 'i18n records list error:');
    res.status(500).json({ error: e?.message || 'Failed to list records' });
  }
});

// GET /api/v1/admin/i18n/records-batch?model=Product&ids=id1,id2,...
// Lightweight batch read — returns { id → { tr, ru, kg, en, trHash } }
// covering ALL scalar fields of the model. Used by the inline editor
// grid which otherwise has to fire N parallel GETs to populate the
// table. We limit to 200 ids per call to keep the response bounded.
//
// 🛡️ `trHash`: SHA-1 (first 16 chars) of the current TR source text,
// per scalar field. The frontend compares it against the previous
// hash to detect "TR source was edited since the last translation"
// and show a "TR Güncellendi — gözden geçir" badge so the admin
// doesn't ship a stale translation.
router.get('/records-batch', async (req: Request, res: Response) => {
  try {
    const modelName = String(req.query.model || '');
    const idsParam = String(req.query.ids || '');
    if (!idsParam) return res.json({ items: {} });
    const ids = idsParam.split(',').filter((s) => s.length > 0).slice(0, 200);
    if (ids.length === 0) return res.json({ items: {} });
    const schema: ModelFieldSchema | undefined = (TRANSLATABLE_MODELS as any)[modelName];
    if (!schema) return res.status(400).json({ error: 'Unknown model' });
    const prismaAny: any = prisma;
    const delegate = prismaAny[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
    if (!delegate) return res.status(400).json({ error: 'Prisma model not found' });

    const select: any = { id: true, translations: true };
    for (const f of schema.scalarFields) select[f] = true;
    const rows = await delegate.findMany({ where: { id: { in: ids } }, select });

    const { createHash } = await import('crypto');
    const hash = (s: string) => createHash('sha1').update(String(s ?? '').trim()).digest('hex').slice(0, 16);

    const out: Record<string, {
      fields: Record<string, { tr: string; ru: string; kg: string; en: string; trHash: string; srcHash?: string; changed: boolean }>
    }> = {};
    for (const r of rows) {
      const parsed = parseTr(r.translations);
      const src = (parsed?._src && typeof parsed._src === 'object') ? parsed._src as Record<string, string> : {};
      const fields: any = {};
      for (const f of schema.scalarFields) {
        const trVal = (r[f] as string) || '';
        const trHash = hash(trVal);
        const prevHash = src[f];
        // `changed` = admin previously recorded a hash AND it no
        // longer matches the current TR. A missing hash (legacy
        // data, never translated) is NOT "changed" — the translation
        // never existed so the admin isn't being asked to review.
        const changed = typeof prevHash === 'string' && prevHash !== trHash;
        fields[f] = {
          tr: trVal,
          ru: (parsed?.ru?.[f] as string) || '',
          kg: (parsed?.kg?.[f] as string) || '',
          en: (parsed?.en?.[f] as string) || '',
          trHash,
          srcHash: prevHash,
          changed
        };
      }
      out[r.id] = { fields };
    }
    res.json({ items: out });
  } catch (e: any) {
    logger.error({ err: e }, 'i18n records-batch error:');
    res.status(500).json({ error: e?.message || 'Failed to load batch' });
  }
});

// GET /api/v1/admin/i18n/record/:model/:id
// Returns the full record payload the inline editor needs: TR scalars,
// all target-locale scalar values, and the array fields with per-item
// (TR + target) values.
router.get('/record/:model/:id', async (req: Request, res: Response) => {
  try {
    const modelName = String(req.params.model);
    const id = String(req.params.id);
    const schema: ModelFieldSchema | undefined = (TRANSLATABLE_MODELS as any)[modelName];
    if (!schema) return res.status(400).json({ error: 'Unknown model' });
    const prismaAny: any = prisma;
    const delegate = prismaAny[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
    if (!delegate) return res.status(400).json({ error: 'Prisma model not found' });
    const record = await delegate.findUnique({ where: { id } });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    const base = extractBaseValues(record, schema);
    const parsed = parseTr(record.translations);
    const targetLocales = LOCALES.filter((l) => l !== 'tr');
    res.json({
      id: record.id,
      updatedAt: record.updatedAt,
      scalars: {
        tr: Object.fromEntries(schema.scalarFields.map((f) => [f, base[f] || ''])),
        ...Object.fromEntries(targetLocales.map((loc) => [loc, Object.fromEntries(schema.scalarFields.map((f) => [f, (parsed?.[loc]?.[f] as string) || '']))]))
      },
      arrays: (schema.arrayFields || []).map((arr) => {
        const baseList: any[] = Array.isArray(base[arr.name]) ? base[arr.name] : [];
        return {
          name: arr.name,
          itemType: arr.itemType,
          matchBy: arr.matchBy,
          fields: arr.fields || [],
          items: baseList.map((item: any, idx: number) => {
            const idKey = arr.matchBy === 'key' ? item?.key : String(idx);
            return {
              key: idKey,
              index: idx,
              tr: arr.itemType === 'string' ? (item || '') : Object.fromEntries((arr.fields || []).map((f) => [f, item?.[f] || ''])),
              locales: Object.fromEntries(targetLocales.map((loc) => {
                const locArr: any[] = Array.isArray(parsed?.[loc]?.[arr.name]) ? parsed[loc][arr.name] : [];
                const locItem = arr.matchBy === 'key'
                  ? locArr.find((x: any) => x?.key === idKey)
                  : locArr[idx];
                if (arr.itemType === 'string') {
                  return [loc, locItem || ''];
                }
                return [loc, Object.fromEntries((arr.fields || []).map((f) => [f, (locItem && locItem[f]) || '']))];
              }))
            };
          })
        };
      })
    });
  } catch (e: any) {
    logger.error({ err: e }, 'i18n record fetch error:');
    res.status(500).json({ error: e?.message || 'Failed to fetch record' });
  }
});

// PATCH /api/v1/admin/i18n/record/:model/:id
// Persists a single field value written by the admin. The body shape
// (see I18nRecordUpdateSchema) tells us whether it's a scalar, a
// keyed array item, or an indexed array item.
router.patch('/record/:model/:id', validate({ body: I18nRecordUpdateSchema }), async (req: Request, res: Response) => {
  try {
    const modelName = String(req.params.model);
    const id = String(req.params.id);
    const schema: ModelFieldSchema | undefined = (TRANSLATABLE_MODELS as any)[modelName];
    if (!schema) return res.status(400).json({ error: 'Unknown model' });
    const prismaAny: any = prisma;
    const delegate = prismaAny[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
    if (!delegate) return res.status(400).json({ error: 'Prisma model not found' });

    const record = await delegate.findUnique({ where: { id } });
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const locale = (req.body as any).locale as LocaleCode;
    if (!isSupportedLocale(locale)) return res.status(400).json({ error: 'Unsupported locale' });
    if (locale === 'tr') return res.status(400).json({ error: 'Turkish is the source locale — edit the base field instead' });

    const parsed = parseTr(record.translations);
    parsed[locale] = parsed[locale] || {};

    const body = req.body as any;
    if (body.field) {
      // Scalar
      if (!schema.scalarFields.includes(body.field)) return res.status(400).json({ error: 'Unknown scalar field' });
      if (body.value == null || body.value === '') {
        delete parsed[locale][body.field];
      } else {
        parsed[locale][body.field] = String(body.value);
      }
    } else if (body.arrayField && body.key != null && body.subField) {
      // Keyed array item (e.g. accordions[storage].title)
      const arrSchema = (schema.arrayFields || []).find((a) => a.name === body.arrayField);
      if (!arrSchema) return res.status(400).json({ error: 'Unknown array field' });
      if (!arrSchema.fields || !arrSchema.fields.includes(body.subField)) return res.status(400).json({ error: 'Unknown sub-field' });
      const list: any[] = Array.isArray(parsed[locale][arrSchema.name]) ? parsed[locale][arrSchema.name] : [];
      let item = list.find((x: any) => x?.key === body.key);
      if (body.value == null || body.value === '') {
        if (item) {
          delete item[body.subField];
        }
      } else {
        if (!item) {
          item = { key: body.key };
          list.push(item);
        }
        item[body.subField] = String(body.value);
      }
      parsed[locale][arrSchema.name] = list.filter((it: any) => it && Object.keys(it).length > 1 || it?.key);
    } else if (body.arrayField && typeof body.index === 'number') {
      // Indexed string array (e.g. benefits[2])
      const arrSchema = (schema.arrayFields || []).find((a) => a.name === body.arrayField);
      if (!arrSchema) return res.status(400).json({ error: 'Unknown array field' });
      if (arrSchema.itemType !== 'string') return res.status(400).json({ error: 'Indexed write only valid for string arrays' });
      const list: any[] = Array.isArray(parsed[locale][arrSchema.name]) ? parsed[locale][arrSchema.name] : [];
      while (list.length <= body.index) list.push('');
      if (body.value == null || body.value === '') {
        list[body.index] = '';
      } else {
        list[body.index] = String(body.value);
      }
      parsed[locale][arrSchema.name] = list;
    }

    // 🛡️ Source-hash bookkeeping: when the admin writes a value for
    // a target locale on a scalar field, we record the current TR
    // text's hash under translations._src[f]. Future TR edits will
    // not match → the next /records-batch call surfaces a
    // `changed: true` flag so the UI can warn the admin.
    if (body.field && schema.scalarFields.includes(body.field)) {
      const trVal = String(record[body.field] ?? '');
      if (trVal.trim().length > 0) {
        const { createHash } = await import('crypto');
        const src = (parsed._src && typeof parsed._src === 'object') ? parsed._src as Record<string, string> : {};
        // Only update the hash if the target locale for THIS field
        // now has a non-empty value (so the admin has confirmed the
        // translation matches the current source).
        if (typeof parsed[locale]?.[body.field] === 'string' && (parsed[locale][body.field] as string).trim().length > 0) {
          src[body.field] = createHash('sha1').update(trVal.trim()).digest('hex').slice(0, 16);
        }
        parsed._src = src;
      }
    }

    await delegate.update({ where: { id }, data: { translations: stringifyTr(parsed) } });
    res.json({ ok: true, translations: parsed });
  } catch (e: any) {
    logger.error({ err: e }, 'i18n record update error:');
    res.status(500).json({ error: e?.message || 'Failed to save translation' });
  }
});

// POST /api/v1/admin/i18n/record/:model/:id/copy-from-tr
// Body: { locales: ['ru','kg'] } — copies the current TR source text into
// the requested target locales for every empty slot. The admin then
// refines each cell. This is a "first draft" helper, not a translation.
router.post('/record/:model/:id/copy-from-tr', async (req: Request, res: Response) => {
  try {
    const modelName = String(req.params.model);
    const id = String(req.params.id);
    const schema: ModelFieldSchema | undefined = (TRANSLATABLE_MODELS as any)[modelName];
    if (!schema) return res.status(400).json({ error: 'Unknown model' });
    const prismaAny: any = prisma;
    const delegate = prismaAny[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
    if (!delegate) return res.status(400).json({ error: 'Prisma model not found' });
    const record = await delegate.findUnique({ where: { id } });
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const locales = (Array.isArray(req.body?.locales) ? req.body.locales : []) as LocaleCode[];
    const valid = locales.filter((l) => isSupportedLocale(l) && l !== 'tr');
    if (valid.length === 0) return res.status(400).json({ error: 'Provide at least one non-tr locale' });

    const base = extractBaseValues(record, schema);
    const parsed = parseTr(record.translations);
    let copied = 0;
    for (const loc of valid) {
      parsed[loc] = parsed[loc] || {};
      // Scalars
      for (const f of schema.scalarFields) {
        const tr = base[f];
        if (typeof tr !== 'string' || tr.trim().length === 0) continue;
        if (typeof parsed[loc][f] === 'string' && (parsed[loc][f] as string).trim().length > 0) continue; // already filled
        parsed[loc][f] = tr;
        copied++;
      }
      // Arrays
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
            copied++;
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
              copied++;
            }
          }
        }
        parsed[loc][arr.name] = list;
      }
    }
    await delegate.update({ where: { id }, data: { translations: stringifyTr(parsed) } });
    res.json({ ok: true, copied });
  } catch (e: any) {
    logger.error({ err: e }, 'i18n copy-from-tr error:');
    res.status(500).json({ error: e?.message || 'Copy failed' });
  }
});

// GET /api/v1/admin/i18n/export/:model.csv?locales=ru,kg
// Streams a CSV with one row per (record, scalar) plus one row per
// (record, array_item, subfield). The TR source is included so an
// external translator can work on the file in Excel / Google Sheets
// and then upload it back.
router.get('/export/:model.csv', async (req: Request, res: Response) => {
  try {
    const modelName = String(req.params.model);
    const schema: ModelFieldSchema | undefined = (TRANSLATABLE_MODELS as any)[modelName];
    if (!schema) return res.status(400).send('Unknown model');
    const prismaAny: any = prisma;
    const delegate = prismaAny[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
    if (!delegate) return res.status(400).send('Prisma model not found');

    const targetLocales = (String(req.query.locales || 'ru,kg,en').split(',').filter((l) => isSupportedLocale(l) && l !== 'tr') as LocaleCode[]);
    const select: any = { id: true, translations: true };
    for (const f of schema.scalarFields) select[f] = true;
    for (const arr of schema.arrayFields || []) select[arr.name] = true;
    const rows = await delegate.findMany({ select, take: 2000, orderBy: { updatedAt: 'desc' } });

    const esc = (s: any) => {
      if (s == null) return '';
      const str = String(s);
      if (/[",\n;]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
      return str;
    };

    const out: string[] = [];
    out.push(['record_id', 'path', 'tr', ...targetLocales].map(esc).join(','));
    for (const r of rows) {
      const base = extractBaseValues(r, schema);
      const parsed = parseTr(r.translations);
      for (const f of schema.scalarFields) {
        const tr = base[f] || '';
        if (typeof tr !== 'string' || tr.trim().length === 0) continue;
        out.push([r.id, f, tr, ...targetLocales.map((loc) => (parsed?.[loc]?.[f] as string) || '')].map(esc).join(','));
      }
      for (const arr of schema.arrayFields || []) {
        const baseList: any[] = Array.isArray(base[arr.name]) ? base[arr.name] : [];
        for (let i = 0; i < baseList.length; i++) {
          const item = baseList[i];
          const idKey = arr.matchBy === 'key' ? item?.key : String(i);
          if (arr.itemType === 'string') {
            if (typeof item !== 'string' || item.trim().length === 0) continue;
            out.push([r.id, `${arr.name}[${idKey}]`, item, ...targetLocales.map((loc) => {
              const locArr: any[] = Array.isArray(parsed?.[loc]?.[arr.name]) ? parsed[loc][arr.name] : [];
              return (locArr[i] as string) || '';
            })].map(esc).join(','));
          } else {
            for (const sub of (arr.fields || [])) {
              if (typeof item?.[sub] !== 'string' || item[sub].trim().length === 0) continue;
              out.push([r.id, `${arr.name}[${idKey}].${sub}`, item[sub], ...targetLocales.map((loc) => {
                const locArr: any[] = Array.isArray(parsed?.[loc]?.[arr.name]) ? parsed[loc][arr.name] : [];
                const locItem = arr.matchBy === 'key' ? locArr.find((x: any) => x?.key === idKey) : locArr[i];
                return (locItem && locItem[sub]) || '';
              })].map(esc).join(','));
            }
          }
        }
      }
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${modelName.toLowerCase()}-i18n-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('\uFEFF' + out.join('\n')); // BOM for Excel
  } catch (e: any) {
    logger.error({ err: e }, 'i18n export error:');
    res.status(500).json({ error: e?.message || 'Export failed' });
  }
});

// POST /api/v1/admin/i18n/import/:model
// Body (JSON): { rows: [{ recordId, locale, path, value }, ...] }
// `path` is "name" / "description" / "accordions[storage].title" / "benefits[2]"
// Pivots the rows by recordId, then writes each locale in one update.
router.post('/import/:model', validate({ body: I18nImportSchema }), async (req: Request, res: Response) => {
  try {
    const modelName = String(req.params.model);
    const schema: ModelFieldSchema | undefined = (TRANSLATABLE_MODELS as any)[modelName];
    if (!schema) return res.status(400).json({ error: 'Unknown model' });
    const prismaAny: any = prisma;
    const delegate = prismaAny[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
    if (!delegate) return res.status(400).json({ error: 'Prisma model not found' });

    const { rows } = req.body as { rows: { recordId: string; locale: LocaleCode; path: string; value: string }[] };

    // Group by recordId
    const grouped: Record<string, { recordId: string; perLocale: Record<string, any[]> }> = {};
    for (const r of rows) {
      if (!isSupportedLocale(r.locale) || r.locale === 'tr') continue;
      if (!grouped[r.recordId]) grouped[r.recordId] = { recordId: r.recordId, perLocale: {} };
      if (!grouped[r.recordId].perLocale[r.locale]) grouped[r.recordId].perLocale[r.locale] = [];
      grouped[r.recordId].perLocale[r.locale].push({ path: r.path, value: r.value });
    }

    let updatedRecords = 0;
    let updatedFields = 0;
    for (const grp of Object.values(grouped)) {
      const record = await delegate.findUnique({ where: { id: grp.recordId } });
      if (!record) continue;
      const parsed = parseTr(record.translations);
      for (const [loc, changes] of Object.entries(grp.perLocale)) {
        parsed[loc] = parsed[loc] || {};
        for (const c of changes as { path: string; value: string }[]) {
          const applied = applyPathToTranslations(parsed[loc], schema, c.path, c.value);
          if (applied) updatedFields++;
        }
      }
      await delegate.update({ where: { id: grp.recordId }, data: { translations: stringifyTr(parsed) } });
      updatedRecords++;
    }

    res.json({ ok: true, updatedRecords, updatedFields });
  } catch (e: any) {
    logger.error({ err: e }, 'i18n import error:');
    res.status(500).json({ error: e?.message || 'Import failed' });
  }
});

/**
 * Helper: apply a path string ("name" / "accordions[storage].title" / "benefits[2]")
 * to a per-locale translations object. Returns true on a successful write.
 */
const applyPathToTranslations = (locTr: Record<string, any>, schema: ModelFieldSchema, path: string, value: string): boolean => {
  // Scalar
  if (schema.scalarFields.includes(path)) {
    if (value == null || value === '') delete locTr[path];
    else locTr[path] = value;
    return true;
  }
  // Array item: "name[key]" or "name[key].sub" or "name[idx]"
  const m = path.match(/^([a-zA-Z_]+)\[([^\]]+)\](?:\.([a-zA-Z_]+))?$/);
  if (!m) return false;
  const arrayName = m[1];
  const keyOrIdx = m[2];
  const sub = m[3];
  const arrSchema = (schema.arrayFields || []).find((a) => a.name === arrayName);
  if (!arrSchema) return false;
  const list: any[] = Array.isArray(locTr[arrayName]) ? locTr[arrayName] : [];
  if (arrSchema.itemType === 'string') {
    // Indexed string array, no sub-field
    const idx = Number(keyOrIdx);
    if (!Number.isFinite(idx)) return false;
    while (list.length <= idx) list.push('');
    if (value == null || value === '') list[idx] = '';
    else list[idx] = value;
    locTr[arrayName] = list;
    return true;
  }
  // Object array — needs a sub-field
  if (!sub || !(arrSchema.fields || []).includes(sub)) return false;
  const isKey = arrSchema.matchBy === 'key';
  let item = isKey ? list.find((x: any) => x?.key === keyOrIdx) : list[Number(keyOrIdx)];
  if (!item) {
    item = isKey ? { key: keyOrIdx } : {};
    if (isKey) list.push(item); else list[Number(keyOrIdx)] = item;
  }
  if (value == null || value === '') delete item[sub];
  else item[sub] = value;
  locTr[arrayName] = list;
  return true;
};

// ─── UI STRINGS (static storefront locale overrides) ─────────────────────────
// The storefront's button labels, nav items and system messages live in the
// frontend's bundled locale JSON. These endpoints let the admin override ANY
// of those keys at runtime — stored as nested per-locale objects in
// SiteSettings.uiTranslations and merged into vue-i18n at storefront boot, so
// any on-screen text becomes editable from the Translation Center.
const UI_LOCALES = ['tr', 'ru', 'kg'] as const;

// Set (or, on empty value, delete + prune) a dot-path key inside an object.
const setDeep = (root: any, path: string, value: string | null): void => {
  const parts = path.split('.').filter(Boolean);
  if (parts.length === 0) return;
  const last = parts[parts.length - 1];

  if (value == null || value === '') {
    const chain: any[] = [root];
    let cur = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const next = cur[parts[i]];
      if (next == null || typeof next !== 'object') return; // nothing to delete
      cur = next;
      chain.push(cur);
    }
    delete cur[last];
    // Prune parents that became empty.
    for (let i = parts.length - 2; i >= 0; i--) {
      const parent = chain[i];
      const k = parts[i];
      if (parent[k] && typeof parent[k] === 'object' && Object.keys(parent[k]).length === 0) {
        delete parent[k];
      } else break;
    }
    return;
  }

  let cur = root;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] == null || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[last] = value;
};

// GET /api/v1/admin/i18n/ui-strings → { overrides: { tr:{}, ru:{}, kg:{} } }
router.get('/ui-strings', async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.siteSettings.findFirst({ select: { uiTranslations: true } });
    let overrides: any = {};
    if (settings?.uiTranslations) {
      try { overrides = JSON.parse(settings.uiTranslations) || {}; } catch { overrides = {}; }
    }
    res.json({ overrides });
  } catch (e: any) {
    logger.error({ err: e }, 'i18n ui-strings get error:');
    res.status(500).json({ error: e?.message || 'Failed to load UI strings' });
  }
});

// PATCH /api/v1/admin/i18n/ui-strings  Body: { locale, key, value }
// `key` is a dot path (e.g. "cart.addToCart"). An empty value reverts the key
// to its bundled default (the override is removed).
router.patch('/ui-strings', async (req: Request, res: Response) => {
  try {
    const locale = String((req.body as any).locale || '');
    const key = String((req.body as any).key || '').trim();
    const raw = (req.body as any).value;
    const value = raw == null ? '' : String(raw);
    if (!(UI_LOCALES as readonly string[]).includes(locale)) return res.status(400).json({ error: 'Unsupported locale' });
    if (!key || key.length > 200) return res.status(400).json({ error: 'Invalid key' });
    if (value.length > 10000) return res.status(400).json({ error: 'Value too long' });

    const settings = await prisma.siteSettings.findFirst({ select: { id: true, uiTranslations: true } });
    let parsed: any = {};
    if (settings?.uiTranslations) {
      try { parsed = JSON.parse(settings.uiTranslations) || {}; } catch { parsed = {}; }
    }
    parsed[locale] = parsed[locale] || {};
    setDeep(parsed[locale], key, value);
    if (parsed[locale] && Object.keys(parsed[locale]).length === 0) delete parsed[locale];

    const json = JSON.stringify(parsed);
    if (settings?.id) {
      await prisma.siteSettings.update({ where: { id: settings.id }, data: { uiTranslations: json } });
    } else {
      await prisma.siteSettings.create({ data: { uiTranslations: json } });
    }
    res.json({ ok: true });
  } catch (e: any) {
    logger.error({ err: e }, 'i18n ui-strings patch error:');
    res.status(500).json({ error: e?.message || 'Failed to save UI string' });
  }
});

export default router;
