/**
 * Kiểu dữ liệu và hằng số cho Báo cáo Thời gian và Chi phí Tuyển dụng
 * Jira Task: TKNHTTDNB1-571 / TKNHTTDNB1-84 (User Story S8-08)
 */

export interface PipelineStageTimeMetric {
  stageId: string;
  stageName: string;
  stageLabel: string;
  avgDays: number;
  benchmarkDays: number;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT';
  description: string;
}

export interface DepartmentTimeCostMetric {
  departmentId: string;
  departmentName: string;
  hiredCount: number;
  targetCount: number;
  avgTimeToHireDays: number;
  totalPostingFees: number; // VNĐ
  totalReferralBonuses: number; // VNĐ
  totalCost: number; // VNĐ = totalPostingFees + totalReferralBonuses
  costPerHire: number; // VNĐ = totalCost / hiredCount
  efficiencyRating: 'CAO' | 'TRUNG_BINH' | 'CAN_TOI_UUU';
}

export interface JobPositionTimeCostMetric {
  jobId: string;
  jobTitle: string;
  departmentName: string;
  hiredCount: number;
  targetCount: number;
  avgTimeToHireDays: number;
  postingFees: number; // VNĐ
  referralBonuses: number; // VNĐ
  totalCost: number; // VNĐ
  costPerHire: number; // VNĐ
  difficultyLevel: 'TIÊU CHUẨN' | 'TRUNG BÌNH' | 'CHUYÊN GIA CAO CẤP';
}

export interface TimeCostKpiSummary {
  avgTimeToHire: number; // ngày
  timeToHireChange: number; // % so với kỳ trước (âm là nhanh hơn, tốt hơn)
  totalHires: number; // số người tuyển thành công
  hiresChange: number; // %
  totalRecruitmentCost: number; // VNĐ
  costChange: number; // %
  avgCostPerHire: number; // VNĐ
  costPerHireChange: number; // %
  totalPostingFees: number; // VNĐ
  totalReferralBonuses: number; // VNĐ
  postingFeePercentage: number; // %
  referralBonusPercentage: number; // %
}

export type TimeCostDateRangePreset =
  | 'THIS_YEAR'
  | 'THIS_QUARTER'
  | 'LAST_QUARTER'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'CUSTOM';

export interface TimeCostReportFilterState {
  datePreset: TimeCostDateRangePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  departmentId: string;
  jobTitleId: string;
}

export interface TimeCostReportData {
  kpi: TimeCostKpiSummary;
  pipelineStages: PipelineStageTimeMetric[];
  departments: DepartmentTimeCostMetric[];
  positions: JobPositionTimeCostMetric[];
  generatedAt: string;
}

export interface UpdateRecruitmentCostPayload {
  positionId?: string;
  departmentId?: string;
  period?: string;
  postingFees: number; // Phí đăng tin & quảng cáo tuyển dụng (VNĐ)
  referralBonuses: number; // Tiền thưởng giới thiệu nhân sự nội bộ (VNĐ)
  notes?: string;
}

export interface RecruitmentCostItem {
  id: string;
  positionId?: string;
  jobTitle?: string;
  departmentId?: string;
  departmentName?: string;
  period: string;
  postingFees: number;
  referralBonuses: number;
  totalCost: number;
  notes?: string;
  updatedAt: string;
}

/**
 * Định dạng tiền tệ VND chuẩn mực
 */
export const formatCurrencyVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Dữ liệu mẫu báo cáo Thời gian & Chi phí tuyển dụng chuẩn phục vụ phân tích đa chiều
 */
