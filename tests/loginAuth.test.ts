import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MAX_LOGIN_ATTEMPTS,
  calculateLockRemainingSeconds,
  clearSuccessfulLoginState,
  getGenericLoginErrorMessage,
  getLockStatus,
  registerFailedLoginAttempt,
} from "../src/utils/loginState";

const createLocalStorageMock = () => {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => (store.has(key) ? store.get(key)! : null)),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
};

describe("login security flow", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a generic error message when credentials are invalid", () => {
    expect(getGenericLoginErrorMessage()).toBe(
      "Email hoặc mật khẩu không chính xác.",
    );
  });

  it("locks the account after 5 consecutive failed attempts", () => {
    for (let attempt = 1; attempt < MAX_LOGIN_ATTEMPTS; attempt += 1) {
      const result = registerFailedLoginAttempt();
      expect(result.isLocked).toBe(false);
      expect(result.remainingSeconds).toBe(0);
    }

    const lockState = registerFailedLoginAttempt();
    expect(lockState.isLocked).toBe(true);
    expect(lockState.remainingSeconds).toBeGreaterThan(0);
    expect(getLockStatus().isLocked).toBe(true);
  });

  it("clears the lock state after a successful login", () => {
    localStorage.setItem("lockUntil", String(Date.now() + 60_000));
    localStorage.setItem("loginAttempts", "5");

    clearSuccessfulLoginState();

    expect(localStorage.getItem("lockUntil")).toBeNull();
    expect(localStorage.getItem("loginAttempts")).toBeNull();
  });

  it("calculates remaining lock time in seconds", () => {
    const futureTime = Date.now() + 2 * 60 * 1000;
    localStorage.setItem("lockUntil", String(futureTime));

    expect(calculateLockRemainingSeconds(futureTime)).toBeGreaterThan(0);
    expect(getLockStatus().remainingSeconds).toBeGreaterThan(0);
  });
});
