import { afterEach, describe, expect, it, vi } from 'vitest';
import { AxiosError } from 'axios';
import { PartialRoleUpdateError, userService } from '../src/services/userService';
import axiosClient from '../src/utils/axiosClient';

const accountView = {
  id: '6440c8d7-7624-42a2-823d-94dbc60a2f24',
  email: 'recruiter@example.com',
  fullName: 'Nguyễn An',
  phone: null,
  displayTitle: 'Recruiter',
  departmentId: 'e85c8c58-2869-4804-97dc-ddfab180387c',
  departmentName: 'Phòng Tuyển dụng',
  roles: ['HR_MANAGER', 'RECRUITER'],
  status: 'ADMINISTRATIVELY_LOCKED',
  createdAt: '2026-10-08T10:00:00Z',
};

afterEach(() => vi.restoreAllMocks());

describe('userService backend account contract', () => {
  it('sends backend query parameters and maps AccountPage fields into the UI model', async () => {
    const get = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
      data: { items: [accountView], page: 1, size: 10, totalElements: 21, totalPages: 3 },
    });

    const result = await userService.getUsers({
      search: ' An ',
      role: 'HR_MANAGER',
      status: 'ADMINISTRATIVELY_LOCKED',
      page: 2,
      limit: 10,
    });

    expect(get).toHaveBeenCalledWith('/accounts', {
      params: {
        page: 1,
        size: 10,
        q: 'An',
        role: 'HR_MANAGER',
        status: 'ADMINISTRATIVELY_LOCKED',
      },
    });
    expect(result).toEqual({
      users: [{
        id: accountView.id,
        email: accountView.email,
        fullName: accountView.fullName,
        phone: null,
        displayTitle: 'Recruiter',
        departmentId: accountView.departmentId,
        department: 'Phòng Tuyển dụng',
        roles: ['HR_MANAGER', 'RECRUITER'],
        role: 'HR_MANAGER',
        status: 'ADMINISTRATIVELY_LOCKED',
        createdAt: accountView.createdAt,
      }],
      currentPage: 2,
      totalItems: 21,
      totalPages: 3,
    });
  });

  it('surfaces API/network failures instead of replacing real data with mock accounts', async () => {
    vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new AxiosError('Network Error'));
    await expect(userService.getUsers()).rejects.toThrow(
      'Không thể kết nối Backend. Vui lòng kiểm tra mạng và thử lại.',
    );
  });

  it('updates only editable account fields and preserves backend department/profile values', async () => {
    const put = vi.spyOn(axiosClient, 'put').mockResolvedValueOnce({ data: accountView });
    await userService.updateUser({
      id: accountView.id,
      fullName: ' Nguyễn An mới ',
      email: accountView.email,
      department: accountView.departmentName,
      departmentId: accountView.departmentId,
      phone: '0900000000',
      displayTitle: accountView.displayTitle,
      role: 'HR_MANAGER',
      roles: ['HR_MANAGER', 'RECRUITER'],
      status: 'ACTIVE',
      createdAt: accountView.createdAt,
    });

    expect(put).toHaveBeenCalledWith(`/accounts/${accountView.id}`, {
      fullName: 'Nguyễn An mới',
      phone: '0900000000',
      displayTitle: 'Recruiter',
      departmentId: accountView.departmentId,
    });
  });

  it('adds and revokes roles using the backend role endpoints', async () => {
    const put = vi.spyOn(axiosClient, 'put').mockResolvedValue({ data: {} });
    const remove = vi.spyOn(axiosClient, 'delete').mockResolvedValue({ data: {} });

    await expect(userService.updateUserRoles(
      accountView.id,
      ['RECRUITER', 'INTERVIEWER'],
      ['HR_MANAGER', 'RECRUITER'],
    )).resolves.toEqual({ id: accountView.id, roles: ['HR_MANAGER', 'RECRUITER'] });

    expect(put).toHaveBeenCalledWith(`/accounts/${accountView.id}/roles/HR_MANAGER`);
    expect(remove).toHaveBeenCalledWith(`/accounts/${accountView.id}/roles/INTERVIEWER`);
  });

  it('reports partial role changes so the UI reloads server state on a mid-operation failure', async () => {
    vi.spyOn(axiosClient, 'put').mockResolvedValueOnce({ data: {} });
    vi.spyOn(axiosClient, 'delete').mockRejectedValueOnce(new AxiosError('Request failed'));

    await expect(userService.updateUserRoles(
      accountView.id,
      ['RECRUITER', 'INTERVIEWER'],
      ['HR_MANAGER', 'RECRUITER'],
    )).rejects.toBeInstanceOf(PartialRoleUpdateError);
  });

  it('uses exact backend lock routes and response fields', async () => {
    const put = vi.spyOn(axiosClient, 'put').mockResolvedValueOnce({
      data: {
        userId: accountView.id,
        status: 'ADMINISTRATIVELY_LOCKED',
        lockReason: 'Nghỉ việc',
        lockedAt: '2026-10-08T10:00:00Z',
        handoverWarning: 'Rà soát bàn giao.',
      },
    });

    const result = await userService.lockUser(accountView.id, ' Nghỉ việc ');
    expect(put).toHaveBeenCalledWith(`/accounts/${accountView.id}/lock`, { reason: 'Nghỉ việc' });
    expect(result.status).toBe('ADMINISTRATIVELY_LOCKED');
    expect(result.handoverWarning).toBe('Rà soát bàn giao.');
  });
});
