/**
 * Talent Pool Service: API & Local Storage Fallback cho Quản lý Kho Ứng Viên Tiềm Năng
 * Task Jira: TKNHTTDNB1-396 - Thiết kế màn hình đưa ứng viên vào kho tiềm năng (User Story S5-04)
 */

import axiosClient from '../utils/axiosClient';
import type {
  TalentPoolCategory,
  AddToTalentPoolDto,
  TalentPoolEntry,
} from '../types/talentPool';
import { DEFAULT_TALENT_POOL_CATEGORIES } from '../types/talentPool';

const BASE_URL = '/recruitment/talent-pool';
const CATEGORIES_STORAGE_KEY = 'recruitment_talent_pool_categories';
const ENTRIES_STORAGE_KEY = 'recruitment_talent_pool_entries';

// Bộ nhớ đệm trong bộ nhớ dành cho môi trường Vitest / SSR
let inMemoryCategories: TalentPoolCategory[] = [...DEFAULT_TALENT_POOL_CATEGORIES];
let inMemoryEntries: TalentPoolEntry[] = [];

const getLocalCategories = (): TalentPoolCategory[] => {
  if (typeof window === 'undefined') {
    return inMemoryCategories;
  }
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) {
      saveLocalCategories(DEFAULT_TALENT_POOL_CATEGORIES);
      return DEFAULT_TALENT_POOL_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : DEFAULT_TALENT_POOL_CATEGORIES;
  } catch {
    return DEFAULT_TALENT_POOL_CATEGORIES;
  }
};

const saveLocalCategories = (categories: TalentPoolCategory[]) => {
  inMemoryCategories = categories;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch {
      // Ignore storage errors
    }
  }
};

const getLocalEntries = (): TalentPoolEntry[] => {
  if (typeof window === 'undefined') {
    return inMemoryEntries;
  }
  try {
    const raw = localStorage.getItem(ENTRIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveLocalEntries = (entries: TalentPoolEntry[]) => {
  inMemoryEntries = entries;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Ignore storage errors
    }
  }
};

export const talentPoolService = {
  /**
   * Lấy danh sách nhóm / danh mục kho tiềm năng
   */
  async getCategories(): Promise<TalentPoolCategory[]> {
    try {
      const response = await axiosClient.get<{ data: TalentPoolCategory[] }>(
        `${BASE_URL}/categories`
      );
      if (response.data && Array.isArray(response.data.data)) {
        saveLocalCategories(response.data.data);
        return response.data.data;
      }
    } catch {
      // Sử dụng dữ liệu fallback từ local storage
    }
    return getLocalCategories();
  },

  /**
   * Tạo nhóm / danh mục kho mới
   */
  async createCategory(name: string, description?: string): Promise<TalentPoolCategory> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Tên nhóm kho tiềm năng không được để trống');
    }

    try {
      const response = await axiosClient.post<{ data: TalentPoolCategory }>(
        `${BASE_URL}/categories`,
        { name: trimmedName, description: description?.trim() }
      );
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    const currentList = getLocalCategories();
    const existing = currentList.find(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      return existing;
    }

    const newCategory: TalentPoolCategory = {
      id: `cat-${Date.now()}`,
      name: trimmedName,
      description: description?.trim() || '',
      color: 'indigo',
      candidateCount: 0,
    };

    saveLocalCategories([...currentList, newCategory]);
    return newCategory;
  },

  /**
   * Chuyển một hoặc nhiều hồ sơ ứng viên vào kho tiềm năng
   * Validation & đồng bộ API backend
   */
  async addToTalentPool(dto: AddToTalentPoolDto): Promise<TalentPoolEntry[]> {
    if (!dto.candidateIds || dto.candidateIds.length === 0) {
      throw new Error('Vui lòng chọn ít nhất một ứng viên để đưa vào kho');
    }

    const trimmedCategory = dto.category?.trim();
    if (!trimmedCategory) {
      throw new Error('Vui lòng chọn nhóm kho tiềm năng');
    }

    try {
      const response = await axiosClient.post<{ data: TalentPoolEntry[] }>(
        `${BASE_URL}/candidates`,
        {
          candidateIds: dto.candidateIds,
          category: trimmedCategory,
          tags: dto.tags || [],
          notes: dto.notes?.trim() || '',
          contactRecommendation: dto.contactRecommendation?.trim() || '',
        }
      );
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch {
      // Fallback local storage
    }

    const now = new Date().toISOString();
    const createdEntries: TalentPoolEntry[] = dto.candidateIds.map((cId) => ({
      id: `entry-${cId}-${Date.now()}`,
      candidateId: cId,
      category: trimmedCategory,
      tags: dto.tags || [],
      notes: dto.notes?.trim() || '',
      contactRecommendation: dto.contactRecommendation?.trim() || '',
      addedAt: now,
      addedBy: 'Recruiter',
    }));

    const existingEntries = getLocalEntries();
    saveLocalEntries([...createdEntries, ...existingEntries]);

    // Cập nhật số lượng ứng viên trong category
    const categories = getLocalCategories();
    const catIndex = categories.findIndex(
      (c) => c.name.toLowerCase() === trimmedCategory.toLowerCase() || c.id === trimmedCategory
    );
    if (catIndex !== -1) {
      categories[catIndex].candidateCount =
        (categories[catIndex].candidateCount || 0) + dto.candidateIds.length;
      saveLocalCategories([...categories]);
    }

    return createdEntries;
  },

  /**
   * Reset bộ nhớ test trong Vitest
   */
  _resetMemoryState() {
    inMemoryCategories = [...DEFAULT_TALENT_POOL_CATEGORIES];
    inMemoryEntries = [];
  },
};
