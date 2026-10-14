import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import type { CandidateStage } from '../types/candidate';

export type InterviewResult = 'PASSED' | 'FAILED';
export type InterviewResultStage = Extract<CandidateStage, 'OFFER' | 'HIRED' | 'REJECTED'>;

export interface InterviewEvaluationStatus {
  isComplete: boolean;
  completedCount: number;
  requiredCount: number;
  pendingInterviewerNames?: string[];
}

export interface SendInterviewResultPayload {
  applicationId?: string;
  result: InterviewResult;
  stage: InterviewResultStage;
  subject: string;
  message: string;
  rejectionReason?: string;
  sendEmail: true;
}

export interface SendInterviewResultResponse {
  result: InterviewResult;
  stage: InterviewResultStage;
  emailSent: boolean;
}

const getRequestError = (error: unknown, fallbackMessage: string): Error => {
  if (axios.isAxiosError<{ message?: string; error?: string }>(error)) {
    const responseMessage = error.response?.data?.message || error.response?.data?.error;
    if (responseMessage) return new Error(responseMessage);
    if (!error.response) {
      return new Error('Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối và thử lại.');
    }
  }
  return error instanceof Error ? error : new Error(fallbackMessage);
};

const isEvaluationStatus = (value: unknown): value is InterviewEvaluationStatus => {
  if (typeof value !== 'object' || value === null) return false;
  const status = value as Partial<InterviewEvaluationStatus>;
  return (
    typeof status.isComplete === 'boolean' &&
    typeof status.completedCount === 'number' &&
    typeof status.requiredCount === 'number'
  );
};

const isSendResultResponse = (value: unknown): value is SendInterviewResultResponse => {
  if (typeof value !== 'object' || value === null) return false;
  const response = value as Partial<SendInterviewResultResponse>;
  return (
    (response.result === 'PASSED' || response.result === 'FAILED') &&
    (response.stage === 'OFFER' || response.stage === 'HIRED' || response.stage === 'REJECTED') &&
    typeof response.emailSent === 'boolean'
  );
};

export const interviewEvaluationService = {
  async getEvaluationStatus(
    candidateId: string,
    applicationId?: string,
  ): Promise<InterviewEvaluationStatus> {
    if (!candidateId.trim()) {
      throw new Error('Thiếu mã ứng viên để kiểm tra đánh giá phỏng vấn.');
    }

    try {
      const response = await axiosClient.get<InterviewEvaluationStatus>(
        `/recruitment/candidates/${encodeURIComponent(candidateId)}/interviews/evaluation-status`,
        { params: applicationId ? { applicationId } : undefined },
      );
      if (!isEvaluationStatus(response.data)) {
        throw new Error('Dữ liệu trạng thái đánh giá phỏng vấn từ máy chủ không hợp lệ.');
      }
      return response.data;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === 'Dữ liệu trạng thái đánh giá phỏng vấn từ máy chủ không hợp lệ.'
      ) {
        throw error;
      }
      throw getRequestError(error, 'Không thể kiểm tra trạng thái đánh giá phỏng vấn.');
    }
  },

  async sendResult(
    candidateId: string,
    payload: SendInterviewResultPayload,
  ): Promise<SendInterviewResultResponse> {
    if (!candidateId.trim()) {
      throw new Error('Thiếu mã ứng viên để gửi kết quả phỏng vấn.');
    }
    if (!payload.subject.trim() || !payload.message.trim()) {
      throw new Error('Tiêu đề và nội dung email kết quả không được để trống.');
    }
    if (
      (payload.result === 'FAILED' && payload.stage !== 'REJECTED') ||
      (payload.result === 'PASSED' && payload.stage === 'REJECTED')
    ) {
      throw new Error('Giai đoạn hồ sơ không khớp với kết quả phỏng vấn.');
    }

    const evaluationStatus = await this.getEvaluationStatus(candidateId, payload.applicationId);
    if (!evaluationStatus.isComplete) {
      const pendingNames = evaluationStatus.pendingInterviewerNames?.filter(Boolean) ?? [];
      throw new Error(
        `Chưa thể gửi kết quả: mới hoàn tất ${evaluationStatus.completedCount}/${evaluationStatus.requiredCount} đánh giá.${
          pendingNames.length > 0 ? ` Còn thiếu: ${pendingNames.join(', ')}.` : ''
        } Vui lòng hoàn tất đánh giá phỏng vấn trước.`,
      );
    }

    try {
      const response = await axiosClient.post<SendInterviewResultResponse>(
        `/recruitment/candidates/${encodeURIComponent(candidateId)}/interview-result`,
        {
          ...payload,
          subject: payload.subject.trim(),
          message: payload.message.trim(),
        },
      );
      if (!isSendResultResponse(response.data)) {
        throw new Error('Máy chủ trả về kết quả gửi thông báo phỏng vấn không hợp lệ.');
      }
      if (response.data.result !== payload.result || response.data.stage !== payload.stage) {
        throw new Error('Kết quả cập nhật từ máy chủ không khớp với lựa chọn đã gửi.');
      }
      return response.data;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (
          error.message === 'Máy chủ trả về kết quả gửi thông báo phỏng vấn không hợp lệ.' ||
          error.message === 'Kết quả cập nhật từ máy chủ không khớp với lựa chọn đã gửi.'
        )
      ) {
        throw error;
      }
      throw getRequestError(error, 'Không thể gửi thông báo kết quả phỏng vấn.');
    }
  },
};
