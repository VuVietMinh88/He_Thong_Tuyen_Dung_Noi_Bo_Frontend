import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosClient from '../src/utils/axiosClient';
import { candidateStageService } from '../src/services/candidateStageService';
import { offerService } from '../src/services/offerService';

const candidateOffer = {
  offerId: 'offer-123',
  candidateId: 'candidate-456',
  applicationId: 'application-789',
};

const savedOffer = {
  ...candidateOffer,
  offerCode: 'OFF-2026-123',
  candidateName: 'Nguyễn An',
  jobTitle: 'Frontend Developer',
  offeredSalary: 30_000_000,
  allowanceAmount: 0,
  totalMonthlyCompensation: 30_000_000,
  expectedStartDate: '2026-11-01',
  responseDeadline: '2026-10-31',
  isSalaryOutOfRange: false,
  salaryComparisonStatus: 'WITHIN' as const,
  status: 'ACCEPTED' as const,
  sendEmailToCandidate: true,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-17T00:00:00.000Z',
};

afterEach(() => vi.restoreAllMocks());

describe('offerService.respondOffer', () => {
  it('saves acceptance first and then moves the application to HIRED', async () => {
    const post = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({ data: savedOffer });
    const moveCandidate = vi
      .spyOn(candidateStageService, 'moveCandidateToStage')
      .mockResolvedValueOnce();

    const result = await offerService.respondOffer(candidateOffer, { decision: 'ACCEPT' });

    expect(post).toHaveBeenCalledWith('/offers/offer-123/respond', {
      decision: 'ACCEPT',
    });
    expect(moveCandidate).toHaveBeenCalledWith('candidate-456', {
      applicationId: 'application-789',
      toStage: 'HIRED',
      notes: 'Ứng viên đã đồng ý thư mời nhận việc.',
    });
    expect(result).toMatchObject({
      offer: savedOffer,
      pipelineStage: 'HIRED',
      pipelineSynced: true,
    });
  });

  it('maps rejection to WITHDRAWN and includes the reason in pipeline notes', async () => {
    vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({ data: savedOffer });
    const moveCandidate = vi
      .spyOn(candidateStageService, 'moveCandidateToStage')
      .mockResolvedValueOnce();

    const result = await offerService.respondOffer(candidateOffer, {
      decision: 'DECLINE',
      reason: 'Đã nhận một cơ hội khác.',
    });

    expect(moveCandidate).toHaveBeenCalledWith('candidate-456', {
      applicationId: 'application-789',
      toStage: 'WITHDRAWN',
      notes: 'Ứng viên từ chối thư mời nhận việc. Lý do: Đã nhận một cơ hội khác.',
    });
    expect(result.pipelineSynced).toBe(true);
  });

  it('keeps negotiation in OFFER and records the requested compensation and terms', async () => {
    vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({ data: savedOffer });
    const moveCandidate = vi
      .spyOn(candidateStageService, 'moveCandidateToStage')
      .mockResolvedValueOnce();

    await offerService.respondOffer(candidateOffer, {
      decision: 'NEGOTIATE',
      requestedSalary: 35_000_000,
      requestedTerms: 'Làm việc hybrid.',
    });

    expect(moveCandidate).toHaveBeenCalledWith('candidate-456', {
      applicationId: 'application-789',
      toStage: 'OFFER',
      notes: 'Ứng viên đề nghị thương lượng. Mức lương đề xuất: 35.000.000 ₫/tháng. Điều khoản đề xuất: Làm việc hybrid.',
    });
  });

  it('returns a partial result if the offer was saved but the pipeline update fails', async () => {
    vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({ data: savedOffer });
    vi.spyOn(candidateStageService, 'moveCandidateToStage').mockRejectedValueOnce(
      new Error('Không thể cập nhật pipeline.'),
    );

    await expect(
      offerService.respondOffer(candidateOffer, { decision: 'ACCEPT' }),
    ).resolves.toMatchObject({
      offer: savedOffer,
      pipelineStage: 'HIRED',
      pipelineSynced: false,
      pipelineSyncError: 'Không thể cập nhật pipeline.',
    });
  });

  it('does not change pipeline when the offer response request fails', async () => {
    vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(
      new Error('Không thể gửi phản hồi offer.'),
    );
    const moveCandidate = vi.spyOn(candidateStageService, 'moveCandidateToStage');

    await expect(
      offerService.respondOffer(candidateOffer, { decision: 'ACCEPT' }),
    ).rejects.toThrow('Không thể gửi phản hồi offer.');
    expect(moveCandidate).not.toHaveBeenCalled();
  });
});
