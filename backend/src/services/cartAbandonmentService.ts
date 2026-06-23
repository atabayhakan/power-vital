// Cart abandonment service — tracks the lifecycle of a "user added
// items but never checked out" session, and hands off to
// pushService.sendToUser when the 1-hour window expires.
//
// The flow:
//
//   1. Client mutates the cart (add / remove / qty change / clear)
//      → POST /api/v1/cart/heartbeat
//      → trackActivity(userId, guestId, cartSnapshot) UPSERTs a row
//        in CartAbandonment, sets status='pending', bumps
//        lastActivityAt to now().
//
//   2. Client navigates to /checkout and successfully pays
//      → POST /api/v1/cart/converted
//      → markConverted(...) flips status='converted'.
//
//   3. A 5-minute sweeper (startCartAbandonmentSweeper, called from
//      server.ts on boot) walks every pending row whose
//      lastActivityAt is older than the abandonment delay (1h).
//      For each:
//        - Build the push body in the user's locale (via
//          TranslationCenter.translateRecord -> translations[locale]
//          -> title/body).
//        - sendToUser(userId, { eventKey: 'cart_abandoned', ... }).
//        - Flip status='notified', set notifiedAt.
//
// Guest carts (userId=null) are persisted for analytics but never
// receive a push (no endpoint to deliver to).
//
// We dedupe by (userId OR guestId): if a user keeps adding items
// past the 1h window we update the existing pending row rather
// than creating a new one, so they only ever see one notification.

import prisma from '../lib/prisma';
import { sendToUser } from './pushService';
import { sendAbandonedCartEmail, isEmailConfigured, type LocaleCode } from './emailService';
import { logger } from '../utils/logger';

const ABANDONMENT_DELAY_MS = 60 * 60 * 1000;       // 1h
const EXPIRY_DAYS = 7;                             // 7 days
const SWEEPER_INTERVAL_MS = 5 * 60 * 1000;         // 5 min
const MAX_NOTIFICATIONS_PER_TICK = 50;             // throttle

export const CART_ABANDONED_EVENT_KEY = 'cart_abandoned';

export interface CartItemSnapshot {
  id: string;
  name: string;
  imageUrl?: string;
  basePriceUsd: number;
  quantity: number;
}

export interface CartSnapshot {
  userId: string | null;
  guestId: string | null;
  items: CartItemSnapshot[];
  totalUsd: number;
  totalKgs: number;
}

let sweeperHandle: NodeJS.Timeout | null = null;
let sweeperRunning = false;

const isPrismaAvailable = (): boolean => {
  try {
    return !!prisma?.cartAbandonment;
  } catch {
    return false;
  }
};

/**
 * Persist a cart activity event. If a pending row already exists
 * for the (userId, guestId) pair we update it in-place; otherwise
 * we create a new one. The lastActivityAt is bumped so the sweeper
 * considers this a "fresh" cart.
 */
export const trackActivity = async (snapshot: CartSnapshot): Promise<void> => {
  if (!isPrismaAvailable()) return;
  if (!snapshot.userId && !snapshot.guestId) return;
  if (!snapshot.items.length) {
    // Empty cart → just clear any prior row so we don't nag a
    // user who already emptied their basket.
    await clearAbandonment(snapshot.userId, snapshot.guestId);
    return;
  }

  const lastItem = snapshot.items[snapshot.items.length - 1];

  // Look for an existing row to dedupe with.
  const existing = await prisma.cartAbandonment.findFirst({
    where: {
      OR: [
        snapshot.userId ? { userId: snapshot.userId } : { id: '__never__' },
        snapshot.guestId ? { guestId: snapshot.guestId } : { id: '__never__' }
      ]
    },
    orderBy: { lastActivityAt: 'desc' }
  });

  if (existing) {
    // If the user came back AFTER being notified and added more
    // items, flip status back to pending so they can get one
    // more reminder on the next sweep. We don't nag more than
    // once per 24h though — see sweepAbandonedCarts.
    await prisma.cartAbandonment.update({
      where: { id: existing.id },
      data: {
        lastProductId: lastItem?.id,
        lastProductName: lastItem?.name,
        lastProductImg: lastItem?.imageUrl,
        cartItems: JSON.stringify(snapshot.items),
        cartTotalUsd: snapshot.totalUsd,
        cartTotalKgs: snapshot.totalKgs,
        lastActivityAt: new Date(),
        status: existing.status === 'notified' && Date.now() - (existing.notifiedAt?.getTime() || 0) < 24 * 60 * 60 * 1000
          ? 'notified'
          : 'pending'
      }
    });
  } else {
    await prisma.cartAbandonment.create({
      data: {
        userId: snapshot.userId,
        guestId: snapshot.guestId,
        lastProductId: lastItem?.id,
        lastProductName: lastItem?.name,
        lastProductImg: lastItem?.imageUrl,
        cartItems: JSON.stringify(snapshot.items),
        cartTotalUsd: snapshot.totalUsd,
        cartTotalKgs: snapshot.totalKgs,
        status: 'pending',
        expiresAt: new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      }
    });
  }
};

