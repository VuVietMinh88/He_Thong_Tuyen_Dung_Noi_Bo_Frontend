import axiosClient from '../utils/axiosClient';
import type { LoginResponse } from '../types/auth';

/**
 * Service chứa các hàm liên quan đến xác thực người dùng.
 */
export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await axiosClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },
};
