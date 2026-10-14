export type InterviewFormat = 'ONLINE' | 'OFFLINE';

export type InterviewRoundType =
  | 'SCREENING'
  | 'TECHNICAL'
  | 'CULTURE_HR'
  | 'FINAL_DIRECTOR'
  | 'CUSTOM';

export interface InterviewerInfo {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarUrl?: string;
  department?: string;
}

export type CandidateInterviewResponseStatus =
  | 'CONFIRMED'
  | 'RESCHEDULE_REQUESTED'
  | 'DECLINED'
  | 'PENDING';

export interface CandidateInterviewResponse {
  status: CandidateInterviewResponseStatus;
  respondedAt?: string;
  reason?: string;
  proposedDateTime?: string;
}

export interface InterviewSchedulePayload {
  id?: string;
  candidateId: string;
  candidateName: string;
  candidateEmail?: string;
  applicationId?: string;
  jobTitle?: string;
  roundName: string;
  interviewRound?: string; // Alias tương thích AC
  roundType?: InterviewRoundType;
  interviewDate: string; // Định dạng YYYY-MM-DD
  interviewTime: string; // Định dạng HH:mm
  scheduledDateTimeISO: string; // Chuỗi ISO chuẩn UTC / GMT+7
  startTime?: string; // Alias tương thích AC
  durationMinutes: number; // 30, 45, 60, 90, 120 phút
  format: InterviewFormat; // ONLINE hoặc OFFLINE
  interviewType?: InterviewFormat; // Alias tương thích AC
  locationOrLink: string; // Địa chỉ phòng họp hoặc link họp trực tuyến
  interviewers: InterviewerInfo[];
  interviewerIds?: string[]; // Danh sách ID người phỏng vấn tương thích AC
  notes?: string;
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  candidateResponse?: CandidateInterviewResponse;
  isOverride?: boolean;
  overrideReason?: string;
  createdAt?: string;
  createdByName?: string;
}

/**
 * Payload chuẩn cho API tạo lịch phỏng vấn theo User Story S6-02 (AC 1)
 */
export interface CreateInterviewSchedulePayload {
  id?: string;
  applicationId: string;
  candidateId?: string;
  candidateName?: string;
  candidateEmail?: string;
  jobTitle?: string;
  interviewRound: string; // Vòng phỏng vấn (Vòng CV, Vòng Kỹ thuật, Vòng HR...)
  roundName?: string;
  roundType?: InterviewRoundType;
  startTime: string; // ISO string thời điểm bắt đầu
  scheduledDateTimeISO?: string;
  interviewDate?: string;
  interviewTime?: string;
  durationMinutes: number; // Thời lượng (phút)
  interviewType: InterviewFormat; // ONLINE hoặc OFFLINE
  format?: InterviewFormat;
  locationOrLink: string; // Link họp hoặc tên phòng họp
  interviewerIds: string[]; // Danh sách ID người phỏng vấn
  interviewers?: InterviewerInfo[];
  notes?: string;
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  isOverride?: boolean; // Cờ xác nhận ghi đè khi có xung đột (TKNHTTDNB1-439)
  overrideReason?: string; // Lý do ghi đè bắt buộc khi isOverride = true
  createdAt?: string;
  createdByName?: string;
}

/**
 * Tham số truy vấn lịch phỏng vấn cá nhân (AC 1)
 */
export interface PersonalScheduleParams {
  userId?: string;
  interviewerId?: string;
  date?: string; // YYYY-MM-DD
  startDate?: string;
  endDate?: string;
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'ALL';
  search?: string;
}

/**
 * Lỗi khi người dùng chọn thời gian phỏng vấn trong quá khứ (AC 2)
 */
export class InterviewPastTimeError extends Error {
  code = 'PAST_TIME_NOT_ALLOWED';
  statusCode = 400;

  constructor(
    message = 'Thời gian phỏng vấn không được ở thời điểm quá khứ theo múi giờ Việt Nam (GMT+7). Vui lòng chọn ngày giờ trong tương lai.',
  ) {
    super(message);
    this.name = 'InterviewPastTimeError';
    Object.setPrototypeOf(this, InterviewPastTimeError.prototype);
  }
}

export type ConflictType = 'INTERVIEWER_CONFLICT' | 'ROOM_CONFLICT' | 'BOTH';

