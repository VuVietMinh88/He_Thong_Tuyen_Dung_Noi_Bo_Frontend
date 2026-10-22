import { describe, it, expect } from 'vitest';
import {
  calculateCandidateTimeSlots,
  calculateTotalBatchDurationMinutes,
  validateBatchScheduleSettings,
  reorderCandidates,
  moveCandidateUp,
  moveCandidateDown,
  removeCandidateFromBatch,
  generateSampleMeetLink,
  checkSlotConflict,
  annotateSlotsWithConflicts,
  updateSingleSlotTime,
} from '../src/utils/batchInterviewHelper';
import type {
  BatchCandidateScheduleItem,
  BatchInterviewScheduleSettings,
} from '../src/types/interview';

describe('Task Jira TKNHTTDNB1-433: batchInterviewHelper Unit Tests (User Story S6-01)', () => {
  const mockCandidates: BatchCandidateScheduleItem[] = [
    {
      candidateId: 'cand-01',
      candidateName: 'Nguyễn Văn An',
      candidateEmail: 'an.nguyen@example.com',
      jobTitle: 'Frontend Developer',
      interviewRound: 'Vòng Kỹ thuật 1',
    },
    {
      candidateId: 'cand-02',
      candidateName: 'Trần Thị Bích',
      candidateEmail: 'bich.tran@example.com',
      jobTitle: 'Backend Engineer',
      interviewRound: 'Vòng Phỏng vấn Chuyên môn',
    },
    {
      candidateId: 'cand-03',
      candidateName: 'Lê Hoàng Nam',
      candidateEmail: 'nam.le@example.com',
      jobTitle: 'Fullstack Developer',
      interviewRound: 'Vòng Phỏng vấn Văn hóa',
    },
  ];

  const defaultSettings: BatchInterviewScheduleSettings = {
    interviewDate: '2099-10-20',
    startFirstSlotTime: '08:30',
    durationMinutes: 45,
    breakMinutes: 15,
    format: 'ONLINE',
    locationOrLink: 'https://meet.google.com/abc-defg-hij',
    interviewerIds: ['usr-001'],
    notes: 'Ứng viên chuẩn bị sẵn portfolio',
  };

  describe('1. calculateCandidateTimeSlots & calculateTotalBatchDurationMinutes', () => {
    it('tính toán tuần tự các ca phỏng vấn kèm thời gian nghỉ giãn cách chính xác', () => {
      const slots = calculateCandidateTimeSlots(mockCandidates, defaultSettings);

      expect(slots).toHaveLength(3);

      // Slot 1: 08:30 -> 09:15
      expect(slots[0].candidate.candidateId).toBe('cand-01');
      expect(slots[0].slotNumber).toBe(1);
      expect(slots[0].startTime).toBe('08:30');
      expect(slots[0].endTime).toBe('09:15');
      expect(slots[0].breakAfterMinutes).toBe(15);

      // Slot 2: 09:30 -> 10:15 (sau 15 phút nghỉ)
      expect(slots[1].candidate.candidateId).toBe('cand-02');
      expect(slots[1].slotNumber).toBe(2);
      expect(slots[1].startTime).toBe('09:30');
      expect(slots[1].endTime).toBe('10:15');
      expect(slots[1].breakAfterMinutes).toBe(15);

      // Slot 3: 10:30 -> 11:15 (sau 15 phút nghỉ)
      expect(slots[2].candidate.candidateId).toBe('cand-03');
      expect(slots[2].slotNumber).toBe(3);
      expect(slots[2].startTime).toBe('10:30');
      expect(slots[2].endTime).toBe('11:15');
      expect(slots[2].breakAfterMinutes).toBe(0); // Ca cuối cùng không tính break tiếp sau
    });

    it('tính chính xác tổng thời gian của toàn bộ buổi phỏng vấn', () => {
      // 3 ứng viên, 45 phút/ca, 15 phút nghỉ -> 3 * 45 + 2 * 15 = 135 + 30 = 165 phút
      const totalMinutes = calculateTotalBatchDurationMinutes(3, 45, 15);
      expect(totalMinutes).toBe(165);

      // Khi danh sách rỗng
      expect(calculateTotalBatchDurationMinutes(0, 45, 15)).toBe(0);
      // Khi chỉ có 1 ứng viên -> 0 phút nghỉ
      expect(calculateTotalBatchDurationMinutes(1, 30, 10)).toBe(30);
    });

    it('xử lý an toàn khi danh sách ứng viên trống', () => {
      const slots = calculateCandidateTimeSlots([], defaultSettings);
      expect(slots).toEqual([]);
    });
  });

  describe('2. validateBatchScheduleSettings', () => {
    it('trả về hợp lệ khi mọi thông số đáp ứng chuẩn AC', () => {
      const { isValid, errors } = validateBatchScheduleSettings(mockCandidates, defaultSettings);
      expect(isValid).toBe(true);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('báo lỗi khi danh sách ứng viên trống', () => {
      const { isValid, errors } = validateBatchScheduleSettings([], defaultSettings);
      expect(isValid).toBe(false);
      expect(errors.candidates).toBe('Danh sách ứng viên cần xếp lịch không được để trống.');
    });

    it('báo lỗi khi không chọn ngày phỏng vấn', () => {
      const { isValid, errors } = validateBatchScheduleSettings(mockCandidates, {
        ...defaultSettings,
        interviewDate: '',
      });
      expect(isValid).toBe(false);
      expect(errors.interviewDate).toBe('Vui lòng chọn ngày phỏng vấn.');
    });

    it('báo lỗi khi không chọn giờ bắt đầu', () => {
      const { isValid, errors } = validateBatchScheduleSettings(mockCandidates, {
        ...defaultSettings,
        startFirstSlotTime: '',
      });
      expect(isValid).toBe(false);
      expect(errors.startFirstSlotTime).toBe('Vui lòng chọn giờ bắt đầu ca đầu tiên.');
    });

    it('báo lỗi khi ngày giờ nằm trong quá khứ', () => {
      const { isValid, errors } = validateBatchScheduleSettings(
        mockCandidates,
        {
          ...defaultSettings,
          interviewDate: '2020-01-01',
          startFirstSlotTime: '08:00',
        },
        new Date('2026-10-15T00:00:00Z')
      );
      expect(isValid).toBe(false);
      expect(errors.startFirstSlotTime).toContain('quá khứ');
    });

    it('báo lỗi khi thời lượng mỗi ca <= 0', () => {
      const { isValid, errors } = validateBatchScheduleSettings(mockCandidates, {
        ...defaultSettings,
        durationMinutes: 0,
      });
      expect(isValid).toBe(false);
      expect(errors.durationMinutes).toBe('Thời lượng mỗi ca phỏng vấn phải lớn hơn 0 phút.');
    });

    it('báo lỗi khi thời gian nghỉ < 0', () => {
      const { isValid, errors } = validateBatchScheduleSettings(mockCandidates, {
        ...defaultSettings,
        breakMinutes: -5,
      });
      expect(isValid).toBe(false);
      expect(errors.breakMinutes).toBe('Thời gian nghỉ giãn cách giữa 2 ca không được âm.');
    });

    it('báo lỗi khi danh sách người phỏng vấn trống', () => {
      const { isValid, errors } = validateBatchScheduleSettings(mockCandidates, {
        ...defaultSettings,
        interviewerIds: [],
      });
      expect(isValid).toBe(false);
      expect(errors.interviewerIds).toBe('Bắt buộc chọn ít nhất 1 người phỏng vấn trong hội đồng.');
    });

    it('báo lỗi khi họp online mà thiếu đường link meeting', () => {
      const { isValid, errors } = validateBatchScheduleSettings(mockCandidates, {
        ...defaultSettings,
        format: 'ONLINE',
        locationOrLink: '',
      });
      expect(isValid).toBe(false);
      expect(errors.locationOrLink).toBe('Vui lòng cung cấp link họp trực tuyến (Google Meet, Zoom...).');
    });

    it('báo lỗi khi họp offline mà thiếu địa điểm/phòng họp', () => {
      const { isValid, errors } = validateBatchScheduleSettings(mockCandidates, {
        ...defaultSettings,
        format: 'OFFLINE',
        locationOrLink: '',
      });
      expect(isValid).toBe(false);
      expect(errors.locationOrLink).toBe('Vui lòng nhập tên phòng họp hoặc địa điểm phỏng vấn trực tiếp.');
    });
  });

  describe('3. Reordering & Item Manipulation Helpers', () => {
    it('reorderCandidates thay đổi vị trí chính xác', () => {
      const reordered = reorderCandidates(mockCandidates, 0, 2);
      expect(reordered[0].candidateId).toBe('cand-02');
      expect(reordered[1].candidateId).toBe('cand-03');
      expect(reordered[2].candidateId).toBe('cand-01');
    });

    it('moveCandidateUp di chuyển ứng viên lên trước', () => {
      const moved = moveCandidateUp(mockCandidates, 1);
      expect(moved[0].candidateId).toBe('cand-02');
      expect(moved[1].candidateId).toBe('cand-01');

      // Ứng viên đầu tiên di chuyển lên thì giữ nguyên
      const cantMove = moveCandidateUp(mockCandidates, 0);
      expect(cantMove[0].candidateId).toBe('cand-01');
    });

    it('moveCandidateDown di chuyển ứng viên xuống sau', () => {
      const moved = moveCandidateDown(mockCandidates, 1);
      expect(moved[1].candidateId).toBe('cand-03');
      expect(moved[2].candidateId).toBe('cand-02');

      // Ứng viên cuối cùng di chuyển xuống thì giữ nguyên
      const cantMove = moveCandidateDown(mockCandidates, 2);
      expect(cantMove[2].candidateId).toBe('cand-03');
    });

    it('removeCandidateFromBatch loại bỏ ứng viên khỏi danh sách', () => {
      const remaining = removeCandidateFromBatch(mockCandidates, 'cand-02');
      expect(remaining).toHaveLength(2);
      expect(remaining[0].candidateId).toBe('cand-01');
      expect(remaining[1].candidateId).toBe('cand-03');
    });

    it('generateSampleMeetLink sinh ra link Google Meet hợp lệ', () => {
      const link = generateSampleMeetLink();
      expect(link).toMatch(/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/);
    });
  });

  describe('4. Conflict Detection & Slot Editing Helpers (Task Jira TKNHTTDNB1-434)', () => {
    const mockExistingInterviews = [
      {
        id: 'existing-01',
        candidateId: 'can-other',
        candidateName: 'Hoàng Minh Quân',
        applicationId: 'app-other',
        jobTitle: 'Backend Engineer',
        roundName: 'Vòng Kỹ thuật',
        interviewDate: '2026-10-20',
        interviewTime: '09:00',
        startTime: '09:00',
        scheduledDateTimeISO: '2026-10-20T09:00:00Z',
        durationMinutes: 60,
        format: 'ONLINE' as const,
        locationOrLink: 'https://meet.google.com/xyz',
        interviewerIds: ['usr-001'],
        interviewers: [{ id: 'usr-001', name: 'Nguyễn Văn Lead', role: 'Technical Lead', email: 'lead@company.com' }],
        status: 'SCHEDULED' as const,
        createdAt: '2026-10-15T00:00:00Z',
      },
      {
        id: 'existing-room',
        candidateId: 'can-room',
        candidateName: 'Đặng Mai Phương',
        applicationId: 'app-room',
        jobTitle: 'HR Specialist',
        roundName: 'Vòng Phỏng vấn',
        interviewDate: '2026-10-20',
        interviewTime: '14:00',
        startTime: '14:00',
        scheduledDateTimeISO: '2026-10-20T14:00:00Z',
        durationMinutes: 45,
        format: 'OFFLINE' as const,
        locationOrLink: 'Phòng Họp Lotus - Tầng 8',
        interviewerIds: ['usr-other'],
        interviewers: [{ id: 'usr-other', name: 'Lê Văn HR', role: 'HR', email: 'hr@company.com' }],
        status: 'SCHEDULED' as const,
        createdAt: '2026-10-15T00:00:00Z',
      },
    ];

    it('checkSlotConflict phát hiện xung đột khi người phỏng vấn bị trùng lịch', () => {
      const slot = {
        candidate: mockCandidates[0],
        slotNumber: 1,
        startTime: '09:15', // Trùng khung giờ 09:00 - 10:00 của usr-001
        endTime: '10:00',
        startDateTimeISO: '2026-10-20T09:15:00',
        endDateTimeISO: '2026-10-20T10:00:00',
        durationMinutes: 45,
        breakAfterMinutes: 0,
      };

      const conflictInfo = checkSlotConflict(
        slot,
        '2026-10-20',
        ['usr-001'],
        mockExistingInterviews,
        'ONLINE',
        'https://meet.google.com/new'
      );

      expect(conflictInfo.hasConflict).toBe(true);
      expect(conflictInfo.conflictType).toBe('INTERVIEWER');
      expect(conflictInfo.conflictingInterviewerNames).toContain('Nguyễn Văn Lead');
      expect(conflictInfo.reasons[0]).toContain('Hoàng Minh Quân');
    });

    it('checkSlotConflict phát hiện xung đột phòng họp khi họp trực tiếp OFFLINE', () => {
      const slot = {
        candidate: mockCandidates[1],
        slotNumber: 2,
        startTime: '14:15', // Trùng khung giờ 14:00 - 14:45 của phòng Lotus
        endTime: '15:00',
        startDateTimeISO: '2026-10-20T14:15:00',
        endDateTimeISO: '2026-10-20T15:00:00',
        durationMinutes: 45,
        breakAfterMinutes: 0,
      };

      const conflictInfo = checkSlotConflict(
        slot,
        '2026-10-20',
        ['usr-freeman'],
        mockExistingInterviews,
        'OFFLINE',
        'Phòng Họp Lotus - Tầng 8'
      );

      expect(conflictInfo.hasConflict).toBe(true);
      expect(conflictInfo.conflictType).toBe('ROOM');
      expect(conflictInfo.reasons[0]).toContain('Phòng họp "Phòng Họp Lotus - Tầng 8" đang bị chiếm dụng');
    });

    it('checkSlotConflict không báo lỗi khi khung giờ hoàn toàn tách biệt', () => {
      const slot = {
        candidate: mockCandidates[0],
        slotNumber: 1,
        startTime: '11:00', // Không trùng
        endTime: '11:45',
        startDateTimeISO: '2026-10-20T11:00:00',
        endDateTimeISO: '2026-10-20T11:45:00',
        durationMinutes: 45,
        breakAfterMinutes: 0,
      };

      const conflictInfo = checkSlotConflict(
        slot,
        '2026-10-20',
        ['usr-001'],
        mockExistingInterviews,
        'ONLINE',
        'https://meet.google.com/new'
      );

      expect(conflictInfo.hasConflict).toBe(false);
      expect(conflictInfo.reasons).toHaveLength(0);
    });

    it('annotateSlotsWithConflicts gán đầy đủ thông tin xung đột cho toàn bộ ca', () => {
      const slots = [
        {
          candidate: mockCandidates[0],
          slotNumber: 1,
          startTime: '09:00', // Trùng với existing-01
          endTime: '09:45',
          startDateTimeISO: '2026-10-20T09:00:00',
          endDateTimeISO: '2026-10-20T09:45:00',
          durationMinutes: 45,
          breakAfterMinutes: 10,
        },
        {
          candidate: mockCandidates[1],
          slotNumber: 2,
          startTime: '11:00', // An toàn
          endTime: '11:45',
          startDateTimeISO: '2026-10-20T11:00:00',
          endDateTimeISO: '2026-10-20T11:45:00',
          durationMinutes: 45,
          breakAfterMinutes: 0,
        },
      ];

      const annotated = annotateSlotsWithConflicts(
        slots,
        {
          ...defaultSettings,
          interviewDate: '2026-10-20',
          interviewerIds: ['usr-001'],
        },
        mockExistingInterviews
      );

      expect(annotated[0].conflict?.hasConflict).toBe(true);
      expect(annotated[1].conflict?.hasConflict).toBe(false);
    });

    it('updateSingleSlotTime cập nhật thời gian, tính lại endTime và đánh dấu isCustomized', () => {
      const originalSlot = {
        candidate: mockCandidates[0],
        slotNumber: 1,
        startTime: '09:00',
        endTime: '09:45',
        startDateTimeISO: '2026-10-20T09:00:00',
        endDateTimeISO: '2026-10-20T09:45:00',
        durationMinutes: 45,
        breakAfterMinutes: 10,
      };

      const updated = updateSingleSlotTime(originalSlot, '2026-10-20', '10:30', 60);

      expect(updated.startTime).toBe('10:30');
      expect(updated.endTime).toBe('11:30');
      expect(updated.durationMinutes).toBe(60);
      expect(updated.isCustomized).toBe(true);
    });
  });
});
