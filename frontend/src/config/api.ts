// API 基础配置
// 统一使用相对路径，通过 Vite 代理（开发）或 Nginx（生产）转发到后端
export const API_BASE_URL = '/api/v1';

// 构建完整的 API URL
export function apiUrl(path: string): string {
  // 确保 path 以 / 开头
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
