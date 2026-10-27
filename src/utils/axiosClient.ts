import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { LoginResponse } from '../types/auth';
import {
  AUTH_CONFIG,
  AUTH_HEADERS,
  AUTH_MESSAGES,
  AUTH_ROUTES,
  AUTH_SYNC_EVENTS,
} from '../constants/auth.constants';
import { tokenService } from '../services/token.service';
import { authSyncService } from '../services/authSync.service';
import { captureSessionExpiryDraft } from '../services/sessionDraft.service';
import { getOrCreateDeviceId } from './deviceId';

export type RetryRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

interface QueuedRequestItem {
  resolve: (value: AxiosResponse) => void;
  reject: (reason: unknown) => void;
  config: RetryRequestConfig;
}

const normalizeApiBaseUrl = (baseUrl?: string): string => {
  const trimmed = (baseUrl ?? '').trim().replace(/\/+$/, '');
  if (!trimmed) return 'http://localhost:8080/api/v1';
  if (/\/api\/v1(?:\/v1)+$/i.test(trimmed)) {
    return trimmed.replace(/(?:\/v1)+$/i, '/v1');
  }
  if (/\/api\/v1$/i.test(trimmed)) return trimmed;
  if (/\/api$/i.test(trimmed)) return `${trimmed}/v1`;
  return /\/v1$/i.test(trimmed) ? trimmed : `${trimmed}/api/v1`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((role) => typeof role === 'string' && role.length > 0);

const isTokenResponse = (value: unknown): value is LoginResponse => {
  if (!isRecord(value) || !isRecord(value.user)) return false;
  const { user } = value;
  return (
    typeof value.accessToken === 'string'
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
    && isStringArray(user.roles)
    && user.roles.length > 0
  );
};

export const isLoginRequest = (url?: string): boolean =>
  /\/auth\/login\/?$/i.test(url ?? '');

export const isAuthRequest = (url?: string): boolean =>
  /\/auth\/(?:login|refresh)\/?$/i.test(url ?? '');

const axiosClient = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

let isRefreshing = false;
let isRedirectingToLogin = false;
let failedQueue: QueuedRequestItem[] = [];

export const resetRedirectState = (): void => {
  isRedirectingToLogin = false;
};

export const resetRefreshQueue = (): void => {
  failedQueue = [];
  isRefreshing = false;
};

/**
 * Re-runs queued requests one-by-one sequentially once the new token is active.
 */
const processQueueSequentially = async (token: string): Promise<void> => {
  const queuedItems = [...failedQueue];
  failedQueue = [];

  for (const item of queuedItems) {
    try {
      if (item.config.headers) {
        if (typeof item.config.headers.set === 'function') {
          item.config.headers.set(AUTH_HEADERS.AUTHORIZATION, `Bearer ${token}`);
        } else {
          item.config.headers[AUTH_HEADERS.AUTHORIZATION] = `Bearer ${token}`;
        }
      }
      const response = await axiosClient(item.config);
      item.resolve(response);
    } catch (retryError) {
      item.reject(retryError);
    }
  }
};

/**
 * Rejects all queued requests if token refresh fails.
 */
const rejectQueue = (error: unknown): void => {
  const queuedItems = [...failedQueue];
  failedQueue = [];
  for (const item of queuedItems) {
    item.reject(error);
  }
};

/**
 * Handles session expiry flow:
 * 1. Triggers global notification: "Phiên làm việc hết hạn"
 * 2. Clears persisted tokens & drafts
 * 3. Broadcasts session expiry to other tabs
 * 4. Redirects to /login?sessionExpired=1&redirect_url=<currentRoute>
 */
export const handleSessionExpiry = (): void => {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(
      new CustomEvent('app:toast', {
        detail: {
          type: 'error',
          message: AUTH_MESSAGES.SESSION_EXPIRED,
        },
      }),
    );
  }

  const currentRoute =
    typeof window !== 'undefined' && window.location
      ? `${window.location.pathname || ''}${window.location.search || ''}${window.location.hash || ''}`
      : '';

  captureSessionExpiryDraft(currentRoute || '/');
  tokenService.clearAll();
  authSyncService.broadcastSessionExpired(currentRoute);

  if (
    typeof window !== 'undefined'
    && window.location
    && typeof window.location.pathname === 'string'
    && window.location.pathname !== AUTH_ROUTES.LOGIN
  ) {
    const redirectParam = currentRoute ? `&redirect_url=${encodeURIComponent(currentRoute)}` : '';
    window.location.href = `${AUTH_ROUTES.LOGIN}?sessionExpired=1${redirectParam}`;
  }
};

const redirectToUnauthorized = (): void => {
  if (typeof window !== 'undefined' && window.location?.pathname !== AUTH_ROUTES.UNAUTHORIZED) {
    window.location.href = AUTH_ROUTES.UNAUTHORIZED;
  }
};

