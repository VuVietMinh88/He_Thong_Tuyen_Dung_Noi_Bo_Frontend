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
      const response = await axiosClient.post("/auth/forgot-password", {
        email,
      });

      if (response.status >= 200 && response.status < 300) {
        return;
      }

      throw new Error("PASSWORD_RESET_REQUEST_FAILED");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 400 || status === 404 || status === 422) {
          throw new Error("EMAIL_INVALID");
        }

        if (status === 429) {
          throw new Error("RATE_LIMITED");
        }

        if (status === 503 || status === 500) {
          throw new Error("SERVER_UNAVAILABLE");
        }
      }

      if (
        error instanceof Error &&
        error.message === "PASSWORD_RESET_REQUEST_FAILED"
      ) {
        throw error;
      }

      throw new Error("NETWORK_ERROR");
    }
  },
};
