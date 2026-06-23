// Email service — SMTP-backed transactional mail for cart abandonment,
// password reset, order confirmations, and any other notification
// we want to reach a user's inbox with.
//
// We deliberately treat SMTP as a soft dependency: if the
// environment is missing MAIL_HOST, the service falls back to a
// no-op transport that logs the message to pino so the rest of
// the app keeps working in dev. Production deployments must set
// MAIL_HOST/USER/PASS to actually deliver.
//
// Templates are kept inline (rather than in a templates/ dir) so
// the 4-locale strings travel with the code that's responsible for
// rendering them. Future expansion: refactor into a small
// template engine (handlebars, et al) when we have more than a
// handful of messages.

import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../utils/logger';

export type LocaleCode = 'kg' | 'ru' | 'tr' | 'en';

interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fromName: string;
}

let cachedTransporter: Transporter | null = null;
let cachedConfig: MailConfig | null = null;
let usingFallback = false;

/**
 * Read SMTP config from the environment. Returns null when any
 * required key is missing — the caller is then expected to fall
 * back to the logging-only transport.
 */
const readConfig = (): MailConfig | null => {
  const host = process.env.MAIL_HOST;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  if (!host || !user || !pass) return null;
  return {
    host,
    port: Number(process.env.MAIL_PORT || 587),
    secure: String(process.env.MAIL_SECURE || 'false').toLowerCase() === 'true',
    user,
    pass,
    from: process.env.MAIL_FROM || user,
    fromName: process.env.MAIL_FROM_NAME || 'Power Vital'
  };
};

const getTransporter = (): Transporter => {
  if (cachedTransporter) return cachedTransporter;

  const cfg = readConfig();
  if (!cfg) {
    usingFallback = true;
    // No-op transport — sendMail resolves successfully but
    // does nothing on the wire. Pino logs the rendered message
    // so we can still see what would have been sent.
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true
    });
    logger.warn('[email] SMTP not configured — using jsonTransport fallback (messages logged only)');
    return cachedTransporter;
  }

  cachedConfig = cfg;
  cachedTransporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass }
  });
  logger.info({ host: cfg.host, port: cfg.port, secure: cfg.secure }, '[email] SMTP transport configured');
  return cachedTransporter;
};

/** Returns true if the service will actually deliver (not just log). */
export const isEmailConfigured = (): boolean => readConfig() !== null;

export interface SendOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

/**
 * Send a single email. Always returns; never throws. The caller can
 * check the return value to decide whether to retry / surface an
 * error in the admin UI.
 */
export const sendMail = async (options: SendOptions): Promise<{ ok: boolean; id?: string; error?: string; fallback: boolean }> => {
  try {
    const transporter = getTransporter();
    const cfg = cachedConfig;
    const info = await transporter.sendMail({
      from: cfg ? `"${cfg.fromName}" <${cfg.from}>` : 'Power Vital <noreply@powervital.kg>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
      headers: options.headers
    });

    if (usingFallback) {
      // jsonTransport returns the message as info.message — log it
      // so a developer tailing the server can see exactly what
      // would have been delivered.
      logger.info({ to: options.to, subject: options.subject, fallback: true }, '[email] (no SMTP) would have sent');
    } else {
      logger.info({ to: options.to, subject: options.subject, messageId: info.messageId }, '[email] sent');
    }
    return { ok: true, id: info.messageId, fallback: usingFallback };
  } catch (err: any) {
    logger.error({ err: err?.message, to: options.to }, '[email] send failed');
    return { ok: false, error: err?.message || 'send failed', fallback: usingFallback };
  }
};

// ────────────────────────────────────────────────────────────────────────────
// Cart abandonment email template — fully localised for 4 locales, with
// per-row TranslationCenter-driven overrides when available (so admins can
// tweak the copy from /admin/i18n without redeploying).
// ────────────────────────────────────────────────────────────────────────────

export interface AbandonedCartEmailData {
  customerName: string;
  itemName: string;
  itemCount: number;
  totalKgs: number;
  cartUrl: string;
  unsubscribeUrl: string;
  translations?: Record<string, { subject?: string; headline?: string; body?: string; cta?: string }>;
}

