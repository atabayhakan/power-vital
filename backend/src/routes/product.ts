import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { authenticateJWT, requireRole } from '../middleware/auth';
import prisma from '../lib/prisma';
import { translateOnSave } from '../i18n/TranslationCenter';
import { validate, ProductCreateSchema, ProductUpdateSchema, IdParamSchema, ProductCreateInput, ProductUpdateInput, z } from '../validators';
import { logger } from '../utils/logger';
import { searchProducts } from '../services/searchService';
import { limit, RATE_LIMITS } from '../utils/rateLimit';
import { getCache, setCache, deleteCache } from '../utils/redis';

const router = Router();

// Default accordion schema for NEW products. Admins can override titles,
// add/remove accordions, and toggle initial-open state per product.
// Each entry: { key, title, content, isOpen, sortOrder }
const DEFAULT_ACCORDIONS = [
  { key: 'storage',      icon: '📦', title: 'Saklama Koşulları',   content: '', isOpen: false, sortOrder: 1 },
  { key: 'contents',     icon: '📃', title: 'İçerik',               content: '', isOpen: false, sortOrder: 2 },
  { key: 'usage',        icon: '📝', title: 'Kullanım Önerisi',     content: '', isOpen: false, sortOrder: 3 },
  { key: 'shippingInfo', icon: '🚚', title: 'Kargo & İade',         content: '', isOpen: false, sortOrder: 4 }
];

// Look up the default title for a given key (used for NEW products and
// when the admin adds a new accordion by key — they can still rename it).
const DEFAULT_BY_KEY: Record<string, { icon: string; title: string }> = {};
for (const a of DEFAULT_ACCORDIONS) {
  DEFAULT_BY_KEY[a.key] = { icon: a.icon, title: a.title };
}

// Merge a stored accordions JSON with the default schema:
//  - add new defaults that don't exist yet (backfill)
//  - fill in missing icon for legacy rows
//  - sort by sortOrder
//  - ensure every entry has the required fields
//  - if translations.accordions[lang] exists, overlay translated title/content
//    so the storefront can render accordion sections in KG/RU/EN.
const mergeAccordions = (raw: any, langTranslations?: any): any[] => {
  let stored: any[] = [];
  if (raw) {
    if (typeof raw === 'string') {
      try { stored = JSON.parse(raw); } catch { stored = []; }
    } else if (Array.isArray(raw)) {
      stored = raw;
    }
  }
  // Index stored by key
  const byKey = new Map<string, any>();
  for (const a of stored) {
    if (a && a.key) byKey.set(a.key, a);
  }
  // Per-key translations: { key: { title, content } }
  const accTranslations = (langTranslations && langTranslations.accordions) || {};
  const byKeyTr = new Map<string, any>();
  if (Array.isArray(accTranslations)) {
    for (const t of accTranslations) {
      if (t && t.key) byKeyTr.set(t.key, t);
    }
  }
  // Build final list: start with defaults (preserving order), but if a stored
  // entry exists, use that one (so user customisations win)
  const merged: any[] = [];
  for (const def of DEFAULT_ACCORDIONS) {
    const existing = byKey.get(def.key);
    if (existing) {
      const tr = byKeyTr.get(def.key) || {};
      merged.push({
        key: def.key,
        icon: existing.icon || def.icon,
        title: tr.title || existing.title || def.title,
        content: typeof tr.content === 'string' ? tr.content : (typeof existing.content === 'string' ? existing.content : ''),
        isOpen: !!existing.isOpen,
        sortOrder: def.sortOrder
      });
      byKey.delete(def.key);
    } else {
      merged.push({ ...def });
    }
  }
  // Any remaining stored entries are admin-added custom accordions (keys
  // outside the 4 standard ones) — carry them through too, or "+ Yeni
  // Accordion" would save fine but the section would never actually reach
  // the storefront.
  for (const [key, existing] of byKey) {
    const tr = byKeyTr.get(key) || {};
    merged.push({
      key,
      icon: existing.icon || '📄',
      title: tr.title || existing.title || 'Bölüm',
      content: typeof tr.content === 'string' ? tr.content : (typeof existing.content === 'string' ? existing.content : ''),
      isOpen: !!existing.isOpen,
      sortOrder: Number(existing.sortOrder) || (DEFAULT_ACCORDIONS.length + 1)
    });
  }
  // Sort by sortOrder
  merged.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  return merged;
};

