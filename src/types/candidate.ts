/**
 * Types cho Hồ sơ ứng viên & Xác nhận dữ liệu gợi ý từ CV (Story TKNHTTDNB1-43 / Subtask TKNHTTDNB1-331)
 */

export type CvParsingStatus =
  | 'PARSING'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'FAILED'
  | 'DISMISSED';

export interface CvSuggestedCandidateInfo {
  fullName: string;
  email: string;
  phone: string;
  confidenceScore?: number;
  extractedAt?: string;
  rawSnippet?: string;
}

export interface CandidateProfile {
  id: string;
  trackingCode?: string;
  fullName: string;
  email: string;
  phone: string;
  appliedJobId?: string;
  appliedJobTitle?: string;
  departmentName?: string;
  currentTitle?: string;
  experienceYears?: number;
  source?: string;
  status?: string;
  rejectionReason?: string;
  cvUrl?: string;
  cvFileName?: string;
  cvParsingStatus: CvParsingStatus;
  cvSuggestedInfo?: CvSuggestedCandidateInfo;
  cvParsingErrorMessage?: string;
  coverLetter?: string;
  rating?: number;
  tags?: CandidateTag[];
  notes?: CandidateInternalNote[];
  matchingEvaluation?: CandidateMatchingEvaluation;
  educationLevel?: string;
  skills?: string[];
  currentCompany?: string;
  dateOfBirth?: string;
  address?: string;
  appliedAt?: string;
  updatedAt?: string;
}

/**
 * Tùy chọn sắp xếp hồ sơ ứng viên theo điểm phù hợp hoặc thời gian nộp (Task TKNHTTDNB1-411 / Story TKNHTTDNB1-57)
 */
export type CandidateSortOption =
  | 'SCORE_DESC' // Điểm phù hợp: Cao đến thấp (Gợi ý đọc trước)
  | 'SCORE_ASC' // Điểm phù hợp: Thấp đến cao
  | 'APPLIED_AT_DESC'; // Ngày nộp hồ sơ: Mới nhất

export const DEFAULT_CANDIDATE_SORT_OPTION: CandidateSortOption = 'SCORE_DESC';

export interface CandidateSortConfig {
  value: CandidateSortOption;
  label: string;
}

export const CANDIDATE_SORT_OPTIONS: CandidateSortConfig[] = [
  {
    value: 'SCORE_DESC',
    label: 'Điểm phù hợp: Cao đến thấp (Gợi ý đọc trước)',
  },
  {
    value: 'SCORE_ASC',
    label: 'Điểm phù hợp: Thấp đến cao',
  },
  {
    value: 'APPLIED_AT_DESC',
    label: 'Ngày nộp hồ sơ: Mới nhất',
  },
];

export interface CandidateFilterCriteria {
  keyword?: string;
  jobId?: string;
  cvParsingStatus?: CvParsingStatus | 'ALL';
  sortBy?: CandidateSortOption;
}

/**
 * Types cho Tìm kiếm ứng viên nâng cao & Bộ lọc kết hợp đa điều kiện (Task Jira TKNHTTDNB1-390 / User Story S5-03)
 */
export type ExperienceFilterOption =
  | 'ALL'
  | 'LT_1' // Dưới 1 năm (< 1 năm)
  | '1_TO_3' // 1 - 3 năm
  | '3_TO_5' // 3 - 5 năm
  | 'GT_5' // Trên 5 năm (> 5 năm)
  | 'CUSTOM'; // Tùy chỉnh khoảng Min - Max

export type EducationFilterOption =
  | 'ALL'
  | 'BACHELOR' // Đại học / Cử nhân
  | 'MASTER_PLUS' // Thạc sĩ / Tiến sĩ
  | 'COLLEGE' // Cao đẳng
  | 'OTHER'; // Trung cấp / Khác

