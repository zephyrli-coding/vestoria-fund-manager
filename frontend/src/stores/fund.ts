import { create } from 'zustand';
import type { Fund, FundCreate, FundUpdate, PaginatedResponse, FundChartData, Investor, Operation } from '@/types/api';

interface FundState {
  funds: Fund[];
  currentFund: Fund | null;
  investors: Investor[];
  loading: boolean;
  error: string | null;
}

interface FundActions {
  fetchFunds: () => Promise<void>;
  fetchFundById: (id: number) => Promise<Fund | null>;
  fetchInvestors: (fundId: number) => Promise<Investor[]>;
  fetchOperations: (fundId: number, page?: number, pageSize?: number) => Promise<Operation[]>;
  addInvestor: (fundId: number, name: string) => Promise<void>;
  invest: (fundId: number, investorId: number, amount: number, date: string) => Promise<void>;
  redeem: (fundId: number, investorId: number, amount: number, amountType: 'share' | 'balance', date: string) => Promise<void>;
  transfer: (fundId: number, fromInvestorId: number, toInvestorId: number, amount: number, amountType: 'share' | 'balance', date: string) => Promise<void>;
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
  investors: [],
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

  fetchFundById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await request<{ data: Fund }>(`/funds/${id}`);

      if (response.code === 0) {
        set({ currentFund: response.data });
        return response.data;
      } else {
        set({ error: response.message || 'Failed to fetch fund' });
        return null;
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch fund' });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  fetchInvestors: async (fundId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await request<PaginatedResponse<Investor>>(`/funds/${fundId}/investors`);

      if (response.code === 0) {
        set({ investors: response.data.items });
        return response.data.items;
      } else {
        set({ error: response.message || 'Failed to fetch investors' });
        return [];
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch investors' });
      return [];
    } finally {
      set({ loading: false });
    }
  },

  fetchOperations: async (fundId: number, page: number = 1, pageSize: number = 50) => {
    set({ loading: true, error: null });
    try {
      const response = await request<PaginatedResponse<Operation>>(
        `/funds/${fundId}/investors/operations?page=${page}&page_size=${pageSize}`
      );

      if (response.code === 0) {
        return response.data.items;
      } else {
        set({ error: response.message || 'Failed to fetch operations' });
        return [];
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch operations' });
      return [];
    } finally {
      set({ loading: false });
    }
  },

  addInvestor: async (fundId: number, name: string) => {
    set({ loading: true, error: null });
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await request<{ data: Investor }>(`/funds/${fundId}/investors`, {
        method: 'POST',
        body: JSON.stringify({ name, date: today }),
      });

      if (response.code === 0) {
        set((state) => ({ investors: [...state.investors, response.data] }));
      } else {
        set({ error: response.message || 'Failed to add investor' });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to add investor' });
    } finally {
      set({ loading: false });
    }
  },

  invest: async (fundId: number, investorId: number, amount: number, date: string) => {
    set({ loading: true, error: null });
    try {
      const response = await request<{ data: any }>(`/funds/${fundId}/investors/${investorId}/invest`, {
        method: 'POST',
        body: JSON.stringify({ amount, date }),
      });

      if (response.code !== 0) {
        set({ error: response.message || 'Failed to invest' });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to invest' });
    } finally {
      set({ loading: false });
    }
  },

  redeem: async (fundId: number, investorId: number, amount: number, amountType: 'share' | 'balance', date: string) => {
    set({ loading: true, error: null });
    try {
      const response = await request<{ data: any }>(`/funds/${fundId}/investors/${investorId}/redeem`, {
        method: 'POST',
        body: JSON.stringify({ amount, amount_type: amountType, date }),
      });

      if (response.code !== 0) {
        set({ error: response.message || 'Failed to redeem' });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to redeem' });
    } finally {
      set({ loading: false });
    }
  },

  transfer: async (fundId: number, fromInvestorId: number, toInvestorId: number, amount: number, amountType: 'share' | 'balance', date: string) => {
    set({ loading: true, error: null });
    try {
      const response = await request<{ data: any }>(`/funds/${fundId}/investors/transfer`, {
        method: 'POST',
        body: JSON.stringify({
          from_investor_id: fromInvestorId,
          to_investor_id: toInvestorId,
          amount,
          amount_type: amountType,
          date
        }),
      });

      if (response.code !== 0) {
        set({ error: response.message || 'Failed to transfer' });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to transfer' });
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
      const response = await request<{ data: any }>(`/funds/${id}/update-nav`, {
        method: 'POST',
        body: JSON.stringify({ capital, date }),
      });

      if (response.code !== 0) {
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
