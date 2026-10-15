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
import { SourceReportFilterBar } from './SourceReportFilterBar';
import { SourceKpiOverview } from './SourceKpiOverview';
import { SourceDistributionChart } from './SourceDistributionChart';
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

export const CandidateSourceReportDashboard: React.FC = () => {
  const [filters, setFilters] = useState<SourceReportFilterState>(DEFAULT_FILTERS);
  const [filterOptions, setFilterOptions] =
    useState<SourceReportFilterOptions>(MOCK_FILTER_OPTIONS);
  const [reportData, setReportData] = useState<SourceQualityReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
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

  // Xuất file CSV báo cáo chất lượng nguồn
  const handleExportCsv = () => {
    if (!reportData || reportData.sources.length === 0) return;
    setIsExporting(true);

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
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  return (
    <div
      data-testid="candidate-source-report-dashboard"
      className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4"
    >
      {/* Navigation Tabs giữa các phân hệ Báo cáo Tuyển dụng */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3 flex-wrap justify-between">
        <div className="flex items-center gap-2">
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

        {/* Nút hành động đầu trang */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="btn-export-csv"
            onClick={handleExportCsv}
            disabled={isLoading || isExporting || !reportData || reportData.kpi.totalApplications === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-xs transition-colors disabled:opacity-50"
          >
            <span>📥</span>
            <span>{isExporting ? 'Đang xuất...' : 'Xuất CSV'}</span>
          </button>
          <button
            type="button"
            data-testid="btn-refresh-report"
            onClick={() => fetchReport(filters)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-xs transition-colors disabled:opacity-50"
          >
            <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
            <span>Làm mới</span>
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
      ) : !reportData || reportData.kpi.totalApplications === 0 ? (
        <SourceReportEmptyState onResetFilters={handleResetFilters} />
      ) : (
        <div className="space-y-6">
          {/* 1. Bộ chỉ số hiệu quả nguồn tuyển dụng (AC 1) */}
          <SourceKpiOverview kpi={reportData.kpi} />

          {/* 2. Biểu đồ phân bổ tỷ trọng nguồn ứng viên (Donut Chart - AC 2) */}
          <SourceDistributionChart sources={reportData.sources} />

          {/* 3. Bảng phân tích chi tiết từng kênh tuyển dụng (AC 2) */}
          <SourceQualityDataTable sources={reportData.sources} />
        </div>
      )}
    </div>
  );
};
