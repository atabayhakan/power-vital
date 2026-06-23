import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { translateOnSave } from '../i18n/TranslationCenter';
import { validate, ReviewSubmitSchema, ReviewStatusUpdateSchema, IdParamSchema } from '../validators';
import { limit, RATE_LIMITS } from '../utils/rateLimit';
import { logger } from '../utils/logger';
import { envelope, parsePagination } from '../utils/paginate';
import { getCache, setCache } from '../utils/redis';

const router = Router();

// ------------------------------------------------------------------
// STOREFRONT: Public / Customer Routes
// ------------------------------------------------------------------

// POST /api/v1/reviews (Public - anyone can submit)
// 3/hour per user — spam guard
router.post('/', limit(RATE_LIMITS.reviews.submit), validate({ body: ReviewSubmitSchema }), async (req: Request, res: Response) => {
  try {
    const { productId, name, rating, text } = req.body as { productId: string; name: string; rating: number; text: string };
    const userId = (req as any).user?.id || null;

    const review = await prisma.productReview.create({
      data: {
        productId,
        userId,
        name,
        rating,
        text,
        status: 'pending' // Always pending on submission
      }
    });

    translateOnSave('ProductReview', review.id);
    res.status(201).json({ message: 'Review submitted for moderation', review });
  } catch (error) {
    logger.error({ err: error }, 'Submit review error:');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/reviews/product/:productId (Public - returns only published)
router.get('/product/:productId', async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const CACHE_KEY = `reviews:product:${productId}:v1`;

    const cached = await getCache<{ payload: any[]; etag: string }>(CACHE_KEY);
    if (cached) {
      res.setHeader('ETag', cached.etag);
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.setHeader('X-Cache', 'HIT');
      if (req.headers['if-none-match'] === cached.etag) {
        res.status(304).end();
        return;
      }
      res.json(cached.payload);
      return;
    }

    const reviews = await prisma.productReview.findMany({
      where: {
        productId,
        status: 'published'
      },
      orderBy: { createdAt: 'desc' }
    });

    const etag = `W/"reviews-${productId}-${reviews.length}-${Date.now()}"`;
    await setCache(CACHE_KEY, { payload: reviews, etag }, 60);

    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.setHeader('X-Cache', 'MISS');
    res.json(reviews);
  } catch (error) {
    logger.error({ err: error }, 'Fetch product reviews error:');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ------------------------------------------------------------------
// ADMIN: Moderation Routes
// ------------------------------------------------------------------

// GET /api/v1/reviews/admin/all (Requires Admin)
router.get('/admin/all', authenticateJWT, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { page, limit, skip, take } = parsePagination(req.query as any, { limit: 50 });
    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, barcode: true } }
        },
        skip, take
      }),
      prisma.productReview.count()
    ]);
    res.json(envelope(reviews, total, page, limit));
  } catch (error) {
    logger.error({ err: error }, 'Fetch all reviews error:');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/reviews/admin/:id/status (Requires Admin)
router.put('/admin/:id/status', authenticateJWT, requireRole('admin'), validate({ body: ReviewStatusUpdateSchema, params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { status, translations } = req.body as { status?: string; translations?: string | Record<string, any> };

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;

    if (translations !== undefined) {
      dataToUpdate.translations = typeof translations === 'object' ? JSON.stringify(translations) : translations;
    }

    const review = await prisma.productReview.update({
      where: { id },
      data: dataToUpdate
    });

    res.json({ message: 'Review updated', review });
  } catch (error) {
    logger.error({ err: error }, 'Update review status error:');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/reviews/admin/:id (Requires Admin)
router.delete('/admin/:id', authenticateJWT, requireRole('admin'), validate({ params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.productReview.delete({ where: { id } });
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    logger.error({ err: error }, 'Delete review error:');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
