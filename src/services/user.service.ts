import axios, { type AxiosError } from 'axios';
import axiosClient from '../utils/axiosClient';
import type { AccountRole } from '../types/account';

export interface CreateAccountInput {
  fullName: string;
  email: string;
  roles: AccountRole[];
}

export interface CreatedAccount {
  id: string;
  email: string;
  fullName: string;
  roles: AccountRole[];
  status: 'PENDING_ACTIVATION';
}

export class CreateAccountError extends Error {
  readonly code: 'EMAIL_EXISTS' | 'REQUEST_FAILED';

  constructor(message: string, code: 'EMAIL_EXISTS' | 'REQUEST_FAILED') {
    super(message);
    this.name = 'CreateAccountError';
    this.code = code;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isAccountRole = (value: unknown): value is AccountRole =>
  typeof value === 'string'
  && ['ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER', 'APPROVER'].includes(value);

const getResponseMessage = (data: unknown): string | undefined => {
  if (typeof data === 'string') return data;
  if (!isRecord(data)) return undefined;

  for (const field of ['message', 'error', 'detail', 'title'] as const) {
    if (field in data && typeof data[field] === 'string') return data[field];
  }
  return undefined;
};

const isDuplicateEmailError = (error: AxiosError<unknown>): boolean => {
  if (error.response?.status === 409) return true;

  const data = error.response?.data;
  if (typeof data !== 'object' || data === null) return false;

  const code = 'code' in data && typeof data.code === 'string'
    ? data.code.toLowerCase()
    : '';
  const message = getResponseMessage(data)?.toLowerCase() ?? '';

  return code.includes('email') && (code.includes('exist') || code.includes('duplicate'))
    || message.includes('email') && (
      message.includes('exist')
      || message.includes('duplicate')
      || message.includes('đã tồn tại')
      || message.includes('đã được sử dụng')
      || message.includes('đã đăng ký')
      || message.includes('trùng')
    );
};

export const userService = {
  async createAccount(input: CreateAccountInput): Promise<CreatedAccount> {
    try {
      const response = await axiosClient.post<unknown>('/accounts', {
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        roles: input.roles,
      });
      const data: unknown = response.data;
      if (
        !isRecord(data)
        || typeof data.id !== 'string'
        || typeof data.email !== 'string'
        || typeof data.fullName !== 'string'
        || !Array.isArray(data.roles)
        || !data.roles.every(isAccountRole)
        || data.status !== 'PENDING_ACTIVATION'
      ) {
        throw new CreateAccountError(
          'Backend trả về dữ liệu tạo tài khoản không đúng hợp đồng API.',
          'REQUEST_FAILED',
        );
      }

      return {
        id: data.id,
        email: data.email,
        fullName: data.fullName,
        roles: data.roles,
        status: 'PENDING_ACTIVATION',
      };
    } catch (error: unknown) {
      if (error instanceof CreateAccountError) throw error;
      if (axios.isAxiosError(error)) {
        if (isDuplicateEmailError(error)) {
          throw new CreateAccountError(
            'Email này đã được sử dụng. Vui lòng kiểm tra hoặc nhập email khác.',
            'EMAIL_EXISTS',
          );
        }

        const message = getResponseMessage(error.response?.data)
          ?? (error.response?.status === 403
            ? 'Bạn không có quyền tạo tài khoản nhân sự.'
            : undefined);
        throw new CreateAccountError(
          message ?? 'Không thể tạo tài khoản lúc này. Vui lòng thử lại.',
          'REQUEST_FAILED',
        );
      }

      throw new CreateAccountError(
        'Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối và thử lại.',
        'REQUEST_FAILED',
      );
    }
  },
};
