import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Eye,
  RefreshCw,
  Star,
  LayoutGrid,
  List,
  Flag,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FolderHeart,
} from 'lucide-react';
import type {
  CandidateProfile,
  CvParsingStatus,
  CandidateFilterCriteria,
  CandidateStage,
  CandidateSortOption,
  CandidateCombinedFilterState,
} from '../../types/candidate';
import {
  DEFAULT_CANDIDATE_SORT_OPTION,
  DEFAULT_COMBINED_FILTER_STATE,
} from '../../types/candidate';
import { candidateService } from '../../services/candidateService';
import { CandidateDetailModal } from '../../components/Candidate/CandidateDetailModal';
import CandidateKanbanBoard, {
  type CandidateStageChangePayload,
} from '../../components/Candidate/CandidateKanbanBoard';
import { MatchingScoreBadge } from '../../components/Candidate/MatchingScoreBadge';
import { CriteriaQuickSummaryPopover } from '../../components/Candidate/CriteriaQuickSummaryPopover';
import {
  resolveCandidateMatchingEvaluation,
  sortCandidatesByMatchingScore,
} from '../../utils/candidateMatchingHelper';
import MoveStageModal from '../../components/Candidate/MoveStageModal';
import RejectCandidateModal from '../../components/Candidate/RejectCandidateModal';
import type { MoveCandidateStagePayload, RejectCandidatePayload } from '../../services/candidateStageService';
import SlaOverdueBadge from '../../components/SLA/SlaOverdueBadge';
import SlaNotificationBell from '../../components/SLA/SlaNotificationBell';
import { slaService } from '../../services/slaService';
import { CandidateSearchFilterPanel } from '../../components/Candidate/CandidateSearchFilterPanel';
import { filterCandidatesCombined } from '../../utils/candidateFilterHelper';
import { AddToTalentPoolModal } from '../../components/Candidate/AddToTalentPoolModal';

type PendingStageAction = {
  candidate: CandidateProfile;
  fromStage: CandidateStage;
  toStage: CandidateStage;
  action: 'move' | 'reject';
};

export interface CandidateManagementPageProps {
  initialCandidates?: CandidateProfile[];
  initialIsLoading?: boolean;
}

