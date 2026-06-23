// Notification service — admin email alerts.
//
// Design:
//   • Event types (NOTIFICATION_EVENTS) are the canonical list of things
//     we can notify about. New events are added by adding an entry here +
//     writing a templated builder function.
//   • Per-event preferences live in SiteSettings.notificationPreferences
//     (a JSON object like { new_order: { email: true }, ocr_pending: {...} })
//     so admins can turn individual channels on/off without a code change.
//   • Transport is pluggable:
//       - Console (default in dev/test) — logs the rendered message
//       - SMTP (nodemailer) — production; reads SMTP_HOST etc. from env
//   • All send() calls are non-blocking + try/catch wrapped — a failed
//     email must NEVER break a checkout or withdrawal.
//
// Locale:
//   • The "user's locale" is passed in by the caller (checkout carries it
//     via the order's customer-facing data). We use a per-event subject +
//     body builder that picks the right translation.

import { logger } from '../utils/logger';
import prisma from '../lib/prisma';

export type LocaleCode = 'tr' | 'ru' | 'kg' | 'en';
export const SUPPORTED_LOCALES: LocaleCode[] = ['tr', 'ru', 'kg', 'en'];

export const NOTIFICATION_EVENTS = [
  'new_order',
  'payment_received',
  'ocr_pending',
  'withdrawal_request',
  'withdrawal_approved',
  'withdrawal_rejected',
  'review_pending',
  'low_stock'
] as const;

export type NotificationEvent = typeof NOTIFICATION_EVENTS[number];

export interface AdminRecipient {
  email: string;
  name?: string;
  locale: LocaleCode;
}

export interface NotificationContext {
  // Free-form payload; each event has its own shape (e.g. orderId for new_order)
  [key: string]: unknown;
}

// ── Preferences (per-event on/off) ───────────────────────────────────────
export interface NotificationPreferences {
  [event: string]: {
    email?: boolean;
  };
}

const DEFAULTS: NotificationPreferences = {
  new_order:           { email: true },
  payment_received:    { email: true },
  ocr_pending:         { email: true },
  withdrawal_request:  { email: true },
  withdrawal_approved: { email: true },
  withdrawal_rejected: { email: true },
  review_pending:      { email: false }, // noisy — off by default
  low_stock:           { email: true }
};

/** Merge user-supplied preferences over the defaults. */
export const mergePreferences = (saved: NotificationPreferences | null | undefined): NotificationPreferences => {
  const out: NotificationPreferences = { ...DEFAULTS };
  if (saved && typeof saved === 'object') {
    for (const k of Object.keys(saved)) {
      out[k] = { ...DEFAULTS[k], ...(saved[k] || {}) };
    }
  }
  return out;
};

/** Is this event enabled for the email channel? */
export const isEventEnabled = (
  prefs: NotificationPreferences,
  event: NotificationEvent
): boolean => {
  return Boolean(prefs[event]?.email !== false); // default ON unless explicitly disabled
};

// ── Templates ────────────────────────────────────────────────────────────
type Template = (ctx: NotificationContext, locale: LocaleCode) => { subject: string; text: string; html: string };

const t = (tr: string, ru: string, kg: string, en: string, locale: LocaleCode): string => {
  return { tr, ru, kg, en }[locale] || en;
};

const fmtCurrency = (amount: number, locale: LocaleCode): string => {
  const cur = 'KGS';
  if (locale === 'en') return `${amount.toFixed(2)} ${cur}`;
  if (locale === 'ru') return `${amount.toFixed(2)} ${cur}`;
  if (locale === 'kg') return `${amount.toFixed(2)} ${cur}`;
  return `${amount.toFixed(2)} ${cur}`;
};

