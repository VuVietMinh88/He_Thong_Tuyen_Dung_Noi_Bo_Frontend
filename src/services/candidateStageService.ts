import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import type { CandidateStage } from '../types/candidate';

export interface MoveCandidateStagePayload {
  applicationId?: string;
  toStage: CandidateStage;
  interviewDate?: string;
  interviewerId?: string;
  interviewer?: string;
  notes?: string;
}

export interface RejectCandidatePayload {
  applicationId?: string;
  reason: string;
  sendEmail: boolean;
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
