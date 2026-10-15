import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  SourceQualityReportData,
  SourceReportFilterOptions,
  SourceReportFilterState,
} from '../../types/candidateSourceReport';
import {
  candidateSourceReportService,
  MOCK_FILTER_OPTIONS,
} from '../../services/candidateSourceReportService';
import {
  downloadSourceReportExcel,
  generateSourceReportFilename,
} from '../../utils/sourceReportExcelHelper';
import { useToast } from '../notifications/useToast';
import { SourceReportFilterBar } from './SourceReportFilterBar';
import { SourceKpiOverview } from './SourceKpiOverview';
import { SourceDistributionChart } from './SourceDistributionChart';
import { SourceBenchmarkComparison } from './SourceBenchmarkComparison';
import { SourceQualityDataTable } from './SourceQualityDataTable';
import { SourceReportSkeletonLoader } from './SourceReportSkeletonLoader';
import { SourceReportEmptyState } from './SourceReportEmptyState';

const DEFAULT_FILTERS: SourceReportFilterState = {
  datePreset: 'THIS_MONTH',
  startDate: '2026-10-01',
  endDate: '2026-10-31',
  departmentId: 'ALL',
  jobOpeningId: 'ALL',
  campaignId: 'ALL',
};

type ActiveViewTab = 'ALL' | 'BENCHMARK' | 'DISTRIBUTION' | 'TABLE';

