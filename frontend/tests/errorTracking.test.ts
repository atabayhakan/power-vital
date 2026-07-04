// Unit tests for utils/errorTracking.ts — verify the dual-destination
// contract:
//   1. dev mode  → console only, no network
//   2. prod mode → POST to /api/v1/errors/report
//   3. prod mode + Sentry enabled → POST + Sentry captureException
//   4. prod mode + Sentry disabled → POST only (existing behavior)
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockApiPost = vi.fn();
const mockCapture = vi.fn();
const mockIsEnabled = vi.fn();

vi.mock('../src/api/openapi-client', () => ({
  apiPost: (...args: unknown[]) => mockApiPost(...args)
}));

vi.mock('../src/utils/sentry', () => ({
  captureException: (...args: unknown[]) => mockCapture(...args),
  isSentryEnabled: () => mockIsEnabled()
}));

import { reportError } from '../src/utils/errorTracking';

describe('utils/errorTracking.ts', () => {
  beforeEach(() => {
    mockApiPost.mockReset();
    mockCapture.mockReset();
    mockIsEnabled.mockReset();
    mockApiPost.mockResolvedValue({ status: 201 });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('logs to console in dev mode, no network call', () => {
    vi.stubEnv('PROD', false);
    reportError(new Error('dev-boom'), { tags: { component: 'TestComp' } });
    expect(mockApiPost).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  it('POSTs to /api/v1/errors/report in prod when Sentry is disabled', () => {
    vi.stubEnv('PROD', true);
    mockIsEnabled.mockReturnValue(false);

    reportError(new Error('prod-boom'), {
      route: '/cart',
      userId: 'u-1',
      locale: 'tr',
      tags: { component: 'CheckoutView', phase: 'mount' }
    });

    expect(mockApiPost).toHaveBeenCalledTimes(1);
    const [url, payload] = mockApiPost.mock.calls[0];
    // /client-logs, NOT /errors — "/errors/" matches ad-block telemetry
    // filter patterns and gets silently blocked in-browser.
    expect(url).toBe('/api/v1/client-logs/report');
    expect(payload.message).toBe('prod-boom');
    expect(payload.source).toBe('CheckoutView');
    expect(payload.phase).toBe('mount');
    expect(payload.route).toBe('/cart');
    expect(payload.locale).toBe('tr');
    expect(payload.clientTimestamp).toBeTypeOf('string');

    expect(mockCapture).not.toHaveBeenCalled();
  });

  it('dual-reports (Sentry + backend) when Sentry is enabled', () => {
    vi.stubEnv('PROD', true);
    mockIsEnabled.mockReturnValue(true);

    const err = new Error('dual-boom');
    reportError(err, { route: '/admin', tags: { component: 'AdminDashboard' } });

    expect(mockCapture).toHaveBeenCalledTimes(1);
    expect(mockCapture.mock.calls[0][0]).toBe(err);
    expect(mockCapture.mock.calls[0][1]).toMatchObject({
      route: '/admin',
      tags: { component: 'AdminDashboard' }
    });

    expect(mockApiPost).toHaveBeenCalledTimes(1);
  });

  it('truncates message, stack, and context to server limits', () => {
    vi.stubEnv('PROD', true);
    mockIsEnabled.mockReturnValue(false);

    const bigStack = 'a'.repeat(40000);
    const bigContext = { component: 'C', extra: 'x'.repeat(3000) };

    const err = new Error('x'.repeat(800));
    err.stack = bigStack;

    reportError(err, { tags: bigContext });

    const payload = mockApiPost.mock.calls[0][1];
    expect(payload.message.length).toBe(500);
    expect(payload.stack?.length).toBe(32768);
    expect(payload.context?.length).toBeLessThanOrEqual(2048);
  });

  it('does not throw when the backend POST itself rejects', async () => {
    vi.stubEnv('PROD', true);
    mockIsEnabled.mockReturnValue(false);
    mockApiPost.mockRejectedValue(new Error('network down'));

    expect(() =>
      reportError(new Error('original'), { tags: { component: 'X' } })
    ).not.toThrow();

    // Microtask drain so the .catch handler runs.
    await new Promise((r) => setTimeout(r, 0));
    expect(console.error).toHaveBeenCalled();
  });

  it('omits optional fields when context is empty', () => {
    vi.stubEnv('PROD', true);
    mockIsEnabled.mockReturnValue(false);

    reportError(new Error('minimal'));

    const payload = mockApiPost.mock.calls[0][1];
    expect(payload.route).toBeUndefined();
    expect(payload.locale).toBeUndefined();
    expect(payload.phase).toBeUndefined();
    expect(payload.context).toBeUndefined();
    expect(payload.source).toBe('unknown');
  });

  it('source defaults to "unknown" when no component tag', () => {
    vi.stubEnv('PROD', true);
    mockIsEnabled.mockReturnValue(false);

    reportError(new Error('no-comp'));

    expect(mockApiPost.mock.calls[0][1].source).toBe('unknown');
  });

  it('suppresses stale-deployment chunk errors entirely (no backend, no Sentry)', () => {
    vi.stubEnv('PROD', true);
    mockIsEnabled.mockReturnValue(true);

    // Every browser engine words this failure differently — all of them
    // self-heal via main.ts's auto-reload, so none should be reported.
    const staleMessages = [
      'Failed to fetch dynamically imported module: https://powervital.kg/assets/CertificatesBlock-BqYooOx-.js',
      'Unable to preload CSS for /assets/ReviewSection-BPufNEBM.css',
      'error loading dynamically imported module: https://powervital.kg/assets/x.js',
      'Importing a module script failed.'
    ];
    for (const msg of staleMessages) {
      reportError(new Error(msg), { tags: { component: 'ErrorBoundary' } });
    }

    expect(mockApiPost).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();

    // A real error still goes through — the filter must not overmatch.
    reportError(new Error('TypeError: x is not a function'), { tags: { component: 'ErrorBoundary' } });
    expect(mockApiPost).toHaveBeenCalledTimes(1);
  });
});