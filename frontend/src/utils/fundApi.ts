import { apiFetch } from '@/config/api';
import { fetchAllPages, readApiResponse, request } from '@/utils/request';
import { formatAmount } from '@/utils/fundFormatting';
import type { ApiResponse, Fund, Investor, Operation, PaginatedResponse, FundChartData } from '@/types/api';

export const money = (value: number, currency: string = 'CNY', signed = false) =>
  (value < 0 ? '-' : signed && value > 0 ? '+' : '') + (currency === 'USD' ? '$' : '¥') + formatAmount(Math.abs(value));
export const shares = (value: number) => Number.isFinite(value) ? value.toLocaleString('zh-CN', {maximumFractionDigits: 6}) : '--';
export const investorReturn = (investor: Investor, fund: Fund) => investor.share * fund.net_asset_value + investor.total_redeemed - investor.total_invested;
export const getFunds = (signal?: AbortSignal) => fetchAllPages<Fund>('/funds', {signal});
export const getInvestors = (id: number, signal?: AbortSignal) => fetchAllPages<Investor>('/funds/' + id + '/investors', {signal});
export async function getFund(id: number, signal?: AbortSignal) { return (await request<ApiResponse<Fund>>('/funds/' + id, {signal})).data; }
export async function getInvestor(fundId: number, investorId: number, signal?: AbortSignal) { return (await request<ApiResponse<Investor>>('/funds/' + fundId + '/investors/' + investorId, {signal})).data; }
export type ChartSeries = FundChartData & { balance_usd?: {date: string; value: number}[] };
export async function getChart(id: number | null, query: URLSearchParams, signal?: AbortSignal) {
  return (await request<ApiResponse<ChartSeries>>((id === null ? '/funds/chart/aggregate' : '/funds/' + id + '/chart') + '?' + query, {signal})).data;
}
export async function getOperations(id: number, query: URLSearchParams, signal?: AbortSignal) {
  return (await request<ApiResponse<PaginatedResponse<Operation>>>('/funds/' + id + '/investors/operations?' + query, {signal})).data;
}
export interface ReturnSnapshot { id: number; date: string; nav: number; share: number; total_invested: number; total_redeemed: number; total_return: number; }
export async function getReturns(fundId: number, investorId: number, signal?: AbortSignal) {
  return (await request<ApiResponse<{snapshots: ReturnSnapshot[]}>>('/funds/' + fundId + '/investors/' + investorId + '/return-history', {signal})).data.snapshots;
}
export async function download(endpoint: string, filename: string, options: RequestInit = {}) {
  const response = await apiFetch(endpoint, options);
  if (!response.ok) await readApiResponse(response);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
