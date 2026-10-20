import { describe, expect, it } from 'vitest';
import { can, hasPermission } from '../src/hooks/usePermission';

describe('permission access', () => {
  it('maps actions to backend permission codes and accepts scoped grants', () => {
    expect(can('view', 'candidate', ['CANDIDATES_READ_SCOPED'])).toBe(true);
    expect(can('create', 'candidate', ['CANDIDATES_WRITE_SCOPED'])).toBe(true);
    expect(can('delete', 'candidate', ['CANDIDATES_READ_SCOPED'])).toBe(false);
    expect(hasPermission(
      { action: 'view', resource: 'user' },
      undefined,
      ['USER_ADMIN_READ_ALL'],
    )).toBe(true);
  });

  it('requires exact backend permissions for direct checks', () => {
    expect(hasPermission('USER_ADMIN_WRITE_ALL', undefined, ['USER_ADMIN_WRITE_ALL'])).toBe(true);
    expect(hasPermission('USER_ADMIN_WRITE_ALL', undefined, ['USER_ADMIN_READ_ALL'])).toBe(false);
  });
});
