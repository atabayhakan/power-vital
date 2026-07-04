import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import checkoutRouter from '../src/routes/checkout';
import prisma from '../src/lib/prisma';
import { buildTestApp, cleanDatabase, closePrisma } from './testHelpers';

const app = buildTestApp({ path: '/api/v1/checkout', router: checkoutRouter });

beforeAll(async () => { await cleanDatabase(); });
afterAll(async () => { await closePrisma(); });

const seedProduct = async (overrides: any = {}) => {
  return prisma.product.create({
    data: {
      barcode: 'PV-' + Math.random().toString(36).slice(2, 9),
      name: 'Test Product',
      basePriceKgs: 1000,
      stockQuantity: 10,
      ...overrides
    }
  });
};

describe('POST /api/v1/checkout', () => {
  beforeEach(async () => {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
  });

  it('creates a pending order with QR payload', async () => {
    const product = await seedProduct({ basePriceKgs: 1500 });

    const res = await request(app)
      .post('/api/v1/checkout')
      .send({
        cart: [{ productId: product.id, quantity: 2 }],
        customerName: 'Test Customer',
        customerPhone: '+996555000000'
      });

    expect(res.status).toBe(201);
    expect(res.body.orderId).toBeDefined();
    expect(res.body.totalKgs).toBeGreaterThan(0);
    expect(res.body.qrPayload).toContain('KGS');
    expect(res.body.bankInfo.bankName).toBe('Optima Bank');

    const order = await prisma.order.findUnique({ where: { id: res.body.orderId }, include: { items: true } });
    expect(order?.status).toBe('pending');
    expect(order?.items.length).toBe(1);
    expect(order?.items[0].quantity).toBe(2);
  });

  it('rejects empty cart with 400', async () => {
    const res = await request(app)
      .post('/api/v1/checkout')
      .send({ cart: [], customerName: 'X', customerPhone: '+996555000000' });
    expect(res.status).toBe(400);
  });

  it('rejects missing customer info with 400', async () => {
    const product = await seedProduct();
    const res = await request(app)
      .post('/api/v1/checkout')
      .send({ cart: [{ productId: product.id, quantity: 1 }] });
    expect(res.status).toBe(400);
  });

  it('rejects with insufficient stock (firewall check)', async () => {
    const product = await seedProduct({ stockQuantity: 1 });

    const res = await request(app)
      .post('/api/v1/checkout')
      .send({
        cart: [{ productId: product.id, quantity: 5 }],
        customerName: 'X',
        customerPhone: '+996555000000'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/stock/i);

    // Stock should NOT have been decremented
    const after = await prisma.product.findUnique({ where: { id: product.id } });
    expect(after?.stockQuantity).toBe(1);
  });

  it('decrements stock atomically on success', async () => {
    const product = await seedProduct({ stockQuantity: 10 });

    const res = await request(app)
      .post('/api/v1/checkout')
      .send({
        cart: [{ productId: product.id, quantity: 3 }],
        customerName: 'X',
        customerPhone: '+996555000000'
      });

    expect(res.status).toBe(201);
    const after = await prisma.product.findUnique({ where: { id: product.id } });
    expect(after?.stockQuantity).toBe(7);
  });

  it('skips invalid product IDs gracefully', async () => {
    const product = await seedProduct();
    const res = await request(app)
      .post('/api/v1/checkout')
      .send({
        cart: [
          { productId: 'non-existent-id', quantity: 1 },
          { productId: product.id, quantity: 1 }
        ],
        customerName: 'X',
        customerPhone: '+996555000000'
      });

    expect(res.status).toBe(201);
    // Only the valid product made it in
    const order = await prisma.order.findUnique({
      where: { id: res.body.orderId },
      include: { items: true }
    });
    expect(order?.items.length).toBe(1);
  });

  it('rejects 100% invalid cart with 400', async () => {
    const res = await request(app)
      .post('/api/v1/checkout')
      .send({
        cart: [{ productId: 'non-existent', quantity: 1 }],
        customerName: 'X',
        customerPhone: '+996555000000'
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no valid products/i);
  });
});

describe('GET /api/v1/checkout/:orderId', () => {
  beforeEach(async () => {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
  });

  it('returns the order with items + products', async () => {
    const product = await seedProduct();
    const created = await request(app)
      .post('/api/v1/checkout')
      .send({
        cart: [{ productId: product.id, quantity: 1 }],
        customerName: 'X',
        customerPhone: '+996555000000'
      });

    const res = await request(app).get(`/api/v1/checkout/${created.body.orderId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.orderId);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].product).toBeDefined();
  });

  it('returns 404 for missing order', async () => {
    const res = await request(app).get('/api/v1/checkout/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});
