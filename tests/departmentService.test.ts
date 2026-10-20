import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosClient from '../src/utils/axiosClient';
import { departmentService } from '../src/services/department.service';

afterEach(() => vi.restoreAllMocks());

describe('departmentService backend pagination', () => {
  it('requests no more than the backend maximum and loads all active pages', async () => {
    const get = vi.spyOn(axiosClient, 'get')
      .mockResolvedValueOnce({
        data: {
          items: [{ id: 'department-1', name: 'HR', active: true }],
          page: 0,
          size: 100,
          totalElements: 101,
          totalPages: 2,
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [{ id: 'department-2', name: 'Engineering', active: true }],
          page: 1,
          size: 100,
          totalElements: 101,
          totalPages: 2,
        },
      });

    await expect(departmentService.getActiveDepartments()).resolves.toEqual([
      { id: 'department-1', name: 'HR', active: true },
      { id: 'department-2', name: 'Engineering', active: true },
    ]);
    expect(get).toHaveBeenNthCalledWith(1, '/departments', {
      params: { page: 0, size: 100, active: true },
    });
    expect(get).toHaveBeenNthCalledWith(2, '/departments', {
      params: { page: 1, size: 100, active: true },
    });
  });

  it('rejects a malformed department page', async () => {
    vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
      data: { items: [], page: 0 },
    });
    await expect(departmentService.getActiveDepartments())
      .rejects.toThrow('Định dạng danh sách phòng ban từ Backend không hợp lệ.');
  });
});
