import { afterEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import axiosClient from '../src/utils/axiosClient';
import { candidateStageService } from '../src/services/candidateStageService';

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

describe('candidateStageService', () => {
  it('sends the selected stage and interview schedule to the candidate stage endpoint', async () => {
    const patch = vi.spyOn(axiosClient, 'patch').mockResolvedValueOnce({ data: {} });
    const payload = {
      applicationId: 'application-123',
      toStage: 'INTERVIEWING' as const,
      interviewDate: '2026-10-20T09:00:00.000Z',
      interviewer: 'Nguyễn Văn Minh',
      notes: 'Phỏng vấn vòng kỹ thuật',
    };

    await candidateStageService.moveCandidateToStage('candidate/123', payload);

    expect(patch).toHaveBeenCalledWith(
      '/recruitment/candidates/candidate%2F123/stage',
      payload,
    );
  });

  it('includes the rejection reason and email preference in the stage update', async () => {
    const patch = vi.spyOn(axiosClient, 'patch').mockResolvedValueOnce({ data: {} });

    await candidateStageService.rejectCandidate('candidate-456', {
      applicationId: 'application-456',
      reason: 'Không đạt phỏng vấn',
      sendEmail: false,
    });

    expect(patch).toHaveBeenCalledWith('/recruitment/candidates/candidate-456/stage', {
      applicationId: 'application-456',
      toStage: 'REJECTED',
      rejectionReason: 'Không đạt phỏng vấn',
      sendRejectionEmail: false,
    });
  });

  it('surfaces the backend validation message instead of reporting success', async () => {
    const patch = vi.spyOn(axiosClient, 'patch').mockRejectedValueOnce(
      createApiError(400, { message: 'Không thể chuyển ứng viên từ giai đoạn này.' }),
    );

    await expect(candidateStageService.moveCandidateToStage('candidate-123', {
      toStage: 'HIRED',
    })).rejects.toThrow('Không thể chuyển ứng viên từ giai đoạn này.');
    expect(patch).toHaveBeenCalledOnce();
  });
});
