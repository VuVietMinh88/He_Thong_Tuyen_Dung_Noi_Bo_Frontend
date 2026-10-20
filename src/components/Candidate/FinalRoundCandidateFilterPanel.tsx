import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Trophy,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import type {
  ComparisonCandidate,
  CandidateEvaluationFilterStatus,
} from '../../types/candidateComparison';
import { COMPARISON_CONSTRAINTS } from '../../types/candidateComparison';
import { candidateComparisonService } from '../../services/candidateComparisonService';
import {
  getEvaluationProgressBadgeConfig,
  isCandidateFullyEvaluated,
} from '../../utils/candidateComparisonHelper';

export interface FinalRoundCandidateFilterPanelProps {
  jobId?: string;
  initialFilterStatus?: CandidateEvaluationFilterStatus;
  selectedCandidateIds?: string[];
  onOpenComparison: (selectedCandidates: ComparisonCandidate[]) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const FinalRoundCandidateFilterPanel: React.FC<FinalRoundCandidateFilterPanelProps> = ({
  jobId,
  initialFilterStatus = 'ALL',
  selectedCandidateIds: initialSelectedIds = [],
  onOpenComparison,
  onClose,
  isModal = false,
}) => {
  // 1. Trạng thái bộ lọc đánh giá (AC 1)
  const [filterStatus, setFilterStatus] =
    useState<CandidateEvaluationFilterStatus>(initialFilterStatus);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // 2. Dữ liệu ứng viên & Trạng thái tải bất đồng bộ (AC 3)
  const [candidates, setCandidates] = useState<ComparisonCandidate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);

  // 3. Danh sách các ID ứng viên được chọn vào bảng so sánh (AC 2)
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>(initialSelectedIds);

