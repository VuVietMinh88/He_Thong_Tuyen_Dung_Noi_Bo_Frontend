import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import type { PageResult } from './business.service';

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface InterviewQuestion {
  id: string;
  framework: {
    id: string;
    code: string;
    name: string;
  };
  criterion: {
    id: string;
    name: string;
  };
  content: string;
  difficulty: QuestionDifficulty;
  answerHint: string | null;
  active: boolean;
}

export interface QuestionFilterParams {
  page?: number;
  size?: number;
  keyword?: string;
  search?: string;
  positionId?: string;
  frameworkId?: string;
  criterionId?: string;
  difficulty?: QuestionDifficulty | 'ALL' | string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL' | string;
  active?: boolean;
}

export interface SaveQuestionPayload {
  id?: string | null;
  criterionId?: string;
  criterion?: {
    id: string;
    name?: string;
  };
  content: string;
  difficulty: QuestionDifficulty;
  answerHint?: string | null;
  active?: boolean;
}

/**
 * Xử lý lỗi API thông minh từ Backend
 */
export const handleQuestionApiError = (error: unknown, fallbackMessage: string): Error => {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
    ) {
      return new Error(data.message);
    }
    if (!error.response) {
      return new Error('Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra server và kết nối mạng.');
    }
    if (error.response.status === 400) {
      return new Error('Dữ liệu yêu cầu câu hỏi không hợp lệ. Vui lòng kiểm tra lại nội dung.');
    }
    if (error.response.status === 404) {
      return new Error('Không tìm thấy câu hỏi hoặc tiêu chí đánh giá trong hệ thống.');
    }
    if (error.response.status === 409) {
      return new Error('Câu hỏi này đã tồn tại trong ngân hàng câu hỏi.');
    }
    if (error.response.status === 403) {
      return new Error('Bạn không có quyền thực hiện thao tác quản trị ngân hàng câu hỏi.');
    }
  }
  return error instanceof Error ? error : new Error(fallbackMessage);
};

/**
 * Service API quản lý Ngân hàng câu hỏi phỏng vấn theo khung năng lực
 */
export const questionService = {
  /**
   * Lấy danh sách câu hỏi phỏng vấn hỗ trợ filter theo từ khóa, chức danh, tiêu chí, độ khó (AC1)
   */
  async getQuestions(params?: QuestionFilterParams): Promise<PageResult<InterviewQuestion>> {
    try {
      const page = params?.page ?? 0;
      const size = params?.size ?? 100;
      const queryParams: Record<string, string | number | boolean> = { page, size };

      const searchTerm = (params?.keyword || params?.search || '').trim();
      if (searchTerm) {
        queryParams.keyword = searchTerm;
      }

      if (params?.frameworkId && params.frameworkId !== 'ALL') {
        queryParams.frameworkId = params.frameworkId;
      }

      if (params?.positionId && params.positionId !== 'ALL') {
        queryParams.positionId = params.positionId;
      }

      if (params?.criterionId && params.criterionId !== 'ALL') {
        queryParams.criterionId = params.criterionId;
      }

      if (params?.difficulty && params.difficulty !== 'ALL') {
        queryParams.difficulty = params.difficulty;
      }

      if (params?.active !== undefined) {
        queryParams.active = params.active;
      } else if (params?.status && params.status !== 'ALL') {
        queryParams.active = params.status === 'ACTIVE';
      }

      const response = await axiosClient.get<PageResult<InterviewQuestion>>(
        '/interview-questions',
        { params: queryParams },
      );

      // Đảm bảo dữ liệu an toàn & đồng bộ filter nếu Backend trả về danh sách đầy đủ
      const items = response.data?.items ?? [];
      let filteredItems = items;

      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        filteredItems = filteredItems.filter(
          (q) =>
            q.content?.toLowerCase().includes(lower) ||
            (q.answerHint && q.answerHint.toLowerCase().includes(lower)) ||
            (q.criterion?.name && q.criterion.name.toLowerCase().includes(lower)),
        );
      }

      if (params?.frameworkId && params.frameworkId !== 'ALL') {
        filteredItems = filteredItems.filter((q) => q.framework?.id === params.frameworkId);
      }

      if (params?.criterionId && params.criterionId !== 'ALL') {
        filteredItems = filteredItems.filter((q) => q.criterion?.id === params.criterionId);
      }

      if (params?.difficulty && params.difficulty !== 'ALL') {
        filteredItems = filteredItems.filter((q) => q.difficulty === params.difficulty);
      }

      if (params?.active !== undefined) {
        filteredItems = filteredItems.filter((q) => q.active === params.active);
      } else if (params?.status && params.status !== 'ALL') {
        const targetActive = params.status === 'ACTIVE';
        filteredItems = filteredItems.filter((q) => q.active === targetActive);
      }

      return {
        ...response.data,
        items: filteredItems,
        totalElements: filteredItems.length,
      };
    } catch (error) {
      throw handleQuestionApiError(error, 'Không thể tải danh sách câu hỏi phỏng vấn.');
    }
  },

  /**
   * Lấy chi tiết một câu hỏi phỏng vấn
   */
  async getQuestionById(id: string): Promise<InterviewQuestion> {
    try {
      const response = await axiosClient.get<InterviewQuestion>(`/interview-questions/${id}`);
      return response.data;
    } catch (error) {
      throw handleQuestionApiError(error, 'Không thể tải thông tin câu hỏi phỏng vấn.');
    }
  },

  /**
   * Tạo mới hoặc cập nhật thông tin câu hỏi phỏng vấn (AC1)
   */
  async saveQuestion(data: SaveQuestionPayload): Promise<InterviewQuestion> {
    // 1. Validation client-side trước khi gửi request
    const criterionId = data.criterionId || data.criterion?.id;
    if (!criterionId) {
      throw new Error('Vui lòng chọn Tiêu chí đánh giá thuộc khung năng lực.');
    }

    const trimmedContent = data.content ? data.content.trim() : '';
    if (!trimmedContent) {
      throw new Error('Nội dung câu hỏi phỏng vấn không được để trống.');
    }
    if (trimmedContent.length < 5) {
      throw new Error('Nội dung câu hỏi quá ngắn (cần tối thiểu 5 ký tự).');
    }

    if (!['EASY', 'MEDIUM', 'HARD'].includes(data.difficulty)) {
      throw new Error('Mức độ khó của câu hỏi không hợp lệ (Dễ, Trung bình, Khó).');
    }

    const body = {
      criterionId,
      content: trimmedContent,
      difficulty: data.difficulty,
      answerHint: data.answerHint ? data.answerHint.trim() || null : null,
      active: data.active ?? true,
    };

    try {
      if (data.id) {
        const response = await axiosClient.put<InterviewQuestion>(
          `/interview-questions/${data.id}`,
          body,
        );
        return response.data;
      }
      const response = await axiosClient.post<InterviewQuestion>('/interview-questions', body);
      return response.data;
    } catch (error) {
      throw handleQuestionApiError(error, 'Không thể lưu câu hỏi phỏng vấn.');
    }
  },

  /**
   * Xóa câu hỏi khỏi ngân hàng câu hỏi
   */
  async deleteQuestion(id: string): Promise<void> {
    if (!id) {
      throw new Error('ID câu hỏi không hợp lệ.');
    }
    try {
      await axiosClient.delete<void>(`/interview-questions/${id}`);
    } catch (error) {
      throw handleQuestionApiError(error, 'Không thể xóa câu hỏi phỏng vấn.');
    }
  },
};

export default questionService;
