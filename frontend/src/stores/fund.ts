import { request, fetchAllPages } from '@/utils/request';
import { localDate } from '@/utils/fundFormatting';
import { create } from 'zustand';
import type { Fund, FundCreate, FundUpdate, PaginatedResponse, FundChartData, Investor, Operation, ApiResponse } from '@/types/api';

interface FundState {
  funds: Fund[];
  currentFund: Fund | null;
  investors: Investor[];
  loading: boolean;
  error: string | null;
}

interface FundActions {
  fetchFunds: (tag?: string) => Promise<void>;
  fetchFundById: (id: number) => Promise<Fund | null>;
  fetchInvestors: (fundId: number) => Promise<Investor[]>;
  fetchOperations: (fundId: number, page?: number, pageSize?: number) => Promise<Operation[]>;
  fetchInvestorOperations: (fundId: number, investorId: number, page?: number, pageSize?: number) => Promise<Operation[]>;
  fetchRecentOperations: (limit?: number) => Promise<Operation[]>;
  fetchChartData: (fundId: number, startDate?: string, endDate?: string) => Promise<FundChartData | null>;
  fetchTagChartData: (tag?: string, startDate?: string, endDate?: string) => Promise<FundChartData | null>;
  addInvestor: (fundId: number, name: string, date?: string) => Promise<void>;
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

let fundsRequestId = 0;

// 创建基金 store
export const useFundStore = create<FundStore>((set, get) => ({
  funds: [],
  currentFund: null,
  investors: [],
  loading: false,
  error: null,

  fetchFunds: async (tag?: string) => {
    const requestId = ++fundsRequestId;
    set({ loading: true, error: null });
    try {
      const query = tag ? `?tag=${encodeURIComponent(tag)}` : '';
      const funds = await fetchAllPages<Fund>(`/funds${query}`);
      if (requestId === fundsRequestId) set({ funds });
    } catch (error: any) {
      if (requestId === fundsRequestId) {
        set({ funds: [], error: error.message || 'Failed to fetch funds' });
      }
    } finally {
      if (requestId === fundsRequestId) set({ loading: false });
    }
  },

  fetchFundById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await request<ApiResponse<Fund>>(`/funds/${id}`);

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
      const investors = await fetchAllPages<Investor>(`/funds/${fundId}/investors`);
      set({ investors });
      return investors;
    } catch (error: any) {
      set({ investors: [], error: error.message || 'Failed to fetch investors' });
      return [];
    } finally {
      set({ loading: false });
    }
  },

  fetchOperations: async (fundId: number, page?: number, pageSize: number = 50) => {
    set({ loading: true, error: null });
    try {
      if (page === undefined) return await fetchAllPages<Operation>(`/funds/${fundId}/investors/operations`);
      const response = await request<ApiResponse<PaginatedResponse<Operation>>>(
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

  fetchInvestorOperations: async (fundId: number, investorId: number, page?: number, pageSize: number = 50) => {
    set({ loading: true, error: null });
    try {
      if (page === undefined) return await fetchAllPages<Operation>(`/funds/${fundId}/investors/${investorId}/operations`);
      const response = await request<ApiResponse<PaginatedResponse<Operation>>>(
        `/funds/${fundId}/investors/${investorId}/operations?page=${page}&page_size=${pageSize}`
      );

      if (response.code === 0) {
        return response.data.items;
      } else {
        set({ error: response.message || 'Failed to fetch investor operations' });
        return [];
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch investor operations' });
      return [];
    } finally {
      set({ loading: false });
    }
  },

  fetchRecentOperations: async (limit: number = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await request<ApiResponse<PaginatedResponse<Operation>>>(`/operations/recent?limit=${limit}`);

      if (response.code === 0) {
        return response.data.items;
      } else {
        set({ error: response.message || 'Failed to fetch recent operations' });
        return [];
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch recent operations' });
      return [];
    } finally {
      set({ loading: false });
    }
  },

  fetchChartData: async (fundId: number, startDate?: string, endDate?: string) => {
    set({ loading: true, error: null });
    try {
      let url = `/funds/${fundId}/chart`;
      const params: string[] = [];
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length > 0) url += '?' + params.join('&');

      const response = await request<ApiResponse<FundChartData>>(url);

      if (response.code === 0) {
        return response.data;
      } else {
        set({ error: response.message || 'Failed to fetch chart data' });
        return null;
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch chart data' });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  fetchTagChartData: async (tag?: string, startDate?: string, endDate?: string) => {
    set({ loading: true, error: null });
    try {
      let url = '/funds/chart/aggregate';
      const params: string[] = [];
      if (tag) params.push(`tag=${encodeURIComponent(tag)}`);
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length > 0) url += '?' + params.join('&');

      const response = await request<ApiResponse<FundChartData>>(url);

      if (response.code === 0) {
        return response.data;
      } else {
        set({ error: response.message || 'Failed to fetch tag chart data' });
        return null;
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch tag chart data' });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  addInvestor: async (fundId: number, name: string, date?: string) => {
    set({ loading: true, error: null });
    try {
      const useDate = date || localDate();
      const response = await request<ApiResponse<Investor>>(`/funds/${fundId}/investors`, {
        method: 'POST',
        body: JSON.stringify({ name, date: useDate }),
      });

      if (response.code === 0) {
        set((state) => ({ investors: [...state.investors, response.data] }));
      } else {
        set({ error: response.message || 'Failed to add investor' });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to add investor' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  invest: async (fundId: number, investorId: number, amount: number, date: string) => {
    set({ loading: true, error: null });
    try {
      const response = await request<ApiResponse<any>>(`/funds/${fundId}/investors/${investorId}/invest`, {
        method: 'POST',
        body: JSON.stringify({ amount, date }),
      });

      if (response.code !== 0) {
        set({ error: response.message || 'Failed to invest' });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to invest' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  redeem: async (fundId: number, investorId: number, amount: number, amountType: 'share' | 'balance', date: string) => {
    set({ loading: true, error: null });
    try {
      const response = await request<ApiResponse<any>>(`/funds/${fundId}/investors/${investorId}/redeem`, {
        method: 'POST',
        body: JSON.stringify({ amount, amount_type: amountType, date }),
      });

      if (response.code !== 0) {
        set({ error: response.message || 'Failed to redeem' });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to redeem' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  transfer: async (fundId: number, fromInvestorId: number, toInvestorId: number, amount: number, amountType: 'share' | 'balance', date: string) => {
    set({ loading: true, error: null });
    try {
      const response = await request<ApiResponse<any>>(`/funds/${fundId}/investors/transfer`, {
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
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createFund: async (data: FundCreate) => {
    set({ loading: true, error: null });
    try {
      const response = await request<ApiResponse<Fund>>('/funds', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.code === 0) {
        set({ funds: [...get().funds, response.data] });
      } else {
        const errorMsg = response.message || 'Failed to create fund';
        set({ error: errorMsg });
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to create fund';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ loading: false });
    }
  },

  updateFund: async (id: number, data: FundUpdate) => {
    set({ loading: true, error: null });
    try {
      const response = await request<ApiResponse<Fund>>(`/funds/${id}`, {
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
      throw error;
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
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateNav: async (id: number, capital: number, date: string) => {
    set({ loading: true, error: null });
    try {
      const response = await request<ApiResponse<any>>(`/funds/${id}/update-nav`, {
        method: 'POST',
        body: JSON.stringify({ capital, date }),
      });

      if (response.code !== 0) {
        set({ error: response.message || 'Failed to update NAV' });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to update NAV' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  setCurrentFund: (fund: Fund) => {
    set({ currentFund: fund });
  },
}));