export const CandidateSourceReportDashboard: React.FC = () => {
  const { addToast } = useToast();

  const [filters, setFilters] = useState<SourceReportFilterState>(DEFAULT_FILTERS);
  const [filterOptions, setFilterOptions] =
    useState<SourceReportFilterOptions>(MOCK_FILTER_OPTIONS);
  const [reportData, setReportData] = useState<SourceQualityReportData | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [isExportingCsv, setIsExportingCsv] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Tải danh mục bộ lọc
  useEffect(() => {
    let isMounted = true;
    candidateSourceReportService
      .getFilterOptions()
      .then((opts) => {
        if (isMounted) setFilterOptions(opts);
      })
      .catch(() => {
        // Fallback
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Tải dữ liệu báo cáo
  const fetchReport = useCallback(async (currentFilters: SourceReportFilterState) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await candidateSourceReportService.getSourceQualityReport(currentFilters);
      setReportData(data);
    } catch {
      setError('Không thể kết nối đến máy chủ lấy dữ liệu báo cáo nguồn ứng viên.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(filters);
  }, [fetchReport, filters]);

  const handleFilterChange = (newFilters: SourceReportFilterState) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // AC 2: Thao tác xuất báo cáo Excel (.xlsx) chuẩn định dạng
  const handleExportExcel = async () => {
    if (!reportData || reportData.sources.length === 0) return;
    setIsExportingExcel(true);

    try {
      // Giả lập độ trễ UX thực tế để hiển thị spinner
      await new Promise((resolve) => setTimeout(resolve, 400));
      const filename = generateSourceReportFilename(new Date());
      downloadSourceReportExcel(reportData, filename);

      addToast({
        type: 'success',
        message: 'Báo cáo chất lượng nguồn ứng viên đã được xuất thành công tệp Excel (XLSX).',
      });
    } catch (err) {
      console.error('Lỗi khi xuất tệp Excel:', err);
      addToast({
        type: 'error',
        message: 'Đã xảy ra lỗi khi tạo tệp Excel báo cáo nguồn tuyển dụng.',
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Xuất file CSV dự phòng
  const handleExportCsv = () => {
    if (!reportData || reportData.sources.length === 0) return;
    setIsExportingCsv(true);

    try {
      const headers = [
        'Kenh tuyen dung',
        'Tong ho so tiep nhan',
        'Vuot qua loc',
        'Vao phong van',
        'Nhan Offer',
        'Nhan viec thanh cong (Hired)',
        'Ty le dat chuan (%)',
        'Ty le tuyen thanh cong (%)',
        'Xep hang chat luong',
        'Thoi gian tuyen TB (ngay)',
      ];

      const rows = reportData.sources.map((s) => [
        `"${s.sourceName}"`,
        s.totalApplications,
        s.screenedCount,
        s.interviewCount,
        s.offeredCount,
        s.hiredCount,
        `${s.qualificationRate}%`,
        `${s.hireRate}%`,
        s.qualityTier,
        s.avgDaysToHire,
      ]);

      const csvContent =
        '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `Bao_Cao_Chat_Luong_Nguon_Ung_Vien_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast({
        type: 'success',
        message: 'Đã tải xuống tệp dữ liệu CSV báo cáo nguồn ứng viên.',
      });
    } catch {
      addToast({
        type: 'error',
        message: 'Không thể xuất tệp CSV.',
      });
    } finally {
      setTimeout(() => setIsExportingCsv(false), 300);
    }
  };

  const isEmptyData = Boolean(reportData && reportData.kpi.totalApplications === 0);

  return (
    <div
      data-testid="candidate-source-report-dashboard"
      className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4"
    >
      {/* Navigation Tabs giữa các phân hệ Báo cáo Tuyển dụng */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/reports/funnel"
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            📉 Báo cáo Phễu tuyển dụng
          </Link>
          <span className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800 shadow-xs">
            🎯 Chất lượng Nguồn ứng viên
          </span>
        </div>

        {/* Nút hành động đầu trang: Xuất Excel (AC 2) nổi bật */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            data-testid="btn-export-excel"
            onClick={handleExportExcel}
            disabled={isLoading || isExportingExcel || isEmptyData || !reportData}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Xuất báo cáo chi tiết và so sánh sang tệp Excel chuẩn định dạng .xlsx"
          >
            {isExportingExcel ? (
              <span className="animate-spin text-sm">⏳</span>
            ) : (
              <span className="text-base">📊</span>
            )}
            <span>{isExportingExcel ? 'Đang xuất Excel...' : 'Xuất báo cáo Excel (.xlsx)'}</span>
          </button>

          <button
            type="button"
            data-testid="btn-export-csv"
            onClick={handleExportCsv}
            disabled={isLoading || isExportingCsv || isEmptyData || !reportData}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-xs transition-colors disabled:opacity-50"
          >
            <span>📥</span>
            <span>{isExportingCsv ? 'Đang xuất...' : 'Xuất CSV'}</span>
          </button>

          <button
            type="button"
            data-testid="btn-refresh-report"
            onClick={() => fetchReport(filters)}
            disabled={isLoading}
            className="p-2 text-xs font-medium rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-xs transition-colors disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <span className={isLoading ? 'animate-spin inline-block' : 'inline-block'}>🔄</span>
          </button>
        </div>
      </div>

      {/* Header chính */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1
            data-testid="report-dashboard-title"
            className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight"
          >
            Báo cáo chất lượng nguồn ứng viên
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Đánh giá hiệu quả các kênh tuyển dụng: LinkedIn, Facebook, VietnamWorks, TopCV, Giới thiệu nội bộ, Website tuyển dụng
          </p>
        </div>

        {/* View Mode Tabs */}
        {!isEmptyData && reportData && (
          <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-900 p-1 border border-gray-200/60 dark:border-gray-700 self-start md:self-auto">
            <button
              type="button"
              data-testid="tab-view-all"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'ALL'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Toàn diện
            </button>
            <button
              type="button"
              data-testid="tab-view-benchmark"
              onClick={() => setActiveTab('BENCHMARK')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'BENCHMARK'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              So sánh đối đầu
            </button>
            <button
              type="button"
              data-testid="tab-view-distribution"
              onClick={() => setActiveTab('DISTRIBUTION')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'DISTRIBUTION'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Thị phần (Donut)
            </button>
            <button
              type="button"
              data-testid="tab-view-table"
              onClick={() => setActiveTab('TABLE')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'TABLE'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Bảng chi tiết
            </button>
          </div>
        )}
      </div>

      {/* Bộ lọc đa chiều (AC 3) */}
      <SourceReportFilterBar
        filters={filters}
        options={filterOptions}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        isLoading={isLoading}
      />

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div
          data-testid="report-error-alert"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchReport(filters)}
            className="font-bold underline hover:no-underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Trạng thái Loading hoặc Dữ liệu */}
      {isLoading ? (
        <SourceReportSkeletonLoader />
      ) : isEmptyData || !reportData ? (
        <SourceReportEmptyState onResetFilters={handleResetFilters} />
      ) : (
        <div className="space-y-6">
          {/* 1. Bộ chỉ số hiệu quả nguồn tuyển dụng (AC 1) */}
          <SourceKpiOverview kpi={reportData.kpi} />

          {/* 2. Component So sánh đối đầu giữa các nguồn (AC 1) */}
          {(activeTab === 'ALL' || activeTab === 'BENCHMARK') && (
            <SourceBenchmarkComparison
              sources={reportData.sources}
              benchmark={reportData.benchmark}
            />
          )}

          {/* 3. Biểu đồ phân bổ tỷ trọng nguồn ứng viên (Donut Chart - AC 2) */}
          {(activeTab === 'ALL' || activeTab === 'DISTRIBUTION') && (
            <SourceDistributionChart sources={reportData.sources} />
          )}

          {/* 4. Bảng phân tích chi tiết từng kênh tuyển dụng (AC 2) */}
          {(activeTab === 'ALL' || activeTab === 'TABLE') && (
            <SourceQualityDataTable sources={reportData.sources} />
          )}
        </div>
      )}
    </div>
  );
};
