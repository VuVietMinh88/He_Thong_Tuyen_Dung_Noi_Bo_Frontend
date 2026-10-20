import React from 'react';
import { SearchX, RotateCcw, Search } from 'lucide-react';

export interface PublicJobEmptyStateProps {
  onResetFilters: () => void;
  keyword?: string;
}

export const PublicJobEmptyState: React.FC<PublicJobEmptyStateProps> = ({
  onResetFilters,
  keyword,
}) => {
  return (
    <div
      data-testid="public-job-empty-state"
      className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-16 px-6 text-center shadow-xs"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 shadow-inner">
        <SearchX className="h-10 w-10 text-indigo-500" />
      </div>

      <h3 className="mt-6 text-xl font-bold text-slate-900 sm:text-2xl">
        Không tìm thấy cơ hội việc làm phù hợp
      </h3>

      <p className="mt-2.5 max-w-md text-sm text-slate-500 leading-relaxed">
        {keyword ? (
          <>
            Không có tin tuyển dụng nào khớp với từ khóa{' '}
            <span className="font-semibold text-slate-800">&quot;{keyword}&quot;</span> hoặc các tiêu chí
            bộ lọc hiện tại.
          </>
        ) : (
          'Hiện tại chưa có tin tuyển dụng nào phù hợp với các tiêu chí bạn đã chọn. Vui lòng thử lại với các tiêu chí khác.'
        )}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Xóa bộ lọc & Xem tất cả</span>
        </button>
      </div>

      <div className="mt-6 flex items-center gap-1.5 text-xs text-slate-400">
        <Search className="h-3.5 w-3.5" />
        <span>Gợi ý: Tìm kiếm theo tên vị trí chung như Developer, Marketing, Designer...</span>
      </div>
    </div>
  );
};

export default PublicJobEmptyState;