const TEMPLATES: Record<NotificationEvent, Template> = {
  new_order: (ctx, locale) => {
    const orderId = String(ctx.orderId || '?').slice(0, 8);
    const total = Number(ctx.totalKgs || 0);
    const customer = String(ctx.customerName || '—');
    const product = String(ctx.productSummary || '—');
    return {
      subject: t('Yeni sipariş #' + orderId, 'Новый заказ #' + orderId, 'Жаңы буйрутма #' + orderId, 'New order #' + orderId, locale),
      text: [
        t('Müşteri:', 'Клиент:', 'Кардар:', 'Customer:', locale), customer,
        t('Ürün:', 'Товар:', 'Продукт:', 'Product:', locale), product,
        t('Tutar:', 'Сумма:', 'Сумма:', 'Total:', locale), fmtCurrency(total, locale),
        '',
        t('Sipariş detayı:', 'Детали заказа:', 'Буйрутма чоо-жайы:', 'Order details:', locale),
        `${process.env.PUBLIC_URL || ''}/admin/orders/${ctx.orderId || ''}`
      ].join('\n'),
      html: `<h2 style="font-family:sans-serif">${t('Yeni sipariş', 'Новый заказ', 'Жаңы буйрутма', 'New order', locale)} #${orderId}</h2>
<table style="font-family:sans-serif;border-collapse:collapse">
  <tr><td><b>${t('Müşteri', 'Клиент', 'Кардар', 'Customer', locale)}</b></td><td>${escapeHtml(customer)}</td></tr>
  <tr><td><b>${t('Ürün', 'Товар', 'Продукт', 'Product', locale)}</b></td><td>${escapeHtml(product)}</td></tr>
  <tr><td><b>${t('Tutar', 'Сумма', 'Сумма', 'Total', locale)}</b></td><td>${fmtCurrency(total, locale)}</td></tr>
</table>
<p><a href="${process.env.PUBLIC_URL || ''}/admin/orders/${ctx.orderId || ''}">${t('Siparişi aç', 'Открыть заказ', 'Буйрутманы ачуу', 'Open order', locale)}</a></p>`
    };
  },
  payment_received: (ctx, locale) => {
    const orderId = String(ctx.orderId || '?').slice(0, 8);
    const total = Number(ctx.totalKgs || 0);
    return {
      subject: t('Ödeme onaylandı #' + orderId, 'Платёж подтверждён #' + orderId, 'Төлөм тастыкталды #' + orderId, 'Payment confirmed #' + orderId, locale),
      text: `${t('Tutar:', 'Сумма:', 'Сумма:', 'Amount:', locale)} ${fmtCurrency(total, locale)}`,
      html: `<p>${t('Ödeme başarıyla doğrulandı.', 'Платёж успешно подтверждён.', 'Төлөм ийгиликтүү тастыкталды.', 'Payment successfully verified.', locale)} ${fmtCurrency(total, locale)}</p>`
    };
  },
  ocr_pending: (ctx, locale) => {
    const orderId = String(ctx.orderId || '?').slice(0, 8);
    return {
      subject: t('Manuel kontrol: dekont #' + orderId, 'Ручная проверка: чек #' + orderId, 'Кол менен текшерүү: чек #' + orderId, 'Manual review: receipt #' + orderId, locale),
      text: [
        t('Dekont tutarı beklenenle eşleşmiyor:', 'Сумма чека не совпадает с ожидаемой:', 'Чек суммасы күтүлгөнгө дал келбейт:', 'Receipt amount does not match expected:', locale),
        t('Dekont:', 'Чек:', 'Чек:', 'Receipt:', locale), String(ctx.extractedAmount ?? '—'),
        t('Beklenen:', 'Ожидаемая:', 'Күтүлгөн:', 'Expected:', locale), String(ctx.expectedAmount ?? '—'),
        '',
        `${process.env.PUBLIC_URL || ''}/admin/orders/${ctx.orderId || ''}`
      ].join('\n'),
      html: `<h3>${t('Manuel kontrol gerekli', 'Требуется ручная проверка', 'Кол менен текшерүү керек', 'Manual review needed', locale)}</h3>
<p><b>${t('Dekont', 'Чек', 'Чек', 'Receipt', locale)}:</b> ${escapeHtml(String(ctx.extractedAmount ?? '—'))}</p>
<p><b>${t('Beklenen', 'Ожидаемая', 'Күтүлгөн', 'Expected', locale)}:</b> ${escapeHtml(String(ctx.expectedAmount ?? '—'))}</p>
<p><a href="${process.env.PUBLIC_URL || ''}/admin/orders/${ctx.orderId || ''}">${t('Siparişi incele', 'Проверить заказ', 'Буйрутманы карап чыгуу', 'Review order', locale)}</a></p>`
    };
  },
  withdrawal_request: (ctx, locale) => {
    const amount = Number(ctx.amount || 0);
    const cur = String(ctx.currency || 'KGS');
    return {
      subject: t('Yeni çekim talebi: ' + amount + ' ' + cur, 'Новая заявка на вывод: ' + amount + ' ' + cur, 'Жаңы чыгаруу суроосу: ' + amount + ' ' + cur, 'New withdrawal request: ' + amount + ' ' + cur, locale),
      text: `${t('Tutar:', 'Сумма:', 'Сумма:', 'Amount:', locale)} ${amount} ${cur}\n${process.env.PUBLIC_URL || ''}/admin/withdrawals`,
      html: `<p>${t('Yeni bir çekim talebi geldi.', 'Поступила новая заявка на вывод средств.', 'Жаңы каражат чыгаруу суроосу келди.', 'A new withdrawal request has been received.', locale)}</p>
<p><b>${amount} ${cur}</b></p>
<p><a href="${process.env.PUBLIC_URL || ''}/admin/withdrawals">${t('Yönet', 'Управлять', 'Башкаруу', 'Manage', locale)}</a></p>`
    };
  },
  withdrawal_approved: (ctx, locale) => ({
    subject: t('Çekim onaylandı', 'Вывод одобрен', 'Чыгаруу бекитилди', 'Withdrawal approved', locale),
    text: `${t('Çekiminiz onaylandı.', 'Ваш вывод одобрен.', 'Чыгарууңуз бекитилди.', 'Your withdrawal was approved.', locale)}`,
    html: `<p>${t('Çekiminiz onaylandı ve ödeme kuyruğuna alındı.', 'Ваш вывод одобрен и поставлен в очередь на выплату.', 'Чыгарууңуз бекитилип, төлөм кезегине коюлду.', 'Your withdrawal was approved and queued for payout.', locale)}</p>`
  }),
  withdrawal_rejected: (ctx, locale) => ({
    subject: t('Çekim reddedildi', 'Вывод отклонён', 'Чыгаруу четке кагылды', 'Withdrawal rejected', locale),
    text: `${t('Bakiyeniz iade edildi.', 'Баланс возвращён.', 'Балансыңыз кайтарылды.', 'Your balance has been refunded.', locale)}`,
    html: `<p>${t('Çekim talebiniz reddedildi ve bakiye iade edildi.', 'Ваша заявка на вывод отклонена, баланс возвращён.', 'Чыгаруу суроосуңуз четке кагылып, баланс кайтарылды.', 'Your withdrawal request was rejected and the balance was refunded.', locale)}</p>`
  }),
  review_pending: (ctx, locale) => ({
    subject: t('Yeni yorum moderasyon bekliyor', 'Новый отзыв ждёт модерации', 'Жаңы сын-пикир модерацияны күтүп жатат', 'New review awaiting moderation', locale),
    text: t('Yeni bir yorum geldi.', 'Поступил новый отзыв.', 'Жаңы сын-пикир келди.', 'A new review has been submitted.', locale),
    html: `<p><a href="${process.env.PUBLIC_URL || ''}/admin/reviews">${t('Yorumu incele', 'Проверить отзыв', 'Сын-пикирди карап чыгуу', 'Review', locale)}</a></p>`
  }),
  low_stock: (ctx, locale) => {
    const name = String(ctx.name || '—');
    const stock = Number(ctx.stock || 0);
    const min = Number(ctx.minStock || 0);
    return {
      subject: t('Düşük stok: ' + name, 'Низкий запас: ' + name, 'Төмөнкү кампада: ' + name, 'Low stock: ' + name, locale),
      text: `${name}: ${stock} (min ${min})`,
      html: `<p><b>${escapeHtml(name)}</b>: ${t('stok', 'запас', 'кампада', 'stock', locale)} <b>${stock}</b> (${t('minimum', 'минимум', 'минимум', 'min', locale)} ${min})</p>`
    };
  }
};

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));

