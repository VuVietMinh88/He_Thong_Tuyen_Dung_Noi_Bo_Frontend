import { useEffect, useState } from 'react';
import { ROLES, type Role } from '../constants/roles';

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'manage'
  | 'update'
  | string;

export type PermissionResource =
  | 'candidate'
  | 'job'
  | 'recruitment'
  | 'headcount'
  | 'salary_band'
  | 'interview'
  | 'user'
  | 'setting'
  | string;

export type PermissionDefinition = {
  action: PermissionAction;
  resource: PermissionResource;
};

export type PermissionMatrix = Partial<
  Record<Role, Partial<Record<string, string[]>>>
>;

export const DEFAULT_ROLE_STORAGE_KEY = 'user_role';

export const normalizeRole = (role?: string | null): string =>
  typeof role === 'string' ? role.trim().toUpperCase() : '';

const permissionMatrix: PermissionMatrix = {
  [ROLES.SYSTEM_ADMIN]: {
    '*': ['*'],
  },
  [ROLES.HEAD_OF_DEPARTMENT]: {
    headcount: ['view', 'approve'],
    candidate: ['view', 'update'],
    recruitment: ['view', 'approve'],
    salary_band: ['view'],
  },
  [ROLES.HR_MANAGER]: {
    headcount: ['view', 'approve', 'manage'],
    salary_band: ['view', 'edit', 'update'],
    recruitment: ['view', 'create', 'edit', 'approve'],
    candidate: ['view', 'create', 'edit', 'delete'],
    user: ['view', 'edit'],
  },
  [ROLES.RECRUITER]: {
    recruitment: ['view', 'create', 'edit'],
    candidate: ['view', 'create', 'edit'],
    interview: ['view', 'create', 'edit'],
    headcount: ['view'],
  },
  [ROLES.INTERVIEWER]: {
    interview: ['view', 'edit'],
    candidate: ['view'],
  },
  [ROLES.EMPLOYEE]: {
    candidate: ['view'],
    recruitment: ['view'],
    salary_band: ['view'],
  },
  [ROLES.CANDIDATE]: {
    candidate: ['view'],
  },
};

export const getCurrentRole = (
  storageKey = DEFAULT_ROLE_STORAGE_KEY,
): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const fromLocalStorage = window.localStorage.getItem(storageKey);
  if (fromLocalStorage) {
    return fromLocalStorage;
  }

  const appState = (
    window as Window & {
      __APP_STATE__?: {
        user?: {
          role?: string;
        };
      };
    }
  ).__APP_STATE__;

  return appState?.user?.role ?? null;
};

export const hasRole = (
  allowedRoles: readonly string[] = [],
  currentRole?: string | null,
): boolean => {
  if (!allowedRoles.length) {
    return false;
  }

  const normalizedCurrentRole = normalizeRole(currentRole ?? getCurrentRole());
  if (!normalizedCurrentRole) {
    return false;
  }

  return allowedRoles.some(
    (allowedRole) => normalizeRole(allowedRole) === normalizedCurrentRole,
  );
};

export const can = (
  action: string,
  resource: string,
  currentRole?: string | null,
): boolean => {
  const normalizedRole = normalizeRole(currentRole ?? getCurrentRole());
  if (!normalizedRole) {
    return false;
  }

  const allowedPermissions = permissionMatrix[normalizedRole as Role];
  if (!allowedPermissions) {
    return false;
  }

  const roleResourcePermissions =
    allowedPermissions[resource] ??
    allowedPermissions[resource.toLowerCase()] ??
    allowedPermissions[resource.toLowerCase().replace(/-/g, '_')] ??
    allowedPermissions['*'];

  if (!roleResourcePermissions) {
    return false;
  }

  const normalizedAction = action.trim().toLowerCase();
  return roleResourcePermissions.some(
    (permission) => permission === '*' || permission.toLowerCase() === normalizedAction,
  );
};

export const hasPermission = (
  permission: PermissionDefinition | string,
  resource?: string,
  currentRole?: string | null,
): boolean => {
  if (typeof permission === 'string') {
    return can(permission, resource ?? '*', currentRole);
  }

  return can(permission.action, permission.resource, currentRole);
};

export const usePermission = (storageKey = DEFAULT_ROLE_STORAGE_KEY) => {
  const [role, setRole] = useState<string | null>(() => getCurrentRole(storageKey));

  useEffect(() => {
    const updateRole = () => setRole(getCurrentRole(storageKey));

    updateRole();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', updateRole);
      return () => window.removeEventListener('storage', updateRole);
    }

    return undefined;
  }, [storageKey]);

  return {
    role,
    hasRole: (allowedRoles: readonly string[]) => hasRole(allowedRoles, role),
    can: (action: string, resource: string) => can(action, resource, role),
    hasPermission: (permission: PermissionDefinition | string, permissionResource?: string) =>
      hasPermission(permission, permissionResource, role),
    isAuthenticated: Boolean(role),
  };
};

export default usePermission;
