/**
 * Service quản lý các thao tác với Đề nghị tuyển dụng (Offer Management Service)
 * Jira Task: TKNHTTDNB1-492 - Tích hợp xem trước và lưu offer nháp (Story TKNHTTDNB1-71)
 */

import axiosClient from '../utils/axiosClient';
import type {
  OfferFormValues,
  OfferRecord,
  ActiveOfferConflict,
  OfferApprovalDetails,
  OfferApprovalStep,
} from '../types/offer';
import {
  evaluateSalaryAgainstRange,
  DEFAULT_STANDARD_POSITIONS,
} from '../utils/offerHelper';

const STORAGE_KEY_OFFERS = 'smart_recruit_offers_storage';

let inMemoryOffersList: OfferRecord[] = [];

/**
 * Trích xuất danh sách offers từ localStorage hoặc inMemory fallback
 */
const getStoredOffers = (): OfferRecord[] => {
  try {
    if (typeof localStorage !== 'undefined') {
      const rawData = localStorage.getItem(STORAGE_KEY_OFFERS);
      if (rawData) {
        return JSON.parse(rawData) as OfferRecord[];
      }
    }
    return inMemoryOffersList;
  } catch {
    return inMemoryOffersList;
  }
};

/**
 * Lưu danh sách offers vào localStorage và inMemory fallback
 */
const persistOffers = (offersList: OfferRecord[]): void => {
  inMemoryOffersList = [...offersList];
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(offersList));
    }
  } catch {
    // Bỏ qua lỗi lưu storage khi ở môi trường SSR
  }
};

