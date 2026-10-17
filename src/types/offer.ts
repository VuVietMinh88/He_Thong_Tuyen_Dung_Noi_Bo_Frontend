/**
 * Định nghĩa kiểu dữ liệu cho Đề nghị tuyển dụng (Offer Management)
 * Jira Subtask: TKNHTTDNB1-491 & TKNHTTDNB1-492 (Story TKNHTTDNB1-71)
 */

/**
 * Trạng thái của một đề nghị tuyển dụng trong quy trình
 */
export type OfferStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'SENT_TO_CANDIDATE'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'CANCELLED';

/**
 * Trạng thái so sánh mức lương đề xuất với dải lương chuẩn của vị trí
 */
export type SalaryComparisonStatus = 'WITHIN' | 'ABOVE' | 'BELOW' | 'UNKNOWN';

/**
 * Cấu trúc dải lương chuẩn của một chức danh / vị trí
 */
export interface StandardSalaryRange {
  minimumSalary: number;
  maximumSalary: number;
  currencyCode?: string;
}

/**
 * Kết quả phân tích đối chiếu mức lương với dải lương chuẩn
 */
export interface SalaryComparisonResult {
  comparisonStatus: SalaryComparisonStatus;
  isSalaryOutOfRange: boolean;
  alertMessage: string;
  differenceAmount: number;
  differencePercentage: number;
  formattedMinimumSalary: string;
  formattedMaximumSalary: string;
}

/**
 * Tùy chọn chức danh kèm dải lương chuẩn để người tuyển dụng lựa chọn
 */
export interface JobPositionOption {
  positionId: string;
  positionCode: string;
  positionTitle: string;
  departmentName: string;
  jobLevel: string;
  standardSalaryRange: StandardSalaryRange;
  isActive?: boolean;
}

import { z } from 'zod/v3';

/**
 * Zod validation schema chuẩn cho các trường nhập liệu biểu mẫu soạn đề nghị tuyển dụng
 * Đảm bảo đồng bộ 100% giữa Zod Schema và kiểu dữ liệu Form
 */
export const offerFormSchema = z.object({
  jobTitle: z
    .string({
      required_error: 'Vui lòng chọn hoặc nhập chức danh tuyển dụng.',
      invalid_type_error: 'Chức danh không hợp lệ.',
    })
    .trim()
    .min(1, 'Vui lòng chọn hoặc nhập chức danh tuyển dụng.'),
  positionId: z.string().optional(),
  offeredSalary: z
    .number({
      required_error: 'Vui lòng nhập mức lương cơ bản.',
      invalid_type_error: 'Vui lòng nhập mức lương bằng số hợp lệ.',
    })
    .min(1000000, 'Mức lương cơ bản tối thiểu phải từ 1.000.000 ₫ trở lên.'),
  allowanceAmount: z
    .number({
      required_error: 'Vui lòng nhập số tiền phụ cấp hợp lệ.',
      invalid_type_error: 'Vui lòng nhập số tiền phụ cấp hợp lệ.',
    })
    .min(0, 'Số tiền phụ cấp không được là số âm.'),
  allowanceDescription: z.string().optional(),
  expectedStartDate: z
    .string({
      required_error: 'Vui lòng chọn ngày dự kiến nhận việc của ứng viên.',
      invalid_type_error: 'Ngày dự kiến nhận việc không hợp lệ.',
    })
    .min(1, 'Vui lòng chọn ngày dự kiến nhận việc của ứng viên.'),
  responseDeadline: z
    .string({
      required_error: 'Vui lòng chọn hạn chót phản hồi đề nghị tuyển dụng.',
      invalid_type_error: 'Hạn chót phản hồi không hợp lệ.',
    })
    .min(1, 'Vui lòng chọn hạn chót phản hồi đề nghị tuyển dụng.'),
  outOfRangeReason: z.string().optional(),
  additionalNotes: z.string().optional(),
  sendEmailToCandidate: z.boolean().optional(),
});

/**
 * Kiểu dữ liệu các trường trong biểu mẫu được tự động sinh (inferred) từ Zod Schema
 * Tránh hoàn toàn lỗi lệch kiểu (type mismatch) giữa form values và zodResolver
 */
export type OfferFormValues = z.infer<typeof offerFormSchema>;

/**
 * Thông tin bản ghi đề nghị tuyển dụng đã được lưu trữ trong hệ thống
 */