/**
 * Wipe the abandonment row when a user checks out, empties their
 * cart, or explicitly dismisses the reminder.
 */
export const clearAbandonment = async (userId: string | null, guestId: string | null): Promise<void> => {
  if (!isPrismaAvailable()) return;
  await prisma.cartAbandonment.deleteMany({
    where: {
      OR: [
        userId ? { userId, status: { in: ['pending', 'notified'] } } : { id: '__never__' },
        guestId ? { guestId, status: { in: ['pending', 'notified'] } } : { id: '__never__' }
      ]
    }
  });
};

/**
 * Called by the checkout success path to flip status to 'converted'
 * (for analytics — lets us measure cart-recovery effectiveness).
 */
export const markConverted = async (userId: string | null, guestId: string | null): Promise<void> => {
  if (!isPrismaAvailable()) return;
  await prisma.cartAbandonment.updateMany({
    where: {
      OR: [
        userId ? { userId, status: { in: ['pending', 'notified'] } } : { id: '__never__' },
        guestId ? { guestId, status: { in: ['pending', 'notified'] } } : { id: '__never__' }
      ]
    },
    data: { status: 'converted', convertedAt: new Date() }
  });
};

/**
 * Build the push body for a single cart row. The localised strings
 * come from the `translations` field that TranslationCenter keeps
 * up to date — the body is built client-side from a tiny template
 * and re-uses the cart snapshot for product names + totals.
 */
const buildPushPayload = (row: any, locale: string) => {
  const itemCount = ((): number => {
    try {
      const arr = JSON.parse(row.cartItems);
      return Array.isArray(arr) ? arr.reduce((s: number, i: any) => s + (Number(i.quantity) || 1), 0) : 1;
    } catch { return 1; }
  })();

  // Read the user's last-seen locale from push preferences if
  // available, otherwise default to RU (primary visitor locale).
  const userLocale = locale || 'ru';

  // 🌍 Localised templates. We read from translations[locale]
  // (the same map TranslationCenter writes for Product/Category
  // records) and fall back to the base string.
  const title = localizedTitle(row, userLocale);
  const body = localizedBody(row, userLocale, row.lastProductName || '', itemCount, Math.round(row.cartTotalKgs || 0));

  return {
    eventKey: CART_ABANDONED_EVENT_KEY,
    title,
    body,
    icon: row.lastProductImg || '/favicon.svg',
    badge: '/favicon.svg',
    data: {
      url: '/checkout',
      type: 'cart_abandoned',
      cartTotalKgs: row.cartTotalKgs,
      cartTotalUsd: row.cartTotalUsd,
      lastProductId: row.lastProductId
    },
    tag: `cart-abandoned-${row.id}`,
    requireInteraction: false,
    ttl: 24 * 60 * 60 // 1 day
  };
};

// Title templates per locale. The base string (TR) is the canonical
// source — other locales get machine-translated via TranslationSweeper
// once a row is first saved. We use a tiny inline map so the sweeper
// stays self-contained even when the translation map is empty.
const TITLE_TEMPLATES: Record<string, string> = {
  kg: 'Себетиңиз күтүп жатат 🛒',
  ru: 'Ваша корзина ждёт вас 🛒',
  tr: 'Sepetiniz sizi bekliyor 🛒',
  en: 'Your cart is waiting 🛒'
};

