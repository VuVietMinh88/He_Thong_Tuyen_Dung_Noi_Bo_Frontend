import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authService } from "../src/services/auth.service";
import axiosClient from "../src/utils/axiosClient";
import { tokenService } from '../src/services/token.service';

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
    sessionStorage: { removeItem: vi.fn() },
    dispatchEvent: vi.fn(),
  });
  tokenService.saveTokens('current-access', 'current-refresh');
});

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

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

  it("does not report success when the change-password request cannot reach the backend", async () => {
    vi.spyOn(axiosClient, "post").mockRejectedValue({
      isAxiosError: true,
      request: {},
    });

    await expect(authService.changePassword("Current123", "NewPass123"))
      .rejects.toThrow("CHANGE_PASSWORD_REQUEST_FAILED");
    expect(tokenService.getAccessToken()).toBe('current-access');
    expect(tokenService.getRefreshToken()).toBe('current-refresh');
    expect(window.dispatchEvent).not.toHaveBeenCalled();
  });

  it('clears all local auth only after successful password change and preserves the device identity', async () => {
    const deviceId = '12121212-1234-4567-8123-123456789abc';
    window.localStorage.setItem('loginDeviceId', deviceId);
    tokenService.setUserData({ id: '1', email: 'user@test.example', fullName: 'User', roles: ['ADMIN'] });
    const post = vi.spyOn(axiosClient, 'post').mockResolvedValue({ status: 200 });
    const revision = tokenService.getSessionRevision();
    await authService.changePassword('Current123', 'NewPass123');
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/auth/change-password', { currentPassword: 'Current123', newPassword: 'NewPass123' }, {
      _sessionId: expect.any(String),
    });
    expect(tokenService.getAccessToken()).toBeNull();
    expect(tokenService.getRefreshToken()).toBeNull();
    expect(tokenService.getUserData()).toBeNull();
    expect(tokenService.getSessionRevision()).toBeGreaterThan(revision);
    expect(window.localStorage.getItem('loginDeviceId')).toBe(deviceId);
    expect(window.dispatchEvent).not.toHaveBeenCalled();
  });

  it.each(['CURRENT_PASSWORD_INCORRECT', 'VALIDATION_ERROR'])('keeps the current session when the server rejects %s', async (code) => {
    vi.spyOn(axiosClient, 'post').mockRejectedValue({ isAxiosError: true, response: { status: 400, data: { code } } });
    await expect(authService.changePassword('Current123', 'NewPass123')).rejects.toBeInstanceOf(Error);
    expect(tokenService.getAccessToken()).toBe('current-access');
    expect(tokenService.getRefreshToken()).toBe('current-refresh');
    expect(window.dispatchEvent).not.toHaveBeenCalled();
  });

  it('does not clear a different login when an earlier password-change success arrives late', async () => {
    let finishChange!: (value: { status: number }) => void;
    vi.spyOn(axiosClient, 'post').mockImplementationOnce(() => new Promise(resolve => { finishChange = resolve; }));
    const pending = authService.changePassword('Current123', 'NewPass123');
    tokenService.saveTokens('different-account-access', 'different-account-refresh');
    const identity = tokenService.getSessionId();
    finishChange({ status: 200 });
    await expect(pending).resolves.toEqual({ sessionEnded: false });
    expect(tokenService.getAccessToken()).toBe('different-account-access');
    expect(tokenService.getRefreshToken()).toBe('different-account-refresh');
    expect(tokenService.getSessionId()).toBe(identity);
  });

  it('still ends its session if its access token rotated while password change was pending', async () => {
    let finishChange!: (value: { status: number }) => void;
    vi.spyOn(axiosClient, 'post').mockImplementationOnce(() => new Promise(resolve => { finishChange = resolve; }));
    const identity = tokenService.getSessionId()!;
    const pending = authService.changePassword('Current123', 'NewPass123');
    expect(tokenService.rotateTokens('rotated-access', 'rotated-refresh', identity)).toBe(true);
    finishChange({ status: 200 });
    await expect(pending).resolves.toEqual({ sessionEnded: true });
    expect(tokenService.getAccessToken()).toBeNull();
    expect(tokenService.getRefreshToken()).toBeNull();
  });

  it('does not send a password mutation if another login replaces the session before the request interceptor runs', async () => {
    const originalAdapter = axiosClient.defaults.adapter;
    const adapter = vi.fn();
    axiosClient.defaults.adapter = adapter;
    try {
      const pending = authService.changePassword('Current123', 'NewPass123');
      tokenService.saveTokens('replacement-access', 'replacement-refresh');
      await expect(pending).rejects.toThrow('CHANGE_PASSWORD_REQUEST_FAILED');
      expect(adapter).not.toHaveBeenCalled();
      expect(tokenService.getAccessToken()).toBe('replacement-access');
    } finally {
      axiosClient.defaults.adapter = originalAdapter;
    }
  });
});
