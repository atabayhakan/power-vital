// POST /api/v1/contact — public contact + logged-in support inbox intake.
//
// Two frontend callers share this endpoint:
//   • ContactView (public, guests)     → { name, email, subject, message }
//   • SupportView (logged-in customers) → { subject, message } (JWT attached
//     by the axios interceptor; name/email derived from the user record)
//
// Auth is OPTIONAL (optionalJWT): a valid Bearer token links the message to
// the user; guests must supply a valid email so admins can reply.
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { optionalJWT } from '../middleware/auth';
import { validate, ContactSubmitSchema } from '../validators';
import { limit, RATE_LIMITS } from '../utils/rateLimit';
import { adminEvents } from './adminEvents';
import { logger } from '../utils/logger';

const router = Router();

router.post('/', limit(RATE_LIMITS.contact.submit), optionalJWT, validate({ body: ContactSubmitSchema }), async (req: any, res: Response) => {
  try {
    let { name, email } = req.body as { name?: string | null; email?: string | null };
    const { phone, subject, locale, message, source } = req.body as {
      phone?: string | null; subject?: string | null; locale?: string | null;
      message: string; source: 'contact' | 'support';
    };
    const userId: string | null = req.user?.userId || req.user?.id || null;

    // 🛡️ Misafir mesajlarında e-posta ZORUNLU — aksi halde dönüş yapılamaz.
    // Giriş yapmış kullanıcıda eksik alanlar profil kaydından türetilir.
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
      });
      if (!name && user?.name) name = user.name;
      if (!email && user?.email) email = user.email;
    } else if (!email) {
      return res.status(400).json({ error: 'Email is required for guest messages' });
    }

    const created = await prisma.contactMessage.create({
      data: {
        userId,
        name: name || null,
        email: email || null,
        phone: phone || null,
        subject: subject || null,
        message,
        source,
        locale: locale || null
      }
    });

    res.status(201).json({ message: 'Message received', id: created.id });

    // 🚀 Admin dashboard'a gerçek zamanlı bildirim (SSE) — fire-and-forget.
    // E-posta bildirimi bilinçli olarak YOK: notificationService olayları
    // tipli şablonlarla çalışıyor, genel bir helper mevcut değil.
    adminEvents.publish({
      type: 'new_contact_message',
      data: { id: created.id, source, subject: subject || null, userId }
    });
  } catch (error) {
    logger.error({ err: error }, 'Contact message error:');
    res.status(500).json({ error: 'Failed to submit message' });
  }
});

export default router;
