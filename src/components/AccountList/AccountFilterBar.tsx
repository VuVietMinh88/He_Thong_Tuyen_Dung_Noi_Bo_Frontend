import type { AccountFilterParams, AccountRole, AccountStatus } from '../../types/account';
import { ROLE_DISPLAY_NAMES, STATUS_DISPLAY_NAMES } from '../../types/account';

interface AccountFilterBarProps {
  filterParams: AccountFilterParams;
  totalFilteredCount: number;
  totalCount: number;
  onFilterChange: (newFilters: Partial<AccountFilterParams>) => void;
  onResetFilters: () => void;
}

export const AccountFilterBar: React.FC<AccountFilterBarProps> = ({
  filterParams,
  totalFilteredCount,
  totalCount,
  onFilterChange,
  onResetFilters,
}) => {
  // Check if any filter condition is currently active to highlight reset button
  const isFiltered =
    filterParams.searchKeyword.trim() !== '' ||
    filterParams.role !== 'ALL' ||
    filterParams.status !== 'ALL';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
        {/* Search input for Name, Email or Department */}
        <div className="md:col-span-5">
          <label htmlFor="search-keyword" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tìm kiếm từ khóa
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              id="search-keyword"
              type="text"
              value={filterParams.searchKeyword}
              onChange={(e) => onFilterChange({ searchKeyword: e.target.value })}
              placeholder="Nhập họ tên, email hoặc phòng ban..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            {filterParams.searchKeyword && (
              <button
                type="button"
                onClick={() => onFilterChange({ searchKeyword: '' })}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                title="Xóa từ khóa"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Role Filter Dropdown */}
        <div className="md:col-span-3">
          <label htmlFor="role-filter" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Vai trò
          </label>
          <div className="relative">
            <select
              id="role-filter"
              value={filterParams.role}
              onChange={(e) => onFilterChange({ role: e.target.value as AccountRole | 'ALL' })}
              className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 pr-9 text-sm text-slate-800 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">Tất cả vai trò</option>
              {(Object.keys(ROLE_DISPLAY_NAMES) as AccountRole[]).map((roleKey) => (
                <option key={roleKey} value={roleKey}>
                  {ROLE_DISPLAY_NAMES[roleKey]}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </div>

        {/* Status Filter Dropdown */}
        <div className="md:col-span-2">
          <label htmlFor="status-filter" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Trạng thái
          </label>
          <div className="relative">
            <select
              id="status-filter"
              value={filterParams.status}
              onChange={(e) => onFilterChange({ status: e.target.value as AccountStatus | 'ALL' })}
              className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 pr-9 text-sm text-slate-800 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">Tất cả trạng thái</option>
              {(Object.keys(STATUS_DISPLAY_NAMES) as AccountStatus[]).map((statusKey) => (
                <option key={statusKey} value={statusKey}>
                  {STATUS_DISPLAY_NAMES[statusKey]}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </div>

        {/* Reset Filter Button */}
        <div className="flex items-center gap-2 md:col-span-2">
          <button
            type="button"
            onClick={onResetFilters}
            disabled={!isFiltered}
            className={[
              "flex w-full items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition",
              isFiltered
                ? "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 shadow-sm"
                : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400",
            ].join(" ")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Đặt lại</span>
          </button>
        </div>
      </div>

      {/* Filter summary status */}
      <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <div>
          Hiển thị <span className="font-semibold text-slate-700">{totalFilteredCount}</span> trên tổng số <span className="font-semibold text-slate-700">{totalCount}</span> tài khoản nội bộ
        </div>
        {isFiltered && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
              Đang áp dụng bộ lọc
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountFilterBar;
