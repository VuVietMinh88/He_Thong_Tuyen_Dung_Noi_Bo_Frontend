/**
 * Authentication and Session Management Constants
 */

export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  DEVICE_ID: 'x_device_id',
  REMEMBERED_EMAIL: 'rememberedEmail',
} as const;

export const AUTH_HEADERS = {
  DEVICE_ID: 'X-Device-Id',
  AUTHORIZATION: 'Authorization',
} as const;

export const AUTH_CHANNELS = {
  SYNC: 'smart_recruitment_auth_channel',
} as const;

export const AUTH_SYNC_EVENTS = {
  REFRESH_START: 'AUTH_REFRESH_START',
  TOKEN_REFRESHED: 'AUTH_TOKEN_REFRESHED',
  REFRESH_FAILED: 'AUTH_REFRESH_FAILED',
  LOGIN: 'AUTH_LOGIN',
  LOGOUT: 'AUTH_LOGOUT',
  SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
} as const;

export const AUTH_ROUTES = {
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',
  DASHBOARD: '/dashboard',
} as const;

export const AUTH_MESSAGES = {
  SESSION_EXPIRED: 'Phiên làm việc hết hạn',
  SESSION_EXPIRED_SUBTEXT: 'Phiên đăng nhập đã hết hạn. Đăng nhập lại để tiếp tục; dữ liệu biểu mẫu không nhạy cảm sẽ được khôi phục nếu có thể.',
} as const;

export const AUTH_CONFIG = {
  ACTIVITY_DEBOUNCE_MS: 2000,
  TOKEN_REFRESH_TIMEOUT_MS: 15000,
  REMOTE_REFRESH_LOCK_TIMEOUT_MS: 10000,
} as const;
