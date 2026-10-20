import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { CandidateProfile } from '../src/types/candidate';
import type {
  BatchCreateInterviewSchedulePayload,
  BatchInterviewScheduleSettings,
} from '../src/types/interview';
import {
  interviewService,
  LOCAL_STORAGE_INTERVIEWS_KEY,
} from '../src/services/interviewService';
import { BatchInterviewScheduleModal } from '../src/components/Candidate/BatchInterviewScheduleModal';
import { CandidateManagementPage } from '../src/pages/Candidate/CandidateManagementPage';
import axiosClient from '../src/utils/axiosClient';

describe('Task Jira TKNHTTDNB1-433: Giao diện xếp lịch nhiều ứng viên (User Story S6-01)', () => {
  const mockCandidates: CandidateProfile[] = [
    {
      id: 'cand-001',
      fullName: 'Nguyễn Văn An',
      email: 'an.nguyen@company.com',
      phone: '0988111222',
      appliedJobId: 'job-fe-01',
      appliedJobTitle: 'Senior Frontend Developer (React, TypeScript)',
      departmentName: 'Khối Công nghệ & Sản phẩm',
      experienceYears: 5,
      educationLevel: 'Cử nhân CNTT - ĐH Bách Khoa',
      status: 'INTERVIEWING',
      cvParsingStatus: 'CONFIRMED',
      rating: 5,
      skills: ['React', 'TypeScript', 'Tailwind CSS'],
      source: 'Website công ty',
      cvFileName: 'NguyenVanAn_CV.pdf',
      appliedAt: '2026-10-10T10:00:00.000Z',
    },
    {
      id: 'cand-002',
      fullName: 'Trần Thị Bích',
      email: 'bich.tran@company.com',
      phone: '0977222333',
      appliedJobId: 'job-be-02',
      appliedJobTitle: 'Senior Java Backend Engineer (Spring Boot)',
      departmentName: 'Khối Công nghệ & Sản phẩm',
      experienceYears: 6,
      educationLevel: 'Thạc sĩ Khoa học Máy tính',
      status: 'INTERVIEWING',
      cvParsingStatus: 'CONFIRMED',
      rating: 4,
      skills: ['Java', 'Spring Boot', 'PostgreSQL'],
      source: 'LinkedIn',
      cvFileName: 'TranThiBich_Resume.pdf',
      appliedAt: '2026-10-11T11:00:00.000Z',
    },
  ];

  let localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorageMock = {};

    const mockStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = String(value);
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(() => null),
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Render BatchInterviewScheduleModal', () => {
    it('hiển thị đầy đủ danh sách ứng viên, thông tin vị trí và cấu hình khi mở modal', () => {
      const html = renderToString(
        <BatchInterviewScheduleModal
          isOpen={true}
          candidates={mockCandidates}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      // Kiểm tra tiêu đề modal và số lượng ứng viên
      expect(html).toContain('Xếp lịch phỏng vấn đồng loạt');
      expect(html).toContain('2 ứng viên');

      // Kiểm tra danh sách ứng viên hiển thị đúng họ tên, email và vị trí
      expect(html).toContain('Nguyễn Văn An');
      expect(html).toContain('an.nguyen@company.com');
      expect(html).toContain('Senior Frontend Developer (React, TypeScript)');

      expect(html).toContain('Trần Thị Bích');
      expect(html).toContain('bich.tran@company.com');
      expect(html).toContain('Senior Java Backend Engineer (Spring Boot)');

      // Kiểm tra các trường cấu hình thông số ca phỏng vấn
      expect(html).toContain('Ngày phỏng vấn');
      expect(html).toContain('Giờ bắt đầu ca đầu');
      expect(html).toContain('Thời lượng mỗi ca (phút)');
      expect(html).toContain('Nghỉ giãn cách giữa 2 ca');
      expect(html).toContain('Hội đồng phỏng vấn');
      expect(html).toContain('Hình thức &amp; Địa điểm');
    });

    it('không render gì khi isOpen = false', () => {
      const html = renderToString(
        <BatchInterviewScheduleModal
          isOpen={false}
          candidates={mockCandidates}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      expect(html).toBe('');
    });
  });

  describe('2. interviewService.batchCreateInterviewSchedules', () => {
    const validSettings: BatchInterviewScheduleSettings = {
      interviewDate: '2026-10-25',
      startFirstSlotTime: '09:00',
      durationMinutes: 45,
      breakMinutes: 10,
      format: 'ONLINE',
      locationOrLink: 'https://meet.google.com/abc-defg-hij',
      interviewerIds: ['usr-001'],
      notes: 'Phỏng vấn vòng 1',
    };

    const validPayload: BatchCreateInterviewSchedulePayload = {
      settings: validSettings,
      slots: [
        {
          candidate: {
            candidateId: 'cand-001',
            candidateName: 'Nguyễn Văn An',
            candidateEmail: 'an.nguyen@company.com',
            jobTitle: 'Frontend Developer',
            interviewRound: 'Vòng 1',
          },
          slotNumber: 1,
          startTime: '09:00',
          endTime: '09:45',
          startDateTimeISO: '2026-10-25T02:00:00.000Z',
          endDateTimeISO: '2026-10-25T02:45:00.000Z',
          durationMinutes: 45,
          breakAfterMinutes: 10,
        },
        {
          candidate: {
            candidateId: 'cand-002',
            candidateName: 'Trần Thị Bích',
            candidateEmail: 'bich.tran@company.com',
            jobTitle: 'Backend Engineer',
            interviewRound: 'Vòng 1',
          },
          slotNumber: 2,
          startTime: '09:55',
          endTime: '10:40',
          startDateTimeISO: '2026-10-25T02:55:00.000Z',
          endDateTimeISO: '2026-10-25T03:40:00.000Z',
          durationMinutes: 45,
          breakAfterMinutes: 0,
        },
      ],
    };

    it('gọi API POST /recruitment/interviews/batch-schedule khi backend phản hồi thành công', async () => {
      const mockApiResponse = {
        totalScheduled: 2,
        scheduledInterviews: [
          {
            id: 'sched-01',
            candidateId: 'cand-001',
            candidateName: 'Nguyễn Văn An',
            roundName: 'Vòng 1',
            interviewDate: '2026-10-25',
            startTime: '09:00',
            durationMinutes: 45,
            format: 'ONLINE',
            locationOrLink: 'https://meet.google.com/abc-defg-hij',
            interviewerIds: ['usr-001'],
            interviewers: [],
            status: 'SCHEDULED',
            createdAt: '2026-10-15T00:00:00.000Z',
          },
        ],
        message: 'Thành công',
      };

      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: mockApiResponse,
      });

      const result = await interviewService.batchCreateInterviewSchedules(validPayload);

      expect(postSpy).toHaveBeenCalledWith(
        '/recruitment/interviews/batch-schedule',
        validPayload
      );
      expect(result.totalScheduled).toBe(2);
    });

    it('fallback lưu trữ localStorage khi backend trả về lỗi mạng', async () => {
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(new Error('Network error'));

      const result = await interviewService.batchCreateInterviewSchedules(validPayload);

      expect(result.totalScheduled).toBe(2);
      expect(result.scheduledInterviews).toHaveLength(2);
      expect(result.scheduledInterviews[0].candidateName).toBe('Nguyễn Văn An');
      expect(result.scheduledInterviews[0].locationOrLink).toBe('https://meet.google.com/abc-defg-hij');

      // Kiểm tra lịch đã được đồng bộ vào localStorage
      const stored = localStorage.getItem(LOCAL_STORAGE_INTERVIEWS_KEY);
      expect(stored).not.toBeNull();
      expect(stored).toContain('Nguyễn Văn An');
    });
  });

  describe('3. Tích hợp thanh thao tác hàng loạt trên CandidateManagementPage', () => {
    it('CandidateManagementPage render giao diện chuẩn ban đầu khi chưa chọn ứng viên', () => {
      const html = renderToString(
        <MemoryRouter>
          <CandidateManagementPage initialCandidates={mockCandidates} initialIsLoading={false} />
        </MemoryRouter>
      );

      // Ban đầu khi chưa chọn ứng viên nào, thanh bulk-action-bar không hiển thị
      expect(html).not.toContain('data-testid="bulk-action-bar"');
      expect(html).not.toContain('data-testid="bulk-schedule-interviews-btn"');
    });
  });
});
