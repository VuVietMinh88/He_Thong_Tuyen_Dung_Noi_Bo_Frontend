import axios from "axios";
import axiosClient from "../utils/axiosClient";
import type { LoginResponse } from "../types/auth";

export class InvalidLoginResponseError extends Error {
  constructor() {
    super('Backend trả về dữ liệu đăng nhập không đúng hợp đồng API.');
    this.name = 'InvalidLoginResponseError';
  }
}

export class LoginValidationError extends Error {
  readonly fieldErrors: Record<string, string[]>;

  constructor(fieldErrors: Record<string, string[]>) {
    super('VALIDATION_ERROR');
    this.name = 'LoginValidationError';
    this.fieldErrors = fieldErrors;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isValidToken = (value: unknown): value is string =>
  typeof value === 'string'
  && value.trim().length > 0
  && value.trim().toLowerCase() !== 'undefined';

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0);

const parseFieldErrors = (value: unknown): Record<string, string[]> => {
  if (!isRecord(value)) return {};
  const fieldErrors: Record<string, string[]> = {};
  Object.entries(value).forEach(([field, messages]) => {
    if (typeof messages === 'string') {
      fieldErrors[field] = [messages];
    } else if (Array.isArray(messages) && messages.every((message) => typeof message === 'string')) {
      fieldErrors[field] = messages;
    }
  });
  return fieldErrors;
};

/**
 * Service chứa các hàm liên quan đến xác thực người dùng.
 */
export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await axiosClient.post<unknown>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      const data = response.data;
      const user = isRecord(data) ? data.user : undefined;
      if (
        !isRecord(data)
        || !isValidToken(data.accessToken)
        || typeof data.refreshToken !== 'string'
        || !/^[A-Za-z0-9_-]{43}$/.test(data.refreshToken)
        || data.tokenType !== 'Bearer'
        || typeof data.expiresIn !== 'number'
        || data.expiresIn <= 0
        || typeof data.refreshExpiresAt !== 'string'
        || Number.isNaN(Date.parse(data.refreshExpiresAt))
        || !isRecord(user)
        || typeof user.id !== 'string'
        || typeof user.email !== 'string'
        || typeof user.fullName !== 'string'
        || !isStringArray(user.roles)
        || user.roles.length === 0
      ) {
        throw new InvalidLoginResponseError();
      }

      return {
        accessToken: data.accessToken.trim(),
        refreshToken: data.refreshToken,
        tokenType: 'Bearer',
        expiresIn: data.expiresIn,
        refreshExpiresAt: data.refreshExpiresAt,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          roles: user.roles,
        },
      };
    } catch (error) {
      if (error instanceof InvalidLoginResponseError) {
        throw error;
      }
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 401) {
          throw new Error("INVALID_CREDENTIALS");
        }

        if (status === 400) {
          const errorBody = error.response?.data;
          const fieldErrors = isRecord(errorBody) ? parseFieldErrors(errorBody.fieldErrors) : {};
          throw new LoginValidationError(fieldErrors);
        }

        if (status === 429) {
          throw new Error("TOO_MANY_REQUESTS");
        }
        if (!error.response) throw new Error('NETWORK_ERROR');
      }

      throw new Error("LOGIN_REQUEST_FAILED");
    }
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
