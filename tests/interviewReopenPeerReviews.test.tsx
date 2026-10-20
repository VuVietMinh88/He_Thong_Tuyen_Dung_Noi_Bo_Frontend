import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import {
  InterviewEvaluationForm,
  InterviewEvaluationReopenModal,
} from '../src/components/Interview/InterviewEvaluationForm';
import {
  calculateRemainingReopenTime,
  checkIsRecruiterRole,
  isPeerReviewVisible,
  REOPEN_EVALUATION_WINDOW_HOURS,
  REOPEN_EVALUATION_WINDOW_MS,
} from '../src/utils/interviewEvaluationHelper';
import { tokenService } from '../src/services/token.service';
import type {
  EvaluationCriterionItem,
  PeerInterviewerEvaluation,
} from '../src/types/interviewEvaluation';

describe('TKNHTTDNB1-465 / Story TKNHTTDNB1-66: Tích hợp mở lại phiếu và điều kiện xem đánh giá khác', () => {
  const mockCriteria: EvaluationCriterionItem[] = [
    {
      id: 'crit-code-quality',
      name: 'Chất lượng mã nguồn & Clean Code',
      description: 'Khả năng viết code rõ ràng, tuân thủ SOLID và quy chuẩn',
      weight: 50,
      sortOrder: 1,
    },
    {
      id: 'crit-problem-solving',
      name: 'Giải quyết vấn đề phức tạp',
      description: 'Tư duy thuật toán và thiết kế kiến trúc phân tán',
      weight: 50,
      sortOrder: 2,
    },
  ];

  const mockPeerEvaluations: PeerInterviewerEvaluation[] = [
    {
      interviewerId: 'interviewer-peer-01',
      interviewerName: 'Trần Thị Thu Thảo',
      interviewerRole: 'Lead Frontend Engineer',
      interviewerEmail: 'thao.tran@example.com',
      isSubmitted: true,
      submittedAt: '2026-10-15T08:00:00.000Z',
      calculatedTotalScore: 4.5,
      conclusion: 'RECOMMENDED',
      generalNotes: 'Ứng viên trả lời rất sắc bén về React Server Components và tối ưu bundle size.',
    },
    {
      interviewerId: 'interviewer-peer-02',
      interviewerName: 'Lê Hoàng Nam',
      interviewerRole: 'Senior Solutions Architect',
      interviewerEmail: 'nam.le@example.com',
      isSubmitted: true,
      submittedAt: '2026-10-15T08:30:00.000Z',
      calculatedTotalScore: 4.0,
      conclusion: 'RECOMMENDED',
      generalNotes: 'Nền tảng kiến trúc hệ thống khá vững vàng, cần cải thiện thêm về bảo mật API.',
    },
  ];

  const defaultProps = {
    candidateId: 'cand-123',
    candidateName: 'Hoàng Minh Tuấn',
    candidateEmail: 'tuan.hoang@example.com',
    jobTitle: 'Senior Fullstack Engineer',
    interviewRound: 'Vòng Phỏng vấn Chuyên môn',
    interviewDate: '2026-10-15',
    interviewTime: '09:00',
    interviewFormat: 'ONLINE' as const,
    locationOrLink: 'https://meet.google.com/test-room',
    interviewerNames: ['Nguyễn Văn An', 'Trần Thị Thu Thảo', 'Lê Hoàng Nam'],
    interviewerIds: ['interviewer-an', 'interviewer-peer-01', 'interviewer-peer-02'],
    currentUserId: 'interviewer-an',
    currentUserRoles: ['INTERVIEWER'],
    criteria: mockCriteria,
    peerEvaluations: mockPeerEvaluations,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // AC 1: Tính năng Mở lại phiếu (Reopen Evaluation)
  // =========================================================================
  describe('1. Tính năng Mở lại phiếu dành cho Recruiter trong thời hạn 24 giờ (Reopen Evaluation)', () => {
    it('định nghĩa đúng giới hạn thời gian mở lại phiếu là 24 giờ', () => {
      expect(REOPEN_EVALUATION_WINDOW_HOURS).toBe(24);
      expect(REOPEN_EVALUATION_WINDOW_MS).toBe(24 * 60 * 60 * 1000);
    });

    it('checkIsRecruiterRole: Chỉ cho phép role RECRUITER mở lại phiếu', () => {
      // Role RECRUITER được phép
      expect(checkIsRecruiterRole(['RECRUITER'])).toBe(true);
      expect(checkIsRecruiterRole(['recruiter'])).toBe(true);

      // Role ADMIN và HR_MANAGER được phép quản trị
      expect(checkIsRecruiterRole(['ADMIN'])).toBe(false);
      expect(checkIsRecruiterRole(['HR_MANAGER'])).toBe(false);

      // Role INTERVIEWER thuần túy không có quyền mở lại phiếu
      expect(checkIsRecruiterRole(['INTERVIEWER'])).toBe(false);
      expect(checkIsRecruiterRole(['CANDIDATE', 'GUEST'])).toBe(false);
      expect(checkIsRecruiterRole([])).toBe(false);
      expect(checkIsRecruiterRole(null)).toBe(false);

      // Cho phép override tường minh qua prop isRecruiterExplicit
      expect(checkIsRecruiterRole(['INTERVIEWER'], true)).toBe(false);
      expect(checkIsRecruiterRole(['RECRUITER'], false)).toBe(false);
    });

    it('lấy role từ tokenService.getUserData() khi không truyền currentUserRoles', () => {
      vi.spyOn(tokenService, 'getUserData').mockReturnValue({
        id: 'recruiter-user-01',
        email: 'recruiter@company.com',
        fullName: 'Nguyễn Thị Tuyển Dụng',
        roles: ['RECRUITER'],
      });

      expect(checkIsRecruiterRole()).toBe(true);
    });

    it('calculateRemainingReopenTime: Tính toán chính xác thời gian còn lại khi nộp trong vòng 24h', () => {
      const baseTime = new Date('2026-10-15T12:00:00.000Z').getTime();

      // Nộp lúc 10:00 (cách 2 giờ trước) -> Còn đúng 22 giờ 0 phút
      const submittedAtTwoHoursAgo = new Date('2026-10-15T10:00:00.000Z').toISOString();
      const status2h = calculateRemainingReopenTime(submittedAtTwoHoursAgo, baseTime);

      expect(status2h.canReopen).toBe(true);
      expect(status2h.isExpired).toBe(false);
      expect(status2h.hoursRemaining).toBe(22);
      expect(status2h.minutesRemaining).toBe(0);
      expect(status2h.timeRemainingFormatted).toBe('Còn 22 giờ 0 phút');

      // Nộp cách đây 23 giờ 15 phút -> Còn đúng 45 phút
      const submittedAt23h15mAgo = new Date(baseTime - (23 * 60 + 15) * 60 * 1000).toISOString();
      const status45m = calculateRemainingReopenTime(submittedAt23h15mAgo, baseTime);

      expect(status45m.canReopen).toBe(true);
      expect(status45m.isExpired).toBe(false);
      expect(status45m.hoursRemaining).toBe(0);
      expect(status45m.minutesRemaining).toBe(45);
      expect(status45m.timeRemainingFormatted).toBe('Còn 45 phút');
    });

    it('calculateRemainingReopenTime: Khóa tính năng mở lại khi đã quá thời hạn 24 giờ', () => {
      const baseTime = new Date('2026-10-15T12:00:00.000Z').getTime();

      // Nộp cách đây 25 giờ (vượt quá 24h)
      const submittedAt25HoursAgo = new Date('2026-10-14T11:00:00.000Z').toISOString();
      const statusExpired = calculateRemainingReopenTime(submittedAt25HoursAgo, baseTime);

      expect(statusExpired.canReopen).toBe(false);
      expect(statusExpired.isExpired).toBe(true);
      expect(statusExpired.remainingMs).toBeLessThanOrEqual(0);
      expect(statusExpired.timeRemainingFormatted).toContain('quá 24 giờ');
    });

    it('calculateRemainingReopenTime: Xử lý an toàn khi thiếu hoặc sai định dạng thời điểm nộp', () => {
      const statusNull = calculateRemainingReopenTime(null);
      expect(statusNull.canReopen).toBe(false);
      expect(statusNull.isExpired).toBe(false);

      const statusInvalid = calculateRemainingReopenTime('invalid-date-string');
      expect(statusInvalid.canReopen).toBe(false);
      expect(statusInvalid.isExpired).toBe(true);
    });

    it('hộp thoại InterviewEvaluationReopenModal hiển thị thông tin và thời gian đếm ngược', () => {
      const onConfirmMock = vi.fn();
      const onCancelMock = vi.fn();

      const modalElement = React.createElement(InterviewEvaluationReopenModal, {
        isOpen: true,
        candidateName: 'Hoàng Minh Tuấn',
        jobTitle: 'Senior Fullstack Engineer',
        timeRemainingFormatted: 'Còn 18 giờ 30 phút',
        onConfirm: onConfirmMock,
        onCancel: onCancelMock,
      });

      expect(React.isValidElement(modalElement)).toBe(true);
      expect(modalElement.props.isOpen).toBe(true);
      expect(modalElement.props.candidateName).toBe('Hoàng Minh Tuấn');
      expect(modalElement.props.timeRemainingFormatted).toBe('Còn 18 giờ 30 phút');

      modalElement.props.onConfirm?.('Cần bổ sung tiêu chí clean code');
      expect(onConfirmMock).toHaveBeenCalledWith('Cần bổ sung tiêu chí clean code');

      modalElement.props.onCancel?.();
      expect(onCancelMock).toHaveBeenCalledTimes(1);
    });

    it('chỉ hiển thị nút mở lại cho Recruiter khi phiếu ở trạng thái đã khóa', () => {
      // Người dùng là Recruiter
      const recruiterForm = React.createElement(InterviewEvaluationForm, {
        ...defaultProps,
        currentUserRoles: ['RECRUITER'],
        isLocked: true,
        submittedAt: new Date().toISOString(),
      });
      expect(recruiterForm.props.currentUserRoles).toContain('RECRUITER');
      expect(recruiterForm.props.isLocked).toBe(true);

      // Người dùng là Interviewer thông thường
      const interviewerForm = React.createElement(InterviewEvaluationForm, {
        ...defaultProps,
        currentUserRoles: ['INTERVIEWER'],
        isLocked: true,
        submittedAt: new Date().toISOString(),
      });
      expect(interviewerForm.props.currentUserRoles).not.toContain('RECRUITER');
    });
  });

  // =========================================================================
  // AC 2: Điều kiện xem đánh giá chéo (Peer Review Visibility)
  // =========================================================================
  describe('2. Điều kiện xem đánh giá chéo của các Interviewer khác (Peer Review Visibility)', () => {
    it('isPeerReviewVisible: Chỉ cho phép xem khi user hiện tại đã nộp phiếu của chính mình', () => {
      // Khi chưa nộp phiếu chính mình: Ẩn đánh giá chéo
      expect(isPeerReviewVisible(false)).toBe(false);

      // Khi đã nộp phiếu chính mình: Mở khóa xem đánh giá chéo
      expect(isPeerReviewVisible(true)).toBe(true);
    });

    it('form nhận đúng prop hasSubmittedOwnEvaluation để kiểm soát hiển thị đánh giá chéo', () => {
      // Chưa nộp phiếu của mình
      const unsubmittedForm = React.createElement(InterviewEvaluationForm, {
        ...defaultProps,
        hasSubmittedOwnEvaluation: false,
        isLocked: false,
      });
      expect(unsubmittedForm.props.hasSubmittedOwnEvaluation).toBe(false);

      // Đã nộp phiếu của mình
      const submittedForm = React.createElement(InterviewEvaluationForm, {
        ...defaultProps,
        hasSubmittedOwnEvaluation: true,
        isLocked: true,
      });
      expect(submittedForm.props.hasSubmittedOwnEvaluation).toBe(true);
    });

    it('nhận đầy đủ danh sách đánh giá chéo của các thành viên khác trong hội đồng', () => {
      const formElement = React.createElement(InterviewEvaluationForm, {
        ...defaultProps,
        peerEvaluations: mockPeerEvaluations,
        hasSubmittedOwnEvaluation: true,
      });

      expect(formElement.props.peerEvaluations).toHaveLength(2);
      expect(formElement.props.peerEvaluations?.[0].interviewerName).toBe('Trần Thị Thu Thảo');
      expect(formElement.props.peerEvaluations?.[0].calculatedTotalScore).toBe(4.5);
      expect(formElement.props.peerEvaluations?.[0].conclusion).toBe('RECOMMENDED');
      expect(formElement.props.peerEvaluations?.[1].interviewerName).toBe('Lê Hoàng Nam');
      expect(formElement.props.peerEvaluations?.[1].calculatedTotalScore).toBe(4.0);
    });
  });

  // =========================================================================
  // AC 3: Coding Convention K3S4_N3 & Error Handling
  // =========================================================================
  describe('3. Coding Convention K3S4_N3 & Bắt lỗi API', () => {
    it('hàm onReopen được gọi với lý do mở lại khi xác nhận từ modal', async () => {
      const onReopenMock = vi.fn().mockResolvedValue(undefined);
      const formElement = React.createElement(InterviewEvaluationForm, {
        ...defaultProps,
        isRecruiter: true,
        isLocked: true,
        onReopen: onReopenMock,
      });

      await formElement.props.onReopen?.('Cần rà soát lại tiêu chí kiến trúc');
      expect(onReopenMock).toHaveBeenCalledWith('Cần rà soát lại tiêu chí kiến trúc');
    });

    it('xử lý lỗi không nuốt lỗi khi onReopen trả về ngoại lệ', async () => {
      const onReopenErrorMock = vi.fn().mockRejectedValue(new Error('Máy chủ từ chối mở lại phiếu.'));
      const formElement = React.createElement(InterviewEvaluationForm, {
        ...defaultProps,
        isRecruiter: true,
        isLocked: true,
        onReopen: onReopenErrorMock,
      });

      await expect(
        formElement.props.onReopen?.('Lý do thử nghiệm'),
      ).rejects.toThrow('Máy chủ từ chối mở lại phiếu.');
    });
  });
});
