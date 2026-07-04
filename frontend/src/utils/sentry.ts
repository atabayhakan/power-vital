// utils/sentry.ts — production-only Sentry wiring with a strict
// "fail-open" contract:
//
//   • If VITE_SENTRY_DSN is not set, this module is a no-op.
//   • The @sentry/vue package is dynamically imported, so it stays out
//     of the initial bundle and is only fetched when DSN is present.
//   • All public helpers are wrapped in try/catch so a Sentry outage
//     or init failure can never break the app or swallow real errors.
//
// Why both Sentry AND the backend /errors/report?
//   • /errors/report is the system of record (admin dashboard, MySQL).
//   • Sentry adds grouped stack traces, release tracking, source maps,
//     and alert webhooks. The two are complementary, not redundant.
//   • If Sentry fails, the backend feed still gets the report.

interface SentryContext {
  route?: string;
  userId?: string | null;
  locale?: string;
  tags?: Record<string, string>;
}

interface SentryApi {
  initialized: boolean;
  captureException: (error: Error, context?: SentryContext) => void;
  setUser: (user: { id: string; email?: string } | null) => void;
  setRoute: (route: string) => void;
}

const api: SentryApi = {
  initialized: false,

  captureException(_error: Error, _context?: SentryContext) {
    /* replaced at initSentry() */
  },

  setUser(_user: { id: string; email?: string } | null) {
    /* replaced at initSentry() */
  },

  setRoute(_route: string) {
    /* replaced at initSentry() */
  }
};

/**
 * Initialize Sentry. Call exactly once from main.ts after the Vue app
 * is created. Returns `true` if Sentry was wired up, `false` otherwise
 * (no DSN, dev mode, or init failure).
 */
export const initSentry = async (
  app: import('vue').App,
  router: import('vue-router').Router
): Promise<boolean> => {
  if (!import.meta.env.PROD) {
    return false;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    return false;
  }

  try {
    const Sentry = await import('@sentry/vue');

    Sentry.init({
      app,
      dsn,
      // `||` (not `??`) so an empty-string env var also falls back to
      // 'production' — Vite injects "" for an unset define, which `??` keeps.
      environment: import.meta.env.VITE_SENTRY_ENV || 'production',
      release: import.meta.env.VITE_SENTRY_RELEASE,
      tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0),
      // We don't want Sentry to capture console errors as separate
      // breadcrumbs — every error already reaches the backend via
      // /errors/report. This keeps the Sentry feed focused on real
      // uncaught exceptions and promise rejections.
      beforeBreadcrumb(crumb) {
        if (crumb.category === 'console') return null;
        return crumb;
      },
      // Strip auth tokens from any captured URL query strings.
      beforeSendTransaction(event) {
        if (event.request?.url) {
          event.request.url = event.request.url.replace(/([?&])(token|access_token)=[^&]+/g, '$1$2=[redacted]');
        }
        return event;
      }
    });

    // Track route changes as breadcrumbs so Sentry knows what page
    // the user was on when the error fired.
    router.afterEach((to) => {
      api.setRoute(to.fullPath);
    });

    api.captureException = (error: Error, context: SentryContext = {}) => {
      try {
        Sentry.withScope((scope) => {
          if (context.route) scope.setTag('route', context.route);
          if (context.userId) scope.setUser({ id: context.userId });
          if (context.locale) scope.setTag('locale', context.locale);
          if (context.tags) {
            for (const [k, v] of Object.entries(context.tags)) {
              scope.setTag(k, v);
            }
          }
          scope.setLevel('error');
          Sentry.captureException(error);
        });
      } catch {
        // Fail open — never let Sentry break the calling error path.
      }
    };

    api.setUser = (user) => {
      try {
        Sentry.setUser(user);
      } catch {
        /* fail open */
      }
    };

    api.initialized = true;
    return true;
  } catch (err) {
     
    console.warn('[sentry] init failed, continuing without it:', err);
    return false;
  }
};

export const isSentryEnabled = (): boolean => api.initialized;

export const captureException = (error: Error, context?: SentryContext): void => {
  api.captureException(error, context);
};

export const setSentryUser = (user: { id: string; email?: string } | null): void => {
  api.setUser(user);
};