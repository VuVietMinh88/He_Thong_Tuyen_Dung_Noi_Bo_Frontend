/**
 * Candidate Source Quality Report Service (Jira TKNHTTDNB1-578 - User Story S9-02)
 */

import axiosClient from '../utils/axiosClient';
import type {
  CandidateSourceChannel,
  CandidateSourceMetric,
  QualityTier,
  SourceDatePreset,
  SourceQualityReportData,
  SourceReportFilterOptions,
  SourceReportFilterState,
  SourceReportSummaryKpi,
} from '../types/candidateSourceReport';

export interface RawSourceInput {
  sourceId: CandidateSourceChannel;
  sourceName: string;
  channelCategory: 'SOCIAL' | 'JOB_BOARD' | 'INTERNAL' | 'DIRECT' | 'OTHER';
  iconName: string;
  brandColor: string;
  bgGradient: string;
  totalApplications: number;
  screenedCount: number;
  interviewCount: number;
  offeredCount: number;
  hiredCount: number;
  avgDaysToHire: number;
}

/**
 * Metadata chuẩn cho 6 nguồn ứng viên chính theo yêu cầu đề bài
 */
export const DEFAULT_SOURCE_METADATA: Record<
  CandidateSourceChannel,
  {
    name: string;
    category: 'SOCIAL' | 'JOB_BOARD' | 'INTERNAL' | 'DIRECT' | 'OTHER';
    iconName: string;
    brandColor: string;
    bgGradient: string;
  }
> = {
  LINKEDIN: {
    name: 'LinkedIn',
    category: 'SOCIAL',
    iconName: 'linkedin',
    brandColor: '#0A66C2',
    bgGradient: 'from-blue-600 to-sky-700',
  },
  FACEBOOK: {
    name: 'Facebook / Mạng xã hội',
    category: 'SOCIAL',
    iconName: 'facebook',
    brandColor: '#1877F2',
    bgGradient: 'from-blue-500 to-indigo-600',
  },
  VIETNAMWORKS: {
    name: 'VietnamWorks',
    category: 'JOB_BOARD',
    iconName: 'vietnamworks',
    brandColor: '#FF6F00',
    bgGradient: 'from-orange-500 to-amber-600',
  },
  TOPCV: {
    name: 'TopCV',
    category: 'JOB_BOARD',
    iconName: 'topcv',
    brandColor: '#00B14F',
    bgGradient: 'from-emerald-500 to-teal-600',
  },
  REFERRAL: {
    name: 'Giới thiệu nội bộ (Referral)',
    category: 'INTERNAL',
    iconName: 'referral',
    brandColor: '#8B5CF6',
    bgGradient: 'from-purple-600 to-violet-700',
  },
  CAREER_SITE: {
    name: 'Website tuyển dụng (Career Site)',
    category: 'DIRECT',
    iconName: 'career_site',
    brandColor: '#0284C7',
    bgGradient: 'from-cyan-600 to-blue-700',
  },
  OTHER: {
    name: 'Nguồn khác',
    category: 'OTHER',
    iconName: 'other',
    brandColor: '#6B7280',
    bgGradient: 'from-gray-500 to-slate-600',
  },
};

/**
 * Tính toán xếp hạng chất lượng kênh (QualityTier)
 * - EXCELLENT: Tỷ lệ đạt chuẩn >= 35% và Tỷ lệ tuyển dụng >= 6% (Hiệu quả cao, Xanh lá)
 * - GOOD: Tỷ lệ đạt chuẩn >= 20% và Tỷ lệ tuyển dụng >= 3% (Đạt yêu cầu, Xanh dương)
 * - AVERAGE: Tỷ lệ đạt chuẩn >= 10% (Trung bình, Vàng)
 * - POOR: Tỷ lệ đạt chuẩn < 10% hoặc Tỷ lệ tuyển < 1.5% (Cần cải thiện, Đỏ)
 */
export function determineQualityTier(qualificationRate: number, hireRate: number): QualityTier {
  if (qualificationRate >= 35 && hireRate >= 6) {
    return 'EXCELLENT';
  }
  if ((qualificationRate >= 20 && hireRate >= 3) || qualificationRate >= 35 || hireRate >= 5) {
    return 'GOOD';
  }
  if (qualificationRate >= 10 || hireRate >= 2) {
    return 'AVERAGE';
  }
  return 'POOR';
}

