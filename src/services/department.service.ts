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

export interface ManagerOption {
  id: string;
  fullName: string;
  email: string;
}

// === Service ===
export const departmentService = {
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
