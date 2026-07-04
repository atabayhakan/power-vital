// OCR strict-verify test: contract guarantees that NO auto-approval happens on
// a mismatch or unparseable amount — order goes to "pending" awaiting admin.
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import checkoutRouter from '../src/routes/checkout';
import prisma from '../src/lib/prisma';
import { buildTestApp, cleanDatabase, closePrisma } from './testHelpers';

// Stub the OCR seam (lib/ocr.ts) so the test never touches a real image
// or the Tesseract binary. The route calls recognizeReceiptText(imagePath)
// and we drive its resolved text / rejection per test. `.mockResolvedValue`
// here returns the raw text directly (the route no longer unwraps a
// `{ data: { text } }` object — that lives inside lib/ocr now).
const { recognizeText } = vi.hoisted(() => ({ recognizeText: vi.fn() }));
vi.mock('../src/lib/ocr', () => ({
  recognizeReceiptText: recognizeText
}));

const app = buildTestApp({ path: '/api/v1/checkout', router: checkoutRouter });

beforeAll(async () => { await cleanDatabase(); });
afterAll(async () => {
  await closePrisma();
  vi.restoreAllMocks();
});

const makeOrderWithReceipt = async (totalKgs = 1000) => {
  // OrderItem.productId is a real FK — a hardcoded fake UUID violated the
  // constraint and threw before the test even ran. Seed an actual product
  // (unique barcode per call so parallel/repeated seeds don't collide).
  const product = await prisma.product.create({
    data: {
      barcode: 'OCR-' + Math.random().toString(36).slice(2, 9),
      name: 'OCR Test Product',
      basePriceKgs: totalKgs,
      stockQuantity: 100
    }
  });
  const order = await prisma.order.create({
    data: {
      status: 'pending',
      totalKgs,
      paymentMethod: 'qr_transfer',
      customerName: 'OCR Test',
      customerPhone: '+996555000000',
      receiptImageUrl: '/uploads/receipts/test-receipt.jpg',
      items: {
        create: [{
          productId: product.id,
          quantity: 1,
          unitPriceKgs: totalKgs,
          totalPriceKgs: totalKgs
        }]
      }
    }
  });
  return order;
};

describe('POST /api/v1/checkout/:orderId/verify (OCR strict mode)', () => {
  beforeEach(async () => {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    recognizeText.mockReset();
  });

  it('is idempotent on already-paid orders (no re-processing)', async () => {
    const order = await makeOrderWithReceipt();
    await prisma.order.update({ where: { id: order.id }, data: { status: 'paid' } });

    const res = await request(app).post(`/api/v1/checkout/${order.id}/verify`);

    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(true);
    expect(res.body.method).toBe('already-verified');
    // Tesseract must NOT be called for already-paid orders
    expect(recognizeText).not.toHaveBeenCalled();
  });

  it('returns 404 for unknown order', async () => {
    const res = await request(app).post('/api/v1/checkout/00000000-0000-0000-0000-000000000000/verify');
    expect(res.status).toBe(404);
  });

  it('returns 400 when no receipt has been uploaded', async () => {
    const order = await prisma.order.create({
      data: {
        status: 'pending',
        totalKgs: 1000,
        paymentMethod: 'qr_transfer',
        customerName: 'X',
        customerPhone: '+996'
      }
    });
    const res = await request(app).post(`/api/v1/checkout/${order.id}/verify`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/receipt/i);
  });

  it('marks order as PAID when OCR amount matches within 5% tolerance', async () => {
    const order = await makeOrderWithReceipt(1000);
    recognizeText.mockResolvedValue('Получатель: PV\nСумма: 1000 KGS\nНазначение: заказ');

    const res = await request(app).post(`/api/v1/checkout/${order.id}/verify`);

    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(true);
    expect(res.body.extractedAmount).toBe(1000);
    expect(res.body.method).toBe('ocr');

    const after = await prisma.order.findUnique({ where: { id: order.id } });
    expect(after?.status).toBe('paid');
    expect(after?.verifiedAt).not.toBeNull();
  });

  it('keeps order PENDING on amount mismatch (NEVER auto-approves)', async () => {
    const order = await makeOrderWithReceipt(1000);
    // OCR shows 500 KGS — too low
    recognizeText.mockResolvedValue('Сумма: 500 сом');

    const res = await request(app).post(`/api/v1/checkout/${order.id}/verify`);

    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(false);
    expect(res.body.method).toBe('ocr');
    expect(res.body.message).toMatch(/manuel|manual/i);

    const after = await prisma.order.findUnique({ where: { id: order.id } });
    expect(after?.status).toBe('pending'); // NOT paid
    expect(after?.verifiedAt).toBeNull();
  });

  it('keeps order PENDING when amount cannot be parsed (no number found)', async () => {
    const order = await makeOrderWithReceipt(1000);
    recognizeText.mockResolvedValue('Dekont içeriği okunamadı');

    const res = await request(app).post(`/api/v1/checkout/${order.id}/verify`);

    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(false);
    expect(res.body.extractedAmount).toBeNull();

    const after = await prisma.order.findUnique({ where: { id: order.id } });
    expect(after?.status).toBe('pending');
  });

  it('keeps order PENDING when OCR engine itself throws (mark for manual review)', async () => {
    const order = await makeOrderWithReceipt(1000);
    recognizeText.mockRejectedValue(new Error('Tesseract binary not found'));

    const res = await request(app).post(`/api/v1/checkout/${order.id}/verify`);

    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(false);
    expect(res.body.method).toBe('ocr-failed');
    expect(res.body.message).toMatch(/manuel|manual|okunamad/i);

    const after = await prisma.order.findUnique({ where: { id: order.id } });
    expect(after?.status).toBe('pending');
    expect(after?.ocrResult).toContain('Tesseract binary not found');
  });

  it('accepts amount within 5% tolerance', async () => {
    const order = await makeOrderWithReceipt(1000);
    recognizeText.mockResolvedValue('Сумма: 1030 KGS'); // +3%, within 5%

    const res = await request(app).post(`/api/v1/checkout/${order.id}/verify`);
    expect(res.body.verified).toBe(true);

    const after = await prisma.order.findUnique({ where: { id: order.id } });
    expect(after?.status).toBe('paid');
  });
});
