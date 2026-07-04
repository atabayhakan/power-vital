// Error tracking — wires the front-end error boundary + global handlers
// to BOTH:
//   1. The backend's /api/v1/client-logs/report endpoint (system of record,
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
 * In production we POST to /api/v1/client-logs/report.
 *
 * If Sentry is enabled (DSN configured), we ALSO forward the error
 * there for stack-trace grouping and alert webhooks. Both calls are
 * fire-and-forget — they do not block, and they swallow their own
 * errors so they can't mask the original.
 */
// Stale-deployment chunk failures: every deploy renames the content-hashed
// asset files, so tabs opened before the deploy fail to lazy-load the old
// names. main.ts detects exactly these and force-reloads the page onto the
// new bundle — the user recovers on their own, and there is nothing for an
// admin to fix. Reporting them only floods the İstemci Hataları feed with
// a burst of noise after every deploy, burying real errors.
// The alternates cover each browser engine's own wording for the same
// failure: Chrome, Vite's preload helper, Firefox, and Safari in order.
export const STALE_CHUNK_PATTERN = /Failed to fetch dynamically imported module|Unable to preload CSS|error loading dynamically imported module|Importing a module script failed/i;

export const reportError = (error: Error, context: ErrorContext = {}): void => {
  if (STALE_CHUNK_PATTERN.test(error.message)) {
     
    console.warn('[errorTracking] stale-chunk error suppressed (auto-reload will recover):', error.message);
    return;
  }

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
  // "/client-logs/" instead of "/errors/": the old path matched
  // error-telemetry patterns in ad-block filter lists, so reports (and the
  // admin resolve action) were silently blocked in-browser for users with
  // an ad blocker or strict tracking protection. The backend keeps
  // /api/v1/errors mounted as a legacy alias. Cast: the generated OpenAPI
  // path types don't know the alias mount.
  (apiPost as any)('/api/v1/client-logs/report', payload).catch((err: unknown) => {
     
    console.error('[errorTracking] failed to send report', err);
  });
};