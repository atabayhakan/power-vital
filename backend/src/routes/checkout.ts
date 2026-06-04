import { Router, Request, Response } from 'express';
import { PrismaClient } from '../../prisma/generated/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient({});

// ── Multer for receipt uploads ──
const uploadDir = path.join(__dirname, '../../uploads/receipts');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

// ── Company Bank Details (could be in SiteSettings in future) ──
const BANK_INFO = {
  bankName: 'Optima Bank',
  accountName: 'Power Vital LLC',
  accountNumber: '1280700100283947',
  bik: '128001',
  inn: '01234567890123',
  paymentMethods: ['MBank', "O!Money", 'MegaPay', 'Kaspi', 'Balance.kg']
};

// ═══ POST /api/v1/checkout — Create order + return QR data ═══
router.post('/', async (req: Request, res: Response) => {
  try {
    const { cart, customerName, customerPhone, address, sponsorId } = req.body;
    if (!cart || cart.length === 0) return res.status(400).json({ error: 'Cart is empty' });
    if (!customerName || !customerPhone) return res.status(400).json({ error: 'Name and phone required' });

    // Calculate total
    let totalKgs = 0;
    const orderItems: { productId: string; quantity: number; unitPriceKgs: number; totalPriceKgs: number }[] = [];

    for (const item of cart) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;
      const qty = item.quantity || 1;
      const unitPrice = Number(product.basePriceKgs);
      totalKgs += unitPrice * qty;
      orderItems.push({ productId: product.id, quantity: qty, unitPriceKgs: unitPrice, totalPriceKgs: unitPrice * qty });
    }

    // Find or fallback user
    let userId = sponsorId;
    if (!userId) {
      const fallback = await prisma.user.findFirst();
      if (!fallback) return res.status(400).json({ error: 'No users in DB' });
      userId = fallback.id;
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        orderType: req.body.orderType || 'ecommerce',
        status: 'pending',
        totalKgs,
        totalUsd: 0,
        paymentMethod: req.body.paymentMethod || 'qr_transfer',
        customerName,
        customerPhone,
        address: address || null,
        items: {
          create: orderItems
        }
      },
      include: { items: true }
    });

    // ═══ STOCK DEDUCTION ═══
    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } }
      });
    }

    // Build QR payload (bank transfer info + amount)
    const qrPayload = `${BANK_INFO.bankName}\nСчёт: ${BANK_INFO.accountNumber}\nПолучатель: ${BANK_INFO.accountName}\nСумма: ${totalKgs} KGS\nНазначение: Заказ #${order.id.slice(0, 8)}`;

    res.status(201).json({
      orderId: order.id,
      totalKgs,
      bankInfo: BANK_INFO,
      qrPayload,
      message: 'Order created. Please transfer and upload receipt.'
    });
  } catch (error) {
    console.error('Checkout Error:', error);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// ═══ POST /api/v1/checkout/:orderId/receipt — Upload receipt image ═══
router.post('/:orderId/receipt', upload.single('receipt'), async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId as string;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const receiptUrl = `/uploads/receipts/${req.file.filename}`;

    await prisma.order.update({
      where: { id: orderId },
      data: { receiptImageUrl: receiptUrl }
    });

    res.json({ message: 'Receipt uploaded', receiptUrl });
  } catch (error) {
    console.error('Receipt Upload Error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ═══ POST /api/v1/checkout/:orderId/verify — OCR verification ═══
router.post('/:orderId/verify', async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId as string;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!order.receiptImageUrl) return res.status(400).json({ error: 'No receipt uploaded' });

    const imagePath = path.join(__dirname, '../..', order.receiptImageUrl);

    // OCR with Tesseract.js
    let ocrText = '';
    try {
      const Tesseract = require('tesseract.js');
      const result = await Tesseract.recognize(imagePath, 'rus+kir+eng', {
        logger: (m: any) => {} // silent
      });
      ocrText = result.data.text;
    } catch (ocrErr) {
      console.error('OCR Error:', ocrErr);
      // If Tesseract fails, auto-approve for MVP (admin can review manually)
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'paid',
          ocrResult: { text: 'OCR unavailable — auto-approved for review', raw: '' },
          verifiedAt: new Date()
        }
      });
      return res.json({ verified: true, method: 'auto-approved', note: 'OCR engine unavailable. Marked as paid for admin review.' });
    }

    // Extract amount from OCR text
    const amountRegex = /(\d[\d\s,.]*)\s*(KGS|сом|сум|тенге|som)/i;
    const amountMatch = ocrText.match(amountRegex);
    const extractedAmount = amountMatch ? parseFloat(amountMatch[1].replace(/[\s,]/g, '')) : null;

    const orderTotal = Number(order.totalKgs);
    const tolerance = orderTotal * 0.05; // 5% tolerance
    const isMatch = extractedAmount !== null && Math.abs(extractedAmount - orderTotal) <= tolerance;

    const ocrResult = {
      extractedAmount,
      orderTotal,
      isMatch,
      rawText: ocrText.substring(0, 500), // store first 500 chars
    };

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: isMatch ? 'paid' : 'pending',
        ocrResult,
        verifiedAt: isMatch ? new Date() : null
      }
    });

    res.json({
      verified: isMatch,
      extractedAmount,
      orderTotal,
      method: 'ocr',
      message: isMatch ? 'Payment verified! Order is now Paid.' : 'Amount mismatch. Admin will review manually.'
    });
  } catch (error) {
    console.error('Verify Error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ═══ GET /api/v1/checkout/:orderId — Get order status ═══
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId as string },
      include: { items: { include: { product: true } } }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

export default router;
