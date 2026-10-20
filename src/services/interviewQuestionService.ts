import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import { tokenService } from './token.service';
import type {
  SuggestedQuestionItem,
  AskedInPreviousRoundInfo,
} from '../data/suggestedQuestionsData';
import { DEFAULT_SUGGESTED_QUESTIONS } from '../data/suggestedQuestionsData';

export const LOCAL_STORAGE_ASKED_QUESTIONS_KEY = 'smart_recruitment_interview_asked_questions';

export class InterviewQuestionApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'InterviewQuestionApiError';
    this.statusCode = statusCode;
  }
}

export interface MarkQuestionUsagePayload {
  applicationId?: string;
  candidateId?: string;
  questionId: string;
  interviewRoundId?: string;
  roundName?: string;
  interviewerId?: string;
  interviewerName?: string;
  askedAt?: string;
  notes?: string;
  score?: number;
}

export interface QuestionUsageRecord extends MarkQuestionUsagePayload {
  id: string;
  createdAt: string;
}

export interface GetSuggestedQuestionsParams {
  positionId?: string;
  criteriaId?: string;
  criterionId?: string;
  jobTitle?: string;
  applicationId?: string;
  candidateId?: string;
  interviewRoundId?: string;
  roundName?: string;
  currentRoundName?: string;
  difficulty?: string;
}

export interface UnmarkQuestionUsageParams {
  questionUsageId?: string;
  questionId?: string;
  candidateId?: string;
  applicationId?: string;
  interviewRoundId?: string;
}

/**
 * Xử lý lỗi API từ Axios và trả về thông báo tiếng Việt thân thiện
 */
export const handleInterviewQuestionError = (error: unknown, fallbackMessage: string): Error => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const resData = error.response?.data as { code?: string; message?: string } | undefined;
    const serverMessage = resData?.message;

    if (serverMessage && typeof serverMessage === 'string') {
      return new InterviewQuestionApiError(serverMessage, status);
    }

    if (!error.response) {
      return new InterviewQuestionApiError(
        'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.',
        status,
      );
    }

    if (status === 400) {
      return new InterviewQuestionApiError(
        'Dữ liệu đánh dấu câu hỏi không hợp lệ hoặc thiếu thông tin bắt buộc.',
        status,
      );
    }
    if (status === 401) {
      return new InterviewQuestionApiError(
        'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.',
        status,
      );
    }
    if (status === 403) {
      return new InterviewQuestionApiError(
        'Bạn không có quyền thực hiện đánh dấu hoặc cập nhật trạng thái câu hỏi phỏng vấn.',
        status,
      );
    }
    if (status === 404) {
      return new InterviewQuestionApiError(
        'Không tìm thấy thông tin câu hỏi hoặc hồ sơ buổi phỏng vấn tương ứng.',
        status,
      );
    }
    if (status && status >= 500) {
      return new InterviewQuestionApiError(
        'Hệ thống máy chủ gặp sự cố khi lưu trạng thái câu hỏi. Vui lòng thử lại sau.',
        status,
      );
    }
  }

  return error instanceof Error
    ? error
    : new InterviewQuestionApiError(fallbackMessage);
};

