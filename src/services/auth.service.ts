import axios from "axios";
import axiosClient from "../utils/axiosClient";
import type { LoginResponse } from "../types/auth";

type ApiFieldErrors = Record<string, string[] | string | undefined>;

type BackendErrorPayload = {
  code?: string;
  fieldErrors?: ApiFieldErrors;
  message?: string;
};

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

const extractFieldErrorMessage = (fieldErrors: unknown): string | null => {
  if (!isRecord(fieldErrors)) return null;

  for (const value of Object.values(fieldErrors)) {
    if (Array.isArray(value)) {
      const message = value.find(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      );

      if (message) {
        return message;
      }
    }

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
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
      const response = await axiosClient.post("/auth/forgot-password", { email });

      if (response.status >= 200 && response.status < 300) {
        return;
      }

      throw new Error("PASSWORD_RESET_REQUEST_FAILED");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const payload = error.response?.data as BackendErrorPayload | undefined;
        const code = payload?.code;

        if (code === "EMAIL_INVALID" || code === "VALIDATION_ERROR") {
          throw new Error("EMAIL_INVALID");
        }

        if (error.response?.status === 429) {
          throw new Error("RATE_LIMITED");
        }

        if (
          error.response?.status === 500 ||
          error.response?.status === 503
        ) {
          throw new Error("SERVER_UNAVAILABLE");
        }
      }

      if (error instanceof Error && error.message === "PASSWORD_RESET_REQUEST_FAILED") {
        throw error;
      }

      throw new Error("NETWORK_ERROR");
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
        const payload = error.response?.data as BackendErrorPayload | undefined;
        const code = payload?.code;
        const status = error.response?.status;
        if (code === 'RESET_TOKEN_INVALID' || (status !== undefined && [401, 404, 410].includes(status))) {
          throw new Error("INVALID_OR_EXPIRED_TOKEN");
        }

        if (code === 'VALIDATION_ERROR' || status === 400) {
          if (code !== 'VALIDATION_ERROR') {
            throw new Error("INVALID_OR_EXPIRED_TOKEN");
          }
          const validationError = new Error("PASSWORD_INVALID");
          const fieldErrorMessage = extractFieldErrorMessage(payload?.fieldErrors);

          if (fieldErrorMessage) {
            Object.assign(validationError, { fieldMessage: fieldErrorMessage });
          }

          throw validationError;
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
        const payload = error.response?.data as BackendErrorPayload | undefined;
        const code = payload?.code;

        if (code === "CURRENT_PASSWORD_INCORRECT") {
          throw new Error("INVALID_CURRENT_PASSWORD");
        }

        if (code === "VALIDATION_ERROR") {
          const validationError = new Error("PASSWORD_INVALID");
          const fieldErrorMessage = extractFieldErrorMessage(payload?.fieldErrors);

          if (fieldErrorMessage) {
            Object.assign(validationError, { fieldMessage: fieldErrorMessage });
          }

          throw validationError;
        }
      }

      throw new Error("CHANGE_PASSWORD_REQUEST_FAILED");
    }
  },

  logout: async (): Promise<void> => {
    await axiosClient.post("/auth/logout");
  },
};
