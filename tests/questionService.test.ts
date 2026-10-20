import { afterEach, describe, expect, it, vi } from 'vitest';
import { AxiosError } from 'axios';
import axiosClient from '../src/utils/axiosClient';
import {
  questionService,
  handleQuestionApiError,
  type InterviewQuestion,
} from '../src/services/questionService';
import type { PageResult } from '../src/services/business.service';

afterEach(() => {
  vi.restoreAllMocks();
});

const mockQuestions: InterviewQuestion[] = [
  {
    id: 'q-fe-1',
    framework: { id: 'fw-fe', code: 'FE_DEV', name: 'Khung năng lực Frontend' },
    criterion: { id: 'cr-react', name: 'React Hooks & State Architecture' },
    content: 'Giải thích cơ chế Virtual DOM và Reconciliation trong React 18/19?',
    difficulty: 'MEDIUM',
    answerHint: 'Phân tích Fiber tree, diffing algorithm, batching updates tự động.',
    active: true,
  },
  {
    id: 'q-fe-2',
    framework: { id: 'fw-fe', code: 'FE_DEV', name: 'Khung năng lực Frontend' },
    criterion: { id: 'cr-css', name: 'CSS & Tailwind Responsive' },
    content: 'Làm thế nào để xây dựng responsive container query trong Tailwind CSS?',
    difficulty: 'EASY',
    answerHint: 'Sử dụng plugin @container và utility classes chuẩn.',
    active: true,
  },
  {
    id: 'q-be-1',
    framework: { id: 'fw-be', code: 'BE_DEV', name: 'Khung năng lực Backend' },
    criterion: { id: 'cr-db', name: 'Tối ưu cơ sở dữ liệu & Transaction' },
    content: 'Cách giải quyết Deadlock trong hệ quản trị cơ sở dữ liệu quan hệ PostgreSQL/MySQL?',
    difficulty: 'HARD',
    answerHint: 'Khóa theo thứ tự cố định, giảm thời gian transaction, dùng isolation levels phù hợp.',
    active: false,
  },
];

