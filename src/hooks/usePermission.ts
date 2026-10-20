import { useContext } from 'react';
import { PermissionContext } from '../context/PermissionContext';
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
  | 'profile'
  | 'security'
  | 'setting'
  | string;

export type PermissionDefinition = {
  action: PermissionAction;
  resource: PermissionResource;
};

type CurrentPermissions = readonly string[] | string | null | undefined;

const permissionsFor = (action: string, resource: string): string[] => {
  const normalizedAction = action.trim().toLowerCase();
  const normalizedResource = resource.trim().toLowerCase().replace(/-/g, '_');
  const isRead = normalizedAction === 'view' || normalizedAction === 'read';

  if (normalizedResource === 'user' || normalizedResource === 'users') {
    return [isRead ? 'USER_ADMIN_READ_ALL' : 'USER_ADMIN_WRITE_ALL'];
  }
  if (normalizedResource === 'profile' || normalizedResource === 'self_profile') {
    return [isRead ? 'SELF_PROFILE_READ' : 'SELF_PROFILE_WRITE'];
  }
  if (normalizedResource === 'security' || normalizedResource === 'password') {
    return ['SELF_SECURITY_WRITE'];
  }

  const module = {
    candidate: 'CANDIDATES',
    candidates: 'CANDIDATES',
    job: 'JOB_POSTINGS',
    jobs: 'JOB_POSTINGS',
    job_posting: 'JOB_POSTINGS',
    recruitment: 'REQUISITIONS',
    headcount: 'REQUISITIONS',
    interview: 'INTERVIEWS',
    interviews: 'INTERVIEWS',
    evaluation: 'EVALUATIONS',
    offer: 'OFFERS',
    notification: 'NOTIFICATIONS',
    report: 'REPORTS',
    organization: 'ORGANIZATION',
    salary_band: 'SALARY_RANGES',
    salary_ranges: 'SALARY_RANGES',
  }[normalizedResource];

  if (!module) return [];
  const operation = isRead ? 'READ' : 'WRITE';
  return [`${module}_${operation}_ALL`, `${module}_${operation}_SCOPED`];
};

export const hasPermission = (
  permission: PermissionDefinition | string,
  resourceOrPermissions?: string | CurrentPermissions,
  currentPermissions?: CurrentPermissions,
): boolean => {
  const requiredPermissions = typeof permission === 'string'
    ? resourceOrPermissions === undefined || typeof resourceOrPermissions !== 'string'
      ? [permission]
      : permissionsFor(permission, resourceOrPermissions)
    : permissionsFor(permission.action, permission.resource);

  const granted = typeof permission === 'string'
    && resourceOrPermissions !== undefined
    && typeof resourceOrPermissions !== 'string'
    ? resourceOrPermissions
    : currentPermissions;
  const permissionSet = typeof granted === 'string'
    ? [granted]
    : [...(granted ?? [])];

  return requiredPermissions.some((required) => permissionSet.includes(required));
};

export const can = (
  action: string,
  resource: string,
  currentPermissions?: CurrentPermissions,
): boolean => hasPermission(action, resource, currentPermissions);

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission phải được sử dụng bên trong PermissionProvider.');
  }

  return {
    ...context,
    can: (action: string, resource: string) => can(action, resource, context.permissions),
    hasPermission: (permission: PermissionDefinition | string, resource?: string) =>
      typeof permission === 'string'
        ? resource
          ? can(permission, resource, context.permissions)
          : hasPermission(permission, undefined, context.permissions)
        : hasPermission(permission, undefined, context.permissions),
    isAuthenticated: Boolean(tokenService.getAccessToken()),
  };
};

export default usePermission;