export const offerService = {
  /**
   * Kiểm tra xem ứng viên có đề nghị tuyển dụng nào đang còn hiệu lực hay không
   * Một offer được coi là còn hiệu lực nếu đang ở trạng thái Chờ duyệt, Đã duyệt hoặc Đã gửi ứng viên
   */
  async checkActiveOfferConflict(candidateId: string): Promise<ActiveOfferConflict> {
    if (!candidateId) {
      return { hasActiveOffer: false };
    }

    try {
      // 1. Thử gọi API backend kiểm tra xung đột offer
      const apiResponse = await axiosClient.get<{
        hasActiveOffer: boolean;
        activeOffer?: OfferRecord;
        conflictMessage?: string;
      }>(`/candidates/${candidateId}/active-offer`);

      return apiResponse.data;
    } catch {
      // Khi API chưa sẵn sàng hoặc môi trường thử nghiệm: Kiểm tra từ mock storage
      const storedOffers = getStoredOffers();
      const matchingActiveOffer = storedOffers.find(
        (offerItem: OfferRecord) =>
          offerItem.candidateId === candidateId &&
          (offerItem.status === 'PENDING_APPROVAL' ||
            offerItem.status === 'APPROVED' ||
            offerItem.status === 'SENT_TO_CANDIDATE')
      );

      if (matchingActiveOffer) {
        return {
          hasActiveOffer: true,
          activeOffer: matchingActiveOffer,
          conflictMessage: `Ứng viên này đã có một đề nghị tuyển dụng đang còn hiệu lực (${matchingActiveOffer.offerCode} - Vị trí: ${matchingActiveOffer.jobTitle}). Vui lòng xử lý hoặc hủy offer hiện tại trước khi tạo đề nghị mới.`,
        };
      }

      return { hasActiveOffer: false };
    }
  },

  /**
   * Lưu nháp đề nghị tuyển dụng (Save Draft)
   * Cho phép lưu form mà không cần phải thỏa mãn toàn bộ validation bắt buộc
   */
  async saveOfferDraft(
    candidateId: string,
    formValues: Partial<OfferFormValues>
  ): Promise<OfferRecord> {
    const currentTimestamp = new Date().toISOString();
    const generatedOfferCode = `OFF-DRAFT-${Date.now().toString().slice(-6)}`;

    const draftRecord: OfferRecord = {
      offerId: `offer-${Date.now()}`,
      offerCode: generatedOfferCode,
      candidateId,
      candidateName: 'Ứng viên',
      jobTitle: formValues.jobTitle || 'Chức danh chưa đặt',
      positionId: formValues.positionId,
      offeredSalary: Number(formValues.offeredSalary) || 0,
      allowanceAmount: Number(formValues.allowanceAmount) || 0,
      allowanceDescription: formValues.allowanceDescription || '',
      totalMonthlyCompensation:
        (Number(formValues.offeredSalary) || 0) +
        (Number(formValues.allowanceAmount) || 0),
      expectedStartDate: formValues.expectedStartDate || '',
      responseDeadline: formValues.responseDeadline || '',
      outOfRangeReason: formValues.outOfRangeReason || '',
      isSalaryOutOfRange: false,
      salaryComparisonStatus: 'WITHIN',
      status: 'DRAFT',
      additionalNotes: formValues.additionalNotes || '',
      sendEmailToCandidate: formValues.sendEmailToCandidate ?? true,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };

    try {
      // Thử gọi endpoint lưu nháp trên server
      const apiResponse = await axiosClient.post<OfferRecord>(
        '/offers/draft',
        draftRecord
      );
      return apiResponse.data;
    } catch {
      // Fallback lưu vào storage khi backend mock
      const storedOffers = getStoredOffers();
      const existingDraftIndex = storedOffers.findIndex(
        (offerItem: OfferRecord) =>
          offerItem.candidateId === candidateId && offerItem.status === 'DRAFT'
      );

      if (existingDraftIndex >= 0) {
        storedOffers[existingDraftIndex] = {
          ...storedOffers[existingDraftIndex],
          ...draftRecord,
          offerId: storedOffers[existingDraftIndex].offerId,
          offerCode: storedOffers[existingDraftIndex].offerCode,
          updatedAt: currentTimestamp,
        };
      } else {
        storedOffers.push(draftRecord);
      }

      persistOffers(storedOffers);
      return draftRecord;
    }
  },

  /**
   * Gửi duyệt đề nghị tuyển dụng (Submit for Approval)
   * Kiểm tra validation chặt chẽ và chặn nếu ứng viên đã có offer đang còn hiệu lực
   */
  async submitOfferForApproval(
    candidateId: string,
    formValues: OfferFormValues
  ): Promise<OfferRecord> {
    // 1. Kiểm tra dải lương chuẩn của chức danh để xác minh lý do vượt khung
    const matchingPosition = DEFAULT_STANDARD_POSITIONS.find(
      (positionOption) => positionOption.positionId === formValues.positionId
    );

    const salaryEvaluation = evaluateSalaryAgainstRange(
      Number(formValues.offeredSalary) || 0,
      matchingPosition?.standardSalaryRange
    );

    // Chặn gửi duyệt nếu lương nằm ngoài dải chuẩn nhưng thiếu lý do giải trình
    if (
      salaryEvaluation.isSalaryOutOfRange &&
      (!formValues.outOfRangeReason ||
        formValues.outOfRangeReason.trim().length < 10)
    ) {
      const validationError = new Error(
        'Mức lương nằm ngoài dải chuẩn. Bắt buộc nhập lý do giải trình vượt khung tối thiểu 10 ký tự trước khi gửi duyệt.'
      );
      (validationError as unknown as { statusCode: number }).statusCode = 400;
      throw validationError;
    }

    // 2. Kiểm tra xung đột offer còn hiệu lực của ứng viên
    const conflictResult = await this.checkActiveOfferConflict(candidateId);
    if (conflictResult.hasActiveOffer) {
      // Giả lập lỗi HTTP 409 Conflict chuẩn từ backend
      const conflictError = new Error(
        conflictResult.conflictMessage ||
          'Ứng viên đã có một đề nghị tuyển dụng đang còn hiệu lực. Không thể tạo thêm offer mới.'
      );
      (conflictError as unknown as { response: { status: number; data: unknown } }).response = {
        status: 409,
        data: {
          code: 'OFFER_CONFLICT',
          message:
            conflictResult.conflictMessage ||
            'Ứng viên đã có một đề nghị tuyển dụng đang còn hiệu lực.',
        },
      };
      (conflictError as unknown as { statusCode: number }).statusCode = 409;
      throw conflictError;
    }

    const currentTimestamp = new Date().toISOString();
    const generatedOfferCode = `OFF-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    const submittedRecord: OfferRecord = {
      offerId: `offer-${Date.now()}`,
      offerCode: generatedOfferCode,
      candidateId,
      candidateName: 'Ứng viên',
      jobTitle: formValues.jobTitle,
      positionId: formValues.positionId,
      jobLevel: matchingPosition?.jobLevel,
      departmentName: matchingPosition?.departmentName,
      offeredSalary: Number(formValues.offeredSalary) || 0,
      allowanceAmount: Number(formValues.allowanceAmount) || 0,
      allowanceDescription: formValues.allowanceDescription || '',
      totalMonthlyCompensation:
        (Number(formValues.offeredSalary) || 0) +
        (Number(formValues.allowanceAmount) || 0),
      expectedStartDate: formValues.expectedStartDate,
      responseDeadline: formValues.responseDeadline,
      outOfRangeReason: formValues.outOfRangeReason || '',
      isSalaryOutOfRange: salaryEvaluation.isSalaryOutOfRange,
      salaryComparisonStatus: salaryEvaluation.comparisonStatus,
      status: 'PENDING_APPROVAL',
      additionalNotes: formValues.additionalNotes || '',
      sendEmailToCandidate: formValues.sendEmailToCandidate ?? true,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };

    try {
      const apiResponse = await axiosClient.post<OfferRecord>(
        '/offers/submit-for-approval',
        submittedRecord
      );
      return apiResponse.data;
    } catch (apiError: unknown) {
      // Nếu là lỗi conflict từ server (status 409), rethrow ngay để UI bắt và hiển thị thông báo
      const statusCode =
        (apiError as { response?: { status?: number } })?.response?.status ||
        (apiError as { statusCode?: number })?.statusCode;

      if (statusCode === 409) {
        throw apiError;
      }

      // Lưu vào storage khi fallback
      const storedOffers = getStoredOffers();
      storedOffers.push(submittedRecord);
      persistOffers(storedOffers);
      return submittedRecord;
    }
  },

  /**
   * Xóa hoặc hủy bỏ đề nghị tuyển dụng đang có hiệu lực (phục vụ test và xử lý trùng offer)
   */
  async cancelOffer(offerId: string, cancelReason?: string): Promise<OfferRecord | null> {
    const storedOffers = getStoredOffers();
    const targetIndex = storedOffers.findIndex(
      (offerItem: OfferRecord) => offerItem.offerId === offerId
    );

    if (targetIndex >= 0) {
      storedOffers[targetIndex].status = 'CANCELLED';
      storedOffers[targetIndex].additionalNotes = `Hủy offer: ${cancelReason || 'Người tuyển dụng hủy'}`;
      persistOffers(storedOffers);
      return storedOffers[targetIndex];
    }
    return null;
  },

  /**
   * Giả lập thêm một offer đang còn hiệu lực cho ứng viên (phục vụ viết test kiểm tra trùng)
   */
  seedActiveOfferForCandidate(
    candidateId: string,
    candidateName: string,
    jobTitle: string
  ): OfferRecord {
    const activeOfferRecord: OfferRecord = {
      offerId: `offer-seed-${candidateId}`,
      offerCode: `OFF-ACTIVE-2026`,
      candidateId,
      candidateName,
      jobTitle,
      offeredSalary: 35000000,
      allowanceAmount: 2000000,
      totalMonthlyCompensation: 37000000,
      expectedStartDate: '2026-11-20',
      responseDeadline: '2026-11-10',
      isSalaryOutOfRange: false,
      salaryComparisonStatus: 'WITHIN',
      status: 'PENDING_APPROVAL',
      sendEmailToCandidate: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const storedOffers = getStoredOffers().filter(
      (offerItem) => offerItem.candidateId !== candidateId
    );
    storedOffers.push(activeOfferRecord);
    persistOffers(storedOffers);

    return activeOfferRecord;
  },

  /**
   * Xóa toàn bộ dữ liệu mock offers trong storage
   */
  clearStoredOffers(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_OFFERS);
    } catch {
      // Bỏ qua lỗi dọn dẹp storage
    }
  },

  /**
   * Khởi tạo chuỗi duyệt mẫu (Approval Chain) cho đề nghị tuyển dụng
   */
  createDefaultApprovalWorkflowChain(
    isSalaryOutOfRange: boolean,
    currentStatus: OfferRecord['status'] = 'PENDING_APPROVAL'
  ): OfferApprovalStep[] {
    const isApproved = currentStatus === 'APPROVED';
    const isRejected = currentStatus === 'REJECTED';

    return [
      {
        stepOrder: 1,
        stepName: 'Thẩm định Chuyên môn & Khung ngân sách',
        approverRole: 'Trưởng phòng Nhân sự & Đào tạo',
        approverName: 'Bà Nguyễn Thị Minh Thảo',
        approverAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
        approverEmail: 'thao.nguyen@smartrecruit.vn',
        status: 'APPROVED',
        isCurrentStep: false,
        reviewedAt: '2026-10-15T09:30:00Z',
        approvalComment: isSalaryOutOfRange
          ? 'Đã đối soát dải chuẩn. Mức lương vượt khung đã có giải trình từ Recruiter. Hồ sơ năng lực ứng viên xuất sắc, phù hợp đề xuất đặc cách.'
          : 'Hồ sơ tuyển dụng đầy đủ, mức lương nằm trong dải chuẩn được phê duyệt.',
      },
      {
        stepOrder: 2,
        stepName: 'Phê duyệt Khối Chuyên môn & Định biên',
        approverRole: 'Giám đốc Khối Kỹ thuật & Công nghệ',
        approverName: 'Ông Trần Hoàng Long',
        approverAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
        approverEmail: 'long.tran@smartrecruit.vn',
        status: isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : 'PENDING',
        isCurrentStep: !isApproved && !isRejected,
        reviewedAt: isApproved ? '2026-10-16T14:15:00Z' : undefined,
        approvalComment: isApproved ? 'Đồng ý duyệt mức đãi ngộ chuyên môn.' : undefined,
      },
      {
        stepOrder: 3,
        stepName: 'Phê duyệt Điều hành Cấp cao (BOD/CEO)',
        approverRole: 'Tổng Giám Đốc Điều Hành (CEO)',
        approverName: 'Ông Lê Quốc Khánh',
        approverAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
        approverEmail: 'khanh.le@smartrecruit.vn',
        status: isApproved ? 'APPROVED' : 'WAITING',
        isCurrentStep: false,
        reviewedAt: isApproved ? '2026-10-16T17:00:00Z' : undefined,
        approvalComment: isApproved ? 'Thông qua đề nghị tuyển dụng chính thức.' : undefined,
      },
    ];
  },

  /**
   * Lấy chi tiết đề nghị tuyển dụng phục vụ màn hình phê duyệt của cấp quản lý
   */
  async getOfferApprovalDetails(offerId: string): Promise<OfferApprovalDetails> {
    try {
      const apiResponse = await axiosClient.get<OfferApprovalDetails>(
        `/offers/${offerId}/approval-details`
      );
      return apiResponse.data;
    } catch {
      // Fallback lấy từ stored offers hoặc tạo dữ liệu mẫu nếu chưa có
      const storedOffers = getStoredOffers();
      const existingRecord = storedOffers.find(
        (recordItem) => recordItem.offerId === offerId || recordItem.offerCode === offerId
      );

      const matchingPosition = DEFAULT_STANDARD_POSITIONS.find(
        (positionItem) => positionItem.positionId === existingRecord?.positionId
      ) || DEFAULT_STANDARD_POSITIONS[0];

      const baseOffer: OfferRecord = existingRecord || {
        offerId: offerId || 'offer-demo-001',
        offerCode: 'OFF-2026-8899',
        candidateId: 'cand-tran-minh-duc',
        candidateName: 'Trần Minh Đức',
        candidateCode: 'UNG-VIEN-2026-08',
        candidateEmail: 'duc.tran.dev@gmail.com',
        candidatePhoneNumber: '0988 123 456',
        jobTitle: matchingPosition.positionTitle,
        positionId: matchingPosition.positionId,
        jobLevel: matchingPosition.jobLevel,
        departmentName: matchingPosition.departmentName,
        offeredSalary: 48000000,
        allowanceAmount: 2500000,
        allowanceDescription: 'Phụ cấp ăn trưa, gửi xe và trợ cấp điện thoại di động',
        totalMonthlyCompensation: 50500000,
        expectedStartDate: '2026-11-15',
        responseDeadline: '2026-11-05',
        isSalaryOutOfRange: true,
        salaryComparisonStatus: 'ABOVE',
        outOfRangeReason:
          'Ứng viên có 6 năm kinh nghiệm chuyên sâu với Microservices, React 19 và Cloud Native AWS. Đã từng giữ vị trí Senior Fullstack tại tập đoàn công nghệ lớn, có chứng chỉ AWS Solutions Architect Professional và đạt 94% điểm đánh giá kỹ năng chuyên môn ở vòng phỏng vấn kỹ thuật.',
        status: 'PENDING_APPROVAL',
        sendEmailToCandidate: true,
        createdAt: '2026-10-15T08:00:00Z',
        updatedAt: '2026-10-15T09:30:00Z',
        createdBy: 'Recruiter: Nguyễn Phương Anh (HR Specialist)',
      };

      const workflowChain = this.createDefaultApprovalWorkflowChain(
        baseOffer.isSalaryOutOfRange,
        baseOffer.status
      );

      return {
        ...baseOffer,
        standardSalaryRange: matchingPosition.standardSalaryRange,
        approvalWorkflowChain: workflowChain,
        currentStepIndex: 1, // Bước 2 đang chờ xử lý
        recruiterNote: 'Đề xuất ký hợp đồng lao động chính thức 12 tháng sau 2 tháng thử việc hưởng 100% lương.',
        candidateSummary: {
          yearsOfExperience: 6,
          highestEducation: 'Kỹ sư CNTT - Đại học Bách Khoa Hà Nội',
          interviewScore: 9.4,
          matchingScore: 94,
        },
      };
    }
  },

  /**
   * Quản lý phê duyệt đề nghị tuyển dụng (Approve)
   */
  async approveOffer(
    offerId: string,
    approvalComment: string
  ): Promise<OfferApprovalDetails> {
    try {
      const apiResponse = await axiosClient.post<OfferApprovalDetails>(
        `/offers/${offerId}/approve`,
        { approvalComment }
      );
      return apiResponse.data;
    } catch {
      const approvalDetails = await this.getOfferApprovalDetails(offerId);
      const currentTimestamp = new Date().toISOString();

      // Cập nhật trạng thái bước hiện tại sang APPROVED
      const updatedWorkflowChain = approvalDetails.approvalWorkflowChain.map(
        (stepItem) => {
          if (stepItem.isCurrentStep) {
            return {
              ...stepItem,
              status: 'APPROVED' as const,
              isCurrentStep: false,
              reviewedAt: currentTimestamp,
              approvalComment,
            };
          }
          if (stepItem.stepOrder === 3) {
            return {
              ...stepItem,
              status: 'APPROVED' as const,
              reviewedAt: currentTimestamp,
              approvalComment: 'Ban Giám đốc đã thông qua đề xuất phê duyệt.',
            };
          }
          return stepItem;
        }
      );

      const updatedDetails: OfferApprovalDetails = {
        ...approvalDetails,
        status: 'APPROVED',
        updatedAt: currentTimestamp,
        approvalWorkflowChain: updatedWorkflowChain,
        currentStepIndex: 2,
      };

      // Đồng bộ vào stored offers
      const storedOffers = getStoredOffers();
      const existingOfferIndex = storedOffers.findIndex(
        (offerItem) => offerItem.offerId === offerId
      );
      if (existingOfferIndex >= 0) {
        storedOffers[existingOfferIndex].status = 'APPROVED';
        storedOffers[existingOfferIndex].updatedAt = currentTimestamp;
        persistOffers(storedOffers);
      }

      return updatedDetails;
    }
  },

  /**
   * Quản lý từ chối đề nghị tuyển dụng (Reject)
   */
  async rejectOffer(
    offerId: string,
    rejectionReason: string
  ): Promise<OfferApprovalDetails> {
    try {
      const apiResponse = await axiosClient.post<OfferApprovalDetails>(
        `/offers/${offerId}/reject`,
        { rejectionReason }
      );
      return apiResponse.data;
    } catch {
      const approvalDetails = await this.getOfferApprovalDetails(offerId);
      const currentTimestamp = new Date().toISOString();

      const updatedWorkflowChain = approvalDetails.approvalWorkflowChain.map(
        (stepItem) => {
          if (stepItem.isCurrentStep) {
            return {
              ...stepItem,
              status: 'REJECTED' as const,
              isCurrentStep: false,
              reviewedAt: currentTimestamp,
              approvalComment: `Từ chối duyệt: ${rejectionReason}`,
            };
          }
          if (stepItem.stepOrder > 2) {
            return {
              ...stepItem,
              status: 'WAITING' as const,
              isCurrentStep: false,
            };
          }
          return stepItem;
        }
      );

      const updatedDetails: OfferApprovalDetails = {
        ...approvalDetails,
        status: 'REJECTED',
        updatedAt: currentTimestamp,
        approvalWorkflowChain: updatedWorkflowChain,
      };

      const storedOffers = getStoredOffers();
      const existingOfferIndex = storedOffers.findIndex(
        (offerItem) => offerItem.offerId === offerId
      );
      if (existingOfferIndex >= 0) {
        storedOffers[existingOfferIndex].status = 'REJECTED';
        storedOffers[existingOfferIndex].updatedAt = currentTimestamp;
        persistOffers(storedOffers);
      }

      return updatedDetails;
    }
  },

  /**
   * Quản lý yêu cầu chỉnh sửa đề nghị tuyển dụng (Request Change)
   */
  async requestChangeOffer(
    offerId: string,
    changeRequestDetails: string
  ): Promise<OfferApprovalDetails> {
    try {
      const apiResponse = await axiosClient.post<OfferApprovalDetails>(
        `/offers/${offerId}/request-change`,
        { changeRequestDetails }
      );
      return apiResponse.data;
    } catch {
      const approvalDetails = await this.getOfferApprovalDetails(offerId);
      const currentTimestamp = new Date().toISOString();

      const updatedWorkflowChain = approvalDetails.approvalWorkflowChain.map(
        (stepItem) => {
          if (stepItem.isCurrentStep) {
            return {
              ...stepItem,
              status: 'REQUEST_CHANGE' as const,
              isCurrentStep: false,
              reviewedAt: currentTimestamp,
              changeRequestDetails,
              approvalComment: `Yêu cầu chỉnh sửa: ${changeRequestDetails}`,
            };
          }
          return stepItem;
        }
      );

      const updatedDetails: OfferApprovalDetails = {
        ...approvalDetails,
        status: 'PENDING_APPROVAL',
        updatedAt: currentTimestamp,
        approvalWorkflowChain: updatedWorkflowChain,
      };

      return updatedDetails;
    }
  },
};

