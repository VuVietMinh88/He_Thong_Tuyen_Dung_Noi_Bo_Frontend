import type { CandidateProfile, CandidateStage } from '../types/candidate';
import { CANDIDATE_STAGE_CONFIG } from '../types/candidate';
import type {
  SlaSettings,
  CandidateSlaEvaluation,
  SlaDailyReminder,
} from '../types/sla';
import { DEFAULT_SLA_SETTINGS } from '../types/sla';
import axiosClient from '../utils/axiosClient';
import { candidateService } from './candidateService';

export class SlaValidationError extends Error {
  public fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'SlaValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class SlaApiError extends Error {
  public statusCode?: number;
  public details?: unknown;

  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = 'SlaApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

const STORAGE_KEY_SETTINGS = 'smart_recruit_sla_settings';
const STORAGE_KEY_REMINDERS = 'smart_recruit_sla_reminders';
const STORAGE_KEY_REMINDED_LOG = 'smart_recruit_sla_reminded_log';

/**
 * Chuẩn hóa tên giai đoạn từ chuỗi trạng thái của ứng viên
 */
export const normalizeCandidateStage = (status?: string): CandidateStage => {
  if (!status) return 'NEW';
  const clean = status.trim().toUpperCase().replace(/[-\s]+/g, '_');

  if (['NEW', 'APPLIED', 'RECEIVED', 'MỚI_TIẾP_NHẬN', 'HỒ_SƠ_MỚI', 'ĐÃ_NHẬN_HỒ_SƠ'].includes(clean)) {
    return 'NEW';
  }
  if (['SCREENING', 'IN_REVIEW', 'REVIEWING', 'ĐANG_ĐÁNH_GIÁ', 'SÀNG_LỌC', 'ĐANG_DUYỆT'].includes(clean)) {
    return 'SCREENING';
  }
  if (['INTERVIEWING', 'INTERVIEW', 'PHỎNG_VẤN'].includes(clean)) {
    return 'INTERVIEWING';
  }
  if (['OFFER', 'OFFERED', 'ĐỀ_XUẤT_OFFER', 'ĐÃ_GỬI_OFFER'].includes(clean)) {
    return 'OFFER';
  }
  if (['HIRED', 'ACCEPTED', 'TRÚNG_TUYỂN', 'NHẬN_VIỆC', 'ĐÃ_TUYỂN'].includes(clean)) {
    return 'HIRED';
  }
  if (['REJECTED', 'DECLINED', 'TỪ_CHỐI', 'LOẠI_HỒ_SƠ', 'CHƯA_PHÙ_HỢP'].includes(clean)) {
    return 'REJECTED';
  }
  if (['WITHDRAWN', 'WITHDRAW', 'ĐÃ_RÚT_HỒ_SƠ', 'ỨNG_VIÊN_RÚT_LUI'].includes(clean)) {
    return 'WITHDRAWN';
  }

  return 'NEW';
};

/**
 * Trả về chuỗi ngày YYYY-MM-DD theo múi giờ Việt Nam
 */
export const getTodayDateString = (dateObj: Date = new Date()): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(dateObj); // định dạng YYYY-MM-DD
  } catch {
    return dateObj.toISOString().slice(0, 10);
  }
};

