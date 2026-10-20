import React from 'react';

interface AccountPaginationBarProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
}

export const AccountPaginationBar: React.FC<AccountPaginationBarProps> = ({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate visible page numbers with ellipsis when total pages > 7
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row">
      {/* Information text & page size selector */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <div>
          Hiển thị <span className="font-semibold text-slate-800">{startItem}</span> -{' '}
          <span className="font-semibold text-slate-800">{endItem}</span> trên{' '}
          <span className="font-semibold text-slate-800">{totalItems}</span> tài khoản
        </div>

        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
          <label htmlFor="page-size-select" className="text-xs text-slate-500">
            Số dòng:
          </label>
          <select
            id="page-size-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition focus:border-indigo-500 focus:bg-white focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20 (Mặc định)</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Pagination control buttons */}
      <nav aria-label="Pagination Navigation" className="flex items-center gap-1">
        {/* Previous page button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={[
            "inline-flex h-9 items-center justify-center gap-1 rounded-xl px-3 text-sm font-medium transition",
            currentPage <= 1
              ? "cursor-not-allowed text-slate-300"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-indigo-600 shadow-sm",
          ].join(" ")}
          aria-label="Trang trước"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Trước</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((item, index) => {
            if (item === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                  ...
                </span>
              );
            }

            const pageNumber = item as number;
            const isCurrent = pageNumber === currentPage;

            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={[
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition",
                  isCurrent
                    ? "bg-indigo-600 font-semibold text-white shadow-sm shadow-indigo-200"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-indigo-600",
                ].join(" ")}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        {/* Next page button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={[
            "inline-flex h-9 items-center justify-center gap-1 rounded-xl px-3 text-sm font-medium transition",
            currentPage >= totalPages
              ? "cursor-not-allowed text-slate-300"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-indigo-600 shadow-sm",
          ].join(" ")}
          aria-label="Trang tiếp"
        >
          <span className="hidden sm:inline">Sau</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>
    </div>
  );
};

export default AccountPaginationBar;
