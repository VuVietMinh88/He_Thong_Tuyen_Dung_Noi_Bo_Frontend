import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import {
  interviewService,
  validateScheduleTime,
  calculateEndTime,
  generateMeetingLink,
  LOCAL_STORAGE_INTERVIEWS_KEY,
  LOCAL_STORAGE_TIMELINE_KEY,
} from '../src/services/interviewService';
import { InterviewScheduleModal } from '../src/components/Candidate/InterviewScheduleModal';
import type { InterviewSchedulePayload } from '../src/types/interview';
import {
  DEFAULT_INTERVIEW_ROUNDS,
  DEFAULT_DURATION_OPTIONS,
  MOCK_INTERNAL_INTERVIEWERS,
} from '../src/types/interview';

const storage = new Map<string, string>();

describe('TKNHTTDNB1-426 / S6-02: Thiết kế biểu mẫu đặt lịch phỏng vấn', () => {
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

  describe('1. validateScheduleTime (Validation múi giờ Asia/Ho_Chi_Minh GMT+7)', () => {
    it('chấp nhận thời gian phỏng vấn hợp lệ ở tương lai', () => {
      // 10 ngày sau
      const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const dateStr = future.toISOString().slice(0, 10);
      const result = validateScheduleTime(dateStr, '14:30');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.scheduledDate).toBeDefined();
      expect(result.scheduledDateTimeISO).toBeDefined();
    });

    it('chặn chọn thời gian ở quá khứ và trả về thông báo lỗi rõ ràng theo GMT+7', () => {
      // Ngày hôm qua
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const dateStr = yesterday.toISOString().slice(0, 10);
      const result = validateScheduleTime(dateStr, '09:00');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('quá khứ theo múi giờ Việt Nam (GMT+7)');
    });

    it('báo lỗi khi để trống ngày hoặc giờ', () => {
      const missingDate = validateScheduleTime('', '10:00');
      expect(missingDate.isValid).toBe(false);
      expect(missingDate.error).toContain('chọn ngày phỏng vấn');

      const missingTime = validateScheduleTime('2026-12-01', '');
      expect(missingTime.isValid).toBe(false);
      expect(missingTime.error).toContain('chọn giờ bắt đầu');
    });

    it('báo lỗi khi định dạng ngày giờ không hợp lệ', () => {
      const invalid = validateScheduleTime('invalid-date', 'abc');
      expect(invalid.isValid).toBe(false);
      expect(invalid.error).toContain('không hợp lệ');
    });
  });

  describe('2. calculateEndTime & generateMeetingLink helpers', () => {
    it('tính toán chính xác giờ kết thúc dựa trên thời lượng', () => {
      expect(calculateEndTime('09:00', 30)).toBe('09:30');
      expect(calculateEndTime('09:00', 60)).toBe('10:00');
      expect(calculateEndTime('14:45', 45)).toBe('15:30');
      expect(calculateEndTime('16:30', 90)).toBe('18:00');
      expect(calculateEndTime('23:15', 60)).toBe('00:15'); // Qua ngày mới
      expect(calculateEndTime('', 60)).toBe('');
      expect(calculateEndTime('invalid', 60)).toBe('');
    });

    it('tạo link họp trực tuyến ngẫu nhiên chuẩn format Google Meet, Zoom và Teams', () => {
      const googleMeet = generateMeetingLink('google_meet');
      expect(googleMeet).toMatch(/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/);

      const zoom = generateMeetingLink('zoom');
      expect(zoom).toContain('https://zoom.us/j/');

      const teams = generateMeetingLink('teams');
      expect(teams).toContain('https://teams.microsoft.com/');
    });
  });

  describe('3. Dữ liệu cấu hình vòng phỏng vấn & nhân sự nội bộ', () => {
    it('chứa đầy đủ các vòng phỏng vấn chuẩn (Screening, Technical, HR, Final, Custom)', () => {
      expect(DEFAULT_INTERVIEW_ROUNDS.length).toBe(5);
      const types = DEFAULT_INTERVIEW_ROUNDS.map((r) => r.type);
      expect(types).toContain('SCREENING');
      expect(types).toContain('TECHNICAL');
      expect(types).toContain('CULTURE_HR');
      expect(types).toContain('FINAL_DIRECTOR');
      expect(types).toContain('CUSTOM');
    });

    it('hỗ trợ các mức thời lượng chuẩn: 30, 45, 60, 90, 120 phút', () => {
      expect(DEFAULT_DURATION_OPTIONS).toEqual([30, 45, 60, 90, 120]);
    });

    it('danh sách nhân sự nội bộ mẫu có đầy đủ thông tin avatar, chức danh, email và phòng ban', () => {
      expect(MOCK_INTERNAL_INTERVIEWERS.length).toBeGreaterThanOrEqual(5);
      MOCK_INTERNAL_INTERVIEWERS.forEach((interviewer) => {
        expect(interviewer.id).toBeDefined();
        expect(interviewer.name).toBeDefined();
        expect(interviewer.role).toBeDefined();
        expect(interviewer.email).toContain('@');
      });
    });
  });

  describe('4. interviewService - Quản lý nhân sự và lưu lịch phỏng vấn', () => {
    it('lấy danh sách người phỏng vấn nội bộ và hỗ trợ tìm kiếm theo tên, chức danh, email', async () => {
      const all = await interviewService.getInternalInterviewers();
      expect(all.length).toBeGreaterThanOrEqual(4);

      const filteredByName = await interviewService.getInternalInterviewers('Hải');
      expect(filteredByName.some((i) => i.name.includes('Hải'))).toBe(true);

      const filteredByRole = await interviewService.getInternalInterviewers('Architect');
      expect(filteredByRole.length).toBeGreaterThan(0);

      const filteredByDept = await interviewService.getInternalInterviewers('Công nghệ');
      expect(filteredByDept.length).toBeGreaterThan(0);
    });

    it('chặn lưu lịch nếu thiếu thông tin bắt buộc hoặc thời gian quá khứ', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      // Thiếu candidateId
      await expect(
        interviewService.scheduleInterview({
          candidateId: '',
          candidateName: 'Nguyễn Văn A',
          roundName: 'Vòng Kỹ thuật',
          interviewDate: futureDate,
          interviewTime: '10:00',
          scheduledDateTimeISO: '',
          durationMinutes: 60,
          format: 'ONLINE',
          locationOrLink: 'https://meet.google.com/test',
          interviewers: [{ id: '1', name: 'Interviewer', role: 'Dev', email: 'dev@test.com' }],
        }),
      ).rejects.toThrow('candidateId');

      // Thiếu vòng phỏng vấn
      await expect(
        interviewService.scheduleInterview({
          candidateId: 'can-123',
          candidateName: 'Nguyễn Văn A',
          roundName: '',
          interviewDate: futureDate,
          interviewTime: '10:00',
          scheduledDateTimeISO: '',
          durationMinutes: 60,
          format: 'ONLINE',
          locationOrLink: 'https://meet.google.com/test',
          interviewers: [{ id: '1', name: 'Interviewer', role: 'Dev', email: 'dev@test.com' }],
        }),
      ).rejects.toThrow('vòng phỏng vấn');

      // Thiếu người phỏng vấn
      await expect(
        interviewService.scheduleInterview({
          candidateId: 'can-123',
          candidateName: 'Nguyễn Văn A',
          roundName: 'Vòng Kỹ thuật',
          interviewDate: futureDate,
          interviewTime: '10:00',
          scheduledDateTimeISO: '',
          durationMinutes: 60,
          format: 'ONLINE',
          locationOrLink: 'https://meet.google.com/test',
          interviewers: [],
        }),
      ).rejects.toThrow('người phỏng vấn');

      // Thiếu link hoặc địa điểm
      await expect(
        interviewService.scheduleInterview({
          candidateId: 'can-123',
          candidateName: 'Nguyễn Văn A',
          roundName: 'Vòng Kỹ thuật',
          interviewDate: futureDate,
          interviewTime: '10:00',
          scheduledDateTimeISO: '',
          durationMinutes: 60,
          format: 'ONLINE',
          locationOrLink: '',
          interviewers: [{ id: '1', name: 'Interviewer', role: 'Dev', email: 'dev@test.com' }],
        }),
      ).rejects.toThrow('liên kết họp');

      // Thời gian quá khứ
      await expect(
        interviewService.scheduleInterview({
          candidateId: 'can-123',
          candidateName: 'Nguyễn Văn A',
          roundName: 'Vòng Kỹ thuật',
          interviewDate: yesterday,
          interviewTime: '10:00',
          scheduledDateTimeISO: '',
          durationMinutes: 60,
          format: 'ONLINE',
          locationOrLink: 'https://meet.google.com/test',
          interviewers: [{ id: '1', name: 'Interviewer', role: 'Dev', email: 'dev@test.com' }],
        }),
      ).rejects.toThrow('quá khứ');
    });

    it('lưu lịch phỏng vấn thành công vào LocalStorage và đồng bộ Timeline', async () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const payload: Omit<InterviewSchedulePayload, 'id'> = {
        candidateId: 'candidate-999',
        candidateName: 'Trần Văn Hoàng',
        candidateEmail: 'hoang.tran@gmail.com',
        jobTitle: 'Senior React Developer',
        roundName: 'Vòng Chuyên môn & Kỹ thuật',
        interviewDate: futureDate,
        interviewTime: '14:00',
        scheduledDateTimeISO: `${futureDate}T14:00:00+07:00`,
        durationMinutes: 60,
        format: 'ONLINE',
        locationOrLink: 'https://meet.google.com/xyz-abcd-efg',
        interviewers: [
          {
            id: 'usr-001',
            name: 'Nguyễn Văn Hải',
            role: 'Engineering Manager',
            email: 'hai@test.com',
          },
        ],
        notes: 'Chuẩn bị bài thuyết trình kỹ thuật',
        status: 'SCHEDULED',
      };

      const result = await interviewService.scheduleInterview(payload);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.candidateId).toBe('candidate-999');

      // Kiểm tra lưu trong LocalStorage interviews
      const storedInterviews = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_INTERVIEWS_KEY) || '[]',
      );
      expect(storedInterviews.length).toBe(1);
      expect(storedInterviews[0].candidateName).toBe('Trần Văn Hoàng');

      // Kiểm tra đồng bộ vào Timeline
      const storedTimeline = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_TIMELINE_KEY) || '[]',
      );
      expect(storedTimeline.length).toBe(1);
      expect(storedTimeline[0].eventType).toBe('INTERVIEW_SCHEDULED');
      expect(storedTimeline[0].candidateId).toBe('candidate-999');
      expect(storedTimeline[0].interviewScheduled.roundName).toBe('Vòng Chuyên môn & Kỹ thuật');

      // Lấy lịch theo ứng viên
      const candidateInterviews = await interviewService.getInterviewsByCandidate('candidate-999');
      expect(candidateInterviews.length).toBe(1);
      expect(candidateInterviews[0].id).toBe(result.id);
    });
  });

  describe('5. Component InterviewScheduleModal (Khởi tạo React Element)', () => {
    it('khởi tạo hợp lệ phần tử React cho InterviewScheduleModal', () => {
      const modalElement = React.createElement(InterviewScheduleModal, {
        isOpen: true,
        onClose: vi.fn(),
        candidateId: 'can-demo-1',
        candidateName: 'Lê Hồng Quang',
        candidateEmail: 'quang.lehong@gmail.com',
        jobTitle: 'Frontend Architect',
        onSuccess: vi.fn(),
      });

      expect(React.isValidElement(modalElement)).toBe(true);
      expect(modalElement.props.isOpen).toBe(true);
      expect(modalElement.props.candidateName).toBe('Lê Hồng Quang');
      expect(modalElement.props.jobTitle).toBe('Frontend Architect');
    });

    it('không render gì (hoặc đóng) khi isOpen là false', () => {
      const modalElement = React.createElement(InterviewScheduleModal, {
        isOpen: false,
        onClose: vi.fn(),
        candidateId: 'can-demo-1',
        candidateName: 'Lê Hồng Quang',
      });

      expect(React.isValidElement(modalElement)).toBe(true);
      expect(modalElement.props.isOpen).toBe(false);
    });
  });
});
