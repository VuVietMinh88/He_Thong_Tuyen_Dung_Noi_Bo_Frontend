import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { autoRefreshService } from '../src/services/autoRefresh.service';
import { tokenService } from '../src/services/token.service';
import { authSyncService } from '../src/services/authSync.service';
import axios from 'axios';

const storage = new Map<string, string>();

describe('Automatic Token Refresh on Debounced User Activity', () => {
  beforeEach(() => {
    storage.clear();
    vi.useFakeTimers();

    const mockStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
      length: 0,
      key: () => null,
    } as unknown as Storage;

    vi.stubGlobal('localStorage', mockStorage);
    vi.stubGlobal('window', {
      localStorage: mockStorage,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    autoRefreshService.stop();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('correctly calculates token expiration from a valid JWT exp claim', () => {
    const futureExpSec = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ exp: futureExpSec, sub: 'user-1' }));
    const fakeJwt = `${header}.${payload}.signature`;

    const expMs = autoRefreshService.getTokenExpirationMs(fakeJwt);
    expect(expMs).toBe(futureExpSec * 1000);
  });

  it('detects when an access token is expiring soon', () => {
    const nearExpSec = Math.floor(Date.now() / 1000) + 120; // 2 minutes from now (threshold is 5 mins)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ exp: nearExpSec, sub: 'user-1' }));
    const fakeJwt = `${header}.${payload}.signature`;

    tokenService.saveTokens(fakeJwt, 'R'.repeat(43));

    expect(autoRefreshService.isTokenExpiringSoon()).toBe(true);
  });

  it('does not consider a freshly issued token expiring soon', () => {
    const farExpSec = Math.floor(Date.now() / 1000) + 7200; // 2 hours from now
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ exp: farExpSec, sub: 'user-1' }));
    const fakeJwt = `${header}.${payload}.signature`;

    tokenService.saveTokens(fakeJwt, 'R'.repeat(43));

    expect(autoRefreshService.isTokenExpiringSoon()).toBe(false);
  });

  it('debounces user activity and triggers silent refresh only after debounce delay', async () => {
    const nearExpSec = Math.floor(Date.now() / 1000) + 60;
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ exp: nearExpSec, sub: 'user-1' }));
    const fakeJwt = `${header}.${payload}.signature`;

    tokenService.saveTokens(fakeJwt, 'R'.repeat(43));

    const refreshPostSpy = vi.spyOn(axios, 'post').mockResolvedValue({
      data: {
        accessToken: 'brand-new-access-token',
        refreshToken: 'S'.repeat(43),
        tokenType: 'Bearer',
        expiresIn: 900,
        refreshExpiresAt: '2030-01-01T00:00:00Z',
        user: { id: 'u1', email: 'test@mail.com', fullName: 'User', roles: ['ADMIN'] },
      },
    });

    const broadcastSpy = vi.spyOn(authSyncService, 'broadcastTokenRefreshed');

    // Simulate multiple rapid user interactions (typing, moving mouse, scrolling)
    autoRefreshService.handleUserActivity();
    autoRefreshService.handleUserActivity();
    autoRefreshService.handleUserActivity();

    // Before debounce delay (2000ms), no refresh should be called yet
    vi.advanceTimersByTime(1000);
    expect(refreshPostSpy).not.toHaveBeenCalled();

    // After debounce delay expires
    await vi.advanceTimersByTimeAsync(1100);

    expect(refreshPostSpy).toHaveBeenCalledTimes(1);
    expect(tokenService.getAccessToken()).toBe('brand-new-access-token');
    expect(tokenService.getRefreshToken()).toBe('S'.repeat(43));
    expect(broadcastSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'brand-new-access-token',
        refreshToken: 'S'.repeat(43),
      }),
    );
  });

  it('attaches and cleans up event listeners on start and stop', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    autoRefreshService.start();
    expect(addEventListenerSpy).toHaveBeenCalled();

    autoRefreshService.stop();
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });
});