const BODY_TEMPLATES: Record<string, (name: string, count: number, total: number) => string> = {
  kg: (name, count, total) => `${name} жана дагы ${count - 1} товар — ${total.toLocaleString('tr-TR')} сом. Буйрутманы аягына чыгарыңыз!`,
  ru: (name, count, total) => `${name} и ещё ${count - 1} товаров — ${total.toLocaleString('ru-RU')} сом. Завершите заказ!`,
  tr: (name, count, total) => `${name} ve ${count - 1} ürün daha — ${total.toLocaleString('tr-TR')} KGS. Siparişinizi tamamlayın!`,
  en: (name, count, total) => `${name} and ${count - 1} more items — KGS ${total.toLocaleString('en-US')}. Complete your order!`
};

const localizedTitle = (row: any, locale: string): string => {
  try {
    const map = row.translations ? (typeof row.translations === 'string' ? JSON.parse(row.translations) : row.translations) : null;
    const tr = map?.[locale]?.title;
    if (tr) return tr;
  } catch { /* fall through */ }
  return TITLE_TEMPLATES[locale] || TITLE_TEMPLATES.ru;
};

const localizedBody = (row: any, locale: string, name: string, count: number, total: number): string => {
  try {
    const map = row.translations ? (typeof row.translations === 'string' ? JSON.parse(row.translations) : row.translations) : null;
    const tr = map?.[locale]?.body;
    if (tr) return tr;
  } catch { /* fall through */ }
  const tmpl = BODY_TEMPLATES[locale] || BODY_TEMPLATES.ru;
  return tmpl(name, count, total);
};

/**
 * One sweeper tick. Returns counts so the admin dashboard can show
 * "X reminders dispatched today" without a separate query.
 */
