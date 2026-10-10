import { describe, expect, it } from 'vitest';
import {
  calculateTotalWeight,
  distributeWeightsEqually,
  isWeightValid,
  type CriterionFormData,
} from '../src/components/Recruitment/competencyFramework.types';

describe('CriterionWeightManager - Kiểm tra logic nhập trọng số tiêu chí (Jira TKNHTTDNB1-210 / S2-06)', () => {
  // AC1: Trường nhập trọng số chi tiết (1% - 100%)
  describe('AC1: Giới hạn trọng số trong khoảng từ 1 đến 100%', () => {
    it('kiểm tra giá trị hợp lệ trong ngưỡng [1, 100]', () => {
      const validWeights = [1, 25, 50, 75.5, 99, 100];
      validWeights.forEach((w) => {
        expect(w).toBeGreaterThanOrEqual(1);
        expect(w).toBeLessThanOrEqual(100);
      });
    });

    it('nhận diện các giá trị ngoài ngưỡng hợp lệ', () => {
      const invalidWeights = [-5, 0, 0.5, 101, 150];
      invalidWeights.forEach((w) => {
        const isOutOfRange = w < 1 || w > 100;
        expect(isOutOfRange).toBe(true);
      });
    });
  });

  // AC2: Tổng trọng số tự động (Real-time Calculation) & Cảnh báo trạng thái
  describe('AC2: Tính tổng trọng số Real-time và trạng thái Xanh/Đỏ', () => {
    it('tính đúng tổng trọng số khi thêm/sửa các giá trị', () => {
      const criteria: CriterionFormData[] = [
        { tempId: 'c1', name: 'Kỹ năng Frontend', description: 'React/TS', weight: 40 },
        { tempId: 'c2', name: 'Tư duy logic', description: 'Problem Solving', weight: 35 },
        { tempId: 'c3', name: 'Làm việc nhóm', description: 'Teamwork', weight: 25 },
      ];

      const total = calculateTotalWeight(criteria);
      expect(total).toBe(100);
      expect(isWeightValid(total)).toBe(true);
    });

    it('xác định trạng thái không hợp lệ (Đỏ) khi tổng thiếu (< 100%)', () => {
      const criteria: CriterionFormData[] = [
        { tempId: 'c1', name: 'Tiêu chí 1', description: '', weight: 30 },
        { tempId: 'c2', name: 'Tiêu chí 2', description: '', weight: 45 },
      ];

      const total = calculateTotalWeight(criteria);
      expect(total).toBe(75);
      expect(isWeightValid(total)).toBe(false);

      const missing = 100 - total;
      expect(missing).toBe(25);
    });

    it('xác định trạng thái không hợp lệ (Đỏ) khi tổng vượt quá (> 100%)', () => {
      const criteria: CriterionFormData[] = [
        { tempId: 'c1', name: 'Tiêu chí 1', description: '', weight: 60 },
        { tempId: 'c2', name: 'Tiêu chí 2', description: '', weight: 55 },
      ];

      const total = calculateTotalWeight(criteria);
      expect(total).toBe(115);
      expect(isWeightValid(total)).toBe(false);

      const excess = total - 100;
      expect(excess).toBe(15);
    });

    it('xử lý chuỗi nhập liệu dở dang (string/empty) mà không làm crash hệ thống', () => {
      const criteria: CriterionFormData[] = [
        { tempId: 'c1', name: 'Tiêu chí 1', description: '', weight: '' },
        { tempId: 'c2', name: 'Tiêu chí 2', description: '', weight: '50' },
        { tempId: 'c3', name: 'Tiêu chí 3', description: '', weight: 'invalid' },
      ];

      const total = calculateTotalWeight(criteria);
      expect(total).toBe(50);
      expect(isWeightValid(total)).toBe(false);
    });
  });

  // AC3: UX/UI mượt mà với tính năng phân bổ đều 100%
  describe('AC3: Tính năng phân bổ đều 100% trọng số (Quick Action ⚡)', () => {
    it('phân bổ đều cho 2 tiêu chí đạt chính xác 100%', () => {
      const weights = distributeWeightsEqually(2);
      expect(weights).toEqual([50, 50]);
      expect(calculateTotalWeight(weights.map((w) => ({ weight: w })))).toBe(100);
    });

    it('phân bổ đều cho 3 tiêu chí đạt chính xác 100% không bị lệch thập phân', () => {
      const weights = distributeWeightsEqually(3);
      // 100 / 3 = 33.33, phần dư 0.01 được cộng vào tiêu chí đầu
      expect(weights).toEqual([33.34, 33.33, 33.33]);
      expect(calculateTotalWeight(weights.map((w) => ({ weight: w })))).toBe(100);
    });

    it('phân bổ đều cho 6 tiêu chí đạt chính xác 100%', () => {
      const weights = distributeWeightsEqually(6);
      expect(weights).toHaveLength(6);
      expect(calculateTotalWeight(weights.map((w) => ({ weight: w })))).toBe(100);
    });
  });
});
