/**
 * Types & Interfaces cho Mẫu Checklist tiếp nhận nhân sự mới theo phòng ban
 * & Bảng theo dõi tiến độ tiếp nhận nhân viên mới (Onboarding Tracking Board)
 * Jira Tasks: TKNHTTDNB1-517 & TKNHTTDNB1-518 / User Story S8-01
 */

export type OnboardingTaskPhase =
  | 'PRE_BOARDING' // Trước ngày nhận việc
  | 'DAY_ONE' // Ngày đầu tiên
  | 'FIRST_WEEK' // Tuần đầu tiên
  | 'FIRST_MONTH'; // Tháng đầu tiên

export type OnboardingResponsibleRole =
  | 'HR' // Phòng Nhân sự (HR)
  | 'DIRECT_MANAGER' // Quản lý trực tiếp
  | 'IT_SUPPORT' // Bộ phận CNTT (IT Support)
  | 'NEW_HIRE'; // Bản thân nhân sự mới

export type OnboardingTaskStatus =
  | 'NOT_STARTED' // Chưa bắt đầu
  | 'IN_PROGRESS' // Đang xử lý
  | 'COMPLETED' // Đã xong
  | 'OVERDUE'; // Quá hạn

export interface OnboardingAttachment {
  id: string;
  fileName: string;
  fileSize?: string;
  fileType: 'PDF' | 'DOC' | 'LINK' | 'IMAGE' | 'ARCHIVE';
  url: string;
  description?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export interface OnboardingChecklistItem {
  id: string;
  templateId?: string;
  title: string;
  description: string;
  phase: OnboardingTaskPhase;
  responsibleRole: OnboardingResponsibleRole;
  dueDays: number; // SLA thời hạn hoàn thành (ngày)
  isRequired: boolean; // Bắt buộc hay Tùy chọn
  isActive: boolean; // Bật / Tắt kích hoạt
  order: number; // Thứ tự ưu tiên
  category?: string; // Nhóm công việc phụ trợ (vd: Thiết bị, Hồ sơ, Đào tạo)
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentChecklistTemplate {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  description?: string;
  lastUpdated: string;
  updatedBy?: string;
  items: OnboardingChecklistItem[];
}

export interface ChecklistItemValidationErrors {
  title?: string;
  description?: string;
  dueDays?: string;
  responsibleRole?: string;
  phase?: string;
}

export interface ChecklistTemplateStats {
  totalItems: number;
  activeItems: number;
  inactiveItems: number;
  requiredItems: number;
  maxSlaDays: number;
  phaseDistribution: Record<OnboardingTaskPhase, number>;
  roleDistribution: Record<OnboardingResponsibleRole, number>;
}

/**
 * Đầu việc gán cho một nhân sự mới cụ thể (Task Jira: TKNHTTDNB1-518)
 */
export interface OnboardingCandidateTask {
  id: string;
  templateItemId?: string;
  title: string;
  description: string;
  phase: OnboardingTaskPhase;
  responsibleRole: OnboardingResponsibleRole;
  assigneeName: string; // Người chịu trách nhiệm hỗ trợ (Assignee)
  assigneeRole?: string;
  assigneeAvatar?: string;
  deadline: string; // Hạn chót YYYY-MM-DD
  status: OnboardingTaskStatus;
  isOverdue?: boolean;
  completedAt?: string; // Thời điểm hoàn thành
  completedBy?: string; // Ai đánh dấu hoàn thành
  isRequired: boolean;
  category?: string;
  attachments?: OnboardingAttachment[];
  notes?: string;
  actionUrl?: string; // Link trực tiếp thao tác
  order: number;
}

/**
 * Hồ sơ theo dõi tiếp nhận của nhân sự mới (AC 1, AC 2, AC 3)
 */
export interface CandidateOnboardingRecord {
  id: string; // VD: "ONB-2026-0891"
  candidateId: string;
  candidateName: string;
  candidateCode: string;
  candidateAvatar?: string;
  candidateEmail: string;
  candidatePhone?: string;
  jobTitle: string;
  departmentId: string;
  departmentName: string;
  startDate: string; // Ngày bắt đầu làm việc
  buddyName?: string;
  buddyRole?: string;
  buddyAvatar?: string;
  managerName: string;
  managerRole?: string;
  hrInCharge: string;
  tasks: OnboardingCandidateTask[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Types phục vụ tích hợp cập nhật trạng thái checklist tiếp nhận (Task Jira: TKNHTTDNB1-519)
 */
export type ChecklistStatusApi = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_STARTED' | 'OVERDUE';

export interface UpdateChecklistItemPayload {
  status: ChecklistStatusApi;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export interface UpdateChecklistItemResponse {
  success: boolean;
  data: CandidateOnboardingRecord;
  message?: string;
  refreshedSummary?: OnboardingProgressSummary;
}

export interface UserPermissionContext {
  id?: string;
  email?: string;
  fullName?: string;
  roles?: string[];
  permissions?: string[];
}

export interface TaskPermissionCheckResult {
  canUpdate: boolean;
  reason?: string;
}

/**
 * Thống kê tiến độ hoàn thành tiếp nhận (AC 1)
 */
export interface OnboardingProgressSummary {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  overdueTasks: number;
  percentage: number; // (completedTasks / totalTasks) * 100
  phaseProgress: Record<
    OnboardingTaskPhase,
    {
      total: number;
      completed: number;
      percentage: number;
    }
  >;
}

export const ONBOARDING_PHASES: Array<{
  id: OnboardingTaskPhase;
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  borderClass: string;
}> = [
  {
    id: 'PRE_BOARDING',
    label: 'Trước ngày nhận việc',
    shortLabel: 'Pre-boarding',
    description: 'Chuẩn bị thiết bị, tài khoản và thủ tục tiếp đón trước khi ứng viên đến công ty',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    borderClass: 'border-l-purple-500',
  },
  {
    id: 'DAY_ONE',
    label: 'Ngày đầu tiên',
    shortLabel: 'Day 1',
    description: 'Chào đón, bàn giao trang thiết bị, ký HĐLĐ và phổ biến văn hóa hội nhập',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    borderClass: 'border-l-blue-500',
  },
  {
    id: 'FIRST_WEEK',
    label: 'Tuần đầu tiên',
    shortLabel: 'Week 1',
    description: 'Làm quen quy trình làm việc, thiết lập mục tiêu ban đầu và đào tạo nghiệp vụ',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    borderClass: 'border-l-emerald-500',
  },
  {
    id: 'FIRST_MONTH',
    label: 'Tháng thử việc đầu tiên',
    shortLabel: 'Month 1',
    description: 'Tham gia các dự án thực tế, đánh giá tiến độ sơ bộ tháng đầu và phản hồi 1-1',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    borderClass: 'border-l-amber-500',
  },
];

export const ONBOARDING_ROLES: Array<{
  id: OnboardingResponsibleRole;
  label: string;
  badgeClass: string;
  iconName: string;
}> = [
  {
    id: 'HR',
    label: 'Phòng Nhân sự (HR)',
    badgeClass: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800',
    iconName: 'Users',
  },
  {
    id: 'DIRECT_MANAGER',
    label: 'Quản lý trực tiếp',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
    iconName: 'UserCheck',
  },
  {
    id: 'IT_SUPPORT',
    label: 'Bộ phận CNTT (IT Support)',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
    iconName: 'Laptop',
  },
  {
    id: 'NEW_HIRE',
    label: 'Bản thân nhân sự mới',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
    iconName: 'User',
  },
];

export const ONBOARDING_STATUS_CONFIG: Record<
  OnboardingTaskStatus,
  {
    label: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  NOT_STARTED: {
    label: 'Chưa bắt đầu',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dotClass: 'bg-slate-400',
  },
  IN_PROGRESS: {
    label: 'Đang xử lý',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    dotClass: 'bg-blue-500 animate-pulse',
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
  },
  OVERDUE: {
    label: 'Quá hạn',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    dotClass: 'bg-rose-500 animate-ping',
  },
};
