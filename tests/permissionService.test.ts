import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosClient from '../src/utils/axiosClient';
import {
  InvalidPermissionsResponseError,
  permissionService,
} from '../src/services/permission.service';

afterEach(() => vi.restoreAllMocks());

describe('permissionService backend contract', () => {
  it('loads current permission codes from the authenticated backend endpoint', async () => {
    const get = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
      data: { permissions: ['USER_ADMIN_READ_ALL', 'SELF_PROFILE_READ'] },
    });

    await expect(permissionService.getCurrentPermissions()).resolves.toEqual({
      permissions: ['USER_ADMIN_READ_ALL', 'SELF_PROFILE_READ'],
    });
    expect(get).toHaveBeenCalledWith('/auth/permissions');
  });

  it('rejects malformed permissions rather than granting access', async () => {
    vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
      data: { permissions: ['USER_ADMIN_READ_ALL', 7] },
    });

    await expect(permissionService.getCurrentPermissions())
      .rejects.toBeInstanceOf(InvalidPermissionsResponseError);
  });
});
