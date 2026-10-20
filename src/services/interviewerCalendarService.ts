import axios from 'axios';
import { evaluationApi, fromApiConclusion } from './evaluationApi';
import type { CriterionEvaluationRecord, InterviewConclusion } from '../types/interviewEvaluation';
import { tokenService } from './token.service';
import type {
  InterviewSchedulePayload,
  PersonalScheduleParams,
  AssignedCandidateProfileResult,
  EvaluationSubmittedStatusResult,
} from '../types/interview';
import {
  InterviewApiError,
} from '../types/interview';
import {
  interviewService,
} from './interviewService';

export const LOCAL_STORAGE_EVALUATION_SUBMISSIONS_KEY = 'smart_recruitment_interview_evaluations_submitted';

class InterviewerCalendarService {
  /**
   * Lấy danh sách lịch phỏng vấn phân công cho người phỏng vấn hiện tại (AC 1)
   */
  async getInterviewerSchedule(
    params?: PersonalScheduleParams,
  ): Promise<InterviewSchedulePayload[]> {
    const values = await interviewService.getPersonalInterviewSchedule(params);
    return this.enrichScheduleWithEvaluationStatus(values);
  }

  async getAssignedCandidateProfile(
    applicationId: string,
    interviewId?: string,
  ): Promise<AssignedCandidateProfileResult> {
    void applicationId; void interviewId;
    throw new InterviewApiError('Contract #191 chưa có API assigned-profile tương ứng. Không hiển thị hồ sơ hoặc CV mẫu.', 501);
  }

  async checkEvaluationSubmittedStatus(
    interviewId: string,
    interviewerId?: string,
  ): Promise<EvaluationSubmittedStatusResult> {
    const userId = tokenService.getUserData()?.id;
    if (interviewerId && interviewerId !== userId) throw new Error('Không thể đọc phiếu cá nhân của tài khoản khác.');
    try {
      const form = await evaluationApi.get(interviewId);
      return { interviewId, interviewerId: form.evaluatorId, hasSubmitted: form.status === 'SUBMITTED',
        submittedAt: form.submittedAt ?? undefined, score: form.totalScore ?? undefined,
        conclusion: fromApiConclusion(form.conclusion) ?? undefined };
    } catch (cause) {
      if (axios.isAxiosError(cause) && cause.response?.status === 404 && cause.response.data?.code === 'EVALUATION_NOT_FOUND') {
        return { interviewId, interviewerId: userId ?? '', hasSubmitted: false };
      }
      throw cause;
    }
  }

  /**
   * Đánh dấu người phỏng vấn đã nộp phiếu đánh giá thành công (AC 3)
   * Tự động lưu và cập nhật trạng thái dynamic mà không reload trang.
   */
  async submitInterviewerEvaluation(
    interviewId: string,
    evaluationData: { calculatedTotalScore?: number | null; overallConclusion?: string;
      notes?: string; criteriaScores?: unknown; criteriaEvaluations?: Record<string, CriterionEvaluationRecord>;
      expectedVersion?: number; conclusion?: InterviewConclusion },
    interviewerId?: string,
  ): Promise<void> {
    if (interviewerId && interviewerId !== tokenService.getUserData()?.id) throw new Error('Không thể nộp phiếu thay người khác.');
    if (evaluationData.expectedVersion === undefined || !evaluationData.criteriaEvaluations || !evaluationData.conclusion) {
      throw new Error('Cần tải phiếu từ Backend và gửi version, điểm từng tiêu chí cùng kết luận.');
    }
    const form = await evaluationApi.get(interviewId);
    if (form.version !== evaluationData.expectedVersion) throw new Error('Phiếu đã thay đổi. Tải lại trước khi nộp.');
    await evaluationApi.save(form, evaluationData.criteriaEvaluations, evaluationData.conclusion, true);
  }

  /**
   * Kiểm tra xem một buổi phỏng vấn đã qua thời gian bắt đầu hay chưa theo múi giờ Việt Nam (AC 3)
   */
  isInterviewPast(interviewDate: string, interviewTime?: string): boolean {
    if (!interviewDate) return false;
    const timeStr = interviewTime && interviewTime.trim() ? interviewTime.trim() : '00:00';
    const formattedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    const isoString = `${interviewDate}T${formattedTime}+07:00`;
    const scheduledTime = new Date(isoString);

    if (isNaN(scheduledTime.getTime())) return false;
    return scheduledTime.getTime() <= Date.now();
  }

  private async enrichScheduleWithEvaluationStatus(
    scheduleList: InterviewSchedulePayload[], userId?: string,
  ): Promise<InterviewSchedulePayload[]> {
    return Promise.all(scheduleList.map(async item => {
      if (!item.id) return { ...item, isEvaluationSubmitted: undefined, evaluationScore: undefined };
      const state = await this.checkEvaluationSubmittedStatus(item.id, userId);
      return { ...item, isEvaluationSubmitted: state.hasSubmitted, evaluationScore: state.score,
        evaluationSubmittedAt: state.submittedAt };
    }));
  }
}

export const interviewerCalendarService = new InterviewerCalendarService();
export default interviewerCalendarService;
