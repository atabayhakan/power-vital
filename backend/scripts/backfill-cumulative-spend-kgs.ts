// One-time production migration: recompute each user's cumulativeSpendKgs
// (loyalty level + discount rate along with it) from their real order
// history, now that the pricing system is KGS-only.
//
// Why this can't be a plain column rename: the old cumulativeSpendUsd was
// derived by dividing KGS order totals by that day's live exchange rate —
// a moving target. Order.totalKgs, however, was ALWAYS the actual settled
// KGS amount (native currency for Kyrgyzstan orders), independent of the
// removed USD/exchange-rate machinery. So the correct KGS spend for any
// user is simply the sum of totalKgs across their settled orders — exactly
// what ascensionService.recomputeUserCareer() already computes for live
// order events. This script just runs that same, single-source-of-truth
// logic once for every existing user.
//
// Safe to re-run (idempotent, recomputes from scratch each time). Staff
// roles (admin/cashier) are never demoted — same guard as recomputeUserCareer.
//
// Usage:
//   npx tsx scripts/backfill-cumulative-spend-kgs.ts            (dry run — prints diffs, writes nothing)
//   npx tsx scripts/backfill-cumulative-spend-kgs.ts --apply     (writes the recomputed values)

import prisma from '../src/lib/prisma';
import { recomputeUserCareer } from '../src/services/ascensionService';

const APPLY = process.argv.includes('--apply');

const levelFor = (spendKgs: number): { level: number; discount: number; role: string } => {
  if (spendKgs >= 88000) return { level: 5, discount: 25.0, role: 'distributor' };
  if (spendKgs >= 66000) return { level: 4, discount: 20.0, role: 'customer' };
  if (spendKgs >= 44000) return { level: 3, discount: 15.0, role: 'customer' };
  if (spendKgs >= 22000) return { level: 2, discount: 10.0, role: 'customer' };
  if (spendKgs >= 9000) return { level: 1, discount: 5.0, role: 'customer' };
  return { level: 0, discount: 0.0, role: 'customer' };
};

const main = async () => {
  console.log(APPLY ? 'Running in APPLY mode — user records will be updated.' : 'Running in DRY-RUN mode — no writes. Pass --apply to commit.');

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, cumulativeSpendKgs: true, loyaltyLevel: true }
  });

  console.log(`${users.length} user(s) found.`);

  let changed = 0, unchanged = 0;

  for (const user of users) {
    const isStaff = user.role === 'admin' || user.role === 'cashier';

    const settled = await prisma.order.aggregate({
      where: { userId: user.id, status: { in: ['paid', 'completed'] } },
      _sum: { totalKgs: true }
    });
    const newSpend = Number(settled._sum.totalKgs) || 0;
    const { level: newLevel, discount: newDiscount, role: computedRole } = levelFor(newSpend);
    const newRole = isStaff ? user.role : computedRole;

    const oldSpend = Number(user.cumulativeSpendKgs) || 0;
    const oldLevel = user.loyaltyLevel;

    if (Math.round(newSpend) !== Math.round(oldSpend) || newLevel !== oldLevel || newRole !== user.role) {
      changed++;
      console.log(
        `[${changed}] ${user.email} (${user.name}): ` +
        `spend ${oldSpend.toFixed(2)} → ${newSpend.toFixed(2)} KGS, ` +
        `level ${oldLevel} → ${newLevel}, role ${user.role} → ${newRole}`
      );
      if (APPLY) {
        await recomputeUserCareer(user.id);
      }
    } else {
      unchanged++;
    }
  }

  console.log(`\nDone. ${changed} user(s) would change (or changed), ${unchanged} already correct.`);
  if (!APPLY && changed > 0) {
    console.log('Re-run with --apply to commit these changes.');
  }
};

main()
  .catch((e) => {
    console.error('fatal', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
