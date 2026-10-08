import type { User } from '../types/auth';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_DATA_KEY = 'userData';

export type TokenUserData = User;

const isValidToken = (token: unknown): token is string =>
  typeof token === 'string'
  && token.trim().length > 0
  && token.trim().toLowerCase() !== 'undefined';

const isInvalidStoredToken = (token: string | null): boolean =>
  token !== null && !isValidToken(token);

const isTokenUserData = (value: unknown): value is TokenUserData =>
  typeof value === 'object'
  && value !== null
  && !Array.isArray(value)
  && 'id' in value
  && typeof value.id === 'string'
  && 'email' in value
  && typeof value.email === 'string'
  && 'fullName' in value
  && typeof value.fullName === 'string'
  && 'roles' in value
  && Array.isArray(value.roles)
  && value.roles.every((role) => typeof role === 'string');

const clearPersistedTokens = (): void => {
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Browser storage can be unavailable in restricted contexts.
  }
};

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

  setAccessToken(accessToken: unknown): boolean {
    if (!isValidToken(accessToken)) {
      clearPersistedTokens();
      return false;
    }
    try {
      window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken.trim());
      const saved = window.localStorage.getItem(ACCESS_TOKEN_KEY) === accessToken.trim();
      if (!saved) window.localStorage.removeItem(ACCESS_TOKEN_KEY);
      return saved;
    } catch {
      clearPersistedTokens();
      return false;
    }
  },

  setToken(accessToken: unknown): boolean {
    return this.setAccessToken(accessToken);
  },

  removeAccessToken(): void {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  removeToken(): void {
    this.clearTokens();
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
      window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken.trim());
      return window.localStorage.getItem(REFRESH_TOKEN_KEY) === refreshToken.trim();
    } catch {
      return false;
    }
  },

  removeRefreshToken(): void {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  getUserData(): User | null {
    try {
      const serializedUser = window.localStorage.getItem(USER_DATA_KEY);
      if (!serializedUser) return null;
      const user: unknown = JSON.parse(serializedUser);
      return isTokenUserData(user) ? user : null;
    } catch {
      return null;
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
      window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken.trim());
      if (isValidToken(refreshToken)) {
        window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken.trim());
      } else {
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
      const saved = window.localStorage.getItem(ACCESS_TOKEN_KEY) === accessToken.trim()
        && (!isValidToken(refreshToken)
          || window.localStorage.getItem(REFRESH_TOKEN_KEY) === refreshToken.trim());
      if (!saved) clearPersistedTokens();
      return saved;
    } catch {
      clearPersistedTokens();
      return false;
    }
  },

  removeInvalidStoredTokens(): void {
    try {
      const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
      const legacyToken = window.localStorage.getItem('token');
      if (isInvalidStoredToken(accessToken) || isInvalidStoredToken(refreshToken)) {
        clearPersistedTokens();
      }
      if (isInvalidStoredToken(legacyToken)) window.localStorage.removeItem('token');
    } catch {
      // Browser storage can be unavailable in restricted contexts.
    }
  },

  clearTokens(): void {
    clearPersistedTokens();
    try {
      window.localStorage.removeItem(USER_DATA_KEY);
    } catch {
      // Browser storage can be unavailable in restricted contexts.
    }
  },

  clearAll(): void {
    this.clearTokens();
  },
};
