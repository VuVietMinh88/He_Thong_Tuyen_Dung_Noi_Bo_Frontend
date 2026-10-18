import React, { useState, useMemo, useId } from 'react';
import {
  Clock,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Filter,
  Building,
  Briefcase,
  Calendar,
  Layers,
  BarChart3,
  FileSpreadsheet,
  Search,
  Users,
} from 'lucide-react';
import { useToast } from '../../components/notifications/useToast';
import {
  type TimeCostReportData,
  type TimeCostReportFilterState,
  type TimeCostDateRangePreset,
  MOCK_TIME_COST_REPORT_DATA,
  formatCurrencyVND,
} from '../../types/timeCostReport';
import { exportTimeCostReportToExcel } from '../../utils/timeCostReportExcelHelper';

const DEFAULT_FILTERS: TimeCostReportFilterState = {
  datePreset: 'THIS_YEAR',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  departmentId: 'ALL',
  jobTitleId: 'ALL',
};

const DATE_PRESETS: Array<{ id: TimeCostDateRangePreset; label: string }> = [
  { id: 'THIS_YEAR', label: 'Năm 2026 (Hiện tại)' },
  { id: 'THIS_QUARTER', label: 'Quý 4/2026' },
  { id: 'LAST_QUARTER', label: 'Quý 3/2026' },
  { id: 'THIS_MONTH', label: 'Tháng 10/2026' },
  { id: 'LAST_MONTH', label: 'Tháng 09/2026' },
];

const DEPARTMENTS_LIST = [
  { id: 'ALL', label: 'Tất cả khối / phòng ban' },
  { id: 'dept-tech', label: 'Khối Công nghệ & Phần mềm' },
  { id: 'dept-prod', label: 'Phòng Phát triển Sản phẩm & Thiết kế' },
  { id: 'dept-biz', label: 'Khối Kinh doanh & Marketing' },
  { id: 'dept-ops', label: 'Khối Vận hành & Nhân sự' },
];

/**
 * Màn hình Báo cáo Thời gian và Chi phí Tuyển dụng (Time-to-hire & Cost-per-hire)
 * Jira Task: TKNHTTDNB1-571 / TKNHTTDNB1-84 (User Story S8-08)
 */
