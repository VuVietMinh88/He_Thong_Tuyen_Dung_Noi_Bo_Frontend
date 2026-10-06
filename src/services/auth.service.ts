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
};
