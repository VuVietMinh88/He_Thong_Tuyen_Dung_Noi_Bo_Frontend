import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingDown,
  RefreshCw,
  Download,
  AlertCircle,
} from 'lucide-react';
import { FunnelFilterBar } from './FunnelFilterBar';
import { FunnelKpiCards } from './FunnelKpiCards';
import { FunnelStageChart } from './FunnelStageChart';
import { FunnelDetailTable } from './FunnelDetailTable';
import { FunnelSkeletonLoader } from './FunnelSkeletonLoader';
import { FunnelEmptyState } from './FunnelEmptyState';
import type {
  FunnelFilterState,
  FunnelFilterOptions,
  FunnelReportData,
  FunnelStageMetric,
} from '../../types/recruitmentFunnel';
import {
  recruitmentFunnelService,
  getDefaultFunnelFilters,
} from '../../services/recruitmentFunnelService';
import { useToast } from '../notifications/useToast';

export interface RecruitmentFunnelDashboardProps {
  initialFilters?: FunnelFilterState;
}

export const RecruitmentFunnelDashboard: React.FC<RecruitmentFunnelDashboardProps> = ({
  initialFilters,
}) => {
  const { addToast } = useToast();

  const [filters, setFilters] = useState<FunnelFilterState>(
    initialFilters || getDefaultFunnelFilters(),
  );
  const [filterOptions, setFilterOptions] = useState<FunnelFilterOptions>({
    departments: [],
    jobOpenings: [],
    recruiters: [],
  });
  const [reportData, setReportData] = useState<FunnelReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<FunnelStageMetric | null>(null);

  // Tải danh mục options cho bộ lọc
  useEffect(() => {
    let isMounted = true;
    recruitmentFunnelService
      .getFilterOptions()
      .then((opts) => {
        if (isMounted) setFilterOptions(opts);
      })
      .catch((err) => {
        console.error('Lỗi tải danh mục bộ lọc:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Tải dữ liệu báo cáo phễu tuyển dụng qua API backend (AC 3)
  const fetchReport = useCallback(async (currentFilters: FunnelFilterState) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await recruitmentFunnelService.getFunnelReportData(currentFilters);
      setReportData(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải báo cáo phễu';
      setError(msg);
      addToast({
        type: 'error',
        message: msg,
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchReport(filters);
  }, [fetchReport, filters]);

  // Xử lý áp dụng bộ lọc mới
  const handleApplyFilters = (newFilters: FunnelFilterState) => {
    setFilters(newFilters);
    addToast({
      type: 'info',
      message: 'Dữ liệu phễu tuyển dụng đã được tính toán lại theo thông số mới.',
    });
  };

  // Xử lý đặt lại bộ lọc
  const handleResetFilters = () => {
    const defaults = getDefaultFunnelFilters();
    setFilters(defaults);
    addToast({
      type: 'info',
      message: 'Đã khôi phục bộ lọc phễu tuyển dụng về giá trị mặc định.',
    });
  };

  // Xuất báo cáo dạng CSV / Spreadsheet
  const handleExportReport = () => {
    if (!reportData) return;

    try {
      const headers = [
        'STT',
        'Giai đoạn',
        'Số lượng ứng viên',
        'Tỷ lệ qua vòng (%)',
        'Số lượng loại',
        'Tỷ lệ loại (%)',
        'Tỷ lệ giữ chân (%)',
        'Thời gian xử lý TB (ngày)',
      ];

      const rows = reportData.stages.map((st: FunnelStageMetric) => [
        st.stageOrder,
        st.name,
        st.count,
        `${st.passRate}%`,
        st.dropCount,
        `${st.dropRate}%`,
        `${st.retentionRate}%`,
        st.avgDaysInStage,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        [headers.join(','), ...rows.map((e: (string | number)[]) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `Bao_Cao_Pheu_Tuyen_Dung_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast({
        type: 'success',
        message: 'Báo cáo phễu tuyển dụng đã được tải về máy tính của bạn.',
      });
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        message: 'Đã xảy ra lỗi khi tạo tệp xuất dữ liệu.',
      });
    }
  };

  const isEmptyData = Boolean(reportData && reportData.kpi.totalApplications === 0);

  return (
    <div
      data-testid="recruitment-funnel-dashboard"
      className="space-y-6 pb-12"
    >
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <h1
                data-testid="funnel-dashboard-title"
                className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight"
              >
                Báo Cáo Phễu Tuyển Dụng
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Recruitment Funnel & Conversion Analytics (User Story S9-01)
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            data-testid="btn-refresh-dashboard"
            onClick={() => fetchReport(filters)}
            disabled={isLoading}
            className="p-2.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            type="button"
            data-testid="btn-export-report"
            onClick={handleExportReport}
            disabled={!reportData || isLoading || isEmptyData}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Xuất dữ liệu</span>
          </button>
        </div>
      </div>

      {/* 2. Error alert if any */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Thanh bộ lọc báo cáo đa chiều (AC 1) */}
      <FunnelFilterBar
        currentFilters={filters}
        options={filterOptions}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        isLoading={isLoading}
      />

      {/* 4. Skeleton Loading khi tải lần đầu */}
      {isLoading && !reportData && <FunnelSkeletonLoader />}

      {/* 5. Empty State khi không có ứng viên */}
      {!isLoading && isEmptyData && (
        <FunnelEmptyState onResetFilters={handleResetFilters} />
      )}

      {/* 6. Thẻ thống kê tổng quan KPI Cards (AC 2) */}
      {reportData && !isEmptyData && <FunnelKpiCards kpi={reportData.kpi} />}

      {/* 7. Bố cục hiển thị các tầng phễu tuyển dụng & Điểm rơi (AC 1 & AC 2) */}
      {reportData && !isEmptyData && (
        <FunnelStageChart
          stages={reportData.stages}
          biggestDropOff={reportData.biggestDropOff}
          onSelectStage={(st) => setSelectedStage(st)}
        />
      )}

      {/* 8. Bảng đối soát chi tiết */}
      {reportData && !isEmptyData && <FunnelDetailTable stages={reportData.stages} />}

      {/* Selected Stage Quick Info Modal / Drawer (nếu có click từ biểu đồ) */}
      {selectedStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-white text-xs font-black">
                  {selectedStage.stageOrder}
                </span>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {selectedStage.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStage(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold px-2 py-1"
              >
                Đóng
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300">
              {selectedStage.description}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 dark:bg-gray-800/50 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
              <div>
                <span className="text-gray-400">Số ứng viên:</span>
                <div className="text-base font-black text-gray-900 dark:text-white">
                  {selectedStage.count}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Tỷ lệ qua vòng:</span>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {selectedStage.passRate}%
                </div>
              </div>
              <div>
                <span className="text-gray-400">Giữ chân so với đầu phễu:</span>
                <div className="text-base font-black text-blue-600 dark:text-blue-400">
                  {selectedStage.retentionRate}%
                </div>
              </div>
              <div>
                <span className="text-gray-400">Thời gian xử lý TB:</span>
                <div className="text-base font-black text-amber-600 dark:text-amber-400">
                  {selectedStage.avgDaysInStage} ngày
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedStage(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