export interface ConflictingInterviewSummary {
  id: string;
  candidateName: string;
  jobTitle: string;
  roundName: string;
  interviewDate: string;
  startTime: string; // HH:mm hoặc ISO
  endTime: string;
  durationMinutes: number;
  format: InterviewFormat;
  locationOrLink: string;
  interviewerNames?: string[];
}

export interface ConflictItemDetail {
  type: 'INTERVIEWER' | 'ROOM';
  entityId?: string;
  entityName: string; // Tên người phỏng vấn hoặc tên phòng họp bị chiếm
  entityRoleOrLocation?: string; // Chức danh hoặc vị trí phòng họp
  reason: string; // Lý do mô tả xung đột
  conflictingInterview: ConflictingInterviewSummary;
}

export interface ProposedInterviewSummary {
  candidateName: string;
  jobTitle: string;
  roundName: string;
  interviewDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  format: InterviewFormat;
  locationOrLink: string;
  interviewerNames?: string[];
}

export interface InterviewConflictCheckResult {
  hasConflict: boolean;
  conflictType?: ConflictType;
  message?: string;
  conflicts: ConflictItemDetail[];
  proposedInterview?: ProposedInterviewSummary;
}

export interface CheckInterviewConflictPayload {
  id?: string;
  candidateName?: string;
  jobTitle?: string;
  roundName?: string;
  interviewDate: string;
  startTime: string;
  durationMinutes: number;
  format: InterviewFormat;
  locationOrLink: string;
  interviewerIds: string[];
}

/**
 * Lỗi khi phát hiện xung đột lịch phỏng vấn (người phỏng vấn hoặc phòng họp bận) (TKNHTTDNB1-439)
 */
export class InterviewerConflictError extends Error {
  code = 'INTERVIEWER_CONFLICT';
  statusCode = 409;
  conflictingInterviewerIds?: string[];
  conflictResult?: InterviewConflictCheckResult;

  constructor(
    message = 'Một hoặc nhiều người phỏng vấn hoặc phòng họp đã có lịch bận trong khung giờ này.',
    conflictingInterviewerIds?: string[],
    conflictResult?: InterviewConflictCheckResult,
  ) {
    super(message);
    this.name = 'InterviewerConflictError';
    this.conflictingInterviewerIds = conflictingInterviewerIds;
    this.conflictResult = conflictResult;
    Object.setPrototypeOf(this, InterviewerConflictError.prototype);
  }
}

/**
 * Lỗi phản hồi API tổng quát từ Backend
 */
export class InterviewApiError extends Error {
  statusCode?: number;
  errorCode?: string;

  constructor(message: string, statusCode?: number, errorCode?: string) {
    super(message);
    this.name = 'InterviewApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, InterviewApiError.prototype);
  }
}

/**
 * Lỗi phân quyền khi người dùng không có quyền ghi đè lịch phỏng vấn trùng (403 Forbidden - TKNHTTDNB1-440)
 */
export class InterviewConflictForbiddenError extends Error {
  code = 'FORBIDDEN';
  statusCode = 403;

  constructor(
    message = 'Tài khoản của bạn không có quyền thực hiện hành động ghi đè lịch phỏng vấn ngoại lệ. Vui lòng liên hệ Quản trị viên hoặc Trưởng phòng Tuyển dụng.',
  ) {
    super(message);
    this.name = 'InterviewConflictForbiddenError';
    Object.setPrototypeOf(this, InterviewConflictForbiddenError.prototype);
  }
}

/**
 * Lỗi thiếu thông tin xác thực hoặc phiên đăng nhập hết hạn (401 Unauthorized - TKNHTTDNB1-440)
 */
export class InterviewConflictUnauthorizedError extends Error {
  code = 'UNAUTHORIZED';
  statusCode = 401;

  constructor(
    message = 'Phiên làm việc đã hết hạn hoặc chưa được xác thực. Vui lòng đăng nhập lại.',
  ) {
    super(message);
    this.name = 'InterviewConflictUnauthorizedError';
    Object.setPrototypeOf(this, InterviewConflictUnauthorizedError.prototype);
  }
}

/**
 * Lỗi dữ liệu ghi đè không hợp lệ hoặc thiếu lý do bắt buộc (400 Bad Request - TKNHTTDNB1-440)
 */
export class InterviewConflictValidationError extends Error {
  code = 'VALIDATION_ERROR';
  statusCode = 400;

