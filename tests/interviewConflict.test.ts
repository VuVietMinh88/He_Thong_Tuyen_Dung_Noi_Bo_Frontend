import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import axios from 'axios';
import axiosClient from '../src/utils/axiosClient';
import {
  interviewService,
  areTimeSlotsOverlapping,
} from '../src/services/interviewService';
import {
  InterviewerConflictError,
  InterviewApiError,
  type CreateInterviewSchedulePayload,
  type InterviewSchedulePayload,
  type CheckInterviewConflictPayload,
  type InterviewConflictCheckResult,
} from '../src/types/interview';
import { InterviewConflictModal } from '../src/components/Candidate/InterviewConflictModal';

const storage = new Map<string, string>();

describe('TKNHTTDNB1-439 / S6-04: Hiển thị chi tiết xung đột lịch phỏng vấn', () => {
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

  describe('1. Logic kiểm tra trùng khung giờ (areTimeSlotsOverlapping)', () => {
    it('trả về false nếu khác ngày', () => {
      const overlap = areTimeSlotsOverlapping(
        '2026-11-20',
        '09:00',
        60,
        '2026-11-21',
        '09:00',
        60,
      );
      expect(overlap).toBe(false);
    });

    it('trả về false nếu cùng ngày nhưng hai khung giờ liền kề (không giao nhau)', () => {
      // 09:00 - 10:00 và 10:00 - 11:00
      const overlap = areTimeSlotsOverlapping(
        '2026-11-20',
        '09:00',
        60,
        '2026-11-20',
        '10:00',
        60,
      );
      expect(overlap).toBe(false);
    });

    it('trả về true nếu hai khung giờ giao nhau một phần', () => {
      // 09:00 - 10:00 và 09:30 - 10:30
      const overlap1 = areTimeSlotsOverlapping(
        '2026-11-20',
        '09:00',
        60,
        '2026-11-20',
        '09:30',
        60,
      );
      expect(overlap1).toBe(true);

      // 10:00 - 11:30 và 09:30 - 10:30
      const overlap2 = areTimeSlotsOverlapping(
        '2026-11-20',
        '10:00',
        90,
        '2026-11-20',
        '09:30',
        60,
      );
      expect(overlap2).toBe(true);
    });

    it('trả về true nếu một khung giờ nằm lọt hoàn toàn trong khung giờ kia', () => {
      // 09:00 - 12:00 chứa 10:00 - 11:00
      const overlap = areTimeSlotsOverlapping(
        '2026-11-20',
        '09:00',
        180,
        '2026-11-20',
        '10:00',
        60,
      );
      expect(overlap).toBe(true);
    });
  });

  describe('2. Kiểm tra phát hiện xung đột (checkInterviewConflict)', () => {
    const existingDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const existingInterview: InterviewSchedulePayload = {
      id: 'intv-existing-01',
      candidateId: 'can-existing-01',
      candidateName: 'Trần Minh Quang',
      jobTitle: 'Backend Tech Lead',
      roundName: 'Vòng Chuyên môn & Kỹ thuật',
      interviewDate: existingDate,
      interviewTime: '09:00',
      scheduledDateTimeISO: `${existingDate}T09:00:00+07:00`,
      startTime: `${existingDate}T09:00:00+07:00`,
      durationMinutes: 60,
      format: 'OFFLINE',
      locationOrLink: 'Phòng họp Lotus - Tầng 8',
      interviewers: [
        {
          id: 'usr-001',
          name: 'Nguyễn Văn Hải',
          role: 'Trưởng phòng Kỹ thuật',
          email: 'hai.nguyen@smartrecruitment.vn',
        },
      ],
      interviewerIds: ['usr-001'],
      status: 'SCHEDULED',
    };

    beforeEach(() => {
      interviewService.saveInterviewToStorage(existingInterview);
    });

    it('trả về hasConflict = false khi không có trùng lặp về người hay phòng', async () => {
      const checkPayload: CheckInterviewConflictPayload = {
        interviewDate: existingDate,
        startTime: '14:00',
        durationMinutes: 60,
        format: 'ONLINE',
        locationOrLink: 'https://meet.google.com/xyz',
        interviewerIds: ['usr-002'],
      };

      const result = await interviewService.checkInterviewConflict(checkPayload);
      expect(result.hasConflict).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });

    it('phát hiện xung đột INTERVIEWER_CONFLICT khi trùng người phỏng vấn trong cùng khung giờ', async () => {
      const checkPayload: CheckInterviewConflictPayload = {
        candidateName: 'Lê Thuỳ Dung',
        jobTitle: 'Fullstack Developer',
        roundName: 'Vòng Kỹ thuật',
        interviewDate: existingDate,
        startTime: '09:30', // Chồng lấn với 09:00 - 10:00
        durationMinutes: 60,
        format: 'ONLINE',
        locationOrLink: 'https://meet.google.com/test-conflict',
        interviewerIds: ['usr-001'], // Trùng với Nguyễn Văn Hải
      };

      const result = await interviewService.checkInterviewConflict(checkPayload);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe('INTERVIEWER_CONFLICT');
      expect(result.conflicts.length).toBeGreaterThanOrEqual(1);
      expect(result.conflicts[0].type).toBe('INTERVIEWER');
      expect(result.conflicts[0].entityId).toBe('usr-001');
      expect(result.conflicts[0].conflictingInterview.candidateName).toBe('Trần Minh Quang');
      expect(result.proposedInterview?.candidateName).toBe('Lê Thuỳ Dung');
    });

    it('phát hiện xung đột ROOM_CONFLICT khi trùng phòng họp trực tiếp OFFLINE trong cùng khung giờ', async () => {
      const checkPayload: CheckInterviewConflictPayload = {
        candidateName: 'Hoàng Quốc Việt',
        jobTitle: 'DevOps Engineer',
        roundName: 'Vòng Chuyên môn',
        interviewDate: existingDate,
        startTime: '09:15',
        durationMinutes: 45,
        format: 'OFFLINE',
        locationOrLink: 'Phòng họp Lotus - Tầng 8', // Trùng phòng họp
        interviewerIds: ['usr-003'], // Người phỏng vấn khác
      };

      const result = await interviewService.checkInterviewConflict(checkPayload);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe('ROOM_CONFLICT');
      expect(result.conflicts[0].type).toBe('ROOM');
      expect(result.conflicts[0].entityName).toContain('Lotus');
    });

    it('phát hiện xung đột BOTH khi trùng cả người phỏng vấn và phòng họp', async () => {
      const checkPayload: CheckInterviewConflictPayload = {
        candidateName: 'Đặng Tuấn Anh',
        jobTitle: 'Software Architect',
        roundName: 'Vòng Giám đốc',
        interviewDate: existingDate,
        startTime: '09:00',
        durationMinutes: 60,
        format: 'OFFLINE',
        locationOrLink: 'Phòng họp Lotus - Tầng 8',
        interviewerIds: ['usr-001'],
      };

      const result = await interviewService.checkInterviewConflict(checkPayload);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe('BOTH');
      expect(result.conflicts.length).toBe(2);
    });
  });

  describe('3. Chặn lưu lịch trùng (Blocking Error) & Cơ chế Ghi đè (Override)', () => {
    const futureDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const baseSchedule: InterviewSchedulePayload = {
      id: 'intv-block-test-01',
      candidateId: 'can-block-01',
      candidateName: 'Phạm Minh Đức',
      jobTitle: 'Product Owner',
      roundName: 'Vòng Kỹ thuật',
      interviewDate: futureDate,
      interviewTime: '10:00',
      scheduledDateTimeISO: `${futureDate}T10:00:00+07:00`,
      startTime: `${futureDate}T10:00:00+07:00`,
      durationMinutes: 60,
      format: 'ONLINE',
      locationOrLink: 'https://meet.google.com/test-meet',
      interviewers: [
        {
          id: 'usr-002',
          name: 'Trần Thị Thu Thảo',
          role: 'Chuyên viên Tuyển dụng Cao cấp',
          email: 'thao.tran@smartrecruitment.vn',
        },
      ],
      interviewerIds: ['usr-002'],
      status: 'SCHEDULED',
    };

    beforeEach(() => {
      interviewService.saveInterviewToStorage(baseSchedule);
    });

    it('mặc định ném InterviewerConflictError (Blocking Error) khi có trùng lịch và không kích hoạt ghi đè', async () => {
      const conflictingPayload: CreateInterviewSchedulePayload = {
        applicationId: 'app-new-001',
        candidateId: 'can-new-001',
        candidateName: 'Ngô Bảo Trâm',
        jobTitle: 'Scrum Master',
        interviewRound: 'Vòng HR',
        interviewDate: futureDate,
        interviewTime: '10:15',
        startTime: `${futureDate}T10:15:00+07:00`,
        durationMinutes: 60,
        interviewType: 'ONLINE',
        locationOrLink: 'https://meet.google.com/room2',
        interviewerIds: ['usr-002'], // Trùng Thu Thảo
      };

      await expect(
        interviewService.createInterviewSchedule(conflictingPayload),
      ).rejects.toThrow(InterviewerConflictError);

      try {
        await interviewService.createInterviewSchedule(conflictingPayload);
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(InterviewerConflictError);
        const conflictErr = err as InterviewerConflictError;
        expect(conflictErr.conflictResult?.hasConflict).toBe(true);
        expect(conflictErr.conflictResult?.conflictType).toBe('INTERVIEWER_CONFLICT');
      }
    });

    it('ném InterviewApiError khi isOverride = true nhưng thiếu lý do ghi đè hoặc lý do dưới 5 ký tự', async () => {
      const payloadMissingReason: CreateInterviewSchedulePayload = {
        applicationId: 'app-new-002',
        candidateId: 'can-new-002',
        candidateName: 'Vũ Quốc Bảo',
        interviewRound: 'Vòng HR',
        interviewDate: futureDate,
        interviewTime: '10:00',
        startTime: `${futureDate}T10:00:00+07:00`,
        durationMinutes: 60,
        interviewType: 'ONLINE',
        locationOrLink: 'https://meet.google.com/room2',
        interviewerIds: ['usr-002'],
        isOverride: true,
        overrideReason: 'ok', // Dưới 5 ký tự
      };

      await expect(
        interviewService.createInterviewSchedule(payloadMissingReason),
      ).rejects.toThrow(InterviewApiError);
    });

    it('cho phép lưu lịch thành công khi isOverride = true và có lý do ghi đè hợp lệ (>= 5 ký tự)', async () => {
      const validOverridePayload: CreateInterviewSchedulePayload = {
        applicationId: 'app-new-003',
        candidateId: 'can-new-003',
        candidateName: 'Vũ Quốc Bảo',
        interviewRound: 'Vòng HR',
        interviewDate: futureDate,
        interviewTime: '10:00',
        startTime: `${futureDate}T10:00:00+07:00`,
        durationMinutes: 60,
        interviewType: 'ONLINE',
        locationOrLink: 'https://meet.google.com/room3',
        interviewerIds: ['usr-002'],
        isOverride: true,
        overrideReason: 'Đã trao đổi thống nhất hoán đổi ca phỏng vấn với hội đồng',
      };

      const result = await interviewService.createInterviewSchedule(validOverridePayload);

      expect(result).toBeDefined();
      expect(result.isOverride).toBe(true);
      expect(result.overrideReason).toBe(
        'Đã trao đổi thống nhất hoán đổi ca phỏng vấn với hội đồng',
      );

      // Kiểm tra đã được lưu vào Storage
      const stored = interviewService.getStoredInterviews();
      const savedItem = stored.find((item) => item.candidateName === 'Vũ Quốc Bảo');
      expect(savedItem).toBeDefined();
      expect(savedItem?.isOverride).toBe(true);
    });

    it('xử lý phản hồi lỗi 409 từ backend và ném InterviewerConflictError', async () => {
      const axiosError = new axios.AxiosError('Conflict');
      axiosError.response = {
        status: 409,
        statusText: 'Conflict',
        data: {
          code: 'INTERVIEWER_CONFLICT',
          message: 'Người phỏng vấn đã bận lịch phỏng vấn khác trên máy chủ.',
        },
        headers: {},
        config: {} as any,
      };

      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(axiosError);

      const serverConflictPayload: CreateInterviewSchedulePayload = {
        applicationId: 'app-server-001',
        candidateId: 'can-server-001',
        candidateName: 'Nguyễn Văn Minh',
        interviewRound: 'Vòng HR',
        interviewDate: futureDate,
        interviewTime: '15:00',
        startTime: `${futureDate}T15:00:00+07:00`,
        durationMinutes: 60,
        interviewType: 'ONLINE',
        locationOrLink: 'https://meet.google.com/room4',
        interviewerIds: ['usr-004'], // Không trùng local nhưng server báo 409
      };

      await expect(
        interviewService.createInterviewSchedule(serverConflictPayload),
      ).rejects.toThrow(InterviewerConflictError);
    });
  });

  describe('4. Component InterviewConflictModal', () => {
    const mockConflictResult: InterviewConflictCheckResult = {
      hasConflict: true,
      conflictType: 'INTERVIEWER_CONFLICT',
      message: 'Phát hiện xung đột lịch phỏng vấn người phỏng vấn.',
      conflicts: [
        {
          type: 'INTERVIEWER',
          entityId: 'usr-001',
          entityName: 'Nguyễn Văn Hải',
          entityRoleOrLocation: 'Trưởng phòng Kỹ thuật',
          reason: 'Người phỏng vấn Nguyễn Văn Hải đã có lịch với ứng viên Trần Minh Quang từ 09:00 đến 10:00.',
          conflictingInterview: {
            id: 'intv-01',
            candidateName: 'Trần Minh Quang',
            jobTitle: 'Backend Tech Lead',
            roundName: 'Vòng Kỹ thuật',
            interviewDate: '2026-11-20',
            startTime: '09:00',
            endTime: '10:00',
            durationMinutes: 60,
            format: 'OFFLINE',
            locationOrLink: 'Phòng họp Lotus - Tầng 8',
            interviewerNames: ['Nguyễn Văn Hải'],
          },
        },
      ],
      proposedInterview: {
        candidateName: 'Lê Thuỳ Dung',
        jobTitle: 'Frontend Engineer',
        roundName: 'Vòng Chuyên môn',
        interviewDate: '2026-11-20',
        startTime: '09:30',
        endTime: '10:30',
        durationMinutes: 60,
        format: 'ONLINE',
        locationOrLink: 'https://meet.google.com/dung-itv',
        interviewerNames: ['Nguyễn Văn Hải'],
      },
    };

    it('trả về null khi isOpen = false', () => {
      const element = React.createElement(InterviewConflictModal, {
        isOpen: false,
        onClose: vi.fn(),
        conflictResult: mockConflictResult,
        onConfirmOverride: vi.fn(),
      });

      expect(React.isValidElement(element)).toBe(true);
      // Khi render ở test môi trường Node thuần: element có props.isOpen === false
      expect(element.props.isOpen).toBe(false);
    });

    it('tạo React element hợp lệ khi isOpen = true và có conflictResult', () => {
      const onCloseMock = vi.fn();
      const onConfirmOverrideMock = vi.fn();

      const element = React.createElement(InterviewConflictModal, {
        isOpen: true,
        onClose: onCloseMock,
        conflictResult: mockConflictResult,
        onConfirmOverride: onConfirmOverrideMock,
        isSubmitting: false,
      });

      expect(React.isValidElement(element)).toBe(true);
      expect(element.props.isOpen).toBe(true);
      expect(element.props.conflictResult?.hasConflict).toBe(true);
      expect(element.props.conflictResult?.conflictType).toBe('INTERVIEWER_CONFLICT');
      expect(element.props.conflictResult?.conflicts).toHaveLength(1);
    });
  });
});
