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

export const calculateLockRemainingSeconds = (lockUntil: number): number => {
  const remainingMs = lockUntil - Date.now();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
};

export const getLockStatus = (): {
  isLocked: boolean;
  remainingSeconds: number;
} => {
  const storage = getStorage();
  const lockUntilValue = storage.getItem("lockUntil");

  if (!lockUntilValue) {
    return { isLocked: false, remainingSeconds: 0 };
  }

  const lockUntil = Number(lockUntilValue);
  if (Number.isNaN(lockUntil)) {
    storage.removeItem("lockUntil");
    storage.removeItem("loginAttempts");
    return { isLocked: false, remainingSeconds: 0 };
  }

  const remainingSeconds = calculateLockRemainingSeconds(lockUntil);
  if (remainingSeconds <= 0) {
    storage.removeItem("lockUntil");
    storage.removeItem("loginAttempts");
    return { isLocked: false, remainingSeconds: 0 };
  }

  return { isLocked: true, remainingSeconds };
};

export const registerFailedLoginAttempt = (): {
  isLocked: boolean;
  remainingSeconds: number;
} => {
  const storage = getStorage();
  const currentAttempts =
    Number.parseInt(storage.getItem("loginAttempts") ?? "0", 10) || 0;
  const nextAttempts = currentAttempts + 1;

  storage.setItem("loginAttempts", String(nextAttempts));

  if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
    const lockUntil = Date.now() + LOCK_DURATION_MS;
    storage.setItem("lockUntil", String(lockUntil));
    return {
      isLocked: true,
      remainingSeconds: calculateLockRemainingSeconds(lockUntil),
    };
  }

  return { isLocked: false, remainingSeconds: 0 };
};

export const clearSuccessfulLoginState = (): void => {
  const storage = getStorage();
  storage.removeItem("loginAttempts");
  storage.removeItem("lockUntil");
};

export const getGenericLoginErrorMessage = (): string =>
  "Email hoặc mật khẩu không chính xác.";
