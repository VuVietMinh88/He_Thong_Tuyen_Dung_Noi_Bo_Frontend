import React from 'react';
import type { SourceReportSummaryKpi } from '../../types/candidateSourceReport';

interface SourceKpiOverviewProps {
  kpi: SourceReportSummaryKpi;
}

export const SourceKpiOverview: React.FC<SourceKpiOverviewProps> = ({ kpi }) => {
  return (
    <div
      data-testid="source-kpi-overview"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* KPI 1: Tổng hồ sơ tiếp nhận */}
      <div
        data-testid="kpi-card-total-applications"
        className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-200/80 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:border-blue-400 dark:hover:border-blue-500 transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Tổng hồ sơ tiếp nhận
          </span>
          <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold">
            📥
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            data-testid="kpi-value-total-applications"
            className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white"
          >
            {kpi.totalApplications.toLocaleString('vi-VN')}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">hồ sơ</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
            {kpi.totalScreened} đạt lọc
          </span>
          <span>• Tỷ lệ lọc: {`${kpi.overallScreeningPassRate}%`}</span>
        </div>
      </div>

      {/* KPI 2: Tỷ lệ hồ sơ đạt chuẩn (Quality of Hire Ratio) */}
      <div
        data-testid="kpi-card-qualification-rate"
        className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-200/80 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:border-emerald-400 dark:hover:border-emerald-500 transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Tỷ lệ đạt chuẩn (Quality Ratio)
          </span>
          <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
            🎯
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            data-testid="kpi-value-qualification-rate"
            className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400"
          >
            {`${kpi.overallQualificationRate}%`}
          </span>
          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
            ({kpi.totalInterviews} vào phỏng vấn)
          </span>
        </div>
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <span>Công thức:</span>
          <span className="font-mono text-[11px] bg-gray-100 dark:bg-gray-700/60 px-1 py-0.5 rounded">
            (PV / Tiếp nhận) * 100%
          </span>
        </div>
      </div>

      {/* KPI 3: Tuyển dụng thành công (Hired & Conversion Rate) */}
      <div
        data-testid="kpi-card-total-hired"
        className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-200/80 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:border-purple-400 dark:hover:border-purple-500 transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Tuyển dụng thành công
          </span>
          <span className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm font-bold">
            🎉
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            data-testid="kpi-value-total-hired"
            className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400"
          >
            {kpi.totalHired.toLocaleString('vi-VN')}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">nhân sự mới</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold">
            Tỷ lệ tuyển: {`${kpi.overallHireRate}%`}
          </span>
          <span>• Chốt offer: {`${kpi.overallOfferAcceptanceRate}%`}</span>
        </div>
      </div>

      {/* KPI 4: Kênh chất lượng xuất sắc nhất (Top Performing Source) */}
      <div
        data-testid="kpi-card-top-source"
        className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-200/80 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:border-amber-400 dark:hover:border-amber-500 transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Kênh hiệu quả nhất
          </span>
          <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm font-bold">
            🏆
          </span>
        </div>
        {kpi.topPerformingSource ? (
          <div>
            <div className="flex items-center gap-2">
              <span
                data-testid="top-source-name"
                className="text-lg font-bold text-gray-900 dark:text-white truncate"
              >
                {kpi.topPerformingSource.sourceName}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-800">
                Đạt chuẩn: {`${kpi.topPerformingSource.qualificationRate}%`}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/60 dark:border-blue-800">
                Tuyển: {`${kpi.topPerformingSource.hireRate}%`}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
              Đã tuyển: <strong>{kpi.topPerformingSource.hiredCount}</strong> ứng viên thành công
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-400 dark:text-gray-500 py-3">
            Chưa có đủ dữ liệu xếp hạng
          </div>
        )}
      </div>
    </div>
  );
};
