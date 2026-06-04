import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Connect to Redis (assuming a local instance or a cloud URL in env)
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null
});

// Create the Queue
export const bonusQueue = new Queue('bonusCalculationQueue', { connection: connection as any });

/**
 * Adds a job to calculate bonus for a sponsor when their downline makes a purchase.
 */
export const addBonusCalculationJob = async (orderId: string, purchaserId: string, amountKgs: number, sponsorId?: string) => {
  await bonusQueue.add('calculateBonus', {
    orderId,
    purchaserId,
    amountKgs,
    sponsorId
  });
  console.log(`[Queue] Added bonus job for order: ${orderId}`);
};
