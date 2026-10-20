import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import type {
  BatchInterviewScheduleSettings,
  CalculatedCandidateSlot,
} from '../src/types/interview';
import { LOCAL_STORAGE_INTERVIEWS_KEY } from '../src/services/interviewService';
import { BatchSchedulePreviewModal } from '../src/components/Candidate/BatchSchedulePreviewModal';
import { BatchInterviewScheduleModal } from '../src/components/Candidate/BatchInterviewScheduleModal';
import axiosClient from '../src/utils/axiosClient';

describe('Task Jira TKNHTTDNB1-434: Hiển thị xem trước và xác nhận lịch hàng loạt (User Story S6-01)', () => {
  const mockSettings: BatchInterviewScheduleSettings = {
    interviewDate: '2026-10-25',
    startFirstSlotTime: '09:00',
    durationMinutes: 45,
    breakMinutes: 10,
    format: 'ONLINE',
    locationOrLink: 'https://meet.google.com/abc-defg-hij',
    interviewerIds: ['usr-001', 'usr-002'],
    notes: 'Vòng phỏng vấn kỹ thuật',
    sendCalendarInvite: true,
  };

  const mockSlots: CalculatedCandidateSlot[] = [
    {
      candidate: {
        candidateId: 'cand-001',
        candidateName: 'Nguyễn Văn An',
        candidateEmail: 'an.nguyen@company.com',
        jobTitle: 'Senior Frontend Developer',
        interviewRound: 'Vòng Kỹ thuật 1',
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
        jobTitle: 'Java Backend Engineer',
        interviewRound: 'Vòng Kỹ thuật 1',
      },
      slotNumber: 2,
      startTime: '09:55',
      endTime: '10:40',
      startDateTimeISO: '2026-10-25T02:55:00.000Z',
      endDateTimeISO: '2026-10-25T03:40:00.000Z',
      durationMinutes: 45,
      breakAfterMinutes: 0,
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

  describe('1. AC 1: Bảng xem trước lịch phân bổ (Schedule Timeline Preview)', () => {
    it('hiển thị đầy đủ danh sách ca phỏng vấn, khung giờ, ứng viên, người phỏng vấn và hình thức', () => {
      const html = renderToString(
        <BatchSchedulePreviewModal
          isOpen={true}
          settings={mockSettings}
          initialSlots={mockSlots}
          onBack={vi.fn()}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      // Header modal
      expect(html).toContain('Xem trước &amp; Xác nhận lịch phỏng vấn hàng loạt');
      expect(html).toContain('2 ca phỏng vấn');
      expect(html).toContain('2026-10-25');
      expect(html).toContain('https://meet.google.com/abc-defg-hij');

      // Ca 1: Nguyễn Văn An (09:00 - 09:45)
      expect(html).toContain('Nguyễn Văn An');
      expect(html).toContain('an.nguyen@company.com');
      expect(html).toContain('Senior Frontend Developer');
      expect(html).toContain('09:00 - 09:45');

      // Ca 2: Trần Thị Bích (09:55 - 10:40)
      expect(html).toContain('Trần Thị Bích');
      expect(html).toContain('bich.tran@company.com');
      expect(html).toContain('Java Backend Engineer');
      expect(html).toContain('09:55 - 10:40');

      // Nút chỉnh sửa ca
      expect(html).toContain('data-testid="btn-edit-slot-1"');
      expect(html).toContain('data-testid="btn-edit-slot-2"');
    });

    it('hiển thị badge "Đã điều chỉnh riêng" khi ca phỏng vấn có cờ isCustomized = true', () => {
      const customizedSlots: CalculatedCandidateSlot[] = [
        {
          ...mockSlots[0],
          startTime: '10:00',
          endTime: '11:00',
          durationMinutes: 60,
          isCustomized: true,
        },
      ];

      const html = renderToString(
        <BatchSchedulePreviewModal
          isOpen={true}
          settings={mockSettings}
          initialSlots={customizedSlots}
          onBack={vi.fn()}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      expect(html).toContain('data-testid="customized-badge-1"');
      expect(html).toContain('Đã điều chỉnh riêng');
      expect(html).toContain('10:00 - 11:00');
    });

    it('không render gì khi isOpen = false', () => {
      const html = renderToString(
        <BatchSchedulePreviewModal
          isOpen={false}
          settings={mockSettings}
          initialSlots={mockSlots}
          onBack={vi.fn()}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      expect(html).toBe('');
    });
  });

  describe('2. AC 2: Cảnh báo trùng lịch (Conflict Detection)', () => {
    it('hiển thị no-conflict-banner màu xanh khi không phát hiện trùng lịch', () => {
      const html = renderToString(
        <BatchSchedulePreviewModal
          isOpen={true}
          settings={mockSettings}
          initialSlots={mockSlots}
          onBack={vi.fn()}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      expect(html).toContain('data-testid="no-conflict-banner"');
      expect(html).toContain('Tất cả 2 ca phỏng vấn đều hợp lệ');
      expect(html).not.toContain('data-testid="conflict-alert-banner"');
    });

    it('hiển thị conflict-alert-banner và badge cảnh báo đỏ khi phát hiện người phỏng vấn bị trùng lịch', () => {
      // Giả lập trong LocalStorage đã có 1 cuộc phỏng vấn trùng khung giờ 09:00 - 09:45 của usr-001
      const conflictingExistingInterview = [
        {
          id: 'existing-intv-999',
          candidateId: 'can-busy',
          candidateName: 'Lê Quốc Bảo',
          applicationId: 'app-busy',
          jobTitle: 'Frontend Engineer',
          roundName: 'Vòng Kỹ thuật',
          interviewDate: '2026-10-25',
          interviewTime: '09:00',
          startTime: '09:00',
          durationMinutes: 45,
          format: 'ONLINE' as const,
          locationOrLink: 'https://meet.google.com/busy',
          interviewerIds: ['usr-001'],
          interviewers: [{ id: 'usr-001', name: 'Nguyễn Văn Lead', role: 'Technical Lead', email: 'lead@company.com' }],
          status: 'SCHEDULED' as const,
          createdAt: '2026-10-15T00:00:00Z',
        },
      ];

      localStorageMock[LOCAL_STORAGE_INTERVIEWS_KEY] = JSON.stringify(conflictingExistingInterview);

      const html = renderToString(
        <BatchSchedulePreviewModal
          isOpen={true}
          settings={mockSettings}
          initialSlots={mockSlots}
          onBack={vi.fn()}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      // Kiểm tra banner cảnh báo trùng lịch
      expect(html).toContain('data-testid="conflict-alert-banner"');
      expect(html).toContain('Cảnh báo: Phát hiện 1 ca phỏng vấn bị trùng lịch!');

      // Kiểm tra badge và viền đỏ ở ca 1
      expect(html).toContain('data-testid="conflict-badge-1"');
      expect(html).toContain('Trùng lịch phỏng vấn');
      expect(html).toContain('data-testid="conflict-reasons-box-1"');
      expect(html).toContain('Lê Quốc Bảo');
    });
  });

  describe('3. AC 3 & AC 4: Tùy chọn thông báo Calendar Invite & Xác nhận tạo lịch qua API', () => {
    it('hiển thị checkbox tự động gửi Calendar Invite & email', () => {
      const html = renderToString(
        <BatchSchedulePreviewModal
          isOpen={true}
          settings={mockSettings}
          initialSlots={mockSlots}
          onBack={vi.fn()}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      expect(html).toContain('data-testid="checkbox-calendar-invite"');
      expect(html).toContain('Tự động gửi email thông báo kèm thư mời lịch (Calendar Invite)');
      expect(html).toContain('data-testid="btn-back-to-settings"');
      expect(html).toContain('data-testid="btn-confirm-create-batch-schedule"');
    });

    it('không báo đã gửi Calendar Invite khi batch chưa có contract', async () => {
      const post = vi.spyOn(axiosClient, 'post');
      const { interviewService } = await import('../src/services/interviewService');
      await expect(interviewService.batchCreateInterviewSchedules({ settings: mockSettings, slots: mockSlots, sendCalendarInvite: true }))
        .rejects.toMatchObject({ statusCode: 501 });
      expect(post).not.toHaveBeenCalled();
    });
  });

  describe('4. Tích hợp trong BatchInterviewScheduleModal', () => {
    it('BatchInterviewScheduleModal có nút Tiếp tục: Xem trước & Xác nhận ở bước 1', () => {
      const html = renderToString(
        <BatchInterviewScheduleModal
          isOpen={true}
          candidates={[
            {
              id: 'c1',
              fullName: 'Ứng viên Test',
              email: 'test@example.com',
              phone: '0988111222',
              status: 'INTERVIEWING',
              cvParsingStatus: 'CONFIRMED',
              appliedAt: '2026-10-15T00:00:00Z',
            },
          ]}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      expect(html).toContain('data-testid="btn-submit-batch"');
      expect(html).toContain('Tiếp tục: Xem trước &amp; Xác nhận (1)');
    });
  });
});
