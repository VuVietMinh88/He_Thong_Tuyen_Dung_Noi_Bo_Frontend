import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import axios from 'axios';
import axiosClient from '../src/utils/axiosClient';
import {
  interviewService,
  validateIsoStartTime,
  LOCAL_STORAGE_INTERVIEWS_KEY,
  LOCAL_STORAGE_TIMELINE_KEY,
} from '../src/services/interviewService';
import {
  InterviewPastTimeError,
  InterviewerConflictError,
  InterviewApiError,
  type CreateInterviewSchedulePayload,
} from '../src/types/interview';
import { CandidateInterviewsList } from '../src/components/Candidate/CandidateInterviewsList';
import { PersonalInterviewSchedulePage } from '../src/pages/Interview/PersonalInterviewSchedulePage';

const storage = new Map<string, string>();

describe('TKNHTTDNB1-427 / S6-02: Tích hợp tạo lịch và hiển thị trên hồ sơ/lịch cá nhân', () => {
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

  describe('AC 1 & AC 2: createInterviewSchedule & Kiểm tra thời gian quá khứ', () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const validStartTime = `${futureDate}T09:30:00+07:00`;

    const samplePayload: CreateInterviewSchedulePayload = {
      applicationId: 'app-itv-101',
      candidateId: 'can-itv-101',
      candidateName: 'Nguyễn Hoàng Nam',
      candidateEmail: 'nam.nguyen@gmail.com',
      jobTitle: 'Senior Frontend Engineer',
      interviewRound: 'Vòng Kỹ thuật & Chuyên môn',
      startTime: validStartTime,
      durationMinutes: 60,
      interviewType: 'ONLINE',
      locationOrLink: 'https://meet.google.com/abc-defg-hij',
      interviewerIds: ['usr-001', 'usr-003'],
      notes: 'Yêu cầu ứng viên chuẩn bị máy tính làm live-coding',
    };

    it('validateIsoStartTime: từ chối thời gian bắt đầu trong quá khứ', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const pastResult = validateIsoStartTime(yesterday);

      expect(pastResult.isValid).toBe(false);
      expect(pastResult.error).toContain('quá khứ theo múi giờ Việt Nam (GMT+7)');

      const futureResult = validateIsoStartTime(validStartTime);
      expect(futureResult.isValid).toBe(true);
      expect(futureResult.error).toBeUndefined();
    });

    it('chặn ngay tại client và ném InterviewPastTimeError khi người dùng chọn giờ trong quá khứ (không gửi request)', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post');
      const yesterdayIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      await expect(
        interviewService.createInterviewSchedule({
          ...samplePayload,
          startTime: yesterdayIso,
        }),
      ).rejects.toThrow(InterviewPastTimeError);

      // Tuyệt đối không gọi axiosClient.post
      expect(postSpy).not.toHaveBeenCalled();
    });

    it('báo lỗi khi thiếu applicationId, vòng phỏng vấn, link họp hoặc người phỏng vấn', async () => {
      // Thiếu applicationId
      await expect(
        interviewService.createInterviewSchedule({
          ...samplePayload,
          applicationId: '',
        }),
      ).rejects.toThrow('applicationId');

      // Thiếu vòng phỏng vấn
      await expect(
        interviewService.createInterviewSchedule({
          ...samplePayload,
          interviewRound: '',
        }),
      ).rejects.toThrow('vòng phỏng vấn');

      // Thiếu địa điểm / link
      await expect(
        interviewService.createInterviewSchedule({
          ...samplePayload,
          locationOrLink: '',
        }),
      ).rejects.toThrow('liên kết họp');

      // Thiếu người phỏng vấn
      await expect(
        interviewService.createInterviewSchedule({
          ...samplePayload,
          interviewerIds: [],
        }),
      ).rejects.toThrow('người phỏng vấn');
    });

    it('gọi axiosClient.post đến endpoint backend khi dữ liệu hợp lệ', async () => {
      const mockBackendResponse = {
        id: 'intv-server-001',
        applicationId: 'app-itv-101',
        candidateId: 'can-itv-101',
        candidateName: 'Nguyễn Hoàng Nam',
        roundName: 'Vòng Kỹ thuật & Chuyên môn',
        startTime: validStartTime,
        durationMinutes: 60,
        format: 'ONLINE',
        locationOrLink: 'https://meet.google.com/abc-defg-hij',
        interviewers: [{ id: 'usr-001', name: 'Nguyễn Văn Hải', role: 'Engineering Manager', email: 'hai@test.com' }],
        status: 'SCHEDULED',
      };

      vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({ data: mockBackendResponse });

      const result = await interviewService.createInterviewSchedule(samplePayload);

      expect(axiosClient.post).toHaveBeenCalledWith(
        '/recruitment/applications/app-itv-101/interviews',
        expect.objectContaining({
          applicationId: 'app-itv-101',
          interviewRound: 'Vòng Kỹ thuật & Chuyên môn',
          startTime: validStartTime,
          interviewerIds: ['usr-001', 'usr-003'],
        }),
      );

      expect(result.id).toBe('intv-server-001');

      // Kiểm tra lưu vào LocalStorage và Timeline
      const stored = JSON.parse(storage.get(LOCAL_STORAGE_INTERVIEWS_KEY) || '[]');
      expect(stored.some((i: { id: string }) => i.id === 'intv-server-001')).toBe(true);

      const timeline = JSON.parse(storage.get(LOCAL_STORAGE_TIMELINE_KEY) || '[]');
      expect(timeline.some((evt: { eventType: string }) => evt.eventType === 'INTERVIEW_SCHEDULED')).toBe(true);
    });

    it('xử lý lỗi Backend response: 400 Past Time ném InterviewPastTimeError', async () => {
      const axiosError = new axios.AxiosError('Bad Request');
      axiosError.response = {
        status: 400,
        statusText: 'Bad Request',
        data: {
          code: 'PAST_TIME_NOT_ALLOWED',
          message: 'Thời gian đã qua so với giờ hệ thống',
        },
        headers: {},
        config: {} as any,
      };

      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(axiosError);

      await expect(interviewService.createInterviewSchedule(samplePayload)).rejects.toThrow(
        InterviewPastTimeError,
      );
    });

    it('xử lý lỗi Backend response: 409 Conflict ném InterviewerConflictError', async () => {
      const axiosError = new axios.AxiosError('Conflict');
      axiosError.response = {
        status: 409,
        statusText: 'Conflict',
        data: {
          code: 'INTERVIEWER_CONFLICT',
          message: 'Người phỏng vấn Nguyễn Văn Hải đã có lịch bận trong khung giờ 09:30 - 10:30',
        },
        headers: {},
        config: {} as any,
      };

      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(axiosError);

      await expect(interviewService.createInterviewSchedule(samplePayload)).rejects.toThrow(
        InterviewerConflictError,
      );
    });

    it('xử lý lỗi Backend response: lỗi khác ném InterviewApiError', async () => {
      const axiosError = new axios.AxiosError('Internal Server Error');
      axiosError.response = {
        status: 500,
        statusText: 'Internal Server Error',
        data: {
          message: 'Lỗi cơ sở dữ liệu khi lưu lịch phỏng vấn',
        },
        headers: {},
        config: {} as any,
      };

      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(axiosError);

      await expect(interviewService.createInterviewSchedule(samplePayload)).rejects.toThrow(
        InterviewApiError,
      );
    });
  });

  describe('AC 1 & AC 3: getCandidateInterviews & Hiển thị trên hồ sơ ứng viên', () => {
    it('lấy danh sách lịch phỏng vấn theo applicationId từ server hoặc local fallback', async () => {
      const mockInterviews = [
        {
          id: 'intv-01',
          applicationId: 'app-999',
          candidateId: 'can-999',
          candidateName: 'Trần Văn Hoàng',
          roundName: 'Vòng Kỹ thuật',
          interviewDate: '2026-10-25',
          interviewTime: '10:00',
          scheduledDateTimeISO: '2026-10-25T10:00:00+07:00',
          durationMinutes: 60,
          format: 'ONLINE' as const,
          locationOrLink: 'https://meet.google.com/test',
          interviewers: [{ id: 'usr-001', name: 'Nguyễn Văn Hải', role: 'Dev', email: 'hai@test.com' }],
          status: 'SCHEDULED' as const,
        },
      ];

      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({ data: mockInterviews });

      const data = await interviewService.getCandidateInterviews('app-999');
      expect(data.length).toBe(1);
      expect(data[0].candidateName).toBe('Trần Văn Hoàng');
      expect(axiosClient.get).toHaveBeenCalledWith('/recruitment/applications/app-999/interviews');
    });

    it('fallback đọc đúng từ LocalStorage khi backend offline', async () => {
      const stored = [
        {
          id: 'intv-local-1',
          applicationId: 'app-offline-1',
          candidateId: 'can-offline-1',
          candidateName: 'Phạm Minh Anh',
          roundName: 'Vòng HR',
          interviewDate: '2026-10-28',
          interviewTime: '15:00',
          durationMinutes: 45,
          format: 'OFFLINE' as const,
          locationOrLink: 'Phòng họp Lotus - Tầng 8',
          interviewers: [],
          status: 'SCHEDULED' as const,
        },
      ];
      storage.set(LOCAL_STORAGE_INTERVIEWS_KEY, JSON.stringify(stored));

      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Network error'));

      const result = await interviewService.getCandidateInterviews('app-offline-1');
      expect(result.length).toBe(1);
      expect(result[0].candidateName).toBe('Phạm Minh Anh');
    });
  });

  describe('AC 1 & AC 3: getPersonalInterviewSchedule & Lịch cá nhân của Interviewer', () => {
    beforeEach(() => {
      const mockScheduleList = [
        {
          id: 'intv-pers-1',
          applicationId: 'app-01',
          candidateId: 'can-01',
          candidateName: 'Lê Văn Cường',
          jobTitle: 'Backend Go Engineer',
          roundName: 'Vòng Kỹ thuật 1',
          interviewDate: '2026-10-20',
          interviewTime: '09:00',
          startTime: '2026-10-20T09:00:00+07:00',
          durationMinutes: 60,
          format: 'ONLINE' as const,
          locationOrLink: 'https://meet.google.com/test-1',
          interviewerIds: ['usr-001', 'usr-002'],
          interviewers: [{ id: 'usr-001', name: 'Nguyễn Văn Hải', role: 'Lead', email: 'hai@test.com' }],
          status: 'SCHEDULED' as const,
        },
        {
          id: 'intv-pers-2',
          applicationId: 'app-02',
          candidateId: 'can-02',
          candidateName: 'Hoàng Thùy Linh',
          jobTitle: 'Product Designer',
          roundName: 'Vòng Portfolio',
          interviewDate: '2026-10-21',
          interviewTime: '14:00',
          startTime: '2026-10-21T14:00:00+07:00',
          durationMinutes: 45,
          format: 'OFFLINE' as const,
          locationOrLink: 'Phòng họp Sakura',
          interviewerIds: ['usr-003'],
          interviewers: [{ id: 'usr-003', name: 'Lê Minh Tuấn', role: 'Architect', email: 'tuan@test.com' }],
          status: 'SCHEDULED' as const,
        },
      ];

      storage.set(LOCAL_STORAGE_INTERVIEWS_KEY, JSON.stringify(mockScheduleList));
    });

    it('lọc chính xác lịch cá nhân theo ID người phỏng vấn được phân công', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Network offline'));

      // Tìm lịch của usr-001
      const mySchedule = await interviewService.getPersonalInterviewSchedule({
        userId: 'usr-001',
      });

      expect(mySchedule.length).toBe(1);
      expect(mySchedule[0].candidateName).toBe('Lê Văn Cường');

      // Tìm lịch của usr-003
      const tuanSchedule = await interviewService.getPersonalInterviewSchedule({
        interviewerId: 'usr-003',
      });
      expect(tuanSchedule.length).toBe(1);
      expect(tuanSchedule[0].candidateName).toBe('Hoàng Thùy Linh');
    });

    it('lọc theo ngày cụ thể và tìm kiếm từ khóa', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValue(new Error('Offline'));

      const filteredByDate = await interviewService.getPersonalInterviewSchedule({
        date: '2026-10-20',
      });
      expect(filteredByDate.length).toBe(1);
      expect(filteredByDate[0].candidateName).toBe('Lê Văn Cường');

      const searched = await interviewService.getPersonalInterviewSchedule({
        search: 'Product Designer',
      });
      expect(searched.length).toBe(1);
      expect(searched[0].candidateName).toBe('Hoàng Thùy Linh');
    });

    it('cập nhật trạng thái buổi phỏng vấn (updateInterviewStatus)', async () => {
      const updated = await interviewService.updateInterviewStatus('intv-pers-1', 'COMPLETED');
      expect(updated).not.toBeNull();
      expect(updated?.status).toBe('COMPLETED');

      const reloaded = await interviewService.getPersonalInterviewSchedule({ userId: 'usr-001' });
      expect(reloaded[0].status).toBe('COMPLETED');
    });
  });

  describe('Component React Elements Initialization', () => {
    it('khởi tạo hợp lệ CandidateInterviewsList component element', () => {
      const element = React.createElement(CandidateInterviewsList, {
        interviews: [],
        isLoading: false,
        onScheduleNew: vi.fn(),
      });
      expect(React.isValidElement(element)).toBe(true);
    });

    it('khởi tạo hợp lệ PersonalInterviewSchedulePage component element', () => {
      const element = React.createElement(PersonalInterviewSchedulePage);
      expect(React.isValidElement(element)).toBe(true);
    });
  });
});

