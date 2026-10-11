import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLoginDeviceId } from '../src/services/device.service';
import { tokenService } from '../src/services/token.service';

const createStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
};

afterEach(() => vi.unstubAllGlobals());

describe('browser identity for login throttling', () => {
  it('reuses one canonical UUID across calls, tabs sharing storage, and logout', () => {
    const storage = createStorage();
    vi.stubGlobal('window', { localStorage: storage });
    const deviceId = getLoginDeviceId();
    expect(deviceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(getLoginDeviceId()).toBe(deviceId);
    tokenService.saveTokens('token', 'refresh');
    tokenService.clearAll();
    vi.stubGlobal('window', { localStorage: storage });
    expect(getLoginDeviceId()).toBe(deviceId);
  });

  it('assigns separate IDs to isolated browser storage', () => {
    vi.stubGlobal('window', { localStorage: createStorage() });
    const first = getLoginDeviceId();
    vi.stubGlobal('window', { localStorage: createStorage() });
    expect(getLoginDeviceId()).not.toBe(first);
  });

  it('replaces malformed stored identity once', () => {
    const storage = createStorage();
    storage.setItem('loginDeviceId', 'not-a-uuid');
    vi.stubGlobal('window', { localStorage: storage });
    const repaired = getLoginDeviceId();
    expect(repaired).not.toBe('not-a-uuid');
    expect(getLoginDeviceId()).toBe(repaired);
  });

  it('does not silently generate a new identifier per login when persistence fails', () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => null, setItem: () => undefined } });
    expect(() => getLoginDeviceId()).toThrow('DEVICE_STORAGE_UNAVAILABLE');
  });
});
