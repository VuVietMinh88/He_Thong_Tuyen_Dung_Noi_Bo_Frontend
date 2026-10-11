const DEVICE_ID_KEY = 'loginDeviceId';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export class DeviceStorageError extends Error {
  constructor() {
    super('DEVICE_STORAGE_UNAVAILABLE');
    this.name = 'DeviceStorageError';
  }
}

/** A browser profile identifier, shared by tabs and accounts; never an auth token. */
export function getLoginDeviceId(): string {
  try {
    const storage = window.localStorage;
    const existing = storage.getItem(DEVICE_ID_KEY);
    if (existing && UUID_PATTERN.test(existing)) return existing;

    const deviceId = crypto.randomUUID();
    storage.setItem(DEVICE_ID_KEY, deviceId);
    if (storage.getItem(DEVICE_ID_KEY) !== deviceId) throw new DeviceStorageError();
    return deviceId;
  } catch {
    // Do not create a different identifier for every request when storage is blocked.
    throw new DeviceStorageError();
  }
}
