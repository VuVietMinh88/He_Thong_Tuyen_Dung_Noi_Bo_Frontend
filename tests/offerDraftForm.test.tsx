import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OfferDraftForm } from '../src/components/Offer/OfferDraftForm';
import { OfferDraftModal } from '../src/components/Offer/OfferDraftModal';
import {
  DEFAULT_STANDARD_POSITIONS,
  formatVndCurrency,
  evaluateSalaryAgainstRange,
  calculateTotalMonthlyPackage,
  createOfferFormValidationSchema,
} from '../src/utils/offerHelper';
import type { StandardSalaryRange, JobPositionOption } from '../src/types/offer';

describe('Jira Task TKNHTTDNB1-491: Thiết kế biểu mẫu soạn đề nghị tuyển dụng (Story TKNHTTDNB1-71)', () => {
  const mockCandidateProps = {
    candidateId: 'cand-offer-001',
    candidateName: 'Nguyễn Văn Minh',
    candidateCode: 'CAN-2026-891',
    candidateEmail: 'minh.nguyen@example.com',
    candidatePhoneNumber: '+84912345678',
    expectedCandidateSalary: 35000000,
    initialJobTitle: 'Senior Frontend Developer (React, TypeScript)',
    initialOfferedSalary: 32000000,
    initialAllowanceAmount: 2000000,
    initialExpectedStartDate: '2026-11-15',
    initialResponseDeadline: '2026-11-05',
    onSubmitOffer: vi.fn(),
    onSaveDraft: vi.fn(),
    onCancel: vi.fn(),
  };

  const sampleStandardSalaryRange: StandardSalaryRange = {
    minimumSalary: 28000000,
    maximumSalary: 42000000,
    currencyCode: 'VND',
  };

  // =========================================================================
  // AC 1: Các trường dữ liệu của Form (Form Fields)
  // =========================================================================
  describe('1. Kiểm tra hiển thị đầy đủ các trường dữ liệu trên biểu mẫu (AC 1)', () => {
    it('render đầy đủ tiêu đề, thông tin ứng viên và các khối trường dữ liệu', () => {
      const renderedHtml = renderToString(
        <OfferDraftForm {...mockCandidateProps} />
      );

      // Tiêu đề biểu mẫu và thông tin ứng viên
      expect(renderedHtml).toContain('Soạn Thảo Đề Nghị Tuyển Dụng (Offer Letter)');
      expect(renderedHtml).toContain('Nguyễn Văn Minh');
      expect(renderedHtml).toContain('CAN-2026-891');

      // 1. Trường Chức danh tuyển dụng
      expect(renderedHtml).toContain('data-testid="select-job-title"');
      expect(renderedHtml).toContain('Senior Frontend Developer (React, TypeScript)');

      // 2. Trường Mức lương đề xuất
      expect(renderedHtml).toContain('data-testid="input-offered-salary"');

      // 3. Trường Phụ cấp
      expect(renderedHtml).toContain('data-testid="input-allowance"');

      // 4. Trường Ngày dự kiến nhận việc
      expect(renderedHtml).toContain('data-testid="input-expected-start-date"');

      // 5. Trường Hạn phản hồi đề nghị
      expect(renderedHtml).toContain('data-testid="input-response-deadline"');

      // 6. Trường Lý do vượt khung (Textarea)
      expect(renderedHtml).toContain('data-testid="textarea-out-of-range-reason"');

      // Các nút thao tác
      expect(renderedHtml).toContain('data-testid="btn-submit-offer"');
      expect(renderedHtml).toContain('data-testid="btn-save-draft-offer"');
      expect(renderedHtml).toContain('data-testid="btn-cancel-offer"');
    });

    it('hiển thị danh sách các vị trí chuẩn từ hệ thống trong dropdown', () => {
      const renderedHtml = renderToString(
        <OfferDraftForm {...mockCandidateProps} />
      );

      DEFAULT_STANDARD_POSITIONS.forEach((positionOption: JobPositionOption) => {
        expect(renderedHtml).toContain(positionOption.positionTitle);
      });
    });

    it('tính toán và hiển thị chính xác tổng đãi ngộ hàng tháng (Lương + Phụ cấp)', () => {
      const renderedHtml = renderToString(
        <OfferDraftForm
          {...mockCandidateProps}
          initialOfferedSalary={32000000}
          initialAllowanceAmount={2000000}
        />
      );

      // 32.000.000 + 2.000.000 = 34.000.000 ₫
      expect(renderedHtml).toContain('data-testid="total-compensation-display"');
      expect(renderedHtml).toContain('34.000.000 ₫');
    });
  });

  // =========================================================================
  // AC 2: Cảnh báo dải lương chuẩn (Salary Range Warning)
  // =========================================================================
  describe('2. Cảnh báo dải lương chuẩn và ràng buộc lý do vượt khung (AC 2)', () => {
    it('hiển thị dải lương chuẩn của vị trí ngay cạnh ô nhập mức lương', () => {
      const renderedHtml = renderToString(
        <OfferDraftForm {...mockCandidateProps} />
      );

      // Kiểm tra có container hiển thị dải chuẩn
      expect(renderedHtml).toContain('data-testid="standard-salary-range-display"');
      expect(renderedHtml).toContain('28.000.000 ₫ – 42.000.000 ₫');
    });

    it('hiển thị trạng thái "Trong dải chuẩn" và Lý do vượt khung là tùy chọn khi mức lương hợp lệ', () => {
      // 32.000.000 nằm trong dải [28.000.000 - 42.000.000]
      const renderedHtml = renderToString(
        <OfferDraftForm
          {...mockCandidateProps}
          initialOfferedSalary={32000000}
        />
      );

      // Huy hiệu trong dải chuẩn
      expect(renderedHtml).toContain('data-testid="salary-status-badge-within"');
      expect(renderedHtml).toContain('Trong dải chuẩn');

      // Không hiển thị banner cảnh báo
      expect(renderedHtml).not.toContain('data-testid="salary-range-warning-banner"');

      // Chỉ báo trường Lý do vượt khung là tùy chọn
      expect(renderedHtml).toContain('data-testid="out-of-range-optional-indicator"');
      expect(renderedHtml).not.toContain('data-testid="out-of-range-required-indicator"');
    });

    it('hiển thị cảnh báo trực quan và chuyển "Lý do vượt khung" thành bắt buộc khi mức lương vượt mức trần', () => {
      // 48.000.000 > 42.000.000 (vượt trần dải lương chuẩn)
      const renderedHtml = renderToString(
        <OfferDraftForm
          {...mockCandidateProps}
          initialOfferedSalary={48000000}
        />
      );

      // Huy hiệu vượt mức trần kèm phần trăm vượt
      expect(renderedHtml).toContain('data-testid="salary-status-badge-above"');
      expect(renderedHtml).toContain('Vượt mức trần');

      // Banner cảnh báo trực quan
      expect(renderedHtml).toContain('data-testid="salary-range-warning-banner"');
      expect(renderedHtml).toContain('Cảnh báo: Mức lương vượt trần dải lương chuẩn');
      expect(renderedHtml).toContain('cao hơn 6.000.000 ₫ (+14%) so với mức trần quy định');

      // Tự động chuyển Lý do vượt khung thành bắt buộc
      expect(renderedHtml).toContain('data-testid="out-of-range-required-indicator"');
      expect(renderedHtml).toContain('* Bắt buộc nhập (Do lương vượt dải chuẩn)');
    });

    it('hiển thị cảnh báo trực quan và chuyển "Lý do vượt khung" thành bắt buộc khi mức lương thấp hơn mức sàn', () => {
      // 22.000.000 < 28.000.000 (thấp hơn sàn dải lương chuẩn)
      const renderedHtml = renderToString(
        <OfferDraftForm
          {...mockCandidateProps}
          initialOfferedSalary={22000000}
        />
      );

      // Huy hiệu dưới mức sàn
      expect(renderedHtml).toContain('data-testid="salary-status-badge-below"');
      expect(renderedHtml).toContain('Dưới mức sàn');

      // Banner cảnh báo trực quan
      expect(renderedHtml).toContain('data-testid="salary-range-warning-banner"');
      expect(renderedHtml).toContain('Cảnh báo: Mức lương thấp hơn sàn dải lương chuẩn');
      expect(renderedHtml).toContain('thấp hơn 6.000.000 ₫ (-21%) so với mức sàn quy định');

      // Tự động chuyển Lý do vượt khung thành bắt buộc
      expect(renderedHtml).toContain('data-testid="out-of-range-required-indicator"');
      expect(renderedHtml).toContain('* Bắt buộc nhập (Do lương vượt dải chuẩn)');
    });
  });

  // =========================================================================
  // AC 3: Helper logic & Zod Validation Schema Unit Tests
  // =========================================================================
  describe('3. Kiểm tra các hàm Helper và quy tắc Validation (offerHelper)', () => {
    it('formatVndCurrency định dạng chính xác số tiền VNĐ và xử lý trường hợp undefined/NaN', () => {
      expect(formatVndCurrency(35000000)).toBe('35.000.000 ₫');
      expect(formatVndCurrency(0)).toBe('0 ₫');
      expect(formatVndCurrency(undefined)).toBe('0 ₫');
    });

    it('calculateTotalMonthlyPackage tính toán chính xác tổng thu nhập', () => {
      expect(calculateTotalMonthlyPackage(30000000, 2000000)).toBe(32000000);
      expect(calculateTotalMonthlyPackage(25000000, 0)).toBe(25000000);
    });

    it('evaluateSalaryAgainstRange phân loại chính xác các trạng thái WITHIN, ABOVE, BELOW', () => {
      // 1. WITHIN
      const withinResult = evaluateSalaryAgainstRange(
        35000000,
        sampleStandardSalaryRange
      );
      expect(withinResult.comparisonStatus).toBe('WITHIN');
      expect(withinResult.isSalaryOutOfRange).toBe(false);
      expect(withinResult.differenceAmount).toBe(0);

      // 2. ABOVE
      const aboveResult = evaluateSalaryAgainstRange(
        50000000,
        sampleStandardSalaryRange
      );
      expect(aboveResult.comparisonStatus).toBe('ABOVE');
      expect(aboveResult.isSalaryOutOfRange).toBe(true);
      expect(aboveResult.differenceAmount).toBe(8000000);
      expect(aboveResult.differencePercentage).toBe(19);

      // 3. BELOW
      const belowResult = evaluateSalaryAgainstRange(
        20000000,
        sampleStandardSalaryRange
      );
      expect(belowResult.comparisonStatus).toBe('BELOW');
      expect(belowResult.isSalaryOutOfRange).toBe(true);
      expect(belowResult.differenceAmount).toBe(-8000000);
      expect(belowResult.differencePercentage).toBe(-29);

      // 4. UNKNOWN khi không có dải chuẩn
      const unknownResult = evaluateSalaryAgainstRange(30000000, null);
      expect(unknownResult.comparisonStatus).toBe('UNKNOWN');
      expect(unknownResult.isSalaryOutOfRange).toBe(false);
    });

    it('Zod Schema bắt lỗi khi mức lương nằm ngoài dải chuẩn nhưng để trống Lý do vượt khung', () => {
      const outOfRangeValidationSchema = createOfferFormValidationSchema(true);

      const invalidPayload = {
        jobTitle: 'Senior Frontend Developer',
        offeredSalary: 50000000,
        allowanceAmount: 2000000,
        expectedStartDate: '2026-11-20',
        responseDeadline: '2026-11-10',
        outOfRangeReason: '', // Để trống khi lương vượt khung
      };

      const parseResult = outOfRangeValidationSchema.safeParse(invalidPayload);
      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        const outOfRangeIssue = parseResult.error.issues.find(
          (issueItem) => issueItem.path.includes('outOfRangeReason')
        );
        expect(outOfRangeIssue).toBeDefined();
        expect(outOfRangeIssue?.message).toContain('Mức lương nằm ngoài dải chuẩn');
      }
    });

    it('Zod Schema chấp nhận khi mức lương trong dải chuẩn và để trống Lý do vượt khung', () => {
      const withinRangeValidationSchema = createOfferFormValidationSchema(false);

      const validPayload = {
        jobTitle: 'Senior Frontend Developer',
        offeredSalary: 35000000,
        allowanceAmount: 2000000,
        expectedStartDate: '2026-11-20',
        responseDeadline: '2026-11-10',
        outOfRangeReason: '', // Hợp lệ khi lương trong dải chuẩn
      };

      const parseResult = withinRangeValidationSchema.safeParse(validPayload);
      expect(parseResult.success).toBe(true);
    });

    it('Zod Schema bắt lỗi nếu Hạn phản hồi sau Ngày nhận việc', () => {
      const validationSchema = createOfferFormValidationSchema(false);

      const invalidDatePayload = {
        jobTitle: 'Senior Frontend Developer',
        offeredSalary: 35000000,
        allowanceAmount: 2000000,
        expectedStartDate: '2026-11-10',
        responseDeadline: '2026-11-15', // Hạn phản hồi muộn hơn ngày nhận việc
      };

      const parseResult = validationSchema.safeParse(invalidDatePayload);
      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        const deadlineIssue = parseResult.error.issues.find(
          (issueItem) => issueItem.path.includes('responseDeadline')
        );
        expect(deadlineIssue).toBeDefined();
        expect(deadlineIssue?.message).toContain(
          'Hạn phản hồi đề nghị phải diễn ra trước hoặc cùng ngày'
        );
      }
    });
  });

  // =========================================================================
  // AC 4: Modal Wrapper Component (OfferDraftModal)
  // =========================================================================
  describe('4. Modal Wrapper Component (OfferDraftModal)', () => {
    it('render modal khi isOpen = true', () => {
      const renderedHtml = renderToString(
        <OfferDraftModal
          isOpen={true}
          onClose={vi.fn()}
          {...mockCandidateProps}
        />
      );

      expect(renderedHtml).toContain('data-testid="offer-draft-modal-backdrop"');
      expect(renderedHtml).toContain('data-testid="btn-close-offer-modal"');
      expect(renderedHtml).toContain('Soạn Thảo Đề Nghị Tuyển Dụng (Offer Letter)');
    });

    it('không render gì khi isOpen = false', () => {
      const renderedHtml = renderToString(
        <OfferDraftModal
          isOpen={false}
          onClose={vi.fn()}
          {...mockCandidateProps}
        />
      );

      expect(renderedHtml).toBe('');
    });
  });
});
