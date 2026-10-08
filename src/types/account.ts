export type AccountRole = 'ADMIN' | 'RECRUITER' | 'HIRING_MANAGER' | 'INTERVIEWER' | 'CANDIDATE';

export type AccountStatus = 'ACTIVE' | 'LOCKED';

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  department: string;
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
  RECRUITER: 'Chuyên viên tuyển dụng (Recruiter)',
  HIRING_MANAGER: 'Quản lý tuyển dụng (Hiring Manager)',
  INTERVIEWER: 'Người phỏng vấn (Interviewer)',
  CANDIDATE: 'Ứng viên (Candidate)',
};

export const ROLE_DESCRIPTIONS: Record<AccountRole, string> = {
  ADMIN: 'Toàn quyền cấu hình hệ thống, quản lý tài khoản và phân quyền người dùng.',
  RECRUITER: 'Đăng tin tuyển dụng, quản lý hồ sơ ứng viên và điều phối quy trình tuyển dụng.',
  HIRING_MANAGER: 'Tạo và duyệt yêu cầu tuyển dụng, tham gia đánh giá chuyên môn ứng viên.',
  INTERVIEWER: 'Tham gia các buổi phỏng vấn và gửi phiếu đánh giá phỏng vấn ứng viên.',
  CANDIDATE: 'Ứng viên nội bộ, xem danh sách việc làm và theo dõi trạng thái ứng tuyển.',
};

export const STATUS_DISPLAY_NAMES: Record<AccountStatus, string> = {
  ACTIVE: 'Hoạt động',
  LOCKED: 'Đã khóa',
};

export interface EditAccountFormData {
  fullName: string;
  department: string;
  role: AccountRole;
  status: AccountStatus;
}

export const SYSTEM_DEPARTMENTS: string[] = [
  'Phòng Kỹ thuật & Công nghệ',
  'Phòng Tuyển dụng & Đào tạo',
  'Phòng Quản lý Sản phẩm',
  'Phòng Thiết kế UI/UX',
  'Phòng Tài chính - Kế toán',
  'Phòng Kinh doanh & Marketing',
  'Phòng Vận hành & IT',
  'Phòng Chăm sóc Khách hàng',
];

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
