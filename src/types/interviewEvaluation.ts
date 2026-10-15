/**
 * Kiểu dữ liệu và hằng số cho Phiếu đánh giá năng lực phỏng vấn
 * Subtask TKNHTTDNB1-457 / Story TKNHTTDNB1-65
 */

export interface EvaluationCriterionItem {
  id: string;
  name: string;
  description?: string | null;
  weight: number; // Trọng số (%) từ 1 đến 100
  sortOrder?: number;
}

export type CriterionScoreValue = 1 | 2 | 3 | 4 | 5;

export interface CriterionEvaluationRecord {
  criterionId: string;
  criterionName: string;
  weight: number;
  score: number | null; // Cho phép số để validate khoảng 1-5
  comment: string;
}

export interface EvaluationValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  firstInvalidCriterionId?: string;
}

export interface CriterionContributionDetail {
  criterionId: string;
  criterionName: string;
  score: number | null;
  criteriaWeight: number;
  weightedScore: number | null;
}

export interface InterviewEvaluationHeaderData {
  candidateName: string;
  candidateEmail?: string;
  jobTitle: string;
  interviewRound: string; // Tên vòng phỏng vấn (ví dụ: Vòng Chuyên môn & Kỹ thuật)
  interviewDate?: string; // Định dạng YYYY-MM-DD
  interviewTime?: string; // Định dạng HH:mm
  interviewFormat?: 'ONLINE' | 'OFFLINE';
  locationOrLink?: string;
  interviewerNames?: string[];
  frameworkName: string; // Tên khung năng lực (ví dụ: Khung năng lực Frontend Lead)
  frameworkCode?: string; // Mã khung năng lực (ví dụ: CF-FE-2026)
  frameworkVersion?: string; // Phiên bản khung năng lực (ví dụ: v1.0, v2.1)
}

export interface RatingLevelDefinition {
  score: CriterionScoreValue;
  label: string;
  shortLabel: string;
  description: string;
  activeBadgeClass: string;
  activeButtonClass: string;
}

export type InterviewConclusion = 'RECOMMENDED' | 'CONSIDER' | 'NOT_RECOMMENDED';

export interface ConclusionOptionConfig {
  key: InterviewConclusion;
  label: string;
  shortLabel: string;
  description: string;
  activeButtonClass: string;
  activeBadgeClass: string;
  idleButtonClass: string;
  badgeClass: string;
}

export interface InterviewEvaluationFormValues {
  criteriaEvaluations: Record<string, CriterionEvaluationRecord>;
  generalNotes?: string;
  conclusion?: InterviewConclusion | null;
  isLocked?: boolean;
}

export interface InterviewEvaluationSubmitData {
  criteriaEvaluations: Record<string, CriterionEvaluationRecord>;
  calculatedTotalScore: number | null;
  generalNotes: string;
  conclusion: InterviewConclusion;
  isLocked: boolean;
  submittedAt: string;
}

export interface InterviewEvaluationAccessParams {
  isAuthorized?: boolean;
  currentUserId?: string;
  currentUserEmail?: string;
  interviewerIds?: string[];
  interviewerEmails?: string[];
  interviewers?: Array<{ id: string; email?: string; name?: string }>;
}

/**
 * Bản ghi đánh giá năng lực của các thành viên khác trong Hội đồng phỏng vấn (AC 2 - TKNHTTDNB1-465)
 */
export interface PeerInterviewerEvaluation {
  interviewerId: string;
  interviewerName: string;
  interviewerRole?: string;
  interviewerEmail?: string;
  avatarUrl?: string;
  isSubmitted: boolean;
  submittedAt?: string;
  calculatedTotalScore?: number | null;
  conclusion?: InterviewConclusion | null;
  generalNotes?: string;
  criteriaScores?: Record<string, number | null>;
}

/**
 * Trạng thái cho phép mở lại phiếu đánh giá trong thời hạn 24 giờ (AC 1 - TKNHTTDNB1-465)
 */
export interface ReopenEvaluationStatus {
  canReopen: boolean;
  isExpired: boolean;
  timeRemainingFormatted: string;
  remainingMs: number;
  hoursRemaining: number;
  minutesRemaining: number;
  deadlineTimestamp?: string;
}

