import axios from 'axios';
import axiosClient from '../utils/axiosClient';

export interface ProfileResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  displayTitle: string | null;
  departmentId: string | null;
  departmentName: string | null;
  roles: string[];
  hasAvatar: boolean;
  avatarUpdatedAt: string | null;
}

export interface UpdateProfileInput {
  fullName: string;
  phone: string | null;
  displayTitle: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Trích xuất thông điệp lỗi từ phản hồi Backend.
 */
export const getApiErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (axios.isAxiosError(error)) {
    const body: unknown = error.response?.data;
    if (isRecord(body)) {
      for (const field of ['message', 'error', 'detail', 'title'] as const) {
        if (typeof body[field] === 'string' && (body[field] as string).trim()) {
          return (body[field] as string).trim();
        }
      }
    }
    if (error.response?.status === 403) {
      return 'Bạn không có quyền cập nhật hồ sơ cá nhân.';
    }
    if (error.response?.status === 401) {
      return 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
    }
    if (!error.response) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.';
    }
  }
  return error instanceof Error ? error.message : fallbackMessage;
};

/**
 * Lấy thông tin hồ sơ của người dùng hiện tại (GET /profile).
 */
const getProfile = async (): Promise<ProfileResponse> => {
  const response = await axiosClient.get<ProfileResponse>('/profile');
  return response.data;
};

/**
 * Cập nhật thông tin cá nhân của người dùng (PUT /profile).
 * Backend chỉ nhận 3 trường: fullName, phone, displayTitle.
 */
const updateProfile = async (input: UpdateProfileInput): Promise<ProfileResponse> => {
  const payload: UpdateProfileInput = {
    fullName: input.fullName.trim(),
    phone: input.phone && input.phone.trim() ? input.phone.trim() : null,
    displayTitle: input.displayTitle && input.displayTitle.trim() ? input.displayTitle.trim() : null,
  };

  const response = await axiosClient.put<ProfileResponse>('/profile', payload);
  return response.data;
};

export const profileService = {
  getProfile,
  updateProfile,
  getApiErrorMessage,
};

export default profileService;
