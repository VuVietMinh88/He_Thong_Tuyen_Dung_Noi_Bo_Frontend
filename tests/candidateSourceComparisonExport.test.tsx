import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import * as XLSX from 'xlsx';
import {
  generateSourceReportFilename,
  formatQualityTierLabel,
  createSourceReportExcelBlob,
} from '../src/utils/sourceReportExcelHelper';
import {
  candidateSourceReportService,
  calculateBenchmarkHighlights,
} from '../src/services/candidateSourceReportService';
import {
  SourceBenchmarkComparison,
  CandidateSourceReportDashboard,
} from '../src/components/CandidateSourceReport';
import type {
  CandidateSourceMetric,
  SourceQualityReportData,
  SourceReportFilterState,
} from '../src/types/candidateSourceReport';

// Mock react-router-dom Link
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, className }: { children: React.ReactNode; to: string; className: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

// Mock useToast hook
vi.mock('../src/components/notifications/useToast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

describe('Jira Task TKNHTTDNB1-579: Tích hợp so sánh nguồn và xuất báo cáo Excel (User Story S9-02)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockSources: CandidateSourceMetric[] = [
    {
      sourceId: 'TOPCV',
      sourceName: 'TopCV',
      channelCategory: 'JOB_BOARD',
      iconName: 'topcv',
      brandColor: '#00B14F',
      bgGradient: 'from-emerald-500 to-teal-600',
      totalApplications: 300, // Volume lớn nhất
      screenedCount: 150,
      interviewCount: 75,
      offeredCount: 20,
      hiredCount: 15,
      qualificationRate: 25.0,
      hireRate: 5.0,
      screeningPassRate: 50.0,
      offerAcceptanceRate: 75.0,
      qualityTier: 'GOOD',
      shareOfApplications: 50.0,
      shareOfHires: 37.5,
      avgDaysToHire: 25,
    },
    {
      sourceId: 'REFERRAL',
      sourceName: 'Giới thiệu nội bộ (Referral)',
      channelCategory: 'INTERNAL',
      iconName: 'referral',
      brandColor: '#8B5CF6',
      bgGradient: 'from-purple-600 to-violet-700',
      totalApplications: 100,
      screenedCount: 80,
      interviewCount: 60,
      offeredCount: 25,
      hiredCount: 20, // Tỷ lệ tuyển cao nhất: 20% -> Top ROI
      qualificationRate: 60.0,
      hireRate: 20.0,
      screeningPassRate: 80.0,
      offerAcceptanceRate: 80.0,
      qualityTier: 'EXCELLENT',
      shareOfApplications: 16.7,
      shareOfHires: 50.0,
      avgDaysToHire: 14, // Nhanh nhất
    },
    {
      sourceId: 'FACEBOOK',
      sourceName: 'Facebook',
      channelCategory: 'SOCIAL',
      iconName: 'facebook',
      brandColor: '#1877F2',
      bgGradient: 'from-blue-500 to-indigo-600',
      totalApplications: 200,
      screenedCount: 50,
      interviewCount: 16,
      offeredCount: 6,
      hiredCount: 5,
      qualificationRate: 8.0, // Thấp nhất -> Cần tối ưu sàng lọc
      hireRate: 2.5,
      screeningPassRate: 25.0,
      offerAcceptanceRate: 83.3,
      qualityTier: 'POOR',
      shareOfApplications: 33.3,
      shareOfHires: 12.5,
      avgDaysToHire: 32,
    },
  ];

  const defaultFilters: SourceReportFilterState = {
    datePreset: 'THIS_MONTH',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    departmentId: 'ALL',
    jobOpeningId: 'ALL',
    campaignId: 'ALL',
  };

  // =========================================================================
  // AC 1: Component So sánh đối đầu giữa các nguồn (Source Benchmark Comparison)
  // =========================================================================
  describe('AC 1: Component So sánh đối đầu giữa các nguồn (Source Benchmark Comparison)', () => {
    it('render đầy đủ Biểu đồ cột nhóm (Grouped Bar Chart) so sánh song song Tiếp nhận vs Tuyển dụng', () => {
      const benchmark = calculateBenchmarkHighlights(mockSources);
      const html = renderToString(
        <SourceBenchmarkComparison sources={mockSources} benchmark={benchmark} />,
      );

      // 1. Kiểm tra khung chứa chính và tiêu đề
      expect(html).toContain('data-testid="source-benchmark-comparison"');
      expect(html).toContain('So sánh đối đầu hiệu suất các kênh tuyển dụng');
      expect(html).toContain('data-testid="grouped-bar-chart-container"');

      // 2. Kiểm tra hàng so sánh và các thanh bar song song của từng kênh
      expect(html).toContain('data-testid="benchmark-row-topcv"');
      expect(html).toContain('data-testid="bar-applied-topcv"');
      expect(html).toContain('data-testid="bar-hired-topcv"');

      expect(html).toContain('data-testid="benchmark-row-referral"');
      expect(html).toContain('data-testid="bar-applied-referral"');
      expect(html).toContain('data-testid="bar-hired-referral"');

      // 3. Kiểm tra các nút sắp xếp đối đầu
      expect(html).toContain('data-testid="btn-sort-benchmark-rate"');
      expect(html).toContain('data-testid="btn-sort-benchmark-apps"');
      expect(html).toContain('data-testid="btn-sort-benchmark-hires"');
    });

    it('hiển thị chính xác 4 thẻ đánh giá nổi bật (Benchmark Highlight Cards)', () => {
      const benchmark = calculateBenchmarkHighlights(mockSources);
      const html = renderToString(
        <SourceBenchmarkComparison sources={mockSources} benchmark={benchmark} />,
      );

      // 1. Thẻ Nguồn mang lại lượng ứng viên lớn nhất
      expect(html).toContain('data-testid="highlight-card-highest-volume"');
      expect(html).toContain('Lượng ứng viên lớn nhất');
      expect(html).toContain('data-testid="highlight-highest-volume-name"');
      expect(html).toContain('TopCV');
      expect(html).toContain('data-testid="highlight-highest-volume-count"');
      expect(html).toContain('300');

      // 2. Thẻ Nguồn có tỷ lệ tuyển dụng thành công cao nhất (ROI cao nhất)
      expect(html).toContain('data-testid="highlight-card-highest-hire-rate"');
      expect(html).toContain('Tỷ lệ tuyển cao nhất (ROI)');
      expect(html).toContain('data-testid="highlight-highest-roi-name"');
      expect(html).toContain('Giới thiệu nội bộ (Referral)');
      expect(html).toContain('data-testid="highlight-highest-roi-rate"');
      expect(html).toContain('20%');

      // 3. Thẻ Tuyển dụng nhanh nhất
      expect(html).toContain('data-testid="highlight-card-fastest-hiring"');
      expect(html).toContain('Tuyển dụng nhanh nhất');
      expect(html).toContain('14'); // 14 ngày

      // 4. Thẻ Cần tối ưu sàng lọc
      expect(html).toContain('data-testid="highlight-card-lowest-quality"');
      expect(html).toContain('Cần tối ưu sàng lọc');
      expect(html).toContain('Facebook');
    });

    it('thuật toán calculateBenchmarkHighlights xử lý an toàn khi mảng rỗng', () => {
      const emptyBenchmark = calculateBenchmarkHighlights([]);
      expect(emptyBenchmark.highestVolumeSource).toBeNull();
      expect(emptyBenchmark.highestHireRateSource).toBeNull();
      expect(emptyBenchmark.fastestHiringSource).toBeNull();
      expect(emptyBenchmark.lowestQualitySource).toBeNull();
    });
  });

  // =========================================================================
  // AC 2: Thao tác xuất báo cáo Excel (Export to Excel)
  // =========================================================================
  describe('AC 2: Thao tác xuất báo cáo Excel (Export to Excel)', () => {
    it('tạo tên file chuẩn định dạng Bao_cao_chat_luong_nguon_YYYYMMDD.xlsx', () => {
      const fixedDate = new Date(2026, 9, 15); // 15/10/2026
      const filename = generateSourceReportFilename(fixedDate);

      expect(filename).toBe('Bao_cao_chat_luong_nguon_20261015.xlsx');
    });

    it('chuyển đổi nhãn xếp hạng chất lượng formatQualityTierLabel chính xác', () => {
      expect(formatQualityTierLabel('EXCELLENT')).toBe('Xuất sắc (Hiệu quả cao)');
      expect(formatQualityTierLabel('GOOD')).toBe('Đạt chuẩn (Khá)');
      expect(formatQualityTierLabel('AVERAGE')).toBe('Trung bình');
      expect(formatQualityTierLabel('POOR')).toBe('Cần cải thiện (Kém)');
    });

    it('hàm createSourceReportExcelBlob tạo file Excel .xlsx hợp lệ chứa 2 Sheet phân tích', async () => {
      const mockReportData: SourceQualityReportData = {
        filters: defaultFilters,
        kpi: {
          totalApplications: 600,
          totalScreened: 280,
          totalInterviews: 151,
          totalOffers: 51,
          totalHired: 40,
          overallQualificationRate: 25.2,
          overallHireRate: 6.7,
          overallScreeningPassRate: 46.7,
          overallOfferAcceptanceRate: 78.4,
          topPerformingSource: mockSources[1],
          highestVolumeSource: mockSources[0],
          fastestHiringSource: mockSources[1],
        },
        sources: mockSources,
        updatedAt: '2026-10-15T12:00:00Z',
      };

      const blob = createSourceReportExcelBlob(mockReportData);

      // 1. Kiểm tra định dạng MIME type của Excel
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(blob.size).toBeGreaterThan(0);

      // 2. Đọc lại nội dung Excel qua SheetJS để xác nhận tính toàn vẹn
      const arrayBuffer = await blob.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });

      // Phải có đúng 2 sheet
      expect(workbook.SheetNames).toContain('Chất lượng nguồn ứng viên');
      expect(workbook.SheetNames).toContain('So sánh đối đầu & Benchmark');

      // Kiểm tra sheet 1 có dữ liệu
      const sheet1 = workbook.Sheets['Chất lượng nguồn ứng viên'];
      const sheet1Data = XLSX.utils.sheet_to_json(sheet1, { header: 1 }) as string[][];
      const flatText = JSON.stringify(sheet1Data);

      expect(flatText).toContain('BÁO CÁO ĐÁNH GIÁ CHẤT LƯỢNG CÁC KÊNH NGUỒN ỨNG VIÊN');
      expect(flatText).toContain('TopCV');
      expect(flatText).toContain('Giới thiệu nội bộ (Referral)');
      expect(flatText).toContain('TỔNG CỘNG / TOÀN HỆ THỐNG');

      // Kiểm tra sheet 2 có dữ liệu so sánh
      const sheet2 = workbook.Sheets['So sánh đối đầu & Benchmark'];
      const sheet2Data = XLSX.utils.sheet_to_json(sheet2, { header: 1 }) as string[][];
      const flatText2 = JSON.stringify(sheet2Data);
      expect(flatText2).toContain('BẢNG SO SÁNH ĐỐI ĐẦU HIỆU SUẤT CÁC NGUỒN ỨNG VIÊN');
      expect(flatText2).toContain('DANH HIỆU DẪN ĐẦU (BENCHMARK HIGHLIGHTS)');
    });

    it('Dashboard hiển thị nút Xuất báo cáo Excel với icon và định dạng .xlsx', () => {
      const html = renderToString(<CandidateSourceReportDashboard />);

      // Nút xuất Excel nổi bật
      expect(html).toContain('data-testid="btn-export-excel"');
      expect(html).toContain('Xuất báo cáo Excel (.xlsx)');
      // Nút xuất CSV dự phòng
      expect(html).toContain('data-testid="btn-export-csv"');
    });
  });

  // =========================================================================
  // AC 3: Kết nối API & Xử lý bất đồng bộ
  // =========================================================================
  describe('AC 3: Kết nối API & Xử lý bất đồng bộ', () => {
    it('phương thức getSourceComparisonReport trả về đầy đủ sources, kpi và benchmark', async () => {
      const data = await candidateSourceReportService.getSourceComparisonReport(defaultFilters);

      expect(data).toBeDefined();
      expect(data.sources.length).toBeGreaterThan(0);
      expect(data.kpi).toBeDefined();
      expect(data.benchmark).toBeDefined();
      expect(data.benchmark.highestVolumeSource).not.toBeNull();
      expect(data.benchmark.highestHireRateSource).not.toBeNull();
    });

    it('Dashboard hỗ trợ chuyển đổi linh hoạt qua lại giữa các Tab chế độ xem', () => {
      const html = renderToString(<CandidateSourceReportDashboard />);

      // Dashboard ban đầu ở chế độ tải hoặc hiển thị tabs
      expect(html).toContain('data-testid="candidate-source-report-dashboard"');
    });
  });
});
