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

  it('retries a delayed401 with the token already rotated for the same session, without a second refresh', async () => {
    vi.stubGlobal('window', { localStorage: createStorage(), location: { pathname: '/users', href: '' } });
    tokenService.saveTokens('expired-access', 'R'.repeat(43));
    const identity = tokenService.getSessionId();
    let releaseDelayed401!: () => void;
    const calls: string[] = [];
    axiosClient.defaults.adapter = async (config) => {
      calls.push(`${config.url}:${config.headers.get('Authorization')}`);
      if (config.headers.get('Authorization') === 'Bearer expired-access') {
        const failure = new AxiosError('Unauthorized', AxiosError.ERR_BAD_REQUEST, config, {}, {
          data: {}, status: 401, statusText: 'Unauthorized', headers: new AxiosHeaders(), config,
        });
        if (config.url === '/delayed') return new Promise((_resolve, reject) => {
          releaseDelayed401 = () => reject(failure);
        });
        throw failure;
      }
      return { data: { ok: true }, status: 200, statusText: 'OK', headers: new AxiosHeaders(), config };
    };
    const refresh = vi.spyOn(axios, 'post').mockResolvedValueOnce({ data: {
      accessToken: 'rotated-access', refreshToken: 'N'.repeat(43), tokenType: 'Bearer',
      expiresIn: 900, refreshExpiresAt: '2030-01-01T00:00:00Z',
      user: { id: 'user-1', email: 'user@example.com', fullName: 'User', roles: ['ADMIN'] },
    } });
    const delayed = axiosClient.get('/delayed');
    await vi.waitFor(() => expect(releaseDelayed401).toBeTypeOf('function'));
    await expect(axiosClient.get('/first')).resolves.toMatchObject({ data: { ok: true } });
    expect(tokenService.getSessionId()).toBe(identity);
    releaseDelayed401();
    await expect(delayed).resolves.toMatchObject({ data: { ok: true } });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(calls.filter(value => value.startsWith('/delayed:'))).toEqual([
      '/delayed:Bearer expired-access', '/delayed:Bearer rotated-access',
    ]);
  });

  it.each(['current tab', 'another tab', 'new login'])('cannot resurrect credentials when a pending refresh outlives logout from %s', async (source) => {
    const storage = createStorage();
    const location = { pathname: '/login', href: '/login?passwordChanged=1' };
    vi.stubGlobal('window', { localStorage: storage, location });
    tokenService.saveTokens('old-access', 'R'.repeat(43));
    axiosClient.defaults.adapter = async (config) => {
      throw new AxiosError('Unauthorized', AxiosError.ERR_BAD_REQUEST, config, {}, {
        data: {}, status: 401, statusText: 'Unauthorized', headers: new AxiosHeaders(), config,
      });
    };

    let resolveRefresh!: (value: { data: unknown }) => void;
    const refresh = vi.spyOn(axios, 'post').mockImplementationOnce(() => new Promise((resolve) => {
      resolveRefresh = resolve;
    }));
    const pending = axiosClient.get('/resource').catch((error: unknown) => error);
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));

    if (source === 'another tab') {
      storage.removeItem('accessToken');
      storage.removeItem('refreshToken');
    } else {
      tokenService.clearAll();
    }
    if (source === 'new login') tokenService.saveTokens('new-login-access', 'L'.repeat(43));

    resolveRefresh({ data: {
      accessToken: 'obsolete-access', refreshToken: 'N'.repeat(43), tokenType: 'Bearer',
      expiresIn: 900, refreshExpiresAt: '2030-01-01T00:00:00Z',
      user: { id: 'user-1', email: 'user@example.com', fullName: 'User', roles: ['ADMIN'] },
    } });
    expect(await pending).toMatchObject({ message: 'SESSION_CHANGED' });
    expect(tokenService.getAccessToken()).toBe(source === 'new login' ? 'new-login-access' : null);
    expect(tokenService.getRefreshToken()).toBe(source === 'new login' ? 'L'.repeat(43) : null);
    expect(location.href).toBe('/login?passwordChanged=1');
  });

  it('does not refresh a late 401 belonging to a revoked session', async () => {
    const storage = createStorage();
    const location = { pathname: '/login', href: '/login?passwordChanged=1' };
    vi.stubGlobal('window', { localStorage: storage, location });
    tokenService.saveTokens('old-access', 'R'.repeat(43));
    axiosClient.defaults.adapter = async (config) => {
      tokenService.clearAll();
      throw new AxiosError('Unauthorized', AxiosError.ERR_BAD_REQUEST, config, {}, {
        data: {}, status: 401, statusText: 'Unauthorized', headers: new AxiosHeaders(), config,
      });
    };
    const refresh = vi.spyOn(axios, 'post');
    await expect(axiosClient.get('/resource')).rejects.toBeInstanceOf(AxiosError);
    expect(refresh).not.toHaveBeenCalled();
    expect(tokenService.getAccessToken()).toBeNull();
    expect(location.href).toBe('/login?passwordChanged=1');
  });

  it('does not retry an old request with credentials from a replacement login', async () => {
    vi.stubGlobal('window', { localStorage: createStorage(), location: { pathname: '/dashboard', href: '' } });
    tokenService.saveTokens('account-a-access', 'A'.repeat(43));
    axiosClient.defaults.adapter = async (config) => {
      // Simulate a new login sharing storage, without a preceding explicit logout.
      tokenService.saveTokens('account-b-access', 'B'.repeat(43));
      throw new AxiosError('Unauthorized', AxiosError.ERR_BAD_REQUEST, config, {}, {
        data: {}, status: 401, statusText: 'Unauthorized', headers: new AxiosHeaders(), config,
      });
    };
    const refresh = vi.spyOn(axios, 'post');
    await expect(axiosClient.get('/old-account-resource')).rejects.toBeInstanceOf(AxiosError);
    expect(refresh).not.toHaveBeenCalled();
    expect(tokenService.getAccessToken()).toBe('account-b-access');
    expect(tokenService.getRefreshToken()).toBe('B'.repeat(43));
  });

  it('clears partially persisted credentials if refreshed user data cannot be stored', async () => {
    const storage = createStorage();
    vi.stubGlobal('window', { localStorage: storage, location: { pathname: '/login', href: '' } });
    tokenService.saveTokens('old-access', 'R'.repeat(43));
    axiosClient.defaults.adapter = async (config) => {
      throw new AxiosError('Unauthorized', AxiosError.ERR_BAD_REQUEST, config, {}, {
        data: {}, status: 401, statusText: 'Unauthorized', headers: new AxiosHeaders(), config,
      });
    };
    vi.spyOn(axios, 'post').mockResolvedValueOnce({ data: {
      accessToken: 'rotated-access', refreshToken: 'N'.repeat(43), tokenType: 'Bearer',
      expiresIn: 900, refreshExpiresAt: '2030-01-01T00:00:00Z',
      user: { id: 'user-1', email: 'user@example.com', fullName: 'User', roles: ['ADMIN'] },
    } });
    vi.spyOn(tokenService, 'setUserData').mockReturnValueOnce(false);
    await expect(axiosClient.get('/resource')).rejects.toThrow('Không thể lưu phiên đăng nhập mới.');
    expect(tokenService.getAccessToken()).toBeNull();
    expect(tokenService.getRefreshToken()).toBeNull();
  });
});
