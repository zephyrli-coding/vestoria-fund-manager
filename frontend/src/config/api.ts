// API 基础配置
// 开发环境直接连接后端，生产环境通过 Nginx 转发
const isDev = import.meta.env?.DEV ?? true;
export const API_BASE_URL = isDev ? 'http://localhost:8000/api/v1' : '/api/v1';

// 构建完整的 API URL
export function apiUrl(path: string): string {
  // 确保 path 以 / 开头
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