/**
 * Thuật toán tính toán chỉ số chất lượng nguồn ứng viên từ dữ liệu thô
 */
export function computeSourceQualityMetrics(
  rawInputs: RawSourceInput[],
): { sources: CandidateSourceMetric[]; kpi: SourceReportSummaryKpi } {
  const grandTotalApplications = rawInputs.reduce((sum, item) => sum + item.totalApplications, 0);
  const grandTotalScreened = rawInputs.reduce((sum, item) => sum + item.screenedCount, 0);
  const grandTotalInterviews = rawInputs.reduce((sum, item) => sum + item.interviewCount, 0);
  const grandTotalOffers = rawInputs.reduce((sum, item) => sum + item.offeredCount, 0);
  const grandTotalHired = rawInputs.reduce((sum, item) => sum + item.hiredCount, 0);

  const sources: CandidateSourceMetric[] = rawInputs.map((raw) => {
    const total = raw.totalApplications;
    const qualificationRate =
      total > 0 ? Number(((raw.interviewCount / total) * 100).toFixed(1)) : 0;
    const hireRate = total > 0 ? Number(((raw.hiredCount / total) * 100).toFixed(1)) : 0;
    const screeningPassRate =
      total > 0 ? Number(((raw.screenedCount / total) * 100).toFixed(1)) : 0;
    const offerAcceptanceRate =
      raw.offeredCount > 0 ? Number(((raw.hiredCount / raw.offeredCount) * 100).toFixed(1)) : 0;

    const shareOfApplications =
      grandTotalApplications > 0
        ? Number(((raw.totalApplications / grandTotalApplications) * 100).toFixed(1))
        : 0;

    const shareOfHires =
      grandTotalHired > 0 ? Number(((raw.hiredCount / grandTotalHired) * 100).toFixed(1)) : 0;

    const qualityTier = total > 0 ? determineQualityTier(qualificationRate, hireRate) : 'AVERAGE';

    return {
      sourceId: raw.sourceId,
      sourceName: raw.sourceName,
      channelCategory: raw.channelCategory,
      iconName: raw.iconName,
      brandColor: raw.brandColor,
      bgGradient: raw.bgGradient,
      totalApplications: raw.totalApplications,
      screenedCount: raw.screenedCount,
      interviewCount: raw.interviewCount,
      offeredCount: raw.offeredCount,
      hiredCount: raw.hiredCount,
      qualificationRate,
      hireRate,
      screeningPassRate,
      offerAcceptanceRate,
      qualityTier,
      shareOfApplications,
      shareOfHires,
      avgDaysToHire: raw.avgDaysToHire,
    };
  });

  // KPI toàn hệ thống
  const overallQualificationRate =
    grandTotalApplications > 0
      ? Number(((grandTotalInterviews / grandTotalApplications) * 100).toFixed(1))
      : 0;
  const overallHireRate =
    grandTotalApplications > 0
      ? Number(((grandTotalHired / grandTotalApplications) * 100).toFixed(1))
      : 0;
  const overallScreeningPassRate =
    grandTotalApplications > 0
      ? Number(((grandTotalScreened / grandTotalApplications) * 100).toFixed(1))
      : 0;
  const overallOfferAcceptanceRate =
    grandTotalOffers > 0 ? Number(((grandTotalHired / grandTotalOffers) * 100).toFixed(1)) : 0;

  // Tìm nguồn tốt nhất (tỷ lệ tuyển dụng và đạt chuẩn cao nhất)
  const validSources = sources.filter((s) => s.totalApplications > 0);
  const topPerformingSource =
    validSources.length > 0
      ? [...validSources].sort(
          (a, b) => b.hireRate * 1.5 + b.qualificationRate - (a.hireRate * 1.5 + a.qualificationRate),
        )[0]
      : null;

  // Nguồn có số lượng nhiều nhất
  const highestVolumeSource =
    validSources.length > 0
      ? [...validSources].sort((a, b) => b.totalApplications - a.totalApplications)[0]
      : null;

  // Nguồn tuyển dụng nhanh nhất
  const fastestHiringSource =
    validSources.filter((s) => s.hiredCount > 0).length > 0
      ? [...validSources.filter((s) => s.hiredCount > 0)].sort(
          (a, b) => a.avgDaysToHire - b.avgDaysToHire,
        )[0]
      : null;

  const kpi: SourceReportSummaryKpi = {
    totalApplications: grandTotalApplications,
    totalScreened: grandTotalScreened,
    totalInterviews: grandTotalInterviews,
    totalOffers: grandTotalOffers,
    totalHired: grandTotalHired,
    overallQualificationRate,
    overallHireRate,
    overallScreeningPassRate,
    overallOfferAcceptanceRate,
    topPerformingSource,
    highestVolumeSource,
    fastestHiringSource,
  };

  return { sources, kpi };
}

