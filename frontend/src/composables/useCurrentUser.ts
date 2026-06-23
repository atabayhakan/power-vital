// useCurrentUser — single composable that wraps the auth store and
// returns a stable, read-only snapshot of the current user. Replaces
// the `useAuthStore().user` pattern that was repeated across 14
// files. Each component still calls useAuthStore() once (Pinia
// caches the instance), but they no longer reach into store.user
// directly.
//
// Why a composable instead of a getter on the store?
//   • A composable returns a reactive ref the template can destructure
//     safely; reading store.user directly loses reactivity once
//     destructured (a common Vue 3 footgun).
//   • It centralizes the null checks (`!authStore.user?.id`) that
//     were duplicated across ErrorBoundary + AdminErrorsView + admin
//     guards. One helper, one truth.
//   • Future use: when we add feature flags, we can swap the auth
//     store implementation (e.g. to a cookie-based session) without
//     touching 14 components.
import { computed } from 'vue';
import { useAuthStore } from '../stores/useAuthStore';

export interface CurrentUserSnapshot {
  id: string;
  role: 'admin' | 'customer' | 'distributor' | 'cashier' | 'dealer';
  email: string;
  name: string;
  /** Loyalty level (0–10). Affects discount percentage. */
  loyaltyLevel: number;
  /** Server-computed dynamic discount percentage (0–100). */
  dynamicDiscountRate: number;
  /** Cumulative spend in USD — used by WalletView for tier calculation. */
  cumulativeSpendUsd?: number;
}

/**
 * Returns the current user as a typed reactive object, or null when
 * no user is logged in. The returned object is stable (same identity
 * across renders) as long as the underlying store fields don't
 * change — so it's safe to use as a dependency in computed/watchers.
 */
export const useCurrentUser = () => {
  const store = useAuthStore();
  return computed<CurrentUserSnapshot | null>(() => {
    const u = store.user;
    if (!u?.id) return null;
    return {
      id: u.id,
      role: (u.role ?? 'customer') as CurrentUserSnapshot['role'],
      email: u.email ?? '',
      name: u.name ?? '',
      loyaltyLevel: Number(u.loyaltyLevel ?? 0),
      dynamicDiscountRate: Number(u.dynamicDiscountRate ?? 0),
      cumulativeSpendUsd: u.cumulativeSpendUsd
    };
  });
};

/**
 * Convenience boolean — true when the current user has admin role.
 * Useful for v-if guards without a null check.
 */
export const useIsAdmin = () => {
  const user = useCurrentUser();
  return computed(() => user.value?.role === 'admin');
};