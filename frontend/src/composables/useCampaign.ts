// useCampaign — exposes the admin-scheduled hero countdown banner
// from /api/v1/settings. The component reads `state` and renders
// nothing when the campaign is disabled, missing, or expired.
//
// Settings is a public endpoint, so this composable caches for
// 60 seconds to avoid hammering the API on every page nav.

import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

export interface CampaignState {
  enabled: boolean;
  endsAt: Date | null;
  title: string;
  cta: string;
  link: string;
}

// Module-level shared state — same pattern as useCurrency so
// every <CountdownBanner> mount shares the latest values.
const state = ref<CampaignState>({
  enabled: false,
  endsAt: null,
  title: '',
  cta: '',
  link: '/katalog'
});
let lastFetched = 0;
let fetching = false;
let initialized = false;

const CACHE_TTL_MS = 60_000;

const fetchCampaign = async (force = false) => {
  if (fetching) return;
  const age = Date.now() - lastFetched;
  if (!force && initialized && age < CACHE_TTL_MS) return;
  fetching = true;
  try {
    const res = await axios.get('/api/v1/settings');
    const s = res.data || {};
    state.value = {
      enabled: !!s.campaignEnabled,
      endsAt: s.campaignEndsAt ? new Date(s.campaignEndsAt) : null,
      title: s.campaignTitle || '',
      cta: s.campaignCta || '',
      link: s.campaignLink || '/katalog'
    };
    lastFetched = Date.now();
    initialized = true;
  } catch {
    // Leave the previous value in place; an unreachable settings
    // endpoint shouldn't break the storefront.
  } finally {
    fetching = false;
  }
};

export function useCampaign() {
  // Lazy fetch on first use, but only once per page-load.
  onMounted(() => { fetchCampaign(false); });

  const isActive = computed(() => {
    if (!state.value.enabled) return false;
    if (!state.value.endsAt) return false;
    return state.value.endsAt.getTime() > Date.now();
  });

  const refresh = () => fetchCampaign(true);

  return { state, isActive, refresh };
}

export default useCampaign;
