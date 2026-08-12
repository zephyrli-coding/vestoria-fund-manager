/// <reference types="vite/client" />

// API 基础配置
// 开发环境直接连接后端，生产环境通过 Nginx 转发
const isDev = import.meta.env?.DEV ?? true;
export const API_BASE_URL = isDev ? 'http://localhost:8000/api/v1' : '/api/v1';

export const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:20263';
export const AUTH_CLIENT_ID = import.meta.env.VITE_AUTH_CLIENT_ID || 'vestoria';

// 构建完整的 API URL
export function apiUrl(path: string): string {
  // 确保 path 以 / 开头
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export function getRedirectUri(): string {
  return `${window.location.origin}/auth/callback`;
}

export function redirectToAuthLogin() {
  const state = Math.random().toString(36).substring(2);
  sessionStorage.setItem('oauth_state', state);
  const params = new URLSearchParams({
    client_id: AUTH_CLIENT_ID,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    state,
  });
  window.location.href = `${AUTH_SERVICE_URL}/oauth/authorize?${params.toString()}`;
}

export function redirectToGlobalLogout() {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `${AUTH_SERVICE_URL}/auth/logout`;
  const returnTo = document.createElement('input');
  returnTo.type = 'hidden';
  returnTo.name = 'return_to';
  returnTo.value = `${window.location.origin}/login`;
  form.appendChild(returnTo);
  document.body.appendChild(form);
  form.submit();
}
