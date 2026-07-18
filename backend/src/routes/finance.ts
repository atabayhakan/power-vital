import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateJWT } from '../middleware/auth';
import { addBonusCalculationJob } from '../queues/bonusQueue';
import { validate, WalletPaySchema, WithdrawSchema, PaginationQuerySchema } from '../validators';
import { notifyWithdrawalRequest } from '../services/notificationService';
import { adminEvents } from './adminEvents';
import { logger } from '../utils/logger';
import { envelope, parsePagination } from '../utils/paginate';

const router = Router();

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
router.post('/wallet/pay', authenticateJWT, validate({ body: WalletPaySchema }), async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { orderType, amountKgs, productIds } = req.body as { orderType?: string; amountKgs: number; productIds?: string[] };

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
    logger.error({ err: error }, 'Payment Error:');
    res.status(400).json({ error: error.message || 'Payment processing failed' });
  }
});

// POST /api/v1/finance/withdraw - Create a withdrawal request
router.post('/withdraw', authenticateJWT, validate({ body: WithdrawSchema }), async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { amount, currency, bankInfo } = req.body as { amount: number; currency?: 'KGS' | 'USD'; bankInfo?: string | null };

    const cur = currency === 'USD' ? 'USD' : 'KGS';
    const balanceField = cur === 'USD' ? 'walletBalanceUsd' : 'walletBalanceKgs';
    const withdrawAmount = Number(amount);

    // 🛡️ ATOMIC: Bakiye düşümü ve kayıt oluşturma tek transaction içinde
    // Bu sayede aynı bakiye ile birden fazla çekim talebi engellenir (double-spend fix)
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      const currentBalance = Number(user[balanceField]);
      if (currentBalance < withdrawAmount) {
        throw new Error('Insufficient balance for withdrawal');
      }

      // Atomic bakiye düşümü
      await tx.user.update({
        where: { id: userId },
        data: { [balanceField]: { decrement: withdrawAmount } }
      });

      // Transaction log
      await tx.transaction.create({
        data: {
          userId,
          type: 'withdrawal',
          amount: withdrawAmount,
          currency: cur,
          description: 'Withdrawal request (pending)'
        }
      });

      // Withdrawal request
      const withdrawal = await tx.withdrawalRequest.create({
        data: {
          userId,
          amount: withdrawAmount,
          currency: cur,
          status: 'pending',
          bankInfo: bankInfo || null
        }
      });

      return withdrawal;
    });

    res.status(201).json({ message: 'Withdrawal request created', withdrawal: result });

    // Notify admins of a new withdrawal request (fire-and-forget)
    notifyWithdrawalRequest(withdrawAmount, cur).catch(() => {});
    adminEvents.publish({
      type: 'withdrawal_request',
      data: { amount: withdrawAmount, currency: cur, userId: req.user?.id }
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Withdrawal Error:');
    const status = error.message === 'Insufficient balance for withdrawal' ? 400 : 500;
    res.status(status).json({ error: error.message || 'Failed to create withdrawal request' });
  }
});

// GET /api/v1/finance/withdrawals - Authenticated user's OWN withdrawal requests
router.get('/withdrawals', authenticateJWT, validate({ query: PaginationQuerySchema }), async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { page, limit, skip, take } = parsePagination(req.query as any);

    // 🛡️ Sadece güvenli alanlar döner (select whitelist) ve where koşulundaki
    // userId sayesinde kullanıcı asla başkasının taleplerini göremez.
    const safeSelect = {
      id: true, amount: true, currency: true, status: true,
      bankInfo: true, createdAt: true, updatedAt: true
    } as const;

    const [requests, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where: { userId },
        select: safeSelect,
        orderBy: { createdAt: 'desc' },
        skip, take
      }),
      prisma.withdrawalRequest.count({ where: { userId } })
    ]);

    res.json(envelope(requests, total, page, limit));
  } catch (error: any) {
    logger.error({ err: error }, 'Withdrawals List Error:');
    res.status(500).json({ error: 'Failed to fetch withdrawal requests' });
  }
});

// GET /api/v1/finance/transactions - User transaction history
router.get('/transactions', authenticateJWT, validate({ query: PaginationQuerySchema }), async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { page, limit, skip, take } = parsePagination(req.query as any);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip, take
      }),
      prisma.transaction.count({ where: { userId } })
    ]);

    res.json(envelope(transactions, total, page, limit));
  } catch (error: any) {
    logger.error({ err: error }, 'Transactions Error:');
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

export default router;
