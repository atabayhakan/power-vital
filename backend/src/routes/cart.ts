// Cart heartbeat + conversion endpoints.
//
// We don't actually persist the cart server-side (cartStore is a
// Pinia store in localStorage), but we DO want to track the
// "intent to buy" so the cart-abandonment sweeper can fire a
// localised push 1h later.
//
// Two endpoints:
//
//   POST /api/v1/cart/heartbeat
//     body: { items: CartItemSnapshot[], totals: { usd, kgs } }
//     side-effect: upsert CartAbandonment, bump lastActivityAt
//
//   POST /api/v1/cart/converted
//     side-effect: mark any pending row for this user/guest as
//                  'converted' (analytics)
//
// Both are best-effort: they NEVER block the cart UI. If the
// request fails (offline, server error) the cart still works
// locally, we just lose the reminder for this session.

import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { validate, CartHeartbeatSchema } from '../validators';
import { trackActivity, clearAbandonment, markConverted } from '../services/cartAbandonmentService';
import { logger } from '../utils/logger';

const router = Router();

// Cheap, internal rate limit — 30/min is plenty for a busy
// shopper tapping "add to cart" rapidly.
import { limit, RATE_LIMITS } from '../utils/rateLimit';
const heartbeatLimiter = limit({
  name: 'cart-heartbeat',
  windowSeconds: 60,
  max: 30,
  perUser: true,
  message: 'Too many cart updates. Slow down a moment.'
});

/**
 * POST /api/v1/cart/heartbeat
 *
 * Body:
 *   items: [{ id, name, imageUrl?, basePriceKgs, quantity }, ...]
 *   totals: { kgs: number }
 *
 * Returns 204 on success (no body needed — UI doesn't need
 * to wait for our DB write).
 */
router.post('/heartbeat', heartbeatLimiter, authenticateJWT, validate({ body: CartHeartbeatSchema }), async (req: Request, res: Response) => {
  try {
    // 🛡️ Compatibility: the auth middleware (auth.ts) sets BOTH
    // `user.userId` and aliases `id`/`uid` on the user object. We
    // read them in priority order — `userId` first (canonical),
    // then `id`/`uid` (legacy code paths that ran before the alias
    // was added). Without this, authenticated heartbeats silently
    // fail to upsert CartAbandonment because userId ended up null.
    const u = (req as any).user;
    const userId = u?.userId || u?.id || u?.uid || null;
    const guestId = (req as any).cookies?.pv_guest_id || null;
    const body = req.body as {
      items: any[];
      totals: { kgs: number };
    };

    if (!userId && !guestId) {
      // No identity to track against — silently succeed so the
      // client doesn't show an error.
      return res.status(204).end();
    }

    const items = Array.isArray(body.items) ? body.items : [];
    const totalKgs = Number(body.totals?.kgs) || 0;

    await trackActivity({
      userId,
      guestId,
      items: items.map((i: any) => ({
        id: String(i.id || ''),
        name: String(i.name || ''),
        imageUrl: i.imageUrl ? String(i.imageUrl) : undefined,
        basePriceKgs: Number(i.basePriceKgs) || 0,
        quantity: Math.max(1, Math.floor(Number(i.quantity) || 1))
      })),
      totalKgs
    });

    res.status(204).end();
  } catch (err: any) {
    logger.error({ err }, 'cart heartbeat error:');
    res.status(204).end(); // never block the UI
  }
});

/**
 * POST /api/v1/cart/converted
 *
 * Called by the checkout success page so we can mark the user's
 * cart as converted (analytics: "how many push reminders turned
 * into actual sales?").
 */
router.post('/converted', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const u = (req as any).user;
    const userId = u?.userId || u?.id || u?.uid || null;
    const guestId = (req as any).cookies?.pv_guest_id || null;
    if (!userId && !guestId) return res.status(204).end();
    await markConverted(userId, guestId);
    res.status(204).end();
  } catch (err: any) {
    logger.error({ err }, 'cart converted error:');
    res.status(204).end();
  }
});

/**
 * POST /api/v1/cart/cleared
 *
 * Called when the user empties their cart so we stop nagging.
 */
router.post('/cleared', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const u = (req as any).user;
    const userId = u?.userId || u?.id || u?.uid || null;
    const guestId = (req as any).cookies?.pv_guest_id || null;
    if (!userId && !guestId) return res.status(204).end();
    await clearAbandonment(userId, guestId);
    res.status(204).end();
  } catch (err: any) {
    logger.error({ err }, 'cart cleared error:');
    res.status(204).end();
  }
});

export default router;
