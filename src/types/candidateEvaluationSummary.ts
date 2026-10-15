/**
 * Types & Interfaces cho Màn hình tổng hợp đánh giá để quyết định tuyển dụng
 * Jira Task: TKNHTTDNB1-485 / User Story S7-02
 */

export type ConsensusRecommendation =
  | 'STRONG_HIRE' // Tuyển dụng xuất sắc
  | 'HIRE' // Đề xuất tuyển
  | 'CONSIDER' // Cân nhắc / Dự phòng
  | 'DO_NOT_HIRE'; // Không tuyển dụng

export type ConsensusLevel =
  | 'UNANIMOUS' // Đồng thuận tuyệt đối (100%)
  | 'STRONG' // Đồng thuận cao (>= 75%)
  | 'MODERATE' // Đồng thuận vừa (>= 50%)
  | 'DIVIDED'; // Ý kiến trái chiều (< 50%)

export interface ConsensusSummary {
  totalInterviewers: number;
  strongHireCount: number;
  hireCount: number;
  considerCount: number;
  doNotHireCount: number;
  positiveCount: number; // strongHire + hire
  consensusPercentage: number; // (positiveCount / totalInterviewers) * 100
  consensusLevel: ConsensusLevel;
  consensusHeadline: string; // "3/3 Khuyến nghị tuyển dụng (Strong Hire / Hire)"
  consensusNote?: string;
}

export type CompetencyGapStatus =
  | 'EXCEEDS' // Vượt kỳ vọng (+0.3 trở lên)
  | 'MEETS' // Đạt chuẩn (-0.2 đến +0.2)
  | 'BELOW'; // Dưới kỳ vọng (<-0.2)

export interface CompetencyBenchmarkItem {
  id: string;
  name: string; // Tên tiêu chí năng lực (VD: "Chuyên môn kỹ thuật")
  score: number; // Điểm ứng viên đạt được (thang 5.0)
  targetScore: number; // Điểm chuẩn kỳ vọng của vị trí (thang 5.0)
  weight: number; // Trọng số (%)
  gap: number; // score - targetScore
  gapStatus: CompetencyGapStatus;
  description?: string;
}

export interface InterviewerCriterionScore {
  criterionId: string;
  criterionName: string;
  score: number;
  weight?: number;
}

export interface InterviewerEvaluationDetail {
  interviewerId: string;
  interviewerName: string;
  interviewerRole: string; // "Lead Technical Architect", "Head of HR", "CTO"
  interviewerAvatar?: string;
  overallScore: number; // Điểm tổng kết người này chấm
  recommendation: ConsensusRecommendation;
  comment: string; // Nhận xét tổng quan
  strengths: string[]; // Điểm mạnh nổi bật
  concerns: string[]; // Điểm cần lưu ý / Rủi ro
  criterionScores?: InterviewerCriterionScore[];
  submittedAt: string; // ISO date string
}

export type InterviewRoundType =
  | 'SCREENING' // Vòng 1: Lọc hồ sơ sơ bộ
  | 'TECHNICAL' // Vòng 2: Phỏng vấn chuyên môn & kỹ thuật
  | 'CULTURE_FIT' // Vòng 3: Phỏng vấn văn hóa & kỹ năng mềm
  | 'EXECUTIVE'; // Vòng 4: Phỏng vấn Hội đồng & Ban Lãnh đạo

export interface EvaluationRoundItem {
  roundId: string;
  roundOrder: number;
  roundType: InterviewRoundType;
  roundName: string; // "Vòng 2: Phỏng vấn Chuyên môn & Kiến trúc Kỹ thuật"
  roundDate?: string;
  format?: 'ONLINE' | 'OFFLINE';
  locationOrLink?: string;
  averageScore: number; // Điểm trung bình của vòng này
  interviewers: InterviewerEvaluationDetail[];
  roundSummary?: string;
}

export type FinalHiringDecisionStatus =
  | 'OFFER' // Đề nghị tuyển dụng
  | 'REJECT' // Từ chối hồ sơ
  | 'TALENT_POOL' // Lưu vào kho tiềm năng
  | 'PENDING'; // Chờ quyết định

export interface FinalHiringDecisionRecord {
  status: FinalHiringDecisionStatus;
  decidedAt?: string;
  decidedBy?: string; // Họ tên người ra quyết định / Ban Giám đốc
  decidedByRole?: string;
  offeredSalary?: number; // Mức lương đề xuất (VNĐ)
  offeredSalaryFormatted?: string; // "38.000.000 ₫"
  startDate?: string; // Ngày dự kiến nhận việc
  probationMonths?: number; // Thời gian thử việc (tháng)
  talentPoolCategory?: string; // Phân nhóm talent pool nếu lưu trữ
  rejectionReason?: string; // Lý do từ chối nếu reject
  rejectionEmailSent?: boolean;
  notes?: string;
}

export interface CandidateCompensationSummary {
  expectedSalary: number;
  expectedSalaryFormatted: string;
  currentSalary?: number;
  currentSalaryFormatted?: string;
  salaryNegotiable: boolean;
  noticePeriodDays: number;
  availabilityText: string;
  workModePreference: 'HYBRID' | 'ONSITE' | 'REMOTE';
}

export interface CandidateEvaluationSummaryData {
  id: string; // Candidate ID
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
  departmentName: string;
  appliedAt: string;
  overallScore: number; // Điểm trung bình trọng số tổng thể (thang 5.0)
  overallPercentage: number; // (overallScore / 5.0) * 100
  targetBenchmarkAverage: number; // Điểm chuẩn trung bình của vị trí
  consensus: ConsensusSummary;
  competencyBenchmarks: CompetencyBenchmarkItem[];
  evaluationRounds: EvaluationRoundItem[];
  compensation: CandidateCompensationSummary;
  hiringDecision: FinalHiringDecisionRecord;
}
