import { ref, readonly } from 'vue';
import axios from 'axios';

const isMlmEnabled = ref(true); // default true until API responds
const loaded = ref(false);

/**
 * Global MLM kill switch composable.
 * Fetches the MLM status from the backend (Redis-cached).
 * Use `isMlmEnabled` in any component to conditionally render MLM features.
 */
export function useMlm() {
  const fetchMlmStatus = async () => {
    if (loaded.value) return; // Only fetch once per session
    try {
      const res = await axios.get('/api/v1/system/mlm-status');
      isMlmEnabled.value = res.data.isMlmEnabled;
    } catch {
      isMlmEnabled.value = false; // Safe fallback: disable MLM on error
    }
    loaded.value = true;
  };

  return {
    isMlmEnabled: readonly(isMlmEnabled),
    fetchMlmStatus
  };
}
