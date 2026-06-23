// useCountdown — small composable that ticks every second and
// returns the time remaining until a target Date. Stops cleanly
// when the target is reached so the host component can render an
// "ended" state.
//
// Used by PromoBanner / countdown hero to show "X gün Y saat Z
// dakika" under a campaign. We split into days/hours/minutes/seconds
// on the client so the template can use simple numeric fields
// instead of doing date math.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  ended: boolean;
}

const partsFromMs = (ms: number): CountdownParts => {
  if (ms <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, ended: true };
  }
  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const minutes = Math.floor((ms % HOUR) / MINUTE);
  const seconds = Math.floor((ms % MINUTE) / SECOND);
  return { days, hours, minutes, seconds, totalMs: ms, ended: false };
};

export function useCountdown(target: Date | string | number) {
  const targetMs = (typeof target === 'string' || typeof target === 'number')
    ? new Date(target).getTime()
    : target.getTime();

  const now = ref(Date.now());
  let intervalHandle: number | null = null;

  const tick = () => { now.value = Date.now(); };

  onMounted(() => {
    tick();
    intervalHandle = window.setInterval(tick, 1000);
  });

  onBeforeUnmount(() => {
    if (intervalHandle !== null) window.clearInterval(intervalHandle);
  });

  const parts = computed<CountdownParts>(() => partsFromMs(targetMs - now.value));
  const ended = computed(() => parts.value.ended);
  const days = computed(() => parts.value.days);
  const hours = computed(() => parts.value.hours);
  const minutes = computed(() => parts.value.minutes);
  const seconds = computed(() => parts.value.seconds);

  return { parts, ended, days, hours, minutes, seconds, targetMs };
}

export default useCountdown;
