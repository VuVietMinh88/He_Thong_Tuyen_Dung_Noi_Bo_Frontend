import type { User } from '../types/auth';

/**
 * Các hằng số key để lưu trữ trong localStorage
 */
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_DATA_KEY = 'userData';

/**
 * Token Service - AC 1: Lưu trữ và Quản lý Token an toàn
 * Cung cấp các helper function để xử lý token và thông tin người dùng.
 */
export const tokenService = {
  // --- Quản lý Access Token ---
  getAccessToken: (): string | null => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token || token.trim().toLowerCase() === 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      return null;
    }
    return token;
  },
  setAccessToken: (token: string): void => {
    if (!token.trim() || token.trim().toLowerCase() === 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      return;
    }
    localStorage.setItem(ACCESS_TOKEN_KEY, token.trim());
  },
  removeAccessToken: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  // --- Quản lý Refresh Token ---
  getRefreshToken: (): string | null => {
    const token = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!token || token.trim().toLowerCase() === 'undefined') {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return null;
    }
    return token;
  },
  setRefreshToken: (token: string): void => {
    if (!token.trim() || token.trim().toLowerCase() === 'undefined') {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return;
    }
    localStorage.setItem(REFRESH_TOKEN_KEY, token.trim());
  },
  removeRefreshToken: (): void => {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  // --- Quản lý thông tin Người dùng và Vai trò (Role) ---
  getUserData: (): User | null => {
    const data = localStorage.getItem(USER_DATA_KEY);
    if (data) {
      try {
        return JSON.parse(data) as User;
      } catch (error) {
        console.error('Lỗi khi parse dữ liệu User từ localStorage:', error);
        return null;
      }
    }
    return null;
  },
  setUserData: (user: User): void => {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  },
  removeUserData: (): void => {
    localStorage.removeItem(USER_DATA_KEY);
  },

  // --- Dọn dẹp phiên đăng nhập (Đăng xuất) ---
  clearAll: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  },
  removeInvalidStoredTokens: (): void => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (
      accessToken?.trim().toLowerCase() === 'undefined'
      || refreshToken?.trim().toLowerCase() === 'undefined'
    ) {
      tokenService.clearAll();
    }
    const legacyToken = localStorage.getItem('token');
    if (legacyToken?.trim().toLowerCase() === 'undefined') {
      localStorage.removeItem('token');
    }
  },
};
