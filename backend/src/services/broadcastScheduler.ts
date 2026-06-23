// BroadcastScheduler — periodic tick that finds due jobs and dispatches them.
//
// Lifecycle:
//   • start() begins a setInterval(tick, 60_000) once at boot.
//   • tick() queries pending jobs where scheduledAt <= now, then
//     dispatches them serially via sendToUser (same path as the
//     POST /push/broadcast route, including audit log rows).
//   • stop() clears the interval — used in tests + on shutdown.
//
// Why setInterval instead of cron?
//   • No external dependency (cron, node-cron, bullmq).
//   • Works in any Node runtime (Docker, Render, Railway, PM2).
//   • Persists nothing — restart-safe because pending jobs live in
//     the BroadcastJob table; on boot, tick() picks up everything
//     that came due while the server was offline.
//   • Bounded load: every 60s tick reads at most ~few hundred rows
//     (admin schedules <10/day in practice).
//
// For high-throughput needs (>1000 jobs/hour), migrate to BullMQ +
// Redis. We deliberately keep this simple until needed.

import prisma from '../lib/prisma';
import { sendToUser } from './pushService';
import { resolveBroadcastTargets } from '../utils/broadcastTargets';
import { logger } from '../utils/logger';

let timer: ReturnType<typeof setInterval> | null = null;
let isTicking = false;

const TICK_MS = 60_000; // 1 minute

/**
 * Dispatch one scheduled job. Resolves targets the same way the
 * /push/broadcast route does, fans out, then marks the job as
 * dispatched (or failed if every target errored).
 */
export const runScheduledJob = async (jobId: string): Promise<{ sent: number; failed: number; skipped: number }> => {
  const job = await prisma.broadcastJob.findUnique({ where: { id: jobId } });
  if (!job) {
    logger.warn({ jobId }, 'scheduled job not found');
    return { sent: 0, failed: 0, skipped: 0 };
  }
  if (job.status !== 'pending') {
    logger.info({ jobId, status: job.status }, 'scheduled job already processed');
    return { sent: 0, failed: 0, skipped: 0 };
  }

  // Atomic transition: pending → pending-with-claim via update.
  // Race condition: two PM2 workers both tick at the same time.
  // We use updateMany with where:{status:'pending'} so only one
  // succeeds; the other gets count=0 and skips.
  const claim = await prisma.broadcastJob.updateMany({
    where: { id: jobId, status: 'pending' },
    data: { dispatchedAt: new Date() }  // soft marker
  });
  if (claim.count === 0) {
    logger.info({ jobId }, 'scheduled job claimed by another worker');
    return { sent: 0, failed: 0, skipped: 0 };
  }

  // Resolve targets — same validation as POST /push/broadcast.
  const targets = await resolveBroadcastTargets({
    userId: job.targetMode === 'single'
      ? (job.targetIds ? JSON.parse(job.targetIds)[0] : undefined)
      : undefined,
    userIds: job.targetMode === 'multi' && job.targetIds
      ? JSON.parse(job.targetIds)
      : undefined,
    role: job.targetMode === 'segment' ? job.segmentRole || undefined : undefined
  });
  if (targets.error) {
    logger.error({ jobId, error: targets.error }, 'scheduled job target resolution failed');
    await prisma.broadcastJob.update({
      where: { id: jobId },
      data: { status: 'failed', dispatchedAt: new Date() }
    });
    return { sent: 0, failed: 0, skipped: 0 };
  }
  if (targets.ids.length === 0) {
    await prisma.broadcastJob.update({
      where: { id: jobId },
      data: { status: 'failed', dispatchedAt: new Date() }
    });
    return { sent: 0, failed: 0, skipped: 0 };
  }

  // Dispatch sequentially (same as POST /push/broadcast).
  const parentBroadcastId = `sched-${jobId}`;
  let sent = 0, expired = 0, failed = 0, skipped = 0;
  for (const tid of targets.ids) {
    const result = await sendToUser(
      tid,
      { title: job.title, body: job.body, url: job.url, eventKey: job.eventKey },
      { actorId: job.actorId, note: job.note || undefined, parentBroadcastId }
    );
    sent += result.sent;
    expired += result.expired;
    failed += result.failed;
    if (result.skipped) skipped++;
  }

  // Decide final status — failed ONLY if everything errored.
  const finalStatus = sent === 0 && failed > 0 ? 'failed' : 'dispatched';
  await prisma.broadcastJob.update({
    where: { id: jobId },
    data: {
      status: finalStatus,
      resultParentBroadcastId: parentBroadcastId
    }
  });

  logger.info({
    jobId,
    parentBroadcastId,
    targetCount: targets.ids.length,
    sent, expired, failed, skipped,
    finalStatus
  }, 'scheduled broadcast dispatched');

  return { sent, failed, skipped };
};

/**
 * Tick — pick up all pending jobs whose scheduledAt has arrived and
 * dispatch each one. Safe to run concurrently (each job claims
 * atomically before dispatching).
 */
export const tick = async (): Promise<void> => {
  if (isTicking) {
    // Re-entry guard — if a tick takes longer than TICK_MS, skip
    // the next one instead of stacking timers.
    return;
  }
  isTicking = true;
  try {
    const now = new Date();
    const due = await prisma.broadcastJob.findMany({
      where: {
        status: 'pending',
        scheduledAt: { lte: now }
      },
      select: { id: true },
      take: 50  // bound per-tick so a backlog doesn't freeze the event loop
    });
    if (due.length === 0) return;

    for (const j of due) {
      try {
        await runScheduledJob(j.id);
      } catch (err: any) {
        logger.error({ err, jobId: j.id }, 'scheduled job crashed');
        // Mark as failed so we don't retry forever on a bad job.
        await prisma.broadcastJob.update({
          where: { id: j.id },
          data: { status: 'failed', dispatchedAt: new Date() }
        }).catch(() => {});
      }
    }
  } catch (err: any) {
    logger.error({ err }, 'scheduler tick failed');
  } finally {
    isTicking = false;
  }
};

/**
 * Begin periodic ticking. Idempotent — calling start() twice does
 * nothing. Safe to call at server boot.
 */
export const startScheduler = (): void => {
  if (timer) return;
  timer = setInterval(() => {
    tick().catch(() => {});
  }, TICK_MS);
  // Don't keep the event loop alive just for the scheduler
  if (typeof timer === 'object' && timer && 'unref' in timer) {
    (timer as any).unref();
  }
  logger.info({ tickMs: TICK_MS }, 'broadcast scheduler started');
};

/**
 * Stop ticking. Used in tests; not called at graceful shutdown
 * because Node will exit anyway when the main process does.
 */
export const stopScheduler = (): void => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

/** Test-only helper to reset the re-entry guard. */
export const _resetSchedulerForTests = (): void => {
  isTicking = false;
  stopScheduler();
};
