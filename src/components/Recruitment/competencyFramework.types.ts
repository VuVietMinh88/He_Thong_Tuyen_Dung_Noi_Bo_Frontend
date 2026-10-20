import type {
  CompetencyCriterion,
  CompetencyCriterionInput,
  CompetencyFramework,
  Position,
} from '../../services/business.service';

export interface CriterionFormData {
  tempId: string;
  id?: string;
  name: string;
  description: string;
  weight: number | string;
}

export interface CompetencyFrameworkFormData {
  id?: string;
  code: string;
  name: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE';
  criteria: CriterionFormData[];
  assignedPositionIds: string[];
}

/**
 * Tính tổng trọng số của danh sách tiêu chí và làm tròn 2 chữ số thập phân
 */
export const calculateTotalWeight = (
  criteria: Array<{ weight: number | string }>,
): number => {
  const sum = criteria.reduce((total, item) => {
    const rawVal = item.weight;
    const num = typeof rawVal === 'string' ? parseFloat(rawVal) : rawVal;
    return total + (isNaN(num) || num < 0 ? 0 : num);
  }, 0);
  return Math.round(sum * 100) / 100;
};

/**
 * Kiểm tra xem tổng trọng số có đúng bằng 100% không
 */
export const isWeightValid = (totalWeight: number): boolean => {
  return Math.abs(totalWeight - 100) < 0.001;
};

/**
 * Phân bổ đều 100% trọng số cho N tiêu chí
 */
export const distributeWeightsEqually = (
  criteriaCount: number,
): number[] => {
  if (criteriaCount <= 0) return [];
  const baseWeight = Math.floor((100 / criteriaCount) * 100) / 100;
  const remainder = Math.round((100 - baseWeight * criteriaCount) * 100) / 100;

  return Array.from({ length: criteriaCount }, (_, index) => {
    // Tiêu chí đầu tiên nhận phần dư lẻ (nếu có) để tổng luôn đúng 100%
    return index === 0 ? Math.round((baseWeight + remainder) * 100) / 100 : baseWeight;
  });
};

export type {
  CompetencyCriterion,
  CompetencyCriterionInput,
  CompetencyFramework,
  Position,
};
