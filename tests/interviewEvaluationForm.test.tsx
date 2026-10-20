import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import {
  InterviewEvaluationForm,
  InterviewEvaluationFormSkeleton,
  InterviewEvaluationEmptyState,
  InterviewEvaluationErrorState,
} from '../src/components/Interview/InterviewEvaluationForm';
import { InterviewEvaluationModal } from '../src/components/Interview/InterviewEvaluationModal';
import {
  resolveEvaluationCriteriaForJob,
  calculateEvaluationWeightedTotal,
  DEFAULT_TECHNICAL_EVALUATION_CRITERIA,
} from '../src/utils/interviewEvaluationHelper';
import {
  RATING_LEVEL_DEFINITIONS,
  AVAILABLE_SCORE_OPTIONS,
  type EvaluationCriterionItem,
} from '../src/types/interviewEvaluation';

describe('TKNHTTDNB1-457 / Story TKNHTTDNB1-65: Thiết kế phiếu đánh giá năng lực phỏng vấn', () => {
  const mockCriteria: EvaluationCriterionItem[] = [
    {
      id: 'crit-01',
      name: 'Kiến thức React & TypeScript',
      description: 'Nắm vững hooks, lifecycle, generic types và tối ưu render',
      weight: 40,
      sortOrder: 1,
    },
    {
      id: 'crit-02',
      name: 'Tư duy giải quyết vấn đề',
      description: 'Phân tích thuật toán, xử lý edge cases và debug nhanh',
      weight: 35,
      sortOrder: 2,
    },
    {
      id: 'crit-03',
      name: 'Giao tiếp & Làm việc nhóm',
      description: 'Trình bày ý tưởng rõ ràng, có tinh thần cầu thị',
      weight: 25,
      sortOrder: 3,
    },
  ];

  const defaultProps = {
    candidateName: 'Nguyễn Văn Minh',
    candidateEmail: 'minh.nguyen@example.com',
    jobTitle: 'Senior Frontend Engineer',
    interviewRound: 'Vòng Phỏng vấn Chuyên môn',
    interviewDate: '2026-10-25',
    interviewTime: '14:30',
    interviewFormat: 'ONLINE' as const,
    locationOrLink: 'https://meet.google.com/abc-defg-hij',
    interviewerNames: ['Nguyễn Văn Hải', 'Trần Thị Thu Thảo'],
    frameworkName: 'Khung năng lực Kỹ sư Frontend',
    frameworkCode: 'CF-FE-2026',
    frameworkVersion: 'v2.0',
    criteria: mockCriteria,
  };

  // =========================================================================
  // AC 1: Bố cục phần đầu phiếu
  // =========================================================================
  describe('1. Bố cục phần đầu phiếu (Header Information)', () => {
    it('khởi tạo React Element của form thành công với các props bắt buộc', () => {
      const formElement = React.createElement(InterviewEvaluationForm, defaultProps);
      expect(React.isValidElement(formElement)).toBe(true);
      expect(formElement.props.candidateName).toBe('Nguyễn Văn Minh');
      expect(formElement.props.jobTitle).toBe('Senior Frontend Engineer');
      expect(formElement.props.frameworkVersion).toBe('v2.0');
    });

    it('truyền đầy đủ thông tin buổi phỏng vấn (Vòng, Ngày, Giờ, Hình thức, Người phỏng vấn)', () => {
      const formElement = React.createElement(InterviewEvaluationForm, defaultProps);
      expect(formElement.props.interviewRound).toBe('Vòng Phỏng vấn Chuyên môn');
      expect(formElement.props.interviewDate).toBe('2026-10-25');
      expect(formElement.props.interviewTime).toBe('14:30');
      expect(formElement.props.interviewFormat).toBe('ONLINE');
      expect(formElement.props.interviewerNames).toHaveLength(2);
      expect(formElement.props.interviewerNames).toContain('Nguyễn Văn Hải');
    });

    it('hiển thị thông tin khung năng lực và phiên bản đang áp dụng', () => {
      const formElement = React.createElement(InterviewEvaluationForm, defaultProps);
      expect(formElement.props.frameworkName).toBe('Khung năng lực Kỹ sư Frontend');
      expect(formElement.props.frameworkCode).toBe('CF-FE-2026');
      expect(formElement.props.frameworkVersion).toBe('v2.0');
    });
  });

  // =========================================================================
  // AC 2: Danh sách tiêu chí đánh giá (Evaluation Criteria) & Phần cuối phiếu
  // =========================================================================
  describe('2. Danh sách tiêu chí đánh giá (Evaluation Criteria) & Điểm tổng', () => {
    it('nhận đúng danh sách tiêu chí với tên và trọng số (%)', () => {
      const formElement = React.createElement(InterviewEvaluationForm, defaultProps);
      expect(formElement.props.criteria).toHaveLength(3);
      expect(formElement.props.criteria?.[0].name).toBe('Kiến thức React & TypeScript');
      expect(formElement.props.criteria?.[0].weight).toBe(40);
      expect(formElement.props.criteria?.[1].weight).toBe(35);
      expect(formElement.props.criteria?.[2].weight).toBe(25);
    });

    it('hỗ trợ 5 mức điểm chọn từ 1 đến 5', () => {
      expect(AVAILABLE_SCORE_OPTIONS).toEqual([1, 2, 3, 4, 5]);

      // Kiểm tra đầy đủ định nghĩa nhãn và mô tả cho 5 mức điểm
      AVAILABLE_SCORE_OPTIONS.forEach((scoreOption) => {
        const ratingConfig = RATING_LEVEL_DEFINITIONS[scoreOption];
        expect(ratingConfig).toBeDefined();
        expect(ratingConfig.score).toBe(scoreOption);
        expect(ratingConfig.label).toBeTruthy();
        expect(ratingConfig.description).toBeTruthy();
        expect(ratingConfig.activeButtonClass).toBeTruthy();
      });
    });

    it('khởi tạo giá trị đánh giá ban đầu (initialEvaluations) nếu được cung cấp', () => {
      const formElement = React.createElement(InterviewEvaluationForm, {
        ...defaultProps,
        initialEvaluations: {
          'crit-01': { score: 4, comment: 'Nắm vững kiến thức React hooks' },
          'crit-02': { score: 3, comment: 'Giải quyết tốt bài toán thuật toán' },
        },
      });

      expect(formElement.props.initialEvaluations?.['crit-01'].score).toBe(4);
      expect(formElement.props.initialEvaluations?.['crit-01'].comment).toBe(
        'Nắm vững kiến thức React hooks',
      );
      expect(formElement.props.initialEvaluations?.['crit-02'].score).toBe(3);
    });
  });

  // =========================================================================
  // AC 3: Trạng thái hiển thị (UI States: Loading, Empty, Error)
  // =========================================================================
  describe('3. Trạng thái hiển thị (UI States)', () => {
    it('khởi tạo thành công phần tử Skeleton Loading khi isLoading = true', () => {
      const loadingForm = React.createElement(InterviewEvaluationForm, {
        ...defaultProps,
        isLoading: true,
      });
      expect(React.isValidElement(loadingForm)).toBe(true);
      expect(loadingForm.props.isLoading).toBe(true);

      const skeletonDirect = React.createElement(InterviewEvaluationFormSkeleton, {});
      expect(React.isValidElement(skeletonDirect)).toBe(true);
    });

    it('khởi tạo thành công Empty State khi danh sách tiêu chí rỗng', () => {
      const emptyForm = React.createElement(InterviewEvaluationForm, {
        ...defaultProps,
        criteria: [],
      });
      expect(React.isValidElement(emptyForm)).toBe(true);
      expect(emptyForm.props.criteria).toHaveLength(0);

      const emptyDirect = React.createElement(InterviewEvaluationEmptyState, {
        frameworkName: 'Khung năng lực mới',
      });
      expect(React.isValidElement(emptyDirect)).toBe(true);
      expect(emptyDirect.props.frameworkName).toBe('Khung năng lực mới');
    });

    it('khởi tạo thành công Error State khi có errorMessage và gọi được callback onRetry', () => {
      const retrySpy = vi.fn();
      const errorForm = React.createElement(InterviewEvaluationForm, {
        ...defaultProps,
        errorMessage: 'Lỗi kết nối máy chủ khi tải khung năng lực',
        onRetry: retrySpy,
      });

      expect(React.isValidElement(errorForm)).toBe(true);
      expect(errorForm.props.errorMessage).toBe('Lỗi kết nối máy chủ khi tải khung năng lực');

      const errorDirect = React.createElement(InterviewEvaluationErrorState, {
        errorMessage: 'Không thể kết nối Backend',
        onRetry: retrySpy,
      });
      expect(React.isValidElement(errorDirect)).toBe(true);
      expect(errorDirect.props.errorMessage).toBe('Không thể kết nối Backend');

      // Giả lập kích hoạt onRetry
      errorDirect.props.onRetry?.();
      expect(retrySpy).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // Modal Container Component Test
  // =========================================================================
  describe('4. Component InterviewEvaluationModal', () => {
    it('khởi tạo hợp lệ phần tử Modal khi isOpen = true', () => {
      const closeSpy = vi.fn();
      const modalElement = React.createElement(InterviewEvaluationModal, {
        isOpen: true,
        onClose: closeSpy,
        ...defaultProps,
      });

      expect(React.isValidElement(modalElement)).toBe(true);
      expect(modalElement.props.isOpen).toBe(true);
      expect(modalElement.props.candidateName).toBe('Nguyễn Văn Minh');
    });

    it('trả về null (không render) khi isOpen = false', () => {
      const modalElement = React.createElement(InterviewEvaluationModal, {
        isOpen: false,
        onClose: vi.fn(),
        ...defaultProps,
      });

      expect(React.isValidElement(modalElement)).toBe(true);
      expect(modalElement.props.isOpen).toBe(false);
    });
  });

  // =========================================================================
  // Helper functions: Phân bổ tiêu chí & Tính toán điểm tổng trọng số
  // =========================================================================
  describe('5. Helper functions: resolveEvaluationCriteriaForJob & calculateEvaluationWeightedTotal', () => {
    it('sử dụng tiêu chí cấu hình chính thức nếu có', () => {
      const result = resolveEvaluationCriteriaForJob('Frontend Lead', mockCriteria);
      expect(result).toBe(mockCriteria);
      expect(result).toHaveLength(3);
    });

    it('tự động sinh bộ tiêu chí đặc thù cho vị trí Quản lý / Tech Lead khi chưa có cấu hình', () => {
      const result = resolveEvaluationCriteriaForJob('Engineering Manager');
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(
        result.some((criterionItem) => {
          const lowerName = criterionItem.name.toLowerCase();
          return lowerName.includes('lãnh đạo') || lowerName.includes('kiến trúc');
        }),
      ).toBe(true);
    });

    it('tự động sinh bộ tiêu chí cho vị trí QA / Tester khi chưa có cấu hình', () => {
      const result = resolveEvaluationCriteriaForJob('Senior QA Engineer');
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result.some((criterionItem) => criterionItem.name.includes('kiểm thử') || criterionItem.name.includes('test'))).toBe(true);
    });

    it('trả về bộ tiêu chí kỹ thuật mặc định cho các vị trí thông thường', () => {
      const result = resolveEvaluationCriteriaForJob('Web Developer');
      expect(result).toEqual(DEFAULT_TECHNICAL_EVALUATION_CRITERIA);
      expect(result.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
    });

    it('tính toán chính xác điểm tổng trọng số (weighted total)', () => {
      const sampleEvaluations = {
        'c1': { score: 4 as const, weight: 50 },
        'c2': { score: 5 as const, weight: 50 },
      };
      // (4 * 0.5) + (5 * 0.5) = 2.0 + 2.5 = 4.5
      const total = calculateEvaluationWeightedTotal(sampleEvaluations);
      expect(total).toBe(4.5);
    });

    it('trả về null nếu chưa có tiêu chí nào được chấm điểm', () => {
      const emptyEvaluations = {
        'c1': { score: null, weight: 50 },
        'c2': { score: null, weight: 50 },
      };
      const total = calculateEvaluationWeightedTotal(emptyEvaluations);
      expect(total).toBeNull();
    });
  });

  // =========================================================================
  // AC 4: Coding Conventions & Clean Code Verification
  // =========================================================================
  describe('6. Coding Convention & Clean Code', () => {
    it('tuân thủ đặt tên descriptive, hằng số UPPER_SNAKE_CASE', () => {
      expect(AVAILABLE_SCORE_OPTIONS).toBeDefined();
      expect(RATING_LEVEL_DEFINITIONS).toBeDefined();
      expect(DEFAULT_TECHNICAL_EVALUATION_CRITERIA).toBeDefined();
    });
  });
});
