import { create } from 'zustand';
import { apiUrl, redirectToAuthLogin } from '@/config/api';
import type { User } from '@/types/api';

const TOKEN_KEY = 'token';

// 全局类型
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: () => void;
  handleCallback: (code: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

interface AuthStore extends AuthState, AuthActions {}

// 创建 store
export const useAuthStore = create<AuthStore>((set) => ({
  token: localStorage.getItem(TOKEN_KEY) || null,
  user: null,
  isAuthenticated: false,

  login: () => {
    redirectToAuthLogin();
  },

  handleCallback: async (code: string) => {
    const response = await fetch(apiUrl(`/auth/callback?code=${encodeURIComponent(code)}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (data.code === 0) {
      const token = data.data.access_token;
      localStorage.setItem(TOKEN_KEY, token);

      set({
        token,
        user: data.data.user,
        isAuthenticated: true,
      });
    } else {
      throw new Error(data.message || '登录失败');
    }
  },

  logout: () => {
    // 清除 token
    localStorage.removeItem(TOKEN_KEY);

    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ token: null, user: null, isAuthenticated: false });
      return;
    }

    try {
      // 验证 token 是否有效
      const response = await fetch(apiUrl('/auth/me'), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.code === 0) {
        set({ token, user: data.data, isAuthenticated: true });
      } else {
        // Token 无效，清除它
        localStorage.removeItem(TOKEN_KEY);
        set({ token: null, user: null, isAuthenticated: false });
      }
    } catch (error) {
      // Token 验证失败，清除它
      localStorage.removeItem(TOKEN_KEY);
      set({ token: null, user: null, isAuthenticated: false });
    }
  },
}));
