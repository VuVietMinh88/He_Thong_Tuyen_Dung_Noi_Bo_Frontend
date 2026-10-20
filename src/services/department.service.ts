import axiosClient from '../utils/axiosClient';

// === DTOs & Types ===
export interface DepartmentNode {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  managerUserId: string;
  managerFullName: string | null;
  active: boolean;
  children?: DepartmentNode[];
}

export interface CreateDepartmentPayload {
  code: string;
  name: string;
  parentId: string | null;
  managerUserId: string;
  active: boolean;
}

export interface UpdateDepartmentPayload extends CreateDepartmentPayload {}

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

export interface ManagerOption {
  id: string;
  fullName: string;
  email: string;
}

// === Service ===
export const departmentService = {
  // Lấy danh sách phòng ban đang hoạt động (phân trang backend)
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

  // Lấy toàn bộ cây phòng ban (Backend trả sẵn dạng cây)
  async getDepartmentsTree(): Promise<DepartmentNode[]> {
    const response = await axiosClient.get<DepartmentNode[]>('/departments/tree');
    return response.data;
  },

  // Tạo mới phòng ban
  async createDepartment(data: CreateDepartmentPayload): Promise<DepartmentNode> {
    const response = await axiosClient.post<DepartmentNode>('/departments', data);
    return response.data;
  },

  // Cập nhật thông tin phòng ban
  async updateDepartment(id: string, data: UpdateDepartmentPayload): Promise<DepartmentNode> {
    const response = await axiosClient.put<DepartmentNode>(`/departments/${id}`, data);
    return response.data;
  },

  // Xóa vĩnh viễn phòng ban (nếu được phép)
  async deleteDepartment(id: string): Promise<void> {
    await axiosClient.delete(`/departments/${id}`);
  },

  // Lấy danh sách nhân viên để chọn làm người phụ trách
  async getManagers(): Promise<ManagerOption[]> {
    // Gọi API lấy danh sách tài khoản ACTIVE, có thể tối ưu phân trang hoặc tìm kiếm sau
    const response = await axiosClient.get<{ items: ManagerOption[] }>('/accounts', {
      params: { status: 'ACTIVE', page: 0, size: 500 },
    });
    return response.data.items;
  },
};

