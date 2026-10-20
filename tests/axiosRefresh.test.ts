import axios, { AxiosError, AxiosHeaders, type AxiosAdapter } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosClient from '../src/utils/axiosClient';
import { tokenService } from '../src/services/token.service';

const createStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
};

describe('axios session refresh', () => {
  const originalAdapter = axiosClient.defaults.adapter;

  afterEach(() => {
    axiosClient.defaults.adapter = originalAdapter as AxiosAdapter;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('refreshes an expired access token and retries the original request', async () => {
    const storage = createStorage();
    vi.stubGlobal('window', {
      localStorage: storage,
      location: { pathname: '/users' },
    });
    tokenService.saveTokens('expired-access', 'R'.repeat(43));

    let requestCount = 0;
    axiosClient.defaults.adapter = async (config) => {
      requestCount += 1;
      if (config.headers.get('Authorization') === 'Bearer expired-access') {
        const response = {
          data: {},
          status: 401,
          statusText: 'Unauthorized',
          headers: new AxiosHeaders(),
          config,
        };
        throw new AxiosError(
          'Unauthorized',
          AxiosError.ERR_BAD_REQUEST,
          config,
          {},
          response,
        );
      }
      return {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: new AxiosHeaders(),
        config,
      };
    };

    const refreshedSession = {
      accessToken: 'renewed-access',
      refreshToken: 'N'.repeat(43),
      tokenType: 'Bearer',
      expiresIn: 900,
      refreshExpiresAt: '2030-01-01T00:00:00Z',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        fullName: 'Recruitment User',
        roles: ['RECRUITER'],
      },
    };
    const refresh = vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: refreshedSession,
    });

    await expect(axiosClient.get('/resource')).resolves.toMatchObject({
      data: { success: true },
    });
    expect(refresh).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/refresh$/),
      { refreshToken: 'R'.repeat(43) },
      expect.objectContaining({ timeout: 15000 }),
    );
    expect(requestCount).toBe(2);
    expect(tokenService.getAccessToken()).toBe('renewed-access');
    expect(tokenService.getRefreshToken()).toBe('N'.repeat(43));
  });

  it('ends the session if a request remains unauthorized after one refresh', async () => {
    const storage = createStorage();
    const location = { pathname: '/users', href: '' };
    vi.stubGlobal('window', { localStorage: storage, location });
    tokenService.saveTokens('expired-access', 'R'.repeat(43));

    let requestCount = 0;
    axiosClient.defaults.adapter = async (config) => {
      requestCount += 1;
      const response = {
        data: {},
        status: 401,
        statusText: 'Unauthorized',
        headers: new AxiosHeaders(),
        config,
      };
      throw new AxiosError(
        'Unauthorized',
        AxiosError.ERR_BAD_REQUEST,
        config,
        {},
        response,
      );
    };
    vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        accessToken: 'renewed-access',
        refreshToken: 'N'.repeat(43),
        tokenType: 'Bearer',
        expiresIn: 900,
        refreshExpiresAt: '2030-01-01T00:00:00Z',
        user: {
          id: 'user-1',
          email: 'user@example.com',
          fullName: 'Recruitment User',
          roles: ['RECRUITER'],
        },
      },
    });

    await expect(axiosClient.get('/resource')).rejects.toBeInstanceOf(AxiosError);
    expect(requestCount).toBe(2);
    expect(tokenService.getAccessToken()).toBeNull();
    expect(location.href).toBe('/login?sessionExpired=1');
  });
});
