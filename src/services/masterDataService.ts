import axios from 'axios';
import axiosClient from '../utils/axiosClient';

export type MasterDataType =
  | 'CANDIDATE_SOURCE'
  | 'REJECTION_REASON'
  | 'WORK_LOCATION'
  | 'EMPLOYMENT_TYPE'
  | 'JOB_LOCATION'
  | 'JOB_TYPE';

export interface RecruitmentCatalogRawItem {
  id: string;
  type: string;
  code: string;
  name: string;
  sortOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MasterDataItem {
  id: string;
  type: MasterDataType;
  code: string;
  name: string;
  description: string;
  order: number;
  isActive: boolean;
  isReferenced: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveMasterDataPayload {
  id?: string | null;
  code?: string;
  name: string;
  description?: string;
  order?: number;
  isActive?: boolean;
  active?: boolean;
}

/**
 * Chuẩn hóa mã loại danh mục để tương thích với Backend API
 */
export const normalizeMasterDataType = (type: string): string => {
  if (type === 'JOB_LOCATION') return 'WORK_LOCATION';
  if (type === 'JOB_TYPE') return 'EMPLOYMENT_TYPE';
  return type;
};

/**
 * Tự động tạo mã code chuẩn hóa từ tên tiếng Việt (viết hoa, không dấu, phân cách bởi gạch dưới)
 */
export const generateCatalogCode = (name: string): string => {
  const normalized = name
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return normalized ? normalized.slice(0, 50) : 'ITEM';
};

/**
 * Xử lý lỗi API từ axiosClient, đặc biệt xử lý lỗi 409 khi xóa dữ liệu đang được tham chiếu
 */
export const handleMasterDataApiError = (error: unknown, fallbackMessage: string): Error => {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;

    // Trích xuất thông báo lỗi chuẩn từ Backend
    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
    ) {
      return new Error(data.message);
    }

    if (error.response?.status === 409) {
      return new Error(
        'Giá trị danh mục đang được dữ liệu khác sử dụng nên không thể xóa. Hãy chuyển giá trị sang ngừng sử dụng (active = false).',
      );
    }

    if (!error.response) {
      return new Error('Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra server và kết nối mạng.');
    }

    if (error.response.status === 400) {
      return new Error('Dữ liệu yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin mã và tên danh mục.');
    }

    if (error.response.status === 403) {
      return new Error('Bạn không có quyền thực hiện thao tác quản lý danh mục dùng chung.');
    }

    if (error.response.status === 404) {
      return new Error('Không tìm thấy danh mục hoặc mục dữ liệu tương ứng trong hệ thống.');
    }
  }

  return error instanceof Error ? error : new Error(fallbackMessage);
};

/**
 * Service API quản lý danh mục tuyển dụng dùng chung (Master Data)
 */
export const masterDataService = {
  /**
   * Lấy danh sách danh mục theo loại (AC1)
   */
  async getMasterData(type: MasterDataType, activeOnly?: boolean): Promise<MasterDataItem[]> {
    const normalizedType = normalizeMasterDataType(type);
    try {
      const response = await axiosClient.get<RecruitmentCatalogRawItem[]>(
        `/recruitment-catalogs/${normalizedType}/items`,
        {
          params: activeOnly !== undefined ? { active: activeOnly } : undefined,
        },
      );

      const items = response.data || [];
      return items.map((item) => ({
        id: item.id,
        type: (item.type || normalizedType) as MasterDataType,
        code: item.code,
        name: item.name,
        description: '',
        order: item.sortOrder ?? 0,
        isActive: item.active,
        isReferenced: false,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
    } catch (error) {
      throw handleMasterDataApiError(error, `Không thể tải danh sách danh mục ${type}.`);
    }
  },

  /**
   * Tạo mới hoặc cập nhật thông tin mục danh mục (AC1)
   */
  async saveMasterData(
    type: MasterDataType,
    data: SaveMasterDataPayload,
  ): Promise<MasterDataItem> {
    const normalizedType = normalizeMasterDataType(type);

    const trimmedName = data.name ? data.name.trim() : '';
    if (!trimmedName) {
      throw new Error('Tên giá trị danh mục không được để trống.');
    }

    const code = (data.code?.trim() || generateCatalogCode(trimmedName)).slice(0, 50);
    const active = data.isActive ?? data.active ?? true;

    // Backend chỉ chấp nhận chính xác { code, name, active }, gửi thừa trường sẽ bị 400 INVALID_JSON
    const body = {
      code,
      name: trimmedName,
      active,
    };

    try {
      if (data.id) {
        const response = await axiosClient.put<RecruitmentCatalogRawItem>(
          `/recruitment-catalogs/${normalizedType}/items/${data.id}`,
          body,
        );
        const item = response.data;
        return {
          id: item.id,
          type: (item.type || normalizedType) as MasterDataType,
          code: item.code,
          name: item.name,
          description: data.description || '',
          order: item.sortOrder ?? 0,
          isActive: item.active,
          isReferenced: false,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      }

      const response = await axiosClient.post<RecruitmentCatalogRawItem>(
        `/recruitment-catalogs/${normalizedType}/items`,
        body,
      );
      const item = response.data;
      return {
        id: item.id,
        type: (item.type || normalizedType) as MasterDataType,
        code: item.code,
        name: item.name,
        description: data.description || '',
        order: item.sortOrder ?? 0,
        isActive: item.active,
        isReferenced: false,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    } catch (error) {
      throw handleMasterDataApiError(error, `Không thể lưu danh mục ${type}.`);
    }
  },

  /**
   * Xóa mục danh mục (AC1 & AC2)
   * Backend sẽ trả về 409 RECRUITMENT_CATALOG_ITEM_IN_USE nếu dữ liệu đang được tham chiếu
   */
  async deleteMasterData(type: MasterDataType, id: string): Promise<void> {
    if (!id) {
      throw new Error('ID mục danh mục không hợp lệ.');
    }
    const normalizedType = normalizeMasterDataType(type);

    try {
      await axiosClient.delete<void>(`/recruitment-catalogs/${normalizedType}/items/${id}`);
    } catch (error) {
      throw handleMasterDataApiError(error, 'Không thể xóa giá trị danh mục.');
    }
  },

  /**
   * Sắp xếp thứ tự hiển thị của toàn bộ danh mục theo danh sách UUID (AC2)
   */
  async reorderMasterData(type: MasterDataType, itemIds: string[]): Promise<MasterDataItem[]> {
    const normalizedType = normalizeMasterDataType(type);

    try {
      const response = await axiosClient.put<RecruitmentCatalogRawItem[]>(
        `/recruitment-catalogs/${normalizedType}/order`,
        { itemIds },
      );

      const items = response.data || [];
      return items.map((item) => ({
        id: item.id,
        type: (item.type || normalizedType) as MasterDataType,
        code: item.code,
        name: item.name,
        description: '',
        order: item.sortOrder ?? 0,
        isActive: item.active,
        isReferenced: false,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
    } catch (error) {
      throw handleMasterDataApiError(error, 'Không thể sắp xếp thứ tự danh mục.');
    }
  },
};

export default masterDataService;