  constructor(
    message = 'Lý do ghi đè lịch phỏng vấn là bắt buộc và phải có tối thiểu 5 ký tự.',
  ) {
    super(message);
    this.name = 'InterviewConflictValidationError';
    Object.setPrototypeOf(this, InterviewConflictValidationError.prototype);
  }
}

/**
 * Payload cho API ghi đè lịch phỏng vấn khi có xung đột (User Story S6-04 / TKNHTTDNB1-440)
 */
export interface OverrideInterviewPayload {
  applicationId: string;
  interviewRound?: string;
  roundName?: string;
  roundType?: InterviewRoundType;
  startTime: string; // ISO string thời điểm bắt đầu
  durationMinutes: number;
  interviewType?: InterviewFormat;
  format?: InterviewFormat;
  locationOrLink: string;
  interviewerIds: string[];
  overrideConflict?: boolean; // Cờ xác nhận ghi đè theo AC 1 (overrideConflict: true)
  isOverride?: boolean; // Alias tương thích AC cũ
  overrideReason: string; // Lý do bắt buộc, không được để trống
  candidateId?: string;
  candidateName?: string;
  candidateEmail?: string;
  jobTitle?: string;
  interviewDate?: string;
  interviewTime?: string;
  notes?: string;
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
}

export interface InterviewRoundOption {
  type: InterviewRoundType;
  label: string;
  description: string;
  badgeColor: string;
}

export const DEFAULT_INTERVIEW_ROUNDS: InterviewRoundOption[] = [
  {
    type: 'SCREENING',
    label: 'Vòng Sàng lọc CV (Screening Interview)',
    description: 'Trao đổi sơ bộ về hồ sơ, định hướng công việc và mức lương kỳ vọng',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    type: 'TECHNICAL',
    label: 'Vòng Chuyên môn & Kỹ thuật (Technical Interview)',
    description: 'Đánh giá kiến thức chuyên môn, giải quyết tình huống kỹ thuật thực tế',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    type: 'CULTURE_HR',
    label: 'Vòng Văn hóa & HR (Culture & HR Interview)',
    description: 'Đánh giá độ phù hợp văn hóa doanh nghiệp, kỹ năng mềm và giao tiếp',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    type: 'FINAL_DIRECTOR',
    label: 'Vòng Giám đốc & Ban lãnh đạo (Final Interview)',
    description: 'Phỏng vấn vòng cuối cùng với Giám đốc khối / Ban điều hành',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    type: 'CUSTOM',
    label: 'Khác (Tùy chỉnh)',
    description: 'Vòng phỏng vấn tùy chỉnh đặc thù theo yêu cầu dự án',
    badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
  },
];

export const DEFAULT_DURATION_OPTIONS: number[] = [30, 45, 60, 90, 120];

export const MOCK_INTERNAL_INTERVIEWERS: InterviewerInfo[] = [
  {
    id: 'usr-001',
    name: 'Nguyễn Văn Hải',
    role: 'Trưởng phòng Kỹ thuật (Engineering Manager)',
    email: 'hai.nguyen@smartrecruitment.vn',
    department: 'Bộ phận Công nghệ & Kỹ thuật',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-002',
    name: 'Trần Thị Thu Thảo',
    role: 'Chuyên viên Tuyển dụng Cao cấp (Senior Recruiter)',
    email: 'thao.tran@smartrecruitment.vn',
    department: 'Phòng Nhân sự & Thu hút Tài năng',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-003',
    name: 'Lê Minh Tuấn',
    role: 'Kiến trúc sư Phần mềm (Principal Architect)',
    email: 'tuan.le@smartrecruitment.vn',
    department: 'Bộ phận Công nghệ & Kỹ thuật',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-004',
    name: 'Phạm Thị Lan Hương',
    role: 'Giám đốc Nhân sự (HR Director)',
    email: 'huong.pham@smartrecruitment.vn',
    department: 'Ban Giám đốc & Nhân sự',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-005',
    name: 'Vũ Đức Đạt',
    role: 'Trưởng nhóm Frontend (Frontend Tech Lead)',
    email: 'dat.vu@smartrecruitment.vn',
    department: 'Bộ phận Công nghệ & Kỹ thuật',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-006',
    name: 'Hoàng Minh Châu',
    role: 'Trưởng nhóm Kiểm thử (QA Lead)',
    email: 'chau.hoang@smartrecruitment.vn',
    department: 'Bộ phận Đảm bảo Chất lượng',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
  },
];
