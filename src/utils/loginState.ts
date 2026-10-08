const LOGIN_ATTEMPTS_KEY = 'loginAttempts';
const LOCK_UNTIL_KEY = 'lockUntil';
const LOCK_DURATION_MS = 15 * 60 * 1000;

export const MAX_LOGIN_ATTEMPTS = 5;

export interface LoginLockStatus {
  isLocked: boolean;
  attempts: number;
  remainingSeconds: number;
}

const readNumber = (key: string): number => {
  try {
    const value = Number.parseInt(window.localStorage.getItem(key) ?? '', 10);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
};

const removeLoginState = (): void => {
  try {
    window.localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    window.localStorage.removeItem(LOCK_UNTIL_KEY);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
};

export const getLockStatus = (): LoginLockStatus => {
  const attempts = readNumber(LOGIN_ATTEMPTS_KEY);
  const lockUntil = readNumber(LOCK_UNTIL_KEY);
  const remainingMs = lockUntil - Date.now();

  if (lockUntil > 0 && remainingMs <= 0) {
    removeLoginState();
    return { isLocked: false, attempts: 0, remainingSeconds: 0 };
  }

  return {
    isLocked: remainingMs > 0,
    attempts,
    remainingSeconds: remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0,
  };
};

export const registerFailedLoginAttempt = (): LoginLockStatus => {
  const attempts = readNumber(LOGIN_ATTEMPTS_KEY) + 1;

  try {
    window.localStorage.setItem(LOGIN_ATTEMPTS_KEY, attempts.toString());
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      window.localStorage.setItem(LOCK_UNTIL_KEY, (Date.now() + LOCK_DURATION_MS).toString());
    }
  } catch {
    // Lockout tracking is best-effort; authentication is enforced by the backend.
  }

  return getLockStatus();
};

export const clearSuccessfulLoginState = (): void => {
  removeLoginState();
};

export const getGenericLoginErrorMessage = (error?: unknown): string => {
  if (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === 'ECONNABORTED'
  ) {
    return 'Máy chủ phản hồi quá thời gian chờ. Vui lòng kiểm tra Backend rồi thử lại.';
  }

  return 'Thông tin đăng nhập không chính xác hoặc hệ thống đang gặp sự cố. Vui lòng thử lại.';
};
