export const ROLES = {
  ADMIN: "ADMIN",
  HR_MANAGER: "HR_MANAGER",
  RECRUITER: "RECRUITER",
  HIRING_MANAGER: "HIRING_MANAGER",
  INTERVIEWER: "INTERVIEWER",
  APPROVER: "APPROVER",
} as const;

export type RoleKey = keyof typeof ROLES;
export type RoleValue = (typeof ROLES)[RoleKey];
