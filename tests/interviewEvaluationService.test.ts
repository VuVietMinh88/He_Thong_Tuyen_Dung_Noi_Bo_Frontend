import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosClient from '../src/utils/axiosClient';
import { interviewEvaluationService } from '../src/services/interviewEvaluationService';

describe('interviewEvaluationService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads evaluation completion status for the selected application', async () => {
    const status = {
      isComplete: false,
      completedCount: 1,
      requiredCount: 2,
      pendingInterviewerNames: ['Nguyễn Văn An'],
    };
    const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({ data: status });

    await expect(
      interviewEvaluationService.getEvaluationStatus('candidate-1', 'application-1'),
    ).resolves.toEqual(status);
    expect(getSpy).toHaveBeenCalledWith(
      '/recruitment/candidates/candidate-1/interviews/evaluation-status',
      { params: { applicationId: 'application-1' } },
    );
  });

  it('rejects malformed evaluation status from the API', async () => {
    vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({ data: { complete: true } });

    await expect(
      interviewEvaluationService.getEvaluationStatus('candidate-1'),
    ).rejects.toThrow('Dữ liệu trạng thái đánh giá phỏng vấn từ máy chủ không hợp lệ.');
  });

  it('sends the editable result notification and expects the updated stage', async () => {
    vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
      data: { isComplete: true, completedCount: 2, requiredCount: 2 },
    });
    const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
      data: { result: 'PASSED', stage: 'OFFER', emailSent: true },
    });
    const payload = {
      applicationId: 'application-1',
      result: 'PASSED' as const,
      stage: 'OFFER' as const,
      subject: '  Kết quả phỏng vấn  ',
      message: '  Xin chúc mừng  ',
      sendEmail: true as const,
    };

    await expect(
      interviewEvaluationService.sendResult('candidate-1', payload),
    ).resolves.toEqual({ result: 'PASSED', stage: 'OFFER', emailSent: true });
    expect(postSpy).toHaveBeenCalledWith(
      '/recruitment/candidates/candidate-1/interview-result',
      {
        ...payload,
        subject: 'Kết quả phỏng vấn',
        message: 'Xin chúc mừng',
      },
    );
  });

  it('does not send the result if any interview evaluation is incomplete', async () => {
    vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
      data: {
        isComplete: false,
        completedCount: 1,
        requiredCount: 2,
        pendingInterviewerNames: ['Nguyễn Văn An'],
      },
    });
    const postSpy = vi.spyOn(axiosClient, 'post');

    await expect(
      interviewEvaluationService.sendResult('candidate-1', {
        result: 'PASSED',
        stage: 'OFFER',
        subject: 'Kết quả',
        message: 'Nội dung',
        sendEmail: true,
      }),
    ).rejects.toThrow('Còn thiếu: Nguyễn Văn An.');
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('does not call the API when the result and stage conflict', async () => {
    const postSpy = vi.spyOn(axiosClient, 'post');

    await expect(
      interviewEvaluationService.sendResult('candidate-1', {
        result: 'FAILED',
        stage: 'OFFER',
        subject: 'Kết quả',
        message: 'Nội dung',
        sendEmail: true,
      }),
    ).rejects.toThrow('Giai đoạn hồ sơ không khớp với kết quả phỏng vấn.');
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('reopens evaluation when requested by a recruiter', async () => {
    const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
      data: { id: 'eval-1', interviewId: 'interview-1', status: 'DRAFT', version: 4, updatedAt: '2026-10-15T12:00:00.000Z' },
    });
    await expect(interviewEvaluationService.reopenEvaluation('interview-1', {
      evaluationId: 'eval-1', expectedVersion: 3, reason: 'Cần bổ sung tiêu chí chuyên môn',
    })).resolves.toEqual({ success: true, reopenedAt: '2026-10-15T12:00:00.000Z' });
    expect(postSpy).toHaveBeenCalledWith('/interviews/interview-1/evaluations/eval-1/reopen', {
      expectedVersion: 3, reason: 'Cần bổ sung tiêu chí chuyên môn',
    });
  });

  it('rejects reopening when interviewId is empty', async () => {
    await expect(
      interviewEvaluationService.reopenEvaluation('   '),
    ).rejects.toThrow('Cần interviewId, formId, expectedVersion và lý do để mở lại phiếu.');
  });
});

