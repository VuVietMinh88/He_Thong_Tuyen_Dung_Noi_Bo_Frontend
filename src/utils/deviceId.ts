import { AUTH_STORAGE_KEYS } from '../constants/auth.constants';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Generates an RFC4122 version 4 UUID.
 * Uses crypto.randomUUID() when available, with resilient fallbacks for older browsers and tests.
 */
export const generateUuidV4 = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // Set version to 0100 (v4)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Set variant to 10xx (RFC4122)
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  // Fallback for restricted / node test environments without Web Crypto API
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

/**
 * Validates if a string is a well-formed UUID v4.
 */
export const isValidUuidV4 = (uuid: unknown): uuid is string =>
  typeof uuid === 'string' && UUID_V4_REGEX.test(uuid.trim());

const getStorage = (): Storage | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    // Restricted or headless environment fallback
  }
  return null;
};

/**
 * Retrieves the persisted device ID from localStorage or generates, persists, and returns a new UUID v4.
 */
export const getOrCreateDeviceId = (): string => {
  const storage = getStorage();
  if (storage) {
    try {
      const storedId = storage.getItem(AUTH_STORAGE_KEYS.DEVICE_ID);
      if (isValidUuidV4(storedId)) {
        return storedId.trim();
      }

      const newDeviceId = generateUuidV4();
      storage.setItem(AUTH_STORAGE_KEYS.DEVICE_ID, newDeviceId);
      return newDeviceId;
    } catch {
      // Storage quota or restriction fallback
    }
  }

  return generateUuidV4();
};

/**
 * Retrieves the current device ID if already stored, or returns null.
 */
export const getDeviceId = (): string | null => {
  const storage = getStorage();
  if (storage) {
    try {
      const storedId = storage.getItem(AUTH_STORAGE_KEYS.DEVICE_ID);
      return isValidUuidV4(storedId) ? storedId.trim() : null;
    } catch {
      // Fallback
    }
  }
  return null;
};
