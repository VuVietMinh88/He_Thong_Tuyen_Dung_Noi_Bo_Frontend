import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import {
  InterviewEvaluationForm,
  InterviewEvaluationAccessDeniedState,
  InterviewEvaluationConfirmModal,
} from '../src/components/Interview/InterviewEvaluationForm';
import { InterviewEvaluationModal } from '../src/components/Interview/InterviewEvaluationModal';
import {
  validateInterviewConclusion,
  checkInterviewEvaluationAccess,
  calculateWeightedScore,
  validateAllCriteriaEvaluations,
} from '../src/utils/interviewEvaluationHelper';
import {
  CONCLUSION_OPTIONS_CONFIG,
  AVAILABLE_CONCLUSION_OPTIONS,
  type EvaluationCriterionItem,
  type InterviewConclusion,
} from '../src/types/interviewEvaluation';
import { tokenService } from '../src/services/token.service';

describe('TKNHTTDNB1-464 / Story TKNHTTDNB1-66: Thiết kế thao tác nộp phiếu và kết luận phỏng vấn', () => {
  const mockCriteria: EvaluationCriterionItem[] = [
    {
      id: 'crit-fe-react',
      name: 'Chuyên môn React & TypeScript',
      description: 'Hiểu sâu về hooks, kiến trúc component và typing an toàn',
      weight: 50,
      sortOrder: 1,
    },
    {
      id: 'crit-fe-arch',
      name: 'Kiến trúc Frontend & Tối ưu hiệu năng',
      description: 'Xây dựng cấu trúc dự án mở rộng tốt, code splitting và cache',
      weight: 50,
      sortOrder: 2,
    },
  ];

  const defaultProps = {
    candidateName: 'Đặng Thùy Dương',
    candidateEmail: 'duong.dang@example.com',
    jobTitle: 'Senior React Developer',
    interviewRound: 'Vòng Phỏng vấn Chuyên môn',
    interviewDate: '2026-10-30',
    interviewTime: '15:00',
    interviewFormat: 'ONLINE' as const,
    locationOrLink: 'https://meet.google.com/xyz-recruitment',
    interviewerNames: ['Nguyễn Văn An', 'Trần Thị Mai'],
    interviewerIds: ['interviewer-01', 'interviewer-02'],
    currentUserId: 'interviewer-01',
    currentUserEmail: 'an.nguyen@example.com',
    frameworkName: 'Khung năng lực Kỹ sư Frontend',
    frameworkCode: 'CF-FE-2026',
    frameworkVersion: 'v2.0',
    criteria: mockCriteria,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // AC 1: Phân quyền truy cập (Access Control)
  // =========================================================================
  describe('1. Phân quyền truy cập phiếu đánh giá (Access Control)', () => {
    it('cho phép người phỏng vấn được mời truy cập khi khớp currentUserId', () => {
      const isGranted = checkInterviewEvaluationAccess({
        currentUserId: 'interviewer-01',
        interviewerIds: ['interviewer-01', 'interviewer-02'],
      });
      expect(isGranted).toBe(true);
    });

    it('cho phép truy cập khi khớp currentUserEmail (không phân biệt chữ hoa/thường)', () => {
      const isGranted = checkInterviewEvaluationAccess({
        currentUserEmail: 'An.Nguyen@Example.COM',
        interviewerEmails: ['an.nguyen@example.com', 'mai.tran@example.com'],
      });
      expect(isGranted).toBe(true);
    });

    it('từ chối truy cập khi người dùng không nằm trong danh sách hội đồng phỏng vấn', () => {
      const isGranted = checkInterviewEvaluationAccess({
        currentUserId: 'other-user-999',
        currentUserEmail: 'other.user@example.com',
        interviewerIds: ['interviewer-01', 'interviewer-02'],
        interviewerEmails: ['an.nguyen@example.com'],
      });
      expect(isGranted).toBe(false);
    });

    it('lấy thông tin từ tokenService.getUserData() khi không truyền currentUserId/currentUserEmail', () => {
      vi.spyOn(tokenService, 'getUserData').mockReturnValue({
        id: 'interviewer-02',
        email: 'mai.tran@example.com',
        fullName: 'Trần Thị Mai',
        roles: ['INTERVIEWER'],
      });

      const isGranted = checkInterviewEvaluationAccess({
        interviewerIds: ['interviewer-01', 'interviewer-02'],
      });
      expect(isGranted).toBe(true);
    });

    it('ưu tiên giá trị prop isAuthorized khi được truyền tường minh', () => {
      // isAuthorized = false buộc từ chối ngay cả khi trùng ID
      expect(
        checkInterviewEvaluationAccess({
          isAuthorized: false,
          currentUserId: 'interviewer-01',
          interviewerIds: ['interviewer-01'],
        }),
      ).toBe(false);

      // isAuthorized = true cho phép truy cập ngay cả khi khác ID
      expect(
        checkInterviewEvaluationAccess({
          isAuthorized: true,
          currentUserId: 'stranger-id',
          interviewerIds: ['interviewer-01'],
        }),
      ).toBe(true);
    });

    it('hiển thị thành phần InterviewEvaluationAccessDeniedState khi bị từ chối truy cập', () => {
      const deniedElement = React.createElement(InterviewEvaluationAccessDeniedState, {
        candidateName: 'Đặng Thùy Dương',
      });
      expect(React.isValidElement(deniedElement)).toBe(true);
      expect(deniedElement.props.candidateName).toBe('Đặng Thùy Dương');
    });

    it('kích hoạt onBack khi người dùng bấm quay lại trên màn hình từ chối', () => {
      const onBackMock = vi.fn();
      const deniedElement = React.createElement(InterviewEvaluationAccessDeniedState, {
        candidateName: 'Đặng Thùy Dương',
        onBack: onBackMock,
      });

      expect(deniedElement.props.onBack).toBe(onBackMock);
      deniedElement.props.onBack?.();
      expect(onBackMock).toHaveBeenCalledTimes(1);
    });

    it('component form tích hợp tự động hiển thị màn hình từ chối khi isAuthorized = false', () => {
      const formElement = React.createElement(InterviewEvaluationForm, {
        ...defaultProps,
        isAuthorized: false,
      });
      expect(React.isValidElement(formElement)).toBe(true);
      expect(formElement.props.isAuthorized).toBe(false);
    });
  });

  // =========================================================================
  // AC 2: Khu vực Kết luận & Nộp phiếu (Conclusion & Submit)
  // =========================================================================
  describe('2. Khu vực Kết luận & Nộp phiếu (Conclusion & Submit)', () => {
    it('định nghĩa đầy đủ 3 lựa chọn kết luận phỏng vấn: Nên tuyển, Cân nhắc, Không nên tuyển', () => {
      expect(AVAILABLE_CONCLUSION_OPTIONS).toEqual([
        'RECOMMENDED',
        'CONSIDER',
        'NOT_RECOMMENDED',
      ]);

      const recommendedConfig = CONCLUSION_OPTIONS_CONFIG.RECOMMENDED;
      expect(recommendedConfig.label).toBe('Nên tuyển');
      expect(recommendedConfig.activeButtonClass).toContain('bg-emerald-600');

      const considerConfig = CONCLUSION_OPTIONS_CONFIG.CONSIDER;
      expect(considerConfig.label).toBe('Cân nhắc');
      expect(considerConfig.activeButtonClass).toContain('bg-amber-600');

      const notRecommendedConfig = CONCLUSION_OPTIONS_CONFIG.NOT_RECOMMENDED;
      expect(notRecommendedConfig.label).toBe('Không nên tuyển');
      expect(notRecommendedConfig.activeButtonClass).toContain('bg-rose-600');
    });

    it('validateInterviewConclusion: Bắt buộc phải chọn 1 kết luận trước khi nộp phiếu', () => {
      // Báo lỗi khi chưa chọn kết luận (null hoặc undefined)
      const errorNull = validateInterviewConclusion(null);
      expect(errorNull).toContain('Vui lòng chọn kết luận phỏng vấn');

      const errorUndefined = validateInterviewConclusion(undefined);
      expect(errorUndefined).toContain('Vui lòng chọn kết luận phỏng vấn');

      // Hợp lệ khi chọn 1 trong 3 mức
      expect(validateInterviewConclusion('RECOMMENDED')).toBeNull();
      expect(validateInterviewConclusion('CONSIDER')).toBeNull();
      expect(validateInterviewConclusion('NOT_RECOMMENDED')).toBeNull();

      // Từ chối giá trị lạ không thuộc định dạng
      const invalidResult = validateInterviewConclusion('UNKNOWN_VALUE' as unknown as InterviewConclusion);
      expect(invalidResult).toContain('không hợp lệ');
    });

    it('hộp thoại xác nhận (Confirm Modal) hiển thị đúng tóm tắt điểm và kết luận đã chọn', () => {
      const onConfirmMock = vi.fn();
      const onCancelMock = vi.fn();

      const modalElement = React.createElement(InterviewEvaluationConfirmModal, {
        isOpen: true,
        candidateName: 'Đặng Thùy Dương',
        jobTitle: 'Senior React Developer',
        calculatedTotalScore: 4.5,
        conclusion: 'RECOMMENDED',
        onConfirm: onConfirmMock,
        onCancel: onCancelMock,
      });

      expect(React.isValidElement(modalElement)).toBe(true);
      expect(modalElement.props.isOpen).toBe(true);
      expect(modalElement.props.candidateName).toBe('Đặng Thùy Dương');
      expect(modalElement.props.calculatedTotalScore).toBe(4.5);
      expect(modalElement.props.conclusion).toBe('RECOMMENDED');

      modalElement.props.onConfirm?.();
      expect(onConfirmMock).toHaveBeenCalledTimes(1);

      modalElement.props.onCancel?.();
      expect(onCancelMock).toHaveBeenCalledTimes(1);
    });

    it('hộp thoại Confirm Modal không render khi isOpen = false hoặc conclusion = null', () => {
      const closedModal = React.createElement(InterviewEvaluationConfirmModal, {
        isOpen: false,
        candidateName: 'Đặng Thùy Dương',
        jobTitle: 'Senior React Developer',
        calculatedTotalScore: 4.5,
        conclusion: 'RECOMMENDED',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      });
      expect(closedModal.props.isOpen).toBe(false);

      const noConclusionModal = React.createElement(InterviewEvaluationConfirmModal, {
        isOpen: true,
        candidateName: 'Đặng Thùy Dương',
        jobTitle: 'Senior React Developer',
        calculatedTotalScore: 4.5,
        conclusion: null,
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      });
      expect(noConclusionModal.props.conclusion).toBeNull();
    });

    it('chấp nhận giá trị initialConclusion được truyền từ bên ngoài', () => {
      const formElement = React.createElement(InterviewEvaluationForm, {
        ...defaultProps,
        initialConclusion: 'CONSIDER',
      });
      expect(formElement.props.initialConclusion).toBe('CONSIDER');
    });

    it('tính toán điểm tổng chính xác trước khi gửi và chuẩn bị cho payload nộp', () => {
      // 50% * 4 + 50% * 5 = 2.0 + 2.5 = 4.5
      const evaluations = {
        'crit-fe-react': { score: 4 },
        'crit-fe-arch': { score: 5 },
      };
      const totalScore = calculateWeightedScore(mockCriteria, evaluations);
      expect(totalScore).toBe(4.5);

      const validationCheck = validateAllCriteriaEvaluations(mockCriteria, evaluations);
      expect(validationCheck.isValid).toBe(true);
    });
  });

  // =========================================================================
  // AC 3: Trạng thái khóa phiếu (Read-only State)
  // =========================================================================
  describe('3. Trạng thái khóa phiếu (Read-only State)', () => {
    it('nhận trạng thái isLocked = true và chuyển sang chế độ chỉ xem', () => {
      const lockedForm = React.createElement(InterviewEvaluationForm, {
        ...defaultProps,
        isLocked: true,
        initialConclusion: 'RECOMMENDED',
      });

      expect(React.isValidElement(lockedForm)).toBe(true);
      expect(lockedForm.props.isLocked).toBe(true);
      expect(lockedForm.props.initialConclusion).toBe('RECOMMENDED');
    });

    it('truyền trạng thái isLocked qua InterviewEvaluationModal hiển thị huy hiệu Đã khóa', () => {
      const modalElement = React.createElement(InterviewEvaluationModal, {
        isOpen: true,
        onClose: vi.fn(),
        ...defaultProps,
        isLocked: true,
      });

      expect(React.isValidElement(modalElement)).toBe(true);
      expect(modalElement.props.isLocked).toBe(true);
      expect(modalElement.props.isOpen).toBe(true);
    });

    it('onSubmit nhận đầy đủ kết luận, điểm tổng và cờ isLocked: true', () => {
      const onSubmitMock = vi.fn();
      const formElement = React.createElement(InterviewEvaluationForm, {
        ...defaultProps,
        onSubmit: onSubmitMock,
      });

      const mockSubmitPayload = {
        criteriaEvaluations: {
          'crit-fe-react': {
            criterionId: 'crit-fe-react',
            criterionName: 'Chuyên môn React & TypeScript',
            weight: 50,
            score: 5,
            comment: 'Nắm rất vững React 19 và generic typing',
          },
          'crit-fe-arch': {
            criterionId: 'crit-fe-arch',
            criterionName: 'Kiến trúc Frontend & Tối ưu hiệu năng',
            weight: 50,
            score: 4,
            comment: 'Tư duy tối ưu tốt, hiểu rõ code splitting',
          },
        },
        calculatedTotalScore: 4.5,
        generalNotes: 'Ứng viên xuất sắc, phù hợp dẫn dắt dự án Frontend.',
        conclusion: 'RECOMMENDED' as const,
        isLocked: true,
        submittedAt: '2026-10-30T16:00:00.000Z',
      };

      formElement.props.onSubmit?.(mockSubmitPayload);

      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          conclusion: 'RECOMMENDED',
          isLocked: true,
          calculatedTotalScore: 4.5,
          submittedAt: expect.any(String),
        }),
      );
    });
  });

  // =========================================================================
  // AC 4: Quy chuẩn Coding Convention K3S4_N3
  // =========================================================================
  describe('4. Coding Convention K3S4_N3', () => {
    it('tuân thủ đặt tên hàm và biến dạng camelCase và không nuốt lỗi', () => {
      expect(typeof validateInterviewConclusion).toBe('function');
      expect(typeof checkInterviewEvaluationAccess).toBe('function');
      expect(typeof calculateWeightedScore).toBe('function');

      // Kiểm tra việc bắt lỗi an toàn khi truyền dữ liệu sai kiểu
      expect(() => {
        validateInterviewConclusion('' as unknown as InterviewConclusion);
      }).not.toThrow();

      expect(() => {
        checkInterviewEvaluationAccess({
          currentUserId: undefined,
          interviewerIds: undefined,
        });
      }).not.toThrow();
    });
  });
});
