import React from 'react';
import type {
  SourceDatePreset,
  SourceReportFilterOptions,
  SourceReportFilterState,
} from '../../types/candidateSourceReport';

interface SourceReportFilterBarProps {
  filters: SourceReportFilterState;
  options: SourceReportFilterOptions;
  onChange: (updatedFilters: SourceReportFilterState) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const PRESET_OPTIONS: Array<{ value: SourceDatePreset; label: string }> = [
  { value: 'TODAY', label: 'Hôm nay' },
  { value: 'LAST_7_DAYS', label: '7 ngày qua' },
  { value: 'THIS_MONTH', label: 'Tháng này' },
  { value: 'THIS_QUARTER', label: 'Quý này' },
  { value: 'THIS_YEAR', label: 'Năm nay' },
  { value: 'CUSTOM', label: 'Tùy chọn ngày' },
];

export const SourceReportFilterBar: React.FC<SourceReportFilterBarProps> = ({
  filters,
  options,
  onChange,
  onReset,
  isLoading = false,
}) => {
  const handlePresetClick = (preset: SourceDatePreset) => {
    if (preset === filters.datePreset) return;

    // Tính toán khoảng ngày mặc định theo preset
    const now = new Date(2026, 9, 15);
    const format = (d: Date) => d.toISOString().slice(0, 10);
    let startDate = filters.startDate;
    let endDate = format(now);

    if (preset === 'TODAY') {
      startDate = format(now);
      endDate = format(now);
    } else if (preset === 'LAST_7_DAYS') {
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      startDate = format(past);
    } else if (preset === 'THIS_MONTH') {
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    } else if (preset === 'THIS_QUARTER') {
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3 + 1;
      startDate = `${now.getFullYear()}-${String(qStartMonth).padStart(2, '0')}-01`;
    } else if (preset === 'THIS_YEAR') {
      startDate = `${now.getFullYear()}-01-01`;
    }

    onChange({
      ...filters,
      datePreset: preset,
      startDate,
      endDate,
    });
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      departmentId: e.target.value,
      // Reset job opening nếu không thuộc department đã chọn
      jobOpeningId: 'ALL',
    });
  };

  const handleJobChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      jobOpeningId: e.target.value,
    });
  };

  const handleCampaignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      campaignId: e.target.value,
    });
  };

  // Lọc job openings theo department đã chọn
  const filteredJobs =
    filters.departmentId === 'ALL'
      ? options.jobOpenings
      : options.jobOpenings.filter((j) => j.departmentId === filters.departmentId);

  return (
    <div
      data-testid="source-report-filter-bar"
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/80 dark:border-gray-700 p-4 sm:p-5 transition-all"
    >
      {/* Hàng 1: Preset thời gian & Date Range Picker */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-1">
            Thời gian:
          </span>
          <div className="inline-flex rounded-lg bg-gray-100/80 dark:bg-gray-900/60 p-1 gap-1 border border-gray-200/50 dark:border-gray-700/50 flex-wrap">
            {PRESET_OPTIONS.map((item) => {
              const active = filters.datePreset === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  data-testid={`preset-${item.value.toLowerCase()}`}
                  onClick={() => handlePresetClick(item.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    active
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date inputs (Hiển thị hoặc cho phép sửa) */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="text-gray-400">Từ</span>
            <input
              type="date"
              data-testid="filter-start-date"
              value={filters.startDate}
              onChange={(e) =>
                onChange({
                  ...filters,
                  datePreset: 'CUSTOM',
                  startDate: e.target.value,
                })
              }
              className="bg-transparent text-gray-800 dark:text-gray-200 font-medium focus:outline-none text-xs"
            />
            <span className="text-gray-400 mx-1">đến</span>
            <input
              type="date"
              data-testid="filter-end-date"
              value={filters.endDate}
              onChange={(e) =>
                onChange({
                  ...filters,
                  datePreset: 'CUSTOM',
                  endDate: e.target.value,
                })
              }
              className="bg-transparent text-gray-800 dark:text-gray-200 font-medium focus:outline-none text-xs"
            />
          </div>
        </div>
      </div>

      {/* Hàng 2: Bộ lọc đa chiều (Chiến dịch, Phòng ban, Vị trí tuyển dụng) */}
      <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Dropdown Chiến dịch */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
            🎯 Chiến dịch tuyển dụng
          </label>
          <select
            data-testid="filter-campaign-select"
            value={filters.campaignId}
            onChange={handleCampaignChange}
            className="w-full text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 py-2 px-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          >
            <option value="ALL">Tất cả chiến dịch</option>
            {options.campaigns.map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown Phòng ban */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
            🏢 Khối / Phòng ban
          </label>
          <select
            data-testid="filter-department-select"
            value={filters.departmentId}
            onChange={handleDepartmentChange}
            className="w-full text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 py-2 px-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          >
            <option value="ALL">Tất cả phòng ban</option>
            {options.departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown Vị trí tuyển dụng */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
            💼 Vị trí tuyển dụng
          </label>
          <select
            data-testid="filter-job-select"
            value={filters.jobOpeningId}
            onChange={handleJobChange}
            className="w-full text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 py-2 px-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          >
            <option value="ALL">Tất cả vị trí</option>
            {filteredJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        {/* Nút Reset Filters & Status */}
        <div className="flex items-end justify-between sm:justify-end gap-2">
          <button
            type="button"
            data-testid="btn-reset-filters"
            onClick={onReset}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 hover:bg-gray-200/80 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200/60 dark:border-gray-700 disabled:opacity-50"
          >
            <span>🔄</span>
            <span>Đặt lại bộ lọc</span>
          </button>
        </div>
      </div>
    </div>
  );
};