export interface OfferRecord {
  offerId: string;
  offerCode: string;
  candidateId: string;
  candidateName: string;
  candidateCode?: string;
  candidateEmail?: string;
  candidatePhoneNumber?: string;
  jobTitle: string;
  positionId?: string;
  jobLevel?: string;
  departmentName?: string;
  offeredSalary: number;
  allowanceAmount: number;
  allowanceDescription?: string;
  totalMonthlyCompensation: number;
  expectedStartDate: string;
  responseDeadline: string;
  outOfRangeReason?: string;
  isSalaryOutOfRange: boolean;
  salaryComparisonStatus: SalaryComparisonStatus;
  status: OfferStatus;
  additionalNotes?: string;
  sendEmailToCandidate: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

/**
 * Thông tin kiểm tra xung đột đề nghị tuyển dụng đang còn hiệu lực
 */
export interface ActiveOfferConflict {
  hasActiveOffer: boolean;
  activeOffer?: OfferRecord;
  conflictMessage?: string;
}

/**
 * Cấu trúc nội dung chuẩn bị cho bản xem trước thư mời nhận việc (Offer Letter Preview)
 */
export interface OfferPreviewContent {
  letterTitle: string;
  letterReferenceNumber: string;
  issuedDateFormatted: string;
  companyName: string;
  companyAddress: string;
  candidateName: string;
  candidateCode?: string;
  candidateEmail?: string;
  candidatePhoneNumber?: string;
  jobTitle: string;
  jobLevel?: string;
  departmentName?: string;
  offeredSalaryFormatted: string;
  offeredSalaryInWords: string;
  allowanceAmountFormatted: string;
  allowanceDescription?: string;
  totalMonthlyCompensationFormatted: string;
  standardSalaryRangeFormatted: string;
  isSalaryOutOfRange: boolean;
  outOfRangeReason?: string;
  expectedStartDateFormatted: string;
  responseDeadlineFormatted: string;
  additionalNotes?: string;
}

/**
 * Props cho component biểu mẫu soạn thảo Offer
 */
export interface OfferDraftFormProps {
  candidateId?: string;
  candidateName?: string;
  candidateCode?: string;
  candidateEmail?: string;
  candidatePhoneNumber?: string;
  expectedCandidateSalary?: number;
  initialJobTitle?: string;
  initialPositionId?: string;
  initialOfferedSalary?: number;
  initialAllowanceAmount?: number;
  initialAllowanceDescription?: string;
  initialExpectedStartDate?: string;
  initialResponseDeadline?: string;
  initialOutOfRangeReason?: string;
  initialAdditionalNotes?: string;
  availablePositions?: JobPositionOption[];
  existingActiveOffer?: OfferRecord | null;
  isSubmitting?: boolean;
  isSavingDraft?: boolean;
  onSubmitOffer?: (offerFormValues: OfferFormValues) => Promise<void> | void;
  onSaveDraft?: (offerFormValues: Partial<OfferFormValues>) => Promise<void> | void;
  onPreviewOffer?: (offerFormValues: OfferFormValues) => void;
  onSubmitSuccess?: (offerRecord: OfferRecord) => void;
  onCancel?: () => void;
  containerClassName?: string;
}

/**
 * Trạng thái của từng bước trong chuỗi phê duyệt offer
 */
export type ApprovalStepStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REQUEST_CHANGE'
  | 'WAITING';

/**
 * Các loại hành động phê duyệt của người quản lý
 */
export type OfferApprovalActionType = 'APPROVE' | 'REJECT' | 'REQUEST_CHANGE';

/**
 * Cấu trúc thông tin của một bước trong chuỗi duyệt đề nghị tuyển dụng
 */
export interface OfferApprovalStep {
  stepOrder: number;
  stepName: string;
  approverRole: string;
  approverName: string;
  approverAvatar?: string;
  approverEmail?: string;
  status: ApprovalStepStatus;
  isCurrentStep: boolean;
  reviewedAt?: string;
  approvalComment?: string;
  changeRequestDetails?: string;
}

/**
 * Các loại hành động được ghi nhận trong dòng thời gian lịch sử phê duyệt
 * Jira Subtask: TKNHTTDNB1-499 - Tích hợp nhận xét và lịch sử phê duyệt offer (Story TKNHTTDNB1-72)
 */
export type OfferApprovalHistoryAction =
  | 'SUBMIT'
  | 'APPROVE'
  | 'REJECT'
  | 'REQUEST_CHANGE';

/**
 * Cấu trúc một node bản ghi trong dòng thời gian lịch sử phê duyệt
 * KHỐI DỮ LIỆU NÀY LÀ BẤT BIẾN (IMMUTABLE / READ-ONLY) để phục vụ kiểm toán nội bộ và lưu vết pháp lý
 */
export interface OfferApprovalHistoryItem {
  historyId: string;
  offerId: string;
  action: OfferApprovalHistoryAction;
  actionLabel: string;
  actorName: string;
  actorRole: string;
  actorAvatar?: string;
  actorEmail?: string;
  comment: string;
  timestamp: string;
  stepOrder?: number;
  stepName?: string;
}

/**
 * Dữ liệu chi tiết cho màn hình phê duyệt đề nghị tuyển dụng (Offer Approval Details)
 * Jira Subtask: TKNHTTDNB1-498 & TKNHTTDNB1-499 (Story TKNHTTDNB1-72)
 */
export interface OfferApprovalDetails extends OfferRecord {
  standardSalaryRange?: StandardSalaryRange;
  approvalWorkflowChain: OfferApprovalStep[];
  approvalHistoryTimeline?: OfferApprovalHistoryItem[];
  currentStepIndex: number;
  recruiterNote?: string;
  candidateSummary?: {
    yearsOfExperience?: number;
    highestEducation?: string;
    interviewScore?: number;
    matchingScore?: number;
  };
}

/**
 * Props cho component màn hình phê duyệt Offer
 */
export interface OfferApprovalScreenProps {
  offerDetails?: OfferApprovalDetails;
  offerId?: string;
  isLoading?: boolean;
  onApprove?: (offerId: string, comment: string) => Promise<void> | void;
  onReject?: (offerId: string, reason: string) => Promise<void> | void;
  onRequestChange?: (offerId: string, changeDetails: string) => Promise<void> | void;
  onBack?: () => void;
  onViewOfferLetter?: () => void;
  readOnly?: boolean;
  containerClassName?: string;
}

