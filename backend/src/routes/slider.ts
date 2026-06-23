import { Router, Request, Response } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import prisma from '../lib/prisma';
import { translateOnSave } from '../i18n/TranslationCenter';
import { validate, HeroSlideCreateSchema, HeroSlideUpdateSchema, IdParamSchema } from '../validators';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/v1/slides - List active slides ordered by sortOrder
router.get('/', async (req: Request, res: Response) => {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });
    res.json(slides);
  } catch (error) {
    logger.error({ err: error }, 'Fetch Slides Error:');
    res.status(500).json({ error: 'Failed to fetch slides' });
  }
});

// GET /api/v1/slides/all - List ALL slides for admin
router.get('/all', authenticateJWT, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const slides = await prisma.heroSlide.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    res.json(slides);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slides' });
  }
});

// POST /api/v1/slides
router.post('/', authenticateJWT, requireRole('admin'), validate({ body: HeroSlideCreateSchema }), async (req: Request, res: Response) => {
  try {
    const { title, subtitle, buttonText, buttonLink, imageUrl, sortOrder, isActive, displayMode, mobileImageUrl, scheduledStart, scheduledEnd, overlayOpacity, translations } = req.body;
    const slide = await prisma.heroSlide.create({
      data: { 
        title, subtitle, buttonText, buttonLink, imageUrl, 
        sortOrder: sortOrder || 0, isActive: isActive !== false,
        displayMode: displayMode || 'IMAGE_ONLY',
        mobileImageUrl,
        scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
        overlayOpacity: overlayOpacity || 0,
        translations: typeof translations === 'object' ? JSON.stringify(translations) : translations
      }
    });
    translateOnSave('HeroSlide', slide.id);
    res.status(201).json(slide);
  } catch (error) {
    logger.error({ err: error }, 'Create Slide Error:');
    res.status(500).json({ error: 'Failed to create slide' });
  }
});

// PUT /api/v1/slides/:id
router.put('/:id', authenticateJWT, requireRole('admin'), validate({ body: HeroSlideUpdateSchema, params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { title, subtitle, buttonText, buttonLink, imageUrl, sortOrder, isActive, displayMode, mobileImageUrl, scheduledStart, scheduledEnd, overlayOpacity, translations } = req.body;
    const { id } = req.params as { id: string };
    const slide = await prisma.heroSlide.update({
      where: { id },
      data: { 
        title, subtitle, buttonText, buttonLink, imageUrl, sortOrder, isActive,
        displayMode, mobileImageUrl,
        scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
        overlayOpacity,
        translations: typeof translations === 'object' ? JSON.stringify(translations) : translations
      }
    });
    translateOnSave('HeroSlide', slide.id);
    res.json(slide);
  } catch (error) {
    logger.error({ err: error }, 'Update Slide Error:');
    res.status(500).json({ error: 'Failed to update slide' });
  }
});

// DELETE /api/v1/slides/:id
router.delete('/:id', authenticateJWT, requireRole('admin'), validate({ params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.heroSlide.delete({ where: { id } });
    res.json({ message: 'Slide deleted' });
  } catch (error) {
    logger.error({ err: error }, 'Delete Slide Error:');
    res.status(500).json({ error: 'Failed to delete slide' });
  }
});

export default router;
