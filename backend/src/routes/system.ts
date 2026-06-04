import { Router, Request, Response } from 'express';
import { PrismaClient } from '../../prisma/generated/client';
import { setCache, getCache } from '../utils/redis';

const router = Router();
const prisma = new PrismaClient({});

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
router.get('/config', async (req: Request, res: Response) => {
  try {
    let config = await prisma.systemConfig.findFirst();
    if (!config) {
      config = await prisma.systemConfig.create({ data: {} });
    }

    // Get aggregated stats for the dashboard
    const revenueAgg = await prisma.order.aggregate({ _sum: { totalKgs: true } });
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
    console.error('Fetch System Config Error:', error);
    res.status(500).json({ error: 'Failed to fetch system config' });
  }
});

// PUT /api/v1/system/config
router.put('/config', async (req: Request, res: Response) => {
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
    } = req.body;

    const existing = await prisma.systemConfig.findFirst();
    let config;

    if (existing) {
      config = await prisma.systemConfig.update({
        where: { id: existing.id },
        data: {
          isMlmEnabled: isMlmEnabled !== undefined ? isMlmEnabled : existing.isMlmEnabled,
          maxPayoutLimitPct,
          isFastStartActive,
          fastStartRates: fastStartRates || [10, 5, 2],
          isUnilevelActive,
          unilevelRates: unilevelRates || [5, 5, 5, 5, 5],
          isOverdriveActive,
          overdrivePoolPct
        }
      });
    } else {
      config = await prisma.systemConfig.create({
        data: {
          isMlmEnabled: isMlmEnabled !== undefined ? isMlmEnabled : true,
          maxPayoutLimitPct: maxPayoutLimitPct || 30.00,
          isFastStartActive: isFastStartActive !== undefined ? isFastStartActive : true,
          fastStartRates: fastStartRates || [10, 5, 2],
          isUnilevelActive: isUnilevelActive !== undefined ? isUnilevelActive : true,
          unilevelRates: unilevelRates || [5, 5, 5, 5, 5],
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
    console.error('Update System Config Error:', error);
    res.status(500).json({ error: 'Failed to update system config' });
  }
});

// GET /api/v1/system/leaderboard - Olympics Run
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    // Get the current open cycle
    let activeCycle = await prisma.weeklyCycle.findFirst({
      where: { isClosed: false },
      orderBy: { startDate: 'desc' }
    });

    if (!activeCycle) {
      // Create week 1 if none exists
      activeCycle = await prisma.weeklyCycle.create({
        data: { weekNumber: 1, year: new Date().getFullYear(), startDate: new Date() }
      });
    }

    // Fetch user stats for this cycle, sorted by total volume (pv + gv + carryover)
    const stats = await prisma.userWeeklyStats.findMany({
      where: { cycleId: activeCycle.id },
      include: {
        user: { select: { id: true, name: true, role: true } }
      }
    });

    // Map and sort locally (since we need to sum decimal fields)
    const leaderboard = stats.map(s => {
      const pv = Number(s.personalVolume);
      const gv = Number(s.teamVolume);
      const carry = Number(s.carryOverVolume);
      return {
        userId: s.userId,
        name: s.user.name,
        role: s.user.role,
        score: pv + gv + carry,
        pv, gv, carry
      };
    }).sort((a, b) => b.score - a.score).slice(0, 5);

    // If empty (no sales yet), return some dummy data to show off the UI
    if (leaderboard.length === 0) {
      return res.json([
        { userId: '1', name: 'Nurlan B.', role: 'distributor', score: 15400, pv: 400, gv: 15000, carry: 0 },
        { userId: '2', name: 'Almaz K.', role: 'dealer', score: 12200, pv: 1200, gv: 11000, carry: 0 },
        { userId: '3', name: 'Aigerim T.', role: 'distributor', score: 9800, pv: 800, gv: 9000, carry: 0 },
      ]);
    }

    res.json(leaderboard);
  } catch (error: any) {
    console.error('Leaderboard Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// POST /api/v1/system/close-week - Weekly Closing
router.post('/close-week', async (req: Request, res: Response) => {
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
    console.error('Close Week Error:', error);
    res.status(500).json({ error: 'Failed to close week' });
  }
});

export default router;