export const CandidateManagementPage: React.FC<CandidateManagementPageProps> = ({
  initialCandidates,
  initialIsLoading,
}) => {
  const [candidateList, setCandidateList] = useState<CandidateProfile[]>(
    () => initialCandidates || []
  );
  const [isLoading, setIsLoading] = useState<boolean>(
    () => (initialIsLoading !== undefined ? initialIsLoading : !initialCandidates?.length)
  );

  // Bộ lọc kết hợp nâng cao đa điều kiện (Task Jira TKNHTTDNB1-390 / User Story S5-03)
  const [combinedFilters, setCombinedFilters] =
    useState<CandidateCombinedFilterState>(DEFAULT_COMBINED_FILTER_STATE);

  const [onlyOverdueSla, setOnlyOverdueSla] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedSortOrder, setSelectedSortOrder] =
    useState<CandidateSortOption>(DEFAULT_CANDIDATE_SORT_OPTION);

  // Quản lý Modal chi tiết hồ sơ & đối chiếu gợi ý CV
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [pendingStageAction, setPendingStageAction] = useState<PendingStageAction | null>(null);

  // Quản lý chọn ứng viên & Modal đưa vào kho tiềm năng (Task Jira TKNHTTDNB1-396)
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isTalentPoolModalOpen, setIsTalentPoolModalOpen] = useState<boolean>(false);
  const [talentPoolModalCandidates, setTalentPoolModalCandidates] = useState<CandidateProfile[]>([]);

  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    try {
      const filterCriteria: CandidateFilterCriteria = {
        keyword: combinedFilters.keyword,
        cvParsingStatus: combinedFilters.cvParsingStatus,
        sortBy: selectedSortOrder,
      };
      const resultList = await candidateService.getCandidates(filterCriteria);
      setCandidateList(resultList);
    } catch {
      // Tại sao: Khi gọi API tải danh sách thất bại hoặc gặp lỗi mạng, đưa về mảng rỗng để UI không bị treo
      setCandidateList([]);
    } finally {
      setIsLoading(false);
    }
  }, [combinedFilters.keyword, combinedFilters.cvParsingStatus, selectedSortOrder]);

  useEffect(() => {
    let isSubscribed = true;
    const loadCandidates = async () => {
      setIsLoading(true);
      try {
        const filterCriteria: CandidateFilterCriteria = {
          keyword: combinedFilters.keyword,
          cvParsingStatus: combinedFilters.cvParsingStatus,
          sortBy: selectedSortOrder,
        };
        const resultList = await candidateService.getCandidates(filterCriteria);
        if (isSubscribed) {
          setCandidateList(resultList);
        }
      } catch {
        // Tại sao: Bắt lỗi khi gọi API tải danh sách thất bại, đảm bảo an toàn cho giao diện người dùng
        if (isSubscribed) {
          setCandidateList([]);
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    loadCandidates();

    return () => {
      isSubscribed = false;
    };
  }, [combinedFilters.keyword, combinedFilters.cvParsingStatus, selectedSortOrder]);

  const overdueCount = useMemo(() => {
    return slaService.filterOverdueCandidates(candidateList).length;
  }, [candidateList]);

  const departmentOptions = useMemo(() => {
    return Array.from(
      new Set(
        candidateList
          .map((c) => c.departmentName)
          .filter((d): d is string => Boolean(d))
      )
    );
  }, [candidateList]);

  const jobOptions = useMemo(
    () =>
      Array.from(
        candidateList.reduce((jobs, candidate) => {
          if (candidate.appliedJobId) {
            jobs.set(
              candidate.appliedJobId,
              candidate.appliedJobTitle || 'Vị trí chưa xác định',
            );
          }
          return jobs;
        }, new Map<string, string>()),
        ([id, title]) => ({ id, title }),
      ),
    [candidateList]
  );

  const visibleCandidates = useMemo(() => {
    // 1. Áp dụng toàn bộ bộ lọc kết hợp đa điều kiện (Họ tên, SĐT, Email, Kỹ năng, Kinh nghiệm, Học vấn, Vị trí, Vòng tuyển dụng)
    let list = filterCandidatesCombined(candidateList, combinedFilters);

    // 2. Lọc nhanh hồ sơ quá hạn SLA
    if (onlyOverdueSla) {
      list = slaService.filterOverdueCandidates(list);
    }

    // 3. Áp dụng sắp xếp dữ liệu hiển thị (Task TKNHTTDNB1-411)
    // Bảo toàn 100% hồ sơ ứng viên: Không ẩn/lọc bỏ bất kỳ ứng viên nào
    return sortCandidatesByMatchingScore(list, selectedSortOrder);
  }, [candidateList, combinedFilters, onlyOverdueSla, selectedSortOrder]);

  const handleToggleScoreSort = () => {
    if (selectedSortOrder === 'SCORE_DESC') {
      setSelectedSortOrder('SCORE_ASC');
    } else {
      setSelectedSortOrder('SCORE_DESC');
    }
  };

  const handleOpenCandidateDetail = (candidateItem: CandidateProfile) => {
    setSelectedCandidate(candidateItem);
    setIsDetailModalOpen(true);
  };

  const handleOpenCandidateDetailById = (candidateId: string) => {
    const target = candidateList.find((c) => c.id === candidateId);
    if (target) {
      handleOpenCandidateDetail(target);
    }
  };

  const handleCloseCandidateDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedCandidate(null);
  };

  const handleProfileUpdated = (updatedProfile: CandidateProfile) => {
    setCandidateList((previousList) =>
      previousList.map((item) =>
        item.id === updatedProfile.id ? updatedProfile : item
      )
    );
    setSelectedCandidate(updatedProfile);
  };

  const handleCandidateStageChange = ({ candidateId, fromStage, toStage }: CandidateStageChangePayload) => {
    const candidate = candidateList.find((item) => item.id === candidateId);
    if (!candidate) return;
    setPendingStageAction({
      candidate,
      fromStage,
      toStage,
      action: toStage === 'REJECTED' ? 'reject' : 'move',
    });
  };

  const handleStageMoveSuccess = (
    payload: MoveCandidateStagePayload | RejectCandidatePayload,
    stage: CandidateStage,
  ) => {
    const candidateId = pendingStageAction?.candidate.id;
    if (!candidateId) return;
    setCandidateList((previousList) => previousList.map((candidate) => (
      candidate.id === candidateId
        ? {
            ...candidate,
            status: stage,
            updatedAt: new Date().toISOString(),
            ...(stage === 'REJECTED' && 'reason' in payload ? { rejectionReason: payload.reason } : {}),
          }
        : candidate
    )));
    setPendingStageAction(null);
  };

  const handleToggleSelectAll = () => {
    if (selectedCandidateIds.length === visibleCandidates.length && visibleCandidates.length > 0) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(visibleCandidates.map((c) => c.id));
    }
  };

  const handleToggleSelectCandidate = (candidateId: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(candidateId) ? prev.filter((id) => id !== candidateId) : [...prev, candidateId]
    );
  };

  const handleOpenTalentPoolForSingle = (candidate: CandidateProfile) => {
    setTalentPoolModalCandidates([candidate]);
    setIsTalentPoolModalOpen(true);
  };

  const handleOpenTalentPoolForBulk = () => {
    const selectedList = candidateList.filter((c) => selectedCandidateIds.includes(c.id));
    if (selectedList.length === 0) return;
    setTalentPoolModalCandidates(selectedList);
    setIsTalentPoolModalOpen(true);
  };

  const renderStatusBadge = (parsingStatus: CvParsingStatus) => {
    switch (parsingStatus) {
      case 'PENDING_CONFIRMATION':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-800">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            Chờ xác nhận gợi ý
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            Đã xác nhận
          </span>
        );
      case 'PARSING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-800">
            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
            Đang đọc CV PDF
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800">
            <AlertCircle className="h-3 w-3 text-amber-500" />
            Lỗi đọc CV
          </span>
        );
      case 'DISMISSED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            Đã bỏ qua
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Tiêu đề trang & Tóm tắt */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Quản lý Hồ sơ Ứng viên & CV
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Xem hồ sơ, đối chiếu và xác nhận dữ liệu cơ bản (Họ tên, Email, Số điện thoại) trích xuất tự động từ CV PDF.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <SlaNotificationBell
            candidates={candidateList}
            onSelectCandidate={handleOpenCandidateDetailById}
          />

          <button
            type="button"
            onClick={fetchCandidates}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 shadow-2xs hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
            />
            Làm mới
          </button>
        </div>
      </div>

      {/* Giao diện tìm kiếm ứng viên nâng cao và bộ lọc kết hợp đa điều kiện (Task Jira TKNHTTDNB1-390 / User Story S5-03) */}
      <CandidateSearchFilterPanel
        filters={combinedFilters}
        onChangeFilters={(nextFilters) => {
          setCombinedFilters(nextFilters);
        }}
        onApplyFilters={(appliedFilters) => {
          setCombinedFilters(appliedFilters);
        }}
        onResetFilters={() => {
          setCombinedFilters({
            ...DEFAULT_COMBINED_FILTER_STATE,
            sortBy: selectedSortOrder,
          });
        }}
        jobOptions={jobOptions}
        departmentOptions={departmentOptions}
        totalResultsCount={visibleCandidates.length}
        totalCandidatesCount={candidateList.length}
        isLoading={isLoading}
      />

      {/* 2. Thanh điều khiển sắp xếp, SLA và chuyển đổi chế độ xem */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-2">
          {/* Bộ điều khiển sắp xếp theo Điểm phù hợp gợi ý (Task TKNHTTDNB1-411) */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="candidate-sort-select"
              className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
              <span>Sắp xếp:</span>
            </label>
            <select
              id="candidate-sort-select"
              data-testid="candidate-sort-select"
              value={selectedSortOrder}
              onChange={(event) =>
                setSelectedSortOrder(event.target.value as CandidateSortOption)
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="SCORE_DESC">
                Điểm phù hợp: Cao đến thấp (Gợi ý đọc trước)
              </option>
              <option value="SCORE_ASC">
                Điểm phù hợp: Thấp đến cao
              </option>
              <option value="APPLIED_AT_DESC">
                Ngày nộp hồ sơ: Mới nhất
              </option>
            </select>
          </div>

          {/* Bộ lọc nhanh: Hồ sơ quá hạn SLA (AC 2) */}
          <button
            type="button"
            data-testid="filter-chip-overdue-sla"
            onClick={() => setOnlyOverdueSla(!onlyOverdueSla)}
            aria-pressed={onlyOverdueSla}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              onlyOverdueSla
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50/90 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            <Flag className={`h-3.5 w-3.5 ${onlyOverdueSla ? 'text-white' : 'text-rose-600'}`} />
            <span>Hồ sơ quá hạn SLA</span>
            {overdueCount > 0 && (
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  onlyOverdueSla
                    ? 'bg-white text-rose-700'
                    : 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                }`}
              >
                {overdueCount}
              </span>
            )}
          </button>
        </div>

        <div className="ml-auto inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800" aria-label="Chế độ xem ứng viên">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
            className={`inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold ${
              viewMode === 'list' ? 'bg-white text-indigo-700 shadow-sm dark:bg-gray-700 dark:text-indigo-300' : 'text-gray-500'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Danh sách
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            aria-pressed={viewMode === 'kanban'}
            className={`inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold ${
              viewMode === 'kanban' ? 'bg-white text-indigo-700 shadow-sm dark:bg-gray-700 dark:text-indigo-300' : 'text-gray-500'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Kanban
          </button>
        </div>
      </div>

      {/* Thanh thao tác hàng loạt (Bulk Action Bar) */}
      {selectedCandidateIds.length > 0 && (
        <div
          data-testid="bulk-action-bar"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/90 px-4 py-2.5 shadow-xs dark:border-indigo-900/60 dark:bg-indigo-950/40"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[11px] font-bold">
              {selectedCandidateIds.length}
            </span>
            <span>ứng viên đang được chọn</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="bulk-clear-selection-btn"
              onClick={() => setSelectedCandidateIds([])}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-indigo-100/70 dark:text-slate-300 dark:hover:bg-indigo-900/50"
            >
              Bỏ chọn
            </button>
            <button
              type="button"
              data-testid="bulk-add-to-talent-pool-btn"
              onClick={handleOpenTalentPoolForBulk}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition-colors"
            >
              <FolderHeart className="h-4 w-4" />
              <span>Chuyển vào Kho tiềm năng</span>
            </button>
          </div>
        </div>
      )}

      {/* Bảng danh sách ứng viên */}
      {viewMode === 'kanban' ? (
        isLoading ? (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-12 text-sm text-gray-500" role="status">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            Đang tải danh sách hồ sơ ứng viên...
          </div>
        ) : (
          <CandidateKanbanBoard
            candidates={visibleCandidates}
            selectedJobId={combinedFilters.jobId === 'ALL' ? undefined : combinedFilters.jobId}
            onSelectCandidate={handleOpenCandidateDetail}
            onStageChange={handleCandidateStageChange}
          />
        )
      ) : (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Đang tải danh sách hồ sơ ứng viên...
            </p>
          </div>
        ) : visibleCandidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
              Không tìm thấy hồ sơ nào
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Thử điều chỉnh lại từ khóa tìm kiếm hoặc bộ lọc trạng thái.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-800">
              <thead className="bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                <tr>
                  <th scope="col" className="w-10 px-4 py-3.5">
                    <input
                      type="checkbox"
                      data-testid="select-all-candidates-checkbox"
                      aria-label="Chọn tất cả ứng viên trên trang"
                      checked={
                        visibleCandidates.length > 0 &&
                        selectedCandidateIds.length === visibleCandidates.length
                      }
                      onChange={handleToggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                    />
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Ứng viên
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    <button
                      type="button"
                      data-testid="sort-by-score-header-btn"
                      onClick={handleToggleScoreSort}
                      className="group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700 hover:text-indigo-600 focus:outline-none dark:text-gray-300 dark:hover:text-indigo-400"
                      title="Nhấp để thay đổi thứ tự sắp xếp theo điểm phù hợp"
                    >
                      <span>Điểm phù hợp & Tiêu chí</span>
                      {selectedSortOrder === 'SCORE_DESC' && (
                        <ArrowDown className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-label="Đang sắp xếp điểm cao đến thấp" />
                      )}
                      {selectedSortOrder === 'SCORE_ASC' && (
                        <ArrowUp className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-label="Đang sắp xếp điểm thấp đến cao" />
                      )}
                      {selectedSortOrder !== 'SCORE_DESC' && selectedSortOrder !== 'SCORE_ASC' && (
                        <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" aria-label="Chưa kích hoạt sắp xếp theo điểm" />
                      )}
                    </button>
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Vị trí ứng tuyển
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Tệp CV
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Trạng thái bóc tách CV
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    <button
                      type="button"
                      data-testid="sort-by-date-header-btn"
                      onClick={() => setSelectedSortOrder('APPLIED_AT_DESC')}
                      className="group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700 hover:text-indigo-600 focus:outline-none dark:text-gray-300 dark:hover:text-indigo-400"
                      title="Nhấp để sắp xếp theo ngày nộp mới nhất"
                    >
                      <span>Thời điểm nộp</span>
                      {selectedSortOrder === 'APPLIED_AT_DESC' ? (
                        <ArrowDown className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-label="Đang sắp xếp ngày mới nhất" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" aria-label="Chưa kích hoạt sắp xếp ngày" />
                      )}
                    </button>
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {visibleCandidates.map((candidateItem) => (
                  <tr
                    key={candidateItem.id}
                    className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                  >
                    {/* Ô chọn Checkbox */}
                    <td className="w-10 px-4 py-4">
                      <input
                        type="checkbox"
                        data-testid={`select-candidate-checkbox-${candidateItem.id}`}
                        aria-label={`Chọn ứng viên ${candidateItem.fullName}`}
                        checked={selectedCandidateIds.includes(candidateItem.id)}
                        onChange={() => handleToggleSelectCandidate(candidateItem.id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                      />
                    </td>
                    {/* Thông tin ứng viên */}
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {candidateItem.fullName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {candidateItem.email} • {candidateItem.phone}
                      </div>
                      {candidateItem.trackingCode && (
                        <div className="mt-1 font-mono text-[11px] text-gray-400">
                          {candidateItem.trackingCode}
                        </div>
                      )}
                      {/* Hiển thị mức đánh giá sao và nhãn phục vụ sàng lọc nhanh */}
                      {(Boolean(candidateItem.rating) ||
                        (candidateItem.tags && candidateItem.tags.length > 0)) && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {Boolean(candidateItem.rating) && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                              {candidateItem.rating}/5
                            </span>
                          )}
                          {candidateItem.tags?.slice(0, 2).map((tagItem) => (
                            <span
                              key={tagItem.id}
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${tagItem.colorClass || 'border-gray-200 bg-gray-100 text-gray-700'}`}
                            >
                              {tagItem.name}
                            </span>
                          ))}
                          {(candidateItem.tags?.length || 0) > 2 && (
                            <span className="text-[10px] text-gray-400">
                              +{(candidateItem.tags?.length || 0) - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Điểm tổng phù hợp và tóm tắt 3 tiêu chí bắt buộc (Task TKNHTTDNB1-410 & TKNHTTDNB1-411) */}
                    <td className="px-5 py-4">
                      {(() => {
                        const matchingEvaluation =
                          candidateItem.matchingEvaluation ||
                          resolveCandidateMatchingEvaluation(candidateItem);
                        const isRecommendedToReadFirst =
                          selectedSortOrder === 'SCORE_DESC' &&
                          matchingEvaluation.totalMatchingScore >= 80;

                        return (
                          <div className="flex flex-col gap-1.5 items-start">
                            <div className="flex items-center gap-2 flex-wrap">
                              <MatchingScoreBadge
                                totalMatchingScore={matchingEvaluation.totalMatchingScore}
                                isOverallPassed={matchingEvaluation.isOverallPassed}
                                variant="standard"
                              />
                              {isRecommendedToReadFirst && (
                                <span
                                  data-testid={`badge-read-first-${candidateItem.id}`}
                                  className="inline-flex items-center rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 ring-1 ring-inset ring-indigo-700/20 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-800"
                                >
                                  Gợi ý đọc trước
                                </span>
                              )}
                            </div>
                            <CriteriaQuickSummaryPopover
                              criteriaList={matchingEvaluation.criteriaList}
                            />
                          </div>
                        );
                      })()}
                    </td>

                    {/* Vị trí ứng tuyển */}
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        {candidateItem.appliedJobTitle || 'Chưa xác định'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {candidateItem.departmentName || 'Chưa phân bổ'}
                      </div>
                    </td>

                    {/* Tệp CV đính kèm */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                        <FileText className="h-4 w-4 text-red-500" />
                        <span className="max-w-[160px] truncate">
                          {candidateItem.cvFileName || 'CV.pdf'}
                        </span>
                      </div>
                    </td>

                    {/* Trạng thái bóc tách CV */}
                    <td className="px-5 py-4">
                      {renderStatusBadge(candidateItem.cvParsingStatus)}
                    </td>

                    {/* Thời điểm nộp & Cảnh báo SLA */}
                    <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {candidateItem.appliedAt
                          ? new Date(candidateItem.appliedAt).toLocaleDateString('vi-VN')
                          : 'Mới đây'}
                      </div>
                      <div className="mt-1.5">
                        <SlaOverdueBadge candidate={candidateItem} size="xs" />
                      </div>
                    </td>

                    {/* Thao tác xem hồ sơ & Lưu kho tiềm năng */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          data-testid={`add-to-talent-pool-btn-${candidateItem.id}`}
                          title="Chuyển vào Kho ứng viên tiềm năng"
                          onClick={() => handleOpenTalentPoolForSingle(candidateItem)}
                          className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 transition-colors"
                        >
                          <FolderHeart className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          <span className="hidden xl:inline">Lưu tiềm năng</span>
                        </button>

                        <button
                          type="button"
                          id={`view-candidate-btn-${candidateItem.id}`}
                          onClick={() => handleOpenCandidateDetail(candidateItem)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            candidateItem.cvParsingStatus === 'PENDING_CONFIRMATION'
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs dark:bg-indigo-500'
                              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750'
                          }`}
                        >
                          {candidateItem.cvParsingStatus === 'PENDING_CONFIRMATION' ? (
                            <>
                              <Sparkles className="h-3.5 w-3.5" />
                              Đối chiếu gợi ý CV
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5" />
                              Xem hồ sơ
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Modal chi tiết hồ sơ & xác nhận dữ liệu gợi ý CV */}
      <CandidateDetailModal
        isOpen={isDetailModalOpen}
        candidateProfile={selectedCandidate}
        onClose={handleCloseCandidateDetail}
        onProfileUpdated={handleProfileUpdated}
      />
      {pendingStageAction?.action === 'move' && (
        <MoveStageModal
          candidateId={pendingStageAction.candidate.id}
          candidateName={pendingStageAction.candidate.fullName}
          currentStage={pendingStageAction.fromStage}
          initialStage={pendingStageAction.toStage}
          allowException
          onClose={() => setPendingStageAction(null)}
          onSuccess={(payload) => handleStageMoveSuccess(payload, payload.toStage)}
        />
      )}
      {pendingStageAction?.action === 'reject' && (
        <RejectCandidateModal
          candidateId={pendingStageAction.candidate.id}
          candidateName={pendingStageAction.candidate.fullName}
          currentStage={pendingStageAction.fromStage}
          onClose={() => setPendingStageAction(null)}
          onSuccess={(payload) =>
            handleStageMoveSuccess(
              payload,
              payload.interviewResult === 'PASSED' ? 'OFFER' : 'REJECTED',
            )
          }
        />
      )}

      {/* Modal chuyển ứng viên vào Kho tiềm năng (Task Jira TKNHTTDNB1-396) */}
      <AddToTalentPoolModal
        isOpen={isTalentPoolModalOpen}
        candidates={talentPoolModalCandidates}
        onClose={() => setIsTalentPoolModalOpen(false)}
        onSuccess={() => {
          setSelectedCandidateIds([]);
        }}
      />
    </div>
  );
};

export default CandidateManagementPage;
