import React, { useState, useId } from 'react';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  Check,
  Plus,
  Briefcase,
  Building2,
  Clock,
  GraduationCap,
  Sparkles,
  Users,
} from 'lucide-react';
import type {
  CandidateCombinedFilterState,
  ExperienceFilterOption,
  EducationFilterOption,
  StageFilterOption,
  CvParsingStatus,
} from '../../types/candidate';
import {
  DEFAULT_COMBINED_FILTER_STATE,
  COMMON_SKILL_SUGGESTIONS,
} from '../../types/candidate';
import {
  countActiveFilters,
  getActiveFilterBadges,
  EXPERIENCE_LABELS,
  EDUCATION_LABELS,
  STAGE_LABELS,
} from '../../utils/candidateFilterHelper';

export interface CandidateSearchFilterPanelProps {
  filters: CandidateCombinedFilterState;
  onChangeFilters: (nextFilters: CandidateCombinedFilterState) => void;
  onApplyFilters?: (appliedFilters: CandidateCombinedFilterState) => void;
  onResetFilters?: () => void;
  jobOptions?: Array<{ id: string; title: string }>;
  departmentOptions?: string[];
  availableSkills?: string[];
  totalResultsCount?: number;
  totalCandidatesCount?: number;
  isLoading?: boolean;
  className?: string;
  defaultExpanded?: boolean;
}

