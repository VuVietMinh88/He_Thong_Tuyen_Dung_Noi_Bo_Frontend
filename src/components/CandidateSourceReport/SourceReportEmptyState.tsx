import React from 'react';

interface SourceReportEmptyStateProps {
  onResetFilters: () => void;
}

export const SourceReportEmptyState: React.FC<SourceReportEmptyStateProps> = ({
  onResetFilters,
}) => {
  return (
    <div
      data-testid="source-report-empty-state"
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 p-8 sm:p-12 text-center shadow-sm"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-3xl">
        📊
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        Chưa có dữ liệu chất lượng nguồn ứng viên
      </h3>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
        Không tìm thấy hồ sơ nào từ các kênh tuyển dụng trong kỳ lọc hoặc điều kiện đang chọn.
        Vui lòng nới rộng khoảng thời gian hoặc chọn lại vị trí / phòng ban.
      </p>
      <button
        type="button"
        data-testid="btn-empty-reset-filters"
        onClick={onResetFilters}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20"
      >
        <span>🔄</span>
        <span>Đặt lại toàn bộ bộ lọc</span>
      </button>
    </div>
  );
};