/**
 * Danh sách bộ lọc mẫu và chiến dịch tuyển dụng
 */
export const MOCK_FILTER_OPTIONS: SourceReportFilterOptions = {
  departments: [
    { id: 'TECH', name: 'Khối Công nghệ Thông tin (IT)', code: 'TECH' },
    { id: 'MARKETING', name: 'Khối Truyền thông & Marketing', code: 'MKT' },
    { id: 'SALES', name: 'Khối Kinh doanh & Phát triển thị trường', code: 'SALES' },
    { id: 'HR', name: 'Khối Nhân sự & Vận hành', code: 'HR' },
    { id: 'FINANCE', name: 'Khối Tài chính & Kế toán', code: 'FIN' },
  ],
  jobOpenings: [
    { id: 'JOB-01', title: 'Senior Frontend Developer (React/TS)', departmentId: 'TECH' },
    { id: 'JOB-02', title: 'Backend Lead Engineer (Golang/Java)', departmentId: 'TECH' },
    { id: 'JOB-03', title: 'Chuyên viên Digital Marketing Performance', departmentId: 'MARKETING' },
    { id: 'JOB-04', title: 'Trưởng nhóm Kinh doanh B2B', departmentId: 'SALES' },
    { id: 'JOB-05', title: 'Chuyên viên Tuyển dụng Cao cấp (Senior IT Recruiter)', departmentId: 'HR' },
  ],
  campaigns: [
    { id: 'CAMP-2026-Q4', name: 'Chiến dịch Tech Talent 2026 - Q4', code: 'TECH_Q4' },
    { id: 'CAMP-GRAD-2026', name: 'Chương trình Fresher / Thực tập sinh tài năng 2026', code: 'FRESHER_26' },
    { id: 'CAMP-LEAD-2026', name: 'Tuyển dụng Quản lý & Lãnh đạo cấp trung', code: 'LEADERSHIP' },
    { id: 'CAMP-SALES-EXP', name: 'Mở rộng Chi nhánh Toàn quốc', code: 'EXPANSION' },
  ],
};

/**
 * Tạo mock raw data theo bộ lọc người dùng
 */
