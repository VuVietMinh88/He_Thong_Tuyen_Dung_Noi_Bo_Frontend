import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Filter,
  RotateCcw,
  Building2,
  Briefcase,
  UserCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import type {
  DatePreset,
  FunnelFilterState,
  FunnelFilterOptions,
} from '../../types/recruitmentFunnel';
import { calculateDateRangeForPreset } from '../../services/recruitmentFunnelService';

export interface FunnelFilterBarProps {
  currentFilters: FunnelFilterState;
  options: FunnelFilterOptions;
  onApplyFilters: (newFilters: FunnelFilterState) => void;
  onResetFilters: () => void;
  isLoading?: boolean;
}

const DATE_PRESETS: Array<{ id: DatePreset; label: string }> = [
  { id: 'TODAY', label: 'Hôm nay' },
  { id: 'LAST_7_DAYS', label: '7 ngày qua' },
  { id: 'THIS_MONTH', label: 'Tháng này' },
  { id: 'THIS_QUARTER', label: 'Quý này' },
  { id: 'CUSTOM', label: 'Tùy chọn ngày' },
];

export const FunnelFilterBar: React.FC<FunnelFilterBarProps> = ({
  currentFilters,
  options,
  onApplyFilters,
  onResetFilters,
  isLoading = false,
}) => {
  // Local state để người dùng điều chỉnh trước khi bấm "Áp dụng bộ lọc"
  const [draftFilters, setDraftFilters] = useState<FunnelFilterState>(currentFilters);
  const [showCustomDate, setShowCustomDate] = useState<boolean>(
    currentFilters.datePreset === 'CUSTOM',
  );

  useEffect(() => {
    setDraftFilters(currentFilters);
    setShowCustomDate(currentFilters.datePreset === 'CUSTOM');
  }, [currentFilters]);

  // Xử lý đổi preset ngày
  const handlePresetChange = (preset: DatePreset) => {
    if (preset === 'CUSTOM') {
      setDraftFilters((prev) => ({
        ...prev,
        datePreset: 'CUSTOM',
      }));
      setShowCustomDate(true);
    } else {
      const { startDate, endDate } = calculateDateRangeForPreset(preset);
      setDraftFilters((prev) => ({
        ...prev,
        datePreset: preset,
        startDate,
        endDate,
      }));
      setShowCustomDate(false);
    }
  };

  // Đếm số lượng bộ lọc đang khác mặc định
  const activeFiltersCount = [
    draftFilters.datePreset !== 'THIS_MONTH',
    draftFilters.departmentId !== 'ALL',
    draftFilters.jobOpeningId !== 'ALL',
    draftFilters.recruiterId !== 'ALL',
  ].filter(Boolean).length;

  // Lọc danh sách Job Openings theo Department đã chọn (nếu có)
  const filteredJobOpenings =
    draftFilters.departmentId === 'ALL'
      ? options.jobOpenings
      : options.jobOpenings.filter(
          (job) => job.departmentId === draftFilters.departmentId,
        );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilters(draftFilters);
  };

  const handleReset = () => {
    onResetFilters();
  };

  return (
    <div
      data-testid="funnel-filter-bar"
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 transition-all"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Top row: Label & Date Presets */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
              <Filter className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Bộ lọc báo cáo tuyển dụng đa chiều
                {activeFiltersCount > 0 && (
                  <span
                    data-testid="active-filters-count-badge"
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                  >
                    {activeFiltersCount} bộ lọc đang chọn
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Phân tích lưu lượng và tỷ lệ chuyển đổi qua các vòng tuyển dụng
              </p>
            </div>
          </div>

          {/* Quick Date Presets (AC 1) */}
          <div className="flex items-center flex-wrap gap-1.5 bg-gray-50 dark:bg-gray-800/60 p-1.5 rounded-xl border border-gray-100 dark:border-gray-800">
            {DATE_PRESETS.map((preset) => {
              const isActive = draftFilters.datePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  data-testid={`filter-preset-${preset.id.toLowerCase().replace(/_/g, '-')}`}
                  onClick={() => handlePresetChange(preset.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Date Range Picker (Khi chọn Tùy chọn ngày hoặc mở rộng) */}
        {showCustomDate && (
          <div
            data-testid="custom-date-range-container"
            className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-blue-900 dark:text-blue-300">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Khoảng ngày tùy chọn:</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">Từ</span>
                <input
                  type="date"
                  data-testid="input-start-date"
                  value={draftFilters.startDate}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                      datePreset: 'CUSTOM',
                    }))
                  }
                  className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">Đến</span>
                <input
                  type="date"
                  data-testid="input-end-date"
                  value={draftFilters.endDate}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                      datePreset: 'CUSTOM',
                    }))
                  }
                  className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* Dropdowns row: Job Opening, Department, Recruiter (AC 1) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. Lọc theo Phòng ban (Department) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-gray-400" />
              <span>Phòng ban</span>
            </label>
            <div className="relative">
              <select
                data-testid="select-department"
                value={draftFilters.departmentId}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    departmentId: e.target.value,
                    // Reset jobOpening nếu nó không thuộc phòng ban mới
                    jobOpeningId: 'ALL',
                  }))
                }
                className="w-full appearance-none px-3 py-2 pr-8 text-xs bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
              >
                <option value="ALL">Tất cả phòng ban ({options.departments.length})</option>
                {options.departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2. Lọc theo Vị trí tuyển dụng (Job Opening) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-gray-400" />
              <span>Vị trí tuyển dụng (Job Opening)</span>
            </label>
            <div className="relative">
              <select
                data-testid="select-job-opening"
                value={draftFilters.jobOpeningId}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    jobOpeningId: e.target.value,
                  }))
                }
                className="w-full appearance-none px-3 py-2 pr-8 text-xs bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
              >
                <option value="ALL">Tất cả vị trí ({filteredJobOpenings.length})</option>
                {filteredJobOpenings.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3. Lọc theo Người phụ trách tuyển dụng (Recruiter) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-gray-400" />
              <span>Người phụ trách (Recruiter)</span>
            </label>
            <div className="relative">
              <select
                data-testid="select-recruiter"
                value={draftFilters.recruiterId}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    recruiterId: e.target.value,
                  }))
                }
                className="w-full appearance-none px-3 py-2 pr-8 text-xs bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
              >
                <option value="ALL">Tất cả Recruiter ({options.recruiters.length})</option>
                {options.recruiters.map((rec) => (
                  <option key={rec.id} value={rec.id}>
                    {rec.name} ({rec.email})
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Bottom row: Action Buttons (AC 1) */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>
              Khoảng thời gian áp dụng: <strong className="text-gray-700 dark:text-gray-300">{draftFilters.startDate}</strong> đến{' '}
              <strong className="text-gray-700 dark:text-gray-300">{draftFilters.endDate}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="btn-reset-filters"
              onClick={handleReset}
              disabled={isLoading}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>

            <button
              type="submit"
              data-testid="btn-apply-filters"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>{isLoading ? 'Đang tải...' : 'Áp dụng bộ lọc'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
