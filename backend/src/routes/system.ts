import { Router, Request, Response } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import prisma from '../lib/prisma';
import { setCache, getCache } from '../utils/redis';
import { validate, SystemConfigUpdateSchema } from '../validators';
import { logger } from '../utils/logger';

const router = Router();

// ═══ GET /api/v1/system/mlm-status — Public (Redis-cached) ═══
router.get('/mlm-status', async (req: Request, res: Response) => {
  try {
    // Check Redis first
    const cached = await getCache<{ isMlmEnabled: boolean }>('cache:mlmStatus');
    if (cached !== null) return res.json(cached);

    // Fallback to DB
    let config = await prisma.systemConfig.findFirst();
    if (!config) config = await prisma.systemConfig.create({ data: {} });
    
    const status = { isMlmEnabled: config.isMlmEnabled };
    await setCache('cache:mlmStatus', status, 300); // Cache 5 min
    res.json(status);
  } catch (error) {
    res.json({ isMlmEnabled: false }); // Safe default
  }
});

// GET /api/v1/system/config - Fetch limits and toggles
router.get('/config', authenticateJWT, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    let config = await prisma.systemConfig.findFirst();
    if (!config) {
      config = await prisma.systemConfig.create({ data: {} });
    }

    // Get aggregated stats for the dashboard
    // 🛡️ CANCELLED-EXCLUSION: cancelled orders must NOT count as revenue,
    // otherwise the payout ratio (bonus / revenue) is artificially deflated
    // and safety lock limits are miscalculated.
    const revenueAgg = await prisma.order.aggregate({
      where: { status: { not: 'cancelled' } },
      _sum: { totalKgs: true }
    });
    const totalRevenue = Number(revenueAgg._sum.totalKgs || 0);

    const bonusAgg = await prisma.transaction.aggregate({
      where: { type: 'bonus' },
      _sum: { amount: true }
    });
    const totalBonus = Number(bonusAgg._sum.amount || 0);

    const currentPayoutRatio = totalRevenue > 0 ? (totalBonus / totalRevenue) * 100 : 0;

    res.json({
      config,
      stats: {
        totalRevenue,
        totalBonus,
        currentPayoutRatio: currentPayoutRatio.toFixed(2)
      }
    });

  } catch (error: any) {
    logger.error({ err: error }, 'Fetch System Config Error:');
    res.status(500).json({ error: 'Failed to fetch system config' });
  }
});

// PUT /api/v1/system/config
router.put('/config', authenticateJWT, requireRole('admin'), validate({ body: SystemConfigUpdateSchema }), async (req: Request, res: Response) => {
  try {
    const {
      isMlmEnabled,
      maxPayoutLimitPct,
      isFastStartActive,
      fastStartRates,
      isUnilevelActive,
      unilevelRates,
      isOverdriveActive,
      overdrivePoolPct
    } = req.body as {
      isMlmEnabled?: boolean; maxPayoutLimitPct?: number;
      isFastStartActive?: boolean; fastStartRates?: string | number[];
      isUnilevelActive?: boolean; unilevelRates?: string | number[];
      isOverdriveActive?: boolean; overdrivePoolPct?: number;
    };

    // DB stores the rate arrays as JSON strings — coerce here so the API can
    // accept either a JSON string ("[10,5,2]") or a raw number array.
    const toRatesString = (v: string | number[] | undefined, fallback: string): string => {
      if (v === undefined) return fallback;
      return Array.isArray(v) ? JSON.stringify(v) : v;
    };

    const existing = await prisma.systemConfig.findFirst();
    let config;

    if (existing) {
      config = await prisma.systemConfig.update({
        where: { id: existing.id },
        data: {
          isMlmEnabled: isMlmEnabled !== undefined ? isMlmEnabled : existing.isMlmEnabled,
          maxPayoutLimitPct: maxPayoutLimitPct !== undefined ? maxPayoutLimitPct : existing.maxPayoutLimitPct,
          isFastStartActive: isFastStartActive !== undefined ? isFastStartActive : existing.isFastStartActive,
          fastStartRates: fastStartRates !== undefined ? toRatesString(fastStartRates, existing.fastStartRates) : existing.fastStartRates,
          isUnilevelActive: isUnilevelActive !== undefined ? isUnilevelActive : existing.isUnilevelActive,
          unilevelRates: unilevelRates !== undefined ? toRatesString(unilevelRates, existing.unilevelRates) : existing.unilevelRates,
          isOverdriveActive: isOverdriveActive !== undefined ? isOverdriveActive : existing.isOverdriveActive,
          overdrivePoolPct: overdrivePoolPct !== undefined ? overdrivePoolPct : existing.overdrivePoolPct
        }
      });
    } else {
      config = await prisma.systemConfig.create({
        data: {
          isMlmEnabled: isMlmEnabled !== undefined ? isMlmEnabled : true,
          maxPayoutLimitPct: maxPayoutLimitPct || 30.00,
          isFastStartActive: isFastStartActive !== undefined ? isFastStartActive : true,
          fastStartRates: toRatesString(fastStartRates, '[10, 5, 2]'),
          isUnilevelActive: isUnilevelActive !== undefined ? isUnilevelActive : true,
          unilevelRates: toRatesString(unilevelRates, '[5, 5, 5, 5, 5]'),
          isOverdriveActive: isOverdriveActive !== undefined ? isOverdriveActive : true,
          overdrivePoolPct: overdrivePoolPct || 5.00
        }
      });
    }

    // ANTIGRAVITY: Update Redis Cache immediately!
    await setCache('cache:systemConfig', config);
    await setCache('cache:mlmStatus', { isMlmEnabled: config.isMlmEnabled }, 300);

    res.json(config);
  } catch (error) {
    logger.error({ err: error }, 'Update System Config Error:');
    res.status(500).json({ error: 'Failed to update system config' });
  }
});

// POST /api/v1/system/close-week - Weekly Closing
router.post('/close-week', authenticateJWT, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const activeCycle = await prisma.weeklyCycle.findFirst({
      where: { isClosed: false },
      orderBy: { startDate: 'desc' }
    });

    if (!activeCycle) return res.status(400).json({ error: 'No active week found.' });

    await prisma.$transaction(async (tx) => {
      // 1. Close current week
      await tx.weeklyCycle.update({
        where: { id: activeCycle.id },
        data: { isClosed: true, endDate: new Date() }
      });

      // 2. Open new week
      const newWeekNumber = activeCycle.weekNumber + 1;
      const newCycle = await tx.weeklyCycle.create({
        data: {
          weekNumber: newWeekNumber,
          year: new Date().getFullYear(),
          startDate: new Date()
        }
      });

      // 3. Process carry-over points for all stats in the closed week
      const closedStats = await tx.userWeeklyStats.findMany({
        where: { cycleId: activeCycle.id }
      });

      for (const stat of closedStats) {
        // Carry over everything for the MVP (in real MLM, there's logic on matching points)
        const carry = Number(stat.personalVolume) + Number(stat.teamVolume) + Number(stat.carryOverVolume);
        if (carry > 0) {
          await tx.userWeeklyStats.create({
            data: {
              userId: stat.userId,
              cycleId: newCycle.id,
              carryOverVolume: carry
            }
          });
        }
      }
    });

    res.json({ message: 'Week closed successfully. New week started. Points carried over.' });
  } catch (error: any) {
    logger.error({ err: error }, 'Close Week Error:');
    res.status(500).json({ error: 'Failed to close week' });
  }
});

export default router;
