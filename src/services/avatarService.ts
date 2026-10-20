import axios from "axios";
import axiosClient from "../utils/axiosClient";

export interface UploadAvatarResponse {
  userId: string;
  contentType: string;
  sizeBytes: number;
  updatedAt: string;
  imageUrl: string;
  thumbnailUrl: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Trích xuất thông điệp lỗi thân thiện bằng tiếng Việt từ phản hồi Backend cho API ảnh đại diện.
 */
export const getAvatarErrorMessage = (
  error: unknown,
  fallbackMessage = "Đã xảy ra lỗi khi xử lý ảnh đại diện.",
): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body: unknown = error.response?.data;

    if (isRecord(body)) {
      const code = body.code || body.error;
      if (code === "AVATAR_TYPE_UNSUPPORTED") {
        return "Chỉ hỗ trợ tệp ảnh định dạng JPG hoặc PNG.";
      }
      if (code === "AVATAR_TOO_LARGE" || code === "FILE_TOO_LARGE") {
        return "Dung lượng ảnh vượt quá giới hạn 2MB.";
      }
      if (code === "AVATAR_DIMENSIONS_TOO_LARGE") {
        return "Kích thước ảnh vượt quá 4096px mỗi cạnh.";
      }
      if (code === "AVATAR_INVALID") {
        return "Tệp ảnh bị hỏng hoặc không hợp lệ.";
      }
      if (code === "AVATAR_FILE_REQUIRED") {
        return "Vui lòng chọn tệp ảnh để tải lên.";
      }
      if (code === "SESSION_INVALID") {
        return "Phiên đăng nhập không hợp lệ hoặc đã bị khóa.";
      }

      for (const field of ["message", "detail", "title"] as const) {
        if (typeof body[field] === "string" && (body[field] as string).trim()) {
          return (body[field] as string).trim();
        }
      }
    }

    if (status === 413) {
      return "Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 2MB).";
    }
    if (status === 415) {
      return "Định dạng ảnh không được hỗ trợ. Chỉ chấp nhận JPG hoặc PNG.";
    }
    if (status === 403) {
      return "Bạn không có quyền cập nhật ảnh đại diện.";
    }
    if (status === 401) {
      return "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.";
    }
    if (status === 404) {
      return "Không tìm thấy ảnh đại diện.";
    }
    if (!error.response) {
      return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.";
    }
  }

  return error instanceof Error ? error.message : fallbackMessage;
};

/**
 * Tải lên hoặc thay thế ảnh đại diện của người dùng hiện tại (PUT /profile/avatar).
 * Backend yêu cầu multipart/form-data chứa trường `file`.
 */
export const uploadAvatar = async (
  file: File | Blob,
): Promise<UploadAvatarResponse> => {
  const formData = new FormData();
  if (file instanceof File) {
    formData.append("file", file);
  } else {
    formData.append("file", file, "avatar.png");
  }

  const response = await axiosClient.put<UploadAvatarResponse>(
    "/profile/avatar",
    formData,
  );
  return response.data;
};

/**
 * Xóa ảnh đại diện của người dùng hiện tại (DELETE /profile/avatar).
 * Thành công trả về status 204 No Content.
 */
export const deleteAvatar = async (): Promise<void> => {
  await axiosClient.delete("/profile/avatar");
};

/**
 * Tải byte nhị phân của ảnh đại diện có kèm token xác thực Bearer (GET /profile/avatar).
 */
export const getAvatarBlob = async (
  size: "full" | "thumbnail" = "full",
): Promise<Blob> => {
  const response = await axiosClient.get<Blob>("/profile/avatar", {
    params: { size },
    responseType: "blob",
  });
  return response.data;
};

/**
 * Tiện ích lấy Object URL của ảnh đại diện cá nhân kèm Header xác thực.
 * Trả về null nếu người dùng chưa có ảnh (404 AVATAR_NOT_FOUND).
 */
export const getMyAvatarBlobUrl = async (
  size: "full" | "thumbnail" = "full",
): Promise<string | null> => {
  try {
    const blob = await getAvatarBlob(size);
    return URL.createObjectURL(blob);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const avatarService = {
  uploadAvatar,
  deleteAvatar,
  getAvatarBlob,
  getMyAvatarBlobUrl,
  getAvatarErrorMessage,
};

export default avatarService;