export const RecruitmentTimeCostReportPage: React.FC = () => {
  const { addToast } = useToast();
  const searchInputId = useId();
  const datePresetSelectId = useId();
  const departmentSelectId = useId();
  const positionSelectId = useId();

  // Dữ liệu báo cáo
  const [reportData] = useState<TimeCostReportData>(MOCK_TIME_COST_REPORT_DATA);
  const [filters, setFilters] = useState<TimeCostReportFilterState>(DEFAULT_FILTERS);

  // Tab chuyển đổi so sánh: Theo Phòng ban / Theo Chức danh / Bảng chi tiết
  const [comparisonTab, setComparisonTab] = useState<'DEPARTMENT' | 'POSITION' | 'TABLE'>('DEPARTMENT');

  // Metric đang xem trên biểu đồ: TIME (Ngày) | COST (Chi phí VNĐ) | HIRES (Số lượng)
  const [chartMetric, setChartMetric] = useState<'TIME' | 'COST' | 'HIRES'>('TIME');

  // Từ khóa tìm kiếm trong bảng dữ liệu
  const [tableSearchKeyword, setTableSearchKeyword] = useState<string>('');

  // Trạng thái đang xuất file Excel
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Lọc dữ liệu phòng ban theo bộ lọc
  const filteredDepartments = useMemo(() => {
    return reportData.departments.filter((dept) => {
      if (filters.departmentId !== 'ALL' && dept.departmentId !== filters.departmentId) {
        return false;
      }
      return true;
    });
  }, [reportData.departments, filters.departmentId]);

  // Lọc dữ liệu chức danh theo bộ lọc và từ khóa
  const filteredPositions = useMemo(() => {
    return reportData.positions.filter((pos) => {
      if (filters.departmentId !== 'ALL') {
        const matchedDept = reportData.departments.find((d) => d.departmentId === filters.departmentId);
        if (matchedDept && pos.departmentName !== matchedDept.departmentName) {
          return false;
        }
      }

      if (filters.jobTitleId !== 'ALL' && pos.jobId !== filters.jobTitleId) {
        return false;
      }

      if (tableSearchKeyword.trim()) {
        const kw = tableSearchKeyword.toLowerCase().trim();
        const matchTitle = pos.jobTitle.toLowerCase().includes(kw);
        const matchDept = pos.departmentName.toLowerCase().includes(kw);
        return matchTitle || matchDept;
      }

      return true;
    });
  }, [reportData.positions, reportData.departments, filters.departmentId, filters.jobTitleId, tableSearchKeyword]);

  /**
   * Xử lý xuất báo cáo ra file Excel (.xlsx) (AC 2)
   */
  const handleExportExcel = () => {
    try {
      setIsExporting(true);
      exportTimeCostReportToExcel(reportData, filters);
      addToast({
        type: 'success',
        message: 'Xuất file báo cáo Excel (Bao_cao_thoi_gian_chi_phi_tuyen_dung.xlsx) thành công!',
      });
    } catch (err: unknown) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể xuất file Excel. Vui lòng thử lại.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Đặt lại bộ lọc
   */
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setTableSearchKeyword('');
    addToast({
      type: 'info',
      message: 'Đã thiết lập lại toàn bộ bộ lọc báo cáo.',
    });
  };

  const { kpi, pipelineStages } = reportData;

  // Tính giá trị max để vẽ biểu đồ thanh ngang
  const maxDeptTimeToHire = Math.max(...reportData.departments.map((d) => d.avgTimeToHireDays), 40);
  const maxDeptCost = Math.max(...reportData.departments.map((d) => d.costPerHire), 12000000);
  const maxPosTimeToHire = Math.max(...reportData.positions.map((p) => p.avgTimeToHireDays), 45);
  const maxPosCost = Math.max(...reportData.positions.map((p) => p.costPerHire), 15000000);

  return (
    <div
      data-testid="recruitment-time-cost-report-page"
      className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 space-y-6 font-sans"
    >
      {/* ========================================================================= */}
      {/* 1. HEADER & THANH CÔNG CỤ XUẤT BÁO CÁO (AC 2)                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Báo cáo Thời gian & Chi phí tuyển dụng
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Phân tích chỉ số Time-to-hire, Cost-per-hire và so sánh hiệu quả đa chiều giữa các phòng ban, chức danh
              </p>
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0">
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer shadow-2xs"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Đặt lại bộ lọc</span>
          </button>

          {/* Nút Xuất Excel (AC 2) */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 transition cursor-pointer disabled:opacity-50"
            title="Tải về file Excel (.xlsx) đầy đủ 3 bảng tính số liệu chi tiết"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExporting ? 'Đang tạo Excel...' : 'Xuất báo cáo Excel'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THANH BỘ LỌC ĐA NĂNG (FILTERS BAR - AC 2)                               */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Lọc kỳ báo cáo */}
          <div className="space-y-1">
            <label htmlFor={datePresetSelectId} className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Khoảng thời gian báo cáo:</span>
            </label>
            <select
              id={datePresetSelectId}
              value={filters.datePreset}
              onChange={(e) =>
                setFilters({ ...filters, datePreset: e.target.value as TimeCostDateRangePreset })
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-medium outline-none focus:border-indigo-500 cursor-pointer"
            >
              {DATE_PRESETS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc phòng ban */}
          <div className="space-y-1">
            <label htmlFor={departmentSelectId} className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-600" />
              <span>Khối / Phòng ban:</span>
            </label>
            <select
              id={departmentSelectId}
              value={filters.departmentId}
              onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-medium outline-none focus:border-indigo-500 cursor-pointer"
            >
              {DEPARTMENTS_LIST.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc chức danh */}
          <div className="space-y-1">
            <label htmlFor={positionSelectId} className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              <span>Vị trí công việc:</span>
            </label>
            <select
              id={positionSelectId}
              value={filters.jobTitleId}
              onChange={(e) => setFilters({ ...filters, jobTitleId: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-medium outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">Tất cả chức danh ({reportData.positions.length} vị trí)</option>
              {reportData.positions.map((pos) => (
                <option key={pos.jobId} value={pos.jobId}>
                  {pos.jobTitle}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CÁC THẺ CHỈ SỐ CỐT LÕI (CORE METRICS CARDS - AC 1)                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Time-to-hire */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Time-to-hire trung bình
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{kpi.avgTimeToHire}</span>
              <span className="text-sm font-bold text-slate-500">ngày</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
              <TrendingDown className="w-4 h-4" />
              <span>Nhanh hơn {Math.abs(kpi.timeToHireChange)}% so với kỳ trước</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            Tính từ lúc duyệt Yêu cầu TD đến khi Ứng viên nhận việc
          </p>
        </div>

        {/* Card 2: Cost-per-hire */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cost-per-hire trung bình
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {formatCurrencyVND(kpi.avgCostPerHire)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
              <TrendingDown className="w-4 h-4" />
              <span>Tiết kiệm {Math.abs(kpi.costPerHireChange)}% chi phí/nhân sự</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            Gồm phí đăng tin & thưởng giới thiệu nội bộ
          </p>
        </div>

        {/* Card 3: Tổng chi phí tuyển dụng */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng chi phí đã chi
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {formatCurrencyVND(kpi.totalRecruitmentCost)}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-1">
              <span>Đăng tin: <strong>{kpi.postingFeePercentage}%</strong></span>
              <span>•</span>
              <span>Thưởng: <strong>{kpi.referralBonusPercentage}%</strong></span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            Phục vụ tiếp nhận {kpi.totalHires} nhân sự trong kỳ
          </p>
        </div>

        {/* Card 4: Tổng số nhân sự nhận việc */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Nhân sự tuyển thành công
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{kpi.totalHires}</span>
              <span className="text-sm font-bold text-slate-500">nhân sự</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
              <TrendingUp className="w-4 h-4" />
              <span>Tăng +{kpi.hiresChange}% quy mô tiếp nhận</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            Đạt 91.4% mục tiêu kế hoạch ban đầu
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PHÂN TÍCH TIME-TO-HIRE THEO PIPELINE & CẤU THÀNH COST-PER-HIRE (AC 1)  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột trái (7 cols): Phân tích thời gian từng giai đoạn trong Pipeline */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Phân tích thời gian Time-to-hire theo từng giai đoạn</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Đối chiếu số ngày thực tế với vạch chuẩn Benchmark để phát hiện các khâu nghẽn cổ chai
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
              Tổng {kpi.avgTimeToHire} ngày
            </span>
          </div>

          {/* Danh sách 4 giai đoạn */}
          <div className="space-y-4 pt-1">
            {pipelineStages.map((stage) => {
              const percentOfTotal = Math.round((stage.avgDays / kpi.avgTimeToHire) * 100);

              return (
                <div key={stage.stageId} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs sm:text-sm text-slate-900">
                        {stage.stageLabel}
                      </div>
                      <p className="text-[11px] text-slate-500">{stage.description}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900">{stage.avgDays} ngày</span>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          Chuẩn: {stage.benchmarkDays} ngày ({percentOfTotal}%)
                        </span>
                      </div>

                      {stage.status === 'EXCELLENT' ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Xuất sắc
                        </span>
                      ) : stage.status === 'GOOD' ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                          Đạt chuẩn
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                          Cần tối ưu
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thanh tiến trình thời gian trực quan */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 ${
                        stage.status === 'EXCELLENT'
                          ? 'bg-emerald-500'
                          : stage.status === 'GOOD'
                          ? 'bg-indigo-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${percentOfTotal}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cột phải (5 cols): Phân rã cấu thành chi phí tuyển dụng (Cost Breakdown) */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Cấu thành chi phí tuyển dụng (Cost-per-hire)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tỷ trọng giữa phí đăng tin tuyển dụng và thưởng giới thiệu nội bộ
            </p>
          </div>

          <div className="space-y-4">
            {/* Phí đăng tin */}
            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                  <span>Phí đăng tin tuyển dụng (Job Postings)</span>
                </span>
                <strong className="text-indigo-900 font-bold">{kpi.postingFeePercentage}%</strong>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-indigo-950">
                  {formatCurrencyVND(kpi.totalPostingFees)}
                </span>
                <span className="text-xs text-indigo-700">
                  ~ {formatCurrencyVND(Math.round(kpi.totalPostingFees / kpi.totalHires))} / người
                </span>
              </div>
              <p className="text-[11px] text-indigo-800">
                Gồm ngân sách đăng tin trên TopCV, VietnamWorks, LinkedIn và ITviec
              </p>
            </div>

            {/* Thưởng giới thiệu nội bộ */}
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                  <span>Thưởng giới thiệu nội bộ (Referral Bonuses)</span>
                </span>
                <strong className="text-emerald-900 font-bold">{kpi.referralBonusPercentage}%</strong>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-emerald-950">
                  {formatCurrencyVND(kpi.totalReferralBonuses)}
                </span>
                <span className="text-xs text-emerald-700">
                  ~ {formatCurrencyVND(Math.round(kpi.totalReferralBonuses / kpi.totalHires))} / người
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Chi thưởng cho CBNV nội bộ giới thiệu ứng viên chất lượng nhận việc
              </p>
            </div>
          </div>

          {/* Tỷ lệ thanh tiến trình trực quan */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-slate-600">
              <span>Đăng tin ({kpi.postingFeePercentage}%)</span>
              <span>Thưởng giới thiệu ({kpi.referralBonusPercentage}%)</span>
            </div>
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex">
              <div className="bg-indigo-600 h-full" style={{ width: `${kpi.postingFeePercentage}%` }} />
              <div className="bg-emerald-500 h-full" style={{ width: `${kpi.referralBonusPercentage}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. SO SÁNH ĐA CHIỀU: THEO PHÒNG BAN VÀ THEO CHỨC DANH (AC 1)              */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Biểu đồ so sánh hiệu suất tuyển dụng đa chiều</span>
            </h2>
            <p className="text-xs text-slate-500">
              So sánh trực quan chỉ số Thời gian và Chi phí giữa các đơn vị và vị trí chuyên môn
            </p>
          </div>

          {/* Nhóm nút chuyển đổi chế độ xem */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Chuyển đổi đối tượng so sánh */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setComparisonTab('DEPARTMENT')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  comparisonTab === 'DEPARTMENT'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theo Phòng ban
              </button>
              <button
                type="button"
                onClick={() => setComparisonTab('POSITION')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  comparisonTab === 'POSITION'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theo Chức danh
              </button>
              <button
                type="button"
                onClick={() => setComparisonTab('TABLE')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  comparisonTab === 'TABLE'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bảng số liệu
              </button>
            </div>

            {/* Chuyển đổi metric: Time vs Cost */}
            {comparisonTab !== 'TABLE' && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setChartMetric('TIME')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    chartMetric === 'TIME'
                      ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Thời gian (Time-to-hire)
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric('COST')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    chartMetric === 'COST'
                      ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chi phí (Cost-per-hire)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Nội dung Tab 1: So sánh theo Phòng ban */}
        {comparisonTab === 'DEPARTMENT' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDepartments.map((dept) => {
                const timeWidth = Math.min(Math.round((dept.avgTimeToHireDays / maxDeptTimeToHire) * 100), 100);
                const costWidth = Math.min(Math.round((dept.costPerHire / maxDeptCost) * 100), 100);

                return (
                  <div
                    key={dept.departmentId}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                          {dept.departmentName}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Đã tuyển: <strong>{dept.hiredCount}</strong> / {dept.targetCount} chỉ tiêu
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        {dept.efficiencyRating === 'CAO' ? 'Hiệu quả cao' : 'Trung bình'}
                      </span>
                    </div>

                    {/* Biểu đồ giá trị theo metric đang chọn */}
                    {chartMetric === 'TIME' ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Thời gian tuyển trung bình:</span>
                          <strong className="text-indigo-900 font-bold">{dept.avgTimeToHireDays} ngày</strong>
                        </div>
                        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${timeWidth}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Chi phí trung bình / người:</span>
                          <strong className="text-emerald-900 font-bold">
                            {formatCurrencyVND(dept.costPerHire)}
                          </strong>
                        </div>
                        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${costWidth}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <span>Tổng chi phí: {formatCurrencyVND(dept.totalCost)}</span>
                      <span>Thưởng: {formatCurrencyVND(dept.totalReferralBonuses)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Nội dung Tab 2: So sánh theo Chức danh */}
        {comparisonTab === 'POSITION' && (
          <div className="space-y-3">
            {filteredPositions.map((pos) => {
              const timeWidth = Math.min(Math.round((pos.avgTimeToHireDays / maxPosTimeToHire) * 100), 100);
              const costWidth = Math.min(Math.round((pos.costPerHire / maxPosCost) * 100), 100);

              return (
                <div
                  key={pos.jobId}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/70 transition space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">{pos.jobTitle}</div>
                      <span className="text-[11px] text-slate-500">{pos.departmentName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {pos.difficultyLevel}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {pos.hiredCount}/{pos.targetCount} nhân sự
                      </span>
                    </div>
                  </div>

                  {/* Thanh so sánh thanh ngang */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Thời gian tuyển:</span>
                        <strong className="text-indigo-900">{pos.avgTimeToHireDays} ngày</strong>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${timeWidth}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Cost-per-hire:</span>
                        <strong className="text-emerald-900">{formatCurrencyVND(pos.costPerHire)}</strong>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${costWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Nội dung Tab 3: Bảng dữ liệu chi tiết (Detailed Data Table - AC 2) */}
        {comparisonTab === 'TABLE' && (
          <div className="space-y-4">
            {/* Thanh tìm kiếm vị trí */}
            <div className="relative max-w-sm">
              <label htmlFor={searchInputId} className="sr-only">
                Tìm kiếm chức danh
              </label>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id={searchInputId}
                type="text"
                value={tableSearchKeyword}
                onChange={(e) => setTableSearchKeyword(e.target.value)}
                placeholder="Tìm theo chức danh, phòng ban..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3.5">Chức danh tuyển dụng</th>
                    <th className="py-3 px-3.5">Phòng ban</th>
                    <th className="py-3 px-3.5 text-center">Tuyển/Chỉ tiêu</th>
                    <th className="py-3 px-3.5 text-right">Time-to-hire</th>
                    <th className="py-3 px-3.5 text-right">Phí đăng tin</th>
                    <th className="py-3 px-3.5 text-right">Thưởng giới thiệu</th>
                    <th className="py-3 px-3.5 text-right">Cost-per-hire</th>
                    <th className="py-3 px-3.5 text-center">Độ phức tạp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredPositions.map((pos) => (
                    <tr key={pos.jobId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3.5 font-bold text-slate-900">{pos.jobTitle}</td>
                      <td className="py-3.5 px-3.5 text-slate-600">{pos.departmentName}</td>
                      <td className="py-3.5 px-3.5 text-center font-semibold">
                        {pos.hiredCount} / {pos.targetCount}
                      </td>
                      <td className="py-3.5 px-3.5 text-right font-black text-indigo-700">
                        {pos.avgTimeToHireDays} ngày
                      </td>
                      <td className="py-3.5 px-3.5 text-right text-slate-600">
                        {formatCurrencyVND(pos.postingFees)}
                      </td>
                      <td className="py-3.5 px-3.5 text-right text-slate-600">
                        {formatCurrencyVND(pos.referralBonuses)}
                      </td>
                      <td className="py-3.5 px-3.5 text-right font-bold text-emerald-700">
                        {formatCurrencyVND(pos.costPerHire)}
                      </td>
                      <td className="py-3.5 px-3.5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {pos.difficultyLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruitmentTimeCostReportPage;
