import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import * as XLSX from 'xlsx';
import {
  MOCK_TIME_COST_REPORT_DATA,
  formatCurrencyVND,
} from '../src/types/timeCostReport';
import {
  generateTimeCostReportFilename,
  createTimeCostReportWorkbook,
  exportTimeCostReportToExcel,
} from '../src/utils/timeCostReportExcelHelper';
import { RecruitmentTimeCostReportPage } from '../src/pages/Reports/RecruitmentTimeCostReportPage';

// Mock useToast hook
vi.mock('../src/components/notifications/useToast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

describe('Jira Task TKNHTTDNB1-571 / TKNHTTDNB1-84: Báo cáo thời gian và chi phí tuyển dụng (User Story S8-08)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Kiểm thử định dạng tiền tệ và Helper tạo tệp Excel
  // =========================================================================
  describe('Tiện ích định dạng và xuất báo cáo', () => {
    it('formatCurrencyVND định dạng số tiền VNĐ chuẩn xác', () => {
      expect(formatCurrencyVND(8400000)).toMatch(/8\.400\.000/);
      expect(formatCurrencyVND(8400000)).toContain('₫');
      expect(formatCurrencyVND(268800000)).toMatch(/268\.800\.000/);
      expect(formatCurrencyVND(0)).toContain('₫');
    });

    it('generateTimeCostReportFilename tạo tên file đúng định dạng ngày tháng', () => {
      const fixedDate = new Date(2026, 9, 18); // 18/10/2026
      const filename = generateTimeCostReportFilename(fixedDate);
      expect(filename).toBe('Bao_cao_thoi_gian_chi_phi_tuyen_dung_20261018.xlsx');
    });

    it('createTimeCostReportWorkbook tạo đối tượng Workbook đầy đủ 3 Sheet dữ liệu', () => {
      const wb = createTimeCostReportWorkbook(MOCK_TIME_COST_REPORT_DATA);

      expect(wb).toBeDefined();
      expect(wb.SheetNames).toEqual(['Tong_Quan_KPI', 'Theo_Phong_Ban', 'Theo_Chuc_Danh']);

      // Kiểm tra sheet 1: Tong_Quan_KPI
      const sheet1 = wb.Sheets['Tong_Quan_KPI'];
      const sheet1Json = XLSX.utils.sheet_to_json(sheet1, { header: 1 });
      const sheet1Text = JSON.stringify(sheet1Json);
      expect(sheet1Text).toContain('BÁO CÁO THỜI GIAN VÀ CHI PHÍ TUYỂN DỤNG');
      expect(sheet1Text).toContain('Thời gian tuyển dụng trung bình (Time-to-hire)');
      expect(sheet1Text).toContain('Chi phí tuyển dụng trung bình (Cost-per-hire)');

      // Kiểm tra sheet 2: Theo_Phong_Ban
      const sheet2 = wb.Sheets['Theo_Phong_Ban'];
      const sheet2Json = XLSX.utils.sheet_to_json(sheet2, { header: 1 });
      const sheet2Text = JSON.stringify(sheet2Json);
      expect(sheet2Text).toContain('BẢNG SO SÁNH THỜI GIAN & CHI PHÍ THEO KHỐI / PHÒNG BAN');
      expect(sheet2Text).toContain('Khối Công nghệ & Phần mềm');

      // Kiểm tra sheet 3: Theo_Chuc_Danh
      const sheet3 = wb.Sheets['Theo_Chuc_Danh'];
      const sheet3Json = XLSX.utils.sheet_to_json(sheet3, { header: 1 });
      const sheet3Text = JSON.stringify(sheet3Json);
      expect(sheet3Text).toContain('BẢNG CHI TIẾT HIỆU QUẢ THEO TỪNG VỊ TRÍ TUYỂN DỤNG');
      expect(sheet3Text).toContain('Senior Frontend Developer');
      expect(sheet3Text).toContain('Backend Golang Developer');
    });

    it('exportTimeCostReportToExcel tạo file Excel thành công', () => {
      // Mock writeFile on global/fs if needed, or check boolean return
      const result = exportTimeCostReportToExcel(MOCK_TIME_COST_REPORT_DATA);
      expect(result).toBe(true);
    });
  });

  // =========================================================================
  // 2. Kiểm thử cấu trúc Mock Data & Nghiệp vụ Time-to-hire / Cost-per-hire
  // =========================================================================
  describe('Cấu trúc dữ liệu và chỉ số nghiệp vụ tuyển dụng', () => {
    it('tổng quan KPI có đầy đủ các chỉ số Time-to-hire và Cost-per-hire', () => {
      const { kpi } = MOCK_TIME_COST_REPORT_DATA;
      expect(kpi.avgTimeToHire).toBe(28.5);
      expect(kpi.avgCostPerHire).toBe(8400000);
      expect(kpi.totalRecruitmentCost).toBe(268800000);
      expect(kpi.totalHires).toBe(32);
      expect(kpi.totalPostingFees).toBe(122400000);
      expect(kpi.totalReferralBonuses).toBe(146400000);
    });

    it('phân rã thời gian theo 4 giai đoạn pipeline có tổng bằng thời gian tuyển dụng trung bình', () => {
      const { pipelineStages, kpi } = MOCK_TIME_COST_REPORT_DATA;
      expect(pipelineStages).toHaveLength(4);

      const stageNames = pipelineStages.map((s) => s.stageName);
      expect(stageNames).toContain('SCREENING');
      expect(stageNames).toContain('INTERVIEWING');
      expect(stageNames).toContain('OFFER_APPROVAL');
      expect(stageNames).toContain('ONBOARDING');

      const sumDays = pipelineStages.reduce((acc, stage) => acc + stage.avgDays, 0);
      expect(Math.round(sumDays * 10) / 10).toBe(kpi.avgTimeToHire);
    });

    it('bóc tách cấu thành chi phí gồm phí đăng tin và thưởng giới thiệu nội bộ', () => {
      const { kpi } = MOCK_TIME_COST_REPORT_DATA;
      const totalBreakdown = kpi.totalPostingFees + kpi.totalReferralBonuses;

      expect(totalBreakdown).toBe(kpi.totalRecruitmentCost);
      expect(kpi.postingFeePercentage + kpi.referralBonusPercentage).toBe(100);
    });

    it('chứa danh sách phân tích chi tiết theo phòng ban và chức danh', () => {
      const { departments, positions } = MOCK_TIME_COST_REPORT_DATA;
      expect(departments.length).toBeGreaterThanOrEqual(4);
      expect(positions.length).toBeGreaterThanOrEqual(8);

      // Mỗi phòng ban có đủ các chỉ số cốt lõi
      departments.forEach((dept) => {
        expect(dept.departmentName).toBeDefined();
        expect(dept.avgTimeToHireDays).toBeGreaterThan(0);
        expect(dept.costPerHire).toBeGreaterThan(0);
        expect(dept.hiredCount).toBeGreaterThan(0);
      });

      // Mỗi chức danh có đủ thông tin
      positions.forEach((pos) => {
        expect(pos.jobTitle).toBeDefined();
        expect(pos.departmentName).toBeDefined();
        expect(pos.avgTimeToHireDays).toBeGreaterThan(0);
        expect(pos.costPerHire).toBeGreaterThan(0);
      });
    });
  });

  // =========================================================================
  // 3. Kiểm thử Giao diện Dashboard (RecruitmentTimeCostReportPage)
  // =========================================================================
  describe('Giao diện Dashboard Báo cáo (RecruitmentTimeCostReportPage)', () => {
    it('render thành công tiêu đề và mô tả trang chuẩn tiếng Việt', () => {
      const html = renderToString(<RecruitmentTimeCostReportPage />);

      expect(html).toContain('Báo cáo Thời gian &amp; Chi phí tuyển dụng');
      expect(html).toContain('Time-to-hire');
      expect(html).toContain('Cost-per-hire');
      expect(html).toContain('Xuất báo cáo Excel');
    });

    it('hiển thị đầy đủ 4 thẻ KPI chỉ số quan trọng', () => {
      const html = renderToString(<RecruitmentTimeCostReportPage />);

      // Thẻ 1: Time-to-hire
      expect(html).toContain('Time-to-hire trung bình');
      expect(html).toContain('28.5');
      expect(html).toContain('ngày');

      // Thẻ 2: Cost-per-hire
      expect(html).toContain('Cost-per-hire trung bình');

      // Thẻ 3: Tổng chi phí
      expect(html).toContain('Tổng chi phí đã chi');

      // Thẻ 4: Tổng số nhân sự đã tuyển
      expect(html).toContain('Nhân sự tuyển thành công');
      expect(html).toContain('32');
    });

    it('hiển thị trực quan tiến trình 4 giai đoạn trong Pipeline tuyển dụng', () => {
      const html = renderToString(<RecruitmentTimeCostReportPage />);

      expect(html).toContain('Phân tích thời gian Time-to-hire theo từng giai đoạn');
      expect(html).toContain('1. Sàng lọc &amp; Đánh giá hồ sơ');
      expect(html).toContain('4.2');
      expect(html).toContain('2. Các vòng phỏng vấn chuyên môn');
      expect(html).toContain('12.8');
      expect(html).toContain('3. Phê duyệt &amp; Đề xuất nhận việc (Offer)');
      expect(html).toContain('5.1');
      expect(html).toContain('4. Chờ tiếp nhận &amp; Nhận việc chính thức');
      expect(html).toContain('6.4');
    });

    it('hiển thị cấu thành chi phí tuyển dụng (Đăng tin vs Thưởng giới thiệu)', () => {
      const html = renderToString(<RecruitmentTimeCostReportPage />);

      expect(html).toContain('Cấu thành chi phí tuyển dụng (Cost-per-hire)');
      expect(html).toContain('Phí đăng tin tuyển dụng');
      expect(html).toContain('45.5');
      expect(html).toContain('Thưởng giới thiệu nội bộ');
      expect(html).toContain('54.5');
    });

    it('hiển thị khu vực so sánh đa chiều với các tabs và bộ chuyển đổi', () => {
      const html = renderToString(<RecruitmentTimeCostReportPage />);

      expect(html).toContain('Biểu đồ so sánh hiệu suất tuyển dụng đa chiều');
      expect(html).toContain('Theo Phòng ban');
      expect(html).toContain('Theo Chức danh');
      expect(html).toContain('Bảng số liệu');

      // Nút chuyển đổi thước đo
      expect(html).toContain('Thời gian (Time-to-hire)');
      expect(html).toContain('Chi phí (Cost-per-hire)');
    });

    it('hiển thị đầy đủ thanh bộ lọc đa chiều (Thời gian, Khối phòng ban, Chức danh, Đặt lại bộ lọc)', () => {
      const html = renderToString(<RecruitmentTimeCostReportPage />);

      expect(html).toContain('Khoảng thời gian báo cáo:');
      expect(html).toContain('Khối / Phòng ban:');
      expect(html).toContain('Vị trí công việc:');
      expect(html).toContain('Đặt lại bộ lọc');
    });
  });
});
