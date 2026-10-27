import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateUuidV4, getDeviceId, getOrCreateDeviceId, isValidUuidV4 } from '../src/utils/deviceId';
import { AUTH_STORAGE_KEYS } from '../src/constants/auth.constants';

const storage = new Map<string, string>();

describe('Device ID management (X-Device-Id)', () => {
  beforeEach(() => {
    storage.clear();
    const mockStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
      length: 0,
      key: () => null,
    } as unknown as Storage;

    vi.stubGlobal('localStorage', mockStorage);
    vi.stubGlobal('window', { localStorage: mockStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('generates a valid RFC4122 UUID v4', () => {
    const uuid = generateUuidV4();
    expect(isValidUuidV4(uuid)).toBe(true);
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('creates and persists a new UUID v4 if not already present in localStorage', () => {
    expect(storage.get(AUTH_STORAGE_KEYS.DEVICE_ID)).toBeUndefined();

    const deviceId = getOrCreateDeviceId();
    expect(isValidUuidV4(deviceId)).toBe(true);
    expect(storage.get(AUTH_STORAGE_KEYS.DEVICE_ID)).toBe(deviceId);
  });

  it('reuses the existing UUID v4 from localStorage on subsequent calls', () => {
    const existingId = 'a1b2c3d4-e5f6-4a1b-8c2d-123456789abc';
    storage.set(AUTH_STORAGE_KEYS.DEVICE_ID, existingId);

    const deviceId = getOrCreateDeviceId();
    expect(deviceId).toBe(existingId);
    expect(getDeviceId()).toBe(existingId);
  });

  it('regenerates a new UUID v4 if the stored device ID is invalid or malformed', () => {
    storage.set(AUTH_STORAGE_KEYS.DEVICE_ID, 'invalid-device-id-123');

    const deviceId = getOrCreateDeviceId();
    expect(isValidUuidV4(deviceId)).toBe(true);
    expect(deviceId).not.toBe('invalid-device-id-123');
    expect(storage.get(AUTH_STORAGE_KEYS.DEVICE_ID)).toBe(deviceId);
  });
});
