import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { authenticateJWT, requireRole } from '../middleware/auth';
import prisma from '../lib/prisma';
import { translateOnSave } from '../i18n/TranslationCenter';
import { validate, SettingsUpdateSchema } from '../validators';
import { logger } from '../utils/logger';
import { getCache, setCache, deleteCache } from '../utils/redis';

const router = Router();

// ─── Cache ──────────────────────────────────────────────────────────────
// Settings rarely change (admin edits maybe a few times a day) but every
// public page hits /api/v1/settings on mount. We cache the JSON-serialized
// payload for 60s + emit a strong ETag so a 304 Not Modified saves the
// full re-fetch when nothing changed.
//
// On any PUT we invalidate the cache so the next GET sees fresh data.
const SETTINGS_CACHE_KEY = 'settings:v1';
const SETTINGS_CACHE_TTL = 60; // seconds

/**
 * Coerce all price-related fields inside homepageBlocks to String.
 * Frontend (ProductPicker) auto-fills some price fields as raw numbers
 * (e.g. `oldPrice: 1170`), but downstream components (PromoBanner)
 * call `.replace(/\D/g, '')` on these values — which throws on numbers
 * and prevents the whole block from mounting. We normalise here so the
 * DB is the single source of truth for correct types, regardless of
 * what the frontend sends.
 */
const PRICE_FIELDS = new Set([
  'oldPrice',
  'newPrice',
  'upsellProductPrice',
  'freeShippingThreshold',
  'countdownHours'
]);

// ─── Optimistic locking for homepageBlocks ─────────────────────────────
// The Page Builder autosaves ~1s after every edit. If two admins have it
// open at once, each PUT overwrites the WHOLE homepageBlocks column —
// there's no per-block merge — so the second save silently discards the
// first admin's edits. hashOf() lets the client prove it last saw the
// version it's about to overwrite; a mismatch means someone else saved
// in between and this write must be rejected instead of clobbering it.
const hashOf = (value: any): string =>
  crypto.createHash('sha1').update(JSON.stringify(value ?? null)).digest('hex');

const coercePriceFields = (blocks: any): any => {
  if (!blocks || typeof blocks !== 'object') return blocks;
  for (const key of Object.keys(blocks)) {
    const arr = blocks[key];
    if (!Array.isArray(arr)) continue;
    for (const b of arr) {
      if (!b?.data || typeof b.data !== 'object') continue;
      for (const pk of Object.keys(b.data)) {
        if (PRICE_FIELDS.has(pk) && typeof b.data[pk] === 'number') {
          b.data[pk] = String(b.data[pk]);
        }
      }
    }
  }
  return blocks;
};

