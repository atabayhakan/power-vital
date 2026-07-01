import { defineStore } from 'pinia';
import { ref } from 'vue';
import api, { isPublicPath } from '../utils/api';
import { setSentryUser } from '../utils/sentry';

type UserRole = 'guest' | 'customer' | 'admin' | 'distributor' | 'cashier';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  walletBalanceUsd?: number;
  walletBalanceKgs?: number;
  cumulativeSpendKgs?: number;
  loyaltyLevel?: number;
  dynamicDiscountRate?: number;
}

export const useAuthStore = defineStore('auth', () => {
  // 🛡️ SPOOFING FIX: State is initialized from localStorage for fast SPA navigation.
  // If the token is invalid or spoofed, restoreSession() will immediately wipe it
  // and log the user out upon the first API verification failure.
  const userRole = ref<UserRole>((localStorage.getItem('role') as UserRole) || 'guest');
  const isAuthenticated = ref<boolean>(!!localStorage.getItem('token'));
  const user = ref<UserProfile | null>(JSON.parse(localStorage.getItem('userProfile') || 'null'));

  // Token localStorage'da tutulur (sayfa yenilemede persist için)
  // Ama userProfile ve role sadece backend onayından sonra yazılır.
  const restoreSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      if (res.data) {
        user.value = res.data;
        userRole.value = res.data.role || 'customer';
        isAuthenticated.value = true;
        localStorage.setItem('userProfile', JSON.stringify(res.data));
        localStorage.setItem('role', res.data.role || 'customer');
        localStorage.setItem('userId', res.data.id);
      }
    } catch {
      logout();
    }
  };

  const setAuth = (role: UserRole, profile: UserProfile, token: string, userId: string) => {
    // Güvenlik: sadece backend'den gelen geçerli token ile set edilebilir
    userRole.value = role;
    isAuthenticated.value = true;
    user.value = profile;

    localStorage.setItem('role', role);
    localStorage.setItem('userId', userId);
    localStorage.setItem('userProfile', JSON.stringify(profile));
    localStorage.setItem('token', token);

    // Tag subsequent Sentry events with the authenticated user.
    setSentryUser({ id: profile.id, email: profile.email });
  };

  const logout = () => {
    userRole.value = 'guest';
    isAuthenticated.value = false;
    user.value = null;

    localStorage.removeItem('role');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');

    // Drop the user identity from Sentry so events fire as anonymous.
    setSentryUser(null);
    
    // Only bounce to /login from PROTECTED pages. A session that expires while
    // the visitor is on a public page (homepage, catalog…) must NOT redirect —
    // they simply continue as a guest. Explicit logout actions push to /login
    // themselves, so this doesn't affect the logout button.
    if (typeof window !== 'undefined' && !isPublicPath(window.location.pathname)) {
      window.location.href = '/login';
    }
  };

  const loginAsAdmin = async (email: string, password?: string) => {
    const res = await api.post('/auth/login', {
      email,
      password: password || 'admin123'
    });

    if (res.data.user.role !== 'admin') {
      throw new Error('Yetkisiz Erişim. Bu hesap yönetici değil.');
    }

    setAuth(res.data.user.role, res.data.user, res.data.token, res.data.user.id);
    return true;
  };

  const fetchMe = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data) {
        user.value = res.data;
        userRole.value = res.data.role;
        isAuthenticated.value = true;
        localStorage.setItem('userProfile', JSON.stringify(res.data));
        localStorage.setItem('role', res.data.role);
      }
    } catch (e) {
      logout();
    }
  };

  return {
    userRole,
    isAuthenticated,
    user,
    setAuth,
    logout,
    loginAsAdmin,
    fetchMe,
    restoreSession
  };
});
