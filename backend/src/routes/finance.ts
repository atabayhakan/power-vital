import { Router, Request, Response } from 'express';
import { PrismaClient } from '../../prisma/generated/client';
import { authenticateJWT } from '../middleware/auth';
import { addBonusCalculationJob } from '../queues/bonusQueue';

const router = Router();
const prisma = new PrismaClient({});

// /api/v1/finance/wallet - Get Wallet Balances
router.get('/wallet', authenticateJWT, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalanceKgs: true, walletBalanceUsd: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// /api/v1/finance/wallet/pay - Process Payment via Digital Wallet (POS or E-Commerce)
router.post('/wallet/pay', authenticateJWT, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { orderType, amountKgs, productIds } = req.body;

    if (!amountKgs || amountKgs <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Start a transaction to ensure atomic deduct
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');
      
      const currentBalance = Number(user.walletBalanceKgs);
      if (currentBalance < amountKgs) {
        throw new Error('Insufficient wallet balance');
      }

      // Deduct balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { walletBalanceKgs: currentBalance - amountKgs }
      });

      // Record transaction
      const transactionRecord = await tx.transaction.create({
        data: {
          userId,
          type: 'purchase',
          amount: amountKgs,
          currency: 'KGS',
          description: `Payment for ${orderType} order`
        }
      });

      // Create Order
      const order = await tx.order.create({
        data: {
          userId,
          orderType: orderType || 'ecommerce',
          status: 'completed',
          totalKgs: amountKgs,
          totalUsd: 0, // In a real system, calculate USD equivalent based on ExchangeRate
          paymentMethod: 'wallet',
        }
      });

      return { order, transactionRecord, newBalance: updatedUser.walletBalanceKgs };
    });

    // Fire & Forget Asynchronous Job (Antigravity Architecture)
    // Send background task to calculate network bonus
    await addBonusCalculationJob(result.order.id, userId, amountKgs);

    res.json({ message: 'Payment successful', data: result });
  } catch (error: any) {
    console.error('Payment Error:', error);
    res.status(400).json({ error: error.message || 'Payment processing failed' });
  }
});

export default router;