// ── Transports ──────────────────────────────────────────────────────────
export interface Transport {
  name: string;
  send: (msg: { to: string; subject: string; text: string; html: string }) => Promise<void>;
}

class ConsoleTransport implements Transport {
  name = 'console';
  async send(msg: { to: string; subject: string; text: string; html: string }) {
    // Single-line summary for log scraping, full body for debugging
    logger.info({ to: msg.to, subject: msg.subject }, 'notification (console transport)');
    logger.debug({ text: msg.text }, 'notification body');
  }
}

let _smtpTransport: Transport | null = null;
const getSmtpTransport = async (): Promise<Transport | null> => {
  if (_smtpTransport) return _smtpTransport;
  if (!process.env.SMTP_HOST) return null;
  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD || ''
      } : undefined
    });
    const from = process.env.SMTP_FROM || 'noreply@powervital.kg';
    _smtpTransport = {
      name: 'smtp',
      send: async (msg) => {
        await transporter.sendMail({
          from,
          to: msg.to,
          subject: msg.subject,
          text: msg.text,
          html: msg.html
        });
      }
    };
    return _smtpTransport;
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'SMTP transport init failed; falling back to console');
    return null;
  }
};

// ── Recipient resolution ─────────────────────────────────────────────────
/** Look up all admin users + their email + locale preference. */
export const findAdminRecipients = async (): Promise<AdminRecipient[]> => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { email: true, name: true, preferredLocale: true }
    });
    return admins
      .filter(a => !!a.email)
      .map(a => ({
        email: a.email!,
        name: a.name || undefined,
        locale: (a.preferredLocale as LocaleCode) || 'tr'
      }));
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'findAdminRecipients failed');
    return [];
  }
};

