import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import axiosClient from '../src/utils/axiosClient';
import {
  interviewQuestionService,
  handleInterviewQuestionError,
  InterviewQuestionApiError,
} from '../src/services/interviewQuestionService';

const storage = new Map<string, string>();

describe('interviewQuestionService (S7-02 / TKNHTTDNB1-481)', () => {
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('1. getSuggestedQuestions & enrichQuestionsWithHistory (AC 1)', () => {
    it('gọi API backend lấy danh sách câu hỏi gợi ý thành công', async () => {
      const mockApiQuestions = [
        {
          id: 'api-q-1',
          content: 'Trình bày vòng đời component trong React?',
          difficulty: 'MEDIUM' as const,
          criterionId: 'crit-fe-01',
          criterionName: 'Kiến thức Frontend',
          positionName: 'Frontend Developer',
        },
      ];

      const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({ data: mockApiQuestions });

      const result = await interviewQuestionService.getSuggestedQuestions({
        jobTitle: 'Frontend Developer',
        criteriaId: 'crit-fe-01',
        candidateId: 'cand-001',
      });

      expect(getSpy).toHaveBeenCalledWith(
        '/recruitment/interviews/suggested-questions',
        expect.objectContaining({
          params: expect.objectContaining({
            jobTitle: 'Frontend Developer',
            criteriaId: 'crit-fe-01',
            candidateId: 'cand-001',
          }),
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('api-q-1');
    });

    it('fallback lấy từ ngân hàng nội bộ khi API lỗi hoặc mất kết nối mạng', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Network error'));

      const result = await interviewQuestionService.getSuggestedQuestions({
        jobTitle: 'Frontend Developer',
      });

      expect(result.length).toBeGreaterThan(0);
      result.forEach((q) => {
        expect(
          !q.positionName ||
            q.positionName === 'Tất cả vị trí' ||
            q.positionName.toLowerCase().includes('front'),
        ).toBe(true);
      });
    });

    it('lọc chính xác theo tiêu chí năng lực (criteriaId / criterionId)', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Fallback'));

      const result = await interviewQuestionService.getSuggestedQuestions({
        criteriaId: 'crit-tech-02',
      });

      expect(result.length).toBeGreaterThan(0);
      result.forEach((q) => {
        expect(q.criterionId).toBe('crit-tech-02');
      });
    });

    it('lọc chính xác theo mức độ khó (difficulty)', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Fallback'));

      const result = await interviewQuestionService.getSuggestedQuestions({
        difficulty: 'HARD',
      });

      expect(result.length).toBeGreaterThan(0);
      result.forEach((q) => {
        expect(q.difficulty).toBe('HARD');
      });
    });

    it('tự động làm giàu (enrich) thông tin các câu hỏi đã hỏi ở vòng trước', async () => {
      // Giả lập ứng viên đã được hỏi câu 'sug-fe-01' ở 'Vòng Sàng lọc CV'
      interviewQuestionService.saveUsageToStorage({
        id: 'usage-101',
        candidateId: 'cand-vip-01',
        questionId: 'sug-fe-01',
        roundName: 'Vòng Sàng lọc CV',
        interviewerName: 'Lê Hoàng Nam',
        askedAt: '2026-10-15T09:00:00.000Z',
        score: 4.5,
        notes: 'Nắm rất vững React reconciliation.',
        createdAt: '2026-10-15T09:00:00.000Z',
      });

      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Offline'));

      const result = await interviewQuestionService.getSuggestedQuestions({
        candidateId: 'cand-vip-01',
        currentRoundName: 'Vòng Chuyên môn',
      });

      const matchedQuestion = result.find((q) => q.id === 'sug-fe-01');
      expect(matchedQuestion).toBeDefined();
      expect(matchedQuestion?.askedInPreviousRound?.isAsked).toBe(true);
      expect(matchedQuestion?.askedInPreviousRound?.roundName).toBe('Vòng Sàng lọc CV');
      expect(matchedQuestion?.askedInPreviousRound?.interviewerName).toBe('Lê Hoàng Nam');
      expect(matchedQuestion?.askedInPreviousRound?.score).toBe(4.5);
      expect(matchedQuestion?.askedInPreviousRound?.notes).toBe('Nắm rất vững React reconciliation.');
    });
  });

  describe('2. markQuestionAsAsked (AC 1 & AC 2)', () => {
    it('báo lỗi khi ID câu hỏi bị bỏ trống', async () => {
      await expect(
        interviewQuestionService.markQuestionAsAsked({
          questionId: '',
          candidateId: 'cand-1',
        }),
      ).rejects.toThrow('ID câu hỏi không được để trống.');
    });

    it('gửi request POST lên backend và lưu trữ vào LocalStorage', async () => {
      const serverRecord = {
        id: 'usage-server-123',
        questionId: 'fe-react-02',
        candidateId: 'cand-002',
        applicationId: 'app-002',
        roundName: 'Vòng Phỏng vấn Chuyên sâu',
        interviewerName: 'Trần Văn Cường',
        askedAt: '2026-10-18T10:00:00.000Z',
        createdAt: '2026-10-18T10:00:00.000Z',
      };

      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({ data: serverRecord });

      const result = await interviewQuestionService.markQuestionAsAsked({
        questionId: 'fe-react-02',
        candidateId: 'cand-002',
        applicationId: 'app-002',
        roundName: 'Vòng Phỏng vấn Chuyên sâu',
        interviewerName: 'Trần Văn Cường',
      });

      expect(postSpy).toHaveBeenCalledWith(
        '/recruitment/interviews/question-usages',
        expect.objectContaining({
          questionId: 'fe-react-02',
          candidateId: 'cand-002',
        }),
      );
      expect(result.id).toBe('usage-server-123');

      // Kiểm tra trong LocalStorage
      const stored = interviewQuestionService.getStoredUsages();
      expect(stored).toHaveLength(1);
      expect(stored[0].questionId).toBe('fe-react-02');
    });

    it('lưu trữ fallback vào LocalStorage khi máy chủ mất kết nối mạng', async () => {
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(new Error('Network disconnected'));

      const result = await interviewQuestionService.markQuestionAsAsked({
        questionId: 'be-arch-01',
        candidateId: 'cand-003',
        roundName: 'Vòng HR',
      });

      expect(result.questionId).toBe('be-arch-01');
      expect(result.roundName).toBe('Vòng HR');

      const stored = interviewQuestionService.getStoredUsages();
      expect(stored.some((u) => u.questionId === 'be-arch-01')).toBe(true);
    });

    it('ném lỗi InterviewQuestionApiError khi server trả mã lỗi 4xx/5xx', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 403,
          data: { message: 'Bạn không có quyền thực hiện thao tác này.' },
        },
      };
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(axiosError);

      await expect(
        interviewQuestionService.markQuestionAsAsked({
          questionId: 'fe-react-01',
          candidateId: 'cand-004',
        }),
      ).rejects.toThrow('Bạn không có quyền thực hiện thao tác này.');
    });
  });

  describe('3. unmarkQuestionAsAsked (AC 1 & AC 2)', () => {
    it('hoàn tác đánh dấu bằng usageId chuỗi', async () => {
      interviewQuestionService.saveUsageToStorage({
        id: 'usage-to-delete',
        questionId: 'fe-react-01',
        candidateId: 'cand-005',
        createdAt: '2026-10-18T10:00:00.000Z',
      });

      const deleteSpy = vi.spyOn(axiosClient, 'delete').mockResolvedValueOnce({ data: { success: true } });

      const success = await interviewQuestionService.unmarkQuestionAsAsked('usage-to-delete');

      expect(deleteSpy).toHaveBeenCalledWith('/recruitment/interviews/question-usages/usage-to-delete');
      expect(success).toBe(true);

      const stored = interviewQuestionService.getStoredUsages();
      expect(stored.find((u) => u.id === 'usage-to-delete')).toBeUndefined();
    });

    it('hoàn tác đánh dấu bằng object { questionId, candidateId }', async () => {
      interviewQuestionService.saveUsageToStorage({
        id: 'usage-to-delete-obj',
        questionId: 'fe-react-03',
        candidateId: 'cand-006',
        createdAt: '2026-10-18T10:00:00.000Z',
      });

      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({ data: { success: true } });

      const success = await interviewQuestionService.unmarkQuestionAsAsked({
        questionId: 'fe-react-03',
        candidateId: 'cand-006',
      });

      expect(postSpy).toHaveBeenCalledWith('/recruitment/interviews/question-usages/unmark', {
        questionId: 'fe-react-03',
        candidateId: 'cand-006',
      });
      expect(success).toBe(true);

      const stored = interviewQuestionService.getStoredUsages();
      expect(stored.find((u) => u.questionId === 'fe-react-03' && u.candidateId === 'cand-006')).toBeUndefined();
    });
  });

  describe('4. getCandidateAskedQuestionsHistory (AC 2)', () => {
    it('lấy lịch sử câu hỏi đã hỏi từ API Backend', async () => {
      const mockHistory = [
        {
          id: 'usage-h1',
          questionId: 'fe-react-01',
          candidateId: 'cand-hist-01',
          roundName: 'Vòng 1',
          createdAt: '2026-10-10T10:00:00.000Z',
        },
      ];
      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({ data: mockHistory });

      const history = await interviewQuestionService.getCandidateAskedQuestionsHistory('cand-hist-01');
      expect(history).toEqual(mockHistory);
    });

    it('fallback lấy từ LocalStorage khi API lỗi', async () => {
      interviewQuestionService.saveUsageToStorage({
        id: 'usage-local-h1',
        questionId: 'fe-react-02',
        candidateId: 'cand-hist-02',
        roundName: 'Vòng 1',
        createdAt: '2026-10-10T10:00:00.000Z',
      });

      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Failed'));

      const history = await interviewQuestionService.getCandidateAskedQuestionsHistory('cand-hist-02');
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('usage-local-h1');
    });

    it('trả về mảng rỗng nếu candidateId rỗng', async () => {
      const history = await interviewQuestionService.getCandidateAskedQuestionsHistory('');
      expect(history).toEqual([]);
    });
  });

  describe('5. handleInterviewQuestionError & Error Formatting (AC 1 & AC 2)', () => {
    it('trả về message chi tiết từ server nếu có', () => {
      const axiosErr = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: 'Tiêu chí đánh giá không tồn tại trong hệ thống.' },
        },
      };
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const err = handleInterviewQuestionError(axiosErr, 'Lỗi mặc định');
      expect(err.message).toBe('Tiêu chí đánh giá không tồn tại trong hệ thống.');
      expect((err as InterviewQuestionApiError).statusCode).toBe(400);
    });

    it('trả về thông báo lỗi kết nối mạng khi không có response', () => {
      const axiosErr = {
        isAxiosError: true,
      };
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const err = handleInterviewQuestionError(axiosErr, 'Lỗi mặc định');
      expect(err.message).toContain('Không thể kết nối đến máy chủ');
    });

    it('chuyển đổi chuẩn xác các mã trạng thái HTTP phổ biến (400, 401, 403, 404, 500)', () => {
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const err400 = handleInterviewQuestionError({ isAxiosError: true, response: { status: 400 } }, '');
      expect(err400.message).toContain('không hợp lệ');

      const err401 = handleInterviewQuestionError({ isAxiosError: true, response: { status: 401 } }, '');
      expect(err401.message).toContain('Phiên làm việc đã hết hạn');

      const err403 = handleInterviewQuestionError({ isAxiosError: true, response: { status: 403 } }, '');
      expect(err403.message).toContain('không có quyền');

      const err404 = handleInterviewQuestionError({ isAxiosError: true, response: { status: 404 } }, '');
      expect(err404.message).toContain('Không tìm thấy');

      const err500 = handleInterviewQuestionError({ isAxiosError: true, response: { status: 500 } }, '');
      expect(err500.message).toContain('máy chủ gặp sự cố');
    });

    it('giữ nguyên Error instance nếu không phải AxiosError', () => {
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);
      const regularErr = new Error('Custom JS Error');

      const err = handleInterviewQuestionError(regularErr, 'Fallback');
      expect(err.message).toBe('Custom JS Error');
    });
  });
});
