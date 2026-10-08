import { beforeEach, describe, expect, it, vi } from 'vitest';

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock('../src/utils/axiosClient', () => ({
  default: { post: postMock },
}));

import { authService, InvalidLoginResponseError } from '../src/services/auth.service';

beforeEach(() => {
  postMock.mockReset();
});

describe('Login API contract', () => {
  const loginResponse = {
    accessToken: 'valid-access-token',
    refreshToken: 'A'.repeat(43),
    tokenType: 'Bearer',
    expiresIn: 900,
    refreshExpiresAt: '2030-01-01T00:00:00Z',
    user: {
      id: '1',
      email: 'user@company.com',
      fullName: 'Company User',
      roles: ['HR_MANAGER'],
    },
  };

  it('reads and returns the backend accessToken field', async () => {
    postMock.mockResolvedValue({ data: loginResponse });

    await expect(authService.login('user@company.com', 'password123'))
      .resolves.toEqual(loginResponse);
    expect(postMock).toHaveBeenCalledWith('/auth/login', {
      email: 'user@company.com',
      password: 'password123',
    });
  });

  it('rejects a response missing required user data', async () => {
    postMock.mockResolvedValue({ data: { accessToken: 'valid-access-token' } });

    await expect(authService.login('user@company.com', 'password123'))
      .rejects.toBeInstanceOf(InvalidLoginResponseError);
  });

  it.each([null, '', '   ', 'undefined', 123])(
    'rejects an invalid accessToken value: %s',
    async (accessToken) => {
      postMock.mockResolvedValue({
        data: { ...loginResponse, accessToken },
      });

      await expect(authService.login('user@company.com', 'password123'))
        .rejects.toBeInstanceOf(InvalidLoginResponseError);
    },
  );

  it('rejects malformed optional user information', async () => {
    postMock.mockResolvedValue({
      data: { ...loginResponse, user: { id: 1 } },
    });

    await expect(authService.login('user@company.com', 'password123'))
      .rejects.toBeInstanceOf(InvalidLoginResponseError);
  });

  it('normalizes email before sending it to the backend', async () => {
    postMock.mockResolvedValue({ data: loginResponse });

    await authService.login('  USER@Company.com ', 'password123');

    expect(postMock).toHaveBeenCalledWith('/auth/login', {
      email: 'user@company.com',
      password: 'password123',
    });
  });

  it('maps backend validation errors to the matching form fields', async () => {
    postMock.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 400,
        data: { fieldErrors: { email: ['Email không hợp lệ'] } },
      },
    });

    await expect(authService.login('bad-email', 'password123')).rejects.toMatchObject({
      message: 'VALIDATION_ERROR',
      fieldErrors: { email: ['Email không hợp lệ'] },
    });
  });

  it('reports backend unavailability instead of returning a mock login session', async () => {
    postMock.mockRejectedValue({ isAxiosError: true, request: {} });

    await expect(authService.login('user@company.com', 'password123'))
      .rejects.toThrow('NETWORK_ERROR');
  });
});
