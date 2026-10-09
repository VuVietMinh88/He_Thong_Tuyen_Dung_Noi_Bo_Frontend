import { describe, expect, it } from "vitest";
import {
  ALLOWED_AVATAR_MIME_TYPES,
  MAX_AVATAR_SIZE_BYTES,
  validateAvatarFile,
} from "../src/components/Profile/avatarValidation";

describe("AvatarUploadUI - Client-side File Validation (TKNHTTDNB1-185)", () => {
  it("defines correct constraints for avatar upload", () => {
    // 2MB = 2 * 1024 * 1024 = 2,097,152 bytes
    expect(MAX_AVATAR_SIZE_BYTES).toBe(2097152);
    expect(ALLOWED_AVATAR_MIME_TYPES).toContain("image/jpeg");
    expect(ALLOWED_AVATAR_MIME_TYPES).toContain("image/png");
  });

  describe("File Format Validation", () => {
    it("accepts valid JPEG image file", () => {
      const file = new File(["dummy content"], "avatar.jpg", {
        type: "image/jpeg",
      });
      const result = validateAvatarFile(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("accepts valid PNG image file", () => {
      const file = new File(["dummy content"], "avatar.png", {
        type: "image/png",
      });
      const result = validateAvatarFile(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("accepts valid JPG file when browser mime type is empty but extension is .jpg", () => {
      const file = new File(["dummy content"], "photo.jpg", {
        type: "",
      });
      const result = validateAvatarFile(file);
      expect(result.isValid).toBe(true);
    });

    it("rejects unsupported MIME types such as GIF, WebP, SVG, PDF", () => {
      const unsupportedFiles = [
        new File(["dummy"], "avatar.gif", { type: "image/gif" }),
        new File(["dummy"], "avatar.webp", { type: "image/webp" }),
        new File(["dummy"], "avatar.svg", { type: "image/svg+xml" }),
        new File(["dummy"], "cv.pdf", { type: "application/pdf" }),
        new File(["dummy"], "document.docx", {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }),
      ];

      unsupportedFiles.forEach((file) => {
        const result = validateAvatarFile(file);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe("Chỉ hỗ trợ tệp ảnh định dạng JPG hoặc PNG.");
      });
    });
  });

  describe("File Size Validation", () => {
    it("accepts file exactly at 2MB limit", () => {
      const exact2MBContent = new Uint8Array(MAX_AVATAR_SIZE_BYTES);
      const file = new File([exact2MBContent], "large-avatar.png", {
        type: "image/png",
      });

      const result = validateAvatarFile(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("rejects file exceeding 2MB limit by 1 byte", () => {
      const over2MBContent = new Uint8Array(MAX_AVATAR_SIZE_BYTES + 1);
      const file = new File([over2MBContent], "too-heavy.png", {
        type: "image/png",
      });

      const result = validateAvatarFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "Dung lượng ảnh vượt quá giới hạn 2MB (tối đa 2MB).",
      );
    });

    it("rejects 5MB file", () => {
      const fiveMBContent = new Uint8Array(5 * 1024 * 1024);
      const file = new File([fiveMBContent], "giant.jpg", {
        type: "image/jpeg",
      });

      const result = validateAvatarFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "Dung lượng ảnh vượt quá giới hạn 2MB (tối đa 2MB).",
      );
    });
  });
});
