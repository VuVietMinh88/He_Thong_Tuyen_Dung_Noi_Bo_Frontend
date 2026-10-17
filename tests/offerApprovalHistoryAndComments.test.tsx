import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { OfferApprovalModal } from '../src/components/Offer/OfferApprovalModal';
import { OfferApprovalHistoryTimeline } from '../src/components/Offer/OfferApprovalHistoryTimeline';
import { OfferApprovalScreen } from '../src/components/Offer/OfferApprovalScreen';
import { offerService } from '../src/services/offerService';
import type {
  OfferApprovalDetails,
  OfferApprovalHistoryItem,
} from '../src/types/offer';

describe('Jira Task TKNHTTDNB1-499: Tích hợp nhận xét và lịch sử phê duyệt offer (Story TKNHTTDNB1-72)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    offerService.clearStoredOffers();
  });

  const mockTimelineItems: OfferApprovalHistoryItem[] = [
    {
      historyId: 'hist-001',
      offerId: 'offer-demo-499',
      action: 'SUBMIT',
      actionLabel: 'Tạo & Gửi duyệt Offer',
      actorName: 'Nguyễn Phương Anh',
      actorRole: 'Chuyên viên Tuyển dụng (Recruiter)',
      comment: 'Đã hoàn tất soạn thảo offer và lập văn bản giải trình lý do vượt dải chuẩn.',
      timestamp: '2026-10-15T08:00:00Z',
    },
    {
      historyId: 'hist-002',
      offerId: 'offer-demo-499',
      action: 'APPROVE',
      actionLabel: 'Phê duyệt Cấp 1 (Nhân sự)',
      actorName: 'Bà Nguyễn Thị Minh Thảo',
      actorRole: 'Trưởng phòng Nhân sự & Đào tạo',
      comment: 'Đã đối soát dải chuẩn. Đạt điều kiện trình duyệt đặc cách.',
      timestamp: '2026-10-15T09:30:00Z',
      stepOrder: 1,
      stepName: 'Thẩm định Chuyên môn & Khung ngân sách',
    },
    {
      historyId: 'hist-003',
      offerId: 'offer-demo-499',
      action: 'REQUEST_CHANGE',
      actionLabel: 'Yêu cầu chỉnh sửa điều khoản',
      actorName: 'Ông Trần Hoàng Long',
      actorRole: 'Giám đốc Khối Kỹ thuật & Công nghệ',
      comment: 'Đề xuất đàm phán giảm mức lương cứng xuống tối đa 42 triệu đồng.',
      timestamp: '2026-10-15T15:45:00Z',
      stepOrder: 2,
      stepName: 'Phê duyệt Khối Chuyên môn & Định biên',
    },
  ];

  const mockOfferApprovalDetails: OfferApprovalDetails = {
    offerId: 'offer-demo-499',
    offerCode: 'OFF-2026-4991',
    candidateId: 'cand-499-01',
    candidateName: 'Phạm Nhật Nam',
    candidateCode: 'UV-2026-4991',
    candidateEmail: 'nam.pham@gmail.com',
    candidatePhoneNumber: '0912 345 678',
    jobTitle: 'Senior Cloud DevOps Engineer',
    positionId: 'pos-devops-senior',
    jobLevel: 'Senior',
    departmentName: 'Phòng Hạ tầng & Cloud',
    offeredSalary: 45000000,
    allowanceAmount: 2000000,
    allowanceDescription: 'Phụ cấp ăn trưa và gửi xe',
    totalMonthlyCompensation: 47000000,
    expectedStartDate: '2026-11-15',
    responseDeadline: '2026-11-05',
    isSalaryOutOfRange: true,
    salaryComparisonStatus: 'ABOVE',
    outOfRangeReason: 'Ứng viên có chứng chỉ AWS DevOps Professional và 5 năm kinh nghiệm.',
    status: 'PENDING_APPROVAL',
    sendEmailToCandidate: true,
    createdAt: '2026-10-15T08:00:00Z',
    updatedAt: '2026-10-15T09:30:00Z',
    createdBy: 'Recruiter: Nguyễn Phương Anh',
    standardSalaryRange: {
      minimumSalary: 28000000,
      maximumSalary: 40000000,
      currencyCode: 'VND',
    },
    currentStepIndex: 1,
    approvalWorkflowChain: [
      {
        stepOrder: 1,
        stepName: 'Thẩm định Chuyên môn',
        approverRole: 'Trưởng phòng Nhân sự',
        approverName: 'Bà Nguyễn Thị Minh Thảo',
        status: 'APPROVED',
        isCurrentStep: false,
        reviewedAt: '2026-10-15T09:30:00Z',
        approvalComment: 'Đồng ý trình duyệt.',
      },
      {
        stepOrder: 2,
        stepName: 'Phê duyệt Khối Chuyên môn',
        approverRole: 'Giám đốc Khối',
        approverName: 'Ông Trần Hoàng Long',
        status: 'PENDING',
        isCurrentStep: true,
      },
    ],
    approvalHistoryTimeline: mockTimelineItems,
  };

  // =========================================================================
  // AC 1: Logic bắt buộc nhập ý kiến (Mandatory Comment)
  // =========================================================================
  describe('1. Logic bắt buộc nhập ý kiến khi từ chối hoặc yêu cầu sửa đổi (AC 1)', () => {
    it('hiển thị nhãn bắt buộc (*) khi thao tác ở chế độ REJECT hoặc REQUEST_CHANGE', () => {
      const rejectModalHtml = renderToString(
        <OfferApprovalModal
          isOpen={true}
          actionMode="REJECT"
          offerCode="OFF-2026-4991"
          candidateName="Phạm Nhật Nam"
          jobTitle="Senior Cloud DevOps Engineer"
          onConfirm={vi.fn()}
          onClose={vi.fn()}
        />
      );

      // Nhãn bắt buộc có dấu sao đỏ
      expect(rejectModalHtml).toContain('*');
      expect(rejectModalHtml).toContain('Bắt buộc nhập lý do từ chối');

      const requestChangeModalHtml = renderToString(
        <OfferApprovalModal
          isOpen={true}
          actionMode="REQUEST_CHANGE"
          offerCode="OFF-2026-4991"
          candidateName="Phạm Nhật Nam"
          jobTitle="Senior Cloud DevOps Engineer"
          onConfirm={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(requestChangeModalHtml).toContain('*');
      expect(requestChangeModalHtml).toContain('Bắt buộc nhập các nội dung cần sửa đổi');
    });

    it('không bắt buộc nhập nhận xét khi thao tác ở chế độ APPROVE (tùy chọn)', () => {
      const approveModalHtml = renderToString(
        <OfferApprovalModal
          isOpen={true}
          actionMode="APPROVE"
          offerCode="OFF-2026-4991"
          candidateName="Phạm Nhật Nam"
          jobTitle="Senior Cloud DevOps Engineer"
          onConfirm={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(approveModalHtml).toContain('tùy chọn');
    });
  });

  // =========================================================================
  // AC 2: Lịch sử phê duyệt (Approval History Timeline - Read-only)
  // =========================================================================
  describe('2. Dòng thời gian lịch sử phê duyệt bất biến (AC 2)', () => {
    it('render đầy đủ danh sách các node trong dòng thời gian lịch sử', () => {
      const timelineHtml = renderToString(
        <OfferApprovalHistoryTimeline timelineItems={mockTimelineItems} />
      );

      expect(timelineHtml).toContain('data-testid="approval-history-timeline-container"');
      expect(timelineHtml).toContain('data-testid="timeline-history-node-hist-001"');
      expect(timelineHtml).toContain('data-testid="timeline-history-node-hist-002"');
      expect(timelineHtml).toContain('data-testid="timeline-history-node-hist-003"');
    });

    it('mỗi node hiển thị đầy đủ: Tên người duyệt, Thao tác, Ý kiến nhận xét, và Thời gian xử lý', () => {
      const timelineHtml = renderToString(
        <OfferApprovalHistoryTimeline timelineItems={mockTimelineItems} />
      );

      // Node 1: Recruiter Submit
      expect(timelineHtml).toContain('Nguyễn Phương Anh');
      expect(timelineHtml).toContain('Tạo &amp; Gửi duyệt Offer');
      expect(timelineHtml).toContain(
        'Đã hoàn tất soạn thảo offer và lập văn bản giải trình lý do vượt dải chuẩn.'
      );

      // Node 2: HR Approve
      expect(timelineHtml).toContain('Bà Nguyễn Thị Minh Thảo');
      expect(timelineHtml).toContain('Phê duyệt Cấp 1 (Nhân sự)');
      expect(timelineHtml).toContain(
        'Đã đối soát dải chuẩn. Đạt điều kiện trình duyệt đặc cách.'
      );

      // Node 3: Director Request Change
      expect(timelineHtml).toContain('Ông Trần Hoàng Long');
      expect(timelineHtml).toContain('Yêu cầu chỉnh sửa điều khoản');
      expect(timelineHtml).toContain(
        'Đề xuất đàm phán giảm mức lương cứng xuống tối đa 42 triệu đồng.'
      );
    });

    it('HIỂN THỊ THÔNG BÁO KIỂM TOÁN VÀ KHÓA READ-ONLY BẢO MẬT', () => {
      const timelineHtml = renderToString(
        <OfferApprovalHistoryTimeline timelineItems={mockTimelineItems} />
      );

      expect(timelineHtml).toContain('data-testid="badge-timeline-readonly-lock"');
      expect(timelineHtml).toContain('Bản ghi bất biến (Read-only)');
      expect(timelineHtml).toContain('data-testid="timeline-readonly-audit-notice"');
      expect(timelineHtml).toContain('Lưu ý kiểm toán nội bộ (Audit Compliance)');
    });

    it('TUYỆT ĐỐI KHÔNG CUNG CẤP NÚT XÓA HOẶC NÚT SỬA TRÊN GIAO DIỆN TIMELINE (Read-only Compliance)', () => {
      const timelineHtml = renderToString(
        <OfferApprovalHistoryTimeline timelineItems={mockTimelineItems} />
      );

      // Không chứa bất kỳ class hoặc text nào đại diện cho thao tác edit/delete
      expect(timelineHtml).not.toContain('btn-edit-comment');
      expect(timelineHtml).not.toContain('btn-delete-comment');
      expect(timelineHtml).not.toContain('Chỉnh sửa nhận xét');
      expect(timelineHtml).not.toContain('Xóa nhận xét');
      expect(timelineHtml).not.toContain('Sửa ý kiến');
    });

    it('hiển thị trạng thái rỗng khi chưa có bản ghi lịch sử', () => {
      const emptyTimelineHtml = renderToString(
        <OfferApprovalHistoryTimeline timelineItems={[]} />
      );

      expect(emptyTimelineHtml).toContain('data-testid="timeline-empty-state"');
      expect(emptyTimelineHtml).toContain('Chưa có bản ghi lịch sử phê duyệt');
    });
  });

  // =========================================================================
  // Integration: OfferApprovalScreen tích hợp History Timeline
  // =========================================================================
  describe('3. Tích hợp History Timeline vào màn hình OfferApprovalScreen', () => {
    it('màn hình duyệt offer tự động render khối Lịch Sử Phê Duyệt & Ý Kiến Nhận Xét', () => {
      const screenHtml = renderToString(
        <OfferApprovalScreen offerDetails={mockOfferApprovalDetails} />
      );

      expect(screenHtml).toContain('data-testid="approval-history-timeline-container"');
      expect(screenHtml).toContain('Lịch Sử Phê Duyệt &amp; Ý Kiến Nhận Xét');
      expect(screenHtml).toContain('Bà Nguyễn Thị Minh Thảo');
      expect(screenHtml).toContain('Ông Trần Hoàng Long');
    });
  });

  // =========================================================================
  // Service Methods: Cập nhật dòng thời gian khi thao tác
  // =========================================================================
  describe('4. Tích hợp cập nhật Timeline khi Quản lý Duyệt, Từ chối, hoặc Yêu cầu sửa', () => {
    it('offerService.approveOffer bổ sung node phê duyệt vào approvalHistoryTimeline', async () => {
      const approvedResult = await offerService.approveOffer(
        'offer-demo-499',
        'Đồng ý mức đãi ngộ 45 triệu.'
      );

      expect(approvedResult.approvalHistoryTimeline).toBeDefined();
      const timeline = approvedResult.approvalHistoryTimeline!;
      const latestHistoryNode = timeline[timeline.length - 2];
      expect(latestHistoryNode.action).toBe('APPROVE');
      expect(latestHistoryNode.actorName).toBe('Ông Trần Hoàng Long');
      expect(latestHistoryNode.comment).toBe('Đồng ý mức đãi ngộ 45 triệu.');
    });

    it('offerService.rejectOffer bổ sung node từ chối vào approvalHistoryTimeline', async () => {
      const rejectedResult = await offerService.rejectOffer(
        'offer-demo-499',
        'Ngân sách quý này không cho phép vượt quá 40 triệu.'
      );

      expect(rejectedResult.approvalHistoryTimeline).toBeDefined();
      const timeline = rejectedResult.approvalHistoryTimeline!;
      const lastNode = timeline[timeline.length - 1];
      expect(lastNode.action).toBe('REJECT');
      expect(lastNode.actorName).toBe('Ông Trần Hoàng Long');
      expect(lastNode.comment).toBe('Ngân sách quý này không cho phép vượt quá 40 triệu.');
    });

    it('offerService.requestChangeOffer bổ sung node yêu cầu sửa vào approvalHistoryTimeline', async () => {
      const changeResult = await offerService.requestChangeOffer(
        'offer-demo-499',
        'Cần đàm phán giảm mức lương cứng xuống 40 triệu.'
      );

      expect(changeResult.approvalHistoryTimeline).toBeDefined();
      const timeline = changeResult.approvalHistoryTimeline!;
      const lastNode = timeline[timeline.length - 1];
      expect(lastNode.action).toBe('REQUEST_CHANGE');
      expect(lastNode.actorName).toBe('Ông Trần Hoàng Long');
      expect(lastNode.comment).toBe('Cần đàm phán giảm mức lương cứng xuống 40 triệu.');
    });
  });
});
