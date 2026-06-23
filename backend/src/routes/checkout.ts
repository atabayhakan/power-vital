import { Router, Request, Response } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import prisma from '../lib/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { handleOrderPaidAscension } from '../services/ascensionService';
import { validate, CheckoutSchema, UserSearchQuerySchema, IdParamSchema, z } from '../validators';
import { limit, RATE_LIMITS } from '../utils/rateLimit';
import { notifyNewOrder, notifyPaymentReceived, notifyOcrPending } from '../services/notificationService';
import { adminEvents } from './adminEvents';
import { logger } from '../utils/logger';
import { parseReceiptAmount } from '../utils/parseAmount';

const router = Router();

// ── Multer for receipt uploads ──
const uploadDir = process.env.UPLOAD_DIR
  ? path.join(process.env.UPLOAD_DIR, 'receipts')
  : path.join(__dirname, '../../uploads/receipts');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    // Sanitize the user-supplied filename to prevent path traversal / injection.
    // Keep only the base name, strip the extension separately, and whitelist chars.
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 10);
    const base = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 60);
    cb(null, `${Date.now()}-${base || 'receipt'}${ext || '.jpg'}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    // Only allow images and PDFs (receipts).
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Yalnızca resim veya PDF dosyaları yüklenebilir.'));
  }
});

// ── Company Bank Details (could be in SiteSettings in future) ──
const BANK_INFO = {
  bankName: 'Optima Bank',
  accountName: 'Power Vital LLC',
  accountNumber: '1280700100283947',
  bik: '128001',
  inn: '01234567890123',
  paymentMethods: ['MBank', 'O!Money', 'MegaPay', 'Kaspi', 'Balance.kg']
};

// ═══ GET /api/v1/checkout/search-users — Search users for POS ═══
router.get('/search-users', authenticateJWT, validate({ query: UserSearchQuerySchema }), async (req: any, res: Response) => {
  if (req.user.role !== 'admin' && req.user.role !== 'cashier') {
    return res.status(403).json({ error: 'Erişim engellendi' });
  }
  const { q } = req.query as { q: string };

  try {
    // NOTE: User model has no `phone` column — searching it threw a Prisma
    // validation error (500). Search by name + email only.
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { email: { contains: q } }
        ]
      },
      select: { id: true, name: true, email: true, role: true },
      take: 10
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Arama hatası' });
  }
});

// ═══ POST /api/v1/checkout — Create order + return QR data ═══
router.post('/', validate({ body: CheckoutSchema }), async (req: Request, res: Response) => {
  try {
    const { cart, customerName, customerPhone, customerEmail, address } = req.body as { cart: { productId: string; quantity: number }[]; customerName: string; customerPhone: string; customerEmail?: string | null; address?: string | null };

    // 🛡️ SECURITY: sponsorId ASLA istemciden alınmaz.
    // Sponsor zinciri yalnızca authenticated kullanıcının (req.user.id) DB kaydından çıkarılır.
    // Anonim misafir siparişlerinde MLM pricing uygulanmaz, bonus dağıtılmaz.
    const authHeader = req.headers.authorization;
    let authenticatedUserId: string | null = null;
    let userRole = 'customer';
    
    // YENİ: POS satışlarında hedef kullanıcıyı seçme desteği
    const targetUserId = req.body.targetUserId; 

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded: any = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET!);
        if (decoded?.id) {
          const user = await prisma.user.findUnique({ where: { id: decoded.id } });
          if (user) {
            // Eğer siparişi giren kişi Admin veya Kasiyer ise, ve targetUserId gönderilmişse;
            // Siparişi ve fiyatlandırmayı o hedef müşterinin/distribütörün profiline göre yap.
            if ((user.role === 'admin' || user.role === 'cashier') && targetUserId) {
              const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
              if (targetUser) {
                authenticatedUserId = targetUser.id;
                userRole = targetUser.role;
              } else {
                authenticatedUserId = null; // Hedef bulunamadıysa anonim
                userRole = 'customer';
              }
            } else if (user.role === 'admin' || user.role === 'cashier') {
              // POS satışı yapılıyor ama targetUserId YOK (Anonim müşteri)
              // Kasiyerin kendi hesabına PV gitmesini engellemek için userId'yi null yap.
              authenticatedUserId = null;
              userRole = 'customer';
            } else {
              // Normal e-ticaret müşterisi kendi siparişini veriyor
              authenticatedUserId = user.id;
              userRole = user.role;
            }
          }
        }
      } catch (jwtErr) {
        userRole = 'customer';
      }
    }

    // Fetch site settings early to apply pricing logic
    const siteSettings = await prisma.siteSettings.findFirst();
    const fsData = siteSettings?.financeSettings ? JSON.parse(siteSettings.financeSettings) : {};
    const smoothingMode = fsData.smoothingMode || 'NEAREST_100';

    const exchangeRateRecord = await prisma.exchangeRate.findUnique({ where: { currency: 'USD' } });
    const exchangeRate = exchangeRateRecord ? Number(exchangeRateRecord.rateToKgs) : 88.5;

    // Helper for smoothing
    const applySmoothing = (rawKgs: number, mode: string) => {
      if (mode === 'NEAREST_50') {
        const rounded = Math.round(rawKgs / 50) * 50;
        return rounded === 0 && rawKgs > 0 ? 50 : rounded;
      }
      if (mode === 'NEAREST_100') {
        const rounded = Math.round(rawKgs / 100) * 100;
        return rounded === 0 && rawKgs > 0 ? 100 : rounded;
      }
      if (mode === 'PSYCHOLOGICAL_90') {
        const nearest100 = Math.round(rawKgs / 100) * 100;
        const finalPrice = nearest100 > 10 ? nearest100 - 10 : Number(rawKgs.toFixed(2));
        return finalPrice <= 0 && rawKgs > 0 ? 90 : finalPrice;
      }
      return Number(rawKgs.toFixed(2));
    };

    // Calculate total based on PriceRule and dynamic discounts
    let totalKgs = 0;
    const orderItems: { productId: string; quantity: number; unitPriceKgs: number; totalPriceKgs: number }[] = [];

    // Get dynamic discount
    let discountRate = 0;
    if (authenticatedUserId) {
      const userRec = await prisma.user.findUnique({ where: { id: authenticatedUserId } });
      if (userRec && userRec.dynamicDiscountRate) {
        discountRate = Number(userRec.dynamicDiscountRate);
      }
    }

    // Track the live stock of each product so we can validate BEFORE writing anything.
    const productStock = new Map<string, { name: string; stock: number }>();

    for (const item of cart) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;

      const qty = item.quantity || 1;
      let unitPrice = 0;

      productStock.set(product.id, { name: product.name, stock: product.stockQuantity });

      // 🛡️ PRICING FIREWALL: Check for wholesale/distributor pricing
      if (userRole !== 'guest' && userRole !== 'customer') {
        const priceRule = await prisma.priceRule.findFirst({
          where: { productId: product.id, role: userRole as any }
        });
        if (priceRule) {
          unitPrice = applySmoothing(Number(priceRule.customPriceKgs), smoothingMode);
        }
      }

      // If no custom price rule applied, calculate dynamically like frontend
      if (unitPrice === 0) {
        const baseUsd = Number(product.basePriceUsd);
        const discountedUsd = baseUsd * (1 - (discountRate / 100));
        const rawKgs = discountedUsd * exchangeRate;
        unitPrice = applySmoothing(rawKgs, smoothingMode);
      }

      totalKgs += unitPrice * qty;
      orderItems.push({ productId: product.id, quantity: qty, unitPriceKgs: unitPrice, totalPriceKgs: unitPrice * qty });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ error: 'No valid products in cart.' });
    }

    // ═══ STOCK CHECK FIREWALL — BEFORE creating the order ═══
    // (Previously the order + bonus job were created first and stock was checked
    //  afterwards, leaving orphan pending orders + queued bonuses on failure.)
    for (const item of orderItems) {
      const info = productStock.get(item.productId);
      if (!info || info.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for product "${info?.name || item.productId}". Available: ${info?.stock ?? 0}, Requested: ${item.quantity}`
        });
      }
    }

    // Create order AND decrement stock atomically so an oversell race can't occur.
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: authenticatedUserId,
          orderType: req.body.orderType || 'ecommerce',
          status: 'pending',
          totalKgs,
          totalUsd: 0,
          paymentMethod: req.body.paymentMethod || 'qr_transfer',
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          address: address || null,
          items: { create: orderItems }
        },
        include: { items: true }
      });

      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } }
        });
      }

      return created;
    });

    // Fire bonus calculation for authenticated distributor purchases (after commit).
    // Guest / customer purchases do NOT trigger MLM bonus.
    if (authenticatedUserId) {
      const { addBonusCalculationJob } = require('../queues/bonusQueue');
      await addBonusCalculationJob(order.id, authenticatedUserId, totalKgs);
    }

    // Build QR payload (bank transfer info + amount)
    const qrPayload = `${BANK_INFO.bankName}\nСчёт: ${BANK_INFO.accountNumber}\nПолучатель: ${BANK_INFO.accountName}\nСумма: ${totalKgs} KGS\nНазначение: Заказ #${order.id.slice(0, 8)}`;

    // Fetch site settings for custom bank accounts (already fetched above)
    const fsDataAgain = siteSettings?.financeSettings ? JSON.parse(siteSettings.financeSettings) : {};
    
    const enrichedBankInfo = {
      ...BANK_INFO,
      mbankAccount: fsData.mbankAccount || '',
      kaspiAccount: fsData.kaspiAccount || '',
      optimaAccount: fsData.optimaAccount || '',
      customQrUrl: fsData.customQrUrl || ''
    };

    res.status(201).json({
      orderId: order.id,
      totalKgs,
      bankInfo: enrichedBankInfo,
      qrPayload,
      message: 'Order created. Please transfer and upload receipt.'
    });

    // Fire-and-forget admin notification (does NOT block the response)
    const productIds = orderItems.map(i => i.productId);
    const productNames = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });
    const nameById = new Map(productNames.map(p => [p.id, p.name]));
    const productSummary = orderItems.map(i => `${i.quantity}× ${nameById.get(i.productId) || i.productId.slice(0, 6)}`).join(', ');
    notifyNewOrder(order.id, totalKgs, customerName, productSummary).catch(() => {});

    // Real-time push to all admin dashboards (SSE)
    adminEvents.publish({
      type: 'new_order',
      data: { orderId: order.id, totalKgs, customerName, productSummary }
    });
  } catch (error) {
    logger.error({ err: error }, 'Checkout Error:');
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// ═══ POST /api/v1/checkout/:orderId/receipt — Upload receipt image ═══
router.post('/:orderId/receipt', upload.single('receipt'), async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params as { orderId: string };
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const receiptUrl = `/uploads/receipts/${req.file.filename}`;

    await prisma.order.update({
      where: { id: orderId },
      data: { receiptImageUrl: receiptUrl }
    });

    res.json({ message: 'Receipt uploaded', receiptUrl });
  } catch (error) {
    logger.error({ err: error }, 'Receipt Upload Error:');
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ═══ POST /api/v1/checkout/:orderId/verify — OCR verification ═══
// 10/min per IP — Tesseract is CPU-heavy
router.post('/:orderId/verify', limit(RATE_LIMITS.ocr.verify), validate({ params: z.object({ orderId: z.string().min(1, 'orderId is required') }) }), async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params as { orderId: string };
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!order.receiptImageUrl) return res.status(400).json({ error: 'No receipt uploaded' });

    // Idempotency: don't re-process an already-paid order.
    if (order.status === 'paid') {
      return res.json({
        verified: true,
        orderTotal: Number(order.totalKgs),
        method: 'already-verified',
        message: 'Ödeme zaten doğrulanmış.'
      });
    }

    const uploadBase = process.env.UPLOAD_DIR
      ? process.env.UPLOAD_DIR
      : path.join(__dirname, '../..', 'uploads');
    const imagePath = path.join(uploadBase, order.receiptImageUrl.replace(/^\/?uploads\/?/, ''));

    // OCR with Tesseract.js
    let ocrText = '';
    let ocrError: string | null = null;
    try {
      const Tesseract = require('tesseract.js');
      const result = await Tesseract.recognize(imagePath, 'rus+kir+eng', {
        logger: (m: any) => {} // silent
      });
      ocrText = result.data.text;
    } catch (err: any) {
      console.error('OCR Error:', err?.message || err);
      ocrError = err?.message || 'OCR engine unavailable';
    }

    const orderTotal = Number(order.totalKgs);

    // If OCR failed outright, mark as pending for manual admin review (NEVER auto-approve).
    if (ocrError) {
      const ocrResult = {
        extractedAmount: null,
        orderTotal,
        isMatch: false,
        rawText: '',
        error: ocrError
      };
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'pending',
          ocrResult: JSON.stringify(ocrResult),
          verifiedAt: null
        }
      });
      return res.json({
        verified: false,
        extractedAmount: null,
        orderTotal,
        method: 'ocr-failed',
        message: 'Dekont okunamadı. Manuel kontrol için beklemeye alındı.'
      });
    }

    // Extract amount from OCR text. The amount group allows horizontal spaces
    // (thousands separators like "3 000,00") but NOT newlines, so it can't span
    // unrelated lines. parseReceiptAmount handles the space/comma/dot grammar.
    const amountRegex = /(\d[\d.,\u00A0\u202F\u2009 ]*?)\s*(KGS|сом|сум|тенге|som)/i;
    const amountMatch = ocrText.match(amountRegex);
    const extractedAmount = amountMatch ? parseReceiptAmount(amountMatch[1]) : null;

    // Strict match: extracted amount must be present and within 5% tolerance.
    // If amount cannot be parsed at all, treat as mismatch (pending) — never auto-approve.
    const tolerance = orderTotal * 0.05;
    const isMatch = extractedAmount !== null && Math.abs(extractedAmount - orderTotal) <= tolerance;

    const ocrResult = {
      extractedAmount,
      orderTotal,
      isMatch,
      rawText: ocrText.substring(0, 500)
    };

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: isMatch ? 'paid' : 'pending',
        ocrResult: JSON.stringify(ocrResult),
        verifiedAt: isMatch ? new Date() : null
      }
    });

    if (isMatch) {
      // Trigger Gamified Ascension
      await handleOrderPaidAscension(orderId);
      // Notify admins that a payment was auto-verified
      notifyPaymentReceived(orderId, orderTotal).catch(() => {});
      adminEvents.publish({
        type: 'payment_received',
        data: { orderId, totalKgs: orderTotal }
      });
    } else if (extractedAmount !== null) {
      // Mismatch — let admins know manual review is needed
      notifyOcrPending(orderId, extractedAmount, orderTotal).catch(() => {});
      adminEvents.publish({
        type: 'ocr_pending',
        data: { orderId, extractedAmount, expectedAmount: orderTotal }
      });
    }

    let message: string;
    if (!extractedAmount) {
      message = 'Dekonttan tutar okunamadı. Manuel kontrol için beklemeye alındı.';
    } else if (isMatch) {
      message = 'Ödeme doğrulandı! Siparişiniz onaylandı.';
    } else {
      const diff = extractedAmount - orderTotal;
      message = diff < 0
        ? `Yetersiz ödeme: dekont ${extractedAmount} KGS, beklenen ${orderTotal} KGS. Manuel kontrol için beklemeye alındı.`
        : `Fazla ödeme: dekont ${extractedAmount} KGS, beklenen ${orderTotal} KGS. Manuel kontrol için beklemeye alındı.`;
    }

    res.json({
      verified: isMatch,
      extractedAmount,
      orderTotal,
      method: 'ocr',
      message
    });
  } catch (error) {
    logger.error({ err: error }, 'Verify Error:');
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