describe('Question Service API Integration (Task Jira TKNHTTDNB1-224 / User Story S2-07)', () => {
  // AC1: getQuestions(params) - Lấy danh sách câu hỏi kèm query parameters
  describe('AC1: questionService.getQuestions(params)', () => {
    it('gửi request GET /interview-questions với các query params tương ứng', async () => {
      const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: {
          items: mockQuestions,
          page: 0,
          size: 100,
          totalElements: 3,
          totalPages: 1,
        } as PageResult<InterviewQuestion>,
      });

      const res = await questionService.getQuestions({
        keyword: 'Reconciliation',
        frameworkId: 'fw-fe',
        criterionId: 'cr-react',
        difficulty: 'MEDIUM',
        status: 'ACTIVE',
      });

      expect(getSpy).toHaveBeenCalledWith('/interview-questions', {
        params: {
          page: 0,
          size: 100,
          keyword: 'Reconciliation',
          frameworkId: 'fw-fe',
          criterionId: 'cr-react',
          difficulty: 'MEDIUM',
          active: true,
        },
      });

      expect(res.items).toHaveLength(1);
      expect(res.items[0].id).toBe('q-fe-1');
    });

    it('lọc danh sách câu hỏi theo từ khóa trong nội dung hoặc gợi ý trả lời', async () => {
      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: {
          items: mockQuestions,
          page: 0,
          size: 100,
          totalElements: 3,
          totalPages: 1,
        },
      });

      const res = await questionService.getQuestions({
        keyword: 'Deadlock',
      });

      expect(res.items).toHaveLength(1);
      expect(res.items[0].id).toBe('q-be-1');
    });

    it('lọc danh sách câu hỏi theo Mức độ khó (EASY, MEDIUM, HARD)', async () => {
      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: {
          items: mockQuestions,
          page: 0,
          size: 100,
          totalElements: 3,
          totalPages: 1,
        },
      });

      const res = await questionService.getQuestions({
        difficulty: 'EASY',
      });

      expect(res.items).toHaveLength(1);
      expect(res.items[0].id).toBe('q-fe-2');
    });

    it('lọc danh sách câu hỏi theo Tiêu chí và Khung năng lực', async () => {
      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: {
          items: mockQuestions,
          page: 0,
          size: 100,
          totalElements: 3,
          totalPages: 1,
        },
      });

      const res = await questionService.getQuestions({
        frameworkId: 'fw-fe',
        criterionId: 'cr-css',
      });

      expect(res.items).toHaveLength(1);
      expect(res.items[0].id).toBe('q-fe-2');
    });

    it('lấy chi tiết một câu hỏi bằng getQuestionById', async () => {
      const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: mockQuestions[0],
      });

      const result = await questionService.getQuestionById('q-fe-1');
      expect(getSpy).toHaveBeenCalledWith('/interview-questions/q-fe-1');
      expect(result.id).toBe('q-fe-1');
    });
  });

  // AC1: saveQuestion(data) - Tạo mới và Cập nhật câu hỏi
  describe('AC1: questionService.saveQuestion(data)', () => {
    it('gửi request POST /interview-questions khi tạo mới câu hỏi phỏng vấn', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: {
          id: 'q-new-1',
          content: 'Nội dung câu hỏi mới',
        },
      });

      const payload = {
        criterionId: 'cr-react',
        content: 'Trình bày cách sử dụng useSyncExternalStore trong React?',
        difficulty: 'HARD' as const,
        answerHint: 'Dùng cho custom external stores đồng bộ an toàn với concurrent mode.',
        active: true,
      };

      const created = await questionService.saveQuestion(payload);

      expect(postSpy).toHaveBeenCalledWith('/interview-questions', {
        criterionId: 'cr-react',
        content: 'Trình bày cách sử dụng useSyncExternalStore trong React?',
        difficulty: 'HARD',
        answerHint: 'Dùng cho custom external stores đồng bộ an toàn với concurrent mode.',
        active: true,
      });
      expect(created.id).toBe('q-new-1');
    });

    it('gửi request PUT /interview-questions/{id} khi cập nhật câu hỏi phỏng vấn có sẵn', async () => {
      const putSpy = vi.spyOn(axiosClient, 'put').mockResolvedValueOnce({
        data: {
          id: 'q-fe-1',
          content: 'Nội dung cập nhật',
        },
      });

      const payload = {
        id: 'q-fe-1',
        criterionId: 'cr-react',
        content: 'Nội dung câu hỏi đã được cập nhật',
        difficulty: 'MEDIUM' as const,
        answerHint: 'Gợi ý cập nhật',
        active: true,
      };

      const updated = await questionService.saveQuestion(payload);

      expect(putSpy).toHaveBeenCalledWith('/interview-questions/q-fe-1', {
        criterionId: 'cr-react',
        content: 'Nội dung câu hỏi đã được cập nhật',
        difficulty: 'MEDIUM',
        answerHint: 'Gợi ý cập nhật',
        active: true,
      });
      expect(updated.id).toBe('q-fe-1');
    });

    it('ném lỗi validation client khi thiếu tiêu chí đánh giá', async () => {
      await expect(
        questionService.saveQuestion({
          criterionId: '',
          content: 'Nội dung câu hỏi hợp lệ dài hơn 5 ký tự',
          difficulty: 'MEDIUM',
        }),
      ).rejects.toThrow('Vui lòng chọn Tiêu chí đánh giá thuộc khung năng lực.');
    });

    it('ném lỗi validation client khi nội dung câu hỏi rỗng hoặc dưới 5 ký tự', async () => {
      await expect(
        questionService.saveQuestion({
          criterionId: 'cr-1',
          content: '   ',
          difficulty: 'EASY',
        }),
      ).rejects.toThrow('Nội dung câu hỏi phỏng vấn không được để trống.');

      await expect(
        questionService.saveQuestion({
          criterionId: 'cr-1',
          content: 'Test',
          difficulty: 'EASY',
        }),
      ).rejects.toThrow('Nội dung câu hỏi quá ngắn (cần tối thiểu 5 ký tự).');
    });

    it('ném lỗi validation client khi mức độ khó không hợp lệ', async () => {
      await expect(
        questionService.saveQuestion({
          criterionId: 'cr-1',
          content: 'Nội dung câu hỏi hợp lệ',
          difficulty: 'INVALID' as any,
        }),
      ).rejects.toThrow('Mức độ khó của câu hỏi không hợp lệ');
    });
  });

  // AC1: deleteQuestion(id)
  describe('AC1: questionService.deleteQuestion(id)', () => {
    it('gửi request DELETE /interview-questions/{id}', async () => {
      const deleteSpy = vi.spyOn(axiosClient, 'delete').mockResolvedValueOnce({
        data: undefined,
      });

      await questionService.deleteQuestion('q-delete-999');
      expect(deleteSpy).toHaveBeenCalledWith('/interview-questions/q-delete-999');
    });

    it('ném lỗi khi truyền id rỗng', async () => {
      await expect(questionService.deleteQuestion('')).rejects.toThrow('ID câu hỏi không hợp lệ.');
    });
  });

  // AC2: Xử lý lỗi API thông minh (handleQuestionApiError)
  describe('AC2: Bắt lỗi response thông minh', () => {
    it('trích xuất message từ backend response data', () => {
      const err = new AxiosError('Request failed');
      err.response = {
        data: { message: 'Tiêu chí đánh giá không thuộc khung năng lực đã chọn.' },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
      };

      const result = handleQuestionApiError(err, 'Lỗi mặc định');
      expect(result.message).toBe('Tiêu chí đánh giá không thuộc khung năng lực đã chọn.');
    });

    it('xử lý lỗi khi mất kết nối mạng / không có response', () => {
      const err = new AxiosError('Network Error');
      err.response = undefined;

      const result = handleQuestionApiError(err, 'Lỗi mặc định');
      expect(result.message).toContain('Không thể kết nối đến máy chủ Backend');
    });

    it('xử lý lỗi 404 Không tìm thấy câu hỏi', () => {
      const err = new AxiosError('Not Found');
      err.response = {
        data: {},
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {} as any,
      };

      const result = handleQuestionApiError(err, 'Lỗi mặc định');
      expect(result.message).toContain('Không tìm thấy câu hỏi hoặc tiêu chí');
    });

    it('xử lý lỗi 409 Trùng lặp câu hỏi', () => {
      const err = new AxiosError('Conflict');
      err.response = {
        data: {},
        status: 409,
        statusText: 'Conflict',
        headers: {},
        config: {} as any,
      };

      const result = handleQuestionApiError(err, 'Lỗi mặc định');
      expect(result.message).toContain('Câu hỏi này đã tồn tại');
    });
  });
});