  // Tải dữ liệu ứng viên vòng cuối kèm trạng thái phiếu đánh giá qua API (AC 3)
  const fetchCandidates = useCallback(
    async (statusToFetch: CandidateEvaluationFilterStatus) => {
      setIsFiltering(true);
      try {
        const result = await candidateComparisonService.getFinalCandidatesWithEvaluations(
          jobId,
          statusToFetch
        );
        setCandidates(result);

        // Tự động chọn trước tối đa 3 ứng viên ĐÃ ĐỦ ĐÁNH GIÁ nếu ban đầu chưa có lựa chọn
        if (initialSelectedIds.length === 0) {
          const validCandidates = result.filter(isCandidateFullyEvaluated);
          const defaultSelected = validCandidates
            .slice(0, COMPARISON_CONSTRAINTS.DEFAULT_SELECTED_COUNT)
            .map((c) => c.id);
          setSelectedCandidateIds(defaultSelected);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách ứng viên vòng cuối:', err);
      } finally {
        setIsLoading(false);
        setIsFiltering(false);
      }
    },
    [jobId, initialSelectedIds.length]
  );

  // Gọi API lần đầu khi component mount
  useEffect(() => {
    fetchCandidates(filterStatus);
  }, [fetchCandidates, filterStatus]);

  // Xử lý thay đổi bộ lọc trạng thái đánh giá (AC 1)
  const handleFilterStatusChange = (status: CandidateEvaluationFilterStatus) => {
    setFilterStatus(status);
  };

  // Lọc dữ liệu theo từ khóa tìm kiếm (Họ tên, Vị trí, Email)
  const filteredCandidates = useMemo(() => {
    if (!searchKeyword.trim()) {
      return candidates;
    }
    const keyword = searchKeyword.toLowerCase();
    return candidates.filter(
      (cand) =>
        cand.fullName.toLowerCase().includes(keyword) ||
        cand.candidateCode.toLowerCase().includes(keyword) ||
        cand.currentTitle.toLowerCase().includes(keyword) ||
        cand.email.toLowerCase().includes(keyword)
    );
  }, [candidates, searchKeyword]);

  // Thống kê số lượng ứng viên theo trạng thái
  const summaryCounts = useMemo(() => {
    const total = candidates.length;
    const completed = candidates.filter(isCandidateFullyEvaluated).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [candidates]);

  // Danh sách các ứng viên hợp lệ đã được chọn (Chỉ bao gồm ứng viên đủ điều kiện)
  const validSelectedCandidates = useMemo(() => {
    const selectedSet = new Set(selectedCandidateIds);
    return candidates.filter(
      (c) => selectedSet.has(c.id) && isCandidateFullyEvaluated(c)
    );
  }, [candidates, selectedCandidateIds]);

  // Xử lý chọn/bỏ chọn checkbox ứng viên (AC 2)
  const handleToggleSelectCandidate = (candidate: ComparisonCandidate) => {
    // Ngăn chặn chọn nếu ứng viên chưa đủ đánh giá
    if (!isCandidateFullyEvaluated(candidate)) {
      return;
    }

    const candidateId = candidate.id;
    if (selectedCandidateIds.includes(candidateId)) {
      setSelectedCandidateIds((prev) => prev.filter((id) => id !== candidateId));
    } else {
      if (selectedCandidateIds.length >= COMPARISON_CONSTRAINTS.MAX_CANDIDATES) {
        alert(
          `Bạn chỉ có thể chọn tối đa ${COMPARISON_CONSTRAINTS.MAX_CANDIDATES} ứng viên để so sánh đối chiếu cùng lúc.`
        );
        return;
      }
      setSelectedCandidateIds((prev) => [...prev, candidateId]);
    }
  };

  // Chọn toàn bộ ứng viên đủ đánh giá (tối đa 5)
  const handleSelectAllValid = () => {
    const readyCandidates = filteredCandidates.filter(isCandidateFullyEvaluated);
    const readyIds = readyCandidates
      .slice(0, COMPARISON_CONSTRAINTS.MAX_CANDIDATES)
      .map((c) => c.id);
    setSelectedCandidateIds(readyIds);
  };

  const handleClearSelection = () => {
    setSelectedCandidateIds([]);
  };

  // Mở ma trận so sánh khi người dùng click nút
  const handleOpenComparison = () => {
    if (validSelectedCandidates.length < COMPARISON_CONSTRAINTS.MIN_CANDIDATES) {
      return;
    }
    onOpenComparison(validSelectedCandidates);
  };

  const canOpenComparison =
    validSelectedCandidates.length >= COMPARISON_CONSTRAINTS.MIN_CANDIDATES &&
    validSelectedCandidates.length <= COMPARISON_CONSTRAINTS.MAX_CANDIDATES;

  return (
    <div
      data-testid="final-round-candidate-filter-panel"
      className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 overflow-hidden"
    >
      {/* 1. Header & Giới thiệu tính năng */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-gray-850">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm dark:bg-indigo-500">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Sàng lọc ứng viên đủ điều kiện so sánh vòng cuối
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Chỉ cho phép so sánh các ứng viên đã được toàn bộ Hội đồng phỏng vấn hoàn tất phiếu đánh giá (Completed Evaluations)
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Đóng"
          >
            ✕
          </button>
        )}
      </div>

      {/* 2. Thanh lọc điều kiện & Tìm kiếm (AC 1) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        {/* Bộ chọn phân loại trạng thái đánh giá (AC 1) */}
        <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Bộ lọc trạng thái đánh giá">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <span>Trạng thái:</span>
          </span>

          {/* Tab 1: Đã đủ đánh giá (Ready) */}
          <button
            type="button"
            data-testid="filter-status-completed"
            onClick={() => handleFilterStatusChange('COMPLETED')}
            aria-checked={filterStatus === 'COMPLETED'}
            role="radio"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filterStatus === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Đã đủ đánh giá (Ready for Comparison)</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                filterStatus === 'COMPLETED'
                  ? 'bg-white text-emerald-700'
                  : 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
              }`}
            >
              {summaryCounts.completed}
            </span>
          </button>

          {/* Tab 2: Chờ đánh giá (Pending) */}
          <button
            type="button"
            data-testid="filter-status-pending"
            onClick={() => handleFilterStatusChange('PENDING')}
            aria-checked={filterStatus === 'PENDING'}
            role="radio"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filterStatus === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Chờ đánh giá (Pending)</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                filterStatus === 'PENDING'
                  ? 'bg-white text-amber-700'
                  : 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
              }`}
            >
              {summaryCounts.pending}
            </span>
          </button>

