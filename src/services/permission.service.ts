import axiosClient from '../utils/axiosClient';

export interface CurrentPermissions {
  permissions: string[];
}

export class InvalidPermissionsResponseError extends Error {
  constructor() {
    super('Backend trả về danh sách quyền không đúng hợp đồng API.');
    this.name = 'InvalidPermissionsResponseError';
  }
}

export const permissionService = {
  async getCurrentPermissions(): Promise<CurrentPermissions> {
    const response = await axiosClient.get<unknown>('/auth/permissions');
    const data: unknown = response.data;
    if (
      typeof data !== 'object'
      || data === null
      || !('permissions' in data)
      || !Array.isArray(data.permissions)
      || !data.permissions.every(
        (permission) => typeof permission === 'string' && permission.trim().length > 0,
      )
    ) {
      throw new InvalidPermissionsResponseError();
    }
    return { permissions: [...new Set(data.permissions)] };
  },
};
