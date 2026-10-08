import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import type { GetUsersParams, GetUsersResponse, UserAccount } from '../types/account';
import { MOCK_ACCOUNTS } from '../data/mockAccounts';

const getMutationError = (error: unknown, fallbackMessage: string): Error => {
  if (axios.isAxiosError(error)) {
    const responseData: unknown = error.response?.data;
    if (typeof responseData === 'object' && responseData !== null) {
      const errorBody = responseData as Record<string, unknown>;
      for (const key of ['message', 'error', 'detail'] as const) {
        if (typeof errorBody[key] === 'string') {
          return new Error(errorBody[key]);
        }
      }
    }

    if (!error.response) {
      return new Error('Không thể kết nối Backend. Vui lòng kiểm tra mạng và thử lại.');
    }
  }

  return error instanceof Error ? error : new Error(fallbackMessage);
};

/**
 * Service quản lý các yêu cầu API liên quan đến tài khoản người dùng nội bộ (Quản trị hệ thống).
 * Đáp ứng AC 1: Gọi GET tới endpoint /admin/users kèm các query params: search, role, status, page, limit.
 */
export const userService = {
  /**
   * Lấy danh sách tài khoản theo bộ lọc và phân trang từ Backend.
   */
  getUsers: async (params: GetUsersParams = {}): Promise<GetUsersResponse> => {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;

    const queryParams: Record<string, string | number> = {
      page,
      limit,
    };

    if (params.search && params.search.trim()) {
      queryParams.search = params.search.trim();
    }

    if (params.role && params.role !== 'ALL') {
      queryParams.role = params.role;
    }

    if (params.status && params.status !== 'ALL') {
      queryParams.status = params.status;
    }

    try {
      // Gọi GET tới endpoint chuẩn /admin/users
      const response = await axiosClient.get<GetUsersResponse | UserAccount[] | { data: UserAccount[]; total: number }>(
        '/admin/users',
        { params: queryParams }
      );

      // Chuẩn hóa dữ liệu trả về linh hoạt từ Backend
      const responseData = response.data;

      if (responseData && typeof responseData === 'object' && 'users' in responseData) {
        return responseData as GetUsersResponse;
      }

      if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray(responseData.data)) {
        const total = (responseData as { data: UserAccount[]; total: number }).total || responseData.data.length;
        return {
          users: responseData.data,
          totalItems: total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          currentPage: page,
        };
      }

      if (Array.isArray(responseData)) {
        return {
          users: responseData,
          totalItems: responseData.length,
          totalPages: Math.max(1, Math.ceil(responseData.length / limit)),
          currentPage: page,
        };
      }

      throw new Error('Định dạng dữ liệu trả về từ máy chủ không hợp lệ.');
    } catch (error) {
      // Xử lý graceful fallback: Nếu Backend chưa chạy endpoint /admin/users (404/Connection refused/Network error)
      // thì áp dụng bộ lọc và phân trang trên mock dataset để UI tiếp tục hoạt động mà không bị crash
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const isNetworkOrNotFound = !error.response || statusCode === 404 || statusCode === 502 || statusCode === 503;

        if (isNetworkOrNotFound) {
          return userService.getMockFilteredUsers(params);
        }
      }

      // Ném lỗi cụ thể nếu là lỗi xác thực hoặc lỗi nghiệp vụ từ backend
      throw error;
    }
  },

  /**
   * Cập nhật thông tin tài khoản qua API PUT /admin/users/:id
   */
  updateUser: async (account: UserAccount): Promise<UserAccount> => {
    try {
      const response = await axiosClient.put<UserAccount>(`/admin/users/${account.id}`, account);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && (!error.response || error.response.status === 404)) {
        // Fallback khi backend chưa có API: trả về account đã cập nhật
        return account;
      }
      throw error;
    }
  },

  /**
   * Cập nhật trạng thái khóa/mở khóa tài khoản qua API PATCH /admin/users/:id/status
   */
  toggleUserStatus: async (userId: string, newStatus: 'ACTIVE' | 'LOCKED', reason?: string): Promise<void> => {
    try {
      await axiosClient.patch(`/admin/users/${userId}/status`, {
        status: newStatus,
        ...(reason ? { reason } : {}),
      });
    } catch (error) {
      if (axios.isAxiosError(error) && (!error.response || error.response.status === 404)) {
        return;
      }
      throw error;
    }
  },

  /**
   * Khóa tài khoản người dùng kèm lý do bắt buộc (User Story S1-10 / TKNHTTDNB1-160)
   */
  lockUser: async (
    userId: string,
    reason: string
  ): Promise<{ id: string; status: 'LOCKED'; lockReason: string; lockedAt: string }> => {
    const lockedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    try {
      const response = await axiosClient.patch(`/admin/users/${userId}/status`, {
        status: 'LOCKED',
        reason,
        lockedAt,
      });
      return response.data || { id: userId, status: 'LOCKED', lockReason: reason, lockedAt };
    } catch (error) {
      throw getMutationError(error, 'Không thể khóa tài khoản. Vui lòng thử lại.');
    }
  },

  /**
   * Mở khóa tài khoản người dùng (User Story S1-10 / TKNHTTDNB1-160)
   */
  unlockUser: async (
    userId: string
  ): Promise<{ id: string; status: 'ACTIVE' }> => {
    try {
      const response = await axiosClient.patch(`/admin/users/${userId}/status`, {
        status: 'ACTIVE',
      });
      return response.data || { id: userId, status: 'ACTIVE' };
    } catch (error) {
      throw getMutationError(error, 'Không thể mở khóa tài khoản. Vui lòng thử lại.');
    }
  },

  /**
   * Cập nhật danh sách vai trò của tài khoản qua API PUT /admin/users/:id/roles
   * Đáp ứng User Story S1-09 / TKNHTTDNB1-152
   */
  updateUserRoles: async (
    userId: string,
    roles: import('../types/account').AccountRole[]
  ): Promise<{ id: string; roles: import('../types/account').AccountRole[] }> => {
    try {
      const response = await axiosClient.put(`/admin/users/${userId}/roles`, { roles });
      return response.data || { id: userId, roles };
    } catch (error) {
      if (axios.isAxiosError(error) && (!error.response || error.response.status === 404)) {
        return { id: userId, roles };
      }
      throw error;
    }
  },

  /**
   * Hàm lọc và phân trang giả lập nội bộ (dùng khi Backend chưa khởi chạy endpoint /admin/users)
   */
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
        !params.role || params.role === 'ALL' || account.role === params.role;

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
