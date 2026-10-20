import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  slaService,
  normalizeCandidateStage,
  SlaValidationError,
  SlaApiError,
} from '../src/services/slaService';
import type { CandidateProfile } from '../src/types/candidate';
import type { SlaSettings } from '../src/types/sla';
import { DEFAULT_SLA_SETTINGS } from '../src/types/sla';
import axiosClient from '../src/utils/axiosClient';

const storage = new Map<string, string>();

describe('TKNHTTDNB1-416 / S5-10: Cấu hình SLA và Dấu hiệu ứng viên quá hạn', () => {
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

  describe('AC 1: Quản lý Cấu hình SLA (SLA Configuration)', () => {
    it('lấy cấu hình SLA mặc định khi chưa có dữ liệu lưu', async () => {
      const settings = await slaService.getSlaSettings();
      expect(settings).toBeDefined();
      expect(settings.isGlobalSlaEnabled).toBe(true);
      expect(settings.stages.NEW.maxDays).toBe(3);
      expect(settings.stages.SCREENING.maxDays).toBe(3);
      expect(settings.stages.INTERVIEWING.maxDays).toBe(5);
      expect(settings.stages.OFFER.maxDays).toBe(4);
      expect(settings.stages.HIRED.maxDays).toBe(7);
      expect(settings.stages.REJECTED.isEnabled).toBe(false);
    });

    it('cập nhật cấu hình SLA thành công và lưu vào bộ nhớ', async () => {
      const updateData: Partial<SlaSettings> = {
        reminderTime: '10:30',
        stages: {
          ...DEFAULT_SLA_SETTINGS.stages,
          NEW: {
            ...DEFAULT_SLA_SETTINGS.stages.NEW,
            maxDays: 4,
          },
        },
      };

      const updated = await slaService.updateSlaSettings(updateData);
      expect(updated.reminderTime).toBe('10:30');
      expect(updated.stages.NEW.maxDays).toBe(4);

      // Đọc lại từ storage
      const fetched = await slaService.getSlaSettings();
      expect(fetched.stages.NEW.maxDays).toBe(4);
      expect(fetched.reminderTime).toBe('10:30');
    });

    it('đặt lại cấu hình SLA về mặc định (reset to default)', async () => {
      // Thay đổi cấu hình
      await slaService.updateSlaSettings({ reminderTime: '15:00' });
      // Reset
      const resetSettings = await slaService.resetSlaSettingsToDefault();
      expect(resetSettings.reminderTime).toBe('09:00');
      expect(resetSettings.stages.NEW.maxDays).toBe(3);
    });
  });

  describe('TKNHTTDNB1-417 (AC 1 & AC 2): saveSlaSettings - Bắt lỗi dữ liệu & Mã lỗi HTTP backend', () => {
    it('ném lỗi SlaValidationError khi số ngày SLA <= 0 hoặc không phải số nguyên dương', async () => {
      const invalidSettings: Partial<SlaSettings> = {
        stages: {
          ...DEFAULT_SLA_SETTINGS.stages,
          NEW: {
            ...DEFAULT_SLA_SETTINGS.stages.NEW,
            maxDays: 0,
          },
        },
      };

      await expect(slaService.saveSlaSettings(invalidSettings)).rejects.toThrow(SlaValidationError);

      try {
        await slaService.saveSlaSettings(invalidSettings);
      } catch (err) {
        expect(err).toBeInstanceOf(SlaValidationError);
        const valErr = err as SlaValidationError;
        expect(valErr.fieldErrors.NEW).toContain('lớn hơn 0 ngày');
      }
    });

    it('ném lỗi SlaValidationError khi số ngày cảnh báo trước >= ngưỡng SLA', async () => {
      const invalidSettings: Partial<SlaSettings> = {
        stages: {
          ...DEFAULT_SLA_SETTINGS.stages,
          NEW: {
            ...DEFAULT_SLA_SETTINGS.stages.NEW,
            maxDays: 3,
            warningDaysBefore: 3, // không được >= maxDays
          },
        },
      };

      await expect(slaService.saveSlaSettings(invalidSettings)).rejects.toThrow(SlaValidationError);
    });

    it('ném lỗi SlaApiError khi Backend trả về mã lỗi 400 Bad Request', async () => {
      vi.spyOn(axiosClient, 'put').mockRejectedValueOnce({
        response: { status: 400, data: { message: 'Tham số cấu hình không hợp lệ.' } },
      });

      await expect(
        slaService.saveSlaSettings({ reminderTime: '10:00' })
      ).rejects.toThrow(SlaApiError);

      try {
        vi.spyOn(axiosClient, 'put').mockRejectedValueOnce({
          response: { status: 400, data: { message: 'Tham số cấu hình không hợp lệ.' } },
        });
        await slaService.saveSlaSettings({ reminderTime: '10:00' });
      } catch (err) {
        expect(err).toBeInstanceOf(SlaApiError);
        expect((err as SlaApiError).statusCode).toBe(400);
      }
    });

    it('ném lỗi SlaApiError khi Backend trả về mã lỗi 403 Forbidden (không có quyền quản trị)', async () => {
      vi.spyOn(axiosClient, 'put').mockRejectedValueOnce({
        response: { status: 403, data: { message: 'Forbidden' } },
      });

      try {
        await slaService.saveSlaSettings({ reminderTime: '11:00' });
        expect.unreachable();
      } catch (err) {
        expect(err).toBeInstanceOf(SlaApiError);
        expect((err as SlaApiError).statusCode).toBe(403);
        expect((err as SlaApiError).message).toContain('không có quyền quản trị');
      }
    });

    it('ném lỗi SlaApiError khi Backend trả về mã lỗi 422 Unprocessable Entity', async () => {
      vi.spyOn(axiosClient, 'put').mockRejectedValueOnce({
        response: { status: 422, data: { message: 'Ngưỡng thời gian vi phạm chính sách công ty.' } },
      });

      try {
        await slaService.saveSlaSettings({ reminderTime: '12:00' });
        expect.unreachable();
      } catch (err) {
        expect(err).toBeInstanceOf(SlaApiError);
        expect((err as SlaApiError).statusCode).toBe(422);
      }
    });

    it('ném lỗi SlaApiError khi Backend trả về lỗi 500 Internal Server Error', async () => {
      vi.spyOn(axiosClient, 'put').mockRejectedValueOnce({
        response: { status: 500, data: { message: 'Internal Server Error' } },
      });

      try {
        await slaService.saveSlaSettings({ reminderTime: '08:00' });
        expect.unreachable();
      } catch (err) {
        expect(err).toBeInstanceOf(SlaApiError);
        expect((err as SlaApiError).statusCode).toBe(500);
        expect((err as SlaApiError).message).toContain('Máy chủ gặp sự cố');
      }
    });

    it('gọi API thành công qua PUT /sla-settings và cập nhật bộ nhớ tạm', async () => {
      const mockResult: SlaSettings = {
        ...DEFAULT_SLA_SETTINGS,
        reminderTime: '08:30',
      };
      vi.spyOn(axiosClient, 'put').mockResolvedValueOnce({ data: mockResult });

      const result = await slaService.saveSlaSettings({ reminderTime: '08:30' });
      expect(result.reminderTime).toBe('08:30');
      expect(axiosClient.put).toHaveBeenCalledWith('/sla-settings', expect.any(Object));
    });
  });

  describe('TKNHTTDNB1-417 (AC 1): getOverdueCandidateList - Lấy danh sách hồ sơ quá hạn', () => {
    it('gọi API /candidates/overdue khi server có kết nối', async () => {
      const mockOverdue: CandidateProfile[] = [
        {
          id: 'can-api-01',
          fullName: 'Trần Văn Quá Hạn',
          email: 'tvqh@test.com',
          phone: '0901234567',
          status: 'NEW',
          cvParsingStatus: 'CONFIRMED',
          appliedAt: '2026-10-01T00:00:00.000Z',
        },
      ];

      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({ data: mockOverdue });

      const result = await slaService.getOverdueCandidateList({ stage: 'NEW' });
      expect(axiosClient.get).toHaveBeenCalledWith('/candidates/overdue', {
        params: { stage: 'NEW', jobId: undefined },
      });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('can-api-01');
    });

    it('fallback tính toán offline khi API quá hạn ném lỗi', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Network error'));

      const candidates: CandidateProfile[] = [
        {
          id: 'can-safe',
          fullName: 'Nguyễn An Toàn',
          email: 'safe@test.com',
          phone: '0900000001',
          status: 'NEW',
          cvParsingStatus: 'CONFIRMED',
          appliedAt: new Date().toISOString(), // 0 ngày -> an toàn
        },
        {
          id: 'can-late',
          fullName: 'Lê Quá Hạn',
          email: 'late@test.com',
          phone: '0900000002',
          status: 'NEW',
          cvParsingStatus: 'CONFIRMED',
          appliedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 ngày > 3 ngày -> quá hạn
        },
      ];

      const overdueList = await slaService.getOverdueCandidateList({
        candidateList: candidates,
      });

      expect(overdueList.length).toBe(1);
      expect(overdueList[0].id).toBe('can-late');
    });
  });

  describe('AC 2: Tính toán SLA & Dấu hiệu nhận diện quá hạn (Overdue Flagging)', () => {
    const fixedNowMs = new Date('2026-10-14T10:00:00.000Z').getTime();

    it('hồ sơ mới nộp hôm nay (0 ngày) là ON_TRACK (đúng hạn)', () => {
      const candidate: CandidateProfile = {
        id: 'can-01',
        fullName: 'Nguyễn Văn A',
        email: 'nva@test.com',
        phone: '0901234567',
        status: 'NEW',
        cvParsingStatus: 'CONFIRMED',
        appliedAt: new Date(fixedNowMs).toISOString(),
      };

      const evalResult = slaService.calculateCandidateSla(candidate, DEFAULT_SLA_SETTINGS, fixedNowMs);
      expect(evalResult.status).toBe('ON_TRACK');
      expect(evalResult.daysInStage).toBe(0);
      expect(evalResult.remainingDays).toBe(3);
      expect(evalResult.isOverdue).toBe(false);
      expect(evalResult.isWarning).toBe(false);
    });

    it('hồ sơ nộp 2 ngày trước tại giai đoạn NEW (ngưỡng 3 ngày) chuyển sang WARNING (còn 1 ngày)', () => {
      const twoDaysAgo = new Date(fixedNowMs - 2 * 24 * 60 * 60 * 1000).toISOString();
      const candidate: CandidateProfile = {
        id: 'can-02',
        fullName: 'Trần Thị B',
        email: 'ttb@test.com',
        phone: '0901234568',
        status: 'NEW',
        cvParsingStatus: 'CONFIRMED',
        appliedAt: twoDaysAgo,
      };

      const evalResult = slaService.calculateCandidateSla(candidate, DEFAULT_SLA_SETTINGS, fixedNowMs);
      expect(evalResult.status).toBe('WARNING');
      expect(evalResult.daysInStage).toBe(2);
      expect(evalResult.remainingDays).toBe(1);
      expect(evalResult.badgeText).toBe('Còn 1 ngày');
      expect(evalResult.isOverdue).toBe(false);
      expect(evalResult.isWarning).toBe(true);
    });

    it('hồ sơ nộp 3 ngày trước tại giai đoạn NEW chuyển sang WARNING (đến hạn hôm nay)', () => {
      const threeDaysAgo = new Date(fixedNowMs - 3 * 24 * 60 * 60 * 1000).toISOString();
      const candidate: CandidateProfile = {
        id: 'can-03',
        fullName: 'Lê Văn C',
        email: 'lvc@test.com',
        phone: '0901234569',
        status: 'NEW',
        cvParsingStatus: 'CONFIRMED',
        appliedAt: threeDaysAgo,
      };

      const evalResult = slaService.calculateCandidateSla(candidate, DEFAULT_SLA_SETTINGS, fixedNowMs);
      expect(evalResult.status).toBe('WARNING');
      expect(evalResult.daysInStage).toBe(3);
      expect(evalResult.remainingDays).toBe(0);
      expect(evalResult.badgeText).toBe('Đến hạn hôm nay');
      expect(evalResult.isOverdue).toBe(false);
    });

    it('hồ sơ nộp 5 ngày trước tại giai đoạn NEW (ngưỡng 3 ngày) chuyển sang OVERDUE (quá hạn 2 ngày)', () => {
      const fiveDaysAgo = new Date(fixedNowMs - 5 * 24 * 60 * 60 * 1000).toISOString();
      const candidate: CandidateProfile = {
        id: 'can-04',
        fullName: 'Phạm Minh D',
        email: 'pmd@test.com',
        phone: '0901234570',
        status: 'NEW',
        cvParsingStatus: 'CONFIRMED',
        appliedAt: fiveDaysAgo,
      };

      const evalResult = slaService.calculateCandidateSla(candidate, DEFAULT_SLA_SETTINGS, fixedNowMs);
      expect(evalResult.status).toBe('OVERDUE');
      expect(evalResult.daysInStage).toBe(5);
      expect(evalResult.overdueDays).toBe(2);
      expect(evalResult.badgeText).toBe('Quá hạn SLA 2 ngày');
      expect(evalResult.isOverdue).toBe(true);
      expect(evalResult.isWarning).toBe(false);
    });

    it('hồ sơ ở giai đoạn LOẠI HỒ SƠ hoặc RÚT LUI được MIỄN TRỪ (EXEMPT)', () => {
      const tenDaysAgo = new Date(fixedNowMs - 10 * 24 * 60 * 60 * 1000).toISOString();
      const rejectedCandidate: CandidateProfile = {
        id: 'can-05',
        fullName: 'Đỗ Hoàng E',
        email: 'dhe@test.com',
        phone: '0901234571',
        status: 'REJECTED',
        cvParsingStatus: 'CONFIRMED',
        appliedAt: tenDaysAgo,
      };

      const evalResult = slaService.calculateCandidateSla(rejectedCandidate, DEFAULT_SLA_SETTINGS, fixedNowMs);
      expect(evalResult.status).toBe('EXEMPT');
      expect(evalResult.isOverdue).toBe(false);
    });

    it('lọc danh sách các hồ sơ quá hạn (filterOverdueCandidates)', () => {
      const candidates: CandidateProfile[] = [
        {
          id: 'can-ok',
          fullName: 'An Toàn',
          email: 'ok@test.com',
          phone: '0900000001',
          status: 'NEW',
          cvParsingStatus: 'CONFIRMED',
          appliedAt: new Date(fixedNowMs).toISOString(),
        },
        {
          id: 'can-overdue-1',
          fullName: 'Quá Hạn 1',
          email: 'ov1@test.com',
          phone: '0900000002',
          status: 'NEW',
          cvParsingStatus: 'CONFIRMED',
          appliedAt: new Date(fixedNowMs - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'can-overdue-2',
          fullName: 'Quá Hạn 2',
          email: 'ov2@test.com',
          phone: '0900000003',
          status: 'SCREENING',
          cvParsingStatus: 'CONFIRMED',
          updatedAt: new Date(fixedNowMs - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const overdueList = slaService.filterOverdueCandidates(candidates, DEFAULT_SLA_SETTINGS, fixedNowMs);
      expect(overdueList.length).toBe(2);
      expect(overdueList.map((c) => c.id)).toEqual(['can-overdue-1', 'can-overdue-2']);
    });
  });

  describe('AC 3: Cơ chế nhắc việc hằng ngày & KHÔNG nhắc trùng trong cùng 1 ngày', () => {
    const fixedNowMs = new Date('2026-10-14T10:00:00.000Z').getTime();

    const sampleCandidates: CandidateProfile[] = [
      {
        id: 'can-overdue-88',
        fullName: 'Vũ Quốc Thái',
        email: 'vqt@test.com',
        phone: '0912345678',
        status: 'NEW',
        appliedJobTitle: 'Senior Frontend Developer',
        cvParsingStatus: 'CONFIRMED',
        appliedAt: new Date(fixedNowMs - 5 * 24 * 60 * 60 * 1000).toISOString(), // quá hạn 2 ngày
      },
    ];

    it('tạo thông báo nhắc việc khi có hồ sơ quá hạn SLA', () => {
      slaService.clearReminders();
      const reminders = slaService.runDailySlaCheck(sampleCandidates, DEFAULT_SLA_SETTINGS, '2026-10-14');

      expect(reminders.length).toBe(1);
      const reminder = reminders[0];
      expect(reminder.candidateId).toBe('can-overdue-88');
      expect(reminder.candidateName).toBe('Vũ Quốc Thái');
      expect(reminder.overdueDays).toBe(2);
      expect(reminder.reminderDate).toBe('2026-10-14');
      expect(reminder.isRead).toBe(false);
      expect(reminder.message).toContain('quá hạn SLA 2 ngày');
    });

    it('KHÔNG nhắc trùng lặp trong cùng một ngày cho cùng một hồ sơ (AC 3)', () => {
      slaService.clearReminders();

      // Lần chạy 1 vào sáng 09:00 ngày 2026-10-14
      const firstRun = slaService.runDailySlaCheck(sampleCandidates, DEFAULT_SLA_SETTINGS, '2026-10-14');
      expect(firstRun.length).toBe(1);

      // Lần chạy 2 vào chiều 14:00 cùng ngày 2026-10-14
      const secondRun = slaService.runDailySlaCheck(sampleCandidates, DEFAULT_SLA_SETTINGS, '2026-10-14');
      // Số lượng nhắc việc vẫn là 1 (không bị nhân đôi hay spam thông báo)
      expect(secondRun.length).toBe(1);
      expect(secondRun[0].id).toBe(firstRun[0].id);

      // Lần chạy 3 vào tối cùng ngày
      const thirdRun = slaService.runDailySlaCheck(sampleCandidates, DEFAULT_SLA_SETTINGS, '2026-10-14');
      expect(thirdRun.length).toBe(1);
    });

    it('cho phép nhắc việc tiếp theo khi bước sang ngày mới (2026-10-15)', () => {
      slaService.clearReminders();

      // Ngày 1 (2026-10-14)
      const day1Reminders = slaService.runDailySlaCheck(sampleCandidates, DEFAULT_SLA_SETTINGS, '2026-10-14');
      expect(day1Reminders.length).toBe(1);

      // Ngày 2 (2026-10-15) - sang ngày hôm sau
      const day2Reminders = slaService.runDailySlaCheck(sampleCandidates, DEFAULT_SLA_SETTINGS, '2026-10-15');
      // Tạo thêm 1 thông báo cho ngày mới
      expect(day2Reminders.length).toBe(2);
      expect(day2Reminders[0].reminderDate).toBe('2026-10-15');
      expect(day2Reminders[1].reminderDate).toBe('2026-10-14');
    });

    it('đánh dấu một thông báo đã đọc và tất cả đã đọc', () => {
      slaService.clearReminders();
      const reminders = slaService.runDailySlaCheck(sampleCandidates, DEFAULT_SLA_SETTINGS, '2026-10-14');
      const reminderId = reminders[0].id;

      // Đánh dấu 1 thông báo đã đọc
      slaService.markReminderAsRead(reminderId);
      const stored = slaService.getStoredDailyReminders();
      expect(stored[0].isRead).toBe(true);

      // Đánh dấu tất cả đã đọc
      slaService.markAllRemindersAsRead();
      const allRead = slaService.getStoredDailyReminders();
      expect(allRead.every((r) => r.isRead)).toBe(true);
    });
  });

  describe('Chuẩn hóa giai đoạn ứng viên (normalizeCandidateStage)', () => {
    it('nhận diện chính xác các biến thể tiếng Việt và tiếng Anh', () => {
      expect(normalizeCandidateStage('NEW')).toBe('NEW');
      expect(normalizeCandidateStage('Hồ sơ mới')).toBe('NEW');
      expect(normalizeCandidateStage('Đang duyệt')).toBe('SCREENING');
      expect(normalizeCandidateStage('Sàng lọc')).toBe('SCREENING');
      expect(normalizeCandidateStage('Phỏng vấn')).toBe('INTERVIEWING');
      expect(normalizeCandidateStage('Đề xuất offer')).toBe('OFFER');
      expect(normalizeCandidateStage('Trúng tuyển')).toBe('HIRED');
      expect(normalizeCandidateStage('Từ chối')).toBe('REJECTED');
      expect(normalizeCandidateStage('Ứng viên rút lui')).toBe('WITHDRAWN');
      expect(normalizeCandidateStage(undefined)).toBe('NEW');
    });
  });
});
