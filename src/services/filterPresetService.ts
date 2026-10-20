import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import type {
  SavedFilterPreset,
  CreateSavedFilterDto,
  UpdateSavedFilterDto,
} from '../types/filterPreset';
import { DEFAULT_COMBINED_FILTER_STATE } from '../types/candidate';

const STORAGE_KEY_SAVED_FILTER_PRESETS = 'smart_recruit_saved_filter_presets';

export const DEFAULT_MOCK_PRESETS: SavedFilterPreset[] = [
  {
    id: 'preset-react-senior-hn',
    name: 'Lập trình viên React Senior (Hà Nội)',
    description: 'Ứng viên có từ 3-5 năm kinh nghiệm, kỹ năng React và TypeScript vững',
    filters: {
      ...DEFAULT_COMBINED_FILTER_STATE,
      keyword: 'React',
      department: 'Khối Công nghệ & Sản phẩm',
      experienceLevel: '3_TO_5',
      educationLevel: 'BACHELOR',
      skills: ['React', 'TypeScript'],
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isDefault: false,
  },
  {
    id: 'preset-backend-lead',
    name: 'Kỹ sư Backend Spring Boot & Microservices',
    description: 'Chuyên gia Java Backend trên 5 năm kinh nghiệm thực chiến hệ thống lớn',
    filters: {
      ...DEFAULT_COMBINED_FILTER_STATE,
      keyword: 'Java',
      department: 'Khối Công nghệ & Sản phẩm',
      experienceLevel: 'GT_5',
      skills: ['Java', 'Spring Boot', 'Docker'],
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    isDefault: false,
  },
  {
    id: 'preset-ai-fresh',
    name: 'Chuyên viên AI / Computer Vision Mới nộp',
    description: 'Hồ sơ mới nộp vào Trung tâm Nghiên cứu AI & Dữ liệu',
    filters: {
      ...DEFAULT_COMBINED_FILTER_STATE,
      keyword: 'AI',
      department: 'Trung tâm Nghiên cứu AI & Dữ liệu',
      stageStatus: 'NEW',
      skills: ['Python'],
    },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isDefault: false,
  },
];

let inMemoryPresets: SavedFilterPreset[] = [...DEFAULT_MOCK_PRESETS];

const loadPresetsFromStorage = (): SavedFilterPreset[] => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [...inMemoryPresets];
    }
    const raw = window.localStorage.getItem(STORAGE_KEY_SAVED_FILTER_PRESETS);
    if (!raw) {
      window.localStorage.setItem(
        STORAGE_KEY_SAVED_FILTER_PRESETS,
        JSON.stringify(DEFAULT_MOCK_PRESETS)
      );
      inMemoryPresets = [...DEFAULT_MOCK_PRESETS];
      return [...DEFAULT_MOCK_PRESETS];
    }
    const parsed = JSON.parse(raw);
    const result =
      Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MOCK_PRESETS;
    inMemoryPresets = [...result];
    return result;
  } catch {
    return [...inMemoryPresets];
  }
};

const savePresetsToStorage = (presets: SavedFilterPreset[]): void => {
  inMemoryPresets = [...presets];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(
        STORAGE_KEY_SAVED_FILTER_PRESETS,
        JSON.stringify(presets)
      );
    }
  } catch {
    // Tránh gián đoạn nếu bộ nhớ cục bộ bị đầy hoặc chặn
  }
};

export const filterPresetService = {
  /**
   * Lấy danh sách toàn bộ bộ lọc cá nhân đã lưu (AC 4)
   */
  async getSavedFilters(): Promise<SavedFilterPreset[]> {
    try {
      const response = await axiosClient.get<SavedFilterPreset[]>(
        '/recruitment/candidates/filter-presets'
      );
      if (response.data && Array.isArray(response.data)) {
        savePresetsToStorage(response.data);
        return response.data;
      }
    } catch {
      // Backend chưa sẵn sàng hoặc offline -> Fallback vào LocalStorage
    }
    return loadPresetsFromStorage();
  },

  /**
   * Lưu bộ lọc hiện tại thành mẫu mới (AC 1 & AC 4)
   */
  async createSavedFilter(data: CreateSavedFilterDto): Promise<SavedFilterPreset> {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      throw new Error('Tên gợi nhớ cho bộ lọc không được để trống.');
    }

    try {
      const response = await axiosClient.post<SavedFilterPreset>(
        '/recruitment/candidates/filter-presets',
        {
          ...data,
          name: trimmedName,
        }
      );
      if (response.data && response.data.id) {
        const currentList = loadPresetsFromStorage();
        savePresetsToStorage([response.data, ...currentList]);
        return response.data;
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      // Khi offline / backend mock fallback:
    }

    const currentPresets = loadPresetsFromStorage();

    // Kiểm tra tên trùng lặp (không bắt buộc nhưng cảnh báo nếu trùng)
    const newPreset: SavedFilterPreset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      description: data.description?.trim(),
      filters: data.filters,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: data.isDefault ?? false,
    };

    const updatedList = [newPreset, ...currentPresets];
    savePresetsToStorage(updatedList);
    return newPreset;
  },

  /**
   * Cập nhật thông tin (ví dụ: đổi tên) bộ lọc đã lưu (AC 3 & AC 4)
   */
  async updateSavedFilter(
    id: string,
    data: UpdateSavedFilterDto
  ): Promise<SavedFilterPreset> {
    if (data.name !== undefined && !data.name.trim()) {
      throw new Error('Tên gợi nhớ cho bộ lọc không được để trống.');
    }

    try {
      const response = await axiosClient.put<SavedFilterPreset>(
        `/recruitment/candidates/filter-presets/${encodeURIComponent(id)}`,
        data
      );
      if (response.data && response.data.id) {
        const currentPresets = loadPresetsFromStorage();
        const updatedList = currentPresets.map((p) =>
          p.id === id ? response.data : p
        );
        savePresetsToStorage(updatedList);
        return response.data;
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      // Fallback
    }

    const currentPresets = loadPresetsFromStorage();
    const index = currentPresets.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Không tìm thấy bộ lọc có mã định danh: ${id}`);
    }

    const existing = currentPresets[index];
    const updatedPreset: SavedFilterPreset = {
      ...existing,
      name: data.name !== undefined ? data.name.trim() : existing.name,
      description:
        data.description !== undefined
          ? data.description.trim()
          : existing.description,
      filters: data.filters !== undefined ? data.filters : existing.filters,
      isDefault:
        data.isDefault !== undefined ? data.isDefault : existing.isDefault,
      updatedAt: new Date().toISOString(),
    };

    currentPresets[index] = updatedPreset;
    savePresetsToStorage([...currentPresets]);
    return updatedPreset;
  },

  /**
   * Xóa bộ lọc đã lưu theo ID (AC 3 & AC 4)
   */
  async deleteSavedFilter(id: string): Promise<boolean> {
    try {
      await axiosClient.delete(
        `/recruitment/candidates/filter-presets/${encodeURIComponent(id)}`
      );
    } catch {
      // Tiếp tục xóa ở storage cục bộ để giao diện phản hồi ngay
    }

    const currentPresets = loadPresetsFromStorage();
    const filtered = currentPresets.filter((p) => p.id !== id);
    savePresetsToStorage(filtered);
    return true;
  },
};
