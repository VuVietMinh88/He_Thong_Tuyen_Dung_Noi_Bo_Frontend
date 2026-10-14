import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import type { CandidateCombinedFilterState } from '../src/types/candidate';
import { DEFAULT_COMBINED_FILTER_STATE } from '../src/types/candidate';
import type { SavedFilterPreset } from '../src/types/filterPreset';
import {
  filterPresetService,
  DEFAULT_MOCK_PRESETS,
} from '../src/services/filterPresetService';
import { SaveFilterModal } from '../src/components/Candidate/SaveFilterModal';
import { EditFilterPresetModal } from '../src/components/Candidate/EditFilterPresetModal';
import { SavedFilterDropdown } from '../src/components/Candidate/SavedFilterDropdown';
import axiosClient from '../src/utils/axiosClient';

describe('Task Jira TKNHTTDNB1-391: Tích hợp lưu và dùng lại bộ lọc cá nhân (User Story S5-03)', () => {
  const mockStorageMap = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string) => mockStorageMap.get(key) ?? null,
    setItem: (key: string, value: string) => mockStorageMap.set(key, value),
    removeItem: (key: string) => mockStorageMap.delete(key),
    clear: () => mockStorageMap.clear(),
  };

  const sampleActiveFilters: CandidateCombinedFilterState = {
    ...DEFAULT_COMBINED_FILTER_STATE,
    keyword: 'React',
    department: 'Khối Công nghệ & Sản phẩm',
    experienceLevel: '3_TO_5',
    educationLevel: 'BACHELOR',
    skills: ['React', 'TypeScript'],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockStorageMap.clear();
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. AC 4: Service filterPresetService & API / LocalStorage Fallback', () => {
    it('getSavedFilters trả về danh sách bộ lọc mẫu mặc định khi chưa có dữ liệu', async () => {
      const presets = await filterPresetService.getSavedFilters();
      expect(presets.length).toBeGreaterThanOrEqual(3);
      expect(presets[0].name).toContain('React Senior');
    });

    it('getSavedFilters gọi API GET /recruitment/candidates/filter-presets', async () => {
      const mockApiResponse: SavedFilterPreset[] = [
        {
          id: 'preset-api-1',
          name: 'Fresher Tester',
          filters: DEFAULT_COMBINED_FILTER_STATE,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: mockApiResponse,
      });

      const presets = await filterPresetService.getSavedFilters();
      expect(getSpy).toHaveBeenCalledWith(
        '/recruitment/candidates/filter-presets'
      );
      expect(presets).toHaveLength(1);
      expect(presets[0].name).toBe('Fresher Tester');
    });

    it('createSavedFilter ném lỗi khi tên bộ lọc để trống', async () => {
      await expect(
        filterPresetService.createSavedFilter({
          name: '   ',
          filters: sampleActiveFilters,
        })
      ).rejects.toThrow('Tên gợi nhớ cho bộ lọc không được để trống.');
    });

    it('createSavedFilter tạo mới và lưu trữ bộ lọc thành công', async () => {
      const newPreset = await filterPresetService.createSavedFilter({
        name: 'Lập trình viên React Senior Hà Nội',
        description: 'Tuyển dụng gấp đợt Q4',
        filters: sampleActiveFilters,
      });

      expect(newPreset.id).toBeDefined();
      expect(newPreset.name).toBe('Lập trình viên React Senior Hà Nội');
      expect(newPreset.filters.keyword).toBe('React');
      expect(newPreset.filters.skills).toContain('TypeScript');

      // Kiểm tra bộ lọc đã được lưu trong danh sách
      const listAfter = await filterPresetService.getSavedFilters();
      expect(listAfter.some((p) => p.name === 'Lập trình viên React Senior Hà Nội')).toBe(true);
    });

    it('updateSavedFilter đổi tên bộ lọc thành công', async () => {
      const created = await filterPresetService.createSavedFilter({
        name: 'Tên ban đầu',
        filters: sampleActiveFilters,
      });

      const updated = await filterPresetService.updateSavedFilter(created.id, {
        name: 'Tên mới sau khi đổi',
        description: 'Mô tả cập nhật',
      });

      expect(updated.name).toBe('Tên mới sau khi đổi');
      expect(updated.description).toBe('Mô tả cập nhật');
    });

    it('deleteSavedFilter xóa bộ lọc thành công', async () => {
      const created = await filterPresetService.createSavedFilter({
        name: 'Bộ lọc tạm để xóa',
        filters: sampleActiveFilters,
      });

      const deleteResult = await filterPresetService.deleteSavedFilter(created.id);
      expect(deleteResult).toBe(true);

      const listAfter = await filterPresetService.getSavedFilters();
      expect(listAfter.some((p) => p.id === created.id)).toBe(false);
    });
  });

  describe('2. AC 1: Modal Lưu bộ lọc (SaveFilterModal)', () => {
    it('render đầy đủ ô nhập tên gợi nhớ và nút đóng', () => {
      const htmlOutput = renderToString(
        React.createElement(SaveFilterModal, {
          isOpen: true,
          onClose: vi.fn(),
          currentFilters: sampleActiveFilters,
          onSuccess: vi.fn(),
        })
      );

      expect(htmlOutput).toContain('id="saved-filter-name-input"');
      expect(htmlOutput).toContain('data-testid="saved-filter-name-input"');
      expect(htmlOutput).toContain('Lưu bộ lọc hiện tại');
      expect(htmlOutput).toContain('data-testid="submit-save-filter-btn"');
    });

    it('hiển thị tóm tắt các điều kiện lọc sẽ được lưu', () => {
      const htmlOutput = renderToString(
        React.createElement(SaveFilterModal, {
          isOpen: true,
          onClose: vi.fn(),
          currentFilters: sampleActiveFilters,
          onSuccess: vi.fn(),
        })
      );

      expect(htmlOutput).toContain('Điều kiện lọc sẽ được lưu:');
      expect(htmlOutput).toContain('&quot;React&quot;');
      expect(htmlOutput).toContain('TypeScript');
    });

    it('hiển thị cảnh báo khi không có điều kiện lọc nào đang áp dụng', () => {
      const htmlOutput = renderToString(
        React.createElement(SaveFilterModal, {
          isOpen: true,
          onClose: vi.fn(),
          currentFilters: DEFAULT_COMBINED_FILTER_STATE,
          onSuccess: vi.fn(),
        })
      );

      expect(htmlOutput).toContain('data-testid="no-active-filters-warning"');
      expect(htmlOutput).toContain('Chưa có điều kiện lọc nào được áp dụng');
    });

    it('không render khi isOpen = false', () => {
      const htmlOutput = renderToString(
        React.createElement(SaveFilterModal, {
          isOpen: false,
          onClose: vi.fn(),
          currentFilters: sampleActiveFilters,
          onSuccess: vi.fn(),
        })
      );

      expect(htmlOutput).toBe('');
    });
  });

  describe('3. AC 2 & AC 3: Menu Dropdown & Quản lý bộ lọc đã lưu (SavedFilterDropdown)', () => {
    it('render nút dropdown trigger với huy hiệu đếm số lượng bộ lọc', () => {
      const htmlOutput = renderToString(
        React.createElement(SavedFilterDropdown, {
          currentFilters: sampleActiveFilters,
          onSelectPreset: vi.fn(),
        })
      );

      expect(htmlOutput).toContain('data-testid="saved-filters-dropdown-trigger"');
      expect(htmlOutput).toContain('Bộ lọc đã lưu');
    });

    it('DEFAULT_MOCK_PRESETS có cấu trúc dữ liệu hợp lệ', () => {
      expect(DEFAULT_MOCK_PRESETS.length).toBeGreaterThan(0);
      DEFAULT_MOCK_PRESETS.forEach((preset) => {
        expect(preset.id).toBeDefined();
        expect(preset.name).toBeTruthy();
        expect(preset.filters).toBeDefined();
      });
    });
  });

  describe('4. AC 3: Modal Đổi tên bộ lọc (EditFilterPresetModal)', () => {
    it('render pre-filled tên hiện tại của bộ lọc', () => {
      const samplePreset = DEFAULT_MOCK_PRESETS[0];
      const htmlOutput = renderToString(
        React.createElement(EditFilterPresetModal, {
          isOpen: true,
          preset: samplePreset,
          onClose: vi.fn(),
          onSuccess: vi.fn(),
        })
      );

      expect(htmlOutput).toContain('data-testid="edit-filter-preset-modal"');
      expect(htmlOutput).toContain('id="edit-filter-name-input"');
      expect(htmlOutput).toContain('value="' + samplePreset.name + '"');
      expect(htmlOutput).toContain('data-testid="submit-edit-filter-btn"');
    });
  });
});
