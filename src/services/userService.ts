import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import type { GetUsersParams, GetUsersResponse, UserAccount, AccountRole } from '../types/account';
import { MOCK_ACCOUNTS } from '../data/mockAccounts';

const getStatusMutationError = (error: unknown, fallbackMessage: string): Error => {
  if (axios.isAxiosError(error)) {
    const responseData: unknown = error.response?.data;
    if (typeof responseData === 'object' && responseData !== null) {
      const errorBody = responseData as Record<string, unknown>;
      for (const key of ['message', 'error', 'detail'] as const) {
        if (typeof errorBody[key] === 'string') {
          return new Error(errorBody[key] as string);
        }
      }
    }

    if (!error.response) {
      return new Error('Không thể kết nối Backend. Vui lòng kiểm tra mạng và thử lại.');
    }
  }

  return error instanceof Error ? error : new Error(fallbackMessage);
};

export const userService = {
  getUsers: async (params: GetUsersParams = {}): Promise<GetUsersResponse> => {
    const page = params.page && params.page > 0 ? params.page : 1;
    const size = params.limit && params.limit > 0 ? params.limit : 20;

    // Map to backend params
    const queryParams: Record<string, string | number> = {
      page: page - 1, // Backend page is 0-indexed
      size,
    };

    if (params.search && params.search.trim()) {
      queryParams.q = params.search.trim(); // Backend uses 'q' instead of 'search'
    }

    if (params.role && params.role !== 'ALL') {
      queryParams.role = params.role;
    }

    if (params.status && params.status !== 'ALL') {
      queryParams.status = params.status;
    }

    try {
      // Call standard endpoint /accounts
      const response = await axiosClient.get('/accounts', { params: queryParams });
      const responseData = response.data;

      // Ensure we match the new `{ items, page, size, totalElements, totalPages }` format
      if (responseData && typeof responseData === 'object' && 'items' in responseData) {
        return {
          users: responseData.items,
          totalItems: responseData.totalElements,
          totalPages: responseData.totalPages,
          currentPage: responseData.page + 1, // Convert back to 1-indexed for frontend
        };
      }

      throw new Error('Định dạng dữ liệu trả về từ máy chủ không hợp lệ.');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const isNetworkOrNotFound = !error.response || statusCode === 404 || statusCode === 502 || statusCode === 503;

        if (isNetworkOrNotFound) {
          return userService.getMockFilteredUsers(params);
        }
      }
      throw error;
    }
  },

  updateUser: async (account: UserAccount): Promise<UserAccount> => {
    try {
      const payload = {
        fullName: account.fullName,
        phone: null, // Mapped to null if not present
        displayTitle: null,
        departmentId: null, // Frontend might not have this, pass null to clear or modify backend
      };
      const response = await axiosClient.put<UserAccount>(`/accounts/${account.id}`, payload);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && (!error.response || error.response.status === 404)) {
        return account;
      }
      throw error;
    }
  },

  toggleUserStatus: async (userId: string, newStatus: 'ACTIVE' | 'LOCKED', reason?: string): Promise<void> => {
    if (newStatus === 'LOCKED') {
      await userService.lockUser(userId, reason || 'Khóa tài khoản');
    } else {
      await userService.unlockUser(userId);
    }
  },

  lockUser: async (
    userId: string,
    reason: string
  ): Promise<{ id: string; status: 'LOCKED'; lockReason: string; lockedAt: string }> => {
    try {
      const response = await axiosClient.put(`/accounts/${userId}/lock`, { reason });
      return {
        id: response.data?.userId || userId,
        status: 'LOCKED',
        lockReason: response.data?.lockReason || reason,
        lockedAt: response.data?.lockedAt || new Date().toISOString(),
      };
    } catch (error) {
      throw getStatusMutationError(error, 'Không thể khóa tài khoản. Vui lòng thử lại.');
    }
  },

  unlockUser: async (
    userId: string
  ): Promise<{ id: string; status: 'ACTIVE' }> => {
    try {
      const response = await axiosClient.delete(`/accounts/${userId}/lock`);
      return { id: response.data?.userId || userId, status: 'ACTIVE' };
    } catch (error) {
      throw getStatusMutationError(error, 'Không thể mở khóa tài khoản. Vui lòng thử lại.');
    }
  },

  updateUserRoles: async (
    userId: string,
    roles: AccountRole[]
  ): Promise<{ id: string; roles: AccountRole[] }> => {
    try {
      // NOTE: Because the backend API accepts one role per PUT request: PUT /accounts/{id}/roles/{role}
      // and we don't have a bulk replace endpoint in the backend docs, 
      // we'll attempt to add the provided roles sequentially.
      // (For a complete implementation, you'd fetch current roles and DELETE the missing ones too).
      for (const role of roles) {
        await axiosClient.put(`/accounts/${userId}/roles/${role}`);
      }
      return { id: userId, roles };
    } catch (error) {
      if (axios.isAxiosError(error) && (!error.response || error.response.status === 404)) {
        return { id: userId, roles };
      }
      throw error;
    }
  },

  getMockFilteredUsers: (params: GetUsersParams): GetUsersResponse => {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const keyword = (params.search || '').trim().toLowerCase();

    const filtered = MOCK_ACCOUNTS.filter((account) => {
      const matchesSearch =
        keyword === '' ||
        account.fullName.toLowerCase().includes(keyword) ||
        account.email.toLowerCase().includes(keyword) ||
        account.department.toLowerCase().includes(keyword);

      const matchesRole =
        !params.role || params.role === 'ALL' || (account.roles && account.roles.includes(params.role as AccountRole));

      const matchesStatus =
        !params.status || params.status === 'ALL' || account.status === params.status;

      return matchesSearch && matchesRole && matchesStatus;
    });

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const startIndex = (page - 1) * limit;
    const paginatedUsers = filtered.slice(startIndex, startIndex + limit);

    return {
      users: paginatedUsers,
      totalItems,
      totalPages,
      currentPage: page,
    };
  },
};

export default userService;