export const slaService = {
  /**
   * 1. Lấy cấu hình SLA hiện tại (AC 1)
   */
  async getSlaSettings(): Promise<SlaSettings> {
    try {
      const response = await axiosClient.get<SlaSettings>('/sla-settings');
      if (response?.data && response.data.stages) {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(response.data));
        return response.data;
      }
    } catch {
      // Fallback xuống LocalStorage hoặc cấu hình mặc định
    }

    try {
      const cached = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (cached) {
        const parsed = JSON.parse(cached) as SlaSettings;
        if (parsed.stages) return parsed;
      }
    } catch {
      // Lỗi parse cache
    }

    return DEFAULT_SLA_SETTINGS;
  },

  /**
   * 2. Kiểm tra tính hợp lệ của dữ liệu cấu hình SLA (AC 1, AC 2)
   */
  validateSlaSettings(settings: Partial<SlaSettings>): Record<string, string> {
    const errors: Record<string, string> = {};

    if (settings.stages) {
      Object.entries(settings.stages).forEach(([stageKey, cfg]) => {
        if (cfg && cfg.isEnabled) {
          if (
            typeof cfg.maxDays !== 'number' ||
            isNaN(cfg.maxDays) ||
            !Number.isInteger(cfg.maxDays) ||
            cfg.maxDays <= 0
          ) {
            errors[stageKey] = 'Ngưỡng SLA phải là số nguyên dương lớn hơn 0 ngày.';
          }

          if (
            typeof cfg.warningDaysBefore !== 'number' ||
            isNaN(cfg.warningDaysBefore) ||
            !Number.isInteger(cfg.warningDaysBefore) ||
            cfg.warningDaysBefore < 0
          ) {
            errors[`${stageKey}_warning`] = 'Số ngày cảnh báo phải là số nguyên không âm.';
          } else if (cfg.maxDays && cfg.warningDaysBefore >= cfg.maxDays) {
            errors[`${stageKey}_warning`] = 'Số ngày cảnh báo phải nhỏ hơn ngưỡng SLA.';
          }
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      throw new SlaValidationError(
        'Dữ liệu cấu hình SLA không hợp lệ. Vui lòng kiểm tra lại các trường báo lỗi.',
        errors
      );
    }

    return errors;
  },

  /**
   * 3. Lưu cấu hình SLA lên Server kèm bắt lỗi dữ liệu đầu vào & API (AC 1, AC 2)
   */
  async saveSlaSettings(newSettings: Partial<SlaSettings>): Promise<SlaSettings> {
    // 1. Kiểm tra validation phía client
    this.validateSlaSettings(newSettings);

    const currentSettings = await this.getSlaSettings();
    const mergedSettings: SlaSettings = {
      ...currentSettings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
      stages: {
        ...currentSettings.stages,
        ...(newSettings.stages || {}),
      },
    };

    try {
      const response = await axiosClient.put<SlaSettings>('/sla-settings', mergedSettings);
      if (response?.data) {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(response.data));
        return response.data;
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = errorObj?.response?.status;

      if (status === 400) {
        throw new SlaApiError(
          errorObj.response?.data?.message || 'Dữ liệu cấu hình SLA không hợp lệ (400 Bad Request).',
          400,
          err
        );
      }
      if (status === 403) {
        throw new SlaApiError(
          'Bạn không có quyền quản trị để cập nhật cấu hình SLA (403 Forbidden).',
          403,
          err
        );
      }
      if (status === 422) {
        throw new SlaApiError(
          errorObj.response?.data?.message || 'Thông số cấu hình không đáp ứng yêu cầu nghiệp vụ (422 Unprocessable Entity).',
          422,
          err
        );
      }
      if (status && status >= 500) {
        throw new SlaApiError(
          'Máy chủ gặp sự cố khi lưu cấu hình SLA (500 Internal Server Error). Vui lòng thử lại sau.',
          status,
          err
        );
      }

      // Offline fallback: chỉ lưu vào LocalStorage khi không phải lỗi HTTP status từ server
    }

    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(mergedSettings));
    return mergedSettings;
  },

  /**
   * Cập nhật cấu hình SLA (Alias tương thích với saveSlaSettings)
   */
  async updateSlaSettings(newSettings: Partial<SlaSettings>): Promise<SlaSettings> {
    return this.saveSlaSettings(newSettings);
  },

  /**
   * 4. Lấy danh sách hồ sơ ứng viên quá hạn SLA từ Backend (AC 1)
   */
  async getOverdueCandidateList(params?: {
    stage?: CandidateStage;
    jobId?: string;
    candidateList?: CandidateProfile[];
  }): Promise<CandidateProfile[]> {
    try {
      const response = await axiosClient.get<CandidateProfile[]>('/candidates/overdue', {
        params: {
          stage: params?.stage,
          jobId: params?.jobId,
        },
      });
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch {
      // Offline fallback
    }

    let candidates = params?.candidateList;
    if (!candidates || candidates.length === 0) {
      try {
        candidates = await candidateService.getCandidates();
      } catch {
        candidates = [];
      }
    }

    const settings = await this.getSlaSettings();
    let overdue = this.filterOverdueCandidates(candidates, settings);

    if (params?.stage) {
      overdue = overdue.filter((c) => normalizeCandidateStage(c.status) === params.stage);
    }
    if (params?.jobId) {
      overdue = overdue.filter((c) => c.appliedJobId === params.jobId);
    }

    return overdue;
  },

  /**
   * 3. Đặt lại cấu hình SLA về mặc định (AC 1)
   */
  async resetSlaSettingsToDefault(): Promise<SlaSettings> {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(DEFAULT_SLA_SETTINGS));
    try {
      await axiosClient.put('/sla-settings', DEFAULT_SLA_SETTINGS);
    } catch {
      // Offline fallback
    }
    return DEFAULT_SLA_SETTINGS;
  },

  /**
   * 4. Tính toán thời gian tồn đọng & trạng thái SLA của một hồ sơ (AC 2)
   */
  calculateCandidateSla(
    candidate: CandidateProfile,
    settings?: SlaSettings,
    currentTimeMs?: number
  ): CandidateSlaEvaluation {
    const activeSettings = settings || DEFAULT_SLA_SETTINGS;
    const stage = normalizeCandidateStage(candidate.status);
    const stageMeta = CANDIDATE_STAGE_CONFIG[stage];
    const stageName = stageMeta?.label || stage;

    // Giai đoạn kết thúc quy trình hoặc tắt SLA toàn cục -> Miễn trừ tính SLA
    if (!activeSettings.isGlobalSlaEnabled || stage === 'REJECTED' || stage === 'WITHDRAWN') {
      return {
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        stage,
        stageName,
        daysInStage: 0,
        thresholdDays: 0,
        status: 'EXEMPT',
        overdueDays: 0,
        remainingDays: 0,
        badgeText: 'Miễn trừ SLA',
        badgeColorClass: 'bg-slate-100 text-slate-600 border-slate-200',
        isOverdue: false,
        isWarning: false,
      };
    }

    const stageConfig = activeSettings.stages[stage];
    if (!stageConfig || !stageConfig.isEnabled) {
      return {
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        stage,
        stageName,
        daysInStage: 0,
        thresholdDays: 0,
        status: 'EXEMPT',
        overdueDays: 0,
        remainingDays: 0,
        badgeText: 'Không áp dụng SLA',
        badgeColorClass: 'bg-slate-100 text-slate-600 border-slate-200',
        isOverdue: false,
        isWarning: false,
      };
    }

    // Thời điểm bắt đầu tính tại giai đoạn hiện tại (ưu tiên updatedAt nếu có, fallback appliedAt)
    const stageEntryTimeStr = candidate.updatedAt || candidate.appliedAt || new Date().toISOString();
    const stageEntryMs = new Date(stageEntryTimeStr).getTime();
    const nowMs = typeof currentTimeMs === 'number' ? currentTimeMs : Date.now();

    const diffMs = Math.max(0, nowMs - stageEntryMs);
    const daysInStage = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const maxDays = stageConfig.maxDays;
    const warningDaysBefore = stageConfig.warningDaysBefore || 1;

    // Trường hợp quá hạn SLA (OVERDUE)
    if (daysInStage > maxDays) {
      const overdueDays = daysInStage - maxDays;
      return {
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        stage,
        stageName,
        daysInStage,
        thresholdDays: maxDays,
        status: 'OVERDUE',
        overdueDays,
        remainingDays: 0,
        badgeText: `Quá hạn SLA ${overdueDays} ngày`,
        badgeColorClass: 'bg-rose-50 text-rose-700 border-rose-300 ring-rose-200',
        isOverdue: true,
        isWarning: false,
      };
    }

    // Trường hợp sắp chạm hạn (WARNING)
    const warningThreshold = Math.max(0, maxDays - warningDaysBefore);
    if (daysInStage >= warningThreshold) {
      const remainingDays = Math.max(0, maxDays - daysInStage);
      const text = remainingDays === 0 ? 'Đến hạn hôm nay' : `Còn ${remainingDays} ngày`;
      return {
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        stage,
        stageName,
        daysInStage,
        thresholdDays: maxDays,
        status: 'WARNING',
        overdueDays: 0,
        remainingDays,
        badgeText: text,
        badgeColorClass: 'bg-amber-50 text-amber-800 border-amber-300 ring-amber-200',
        isOverdue: false,
        isWarning: true,
      };
    }

    // Trường hợp trong hạn an toàn (ON_TRACK)
    const remainingDays = maxDays - daysInStage;
    return {
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      stage,
      stageName,
      daysInStage,
      thresholdDays: maxDays,
      status: 'ON_TRACK',
      overdueDays: 0,
      remainingDays,
      badgeText: `Đúng hạn (Còn ${remainingDays} ngày)`,
      badgeColorClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-emerald-200',
      isOverdue: false,
      isWarning: false,
    };
  },

  /**
   * 5. Lọc danh sách các hồ sơ đang bị quá hạn SLA (AC 2)
   */
  filterOverdueCandidates(
    candidates: CandidateProfile[],
    settings?: SlaSettings,
    currentTimeMs?: number
  ): CandidateProfile[] {
    return candidates.filter((candidate) => {
      const evaluation = this.calculateCandidateSla(candidate, settings, currentTimeMs);
      return evaluation.isOverdue;
    });
  },

  /**
   * 6. Thực thi kiểm tra SLA hằng ngày & tạo thông báo nhắc việc KHÔNG trùng lặp trong cùng 1 ngày (AC 3)
   */
  runDailySlaCheck(
    candidates: CandidateProfile[],
    settings?: SlaSettings,
    targetDateStr?: string
  ): SlaDailyReminder[] {
    const today = targetDateStr || getTodayDateString();
    const activeSettings = settings || DEFAULT_SLA_SETTINGS;

    if (!activeSettings.isGlobalSlaEnabled || !activeSettings.enableDailyReminder) {
      return this.getStoredDailyReminders();
    }

    // Lấy log các lần đã nhắc: Record<reminderKey, boolean>
    // reminderKey: candidateId_stage_YYYY-MM-DD
    let remindedLog: Record<string, boolean> = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY_REMINDED_LOG);
      if (raw) remindedLog = JSON.parse(raw);
    } catch {
      remindedLog = {};
    }

    const existingReminders = this.getStoredDailyReminders();
    const newlyCreatedReminders: SlaDailyReminder[] = [];
    const referenceTimeMs = targetDateStr
      ? new Date(`${targetDateStr}T23:59:59.999+07:00`).getTime()
      : undefined;

    candidates.forEach((candidate) => {
      const evaluation = this.calculateCandidateSla(candidate, activeSettings, referenceTimeMs);
      if (!evaluation.isOverdue) return;

      const reminderKey = `${candidate.id}_${evaluation.stage}_${today}`;

      // Nếu đã nhắc hồ sơ này trong ngày hôm nay thì bỏ qua (Không gửi trùng lặp - AC 3)
      if (remindedLog[reminderKey]) {
        return;
      }

      // Tạo bản ghi thông báo nhắc việc mới
      const newReminder: SlaDailyReminder = {
        id: `remind-${candidate.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        appliedJobTitle: candidate.appliedJobTitle || 'Vị trí tuyển dụng',
        stage: evaluation.stage,
        stageName: evaluation.stageName,
        overdueDays: evaluation.overdueDays,
        reminderDate: today,
        createdAt: new Date().toISOString(),
        isRead: false,
        message: `Hồ sơ "${candidate.fullName}" đã vượt quá hạn SLA ${evaluation.overdueDays} ngày tại giai đoạn "${evaluation.stageName}". Vui lòng ưu tiên xử lý sớm.`,
      };

      remindedLog[reminderKey] = true;
      newlyCreatedReminders.push(newReminder);
    });

    // Lưu lại log chống trùng và danh sách thông báo
    if (newlyCreatedReminders.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_REMINDED_LOG, JSON.stringify(remindedLog));
        const updatedReminders = [...newlyCreatedReminders, ...existingReminders];
        // Giữ lại tối đa 50 thông báo gần nhất
        localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(updatedReminders.slice(0, 50)));
        return updatedReminders;
      } catch {
        // Fallback
      }
    }

    return existingReminders;
  },

  /**
   * 7. Lấy danh sách thông báo nhắc việc đang lưu trong bộ nhớ
   */
  getStoredDailyReminders(): SlaDailyReminder[] {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_REMINDERS);
      if (cached) {
        return JSON.parse(cached) as SlaDailyReminder[];
      }
    } catch {
      // Lỗi đọc cache
    }
    return [];
  },

  /**
   * 8. Đánh dấu một thông báo là đã đọc
   */
  markReminderAsRead(reminderId: string): void {
    const list = this.getStoredDailyReminders();
    const updated = list.map((item) =>
      item.id === reminderId ? { ...item, isRead: true } : item
    );
    try {
      localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(updated));
    } catch {
      // Fallback
    }
  },

  /**
   * 9. Đánh dấu tất cả thông báo là đã đọc
   */
  markAllRemindersAsRead(): void {
    const list = this.getStoredDailyReminders();
    const updated = list.map((item) => ({ ...item, isRead: true }));
    try {
      localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(updated));
    } catch {
      // Fallback
    }
  },

  /**
   * 10. Xóa sạch lịch sử thông báo và log nhắc việc (hỗ trợ kiểm thử hoặc reset)
   */
  clearReminders(): void {
    localStorage.removeItem(STORAGE_KEY_REMINDERS);
    localStorage.removeItem(STORAGE_KEY_REMINDED_LOG);
  },
};

export default slaService;

