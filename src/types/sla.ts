import type { CandidateStage } from './candidate';

/**
 * Cấu hình SLA cho một giai đoạn tuyển dụng cụ thể
 */
export interface StageSlaConfig {
  stage: CandidateStage;
  stageName: string;
  maxDays: number; // Số ngày tối đa cho phép xử lý hồ sơ ở giai đoạn này
  warningDaysBefore: number; // Số ngày trước hạn để kích hoạt trạng thái cảnh báo vàng (mặc định 1)
  isEnabled: boolean; // Bật/tắt SLA riêng cho giai đoạn này
  description: string; // Mô tả ý nghĩa giai đoạn và mục tiêu SLA
}

/**
 * Toàn bộ cấu hình SLA của hệ thống (AC 1)
 */
export interface SlaSettings {
  isGlobalSlaEnabled: boolean; // Bật/tắt SLA toàn hệ thống
  stages: Record<CandidateStage, StageSlaConfig>;
  enableDailyReminder: boolean; // Bật thông báo nhắc việc định kỳ hằng ngày
  reminderTime: string; // Giờ chạy tác vụ nhắc việc hằng ngày (ví dụ: "09:00")
  notificationChannels: ('IN_APP' | 'EMAIL')[]; // Kênh gửi nhắc việc
  updatedAt: string;
  updatedBy?: string;
}

/**
 * Trạng thái tuân thủ SLA của một hồ sơ ứng viên
 */
export type SlaStatus =
  | 'ON_TRACK' // Trong hạn xử lý (An toàn)
  | 'WARNING' // Sắp chạm ngưỡng SLA (Cảnh báo vàng)
  | 'OVERDUE' // Đã vượt quá ngưỡng SLA (Báo động đỏ)
  | 'EXEMPT'; // Miễn trừ SLA (cho các giai đoạn kết thúc như LOẠI HỒ SƠ hoặc ỨNG VIÊN RÚT LUI)

/**
 * Kết quả tính toán & đối soát SLA của ứng viên (AC 2)
 */
export interface CandidateSlaEvaluation {
  candidateId: string;
  candidateName: string;
  stage: CandidateStage;
  stageName: string;
  daysInStage: number; // Số ngày hồ sơ nằm tại giai đoạn hiện tại
  thresholdDays: number; // Ngưỡng SLA tối đa của giai đoạn
  status: SlaStatus;
  overdueDays: number; // Số ngày quá hạn (> 0 nếu OVERDUE, ngược lại = 0)
  remainingDays: number; // Số ngày còn lại trước khi quá hạn (>= 0 nếu ON_TRACK hoặc WARNING)
  badgeText: string; // Chuỗi hiển thị trực quan (VD: "Quá hạn SLA 2 ngày", "Còn 1 ngày")
  badgeColorClass: string; // Lớp CSS Tailwind tương ứng
  isOverdue: boolean; // Flag tiện ích: status === 'OVERDUE'
  isWarning: boolean; // Flag tiện ích: status === 'WARNING'
}

/**
 * Bản ghi thông báo nhắc việc SLA hằng ngày (AC 3)
 */
export interface SlaDailyReminder {
  id: string;
  candidateId: string;
  candidateName: string;
  appliedJobTitle: string;
  stage: CandidateStage;
  stageName: string;
  overdueDays: number;
  reminderDate: string; // YYYY-MM-DD - dùng để chống nhắc trùng lặp trong cùng 1 ngày
  createdAt: string; // ISO 8601
  isRead: boolean;
  message: string;
}

/**
 * Cấu hình SLA mặc định chuẩn của hệ thống
 */
export const DEFAULT_SLA_SETTINGS: SlaSettings = {
  isGlobalSlaEnabled: true,
  enableDailyReminder: true,
  reminderTime: '09:00',
  notificationChannels: ['IN_APP', 'EMAIL'],
  updatedAt: new Date().toISOString(),
  updatedBy: 'Admin Hệ thống',
  stages: {
    NEW: {
      stage: 'NEW',
      stageName: 'Hồ sơ mới',
      maxDays: 3,
      warningDaysBefore: 1,
      isEnabled: true,
      description: 'Hồ sơ mới tiếp nhận cần được rà soát và chuyển tiếp trong vòng 3 ngày.',
    },
    SCREENING: {
      stage: 'SCREENING',
      stageName: 'Sàng lọc',
      maxDays: 3,
      warningDaysBefore: 1,
      isEnabled: true,
      description: 'Hoàn tất sơ vấn điện thoại và đánh giá CV không quá 3 ngày.',
    },
    INTERVIEWING: {
      stage: 'INTERVIEWING',
      stageName: 'Phỏng vấn',
      maxDays: 5,
      warningDaysBefore: 1,
      isEnabled: true,
      description: 'Tổ chức phỏng vấn chuyên môn và gửi đánh giá trong vòng 5 ngày.',
    },
    OFFER: {
      stage: 'OFFER',
      stageName: 'Đề xuất offer',
      maxDays: 4,
      warningDaysBefore: 1,
      isEnabled: true,
      description: 'Phê duyệt và phát hành thư mời nhận việc (Offer) trong 4 ngày.',
    },
    HIRED: {
      stage: 'HIRED',
      stageName: 'Nhận việc',
      maxDays: 7,
      warningDaysBefore: 2,
      isEnabled: true,
      description: 'Hoàn tất thủ tục tiếp nhận onboard và hồ sơ nhân sự trong 7 ngày.',
    },
    REJECTED: {
      stage: 'REJECTED',
      stageName: 'Loại hồ sơ',
      maxDays: 0,
      warningDaysBefore: 0,
      isEnabled: false,
      description: 'Giai đoạn kết thúc quy trình tuyển dụng - Miễn trừ tính SLA.',
    },
    WITHDRAWN: {
      stage: 'WITHDRAWN',
      stageName: 'Ứng viên rút lui',
      maxDays: 0,
      warningDaysBefore: 0,
      isEnabled: false,
      description: 'Ứng viên chủ động rút hồ sơ - Miễn trừ tính SLA.',
    },
  },
};

