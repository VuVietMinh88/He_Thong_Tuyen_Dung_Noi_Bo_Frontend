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
  it('reads and returns the backend accessToken field', async () => {
    const loginResponse = {
      accessToken: 'valid-access-token',
      user: { id: '1', email: 'user@company.com', role: 'hr' },
    };
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
        data: {
          accessToken,
          user: { id: '1', email: 'user@company.com', role: 'hr' },
        },
      });

      await expect(authService.login('user@company.com', 'password123'))
        .rejects.toBeInstanceOf(InvalidLoginResponseError);
    },
  );

  it('rejects malformed optional user information', async () => {
    postMock.mockResolvedValue({
      data: { accessToken: 'valid-access-token', user: { id: 1 } },
    });

    await expect(authService.login('user@company.com', 'password123'))
      .rejects.toBeInstanceOf(InvalidLoginResponseError);
  });
});
