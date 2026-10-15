import React from 'react';

export const SourceReportSkeletonLoader: React.FC = () => {
  return (
    <div
      data-testid="source-report-skeleton-loader"
      className="space-y-6 animate-pulse"
      aria-label="Đang tải báo cáo chất lượng nguồn ứng viên"
    >
      {/* Skeleton Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 h-28" />

      {/* Skeleton KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 h-32"
          />
        ))}
      </div>

      {/* Skeleton Chart & Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 h-72" />
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 h-80" />
    </div>
  );
};