// Helper: JSON fields stored as TEXT in MySQL. Accept object/array or pre-stringified string.
const toJsonString = (val: any): string | null | undefined => {
  if (val === undefined) return undefined;
  if (val === null) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

// GET /api/v1/settings
router.get('/', async (req: Request, res: Response) => {
  try {
    // ── ETag short-circuit ────────────────────────────────────────────
    // If the client sends If-None-Match and it matches our cached ETag,
    // return 304 with no body. Saves bandwidth on the most-hit endpoint.
    const cached = await getCache<{ payload: any; etag: string }>(SETTINGS_CACHE_KEY);

    if (cached) {
      const ifNoneMatch = req.header('If-None-Match');
      if (ifNoneMatch && ifNoneMatch === cached.etag) {
        res.set('ETag', cached.etag);
        res.set('Cache-Control', 'public, max-age=30');
        return res.status(304).end();
      }
    }

    if (cached) {
      // Hot path — cache hit
      res.set('ETag', cached.etag);
      res.set('Cache-Control', 'public, max-age=30');
      return res.json(cached.payload);
    }

    // ── Cold path — DB read + parse ───────────────────────────────────
    let settings = await prisma.siteSettings.findFirst();
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: {} });
    }

    // TEXT columns store JSON as strings — parse them on the way out so
    // the frontend always receives objects/arrays, never raw JSON strings.
    const parsed: any = { ...settings };
    const jsonFields = [
      'homepageBlocks', 'financeSettings',
      'trustBadges', 'partners', 'footerLinks', 'faqItems'
    ];
    for (const f of jsonFields) {
      if (typeof parsed[f] === 'string' && parsed[f].length > 0) {
        try { parsed[f] = JSON.parse(parsed[f]); } catch { /* keep as string */ }
      } else if (parsed[f] === '' || parsed[f] === null) {
        parsed[f] = null;
      }
    }

    // Exposed separately from the response ETag (which covers the whole
    // settings object and churns on unrelated field edits). This one is
    // scoped to just homepageBlocks so Page Builder can detect a real
    // conflict without false positives from e.g. a company-name edit.
    parsed._blocksVersion = hashOf(parsed.homepageBlocks ?? null);

    // ETag = SHA-1 of the canonical JSON. Stable for an unchanged payload.
    const etag = '"' + crypto.createHash('sha1').update(JSON.stringify(parsed)).digest('hex') + '"';
    await setCache(SETTINGS_CACHE_KEY, { payload: parsed, etag }, SETTINGS_CACHE_TTL);

    res.set('ETag', etag);
    res.set('Cache-Control', 'public, max-age=30');
    res.json(parsed);
  } catch (error) {
    logger.error({ err: error }, 'Fetch Settings Error:');
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// GET /api/v1/settings/ui-i18n
// Public, lightweight: returns ONLY the admin's UI-string overrides as nested
// per-locale objects, e.g. { tr: { cart: { addToCart: '...' } }, ru: {...} }.
// The storefront merges these into vue-i18n at boot. Empty object when none.
router.get('/ui-i18n', async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.siteSettings.findFirst({ select: { uiTranslations: true } });
    let overrides: any = {};
    if (settings?.uiTranslations) {
      try { overrides = JSON.parse(settings.uiTranslations) || {}; } catch { overrides = {}; }
    }
    // Short cache — overrides change rarely; storefront tolerates a brief lag.
    res.set('Cache-Control', 'public, max-age=60');
    res.json(overrides);
  } catch (error) {
    logger.error({ err: error }, 'Fetch UI i18n overrides error:');
    res.json({}); // never block the storefront on this
  }
});

