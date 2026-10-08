import type { User } from '../types/auth';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_DATA_KEY = 'userData';

export interface TokenUserData {
  id?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

const isValidToken = (token: unknown): token is string =>
  typeof token === 'string'
  && token.trim().length > 0
  && token.trim().toLowerCase() !== 'undefined';

const clearPersistedTokens = (): void => {
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
};

const isInvalidStoredToken = (token: string | null): boolean =>
  token !== null && (!isValidToken(token) || token.trim().toLowerCase() === 'undefined');

const isTokenUserData = (value: unknown): value is TokenUserData =>
  typeof value === 'object'
  && value !== null
  && !Array.isArray(value)
  && (!('id' in value) || typeof value.id === 'string')
  && (!('email' in value) || typeof value.email === 'string')
  && (!('role' in value) || typeof value.role === 'string');

export const tokenService = {
  getToken(): string | null {
    try {
      const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
      if (isInvalidStoredToken(token)) {
        clearPersistedTokens();
        return null;
      }
      return token;
    } catch {
      return null;
    }
  },

  getAccessToken(): string | null {
    return this.getToken();
  },

  removeAccessToken(): void {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    try {
      const token = window.localStorage.getItem(REFRESH_TOKEN_KEY);
      if (isInvalidStoredToken(token)) {
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
        return null;
      }
      return token;
    } catch {
      return null;
    }
  },

  removeRefreshToken(): void {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  setAccessToken(accessToken: unknown): boolean {
    if (!isValidToken(accessToken)) {
      clearPersistedTokens();
      return false;
    }

    try {
      window.localStorage.setItem(ACCESS_TOKEN_KEY, (accessToken as string).trim());
      const saved = window.localStorage.getItem(ACCESS_TOKEN_KEY) === (accessToken as string).trim();
      if (!saved) window.localStorage.removeItem(ACCESS_TOKEN_KEY);
      return saved;
    } catch {
      clearPersistedTokens();
      return false;
    }
  },

  setRefreshToken(refreshToken: unknown): boolean {
    if (refreshToken === null || refreshToken === undefined || refreshToken === '') {
      try {
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
        return true;
      } catch {
        return false;
      }
    }

    if (!isValidToken(refreshToken)) {
      try {
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      } catch {
        return false;
      }
      return false;
    }

    try {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, (refreshToken as string).trim());
      return window.localStorage.getItem(REFRESH_TOKEN_KEY) === (refreshToken as string).trim();
    } catch {
      return false;
    }
  },

  setUserData(user: unknown): boolean {
    if (!isTokenUserData(user)) return false;

    try {
      const serializedUser = JSON.stringify(user);
      window.localStorage.setItem(USER_DATA_KEY, serializedUser);
      return window.localStorage.getItem(USER_DATA_KEY) === serializedUser;
    } catch {
      return false;
    }
  },

  getUserData(): User | null {
    try {
      const serializedUser = window.localStorage.getItem(USER_DATA_KEY);
      if (!serializedUser) return null;

      const user: unknown = JSON.parse(serializedUser);
      return isTokenUserData(user) ? (user as unknown as User) : null;
    } catch {
      return null;
    }
  },

  removeUserData(): void {
    window.localStorage.removeItem(USER_DATA_KEY);
  },

  saveTokens(accessToken: unknown, refreshToken?: unknown): boolean {
    if (
      !isValidToken(accessToken)
      || (refreshToken !== undefined && refreshToken !== null && !isValidToken(refreshToken))
    ) {
      clearPersistedTokens();
      return false;
    }

    try {
      window.localStorage.setItem(ACCESS_TOKEN_KEY, (accessToken as string).trim());
      if (isValidToken(refreshToken)) {
        window.localStorage.setItem(REFRESH_TOKEN_KEY, (refreshToken as string).trim());
      } else {
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
      const saved = window.localStorage.getItem(ACCESS_TOKEN_KEY) === (accessToken as string).trim();
      if (!saved) clearPersistedTokens();
      return saved;
    } catch {
      clearPersistedTokens();
      return false;
    }
  },

  setToken(accessToken: unknown): boolean {
    return this.saveTokens(accessToken);
  },

  removeToken(): void {
    this.clearTokens();
  },

  removeInvalidStoredTokens(): void {
    try {
      const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
      const legacyToken = window.localStorage.getItem('token');

      if (isInvalidStoredToken(accessToken) || isInvalidStoredToken(refreshToken)) {
        clearPersistedTokens();
      }
      if (isInvalidStoredToken(legacyToken)) {
        window.localStorage.removeItem('token');
      }
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
  },

  clearTokens(): void {
    clearPersistedTokens();
    try {
      window.localStorage.removeItem(USER_DATA_KEY);
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
  },

  clearAll(): void {
    this.clearTokens();
  }
};
