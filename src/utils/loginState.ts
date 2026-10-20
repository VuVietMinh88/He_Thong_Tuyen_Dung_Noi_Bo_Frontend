export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;

const createFallbackStorage = (): Storage => {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
};

const getStorage = (): Storage => {
  const storage = globalThis.localStorage;
  if (storage) {
    return storage;
  }

  return createFallbackStorage();
};

const normalizeEmailForKey = (email?: string): string => {
  return (email ?? "").trim().toLowerCase();
};

const getLegacyLoginAttemptKey = (): string => "loginAttempts";
const getLegacyLoginLockKey = (): string => "lockUntil";

const getLoginAttemptKey = (email?: string): string => {
  const normalized = normalizeEmailForKey(email);
  return normalized
    ? `loginAttempts:${normalized}`
    : getLegacyLoginAttemptKey();
};

const getLoginLockKey = (email?: string): string => {
  const normalized = normalizeEmailForKey(email);
  return normalized ? `lockUntil:${normalized}` : getLegacyLoginLockKey();
};

export const calculateLockRemainingSeconds = (lockUntil: number): number => {
  const remainingMs = lockUntil - Date.now();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
};

export const getLockStatus = (
  email?: string,
): {
  isLocked: boolean;
  remainingSeconds: number;
} => {
  const storage = getStorage();
  const normalized = normalizeEmailForKey(email);
  const lockKey = getLoginLockKey(email);
  const attemptKey = getLoginAttemptKey(email);
  const lockUntilValue = storage.getItem(lockKey);

  if (!lockUntilValue) {
    if (normalized) {
      const legacyLockValue = storage.getItem(getLegacyLoginLockKey());
      if (!legacyLockValue) {
        return { isLocked: false, remainingSeconds: 0 };
      }
    }
    return { isLocked: false, remainingSeconds: 0 };
  }

  const lockUntil = Number(lockUntilValue);
  if (Number.isNaN(lockUntil)) {
    storage.removeItem(lockKey);
    storage.removeItem(attemptKey);
    return { isLocked: false, remainingSeconds: 0 };
  }

  const remainingSeconds = calculateLockRemainingSeconds(lockUntil);
  if (remainingSeconds <= 0) {
    storage.removeItem(lockKey);
    storage.removeItem(attemptKey);
    return { isLocked: false, remainingSeconds: 0 };
  }

  return { isLocked: true, remainingSeconds };
};

export const registerFailedLoginAttempt = (
  email?: string,
): {
  isLocked: boolean;
  remainingSeconds: number;
} => {
  const storage = getStorage();
  const attemptsKey = getLoginAttemptKey(email);
  const lockKey = getLoginLockKey(email);
  const currentAttempts =
    Number.parseInt(storage.getItem(attemptsKey) ?? "0", 10) || 0;
  const nextAttempts = currentAttempts + 1;

  storage.setItem(attemptsKey, String(nextAttempts));

  if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
    const lockUntil = Date.now() + LOCK_DURATION_MS;
    storage.setItem(lockKey, String(lockUntil));
    return {
      isLocked: true,
      remainingSeconds: calculateLockRemainingSeconds(lockUntil),
    };
  }

  return { isLocked: false, remainingSeconds: 0 };
};

export const clearSuccessfulLoginState = (email?: string): void => {
  const storage = getStorage();
  const normalized = normalizeEmailForKey(email);

  if (normalized) {
    storage.removeItem(getLoginAttemptKey(email));
    storage.removeItem(getLoginLockKey(email));
    return;
  }

  storage.removeItem(getLegacyLoginAttemptKey());
  storage.removeItem(getLegacyLoginLockKey());
};

export const getGenericLoginErrorMessage = (): string =>
  "Email hoặc mật khẩu không chính xác.";
