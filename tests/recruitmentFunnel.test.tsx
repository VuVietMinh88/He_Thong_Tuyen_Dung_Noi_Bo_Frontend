import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  FunnelFilterBar,
  FunnelKpiCards,
  FunnelStageChart,
  FunnelDetailTable,
} from '../src/components/RecruitmentFunnel';
import {
  calculateDateRangeForPreset,
  getDefaultFunnelFilters,
  computeFunnelMetricsFromCounts,
  recruitmentFunnelService,
  MOCK_DEPARTMENTS,
  MOCK_JOB_OPENINGS,
  MOCK_RECRUITERS,
} from '../src/services/recruitmentFunnelService';
import {
  FUNNEL_STAGE_DEFINITIONS,
  type FunnelFilterState,
  type FunnelFilterOptions,
} from '../src/types/recruitmentFunnel';

describe('Jira Task TKNHTTDNB1-565: Báo cáo phễu tuyển dụng và bộ lọc (User Story S9-01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockFilterOptions: FunnelFilterOptions = {
    departments: MOCK_DEPARTMENTS,
    jobOpenings: MOCK_JOB_OPENINGS,
    recruiters: MOCK_RECRUITERS,
  };

  const defaultFilters: FunnelFilterState = {
    datePreset: 'THIS_MONTH',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    departmentId: 'ALL',
    jobOpeningId: 'ALL',
    recruiterId: 'ALL',
  };

  // =========================================================================
  // AC 1: Thanh bộ lọc báo cáo đa chiều (Report Filters Bar)
  // =========================================================================
  describe('AC 1: Thanh bộ lọc báo cáo đa chiều (Report Filters Bar)', () => {
    it('tính toán chính xác khoảng ngày cho từng Preset thời gian', () => {
      // 1. Hôm nay (TODAY)
      const todayRange = calculateDateRangeForPreset('TODAY', '2026-10-15');
      expect(todayRange.startDate).toBe('2026-10-15');
      expect(todayRange.endDate).toBe('2026-10-15');

      // 2. 7 ngày qua (LAST_7_DAYS)
      const last7Range = calculateDateRangeForPreset('LAST_7_DAYS', '2026-10-15');
      expect(last7Range.startDate).toBe('2026-10-09');
      expect(last7Range.endDate).toBe('2026-10-15');

      // 3. Tháng này (THIS_MONTH)
      const thisMonthRange = calculateDateRangeForPreset('THIS_MONTH', '2026-10-15');
      expect(thisMonthRange.startDate).toBe('2026-10-01');
      expect(thisMonthRange.endDate).toBe('2026-10-31');

      // 4. Quý này (THIS_QUARTER - Q4)
      const thisQuarterRange = calculateDateRangeForPreset('THIS_QUARTER', '2026-10-15');
      expect(thisQuarterRange.startDate).toBe('2026-10-01');
      expect(thisQuarterRange.endDate).toBe('2026-12-31');
    });

    it('khởi tạo bộ lọc mặc định chính xác với Tháng này và Tất cả đối tượng', () => {
      const defaults = getDefaultFunnelFilters();
      expect(defaults.datePreset).toBe('THIS_MONTH');
      expect(defaults.departmentId).toBe('ALL');
      expect(defaults.jobOpeningId).toBe('ALL');
      expect(defaults.recruiterId).toBe('ALL');
      expect(defaults.startDate).toBeDefined();
      expect(defaults.endDate).toBeDefined();
    });

    it('render đầy đủ các nút Preset ngày, Dropdown và các nút hành động', () => {
      const html = renderToString(
        <FunnelFilterBar
          currentFilters={defaultFilters}
          options={mockFilterOptions}
          onApplyFilters={vi.fn()}
          onResetFilters={vi.fn()}
        />,
      );

      // 1. Kiểm tra 5 Preset thời gian
      expect(html).toContain('data-testid="filter-preset-today"');
      expect(html).toContain('Hôm nay');
      expect(html).toContain('data-testid="filter-preset-last-7-days"');
      expect(html).toContain('7 ngày qua');
      expect(html).toContain('data-testid="filter-preset-this-month"');
      expect(html).toContain('Tháng này');
      expect(html).toContain('data-testid="filter-preset-this-quarter"');
      expect(html).toContain('Quý này');
      expect(html).toContain('data-testid="filter-preset-custom"');
      expect(html).toContain('Tùy chọn ngày');

      // 2. Kiểm tra Dropdown theo Phòng ban, Vị trí, Recruiter
      expect(html).toContain('data-testid="select-department"');
      expect(html).toContain('Khối Công nghệ &amp; Kỹ thuật');
      expect(html).toContain('data-testid="select-job-opening"');
      expect(html).toContain('Senior Frontend React Engineer');
      expect(html).toContain('data-testid="select-recruiter"');
      expect(html).toContain('Nguyễn Thu Hà');

      // 3. Kiểm tra Nút "Áp dụng bộ lọc" & "Đặt lại bộ lọc"
      expect(html).toContain('data-testid="btn-apply-filters"');
      expect(html).toContain('Áp dụng bộ lọc');
      expect(html).toContain('data-testid="btn-reset-filters"');
      expect(html).toContain('Đặt lại bộ lọc');
    });

    it('hiển thị ô Date Range Picker khi ở chế độ CUSTOM', () => {
      const customFilters: FunnelFilterState = {
        ...defaultFilters,
        datePreset: 'CUSTOM',
        startDate: '2026-09-01',
        endDate: '2026-09-30',
      };

      const html = renderToString(
        <FunnelFilterBar
          currentFilters={customFilters}
          options={mockFilterOptions}
          onApplyFilters={vi.fn()}
          onResetFilters={vi.fn()}
        />,
      );

      expect(html).toContain('data-testid="custom-date-range-container"');
      expect(html).toContain('data-testid="input-start-date"');
      expect(html).toContain('data-testid="input-end-date"');
      expect(html).toContain('value="2026-09-01"');
      expect(html).toContain('value="2026-09-30"');
    });
  });

  // =========================================================================
  // AC 2: Thẻ thống kê tổng quan (Funnel Summary KPI Cards)
  // =========================================================================
  describe('AC 2: Thẻ thống kê tổng quan (Funnel Summary KPI Cards)', () => {
    it('tính toán chính xác chỉ số tổng hồ sơ, tỷ lệ chuyển đổi và thời gian tuyển dụng', () => {
      const rawCounts: [number, number, number, number, number, number] = [
        480, // Applied
        216, // Screened
        108, // Int 1
        48,  // Int 2
        28,  // Offered
        24,  // Hired
      ];
      const avgDays: [number, number, number, number, number, number] = [
        1.5, 2.5, 4.0, 5.5, 3.2, 5.7,
      ];

      const { kpi } = computeFunnelMetricsFromCounts(rawCounts, avgDays);

      // Tổng số hồ sơ
      expect(kpi.totalApplications).toBe(480);
      // Tỷ lệ chuyển đổi tổng thể: 24 / 480 = 5.0%
      expect(kpi.overallConversionRate).toBe(5.0);
      // Thời gian trung bình tuyển dụng: 1.5 + 2.5 + 4.0 + 5.5 + 3.2 + 5.7 = 22.4 ngày
      expect(kpi.avgTimeToHireDays).toBe(22.4);
      // Tiếp nhận: 24
      expect(kpi.totalHired).toBe(24);
      // Tỷ lệ duyệt hồ sơ: 216 / 480 = 45.0%
      expect(kpi.screeningPassRate).toBe(45.0);
      // Tỷ lệ nhận Offer: 24 / 28 = 85.7%
      expect(kpi.offerAcceptanceRate).toBe(85.7);
    });

    it('render đầy đủ 3 thẻ KPI cốt lõi và thẻ tiếp nhận việc làm', () => {
      const rawCounts: [number, number, number, number, number, number] = [
        480, 216, 108, 48, 28, 24,
      ];
      const { kpi } = computeFunnelMetricsFromCounts(rawCounts);

      const html = renderToString(<FunnelKpiCards kpi={kpi} />);

      // Thẻ 1: Tổng số hồ sơ ứng tuyển tiếp nhận
      expect(html).toContain('data-testid="kpi-card-total-applications"');
      expect(html).toContain('data-testid="kpi-value-total-applications"');
      expect(html).toContain('480');

      // Thẻ 2: Tỷ lệ chuyển đổi tổng thể
      expect(html).toContain('data-testid="kpi-card-conversion-rate"');
      expect(html).toContain('data-testid="kpi-value-conversion-rate"');
      expect(html).toContain('5%');

      // Thẻ 3: Thời gian tuyển dụng trung bình
      expect(html).toContain('data-testid="kpi-card-time-to-hire"');
      expect(html).toContain('data-testid="kpi-value-time-to-hire"');
      expect(html).toContain('22.4 ngày');

      // Thẻ 4: Tiếp nhận chính thức
      expect(html).toContain('data-testid="kpi-card-total-hired"');
      expect(html).toContain('data-testid="kpi-value-total-hired"');
      expect(html).toContain('24 nhân sự');
    });
  });

  // =========================================================================
  // AC 3: Bố cục hiển thị các tầng phễu tuyển dụng
  // =========================================================================
  describe('AC 3: Bố cục hiển thị các tầng phễu tuyển dụng', () => {
    it('định nghĩa đầy đủ 6 giai đoạn chuẩn từ Ứng tuyển đến Tiếp nhận', () => {
      expect(FUNNEL_STAGE_DEFINITIONS).toHaveLength(6);
      expect(FUNNEL_STAGE_DEFINITIONS[0].id).toBe('APPLIED');
      expect(FUNNEL_STAGE_DEFINITIONS[1].id).toBe('SCREENED');
      expect(FUNNEL_STAGE_DEFINITIONS[2].id).toBe('INTERVIEW_1');
      expect(FUNNEL_STAGE_DEFINITIONS[3].id).toBe('INTERVIEW_2');
      expect(FUNNEL_STAGE_DEFINITIONS[4].id).toBe('OFFERED');
      expect(FUNNEL_STAGE_DEFINITIONS[5].id).toBe('HIRED');
    });

    it('tính toán tỷ lệ phần trăm qua vòng so với vòng trước và số lượng bị loại', () => {
      const rawCounts: [number, number, number, number, number, number] = [
        480, // Vòng 1: APPLIED
        216, // Vòng 2: SCREENED
        108, // Vòng 3: INT 1
        48,  // Vòng 4: INT 2
        28,  // Vòng 5: OFFERED
        24,  // Vòng 6: HIRED
      ];

      const { stages } = computeFunnelMetricsFromCounts(rawCounts);

      // Vòng 1: Applied
      expect(stages[0].count).toBe(480);
      expect(stages[0].passRate).toBe(100);
      expect(stages[0].retentionRate).toBe(100);
      expect(stages[0].dropCount).toBe(0);

      // Vòng 2: Screened
      expect(stages[1].count).toBe(216);
      expect(stages[1].passRate).toBe(45.0); // 216 / 480
      expect(stages[1].dropCount).toBe(264); // 480 - 216
      expect(stages[1].dropRate).toBe(55.0);
      expect(stages[1].retentionRate).toBe(45.0);

      // Vòng 3: Interview 1
      expect(stages[2].count).toBe(108);
      expect(stages[2].passRate).toBe(50.0); // 108 / 216
      expect(stages[2].dropCount).toBe(108); // 216 - 108
      expect(stages[2].retentionRate).toBe(22.5); // 108 / 480

      // Vòng 4: Interview 2
      expect(stages[3].count).toBe(48);
      expect(stages[3].passRate).toBe(44.4); // 48 / 108
      expect(stages[3].dropCount).toBe(60);  // 108 - 48
      expect(stages[3].retentionRate).toBe(10.0); // 48 / 480

      // Vòng 5: Offered
      expect(stages[4].count).toBe(28);
      expect(stages[4].passRate).toBe(58.3); // 28 / 48
      expect(stages[4].dropCount).toBe(20);  // 48 - 28
      expect(stages[4].retentionRate).toBe(5.8);

      // Vòng 6: Hired
      expect(stages[5].count).toBe(24);
      expect(stages[5].passRate).toBe(85.7); // 24 / 28
      expect(stages[5].dropCount).toBe(4);   // 28 - 24
      expect(stages[5].retentionRate).toBe(5.0); // 24 / 480
    });

    it('render giao diện biểu đồ phễu FunnelStageChart đầy đủ 6 tầng và các chỉ số', () => {
      const rawCounts: [number, number, number, number, number, number] = [
        480, 216, 108, 48, 28, 24,
      ];
      const { stages } = computeFunnelMetricsFromCounts(rawCounts);

      const html = renderToString(<FunnelStageChart stages={stages} />);

      // Chứa thẻ phễu chính
      expect(html).toContain('data-testid="funnel-stage-chart"');

      // Chứa đủ 6 tầng
      expect(html).toContain('data-testid="stage-card-applied"');
      expect(html).toContain('data-testid="stage-count-applied"');
      expect(html).toContain('480');

      expect(html).toContain('data-testid="stage-card-screened"');
      expect(html).toContain('data-testid="stage-passrate-screened"');
      expect(html).toContain('45%');

      expect(html).toContain('data-testid="stage-card-interview_1"');
      expect(html).toContain('data-testid="stage-card-interview_2"');
      expect(html).toContain('data-testid="stage-card-offered"');

      expect(html).toContain('data-testid="stage-card-hired"');
      expect(html).toContain('data-testid="stage-retention-hired"');
      expect(html).toContain('5%');

      // Chứa connector hiển thị tỷ lệ chuyển đổi & loại bỏ
      expect(html).toContain('data-testid="funnel-connector-screened"');
      expect(html).toContain('data-testid="stage-dropcount-screened"');
      expect(html).toContain('-264');
    });

    it('render bảng đối soát chi tiết FunnelDetailTable', () => {
      const rawCounts: [number, number, number, number, number, number] = [
        480, 216, 108, 48, 28, 24,
      ];
      const { stages } = computeFunnelMetricsFromCounts(rawCounts);

      const html = renderToString(<FunnelDetailTable stages={stages} />);

      expect(html).toContain('data-testid="funnel-detail-table"');
      expect(html).toContain('data-testid="funnel-table-row-applied"');
      expect(html).toContain('data-testid="funnel-table-row-screened"');
      expect(html).toContain('data-testid="funnel-table-row-interview_1"');
      expect(html).toContain('data-testid="funnel-table-row-interview_2"');
      expect(html).toContain('data-testid="funnel-table-row-offered"');
      expect(html).toContain('data-testid="funnel-table-row-hired"');
      expect(html).toContain('Tiến độ quy mô');
    });
  });

  // =========================================================================
  // Service & Filter Integration Test
  // =========================================================================
  describe('Tích hợp Service Báo cáo Phễu Tuyển Dụng', () => {
    it('truy vấn báo cáo thành công với bộ lọc mặc định', async () => {
      const report = await recruitmentFunnelService.getFunnelReport(defaultFilters);
      expect(report).toBeDefined();
      expect(report.stages).toHaveLength(6);
      expect(report.kpi.totalApplications).toBeGreaterThan(0);
      expect(report.kpi.totalHired).toBeGreaterThan(0);
      expect(report.kpi.overallConversionRate).toBeGreaterThan(0);
    });

    it('điều chỉnh lưu lượng phễu khi chọn phòng ban Công nghệ (dept-it)', async () => {
      const itFilters: FunnelFilterState = {
        ...defaultFilters,
        departmentId: 'dept-it',
      };
      const report = await recruitmentFunnelService.getFunnelReport(itFilters);
      expect(report.stages).toHaveLength(6);
      expect(report.stages[0].count).toBeLessThan(480);
      // Đảm bảo tính phễu giảm dần hợp lý
      expect(report.stages[0].count).toBeGreaterThanOrEqual(report.stages[1].count);
      expect(report.stages[1].count).toBeGreaterThanOrEqual(report.stages[2].count);
    });

    it('điều chỉnh lưu lượng phễu khi chọn khoảng thời gian Hôm nay (TODAY)', async () => {
      const todayFilters: FunnelFilterState = {
        ...defaultFilters,
        datePreset: 'TODAY',
        startDate: '2026-10-15',
        endDate: '2026-10-15',
      };
      const report = await recruitmentFunnelService.getFunnelReport(todayFilters);
      expect(report.kpi.totalApplications).toBe(18);
      expect(report.stages[0].count).toBe(18);
      expect(report.stages[5].count).toBe(1);
    });
  });
});
