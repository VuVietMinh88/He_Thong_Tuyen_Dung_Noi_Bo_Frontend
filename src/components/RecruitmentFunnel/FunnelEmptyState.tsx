import React from 'react';
import { FilterX, RotateCcw } from 'lucide-react';

export interface FunnelEmptyStateProps {
  onResetFilters: () => void;
  message?: string;
}

export const FunnelEmptyState: React.FC<FunnelEmptyStateProps> = ({
  onResetFilters,
  message = 'Không tìm thấy hồ sơ ứng tuyển nào phù hợp với điều kiện lọc hiện tại.',
}) => {
  return (
    <div
      data-testid="funnel-empty-state"
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-10 shadow-xs flex flex-col items-center justify-center text-center space-y-4 my-4"
    >
      <div className="h-16 w-16 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 shadow-inner">
        <FilterX className="h-8 w-8" />
      </div>

      <div className="max-w-md space-y-1">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Chưa có dữ liệu phễu tuyển dụng
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {message} Vui lòng nới rộng khoảng thời gian hoặc chọn lại phòng ban / vị trí tuyển dụng.
        </p>
      </div>

      <div className="pt-2">
        <button
          type="button"
          data-testid="btn-empty-reset-filters"
          onClick={onResetFilters}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow transition-all flex items-center gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Đặt lại bộ lọc ban đầu</span>
        </button>
      </div>
    </div>
  );
};
