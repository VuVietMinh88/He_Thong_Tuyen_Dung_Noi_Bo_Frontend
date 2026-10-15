/**
 * Recruitment Funnel Dashboard Types (Jira TKNHTTDNB1-565 - User Story S9-01)
 */

export type DatePreset =
  | 'TODAY'
  | 'LAST_7_DAYS'
  | 'THIS_MONTH'
  | 'THIS_QUARTER'
  | 'CUSTOM';

export type FunnelStageId =
  | 'APPLIED'
  | 'SCREENED'
  | 'INTERVIEW_1'
  | 'INTERVIEW_2'
  | 'OFFERED'
  | 'HIRED';

export interface FunnelFilterState {
  datePreset: DatePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  departmentId: string; // 'ALL' or department ID
  jobOpeningId: string; // 'ALL' or job ID
  recruiterId: string; // 'ALL' or recruiter ID
}

export interface FunnelStageMetric {
  id: FunnelStageId;
  name: string;
  stageOrder: number; // 1 to 6
  description: string;
  count: number;
  passRate: number; // Tỷ lệ % vượt qua vòng so với vòng trước (Vòng 1 = 100%)
  retentionRate: number; // Tỷ lệ % giữ chân so với tổng số hồ sơ ban đầu (APPLIED)
  dropCount: number; // Số ứng viên dừng lại / bị loại ở vòng này
  dropRate: number; // Tỷ lệ % bị loại ở vòng này so với đầu vào vòng
  avgDaysInStage: number; // Thời gian xử lý trung bình tại vòng này (ngày)
  colorClass: string;
  badgeBgClass: string;
  isBiggestDropOff?: boolean; // Đánh dấu điểm rơi lớn nhất giữa các vòng
}

export interface DropOffAlertInfo {
  stageId: FunnelStageId;
  stageName: string;
  stageOrder: number;
  dropRate: number; // Tỷ lệ rớt (%)
  dropCount: number; // Số lượng hồ sơ rớt
  incomingCount: number; // Số lượng hồ sơ đầu vào vòng trước
  passedCount: number; // Số lượng hồ sơ vượt qua
  alertMessage: string;
  recommendation: string;
}

export interface FunnelSummaryKpi {
  totalApplications: number; // Tổng số hồ sơ ứng tuyển tiếp nhận
  overallConversionRate: number; // Tỷ lệ chuyển đổi tổng thể: Ứng tuyển -> Nhận việc (%)
  avgTimeToHireDays: number; // Thời gian tuyển dụng trung bình (ngày)
  totalHired: number; // Số lượng ứng viên tiếp nhận nhận việc
  screeningPassRate: number; // Tỷ lệ qua vòng sàng lọc (%)
  offerAcceptanceRate: number; // Tỷ lệ chấp nhận đề nghị việc làm (%)
  applicationsGrowthPercent?: number; // So với kỳ trước (+%)
  conversionRateChangePercent?: number; // Thay đổi điểm % so với kỳ trước
  timeToHireChangeDays?: number; // Chênh lệch ngày so với kỳ trước
}

export interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

export interface JobOpeningOption {
  id: string;
  title: string;
  departmentId: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
}

export interface RecruiterOption {
  id: string;
  name: string;
  email: string;
  departmentName?: string;
}

export interface FunnelFilterOptions {
  departments: DepartmentOption[];
  jobOpenings: JobOpeningOption[];
  recruiters: RecruiterOption[];
}

export interface FunnelReportData {
  filters: FunnelFilterState;
  kpi: FunnelSummaryKpi;
  stages: FunnelStageMetric[];
  biggestDropOff?: DropOffAlertInfo | null;
  updatedAt: string;
}

export const FUNNEL_STAGE_DEFINITIONS: Array<{
  id: FunnelStageId;
  name: string;
  stageOrder: number;
  description: string;
  colorClass: string;
  badgeBgClass: string;
}> = [
  {
    id: 'APPLIED',
    name: 'Ứng tuyển mới (Applied)',
    stageOrder: 1,
    description: 'Hồ sơ tiếp nhận từ tất cả các nguồn (Website tuyển dụng, Giới thiệu nội bộ, Sàn việc làm)',
    colorClass: 'from-blue-600 to-indigo-600 text-blue-600',
    badgeBgClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
  },
  {
    id: 'SCREENED',
    name: 'Duyệt hồ sơ (Screened)',
    stageOrder: 2,
    description: 'Hồ sơ đạt tiêu chuẩn sơ loại về kỹ năng, kinh nghiệm và phù hợp định biên',
    colorClass: 'from-indigo-600 to-violet-600 text-indigo-600',
    badgeBgClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
  },
  {
    id: 'INTERVIEW_1',
    name: 'Phỏng vấn vòng 1 (Round 1 Interview)',
    stageOrder: 3,
    description: 'Phỏng vấn sơ loại văn hóa doanh nghiệp, tác phong và kiểm tra năng lực cơ bản',
    colorClass: 'from-violet-600 to-purple-600 text-violet-600',
    badgeBgClass: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800',
  },
  {
    id: 'INTERVIEW_2',
    name: 'Phỏng vấn chuyên sâu (In-depth Interview)',
    stageOrder: 4,
    description: 'Hội đồng chuyên môn đánh giá kỹ thuật chuyên sâu, giải case study hoặc phỏng vấn lãnh đạo',
    colorClass: 'from-purple-600 to-pink-600 text-purple-600',
    badgeBgClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
  },
  {
    id: 'OFFERED',
    name: 'Gửi đề nghị (Offered)',
    stageOrder: 5,
    description: 'Phát hành thư mời nhận việc chính thức kèm mức lương thưởng và chế độ đãi ngộ',
    colorClass: 'from-amber-500 to-orange-500 text-amber-600',
    badgeBgClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  },
  {
    id: 'HIRED',
    name: 'Tiếp nhận (Hired)',
    stageOrder: 6,
    description: 'Ứng viên xác nhận đồng ý Offer, hoàn tất thủ tục và bắt đầu tiến trình Onboarding',
    colorClass: 'from-emerald-600 to-teal-600 text-emerald-600',
    badgeBgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  },
];