// Listen to multi-tab sync events
if (typeof window !== 'undefined') {
  authSyncService.subscribe(async (message) => {
    if (message.type === AUTH_SYNC_EVENTS.TOKEN_REFRESHED && message.payload?.accessToken) {
      const { accessToken, refreshToken, user } = message.payload;
      if (refreshToken) {
        tokenService.saveTokens(accessToken, refreshToken);
      }
      if (user) {
        tokenService.setUserData(user);
      }
      isRefreshing = false;
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new Event('auth:changed'));
      }
      if (failedQueue.length > 0) {
        await processQueueSequentially(accessToken);
      }
    } else if (
      message.type === AUTH_SYNC_EVENTS.REFRESH_FAILED
      || message.type === AUTH_SYNC_EVENTS.SESSION_EXPIRED
    ) {
      isRefreshing = false;
      if (failedQueue.length > 0) {
        rejectQueue(new Error(AUTH_MESSAGES.SESSION_EXPIRED));
      }
      handleSessionExpiry();
    } else if (message.type === AUTH_SYNC_EVENTS.LOGOUT) {
      isRefreshing = false;
      if (failedQueue.length > 0) {
        rejectQueue(new Error('User logged out'));
      }
      tokenService.clearAll();
      if (
        typeof window !== 'undefined'
        && window.location
        && typeof window.location.pathname === 'string'
        && window.location.pathname !== AUTH_ROUTES.LOGIN
      ) {
        window.location.href = AUTH_ROUTES.LOGIN;
      }
    }
  });
}

// Request Interceptor: Inject Device ID & Authorization Bearer
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    tokenService.removeInvalidStoredTokens();

    if (isLoginRequest(config.url)) {
      const deviceId = getOrCreateDeviceId();
      if (typeof config.headers.set === 'function') {
        config.headers.set(AUTH_HEADERS.DEVICE_ID, deviceId);
      } else {
        config.headers[AUTH_HEADERS.DEVICE_ID] = deviceId;
      }
      config.headers.delete(AUTH_HEADERS.AUTHORIZATION);
      return config;
    }

    if (isAuthRequest(config.url)) {
      config.headers.delete(AUTH_HEADERS.AUTHORIZATION);
      return config;
    }

    const accessToken = tokenService.getAccessToken();
    if (accessToken) {
      if (typeof config.headers.set === 'function') {
        config.headers.set(AUTH_HEADERS.AUTHORIZATION, `Bearer ${accessToken}`);
      } else {
        config.headers[AUTH_HEADERS.AUTHORIZATION] = `Bearer ${accessToken}`;
      }
    }

    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      config.headers.delete('Content-Type');
    }

    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// Response Interceptor: 401 Interception, Request Queue & Sequential Retry
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;
    const status = error.response?.status;



    // 403 Forbidden handler
    if (status === 403 && originalRequest && !isAuthRequest(originalRequest.url)) {
      redirectToUnauthorized();
      return Promise.reject(error);
    }

    // Session ended if a retried request still returns 401
    if (
      status === 401
      && originalRequest?._retry
      && !isAuthRequest(originalRequest.url)
    ) {
      handleSessionExpiry();
      return Promise.reject(error);
    }

    // Non-401 or auth endpoint errors
    if (
      status !== 401
      || !originalRequest
      || isAuthRequest(originalRequest.url)
    ) {
      if (
        typeof window !== 'undefined'
        && typeof window.dispatchEvent === 'function'
        && status
        && status >= 500
      ) {
        window.dispatchEvent(
          new CustomEvent('app:toast', {
            detail: {
              type: 'error',
              message: 'Máy chủ phản hồi lỗi hệ thống. Vui lòng thử lại sau.',
            },
          }),
        );
      }
      return Promise.reject(error);
    }

    // If another refresh is already in flight (either in this tab or another tab), queue this request
    if (isRefreshing || authSyncService.isRemoteRefreshing()) {
      originalRequest._retry = true;
      return new Promise<AxiosResponse>((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      });
    }

    // Begin refreshing in this tab
    originalRequest._retry = true;
    isRefreshing = true;
    authSyncService.broadcastRefreshStart();

    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) {
      isRefreshing = false;
      rejectQueue(error);
      handleSessionExpiry();
      return Promise.reject(error);
    }

    try {
      const refreshResponse = await axios.post<unknown>(
        `${axiosClient.defaults.baseURL}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' }, timeout: AUTH_CONFIG.TOKEN_REFRESH_TIMEOUT_MS },
      );

      if (!isTokenResponse(refreshResponse.data)) {
        throw new Error('Backend trả về dữ liệu refresh token không đúng hợp đồng API.');
      }

      const { accessToken, refreshToken: rotatedRefreshToken, user } = refreshResponse.data;
      if (!tokenService.saveTokens(accessToken, rotatedRefreshToken) || !tokenService.setUserData(user)) {
        throw new Error('Không thể lưu phiên đăng nhập mới.');
      }

      // Sync the active token to other tabs
      authSyncService.broadcastTokenRefreshed({
        accessToken,
        refreshToken: rotatedRefreshToken,
        user,
      });
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new Event('auth:changed'));
      }

      // Retry the original request with the new active token
      if (originalRequest.headers) {
        if (typeof originalRequest.headers.set === 'function') {
          originalRequest.headers.set(AUTH_HEADERS.AUTHORIZATION, `Bearer ${accessToken}`);
        } else {
          originalRequest.headers[AUTH_HEADERS.AUTHORIZATION] = `Bearer ${accessToken}`;
        }
      }
      const originalResponse = await axiosClient(originalRequest);

      // Sequentially retry all subsequent requests that were queued during refresh
      await processQueueSequentially(accessToken);

      return originalResponse;
    } catch (refreshError: unknown) {
      // If refresh fails, reject the entire queue
      rejectQueue(refreshError);
      authSyncService.broadcastRefreshFailed(
        refreshError instanceof Error ? refreshError.message : String(refreshError),
      );
      handleSessionExpiry();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosClient;
