import React from 'react';
import {
  Search,
  MapPin,
  Building2,
  Briefcase,
  Layers,
  LayoutGrid,
  List,
  RotateCcw,
  X,
} from 'lucide-react';

export interface FilterState {
  keyword: string;
  departmentId: string;
  workLocation: string;
  employmentType: string;
  level: string;
}

export interface PublicJobFilterBarProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onResetFilters: () => void;
  layout: 'grid' | 'list';
  onLayoutChange: (layout: 'grid' | 'list') => void;
  totalResults: number;
  departments: { id: string; name: string }[];
  locations: string[];
  isSearching?: boolean;
}

export const PublicJobFilterBar: React.FC<PublicJobFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  layout,
  onLayoutChange,
  totalResults,
  departments,
  locations,
  isSearching = false,
}) => {
  const isFiltered =
    Boolean(filters.keyword.trim()) ||
    filters.departmentId !== 'ALL' ||
    filters.workLocation !== 'ALL' ||
    filters.employmentType !== 'ALL' ||
    filters.level !== 'ALL';

  const selectedDepartmentName =
    departments.find((d) => d.id === filters.departmentId)?.name || filters.departmentId;

  return (
    <div
      data-testid="public-job-filter-bar"
      className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
    >
      {/* Top Search & Filter Dropdowns Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
        {/* Search Keyword */}
        <div className="relative lg:col-span-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            {isSearching ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            ) : (
              <Search className="h-4 w-4 text-slate-400" />
            )}
          </div>
          <input
            data-testid="search-input"
            type="text"
            value={filters.keyword}
            onChange={(e) => onFilterChange('keyword', e.target.value)}
            placeholder="Tìm theo chức danh, kỹ năng (debounce 450ms)..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          {filters.keyword && (
            <button
              type="button"
              onClick={() => onFilterChange('keyword', '')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              title="Xóa tìm kiếm"
              data-testid="clear-search-btn"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Department Dropdown */}
        <div className="relative lg:col-span-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Building2 className="h-4 w-4 text-slate-400" />
          </div>
          <select
            data-testid="department-select"
            value={filters.departmentId}
            onChange={(e) => onFilterChange('departmentId', e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-7 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="ALL">Tất cả phòng ban</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Location Dropdown */}
        <div className="relative lg:col-span-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MapPin className="h-4 w-4 text-slate-400" />
          </div>
          <select
            data-testid="location-select"
            value={filters.workLocation}
            onChange={(e) => onFilterChange('workLocation', e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-7 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="ALL">Tất cả địa điểm</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Employment Type Dropdown */}
        <div className="relative lg:col-span-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Briefcase className="h-4 w-4 text-slate-400" />
          </div>
          <select
            data-testid="work-type-select"
            value={filters.employmentType}
            onChange={(e) => onFilterChange('employmentType', e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-7 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="ALL">Tất cả hình thức</option>
            <option value="FULL_TIME">Toàn thời gian</option>
            <option value="PART_TIME">Bán thời gian</option>
            <option value="REMOTE">Từ xa (Remote)</option>
            <option value="HYBRID">Linh hoạt (Hybrid)</option>
            <option value="INTERNSHIP">Thực tập sinh</option>
          </select>
        </div>

        {/* Level Dropdown */}
        <div className="relative lg:col-span-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Layers className="h-4 w-4 text-slate-400" />
          </div>
          <select
            data-testid="level-select"
            value={filters.level}
            onChange={(e) => onFilterChange('level', e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-7 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="ALL">Tất cả cấp bậc</option>
            <option value="INTERN">Thực tập sinh</option>
            <option value="FRESHER">Fresher</option>
            <option value="JUNIOR">Junior</option>
            <option value="MIDDLE">Middle</option>
            <option value="SENIOR">Senior</option>
            <option value="LEAD">Trưởng nhóm (Lead)</option>
          </select>
        </div>
      </div>

      {/* Control Bar: Result count, Active tags, Layout switch */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 text-sm">
        {/* Result summary and active tags */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900">
            Tìm thấy{' '}
            <span className="inline-flex items-center justify-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
              {totalResults}
            </span>{' '}
            việc làm phù hợp
          </span>

          {/* Active filter pills */}
          {filters.keyword && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
              Từ khóa: &quot;{filters.keyword}&quot;
              <button
                type="button"
                onClick={() => onFilterChange('keyword', '')}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.departmentId !== 'ALL' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">
              {selectedDepartmentName}
              <button
                type="button"
                onClick={() => onFilterChange('departmentId', 'ALL')}
                className="text-indigo-400 hover:text-indigo-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.workLocation !== 'ALL' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
              {filters.workLocation}
              <button
                type="button"
                onClick={() => onFilterChange('workLocation', 'ALL')}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.employmentType !== 'ALL' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
              {filters.employmentType}
              <button
                type="button"
                onClick={() => onFilterChange('employmentType', 'ALL')}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.level !== 'ALL' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
              {filters.level}
              <button
                type="button"
                onClick={() => onFilterChange('level', 'ALL')}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {isFiltered && (
            <button
              data-testid="reset-filters-btn"
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
            >
              <RotateCcw className="h-3 w-3" />
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        {/* Layout Switch Buttons */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            data-testid="grid-view-btn"
            type="button"
            onClick={() => onLayoutChange('grid')}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
              layout === 'grid'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Dạng lưới (Grid View)"
            aria-label="Grid layout"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            data-testid="list-view-btn"
            type="button"
            onClick={() => onLayoutChange('list')}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
              layout === 'list'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Dạng danh sách (List View)"
            aria-label="List layout"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicJobFilterBar;
