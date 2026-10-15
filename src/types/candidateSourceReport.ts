/**
 * Candidate Sources Quality Report Types (Jira TKNHTTDNB1-578 - User Story S9-02)
 */

export type SourceDatePreset =
  | 'TODAY'
  | 'LAST_7_DAYS'
  | 'THIS_MONTH'
  | 'THIS_QUARTER'
  | 'THIS_YEAR'
  | 'CUSTOM';

export type CandidateSourceChannel =
  | 'LINKEDIN'
  | 'FACEBOOK'
  | 'VIETNAMWORKS'
  | 'TOPCV'
  | 'REFERRAL'
  | 'CAREER_SITE'
  | 'OTHER';

export type QualityTier = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';

export interface SourceReportFilterState {
  datePreset: SourceDatePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  departmentId: string; // 'ALL' or specific ID
  jobOpeningId: string; // 'ALL' or specific ID
  campaignId: string; // 'ALL' or specific campaign
}

export interface CandidateSourceMetric {
  sourceId: CandidateSourceChannel;
  sourceName: string;
  channelCategory: 'SOCIAL' | 'JOB_BOARD' | 'INTERNAL' | 'DIRECT' | 'OTHER';
  iconName: string;
  brandColor: string; // HEX color code for charts & badges
  bgGradient: string; // Tailwind background gradient class

  // Pipeline funnel raw counts per source
  totalApplications: number; // Tổng số hồ sơ tiếp nhận
  screenedCount: number; // Số lượng vượt qua vòng lọc hồ sơ
  interviewCount: number; // Số lượng vào phỏng vấn
  offeredCount: number; // Số lượng gửi đề nghị tuyển dụng (Offer)
  hiredCount: number; // Số lượng nhận việc thành công (Hired)

  // Derived calculated rates according to AC
  qualificationRate: number; // Tỷ lệ hồ sơ đạt chuẩn = (interviewCount / totalApplications) * 100%
  hireRate: number; // Tỷ lệ tuyển dụng thành công = (hiredCount / totalApplications) * 100%
  screeningPassRate: number; // Tỷ lệ đạt vòng lọc hồ sơ = (screenedCount / totalApplications) * 100%
  offerAcceptanceRate: number; // Tỷ lệ chấp nhận offer = (hiredCount / offeredCount) * 100%

  // Evaluation & Shares
  qualityTier: QualityTier; // Phân hạng: EXCELLENT (Xanh lá), GOOD (Xanh dương), AVERAGE (Vàng), POOR (Đỏ)
  shareOfApplications: number; // % đóng góp trong tổng số hồ sơ toàn hệ thống
  shareOfHires: number; // % đóng góp trong tổng số người được tuyển
  avgDaysToHire: number; // Thời gian trung bình từ lúc ứng tuyển đến khi tuyển (ngày)
}

export interface SourceReportSummaryKpi {
  totalApplications: number; // Tổng hồ sơ nộp từ mọi nguồn
  totalScreened: number; // Tổng vượt qua lọc
  totalInterviews: number; // Tổng vào phỏng vấn
  totalOffers: number; // Tổng gửi offer
  totalHired: number; // Tổng tuyển dụng thành công

  overallQualificationRate: number; // Tỷ lệ đạt chuẩn toàn bộ hệ thống (%)
  overallHireRate: number; // Tỷ lệ tuyển dụng thành công toàn bộ hệ thống (%)
  overallScreeningPassRate: number; // Tỷ lệ qua lọc toàn bộ (%)
  overallOfferAcceptanceRate: number; // Tỷ lệ nhận offer toàn bộ (%)

  topPerformingSource: CandidateSourceMetric | null; // Nguồn có chất lượng & tỷ lệ chuyển đổi cao nhất
  highestVolumeSource: CandidateSourceMetric | null; // Nguồn đóng góp nhiều hồ sơ nhất
  fastestHiringSource: CandidateSourceMetric | null; // Nguồn có tốc độ tuyển nhanh nhất
}

export interface CampaignOption {
  id: string;
  name: string;
  code: string;
}

export interface SourceReportFilterOptions {
  departments: Array<{ id: string; name: string; code: string }>;
  jobOpenings: Array<{ id: string; title: string; departmentId: string }>;
  campaigns: CampaignOption[];
}

export interface SourceQualityReportData {
  filters: SourceReportFilterState;
  kpi: SourceReportSummaryKpi;
  sources: CandidateSourceMetric[];
  updatedAt: string;
}
