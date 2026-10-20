import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FinalHiringDecisionModal } from '../src/components/Candidate/Decision/FinalHiringDecisionModal';
import { ToastProvider } from '../src/components/notifications/ToastProvider';
import {
  STANDARDIZED_REJECTION_REASONS,
  type FinalHiringDecisionRecord,
} from '../src/types/candidateEvaluationSummary';
import {
  validateFinalHiringDecision,
  formatCurrencyVND,
} from '../src/utils/candidateEvaluationSummaryHelper';
import { candidateEvaluationSummaryService } from '../src/services/candidateEvaluationSummaryService';
import axiosClient from '../src/utils/axiosClient';

describe('Jira Task TKNHTTDNB1-486: Tích hợp quyết định offer hoặc từ chối có lý do (User Story S7-02)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockCandidateProps = {
    isOpen: true,
    candidateId: 'cand-final-001',
    candidateName: 'Nguyễn Văn An',
    candidateCode: 'CAN-2026-0891',
    jobTitle: 'Senior Frontend Developer (React, TypeScript)',
    expectedSalary: 35000000,
    expectedSalaryFormatted: '35.000.000 ₫',
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  describe('AC 1: Modal Ra quyết định tuyển dụng & Lựa chọn hành động', () => {
    it('render modal với đầy đủ tiêu đề, thông tin ứng viên và các tabs lựa chọn quyết định', () => {
      const html = renderToString(
        <ToastProvider>
          <FinalHiringDecisionModal {...mockCandidateProps} initialDecisionType="OFFER" />
        </ToastProvider>
      );

      // Tiêu đề & Thông tin ứng viên
      expect(html).toContain('Xác nhận quyết định tuyển dụng cuối cùng');
      expect(html).toContain('Nguyễn Văn An');
      expect(html).toContain('CAN-2026-0891');
      expect(html).toContain('Senior Frontend Developer (React, TypeScript)');

      // Các tab lựa chọn quyết định (AC 1)
      expect(html).toContain('data-testid="tab-decision-offer"');
      expect(html).toContain('Chấp thuận (Make Offer)');
      expect(html).toContain('data-testid="tab-decision-reject"');
      expect(html).toContain('Từ chối (Reject)');
      expect(html).toContain('data-testid="tab-decision-talent-pool"');
      expect(html).toContain('Kho tiềm năng');
    });

    it('không render gì khi isOpen là false', () => {
      const html = renderToString(
        <ToastProvider>
          <FinalHiringDecisionModal {...mockCandidateProps} isOpen={false} />
        </ToastProvider>
      );
      expect(html).not.toContain('data-testid="final-hiring-decision-modal"');
      expect(html).not.toContain('Xác nhận quyết định tuyển dụng cuối cùng');
    });
  });

  describe('AC 2: Trường hợp Chấp thuận (Make Offer)', () => {
    it('hiển thị đầy đủ các trường nhập mức lương, ngày gia nhập, hạn chót và checkbox gửi thư mời offer', () => {
      const html = renderToString(
        <ToastProvider>
          <FinalHiringDecisionModal {...mockCandidateProps} initialDecisionType="OFFER" />
        </ToastProvider>
      );

      // Section Offer
      expect(html).toContain('data-testid="form-offer-section"');

      // Mức lương đề xuất (Offer Salary)
      expect(html).toContain('data-testid="input-offered-salary"');
      expect(html).toContain('Mức lương đề xuất chính thức (VNĐ/tháng)');
      expect(html).toContain(formatCurrencyVND(35000000));

      // Ngày dự kiến gia nhập (Onboarding Date)
      expect(html).toContain('data-testid="input-start-date"');
      expect(html).toContain('Ngày dự kiến gia nhập (Onboarding)');

      // Hạn chót phản hồi offer
      expect(html).toContain('data-testid="input-response-deadline"');
      expect(html).toContain('Hạn chót phản hồi offer');

      // Thời gian thử việc
      expect(html).toContain('data-testid="select-probation-months"');
      expect(html).toContain('2 tháng thử việc');

      // Checkbox gửi Offer Letter qua email
      expect(html).toContain('data-testid="checkbox-send-offer-email"');
      expect(html).toContain('Chuẩn bị gửi thư mời nhận việc (Offer Letter) qua email');

      // Nút xác nhận
      expect(html).toContain('data-testid="btn-confirm-final-decision"');
      expect(html).toContain('Xác nhận gửi Offer');
    });
  });

  describe('AC 3: Trường hợp Từ chối (Reject) - Bắt buộc lý do', () => {
    it('hiển thị danh mục lý do chuẩn hóa, checkbox gửi email từ chối và ô ghi chú phản hồi nội bộ', () => {
      const html = renderToString(
        <ToastProvider>
          <FinalHiringDecisionModal {...mockCandidateProps} initialDecisionType="REJECT" />
        </ToastProvider>
      );

      // Section Reject
      expect(html).toContain('data-testid="form-reject-section"');

      // Dropdown lý do từ chối chính
      expect(html).toContain('data-testid="select-rejection-reason"');
      expect(html).toContain('Lý do từ chối chính *');

      // Kiểm tra đầy đủ 7 lý do chuẩn hóa theo danh mục (chú ý escape HTML &amp; và &gt;)
      STANDARDIZED_REJECTION_REASONS.forEach((reason) => {
        const escaped = reason.replace(/&/g, '&amp;').replace(/>/g, '&gt;');
        expect(html).toContain(escaped);
      });

      // Checkbox gửi thư từ chối cảm ơn lịch sự
      expect(html).toContain('data-testid="checkbox-send-rejection-email"');
      expect(html).toContain('Gửi thư từ chối cảm ơn (Rejection Email) lịch sự đến ứng viên');

      // Ô textarea nhập ghi chú phản hồi nội bộ
      expect(html).toContain('data-testid="textarea-decision-notes"');
      expect(html).toContain('Ghi chú chi tiết phản hồi nội bộ');

      // Nút xác nhận từ chối
      expect(html).toContain('data-testid="btn-confirm-final-decision"');
      expect(html).toContain('Xác nhận Từ chối');
    });
  });

  describe('AC 4: Validation Logic cho quyết định tuyển dụng', () => {
    it('validate quyết định OFFER: bắt buộc lương dương, ngày gia nhập và hạn chót phản hồi hợp lệ', () => {
      // Trường hợp hợp lệ
      const validOffer = validateFinalHiringDecision('OFFER', {
        offeredSalary: 38000000,
        startDate: '2026-11-01',
        responseDeadline: '2026-10-25',
      });
      expect(validOffer.isValid).toBe(true);
      expect(Object.keys(validOffer.errors).length).toBe(0);

      // Lương không hợp lệ (<= 0)
      const invalidSalary = validateFinalHiringDecision('OFFER', {
        offeredSalary: 0,
        startDate: '2026-11-01',
        responseDeadline: '2026-10-25',
      });
      expect(invalidSalary.isValid).toBe(false);
      expect(invalidSalary.errors.offeredSalary).toContain('mức lương đề xuất hợp lệ');

      // Thiếu ngày bắt đầu
      const missingStartDate = validateFinalHiringDecision('OFFER', {
        offeredSalary: 30000000,
        startDate: '',
        responseDeadline: '2026-10-25',
      });
      expect(missingStartDate.isValid).toBe(false);
      expect(missingStartDate.errors.startDate).toContain('chọn ngày dự kiến gia nhập');

      // Thiếu hạn chót phản hồi
      const missingDeadline = validateFinalHiringDecision('OFFER', {
        offeredSalary: 30000000,
        startDate: '2026-11-01',
        responseDeadline: '',
      });
      expect(missingDeadline.isValid).toBe(false);
      expect(missingDeadline.errors.responseDeadline).toContain('chọn hạn chót phản hồi');

      // Hạn chót phản hồi sau ngày bắt đầu gia nhập
      const deadlineAfterStart = validateFinalHiringDecision('OFFER', {
        offeredSalary: 30000000,
        startDate: '2026-11-01',
        responseDeadline: '2026-11-15',
      });
      expect(deadlineAfterStart.isValid).toBe(false);
      expect(deadlineAfterStart.errors.responseDeadline).toContain(
        'phải trước hoặc cùng ngày gia nhập'
      );
    });

    it('validate quyết định REJECT: bắt buộc có lý do từ chối; nếu chọn "Lý do khác" thì bắt buộc nhập ghi chú', () => {
      // Hợp lệ với lý do chuẩn hóa
      const validReject = validateFinalHiringDecision('REJECT', {
        rejectionReason: 'Chưa đáp ứng chuyên môn kỹ thuật',
        notes: '',
      });
      expect(validReject.isValid).toBe(true);

      // Thiếu lý do từ chối
      const missingReason = validateFinalHiringDecision('REJECT', {
        rejectionReason: '',
      });
      expect(missingReason.isValid).toBe(false);
      expect(missingReason.errors.rejectionReason).toContain('Bắt buộc chọn lý do từ chối');

      // Chọn "Lý do khác" nhưng bỏ trống ô ghi chú
      const otherWithoutNotes = validateFinalHiringDecision('REJECT', {
        rejectionReason: 'Lý do khác',
        notes: '',
      });
      expect(otherWithoutNotes.isValid).toBe(false);
      expect(otherWithoutNotes.errors.notes).toContain(
        'Vui lòng nhập chi tiết lý do từ chối'
      );

      // Chọn "Lý do khác" và đã nhập ghi chú đầy đủ
      const otherWithNotes = validateFinalHiringDecision('REJECT', {
        rejectionReason: 'Lý do khác',
        notes: 'Dự án đã tạm hoãn kế hoạch phát triển module mới',
      });
      expect(otherWithNotes.isValid).toBe(true);
    });
  });

  describe('AC 4: Tích hợp API updateCandidateDecision', () => {
    it('gọi API updateCandidateDecision khi gửi đề xuất Make Offer', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: {
          code: 200,
          success: true,
          data: {
            id: 'cand-final-001',
            status: 'OFFERED',
            hiringDecision: {
              status: 'OFFER',
              offeredSalary: 40000000,
              offeredSalaryFormatted: '40.000.000 ₫',
              startDate: '2026-11-15',
              responseDeadline: '2026-11-05',
              probationMonths: 2,
              sendOfferEmail: true,
              decidedAt: '2026-10-15T18:00:00Z',
              decidedBy: 'Hội đồng Tuyển dụng',
            },
          },
        },
      });

      const payload: FinalHiringDecisionRecord = {
        status: 'OFFER',
        offeredSalary: 40000000,
        offeredSalaryFormatted: '40.000.000 ₫',
        startDate: '2026-11-15',
        responseDeadline: '2026-11-05',
        probationMonths: 2,
        sendOfferEmail: true,
        decidedAt: '2026-10-15T18:00:00Z',
        decidedBy: 'Hội đồng Tuyển dụng',
      };

      const result = await candidateEvaluationSummaryService.updateCandidateDecision(
        'cand-final-001',
        payload
      );

      expect(postSpy).toHaveBeenCalledWith('/recruitment/candidates/cand-final-001/decision', payload);
      expect(result.hiringDecision.status).toBe('OFFER');
      expect(result.hiringDecision.offeredSalary).toBe(40000000);
      expect(result.hiringDecision.sendOfferEmail).toBe(true);
    });

    it('gọi API updateCandidateDecision khi từ chối hồ sơ kèm lý do chuẩn hóa', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: {
          code: 200,
          success: true,
          data: {
            id: 'cand-final-001',
            status: 'REJECTED',
            hiringDecision: {
              status: 'REJECT',
              rejectionReason: 'Kỳ vọng lương quá cao so với khung ngân sách',
              rejectionEmailSent: true,
              notes: 'Ứng viên đề xuất 55 triệu, ngân sách tối đa 40 triệu',
              decidedAt: '2026-10-15T18:00:00Z',
              decidedBy: 'Hội đồng Tuyển dụng',
            },
          },
        },
      });

      const payload: FinalHiringDecisionRecord = {
        status: 'REJECT',
        rejectionReason: 'Kỳ vọng lương quá cao so với khung ngân sách',
        rejectionEmailSent: true,
        notes: 'Ứng viên đề xuất 55 triệu, ngân sách tối đa 40 triệu',
        decidedAt: '2026-10-15T18:00:00Z',
        decidedBy: 'Hội đồng Tuyển dụng',
      };

      const result = await candidateEvaluationSummaryService.updateCandidateDecision(
        'cand-final-001',
        payload
      );

      expect(postSpy).toHaveBeenCalledWith('/recruitment/candidates/cand-final-001/decision', payload);
      expect(result.hiringDecision.status).toBe('REJECT');
      expect(result.hiringDecision.rejectionReason).toBe(
        'Kỳ vọng lương quá cao so với khung ngân sách'
      );
      expect(result.hiringDecision.rejectionEmailSent).toBe(true);
    });

    it('fallback dữ liệu an toàn nếu API backend gặp lỗi mạng', async () => {
      vi.spyOn(axiosClient, 'put').mockRejectedValueOnce(new Error('Network error 500'));

      const payload: FinalHiringDecisionRecord = {
        status: 'OFFER',
        offeredSalary: 35000000,
        startDate: '2026-11-01',
        notes: 'Fallback test',
      };

      const fallbackResult = await candidateEvaluationSummaryService.updateCandidateDecision(
        'cand-final-001',
        payload
      );

      expect(fallbackResult).toBeDefined();
      expect(fallbackResult.hiringDecision.status).toBe('OFFER');
      expect(fallbackResult.hiringDecision.offeredSalary).toBe(35000000);
    });
  });
});
