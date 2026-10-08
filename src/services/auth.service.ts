import axiosClient from '../utils/axiosClient';
import type { LoginResponse } from '../types/auth';

export class InvalidLoginResponseError extends Error {
  constructor() {
    super('Backend trả về accessToken hoặc thông tin người dùng không hợp lệ.');
    this.name = 'InvalidLoginResponseError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isValidToken = (value: unknown): value is string =>
  typeof value === 'string'
  && value.trim().length > 0
  && value.trim().toLowerCase() !== 'undefined';

/**
 * Service chứa các hàm liên quan đến xác thực người dùng.
 */
export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await axiosClient.post<unknown>('/auth/login', {
      email,
      password,
    });

    const data = response.data;
    if (
      !isRecord(data)
      || !isValidToken(data.accessToken)
      || (data.refreshToken !== undefined && data.refreshToken !== null
        && !isValidToken(data.refreshToken))
    ) {
      throw new InvalidLoginResponseError();
    }

    const user = data.user;
    if (
      !isRecord(user)
      || typeof user.id !== 'string'
      || typeof user.email !== 'string'
      || typeof user.role !== 'string'
    ) {
      throw new InvalidLoginResponseError();
    }

    return {
      accessToken: data.accessToken,
      ...(typeof data.refreshToken === 'string' ? { refreshToken: data.refreshToken } : {}),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  },
};
