import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { updateExchangeRates, fetchRateFromProvider } from '../services/exchangeRate';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/finance/exchange-rate
 * Public — returns the current USD→KGS rate (from DB if fresh, else triggers fetch).
 * Query param: ?refresh=true forces a fresh API call.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const forceRefresh = req.query.refresh === 'true';

    if (forceRefresh) {
      // Try to fetch from provider, but fall back to DB if it fails
      try {
        const result = await fetchRateFromProvider('USD');
        if (result.success && result.rate) {
          await prisma.exchangeRate.upsert({
            where: { currency: 'USD' },
            update: { rateToKgs: result.rate },
            create: { currency: 'USD', rateToKgs: result.rate }
          });
          return res.json({
            rate: result.rate,
            source: result.source,
            updatedAt: new Date().toISOString(),
            fresh: true
          });
        }
      } catch (e) {
        // Fall through to DB
      }
    }

    const row = await prisma.exchangeRate.findUnique({ where: { currency: 'USD' } });
    if (!row) {
      // No record yet — attempt one fetch
      try {
        const result = await fetchRateFromProvider('USD');
        if (result.success && result.rate) {
          await prisma.exchangeRate.upsert({
            where: { currency: 'USD' },
            update: { rateToKgs: result.rate },
            create: { currency: 'USD', rateToKgs: result.rate }
          });
          return res.json({
            rate: result.rate,
            source: result.source,
            updatedAt: new Date().toISOString(),
            fresh: true
          });
        }
      } catch (e) {}
      return res.status(404).json({ error: 'No exchange rate available' });
    }

    res.json({
      rate: Number(row.rateToKgs),
      source: 'cache',
      updatedAt: row.updatedAt.toISOString(),
      fresh: false
    });
  } catch (error) {
    logger.error({ err: error }, 'Exchange rate fetch error:');
    res.status(500).json({ error: 'Failed to fetch exchange rate' });
  }
});

/**
 * POST /api/v1/finance/exchange-rate/refresh
 * Admin only — manually triggers an exchange rate fetch from the provider.
 * Returns { rate, source, message }.
 */
router.post('/refresh', authenticateJWT, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const result = await fetchRateFromProvider('USD');
    if (!result.success || !result.rate) {
      return res.status(502).json({
        error: 'Provider fetch failed',
        message: result.error || 'Unknown error',
        tried: result.tried
      });
    }
    await prisma.exchangeRate.upsert({
      where: { currency: 'USD' },
      update: { rateToKgs: result.rate },
      create: { currency: 'USD', rateToKgs: result.rate }
    });
    res.json({
      rate: result.rate,
      source: result.source,
      message: `Kur başarıyla güncellendi: 1 USD = ${result.rate} KGS (Kaynak: ${result.source})`,
      updatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Manual rate refresh error:');
    res.status(500).json({ error: 'Failed to refresh rate: ' + (error.message || 'unknown') });
  }
});

/**
 * GET /api/v1/finance/exchange-rate/history
 * Returns the last N rate snapshots (from ExchangeRate table — only the most recent
 * one is stored, so this is a single-row view, but the schema is ready for full history).
 */
router.get('/history', authenticateJWT, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const rates = await prisma.exchangeRate.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 30
    });
    res.json({ rates });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
