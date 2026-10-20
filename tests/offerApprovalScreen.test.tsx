import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { OfferApprovalScreen } from '../src/components/Offer/OfferApprovalScreen';
import { OfferApprovalModal } from '../src/components/Offer/OfferApprovalModal';
import { OfferApprovalPage } from '../src/pages/Offer/OfferApprovalPage';
import { offerService } from '../src/services/offerService';
import type { OfferApprovalDetails } from '../src/types/offer';

describe('Jira Task TKNHTTDNB1-498: Thiết kế màn hình phê duyệt offer (Story TKNHTTDNB1-72)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    offerService.clearStoredOffers();
  });

  const mockOutOfRangeOfferDetails: OfferApprovalDetails = {
    offerId: 'offer-test-498-over',
    offerCode: 'OFF-2026-9901',
    candidateId: 'cand-498-01',
    candidateName: 'Đặng Quốc Anh',
    candidateCode: 'UV-2026-9901',
    candidateEmail: 'quocanh.dang@gmail.com',
    candidatePhoneNumber: '0977 888 999',
    jobTitle: 'Senior Frontend Developer (React, TypeScript)',
    positionId: 'pos-fe-senior',
    jobLevel: 'Senior',
    departmentName: 'Phòng Phát triển Phần mềm (IT)',
    offeredSalary: 48000000,
    allowanceAmount: 2500000,
    allowanceDescription: 'Phụ cấp ăn trưa và gửi xe hàng tháng',
    totalMonthlyCompensation: 50500000,
    expectedStartDate: '2026-11-20',
    responseDeadline: '2026-11-10',
    isSalaryOutOfRange: true,
    salaryComparisonStatus: 'ABOVE',
    outOfRangeReason:
      'Ứng viên có 6 năm kinh nghiệm chuyên sâu với React 19, Micro-frontends và Cloud AWS. Đạt chứng chỉ AWS Solutions Architect Professional và đạt 95% điểm đánh giá chuyên môn vòng phỏng vấn kỹ thuật.',
    status: 'PENDING_APPROVAL',
    sendEmailToCandidate: true,
    createdAt: '2026-10-15T08:00:00Z',
    updatedAt: '2026-10-15T09:30:00Z',
    createdBy: 'Recruiter: Nguyễn Phương Anh (HR Specialist)',
    standardSalaryRange: {
      minimumSalary: 28000000,
      maximumSalary: 42000000,
      currencyCode: 'VND',
    },
    currentStepIndex: 1,
    recruiterNote: 'Đề xuất ký hợp đồng lao động chính thức 12 tháng.',
    candidateSummary: {
      yearsOfExperience: 6,
      highestEducation: 'Kỹ sư CNTT - Đại học Bách Khoa',
      interviewScore: 9.5,
      matchingScore: 95,
    },
    approvalWorkflowChain: [
      {
        stepOrder: 1,
        stepName: 'Thẩm định Chuyên môn & Khung ngân sách',
        approverRole: 'Trưởng phòng Nhân sự & Đào tạo',
        approverName: 'Bà Nguyễn Thị Minh Thảo',
        status: 'APPROVED',
        isCurrentStep: false,
        reviewedAt: '2026-10-15T09:30:00Z',
        approvalComment: 'Đã kiểm tra dải lương. Đạt tiêu chuẩn trình duyệt đặc cách.',
      },
      {
        stepOrder: 2,
        stepName: 'Phê duyệt Khối Chuyên môn & Định biên',
        approverRole: 'Giám đốc Khối Kỹ thuật & Công nghệ',
        approverName: 'Ông Trần Hoàng Long',
        status: 'PENDING',
        isCurrentStep: true,
      },
      {
        stepOrder: 3,
        stepName: 'Phê duyệt Điều hành Cấp cao (CEO)',
        approverRole: 'Tổng Giám Đốc Điều Hành (CEO)',
        approverName: 'Ông Lê Quốc Khánh',
        status: 'WAITING',
        isCurrentStep: false,
      },
    ],
  };

  const mockWithinRangeOfferDetails: OfferApprovalDetails = {
    ...mockOutOfRangeOfferDetails,
    offerId: 'offer-test-498-within',
    offerCode: 'OFF-2026-9902',
    offeredSalary: 35000000,
    allowanceAmount: 1500000,
    totalMonthlyCompensation: 36500000,
    isSalaryOutOfRange: false,
    salaryComparisonStatus: 'WITHIN',
    outOfRangeReason: '',
  };

  // =========================================================================
  // AC 1: Hiển thị thông tin chi tiết Offer & Dải lương chuẩn
  // =========================================================================
  describe('1. Hiển thị thông tin chi tiết Offer và làm nổi bật dải lương chuẩn / lý do vượt khung (AC 1)', () => {
    it('render đầy đủ thông tin ứng viên, chức danh, cấp bậc, các mốc tài chính và ngày nhận việc', () => {
      const renderedHtml = renderToString(
        <OfferApprovalScreen offerDetails={mockOutOfRangeOfferDetails} />
      );

      // Thông tin ứng viên
      expect(renderedHtml).toContain('Đặng Quốc Anh');
      expect(renderedHtml).toContain('quocanh.dang@gmail.com');
      expect(renderedHtml).toContain('0977 888 999');

      // Chức danh tuyển dụng
      expect(renderedHtml).toContain('Senior Frontend Developer (React, TypeScript)');
      expect(renderedHtml).toContain('Phòng Phát triển Phần mềm (IT)');

      // Các chỉ số tài chính
      expect(renderedHtml).toContain('48.000.000');
      expect(renderedHtml).toContain('2.500.000');
      expect(renderedHtml).toContain('50.500.000');

      // Ngày nhận việc và hạn phản hồi
      expect(renderedHtml).toContain('20/11/2026');
      expect(renderedHtml).toContain('10/11/2026');
    });

    it('hiển thị dải lương chuẩn của vị trí rõ ràng', () => {
      const renderedHtml = renderToString(
        <OfferApprovalScreen offerDetails={mockOutOfRangeOfferDetails} />
      );

      expect(renderedHtml).toContain('data-testid="standard-salary-range-box"');
      expect(renderedHtml).toContain('28.000.000');
      expect(renderedHtml).toContain('42.000.000');
    });

    it('LÀM NỔI BẬT LÝ DO VƯỢT KHUNG khi mức lương đề xuất nằm ngoài dải chuẩn (isSalaryOutOfRange = true)', () => {
      const renderedHtml = renderToString(
        <OfferApprovalScreen offerDetails={mockOutOfRangeOfferDetails} />
      );

      // Khối cảnh báo nổi bật
      expect(renderedHtml).toContain('data-testid="out-of-range-highlight-banner"');
      expect(renderedHtml).toContain('Cảnh Báo: Mức Lương Vượt Trần Dải Chuẩn Được Duyệt');

      // Huy hiệu cảnh báo chênh lệch
      expect(renderedHtml).toContain('data-testid="badge-out-of-range-warning"');

      // Card hiển thị lý do giải trình chi tiết từ Recruiter
      expect(renderedHtml).toContain('data-testid="out-of-range-reason-card"');
      expect(renderedHtml).toContain('data-testid="text-out-of-range-reason"');
      expect(renderedHtml).toContain('6 năm kinh nghiệm chuyên sâu với React 19');
      expect(renderedHtml).toContain('AWS Solutions Architect Professional');
    });

    it('hiển thị thông báo xác nhận trong dải chuẩn khi lương đề xuất không vượt khung (isSalaryOutOfRange = false)', () => {
      const renderedHtml = renderToString(
        <OfferApprovalScreen offerDetails={mockWithinRangeOfferDetails} />
      );

      expect(renderedHtml).toContain('data-testid="within-range-confirmation-banner"');
      expect(renderedHtml).toContain('Mức lương hoàn toàn nằm trong dải chuẩn');
      expect(renderedHtml).toContain('data-testid="badge-within-standard-range"');
      expect(renderedHtml).not.toContain('data-testid="out-of-range-highlight-banner"');
    });
  });

  // =========================================================================
  // AC 2: Chuỗi cấp duyệt (Approval Chain / Workflow UI)
  // =========================================================================
  describe('2. Chuỗi cấp duyệt và đánh dấu nổi bật bước đang chờ xử lý (AC 2)', () => {
    it('render đầy đủ danh sách các bước trong chuỗi duyệt workflow', () => {
      const renderedHtml = renderToString(
        <OfferApprovalScreen offerDetails={mockOutOfRangeOfferDetails} />
      );

      expect(renderedHtml).toContain('data-testid="approval-workflow-chain-container"');

      // Bước 1: Thẩm định của HR
      expect(renderedHtml).toContain('data-testid="workflow-step-1"');
      expect(renderedHtml).toContain('Thẩm định Chuyên môn');
      expect(renderedHtml).toContain('Bà Nguyễn Thị Minh Thảo');
      expect(renderedHtml).toContain('data-testid="badge-step-1-approved"');

      // Bước 2: Phê duyệt của Giám đốc Khối
      expect(renderedHtml).toContain('data-testid="workflow-step-2"');
      expect(renderedHtml).toContain('Phê duyệt Khối Chuyên môn');
      expect(renderedHtml).toContain('Ông Trần Hoàng Long');

      // Bước 3: CEO
      expect(renderedHtml).toContain('data-testid="workflow-step-3"');
      expect(renderedHtml).toContain('Phê duyệt Điều hành Cấp cao (CEO)');
      expect(renderedHtml).toContain('Ông Lê Quốc Khánh');
    });

    it('đánh dấu nổi bật trạng thái của cấp duyệt hiện tại đang chờ xử lý (Pending / Current step)', () => {
      const renderedHtml = renderToString(
        <OfferApprovalScreen offerDetails={mockOutOfRangeOfferDetails} />
      );

      // Bước 2 là current step đang chờ xử lý
      expect(renderedHtml).toContain('data-testid="badge-step-2-current"');
      expect(renderedHtml).toContain('Đang chờ duyệt');

      // Bước 3 chưa tới lượt nên ở trạng thái chờ
      expect(renderedHtml).toContain('data-testid="badge-step-3-waiting"');
    });
  });

  // =========================================================================
  // AC 3: Khu vực thao tác (Action Area)
  // =========================================================================
  describe('3. Khu vực thao tác với 3 nút: Duyệt, Từ chối, Yêu cầu sửa (AC 3)', () => {
    it('render đầy đủ cả 3 nút hành động với màu sắc và test IDs phù hợp', () => {
      const renderedHtml = renderToString(
        <OfferApprovalScreen offerDetails={mockOutOfRangeOfferDetails} />
      );

      expect(renderedHtml).toContain('data-testid="approval-action-area"');

      // 1. Nút Duyệt (Approve) - Màu xanh lá (bg-emerald-600)
      expect(renderedHtml).toContain('data-testid="btn-approve-offer"');
      expect(renderedHtml).toContain('Phê Duyệt (Approve)');
      expect(renderedHtml).toContain('bg-emerald-600');

      // 2. Nút Từ chối (Reject) - Màu đỏ (bg-rose-600)
      expect(renderedHtml).toContain('data-testid="btn-reject-offer"');
      expect(renderedHtml).toContain('Từ Chối (Reject)');
      expect(renderedHtml).toContain('bg-rose-600');

      // 3. Nút Yêu cầu sửa (Request Change) - Màu cam/vàng (bg-amber-500)
      expect(renderedHtml).toContain('data-testid="btn-request-change-offer"');
      expect(renderedHtml).toContain('Yêu Cầu Sửa (Request Change)');
      expect(renderedHtml).toContain('bg-amber-500');
    });

    it('render thanh công cụ cố định phía dưới (Sticky Bottom Action Bar) để quản lý thao tác tiện lợi', () => {
      const renderedHtml = renderToString(
        <OfferApprovalScreen offerDetails={mockOutOfRangeOfferDetails} />
      );

      expect(renderedHtml).toContain('data-testid="sticky-bottom-action-bar"');
      expect(renderedHtml).toContain('data-testid="btn-sticky-approve"');
      expect(renderedHtml).toContain('data-testid="btn-sticky-reject"');
      expect(renderedHtml).toContain('data-testid="btn-sticky-request-change"');
    });

    it('ẩn khu vực thao tác khi offer đã được duyệt (status = APPROVED) hoặc ở chế độ readOnly', () => {
      const approvedOfferDetails: OfferApprovalDetails = {
        ...mockOutOfRangeOfferDetails,
        status: 'APPROVED',
      };

      const renderedHtml = renderToString(
        <OfferApprovalScreen offerDetails={approvedOfferDetails} readOnly={true} />
      );

      expect(renderedHtml).not.toContain('data-testid="approval-action-area"');
      expect(renderedHtml).not.toContain('data-testid="sticky-bottom-action-bar"');
    });
  });

  // =========================================================================
  // AC 3: Modal xác nhận thao tác (OfferApprovalModal)
  // =========================================================================
  describe('4. Modal xác nhận thao tác phê duyệt / từ chối / yêu cầu sửa (OfferApprovalModal)', () => {
    it('render modal ở chế độ APPROVE với danh sách gợi ý nhận xét mẫu và nút xác nhận', () => {
      const renderedHtml = renderToString(
        <OfferApprovalModal
          isOpen={true}
          actionMode="APPROVE"
          offerCode="OFF-2026-9901"
          candidateName="Đặng Quốc Anh"
          jobTitle="Senior Frontend Developer"
          onConfirm={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(renderedHtml).toContain('data-testid="offer-approval-modal-card"');
      expect(renderedHtml).toContain('Phê Duyệt Đề Nghị Tuyển Dụng');
      expect(renderedHtml).toContain('data-testid="btn-preset-reason-0"');
      expect(renderedHtml).toContain('data-testid="btn-modal-confirm"');
      expect(renderedHtml).toContain('data-testid="btn-modal-cancel"');
      expect(renderedHtml).toContain('Xác Nhận Phê Duyệt');
    });

    it('render modal ở chế độ REJECT với màu cảnh báo và tiêu đề phù hợp', () => {
      const renderedHtml = renderToString(
        <OfferApprovalModal
          isOpen={true}
          actionMode="REJECT"
          offerCode="OFF-2026-9901"
          candidateName="Đặng Quốc Anh"
          jobTitle="Senior Frontend Developer"
          onConfirm={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(renderedHtml).toContain('Từ Chối Đề Nghị Tuyển Dụng');
      expect(renderedHtml).toContain('Xác Nhận Từ Chối');
      expect(renderedHtml).toContain('bg-rose-600');
    });

    it('render modal ở chế độ REQUEST_CHANGE với tiêu đề yêu cầu chỉnh sửa', () => {
      const renderedHtml = renderToString(
        <OfferApprovalModal
          isOpen={true}
          actionMode="REQUEST_CHANGE"
          offerCode="OFF-2026-9901"
          candidateName="Đặng Quốc Anh"
          jobTitle="Senior Frontend Developer"
          onConfirm={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(renderedHtml).toContain('Yêu Cầu Chỉnh Sửa Điều Khoản Offer');
      expect(renderedHtml).toContain('Gửi Yêu Cầu Sửa Đổi');
      expect(renderedHtml).toContain('bg-amber-600');
    });
  });

  // =========================================================================
  // Service Methods: Tích hợp API Service phê duyệt
  // =========================================================================
  describe('5. Tích hợp Service xử lý phê duyệt, từ chối và yêu cầu sửa', () => {
    it('offerService.getOfferApprovalDetails trả về dữ liệu chi tiết kèm chuỗi duyệt workflow', async () => {
      const approvalDetails = await offerService.getOfferApprovalDetails('offer-test-01');

      expect(approvalDetails).toBeDefined();
      expect(approvalDetails.offerCode).toBeDefined();
      expect(approvalDetails.approvalWorkflowChain).toHaveLength(3);
      expect(approvalDetails.approvalWorkflowChain[0].status).toBe('APPROVED');
      expect(approvalDetails.approvalWorkflowChain[1].isCurrentStep).toBe(true);
    });

    it('offerService.approveOffer cập nhật trạng thái bước hiện tại sang APPROVED và offer sang APPROVED', async () => {
      const approvedResult = await offerService.approveOffer(
        'offer-demo-001',
        'Đồng ý thông qua mức lương đề xuất.'
      );

      expect(approvedResult.status).toBe('APPROVED');
      const step2 = approvedResult.approvalWorkflowChain.find((item) => item.stepOrder === 2);
      expect(step2?.status).toBe('APPROVED');
      expect(step2?.approvalComment).toBe('Đồng ý thông qua mức lương đề xuất.');
    });

    it('offerService.rejectOffer cập nhật trạng thái sang REJECTED kèm lý do từ chối', async () => {
      const rejectedResult = await offerService.rejectOffer(
        'offer-demo-001',
        'Lương vượt khung ngân sách phòng ban.'
      );

      expect(rejectedResult.status).toBe('REJECTED');
      const step2 = rejectedResult.approvalWorkflowChain.find((item) => item.stepOrder === 2);
      expect(step2?.status).toBe('REJECTED');
      expect(step2?.approvalComment).toContain('Lương vượt khung ngân sách phòng ban.');
    });

    it('offerService.requestChangeOffer cập nhật trạng thái sang REQUEST_CHANGE kèm nội dung yêu cầu sửa', async () => {
      const changeResult = await offerService.requestChangeOffer(
        'offer-demo-001',
        'Cần đàm phán giảm mức lương cứng xuống 42 triệu.'
      );
      const step2 = changeResult.approvalWorkflowChain.find((item) => item.stepOrder === 2);
      expect(step2?.status).toBe('REQUEST_CHANGE');
      expect(step2?.changeRequestDetails).toBe('Cần đàm phán giảm mức lương cứng xuống 42 triệu.');
    });
  });

  // =========================================================================
  // 6. Router Integration: OfferApprovalPage
  // =========================================================================
  describe('6. Tích hợp Router & Trang OfferApprovalPage', () => {
    it('render trang OfferApprovalPage thành công trong MemoryRouter với tham số id', () => {
      const renderedHtml = renderToString(
        <MemoryRouter initialEntries={['/offers/OFF-TEST-9901/approval']}>
          <Routes>
            <Route path="/offers/:id/approval" element={<OfferApprovalPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(renderedHtml).toContain('data-testid="offer-approval-loading-skeleton"');
    });
  });
});

