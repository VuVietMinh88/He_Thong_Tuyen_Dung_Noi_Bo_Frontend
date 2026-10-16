/**
 * Service quản lý các thao tác với Đề nghị tuyển dụng (Offer Management Service)
 * Jira Task: TKNHTTDNB1-492 - Tích hợp xem trước và lưu offer nháp (Story TKNHTTDNB1-71)
 */

import axiosClient from '../utils/axiosClient';
import type {
  OfferFormValues,
  OfferRecord,
  ActiveOfferConflict,
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
};
