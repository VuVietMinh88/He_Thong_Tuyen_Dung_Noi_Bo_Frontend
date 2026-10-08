import { describe, expect, it } from 'vitest';
import { ROLES } from '../src/constants/roles';
import { can, hasPermission, hasRole } from '../src/hooks/usePermission';

describe('permission access', () => {
  it('checks all roles returned by the backend', () => {
    expect(hasRole([ROLES.ADMIN], [ROLES.RECRUITER, 'ROLE_ADMIN'])).toBe(true);
    expect(hasRole([ROLES.ADMIN], [ROLES.INTERVIEWER])).toBe(false);
  });

  it('applies permissions from any assigned backend role', () => {
    expect(can('view', 'candidate', [ROLES.INTERVIEWER])).toBe(true);
    expect(can('create', 'candidate', [ROLES.INTERVIEWER, ROLES.RECRUITER])).toBe(true);
    expect(can('delete', 'candidate', [ROLES.INTERVIEWER, ROLES.RECRUITER])).toBe(false);
    expect(hasPermission({ action: 'approve', resource: 'recruitment' }, undefined, [ROLES.APPROVER])).toBe(true);
  });

  it('grants wildcard permissions only to administrators', () => {
    expect(can('anything', 'any-resource', [ROLES.ADMIN])).toBe(true);
    expect(can('anything', 'any-resource', [ROLES.HR_MANAGER])).toBe(false);
  });
});
