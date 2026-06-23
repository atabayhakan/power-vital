// Admin cart-recovery dashboard route. Aggregates:
//   • CartAbandonment (pending / notified / converted / expired)
//   • Presence (active viewers per product)
//   • Inventory FOMO counters (recent orders per product)
//
// Cached server-side for 15s (the aggregation touches several
// tables). The frontend polls every 30s so most admin pages see
// a fresh dashboard within one cycle of an order landing.

import { Router, Request, Response } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { getCartRecoveryKpis } from '../services/cartRecoveryAnalytics';
import { runSweepNow, sendReminderForRow } from '../services/cartAbandonmentService';
import { sendTestEmail, isEmailConfigured } from '../services/emailService';
import { logger } from '../utils/logger';

const router = Router();

router.get('/', authenticateJWT, requireRole('admin'), async (_req: Request, res: Response) => {
  try {
    const kpis = await getCartRecoveryKpis();
    res.json({ ...kpis, emailConfigured: isEmailConfigured() });
  } catch (err: any) {
    logger.error({ err }, 'admin cart-recovery kpis error:');
    res.status(500).json({ error: 'Failed to load cart-recovery metrics' });
  }
});

// POST /api/v1/admin/cart-recovery/sweep — manually trigger one sweeper tick
router.post('/sweep', authenticateJWT, requireRole('admin'), async (_req: Request, res: Response) => {
  try {
    const result = await runSweepNow();
    res.json({ ok: true, ...result });
  } catch (err: any) {
    logger.error({ err }, 'admin cart-recovery sweep error:');
    res.status(500).json({ error: err?.message || 'Sweep failed' });
  }
});

// POST /api/v1/admin/cart-recovery/:id/notify — send a single reminder now
router.post('/:id/notify', authenticateJWT, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const result = await sendReminderForRow(id);
    if (!result.ok) {
      return res.status(400).json({ ok: false, error: result.reason || 'failed' });
    }
    res.json({ ok: true, sentPush: result.sentPush, sentEmail: result.sentEmail });
  } catch (err: any) {
    logger.error({ err }, 'admin cart-recovery notify error:');
    res.status(500).json({ ok: false, error: err?.message || 'Notify failed' });
  }
});

// POST /api/v1/admin/cart-recovery/test-email
// body: { email: string, locale?: 'kg' | 'ru' | 'tr' | 'en' }
router.post('/test-email', authenticateJWT, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const body = req.body as { email?: string; locale?: 'kg' | 'ru' | 'tr' | 'en' };
    const email = String(body.email || '').trim();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'invalid_email' });
    }
    const locale = (['kg', 'ru', 'tr', 'en'].includes(String(body.locale)) ? body.locale : 'ru') as 'kg' | 'ru' | 'tr' | 'en';
    const result = await sendTestEmail(email, locale);
    res.json(result);
  } catch (err: any) {
    logger.error({ err }, 'admin cart-recovery test-email error:');
    res.status(500).json({ error: err?.message || 'Test email failed' });
  }
});

export default router;
