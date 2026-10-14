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
  createdAt: string;
  updatedAt: string;
}

