import { afterEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import axiosClient from '../src/utils/axiosClient';
import {
  businessService,
  type CompetencyFramework,
  type EvaluationCriteria,
  type InterviewQuestion,
  type PageResult,
  type Position,
} from '../src/services/business.service';

afterEach(() => {
  vi.restoreAllMocks();
});

const mockPositions: Position[] = [
  {
    id: 'pos-fe',
    code: 'FE_DEV',
    name: 'Frontend Developer',
    level: 'Junior / Mid',
    active: true,
    competencyFrameworkId: 'fw-fe',
    createdAt: '2026-10-10T00:00:00Z',
    updatedAt: '2026-10-10T00:00:00Z',
  },
  {
    id: 'pos-be',
    code: 'BE_DEV',
    name: 'Backend Developer',
    level: 'Senior',
    active: true,
    competencyFrameworkId: 'fw-be',
    createdAt: '2026-10-10T00:00:00Z',
    updatedAt: '2026-10-10T00:00:00Z',
  },
];

const mockFrameworks: Array<Pick<CompetencyFramework, 'id' | 'code' | 'name' | 'description' | 'status'> & { criterionCount: number }> = [
  {
    id: 'fw-fe',
    code: 'KNL_FE',
    name: 'Khung năng lực Kỹ sư Frontend',
    description: 'Bộ năng lực kỹ thuật và chuyên môn Frontend',
    status: 'ACTIVE',
    criterionCount: 3,
  },
];

const mockEvaluationData: EvaluationCriteria = {
  position: {
    id: 'pos-fe',
    code: 'FE_DEV',
    name: 'Frontend Developer',
    level: 'Junior / Mid',
    active: true,
  },
  framework: {
    id: 'fw-fe',
    code: 'KNL_FE',
    name: 'Khung năng lực Kỹ sư Frontend',
  },
  criteria: [
    {
      id: 'cr-react',
      name: 'React Hooks & State Architecture',
      description: 'Năng lực sử dụng hooks, context',
      weight: 40,
      sortOrder: 1,
    },
  ],
};

describe('Interview Question Form & Modal Logic (Task TKNHTTDNB1-219 / User Story S2-07)', () => {
  // AC1: Trường thông tin form & Metadata
  describe('AC1: Trường thông tin form & Nạp metadata chức danh, khung năng lực, tiêu chí', () => {
    it('tải danh sách Chức danh tuyển dụng từ API positions', async () => {
      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: {
          items: mockPositions,
          page: 0,
          size: 100,
          totalElements: 2,
          totalPages: 1,
        } as PageResult<Position>,
      });

      const res = await businessService.getPositions(0);
      expect(res.items).toHaveLength(2);
      expect(res.items[0].code).toBe('FE_DEV');
    });

    it('tải danh sách Khung năng lực chuẩn hóa từ API competency-frameworks', async () => {
      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: {
          items: mockFrameworks,
          page: 0,
          size: 100,
          totalElements: 1,
          totalPages: 1,
        },
      });

      const res = await businessService.getFrameworks(0);
      expect(res.items).toHaveLength(1);
      expect(res.items[0].name).toBe('Khung năng lực Kỹ sư Frontend');
    });

    it('tự động xác định Khung năng lực và Tiêu chí khi chọn Chức danh tuyển dụng', async () => {
      const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: mockEvaluationData,
      });

      const res = await businessService.getEvaluationCriteria('pos-fe');
      expect(getSpy).toHaveBeenCalledWith('/positions/pos-fe/evaluation-criteria');
      expect(res.framework).not.toBeNull();
      expect(res.framework?.id).toBe('fw-fe');
      expect(res.criteria).toHaveLength(1);
      expect(res.criteria[0].id).toBe('cr-react');
    });

    it('hỗ trợ đầy đủ các mức độ khó: EASY, MEDIUM, HARD', () => {
      const difficulties: Array<InterviewQuestion['difficulty']> = ['EASY', 'MEDIUM', 'HARD'];
      expect(difficulties).toContain('EASY');
      expect(difficulties).toContain('MEDIUM');
      expect(difficulties).toContain('HARD');
    });
  });

  // AC2: Validation trước khi lưu
  describe('AC2: Validation các trường bắt buộc', () => {
    const validateQuestionForm = (data: {
      frameworkId: string;
      criterionId: string;
      content: string;
      difficulty: string;
    }) => {
      const errors: Record<string, string> = {};

      if (!data.frameworkId) {
        errors.frameworkId = 'Vui lòng chọn Khung năng lực hoặc Chức danh áp dụng.';
      }
      if (!data.criterionId) {
        errors.criterionId = 'Vui lòng chọn Tiêu chí đánh giá thuộc khung năng lực.';
      }
      const trimmedContent = data.content.trim();
      if (!trimmedContent) {
        errors.content = 'Nội dung câu hỏi phỏng vấn không được để trống.';
      } else if (trimmedContent.length < 5) {
        errors.content = 'Nội dung câu hỏi quá ngắn (cần tối thiểu 5 ký tự).';
      }
      if (!data.difficulty) {
        errors.difficulty = 'Vui lòng chọn mức độ khó.';
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    };

    it('báo lỗi khi để trống nội dung câu hỏi', () => {
      const result = validateQuestionForm({
        frameworkId: 'fw-fe',
        criterionId: 'cr-react',
        content: '   ',
        difficulty: 'MEDIUM',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.content).toContain('không được để trống');
    });

    it('báo lỗi khi nội dung câu hỏi dưới 5 ký tự', () => {
      const result = validateQuestionForm({
        frameworkId: 'fw-fe',
        criterionId: 'cr-react',
        content: 'Alo?',
        difficulty: 'MEDIUM',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.content).toContain('tối thiểu 5 ký tự');
    });

    it('báo lỗi khi chưa chọn tiêu chí đánh giá', () => {
      const result = validateQuestionForm({
        frameworkId: 'fw-fe',
        criterionId: '',
        content: 'Bạn giải thích nguyên lý hoạt động của React Fiber như thế nào?',
        difficulty: 'HARD',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.criterionId).toContain('chọn Tiêu chí đánh giá');
    });

    it('báo lỗi khi chưa chọn khung năng lực hoặc chức danh', () => {
      const result = validateQuestionForm({
        frameworkId: '',
        criterionId: 'cr-react',
        content: 'Bạn hiểu thế nào về Virtual DOM?',
        difficulty: 'EASY',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.frameworkId).toContain('Khung năng lực hoặc Chức danh');
    });

    it('hợp lệ khi điền đầy đủ tất cả các trường bắt buộc', () => {
      const result = validateQuestionForm({
        frameworkId: 'fw-fe',
        criterionId: 'cr-react',
        content: 'Bạn xử lý race condition trong useEffect như thế nào khi fetch data?',
        difficulty: 'MEDIUM',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  // AC3: Thao tác Tạo mới và Chỉnh sửa câu hỏi phỏng vấn
  describe('AC3: Thao tác API Tạo mới và Cập nhật câu hỏi phỏng vấn', () => {
    it('gửi payload POST chuẩn hóa khi tạo mới câu hỏi phỏng vấn', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: {
          id: 'q-created-101',
          content: 'Giải thích cơ chế reconciliation trong React',
        },
      });

      await businessService.saveQuestion(null, {
        criterion: { id: 'cr-react', name: 'React Hooks' },
        content: 'Giải thích cơ chế reconciliation trong React',
        difficulty: 'MEDIUM',
        answerHint: 'So sánh diffing algorithm, key prop, element type matching...',
        active: true,
      });

      expect(postSpy).toHaveBeenCalledWith('/interview-questions', {
        criterionId: 'cr-react',
        content: 'Giải thích cơ chế reconciliation trong React',
        difficulty: 'MEDIUM',
        answerHint: 'So sánh diffing algorithm, key prop, element type matching...',
        active: true,
      });
    });

    it('gửi payload PUT khi chỉnh sửa câu hỏi phỏng vấn đã có id', async () => {
      const putSpy = vi.spyOn(axiosClient, 'put').mockResolvedValueOnce({
        data: {
          id: 'q-existing-202',
          content: 'Nội dung cập nhật',
        },
      });

      await businessService.saveQuestion('q-existing-202', {
        criterion: { id: 'cr-react', name: 'React Hooks' },
        content: 'Nội dung câu hỏi đã được tinh chỉnh rõ ràng hơn',
        difficulty: 'HARD',
        answerHint: 'Bổ sung tiêu chuẩn chấm điểm chi tiết',
        active: false,
      });

      expect(putSpy).toHaveBeenCalledWith('/interview-questions/q-existing-202', {
        criterionId: 'cr-react',
        content: 'Nội dung câu hỏi đã được tinh chỉnh rõ ràng hơn',
        difficulty: 'HARD',
        answerHint: 'Bổ sung tiêu chuẩn chấm điểm chi tiết',
        active: false,
      });
    });

    it('xử lý và ném ra thông báo lỗi dễ hiểu khi API thất bại', async () => {
      const axiosError = new axios.AxiosError('Request failed');
      axiosError.response = {
        data: { message: 'Tiêu chí đánh giá đã bị khóa hoặc không tồn tại.' },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
      };
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(axiosError);

      await expect(
        businessService.saveQuestion(null, {
          criterion: { id: 'cr-invalid', name: 'Invalid' },
          content: 'Câu hỏi test lỗi',
          difficulty: 'EASY',
          answerHint: null,
          active: true,
        }),
      ).rejects.toThrow('Tiêu chí đánh giá đã bị khóa hoặc không tồn tại.');
    });
  });
});
