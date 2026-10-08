import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { LoginResponse } from '../types/auth';
import { tokenService } from '../services/token.service';

type RetryRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const normalizeApiBaseUrl = (baseUrl?: string): string => {
  const trimmed = (baseUrl ?? '').trim().replace(/\/+$/, '');
  if (!trimmed) return 'http://localhost:8080/api/v1';
  if (/\/api\/v1$/i.test(trimmed)) return trimmed;
  if (/\/api$/i.test(trimmed)) return `${trimmed}/v1`;
  if (/\/v1$/i.test(trimmed)) return trimmed;
  return `${trimmed}/api/v1`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTokenResponse = (value: unknown): value is LoginResponse => {
  if (!isRecord(value) || !isRecord(value.user)) return false;
  const { user } = value;
  return typeof value.accessToken === 'string'
    && value.accessToken.trim().length > 0
    && value.accessToken.trim().toLowerCase() !== 'undefined'
    && typeof value.refreshToken === 'string'
    && /^[A-Za-z0-9_-]{43}$/.test(value.refreshToken)
    && value.tokenType === 'Bearer'
    && typeof value.expiresIn === 'number'
    && value.expiresIn > 0
    && typeof value.refreshExpiresAt === 'string'
    && !Number.isNaN(Date.parse(value.refreshExpiresAt))
    && typeof user.id === 'string'
    && typeof user.email === 'string'
    && typeof user.fullName === 'string'
    && Array.isArray(user.roles)
    && user.roles.length > 0
    && user.roles.every((role) => typeof role === 'string' && role.length > 0);
};

const isAuthRequest = (url?: string): boolean =>
  /\/auth\/(?:login|refresh)\/?$/i.test(url ?? '');

const axiosClient = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown | null, token?: string): void => {
  failedQueue.forEach((request) => {
    if (error !== null) request.reject(error);
    else if (token) request.resolve(token);
    else request.reject(new Error('Token refresh did not return an access token.'));
  });
  failedQueue = [];
};

const redirectToLogin = (): void => {
  tokenService.clearAll();
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    tokenService.removeInvalidStoredTokens();
    if (isAuthRequest(config.url)) {
      config.headers.delete('Authorization');
      return config;
    }

    const accessToken = tokenService.getAccessToken();
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;
    if (
      error.response?.status !== 401
      || !originalRequest
      || originalRequest._retry
      || isAuthRequest(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((accessToken) => {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;
    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) {
      isRefreshing = false;
      processQueue(error);
      redirectToLogin();
      return Promise.reject(error);
    }

    try {
      const refreshResponse = await axios.post<unknown>(
        `${axiosClient.defaults.baseURL}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 },
      );
      if (!isTokenResponse(refreshResponse.data)) {
        throw new Error('Backend trả về dữ liệu refresh token không đúng hợp đồng API.');
      }

      const { accessToken, refreshToken: rotatedRefreshToken, user } = refreshResponse.data;
      if (!tokenService.saveTokens(accessToken, rotatedRefreshToken) || !tokenService.setUserData(user)) {
        throw new Error('Không thể lưu phiên đăng nhập mới.');
      }

      isRefreshing = false;
      processQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return await axiosClient(originalRequest);
    } catch (refreshError: unknown) {
      processQueue(refreshError);
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosClient;
