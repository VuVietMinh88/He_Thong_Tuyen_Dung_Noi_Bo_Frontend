import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  VisualFunnelSvgChart,
  DropOffAlertBanner,
  FunnelEmptyState,
  FunnelSkeletonLoader,
  FunnelStageChart,
} from '../src/components/RecruitmentFunnel';
import {
  detectBiggestDropOff,
  computeFunnelMetricsFromCounts,
  recruitmentFunnelService,
} from '../src/services/recruitmentFunnelService';
import type {
  FunnelFilterState,
  FunnelStageMetric,
  DropOffAlertInfo,
} from '../src/types/recruitmentFunnel';

describe('Jira Task TKNHTTDNB1-566: Tích hợp biểu đồ phễu và điểm rơi lớn nhất (User Story S9-01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // AC 1: Tích hợp biểu đồ phễu trực quan (Visual Funnel Chart)
  // =========================================================================
  describe('AC 1: Tích hợp biểu đồ phễu trực quan (Visual Funnel Chart)', () => {
    it('render đầy đủ SVG canvas và 6 tầng hình thang dốc thu hẹp', () => {
      const rawCounts: [number, number, number, number, number, number] = [
        480, 216, 108, 48, 28, 24,
      ];
      const { stages } = computeFunnelMetricsFromCounts(rawCounts);

      const html = renderToString(<VisualFunnelSvgChart stages={stages} />);

      // 1. Kiểm tra phần tử SVG chính
      expect(html).toContain('data-testid="visual-funnel-svg-chart"');
      expect(html).toContain('data-testid="funnel-svg-element"');
      expect(html).toContain('viewBox="0 0 600 370"');

      // 2. Kiểm tra đủ 6 hình thang nối tiếp
      expect(html).toContain('data-testid="funnel-trapezoid-applied"');
      expect(html).toContain('data-testid="funnel-trapezoid-screened"');
      expect(html).toContain('data-testid="funnel-trapezoid-interview_1"');
      expect(html).toContain('data-testid="funnel-trapezoid-interview_2"');
      expect(html).toContain('data-testid="funnel-trapezoid-offered"');
      expect(html).toContain('data-testid="funnel-trapezoid-hired"');

      // 3. Kiểm tra thông tin hiển thị bên trong hình phễu
      expect(html).toContain('1. Ứng tuyển mới');
      expect(html).toContain('480 ứng viên');
      expect(html).toContain('6. Tiếp nhận');
      expect(html).toContain('24 ứng viên');
    });

    it('cho phép chuyển đổi linh hoạt giữa các chế độ xem biểu đồ phễu', () => {
      const rawCounts: [number, number, number, number, number, number] = [
        480, 216, 108, 48, 28, 24,
      ];
      const { stages, biggestDropOff } = computeFunnelMetricsFromCounts(rawCounts);

      const html = renderToString(
        <FunnelStageChart stages={stages} biggestDropOff={biggestDropOff} />,
      );

      // Chứa các nút chuyển đổi góc nhìn
      expect(html).toContain('data-testid="view-mode-both"');
      expect(html).toContain('data-testid="view-mode-svg"');
      expect(html).toContain('data-testid="view-mode-cards"');

      // Chế độ mặc định BOTH hiển thị cả SVG và các tầng Cards
      expect(html).toContain('data-testid="visual-funnel-svg-chart"');
      expect(html).toContain('data-testid="stage-card-applied"');
    });
  });

  // =========================================================================
  // AC 2: Thuật toán phát hiện & Cảnh báo điểm rơi lớn nhất (Drop-off Detection)
  // =========================================================================
  describe('AC 2: Thuật toán phát hiện & Cảnh báo điểm rơi lớn nhất (Drop-off Detection)', () => {
    it('tính toán chính xác tỷ lệ hao hụt theo công thức và xác định đúng điểm rơi lớn nhất tại SCREENED', () => {
      // Kịch bản 1: Sàng lọc CV rớt nhiều nhất (500 -> 200 = 60.0% rớt)
      const rawCounts: [number, number, number, number, number, number] = [
        500, // Applied
        200, // Screened: dropRate = (500-200)/500 = 60.0%
        120, // Int 1: dropRate = (200-120)/200 = 40.0%
        70,  // Int 2: dropRate = (120-70)/120 = 41.7%
        50,  // Offered: dropRate = (70-50)/70 = 28.6%
        45,  // Hired: dropRate = (50-45)/50 = 10.0%
      ];

      const { stages, biggestDropOff } = computeFunnelMetricsFromCounts(rawCounts);

      expect(biggestDropOff).not.toBeNull();
      expect(biggestDropOff?.stageId).toBe('SCREENED');
      expect(biggestDropOff?.dropRate).toBe(60.0);
      expect(biggestDropOff?.dropCount).toBe(300);
      expect(biggestDropOff?.incomingCount).toBe(500);
      expect(biggestDropOff?.passedCount).toBe(200);
      expect(biggestDropOff?.alertMessage).toBe(
        'Điểm rơi lớn nhất: 60% ứng viên dừng lại tại vòng [Duyệt hồ sơ (Screened)]',
      );
      expect(biggestDropOff?.recommendation).toContain('vòng duyệt CV');

      // Đánh dấu isBiggestDropOff đúng trên stage
      const screenedStage = stages.find((s) => s.id === 'SCREENED');
      expect(screenedStage?.isBiggestDropOff).toBe(true);

      const otherStages = stages.filter((s) => s.id !== 'SCREENED');
      otherStages.forEach((s) => expect(s.isBiggestDropOff).toBe(false));
    });

    it('xác định chính xác điểm rơi lớn nhất tại Phỏng vấn vòng 1 khi tỷ lệ rớt cao đột biến', () => {
      // Kịch bản 2: Vòng PV 1 rớt nhiều nhất (400 -> 100 = 75.0% rớt)
      const rawCounts: [number, number, number, number, number, number] = [
        500, // Applied
        400, // Screened: dropRate = (500-400)/500 = 20.0%
        100, // Int 1: dropRate = (400-100)/400 = 75.0% -> BIGGEST!
        60,  // Int 2: dropRate = (100-60)/100 = 40.0%
        40,  // Offered: dropRate = (60-40)/60 = 33.3%
        36,  // Hired: dropRate = (40-36)/40 = 10.0%
      ];

      const { stages, biggestDropOff } = computeFunnelMetricsFromCounts(rawCounts);

      expect(biggestDropOff).not.toBeNull();
      expect(biggestDropOff?.stageId).toBe('INTERVIEW_1');
      expect(biggestDropOff?.dropRate).toBe(75.0);
      expect(biggestDropOff?.dropCount).toBe(300);
      expect(biggestDropOff?.incomingCount).toBe(400);
      expect(biggestDropOff?.alertMessage).toBe(
        'Điểm rơi lớn nhất: 75% ứng viên dừng lại tại vòng [Phỏng vấn vòng 1 (Round 1 Interview)]',
      );

      const int1Stage = stages.find((s) => s.id === 'INTERVIEW_1');
      expect(int1Stage?.isBiggestDropOff).toBe(true);
    });

    it('hàm detectBiggestDropOff xử lý an toàn khi mảng rỗng hoặc dữ liệu rớt = 0', () => {
      expect(detectBiggestDropOff([])).toBeNull();
      const { stages }: { stages: FunnelStageMetric[] } = computeFunnelMetricsFromCounts([0, 0, 0, 0, 0, 0]);
      expect(detectBiggestDropOff(stages)).toBeNull();
    });

    it('render thành phần DropOffAlertBanner hiển thị cảnh báo và khuyến nghị nổi bật', () => {
      const mockDropOff: DropOffAlertInfo = {
        stageId: 'INTERVIEW_2',
        stageName: 'Phỏng vấn chuyên sâu (In-depth Interview)',
        stageOrder: 4,
        dropRate: 55.6,
        dropCount: 60,
        incomingCount: 108,
        passedCount: 48,
        alertMessage: 'Điểm rơi lớn nhất: 55.6% ứng viên dừng lại tại vòng [Phỏng vấn chuyên sâu (In-depth Interview)]',
        recommendation: 'Ứng viên dừng lại nhiều ở vòng phỏng vấn chuyên sâu. Nên gửi trước bài test kỹ thuật.',
      };

      const html = renderToString(<DropOffAlertBanner dropOff={mockDropOff} />);

      expect(html).toContain('data-testid="dropoff-alert-banner"');
      expect(html).toContain('data-testid="dropoff-alert-message"');
      expect(html).toContain('55.6%');
      expect(html).toContain('Phỏng vấn chuyên sâu');
      expect(html).toContain('data-testid="dropoff-recommendation"');
      expect(html).toContain('gửi trước bài test kỹ thuật');
    });

    it('hiển thị badge cảnh báo điểm rơi trên tầng phễu tương ứng', () => {
      const rawCounts: [number, number, number, number, number, number] = [
        480, 216, 108, 48, 28, 24,
      ];
      const { stages, biggestDropOff } = computeFunnelMetricsFromCounts(rawCounts);

      const html = renderToString(
        <FunnelStageChart stages={stages} biggestDropOff={biggestDropOff} />,
      );

      // Điểm rơi lớn nhất được làm nổi bật với badge
      expect(html).toContain('data-testid="stage-dropoff-badge-interview_2"');
      expect(html).toContain('Điểm rơi lớn nhất');
      expect(html).toContain('55.6% rớt');
    });
  });

  // =========================================================================
  // AC 3: Kết nối API & Xử lý bất đồng bộ
  // =========================================================================
  describe('AC 3: Kết nối API & Xử lý bất đồng bộ', () => {
    const filters: FunnelFilterState = {
      datePreset: 'THIS_MONTH',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      departmentId: 'ALL',
      jobOpeningId: 'ALL',
      recruiterId: 'ALL',
    };

    it('phương thức getFunnelReportData trả về dữ liệu phễu đầy đủ kèm phân tích điểm rơi', async () => {
      const data = await recruitmentFunnelService.getFunnelReportData(filters);

      expect(data).toBeDefined();
      expect(data.stages).toHaveLength(6);
      expect(data.kpi).toBeDefined();
      expect(data.biggestDropOff).toBeDefined();
      expect(data.biggestDropOff?.dropRate).toBeGreaterThan(0);
    });

    it('render thành phần FunnelSkeletonLoader khi đang tải bất đồng bộ', () => {
      const html = renderToString(<FunnelSkeletonLoader />);

      expect(html).toContain('data-testid="funnel-skeleton-loader"');
      expect(html).toContain('animate-pulse');
    });

    it('render thành phần FunnelEmptyState khi không có dữ liệu ứng viên', () => {
      const handleReset = vi.fn();
      const html = renderToString(
        <FunnelEmptyState onResetFilters={handleReset} />,
      );

      expect(html).toContain('data-testid="funnel-empty-state"');
      expect(html).toContain('Chưa có dữ liệu phễu tuyển dụng');
      expect(html).toContain('data-testid="btn-empty-reset-filters"');
    });

    it('xử lý an toàn khi toàn bộ dữ liệu ứng viên bằng 0 (Empty dataset calculation)', () => {
      const { stages, kpi, biggestDropOff } = computeFunnelMetricsFromCounts([0, 0, 0, 0, 0, 0]);

      expect(kpi.totalApplications).toBe(0);
      expect(kpi.overallConversionRate).toBe(0);
      expect(kpi.totalHired).toBe(0);
      expect(biggestDropOff).toBeNull();
      stages.forEach((s) => {
        expect(s.count).toBe(0);
        expect(s.passRate).toBe(0);
        expect(s.isBiggestDropOff).toBe(false);
      });
    });
  });
});