export type StageFilterOption =
  | 'ALL'
  | 'NEW' // Chờ duyệt (Mới tiếp nhận / Sơ loại)
  | 'INTERVIEWING' // Phỏng vấn
  | 'OFFER_HIRED' // Trúng tuyển (Offer / Nhận việc)
  | 'REJECTED'; // Loại hồ sơ

export interface CandidateCombinedFilterState {
  keyword: string;
  jobId: string;
  department: string;
  experienceLevel: ExperienceFilterOption;
  minExperienceYears?: number;
  maxExperienceYears?: number;
  educationLevel: EducationFilterOption;
  stageStatus: StageFilterOption;
  skills: string[];
  cvParsingStatus?: CvParsingStatus | 'ALL';
  sortBy?: CandidateSortOption;
}

export const DEFAULT_COMBINED_FILTER_STATE: CandidateCombinedFilterState = {
  keyword: '',
  jobId: 'ALL',
  department: 'ALL',
  experienceLevel: 'ALL',
  educationLevel: 'ALL',
  stageStatus: 'ALL',
  skills: [],
  cvParsingStatus: 'ALL',
  sortBy: DEFAULT_CANDIDATE_SORT_OPTION,
};

export const COMMON_SKILL_SUGGESTIONS: string[] = [
  'React',
  'TypeScript',
  'Node.js',
  'Tailwind CSS',
  'Java',
  'Spring Boot',
  'Python',
  'UI/UX',
  'SQL',
  'Docker',
  'AWS',
  'Tiếng Anh',
];

/**
 * Constants & Types cho Sàng lọc nhanh hồ sơ (Subtask TKNHTTDNB1-384 / Story TKNHTTDNB1-52)
 */

export const MIN_STAR_RATING = 1;
export const MAX_STAR_RATING = 5;

export const STAR_RATING_DESCRIPTIONS: Record<number, string> = {
  1: 'Chưa đạt yêu cầu tối thiểu',
  2: 'Cần xem xét thêm / Thiếu kinh nghiệm then chốt',
  3: 'Đạt tiêu chuẩn yêu cầu cơ bản',
  4: 'Rất tiềm năng / Phù hợp văn hóa và chuyên môn',
  5: 'Xuất sắc / Ứng viên ưu tiên tuyển dụng ngay',
};

export interface ScreeningCatalogTag {
  id: string;
  name: string;
  colorClass: string;
  category?: 'SKILL' | 'EXPERIENCE' | 'LANGUAGE' | 'CULTURE' | 'AVAILABILITY';
}

export const DEFAULT_SCREENING_CATALOG_TAGS: ScreeningCatalogTag[] = [
  {
    id: 'catalog-tag-react-strong',
    name: 'React/TS Vững',
    colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    category: 'SKILL',
  },
  {
    id: 'catalog-tag-english-fluent',
    name: 'Tiếng Anh Tốt',
    colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    category: 'LANGUAGE',
  },
  {
    id: 'catalog-tag-lead-experience',
    name: 'Kinh nghiệm Lead',
    colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
    category: 'EXPERIENCE',
  },
  {
    id: 'catalog-tag-onboard-immediate',
    name: 'Onboard ngay',
    colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
    category: 'AVAILABILITY',
  },
  {
    id: 'catalog-tag-culture-fit',
    name: 'Văn hóa phù hợp',
    colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
    category: 'CULTURE',
  },
  {
    id: 'catalog-tag-salary-match',
    name: 'Lương kỳ vọng khớp',
    colorClass: 'bg-teal-50 text-teal-700 border-teal-200',
    category: 'EXPERIENCE',
  },
  {
    id: 'catalog-tag-high-potential',
    name: 'Tiềm năng cao',
    colorClass: 'bg-rose-50 text-rose-700 border-rose-200',
    category: 'CULTURE',
  },
];

export interface CandidateInternalNote {
  id: string;
  content: string;
  authorName: string;
  authorRole?: string;
  authorAvatar?: string;
  createdAt: string; // ISO 8601
  category?: 'GENERAL' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'CULTURE';
}

