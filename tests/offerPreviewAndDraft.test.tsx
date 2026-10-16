import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { OfferDraftForm } from '../src/components/Offer/OfferDraftForm';
import { OfferPreviewModal } from '../src/components/Offer/OfferPreviewModal';
import { offerService } from '../src/services/offerService';
import {
  generateOfferPreviewContent,
  formatVndWords,
  formatDateVietnamese,
  DEFAULT_STANDARD_POSITIONS,
} from '../src/utils/offerHelper';
import type { OfferFormValues, OfferRecord } from '../src/types/offer';

describe('Jira Task TKNHTTDNB1-492: Tích hợp xem trước và lưu offer nháp (Story TKNHTTDNB1-71)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    offerService.clearStoredOffers();
  });

  const mockCandidateProps = {
    candidateId: 'cand-offer-492',
    candidateName: 'Trần Thị Mai',
    candidateCode: 'CAN-2026-492',
    candidateEmail: 'mai.tran@example.com',
    candidatePhoneNumber: '+84988776655',
    expectedCandidateSalary: 30000000,
    initialJobTitle: 'Senior Frontend Developer (React, TypeScript)',
    initialOfferedSalary: 35000000,
    initialAllowanceAmount: 1500000,
    initialAllowanceDescription: 'Phụ cấp ăn trưa 1.500.000 ₫/tháng',
    initialExpectedStartDate: '2026-11-20',
    initialResponseDeadline: '2026-11-10',
    initialOutOfRangeReason: '',
    onSubmitOffer: vi.fn(),
    onSaveDraft: vi.fn(),
    onPreviewOffer: vi.fn(),
    onCancel: vi.fn(),
  };

  // =========================================================================
  // AC 1: Các nút hành động (Lưu nháp, Xem trước, Gửi duyệt)
  // =========================================================================
  describe('1. Kiểm tra tích hợp các nút hành động trên form (AC 1)', () => {
    it('render đầy đủ cả 3 nút hành động chính: Xem trước, Lưu bản nháp và Gửi duyệt đề nghị', () => {
      const renderedHtml = renderToString(
        <OfferDraftForm {...mockCandidateProps} />
      );

      // 1. Nút Xem trước (Preview)
      expect(renderedHtml).toContain('data-testid="btn-preview-offer"');
      expect(renderedHtml).toContain('Xem Trước (Preview)');

      // 2. Nút Lưu bản nháp (Save Draft)
      expect(renderedHtml).toContain('data-testid="btn-save-draft-offer"');
      expect(renderedHtml).toContain('Lưu Bản Nháp');

      // 3. Nút Gửi duyệt (Submit for Approval)
      expect(renderedHtml).toContain('data-testid="btn-submit-offer"');
      expect(renderedHtml).toContain('Gửi Duyệt Đề Nghị');
    });

    it('Lưu nháp (Save Draft): cho phép lưu thành công mà không bắt buộc điền đầy đủ các trường', async () => {
      const draftPayload: Partial<OfferFormValues> = {
        jobTitle: 'Frontend Intern',
        offeredSalary: 5000000,
        // Chưa điền ngày bắt đầu, hạn phản hồi, phụ cấp
      };

      const savedDraftRecord = await offerService.saveOfferDraft(
        'cand-draft-001',
        draftPayload
      );

      expect(savedDraftRecord).toBeDefined();
      expect(savedDraftRecord.status).toBe('DRAFT');
      expect(savedDraftRecord.jobTitle).toBe('Frontend Intern');
      expect(savedDraftRecord.offeredSalary).toBe(5000000);
      expect(savedDraftRecord.offerCode).toContain('OFF-DRAFT');
    });

    it('Xem trước (Preview): render modal OfferPreviewModal với đầy đủ các nội dung văn bản thư mời nhận việc', () => {
      const sampleFormValues: OfferFormValues = {
        jobTitle: 'Senior Frontend Developer (React, TypeScript)',
        positionId: 'pos-fe-senior',
        offeredSalary: 35000000,
        allowanceAmount: 2000000,
        allowanceDescription: 'Phụ cấp ăn trưa và gửi xe',
        expectedStartDate: '2026-11-20',
        responseDeadline: '2026-11-10',
        outOfRangeReason: '',
        sendEmailToCandidate: true,
      };

      const previewContent = generateOfferPreviewContent(
        sampleFormValues,
        {
          candidateName: 'Trần Thị Mai',
          candidateCode: 'CAN-2026-492',
          candidateEmail: 'mai.tran@example.com',
          candidatePhoneNumber: '+84988776655',
        },
        DEFAULT_STANDARD_POSITIONS[0]
      );

      const modalHtml = renderToString(
        <OfferPreviewModal
          isOpen={true}
          onClose={vi.fn()}
          previewContent={previewContent}
          onConfirmSubmit={vi.fn()}
        />
      );

      // Tiêu đề & Thông tin ứng viên
      expect(modalHtml).toContain('THƯ MỜI NHẬN VIỆC (JOB OFFER LETTER)');
      expect(modalHtml).toContain('Trần Thị Mai');
      expect(modalHtml).toContain('CAN-2026-492');
      expect(modalHtml).toContain('mai.tran@example.com');

      // Vị trí & Chế độ đãi ngộ
      expect(modalHtml).toContain('Senior Frontend Developer (React, TypeScript)');
      expect(modalHtml).toContain('35.000.000 ₫');
      expect(modalHtml).toContain('2.000.000 ₫');
      expect(modalHtml).toContain('37.000.000 ₫');

      // Thời hạn nhận việc & Hạn phản hồi
      expect(modalHtml).toContain('20/11/2026');
      expect(modalHtml).toContain('10/11/2026');

      // Các nút thao tác trong modal
      expect(modalHtml).toContain('data-testid="btn-back-to-edit"');
      expect(modalHtml).toContain('data-testid="btn-print-offer"');
      expect(modalHtml).toContain('data-testid="btn-confirm-submit-from-preview"');
    });

    it('không render modal xem trước khi isOpen = false', () => {
      const sampleFormValues: OfferFormValues = {
        jobTitle: 'Junior Developer',
        offeredSalary: 15000000,
        allowanceAmount: 1000000,
        expectedStartDate: '2026-11-20',
        responseDeadline: '2026-11-10',
      };

      const previewContent = generateOfferPreviewContent(
        sampleFormValues,
        { candidateName: 'Trần Thị Mai' }
      );

      const modalHtml = renderToString(
        <OfferPreviewModal
          isOpen={false}
          onClose={vi.fn()}
          previewContent={previewContent}
        />
      );

      expect(modalHtml).toBe('');
    });
  });

  // =========================================================================
  // AC 2: Validation & Xử lý lỗi (Chặn thiếu giải trình & Chặn trùng offer)
  // =========================================================================
  describe('2. Validation chặn lỗi thiếu giải trình & Chặn trùng offer (AC 2)', () => {
    it('chặn gửi duyệt và ném lỗi khi lương vượt dải chuẩn nhưng thiếu lý do vượt khung', async () => {
      const outOfRangeFormValues: OfferFormValues = {
        jobTitle: 'Senior Frontend Developer (React, TypeScript)',
        positionId: 'pos-fe-senior', // Dải chuẩn: 28.000.000 - 42.000.000
        offeredSalary: 55000000, // Vượt mức tối đa 42.000.000
        allowanceAmount: 2000000,
        expectedStartDate: '2026-11-20',
        responseDeadline: '2026-11-10',
        outOfRangeReason: '', // Để trống lý do vượt khung
      };

      await expect(
        offerService.submitOfferForApproval(
          'cand-out-of-range',
          outOfRangeFormValues
        )
      ).rejects.toThrow('Mức lương nằm ngoài dải chuẩn. Bắt buộc nhập lý do');
    });

    it('hiển thị cảnh báo chặn ngay lập tức và vô hiệu hóa nút gửi duyệt khi ứng viên đã có offer còn hiệu lực', () => {
      const existingOffer: OfferRecord = {
        offerId: 'offer-existing-01',
        offerCode: 'OFF-2026-ACTIVE',
        candidateId: 'cand-offer-492',
        candidateName: 'Trần Thị Mai',
        jobTitle: 'Senior Frontend Engineer',
        offeredSalary: 35000000,
        allowanceAmount: 2000000,
        totalMonthlyCompensation: 37000000,
        expectedStartDate: '2026-11-20',
        responseDeadline: '2026-11-10',
        isSalaryOutOfRange: false,
        salaryComparisonStatus: 'WITHIN',
        status: 'PENDING_APPROVAL', // Đang còn hiệu lực
        sendEmailToCandidate: true,
        createdAt: '2026-10-15T10:00:00Z',
        updatedAt: '2026-10-15T10:00:00Z',
      };

      const renderedHtml = renderToString(
        <OfferDraftForm
          {...mockCandidateProps}
          existingActiveOffer={existingOffer}
        />
      );

      // Hiển thị khung cảnh báo xung đột offer
      expect(renderedHtml).toContain('data-testid="active-offer-conflict-alert"');
      expect(renderedHtml).toContain(
        'Cảnh báo: Ứng viên đang có đề nghị tuyển dụng còn hiệu lực'
      );
      expect(renderedHtml).toContain('OFF-2026-ACTIVE');

      // Nút Gửi duyệt bị vô hiệu hóa (disabled)
      expect(renderedHtml).toContain('disabled=""');
    });

    it('offerService.submitOfferForApproval ném lỗi 409 khi ứng viên đã có offer còn hiệu lực (không nuốt lỗi)', async () => {
      // 1. Seed sẵn một offer đang có hiệu lực cho ứng viên
      offerService.seedActiveOfferForCandidate(
        'cand-active-test',
        'Lê Hoàng Nam',
        'Backend Team Lead'
      );

      const validValues: OfferFormValues = {
        jobTitle: 'Backend Team Lead',
        positionId: 'pos-be-senior',
        offeredSalary: 40000000,
        allowanceAmount: 2000000,
        expectedStartDate: '2026-11-20',
        responseDeadline: '2026-11-10',
        outOfRangeReason: '',
      };

      // 2. Thử gửi duyệt một offer mới cho cùng ứng viên
      try {
        await offerService.submitOfferForApproval(
          'cand-active-test',
          validValues
        );
        expect.fail('Hàm submitOfferForApproval phải ném lỗi 409 khi trùng offer');
      } catch (caughtError: unknown) {
        const errorRecord = caughtError as {
          message: string;
          statusCode?: number;
          response?: { status?: number; data?: { code?: string } };
        };

        expect(errorRecord.message).toContain(
          'Ứng viên này đã có một đề nghị tuyển dụng đang còn hiệu lực'
        );
        expect(
          errorRecord.statusCode === 409 ||
            errorRecord.response?.status === 409
        ).toBe(true);
      }
    });

    it('cho phép gửi duyệt thành công khi ứng viên không có offer nào còn hiệu lực', async () => {
      const validValues: OfferFormValues = {
        jobTitle: 'Senior Frontend Developer (React, TypeScript)',
        positionId: 'pos-fe-senior',
        offeredSalary: 35000000,
        allowanceAmount: 2000000,
        expectedStartDate: '2026-11-20',
        responseDeadline: '2026-11-10',
        outOfRangeReason: '',
      };

      const submittedOffer = await offerService.submitOfferForApproval(
        'cand-no-conflict',
        validValues
      );

      expect(submittedOffer).toBeDefined();
      expect(submittedOffer.status).toBe('PENDING_APPROVAL');
      expect(submittedOffer.offeredSalary).toBe(35000000);
      expect(submittedOffer.totalMonthlyCompensation).toBe(37000000);
    });
  });

  // =========================================================================
  // AC 3: Helper logic kiểm tra format đọc tiền và ngày tháng
  // =========================================================================
  describe('3. Helper functions: Đọc số tiền bằng chữ và định dạng ngày (offerHelper)', () => {
    it('formatDateVietnamese chuyển đổi đúng định dạng YYYY-MM-DD sang DD/MM/YYYY', () => {
      expect(formatDateVietnamese('2026-11-20')).toBe('20/11/2026');
      expect(formatDateVietnamese('2026-05-08')).toBe('08/05/2026');
      expect(formatDateVietnamese('')).toBe('Chưa xác định');
    });

    it('formatVndWords đọc đúng các mốc tiền lương VNĐ thông dụng', () => {
      expect(formatVndWords(35000000)).toBe('35 triệu đồng chẵn');
      expect(formatVndWords(120000000)).toBe('120 triệu đồng chẵn');
      expect(formatVndWords(1500000000)).toBe('1 tỷ 500 triệu đồng chẵn');
      expect(formatVndWords(0)).toBe('Không đồng');
    });

    it('generateOfferPreviewContent hiển thị hộp giải trình khi mức lương nằm ngoài dải chuẩn', () => {
      const outOfRangeFormValues: OfferFormValues = {
        jobTitle: 'Senior Frontend Developer (React, TypeScript)',
        positionId: 'pos-fe-senior',
        offeredSalary: 55000000, // Vượt mức tối đa 42.000.000
        allowanceAmount: 2000000,
        expectedStartDate: '2026-11-20',
        responseDeadline: '2026-11-10',
        outOfRangeReason: 'Ứng viên có chứng chỉ AWS Solutions Architect và 8 năm kinh nghiệm React chuyên sâu.',
      };

      const previewContent = generateOfferPreviewContent(
        outOfRangeFormValues,
        { candidateName: 'Trần Thị Mai' },
        DEFAULT_STANDARD_POSITIONS[0]
      );

      expect(previewContent.isSalaryOutOfRange).toBe(true);
      expect(previewContent.outOfRangeReason).toBe(
        'Ứng viên có chứng chỉ AWS Solutions Architect và 8 năm kinh nghiệm React chuyên sâu.'
      );

      const modalHtml = renderToString(
        <OfferPreviewModal
          isOpen={true}
          onClose={vi.fn()}
          previewContent={previewContent}
        />
      );

      expect(modalHtml).toContain('data-testid="preview-out-of-range-box"');
      expect(modalHtml).toContain('Ghi chú giải trình vượt dải lương chuẩn');
      expect(modalHtml).toContain('AWS Solutions Architect');
    });
  });
});
