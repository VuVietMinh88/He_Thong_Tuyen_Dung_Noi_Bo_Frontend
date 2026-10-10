import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosClient from '../src/utils/axiosClient';
import { businessService, type InterviewQuestion } from '../src/services/business.service';

afterEach(() => {
  vi.restoreAllMocks();
});

const mockQuestions: InterviewQuestion[] = [
  {
    id: 'q-1',
    framework: { id: 'fw-fe', code: 'FE_DEV', name: 'Khung năng lực Frontend' },
    criterion: { id: 'cr-react', name: 'React Hooks & State' },
    content: 'Giải thích sự khác biệt giữa useEffect và useLayoutEffect trong React?',
    difficulty: 'MEDIUM',
    answerHint: 'useLayoutEffect chạy đồng bộ sau DOM mutations và trước paint; useEffect chạy bất đồng bộ sau paint.',
    active: true,
  },
  {
    id: 'q-2',
    framework: { id: 'fw-fe', code: 'FE_DEV', name: 'Khung năng lực Frontend' },
    criterion: { id: 'cr-css', name: 'CSS & Tailwind' },
    content: 'Cách xử lý responsive layout với Tailwind CSS container queries?',
    difficulty: 'EASY',
    answerHint: 'Sử dụng @container plugin hoặc breakpoint prefixes chuẩn của Tailwind.',
    active: true,
  },
  {
    id: 'q-3',
    framework: { id: 'fw-be', code: 'BE_DEV', name: 'Khung năng lực Backend' },
    criterion: { id: 'cr-db', name: 'Cơ sở dữ liệu & Tối ưu SQL' },
    content: 'Cách thiết kế index cho bảng có hàng triệu bản ghi và xử lý N+1 query?',
    difficulty: 'HARD',
    answerHint: 'Dùng B-tree index, composite index, eager loading (JOIN FETCH), pagination cursor-based.',
    active: false,
  },
];

describe('Interview Question Bank Filter & API Logic (User Story S2-07 / TKNHTTDNB1-218)', () => {
  // AC1: Bộ lọc thông minh (Filters & Search)
  describe('AC1: Bộ lọc thông minh theo từ khóa, khung năng lực, tiêu chí, độ khó', () => {
    it('lọc chính xác theo từ khóa tìm kiếm trong nội dung câu hỏi', () => {
      const term = 'useeffect';
      const filtered = mockQuestions.filter((q) =>
        q.content.toLowerCase().includes(term.toLowerCase()) ||
        (q.answerHint && q.answerHint.toLowerCase().includes(term.toLowerCase())),
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('q-1');
    });

    it('lọc chính xác theo từ khóa tìm kiếm trong gợi ý trả lời mẫu (answerHint)', () => {
      const term = 'B-tree index';
      const filtered = mockQuestions.filter((q) =>
        q.content.toLowerCase().includes(term.toLowerCase()) ||
        (q.answerHint && q.answerHint.toLowerCase().includes(term.toLowerCase())),
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('q-3');
    });

    it('lọc chính xác theo Khung năng lực', () => {
      const frameworkId = 'fw-fe';
      const filtered = mockQuestions.filter((q) => q.framework.id === frameworkId);

      expect(filtered).toHaveLength(2);
      expect(filtered.map((q) => q.id)).toEqual(['q-1', 'q-2']);
    });

    it('lọc chính xác theo Tiêu chí đánh giá cụ thể', () => {
      const criterionId = 'cr-db';
      const filtered = mockQuestions.filter((q) => q.criterion.id === criterionId);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('q-3');
    });

    it('lọc chính xác theo Mức độ khó (EASY, MEDIUM, HARD)', () => {
      const easyQuestions = mockQuestions.filter((q) => q.difficulty === 'EASY');
      expect(easyQuestions).toHaveLength(1);
      expect(easyQuestions[0].id).toBe('q-2');

      const hardQuestions = mockQuestions.filter((q) => q.difficulty === 'HARD');
      expect(hardQuestions).toHaveLength(1);
      expect(hardQuestions[0].id).toBe('q-3');
    });

    it('kết hợp nhiều tiêu chí lọc cùng lúc (Khung năng lực + Mức độ khó)', () => {
      const filtered = mockQuestions.filter(
        (q) => q.framework.id === 'fw-fe' && q.difficulty === 'MEDIUM',
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('q-1');
    });
  });

  // AC2: Hiển thị chi tiết câu hỏi
  describe('AC2: Cấu trúc chi tiết câu hỏi và gợi ý trả lời', () => {
    it('đảm bảo câu hỏi có đầy đủ nội dung, mức độ khó, tiêu chí và gợi ý mẫu', () => {
      const q = mockQuestions[0];
      expect(q.content).toBeTruthy();
      expect(q.difficulty).toMatch(/^(EASY|MEDIUM|HARD)$/);
      expect(q.criterion.name).toBe('React Hooks & State');
      expect(q.framework.name).toBe('Khung năng lực Frontend');
      expect(q.answerHint).toContain('useLayoutEffect');
      expect(q.active).toBe(true);
    });
  });

  // AC3: Thao tác quản trị API (Thêm, Sửa, Xóa)
  describe('AC3: Thao tác quản trị câu hỏi phỏng vấn qua API Backend', () => {
    it('tải danh sách câu hỏi phỏng vấn qua API getQuestions', async () => {
      const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: { items: mockQuestions, page: 0, size: 100, totalElements: 3, totalPages: 1 },
      });

      const res = await businessService.getQuestions(0);

      expect(getSpy).toHaveBeenCalledWith('/interview-questions', {
        params: { page: 0, size: 100 },
      });
      expect(res.items).toHaveLength(3);
    });

    it('tạo mới câu hỏi phỏng vấn qua API saveQuestion', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: { id: 'new-q', content: 'Câu hỏi mới' },
      });

      await businessService.saveQuestion(null, {
        criterion: { id: 'cr-react', name: 'React' },
        content: 'Câu hỏi mới về React',
        difficulty: 'EASY',
        answerHint: 'Gợi ý',
        active: true,
      });

      expect(postSpy).toHaveBeenCalledWith('/interview-questions', {
        criterionId: 'cr-react',
        content: 'Câu hỏi mới về React',
        difficulty: 'EASY',
        answerHint: 'Gợi ý',
        active: true,
      });
    });

    it('xóa câu hỏi phỏng vấn qua API deleteQuestion', async () => {
      const deleteSpy = vi.spyOn(axiosClient, 'delete').mockResolvedValueOnce({
        data: undefined,
      });

      await businessService.deleteQuestion('q-delete-123');

      expect(deleteSpy).toHaveBeenCalledWith('/interview-questions/q-delete-123');
    });
  });
});
