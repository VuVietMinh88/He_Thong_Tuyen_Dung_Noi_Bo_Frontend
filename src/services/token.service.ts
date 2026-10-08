import type { User } from '../types/auth';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_DATA_KEY = 'userData';

type StoredUser = {
  id: string;
  email: string;
  role: string;
  [key: string]: unknown;
};

const isValidToken = (token: unknown): token is string =>
  typeof token === 'string'
  && token.trim().length > 0
  && token.trim().toLowerCase() !== 'undefined';

const isInvalidStoredToken = (token: string | null): boolean =>
  token !== null && !isValidToken(token);

const isStoredUser = (value: unknown): value is StoredUser =>
  typeof value === 'object'
  && value !== null
  && !Array.isArray(value)
  && 'id' in value
  && typeof value.id === 'string'
  && 'email' in value
  && typeof value.email === 'string'
  && 'role' in value
  && typeof value.role === 'string';

const clearPersistedTokens = (): void => {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const tokenService = {
  getToken(): string | null {
    const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
    if (isInvalidStoredToken(token)) {
      clearPersistedTokens();
      return null;
    }
    return token;
  },

  getAccessToken(): string | null {
    return this.getToken();
  },

  setAccessToken(token: unknown): boolean {
    if (!isValidToken(token)) {
      clearPersistedTokens();
      return false;
    }
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token.trim());
    return window.localStorage.getItem(ACCESS_TOKEN_KEY) === token.trim();
  },

  setToken(token: unknown): boolean {
    return this.setAccessToken(token);
  },

  removeAccessToken(): void {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  removeToken(): void {
    this.clearTokens();
  },

  getRefreshToken(): string | null {
    const token = window.localStorage.getItem(REFRESH_TOKEN_KEY);
    if (isInvalidStoredToken(token)) {
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      return null;
    }
    return token;
  },

  setRefreshToken(token: unknown): boolean {
    if (token === null || token === undefined || token === '') {
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      return true;
    }
    if (!isValidToken(token)) {
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      return false;
    }
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token.trim());
    return window.localStorage.getItem(REFRESH_TOKEN_KEY) === token.trim();
  },

  removeRefreshToken(): void {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  getUserData(): User | null {
    const serializedUser = window.localStorage.getItem(USER_DATA_KEY);
    if (!serializedUser) return null;

    try {
      const user: unknown = JSON.parse(serializedUser);
      return isStoredUser(user) ? user as User : null;
    } catch (error) {
      console.error('Lỗi khi parse dữ liệu User từ localStorage:', error);
      return null;
    }
  },

  setUserData(user: unknown): boolean {
    if (!isStoredUser(user)) return false;
    window.localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    return true;
  },

  removeUserData(): void {
    window.localStorage.removeItem(USER_DATA_KEY);
  },

  saveTokens(accessToken: unknown, refreshToken?: unknown): boolean {
    if (!isValidToken(accessToken)
      || (refreshToken !== undefined && refreshToken !== null && !isValidToken(refreshToken))) {
      clearPersistedTokens();
      return false;
    }
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
    return true;
  },

  removeInvalidStoredTokens(): void {
    if (isInvalidStoredToken(window.localStorage.getItem(ACCESS_TOKEN_KEY))
      || isInvalidStoredToken(window.localStorage.getItem(REFRESH_TOKEN_KEY))) {
      clearPersistedTokens();
    }
    if (isInvalidStoredToken(window.localStorage.getItem('token'))) {
      window.localStorage.removeItem('token');
    }
  },

  clearTokens(): void {
    clearPersistedTokens();
    window.localStorage.removeItem(USER_DATA_KEY);
  },

  clearAll(): void {
    this.clearTokens();
  },
};