export const CandidateSearchFilterPanel: React.FC<CandidateSearchFilterPanelProps> = ({
  filters,
  onChangeFilters,
  onApplyFilters,
  onResetFilters,
  jobOptions = [],
  departmentOptions = [],
  availableSkills = COMMON_SKILL_SUGGESTIONS,
  totalResultsCount,
  totalCandidatesCount,
  isLoading = false,
  className = '',
  defaultExpanded = false,
}) => {
  const panelId = useId();
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [customSkillInput, setCustomSkillInput] = useState<string>('');

  // Draft state trong panel để hỗ trợ nút "Áp dụng bộ lọc"
  const [draftFilters, setDraftFilters] =
    useState<CandidateCombinedFilterState>(filters);

  // Đồng bộ draftFilters khi filters từ bên ngoài thay đổi
  React.useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  const activeCount = countActiveFilters(filters);
  const activeBadges = getActiveFilterBadges(filters, { jobOptions });

  // Xử lý thay đổi từ khóa tìm kiếm (Apply ngay lập tức cho trải nghiệm nhanh)
  const handleKeywordChange = (newKeyword: string) => {
    const updated = { ...filters, keyword: newKeyword };
    setDraftFilters(updated);
    onChangeFilters(updated);
  };

  const handleClearKeyword = () => {
    handleKeywordChange('');
  };

  // Cập nhật giá trị draft trong panel
  const handleDraftChange = <K extends keyof CandidateCombinedFilterState>(
    field: K,
    value: CandidateCombinedFilterState[K]
  ) => {
    setDraftFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Toggle skill chip trong danh sách
  const handleToggleSkill = (skill: string) => {
    const currentSkills = draftFilters.skills || [];
    const exists = currentSkills.some(
      (s) => s.toLowerCase() === skill.toLowerCase()
    );
    const updatedSkills = exists
      ? currentSkills.filter((s) => s.toLowerCase() !== skill.toLowerCase())
      : [...currentSkills, skill];

    handleDraftChange('skills', updatedSkills);
  };

  // Thêm kỹ năng tùy chọn từ ô nhập
  const handleAddCustomSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;

    const currentSkills = draftFilters.skills || [];
    const exists = currentSkills.some(
      (s) => s.toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) {
      handleDraftChange('skills', [...currentSkills, trimmed]);
    }
    setCustomSkillInput('');
  };

  // Áp dụng bộ lọc
  const handleApply = () => {
    onChangeFilters(draftFilters);
    if (onApplyFilters) {
      onApplyFilters(draftFilters);
    }
  };

  // Xóa toàn bộ bộ lọc về mặc định
  const handleResetAll = () => {
    const resetState: CandidateCombinedFilterState = {
      ...DEFAULT_COMBINED_FILTER_STATE,
      sortBy: filters.sortBy, // giữ nguyên cấu hình sắp xếp
    };
    setDraftFilters(resetState);
    onChangeFilters(resetState);
    if (onResetFilters) {
      onResetFilters();
    }
  };

  // Tắt nhanh từng điều kiện trên Active Filter Badges (AC 3)
  const handleDismissBadge = (_badgeId: string, badgeType: string, displayValue: string) => {
    let updated = { ...filters };

    switch (badgeType) {
      case 'keyword':
        updated.keyword = '';
        break;
      case 'job':
        updated.jobId = 'ALL';
        break;
      case 'department':
        updated.department = 'ALL';
        break;
      case 'experience':
        updated.experienceLevel = 'ALL';
        updated.minExperienceYears = undefined;
        updated.maxExperienceYears = undefined;
        break;
      case 'education':
        updated.educationLevel = 'ALL';
        break;
      case 'stage':
        updated.stageStatus = 'ALL';
        break;
      case 'skill':
        updated.skills = (updated.skills || []).filter(
          (s) => s.toLowerCase() !== displayValue.toLowerCase()
        );
        break;
      case 'status':
        updated.cvParsingStatus = 'ALL';
        break;
    }

    setDraftFilters(updated);
    onChangeFilters(updated);
    if (onApplyFilters) {
      onApplyFilters(updated);
    }
  };

  // Lấy danh sách phòng ban gợi ý
  const resolvedDepartments =
    departmentOptions.length > 0
      ? departmentOptions
      : [
          'Khối Công nghệ & Sản phẩm',
          'Trung tâm Nghiên cứu AI & Dữ liệu',
          'Ban Quản trị Nguồn nhân lực',
          'Phòng Kỹ thuật Phần mềm',
        ];

  return (
    <div
      data-testid="candidate-search-combined-filter"
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {/* 1. Thanh tìm kiếm chính (Global Search Bar) & Nút mở rộng bộ lọc - AC 1 & AC 4 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Ô tìm kiếm từ khóa toàn diện */}
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="candidate-search-input"
            data-testid="candidate-search-input"
            type="text"
            value={filters.keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            placeholder="Tìm theo họ tên, email, số điện thoại, kỹ năng chuyên môn..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 shadow-xs transition-all focus:border-blue-500 focus:outline-hidden focus:ring-3 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          />
          {filters.keyword && (
            <button
              type="button"
              onClick={handleClearKeyword}
              data-testid="clear-search-keyword-btn"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              title="Xóa từ khóa tìm kiếm"
              aria-label="Xóa từ khóa"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Nút bật/tắt bảng bộ lọc nâng cao (Collapsible Filter Panel) - AC 4 */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            id={`filter-panel-toggle-${panelId}`}
            data-testid="toggle-advanced-filters-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls={`filter-panel-content-${panelId}`}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-xs transition-all ${
              isExpanded || activeCount > 0
                ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Bộ lọc nâng cao</span>
            {activeCount > 0 && (
              <span
                data-testid="active-filters-counter-badge"
                className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white shadow-2xs"
              >
                {activeCount}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            )}
          </button>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={handleResetAll}
              data-testid="reset-all-filters-quick-btn"
              title="Đặt lại toàn bộ bộ lọc"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Danh sách các Tag bộ lọc đang kích hoạt (Active Filter Badges) - AC 3 */}
      {activeBadges.length > 0 && (
        <div
          data-testid="active-filter-badges-container"
          className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50/80 p-2.5 border border-slate-100 dark:border-slate-800 dark:bg-slate-800/40"
        >
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <span>Đang lọc:</span>
          </div>

          {activeBadges.map((badge) => (
            <span
              key={badge.id}
              data-testid={`active-filter-badge-${badge.id}`}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium shadow-2xs ring-1 transition-all ${badge.colorClass}`}
            >
              <span className="text-[11px] opacity-75">{badge.label}:</span>
              <strong className="font-semibold">{badge.displayValue}</strong>
              <button
                type="button"
                data-testid={`dismiss-filter-btn-${badge.id}`}
                onClick={() =>
                  handleDismissBadge(badge.id, badge.type, badge.displayValue)
                }
                className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/20"
                title={`Xóa bộ lọc ${badge.label}`}
                aria-label={`Xóa bộ lọc ${badge.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          <button
            type="button"
            data-testid="clear-all-active-badges-btn"
            onClick={handleResetAll}
            className="ml-auto text-xs font-medium text-slate-500 hover:text-rose-600 underline decoration-dotted transition-colors dark:text-slate-400 dark:hover:text-rose-400"
          >
            Xóa tất cả ({activeBadges.length})
          </button>
        </div>
      )}

      {/* 3. Bảng bộ lọc đa tầng mở rộng (Collapsible Filter Panel) - AC 2 & AC 4 */}
      {isExpanded && (
        <div
          id={`filter-panel-content-${panelId}`}
          data-testid="advanced-filters-panel"
          className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Cột 1: Vị trí ứng tuyển & Phòng ban */}
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="candidate-job-filter"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  <span>Vị trí ứng tuyển</span>
                </label>
                <select
                  id="candidate-job-filter"
                  data-testid="candidate-job-filter"
                  value={draftFilters.jobId}
                  onChange={(e) => handleDraftChange('jobId', e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">Tất cả vị trí</option>
                  {jobOptions.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="candidate-department-filter"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>Phòng ban</span>
                </label>
                <select
                  id="candidate-department-filter"
                  data-testid="candidate-department-filter"
                  value={draftFilters.department}
                  onChange={(e) => handleDraftChange('department', e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">Tất cả phòng ban</option>
                  {resolvedDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cột 2: Số năm kinh nghiệm */}
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="candidate-experience-filter"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Số năm kinh nghiệm</span>
                </label>
                <select
                  id="candidate-experience-filter"
                  data-testid="candidate-experience-filter"
                  value={draftFilters.experienceLevel}
                  onChange={(e) =>
                    handleDraftChange(
                      'experienceLevel',
                      e.target.value as ExperienceFilterOption
                    )
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {(Object.keys(EXPERIENCE_LABELS) as ExperienceFilterOption[]).map(
                    (key) => (
                      <option key={key} value={key}>
                        {EXPERIENCE_LABELS[key]}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Tùy chỉnh khoảng năm khi chọn CUSTOM */}
              {draftFilters.experienceLevel === 'CUSTOM' && (
                <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
                  <div className="flex-1">
                    <input
                      id="candidate-min-exp-input"
                      data-testid="candidate-min-exp-input"
                      type="number"
                      min="0"
                      placeholder="Tối thiểu"
                      value={draftFilters.minExperienceYears ?? ''}
                      onChange={(e) =>
                        handleDraftChange(
                          'minExperienceYears',
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <span className="text-xs text-slate-400">-</span>
                  <div className="flex-1">
                    <input
                      id="candidate-max-exp-input"
                      data-testid="candidate-max-exp-input"
                      type="number"
                      min="0"
                      placeholder="Tối đa"
                      value={draftFilters.maxExperienceYears ?? ''}
                      onChange={(e) =>
                        handleDraftChange(
                          'maxExperienceYears',
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cột 3: Trình độ học vấn & Trạng thái hồ sơ */}
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="candidate-education-filter"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                  <span>Trình độ học vấn</span>
                </label>
                <select
                  id="candidate-education-filter"
                  data-testid="candidate-education-filter"
                  value={draftFilters.educationLevel}
                  onChange={(e) =>
                    handleDraftChange(
                      'educationLevel',
                      e.target.value as EducationFilterOption
                    )
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {(Object.keys(EDUCATION_LABELS) as EducationFilterOption[]).map(
                    (key) => (
                      <option key={key} value={key}>
                        {EDUCATION_LABELS[key]}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="candidate-stage-filter"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>Vòng tuyển dụng / Trạng thái</span>
                </label>
                <select
                  id="candidate-stage-filter"
                  data-testid="candidate-stage-filter"
                  value={draftFilters.stageStatus}
                  onChange={(e) =>
                    handleDraftChange(
                      'stageStatus',
                      e.target.value as StageFilterOption
                    )
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {(Object.keys(STAGE_LABELS) as StageFilterOption[]).map(
                    (key) => (
                      <option key={key} value={key}>
                        {STAGE_LABELS[key]}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* Cột 4: Trạng thái CV PDF */}
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="candidate-status-filter"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Trạng thái gợi ý từ CV</span>
                </label>
                <select
                  id="candidate-status-filter"
                  data-testid="candidate-status-filter"
                  value={draftFilters.cvParsingStatus || 'ALL'}
                  onChange={(e) =>
                    handleDraftChange(
                      'cvParsingStatus',
                      e.target.value as CvParsingStatus | 'ALL'
                    )
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">Tất cả trạng thái CV</option>
                  <option value="PENDING_CONFIRMATION">Chờ xác nhận gợi ý</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="PARSING">Đang đọc CV PDF</option>
                  <option value="FAILED">Lỗi đọc CV</option>
                  <option value="DISMISSED">Đã bỏ qua</option>
                </select>
              </div>
            </div>
          </div>

          {/* Khu vực Thẻ kỹ năng (Skills Tags / Chips) - AC 2 */}
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800/80 dark:bg-slate-800/30">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Thẻ kỹ năng chuyên môn (Chọn nhiều hoặc nhập thêm):
              </span>

              {/* Ô thêm skill tùy ý */}
              <form
                onSubmit={handleAddCustomSkill}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  placeholder="Kỹ năng khác..."
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  className="w-36 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => handleAddCustomSkill()}
                  data-testid="add-custom-skill-btn"
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-650"
                >
                  <Plus className="h-3 w-3" />
                  <span>Thêm</span>
                </button>
              </form>
            </div>

            {/* Danh sách chip kỹ năng */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {availableSkills.map((skill) => {
                const isSelected = (draftFilters.skills || []).some(
                  (s) => s.toLowerCase() === skill.toLowerCase()
                );
                return (
                  <button
                    key={skill}
                    type="button"
                    data-testid={`skill-chip-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => handleToggleSkill(skill)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-2xs ring-2 ring-emerald-500/30'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-750'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 stroke-[2.5]" />}
                    <span>{skill}</span>
                  </button>
                );
              })}

              {/* Các kỹ năng custom đã thêm mà không nằm trong availableSkills mặc định */}
              {(draftFilters.skills || [])
                .filter(
                  (custom) =>
                    !availableSkills.some(
                      (s) => s.toLowerCase() === custom.toLowerCase()
                    )
                )
                .map((customSkill) => (
                  <button
                    key={customSkill}
                    type="button"
                    onClick={() => handleToggleSkill(customSkill)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white shadow-2xs ring-2 ring-emerald-500/30"
                  >
                    <Check className="h-3 w-3 stroke-[2.5]" />
                    <span>{customSkill}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Thanh tác vụ: Nút "Áp dụng bộ lọc" & "Xóa tất cả" - AC 3 */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {totalResultsCount !== undefined ? (
                <span>
                  Tìm thấy{' '}
                  <strong className="font-semibold text-slate-800 dark:text-slate-200">
                    {totalResultsCount}
                  </strong>
                  {totalCandidatesCount !== undefined &&
                    ` / ${totalCandidatesCount}`}{' '}
                  ứng viên phù hợp
                </span>
              ) : (
                <span>Nhấn &ldquo;Áp dụng bộ lọc&rdquo; để lọc danh sách</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="reset-filters-btn"
                onClick={handleResetAll}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Xóa tất cả bộ lọc</span>
              </button>

              <button
                type="button"
                data-testid="apply-filters-btn"
                onClick={handleApply}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Áp dụng bộ lọc</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateSearchFilterPanel;
