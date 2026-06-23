// Error tracking — wires the front-end error boundary + global handlers
// to BOTH:
//   1. The backend's /api/v1/errors/report endpoint (system of record,
//      admin dashboard, MySQL persistence).
//   2. Sentry (lazy-loaded via utils/sentry.ts), when configured.
//
// Why two destinations?
//   • The backend feed is ours — always on, no third-party outages,
//     feeds the existing AdminErrorsView dashboard.
//   • Sentry adds grouped stack traces, release tracking, source maps,
//     and alert webhooks. It's a complement, not a replacement.
//   • Both are best-effort. A failure in either MUST NOT mask the
//     original error from the caller.
//
// Failure handling:
//   • We swallow network errors from /errors/report — the caller
//     (ErrorBoundary, global handler) is already in an error path,
//     and a secondary failure would just spam the console.
//   • In dev mode we log to console instead of hitting the network,
//     so devs don't pollute the production feed while iterating.
//   • Sentry wrapper (utils/sentry.ts) is itself fail-open — see that
//     file for the contract.

import { apiPost } from '../api/openapi-client';
import { captureException as captureToSentry, isSentryEnabled } from './sentry';

interface ErrorContext {
  route?: string;
  userId?: string | null;
  locale?: string;
  tags?: Record<string, string>;
}

interface ReportPayload {
  message: string;
  stack?: string;
  source: string;
  phase?: string;
  route?: string;
  locale?: string;
  context?: string;
  clientTimestamp: string;
}

/**
 * Report an error to the backend's error ingestion endpoint.
 *
 * In dev (import.meta.env.PROD === false) we just log — keeps the
 * network clean and lets devs see exactly what would be sent.
 * In production we POST to /api/v1/errors/report.
 *
 * If Sentry is enabled (DSN configured), we ALSO forward the error
 * there for stack-trace grouping and alert webhooks. Both calls are
 * fire-and-forget — they do not block, and they swallow their own
 * errors so they can't mask the original.
 */
export const reportError = (error: Error, context: ErrorContext = {}): void => {
  const payload: ReportPayload = {
    message: error.message.slice(0, 500),
    stack: error.stack?.slice(0, 32768),
    source: context.tags?.component ?? 'unknown',
    phase: context.tags?.phase,
    route: context.route,
    locale: context.locale,
    context: context.tags ? JSON.stringify(context.tags).slice(0, 2048) : undefined,
    clientTimestamp: new Date().toISOString(),
  };

  if (!import.meta.env.PROD) {
    // eslint-disable-next-line no-console
    console.warn('[errorTracking:dev]', payload);
    return;
  }

  // Fan out to Sentry first (synchronous, fail-open, no network).
  // Then to the backend (async, fail-open).
  if (isSentryEnabled()) {
    captureToSentry(error, context);
  }

  // Fire-and-forget. We deliberately do NOT await — the caller is
  // usually inside a catch block and we don't want to mask the
  // original error with a secondary one from this helper.
  apiPost('/api/v1/errors/report', payload).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[errorTracking] failed to send report', err);
  });
};