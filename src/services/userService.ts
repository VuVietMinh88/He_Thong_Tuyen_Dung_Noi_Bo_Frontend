import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import type {
  AccountRole,
  AccountStatus,
  GetUsersParams,
  GetUsersResponse,
  UserAccount,
} from '../types/account';

interface BackendAccountView {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  displayTitle: string | null;
  departmentId: string | null;
  departmentName: string | null;
  roles: AccountRole[];
  status: AccountStatus;
  createdAt: string;
}

interface BackendLockResponse {
  userId: string;
  status: AccountStatus;
  lockReason: string | null;
  lockedAt: string | null;
  handoverWarning: string | null;
}

export class PartialRoleUpdateError extends Error {
  constructor(cause: unknown) {
    super(
      'Một phần vai trò đã được cập nhật trước khi Backend báo lỗi. Danh sách tài khoản đang được tải lại để đồng bộ trạng thái.',
      { cause },
    );
    this.name = 'PartialRoleUpdateError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getErrorMessage = (error: unknown, fallbackMessage: string): Error => {
  if (axios.isAxiosError(error)) {
    const body: unknown = error.response?.data;
    if (isRecord(body)) {
      for (const field of ['message', 'error', 'detail', 'title'] as const) {
        if (typeof body[field] === 'string' && body[field].trim()) {
          return new Error(body[field]);
        }
      }
    }
    if (!error.response) {
      return new Error('Không thể kết nối Backend. Vui lòng kiểm tra mạng và thử lại.');
    }
  }
  return error instanceof Error ? error : new Error(fallbackMessage);
};

const mapBackendAccount = (value: BackendAccountView): UserAccount => ({
  id: value.id,
  fullName: value.fullName,
  email: value.email,
  phone: value.phone,
  displayTitle: value.displayTitle,
  departmentId: value.departmentId,
  department: value.departmentName ?? '',
  roles: value.roles,
  role: value.roles[0],
  status: value.status,
  createdAt: value.createdAt,
});

const isAccountRole = (value: unknown): value is AccountRole =>
  typeof value === 'string'
  && ['ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER', 'APPROVER'].includes(value);

const isAccountStatus = (value: unknown): value is AccountStatus =>
  typeof value === 'string'
  && ['ACTIVE', 'TEMPORARILY_LOCKED', 'PENDING_ACTIVATION', 'DISABLED', 'ADMINISTRATIVELY_LOCKED'].includes(value);

const parseAccountView = (value: unknown): BackendAccountView => {
  if (
    !isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.email !== 'string'
    || typeof value.fullName !== 'string'
    || !(value.phone === null || typeof value.phone === 'string')
    || !(value.displayTitle === null || typeof value.displayTitle === 'string')
    || !(value.departmentId === null || typeof value.departmentId === 'string')
    || !(value.departmentName === null || typeof value.departmentName === 'string')
    || !Array.isArray(value.roles)
    || value.roles.length === 0
    || !value.roles.every(isAccountRole)
    || !isAccountStatus(value.status)
    || typeof value.createdAt !== 'string'
  ) {
    throw new Error('Định dạng dữ liệu tài khoản từ Backend không hợp lệ.');
  }

  return {
    id: value.id,
    email: value.email,
    fullName: value.fullName,
    phone: value.phone,
    displayTitle: value.displayTitle,
    departmentId: value.departmentId,
    departmentName: value.departmentName,
    roles: value.roles,
    status: value.status,
    createdAt: value.createdAt,
  };
};

const parseLockResponse = (value: unknown): BackendLockResponse => {
  if (
    !isRecord(value)
    || typeof value.userId !== 'string'
    || !isAccountStatus(value.status)
    || !(value.lockReason === null || typeof value.lockReason === 'string')
    || !(value.lockedAt === null || typeof value.lockedAt === 'string')
    || !(value.handoverWarning === null || typeof value.handoverWarning === 'string')
  ) {
    throw new Error('Định dạng phản hồi khóa tài khoản từ Backend không hợp lệ.');
  }
  return {
    userId: value.userId,
    status: value.status,
    lockReason: value.lockReason,
    lockedAt: value.lockedAt,
    handoverWarning: value.handoverWarning,
  };
};

export const userService = {
  getUsers: async (params: GetUsersParams = {}): Promise<GetUsersResponse> => {
    const page = params.page && params.page > 0 ? params.page - 1 : 0;
    const size = params.limit && params.limit > 0 ? params.limit : 20;
    const queryParams: Record<string, string | number> = { page, size };

    if (params.search?.trim()) queryParams.q = params.search.trim();
    if (params.role && params.role !== 'ALL') queryParams.role = params.role;
    if (params.status && params.status !== 'ALL') queryParams.status = params.status;

    try {
      const response = await axiosClient.get<unknown>('/accounts', { params: queryParams });
      const data: unknown = response.data;
      if (
        !isRecord(data)
        || !Array.isArray(data.items)
        || typeof data.page !== 'number'
        || typeof data.totalElements !== 'number'
        || typeof data.totalPages !== 'number'
      ) {
        throw new Error('Định dạng danh sách tài khoản từ Backend không hợp lệ.');
      }

      return {
        users: data.items.map((item) => mapBackendAccount(parseAccountView(item))),
        totalItems: data.totalElements,
        totalPages: Math.max(1, data.totalPages),
        currentPage: data.page + 1,
      };
    } catch (error) {
      throw getErrorMessage(error, 'Không thể tải danh sách tài khoản.');
    }
  },

  updateUser: async (account: UserAccount): Promise<UserAccount> => {
    try {
      const response = await axiosClient.put<unknown>(`/accounts/${account.id}`, {
        fullName: account.fullName.trim(),
        phone: account.phone ?? null,
        displayTitle: account.displayTitle ?? null,
        departmentId: account.departmentId ?? null,
      });
      return mapBackendAccount(parseAccountView(response.data));
    } catch (error) {
      throw getErrorMessage(error, 'Không thể cập nhật tài khoản.');
    }
  },

  lockUser: async (userId: string, reason: string): Promise<BackendLockResponse> => {
    if (!reason.trim()) throw new Error('Vui lòng nhập lý do khóa tài khoản.');
    try {
      const response = await axiosClient.put<unknown>(`/accounts/${userId}/lock`, {
        reason: reason.trim(),
      });
      return parseLockResponse(response.data);
    } catch (error) {
      throw getErrorMessage(error, 'Không thể khóa tài khoản. Vui lòng thử lại.');
    }
  },

  unlockUser: async (userId: string): Promise<BackendLockResponse> => {
    try {
      const response = await axiosClient.delete<unknown>(`/accounts/${userId}/lock`);
      return parseLockResponse(response.data);
    } catch (error) {
      throw getErrorMessage(error, 'Không thể mở khóa tài khoản. Vui lòng thử lại.');
    }
  },

  updateUserRoles: async (
    userId: string,
    currentRoles: AccountRole[],
    nextRoles: AccountRole[],
  ): Promise<{ id: string; roles: AccountRole[] }> => {
    if (nextRoles.length === 0) throw new Error('Tài khoản phải có ít nhất một vai trò.');
    let hasChangedRoles = false;
    try {
      for (const role of nextRoles.filter((item) => !currentRoles.includes(item))) {
        await axiosClient.put(`/accounts/${userId}/roles/${role}`);
        hasChangedRoles = true;
      }
      for (const role of currentRoles.filter((item) => !nextRoles.includes(item))) {
        await axiosClient.delete(`/accounts/${userId}/roles/${role}`);
        hasChangedRoles = true;
      }
      return { id: userId, roles: [...nextRoles] };
    } catch (error) {
      if (hasChangedRoles) throw new PartialRoleUpdateError(error);
      throw getErrorMessage(error, 'Không thể cập nhật vai trò tài khoản.');
    }
  },
};

export default userService;
