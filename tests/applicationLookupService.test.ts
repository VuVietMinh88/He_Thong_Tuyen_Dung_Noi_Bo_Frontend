import { afterEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import {
  ApplicationLookupError,
  applicationLookupService,
} from '../src/services/applicationLookupService';
import axiosClient from '../src/utils/axiosClient';

const createApiError = (status: number, data: unknown): AxiosError => {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  return new AxiosError(
    'Request failed',
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    {
      data,
      status,
      statusText: 'Request failed',
      headers: new AxiosHeaders(),
      config,
    },
  );
};

afterEach(() => vi.restoreAllMocks());

describe('applicationLookupService', () => {
  it('calls the public lookup endpoint with the selected lookup method and trimmed value', async () => {
    const application = {
      applicationCode: 'APP-2026-001',
      jobTitle: 'Frontend Developer',
      submittedAt: '2026-10-14T08:00:00Z',
      status: 'RECEIVED' as const,
    };
    const get = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({ data: application });

    await expect(applicationLookupService.lookup('contact', ' candidate@example.com ')).resolves.toEqual(application);
    expect(get).toHaveBeenCalledWith('/public/applications/lookup', {
      params: { method: 'contact', value: 'candidate@example.com' },
    });
  });

  it('maps a not-found response to a typed lookup error', async () => {
    vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(createApiError(404, {
      code: 'APPLICATION_NOT_FOUND',
    }));

    await expect(applicationLookupService.lookup('applicationCode', 'APP-404'))
      .rejects.toMatchObject({ name: 'ApplicationLookupError', kind: 'not-found' });
  });

  it('maps backend code/email mismatch errors to a typed lookup error', async () => {
    vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(createApiError(400, {
      errorCode: 'APPLICATION_EMAIL_MISMATCH',
      message: 'Email does not match application.',
    }));

    await expect(applicationLookupService.lookup('contact', 'wrong@example.com'))
      .rejects.toBeInstanceOf(ApplicationLookupError);
  });

  it('does not misreport unrelated client or server failures as lookup mismatch', async () => {
    const requestError = createApiError(500, { code: 'INTERNAL_SERVER_ERROR' });
    vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(requestError);

    await expect(applicationLookupService.lookup('applicationCode', 'APP-500'))
      .rejects.toBe(requestError);
  });

  it('withdraws an application with the required reason', async () => {
    const patch = vi.spyOn(axiosClient, 'patch').mockResolvedValueOnce({ data: {} });

    await applicationLookupService.withdraw(' APP/2026 01 ', '  Lý do cá nhân  ');

    expect(patch).toHaveBeenCalledWith(
      '/public/applications/APP%2F2026%2001/withdraw',
      { reason: 'Lý do cá nhân' },
    );
  });

  it('rejects an empty withdrawal reason without calling the API', async () => {
    const patch = vi.spyOn(axiosClient, 'patch');

    await expect(applicationLookupService.withdraw('APP-2026-001', '   '))
      .rejects.toThrow('Vui lòng nhập lý do rút hồ sơ.');
    expect(patch).not.toHaveBeenCalled();
  });
});
