export type AccountRole =
  | 'ADMIN'
  | 'HR_MANAGER'
  | 'RECRUITER'
  | 'HIRING_MANAGER'
  | 'INTERVIEWER'
  | 'APPROVER';

export type AccountStatus =
  | 'ACTIVE'
  | 'TEMPORARILY_LOCKED'
  | 'PENDING_ACTIVATION'
  | 'DISABLED'
  | 'ADMINISTRATIVELY_LOCKED';

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  department: string;
  departmentId?: string | null;
  phone?: string | null;
  displayTitle?: string | null;
  role: AccountRole;
  roles?: AccountRole[];
  status: AccountStatus;
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
  lockReason?: string;
  lockedAt?: string;
  activeJobsCount?: number;
  assignedJobs?: string[];
}

export interface LockAccountPayload {
  userId: string;
  reason: string;
}

export interface AccountFilterParams {
  searchKeyword: string;
  role: AccountRole | 'ALL';
  status: AccountStatus | 'ALL';
}

export const ROLE_DISPLAY_NAMES: Record<AccountRole, string> = {
  ADMIN: 'Quản trị viên (Admin)',
  HR_MANAGER: 'Quản lý nhân sự (HR Manager)',
  RECRUITER: 'Chuyên viên tuyển dụng (Recruiter)',
  HIRING_MANAGER: 'Quản lý tuyển dụng (Hiring Manager)',
  INTERVIEWER: 'Người phỏng vấn (Interviewer)',
  APPROVER: 'Người phê duyệt (Approver)',
};

export const ROLE_DESCRIPTIONS: Record<AccountRole, string> = {
  ADMIN: 'Toàn quyền cấu hình hệ thống, quản lý tài khoản và phân quyền người dùng.',
  HR_MANAGER: 'Quản lý hoạt động nhân sự và quy trình tuyển dụng.',
  RECRUITER: 'Đăng tin tuyển dụng, quản lý hồ sơ ứng viên và điều phối quy trình tuyển dụng.',
  HIRING_MANAGER: 'Tạo và duyệt yêu cầu tuyển dụng, tham gia đánh giá chuyên môn ứng viên.',
  INTERVIEWER: 'Tham gia các buổi phỏng vấn và gửi phiếu đánh giá phỏng vấn ứng viên.',
  APPROVER: 'Phê duyệt các yêu cầu tuyển dụng theo phân quyền.',
};

export const STATUS_DISPLAY_NAMES: Record<AccountStatus, string> = {
  ACTIVE: 'Hoạt động',
  TEMPORARILY_LOCKED: 'Tạm khóa',
  PENDING_ACTIVATION: 'Chờ kích hoạt',
  DISABLED: 'Vô hiệu hóa',
  ADMINISTRATIVELY_LOCKED: 'Quản trị viên khóa',
};

export interface EditAccountFormData {
  fullName: string;
}

export interface GetUsersParams {
  search?: string;
  role?: AccountRole | 'ALL';
  status?: AccountStatus | 'ALL';
  page?: number;
  limit?: number;
}

export interface GetUsersResponse {
  users: UserAccount[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}