// PUT /api/v1/settings
router.put('/', authenticateJWT, requireRole('admin'), validate({ body: SettingsUpdateSchema }), async (req: Request, res: Response) => {
  try {
    const {
      companyName, address, phone, email, mapIframeCode, logoUrl,
      topbarShippingMsg, topbarPhone, trustBadges, partners, footerLinks, copyrightText,
      homepageBlocks, financeSettings, translations, faqItems,
      campaignEnabled, campaignEndsAt, campaignTitle, campaignCta, campaignLink
    } = req.body;

    let settings = await prisma.siteSettings.findFirst();

    // Reject the write if the client's edit was based on a stale copy of
    // homepageBlocks — see hashOf() comment above. Scalar/other JSON
    // fields aren't covered: those save via independent Prisma columns,
    // so two admins editing e.g. companyName and homepageBlocks at the
    // same time don't actually clobber each other.
    if (homepageBlocks !== undefined) {
      const baseVersion = req.header('x-blocks-base-version');
      if (baseVersion) {
        let currentBlocksParsed: any = null;
        if (settings?.homepageBlocks) {
          try { currentBlocksParsed = JSON.parse(settings.homepageBlocks); } catch { /* treat as null */ }
        }
        const currentVersion = hashOf(currentBlocksParsed);
        if (baseVersion !== currentVersion) {
          res.status(409).json({
            error: 'conflict',
            message: 'Bu bölümler başka bir yönetici tarafından güncellendi. Değişikliklerinizi kaybetmemek için sayfayı yeniden yükleyin.',
            currentBlocksVersion: currentVersion
          });
          return;
        }
      }
    }

    const dataToSave: any = {};
    if (companyName !== undefined) dataToSave.companyName = companyName;
    if (address !== undefined) dataToSave.address = address;
    if (phone !== undefined) dataToSave.phone = phone;
    if (email !== undefined) dataToSave.email = email;
    if (mapIframeCode !== undefined) dataToSave.mapIframeCode = mapIframeCode;
    if (logoUrl !== undefined) dataToSave.logoUrl = logoUrl;
    if (topbarShippingMsg !== undefined) dataToSave.topbarShippingMsg = topbarShippingMsg;
    if (topbarPhone !== undefined) dataToSave.topbarPhone = topbarPhone;
    if (copyrightText !== undefined) dataToSave.copyrightText = copyrightText;
    // Hero campaign banner — admin schedule. Coerce the ISO
    // string the frontend sends into a Date the DB can store,
    // and accept explicit null to clear an existing schedule.
    if (campaignEnabled !== undefined) dataToSave.campaignEnabled = !!campaignEnabled;
    if (campaignEndsAt !== undefined) {
      dataToSave.campaignEndsAt = campaignEndsAt ? new Date(campaignEndsAt) : null;
    }
    if (campaignTitle !== undefined) dataToSave.campaignTitle = campaignTitle;
    if (campaignCta !== undefined) dataToSave.campaignCta = campaignCta;
    if (campaignLink !== undefined) dataToSave.campaignLink = campaignLink;
    if (translations !== undefined) dataToSave.translations = typeof translations === 'object' ? JSON.stringify(translations) : translations;

    // JSON fields — auto-serialize objects to strings (DB column is TEXT)
    const financeJson = toJsonString(financeSettings);
    if (financeJson !== undefined) dataToSave.financeSettings = financeJson;
    // 🛡️ Normalise price fields inside homepageBlocks before saving.
    // This is the authoritative coercion — regardless of what the frontend
    // sends (string OR number), the DB always stores strings for price
    // fields, so PromoBanner and other consumers can safely call .replace().
    const normalisedHomepage = homepageBlocks !== undefined
      ? coercePriceFields(homepageBlocks)
      : undefined;
    const homepageJson = toJsonString(normalisedHomepage);
    if (homepageJson !== undefined) dataToSave.homepageBlocks = homepageJson;
    const trustJson = toJsonString(trustBadges);
    if (trustJson !== undefined) dataToSave.trustBadges = trustJson;
    const partnersJson = toJsonString(partners);
    if (partnersJson !== undefined) dataToSave.partners = partnersJson;
    const footerJson = toJsonString(footerLinks);
    if (footerJson !== undefined) dataToSave.footerLinks = footerJson;
    const faqJson = toJsonString(faqItems);
    if (faqJson !== undefined) dataToSave.faqItems = faqJson;

    if (!settings) {
      settings = await prisma.siteSettings.create({ data: dataToSave });
    } else {
      settings = await prisma.siteSettings.update({
        where: { id: settings.id },
        data: dataToSave
      });
    }

    // Invalidate the cache so the next GET re-reads from MySQL + recomputes
    // the ETag. Fire-and-forget — failures here don't block the response.
    deleteCache(SETTINGS_CACHE_KEY).catch((e) =>
      logger.warn({ err: e?.message }, 'settings cache invalidation failed')
    );

    // Auto-translate the localizable scalar settings (companyName, address,
    // topbarShippingMsg, copyrightText) into RU/KG — fire-and-forget.
    translateOnSave('SiteSettings', settings.id);

    let savedBlocksParsed: any = null;
    if (settings.homepageBlocks) {
      try { savedBlocksParsed = JSON.parse(settings.homepageBlocks); } catch { /* keep null */ }
    }
    res.json({ ...settings, _blocksVersion: hashOf(savedBlocksParsed) });
  } catch (error: any) {
    logger.error({ err: error }, 'Update Settings Error:');
    res.status(500).json({ error: 'Failed to update settings: ' + (error.message || 'unknown') });
  }
});

export default router;
