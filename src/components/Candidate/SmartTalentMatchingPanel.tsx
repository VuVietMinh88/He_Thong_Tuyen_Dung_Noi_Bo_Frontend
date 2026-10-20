import React, { useState, useEffect, useCallback, useId } from 'react';
import {
  Sparkles,
  Search,
  RotateCcw,
  UserPlus,
  History,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  XCircle,
} from 'lucide-react';
import type {
  TalentPoolCandidateSuggestion,
  TalentPoolSearchParams,
} from '../../types/talentPool';
import { talentPoolService } from '../../services/talentPoolService';
import { AssignCandidateToJobModal } from './AssignCandidateToJobModal';
import { TalentCandidateHistoryModal } from './TalentCandidateHistoryModal';

export interface SmartTalentMatchingPanelProps {
  initialJobId?: string;
  initialJobTitle?: string;
  jobOptions?: Array<{ id: string; title: string }>;
  onCandidateAssigned?: (candidate: TalentPoolCandidateSuggestion) => void;
}

export const SmartTalentMatchingPanel: React.FC<SmartTalentMatchingPanelProps> = ({
  initialJobId,
  initialJobTitle,
  jobOptions = [],
  onCandidateAssigned,
}) => {
  const searchInputId = useId();
  const categoryFilterId = useId();
  const minScoreFilterId = useId();
  const sortSelectId = useId();
  const jobSelectId = useId();

  // Vị trí tuyển dụng đang được chọn để gợi ý
  const defaultJobId =
    initialJobId || (jobOptions.length > 0 ? jobOptions[0]?.id : 'job-react-01');
  const [selectedJobId, setSelectedJobId] = useState<string>(defaultJobId ?? 'job-react-01');

  // Danh sách ứng viên gợi ý & Trạng thái tải
  const [suggestions, setSuggestions] = useState<TalentPoolCandidateSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Bộ lọc tìm kiếm
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'MATCH_SCORE_DESC' | 'EXPERIENCE_DESC' | 'DATE_DESC'>(
    'MATCH_SCORE_DESC'
  );

  // Modal quản lý hành động
  const [assigningCandidate, setAssigningCandidate] =
    useState<TalentPoolCandidateSuggestion | null>(null);
  const [historyCandidate, setHistoryCandidate] =
    useState<TalentPoolCandidateSuggestion | null>(null);

  const resolvedJobTitle =
    jobOptions.find((j) => j.id === selectedJobId)?.title ||
    initialJobTitle ||
    'Lập trình viên React Senior';

  // Tải danh sách gợi ý từ API service
  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params: TalentPoolSearchParams = {
        keyword: searchKeyword,
        category: selectedCategory,
        minMatchScore: minMatchScore > 0 ? minMatchScore : undefined,
        sortBy,
      };
      const data = await talentPoolService.getTalentPoolSuggestions(selectedJobId, params);
      setSuggestions(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Không thể tải danh sách gợi ý từ kho tiềm năng';
      setErrorMessage(msg);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedJobId, searchKeyword, selectedCategory, minMatchScore, sortBy]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleResetFilters = () => {
    setSearchKeyword('');
    setSelectedCategory('ALL');
    setMinMatchScore(0);
    setSortBy('MATCH_SCORE_DESC');
  };

  const handleAssignSuccess = (updatedCandidate: TalentPoolCandidateSuggestion) => {
    setSuggestions((prev) =>
      prev.map((item) =>
        item.candidateId === updatedCandidate.candidateId || item.id === updatedCandidate.id
          ? updatedCandidate
          : item
      )
    );
    if (onCandidateAssigned) {
      onCandidateAssigned(updatedCandidate);
    }
  };

  const getMatchScoreBadgeColor = (score: number) => {
    if (score >= 90) {
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800';
    }
    if (score >= 80) {
      return 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-800';
    }
    if (score >= 70) {
      return 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-800';
    }
    return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800';
  };

  return (
    <div
      data-testid="smart-talent-matching-panel"
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
    >
      {/* 1. Header & Chọn Vị trí mới mở */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Gợi ý ứng viên từ Kho tiềm năng (Smart Talent Matching)
            </h2>
            <span
              data-testid="matching-count-badge"
              className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
            >
              {suggestions.length} hồ sơ phù hợp
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Hệ thống AI tự động đối sánh kỹ năng và kinh nghiệm từ kho tài năng với yêu cầu vị trí tuyển dụng mới
          </p>
        </div>

        {/* Dropdown chọn vị trí tuyển dụng */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <label
            htmlFor={jobSelectId}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap"
          >
            <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
            <span>Vị trí đối chiếu:</span>
          </label>
          {jobOptions.length > 0 ? (
            <select
              id={jobSelectId}
              data-testid="matching-job-select"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {jobOptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300">
              {resolvedJobTitle}
            </div>
          )}
        </div>
      </div>

      {/* 2. Thanh tìm kiếm & Bộ lọc nâng cao */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 rounded-xl bg-slate-50/70 p-3.5 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800">
        {/* Ô tìm kiếm từ khóa */}
        <div className="lg:col-span-4 relative">
          <label htmlFor={searchInputId} className="sr-only">
            Tìm kiếm ứng viên
          </label>
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            id={searchInputId}
            type="text"
            data-testid="talent-search-input"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm theo tên, email, kỹ năng (vd: React, Go...)"
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Lọc theo Nhóm kho tiềm năng */}
        <div className="lg:col-span-3">
          <label htmlFor={categoryFilterId} className="sr-only">
            Nhóm kho
          </label>
          <select
            id={categoryFilterId}
            data-testid="talent-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="ALL">Tất cả nhóm kho</option>
            <option value="Frontend Core">Frontend Core</option>
            <option value="Backend High-Scale">Backend High-Scale</option>
            <option value="DevOps Dự phòng">DevOps Dự phòng</option>
            <option value="Management Track">Management Track</option>
            <option value="AI / Data Science">AI / Data Science</option>
            <option value="QA / Automation Tester">QA / Automation Tester</option>
          </select>
        </div>

        {/* Lọc theo Điểm phù hợp tối thiểu */}
        <div className="lg:col-span-2">
          <label htmlFor={minScoreFilterId} className="sr-only">
            Điểm phù hợp
          </label>
          <select
            id={minScoreFilterId}
            data-testid="min-score-filter"
            value={minMatchScore}
            onChange={(e) => setMinMatchScore(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="0">Tất cả mức điểm</option>
            <option value="70">Khớp từ 70% trở lên</option>
            <option value="80">Khớp từ 80% trở lên</option>
            <option value="90">Khớp từ 90% (Rất cao)</option>
          </select>
        </div>

        {/* Sắp xếp */}
        <div className="lg:col-span-2">
          <label htmlFor={sortSelectId} className="sr-only">
            Sắp xếp
          </label>
          <select
            id={sortSelectId}
            data-testid="talent-sort-select"
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as 'MATCH_SCORE_DESC' | 'EXPERIENCE_DESC' | 'DATE_DESC'
              )
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="MATCH_SCORE_DESC">Điểm phù hợp cao nhất</option>
            <option value="EXPERIENCE_DESC">Kinh nghiệm nhiều nhất</option>
            <option value="DATE_DESC">Lưu kho gần đây nhất</option>
          </select>
        </div>

        {/* Nút Đặt lại */}
        <div className="lg:col-span-1 flex items-center">
          <button
            type="button"
            data-testid="reset-talent-filter-btn"
            onClick={handleResetFilters}
            className="w-full inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors"
            title="Đặt lại bộ lọc"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Đặt lại</span>
          </button>
        </div>
      </div>

      {/* 3. Danh sách hồ sơ gợi ý */}
      {isLoading ? (
        <div
          data-testid="talent-matching-skeleton"
          className="space-y-3 py-4"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-2.5 w-56 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                </div>
                <div className="h-7 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      ) : errorMessage ? (
        <div className="flex items-center justify-center p-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : suggestions.length === 0 ? (
        <div
          data-testid="talent-matching-empty"
          className="flex flex-col items-center justify-center p-12 text-center text-slate-500 dark:text-slate-400"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
            <XCircle className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            Không tìm thấy hồ sơ nào phù hợp
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            Thử điều chỉnh lại từ khóa tìm kiếm, giảm điểm phù hợp tối thiểu hoặc chọn nhóm kho khác.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
          >
            Khôi phục bộ lọc mặc định
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((candidate) => {
            const initials = candidate.fullName
              .split(' ')
              .map((n) => n[0])
              .slice(-2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={candidate.id}
                data-testid={`talent-suggestion-card-${candidate.id}`}
                className="group relative rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Cột trái: Thông tin ứng viên & Kỹ năng */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 font-bold text-indigo-700 text-xs shadow-2xs dark:from-indigo-950 dark:to-purple-950 dark:text-indigo-200">
                      {initials || 'UV'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {candidate.fullName}
                        </h4>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {candidate.category}
                        </span>
                        {candidate.isAssigned && (
                          <span
                            data-testid={`badge-assigned-${candidate.id}`}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Đã gán vào tin tuyển dụng
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span>{candidate.currentTitle || 'Chuyên viên kỹ thuật'}</span>
                        <span>•</span>
                        <span>{candidate.experienceYears} năm kinh nghiệm</span>
                        <span>•</span>
                        <span className="truncate max-w-[200px]">{candidate.email}</span>
                      </div>

                      {/* AC 1: Hiển thị các kỹ năng trùng khớp & thiếu */}
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          Kỹ năng khớp:
                        </span>
                        {candidate.matchedSkills.map((skill) => (
                          <span
                            key={skill}
                            data-testid={`matched-skill-${candidate.id}-${skill}`}
                            className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800"
                          >
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            {skill}
                          </span>
                        ))}
                        {candidate.missingSkills && candidate.missingSkills.length > 0 && (
                          <span className="text-[10px] text-slate-400">
                            (Thiếu: {candidate.missingSkills.join(', ')})
                          </span>
                        )}
                      </div>

                      {/* Ghi chú tóm tắt trong kho */}
                      {candidate.notes && (
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-1 italic bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          &ldquo;{candidate.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Cột phải: Điểm số phù hợp & Thao tác nhanh (AC 2) */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">
                    {/* Badge Điểm số phù hợp Match Score % */}
                    <div
                      data-testid={`match-score-badge-${candidate.id}`}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black shadow-2xs ring-1 ${getMatchScoreBadgeColor(
                        candidate.matchScore
                      )}`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{candidate.matchScore}% Phù hợp</span>
                    </div>

                    {/* Thao tác nút bấm */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        data-testid={`view-history-btn-${candidate.id}`}
                        onClick={() => setHistoryCandidate(candidate)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition-colors"
                        title="Xem lại lịch sử đánh giá và ghi chú cũ"
                      >
                        <History className="h-3.5 w-3.5 text-slate-400" />
                        <span className="hidden md:inline">Lịch sử</span>
                      </button>

                      <button
                        type="button"
                        data-testid={`assign-candidate-btn-${candidate.id}`}
                        onClick={() => setAssigningCandidate(candidate)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all ${
                          candidate.isAssigned
                            ? 'border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                        }`}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>{candidate.isAssigned ? 'Gán vòng khác' : 'Mời ứng tuyển'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal gán vào vòng tuyển dụng */}
      <AssignCandidateToJobModal
        isOpen={Boolean(assigningCandidate)}
        candidate={assigningCandidate}
        selectedJobId={selectedJobId}
        selectedJobTitle={resolvedJobTitle}
        jobOptions={jobOptions}
        onClose={() => setAssigningCandidate(null)}
        onSuccess={handleAssignSuccess}
      />

      {/* Modal xem lịch sử đánh giá cũ */}
      <TalentCandidateHistoryModal
        isOpen={Boolean(historyCandidate)}
        candidate={historyCandidate}
        onClose={() => setHistoryCandidate(null)}
      />
    </div>
  );
};

export default SmartTalentMatchingPanel;