// Helper: serialise a frontend-supplied accordions array to a JSON string
// for DB storage. Validates structure and falls back to defaults when
// the input is empty or malformed.
const serialiseAccordions = (raw: any): string => {
  let arr: any[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === 'string') {
    try { const p = JSON.parse(raw); if (Array.isArray(p)) arr = p; } catch {}
  }
  // Drop entries with empty content AND no title (treated as removed)
  const filtered = arr
    .filter(a => a && (a.title || a.content))
    .map((a, i) => {
      const def = DEFAULT_BY_KEY[a.key] || {};
      return {
        key: typeof a.key === 'string' ? a.key : ('custom_' + (i + 1)),
        icon: a.icon || def.icon || '📄',
        title: (a.title || def.title || 'Bölüm ' + (i + 1)).toString().slice(0, 80),
        content: typeof a.content === 'string' ? a.content : '',
        isOpen: !!a.isOpen,
        sortOrder: Number(a.sortOrder) || (i + 1)
      };
    });
  // If everything was filtered out, return the default skeleton so the
  // product page still renders the 4 standard accordions.
  if (filtered.length === 0) return JSON.stringify(DEFAULT_ACCORDIONS);
  return JSON.stringify(filtered);
};

// Helper: parse TEXT-stored JSON fields into JS objects/arrays.
// The Product table stores accordions & benefits as TEXT (no native JSON
// type in this schema). We parse them on the way out so the frontend
// receives real arrays, not raw JSON strings.
const parseJsonField = (val: any): any => {
  if (val === null || val === undefined) return val;
  if (typeof val !== 'string') return val; // already parsed somehow
  try { return JSON.parse(val); } catch { return val; }
};

const expandProduct = (p: any, lang?: string) => {
  if (!p) return p;

  const translations = parseJsonField(p.translations) || {};
  let name = p.name;
  let description = p.description;
  let langTr: any = null;

  if (lang && translations[lang]) {
    langTr = translations[lang];
    if (langTr.name) name = langTr.name;
    if (langTr.description) description = langTr.description;
  }

  return {
    ...p,
    name,
    description,
    translations,
    accordions: mergeAccordions(p.accordions, langTr),
    benefits: parseJsonField(p.benefits)
  };
};

