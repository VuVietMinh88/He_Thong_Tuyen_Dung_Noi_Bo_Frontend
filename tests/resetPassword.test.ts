import { describe, expect, it, vi } from "vitest";

import { authService } from "../src/services/auth.service";
import axiosClient from "../src/utils/axiosClient";
import { isValidPassword } from "../src/utils/passwordValidation";

describe("reset password validation and API contract", () => {
  it("accepts a password with Vietnamese letters and respects the 72-byte limit", () => {
    expect(isValidPassword("Mậtkhẩu1")).toBe(true);
    expect(isValidPassword("a".repeat(71) + "1")).toBe(true);
    expect(isValidPassword("a".repeat(71) + "1" + "b")).toBe(false);
  });

  it("maps backend VALIDATION_ERROR to the password validation path", async () => {
    vi.spyOn(axiosClient, "post").mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          code: "VALIDATION_ERROR",
          fieldErrors: {
            newPassword: ["Mật khẩu phải có ít nhất 8 ký tự, có chữ và số"],
          },
        },
      },
    });

    await expect(authService.resetPassword("token", "weak")).rejects.toThrow(
      "PASSWORD_INVALID",
    );
  });

  it("maps backend RESET_TOKEN_INVALID to the invalid token path", async () => {
    vi.spyOn(axiosClient, "post").mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          code: "RESET_TOKEN_INVALID",
        },
      },
    });

    await expect(
      authService.resetPassword("bad-token", "Mậtkhẩu1"),
    ).rejects.toThrow("INVALID_OR_EXPIRED_TOKEN");
  });
});
