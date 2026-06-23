// Inventory routes — a small REST surface for the realtime
// stock + FOMO widgets. Reads are public (everyone should see
// how many units are left); reservations are session-based
// (the cart pushes a soft hold so concurrent shoppers don't
// oversell).

import { Router, Request, Response } from 'express';
import {
  reserve,
  release,
  releaseSession,
  getAvailability,
  recentOrderCount,
  lastOrderAt,
  startInventoryCleanup
} from '../services/inventoryService';
import { logger } from '../utils/logger';
import prisma from '../lib/prisma';

const router = Router();

startInventoryCleanup();

/**
 * GET /api/v1/inventory/:productId
 *
 * Returns:
 *   {
 *     available,  // db stock - active reservations
 *     reserved,   // units currently in OTHER carts
 *     dbStock,    // raw DB count
 *     recentOrders, // count of orders in the last 10 minutes
 *     lastOrderAt   // ms epoch or null
 *   }
 */
router.get('/:productId', async (req: Request, res: Response) => {
  try {
    const productId = String(req.params.productId);
    if (!productId || productId.length > 191) {
      return res.status(400).json({ error: 'productId is required' });
    }

    // Look up the DB stock. We use `select` to keep the query
    // tight and to avoid pulling the whole Product row over the
    // wire just for the integer.
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stockQuantity: true }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const dbStock = Number(product.stockQuantity) || 0;
    const { available, reserved } = getAvailability(productId, dbStock);
    const recentOrders = recentOrderCount(productId, 10 * 60 * 1000);
    const lastAt = lastOrderAt(productId);

    res.json({
      available,
      reserved,
      dbStock,
      recentOrders,
      lastOrderAt: lastAt
    });
  } catch (err: any) {
    logger.error({ err }, 'inventory read error:');
    res.status(500).json({ error: 'Failed to read inventory' });
  }
});

/**
 * POST /api/v1/inventory/reserve
 * Body: { productId, qty, sessionId }
 *
 * Soft-hold `qty` units for the session. Returns the new
 * (available, reserved) pair so the cart UI can disable the
 * "Add" button when available < qty.
 */
router.post('/reserve', (req: Request, res: Response) => {
  try {
    const { productId, qty, sessionId } = req.body as {
      productId?: string; qty?: number; sessionId?: string;
    };
    if (!productId || !sessionId) {
      return res.status(400).json({ error: 'productId and sessionId are required' });
    }
    if (qty === undefined || qty < 0 || qty > 999) {
      return res.status(400).json({ error: 'qty must be 0-999' });
    }
    // Fire-and-forget the DB read — if it fails we just
    // report the reservation against an unknown stock. The
    // caller can retry. We swallow the error here because the
    // route is best-effort UX, not a financial transaction.
    prisma.product.findUnique({
      where: { id: productId },
      select: { stockQuantity: true }
    }).then((p) => {
      const dbStock = Number(p?.stockQuantity) || 0;
      const r = reserve(productId, Number(qty), sessionId, dbStock);
      res.json({ ok: true, ...r });
    }).catch((err) => {
      logger.error({ err }, 'inventory reserve DB read error:');
      const r = reserve(productId, Number(qty), sessionId, 0);
      res.json({ ok: true, ...r, dbStock: null });
    });
  } catch (err: any) {
    logger.error({ err }, 'inventory reserve error:');
    res.status(500).json({ error: 'Failed to reserve' });
  }
});

/**
 * POST /api/v1/inventory/release
 * Body: { productId, sessionId }
 *
 * Drop a single product reservation. Called when the cart
 * removes the line OR when the checkout completes
 * successfully.
 */
router.post('/release', (req: Request, res: Response) => {
  try {
    const { productId, sessionId } = req.body as { productId?: string; sessionId?: string };
    if (!productId || !sessionId) {
      return res.status(400).json({ error: 'productId and sessionId are required' });
    }
    prisma.product.findUnique({
      where: { id: productId },
      select: { stockQuantity: true }
    }).then((p) => {
      const dbStock = Number(p?.stockQuantity) || 0;
      const r = release(productId, sessionId, dbStock);
      res.json({ ok: true, ...r });
    }).catch(() => {
      const r = release(productId, sessionId, 0);
      res.json({ ok: true, ...r });
    });
  } catch (err: any) {
    logger.error({ err }, 'inventory release error:');
    res.status(500).json({ error: 'Failed to release' });
  }
});

/**
 * POST /api/v1/inventory/release-session
 * Body: { sessionId }
 *
 * Drop ALL reservations for a session — called on logout
 * and on browser-tab close (the frontend uses navigator.sendBeacon).
 */
router.post('/release-session', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body as { sessionId?: string };
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });
    releaseSession(sessionId);
    res.json({ ok: true });
  } catch (err: any) {
    logger.error({ err }, 'inventory release-session error:');
    res.status(500).json({ error: 'Failed to release session' });
  }
});

/**
 * POST /api/v1/inventory/admin/record-order
 * Body: { productIds: string[] }
 *
 * Admin-only. Called by the checkout success path (or by
 * the admin manual order tool) to record that a real order
 * was placed for these products. Powers the FOMO banner.
 */
router.post('/admin/record-order', async (req: Request, res: Response) => {
  try {
    const { productIds } = req.body as { productIds?: string[] };
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'productIds array is required' });
    }
    const { recordOrder } = await import('../services/inventoryService');
    for (const pid of productIds) {
      if (typeof pid === 'string' && pid.length > 0 && pid.length <= 191) {
        recordOrder(pid);
      }
    }
    res.json({ ok: true, recorded: productIds.length });
  } catch (err: any) {
    logger.error({ err }, 'inventory record-order error:');
    res.status(500).json({ error: 'Failed to record order' });
  }
});

export default router;
