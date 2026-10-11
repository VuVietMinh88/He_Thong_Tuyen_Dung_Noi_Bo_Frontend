import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateLockRemainingSeconds,
  clearSuccessfulLoginState,
  getGenericLoginErrorMessage,
  getLockStatus,
  recordServerLoginLock,
} from '../src/utils/loginState';

const createStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
  vi.stubGlobal('window', { localStorage: createStorage() });
});

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('server-directed browser login lock', () => {
  it('keeps credential failure messages generic', () => {
    expect(getGenericLoginErrorMessage()).toBe('Email hoặc mật khẩu không chính xác.');
  });

  it('shares a server lock across accounts and tabs using the same browser storage', () => {
    const sharedStorage = window.localStorage;
    recordServerLoginLock(900);
    vi.stubGlobal('window', { localStorage: sharedStorage });
    expect(getLockStatus()).toEqual({ isLocked: true, remainingSeconds: 900 });
    vi.advanceTimersByTime(60_000);
    expect(getLockStatus()).toEqual({ isLocked: true, remainingSeconds: 840 });
  });

  it('keeps a different browser unlocked', () => {
    recordServerLoginLock(900);
    vi.stubGlobal('window', { localStorage: createStorage() });
    expect(getLockStatus()).toEqual({ isLocked: false, remainingSeconds: 0 });
  });

  it('ends the display lock when the server retry delay elapses', () => {
    recordServerLoginLock(120);
    vi.advanceTimersByTime(120_000);
    expect(getLockStatus()).toEqual({ isLocked: false, remainingSeconds: 0 });
    expect(window.localStorage.getItem('loginDeviceLockUntil')).toBeNull();
  });

  it('clears a successful-login countdown while retaining device identity', () => {
    window.localStorage.setItem('loginDeviceId', 'browser-id');
    recordServerLoginLock(900);
    clearSuccessfulLoginState();
    expect(getLockStatus().isLocked).toBe(false);
    expect(window.localStorage.getItem('loginDeviceId')).toBe('browser-id');
  });

  it('ignores old account-specific locks because the server now owns throttling', () => {
    window.localStorage.setItem('lockUntil:user@test.example', String(Date.now() + 900_000));
    window.localStorage.setItem('loginAttempts:user@test.example', '5');
    expect(getLockStatus().isLocked).toBe(false);
  });

  it.each([NaN, Infinity, 0, -1])('ignores invalid retry delay %s', (value) => {
    recordServerLoginLock(value);
    expect(getLockStatus().isLocked).toBe(false);
  });

  it('clears malformed persisted deadlines', () => {
    window.localStorage.setItem('loginDeviceLockUntil', 'Infinity');
    expect(getLockStatus().isLocked).toBe(false);
  });

  it('rounds fractional remaining seconds upward', () => {
    expect(calculateLockRemainingSeconds(Date.now() + 1500)).toBe(2);
  });
});
