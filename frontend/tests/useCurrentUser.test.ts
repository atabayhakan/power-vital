// Unit tests for useCurrentUser / useIsAdmin composables.
// We mock the auth store so tests don't need a real Pinia session.
// The mock returns a reactive ref so .value writes propagate to the
// composable's computed and trigger re-evaluation.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

const mockUser = ref<{ id?: string; role?: string; email?: string; name?: string } | null>(null);

vi.mock('../src/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    get user() { return mockUser.value; }
  })
}));

import { useCurrentUser, useIsAdmin } from '../src/composables/useCurrentUser';

describe('useCurrentUser', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockUser.value = null;
  });

  it('returns null when no user is logged in', () => {
    const u = useCurrentUser();
    expect(u.value).toBeNull();
  });

  it('returns a typed snapshot when a user is logged in', () => {
    mockUser.value = { id: 'u-1', role: 'admin', email: 'a@b.com', name: 'A', loyaltyLevel: 3, dynamicDiscountRate: '7.5' };
    const u = useCurrentUser();
    expect(u.value).toEqual({
      id: 'u-1', role: 'admin', email: 'a@b.com', name: 'A',
      loyaltyLevel: 3, dynamicDiscountRate: 7.5
    });
  });

  it('defaults role to customer when store returns no role', () => {
    mockUser.value = { id: 'u-2', email: 'x@y.com', name: 'X' };
    const u = useCurrentUser();
    expect(u.value?.role).toBe('customer');
  });

  it('falls back to empty email/name when missing', () => {
    mockUser.value = { id: 'u-3', role: 'cashier' };
    const u = useCurrentUser();
    expect(u.value?.email).toBe('');
    expect(u.value?.name).toBe('');
  });

  it('reflects subsequent store changes (reactive)', () => {
    const u = useCurrentUser();
    expect(u.value).toBeNull();
    mockUser.value = { id: 'u-4', role: 'distributor' };
    expect(u.value?.id).toBe('u-4');
    mockUser.value = null;
    expect(u.value).toBeNull();
  });
});

describe('useIsAdmin', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockUser.value = null;
  });

  it('returns false when no user', () => {
    const a = useIsAdmin();
    expect(a.value).toBe(false);
  });

  it('returns false for non-admin', () => {
    mockUser.value = { id: 'u', role: 'customer' };
    const a = useIsAdmin();
    expect(a.value).toBe(false);
  });

  it('returns true for admin', () => {
    mockUser.value = { id: 'u', role: 'admin' };
    const a = useIsAdmin();
    expect(a.value).toBe(true);
  });
});