// GET /api/v1/products - List all products with images and category
//
// When ?search= is provided we delegate to the search service which uses
// MySQL FULLTEXT (ngram parser) for relevance-ranked, partial-match search.
// Otherwise we fall back to a plain paginated list (newest first).
router.get('/', async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const categoryId = req.query.categoryId as string | undefined;
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 100, 100);

    if (search) {
      // Delegate to the search service (FULLTEXT + relevance + snippet).
      const result = await searchProducts(search, {
        q: search,
        categoryId,
        page,
        limit
      });
      // Search results are personalised per-query — keep them as-is
      // (no shared cache). Set a short cache to absorb bot retries.
      res.set('Cache-Control', 'public, max-age=15');
      return res.json(result);
    }

    // ── Cache only the "default list" (no categoryId, first page) ─────
    // That covers the homepage and most storefront visits. Category
    // filters / paginated requests bypass the cache — they have lower
    // hit rates and the cache key space would explode otherwise.
    const isCacheable = !categoryId && page === 1 && limit === 100;
    if (isCacheable) {
      const cached = await getCache<{ payload: any[]; etag: string }>('products:list:v1');
      if (cached) {
        const ifNoneMatch = req.header('If-None-Match');
        if (ifNoneMatch && ifNoneMatch === cached.etag) {
          res.set('ETag', cached.etag);
          res.set('Cache-Control', 'public, max-age=60');
          return res.status(304).end();
        }
        res.set('ETag', cached.etag);
        res.set('Cache-Control', 'public, max-age=60');
        return res.json(cached.payload);
      }
    }

    const products = await prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true
      }
    });
    const payload = products.map(p => expandProduct(p, req.headers['accept-language']));

    if (isCacheable) {
      const etag = '"' + crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex') + '"';
      await setCache('products:list:v1', { payload, etag }, 120);
      res.set('ETag', etag);
      res.set('Cache-Control', 'public, max-age=60');
    } else {
      res.set('Cache-Control', 'public, max-age=15');
    }
    res.json(payload);
  } catch (error) {
    logger.error({ err: error }, 'Fetch Products Error:');
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/v1/products/search — Dedicated search endpoint
//
// Always returns the full SearchResult envelope ({ hits, total, page, ... })
// so the frontend can render result counts and snippets. The plain GET /
// above returns either a SearchResult OR a raw product list depending on
// whether ?search= was supplied; this endpoint is unambiguous.
const SearchQuerySchema = z.object({
  q: z.string().min(1, 'q is required').max(200),
  categoryId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  inStock: z.coerce.boolean().optional()
}).strict();
router.get('/search', limit(RATE_LIMITS.public.search), validate({ query: SearchQuerySchema }), async (req: Request, res: Response) => {
  try {
    const { q, categoryId, page, limit, inStock } = req.query as unknown as { q: string; categoryId?: string; page: number; limit: number; inStock?: boolean };
    const result = await searchProducts(q, { q, categoryId, page, limit, inStockOnly: inStock });
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Product search error');
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/v1/products/:id - Get single product
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: 'asc' } }, category: true }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(expandProduct(product, req.headers['accept-language']));
  } catch (error) {
    logger.error({ err: error }, 'Fetch Product Error:');
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// GET /api/v1/products/barcode/:barcode - POS barcode lookup
router.get('/barcode/:barcode', async (req: Request, res: Response) => {
  try {
    const barcode = req.params.barcode as string;
    const product = await prisma.product.findUnique({
      where: { barcode },
      include: { images: { orderBy: { sortOrder: 'asc' } }, category: true }
    });
    if (!product) return res.status(404).json({ error: 'Product not found for this barcode' });
    res.json(expandProduct(product, req.headers['accept-language']));
  } catch (error) {
    logger.error({ err: error }, 'Barcode Lookup Error:');
    res.status(500).json({ error: 'Failed to lookup barcode' });
  }
});

// POST /api/v1/products - Create a new product
router.post('/', authenticateJWT, requireRole('admin'), validate({ body: ProductCreateSchema }), async (req: Request, res: Response) => {
  try {
    const { barcode, name, description, basePriceKgs, stockQuantity, minStockAlert, categoryId, imageUrls, benefits, accordions, translations } = req.body as ProductCreateInput;

    // benefits: array of strings → JSON
    let benefitsJson: string | null = null;
    if (benefits !== undefined && benefits !== null) {
      if (typeof benefits === 'string') {
        benefitsJson = benefits;
      } else if (Array.isArray(benefits)) {
        benefitsJson = JSON.stringify(benefits);
      } else if (typeof benefits === 'object') {
        benefitsJson = JSON.stringify(Object.values(benefits));
      }
    }

    // accordions: admin-managed array (key/icon/title/content/isOpen/sortOrder)
    const accordionsJson = accordions !== undefined
      ? serialiseAccordions(accordions)
      : JSON.stringify(DEFAULT_ACCORDIONS);

    const categoryRelation = categoryId
      ? { category: { connect: { id: categoryId } } }
      : {};

    const product = await prisma.product.create({
      data: {
        barcode,
        name,
        description,
        basePriceKgs,
        stockQuantity: stockQuantity || 0,
        minStockAlert: minStockAlert ?? 10,
        ...categoryRelation,
        accordions: accordionsJson,
        benefits: benefitsJson,
        translations: translations !== undefined ? (typeof translations === 'string' ? translations : JSON.stringify(translations)) : null,
        images: imageUrls ? {
          create: (imageUrls as string[]).map((url: string, i: number) => ({
            imageUrl: url,
            sortOrder: i
          }))
        } : undefined
      },
      include: { images: true, category: true }
    });

    // Best-effort: auto-translate missing RU/KG fields in the background.
    translateOnSave('Product', product.id);

    res.status(201).json(expandProduct(product, req.headers['accept-language']));

    // New product → cached list is stale.
    deleteCache('products:list:v1').catch(() => {});
  } catch (error: any) {
    logger.error({ err: error }, 'Create Product Error:');
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Bu barkod zaten kullanılıyor. Başka bir barkod deneyin.' });
    }
    res.status(500).json({ error: 'Failed to create product: ' + (error.message || 'unknown') });
  }
});

