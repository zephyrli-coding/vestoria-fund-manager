import { create } from 'zustand';
import type { Fund, FundCreate, FundUpdate, PaginatedResponse, FundChartData } from '@/types/api';

interface FundState {
  funds: Fund[];
  currentFund: Fund | null;
  loading: boolean;
  error: string | null;
}

interface FundActions {
  fetchFunds: () => Promise<void>;
  createFund: (data: FundCreate) => Promise<void>;
  updateFund: (id: number, data: FundUpdate) => Promise<void>;
  deleteFund: (id: number) => Promise<void>;
  updateNav: (id: number, capital: number, date: string) => Promise<void>;
  setCurrentFund: (fund: Fund) => void;
}

interface FundStore extends FundState, FundActions {}

// 辅助函数：获取 token
const getToken = () => localStorage.getItem('token');

// 辅助函数：API 请求
const request = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`http://localhost:8000/api/v1${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
};

// 创建基金 store
export const useFundStore = create<FundStore>((set, get) => ({
  funds: [],
  currentFund: null,
  loading: false,
  error: null,

  fetchFunds: async () => {
    set({ loading: true, error: null });
    try {
      const response = await request<PaginatedResponse<Fund>>('/funds');

      if (response.code === 0) {
        set({ funds: response.data.items });
      } else {
        set({ error: response.message || 'Failed to fetch funds' });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch funds' });
    } finally {
      set({ loading: false });
    }
  },

  createFund: async (data: FundCreate) => {
    set({ loading: true, error: null });
    try {
      const response = await request<{ data: Fund }>('/funds', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.code === 0) {
        set({ funds: [...get().funds, response.data] });
      } else {
        set({ error: response.message || 'Failed to create fund' });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to create fund' });
    } finally {
      set({ loading: false });
    }
  },

  updateFund: async (id: number, data: FundUpdate) => {
    set({ loading: true, error: null });
    try {
      const response = await request<{ data: Fund }>(`/funds/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (response.code === 0) {
        set((state) => ({
          funds: state.funds.map(f => f.id === id ? response.data : f),
        }));
      } else {
        set({ error: response.message || 'Failed to update fund' });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to update fund' });
    } finally {
      set({ loading: false });
    }
  },

  deleteFund: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await request(`/funds/${id}`, {
        method: 'DELETE',
      });

      if (response.code === 0) {
        set((state) => ({
          funds: state.funds.filter(f => f.id !== id),
        }));
      } else {
        set({ error: response.message || 'Failed to delete fund' });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete fund' });
    } finally {
      set({ loading: false });
    }
  },

  updateNav: async (id: number, capital: number, date: string) => {
    set({ loading: true, error: null });
    try {
      const response = await request<{ data: any }>('/funds/nav/update', {
        method: 'POST',
        body: JSON.stringify({ fund_id: id, capital, date }),
      });

      if (response.code === 0) {
        // 刷新基金列表
        await get().fetchFunds();
      } else {
        set({ error: response.message || 'Failed to update NAV' });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to update NAV' });
    } finally {
      set({ loading: false });
    }
  },

  setCurrentFund: (fund: Fund) => {
    set({ currentFund: fund });
  },
}));