export interface ReopenEvaluationPayload {
  evaluationId?: string;
  candidateId?: string;
  reason?: string;
  reopenedByUserId?: string;
  reopenedByUserName?: string;
}

/**
 * Định nghĩa 5 mức điểm đánh giá năng lực phỏng vấn chuẩn hóa
 * Giúp người phỏng vấn nắm rõ tiêu chuẩn khi chấm điểm từ 1 đến 5
 */
export const RATING_LEVEL_DEFINITIONS: Record<CriterionScoreValue, RatingLevelDefinition> = {
  1: {
    score: 1,
    label: 'Chưa đạt / Rất kém',
    shortLabel: 'Chưa đạt',
    description: 'Chưa đáp ứng được yêu cầu tối thiểu của tiêu chí, thiếu kiến thức/kỹ năng nền tảng.',
    activeBadgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    activeButtonClass: 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-200',
  },
  2: {
    score: 2,
    label: 'Dưới kỳ vọng',
    shortLabel: 'Dưới kỳ vọng',
    description: 'Đáp ứng một phần nhỏ nhưng còn thiếu sót nhiều, cần sự hướng dẫn sát sao nếu tuyển dụng.',
    activeBadgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    activeButtonClass: 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-200',
  },
  3: {
    score: 3,
    label: 'Đạt yêu cầu',
    shortLabel: 'Đạt yêu cầu',
    description: 'Đáp ứng đúng tiêu chuẩn và kỳ vọng của vị trí tuyển dụng, làm việc độc lập ở mức ổn định.',
    activeBadgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    activeButtonClass: 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-200',
  },
  4: {
    score: 4,
    label: 'Tốt / Vượt kỳ vọng',
    shortLabel: 'Vượt kỳ vọng',
    description: 'Thực hiện vượt mức yêu cầu, có tư duy giải quyết vấn đề sáng tạo và kỹ năng vững vàng.',
    activeBadgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    activeButtonClass: 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200',
  },
  5: {
    score: 5,
    label: 'Xuất sắc',
    shortLabel: 'Xuất sắc',
    description: 'Năng lực vượt trội hàng đầu, có khả năng dẫn dắt, cố vấn chuyên môn và đào tạo người khác.',
    activeBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activeButtonClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200',
  },
};

export const AVAILABLE_SCORE_OPTIONS: CriterionScoreValue[] = [1, 2, 3, 4, 5];

export const DEFAULT_FRAMEWORK_VERSION = 'v1.0';

/**
 * Cấu hình 3 lựa chọn kết luận phỏng vấn bắt buộc (AC 2 - TKNHTTDNB1-464)
 * - Nên tuyển (RECOMMENDED): Màu xanh lá (Emerald)
 * - Cân nhắc (CONSIDER): Màu vàng hổ phách (Amber)
 * - Không nên tuyển (NOT_RECOMMENDED): Màu đỏ hồng (Rose)
 */
export const CONCLUSION_OPTIONS_CONFIG: Record<InterviewConclusion, ConclusionOptionConfig> = {
  RECOMMENDED: {
    key: 'RECOMMENDED',
    label: 'Nên tuyển',
    shortLabel: 'Nên tuyển',
    description: 'Ứng viên đáp ứng tốt khung năng lực, tư duy giải quyết vấn đề và phù hợp với định hướng vị trí.',
    activeButtonClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300',
    activeBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    idleButtonClass: 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  CONSIDER: {
    key: 'CONSIDER',
    label: 'Cân nhắc',
    shortLabel: 'Cân nhắc',
    description: 'Ứng viên đáp ứng một phần tiêu chí nhưng cần đánh giá thêm, xem xét mức lương hoặc vị trí phụ.',
    activeButtonClass: 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300',
    activeBadgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    idleButtonClass: 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/40',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  NOT_RECOMMENDED: {
    key: 'NOT_RECOMMENDED',
    label: 'Không nên tuyển',
    shortLabel: 'Không nên tuyển',
    description: 'Ứng viên chưa đáp ứng yêu cầu năng lực cốt lõi hoặc không phù hợp với định hướng hiện tại.',
    activeButtonClass: 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300',
    activeBadgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    idleButtonClass: 'border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50/40',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
  },
};

export const AVAILABLE_CONCLUSION_OPTIONS: InterviewConclusion[] = [
  'RECOMMENDED',
  'CONSIDER',
  'NOT_RECOMMENDED',
];

