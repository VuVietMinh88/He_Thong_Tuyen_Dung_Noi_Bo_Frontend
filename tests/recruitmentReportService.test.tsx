import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import axiosClient from '../src/utils/axiosClient';
import {
  recruitmentReportService,
  handleRecruitmentReportError,
  resetStoredReportData,
} from '../src/services/recruitmentReportService';
import {
  MOCK_TIME_COST_REPORT_DATA,
  type TimeCostReportFilterState,
  type UpdateRecruitmentCostPayload,
} from '../src/types/timeCostReport';
import { createTimeCostReportWorkbook } from '../src/utils/timeCostReportExcelHelper';
import { RecruitmentCostInputModal } from '../src/components/Reports/RecruitmentCostInputModal';
import { RecruitmentTimeCostReportPage } from '../src/pages/Reports/RecruitmentTimeCostReportPage';

// Mock useToast hook
vi.mock('../src/components/notifications/useToast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

describe('Jira Task TKNHTTDNB1-572 / TKNHTTDNB1-84: Tích hợp nhập chi phí và xuất báo cáo Excel (User Story S8-08)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetStoredReportData();
  });

  const sampleFilters: TimeCostReportFilterState = {
    datePreset: 'THIS_YEAR',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    departmentId: 'dept-tech',
    jobTitleId: 'job-01',
  };

  // =========================================================================
  // AC 1: API Service recruitmentReportService (get, update, export)
  // =========================================================================
  describe('AC 1: API Service (recruitmentReportService)', () => {
    it('getRecruitmentReportData trả về dữ liệu báo cáo tổng hợp hợp lệ', async () => {
      const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: MOCK_TIME_COST_REPORT_DATA,
      });

      const data = await recruitmentReportService.getRecruitmentReportData(sampleFilters);

      expect(getSpy).toHaveBeenCalledWith('/recruitment/reports/time-cost', {
        params: sampleFilters,
      });
      expect(data).toBeDefined();
      expect(data.kpi.avgTimeToHire).toBe(28.5);
      expect(data.kpi.totalRecruitmentCost).toBe(268800000);
      expect(data.departments.length).toBeGreaterThan(0);
      expect(data.positions.length).toBeGreaterThan(0);
    });

    it('getRecruitmentReportData fallback an toàn về dữ liệu bộ nhớ khi server lỗi/offline', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Network error'));

      const data = await recruitmentReportService.getRecruitmentReportData(sampleFilters);

      expect(data).toBeDefined();
      expect(data.kpi.avgTimeToHire).toBe(28.5);
      expect(data.kpi.totalHires).toBe(32);
    });

    it('updateRecruitmentCost kiểm tra tính hợp lệ của tham số payload (Validation)', async () => {
      // 1. Payload thiếu cả positionId và departmentId
      await expect(
        recruitmentReportService.updateRecruitmentCost({
          postingFees: 10000000,
          referralBonuses: 5000000,
        } as UpdateRecruitmentCostPayload),
      ).rejects.toThrow('Vui lòng chọn vị trí công việc hoặc phòng ban');

      // 2. Chi phí âm
      await expect(
        recruitmentReportService.updateRecruitmentCost({
          positionId: 'job-01',
          postingFees: -1000,
          referralBonuses: 5000000,
        }),
      ).rejects.toThrow('Chi phí đăng tin và tiền thưởng giới thiệu không được là số âm');
    });

    it('updateRecruitmentCost cập nhật chi phí vị trí và tính toán lại Cost-per-hire thời gian thực', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({ data: { success: true } });

      // Vị trí job-01: Senior Frontend Developer (hired: 5)
      // Cập nhật postingFees = 30.000.000 VNĐ, referralBonuses = 20.000.000 VNĐ -> totalCost = 50.000.000 VNĐ
      // costPerHire mới = 50.000.000 / 5 = 10.000.000 VNĐ
      const payload: UpdateRecruitmentCostPayload = {
        positionId: 'job-01',
        postingFees: 30000000,
        referralBonuses: 20000000,
        notes: 'Cập nhật ngân sách đợt 2',
      };

      const result = await recruitmentReportService.updateRecruitmentCost(payload);

      expect(result.success).toBe(true);
      expect(postSpy).toHaveBeenCalledWith('/recruitment/reports/time-cost/costs', payload);

      const updatedPos = result.data.positions.find((p) => p.jobId === 'job-01');
      expect(updatedPos).toBeDefined();
      expect(updatedPos?.postingFees).toBe(30000000);
      expect(updatedPos?.referralBonuses).toBe(20000000);
      expect(updatedPos?.totalCost).toBe(50000000);
      expect(updatedPos?.costPerHire).toBe(10000000);

      // Phòng ban Khối Công nghệ & Phần mềm được tính lại tổng chi phí
      const targetDept = result.data.departments.find(
        (d) => d.departmentName === updatedPos?.departmentName,
      );
      expect(targetDept).toBeDefined();
      expect(targetDept?.totalCost).toBe(targetDept!.totalPostingFees + targetDept!.totalReferralBonuses);

      // KPI toàn hệ thống được cập nhật lại
      expect(result.data.kpi.totalRecruitmentCost).toBe(
        result.data.kpi.totalPostingFees + result.data.kpi.totalReferralBonuses,
      );
      expect(result.data.kpi.avgCostPerHire).toBe(
        Math.round(result.data.kpi.totalRecruitmentCost / result.data.kpi.totalHires),
      );
    });

    it('updateRecruitmentCost cập nhật chi phí cấp Phòng ban khi không chỉ định vị trí', async () => {
      const payload: UpdateRecruitmentCostPayload = {
        departmentId: 'dept-tech',
        postingFees: 80000000,
        referralBonuses: 100000000,
        notes: 'Ngân sách bổ sung khối Công nghệ',
      };

      const result = await recruitmentReportService.updateRecruitmentCost(payload);
      expect(result.success).toBe(true);

      const dept = result.data.departments.find((d) => d.departmentId === 'dept-tech');
      expect(dept?.totalPostingFees).toBe(80000000);
      expect(dept?.totalReferralBonuses).toBe(100000000);
      expect(dept?.totalCost).toBe(180000000);
      expect(dept?.costPerHire).toBe(Math.round(180000000 / dept!.hiredCount));
    });

    it('exportRecruitmentReportExcel xuất file Excel thành công với tên tệp chuẩn', async () => {
      const result = await recruitmentReportService.exportRecruitmentReportExcel(
        sampleFilters,
        MOCK_TIME_COST_REPORT_DATA,
      );

      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/^Bao_cao_thoi_gian_chi_phi_tuyen_dung_\d{8}\.xlsx$/);
    });

    it('handleRecruitmentReportError format các mã lỗi Axios thành tiếng Việt thân thiện', () => {
      const err400 = { isAxiosError: true, response: { status: 400 } };
      expect(handleRecruitmentReportError(err400, 'Lỗi').message).toContain(
        'Dữ liệu chi phí hoặc bộ lọc yêu cầu không hợp lệ',
      );

      const err401 = { isAxiosError: true, response: { status: 401 } };
      expect(handleRecruitmentReportError(err401, 'Lỗi').message).toContain(
        'Phiên làm việc đã hết hạn',
      );

      const err403 = { isAxiosError: true, response: { status: 403 } };
      expect(handleRecruitmentReportError(err403, 'Lỗi').message).toContain(
        'Bạn không có quyền truy cập báo cáo',
      );

      const err500 = { isAxiosError: true, response: { status: 500 } };
      expect(handleRecruitmentReportError(err500, 'Lỗi').message).toContain(
        'Hệ thống máy chủ gặp sự cố',
      );

      const errNetwork = { isAxiosError: true };
      expect(handleRecruitmentReportError(errNetwork, 'Lỗi').message).toContain(
        'Không thể kết nối đến máy chủ',
      );
    });
  });

  // =========================================================================
  // AC 2: Modal Nhập chi phí (RecruitmentCostInputModal)
  // =========================================================================
  describe('AC 2: Modal Nhập chi phí (RecruitmentCostInputModal)', () => {
    it('không render khi isOpen là false', () => {
      const html = renderToString(
        <RecruitmentCostInputModal
          isOpen={false}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
          departments={MOCK_TIME_COST_REPORT_DATA.departments}
          positions={MOCK_TIME_COST_REPORT_DATA.positions}
        />,
      );
      expect(html).toBe('');
    });

    it('render đầy đủ các trường nhập chi phí và xem trước tác động chi phí khi isOpen là true', () => {
      const html = renderToString(
        <RecruitmentCostInputModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
          departments={MOCK_TIME_COST_REPORT_DATA.departments}
          positions={MOCK_TIME_COST_REPORT_DATA.positions}
          initialPositionId="job-01"
        />,
      );

      // Tiêu đề modal
      expect(html).toContain('Nhập &amp; Cập nhật chi phí tuyển dụng');
      expect(html).toContain('Phạm vi cập nhật:');
      expect(html).toContain('Theo Vị trí / Chức danh');
      expect(html).toContain('Theo Khối / Phòng ban');

      // Các trường nhập liệu
      expect(html).toContain('Phí đăng tin &amp; Quảng cáo (Job Posting Fees):');
      expect(html).toContain('Thưởng giới thiệu nhân sự (Referral Bonuses):');
      expect(html).toContain('Ghi chú / Đợt thanh toán (Tùy chọn):');

      // Khối xem trước tác động chi phí (Live preview)
      expect(html).toContain('Xem trước tác động chi phí (Live Preview):');
      expect(html).toContain('Tổng chi phí mới');
      expect(html).toContain('Cost-per-hire mới');

      // Nút hành động
      expect(html).toContain('Hủy bỏ');
      expect(html).toContain('Lưu &amp; Cập nhật báo cáo');
    });

    it('tính toán chính xác bộ lọc bảng tính Sheet 2 và Sheet 3 theo bộ lọc phòng ban và chức danh', () => {
      const filteredWb = createTimeCostReportWorkbook(MOCK_TIME_COST_REPORT_DATA, sampleFilters);

      expect(filteredWb.SheetNames).toEqual(['Tong_Quan_KPI', 'Theo_Phong_Ban', 'Theo_Chuc_Danh']);

      // Sheet 1 ghi rõ phòng ban đang lọc
      const sheet1Text = JSON.stringify(filteredWb.Sheets['Tong_Quan_KPI']);
      expect(sheet1Text).toContain('dept-tech');

      // Sheet 2 chỉ lọc phòng ban dept-tech
      const sheet2Text = JSON.stringify(filteredWb.Sheets['Theo_Phong_Ban']);
      expect(sheet2Text).toContain('Khối Công nghệ & Phần mềm');

      // Sheet 3 chỉ lọc vị trí pos-tech-01
      const sheet3Text = JSON.stringify(filteredWb.Sheets['Theo_Chuc_Danh']);
      expect(sheet3Text).toContain('Senior Frontend Developer');
    });
  });

  // =========================================================================
  // AC 3: Tích hợp vào màn hình báo cáo (RecruitmentTimeCostReportPage)
  // =========================================================================
  describe('AC 3: Tích hợp giao diện và nút thao tác', () => {
    it('hiển thị nút Nhập chi phí nổi bật ở thanh công cụ Header', () => {
      const html = renderToString(<RecruitmentTimeCostReportPage />);

      expect(html).toContain('data-testid="btn-open-cost-modal"');
      expect(html).toContain('Nhập chi phí');
    });

    it('hiển thị nút Xuất báo cáo Excel và nút Đặt lại bộ lọc', () => {
      const html = renderToString(<RecruitmentTimeCostReportPage />);

      expect(html).toContain('data-testid="btn-export-excel"');
      expect(html).toContain('Xuất báo cáo Excel');
      expect(html).toContain('Đặt lại bộ lọc');
    });
  });
});

