import axiosClient from '../utils/axiosClient';

// === DTOs & Types ===
export interface JobTitleNode {
  id: string;
  code: string;
  name: string;
  level: string;
  salaryMin?: number; // Cột này phụ thuộc vào quyền SALARY_RANGES_READ_ALL
  salaryMax?: number;
  active: boolean;
  competencyFrameworkId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateJobTitlePayload {
  code: string;
  name: string;
  level: string;
  salaryMin: number;
  salaryMax: number;
  active: boolean;
}

export interface UpdateJobTitlePayload extends CreateJobTitlePayload {}

export interface GetJobTitlesParams {
  q?: string;
  active?: boolean;
  page?: number;
  size?: number;
}

export interface PaginatedJobTitles {
  items: JobTitleNode[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// === Service ===
export const jobTitleService = {
  // Lấy danh sách chức danh có phân trang và tìm kiếm
  async getJobTitles(params?: GetJobTitlesParams): Promise<PaginatedJobTitles> {
    const response = await axiosClient.get<PaginatedJobTitles>('/positions', { params });
    return response.data;
  },

  // Tạo mới chức danh
  async createJobTitle(data: CreateJobTitlePayload): Promise<JobTitleNode> {
    const response = await axiosClient.post<JobTitleNode>('/positions', data);
    return response.data;
  },

  // Cập nhật thông tin chức danh (bao gồm cả trạng thái Ngừng áp dụng)
  async updateJobTitle(id: string, data: UpdateJobTitlePayload): Promise<JobTitleNode> {
    const response = await axiosClient.put<JobTitleNode>(`/positions/${id}`, data);
    return response.data;
  },

  // Xóa chức danh 
  // LƯU Ý BẢO MẬT: Theo tài liệu Backend, chức danh không có API DELETE cứng để tránh lỗi mất lịch sử. 
  // Việc "Xóa" nên được thực hiện bằng cách update active = false.
  // Tuy nhiên, hàm này được giữ lại theo thiết kế của giao diện. Nếu gọi bị 404, hãy dùng updateJobTitle(id, {...old, active: false})
  async deleteJobTitle(id: string): Promise<void> {
    await axiosClient.delete(`/positions/${id}`);
  },
};

