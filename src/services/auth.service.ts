import axios from "axios";
import axiosClient from "../utils/axiosClient";
import type { LoginResponse } from "../types/auth";

type ApiFieldErrors = Record<string, string[] | string | undefined>;

type BackendErrorPayload = {
  code?: string;
  fieldErrors?: ApiFieldErrors;
};

const getFieldErrorMessage = (fieldErrors: unknown): string | null => {
  if (!fieldErrors || typeof fieldErrors !== "object") {
    return null;
  }

  const values = Object.values(fieldErrors as Record<string, unknown>);

  for (const value of values) {
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
      const response = await axiosClient.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 400 || status === 401) {
          throw new Error("INVALID_CREDENTIALS");
        }

        if (status === 429) {
          throw new Error("TOO_MANY_REQUESTS");
        }
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

        if (code === "RESET_TOKEN_INVALID") {
          throw new Error("INVALID_OR_EXPIRED_TOKEN");
        }

        if (code === "VALIDATION_ERROR") {
          const validationError = new Error("PASSWORD_INVALID");
          const fieldErrorMessage = getFieldErrorMessage(payload?.fieldErrors);

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
          const fieldErrorMessage = getFieldErrorMessage(payload?.fieldErrors);

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
