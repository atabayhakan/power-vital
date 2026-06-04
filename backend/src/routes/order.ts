import { Router, Request, Response } from 'express';
import { PrismaClient } from '../../prisma/generated/client';
import { addBonusCalculationJob } from '../queues/bonusQueue';

const router = Router();
const prisma = new PrismaClient({});

// POST /api/v1/orders/checkout - Public E-Commerce Checkout
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { customerName, customerPhone, address, cart, sponsorId } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total
    let totalKgs = 0;
    for (const item of cart) {
      totalKgs += parseFloat(item.price) * (item.quantity || 1);
    }

    // Get a valid userId since it is required in the schema
    let orderUserId = sponsorId;
    if (!orderUserId) {
      const fallbackUser = await prisma.user.findFirst();
      if (!fallbackUser) return res.status(400).json({ error: 'No users exist in DB to attach guest order' });
      orderUserId = fallbackUser.id;
    }

    // Create Order in Database
    const order = await prisma.order.create({
      data: {
        userId: orderUserId,
        orderType: 'ecommerce',
        status: 'pending',
        totalKgs: totalKgs,
        totalUsd: 0,
        paymentMethod: 'cash',
        // We will store customer details as a JSON field or link to a guest user in a real prod env.
        // For MVP, we just track the order.
      }
    });

    // If a Sponsor ID was provided by the customer, trigger the Bonus Worker!
    if (sponsorId) {
      // Create a dummy user context for the purchaser or pass the guest id
      // Since our addBonusCalculationJob expects a purchaserId, we can pass a dummy string for guest
      await addBonusCalculationJob(order.id, `GUEST_${customerName}`, totalKgs, sponsorId);
      console.log(`[Checkout] Order ${order.id} placed with Sponsor: ${sponsorId}`);
    }

    res.json({ message: 'Order placed successfully', orderId: order.id });
  } catch (error: any) {
    console.error('Checkout Error:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// GET /api/v1/orders - Admin Order Listing
router.get('/', async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit for MVP
    });
    res.json(orders);
  } catch (error: any) {
    console.error('List Orders Error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PUT /api/v1/orders/:id/status - Update Order Status
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // ═══ STATUS VALIDATION ═══
    const VALID_STATUSES = ['pending', 'paid', 'shipped', 'completed', 'cancelled', 'refunded'];
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`
      });
    }

    const order = await prisma.order.update({
      where: { id: id as string },
      data: { status }
    });

    res.json({ message: 'Order status updated', order });
  } catch (error: any) {
    console.error('Update Order Status Error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;
