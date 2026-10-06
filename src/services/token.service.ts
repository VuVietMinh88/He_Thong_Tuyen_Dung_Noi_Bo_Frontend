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
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  setAccessToken: (token: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  removeAccessToken: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  // --- Quản lý Refresh Token ---
  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setRefreshToken: (token: string): void => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
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
  }
};

