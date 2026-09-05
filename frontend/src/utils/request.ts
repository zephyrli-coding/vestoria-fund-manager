import { apiFetch } from '@/config/api';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

function errorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const data = payload as Record<string, unknown>;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((entry) => {
      if (!entry || typeof entry !== 'object') return '';
      const item = entry as { loc?: unknown[]; msg?: string };
      const field = item.loc?.filter((part) => part !== 'body').join('.');
      return typeof item.msg === 'string' ? [field, item.msg].filter(Boolean).join(': ') : '';
    }).filter(Boolean).join('; ') || undefined;
  }
  return typeof data.message === 'string' ? data.message : undefined;
}

export async function readApiResponse<T = any>(response: Response): Promise<T> {
  const text = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    const message = response.ok
      ? 'The server returned an invalid response. Please try again.'
      : `Request failed (HTTP ${response.status}). Please try again later.`;
    throw new Error(message);
  }
  if (!response.ok) {
    const fallback = response.status === 401
      ? 'Your session has expired. Please sign in again.'
      : response.status === 403
        ? 'You do not have permission for this action.'
        : `Request failed (HTTP ${response.status}).`;
    throw new Error(errorMessage(payload) || fallback);
  }
  if (payload === null || typeof payload !== 'object') {
    throw new Error('The server returned an invalid response.');
  }
  const envelope = payload as { code?: unknown };
  if (typeof envelope.code === 'number' && envelope.code !== 0) {
    throw new Error(errorMessage(payload) || 'The operation could not be completed.');
  }
  return payload as T;
}

export async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  let response: Response;
  try {
    response = await apiFetch(endpoint, { ...options, headers });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }
  return readApiResponse<T>(response);
}

// Existing list screens expect a complete collection, not just the default first page.
export async function fetchAllPages<T extends { id: number }>(endpoint: string, options: RequestInit = {}): Promise<T[]> {
  const items = new Map<number, T>();
  const separator = endpoint.includes('?') ? '&' : '?';
  const pageSize = 100;
  let total = 0;
  for (let page = 1; ; page += 1) {
    const response = await request<ApiResponse<PaginatedResponse<T>>>(
      `${endpoint}${separator}page=${page}&page_size=${pageSize}`
    , options);
    const data = response.data;
    if (!data || !Array.isArray(data.items) || !Number.isInteger(data.total) || data.total < 0) {
      throw new Error('The server returned an invalid list response.');
    }
    if (page === 1) total = data.total;
    if (data.total !== total) {
      throw new Error('The list changed while loading. Please refresh it.');
    }
    for (const item of data.items) items.set(item.id, item);
    if (page * pageSize >= total || data.items.length < pageSize) break;
  }
  if (items.size !== total) {
    throw new Error('The list could not be loaded completely. Please refresh it.');
  }
  return [...items.values()];
}
