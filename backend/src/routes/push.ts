// Web Push REST endpoints.
//
// POST   /api/v1/push/subscribe    — register a new PushSubscription
// DELETE /api/v1/push/unsubscribe  — remove a subscription
// GET    /api/v1/push/public-key   — return the VAPID public key (public)
// GET    /api/v1/push/preferences  — current opt-outs (per event)
// PUT    /api/v1/push/preferences  — set opt-outs
// POST   /api/v1/push/test         — admin-only, sends a test ping to self
//
// All endpoints require auth except the public key fetch.
// The subscribe endpoint also rate-limits via apiLimiter (defined in index.ts).
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { validate } from '../validators';
import prisma from '../lib/prisma';
import { toCsv, type CsvColumn } from '../utils/csv';
import { resolveBroadcastTargets } from '../utils/broadcastTargets';
import { startScheduler, tick as runSchedulerTick } from '../services/broadcastScheduler';
import { parseCursor, afterCursorWhere, splitPage } from '../utils/cursorPaginate';
import {
  subscribe,
  unsubscribe,
  setPreferences,
  getVapidPublicKey,
  isPushConfigured,
  sendTestToUser,
  sendToUser
} from '../services/pushService';
import { logger } from '../utils/logger';

const router = Router();

const SubscribeSchema = z.object({
  endpoint: z.string().url().max(512),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(128)
  }),
  userAgent: z.string().max(512).optional()
});

const UnsubscribeSchema = z.object({
  endpoint: z.string().url().max(512)
});

const PreferencesSchema = z.record(z.string(), z.boolean());

// Public: clients need the VAPID public key to call PushManager.subscribe()
router.get('/public-key', (req: Request, res: Response) => {
  const key = getVapidPublicKey();
  if (!key) {
    return res.status(503).json({
      error: 'Push notifications not configured on this server.',
      configured: false
    });
  }
  res.json({ publicKey: key, configured: isPushConfigured() });
});

router.post('/subscribe', authenticateJWT, validate({ body: SubscribeSchema }), async (req: any, res: Response) => {
  try {
    const sub = await subscribe(req.user.userId, req.body);
    res.status(201).json({ ok: true, id: sub.id });
  } catch (err: any) {
    logger.error({ err, userId: req.user.userId }, 'push subscribe failed');
    res.status(500).json({ error: 'Subscribe failed' });
  }
});

router.delete('/unsubscribe', authenticateJWT, validate({ body: UnsubscribeSchema }), async (req: any, res: Response) => {
  const result = await unsubscribe(req.user.userId, req.body.endpoint);
  res.json(result);
});

router.get('/preferences', authenticateJWT, async (req: any, res: Response) => {
  // Read from any one of the user's subscriptions — all are kept in sync.
  const { default: prisma } = await import('../lib/prisma');
  const sub = await prisma.pushSubscription.findFirst({
    where: { userId: req.user.userId }
  });
  const prefs = sub?.preferences ? JSON.parse(sub.preferences) : {};
  res.json({ preferences: prefs });
});

router.put('/preferences', authenticateJWT, validate({ body: PreferencesSchema }), async (req: any, res: Response) => {
  await setPreferences(req.user.userId, req.body);
  res.json({ ok: true, preferences: req.body });
});

// Admin-only test — sends a single ping to caller's own subscriptions.
router.post('/test', authenticateJWT, requireRole('admin'), async (req: any, res: Response) => {
  const result = await sendTestToUser(req.user.userId, req.body?.message);
  res.json(result);
});

