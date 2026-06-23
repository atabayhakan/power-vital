// Web Push service — VAPID-authenticated notifications to subscribed browsers.
//
// Flow:
//   1. Browser asks Notification.permission → "granted"
//   2. Service worker calls PushManager.subscribe({ applicationServerKey, userVisibleOnly: true })
//   3. Browser returns { endpoint, keys: { p256dh, auth } }
//   4. Frontend POSTs to /api/v1/push/subscribe
//   5. We persist the subscription row scoped to userId
//   6. Server pushes via web-push lib with VAPID headers
//
// Failure modes:
//   - 404/410 from push service → endpoint expired, delete row
//   - 401/403 → user revoked permission, delete row
//   - network/timeout → leave row, retry next event (caller decides)
import webpush from 'web-push';
import prisma from '../lib/prisma';

let vapidConfigured = false;

const ensureVapid = (): boolean => {
  if (vapidConfigured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) return false;
  try {
    webpush.setVapidDetails(subject, pub, priv);
    vapidConfigured = true;
    return true;
  } catch {
    return false;
  }
};

export const getVapidPublicKey = (): string | null => {
  return process.env.VAPID_PUBLIC_KEY || null;
};

export const isPushConfigured = (): boolean => ensureVapid();

export interface PushPayload {
  title: string;
  body: string;
  // Optional data — passed to notificationclick in the SW
  url?: string;
  icon?: string;
  badge?: string;
  // Collapses notifications with the same tag
  tag?: string;
  // eventKey drives per-event opt-out filtering
  eventKey: string;
}

export interface SubscribeInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}

export interface AuditContext {
  // Admin user id, recorded in BroadcastLog.actorId.
  actorId?: string | null;
  // Free-form note (e.g. "dry-run", "system event").
  note?: string;
  // Groups multi-target broadcasts so the history view can collapse
  // all rows from a single request into one.
  parentBroadcastId?: string;
}

export const subscribe = async (userId: string, input: SubscribeInput) => {
  // Upsert keyed on endpoint — same device re-subscribing must not
  // create a duplicate row, but we DO want to update the userId if the
  // same device was previously registered to a different user.
  return prisma.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    create: {
      user: { connect: { id: userId } },
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: input.userAgent,
      preferences: '{}',
      lastSeenAt: new Date()
    },
    update: {
      userId,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: input.userAgent,
      lastSeenAt: new Date(),
      // New session = reset preferences to "all on"
      preferences: '{}'
    }
  });
};

export const unsubscribe = async (userId: string, endpoint: string) => {
  // Only delete if the endpoint belongs to the requesting user.
  const sub = await prisma.pushSubscription.findUnique({ where: { endpoint } });
  if (!sub || sub.userId !== userId) return { deleted: false };
  await prisma.pushSubscription.delete({ where: { endpoint } });
  return { deleted: true };
};

export const setPreferences = async (userId: string, preferences: Record<string, boolean>) => {
  // Update preferences for ALL of the user's subscriptions.
  // (Users with multiple devices expect identical behavior.)
  await prisma.pushSubscription.updateMany({
    where: { userId },
    data: { preferences: JSON.stringify(preferences) }
  });
};

const shouldDeliver = (preferencesJson: string, eventKey: string): boolean => {
  // Empty preferences = subscribed to all events (default opt-in).
  if (!preferencesJson || preferencesJson === '{}') return true;
  try {
    const prefs = JSON.parse(preferencesJson) as Record<string, boolean>;
    // Missing key = default-on. Explicit false = opt-out.
    return prefs[eventKey] !== false;
  } catch {
    return true;
  }
};

// Sends one notification to all of the user's matching subscriptions.
// Returns aggregate counts: { sent, expired, failed }.
// The caller decides whether to log / alert on failures.
//
// `audit` is optional. When supplied, a BroadcastLog row is written AFTER
// the dispatch completes (success or failure). Failures to write the log
// never propagate to the caller — audit must not break the user-facing
// push delivery.
export const sendToUser = async (
  userId: string,
  payload: PushPayload,
  audit?: AuditContext
) => {
  if (!ensureVapid()) {
    await writeAudit(userId, payload.eventKey, { sent: 0, expired: 0, failed: 0 }, audit, 'vapid_unconfigured');
    return { sent: 0, expired: 0, failed: 0, skipped: 'vapid_unconfigured' };
  }

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (!subs.length) {
    await writeAudit(userId, payload.eventKey, { sent: 0, expired: 0, failed: 0 }, audit, 'no_subscriptions');
    return { sent: 0, expired: 0, failed: 0, skipped: 'no_subscriptions' };
  }

  let sent = 0, expired = 0, failed = 0;
  for (const sub of subs) {
    if (!shouldDeliver(sub.preferences, payload.eventKey)) continue;

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url,
          icon: payload.icon,
          badge: payload.badge,
          tag: payload.tag || payload.eventKey,
          eventKey: payload.eventKey
        }),
        { TTL: 60 * 60 * 24, urgency: 'normal' } // 24h, browser may collapse
      );
      sent++;
    } catch (err: any) {
      const status = err?.statusCode || err?.status;
      if (status === 404 || status === 410) {
        // Subscription gone — clean up
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        expired++;
      } else {
        failed++;
      }
    }
  }

  await writeAudit(userId, payload.eventKey, { sent, expired, failed }, audit);
  return { sent, expired, failed };
};

// Internal: persist a BroadcastLog row. Never throws.
//
// `noteOverride` is used to record skipped reasons (e.g. 'no_subscriptions').
// When the override is set, it takes precedence over the caller's note —
// because the override describes WHY nothing was sent, which is more
// useful in an audit than the caller's optional marketing copy.
const writeAudit = async (
  targetId: string,
  eventKey: string,
  counts: { sent: number; expired: number; failed: number },
  audit?: AuditContext,
  noteOverride?: string
) => {
  try {
    await prisma.broadcastLog.create({
      data: {
        actorId: audit?.actorId ?? null,
        targetId,
        eventKey: eventKey.slice(0, 64),
        sent: counts.sent,
        expired: counts.expired,
        failed: counts.failed,
        note: noteOverride ?? audit?.note ?? null,
        parentBroadcastId: audit?.parentBroadcastId ?? null
      }
    });
  } catch {
    // Audit failure must never break push delivery.
  }
};

// Admin-only test ping — sends to the admin's own subscriptions.
export const sendTestToUser = async (userId: string, message?: string) => {
  return sendToUser(userId, {
    title: '🔔 Power Vital — Test',
    body: message || 'Bu bir test bildirimidir. Web Push entegrasyonu çalışıyor!',
    url: '/',
    tag: 'pv-test',
    eventKey: 'test'
  }, { actorId: userId, note: 'admin self-test' });
};
