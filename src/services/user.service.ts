import axios, { type AxiosError } from 'axios';
import axiosClient from '../utils/axiosClient';
import type { AccountRole } from '../types/account';

export interface CreateAccountInput {
  fullName: string;
  email: string;
  department: string;
  role: AccountRole;
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
  async createAccount(input: CreateAccountInput): Promise<void> {
    try {
      await axiosClient.post('/users', input);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (isDuplicateEmailError(error)) {
          throw new CreateAccountError(
            'Email này đã được sử dụng. Vui lòng kiểm tra hoặc nhập email khác.',
            'EMAIL_EXISTS',
          );
        }

        const message = getResponseMessage(error.response?.data);
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
