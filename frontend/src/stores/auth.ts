import { readApiResponse } from '@/utils/request';
import { create } from 'zustand';
import { apiFetch, redirectToAuthLogin, redirectToGlobalLogout } from '@/config/api';
import type { User } from '@/types/api';

// 全局类型
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
}

interface AuthActions {
  login: () => void;
  handleCallback: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

interface AuthStore extends AuthState, AuthActions {}

// 创建 store
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoggingOut: false,

  login: () => {
    redirectToAuthLogin();
  },

  handleCallback: async (code: string) => {
    const response = await apiFetch(`/auth/callback?code=${encodeURIComponent(code)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await readApiResponse<any>(response);

    if (data.code === 0) {
      set({
        user: data.data.user,
        isAuthenticated: true,
      });
    } else {
      throw new Error(data.message || '登录失败');
    }
  },

  logout: async () => {
    // Keep the login route from starting OAuth before the global logout POST finishes.
    set({ isLoggingOut: true });
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
    set({
      user: null,
      isAuthenticated: false,
    });
    redirectToGlobalLogout();
    }
  },

  checkAuth: async () => {
    try {
      const response = await apiFetch('/auth/me');
      const data = await readApiResponse<any>(response);

      if (data.code === 0) {
        set({ user: data.data, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false });
    }
  },
}));
