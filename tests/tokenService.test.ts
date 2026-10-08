import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tokenService } from '../src/services/token.service';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('tokenService', () => {
  it('stores valid access and refresh tokens', () => {
    expect(tokenService.saveTokens(' access-token ', ' refresh-token ')).toBe(true);
    expect(tokenService.getAccessToken()).toBe('access-token');
    expect(tokenService.getRefreshToken()).toBe('refresh-token');
  });

  it('clears existing tokens instead of retaining them when the new token is invalid', () => {
    tokenService.saveTokens('old-token', 'old-refresh-token');

    expect(tokenService.saveTokens('  ')).toBe(false);
    expect(tokenService.getAccessToken()).toBeNull();
    expect(tokenService.getRefreshToken()).toBeNull();
  });

  it('rejects the literal undefined token and clears stale token values', () => {
    tokenService.saveTokens('old-token', 'old-refresh-token');

    expect(tokenService.setToken('undefined')).toBe(false);
    expect(tokenService.getAccessToken()).toBeNull();
    expect(tokenService.getRefreshToken()).toBeNull();
  });

  it('accepts a missing optional refresh token', () => {
    expect(tokenService.saveTokens('access-token', null)).toBe(true);
    expect(tokenService.getAccessToken()).toBe('access-token');
    expect(tokenService.getRefreshToken()).toBeNull();
  });

  it('clears tokens on request', () => {
    tokenService.saveTokens('access-token', 'refresh-token');

    tokenService.clearTokens();

    expect(tokenService.getAccessToken()).toBeNull();
    expect(tokenService.getRefreshToken()).toBeNull();
    expect(tokenService.getUserData()).toBeNull();
  });

  it('stores typed user data without accepting malformed objects', () => {
    const user = {
      id: 'u1',
      email: 'user@example.com',
      fullName: 'Example User',
      roles: ['HR_MANAGER'],
    };
    expect(tokenService.setUserData(user)).toBe(true);
    expect(tokenService.getUserData()).toEqual({
      id: 'u1',
      email: 'user@example.com',
      fullName: 'Example User',
      roles: ['HR_MANAGER'],
    });
    expect(tokenService.setUserData(null)).toBe(false);
  });
});
