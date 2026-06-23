// Server-Sent Events (SSE) — real-time push to admin dashboards.
//
// Why SSE and not socket.io?
//   • Native browser EventSource API — zero npm cost on the client
//   • HTTP/2 + chunked transfer = great for firewalled networks
//   • Reconnection logic is built into the browser
//   • Goes through the same Express middleware chain → JWT auth via
//     HttpOnly cookie works automatically
//   • For our use case (a handful of admin clients) we don't need
//     bidirectional messaging — server-to-client is enough
//
// Events published today:
//   • new_order        — when a customer creates an order
//   • payment_received — when OCR auto-verifies a payment
//   • ocr_pending      — when a payment needs manual review
//   • withdrawal_*     — request / approved / rejected
//   • review_pending   — a customer review needs moderation
//   • low_stock        — product stock fell below the alert threshold
//
// Each event is a tiny JSON payload: { type, data, ts }
import { Request, Response, Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

export interface AdminEvent {
  type: string;
  data: Record<string, unknown>;
  ts: number; // unix ms
}

// ── In-process event bus ─────────────────────────────────────────────────
// A simple EventEmitter would do, but we keep a tiny typed wrapper so
// downstream code gets full IntelliSense on the event types and we can
// add persistence (Redis pub/sub) later without changing call sites.
class AdminEventBus {
  private listeners = new Set<(e: AdminEvent) => void>();

  publish(event: Omit<AdminEvent, 'ts'>) {
    const e: AdminEvent = { ...event, ts: Date.now() };
    for (const fn of this.listeners) {
      try {
        fn(e);
      } catch (err) {
        // A single misbehaving listener must not break the others
        logger.warn({ err: (err as any)?.message, type: e.type }, 'event listener threw');
      }
    }
  }

  subscribe(fn: (e: AdminEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  listenerCount(): number {
    return this.listeners.size;
  }
}

// Module-level singleton — one bus per process. (In a multi-worker
// setup you'd want Redis pub/sub; for our single-PM2-process setup this
// is fine.)
export const adminEvents = new AdminEventBus();

// ── SSE endpoint ────────────────────────────────────────────────────────
//
// GET /api/v1/admin/events
//   Headers: Cookie: pv_refresh=...; (or Authorization: Bearer ...)
//   Response: text/event-stream with `data: <json>\n\n` frames
//
// The connection stays open until the client disconnects. We send a
// heartbeat every 25 seconds to keep proxies (nginx, Cloudflare) from
// closing idle connections.
router.get('/', authenticateJWT, (req: any, res: Response) => {
  // Authorize: only admin and distributor roles can subscribe
  const role = req.user?.role;
  if (role !== 'admin' && role !== 'distributor') {
    return res.status(403).json({ error: 'Admin or distributor role required' });
  }

  // SSE response headers
  res.status(200).set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // disable nginx buffering for streaming
  });
  res.flushHeaders?.();

  // Send a comment frame so the browser's EventSource fires `onopen`
  // immediately. Without this, the client has to wait for the first
  // real event before considering the connection open.
  res.write(': connected\n\n');

  logger.info({ userId: req.user?.id, role }, 'admin SSE client connected');

  const sendEvent = (e: AdminEvent) => {
    // SSE frame: data must be a single line; we use JSON.stringify which
    // never embeds newlines for our event shapes. If you start sending
    // multi-line strings, escape them with .split('\n').join('\\n').
    try {
      res.write(`event: ${e.type}\n`);
      res.write(`data: ${JSON.stringify(e)}\n\n`);
    } catch (err) {
      // Client disconnected mid-write; cleanup happens on 'close' below.
    }
  };

  // Subscribe + start heartbeat
  const unsubscribe = adminEvents.subscribe(sendEvent);
  const heartbeat = setInterval(() => {
    try {
      res.write(`: ping ${Date.now()}\n\n`);
    } catch {
      // Client gone — we'll detect this on 'close' anyway
    }
  }, 25_000);

  // Cleanup on disconnect
  const cleanup = () => {
    clearInterval(heartbeat);
    unsubscribe();
    try { res.end(); } catch {}
    logger.info({ userId: req.user?.id }, 'admin SSE client disconnected');
  };
  req.on('close', cleanup);
  req.on('aborted', cleanup);
  res.on('close', cleanup);

  return undefined;
});

export default router;
