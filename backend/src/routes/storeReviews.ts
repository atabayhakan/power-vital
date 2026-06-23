import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { translateOnSave } from '../i18n/TranslationCenter';
import { validate, StoreReviewSubmitSchema, ReviewStatusUpdateSchema, IdParamSchema } from '../validators';
import { limit, RATE_LIMITS } from '../utils/rateLimit';
import { logger } from '../utils/logger';
import { envelope, parsePagination } from '../utils/paginate';
import { getCache, setCache, deleteCache } from '../utils/redis';

const router = Router();

// ------------------------------------------------------------------
// STOREFRONT: Public / Customer Routes
// ------------------------------------------------------------------

// POST /api/v1/store-reviews (Public - anyone can submit)
// 3/hour per user — spam guard
router.post('/', limit(RATE_LIMITS.reviews.submit), validate({ body: StoreReviewSubmitSchema }), async (req: Request, res: Response) => {
  try {
    const { name, rating, text } = req.body as { name: string; rating: number; text: string };
    const userId = (req as any).user?.id || null;

    const review = await prisma.storeReview.create({
      data: {
        userId,
        name,
        rating,
        text,
        status: 'pending' // Always pending on submission
      }
    });

    translateOnSave('StoreReview', review.id);
    // Invalidate the public listing cache so newly approved reviews show up
    // the next time someone hits the storefront. Pending reviews don't
    // appear in the public list, so this is best-effort.
    await deleteCache('storeReviews:list:v1');
    res.status(201).json({ message: 'Store review submitted for moderation', review });
  } catch (error) {
    logger.error({ err: error }, 'Submit store review error:');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/store-reviews (Public - returns only published)
router.get('/', async (req: Request, res: Response) => {
  try {
    const CACHE_KEY = 'storeReviews:list:v1';
    const cached = await getCache<{ payload: any[]; etag: string }>(CACHE_KEY);
    if (cached) {
      res.setHeader('ETag', cached.etag);
      res.setHeader('Cache-Control', 'public, max-age=120');
      res.setHeader('X-Cache', 'HIT');
      if (req.headers['if-none-match'] === cached.etag) {
        res.status(304).end();
        return;
      }
      res.json(cached.payload);
      return;
    }

    const reviews = await prisma.storeReview.findMany({
      where: {
        status: 'published'
      },
      orderBy: { createdAt: 'desc' }
    });

    const etag = `W/"store-reviews-${reviews.length}-${Date.now()}"`;
    await setCache(CACHE_KEY, { payload: reviews, etag }, 120);

    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.setHeader('X-Cache', 'MISS');
    res.json(reviews);
  } catch (error) {
    logger.error({ err: error }, 'Fetch store reviews error:');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ------------------------------------------------------------------
// ADMIN: Moderation Routes
// ------------------------------------------------------------------

// GET /api/v1/store-reviews/admin/all (Requires Admin)
router.get('/admin/all', authenticateJWT, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { page, limit, skip, take } = parsePagination(req.query as any, { limit: 50 });
    const [reviews, total] = await Promise.all([
      prisma.storeReview.findMany({
        orderBy: { createdAt: 'desc' },
        skip, take
      }),
      prisma.storeReview.count()
    ]);
    res.json(envelope(reviews, total, page, limit));
  } catch (error) {
    logger.error({ err: error }, 'Fetch all store reviews error:');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/store-reviews/admin/:id/status (Requires Admin)
router.put('/admin/:id/status', authenticateJWT, requireRole('admin'), validate({ body: ReviewStatusUpdateSchema, params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { status, translations } = req.body as { status?: string; translations?: string | Record<string, any> };

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;

    if (translations !== undefined) {
      dataToUpdate.translations = typeof translations === 'object' ? JSON.stringify(translations) : translations;
    }

    const review = await prisma.storeReview.update({
      where: { id },
      data: dataToUpdate
    });

    // Status changes (published <-> pending/hidden) flip the public list,
    // so the cached snapshot is no longer trustworthy.
    if (status !== undefined) {
      await deleteCache('storeReviews:list:v1');
    }

    res.json({ message: 'Store review updated', review });
  } catch (error) {
    logger.error({ err: error }, 'Update store review status error:');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/store-reviews/admin/:id (Requires Admin)
router.delete('/admin/:id', authenticateJWT, requireRole('admin'), validate({ params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.storeReview.delete({ where: { id } });
    await deleteCache('storeReviews:list:v1');
    res.json({ message: 'Store review deleted successfully' });
  } catch (error) {
    logger.error({ err: error }, 'Delete store review error:');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
