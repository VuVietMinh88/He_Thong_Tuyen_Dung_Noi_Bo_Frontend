import { afterEach, describe, expect, it, vi } from "vitest";
import axiosClient from "../src/utils/axiosClient";
import {
  avatarService,
  getAvatarErrorMessage,
  type UploadAvatarResponse,
} from "../src/services/avatarService";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("avatarService (TKNHTTDNB1-190)", () => {
  const mockUploadResponse: UploadAvatarResponse = {
    userId: "00000000-0000-0000-0000-000000000001",
    contentType: "image/png",
    sizeBytes: 48213,
    updatedAt: "2026-10-07T08:00:00Z",
    imageUrl: "/api/v1/accounts/00000000-0000-0000-0000-000000000001/avatar",
    thumbnailUrl:
      "/api/v1/accounts/00000000-0000-0000-0000-000000000001/avatar?size=thumbnail",
  };

  it("calls PUT /profile/avatar with multipart/form-data payload and returns response", async () => {
    const putSpy = vi.spyOn(axiosClient, "put").mockResolvedValueOnce({
      data: mockUploadResponse,
    });

    const file = new File(["dummy png content"], "avatar.png", {
      type: "image/png",
    });

    const result = await avatarService.uploadAvatar(file);

    expect(result).toEqual(mockUploadResponse);
    expect(putSpy).toHaveBeenCalledTimes(1);
    expect(putSpy).toHaveBeenCalledWith("/profile/avatar", expect.any(FormData));

    const calledFormData = putSpy.mock.calls[0]?.[1] as FormData;
    expect(calledFormData.get("file")).toBeDefined();
  });

  it("calls DELETE /profile/avatar to remove user avatar", async () => {
    const deleteSpy = vi.spyOn(axiosClient, "delete").mockResolvedValueOnce({
      status: 204,
    });

    await avatarService.deleteAvatar();

    expect(deleteSpy).toHaveBeenCalledWith("/profile/avatar");
    expect(deleteSpy).toHaveBeenCalledTimes(1);
  });

  it("calls GET /profile/avatar with blob responseType", async () => {
    const dummyBlob = new Blob(["image data"], { type: "image/png" });
    const getSpy = vi.spyOn(axiosClient, "get").mockResolvedValueOnce({
      data: dummyBlob,
    });

    const blob = await avatarService.getAvatarBlob("thumbnail");

    expect(blob).toEqual(dummyBlob);
    expect(getSpy).toHaveBeenCalledWith("/profile/avatar", {
      params: { size: "thumbnail" },
      responseType: "blob",
    });
  });

  describe("getAvatarErrorMessage helper", () => {
    it("maps 413 to file size error message", () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 413, data: {} },
      };
      expect(getAvatarErrorMessage(axiosError)).toContain("2MB");
    });

    it("maps 415 to unsupported format error message", () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 415, data: {} },
      };
      expect(getAvatarErrorMessage(axiosError)).toContain("JPG hoặc PNG");
    });

    it("maps 403 to permission error message", () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 403, data: {} },
      };
      expect(getAvatarErrorMessage(axiosError)).toContain("quyền");
    });

    it("maps 401 to session expired error message", () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 401, data: {} },
      };
      expect(getAvatarErrorMessage(axiosError)).toContain("Phiên đăng nhập");
    });

    it("extracts backend specific error code AVATAR_DIMENSIONS_TOO_LARGE", () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { code: "AVATAR_DIMENSIONS_TOO_LARGE" },
        },
      };
      expect(getAvatarErrorMessage(axiosError)).toContain("4096px");
    });

    it("extracts backend message field if provided", () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: "Ảnh không hợp lệ theo quy định." },
        },
      };
      expect(getAvatarErrorMessage(axiosError)).toBe("Ảnh không hợp lệ theo quy định.");
    });
  });
});
