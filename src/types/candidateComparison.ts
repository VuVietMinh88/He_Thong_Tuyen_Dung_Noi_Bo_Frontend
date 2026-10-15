/**
 * Types & Interfaces cho Bảng so sánh ứng viên ở vòng cuối (Side-by-side Matrix Comparison)
 * Jira Task: TKNHTTDNB1-470 / User Story S7-01
 */

export type CompetencyCriterionKey =
  | 'technical'
  | 'attitude'
  | 'language'
  | 'cultureFit'
  | 'softSkills'
  | 'overall';

export interface CompetencyScoreDetail {
  technical: number; // Chuyên môn kỹ thuật (thang điểm 1.0 - 5.0)
  attitude: number; // Thái độ & Trách nhiệm
  language: number; // Ngoại ngữ (Tiếng Anh,...)
  cultureFit: number; // Độ phù hợp văn hóa
  softSkills: number; // Kỹ năng mềm & Làm việc nhóm
  overall: number; // Điểm trung bình tổng thể
}

export type InterviewerRecommendation = 'RECOMMENDED' | 'CONSIDER' | 'NOT_RECOMMENDED';

export interface InterviewerFeedbackItem {
  id?: string;
  interviewerId: string;
  interviewerName: string;
  interviewerRole: string; // Ví dụ: "Lead Architect", "HR Manager", "Engineering Director"
  interviewerAvatar?: string;
  conclusion: InterviewerRecommendation;
  comment: string;
  strengths?: string[];
  concerns?: string[];
  score?: number;
  submittedAt?: string;
}

export interface CandidateCompensationInfo {
  expectedSalary: number; // Mức lương kỳ vọng (VNĐ)
  expectedSalaryFormatted: string; // "35.000.000 ₫"
  currentSalary?: number; // Mức lương hiện tại (VNĐ)
  currentSalaryFormatted?: string;
  salaryNegotiable: boolean;
  noticePeriodDays: number; // Số ngày báo trước
  availabilityText: string; // "Sẵn sàng nhận việc ngay", "Sau 30 ngày (01/12/2026)"
  workModePreference: 'HYBRID' | 'ONSITE' | 'REMOTE';
  benefitsRequested?: string[];
}

export type HiringDecisionStatus = 'OFFER' | 'BACKUP' | 'REJECT' | 'PENDING';

export interface HiringDecisionRecord {
  status: HiringDecisionStatus;
  decidedAt?: string;
  decidedBy?: string;
  note?: string;
  offeredSalary?: number;
}

export type CandidateEvaluationFilterStatus = 'ALL' | 'COMPLETED' | 'PENDING';

export interface EvaluationProgress {
  completedCount: number;
  requiredCount: number;
  isFullyEvaluated: boolean;
  pendingInterviewerNames?: string[];
}

export interface ComparisonCandidate {
  id: string;
  candidateCode: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  currentTitle: string;
  currentCompany: string;
  experienceYears: number;
  educationLevel: string;
  appliedJobId: string;
  appliedJobTitle: string;
  matchingScore: number; // Điểm khớp hồ sơ sơ bộ (0 - 100)
  rating: number; // Đánh giá sao (1 - 5)
  interviewRound: string; // "Vòng phỏng vấn cuối - Hội đồng tuyển dụng"
  competencyScores: CompetencyScoreDetail;
  interviewerFeedbacks: InterviewerFeedbackItem[];
  summaryStrengths: string[];
  summaryConcerns: string[];
  compensation: CandidateCompensationInfo;
  hiringDecision?: HiringDecisionRecord;
  evaluationProgress?: EvaluationProgress;
}

export type ComparisonCategoryKey =
  | 'GENERAL_INFO'
  | 'COMPETENCY'
  | 'FEEDBACK'
  | 'COMPENSATION'
  | 'DECISION';

export interface ComparisonCategoryConfig {
  key: ComparisonCategoryKey;
  label: string;
  description: string;
  iconName: string;
  defaultExpanded?: boolean;
}

export interface TopHighlightRecord {
  bestValue: number;
  candidateIds: string[];
  isTie: boolean;
}

export type CriteriaHighlightMap = {
  [key in CompetencyCriterionKey]?: TopHighlightRecord;
} & {
  experienceYears?: TopHighlightRecord;
  matchingScore?: TopHighlightRecord;
  salaryCompetitive?: TopHighlightRecord;
};

export const COMPARISON_CONSTRAINTS = {
  MIN_CANDIDATES: 2,
  MAX_CANDIDATES: 5,
  DEFAULT_SELECTED_COUNT: 3,
};