// PUT /api/v1/products/:id - Update product
router.put('/:id', authenticateJWT, requireRole('admin'), validate({ body: ProductUpdateSchema, params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { barcode, name, description, basePriceKgs, stockQuantity, minStockAlert, categoryId, imageUrls, benefits, accordions, translations } = req.body as ProductUpdateInput;

    // If imageUrls provided, replace all images
    if (imageUrls) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      await prisma.productImage.createMany({
        data: (imageUrls as string[]).map((url: string, i: number) => ({
          productId: id,
          imageUrl: url,
          sortOrder: i
        }))
      });
    }

    // benefits: same treatment as customFields
    let benefitsJson: string | null | undefined = undefined;
    if (benefits !== undefined) {
      if (benefits === null) {
        benefitsJson = null;
      } else if (typeof benefits === 'string') {
        benefitsJson = benefits;
      } else if (Array.isArray(benefits)) {
        benefitsJson = JSON.stringify(benefits);
      } else if (typeof benefits === 'object') {
        benefitsJson = JSON.stringify(Object.values(benefits));
      }
    }

    // accordions: only update if explicitly provided
    let accordionsJson: string | undefined = undefined;
    if (accordions !== undefined) {
      accordionsJson = serialiseAccordions(accordions);
    }

    // Build category relation: explicit null/empty → disconnect; defined id → connect
    const categoryRelationUpdate = categoryId === undefined
      ? {}
      : (categoryId
          ? { category: { connect: { id: categoryId } } }
          : { category: { disconnect: true } });

    const product = await prisma.product.update({
      where: { id },
      data: {
        barcode,
        name,
        description,
        basePriceKgs,
        stockQuantity,
        minStockAlert,
        ...categoryRelationUpdate,
        ...(accordionsJson !== undefined ? { accordions: accordionsJson } : {}),
        // ⚠️ For optional fields, only include in update if defined (so undefined
        ...(benefitsJson !== undefined ? { benefits: benefitsJson } : {}),
        ...(translations !== undefined ? { translations: typeof translations === 'string' ? translations : JSON.stringify(translations) } : {})
      },
      include: { images: true, category: true }
    });

    // Auto-fill missing translations in the background.
    translateOnSave('Product', id);

    // Invalidate the cached "default list" so the next storefront GET sees
    // the updated product (any change to category/price/active flag would
    // otherwise be invisible until the 120s TTL expires).
    deleteCache('products:list:v1').catch(() => {});

    res.json(expandProduct(product, req.headers['accept-language']));
  } catch (error: any) {
    logger.error({ err: error }, 'Update Product Error:');
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Bu barkod zaten kullanılıyor. Başka bir barkod deneyin.' });
    }
    res.status(500).json({ error: 'Failed to update product: ' + (error.message || 'unknown') });
  }
});

// DELETE /api/v1/products/:id - Delete product (cascade via raw SQL for safety)
router.delete('/:id', authenticateJWT, requireRole('admin'), validate({ params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const [linkedItems, linkedImages, product] = await Promise.all([
      prisma.orderItem.count({ where: { productId: id } }),
      prisma.productImage.count({ where: { productId: id } }),
      prisma.product.findUnique({ where: { id }, select: { id: true, name: true } })
    ]);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Order matters: OrderItem.productId FK → Product, ProductImage.productId FK → Product
    // Even if DB has RESTRICT, raw SQL bypasses Prisma emulated FK checks
    const orderItemDel = await prisma.orderItem.deleteMany({ where: { productId: id } });
    const imageDel = await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });

    res.json({
      message: 'Product deleted successfully',
      name: product.name,
      cascadedItems: orderItemDel.count,
      cascadedImages: imageDel.count
    });

    // Deletion makes the cached list stale.
    deleteCache('products:list:v1').catch(() => {});
  } catch (error: any) {
    logger.error({ err: error }, 'Delete Product Error:');
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Failed to delete product: ' + (error.message || 'unknown') });
  }
});

export default router;