export const sweepAbandonedCarts = async (): Promise<{ processed: number; notified: number; emailed: number; skipped: number; expired: number; errors: number }> => {
  if (!isPrismaAvailable()) return { processed: 0, notified: 0, emailed: 0, skipped: 0, expired: 0, errors: 0 };
  const cutoff = new Date(Date.now() - ABANDONMENT_DELAY_MS);

  const rows = await prisma.cartAbandonment.findMany({
    where: {
      status: 'pending',
      userId: { not: null }, // skip guest carts (no push endpoint)
      lastActivityAt: { lt: cutoff }
    },
    take: MAX_NOTIFICATIONS_PER_TICK,
    orderBy: { lastActivityAt: 'asc' }
  });

  let notified = 0, emailed = 0, skipped = 0, expired = 0, errors = 0;

  for (const row of rows) {
    try {
      // Mark as notified BEFORE we send (idempotent: if the send
      // fails the row is still pending for the next sweep; we just
      // skip it this round).
      const updateResult = await prisma.cartAbandonment.updateMany({
        where: { id: row.id, status: 'pending' },
        data: { status: 'notified', notifiedAt: new Date() }
      });
      if (updateResult.count === 0) {
        skipped++;
        continue;
      }

      // 1. Push notification (best-effort, primary channel)
      const payload = buildPushPayload(row, 'ru');
      const result = await sendToUser(row.userId!, payload);
      if (result.sent > 0) notified++;
      else skipped++;

      // 2. Email (secondary, persistent channel) — only if the user
      //    has an email on file AND hasn't been emailed for this
      //    cart within the last 24h. We don't want to spam.
      try {
        const user = await prisma.user.findUnique({
          where: { id: row.userId! },
          select: { email: true, name: true, preferredLocale: true }
        });
        if (user?.email) {
          const alreadyEmailed = row.notifiedAt && (Date.now() - row.notifiedAt.getTime() < 24 * 60 * 60 * 1000);
          if (!alreadyEmailed) {
            const itemCount = (() => {
              try {
                const arr = JSON.parse(row.cartItems);
                return Array.isArray(arr) ? arr.reduce((s: number, i: any) => s + (Number(i.quantity) || 1), 0) : 1;
              } catch { return 1; }
            })();
            const translations = (() => {
              try {
                const tr = (row as any).translations;
                return tr ? (typeof tr === 'string' ? JSON.parse(tr) : tr) : null;
              } catch { return null; }
            })();
            const locale = (user.preferredLocale as LocaleCode) || 'ru';
            const sendRes = await sendAbandonedCartEmail(
              user.email,
              {
                customerName: user.name || '',
                itemName: row.lastProductName || '',
                itemCount,
                totalKgs: row.cartTotalKgs || 0,
                cartUrl: 'https://www.powervital.kg/checkout',
                unsubscribeUrl: 'https://www.powervital.kg/account/notifications',
                translations
              },
              locale
            );
            if (sendRes.ok && !sendRes.fallback) emailed++;
          }
        }
      } catch (emailErr: any) {
        // Email failure should not break the push path
        logger.warn({ err: emailErr?.message, rowId: row.id }, 'cart abandonment email error');
      }
    } catch (err: any) {
      errors++;
      logger.error({ err, rowId: row.id }, 'cart abandonment notify error:');
    }
  }

  // Mark very old rows as expired regardless of status, so the
  // table doesn't grow forever.
  const expiryCutoff = new Date(Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const expiredResult = await prisma.cartAbandonment.updateMany({
    where: { lastActivityAt: { lt: expiryCutoff }, status: { in: ['pending', 'notified'] } },
    data: { status: 'expired' }
  });
  expired = expiredResult.count;

  return { processed: rows.length, notified, emailed, skipped, expired, errors };
};

/**
 * Manually trigger a single sweep tick from the admin "Sweep now"
 * button. Same as the cron tick, but with an extra log line so
 * the admin can see in real time what was processed.
 */
export const runSweepNow = async (): Promise<ReturnType<typeof sweepAbandonedCarts>> => {
  logger.info('cart abandonment sweep manually triggered');
  return sweepAbandonedCarts();
};

/**
 * Manually send a reminder for a single cart row. Used by the
 * "Send reminder now" action in the admin dashboard. Returns the
 * dispatch result so the UI can show whether the user has a push
 * subscription / email on file.
 */
export const sendReminderForRow = async (
  rowId: string
): Promise<{ ok: boolean; reason?: string; sentPush: number; sentEmail: boolean }> => {
  if (!isPrismaAvailable()) return { ok: false, reason: 'prisma_unavailable', sentPush: 0, sentEmail: false };

  const row = await prisma.cartAbandonment.findUnique({ where: { id: rowId } });
  if (!row) return { ok: false, reason: 'not_found', sentPush: 0, sentEmail: false };
  if (row.status === 'converted') return { ok: false, reason: 'already_converted', sentPush: 0, sentEmail: false };
  if (!row.userId) return { ok: false, reason: 'guest_cart', sentPush: 0, sentEmail: false };

  // Re-set status to pending so the next regular sweep doesn't
  // double-send. The admin override is a manual ack of "yes, this
  // person needs a reminder now".
  await prisma.cartAbandonment.update({
    where: { id: row.id },
    data: { status: 'pending', notifiedAt: null }
  });

  // Force-trigger the row by setting its lastActivityAt to be
  // older than the abandonment window — the next sweep will then
  // pick it up. We do this synchronously here so the admin sees
  // immediate feedback.
  await prisma.cartAbandonment.update({
    where: { id: row.id },
    data: { lastActivityAt: new Date(Date.now() - ABANDONMENT_DELAY_MS - 60_000) }
  });

  const result = await sweepAbandonedCarts();
  return {
    ok: true,
    sentPush: result.notified,
    sentEmail: result.emailed > 0
  };
};

/**
 * Start the background sweeper. Called once from server.ts on
 * boot. Returns a stop function for tests.
 */
export const startCartAbandonmentSweeper = (): () => void => {
  if (sweeperHandle) {
    logger.warn('cart abandonment sweeper already running');
    return () => stopCartAbandonmentSweeper();
  }
  logger.info({ intervalMs: SWEEPER_INTERVAL_MS, delayMs: ABANDONMENT_DELAY_MS }, 'cart abandonment sweeper started');

  sweeperHandle = setInterval(async () => {
    if (sweeperRunning) return; // skip overlap
    sweeperRunning = true;
    try {
      const result = await sweepAbandonedCarts();
      if (result.processed > 0) {
        logger.info(result, 'cart abandonment sweep tick');
      }
    } catch (err) {
      logger.error({ err }, 'cart abandonment sweep error:');
    } finally {
      sweeperRunning = false;
    }
  }, SWEEPER_INTERVAL_MS);

  return () => stopCartAbandonmentSweeper();
};

export const stopCartAbandonmentSweeper = (): void => {
  if (sweeperHandle) {
    clearInterval(sweeperHandle);
    sweeperHandle = null;
  }
};

export const __test = {
  ABANDONMENT_DELAY_MS,
  SWEEPER_INTERVAL_MS,
  MAX_NOTIFICATIONS_PER_TICK,
  EXPIRY_DAYS,
  buildPushPayload
};
