export const ROLES = {
  ADMIN: 'ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  RECRUITER: 'RECRUITER',
  HIRING_MANAGER: 'HIRING_MANAGER',
  INTERVIEWER: 'INTERVIEWER',
  APPROVER: 'APPROVER',
} as const;

export type RoleKey = keyof typeof ROLES;
export type RoleValue = (typeof ROLES)[RoleKey];
export type Role = RoleValue;

export const ROLE_NAMES: Record<Role, string> = {
  ADMIN: 'Quản trị hệ thống',
  HR_MANAGER: 'Trưởng phòng nhân sự',
  RECRUITER: 'Nhân viên tuyển dụng',
  HIRING_MANAGER: 'Quản lý tuyển dụng',
  INTERVIEWER: 'Người phỏng vấn',
  APPROVER: 'Người phê duyệt',
};
