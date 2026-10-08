import axios, { type InternalAxiosRequestConfig } from 'axios';
import { tokenService } from '../services/token.service';

/**
 * Cấu hình axios client cơ bản để dùng chung cho toàn bộ dự án.
 */
const normalizeApiBaseUrl = (baseUrl?: string): string => {
  const trimmed = (baseUrl ?? 'http://localhost:8080/api/v1').trim();
  if (!trimmed) return 'http://localhost:8080/api/v1';

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  if (withoutTrailingSlash.endsWith('/api/v1')) return withoutTrailingSlash;
  if (withoutTrailingSlash.endsWith('/api')) return `${withoutTrailingSlash}/v1`;

  return withoutTrailingSlash;
};

const axiosClient = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor để tự động gắn token vào header nếu người dùng đã đăng nhập
axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  tokenService.removeInvalidStoredTokens();
  const isLoginRequest = /(?:^|\/)auth\/login\/?$/i.test(config.url ?? '');
  if (isLoginRequest) {
    config.headers.delete('Authorization');
    return config;
  }

  const token = tokenService.getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error: unknown) => {
  return Promise.reject(error);
});

export default axiosClient;
