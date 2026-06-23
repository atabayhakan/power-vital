// Pure-logic tests for useCampaign. We mock axios and the Vue
// lifecycle (onMounted) is exercised naturally when we use the
// composable in a test.
import { describe, it, expect, beforeEach, vi } from 'vitest';

// We mock axios so the composable can be tested without a real
// backend. Each test sets the response payload it wants to
// simulate, then awaits the fetch the composable kicks off in
// onMounted.
const getMock = vi.fn();
vi.mock('axios', () => ({
  default: {
    get: (...args: any[]) => getMock(...args)
  }
}));

// Reset the module-level shared state between describes.
beforeEach(() => {
  vi.resetModules();
  getMock.mockReset();
});

describe('useCampaign — fetch + active state', () => {
  it('starts in the inactive state (no enabled flag)', async () => {
    getMock.mockResolvedValue({ data: {} });
    const mod = await import('../src/composables/useCampaign');
    const { isActive } = mod.useCampaign();
    // The composable triggers fetch in onMounted; since we have
    // no real component lifecycle here we call refresh() instead.
    await mod.useCampaign().refresh();
    expect(isActive.value).toBe(false);
  });

  it('isActive=false when enabled but endsAt is null', async () => {
    getMock.mockResolvedValue({ data: { campaignEnabled: true, campaignEndsAt: null } });
    const mod = await import('../src/composables/useCampaign');
    const c = mod.useCampaign();
    await c.refresh();
    expect(c.state.value.enabled).toBe(true);
    expect(c.state.value.endsAt).toBeNull();
    expect(c.isActive.value).toBe(false);
  });

  it('isActive=false when endsAt is in the past', async () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    getMock.mockResolvedValue({
      data: { campaignEnabled: true, campaignEndsAt: past, campaignTitle: 'Old', campaignCta: 'Buy' }
    });
    const mod = await import('../src/composables/useCampaign');
    const c = mod.useCampaign();
    await c.refresh();
    expect(c.isActive.value).toBe(false);
  });

  it('isActive=true when enabled and endsAt is in the future', async () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    getMock.mockResolvedValue({
      data: {
        campaignEnabled: true,
        campaignEndsAt: future,
        campaignTitle: 'Summer sale',
        campaignCta: 'Shop now',
        campaignLink: '/sale'
      }
    });
    const mod = await import('../src/composables/useCampaign');
    const c = mod.useCampaign();
    await c.refresh();
    expect(c.isActive.value).toBe(true);
    expect(c.state.value.title).toBe('Summer sale');
    expect(c.state.value.cta).toBe('Shop now');
    expect(c.state.value.link).toBe('/sale');
  });

  it('falls back to /katalog when link is missing', async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    getMock.mockResolvedValue({
      data: { campaignEnabled: true, campaignEndsAt: future, campaignLink: null }
    });
    const mod = await import('../src/composables/useCampaign');
    const c = mod.useCampaign();
    await c.refresh();
    expect(c.state.value.link).toBe('/katalog');
  });

  it('keeps previous state when fetch fails', async () => {
    getMock.mockRejectedValue(new Error('network'));
    const mod = await import('../src/composables/useCampaign');
    const c = mod.useCampaign();
    await c.refresh();
    // Default initial state — no enabled, no endsAt
    expect(c.isActive.value).toBe(false);
    expect(c.state.value.title).toBe('');
  });

  it('coerces ISO string endsAt into a Date object', async () => {
    const iso = '2026-12-31T23:59:59.000Z';
    getMock.mockResolvedValue({
      data: { campaignEnabled: true, campaignEndsAt: iso }
    });
    const mod = await import('../src/composables/useCampaign');
    const c = mod.useCampaign();
    await c.refresh();
    expect(c.state.value.endsAt).toBeInstanceOf(Date);
    expect((c.state.value.endsAt as Date).toISOString()).toBe(iso);
  });
});
