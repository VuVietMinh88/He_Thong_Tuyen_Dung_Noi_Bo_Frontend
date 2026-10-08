import axios, { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateAccountError, userService } from '../src/services/user.service';

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock('../src/utils/axiosClient', () => ({
  default: { post: postMock },
}));

const validInput = {
  fullName: 'Nguyễn An',
  email: 'an@example.com',
  department: 'Phòng Nhân sự',
  role: 'RECRUITER' as const,
};

beforeEach(() => {
  postMock.mockReset();
});

describe('userService.createAccount', () => {
  it('sends the account fields to the users endpoint', async () => {
    postMock.mockResolvedValue({ data: {} });

    await expect(userService.createAccount(validInput)).resolves.toBeUndefined();
    expect(postMock).toHaveBeenCalledWith('/users', validInput);
  });

  it('maps HTTP conflict to a clear Vietnamese duplicate-email error', async () => {
    postMock.mockRejectedValue(new AxiosError(
      'Conflict',
      undefined,
      undefined,
      undefined,
      {
        status: 409,
        statusText: 'Conflict',
        headers: {},
        config: { headers: new axios.AxiosHeaders() },
        data: { message: 'Conflict' },
      },
    ));

    await expect(userService.createAccount(validInput)).rejects.toMatchObject({
      name: 'CreateAccountError',
      code: 'EMAIL_EXISTS',
      message: 'Email này đã được sử dụng. Vui lòng kiểm tra hoặc nhập email khác.',
    });
  });

  it('detects duplicate email from the backend error code on a validation response', async () => {
    postMock.mockRejectedValue(new AxiosError(
      'Bad Request',
      undefined,
      undefined,
      undefined,
      {
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: { headers: new axios.AxiosHeaders() },
        data: { code: 'EMAIL_ALREADY_EXISTS' },
      },
    ));

    await expect(userService.createAccount(validInput)).rejects.toMatchObject({
      name: 'CreateAccountError',
      code: 'EMAIL_EXISTS',
    });
  });

  it('returns the backend message for other server errors', async () => {
    postMock.mockRejectedValue(new AxiosError(
      'Bad Request',
      undefined,
      undefined,
      undefined,
      {
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: { headers: new axios.AxiosHeaders() },
        data: { message: 'Phòng ban không hợp lệ.' },
      },
    ));

    await expect(userService.createAccount(validInput)).rejects.toMatchObject({
      code: 'REQUEST_FAILED',
      message: 'Phòng ban không hợp lệ.',
    } satisfies Partial<CreateAccountError>);
  });
});
