import type { CandidateCombinedFilterState } from './candidate';

/**
 * Types cho Bộ lọc ứng viên đã lưu (Saved Filter Presets)
 * Task Jira: TKNHTTDNB1-391 (User Story S5-03)
 */

export interface SavedFilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: CandidateCombinedFilterState;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  isDefault?: boolean;
  userId?: string;
}

export interface CreateSavedFilterDto {
  name: string;
  description?: string;
  filters: CandidateCombinedFilterState;
  isDefault?: boolean;
}

export interface UpdateSavedFilterDto {
  name?: string;
  description?: string;
  filters?: CandidateCombinedFilterState;
  isDefault?: boolean;
}
