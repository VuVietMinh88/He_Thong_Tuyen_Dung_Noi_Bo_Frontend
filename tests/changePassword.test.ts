import { describe, expect, it, vi } from "vitest";

import { authService } from "../src/services/auth.service";
import axiosClient from "../src/utils/axiosClient";

describe("change password API contract", () => {
  it("maps CURRENT_PASSWORD_INCORRECT to the invalid current password flow", async () => {
    vi.spyOn(axiosClient, "post").mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          code: "CURRENT_PASSWORD_INCORRECT",
        },
      },
    });

    await expect(authService.changePassword("wrongpass", "Mậtkhẩu1")).rejects.toThrow(
      "INVALID_CURRENT_PASSWORD",
    );
  });

  it("maps VALIDATION_ERROR to the new password validation flow", async () => {
    vi.spyOn(axiosClient, "post").mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          code: "VALIDATION_ERROR",
          fieldErrors: {
            newPassword: ["Mật khẩu phải có chữ và số"],
          },
        },
      },
    });

    await expect(authService.changePassword("Abcdef12", "weak")).rejects.toThrow(
      "PASSWORD_INVALID",
    );
  });

  it("logout is available for server-side refresh token invalidation", async () => {
    const postSpy = vi.spyOn(axiosClient, "post").mockResolvedValue({ status: 200 });

    await expect(authService.logout()).resolves.toBeUndefined();
    expect(postSpy).toHaveBeenCalledWith("/auth/logout");
  });
});
