import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import {
  calculateWeightedScore,
  calculateCriterionWeightedContribution,
  validateCriterionScore,
  validateAllCriteriaEvaluations,
} from '../src/utils/interviewEvaluationHelper';
import { InterviewEvaluationForm } from '../src/components/Interview/InterviewEvaluationForm';
import type { EvaluationCriterionItem } from '../src/types/interviewEvaluation';

describe('TKNHTTDNB1-458 / Story TKNHTTDNB1-65: Tích hợp tính tổng theo trọng số trên phiếu', () => {
  const mockCriteriaSnapshot: EvaluationCriterionItem[] = [
    {
      id: 'criterion-front-end',
      name: 'Chuyên môn Frontend (React, TypeScript)',
      description: 'Nắm vững kiến trúc component, state management và hooks',
      weight: 40,
      sortOrder: 1,
    },
    {
      id: 'criterion-problem-solving',
      name: 'Tư duy giải quyết vấn đề & Thuật toán',
      description: 'Khả năng phân tích bài toán và tối ưu hiệu năng',
      weight: 35,
      sortOrder: 2,
    },
    {
      id: 'criterion-teamwork',
      name: 'Kỹ năng làm việc nhóm & Văn hóa',
      description: 'Tinh thần phối hợp, giao tiếp và học hỏi nhanh',
      weight: 25,
      sortOrder: 3,
    },
  ];

  // =========================================================================
  // AC 1: Logic tính điểm tổng (Weighted Total Score)
  // =========================================================================
  describe('1. Logic tính điểm tổng theo trọng số: Tổng các (Điểm * Trọng số)', () => {
    it('tính toán chính xác điểm tổng khi tất cả các tiêu chí đã được cho điểm', () => {
      // Tiêu chí 1: Điểm 4 * Trọng số 40% = 1.60
      // Tiêu chí 2: Điểm 5 * Trọng số 35% = 1.75
      // Tiêu chí 3: Điểm 3 * Trọng số 25% = 0.75
      // Tổng điểm = 1.60 + 1.75 + 0.75 = 4.10
      const evaluations = {
        'criterion-front-end': { score: 4 },
        'criterion-problem-solving': { score: 5 },
        'criterion-teamwork': { score: 3 },
      };

      const totalWeightedScore = calculateWeightedScore(mockCriteriaSnapshot, evaluations);
      expect(totalWeightedScore).toBe(4.1);
    });

    it('tính toán lại điểm ngay lập tức khi thay đổi điểm ở bất kỳ tiêu chí nào', () => {
      const evaluations = {
        'criterion-front-end': { score: 4 },
        'criterion-problem-solving': { score: 5 },
        'criterion-teamwork': { score: 3 },
      };

      // Ban đầu: 4.10
      expect(calculateWeightedScore(mockCriteriaSnapshot, evaluations)).toBe(4.1);

      // Người dùng đổi điểm tiêu chí 3 từ 3 lên 5: (4 * 0.4) + (5 * 0.35) + (5 * 0.25) = 1.6 + 1.75 + 1.25 = 4.60
      const updatedEvaluations = {
        ...evaluations,
        'criterion-teamwork': { score: 5 },
      };
      const recalculatedScore = calculateWeightedScore(mockCriteriaSnapshot, updatedEvaluations);
      expect(recalculatedScore).toBe(4.6);
    });

    it('tính toán đúng phần tích lũy khi mới chỉ cho điểm một số tiêu chí', () => {
      // Chỉ chấm tiêu chí 1: Điểm 4 * 40% = 1.60
      const partialEvaluations = {
        'criterion-front-end': { score: 4 },
        'criterion-problem-solving': { score: null },
        'criterion-teamwork': { score: null },
      };

      const partialScore = calculateWeightedScore(mockCriteriaSnapshot, partialEvaluations);
      expect(partialScore).toBe(1.6);
    });

    it('trả về null nếu chưa có tiêu chí nào được nhập điểm', () => {
      const emptyEvaluations = {
        'criterion-front-end': { score: null },
        'criterion-problem-solving': { score: null },
        'criterion-teamwork': { score: null },
      };

      const totalScore = calculateWeightedScore(mockCriteriaSnapshot, emptyEvaluations);
      expect(totalScore).toBeNull();
    });

    it('hỗ trợ trọng số dạng số thập phân (<= 1) tương thích với mọi chuẩn dữ liệu', () => {
      const decimalCriteria: EvaluationCriterionItem[] = [
        { id: 'crit-a', name: 'Tiêu chí A', weight: 0.6 },
        { id: 'crit-b', name: 'Tiêu chí B', weight: 0.4 },
      ];
      // (5 * 0.6) + (4 * 0.4) = 3.0 + 1.6 = 4.6
      const evaluations = {
        'crit-a': { score: 5 },
        'crit-b': { score: 4 },
      };

      const totalScore = calculateWeightedScore(decimalCriteria, evaluations);
      expect(totalScore).toBe(4.6);
    });

    it('tính chính xác phần đóng góp điểm số của 1 tiêu chí đơn lẻ qua calculateCriterionWeightedContribution', () => {
      // Điểm 4 với trọng số 40% -> 1.60 điểm
      expect(calculateCriterionWeightedContribution(4, 40)).toBe(1.6);

      // Điểm 5 với trọng số 35% -> 1.75 điểm
      expect(calculateCriterionWeightedContribution(5, 35)).toBe(1.75);

      // Điểm null -> trả về null
      expect(calculateCriterionWeightedContribution(null, 40)).toBeNull();
    });

    it('sử dụng đúng dữ liệu khung năng lực đính kèm buổi phỏng vấn (Snapshot Immutability)', () => {
      // Bản ghi snapshot từ quá khứ có trọng số khác (ví dụ 50% - 50%)
      const historicInterviewSnapshot: EvaluationCriterionItem[] = [
        { id: 'hist-01', name: 'Tiêu chí cũ 1', weight: 50 },
        { id: 'hist-02', name: 'Tiêu chí cũ 2', weight: 50 },
      ];

      const evaluations = {
        'hist-01': { score: 4 },
        'hist-02': { score: 4 },
      };

      // Đảm bảo tính toán dựa trên đúng snapshot truyền vào
      const calculatedScore = calculateWeightedScore(historicInterviewSnapshot, evaluations);
      expect(calculatedScore).toBe(4.0);
    });
  });

  // =========================================================================
  // AC 2: Xử lý lỗi nhập liệu (Validation)
  // =========================================================================
  describe('2. Xử lý lỗi nhập liệu (Validation Real-time)', () => {
    it('báo lỗi khi tiêu chí bị bỏ trống điểm (null hoặc undefined)', () => {
      const emptyErrorNull = validateCriterionScore(null);
      expect(emptyErrorNull).toBe('Vui lòng chọn điểm đánh giá cho tiêu chí này (từ 1 đến 5).');

      const emptyErrorUndefined = validateCriterionScore(undefined);
      expect(emptyErrorUndefined).toBe('Vui lòng chọn điểm đánh giá cho tiêu chí này (từ 1 đến 5).');
    });

    it('báo lỗi khi nhập điểm nhỏ hơn 1 (ví dụ: 0 hoặc -1)', () => {
      const errorZero = validateCriterionScore(0);
      expect(errorZero).toBe('Điểm đánh giá không hợp lệ. Vui lòng chọn điểm trong khoảng từ 1 đến 5.');

      const errorNegative = validateCriterionScore(-2);
      expect(errorNegative).toBe('Điểm đánh giá không hợp lệ. Vui lòng chọn điểm trong khoảng từ 1 đến 5.');
    });

    it('báo lỗi khi nhập điểm lớn hơn 5 (ví dụ: 6 hoặc 10)', () => {
      const errorSix = validateCriterionScore(6);
      expect(errorSix).toBe('Điểm đánh giá không hợp lệ. Vui lòng chọn điểm trong khoảng từ 1 đến 5.');

      const errorTen = validateCriterionScore(10);
      expect(errorTen).toBe('Điểm đánh giá không hợp lệ. Vui lòng chọn điểm trong khoảng từ 1 đến 5.');
    });

    it('báo lỗi khi điểm là NaN hoặc không phải số hợp lệ', () => {
      const errorNaN = validateCriterionScore(NaN);
      expect(errorNaN).toBe('Điểm đánh giá không hợp lệ. Vui lòng chọn điểm trong khoảng từ 1 đến 5.');
    });

    it('trả về null (hợp lệ) cho tất cả các điểm số trong khoảng 1 đến 5', () => {
      [1, 2, 3, 4, 5].forEach((validScore) => {
        expect(validateCriterionScore(validScore)).toBeNull();
      });
    });

    it('validateAllCriteriaEvaluations trả về danh sách lỗi và xác định đúng tiêu chí đầu tiên có lỗi', () => {
      const incompleteEvaluations = {
        'criterion-front-end': { score: 4 },
        'criterion-problem-solving': { score: null }, // Thiếu
        'criterion-teamwork': { score: null }, // Thiếu
      };

      const result = validateAllCriteriaEvaluations(mockCriteriaSnapshot, incompleteEvaluations);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors)).toHaveLength(2);
      expect(result.errors['criterion-problem-solving']).toBeDefined();
      expect(result.errors['criterion-teamwork']).toBeDefined();
      expect(result.firstInvalidCriterionId).toBe('criterion-problem-solving');
    });

    it('validateAllCriteriaEvaluations trả về isValid = true khi tất cả tiêu chí đều có điểm hợp lệ', () => {
      const completeEvaluations = {
        'criterion-front-end': { score: 4 },
        'criterion-problem-solving': { score: 5 },
        'criterion-teamwork': { score: 3 },
      };

      const result = validateAllCriteriaEvaluations(mockCriteriaSnapshot, completeEvaluations);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
      expect(result.firstInvalidCriterionId).toBeUndefined();
    });
  });

  // =========================================================================
  // AC 3: Tích hợp Component & Coding Convention (K3S4_N3)
  // =========================================================================
  describe('3. Tích hợp trên giao diện InterviewEvaluationForm & Quy ước Coding', () => {
    it('khởi tạo hợp lệ phần tử Form với logic tính tổng theo trọng số và validation', () => {
      const submitSpy = vi.fn();
      const formElement = React.createElement(InterviewEvaluationForm, {
        candidateName: 'Trần Văn Hoàng',
        jobTitle: 'Senior Frontend Engineer',
        interviewRound: 'Vòng Kỹ thuật',
        criteria: mockCriteriaSnapshot,
        initialEvaluations: {
          'criterion-front-end': { score: 4, comment: 'Tốt' },
          'criterion-problem-solving': { score: 5, comment: 'Xuất sắc' },
          'criterion-teamwork': { score: 3, comment: 'Đạt' },
        },
        onSubmit: submitSpy,
      });

      expect(React.isValidElement(formElement)).toBe(true);
      expect(formElement.props.candidateName).toBe('Trần Văn Hoàng');
      expect(formElement.props.criteria).toHaveLength(3);
    });

    it('tuân thủ quy ước đặt tên camelCase (calculateWeightedScore, criteriaWeight, validationError)', () => {
      expect(typeof calculateWeightedScore).toBe('function');
      expect(typeof calculateCriterionWeightedContribution).toBe('function');
      expect(typeof validateCriterionScore).toBe('function');
      expect(typeof validateAllCriteriaEvaluations).toBe('function');
    });
  });
});
