import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../lib/prisma';
import { getCache, setCache } from '../utils/redis';
import { logger } from '../utils/logger';

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null
});


export const bonusWorker = new Worker('bonusCalculationQueue', async (job: Job) => {
  const { orderId, purchaserId, amountKgs, sponsorId: jobSponsorId } = job.data;
  logger.info(`[Worker] Processing Antigravity bonus for order ${orderId}`);

  try {
    // 1. Fetch System Configuration
    let config = await getCache<any>('cache:systemConfig');
    if (!config) {
      config = await prisma.systemConfig.findFirst();
      if (!config) {
        config = await prisma.systemConfig.create({ data: {} });
      } else {
        await setCache('cache:systemConfig', config);
      }
    }

    // ═══ MLM KILL SWITCH ═══
    if (!config.isMlmEnabled) {
      logger.info(`[Worker] MLM is DISABLED. Skipping bonus for order ${orderId}.`);
      return;
    }

    const orderAmount = Number(amountKgs);

    // 2. Safety Lock Check: Calculate Global 30% Limit
    // Aggregate total company revenue (cancelled orders excluded — otherwise
    // they deflate the payout ratio and can prematurely trip the safety lock).
    const revenueAgg = await prisma.order.aggregate({
      where: { status: { not: 'cancelled' } },
      _sum: { totalKgs: true }
    });
    const totalRevenue = Number(revenueAgg._sum.totalKgs || 0);

    // Aggregate total distributed bonus
    const bonusAgg = await prisma.transaction.aggregate({
      where: { type: 'bonus' },
      _sum: { amount: true }
    });
    const totalBonus = Number(bonusAgg._sum.amount || 0);

    const limitPct = Number(config.maxPayoutLimitPct);
    const currentPayoutRatio = totalRevenue > 0 ? (totalBonus / totalRevenue) * 100 : 0;

    if (currentPayoutRatio >= limitPct) {
      logger.warn(`[Worker] SAFETY LOCK TRIGGERED! Current payout ratio is ${currentPayoutRatio.toFixed(2)}% (Max: ${limitPct}%). Bonus suspended.`);
      // We could store it in a 'pending_bonus' table, but for MVP we skip
      return;
    }

    // 3. Find the purchaser (can be real user or guest ID like GUEST_Nurlan)
    let sponsorId = jobSponsorId || null;

    if (!sponsorId && !purchaserId.startsWith('GUEST_')) {
      const purchaser = await prisma.user.findUnique({
        where: { id: purchaserId }
      });
      if (purchaser && purchaser.sponsorId) {
        sponsorId = purchaser.sponsorId;
      }
    }

    if (!sponsorId) {
      logger.info(`[Worker] No sponsor found for purchaser ${purchaserId}. Skip direct bonus.`);
    }

    // 4. Calculate Modules based on Toggles
    let totalToDistribute = 0;

    await prisma.$transaction(async (tx) => {
      // Module 1: Fast Start / Direct Referral Bonus
      const fastStartRates: number[] = Array.isArray(config!.fastStartRates) ? config!.fastStartRates : JSON.parse(config!.fastStartRates || '[10, 5, 2]');
      if (config!.isFastStartActive && sponsorId) {
        const directBonus = orderAmount * ((fastStartRates[0] || 10) / 100);
        totalToDistribute += directBonus;

        const sponsor = await tx.user.findUnique({ where: { id: sponsorId } });
        if (sponsor) {
          await tx.user.update({
            where: { id: sponsor.id },
            data: { walletBalanceKgs: Number(sponsor.walletBalanceKgs) + directBonus }
          });
          await tx.transaction.create({
            data: {
              userId: sponsor.id,
              type: 'bonus',
              amount: directBonus,
              currency: 'KGS',
              description: `Referans Primi (%10) - Sipariş: ${orderId}`
            }
          });
        }
      }

      // Module 2: Unilevel Team Bonus (spread over configured levels)
      const unilevelRates: number[] = Array.isArray(config!.unilevelRates) ? config!.unilevelRates : JSON.parse(config!.unilevelRates || '[5, 5, 5, 5, 5]');
      if (config!.isUnilevelActive && sponsorId) {
        let currentSponsorId: string | null = sponsorId;
        const levels = unilevelRates.map((r: number) => r / 100);
        
        for (let i = 0; i < levels.length; i++) {
          if (!currentSponsorId) break;
          const upline: any = await tx.user.findUnique({ where: { id: currentSponsorId }});
          if (!upline) break;

          const levelBonus = orderAmount * levels[i];
          totalToDistribute += levelBonus;

          await tx.user.update({
            where: { id: upline.id },
            data: { walletBalanceKgs: Number(upline.walletBalanceKgs) + levelBonus }
          });
          await tx.transaction.create({
            data: {
              userId: upline.id,
              type: 'bonus',
              amount: levelBonus,
              currency: 'KGS',
              description: `Derinlik Primi (Level ${i+1}) - Sipariş: ${orderId}`
            }
          });

          currentSponsorId = upline.sponsorId; // Move up the tree
        }
      }
    });

    // Module 3: Overdrive Pool is calculated monthly, not per order!
    // We just note that the system will aggregate 5% of this order for the Overdrive Pool at the end of the month.

    logger.info(`[Worker] Distributed total ${totalToDistribute} KGS. New Payout Ratio: ${currentPayoutRatio.toFixed(2)}%`);

  } catch (error) {
    logger.error({ err: error }, `[Worker] Error processing job ${job.id}:`);
    throw error;
  }
}, { connection: connection as any });

bonusWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} has failed with ${err.message}`);
});
