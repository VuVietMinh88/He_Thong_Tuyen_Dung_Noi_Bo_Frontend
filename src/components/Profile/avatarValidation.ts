/**
 * Giới hạn dung lượng ảnh đại diện tối đa: 2MB (2 * 1024 * 1024 bytes).
 */
export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

/**
 * Định dạng ảnh được phép tải lên: image/jpeg, image/png.
 */
export const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
] as const;

export interface AvatarValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Kiểm tra tính hợp lệ của tệp ảnh tải lên:
 * 1. Định dạng file phải là JPEG hoặc PNG.
 * 2. Dung lượng không được vượt quá 2MB.
 */
export const validateAvatarFile = (file: File): AvatarValidationResult => {
  const isTypeValid =
    ALLOWED_AVATAR_MIME_TYPES.includes(
      file.type.toLowerCase() as (typeof ALLOWED_AVATAR_MIME_TYPES)[number],
    ) || /\.(jpe?g|png)$/i.test(file.name);

  if (!isTypeValid) {
    return {
      isValid: false,
      error: "Chỉ hỗ trợ tệp ảnh định dạng JPG hoặc PNG.",
    };
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return {
      isValid: false,
      error: "Dung lượng ảnh vượt quá giới hạn 2MB (tối đa 2MB).",
    };
  }

  return { isValid: true };
};
