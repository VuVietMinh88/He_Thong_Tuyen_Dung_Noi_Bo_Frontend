export type AccountRole = 'ADMIN' | 'RECRUITER' | 'HIRING_MANAGER' | 'INTERVIEWER';

export type AccountStatus = 'ACTIVE' | 'LOCKED';

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  department: string;
  role: AccountRole;
  status: AccountStatus;
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
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


