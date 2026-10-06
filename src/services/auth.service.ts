import axios from "axios";
import axiosClient from "../utils/axiosClient";
import type { LoginResponse } from "../types/auth";

type ApiFieldErrorMap = Record<string, string[] | string | undefined>;

type BackendErrorPayload = {
  code?: string;
  fieldErrors?: ApiFieldErrorMap;
  message?: string;
};

const extractFieldErrorMessage = (fieldErrors: unknown): string | null => {
  if (!fieldErrors || typeof fieldErrors !== "object") {
    return null;
  }

  const entries = Object.values(fieldErrors as Record<string, unknown>);

  for (const value of entries) {
    if (Array.isArray(value)) {
      const message = value.find(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
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
      await axiosClient.post("/auth/forgot-password", { email });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 400 || status === 404 || status === 422) {
          throw new Error("EMAIL_INVALID");
        }

        if (status === 429) {
          throw new Error("RATE_LIMITED");
        }

        if (status === 500 || status === 503) {
          throw new Error("SERVER_UNAVAILABLE");
        }
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
          const fieldErrorMessage = extractFieldErrorMessage(
            payload?.fieldErrors,
          );

          if (fieldErrorMessage) {
            Object.assign(validationError, { fieldMessage: fieldErrorMessage });
          }

          throw validationError;
        }
      }

      throw new Error("RESET_PASSWORD_REQUEST_FAILED");
    }
  },
};
