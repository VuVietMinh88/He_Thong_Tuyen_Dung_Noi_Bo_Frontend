/**
 * Định nghĩa kiểu dữ liệu cho Đề nghị tuyển dụng (Offer Management)
 * Jira Subtask: TKNHTTDNB1-491 - Thiết kế biểu mẫu soạn đề nghị tuyển dụng (Story TKNHTTDNB1-71)
 */

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

/**
 * Dữ liệu các trường nhập liệu trong biểu mẫu soạn đề nghị tuyển dụng
 */
export interface OfferFormValues {
  jobTitle: string;
  positionId?: string;
  offeredSalary: number;
  allowanceAmount: number;
  allowanceDescription?: string;
  expectedStartDate: string;
  responseDeadline: string;
  outOfRangeReason?: string;
  additionalNotes?: string;
  sendEmailToCandidate?: boolean;
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
  isSubmitting?: boolean;
  isSavingDraft?: boolean;
  onSubmitOffer?: (offerFormValues: OfferFormValues) => Promise<void> | void;
  onSaveDraft?: (offerFormValues: OfferFormValues) => Promise<void> | void;
  onCancel?: () => void;
  containerClassName?: string;
}
