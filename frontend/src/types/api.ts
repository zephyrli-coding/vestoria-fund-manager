// 全局类型定义

// API 通用响应格式
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface User {
  id: number;
  username: string;
}

export interface Fund {
  id: number;
  name: string;
  start_date: string;
  currency: 'CNY' | 'USD';
  tags: string;
  total_share: number;
  net_asset_value: number;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface FundCreate {
  name: string;
  start_date: string;
  currency: 'CNY' | 'USD';
  tags?: string;
}

export interface FundUpdate {
  name: string;
  start_date: string;
  currency: 'CNY' | 'USD';
  tags?: string;
}

export interface Investor {
  id: number;
  fund_id: number;
  name: string;
  share: number;
  balance: number;
  total_invested: number;
  total_redeemed: number;
  created_at: string;
}

export interface Operation {
  id: number;
  fund_id: number;
  investor_id: number | null;
  operation_type: 'invest' | 'redeem' | 'transfer' | 'update_nav' | 'add_investor';
  operation_date: string;
  amount: number | null;
  amount_type: 'share' | 'balance' | null;
  share: number | null;
  nav_before: number | null;
  nav_after: number | null;
  total_share_before: number | null;
  total_share_after: number | null;
  balance_before: number | null;
  balance_after: number | null;
  transfer_from_id: number | null;
  transfer_to_id: number | null;
  created_at: string;
}

export interface ChartData {
  date: string;
  value: number;
}

export interface FundChartData {
  nav: ChartData[];
  balance: ChartData[];
  share: ChartData[];
}

// API 响应类型
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
