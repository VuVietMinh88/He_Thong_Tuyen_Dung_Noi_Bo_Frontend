import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { userService } from '../src/services/userService';
import axiosClient from '../src/utils/axiosClient';

const createLocalStorageMock = () => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => (store.has(key) ? store.get(key)! : null)),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
};

describe('userService API Service (TKNHTTDNB1-150)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns paginated mock results when backend endpoint is not reachable', async () => {
    vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new AxiosError('Network Error'));

    const result = await userService.getUsers({
      search: 'An',
      page: 1,
      limit: 20,
    });

    expect(result).toBeDefined();
    expect(result.users).toBeInstanceOf(Array);
    expect(result.currentPage).toBe(1);
    expect(result.totalItems).toBeGreaterThanOrEqual(1);
  });

  it('correctly filters by role and status in mock fallback', () => {
    const adminResult = userService.getMockFilteredUsers({
      role: 'ADMIN',
      status: 'ACTIVE',
      page: 1,
      limit: 20,
    });

    expect(adminResult.users.length).toBeGreaterThan(0);
    adminResult.users.forEach((user) => {
      expect(user.role).toBe('ADMIN');
      expect(user.status).toBe('ACTIVE');
    });
  });

  it('paginates 20 users on page 1 and remaining users on page 2', () => {
    const page1 = userService.getMockFilteredUsers({ page: 1, limit: 20 });
    const page2 = userService.getMockFilteredUsers({ page: 2, limit: 20 });

    expect(page1.users.length).toBe(20);
    expect(page2.users.length).toBe(page1.totalItems - 20);
    expect(page1.currentPage).toBe(1);
    expect(page2.currentPage).toBe(2);
    expect(page1.totalPages).toBe(Math.ceil(page1.totalItems / 20));
  });

  it('returns empty array when search keyword matches no accounts', () => {
    const emptyResult = userService.getMockFilteredUsers({
      search: 'NonExistentAccountNameXYZ123',
    });

    expect(emptyResult.users.length).toBe(0);
    expect(emptyResult.totalItems).toBe(0);
    expect(emptyResult.totalPages).toBe(1);
  });

  it('does not report a lock as successful when the API is unavailable', async () => {
    vi.spyOn(axiosClient, 'put').mockRejectedValueOnce(new AxiosError('Network Error'));

    await expect(userService.lockUser('ACC-002', 'Nhân sự nghỉ việc')).rejects.toThrow(
      'Không thể kết nối Backend. Vui lòng kiểm tra mạng và thử lại.'
    );
  });

  it('does not report an unlock as successful when the API returns 404', async () => {
    const error = new AxiosError('Not Found');
    error.response = {
      status: 404,
      statusText: 'Not Found',
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
      data: {},
    };
    vi.spyOn(axiosClient, 'delete').mockRejectedValueOnce(error);

    await expect(userService.unlockUser('ACC-002')).rejects.toThrow('Not Found');
  });
});