export const interviewQuestionService = {
  /**
   * Đọc danh sách tất cả câu hỏi đã được đánh dấu lưu trong LocalStorage
   */
  getStoredUsages(): QuestionUsageRecord[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_ASKED_QUESTIONS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  /**
   * Lưu danh sách câu hỏi đã được đánh dấu vào LocalStorage
   */
  saveStoredUsages(usages: QuestionUsageRecord[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_ASKED_QUESTIONS_KEY, JSON.stringify(usages));
    } catch {
      // Bỏ qua lỗi lưu storage
    }
  },

  /**
   * 1. Lấy danh sách câu hỏi gợi ý kèm thông tin lịch sử đã hỏi theo ứng viên và chức danh/tiêu chí (AC 1)
   */
  async getSuggestedQuestions(
    params?: GetSuggestedQuestionsParams,
  ): Promise<SuggestedQuestionItem[]> {
    const candidateId = params?.candidateId || params?.applicationId;
    const effectiveCriterionId = params?.criteriaId || params?.criterionId;
    const effectiveRoundName = params?.currentRoundName || params?.roundName;

    try {
      const response = await axiosClient.get<SuggestedQuestionItem[]>(
        '/recruitment/interviews/suggested-questions',
        {
          params: {
            positionId: params?.positionId,
            criteriaId: effectiveCriterionId,
            jobTitle: params?.jobTitle,
            candidateId: params?.candidateId,
            applicationId: params?.applicationId,
            interviewRoundId: params?.interviewRoundId,
            roundName: effectiveRoundName,
            difficulty: params?.difficulty,
          },
        },
      );

      if (response?.data && Array.isArray(response.data)) {
        return this.enrichQuestionsWithHistory(response.data, candidateId, effectiveRoundName);
      }
    } catch {
      // Fallback sang ngân hàng câu hỏi nội bộ nếu Backend chưa sẵn sàng
    }

    // Fallback: Lấy từ ngân hàng câu hỏi tiêu chuẩn
    let filtered = [...DEFAULT_SUGGESTED_QUESTIONS];

    if (params?.jobTitle) {
      const lowerJob = params.jobTitle.toLowerCase();
      filtered = filtered.filter((q) => {
        if (!q.positionName || q.positionName === 'Tất cả vị trí') return true;
        const lowerPos = q.positionName.toLowerCase();
        if (lowerJob.includes('front') && lowerPos.includes('front')) return true;
        if (lowerJob.includes('back') && lowerPos.includes('back')) return true;
        if (lowerJob.includes('qa') && lowerPos.includes('qa')) return true;
        if (lowerJob.includes('lead') && lowerPos.includes('lead')) return true;
        return lowerPos.includes(lowerJob) || lowerJob.includes(lowerPos);
      });
    } else if (params?.positionId && params.positionId !== 'ALL') {
      filtered = filtered.filter(
        (q) => q.positionId === params.positionId || q.positionName === 'Tất cả vị trí',
      );
    }

    if (effectiveCriterionId && effectiveCriterionId !== 'ALL') {
      filtered = filtered.filter(
        (q) => q.criterionId === effectiveCriterionId || q.criterionName === effectiveCriterionId,
      );
    }

    if (params?.difficulty && params.difficulty !== 'ALL') {
      filtered = filtered.filter((q) => q.difficulty === params.difficulty);
    }

    return this.enrichQuestionsWithHistory(filtered, candidateId, effectiveRoundName);
  },

  /**
   * Làm giàu danh sách câu hỏi với lịch sử đã hỏi ở vòng trước hoặc vòng hiện tại
   */
  enrichQuestionsWithHistory(
    questions: SuggestedQuestionItem[],
    candidateId?: string,
    currentRoundName?: string,
  ): SuggestedQuestionItem[] {
    if (!candidateId) return questions;

    const allUsages = this.getStoredUsages();
    const candidateUsages = allUsages.filter(
      (u) => u.candidateId === candidateId || u.applicationId === candidateId,
    );

    if (candidateUsages.length === 0) {
      return questions;
    }

    return questions.map((q) => {
      // Tìm các lần câu hỏi này đã được sử dụng cho ứng viên
      const matchedUsages = candidateUsages.filter((u) => u.questionId === q.id);
      if (matchedUsages.length === 0) return q;

      // Phân loại: Lần hỏi ở vòng trước vs Vòng hiện tại
      const prevRoundUsage = matchedUsages.find(
        (u) => currentRoundName && u.roundName && u.roundName !== currentRoundName,
      ) || matchedUsages[0];

      const askedInPreviousRound: AskedInPreviousRoundInfo = {
        isAsked: true,
        roundName: prevRoundUsage.roundName || 'Vòng trước',
        interviewerName: prevRoundUsage.interviewerName,
        askedDate: prevRoundUsage.askedAt
          ? new Date(prevRoundUsage.askedAt).toLocaleDateString('vi-VN')
          : undefined,
        score: prevRoundUsage.score,
        notes: prevRoundUsage.notes,
      };

      return {
        ...q,
        askedInPreviousRound,
      };
    });
  },

  /**
   * 2. Đánh dấu câu hỏi đã sử dụng trong buổi phỏng vấn hiện tại (AC 1 & AC 2)
   */
  async markQuestionAsAsked(payload: MarkQuestionUsagePayload): Promise<QuestionUsageRecord> {
    if (!payload.questionId || !payload.questionId.trim()) {
      throw new InterviewQuestionApiError('ID câu hỏi không được để trống.', 400);
    }

    const currentUser = tokenService.getUserData();
    const interviewerId = payload.interviewerId || currentUser?.id || 'usr-current';
    const interviewerName = payload.interviewerName || currentUser?.fullName || 'Người phỏng vấn';
    const nowIso = new Date().toISOString();

    const newUsage: QuestionUsageRecord = {
      id: `usage-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      applicationId: payload.applicationId,
      candidateId: payload.candidateId || payload.applicationId,
      questionId: payload.questionId,
      interviewRoundId: payload.interviewRoundId,
      roundName: payload.roundName || 'Buổi phỏng vấn',
      interviewerId,
      interviewerName,
      askedAt: payload.askedAt || nowIso,
      notes: payload.notes,
      score: payload.score,
      createdAt: nowIso,
    };

    // 1. Gọi API Backend
    try {
      const response = await axiosClient.post<QuestionUsageRecord>(
        '/recruitment/interviews/question-usages',
        newUsage,
      );

      if (response?.data && response.data.id) {
        this.saveUsageToStorage(response.data);
        return response.data;
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status && error.response.status >= 400) {
        throw handleInterviewQuestionError(
          error,
          'Không thể lưu trạng thái câu hỏi đã sử dụng lên máy chủ.',
        );
      }
      // Nếu là lỗi mạng, tiếp tục lưu fallback offline
    }

    // 2. Lưu vào LocalStorage để đồng bộ giao diện thời gian thực (AC 2)
    this.saveUsageToStorage(newUsage);
    return newUsage;
  },

  /**
   * Lưu một bản ghi usage vào LocalStorage (tránh trùng lặp)
   */
  saveUsageToStorage(record: QuestionUsageRecord): void {
    const usages = this.getStoredUsages();
    const existingIndex = usages.findIndex(
      (u) =>
        u.questionId === record.questionId &&
        (u.candidateId === record.candidateId || u.applicationId === record.applicationId) &&
        u.roundName === record.roundName,
    );

    if (existingIndex >= 0) {
      usages[existingIndex] = record;
    } else {
      usages.push(record);
    }

    this.saveStoredUsages(usages);
  },

  /**
   * 3. Bỏ đánh dấu / Hoàn tác câu hỏi đã sử dụng (AC 1 & AC 2)
   */
  async unmarkQuestionAsAsked(
    params: string | UnmarkQuestionUsageParams,
  ): Promise<boolean> {
    const usageId = typeof params === 'string' ? params : params.questionUsageId;
    const questionId = typeof params === 'object' ? params.questionId : undefined;
    const candidateId = typeof params === 'object' ? params.candidateId || params.applicationId : undefined;

    // 1. Gửi request xóa qua API Backend
    try {
      if (usageId) {
        await axiosClient.delete(`/recruitment/interviews/question-usages/${encodeURIComponent(usageId)}`);
      } else {
        await axiosClient.post('/recruitment/interviews/question-usages/unmark', params);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status && error.response.status >= 400) {
        throw handleInterviewQuestionError(
          error,
          'Không thể bỏ đánh dấu câu hỏi phỏng vấn.',
        );
      }
    }

    // 2. Xóa khỏi LocalStorage
    const usages = this.getStoredUsages();
    const filtered = usages.filter((u) => {
      if (usageId && u.id === usageId) return false;
      if (questionId && u.questionId === questionId) {
        if (!candidateId || u.candidateId === candidateId || u.applicationId === candidateId) {
          return false;
        }
      }
      return true;
    });

    this.saveStoredUsages(filtered);
    return true;
  },

  /**
   * 4. Lấy lịch sử các câu hỏi đã hỏi của một ứng viên qua tất cả các vòng (AC 2)
   */
  async getCandidateAskedQuestionsHistory(
    candidateOrApplicationId: string,
  ): Promise<QuestionUsageRecord[]> {
    if (!candidateOrApplicationId) return [];

    try {
      const response = await axiosClient.get<QuestionUsageRecord[]>(
        `/recruitment/candidates/${encodeURIComponent(candidateOrApplicationId)}/asked-questions`,
      );

      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch {
      // Fallback
    }

    // Đọc từ LocalStorage
    const usages = this.getStoredUsages();
    return usages.filter(
      (u) =>
        u.candidateId === candidateOrApplicationId ||
        u.applicationId === candidateOrApplicationId,
    );
  },

  /**
   * Xóa sạch dữ liệu lịch sử câu hỏi (dùng trong test hoặc reset)
   */
  clearStoredUsages(): void {
    try {
      localStorage.removeItem(LOCAL_STORAGE_ASKED_QUESTIONS_KEY);
    } catch {
      // Bỏ qua
    }
  },
};

export default interviewQuestionService;

