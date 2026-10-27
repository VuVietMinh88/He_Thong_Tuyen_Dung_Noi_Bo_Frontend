import axios, { AxiosError, AxiosHeaders, type AxiosAdapter } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axiosClient, { resetRedirectState, resetRefreshQueue } from '../src/utils/axiosClient';
import { tokenService } from '../src/services/token.service';
import { authService } from '../src/services/auth.service';
import { AUTH_HEADERS, AUTH_MESSAGES, AUTH_STORAGE_KEYS } from '../src/constants/auth.constants';

const createStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    length: 0,
    key: () => null,
  } as unknown as Storage;
};

describe('Axios Interceptor - Request Queue, Device ID, and Session Expiry', () => {
  const originalAdapter = axiosClient.defaults.adapter;
  let mockStorage: Storage;
  let mockLocation: { pathname: string; search: string; hash: string; href: string };
  let dispatchedEvents: CustomEvent[] = [];

  beforeEach(() => {
    resetRedirectState();
    resetRefreshQueue();
    mockStorage = createStorage();
    mockLocation = { pathname: '/recruitment/candidates', search: '?page=2', hash: '#top', href: '' };
    dispatchedEvents = [];

    const mockWindow = {
      localStorage: mockStorage,
      location: mockLocation,
      dispatchEvent: vi.fn((event: Event) => {
        if (event instanceof CustomEvent) {
          dispatchedEvents.push(event);
        }
        return true;
      }),
    };

    vi.stubGlobal('localStorage', mockStorage);
    vi.stubGlobal('window', mockWindow);
  });

  afterEach(() => {
    axiosClient.defaults.adapter = originalAdapter as AxiosAdapter;
    resetRedirectState();
    resetRefreshQueue();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('injects X-Device-Id into the headers of the login API request', async () => {
    let capturedDeviceIdHeader: string | null = null;

    axiosClient.defaults.adapter = async (config) => {
      capturedDeviceIdHeader = config.headers.get(AUTH_HEADERS.DEVICE_ID) as string;
      return {
        data: {
          accessToken: 'fresh-token',
          refreshToken: 'A'.repeat(43),
          tokenType: 'Bearer',
          expiresIn: 900,
          refreshExpiresAt: '2030-01-01T00:00:00Z',
          user: { id: 'u1', email: 'user@recruitment.vn', fullName: 'User', roles: ['ADMIN'] },
        },
        status: 200,
        statusText: 'OK',
        headers: new AxiosHeaders(),
        config,
      };
    };

    await authService.login('user@recruitment.vn', 'SecurePass123');

    expect(capturedDeviceIdHeader).toBeDefined();
    expect(capturedDeviceIdHeader).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(mockStorage.getItem(AUTH_STORAGE_KEYS.DEVICE_ID)).toBe(capturedDeviceIdHeader);
  });

  it('queues concurrent API requests during 401 refresh and retries them sequentially with new token', async () => {
    tokenService.saveTokens('expired-token', 'R'.repeat(43));

    const requestOrder: string[] = [];
    const usedAuthHeaders: string[] = [];

    axiosClient.defaults.adapter = async (config) => {
      const url = config.url || '';
      const authHeader = config.headers.get('Authorization') as string;

      if (authHeader === 'Bearer expired-token') {
        const response = {
          data: {},
          status: 401,
          statusText: 'Unauthorized',
          headers: new AxiosHeaders(),
          config,
        };
        throw new AxiosError('Unauthorized', AxiosError.ERR_BAD_REQUEST, config, {}, response);
      }

      requestOrder.push(url);
      usedAuthHeaders.push(authHeader);

      return {
        data: { url, success: true },
        status: 200,
        statusText: 'OK',
        headers: new AxiosHeaders(),
        config,
      };
    };

    // Mock the /auth/refresh endpoint
    vi.spyOn(axios, 'post').mockImplementation(async () => {
      // Small delay to ensure concurrent requests arrive while isRefreshing is true
      await new Promise((r) => setTimeout(r, 10));
      return {
        data: {
          accessToken: 'new-valid-token',
          refreshToken: 'K'.repeat(43),
          tokenType: 'Bearer',
          expiresIn: 900,
          refreshExpiresAt: '2030-01-01T00:00:00Z',
          user: { id: 'u1', email: 'user@recruitment.vn', fullName: 'User', roles: ['RECRUITER'] },
        },
      };
    });

    // Launch initial request (which hits 401) and concurrent subsequent requests
    const p1 = axiosClient.get('/api/req1');
    const p2 = axiosClient.get('/api/req2');
    const p3 = axiosClient.get('/api/req3');

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    expect(r1.data).toEqual({ url: '/api/req1', success: true });
    expect(r2.data).toEqual({ url: '/api/req2', success: true });
    expect(r3.data).toEqual({ url: '/api/req3', success: true });

    // Requests were retried sequentially
    expect(requestOrder).toEqual(['/api/req1', '/api/req2', '/api/req3']);
    // All used the new active token
    expect(usedAuthHeaders).toEqual([
      'Bearer new-valid-token',
      'Bearer new-valid-token',
      'Bearer new-valid-token',
    ]);
    expect(tokenService.getAccessToken()).toBe('new-valid-token');
  });

  it('rejects the entire queue if token refresh fails', async () => {
    tokenService.saveTokens('expired-token', 'R'.repeat(43));

    axiosClient.defaults.adapter = async (config) => {
      const response = {
        data: {},
        status: 401,
        statusText: 'Unauthorized',
        headers: new AxiosHeaders(),
        config,
      };
      throw new AxiosError('Unauthorized', AxiosError.ERR_BAD_REQUEST, config, {}, response);
    };

    vi.spyOn(axios, 'post').mockRejectedValue(new Error('Refresh token invalid'));

    const p1 = axiosClient.get('/api/req1');
    const p2 = axiosClient.get('/api/req2');

    await expect(p1).rejects.toThrow('Refresh token invalid');
    await expect(p2).rejects.toThrow('Refresh token invalid');
  });

  it('triggers global notification and redirects to /login with redirect_url when refresh token is missing or expired', async () => {
    // No refresh token available
    tokenService.saveTokens('expired-token', null);

    axiosClient.defaults.adapter = async (config) => {
      const response = {
        data: {},
        status: 401,
        statusText: 'Unauthorized',
        headers: new AxiosHeaders(),
        config,
      };
      throw new AxiosError('Unauthorized', AxiosError.ERR_BAD_REQUEST, config, {}, response);
    };

    await expect(axiosClient.get('/protected-data')).rejects.toBeInstanceOf(AxiosError);

    // Global notification event was dispatched
    const toastEvent = dispatchedEvents.find((e) => e.type === 'app:toast');
    expect(toastEvent).toBeDefined();
    expect(toastEvent?.detail?.message).toBe(AUTH_MESSAGES.SESSION_EXPIRED); // "Phiên làm việc hết hạn"
    expect(toastEvent?.detail?.type).toBe('error');

    // Local tokens are force-cleared
    expect(tokenService.getAccessToken()).toBeNull();
    expect(tokenService.getRefreshToken()).toBeNull();

    // Redirected to /login with redirect_url preserving pathname, search, and hash
    expect(mockLocation.href).toContain('/login?sessionExpired=1');
    expect(mockLocation.href).toContain('redirect_url=%2Frecruitment%2Fcandidates%3Fpage%3D2%23top');
  });

  it('executes local cleanup in finally block even if backend logout API fails', async () => {
    tokenService.saveTokens('token-123', 'R'.repeat(43));
    tokenService.setUserData({ id: 'u1', email: 'test@mail.com', fullName: 'User', roles: ['ADMIN'] });

    // Mock logout endpoint failing with 500 network error
    axiosClient.defaults.adapter = async (config) => {
      const response = {
        data: { message: 'Server crash during logout' },
        status: 500,
        statusText: 'Internal Server Error',
        headers: new AxiosHeaders(),
        config,
      };
      throw new AxiosError('Internal Server Error', AxiosError.ERR_BAD_RESPONSE, config, {}, response);
    };

    await authService.logout(true);

    // Tokens and session are force-cleared despite the API error
    expect(tokenService.getAccessToken()).toBeNull();
    expect(tokenService.getRefreshToken()).toBeNull();
    expect(tokenService.getUserData()).toBeNull();

    // User is redirected to /login
    expect(mockLocation.href).toBe('/login');
  });
});
