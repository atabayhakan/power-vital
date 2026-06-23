import { Router, Request, Response } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import prisma from '../lib/prisma';
import { translateOnSave } from '../i18n/TranslationCenter';
import { validate, PageCreateSchema, PageUpdateSchema, IdParamSchema } from '../validators';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/v1/pages - List all pages
router.get('/', async (req: Request, res: Response) => {
  try {
    const pages = await prisma.page.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(pages);
  } catch (error) {
    logger.error({ err: error }, 'Pages GET Error:');
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

// GET /api/v1/pages/:slug - Get single page by slug
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const page = await prisma.page.findUnique({
      where: { slug: req.params.slug as string }
    });
    if (!page) return res.status(404).json({ error: 'Page not found' });
    res.json(page);
  } catch (error) {
    logger.error({ err: error }, 'Page GET Error:');
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

// POST /api/v1/pages - Create new page (Admin only)
router.post('/', authenticateJWT, requireRole('admin'), validate({ body: PageCreateSchema }), async (req: Request, res: Response) => {
  try {
    const { title, slug, content, status, translations } = req.body as { title: string; slug: string; content: string; status?: string; translations?: string | Record<string, any> | null };

    const existing = await prisma.page.findUnique({ where: { slug } });
    if (existing) return res.status(400).json({ error: 'Slug already exists' });

    const page = await prisma.page.create({
      data: {
        title,
        slug,
        content,
        status: status || 'published',
        translations: typeof translations === 'object' ? JSON.stringify(translations) : translations,
      }
    });
    translateOnSave('Page', page.id);
    res.status(201).json(page);
  } catch (error) {
    logger.error({ err: error }, 'Page POST Error:');
    res.status(500).json({ error: 'Failed to create page' });
  }
});

// PUT /api/v1/pages/:id - Update page (Admin only)
router.put('/:id', authenticateJWT, requireRole('admin'), validate({ body: PageUpdateSchema, params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { title, slug, content, status, translations } = req.body as { title?: string; slug?: string; content?: string; status?: string; translations?: string | Record<string, any> | null };
    const page = await prisma.page.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        status,
        translations: typeof translations === 'object' ? JSON.stringify(translations) : translations,
      }
    });
    translateOnSave('Page', page.id);
    res.json(page);
  } catch (error) {
    logger.error({ err: error }, 'Page PUT Error:');
    res.status(500).json({ error: 'Failed to update page' });
  }
});

// DELETE /api/v1/pages/:id - Delete page (Admin only)
router.delete('/:id', authenticateJWT, requireRole('admin'), validate({ params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.page.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Page DELETE Error:');
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

export default router;
