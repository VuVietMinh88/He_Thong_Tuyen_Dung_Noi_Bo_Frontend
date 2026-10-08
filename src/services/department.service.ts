import axiosClient from '../utils/axiosClient';

export interface DepartmentOption {
  id: string;
  name: string;
  active: boolean;
}

export const departmentService = {
  async getActiveDepartments(): Promise<DepartmentOption[]> {
    const response = await axiosClient.get<unknown>('/departments', {
      params: { page: 0, size: 200, active: true },
    });
    const data: unknown = response.data;
    if (
      typeof data !== 'object'
      || data === null
      || !('items' in data)
      || !Array.isArray(data.items)
      || !data.items.every((item) =>
        typeof item === 'object'
        && item !== null
        && 'id' in item
        && typeof item.id === 'string'
        && 'name' in item
        && typeof item.name === 'string'
        && 'active' in item
        && typeof item.active === 'boolean',
      )
    ) {
      throw new Error('Định dạng danh sách phòng ban từ Backend không hợp lệ.');
    }

    return data.items.map((item) => ({
      id: item.id,
      name: item.name,
      active: item.active,
    }));
  },
};
