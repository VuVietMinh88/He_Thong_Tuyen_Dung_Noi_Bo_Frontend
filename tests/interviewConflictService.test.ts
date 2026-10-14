import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import axios from 'axios';
import axiosClient from '../src/utils/axiosClient';
import {
  interviewConflictService,
} from '../src/services/interviewConflictService';
import {
  InterviewConflictForbiddenError,
  InterviewConflictUnauthorizedError,
  InterviewConflictValidationError,
  InterviewApiError,
  type OverrideInterviewPayload,
  type InterviewConflictCheckResult,
} from '../src/types/interview';
import {
  LOCAL_STORAGE_INTERVIEWS_KEY,
  LOCAL_STORAGE_TIMELINE_KEY,
} from '../src/services/interviewService';
import { InterviewConflictModal } from '../src/components/Candidate/InterviewConflictModal';

const storage = new Map<string, string>();

describe('TKNHTTDNB1-440 / S6-04: Tích hợp cho phép ghi đè xung đột có lý do', () => {
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

  const validPayload: OverrideInterviewPayload = {
    applicationId: 'app-override-001',
    candidateId: 'can-override-001',
    candidateName: 'Đặng Tuấn Anh',
    candidateEmail: 'anh.dang@smartrecruitment.vn',
    jobTitle: 'Senior Software Engineer',
    interviewRound: 'Vòng Kỹ thuật & Chuyên môn',
    startTime: '2026-11-25T14:00:00+07:00',
    interviewDate: '2026-11-25',
    interviewTime: '14:00',
    durationMinutes: 60,
    interviewType: 'OFFLINE',
    format: 'OFFLINE',
    locationOrLink: 'Phòng họp Lotus - Tầng 8',
    interviewerIds: ['usr-001', 'usr-002'],
    overrideConflict: true,
    isOverride: true,
    overrideReason: 'Đã có thỏa thuận ưu tiên phòng họp với Ban Giám đốc khối Tech.',
  };

  describe('1. Kiểm tra validation lý do bắt buộc (Client-side Validation)', () => {
    it('ném InterviewConflictValidationError khi thiếu applicationId', async () => {
      const invalid = { ...validPayload, applicationId: '' };
      await expect(interviewConflictService.overrideInterviewConflict(invalid)).rejects.toThrow(
        InterviewConflictValidationError,
      );
    });

    it('ném InterviewConflictValidationError khi lý do ghi đè để trống', async () => {
      const emptyReason = { ...validPayload, overrideReason: '   ' };
      await expect(interviewConflictService.overrideInterviewConflict(emptyReason)).rejects.toThrow(
        InterviewConflictValidationError,
      );
      await expect(interviewConflictService.overrideInterviewConflict(emptyReason)).rejects.toThrow(
        /không được để trống/i,
      );
    });

    it('ném InterviewConflictValidationError khi lý do ghi đè dưới 5 ký tự', async () => {
      const shortReason = { ...validPayload, overrideReason: 'abc' };
      await expect(interviewConflictService.overrideInterviewConflict(shortReason)).rejects.toThrow(
        InterviewConflictValidationError,
      );
      await expect(interviewConflictService.overrideInterviewConflict(shortReason)).rejects.toThrow(
        /tối thiểu 5 ký tự/i,
      );
    });
  });

  describe('2. Thực thi ghi đè thành công và lưu trữ (overrideInterviewConflict)', () => {
    it('gọi API thành công, lưu vào LocalStorage và đồng bộ Timeline sự kiện ghi đè', async () => {
      vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: {
          id: 'intv-ovr-saved-01',
          applicationId: 'app-override-001',
          roundName: 'Vòng Kỹ thuật & Chuyên môn',
          isOverride: true,
          overrideReason: 'Đã có thỏa thuận ưu tiên phòng họp với Ban Giám đốc khối Tech.',
        },
      });

      const result = await interviewConflictService.overrideInterviewConflict(validPayload);

      expect(result).toBeDefined();
      expect(result.isOverride).toBe(true);
      expect(result.overrideReason).toBe(validPayload.overrideReason);

      // Kiểm tra lưu vào LocalStorage
      const stored = JSON.parse(storage.get(LOCAL_STORAGE_INTERVIEWS_KEY) || '[]');
      expect(stored.some((i: { isOverride?: boolean }) => i.isOverride === true)).toBe(true);

      // Kiểm tra đồng bộ vào Timeline
      const timeline = JSON.parse(storage.get(LOCAL_STORAGE_TIMELINE_KEY) || '[]');
      const overrideEvent = timeline.find((e: { eventType: string }) => e.eventType === 'INTERVIEW_OVERRIDE');
      expect(overrideEvent).toBeDefined();
      expect(overrideEvent?.title).toContain('Ghi đè lịch phỏng vấn');

      // Kiểm tra getOverrideHistory
      const history = interviewConflictService.getOverrideHistory();
      expect(history.length).toBeGreaterThanOrEqual(1);
    });

    it('fallback lưu dữ liệu offline khi mạng lỗi hoặc máy chủ chưa sẵn sàng', async () => {
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(new Error('Network disconnected'));

      const result = await interviewConflictService.overrideInterviewConflict(validPayload);

      expect(result).toBeDefined();
      expect(result.candidateName).toBe('Đặng Tuấn Anh');
      expect(result.isOverride).toBe(true);
      expect(result.overrideReason).toBe(validPayload.overrideReason);
    });
  });

  describe('3. Xử lý các mã lỗi phản hồi từ máy chủ (403, 401, 400, 500)', () => {
    it('bắt lỗi 403 Forbidden và ném InterviewConflictForbiddenError khi tài khoản không có quyền ghi đè', async () => {
      const axiosError = new axios.AxiosError('Forbidden');
      axiosError.response = {
        status: 403,
        statusText: 'Forbidden',
        data: {
          code: 'FORBIDDEN',
          message: 'Tài khoản không có quyền thực hiện hành động ghi đè ngoại lệ.',
        },
        headers: {},
        config: {} as any,
      };

      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(axiosError);

      await expect(
        interviewConflictService.overrideInterviewConflict(validPayload),
      ).rejects.toThrow(InterviewConflictForbiddenError);

      try {
        await interviewConflictService.overrideInterviewConflict(validPayload);
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(InterviewConflictForbiddenError);
        const forbiddenErr = err as InterviewConflictForbiddenError;
        expect(forbiddenErr.statusCode).toBe(403);
        expect(forbiddenErr.message).toContain('không có quyền thực hiện hành động ghi đè');
      }
    });

    it('bắt lỗi 401 Unauthorized và ném InterviewConflictUnauthorizedError khi phiên đăng nhập hết hạn', async () => {
      const axiosError = new axios.AxiosError('Unauthorized');
      axiosError.response = {
        status: 401,
        statusText: 'Unauthorized',
        data: {
          code: 'UNAUTHORIZED',
          message: 'Phiên làm việc đã hết hạn hoặc chưa được xác thực.',
        },
        headers: {},
        config: {} as any,
      };

      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(axiosError);

      await expect(
        interviewConflictService.overrideInterviewConflict(validPayload),
      ).rejects.toThrow(InterviewConflictUnauthorizedError);
    });

    it('bắt lỗi 400 Bad Request từ Backend và ném InterviewConflictValidationError', async () => {
      const axiosError = new axios.AxiosError('Bad Request');
      axiosError.response = {
        status: 400,
        statusText: 'Bad Request',
        data: {
          code: 'MISSING_OVERRIDE_REASON',
          message: 'Lý do ghi đè lịch phỏng vấn là bắt buộc và phải có ít nhất 5 ký tự.',
        },
        headers: {},
        config: {} as any,
      };

      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(axiosError);

      await expect(
        interviewConflictService.overrideInterviewConflict(validPayload),
      ).rejects.toThrow(InterviewConflictValidationError);
    });

    it('bắt lỗi 500 Server Error và ném InterviewApiError', async () => {
      const axiosError = new axios.AxiosError('Internal Server Error');
      axiosError.response = {
        status: 500,
        statusText: 'Internal Server Error',
        data: {
          code: 'DATABASE_ERROR',
          message: 'Lỗi máy chủ khi lưu lịch ghi đè.',
        },
        headers: {},
        config: {} as any,
      };

      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(axiosError);

      await expect(
        interviewConflictService.overrideInterviewConflict(validPayload),
      ).rejects.toThrow(InterviewApiError);
    });
  });

  describe('4. Component InterviewConflictModal (Kiểm tra giao diện ghi đè AC 2)', () => {
    const mockConflict: InterviewConflictCheckResult = {
      hasConflict: true,
      conflictType: 'INTERVIEWER_CONFLICT',
      conflicts: [
        {
          type: 'INTERVIEWER',
          entityName: 'Nguyễn Văn Hải',
          reason: 'Người phỏng vấn đã có lịch bận.',
          conflictingInterview: {
            id: 'old-1',
            candidateName: 'Trần Văn C',
            jobTitle: 'Backend Dev',
            roundName: 'Vòng Kỹ thuật',
            interviewDate: '2026-11-25',
            startTime: '14:00',
            endTime: '15:00',
            durationMinutes: 60,
            format: 'ONLINE',
            locationOrLink: 'https://meet.google.com/xyz',
          },
        },
      ],
      proposedInterview: {
        candidateName: 'Đặng Tuấn Anh',
        jobTitle: 'Senior Software Engineer',
        roundName: 'Vòng Kỹ thuật',
        interviewDate: '2026-11-25',
        startTime: '14:00',
        endTime: '15:00',
        durationMinutes: 60,
        format: 'ONLINE',
        locationOrLink: 'https://meet.google.com/xyz',
      },
    };

    it('khởi tạo phần tử modal có props errorMessage và isSubmitting', () => {
      const element = React.createElement(InterviewConflictModal, {
        isOpen: true,
        onClose: vi.fn(),
        conflictResult: mockConflict,
        onConfirmOverride: vi.fn(),
        isSubmitting: true,
        errorMessage: 'Tài khoản của bạn không có quyền ghi đè ngoại lệ (403 Forbidden).',
      });

      expect(React.isValidElement(element)).toBe(true);
      expect(element.props.isOpen).toBe(true);
      expect(element.props.isSubmitting).toBe(true);
      expect(element.props.errorMessage).toContain('403 Forbidden');
    });
  });
});

