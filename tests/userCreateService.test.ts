import axios, { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateAccountError, userService, type CreateAccountInput } from '../src/services/user.service';

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock('../src/utils/axiosClient', () => ({
  default: { post: postMock },
}));

const validInput: CreateAccountInput = {
  fullName: 'Nguyễn An',
  email: 'an@example.com',
  roles: ['RECRUITER'],
};

beforeEach(() => {
  postMock.mockReset();
});

describe('userService.createAccount', () => {
  it('sends backend CreateAccountRequest fields to POST /accounts', async () => {
    const createdAccount = {
      id: '6440c8d7-7624-42a2-823d-94dbc60a2f24',
      email: 'an@example.com',
      fullName: 'Nguyễn An',
      roles: ['RECRUITER'],
      status: 'PENDING_ACTIVATION',
    };
    postMock.mockResolvedValue({ data: createdAccount });

    await expect(userService.createAccount(validInput)).resolves.toEqual(createdAccount);
    expect(postMock).toHaveBeenCalledWith('/accounts', {
      fullName: 'Nguyễn An',
      email: 'an@example.com',
      roles: ['RECRUITER'],
    });
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