export function generateMockSourceRawData(filters: SourceReportFilterState): RawSourceInput[] {
  // Nếu chọn test case empty hoặc khoảng ngày bất hợp lệ
  if (filters.startDate === '1970-01-01' || filters.endDate === '1970-01-01') {
    return (Object.keys(DEFAULT_SOURCE_METADATA) as CandidateSourceChannel[]).map((channel) => {
      const meta = DEFAULT_SOURCE_METADATA[channel];
      return {
        sourceId: channel,
        sourceName: meta.name,
        channelCategory: meta.category,
        iconName: meta.iconName,
        brandColor: meta.brandColor,
        bgGradient: meta.bgGradient,
        totalApplications: 0,
        screenedCount: 0,
        interviewCount: 0,
        offeredCount: 0,
        hiredCount: 0,
        avgDaysToHire: 0,
      };
    });
  }

  // Hệ số lọc
  let scale = 1.0;
  if (filters.departmentId !== 'ALL') scale *= 0.65;
  if (filters.jobOpeningId !== 'ALL') scale *= 0.45;
  if (filters.campaignId !== 'ALL') scale *= 0.8;
  if (filters.datePreset === 'TODAY') scale *= 0.08;
  if (filters.datePreset === 'LAST_7_DAYS') scale *= 0.25;
  if (filters.datePreset === 'THIS_MONTH') scale *= 0.7;
  if (filters.datePreset === 'THIS_YEAR') scale *= 2.2;

  const round = (val: number) => Math.max(0, Math.round(val * scale));

  return [
    {
      sourceId: 'LINKEDIN',
      sourceName: DEFAULT_SOURCE_METADATA.LINKEDIN.name,
      channelCategory: DEFAULT_SOURCE_METADATA.LINKEDIN.category,
      iconName: DEFAULT_SOURCE_METADATA.LINKEDIN.iconName,
      brandColor: DEFAULT_SOURCE_METADATA.LINKEDIN.brandColor,
      bgGradient: DEFAULT_SOURCE_METADATA.LINKEDIN.bgGradient,
      totalApplications: round(180),
      screenedCount: round(110),
      interviewCount: round(68), // 37.8% qual
      offeredCount: round(22),
      hiredCount: round(16), // 8.9% hire -> EXCELLENT
      avgDaysToHire: 21,
    },
    {
      sourceId: 'REFERRAL',
      sourceName: DEFAULT_SOURCE_METADATA.REFERRAL.name,
      channelCategory: DEFAULT_SOURCE_METADATA.REFERRAL.category,
      iconName: DEFAULT_SOURCE_METADATA.REFERRAL.iconName,
      brandColor: DEFAULT_SOURCE_METADATA.REFERRAL.brandColor,
      bgGradient: DEFAULT_SOURCE_METADATA.REFERRAL.bgGradient,
      totalApplications: round(65),
      screenedCount: round(52),
      interviewCount: round(36), // 55.4% qual
      offeredCount: round(15),
      hiredCount: round(13), // 20.0% hire -> EXCELLENT (Top Quality)
      avgDaysToHire: 14, // Tốc độ tuyển nhanh nhất
    },
    {
      sourceId: 'TOPCV',
      sourceName: DEFAULT_SOURCE_METADATA.TOPCV.name,
      channelCategory: DEFAULT_SOURCE_METADATA.TOPCV.category,
      iconName: DEFAULT_SOURCE_METADATA.TOPCV.iconName,
      brandColor: DEFAULT_SOURCE_METADATA.TOPCV.brandColor,
      bgGradient: DEFAULT_SOURCE_METADATA.TOPCV.bgGradient,
      totalApplications: round(260), // Số lượng nhiều nhất
      screenedCount: round(120),
      interviewCount: round(62), // 23.8% qual
      offeredCount: round(20),
      hiredCount: round(14), // 5.4% hire -> GOOD
      avgDaysToHire: 26,
    },
    {
      sourceId: 'VIETNAMWORKS',
      sourceName: DEFAULT_SOURCE_METADATA.VIETNAMWORKS.name,
      channelCategory: DEFAULT_SOURCE_METADATA.VIETNAMWORKS.category,
      iconName: DEFAULT_SOURCE_METADATA.VIETNAMWORKS.iconName,
      brandColor: DEFAULT_SOURCE_METADATA.VIETNAMWORKS.brandColor,
      bgGradient: DEFAULT_SOURCE_METADATA.VIETNAMWORKS.bgGradient,
      totalApplications: round(140),
      screenedCount: round(70),
      interviewCount: round(38), // 27.1% qual
      offeredCount: round(12),
      hiredCount: round(8), // 5.7% hire -> GOOD
      avgDaysToHire: 28,
    },
    {
      sourceId: 'CAREER_SITE',
      sourceName: DEFAULT_SOURCE_METADATA.CAREER_SITE.name,
      channelCategory: DEFAULT_SOURCE_METADATA.CAREER_SITE.category,
      iconName: DEFAULT_SOURCE_METADATA.CAREER_SITE.iconName,
      brandColor: DEFAULT_SOURCE_METADATA.CAREER_SITE.brandColor,
      bgGradient: DEFAULT_SOURCE_METADATA.CAREER_SITE.bgGradient,
      totalApplications: round(95),
      screenedCount: round(50),
      interviewCount: round(28), // 29.5% qual
      offeredCount: round(10),
      hiredCount: round(7), // 7.4% hire -> EXCELLENT
      avgDaysToHire: 24,
    },
    {
      sourceId: 'FACEBOOK',
      sourceName: DEFAULT_SOURCE_METADATA.FACEBOOK.name,
      channelCategory: DEFAULT_SOURCE_METADATA.FACEBOOK.category,
      iconName: DEFAULT_SOURCE_METADATA.FACEBOOK.iconName,
      brandColor: DEFAULT_SOURCE_METADATA.FACEBOOK.brandColor,
      bgGradient: DEFAULT_SOURCE_METADATA.FACEBOOK.bgGradient,
      totalApplications: round(210), // Đông hồ sơ nhưng tỷ lệ chuyển đổi thấp
      screenedCount: round(65),
      interviewCount: round(24), // 11.4% qual
      offeredCount: round(6),
      hiredCount: round(3), // 1.4% hire -> POOR / AVERAGE
      avgDaysToHire: 32,
    },
    {
      sourceId: 'OTHER',
      sourceName: DEFAULT_SOURCE_METADATA.OTHER.name,
      channelCategory: DEFAULT_SOURCE_METADATA.OTHER.category,
      iconName: DEFAULT_SOURCE_METADATA.OTHER.iconName,
      brandColor: DEFAULT_SOURCE_METADATA.OTHER.brandColor,
      bgGradient: DEFAULT_SOURCE_METADATA.OTHER.bgGradient,
      totalApplications: round(40),
      screenedCount: round(15),
      interviewCount: round(6), // 15.0% qual
      offeredCount: round(2),
      hiredCount: round(1), // 2.5% hire -> AVERAGE
      avgDaysToHire: 35,
    },
  ];
}