          {/* Tab 3: Tất cả ứng viên */}
          <button
            type="button"
            data-testid="filter-status-all"
            onClick={() => handleFilterStatusChange('ALL')}
            aria-checked={filterStatus === 'ALL'}
            role="radio"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filterStatus === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-750'
            }`}
          >
            <span>Tất cả ứng viên vòng cuối</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                filterStatus === 'ALL'
                  ? 'bg-white text-indigo-700'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {summaryCounts.total}
            </span>
          </button>
        </div>

        {/* Ô tìm kiếm ứng viên nhanh */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            data-testid="input-search-final-candidate"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm theo họ tên, mã..."
            className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-xs placeholder:text-gray-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      {/* 3. Danh sách ứng viên & Bảng điều kiện chọn (AC 1 & AC 2) */}
      <div className="relative flex-1 overflow-x-auto max-h-[55vh] min-h-[280px]">
        {isLoading || isFiltering ? (
          <div
            data-testid="candidate-list-loading"
            className="flex flex-col items-center justify-center p-12 text-center"
          >
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            <p className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">
              Đang tải và đồng bộ trạng thái phiếu đánh giá ứng viên...
            </p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div
            data-testid="candidate-list-empty"
            className="flex flex-col items-center justify-center p-12 text-center"
          >
            <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Không tìm thấy ứng viên nào phù hợp với bộ lọc
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Vui lòng thử chọn trạng thái &ldquo;Tất cả ứng viên vòng cuối&rdquo; hoặc kiểm tra lại từ khóa tìm kiếm.
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 text-gray-600 dark:bg-gray-850 dark:border-gray-800 dark:text-gray-300">
              <tr>
                <th scope="col" className="w-12 p-3 text-center">
                  <span className="sr-only">Chọn</span>
                </th>
                <th scope="col" className="p-3 font-bold uppercase tracking-wider">
                  Ứng viên
                </th>
                <th scope="col" className="p-3 font-bold uppercase tracking-wider">
                  Vị trí & Kinh nghiệm
                </th>
                <th scope="col" className="p-3 font-bold uppercase tracking-wider">
                  Tiến độ nộp đánh giá
                </th>
                <th scope="col" className="p-3 font-bold uppercase tracking-wider">
                  Điểm năng lực
                </th>
                <th scope="col" className="p-3 font-bold uppercase tracking-wider">
                  Lương kỳ vọng
                </th>
                <th scope="col" className="p-3 font-bold uppercase tracking-wider">
                  Thời gian nhận việc
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredCandidates.map((candidate) => {
                const isReady = isCandidateFullyEvaluated(candidate);
                const isSelected = selectedCandidateIds.includes(candidate.id);
                const badgeCfg = getEvaluationProgressBadgeConfig(candidate.evaluationProgress);

                return (
                  <tr
                    key={candidate.id}
                    data-testid={`candidate-row-${candidate.id}`}
                    className={`transition-colors ${
                      !isReady
                        ? 'bg-gray-50/50 opacity-80 dark:bg-gray-850/40'
                        : isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    {/* Checkbox chọn ứng viên (AC 2) */}
                    <td className="p-3 text-center align-middle">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          data-testid={`checkbox-candidate-${candidate.id}`}
                          aria-label={`Chọn ứng viên ${candidate.fullName}`}
                          checked={isSelected}
                          disabled={!isReady}
                          onChange={() => handleToggleSelectCandidate(candidate)}
                          title={
                            !isReady
                              ? 'Ứng viên chưa hoàn thành đủ các phiếu đánh giá'
                              : 'Chọn ứng viên để đưa vào bảng so sánh'
                          }
                          className={`h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 ${
                            !isReady
                              ? 'cursor-not-allowed opacity-40 bg-gray-200 dark:bg-gray-700'
                              : 'cursor-pointer'
                          }`}
                        />
                      </div>
                    </td>

                    {/* Họ tên, Mã ứng viên & Avatar */}
                    <td className="p-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          {candidate.avatarUrl ? (
                            <img
                              src={candidate.avatarUrl}
                              alt={candidate.fullName}
                              className="h-9 w-9 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                              {candidate.fullName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <span>{candidate.fullName}</span>
                            {!isReady && (
                              <span
                                title="Ứng viên chưa hoàn thành đủ các phiếu đánh giá"
                                className="inline-flex items-center text-amber-500"
                              >
                                <AlertTriangle className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            {candidate.candidateCode} • {candidate.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Vị trí & Số năm kinh nghiệm */}
                    <td className="p-3 align-middle">
                      <div className="font-medium text-gray-900 dark:text-gray-200">
                        {candidate.currentTitle}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {candidate.currentCompany} • {candidate.experienceYears} năm KN
                      </div>
                    </td>

                    {/* Tiến độ nộp đánh giá (AC 1 & AC 2) */}
                    <td className="p-3 align-middle">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          data-testid={`badge-evaluation-progress-${candidate.id}`}
                          title={badgeCfg.tooltip}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${badgeCfg.containerClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badgeCfg.dotClass}`} />
                          <span>{badgeCfg.label}</span>
                        </span>

                        {/* Chi tiết người chưa chấm nếu chưa đủ */}
                        {!isReady && candidate.evaluationProgress?.pendingInterviewerNames && (
                          <span
                            data-testid={`pending-interviewers-${candidate.id}`}
                            className="text-[10px] text-amber-700 dark:text-amber-300 italic"
                          >
                            Thiếu: {candidate.evaluationProgress.pendingInterviewerNames.join(', ')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Điểm năng lực tổng thể */}
                    <td className="p-3 align-middle">
                      {isReady ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-indigo-700 dark:text-indigo-300">
                            {candidate.competencyScores.overall.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-gray-400">/ 5.0</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Chưa chốt điểm</span>
                      )}
                    </td>

                    {/* Lương kỳ vọng */}
                    <td className="p-3 align-middle font-medium text-gray-800 dark:text-gray-200">
                      {candidate.compensation.expectedSalaryFormatted}
                    </td>

                    {/* Thời gian nhận việc */}
                    <td className="p-3 align-middle text-gray-700 dark:text-gray-300">
                      {candidate.compensation.availabilityText}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. Footer Thanh điều khiển & Xác nhận mở bảng so sánh (AC 2) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 bg-gray-50/90 p-4 dark:border-gray-800 dark:bg-gray-850">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[11px] font-bold">
              {validSelectedCandidates.length}
            </span>
            <span className="font-semibold">ứng viên đủ điều kiện được chọn</span>
            <span className="text-gray-400">(Tối thiểu 2, tối đa 5 ứng viên)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllValid}
              className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-medium hover:underline"
            >
              Chọn nhanh đủ điều kiện
            </button>
            <span className="text-gray-300">•</span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:underline"
            >
              Bỏ chọn tất cả
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Thông báo điều kiện nếu chọn < 2 ứng viên */}
          {validSelectedCandidates.length < COMPARISON_CONSTRAINTS.MIN_CANDIDATES && (
            <span
              data-testid="insufficient-candidates-hint"
              className="text-xs text-amber-700 dark:text-amber-400 italic"
            >
              Chọn ít nhất {COMPARISON_CONSTRAINTS.MIN_CANDIDATES} ứng viên đã đủ đánh giá để so sánh
            </span>
          )}

          {/* Nút Mở bảng so sánh (X ứng viên) (AC 2) */}
          <button
            type="button"
            data-testid="btn-open-comparison-matrix"
            disabled={!canOpenComparison}
            onClick={handleOpenComparison}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition-all ${
              canOpenComparison
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 ring-2 ring-indigo-500/20 active:scale-98 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
            }`}
          >
            <Trophy className="h-4 w-4 text-amber-300" />
            <span>
              {validSelectedCandidates.length > 0
                ? `Mở bảng so sánh (${validSelectedCandidates.length} ứng viên)`
                : 'Mở bảng so sánh (Chưa chọn)'}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalRoundCandidateFilterPanel;
