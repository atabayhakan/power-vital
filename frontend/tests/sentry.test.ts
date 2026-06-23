// Unit tests for utils/sentry.ts.
//
// The wrapper is production-only, lazy-loaded, and fail-open. We mock
// @sentry/vue so the dynamic import resolves to a controllable stub.
// We also poke `import.meta.env.PROD` and `VITE_SENTRY_DSN` via vi.stubEnv
// (vitest 0.34+) so we can exercise the no-op and active paths.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Hoisted mock for @sentry/vue — vi.mock is hoisted ABOVE all imports.
const sentryMock = vi.hoisted(() => {
  const captureException = vi.fn();
  const setUser = vi.fn();
  const withScope = vi.fn((cb: (scope: unknown) => void) =>
    cb({
      setTag: vi.fn(),
      setUser: vi.fn(),
      setLevel: vi.fn()
    })
  );
  const init = vi.fn();
  return {
    init,
    captureException,
    setUser,
    withScope
  };
});

vi.mock('@sentry/vue', () => sentryMock);

vi.mock('vue-router', () => ({
  default: {
    afterEach: vi.fn()
  }
}));

// A minimal Vue app stub — Sentry.init only receives this object.
const fakeApp = { config: {} } as unknown as import('vue').App;
const fakeRouter = {
  afterEach: vi.fn()
} as unknown as import('vue-router').Router;

describe('utils/sentry.ts', () => {
  beforeEach(() => {
    vi.resetModules();
    sentryMock.init.mockClear();
    sentryMock.captureException.mockClear();
    sentryMock.setUser.mockClear();
    sentryMock.withScope.mockClear();
    (fakeRouter.afterEach as unknown as ReturnType<typeof vi.fn>).mockClear?.();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is a no-op in dev mode (PROD=false)', async () => {
    vi.stubEnv('PROD', false);
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@sentry.example/1');

    const sentry = await import('../src/utils/sentry');
    const ok = await sentry.initSentry(fakeApp, fakeRouter);

    expect(ok).toBe(false);
    expect(sentry.isSentryEnabled()).toBe(false);
    expect(sentryMock.init).not.toHaveBeenCalled();
  });

  it('is a no-op when VITE_SENTRY_DSN is missing', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_SENTRY_DSN', '');

    const sentry = await import('../src/utils/sentry');
    const ok = await sentry.initSentry(fakeApp, fakeRouter);

    expect(ok).toBe(false);
    expect(sentry.isSentryEnabled()).toBe(false);
    expect(sentryMock.init).not.toHaveBeenCalled();
  });

  it('initializes Sentry and reports enabled state when DSN is set', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@sentry.example/1');
    vi.stubEnv('VITE_SENTRY_ENV', 'staging');
    vi.stubEnv('VITE_SENTRY_TRACES_SAMPLE_RATE', '0.25');

    const sentry = await import('../src/utils/sentry');
    const ok = await sentry.initSentry(fakeApp, fakeRouter);

    expect(ok).toBe(true);
    expect(sentry.isSentryEnabled()).toBe(true);
    expect(sentryMock.init).toHaveBeenCalledTimes(1);
    const initArg = sentryMock.init.mock.calls[0][0];
    expect(initArg.dsn).toBe('https://public@sentry.example/1');
    expect(initArg.environment).toBe('staging');
    expect(initArg.tracesSampleRate).toBe(0.25);
    expect(initArg.beforeBreadcrumb).toBeTypeOf('function');
    expect(initArg.beforeSendTransaction).toBeTypeOf('function');
  });

  it('defaults environment to "production" when not set', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@sentry.example/2');
    vi.stubEnv('VITE_SENTRY_ENV', '');

    const sentry = await import('../src/utils/sentry');
    await sentry.initSentry(fakeApp, fakeRouter);

    expect(sentryMock.init.mock.calls[0][0].environment).toBe('production');
  });

  it('captureException forwards errors with tags + user', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@sentry.example/3');

    const sentry = await import('../src/utils/sentry');
    await sentry.initSentry(fakeApp, fakeRouter);

    sentry.captureException(new Error('boom'), {
      route: '/checkout',
      userId: 'u-1',
      locale: 'tr',
      tags: { component: 'ErrorBoundary', phase: 'render' }
    });

    expect(sentryMock.withScope).toHaveBeenCalledTimes(1);
    expect(sentryMock.captureException).toHaveBeenCalledTimes(1);
    expect(sentryMock.captureException.mock.calls[0][0].message).toBe('boom');
  });

  it('setSentryUser forwards to Sentry.setUser', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@sentry.example/4');

    const sentry = await import('../src/utils/sentry');
    await sentry.initSentry(fakeApp, fakeRouter);

    sentry.setSentryUser({ id: 'u-2', email: 'u@example.com' });
    expect(sentryMock.setUser).toHaveBeenCalledWith({ id: 'u-2', email: 'u@example.com' });

    sentry.setSentryUser(null);
    expect(sentryMock.setUser).toHaveBeenCalledWith(null);
  });

  it('captureException is safe to call BEFORE initSentry (no-op)', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_SENTRY_DSN', '');

    const sentry = await import('../src/utils/sentry');
    // No init — must not throw.
    expect(() =>
      sentry.captureException(new Error('early'), { route: '/x' })
    ).not.toThrow();
    expect(sentryMock.captureException).not.toHaveBeenCalled();
  });

  it('captures the route after each router transition', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@sentry.example/5');

    const sentry = await import('../src/utils/sentry');
    await sentry.initSentry(fakeApp, fakeRouter);

    expect((fakeRouter.afterEach as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it('scrubs auth tokens from URL in beforeSendTransaction', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@sentry.example/6');

    const sentry = await import('../src/utils/sentry');
    await sentry.initSentry(fakeApp, fakeRouter);

    const initArg = sentryMock.init.mock.calls[0][0];
    const scrub = initArg.beforeSendTransaction;
    const event = {
      request: { url: 'https://api.example/foo?token=secret123&access_token=abc&keep=ok' }
    };
    const out = scrub(event);
    expect(out?.request?.url).toBe('https://api.example/foo?token=[redacted]&access_token=[redacted]&keep=ok');
  });

  it('drops console breadcrumbs via beforeBreadcrumb', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@sentry.example/7');

    const sentry = await import('../src/utils/sentry');
    await sentry.initSentry(fakeApp, fakeRouter);

    const initArg = sentryMock.init.mock.calls[0][0];
    const filter = initArg.beforeBreadcrumb;
    expect(filter({ category: 'console' })).toBeNull();
    expect(filter({ category: 'navigation' })).toEqual({ category: 'navigation' });
  });
});