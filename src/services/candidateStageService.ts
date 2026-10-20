import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import type { CandidateStage } from '../types/candidate';

const STANDARD_STAGE_ORDER: CandidateStage[] = [
  'NEW',
  'SCREENING',
  'INTERVIEWING',
  'OFFER',
  'HIRED',
];

export const getSkippedCandidateStages = (
  currentStage: CandidateStage,
  targetStage: CandidateStage,
): CandidateStage[] => {
  const currentIndex = STANDARD_STAGE_ORDER.indexOf(currentStage);
  const targetIndex = STANDARD_STAGE_ORDER.indexOf(targetStage);
  if (currentIndex < 0 || targetIndex <= currentIndex + 1) return [];
  return STANDARD_STAGE_ORDER.slice(currentIndex + 1, targetIndex);
};

export interface MoveCandidateStagePayload {
  applicationId?: string;
  toStage: CandidateStage;
  interviewDate?: string;
  interviewerId?: string;
  interviewer?: string;
  notes?: string;
  isException?: boolean;
  exceptionReason?: string;
}

export interface RejectCandidatePayload {
  applicationId?: string;
  reason: string;
  sendEmail: boolean;
  interviewResult?: 'PASSED' | 'FAILED';
}

const getRequestError = (error: unknown, fallbackMessage: string): Error => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    const responseMessage = error.response?.data?.message;
    if (responseMessage) return new Error(responseMessage);
    if (!error.response) {
      return new Error('Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối và thử lại.');
    }
  }
  return error instanceof Error ? error : new Error(fallbackMessage);
};

export const candidateStageService = {
  async moveCandidateToStage(
    candidateId: string,
    payload: MoveCandidateStagePayload,
  ): Promise<void> {
    try {
      await axiosClient.patch(
        `/recruitment/candidates/${encodeURIComponent(candidateId)}/stage`,
        payload,
      );
    } catch (error: unknown) {
      throw getRequestError(error, 'Không thể chuyển giai đoạn ứng viên.');
    }
  },

  async rejectCandidate(
    candidateId: string,
    payload: RejectCandidatePayload,
  ): Promise<void> {
    try {
      await axiosClient.patch(
        `/recruitment/candidates/${encodeURIComponent(candidateId)}/stage`,
        {
          applicationId: payload.applicationId,
          toStage: 'REJECTED',
          rejectionReason: payload.reason,
          sendRejectionEmail: payload.sendEmail,
        },
      );
    } catch (error: unknown) {
      throw getRequestError(error, 'Không thể cập nhật trạng thái từ chối ứng viên.');
    }
  },
};
