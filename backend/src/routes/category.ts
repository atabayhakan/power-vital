import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { authenticateJWT, requireRole } from '../middleware/auth';
import prisma from '../lib/prisma';
import { translateOnSave } from '../i18n/TranslationCenter';
import { validate, CategoryCreateSchema, CategoryUpdateSchema, IdParamSchema } from '../validators';
import { logger } from '../utils/logger';
import { getCache, setCache, deleteCache } from '../utils/redis';

const router = Router();

const expandCategory = (c: any, lang?: string) => {
  if (!c) return c;
  let translations: any = {};
  try { translations = typeof c.translations === 'string' ? JSON.parse(c.translations) : (c.translations || {}); } catch (e) {}
  let name = c.name;
  
  if (lang && translations[lang]) {
    if (translations[lang].name) name = translations[lang].name;
  }
  
  return {
    ...c,
    name
  };
};

// GET /api/v1/categories
router.get('/', async (req: Request, res: Response) => {
  try {
    // Categories change rarely (admin adds maybe a few per month) but the
    // storefront nav + filters hit this on every page. Cache for 5 minutes
    // + emit an ETag so the second onward visits get a 304.
    const cached = await getCache<{ payload: any[]; etag: string }>('categories:list:v1');
    if (cached) {
      const ifNoneMatch = req.header('If-None-Match');
      if (ifNoneMatch && ifNoneMatch === cached.etag) {
        res.set('ETag', cached.etag);
        res.set('Cache-Control', 'public, max-age=120');
        return res.status(304).end();
      }
      res.set('ETag', cached.etag);
      res.set('Cache-Control', 'public, max-age=120');
      return res.json(cached.payload);
    }

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } }
    });
    const payload = categories.map(c => expandCategory(c, req.headers['accept-language'] as string));

    const etag = '"' + crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex') + '"';
    await setCache('categories:list:v1', { payload, etag }, 300);
    res.set('ETag', etag);
    res.set('Cache-Control', 'public, max-age=120');
    res.json(payload);
  } catch (error) {
    logger.error({ err: error }, 'Fetch Categories Error:');
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/v1/categories
router.post('/', authenticateJWT, requireRole('admin'), validate({ body: CategoryCreateSchema }), async (req: Request, res: Response) => {
  try {
    const { name, slug, iconEmoji, imageUrl, sortOrder, translations } = req.body;
    const category = await prisma.category.create({
      data: { name, slug, iconEmoji, imageUrl, sortOrder: sortOrder || 0, translations: translations !== undefined ? (typeof translations === 'string' ? translations : JSON.stringify(translations)) : null }
    });
    translateOnSave('Category', category.id);
    res.status(201).json(expandCategory(category, req.headers['accept-language'] as string));
    deleteCache('categories:list:v1').catch(() => {});
  } catch (error) {
    logger.error({ err: error }, 'Create Category Error:');
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/v1/categories/:id
router.put('/:id', authenticateJWT, requireRole('admin'), validate({ body: CategoryUpdateSchema, params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { name, slug, iconEmoji, imageUrl, sortOrder, isActive, translations } = req.body;
    const { id } = req.params as { id: string };
    const category = await prisma.category.update({
      where: { id },
      data: { name, slug, iconEmoji, imageUrl, sortOrder, isActive, translations: translations !== undefined ? (typeof translations === 'string' ? translations : JSON.stringify(translations)) : null }
    });
    translateOnSave('Category', category.id);
    res.json(expandCategory(category, req.headers['accept-language'] as string));
    deleteCache('categories:list:v1').catch(() => {});
  } catch (error) {
    logger.error({ err: error }, 'Update Category Error:');
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/v1/categories/:id
router.delete('/:id', authenticateJWT, requireRole('admin'), validate({ params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Category deleted' });
    deleteCache('categories:list:v1').catch(() => {});
  } catch (error) {
    logger.error({ err: error }, 'Delete Category Error:');
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
