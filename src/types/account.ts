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
