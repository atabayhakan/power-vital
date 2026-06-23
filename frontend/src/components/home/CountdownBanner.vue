<script setup lang="ts">
// CountdownBanner — a vibrant top-of-hero strip showing the time
// remaining for an admin-scheduled campaign. The `endsAt` + title
// + CTA all come from /api/v1/settings (admin-editable). If the
// campaign is disabled, the date is missing, or it's already past,
// the banner hides itself completely.
import { computed } from 'vue';
import { useCountdown } from '../../composables/useCountdown';
import { useCampaign } from '../../composables/useCampaign';
import { useTranslate } from '../../composables/useTranslate';
import { useRouter } from 'vue-router';

const router = useRouter();
const { t } = useTranslate();
const { state, isActive } = useCampaign();

// Computed target: campaign endsAt from settings, or null when
// disabled. useCountdown handles null gracefully (returns ended=true).
const endsAt = computed(() => (isActive.value ? state.value.endsAt : null));
const { days, hours, minutes, seconds, ended } = useCountdown(endsAt.value || Date.now());

const visible = computed(() => isActive.value && !ended.value);

const pad = (n: number) => String(n).padStart(2, '0');

const displayTitle = computed(() => state.value.title || t('countdown.title'));
const displayCta = computed(() => state.value.cta || t('countdown.cta'));
const campaignLink = computed(() => state.value.link || '/katalog');

const goToCampaign = () => router.push(campaignLink.value);
</script>

<template>
  <Transition name="cb-fade">
    <aside v-if="visible" class="cb-banner" role="status" aria-live="polite">
      <div class="cb-container">
        <span class="cb-flame" aria-hidden="true">🔥</span>
        <span class="cb-title">{{ displayTitle }}</span>
        <div class="cb-clock" :aria-label="`${days} ${t('countdown.days')} ${hours} ${t('countdown.hours')} ${minutes} ${t('countdown.minutes')} ${seconds} ${t('countdown.seconds')}`">
          <span class="cb-cell"><b>{{ pad(days) }}</b><span class="cb-unit">{{ t('countdown.days') }}</span></span>
          <span class="cb-sep">:</span>
          <span class="cb-cell"><b>{{ pad(hours) }}</b><span class="cb-unit">{{ t('countdown.hours') }}</span></span>
          <span class="cb-sep">:</span>
          <span class="cb-cell"><b>{{ pad(minutes) }}</b><span class="cb-unit">{{ t('countdown.minutes') }}</span></span>
          <span class="cb-sep">:</span>
          <span class="cb-cell"><b>{{ pad(seconds) }}</b><span class="cb-unit">{{ t('countdown.seconds') }}</span></span>
        </div>
        <button type="button" class="cb-cta" @click="goToCampaign">{{ displayCta }} →</button>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.cb-banner {
  background: linear-gradient(135deg, #BC4A3C 0%, #D9633E 50%, #BC4A3C 100%);
  background-size: 200% 200%;
  animation: cbShift 8s ease-in-out infinite;
  color: #fff;
  padding: 10px 16px;
  width: 100%;
  box-shadow: 0 2px 12px rgba(188, 74, 60, 0.25);
}
@keyframes cbShift {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}

.cb-container {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}

.cb-flame { font-size: 1.2rem; line-height: 1; }
.cb-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.cb-clock {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.18);
  padding: 4px 10px;
  border-radius: 999px;
  font-family: var(--font-mono, 'SF Mono', Menlo, monospace);
}

.cb-cell {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}
.cb-cell b {
  font-weight: 800;
  font-size: 1rem;
  letter-spacing: 0.5px;
}
.cb-unit {
  font-family: var(--font-body);
  font-size: 0.7rem;
  font-weight: 600;
  opacity: 0.85;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.cb-sep { font-weight: 800; opacity: 0.6; font-size: 1rem; }

.cb-cta {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s;
}
.cb-cta:hover { background: rgba(255, 255, 255, 0.3); }

@media (max-width: 600px) {
  .cb-banner { padding: 8px 10px; }
  .cb-title { font-size: 0.78rem; }
  .cb-cell b { font-size: 0.86rem; }
  .cb-unit { font-size: 0.6rem; }
  .cb-cta { font-size: 0.7rem; padding: 3px 8px; }
  .cb-flame { font-size: 0.95rem; }
}

.cb-fade-enter-active, .cb-fade-leave-active { transition: opacity 0.4s, transform 0.4s; }
.cb-fade-enter-from, .cb-fade-leave-to { opacity: 0; transform: translateY(-8px); }

@media (prefers-reduced-motion: reduce) {
  .cb-banner { animation: none; }
  .cb-fade-enter-active, .cb-fade-leave-active { transition: none; }
}
</style>
