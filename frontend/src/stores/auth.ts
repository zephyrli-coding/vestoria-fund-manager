import { create } from 'zustand';
import { apiUrl } from '@/config/api';
import type { User } from '@/types/api';

// 全局类型
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

interface AuthStore extends AuthState, AuthActions {}

// 创建 store
export const useAuthStore = create<AuthStore>((set) => ({
  token: localStorage.getItem('token') || null,
  user: null,
  isAuthenticated: false,

  login: async (username, password) => {
    try {
      // 调用 API
      const response = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.code === 0) {
        const token = data.data.access_token;
        
        // 保存 token
        localStorage.setItem('token', token);
        
        // 解析 user（需要从 me 接口获取）
        const meResponse = await fetch(apiUrl('/auth/me'), {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const meData = await meResponse.json();
        
        set({
          token,
          user: meData.data,
          isAuthenticated: true,
        });
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: () => {
    // 清除 token
    localStorage.removeItem('token');
    
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
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
        localStorage.removeItem('token');
        set({ token: null, user: null, isAuthenticated: false });
      }
    } catch (error) {
      // Token 验证失败，清除它
      localStorage.removeItem('token');
      set({ token: null, user: null, isAuthenticated: false });
    }
  },
}));