// Admin-only broadcast — fires a custom notification to one or more users.
// Body (single):   { userId,  title, body, url?, eventKey, note? }
// Body (multi):    { userIds: [uuid, ...], title, body, url?, eventKey, note? }
// Body (segment):  { role: 'customer', title, body, url?, eventKey, note? }
//
// Multi-target broadcasts share the same `parentBroadcastId` (the request's
// generated UUID) so the audit log can group related rows for later review.
router.post('/broadcast', authenticateJWT, requireRole('admin'), async (req: any, res: Response) => {
  const { userId, userIds, role, title, body, url, eventKey, note } = req.body || {};
  if (!title || !body || !eventKey) {
    return res.status(400).json({ error: 'title, body, eventKey required' });
  }

  // Resolve targets.
  const targets = await resolveBroadcastTargets({ userId, userIds, role });
  if (targets.error) {
    return res.status(400).json({ error: targets.error });
  }
  if (targets.ids.length === 0) {
    return res.status(404).json({ error: 'No matching users' });
  }
  if (targets.ids.length > 500) {
    return res.status(413).json({ error: `Too many targets (${targets.ids.length}); cap is 500 per request` });
  }

  const parentBroadcastId = crypto.randomUUID();
  const audit = {
    actorId: req.user.userId,
    note: typeof note === 'string' ? note.slice(0, 256) : undefined
  };

  // Dispatch sequentially — web-push is async I/O, parallel fan-out would
  // saturate the event loop and breach the per-user rate limits if we
  // ever add them. For 500 users this is ~30-60s; acceptable for admin ops.
  let totalSent = 0, totalExpired = 0, totalFailed = 0, totalSkipped = 0;
  const perTarget: Array<{ userId: string; sent: number; expired: number; failed: number; skipped?: string }> = [];
  const skippedReason: Record<string, number> = {};

  for (const tid of targets.ids) {
    const result = await sendToUser(tid, { title, body, url, eventKey }, { ...audit, parentBroadcastId });
    perTarget.push({ userId: tid, ...result });
    totalSent += result.sent;
    totalExpired += result.expired;
    totalFailed += result.failed;
    if (result.skipped) {
      totalSkipped++;
      skippedReason[result.skipped] = (skippedReason[result.skipped] || 0) + 1;
    }
  }

  logger.info({
    actor: req.user.userId,
    parentBroadcastId,
    targetCount: targets.ids.length,
    eventKey,
    totalSent, totalExpired, totalFailed, totalSkipped,
    skippedReason
  }, 'admin push broadcast (multi)');

  res.json({
    parentBroadcastId,
    targetCount: targets.ids.length,
    totalSent, totalExpired, totalFailed, totalSkipped,
    skippedReason,
    perTarget
  });
});

// Resolve broadcast targets from one of three input shapes:
//   • { userId:  'uuid' }              → [userId]
// `resolveTargets` was extracted to utils/broadcastTargets.ts so the
// scheduler service can share the same validation logic.

// Admin-only audit log — view recent broadcasts.
// Query params:
//   limit     — max rows (default 50, max 200)
//   actorId   — filter by sender (admin user id)
//   targetId  — filter by recipient user id
//   eventKey  — filter by event key (e.g. 'order_paid')
//   since     — ms-epoch filter; only rows newer than this
//   parentBroadcastId — filter to a single multi-target broadcast group
// Returns the most recent first.
router.get('/broadcast-history', authenticateJWT, requireRole('admin'), async (req: any, res: Response) => {
  const { cursor, limit, take } = parseCursor(req.query as any, 50);
  const where: any = {};
  if (req.query.actorId)   where.actorId   = String(req.query.actorId);
  if (req.query.targetId)  where.targetId  = String(req.query.targetId);
  if (req.query.eventKey)  where.eventKey  = String(req.query.eventKey).slice(0, 64);
  if (req.query.parentBroadcastId) where.parentBroadcastId = String(req.query.parentBroadcastId);
  // Cursor WHERE — append to the filter set so deep scrolling stays fast.
  if (cursor) {
    Object.assign(where, { AND: afterCursorWhere(cursor, 'createdAt') });
  }

  try {
    const rows = await prisma.broadcastLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      include: {
        actor:  { select: { id: true, name: true, email: true } },
        target: { select: { id: true, name: true, email: true } }
      }
    });
    const { items, nextCursor, hasMore } = splitPage(rows, limit, 'createdAt');
    res.json({ items, nextCursor, hasMore });
  } catch (err: any) {
    logger.error({ err }, 'broadcast-history failed');
    res.status(500).json({ error: 'Failed to load broadcast history' });
  }
});

