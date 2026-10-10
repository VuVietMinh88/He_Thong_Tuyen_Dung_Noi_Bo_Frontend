import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import type { PageResult } from './business.service';

export interface CompetencyCriterion {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  sortOrder: number;
}

export interface CompetencyCriterionInput {
  id?: string;
  name: string;
  description?: string | null;
  weight: number;
}

export interface CompetencyFramework {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE';
  criteria: CompetencyCriterion[];
  positions: Array<{ id: string; code: string; name: string; level: string; active: boolean }>;
}

export interface CompetencyFrameworkSummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE';
  criterionCount: number;
}

export interface PositionEvaluationCriteria {
  position: {
    id: string;
    code: string;
    name: string;
    level: string;
    active: boolean;
  };
  framework: {
    id: string;
    code: string;
    name: string;
  };
  criteria: CompetencyCriterion[];
}

export interface SaveCompetencyFrameworkPayload {
  id?: string | null;
  code: string;
  name: string;
  description?: string | null;
  status: 'DRAFT' | 'ACTIVE';
  criteria: CompetencyCriterionInput[];
  positionIds?: string[];
}

/**
 * Xử lý lỗi từ axios response trả về từ backend
 */
const handleApiError = (error: unknown, fallbackMessage: string): Error => {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
    ) {
      return new Error(data.message);
    }
    if (!error.response) {
      return new Error('Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra mạng.');
    }
    if (error.response.status === 400) {
      return new Error('Dữ liệu yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.');
    }
    if (error.response.status === 404) {
      return new Error('Không tìm thấy khung năng lực hoặc chức danh tương ứng.');
    }
  }
  return error instanceof Error ? error : new Error(fallbackMessage);
};

/**
 * Kiểm tra ràng buộc bắt buộc tổng trọng số của các tiêu chí phải đúng 100%
 */
export const validateCriteriaWeight = (criteria: Array<{ weight: number | string }>): void => {
  if (!criteria || criteria.length === 0) {
    throw new Error('Khung năng lực phải có ít nhất 1 tiêu chí đánh giá.');
  }

  const total = criteria.reduce((sum, item) => {
    const w = typeof item.weight === 'string' ? parseFloat(item.weight) : item.weight;
    return sum + (isNaN(w) || w < 0 ? 0 : w);
  }, 0);

  const rounded = Math.round(total * 100) / 100;
  if (Math.abs(rounded - 100) > 0.001) {
    throw new Error(
      `Tổng trọng số của bộ tiêu chí phải bằng đúng 100% trước khi lưu (hiện tại: ${rounded}%).`,
    );
  }
};

/**
 * Service API quản lý Khung năng lực (Competency Framework)
 */
export const competencyService = {
  /**
   * Lấy cấu hình khung năng lực và tiêu chí đánh giá của một chức danh
   * AC1: getCompetencyFramework(positionId)
   */
  async getCompetencyFramework(positionId: string): Promise<PositionEvaluationCriteria> {
    try {
      const response = await axiosClient.get<PositionEvaluationCriteria>(
        `/positions/${positionId}/evaluation-criteria`,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Không thể tải khung năng lực của chức danh.');
    }
  },

  /**
   * Lấy danh sách khung năng lực (hỗ trợ phân trang)
   */
  async getFrameworks(page = 0, size = 100): Promise<PageResult<CompetencyFrameworkSummary>> {
    try {
      const response = await axiosClient.get<PageResult<CompetencyFrameworkSummary>>(
        '/competency-frameworks',
        { params: { page, size } },
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Không thể tải danh sách khung năng lực.');
    }
  },

  /**
   * Lấy thông tin chi tiết một khung năng lực kèm bộ tiêu chí và các chức danh liên kết
   */
  async getFrameworkById(frameworkId: string): Promise<CompetencyFramework> {
    try {
      const response = await axiosClient.get<CompetencyFramework>(
        `/competency-frameworks/${frameworkId}`,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Không thể tải chi tiết khung năng lực.');
    }
  },

  /**
   * Lưu khung năng lực (Tạo mới hoặc Cập nhật) kèm kiểm tra tổng trọng số 100% trước khi gửi request
   * AC1: saveCompetencyFramework(data)
   */
  async saveCompetencyFramework(
    payload: SaveCompetencyFrameworkPayload,
  ): Promise<CompetencyFramework> {
    // 1. Kiểm tra validation 100% trọng số trước khi gửi request
    validateCriteriaWeight(payload.criteria);

    // Chuẩn bị body payload gửi lên Backend
    const requestBody = {
      code: payload.code.trim().toUpperCase(),
      name: payload.name.trim(),
      description: payload.description ? payload.description.trim() : null,
      status: payload.status,
      criteria: payload.criteria.map((c) => ({
        ...(c.id ? { id: c.id } : {}),
        name: c.name.trim(),
        description: c.description ? c.description.trim() : null,
        weight: Number(c.weight),
      })),
    };

    try {
      let savedFramework: CompetencyFramework;

      if (payload.id) {
        // Cập nhật khung năng lực đã có
        const response = await axiosClient.put<CompetencyFramework>(
          `/competency-frameworks/${payload.id}`,
          requestBody,
        );
        savedFramework = response.data;
      } else {
        // Tạo mới khung năng lực
        const response = await axiosClient.post<CompetencyFramework>(
          '/competency-frameworks',
          requestBody,
        );
        savedFramework = response.data;
      }

      // 2. Nếu có danh sách positionIds cần đồng bộ
      if (payload.positionIds !== undefined && savedFramework?.id) {
        const targetFrameworkId = savedFramework.id;
        const currentPositions = savedFramework.positions || [];
        const currentPositionIds = new Set(currentPositions.map((p) => p.id));
        const nextPositionIds = new Set(payload.positionIds);

        // Gán cho các chức danh mới
        const toAssign = payload.positionIds.filter((id) => !currentPositionIds.has(id));
        // Gỡ khỏi các chức danh bị bỏ chọn
        const toRemove = currentPositions.filter((p) => !nextPositionIds.has(p.id)).map((p) => p.id);

        await Promise.allSettled([
          ...toAssign.map((posId) => competencyService.assignPosition(posId, targetFrameworkId)),
          ...toRemove.map((posId) => competencyService.removePosition(posId)),
        ]);

        // Tải lại chi tiết sau khi đồng bộ chức danh
        return await competencyService.getFrameworkById(targetFrameworkId);
      }

      return savedFramework;
    } catch (error) {
      throw handleApiError(error, 'Không thể lưu khung năng lực.');
    }
  },

  /**
   * Gán khung năng lực cho một chức danh
   */
  async assignPosition(positionId: string, frameworkId: string): Promise<void> {
    try {
      await axiosClient.put(`/positions/${positionId}/competency-framework`, { frameworkId });
    } catch (error) {
      throw handleApiError(error, 'Không thể gán khung năng lực cho chức danh.');
    }
  },

  /**
   * Gỡ khung năng lực khỏi chức danh
   */
  async removePosition(positionId: string): Promise<void> {
    try {
      await axiosClient.delete(`/positions/${positionId}/competency-framework`);
    } catch (error) {
      throw handleApiError(error, 'Không thể gỡ khung năng lực khỏi chức danh.');
    }
  },
};

export default competencyService;
