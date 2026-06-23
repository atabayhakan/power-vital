import prisma from '../lib/prisma';
import { logger } from '../utils/logger';


export async function handleOrderPaidAscension(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!order || !order.userId || !order.user) return; // Guests or anonymous orders don't ascend

    // Only customers ascend
    if (order.user.role !== 'customer') return;

    // We assume the total was in KGS. Let's get the latest USD rate to normalize the spend.
    const exchangeRate = await prisma.exchangeRate.findUnique({ where: { currency: 'USD' } });
    const rateToKgs = exchangeRate ? Number(exchangeRate.rateToKgs) : 88.0;

    // ⚠️ IDEMPOTENT: Recompute cumulative spend from the SUM of all settled orders
    // instead of incrementally adding this order's value. This prevents double-counting
    // when an order transitions to "paid" more than once (e.g. order.ts status change
    // AND checkout OCR verify both call this, or admin toggles paid→shipped→paid).
    const settled = await prisma.order.aggregate({
      where: {
        userId: order.userId,
        status: { in: ['paid', 'completed'] }
      },
      _sum: { totalKgs: true }
    });

    const totalSettledKgs = Number(settled._sum.totalKgs) || 0;
    const newCumulativeSpend = totalSettledKgs / rateToKgs;

    // Define the 5-Level Thresholds
    // Level 1: $100 -> 5%
    // Level 2: $250 -> 10%
    // Level 3: $500 -> 15%
    // Level 4: $750 -> 20%
    // Level 5: $1000 -> 25% + Distributor Evolution!

    let newLevel = 0;
    let newDiscount = 0.0;
    let newRole = 'customer';

    if (newCumulativeSpend >= 1000) {
      newLevel = 5;
      newDiscount = 25.0;
      newRole = 'distributor'; // 🚀 THE EVOLUTION TRIGGER
    } else if (newCumulativeSpend >= 750) {
      newLevel = 4;
      newDiscount = 20.0;
    } else if (newCumulativeSpend >= 500) {
      newLevel = 3;
      newDiscount = 15.0;
    } else if (newCumulativeSpend >= 250) {
      newLevel = 2;
      newDiscount = 10.0;
    } else if (newCumulativeSpend >= 100) {
      newLevel = 1;
      newDiscount = 5.0;
    }

    await prisma.user.update({
      where: { id: order.userId },
      data: {
        cumulativeSpendUsd: newCumulativeSpend,
        loyaltyLevel: newLevel,
        dynamicDiscountRate: newDiscount,
        role: newRole
      }
    });

    logger.info(`[Ascension] User ${order.userId} evolved to L${newLevel} (Spend: $${newCumulativeSpend.toFixed(2)})`);
  } catch (error) {
    logger.error({ err: error }, '[Ascension] Error:');
  }
}
