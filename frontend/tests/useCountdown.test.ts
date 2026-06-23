// Pure-logic tests for useCountdown. We test the helper that
// converts a millisecond delta into days/hours/minutes/seconds
// without spinning up the actual interval (which would need a
// Vue component + fake timers).
import { describe, it, expect } from 'vitest';

// We export the internal `partsFromMs` indirectly by importing the
// composable and calling it with a target in the past so the
// computed runs synchronously.
import { useCountdown } from '../src/composables/useCountdown';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('useCountdown — parts calculation', () => {
  it('ended=true when target is in the past', () => {
    const past = new Date(Date.now() - 60_000);
    const { ended, days, hours, minutes, seconds } = useCountdown(past);
    expect(ended.value).toBe(true);
    expect(days.value).toBe(0);
    expect(hours.value).toBe(0);
    expect(minutes.value).toBe(0);
    expect(seconds.value).toBe(0);
  });

  it('returns full days correctly for a target 3 days + 5 hours out', () => {
    const future = new Date(Date.now() + 3 * DAY + 5 * HOUR);
    const { parts } = useCountdown(future);
    expect(parts.value.days).toBe(3);
    expect(parts.value.hours).toBeGreaterThanOrEqual(4);
    expect(parts.value.hours).toBeLessThanOrEqual(5);
    expect(parts.value.ended).toBe(false);
  });

  it('returns hours/minutes/seconds for a 1h 23m 45s target', () => {
    const future = new Date(Date.now() + 1 * HOUR + 23 * MINUTE + 45 * SECOND);
    const { parts } = useCountdown(future);
    expect(parts.value.hours).toBe(1);
    expect(parts.value.minutes).toBe(23);
    expect(parts.value.seconds).toBeGreaterThanOrEqual(44);
    expect(parts.value.seconds).toBeLessThanOrEqual(45);
  });

  it('accepts an ISO string as the target', () => {
    const future = new Date(Date.now() + 2 * HOUR);
    const iso = future.toISOString();
    const { parts } = useCountdown(iso);
    expect(parts.value.hours).toBeGreaterThanOrEqual(1);
    expect(parts.value.hours).toBeLessThanOrEqual(2);
    expect(parts.value.ended).toBe(false);
  });

  it('accepts a numeric timestamp as the target', () => {
    const future = new Date(Date.now() + 30 * MINUTE);
    const ts = future.getTime();
    const { parts } = useCountdown(ts);
    expect(parts.value.minutes).toBeGreaterThanOrEqual(29);
    expect(parts.value.minutes).toBeLessThanOrEqual(30);
  });

  it('totalMs matches the difference between target and now', () => {
    const future = new Date(Date.now() + 5 * SECOND);
    const { parts, targetMs } = useCountdown(future);
    // Total remaining should be close to 5s, allow some slack for
    // the time elapsed between the two `Date.now()` calls.
    expect(parts.value.totalMs).toBeLessThanOrEqual(5_000);
    expect(parts.value.totalMs).toBeGreaterThan(0);
    expect(targetMs).toBe(future.getTime());
  });

  it('clamps to all-zero when target is exactly now', () => {
    const now = new Date();
    const { parts } = useCountdown(now);
    // The next tick will register `ended=true`, but on the first
    // read the difference is ~0 (could be 0 or 1ms). Either way
    // the helper clamps to zero and marks ended.
    expect(parts.value.ended).toBe(true);
    expect(parts.value.days + parts.value.hours + parts.value.minutes + parts.value.seconds).toBe(0);
  });
});