/**
 * Payload cập nhật tổng hợp dữ liệu sàng lọc ứng viên (Subtask TKNHTTDNB1-385)
 */
export interface CandidateScreeningUpdatePayload {
  rating?: number;
  tags?: CandidateTag[];
  newNote?: {
    content: string;
    category?: CandidateInternalNote['category'];
    authorName: string;
    authorRole?: string;
  };
}

/**
 * Types & Constants cho Đánh giá mức độ phù hợp & Tiêu chí bắt buộc (Task TKNHTTDNB1-410 / Story TKNHTTDNB1-57)
 */
export type MandatoryCriterionKey = 'EXPERIENCE' | 'EDUCATION' | 'SKILLS';

export interface MandatoryCriterionItem {
  id: string;
  criterionKey: MandatoryCriterionKey;
  criterionName: string; // VD: "Số năm kinh nghiệm", "Bằng cấp (Học vấn)", "Kỹ năng chuyên môn"
  jobRequirement: string; // Yêu cầu từ vị trí tuyển dụng
  candidateValue: string; // Thông tin từ hồ sơ ứng viên
  isPassed: boolean; // true: Đạt, false: Không đạt
  notes?: string;
}

export interface CandidateMatchingEvaluation {
  totalMatchingScore: number; // 0 - 100 điểm
  isOverallPassed: boolean; // true: Đạt (Xanh lá), false: Không đạt (Cam/Đỏ)
  criteriaList: MandatoryCriterionItem[];
  summaryText?: string;
  evaluatedAt?: string;
}

export const MATCHING_SCORE_PASS_THRESHOLD = 70;

export const MANDATORY_CRITERIA_DISCLAIMER_NOTE =
  'Lưu ý: Điểm phù hợp và cờ Đạt/Không đạt chỉ dùng để gợi ý thứ tự ưu tiên đọc hồ sơ, hệ thống không tự động loại ứng viên.';

/**
 * Types cho Hồ sơ ứng viên thống nhất (User Story S4-09 / Task Jira TKNHTTDNB1-358)
 */

export type CandidateStage =
  | 'NEW'
  | 'SCREENING'
  | 'INTERVIEWING'
  | 'OFFER'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface CandidateStageMetadata {
  key: CandidateStage;
  label: string;
  badgeClass: string;
  stepNumber: number;
  description: string;
}

export const CANDIDATE_STAGE_CONFIG: Record<CandidateStage, CandidateStageMetadata> = {
  NEW: {
    key: 'NEW',
    label: 'Hồ sơ mới',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    stepNumber: 1,
    description: 'Hồ sơ vừa được nộp vào hệ thống, chờ rà soát sơ loại.',
  },
  SCREENING: {
    key: 'SCREENING',
    label: 'Sàng lọc',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    stepNumber: 2,
    description: 'Recruiter đang rà soát CV và liên hệ sơ vấn với ứng viên.',
  },
  INTERVIEWING: {
    key: 'INTERVIEWING',
    label: 'Phỏng vấn',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    stepNumber: 3,
    description: 'Ứng viên đang tham gia các vòng phỏng vấn chuyên môn.',
  },
  OFFER: {
    key: 'OFFER',
    label: 'Đề xuất offer',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    stepNumber: 4,
    description: 'Đã gửi thư mời nhận việc (Offer Letter) cho ứng viên.',
  },
  HIRED: {
    key: 'HIRED',
    label: 'Nhận việc',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    stepNumber: 5,
    description: 'Ứng viên đã chấp nhận offer và chuẩn bị onboard gia nhập công ty.',
  },
  REJECTED: {
    key: 'REJECTED',
    label: 'Loại hồ sơ',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    stepNumber: -1,
    description: 'Hồ sơ chưa đạt tiêu chuẩn yêu cầu của vị trí tuyển dụng.',
  },
  WITHDRAWN: {
    key: 'WITHDRAWN',
    label: 'Ứng viên rút lui',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    stepNumber: -2,
    description: 'Ứng viên chủ động xin rút hồ sơ hoặc từ chối tham gia tiếp.',
  },
};

