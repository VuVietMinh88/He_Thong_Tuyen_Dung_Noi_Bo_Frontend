import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  determineQualityTier,
  computeSourceQualityMetrics,
  candidateSourceReportService,
  calculatePresetDateRange,
  type RawSourceInput,
} from '../src/services/candidateSourceReportService';
import {
  SourceReportFilterBar,
  SourceKpiOverview,
  SourceDistributionChart,
  SourceQualityDataTable,
  SourceReportSkeletonLoader,
  SourceReportEmptyState,
} from '../src/components/CandidateSourceReport';
import type {
  SourceReportFilterOptions,
  SourceReportFilterState,
} from '../src/types/candidateSourceReport';

describe('Jira Task TKNHTTDNB1-578: Báo cáo chất lượng nguồn ứng viên (User Story S9-02)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockFilterOptions: SourceReportFilterOptions = {
    departments: [
      { id: 'TECH', name: 'Khối Công nghệ Thông tin', code: 'TECH' },
      { id: 'MKT', name: 'Khối Marketing', code: 'MKT' },
    ],
    jobOpenings: [
      { id: 'JOB-01', title: 'Senior Frontend Developer', departmentId: 'TECH' },
      { id: 'JOB-02', title: 'Marketing Lead', departmentId: 'MKT' },
    ],
    campaigns: [
      { id: 'CAMP-01', name: 'Chiến dịch Q4 Tech', code: 'TECH_Q4' },
    ],
  };

  const defaultFilters: SourceReportFilterState = {
    datePreset: 'THIS_MONTH',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    departmentId: 'ALL',
    jobOpeningId: 'ALL',
    campaignId: 'ALL',
  };

  // =========================================================================
  // AC 1: Bộ chỉ số hiệu quả nguồn tuyển dụng (Source Quality Metrics)
  // =========================================================================
  describe('AC 1: Bộ chỉ số hiệu quả nguồn tuyển dụng (Source Quality Metrics)', () => {
    it('tính toán chính xác Tỷ lệ hồ sơ đạt chuẩn (Quality of Hire Ratio) theo công thức (interviewCount / totalApplications) * 100%', () => {
      const mockRaw: RawSourceInput[] = [
        {
          sourceId: 'LINKEDIN',
          sourceName: 'LinkedIn',
          channelCategory: 'SOCIAL',
          iconName: 'linkedin',
          brandColor: '#0A66C2',
          bgGradient: 'from-blue-600 to-sky-700',
          totalApplications: 200,
          screenedCount: 120,
          interviewCount: 80, // (80 / 200) * 100% = 40.0%
          offeredCount: 25,
          hiredCount: 20, // (20 / 200) * 100% = 10.0%
          avgDaysToHire: 20,
        },
      ];

      const { sources } = computeSourceQualityMetrics(mockRaw);
      expect(sources[0].qualificationRate).toBe(40.0);
      expect(sources[0].hireRate).toBe(10.0);
      expect(sources[0].screeningPassRate).toBe(60.0);
      expect(sources[0].offerAcceptanceRate).toBe(80.0);
    });

    it('phân loại đúng mức độ hiệu quả QualityTier (EXCELLENT, GOOD, AVERAGE, POOR)', () => {
      // 1. EXCELLENT: qualRate >= 35 && hireRate >= 6
      expect(determineQualityTier(40, 8)).toBe('EXCELLENT');
      expect(determineQualityTier(35, 6)).toBe('EXCELLENT');

      // 2. GOOD: qualRate >= 20 && hireRate >= 3
      expect(determineQualityTier(25, 4)).toBe('GOOD');
      expect(determineQualityTier(36, 2)).toBe('GOOD'); // qual cao nhưng hire thấp

      // 3. AVERAGE: qualRate >= 10
      expect(determineQualityTier(15, 1)).toBe('AVERAGE');

      // 4. POOR: qualRate < 10
      expect(determineQualityTier(8, 0.5)).toBe('POOR');
      expect(determineQualityTier(0, 0)).toBe('POOR');
    });

    it('xác định chính xác Kênh chất lượng cao nhất và Kênh số lượng lớn nhất trong KPI tổng quan', () => {
      const mockRaw: RawSourceInput[] = [
        {
          sourceId: 'TOPCV',
          sourceName: 'TopCV',
          channelCategory: 'JOB_BOARD',
          iconName: 'topcv',
          brandColor: '#00B14F',
          bgGradient: 'from-emerald-500 to-teal-600',
          totalApplications: 500, // Volume cao nhất
          screenedCount: 200,
          interviewCount: 80,
          offeredCount: 20,
          hiredCount: 15,
          avgDaysToHire: 25,
        },
        {
          sourceId: 'REFERRAL',
          sourceName: 'Giới thiệu nội bộ (Referral)',
          channelCategory: 'INTERNAL',
          iconName: 'referral',
          brandColor: '#8B5CF6',
          bgGradient: 'from-purple-600 to-violet-700',
          totalApplications: 50,
          screenedCount: 40,
          interviewCount: 30, // 60% qual rate
          offeredCount: 12,
          hiredCount: 10, // 20% hire rate -> Top Performing Quality
          avgDaysToHire: 12, // Tuyển nhanh nhất
        },
      ];

      const { kpi } = computeSourceQualityMetrics(mockRaw);

      expect(kpi.totalApplications).toBe(550);
      expect(kpi.totalHired).toBe(25);
      expect(kpi.highestVolumeSource?.sourceId).toBe('TOPCV');
      expect(kpi.topPerformingSource?.sourceId).toBe('REFERRAL');
      expect(kpi.fastestHiringSource?.sourceId).toBe('REFERRAL');
    });

    it('xử lý an toàn khi toàn bộ dữ liệu nguồn bằng 0 (Zero division protection)', () => {
      const { sources, kpi } = computeSourceQualityMetrics([]);

      expect(sources).toHaveLength(0);
      expect(kpi.totalApplications).toBe(0);
      expect(kpi.overallQualificationRate).toBe(0);
      expect(kpi.overallHireRate).toBe(0);
      expect(kpi.topPerformingSource).toBeNull();
    });
  });

  // =========================================================================
  // AC 2: Bố cục hiển thị đa dạng (Bảng chi tiết & Biểu đồ phân bổ Donut)
  // =========================================================================
  describe('AC 2: Bố cục hiển thị đa dạng (Data Table & Donut Chart)', () => {
    it('render Bảng phân tích chi tiết SourceQualityDataTable với đầy đủ các cột và giá trị', () => {
      const { sources } = computeSourceQualityMetrics([
        {
          sourceId: 'LINKEDIN',
          sourceName: 'LinkedIn',
          channelCategory: 'SOCIAL',
          iconName: 'linkedin',
          brandColor: '#0A66C2',
          bgGradient: 'from-blue-600 to-sky-700',
          totalApplications: 100,
          screenedCount: 60,
          interviewCount: 35,
          offeredCount: 12,
          hiredCount: 9,
          avgDaysToHire: 22,
        },
      ]);

      const html = renderToString(<SourceQualityDataTable sources={sources} />);

      // 1. Kiểm tra cấu trúc bảng và tiêu đề cột
      expect(html).toContain('data-testid="source-quality-data-table"');
      expect(html).toContain('Kênh tuyển dụng');
      expect(html).toContain('Tiếp nhận');
      expect(html).toContain('Đạt lọc');
      expect(html).toContain('Phỏng vấn');
      expect(html).toContain('Offer');
      expect(html).toContain('Nhận việc');
      expect(html).toContain('Tỷ lệ đạt chuẩn');
      expect(html).toContain('Tỷ lệ tuyển dụng');
      expect(html).toContain('Mức độ hiệu quả');

      // 2. Kiểm tra ô dữ liệu của LinkedIn
      expect(html).toContain('data-testid="source-row-linkedin"');
      expect(html).toContain('data-testid="cell-applied-linkedin"');
      expect(html).toContain('100');
      expect(html).toContain('data-testid="cell-interview-linkedin"');
      expect(html).toContain('35');
      expect(html).toContain('data-testid="cell-hired-linkedin"');
      expect(html).toContain('9');
      expect(html).toContain('35%');
      expect(html).toContain('9%');
    });

    it('tô màu phân biệt mức độ hiệu quả (Badge Xanh/Vàng/Đỏ) chính xác trong bảng', () => {
      const mockSources: RawSourceInput[] = [
        {
          sourceId: 'REFERRAL',
          sourceName: 'Giới thiệu nội bộ',
          channelCategory: 'INTERNAL',
          iconName: 'referral',
          brandColor: '#8B5CF6',
          bgGradient: 'from-purple-600 to-violet-700',
          totalApplications: 50,
          screenedCount: 40,
          interviewCount: 25,
          offeredCount: 10,
          hiredCount: 8, // 50% qual, 16% hire -> EXCELLENT (Xanh lá)
          avgDaysToHire: 15,
        },
        {
          sourceId: 'TOPCV',
          sourceName: 'TopCV',
          channelCategory: 'JOB_BOARD',
          iconName: 'topcv',
          brandColor: '#00B14F',
          bgGradient: 'from-emerald-500 to-teal-600',
          totalApplications: 100,
          screenedCount: 50,
          interviewCount: 25,
          offeredCount: 8,
          hiredCount: 4, // 25% qual, 4% hire -> GOOD (Xanh dương)
          avgDaysToHire: 25,
        },
        {
          sourceId: 'OTHER',
          sourceName: 'Nguồn khác',
          channelCategory: 'OTHER',
          iconName: 'other',
          brandColor: '#6B7280',
          bgGradient: 'from-gray-500 to-slate-600',
          totalApplications: 100,
          screenedCount: 20,
          interviewCount: 12,
          offeredCount: 3,
          hiredCount: 2, // 12% qual -> AVERAGE (Vàng)
          avgDaysToHire: 30,
        },
        {
          sourceId: 'FACEBOOK',
          sourceName: 'Facebook',
          channelCategory: 'SOCIAL',
          iconName: 'facebook',
          brandColor: '#1877F2',
          bgGradient: 'from-blue-500 to-indigo-600',
          totalApplications: 100,
          screenedCount: 15,
          interviewCount: 5,
          offeredCount: 1,
          hiredCount: 0, // 5% qual -> POOR (Đỏ)
          avgDaysToHire: 0,
        },
      ];

      const { sources } = computeSourceQualityMetrics(mockSources);
      const html = renderToString(<SourceQualityDataTable sources={sources} />);

      // 1. Badge Xuất sắc (Xanh lá)
      expect(html).toContain('data-testid="quality-badge-referral"');
      expect(html).toContain('Xuất sắc (Hiệu quả cao)');

      // 2. Badge Đạt chuẩn (Xanh dương)
      expect(html).toContain('data-testid="quality-badge-topcv"');
      expect(html).toContain('Đạt chuẩn (Khá)');

      // 3. Badge Trung bình (Vàng)
      expect(html).toContain('data-testid="quality-badge-other"');
      expect(html).toContain('Trung bình');

      // 4. Badge Cần cải thiện (Đỏ)
      expect(html).toContain('data-testid="quality-badge-facebook"');
      expect(html).toContain('Cần cải thiện (Kém)');
    });

    it('render Biểu đồ phân bổ Donut SVG SourceDistributionChart với các lát cắt và legend', () => {
      const { sources } = computeSourceQualityMetrics([
        {
          sourceId: 'LINKEDIN',
          sourceName: 'LinkedIn',
          channelCategory: 'SOCIAL',
          iconName: 'linkedin',
          brandColor: '#0A66C2',
          bgGradient: 'from-blue-600 to-sky-700',
          totalApplications: 120,
          screenedCount: 70,
          interviewCount: 40,
          offeredCount: 15,
          hiredCount: 10,
          avgDaysToHire: 20,
        },
        {
          sourceId: 'TOPCV',
          sourceName: 'TopCV',
          channelCategory: 'JOB_BOARD',
          iconName: 'topcv',
          brandColor: '#00B14F',
          bgGradient: 'from-emerald-500 to-teal-600',
          totalApplications: 80,
          screenedCount: 40,
          interviewCount: 20,
          offeredCount: 8,
          hiredCount: 6,
          avgDaysToHire: 24,
        },
      ]);

      const html = renderToString(<SourceDistributionChart sources={sources} />);

      expect(html).toContain('data-testid="source-distribution-chart"');
      expect(html).toContain('data-testid="source-donut-svg"');
      expect(html).toContain('data-testid="donut-center-total"');
      expect(html).toContain('200'); // Tổng 120 + 80
      expect(html).toContain('data-testid="donut-segment-linkedin"');
      expect(html).toContain('data-testid="donut-segment-topcv"');
      expect(html).toContain('data-testid="legend-item-linkedin"');
      expect(html).toContain('data-testid="legend-item-topcv"');
      expect(html).toContain('data-testid="chart-mode-applications"');
      expect(html).toContain('data-testid="chart-mode-hires"');
    });

    it('render các thẻ KPI tổng quan SourceKpiOverview với số liệu chất lượng tuyển dụng', () => {
      const { kpi } = computeSourceQualityMetrics([
        {
          sourceId: 'LINKEDIN',
          sourceName: 'LinkedIn',
          channelCategory: 'SOCIAL',
          iconName: 'linkedin',
          brandColor: '#0A66C2',
          bgGradient: 'from-blue-600 to-sky-700',
          totalApplications: 300,
          screenedCount: 150,
          interviewCount: 90,
          offeredCount: 30,
          hiredCount: 24,
          avgDaysToHire: 20,
        },
      ]);

      const html = renderToString(<SourceKpiOverview kpi={kpi} />);

      expect(html).toContain('data-testid="source-kpi-overview"');
      expect(html).toContain('data-testid="kpi-card-total-applications"');
      expect(html).toContain('data-testid="kpi-value-total-applications"');
      expect(html).toContain('300');
      expect(html).toContain('data-testid="kpi-card-qualification-rate"');
      expect(html).toContain('data-testid="kpi-value-qualification-rate"');
      expect(html).toContain('30%'); // (90 / 300) * 100%
      expect(html).toContain('data-testid="kpi-card-total-hired"');
      expect(html).toContain('data-testid="kpi-value-total-hired"');
      expect(html).toContain('24');
      expect(html).toContain('data-testid="kpi-card-top-source"');
      expect(html).toContain('LinkedIn');
    });
  });

  // =========================================================================
  // AC 3: Bộ lọc thời gian và vị trí áp dụng (Multidimensional Filters)
  // =========================================================================
  describe('AC 3: Bộ lọc thời gian và vị trí áp dụng (Multidimensional Filters)', () => {
    it('render đầy đủ thanh bộ lọc SourceReportFilterBar với các preset thời gian và dropdown', () => {
      const handleChange = vi.fn();
      const handleReset = vi.fn();

      const html = renderToString(
        <SourceReportFilterBar
          filters={defaultFilters}
          options={mockFilterOptions}
          onChange={handleChange}
          onReset={handleReset}
        />,
      );

      // 1. Kiểm tra container
      expect(html).toContain('data-testid="source-report-filter-bar"');

      // 2. Kiểm tra các nút preset thời gian
      expect(html).toContain('data-testid="preset-today"');
      expect(html).toContain('data-testid="preset-last_7_days"');
      expect(html).toContain('data-testid="preset-this_month"');
      expect(html).toContain('data-testid="preset-this_quarter"');
      expect(html).toContain('data-testid="preset-this_year"');
      expect(html).toContain('data-testid="preset-custom"');

      // 3. Kiểm tra các dropdown đa chiều
      expect(html).toContain('data-testid="filter-campaign-select"');
      expect(html).toContain('Chiến dịch Q4 Tech');
      expect(html).toContain('data-testid="filter-department-select"');
      expect(html).toContain('Khối Công nghệ Thông tin');
      expect(html).toContain('data-testid="filter-job-select"');
      expect(html).toContain('Senior Frontend Developer');

      // 4. Nút reset
      expect(html).toContain('data-testid="btn-reset-filters"');
    });

    it('tính toán đúng khoảng ngày mặc định khi chọn các preset thời gian trong calculatePresetDateRange', () => {
      const todayRange = calculatePresetDateRange('TODAY');
      expect(todayRange.startDate).toBe(todayRange.endDate);

      const yearRange = calculatePresetDateRange('THIS_YEAR');
      expect(yearRange.startDate).toBe('2026-01-01');

      const monthRange = calculatePresetDateRange('THIS_MONTH');
      expect(monthRange.startDate).toBe('2026-10-01');
    });

    it('gọi API getSourceQualityReport và trả về dữ liệu chất lượng nguồn hoàn chỉnh', async () => {
      const data = await candidateSourceReportService.getSourceQualityReport(defaultFilters);

      expect(data).toBeDefined();
      expect(data.sources.length).toBeGreaterThan(0);
      expect(data.kpi.totalApplications).toBeGreaterThan(0);
      expect(data.kpi.overallQualificationRate).toBeGreaterThan(0);

      // Chứa đủ các kênh tuyển dụng chính theo yêu cầu
      const channelIds = data.sources.map((s) => s.sourceId);
      expect(channelIds).toContain('LINKEDIN');
      expect(channelIds).toContain('FACEBOOK');
      expect(channelIds).toContain('VIETNAMWORKS');
      expect(channelIds).toContain('TOPCV');
      expect(channelIds).toContain('REFERRAL');
      expect(channelIds).toContain('CAREER_SITE');
    });

    it('render thành phần Skeleton Loading khi tải dữ liệu', () => {
      const html = renderToString(<SourceReportSkeletonLoader />);
      expect(html).toContain('data-testid="source-report-skeleton-loader"');
      expect(html).toContain('animate-pulse');
    });

    it('render thành phần Empty State khi không có dữ liệu ứng viên trong kỳ lọc', () => {
      const handleReset = vi.fn();
      const html = renderToString(<SourceReportEmptyState onResetFilters={handleReset} />);

      expect(html).toContain('data-testid="source-report-empty-state"');
      expect(html).toContain('Chưa có dữ liệu chất lượng nguồn ứng viên');
      expect(html).toContain('data-testid="btn-empty-reset-filters"');
    });
  });
});
