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

    const newCumulativeSpend = Number(settled._sum.totalKgs) || 0;

    // Fixed KGS loyalty thresholds
    // Level 1: 9 000 KGS  -> 5%
    // Level 2: 22 000 KGS -> 10%
    // Level 3: 44 000 KGS -> 15%
    // Level 4: 66 000 KGS -> 20%
    // Level 5: 88 000 KGS -> 25% + Distributor Evolution!

    let newLevel = 0;
    let newDiscount = 0.0;
    let newRole = 'customer';

    if (newCumulativeSpend >= 88000) {
      newLevel = 5;
      newDiscount = 25.0;
      newRole = 'distributor'; // 🚀 THE EVOLUTION TRIGGER
    } else if (newCumulativeSpend >= 66000) {
      newLevel = 4;
      newDiscount = 20.0;
    } else if (newCumulativeSpend >= 44000) {
      newLevel = 3;
      newDiscount = 15.0;
    } else if (newCumulativeSpend >= 22000) {
      newLevel = 2;
      newDiscount = 10.0;
    } else if (newCumulativeSpend >= 9000) {
      newLevel = 1;
      newDiscount = 5.0;
    }

    await prisma.user.update({
      where: { id: order.userId },
      data: {
        cumulativeSpendKgs: newCumulativeSpend,
        loyaltyLevel: newLevel,
        dynamicDiscountRate: newDiscount,
        role: newRole
      }
    });

    logger.info(`[Ascension] User ${order.userId} evolved to L${newLevel} (Spend: ${newCumulativeSpend.toFixed(2)} KGS)`);
  } catch (error) {
    logger.error({ err: error }, '[Ascension] Error:');
  }
}

// Recompute a user's career (loyalty level, discount, role) purely from the
// SUM of their currently-settled orders. Unlike handleOrderPaidAscension this
// has NO "customers only" guard, so it can also DEMOTE a user (e.g. a
// spend-evolved distributor whose qualifying order was reverted). Staff roles
// (admin/cashier) are never touched. Idempotent.
export async function recomputeUserCareer(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const isStaff = user.role === 'admin' || user.role === 'cashier';

  const settled = await prisma.order.aggregate({
    where: { userId, status: { in: ['paid', 'completed'] } },
    _sum: { totalKgs: true }
  });
  const spendKgs = Number(settled._sum.totalKgs) || 0;

  let level = 0, discount = 0.0, role = 'customer';
  if (spendKgs >= 88000) { level = 5; discount = 25.0; role = 'distributor'; }
  else if (spendKgs >= 66000) { level = 4; discount = 20.0; }
  else if (spendKgs >= 44000) { level = 3; discount = 15.0; }
  else if (spendKgs >= 22000) { level = 2; discount = 10.0; }
  else if (spendKgs >= 9000) { level = 1; discount = 5.0; }

  await prisma.user.update({
    where: { id: userId },
    data: {
      cumulativeSpendKgs: spendKgs,
      loyaltyLevel: level,
      dynamicDiscountRate: discount,
      ...(isStaff ? {} : { role }) // never demote admin/cashier
    }
  });
  logger.info(`[Career] Recomputed user ${userId} → L${level} (${spendKgs.toFixed(2)} KGS, role=${isStaff ? user.role : role})`);
}

// Revert ALL financial/career effects of an order: reset status to pending,
// claw back any MLM bonuses it distributed (wallet + ledger), and recompute the
// buyer's career. Idempotent — a second call won't double-claw the bonuses.
// Bonus transactions are matched by their description tag "Sipariş: <orderId>"
// (the worker stamps this), since Transaction has no orderId column.
export async function revertOrderEffects(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');

  let reversedBonusCount = 0;
  let reversedBonusKgs = 0;

  await prisma.$transaction(async (tx) => {
    // 1. Workflow state back to the start.
    await tx.order.update({ where: { id: orderId }, data: { status: 'pending' } });

    // 2. Claw back bonuses — only if not already reversed (idempotent).
    const already = await tx.transaction.count({
      where: { type: 'bonus_reversal', description: { contains: orderId } }
    });
    if (already === 0) {
      const bonuses = await tx.transaction.findMany({
        where: { type: 'bonus', description: { contains: `Sipariş: ${orderId}` } }
      });
      for (const b of bonuses) {
        const amt = Number(b.amount);
        // Allow the balance to go negative (debt) — authoritative accounting.
        await tx.user.update({
          where: { id: b.userId },
          data: { walletBalanceKgs: { decrement: amt } }
        });
        await tx.transaction.create({
          data: {
            userId: b.userId,
            type: 'bonus_reversal',
            amount: -amt,
            currency: b.currency,
            description: `İade — geri alınan prim - Sipariş: ${orderId}`
          }
        });
        reversedBonusCount++;
        reversedBonusKgs += amt;
      }
    }
  });

  // 3. Recompute the buyer's career from their remaining settled orders.
  if (order.userId) {
    await recomputeUserCareer(order.userId).catch((e) => logger.error({ err: e }, '[Revert] career recompute failed'));
  }

  logger.info(`[Revert] Order ${orderId}: status→pending, reversed ${reversedBonusCount} bonus tx (${reversedBonusKgs.toFixed(2)} KGS)`);
  return { reversedBonusCount, reversedBonusKgs };
}
