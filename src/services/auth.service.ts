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
      await axiosClient.post("/auth/forgot-password", { email });
    } catch (error) {
      // Anti-enumeration: không lộ trạng thái email tồn tại hay không.
      // Luôn coi request là đã được xử lý thành công ở phía UI.
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

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
