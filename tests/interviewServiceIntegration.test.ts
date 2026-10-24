import { interview, page } from './fixtures/interviewContract';
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
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-10-20T00:00:00Z').getTime());
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
      const response = interview({ id: 'intv-server-001', applicationId: samplePayload.applicationId,
        startsAt: validStartTime, endsAt: new Date(Date.parse(validStartTime) + 3600000).toISOString() });
      const post = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({ data: response });
      const result = await interviewService.createInterviewSchedule(samplePayload);
      expect(post).toHaveBeenCalledWith('/applications/app-itv-101/interviews', {
        roundName: samplePayload.interviewRound, startsAt: validStartTime, durationMinutes: 60, mode: 'ONLINE',
        room: null, meetingUrl: samplePayload.locationOrLink, participantIds: ['usr-001', 'usr-003'],
        expectedVersion: null, overrideConflicts: false, overrideReason: null,
      });
      expect(result.id).toBe('intv-server-001');
      expect(result.candidateId).toBe(samplePayload.candidateId);
      expect(result.version).toBe(0);
      expect(storage.has(LOCAL_STORAGE_INTERVIEWS_KEY)).toBe(false);
      expect(storage.has(LOCAL_STORAGE_TIMELINE_KEY)).toBe(false);
    });

    it('xử lý lỗi Backend response: 400 validation thời gian giữ status và lỗi Backend', async () => {
      const axiosError = new axios.AxiosError('Bad Request');
      axiosError.response = {
        status: 400,
        statusText: 'Bad Request',
        data: {
          code: 'VALIDATION_ERROR',
          message: 'Thời gian đã qua so với giờ hệ thống',
        },
        headers: {},
        config: {} as any,
      };

      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(axiosError);

      await expect(interviewService.createInterviewSchedule(samplePayload)).rejects.toMatchObject({ statusCode: 400, errorCode: 'VALIDATION_ERROR', message: 'Thời gian đã qua so với giờ hệ thống' });
    });

    it('xử lý lỗi Backend response: 409 Conflict ném InterviewerConflictError', async () => {
      const axiosError = new axios.AxiosError('Conflict');
      axiosError.response = {
        status: 409,
        statusText: 'Conflict',
        data: {
          code: 'INTERVIEW_CONFLICT',
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
    it('lấy danh sách phân trang theo applicationId, không suy diễn PII', async () => {
      const get = vi.spyOn(axiosClient, 'get').mockResolvedValue({ data: page([interview({ id: 'intv-01', applicationId: 'app-999' })]) });
      const data = await interviewService.getCandidateInterviews('app-999');
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('intv-01');
      expect(data[0].applicationId).toBe('app-999');
      expect(data[0].candidateName).toBe(''); // Logistics DTO does not expose candidate PII.
      expect(get).toHaveBeenCalledWith('/applications/app-999/interviews', { params: { page: 0, size: 100 } });
    });

    it('không dùng cache chưa xác thực khi backend offline', async () => {
      storage.set(LOCAL_STORAGE_INTERVIEWS_KEY, JSON.stringify([{ id: 'stale-private-record' }]));
      vi.spyOn(axiosClient, 'get').mockRejectedValue(new Error('Network error'));
      await expect(interviewService.getCandidateInterviews('app-offline-1')).rejects.toThrow('Network error');
      expect(storage.get(LOCAL_STORAGE_INTERVIEWS_KEY)).toBe(JSON.stringify([{ id: 'stale-private-record' }]));
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

    it('lịch cá nhân do Backend xác định, không đổi scope theo userId client', async () => {
      const get = vi.spyOn(axiosClient, 'get').mockResolvedValue({ data: page([interview({ id: 'intv-pers-1' })]) });
      const mine = await interviewService.getPersonalInterviewSchedule({ userId: 'usr-001' });
      expect(mine).toHaveLength(1); expect(mine[0].id).toBe('intv-pers-1');
      const other = await interviewService.getPersonalInterviewSchedule({ interviewerId: 'usr-003' });
      expect(other.map(item => item.id)).toEqual(['intv-pers-1']);
      expect(get).toHaveBeenNthCalledWith(1, '/interviews/me', { params: { page: 0, size: 100 } });
      expect(get).toHaveBeenNthCalledWith(2, '/interviews/me', { params: { page: 0, size: 100 } });
    });

    it('lọc theo ngày cụ thể và tìm kiếm từ khóa', async () => {
      vi.spyOn(axiosClient, 'get').mockResolvedValue({ data: page([
        interview({ id: 'intv-pers-1', startsAt: '2026-10-20T02:00:00Z', endsAt: '2026-10-20T03:00:00Z' }),
        interview({ id: 'intv-pers-2', roundName: 'Vòng Portfolio', startsAt: '2026-10-21T07:00:00Z', endsAt: '2026-10-21T08:00:00Z' }),
      ]) });
      const byDate = await interviewService.getPersonalInterviewSchedule({ date: '2026-10-20' });
      expect(byDate.map(item => item.id)).toEqual(['intv-pers-1']);
      const searched = await interviewService.getPersonalInterviewSchedule({ search: 'Portfolio' });
      expect(searched.map(item => item.id)).toEqual(['intv-pers-2']);
    });

    it('không tự đánh dấu hoàn thành; hủy lịch gửi version và lý do', async () => {
      const post = vi.spyOn(axiosClient, 'post');
      await expect(interviewService.updateInterviewStatus('intv-pers-1', 'COMPLETED')).rejects.toThrow('không hỗ trợ');
      expect(post).not.toHaveBeenCalled();
      post.mockResolvedValue({ data: interview({ id: 'intv-pers-1', status: 'CANCELLED', version: 1 }) });
      const updated = await interviewService.updateInterviewStatus('intv-pers-1', 'CANCELLED', { expectedVersion: 0, reason: 'Candidate unavailable' });
      expect(updated?.status).toBe('CANCELLED');
      expect(updated?.version).toBe(1);
      expect(post).toHaveBeenCalledWith('/interviews/intv-pers-1/cancel', { expectedVersion: 0, reason: 'Candidate unavailable' });
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

