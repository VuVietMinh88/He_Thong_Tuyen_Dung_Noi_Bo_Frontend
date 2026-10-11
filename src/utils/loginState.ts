export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;
const DEVICE_LOCK_KEY = 'loginDeviceLockUntil';

export const calculateLockRemainingSeconds = (lockUntil: number): number =>
  Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));

/** Only mirror a server lock for the countdown. The backend enforces every attempt. */
export const recordServerLoginLock = (retryAfterSeconds: number): void => {
  if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds <= 0) return;
  try {
    window.localStorage.setItem(DEVICE_LOCK_KEY, String(Date.now() + retryAfterSeconds * 1000));
  } catch {
    // The server still enforces the lock if browser storage becomes unavailable.
  }
};

export const clearSuccessfulLoginState = (): void => {
  try {
    window.localStorage.removeItem(DEVICE_LOCK_KEY);
  } catch {
    // Server state is authoritative; this is only the display cache.
  }
};

export const getLockStatus = (): { isLocked: boolean; remainingSeconds: number } => {
  try {
    const value = window.localStorage.getItem(DEVICE_LOCK_KEY);
    const lockUntil = Number(value);
    if (!value || !Number.isFinite(lockUntil)) {
      clearSuccessfulLoginState();
      return { isLocked: false, remainingSeconds: 0 };
    }
    const remainingSeconds = calculateLockRemainingSeconds(lockUntil);
    if (remainingSeconds === 0) clearSuccessfulLoginState();
    return { isLocked: remainingSeconds > 0, remainingSeconds };
  } catch {
    return { isLocked: false, remainingSeconds: 0 };
  }
};

export const getGenericLoginErrorMessage = (): string =>
  'Email hoặc mật khẩu không chính xác.';