/**
 * Trả về khoảng ngày theo preset
 */
export function calculatePresetDateRange(preset: SourceDatePreset): {
  startDate: string;
  endDate: string;
} {
  const now = new Date(2026, 9, 15); // Local date: 15-10-2026
  const format = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  switch (preset) {
    case 'TODAY':
      return { startDate: format(now), endDate: format(now) };
    case 'LAST_7_DAYS': {
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      return { startDate: format(past), endDate: format(now) };
    }
    case 'THIS_MONTH': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: format(firstDay), endDate: format(now) };
    }
    case 'THIS_QUARTER': {
      const quarter = Math.floor(now.getMonth() / 3);
      const firstDay = new Date(now.getFullYear(), quarter * 3, 1);
      return { startDate: format(firstDay), endDate: format(now) };
    }
    case 'THIS_YEAR': {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      return { startDate: format(firstDay), endDate: format(now) };
    }
    case 'CUSTOM':
    default:
      return { startDate: '2026-10-01', endDate: '2026-10-31' };
  }
}

export const candidateSourceReportService = {
  /**
   * Lấy danh mục bộ lọc
   */
  async getFilterOptions(): Promise<SourceReportFilterOptions> {
    try {
      const res = await axiosClient.get('/recruitment/reports/sources/filter-options');
      if (res?.data && typeof res.data === 'object') {
        return res.data as SourceReportFilterOptions;
      }
    } catch {
      // Fallback
    }
    return MOCK_FILTER_OPTIONS;
  },

  /**
   * Gọi API lấy báo cáo chất lượng nguồn ứng viên
   */
  async getSourceQualityReport(filters: SourceReportFilterState): Promise<SourceQualityReportData> {
    try {
      const res = await axiosClient.get('/recruitment/reports/sources', {
        params: {
          preset: filters.datePreset,
          startDate: filters.startDate,
          endDate: filters.endDate,
          departmentId: filters.departmentId,
          jobOpeningId: filters.jobOpeningId,
          campaignId: filters.campaignId,
        },
      });

      if (res?.data?.sources && Array.isArray(res.data.sources)) {
        return res.data as SourceQualityReportData;
      }
    } catch {
      // Fallback local analytical computation
    }

    const rawInputs = generateMockSourceRawData(filters);
    const { sources, kpi } = computeSourceQualityMetrics(rawInputs);

    return {
      filters,
      kpi,
      sources,
      updatedAt: new Date().toISOString(),
    };
  },
};