// ── Public API ──────────────────────────────────────────────────────────
export interface SendOptions {
  /** Recipients override (for tests) */
  recipients?: AdminRecipient[];
  /** Force a specific transport (default: auto-detect) */
  transport?: 'console' | 'smtp';
}

/** Send a notification event to all admins (filtered by preferences). */
export const sendNotification = async (
  event: NotificationEvent,
  context: NotificationContext = {},
  opts: SendOptions = {}
): Promise<void> => {
  if (!NOTIFICATION_EVENTS.includes(event)) {
    logger.warn({ event }, 'unknown notification event');
    return;
  }

  // 1. Resolve recipients
  const recipients = opts.recipients ?? (await findAdminRecipients());
  if (recipients.length === 0) {
    logger.debug({ event }, 'no admin recipients');
    return;
  }

  // 2. Check preferences
  let prefs: NotificationPreferences = DEFAULTS;
  try {
    const settings = await prisma.siteSettings.findFirst();
    if (settings?.financeSettings) {
      const parsed = typeof settings.financeSettings === 'string'
        ? JSON.parse(settings.financeSettings)
        : settings.financeSettings;
      if (parsed && typeof parsed === 'object' && (parsed as any).notificationPreferences) {
        prefs = mergePreferences((parsed as any).notificationPreferences);
      }
    }
  } catch { /* ignore */ }
  if (!isEventEnabled(prefs, event)) {
    logger.debug({ event }, 'notification disabled by preferences');
    return;
  }

  // 3. Resolve transport
  const transport = opts.transport === 'smtp' || (!opts.transport && process.env.SMTP_HOST)
    ? await getSmtpTransport()
    : new ConsoleTransport();
  if (!transport) {
    logger.warn({ event }, 'no transport available; skipping');
    return;
  }

  // 4. Render + send per recipient (each gets their own locale)
  const template = TEMPLATES[event];
  for (const r of recipients) {
    const msg = template(context, r.locale);
    try {
      await transport.send({ to: r.email, subject: msg.subject, text: msg.text, html: msg.html });
      logger.info({ event, to: r.email, transport: transport.name }, 'notification sent');
    } catch (err: any) {
      logger.error({ event, to: r.email, err: err?.message }, 'notification send failed');
      // never re-throw — notifications are best-effort
    }
  }
};

// ── Convenience helpers (call sites use these, not sendNotification) ────
export const notifyNewOrder = (orderId: string, totalKgs: number, customerName: string, productSummary: string) =>
  sendNotification('new_order', { orderId, totalKgs, customerName, productSummary });

export const notifyPaymentReceived = (orderId: string, totalKgs: number) =>
  sendNotification('payment_received', { orderId, totalKgs });

export const notifyOcrPending = (orderId: string, extractedAmount: number | null, expectedAmount: number) =>
  sendNotification('ocr_pending', { orderId, extractedAmount, expectedAmount });

export const notifyWithdrawalRequest = (amount: number, currency: string) =>
  sendNotification('withdrawal_request', { amount, currency });

export const notifyWithdrawalApproved = () => sendNotification('withdrawal_approved');
export const notifyWithdrawalRejected = () => sendNotification('withdrawal_rejected');

export const notifyReviewPending = () => sendNotification('review_pending');

export const notifyLowStock = (name: string, stock: number, minStock: number) =>
  sendNotification('low_stock', { name, stock, minStock });

export default sendNotification;
