import { useEffect, useState } from 'react';
import { ROLES, type Role } from '../constants/roles';
import { tokenService } from '../services/token.service';

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

export const normalizeRole = (role?: string | null): string =>
  typeof role === 'string'
    ? role.trim().toUpperCase().replace(/^ROLE_/, '')
    : '';

const isRole = (role: string): role is Role => Object.hasOwn(ROLES, role);

const permissionMatrix: PermissionMatrix = {
  [ROLES.ADMIN]: {
    '*': ['*'],
  },
  [ROLES.HR_MANAGER]: {
    headcount: ['view', 'approve', 'manage'],
    salary_band: ['view', 'edit', 'update'],
    recruitment: ['view', 'create', 'edit', 'approve'],
    candidate: ['view', 'create', 'edit', 'delete'],
    interview: ['view', 'create', 'edit', 'manage'],
    user: ['view', 'edit'],
  },
  [ROLES.RECRUITER]: {
    recruitment: ['view', 'create', 'edit'],
    candidate: ['view', 'create', 'edit'],
    interview: ['view', 'create', 'edit'],
    headcount: ['view'],
  },
  [ROLES.HIRING_MANAGER]: {
    headcount: ['view', 'create', 'edit', 'approve'],
    recruitment: ['view', 'create', 'edit', 'approve'],
    candidate: ['view', 'edit'],
    interview: ['view', 'create', 'edit'],
  },
  [ROLES.INTERVIEWER]: {
    interview: ['view', 'edit'],
    candidate: ['view'],
  },
  [ROLES.APPROVER]: {
    headcount: ['view', 'approve'],
    recruitment: ['view', 'approve'],
    candidate: ['view'],
  },
};

const getCurrentRoles = (): string[] => {
  if (!tokenService.getAccessToken()) return [];
  return tokenService.getUserData()?.roles ?? [];
};

export const getCurrentRole = (): string | null =>
  getCurrentRoles()[0] ?? null;

type CurrentRoles = readonly string[] | string | null | undefined;

const resolveRoles = (currentRoles?: CurrentRoles): string[] => {
  if (currentRoles === undefined || currentRoles === null) {
    return getCurrentRoles();
  }
  return typeof currentRoles === 'string' ? [currentRoles] : [...currentRoles];
};

export const hasRole = (
  allowedRoles: readonly string[] = [],
  currentRoles?: CurrentRoles,
): boolean => {
  if (!allowedRoles.length) return false;
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
  return resolveRoles(currentRoles).some((role) =>
    normalizedAllowedRoles.includes(normalizeRole(role)),
  );
};

export const can = (
  action: string,
  resource: string,
  currentRoles?: CurrentRoles,
): boolean => {
  const normalizedResource = resource.toLowerCase().replace(/-/g, '_');
  const normalizedAction = action.trim().toLowerCase();

  return resolveRoles(currentRoles).some((role) => {
    const normalizedRole = normalizeRole(role);
    if (!isRole(normalizedRole)) return false;
    const allowedPermissions = permissionMatrix[normalizedRole];
    if (!allowedPermissions) return false;

    const rolePermissions =
      allowedPermissions[resource]
      ?? allowedPermissions[normalizedResource]
      ?? allowedPermissions['*'];
    return rolePermissions?.some(
      (permission) =>
        permission === '*' || permission.toLowerCase() === normalizedAction,
    ) ?? false;
  });
};

export const hasPermission = (
  permission: PermissionDefinition | string,
  resource?: string,
  currentRoles?: CurrentRoles,
): boolean => {
  if (typeof permission === 'string') {
    return can(permission, resource ?? '*', currentRoles);
  }

  return can(permission.action, permission.resource, currentRoles);
};

export const usePermission = () => {
  const [roles, setRoles] = useState<string[]>(getCurrentRoles);

  useEffect(() => {
    const updateRoles = () => setRoles(getCurrentRoles());

    updateRoles();
    window.addEventListener('storage', updateRoles);
    return () => window.removeEventListener('storage', updateRoles);
  }, []);

  return {
    role: roles[0] ?? null,
    roles,
    hasRole: (allowedRoles: readonly string[]) => hasRole(allowedRoles, roles),
    can: (action: string, resource: string) => can(action, resource, roles),
    hasPermission: (permission: PermissionDefinition | string, permissionResource?: string) =>
      hasPermission(permission, permissionResource, roles),
    isAuthenticated: Boolean(tokenService.getAccessToken() && roles.length),
  };
};

export default usePermission;