export type CandidateSourceType = 'CAREER_PAGE' | 'INTERNAL_REFERRAL' | 'MANUAL_IMPORT' | 'AGENCY';

export interface CandidateSource {
  type: CandidateSourceType;
  label: string;
  referrerName?: string;
  referrerEmail?: string;
  details?: string;
}

export interface CandidateTag {
  id: string;
  name: string;
  colorClass: string;
}

export interface InternalNote {
  id: string;
  content: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  createdAt: string; // ISO 8601
  category?: 'GENERAL' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'CULTURE';
}

export interface ApplicationRecord {
  id: string;
  jobPostingId: string;
  jobCode: string;
  jobTitle: string;
  departmentName: string;
  appliedAt: string; // ISO 8601
  source: CandidateSource;
  recruiterId: string;
  recruiterName: string;
  hiringManagerId: string;
  hiringManagerName: string;
  stage: CandidateStage;
  rejectionReason?: string;
  withdrawalReason?: string;
  cvFileName: string;
  cvFileSize: number; // bytes
  cvFileType: 'pdf' | 'docx';
  cvFileUrl: string;
  isCurrent?: boolean;
}

export interface UnifiedCandidate {
  id: string;
  candidateCode: string; // ví dụ: CAN-2026-0891
  fullName: string;
  email: string;
  phone: string;
  currentTitle?: string;
  experienceYears?: number;
  coverLetter?: string;
  rating: number; // 1 - 5 sao
  tags: CandidateTag[];
  notes: InternalNote[];
  applications: ApplicationRecord[];
  currentApplicationId: string;
  matchingEvaluation?: CandidateMatchingEvaluation;
  createdAt: string;
  updatedAt: string;
}

/**
 * Types cho Biểu mẫu thêm ứng viên thủ công (Task Jira: TKNHTTDNB1-406 / User Story S5-06)
 */
export type CandidateSourceOption =
  | 'REFERRAL'
  | 'LINKEDIN'
  | 'EVENT'
  | 'EMAIL'
  | 'WEBSITE'
  | 'OTHER';

export const CANDIDATE_SOURCE_CONFIG: Array<{ value: CandidateSourceOption; label: string }> = [
  { value: 'REFERRAL', label: 'Giới thiệu nội bộ (Referral)' },
  { value: 'LINKEDIN', label: 'Mạng xã hội LinkedIn' },
  { value: 'EVENT', label: 'Sự kiện tuyển dụng / Job Fair' },
  { value: 'EMAIL', label: 'Email trực tiếp' },
  { value: 'WEBSITE', label: 'Website công ty' },
  { value: 'OTHER', label: 'Nguồn khác' },
];

export interface CreateManualCandidateDto {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  address?: string;
  appliedJobId: string;
  appliedJobTitle?: string;
  source: string;
  skills?: string[];
  experienceYears?: number;
  currentCompany?: string;
  notes?: string;
  cvFileName?: string;
  cvFileSize?: number;
  cvUrl?: string;
}

/**
 * Types cho Thao tác xuất Excel danh sách ứng viên (Task Jira: TKNHTTDNB1-422 / User Story S5-08)
 */
export type CandidateExportScope = 'ALL_FILTERED' | 'SELECTED_ONLY';

export interface CandidateExportOptions {
  scope: CandidateExportScope;
  format?: 'xlsx' | 'csv';
  customFilename?: string;
  candidateIds?: string[];
  filterCriteria?: CandidateFilterCriteria;
}

export interface CandidateExportResult {
  filename: string;
  count: number;
  format: 'xlsx' | 'csv';
}

