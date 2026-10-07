import axios from "axios";
import axiosClient from "../utils/axiosClient";
import type { LoginResponse } from "../types/auth";

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

        if (status === 401) {
          throw new Error("INVALID_CREDENTIALS");
        }

        if (status === 400) {
          const validationError = new Error("VALIDATION_ERROR") as Error & {
            fieldErrors?: Record<string, string[]>;
          };

          const rawFieldErrors = (error.response?.data as Record<string, unknown>)?.fieldErrors ?? {};
          const parsedFieldErrors: Record<string, string[]> = {};

          if (typeof rawFieldErrors === "object" && rawFieldErrors !== null) {
            Object.entries(rawFieldErrors).forEach(([key, value]) => {
              if (typeof value === "string") {
                parsedFieldErrors[key] = [value];
              } else if (Array.isArray(value)) {
                parsedFieldErrors[key] = value.map(String);
              }
            });
          }

          validationError.fieldErrors = parsedFieldErrors;
          throw validationError;
        }

        if (status === 429) {
          throw new Error("TOO_MANY_REQUESTS");
        }
      }

      throw new Error("LOGIN_REQUEST_FAILED");
    }
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await axiosClient.post("/auth/forgot-password", { email });
  },
};
