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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const permissionService = {
  async getCurrentPermissions(): Promise<CurrentPermissions> {
    const response = await axiosClient.get<unknown>('/auth/permissions');
    const data: unknown = response.data;
    if (
      !isRecord(data)
      || !Array.isArray(data.permissions)
      || !data.permissions.every((permission) => typeof permission === 'string' && permission.length > 0)
    ) {
      throw new InvalidPermissionsResponseError();
    }

    return { permissions: data.permissions };
  },
};