export const MOCK_TIME_COST_REPORT_DATA: TimeCostReportData = {
  generatedAt: '2026-10-18T10:00:00Z',
  kpi: {
    avgTimeToHire: 28.5,
    timeToHireChange: -8.4, // giảm 8.4% ngày (nhanh hơn kỳ trước)
    totalHires: 32,
    hiresChange: 14.3, // tăng 14.3%
    totalRecruitmentCost: 268800000, // 268.800.000 VNĐ
    costChange: -4.2,
    avgCostPerHire: 8400000, // 8.400.000 VNĐ / nhân sự
    costPerHireChange: -16.2, // tối ưu hơn 16.2%
    totalPostingFees: 122400000, // 122.400.000 VNĐ (45.5%)
    totalReferralBonuses: 146400000, // 146.400.000 VNĐ (54.5%)
    postingFeePercentage: 45.5,
    referralBonusPercentage: 54.5,
  },
  pipelineStages: [
    {
      stageId: 'st-01',
      stageName: 'SCREENING',
      stageLabel: '1. Sàng lọc & Đánh giá hồ sơ',
      avgDays: 4.2,
      benchmarkDays: 5.0,
      status: 'EXCELLENT',
      description: 'Từ lúc ứng viên nộp CV đến khi hoàn thành sơ tuyển',
    },
    {
      stageId: 'st-02',
      stageName: 'INTERVIEWING',
      stageLabel: '2. Các vòng phỏng vấn chuyên môn',
      avgDays: 12.8,
      benchmarkDays: 14.0,
      status: 'GOOD',
      description: 'Lên lịch, phỏng vấn chuyên môn và hội đồng đánh giá',
    },
    {
      stageId: 'st-03',
      stageName: 'OFFER_APPROVAL',
      stageLabel: '3. Phê duyệt & Đề xuất nhận việc (Offer)',
      avgDays: 5.1,
      benchmarkDays: 4.5,
      status: 'NEEDS_IMPROVEMENT',
      description: 'Duyệt khung lương, gửi Offer Letter và chờ ứng viên ký xác nhận',
    },
    {
      stageId: 'st-04',
      stageName: 'ONBOARDING',
      stageLabel: '4. Chờ tiếp nhận & Nhận việc chính thức',
      avgDays: 6.4,
      benchmarkDays: 7.0,
      status: 'GOOD',
      description: 'Khoảng thời gian bàn giao việc cũ đến ngày đầu tiên đi làm (Onboarding)',
    },
  ],
  departments: [
    {
      departmentId: 'dept-tech',
      departmentName: 'Khối Công nghệ & Phần mềm',
      hiredCount: 16,
      targetCount: 18,
      avgTimeToHireDays: 32.4,
      totalPostingFees: 68000000,
      totalReferralBonuses: 88000000,
      totalCost: 156000000,
      costPerHire: 9750000,
      efficiencyRating: 'CAO',
    },
    {
      departmentId: 'dept-prod',
      departmentName: 'Phòng Phát triển Sản phẩm & Thiết kế',
      hiredCount: 6,
      targetCount: 6,
      avgTimeToHireDays: 26.2,
      totalPostingFees: 24000000,
      totalReferralBonuses: 30000000,
      totalCost: 54000000,
      costPerHire: 9000000,
      efficiencyRating: 'CAO',
    },
    {
      departmentId: 'dept-biz',
      departmentName: 'Khối Kinh doanh & Marketing',
      hiredCount: 7,
      targetCount: 8,
      avgTimeToHireDays: 21.5,
      totalPostingFees: 20400000,
      totalReferralBonuses: 21000000,
      totalCost: 41400000,
      costPerHire: 5914286,
      efficiencyRating: 'CAO',
    },
    {
      departmentId: 'dept-ops',
      departmentName: 'Khối Vận hành & Nhân sự',
      hiredCount: 3,
      targetCount: 4,
      avgTimeToHireDays: 24.0,
      totalPostingFees: 10000000,
      totalReferralBonuses: 7400000,
      totalCost: 17400000,
      costPerHire: 5800000,
      efficiencyRating: 'TRUNG_BINH',
    },
  ],
  positions: [
    {
      jobId: 'job-01',
      jobTitle: 'Senior Frontend Developer',
      departmentName: 'Khối Công nghệ & Phần mềm',
      hiredCount: 5,
      targetCount: 5,
      avgTimeToHireDays: 34.0,
      postingFees: 22000000,
      referralBonuses: 30000000,
      totalCost: 52000000,
      costPerHire: 10400000,
      difficultyLevel: 'CHUYÊN GIA CAO CẤP',
    },
    {
      jobId: 'job-02',
      jobTitle: 'Backend Golang Developer',
      departmentName: 'Khối Công nghệ & Phần mềm',
      hiredCount: 6,
      targetCount: 6,
      avgTimeToHireDays: 36.5,
      postingFees: 28000000,
      referralBonuses: 36000000,
      totalCost: 64000000,
      costPerHire: 10666667,
      difficultyLevel: 'CHUYÊN GIA CAO CẤP',
    },
    {
      jobId: 'job-03',
      jobTitle: 'DevOps / Cloud Engineer',
      departmentName: 'Khối Công nghệ & Phần mềm',
      hiredCount: 3,
      targetCount: 4,
      avgTimeToHireDays: 31.0,
      postingFees: 12000000,
      referralBonuses: 15000000,
      totalCost: 27000000,
      costPerHire: 9000000,
      difficultyLevel: 'CHUYÊN GIA CAO CẤP',
    },
    {
      jobId: 'job-04',
      jobTitle: 'Product Manager (B2B SaaS)',
      departmentName: 'Phòng Phát triển Sản phẩm & Thiết kế',
      hiredCount: 2,
      targetCount: 2,
      avgTimeToHireDays: 29.5,
      postingFees: 10000000,
      referralBonuses: 12000000,
      totalCost: 22000000,
      costPerHire: 11000000,
      difficultyLevel: 'CHUYÊN GIA CAO CẤP',
    },
    {
      jobId: 'job-05',
      jobTitle: 'UI/UX Product Designer',
      departmentName: 'Phòng Phát triển Sản phẩm & Thiết kế',
      hiredCount: 4,
      targetCount: 4,
      avgTimeToHireDays: 24.5,
      postingFees: 14000000,
      referralBonuses: 18000000,
      totalCost: 32000000,
      costPerHire: 8000000,
      difficultyLevel: 'TRUNG BÌNH',
    },
    {
      jobId: 'job-06',
      jobTitle: 'B2B Sales Enterprise Lead',
      departmentName: 'Khối Kinh doanh & Marketing',
      hiredCount: 4,
      targetCount: 4,
      avgTimeToHireDays: 22.0,
      postingFees: 11400000,
      referralBonuses: 12000000,
      totalCost: 23400000,
      costPerHire: 5850000,
      difficultyLevel: 'TRUNG BÌNH',
    },
    {
      jobId: 'job-07',
      jobTitle: 'Digital Marketing Specialist',
      departmentName: 'Khối Kinh doanh & Marketing',
      hiredCount: 3,
      targetCount: 4,
      avgTimeToHireDays: 20.8,
      postingFees: 9000000,
      referralBonuses: 9000000,
      totalCost: 18000000,
      costPerHire: 6000000,
      difficultyLevel: 'TIÊU CHUẨN',
    },
    {
      jobId: 'job-08',
      jobTitle: 'HR Operations & Talent Specialist',
      departmentName: 'Khối Vận hành & Nhân sự',
      hiredCount: 3,
      targetCount: 4,
      avgTimeToHireDays: 24.0,
      postingFees: 10000000,
      referralBonuses: 7400000,
      totalCost: 17400000,
      costPerHire: 5800000,
      difficultyLevel: 'TIÊU CHUẨN',
    },
  ],
};

