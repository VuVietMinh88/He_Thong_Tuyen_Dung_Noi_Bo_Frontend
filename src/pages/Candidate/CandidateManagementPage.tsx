import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
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
} from 'lucide-react';
import type {
  CandidateProfile,
  CvParsingStatus,
  CandidateFilterCriteria,
  CandidateStage,
} from '../../types/candidate';
import type { CandidateStageChangePayload } from '../../components/Candidate/CandidateKanbanBoard';
import { candidateService } from '../../services/candidateService';
import { CandidateDetailModal } from '../../components/Candidate/CandidateDetailModal';
import CandidateKanbanBoard from '../../components/Candidate/CandidateKanbanBoard';
import MoveStageModal from '../../components/Candidate/MoveStageModal';
import RejectCandidateModal from '../../components/Candidate/RejectCandidateModal';
import type { MoveCandidateStagePayload, RejectCandidatePayload } from '../../services/candidateStageService';

type PendingStageAction = {
  candidate: CandidateProfile;
  fromStage: CandidateStage;
  toStage: CandidateStage;
  action: 'move' | 'reject';
};

export const CandidateManagementPage: React.FC = () => {
  const [candidateList, setCandidateList] = useState<CandidateProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    CvParsingStatus | 'ALL'
  >('ALL');
  const [selectedJobId, setSelectedJobId] = useState('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Quản lý Modal chi tiết hồ sơ & đối chiếu gợi ý CV
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [pendingStageAction, setPendingStageAction] = useState<PendingStageAction | null>(null);

  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    try {
      const filterCriteria: CandidateFilterCriteria = {
        keyword: searchKeyword,
        cvParsingStatus: selectedStatusFilter,
      };
      const resultList = await candidateService.getCandidates(filterCriteria);
      setCandidateList(resultList);
    } catch {
      setCandidateList([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchKeyword, selectedStatusFilter]);

  useEffect(() => {
    let isSubscribed = true;
    const loadCandidates = async () => {
      setIsLoading(true);
      try {
        const filterCriteria: CandidateFilterCriteria = {
          keyword: searchKeyword,
          cvParsingStatus: selectedStatusFilter,
        };
        const resultList = await candidateService.getCandidates(filterCriteria);
        if (isSubscribed) {
          setCandidateList(resultList);
        }
      } catch {
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
  }, [searchKeyword, selectedStatusFilter]);

  const visibleCandidates = selectedJobId === 'ALL'
    ? candidateList
    : candidateList.filter((candidate) => candidate.appliedJobId === selectedJobId);

  const jobOptions = Array.from(
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
  );

  const handleOpenCandidateDetail = (candidateItem: CandidateProfile) => {
    setSelectedCandidate(candidateItem);
    setIsDetailModalOpen(true);
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

        <button
          type="button"
          onClick={fetchCandidates}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 shadow-2xs hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
          />
          Làm mới
        </button>
      </div>

      {/* Thanh công cụ tìm kiếm và bộ lọc trạng thái */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        {/* Tìm kiếm theo từ khóa */}
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="candidate-search-input"
            type="text"
            value={searchKeyword}
            onChange={(changeEvent) => setSearchKeyword(changeEvent.target.value)}
            placeholder="Tìm theo tên ứng viên, email, số điện thoại..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        {/* Lọc theo trạng thái gợi ý từ CV */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Trạng thái CV:
          </span>
          <select
            id="candidate-status-filter"
            value={selectedStatusFilter}
            onChange={(changeEvent) =>
              setSelectedStatusFilter(
                changeEvent.target.value as CvParsingStatus | 'ALL'
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING_CONFIRMATION">Chờ xác nhận gợi ý</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="PARSING">Đang đọc CV PDF</option>
            <option value="FAILED">Lỗi đọc CV</option>
            <option value="DISMISSED">Đã bỏ qua</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="candidate-job-filter" className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Vị trí:
          </label>
          <select
            id="candidate-job-filter"
            value={selectedJobId}
            onChange={(event) => setSelectedJobId(event.target.value)}
            className="max-w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="ALL">Tất cả vị trí</option>
            {jobOptions.map((job) => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
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
      </div>

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
            selectedJobId={selectedJobId === 'ALL' ? undefined : selectedJobId}
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
                  <th scope="col" className="px-5 py-3.5">
                    Ứng viên
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
                    Thời điểm nộp
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

                    {/* Thời điểm nộp */}
                    <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {candidateItem.appliedAt
                          ? new Date(candidateItem.appliedAt).toLocaleDateString('vi-VN')
                          : 'Mới đây'}
                      </div>
                    </td>

                    {/* Thao tác xem hồ sơ */}
                    <td className="px-5 py-4 text-right">
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
          onClose={() => setPendingStageAction(null)}
          onSuccess={(payload) => handleStageMoveSuccess(payload, payload.toStage)}
        />
      )}
      {pendingStageAction?.action === 'reject' && (
        <RejectCandidateModal
          candidateId={pendingStageAction.candidate.id}
          candidateName={pendingStageAction.candidate.fullName}
          onClose={() => setPendingStageAction(null)}
          onSuccess={(payload) => handleStageMoveSuccess(payload, 'REJECTED')}
        />
      )}
    </div>
  );
};

export default CandidateManagementPage;