const FALLBACK: Record<LocaleCode, { subject: string; headline: string; body: string; cta: string; preview: string }> = {
  kg: {
    subject: 'Себетиңиз күтүп жатат 🛒',
    headline: 'Себетиңиз бош эмес!',
    body: 'Сиз {name} жана дагы {count} товарды себетке коштуңуз — жалпы {total} сом. Бүгүн эле буйрутмаңызды аягына чыгарыңыз, биз дароо даярдайбыз!',
    cta: 'Буйрутманы аягына чыгаруу',
    preview: 'Себетиңиз күтүп жатат'
  },
  ru: {
    subject: 'Ваша корзина ждёт вас 🛒',
    headline: 'В вашей корзине остались товары!',
    body: 'Вы добавили {name} и ещё {count} товаров на сумму {total} сом. Завершите заказ сегодня — мы сразу начнём сборку!',
    cta: 'Перейти к оформлению',
    preview: 'Корзина ждёт вас'
  },
  tr: {
    subject: 'Sepetiniz sizi bekliyor 🛒',
    headline: 'Sepetinizde ürünler var!',
    body: '{name} ve {count} ürün daha — toplam {total} KGS. Siparişinizi bugün tamamlayın, hemen hazırlamaya başlayalım!',
    cta: 'Siparişi Tamamla',
    preview: 'Sepetiniz sizi bekliyor'
  },
  en: {
    subject: 'Your cart is waiting 🛒',
    headline: 'Your cart still has items!',
    body: 'You added {name} and {count} more items for a total of KGS {total}. Complete your order today — we will start packing right away!',
    cta: 'Complete Order',
    preview: 'Your cart is waiting'
  }
};

const escapeHtml = (s: string): string =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const render = (template: string, vars: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (_m, key) => {
    const v = vars[key];
    return v == null ? `{${key}}` : String(v);
  });

/**
 * Build a localised abandoned-cart email and send it.
 */
export const sendAbandonedCartEmail = async (
  to: string,
  data: AbandonedCartEmailData,
  locale: LocaleCode = 'ru'
): Promise<ReturnType<typeof sendMail>> => {
  const fallback = FALLBACK[locale] || FALLBACK.ru;
  // TranslationCenter overrides win when present
  const tr = data.translations?.[locale] || {};
  const subject = tr.subject || fallback.subject;
  const headline = tr.headline || fallback.headline;
  const bodyTpl = tr.body || fallback.body;
  const cta = tr.cta || fallback.cta;

  const vars = {
    name: data.itemName,
    count: Math.max(0, data.itemCount - 1),
    total: Math.round(data.totalKgs).toLocaleString(locale === 'tr' ? 'tr-TR' : locale === 'ru' ? 'ru-RU' : 'tr-TR')
  };
  const body = render(bodyTpl, vars);

  const customerName = escapeHtml(data.customerName || '');
  const safeName = escapeHtml(data.itemName);
  const safeBody = escapeHtml(body);
  const safeSubject = escapeHtml(subject);
  const safeHeadline = escapeHtml(headline);
  const safeCta = escapeHtml(cta);
  const safeCartUrl = escapeHtml(data.cartUrl);
  const safeUnsubUrl = escapeHtml(data.unsubscribeUrl);

  const html = `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeSubject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f3f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a1a;">
    <span style="display:none;font-size:1px;color:#f5f3f0;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(fallback.preview)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3f0;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#BC4A3C 0%,#A03323 100%);padding:32px 24px;text-align:center;">
              <h1 style="margin:0;font-size:24px;color:#fff;font-weight:800;">🛒 Power Vital</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px 16px 32px;">
              <h2 style="margin:0 0 16px 0;font-size:22px;color:#BC4A3C;font-weight:800;">${safeHeadline}</h2>
              <p style="margin:0;font-size:16px;line-height:1.6;color:#3a3a3a;">${safeBody}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 32px 32px;text-align:center;">
              <a href="${safeCartUrl}" style="display:inline-block;background:#BC4A3C;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:800;font-size:16px;">${safeCta}</a>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;padding:24px 32px;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center;">
              <p style="margin:0 0 8px 0;">© ${new Date().getFullYear()} Power Vital LLC · Бишкек, Кыргызстан</p>
              <p style="margin:0;"><a href="${safeUnsubUrl}" style="color:#888;">Bildirimləri öçürүү · Отписаться · Unsubscribe</a></p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = `${headline}\n\n${body}\n\n${cta}: ${data.cartUrl}\n\n— Power Vital`;

  return sendMail({ to, subject, html, text, headers: { 'X-PV-Template': 'cart-abandoned' } });
};

/** Test helper for /admin/cart-recovery "Send test email" buttons. */
export const sendTestEmail = async (to: string, locale: LocaleCode = 'ru'): Promise<ReturnType<typeof sendMail>> => {
  return sendAbandonedCartEmail(
    to,
    {
      customerName: 'Test Customer',
      itemName: 'Power Vital Reishi Ginseng',
      itemCount: 3,
      totalKgs: 2400,
      cartUrl: 'https://www.powervital.kg/checkout',
      unsubscribeUrl: 'https://www.powervital.kg/account/notifications'
    },
    locale
  );
};
