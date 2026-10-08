import axios from "axios";
import axiosClient from "../utils/axiosClient";
import type { LoginResponse } from "../types/auth";
import { MOCK_ACCOUNTS } from "../data/mockAccounts";

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
    try {
      const response = await axiosClient.post<unknown>('/auth/login', {
        email,
        password,
      });

      const data = response.data as any;
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
      ) {
        throw new InvalidLoginResponseError();
      }

      return {
        accessToken: data.accessToken,
        ...(typeof data.refreshToken === 'string' ? { refreshToken: data.refreshToken } : {}),
        tokenType: data.tokenType,
        expiresIn: data.expiresIn,
        refreshExpiresAt: data.refreshExpiresAt,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName as string,
          role: Array.isArray(user.roles) ? user.roles[0] : (user.role as string || 'CANDIDATE'),
          roles: user.roles as string[],
        },
      };
    } catch (error) {
      if (error instanceof InvalidLoginResponseError) {
        throw error;
      }
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 400 || status === 401) {
          throw new Error("INVALID_CREDENTIALS");
        }

        if (status === 429) {
          throw new Error("TOO_MANY_REQUESTS");
        }

        // Fallback mockup when backend is not ready
        const isNetworkOrNotFound = !error.response || status === 404 || status === 502 || status === 503;
        if (isNetworkOrNotFound) {
          return authService.mockLogin(email, password);
        }
      }

      throw new Error("LOGIN_REQUEST_FAILED");
    }
  },

  mockLogin: async (email: string, password: string): Promise<LoginResponse> => {
    // Fake network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const account = MOCK_ACCOUNTS.find(acc => acc.email.toLowerCase() === email.toLowerCase());

    if (!account) {
      throw new Error("INVALID_CREDENTIALS");
    }

    if (account.status === 'LOCKED') {
      throw new Error("ACCOUNT_LOCKED"); // Custom error mapping for locked account if needed, currently UI uses INVALID_CREDENTIALS for any auth fail
    }

    // Mock validation: accept any password with length >= 8 for testing purposes
    if (password.length < 8) {
      throw new Error("INVALID_CREDENTIALS");
    }

    return {
      accessToken: "mock.access.token." + Date.now(),
      refreshToken: "mock.refresh.token." + Date.now(),
      tokenType: "Bearer",
      expiresIn: 900,
      refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: account.id,
        email: account.email,
        fullName: account.fullName,
        role: account.roles?.[0] || account.role,
        roles: account.roles || [account.role],
      }
    };
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    try {
      await axiosClient.post("/auth/forgot-password", { email });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const isNetworkOrNotFound = !error.response || status === 404 || status === 502 || status === 503;
        if (isNetworkOrNotFound) {
          // Mockup: Simulate successful request
          await new Promise(resolve => setTimeout(resolve, 600));
          return;
        }

        if (status === 400 || status === 404 || status === 422) {
          return;
        }
      }

      return;
    }
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    try {
      await axiosClient.post("/auth/reset-password", {
        token,
        newPassword,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const isNetworkOrNotFound = !error.response || status === 404 || status === 502 || status === 503;
        if (isNetworkOrNotFound) {
          // Mockup: Accept if token is valid mock token format (length > 10)
          await new Promise(resolve => setTimeout(resolve, 800));
          if (token.length > 10) {
            return;
          }
          throw new Error("INVALID_OR_EXPIRED_TOKEN");
        }

        if (
          status === 400 ||
          status === 401 ||
          status === 404 ||
          status === 410
        ) {
          throw new Error("INVALID_OR_EXPIRED_TOKEN");
        }

        if (status === 422) {
          throw new Error("PASSWORD_INVALID");
        }
      }

      throw new Error("RESET_PASSWORD_REQUEST_FAILED");
    }
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<void> => {
    try {
      await axiosClient.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const isNetworkOrNotFound = !error.response || status === 404 || status === 502 || status === 503;
        if (isNetworkOrNotFound) {
          // Mockup: Simulate successful change password
          await new Promise(resolve => setTimeout(resolve, 800));
          return;
        }

        if (status === 400 || status === 401) {
          throw new Error("INVALID_CURRENT_PASSWORD");
        }

        if (status === 422) {
          throw new Error("PASSWORD_INVALID");
        }
      }

      throw new Error("CHANGE_PASSWORD_REQUEST_FAILED");
    }
  },
};
