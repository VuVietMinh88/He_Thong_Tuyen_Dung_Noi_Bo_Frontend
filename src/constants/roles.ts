export const ROLES = {
  CANDIDATE: 'CANDIDATE',
  RECRUITER: 'RECRUITER',
  HEAD_OF_DEPARTMENT: 'HEAD_OF_DEPARTMENT',
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  INTERVIEWER: 'INTERVIEWER',
  HR_MANAGER: 'HR_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type Role = keyof typeof ROLES;

export const DASHBOARD_ROLES = [
  ROLES.RECRUITER,
  ROLES.HR_MANAGER,
  ROLES.SYSTEM_ADMIN,
] as const satisfies readonly Role[];

export const ROLE_NAMES: Record<Role, string> = {
  CANDIDATE: 'Ứng viên',
  RECRUITER: 'Nhân viên tuyển dụng',
  HEAD_OF_DEPARTMENT: 'Trưởng bộ phận',
  SYSTEM_ADMIN: 'Quản trị hệ thống',
  INTERVIEWER: 'Người phỏng vấn',
  HR_MANAGER: 'Trưởng phòng nhân sự',
  EMPLOYEE: 'Nhân viên nội bộ',
};
