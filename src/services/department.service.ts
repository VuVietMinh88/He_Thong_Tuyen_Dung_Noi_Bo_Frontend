import axiosClient from '../utils/axiosClient';

export interface DepartmentOption {
  id: string;
  name: string;
  active: boolean;
}

interface DepartmentPage {
  items: DepartmentOption[];
  page: number;
  totalPages: number;
}

const parseDepartmentPage = (value: unknown): DepartmentPage => {
  if (
    typeof value !== 'object'
    || value === null
    || !('items' in value)
    || !Array.isArray(value.items)
    || !value.items.every((item) =>
      typeof item === 'object'
      && item !== null
      && 'id' in item
      && typeof item.id === 'string'
      && 'name' in item
      && typeof item.name === 'string'
      && 'active' in item
      && typeof item.active === 'boolean',
    )
    || !('page' in value)
    || typeof value.page !== 'number'
    || !('totalPages' in value)
    || typeof value.totalPages !== 'number'
  ) {
    throw new Error('Định dạng danh sách phòng ban từ Backend không hợp lệ.');
  }

  return {
    items: value.items.map((item) => ({
      id: item.id,
      name: item.name,
      active: item.active,
    })),
    page: value.page,
    totalPages: value.totalPages,
  };
};

export const departmentService = {
  async getActiveDepartments(): Promise<DepartmentOption[]> {
    const pageSize = 100;
    const firstResponse = await axiosClient.get<unknown>('/departments', {
      params: { page: 0, size: pageSize, active: true },
    });
    const firstPage = parseDepartmentPage(firstResponse.data);
    const departments = [...firstPage.items];

    for (let page = firstPage.page + 1; page < firstPage.totalPages; page += 1) {
      const response = await axiosClient.get<unknown>('/departments', {
        params: { page, size: pageSize, active: true },
      });
      departments.push(...parseDepartmentPage(response.data).items);
    }

    return departments;
  },
};