// Admin-only CSV export — same filters as /broadcast-history but
// returns text/csv with a download filename. Designed for Excel
// import (UTF-8 BOM, RFC 4180 escaping).
//
// Query params are identical to /broadcast-history:
//   limit, actorId, targetId, eventKey, parentBroadcastId, since
router.get('/broadcast-history.csv', authenticateJWT, requireRole('admin'), async (req: any, res: Response) => {
  // Reject in browser context — CSRF GET could dump data. We rely on
  // JWT cookie auth + same-origin policy + the Origin/Referer header
  // check in `authenticateJWT`. Direct curl usage requires a token.
  const limit = Math.min(Number(req.query.limit) || 1000, 5000);
  const where: any = {};
  if (req.query.actorId)   where.actorId   = String(req.query.actorId);
  if (req.query.targetId)  where.targetId  = String(req.query.targetId);
  if (req.query.eventKey)  where.eventKey  = String(req.query.eventKey).slice(0, 64);
  if (req.query.parentBroadcastId) where.parentBroadcastId = String(req.query.parentBroadcastId);
  const since = Number(req.query.since) || 0;
  if (since) where.createdAt = { gt: new Date(since) };

  try {
    const rows = await prisma.broadcastLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        actor:  { select: { id: true, name: true, email: true } },
        target: { select: { id: true, name: true, email: true } }
      }
    });

    const columns: CsvColumn<any>[] = [
      { header: 'createdAt',        value: r => r.createdAt.toISOString() },
      { header: 'eventKey',         value: r => r.eventKey },
      { header: 'parentBroadcastId',value: r => r.parentBroadcastId || '' },
      { header: 'sent',             value: r => r.sent },
      { header: 'expired',          value: r => r.expired },
      { header: 'failed',           value: r => r.failed },
      { header: 'note',             value: r => r.note || '' },
      { header: 'actorId',          value: r => r.actorId || '' },
      { header: 'actorName',        value: r => r.actor?.name || '' },
      { header: 'actorEmail',       value: r => r.actor?.email || '' },
      { header: 'targetId',         value: r => r.targetId },
      { header: 'targetName',       value: r => r.target?.name || '' },
      { header: 'targetEmail',      value: r => r.target?.email || '' }
    ];

    const csv = toCsv(rows, columns, { bom: true, lineEnding: '\r\n' });
    const filename = `broadcast-history-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(csv);
  } catch (err: any) {
    logger.error({ err }, 'broadcast-history.csv failed');
    res.status(500).json({ error: 'Failed to export broadcast history' });
  }
});

// Admin-only push analytics — aggregate BroadcastLog data for the
// analytics dashboard. Returns:
//
//   • byEventKey   — total sent / expired / failed per event key
//   • byDay        — daily sent/delivered trend (last 14 days)
//   • topActors    — most active admins (last 30 days)
//   • activeSubscribers — current PushSubscription count
//   • generatedAt  — ISO timestamp
//
// This endpoint is read-only and cheap (3 group-by queries + 1 count).
// No request body. Designed to power the AdminPushAnalyticsView.
router.get('/analytics', authenticateJWT, requireRole('admin'), async (req: any, res: Response) => {
  try {
    // Group counts by eventKey — single GROUP BY.
    const byEventKey = await prisma.broadcastLog.groupBy({
      by: ['eventKey'],
      _sum: { sent: true, expired: true, failed: true },
      _count: { id: true }
    });

    // Daily trend (last 14 days). Prisma doesn't have a "DATE()"
    // helper so we pull all rows and bucket in JS. Cheap because
    // BroadcastLog is bounded by admin activity.
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recent = await prisma.broadcastLog.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true, sent: true, expired: true, failed: true }
    });
    const byDayMap = new Map<string, { sent: number; expired: number; failed: number; broadcasts: number }>();
    for (const r of recent) {
      const d = r.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
      const cur = byDayMap.get(d) ?? { sent: 0, expired: 0, failed: 0, broadcasts: 0 };
      cur.sent += r.sent;
      cur.expired += r.expired;
      cur.failed += r.failed;
      cur.broadcasts += 1;
      byDayMap.set(d, cur);
    }
    const byDay = [...byDayMap.entries()]
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top senders (last 30 days).
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const topActorsRaw = await prisma.broadcastLog.groupBy({
      by: ['actorId'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
      _sum: { sent: true, failed: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });
    // Hydrate actor names
    const actorIds = topActorsRaw.map(r => r.actorId).filter((x): x is string => !!x);
    const actors = actorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true, email: true, role: true }
        })
      : [];
    const actorById = new Map(actors.map(a => [a.id, a]));
    const topActors = topActorsRaw.map(r => ({
      actorId: r.actorId,
      actor: r.actorId ? actorById.get(r.actorId) || null : null,
      broadcastCount: r._count.id,
      sent: r._sum.sent ?? 0,
      failed: r._sum.failed ?? 0
    }));

    // Active subscribers snapshot.
    const activeSubscribers = await prisma.pushSubscription.count();

    // Total broadcasts in lifetime.
    const totalBroadcasts = await prisma.broadcastLog.count();

    res.json({
      generatedAt: new Date().toISOString(),
      totalBroadcasts,
      activeSubscribers,
      byEventKey: byEventKey.map(g => ({
        eventKey: g.eventKey,
        broadcastCount: g._count.id,
        sent: g._sum.sent ?? 0,
        expired: g._sum.expired ?? 0,
        failed: g._sum.failed ?? 0
      })).sort((a, b) => b.sent - a.sent),
      byDay,
      topActors
    });
  } catch (err: any) {
    logger.error({ err }, 'push analytics failed');
    res.status(500).json({ error: 'Failed to load push analytics' });
  }
});

// Drill-down for a single eventKey — returns hourly buckets (last 24h),
// plus failure breakdown (404 vs 5xx) so admins can tell apart
// "user unsubscribed" vs "FCM down".
//
// Query params:
//   eventKey     — required
//   hours        — window in hours (default 24, max 168 = 7 days)
router.get('/analytics/event-detail', authenticateJWT, requireRole('admin'), async (req: any, res: Response) => {
  try {
    const eventKey = String(req.query.eventKey || '').slice(0, 64);
    if (!eventKey) {
      return res.status(400).json({ error: 'eventKey required' });
    }
    const hours = Math.min(Math.max(Number(req.query.hours) || 24, 1), 168);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Pull rows in window — cheap because (eventKey, createdAt)
    // is the natural index path (eventKey equality + range scan).
    const rows = await prisma.broadcastLog.findMany({
      where: { eventKey, createdAt: { gte: since } },
      select: { id: true, sent: true, expired: true, failed: true, createdAt: true, note: true }
    });

    // Hourly buckets: { 'YYYY-MM-DDTHH': { sent, expired, failed, count } }
    const buckets = new Map<string, { sent: number; expired: number; failed: number; count: number }>();
    const totals = { sent: 0, expired: 0, failed: 0, count: 0 };
    for (const r of rows) {
      const hour = r.createdAt.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      const b = buckets.get(hour) ?? { sent: 0, expired: 0, failed: 0, count: 0 };
      b.sent += r.sent;
      b.expired += r.expired;
      b.failed += r.failed;
      b.count += 1;
      buckets.set(hour, b);
      totals.sent += r.sent;
      totals.expired += r.expired;
      totals.failed += r.failed;
      totals.count += 1;
    }

    // Fill empty hours between `since` and now so the chart shows a
    // continuous time axis (no gaps). 0-filled buckets still count.
    const filledBuckets: Array<{ hour: string; sent: number; expired: number; failed: number; count: number }> = [];
    const nowHour = new Date().toISOString().slice(0, 13);
    let cursor = new Date(since);
    cursor.setMinutes(0, 0, 0);
    while (cursor.toISOString().slice(0, 13) <= nowHour) {
      const hour = cursor.toISOString().slice(0, 13);
      const b = buckets.get(hour);
      filledBuckets.push({
        hour,
        sent: b?.sent ?? 0,
        expired: b?.expired ?? 0,
        failed: b?.failed ?? 0,
        count: b?.count ?? 0
      });
      cursor = new Date(cursor.getTime() + 60 * 60 * 1000);
    }

    // Failure reason breakdown — we don't have a column for the
    // HTTP status code, but the note field sometimes contains the
    // error category. Aggregate top reasons for visibility.
    const reasonCounts = new Map<string, number>();
    for (const r of rows) {
      if (!r.note) continue;
      // Take first 60 chars as a coarse bucket.
      const k = r.note.slice(0, 60);
      reasonCounts.set(k, (reasonCounts.get(k) ?? 0) + 1);
    }
    const topReasons = [...reasonCounts.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent broadcasts — last 20 rows for the "Recent" feed.
    const recent = await prisma.broadcastLog.findMany({
      where: { eventKey, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true, sent: true, expired: true, failed: true, createdAt: true,
        targetId: true, target: { select: { id: true, name: true, email: true } }
      }
    });

    res.json({
      generatedAt: new Date().toISOString(),
      eventKey,
      hours,
      totals,
      hourly: filledBuckets,
      topReasons,
      recent
    });
  } catch (err: any) {
    logger.error({ err }, 'push analytics failed');
    res.status(500).json({ error: 'Failed to load push analytics' });
  }
});

// Schedule a future broadcast — body shape is identical to /push/broadcast
// plus a `scheduledAt` ISO timestamp. The job lands in BroadcastJob
// with status='pending' until the scheduler tick runs it.
const ScheduleSchema = z.object({
  // Target — exactly one of these three
  userId: z.string().min(8).max(64).optional(),
  userIds: z.array(z.string().min(8).max(64)).min(1).max(500).optional(),
  role: z.enum(['customer', 'cashier', 'dealer', 'distributor', 'admin']).optional(),

  // Push payload
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(2000),
  url: z.string().min(1).max(512).default('/'),
  eventKey: z.string().min(1).max(64).default('custom'),
  tag: z.string().max(64).optional(),
  note: z.string().max(256).optional(),

  // Schedule — must be in the future. 60s minimum lead time so we
  // don't accidentally fire "scheduled now" jobs in a confused state
  // when the scheduler races with the response.
  scheduledAt: z.string().datetime().refine(
    (s) => new Date(s).getTime() > Date.now() + 60_000,
    'scheduledAt must be at least 60s in the future'
  )
});

router.post('/schedule', authenticateJWT, requireRole('admin'), validate({ body: ScheduleSchema }), async (req: any, res: Response) => {
  const { userId, userIds, role, title, body, url, eventKey, tag, note, scheduledAt } = req.body;

  // Validate target spec (same rules as /broadcast).
  const targets = await resolveBroadcastTargets({ userId, userIds, role });
  if (targets.error) {
    return res.status(400).json({ error: targets.error });
  }
  if (targets.ids.length === 0) {
    return res.status(404).json({ error: 'No matching users' });
  }
  if (targets.ids.length > 500) {
    return res.status(413).json({ error: `Too many targets (${targets.ids.length}); cap is 500 per job` });
  }

  // Determine targetMode for storage
  let targetMode: 'single' | 'multi' | 'segment';
  let storedIds: string | null = null;
  let storedRole: string | null = null;
  if (userId) {
    targetMode = 'single';
    storedIds = JSON.stringify([userId]);
  } else if (Array.isArray(userIds)) {
    targetMode = 'multi';
    storedIds = JSON.stringify(userIds);
  } else {
    targetMode = 'segment';
    storedRole = role;
  }

  const job = await prisma.broadcastJob.create({
    data: {
      actorId: req.user.userId,
      note: note || null,
      targetMode,
      targetIds: storedIds,
      segmentRole: storedRole,
      title,
      body,
      url: url || '/',
      eventKey: eventKey || 'custom',
      tag: tag || null,
      scheduledAt: new Date(scheduledAt)
    }
  });

  logger.info({
    actor: req.user.userId,
    jobId: job.id,
    scheduledAt,
    targetCount: targets.ids.length
  }, 'broadcast scheduled');

  res.status(201).json({
    id: job.id,
    scheduledAt: job.scheduledAt,
    targetCount: targets.ids.length,
    status: job.status
  });
});

// List scheduled jobs (pending + recently dispatched/cancelled).
router.get('/scheduled', authenticateJWT, requireRole('admin'), async (req: any, res: Response) => {
  const status = req.query.status as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const where: any = {};
  if (status && ['pending', 'dispatched', 'cancelled', 'failed'].includes(status)) {
    where.status = status;
  }
  const jobs = await prisma.broadcastJob.findMany({
    where,
    orderBy: [{ status: 'asc' }, { scheduledAt: 'asc' }],
    take: limit,
    include: {
      actor: { select: { id: true, name: true, email: true } }
    }
  });
  res.json({ rows: jobs, count: jobs.length });
});

// Cancel a pending job. Returns 409 if already dispatched/cancelled/failed.
router.delete('/scheduled/:id', authenticateJWT, requireRole('admin'), async (req: any, res: Response) => {
  const id = req.params.id;
  const job = await prisma.broadcastJob.findUnique({ where: { id } });
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status !== 'pending') {
    return res.status(409).json({ error: `Cannot cancel job in status '${job.status}'` });
  }
  const cancelled = await prisma.broadcastJob.update({
    where: { id },
    data: { status: 'cancelled', cancelledAt: new Date() }
  });
  logger.info({ actor: req.user.userId, jobId: id }, 'scheduled broadcast cancelled');
  res.json({ ok: true, status: cancelled.status });
});

// Admin-only debug endpoint — run the scheduler tick immediately
// (used by tests + manual recovery after a server outage).
router.post('/scheduled-tick', authenticateJWT, requireRole('admin'), async (req: any, res: Response) => {
  await runSchedulerTick();
  res.json({ ok: true });
});

// Boot the scheduler. Idempotent.
startScheduler();

// Boot the cart-abandonment sweeper. Runs every 5 minutes and
// pushes a localised "your cart is waiting" notification to any
// user who added items but never checked out for 1h. Started here
// (rather than index.ts) so it shares the lifecycle with the
// other push-related side effects.
import { startCartAbandonmentSweeper } from '../services/cartAbandonmentService';
startCartAbandonmentSweeper();

export default router;
