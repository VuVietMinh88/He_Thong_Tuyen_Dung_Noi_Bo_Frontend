import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Search,
  Filter,
  Paperclip,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Users,
  ShieldCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';
import type {
  CandidateOnboardingRecord,
  OnboardingCandidateTask,
  OnboardingTaskPhase,
  OnboardingTaskStatus,
} from '../../types/onboardingChecklist';
import {
  ONBOARDING_PHASES,
} from '../../types/onboardingChecklist';
import {
  onboardingTrackingService,
  MOCK_CANDIDATE_ONBOARDING_RECORDS,
} from '../../services/onboardingTrackingService';
import {
  calculateOnboardingProgress,
  getDeadlineDisplay,
} from '../../utils/onboardingTrackingHelper';
import {
  getRoleConfig,
} from '../../utils/onboardingChecklistHelper';
import { OnboardingProgressBar } from './OnboardingProgressBar';
import { OnboardingTaskDetailModal } from './OnboardingTaskDetailModal';
import { useToast } from '../notifications/useToast';

export interface OnboardingTrackingBoardProps {
  initialCandidateId?: string;
  initialRecord?: CandidateOnboardingRecord;
  onProgressUpdated?: (record: CandidateOnboardingRecord) => void;
  onSelectCandidate?: (candidateId: string) => void;
}

export const OnboardingTrackingBoard: React.FC<OnboardingTrackingBoardProps> = ({
  initialCandidateId = 'cand-final-001',
  initialRecord,
  onProgressUpdated,
  onSelectCandidate,
}) => {
  const { addToast } = useToast();

  // 1. Quản lý danh sách nhân sự mới & Hồ sơ đang chọn (AC 1)
  const [candidatesList, setCandidatesList] = useState<CandidateOnboardingRecord[]>(() =>
    initialRecord ? [initialRecord] : MOCK_CANDIDATE_ONBOARDING_RECORDS
  );
  const [selectedRecordId, setSelectedRecordId] = useState<string>(() => {
    if (initialRecord) return initialRecord.id;
    const found = MOCK_CANDIDATE_ONBOARDING_RECORDS.find(
      (c) => c.candidateId === initialCandidateId || c.id === initialCandidateId
    );
    return found ? found.id : MOCK_CANDIDATE_ONBOARDING_RECORDS[0].id;
  });

  const [currentRecord, setCurrentRecord] = useState<CandidateOnboardingRecord>(() => {
    if (initialRecord) return initialRecord;
    const found = MOCK_CANDIDATE_ONBOARDING_RECORDS.find(
      (c) => c.candidateId === initialCandidateId || c.id === initialCandidateId
    );
    return found ? found : MOCK_CANDIDATE_ONBOARDING_RECORDS[0];
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 2. Bộ lọc & Tìm kiếm (AC 2)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL'); // 'ALL' | 'COMPLETED' | 'PENDING' | 'OVERDUE'

  // Trạng thái mở/đóng từng phase
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    PRE_BOARDING: true,
    DAY_ONE: true,
    FIRST_WEEK: true,
    FIRST_MONTH: true,
  });

  // 3. Modal chi tiết nhiệm vụ (AC 3)
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<OnboardingCandidateTask | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Tải danh sách hồ sơ khi khởi tạo nếu chưa có
  const fetchRecords = useCallback(async () => {
    if (initialRecord) return;
    try {
      setIsLoading(true);
      const records = await onboardingTrackingService.listCandidateOnboardingRecords();
      setCandidatesList(records);
      const found = records.find(
        (r) => r.id === selectedRecordId || r.candidateId === initialCandidateId
      );
      if (found) {
        setCurrentRecord(found);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách hồ sơ onboarding:', err);
    } finally {
      setIsLoading(false);
    }
  }, [initialCandidateId, initialRecord, selectedRecordId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Xử lý đổi nhân sự mới cần theo dõi
  const handleSelectCandidate = (recordId: string) => {
    setSelectedRecordId(recordId);
    const target = candidatesList.find((c) => c.id === recordId);
    if (target) {
      setCurrentRecord(target);
      onSelectCandidate?.(target.candidateId || target.id);
    }
  };

  // 4. Toggle hoàn thành nhiệm vụ nhanh qua Checkbox (AC 2)
  const handleToggleTaskStatus = async (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    try {
      const updated = await onboardingTrackingService.toggleTaskStatus(
        currentRecord.id,
        taskId
      );

      setCurrentRecord(updated);
      setCandidatesList((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );

      // Tìm task vừa đổi
      const task = updated.tasks.find((t) => t.id === taskId);
      if (task) {
        if (task.status === 'COMPLETED') {
          addToast({
            type: 'success',
            message: `Đã hoàn thành nhiệm vụ: "${task.title}".`,
          });
        } else {
          addToast({
            type: 'info',
            message: `Đã mở lại nhiệm vụ: "${task.title}".`,
          });
        }
      }

      if (onProgressUpdated) {
        onProgressUpdated(updated);
      }
    } catch (err) {
      console.error('Lỗi khi chuyển trạng thái nhiệm vụ:', err);
      addToast({
        type: 'error',
        message: 'Không thể cập nhật trạng thái nhiệm vụ. Vui lòng thử lại.',
      });
    }
  };

  // Cập nhật trạng thái cụ thể từ modal chi tiết (AC 3)
  const handleUpdateStatusFromDetail = async (taskId: string, newStatus: OnboardingTaskStatus) => {
    try {
      const updated = await onboardingTrackingService.toggleTaskStatus(
        currentRecord.id,
        taskId,
        newStatus
      );
      setCurrentRecord(updated);
      setCandidatesList((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );

      const task = updated.tasks.find((t) => t.id === taskId);
      if (task) {
        setSelectedTaskForDetail(task);
      }

      addToast({
        type: 'success',
        message: `Đã cập nhật trạng thái nhiệm vụ thành công.`,
      });

      if (onProgressUpdated) {
        onProgressUpdated(updated);
      }
    } catch {
      addToast({
        type: 'error',
        message: 'Lỗi cập nhật trạng thái.',
      });
    }
  };

  // Lưu ghi chú nội bộ từ modal chi tiết (AC 3)
  const handleSaveNotesFromDetail = async (taskId: string, notes: string) => {
    try {
      const updated = await onboardingTrackingService.updateTaskDetails(
        currentRecord.id,
        taskId,
        { notes }
      );
      setCurrentRecord(updated);
      setCandidatesList((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );

      const task = updated.tasks.find((t) => t.id === taskId);
      if (task) {
        setSelectedTaskForDetail(task);
      }

      addToast({
        type: 'success',
        message: 'Đã lưu ghi chú nhiệm vụ.',
      });
    } catch {
      addToast({
        type: 'error',
        message: 'Không thể lưu ghi chú.',
      });
    }
  };

  // Mở modal chi tiết
  const handleOpenTaskDetail = (task: OnboardingCandidateTask) => {
    setSelectedTaskForDetail(task);
    setIsDetailModalOpen(true);
  };

  // 5. Tính toán tiến độ hoàn thành % tổng quan (AC 1)
  const progressSummary = useMemo(() => {
    return calculateOnboardingProgress(currentRecord.tasks);
  }, [currentRecord.tasks]);

  // Lọc nhiệm vụ theo search, phase, status (AC 2)
  const filteredTasks = useMemo(() => {
    return currentRecord.tasks.filter((task) => {
      // 1. Tìm kiếm
      const matchesSearch =
        searchQuery.trim() === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assigneeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.category && task.category.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Lọc theo Phase
      const matchesPhase = selectedPhaseFilter === 'ALL' || task.phase === selectedPhaseFilter;

      // 3. Lọc theo Status
      let matchesStatus = true;
      if (selectedStatusFilter === 'COMPLETED') {
        matchesStatus = task.status === 'COMPLETED';
      } else if (selectedStatusFilter === 'PENDING') {
        matchesStatus = task.status !== 'COMPLETED';
      } else if (selectedStatusFilter === 'OVERDUE') {
        const deadlineInfo = getDeadlineDisplay(task.deadline, task.status === 'COMPLETED');
        matchesStatus = deadlineInfo.isOverdue;
      }

      return matchesSearch && matchesPhase && matchesStatus;
    });
  }, [currentRecord.tasks, searchQuery, selectedPhaseFilter, selectedStatusFilter]);

  // Nhóm nhiệm vụ theo giai đoạn (AC 2)
  const tasksGroupedByPhase = useMemo(() => {
    const groups: Record<OnboardingTaskPhase, OnboardingCandidateTask[]> = {
      PRE_BOARDING: [],
      DAY_ONE: [],
      FIRST_WEEK: [],
      FIRST_MONTH: [],
    };

    filteredTasks.forEach((task) => {
      if (groups[task.phase]) {
        groups[task.phase].push(task);
      }
    });

    return groups;
  }, [filteredTasks]);

  const togglePhaseExpand = (phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  if (isLoading) {
    return (
      <div
        data-testid="onboarding-tracking-loading"
        className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center"
      >
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="mt-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Đang tải bảng theo dõi tiến độ tiếp nhận nhân viên mới...
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="onboarding-tracking-board"
      className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6"
    >
      {/* 1. Header: Thông tin nhân sự mới & Bộ chọn chuyển đổi hồ sơ */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          {/* Avatar nhân sự */}
          <div className="relative shrink-0">
            {currentRecord.candidateAvatar ? (
              <img
                src={currentRecord.candidateAvatar}
                alt={currentRecord.candidateName}
                className="h-16 w-16 rounded-2xl object-cover border-2 border-indigo-100 dark:border-indigo-900/40 shadow-xs"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-xl shadow-xs">
                {currentRecord.candidateName.charAt(0)}
              </div>
            )}
            <span
              className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center ${
                progressSummary.percentage === 100
                  ? 'bg-emerald-500 text-white'
                  : 'bg-indigo-500 text-white'
              }`}
              title={`Tiến độ ${progressSummary.percentage}%`}
            >
              {progressSummary.percentage === 100 ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Sparkles className="h-2.5 w-2.5" />
              )}
            </span>
          </div>

          {/* Chi tiết nhân sự */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                data-testid="text-candidate-name"
                className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white"
              >
                {currentRecord.candidateName}
              </h1>
              <span
                data-testid="text-candidate-code"
                className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              >
                {currentRecord.candidateCode}
              </span>
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                Nhận việc (Onboarding)
              </span>
            </div>

            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {currentRecord.jobTitle} • {currentRecord.departmentName}
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap pt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                <span>Ngày gia nhập: <strong>{new Date(currentRecord.startDate).toLocaleDateString('vi-VN')}</strong></span>
              </span>

              {currentRecord.buddyName && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-purple-500" />
                  <span>Buddy: <strong>{currentRecord.buddyName}</strong></span>
                </span>
              )}

              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-cyan-500" />
                <span>Quản lý: <strong>{currentRecord.managerName}</strong></span>
              </span>

              {currentRecord.hrInCharge && (
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>HR phụ trách: <strong>{currentRecord.hrInCharge}</strong></span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bộ chọn hồ sơ nhân sự (nếu có nhiều người mới) */}
        {candidatesList.length > 1 && (
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Chuyển nhân sự:
            </label>
            <select
              data-testid="select-candidate-record"
              value={selectedRecordId}
              onChange={(e) => handleSelectCandidate(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white py-1.5 px-3 text-xs text-gray-900 focus:border-indigo-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {candidatesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.candidateName} ({c.jobTitle})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Thanh tiến trình & Chỉ số hoàn thành (Progress Overview Card - AC 1) */}
      <OnboardingProgressBar summary={progressSummary} />

      {/* 3. Toolbar tìm kiếm & Lọc trạng thái (AC 2) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
        {/* Tìm kiếm */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            data-testid="input-search-tasks"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên việc, người phụ trách..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-1.5 pl-9 pr-3 text-xs text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Bộ lọc trạng thái & Giai đoạn */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Filter className="h-3.5 w-3.5" />
            <span>Lọc:</span>
          </div>

          {/* Lọc theo Giai đoạn */}
          <select
            data-testid="select-phase-filter"
            value={selectedPhaseFilter}
            onChange={(e) => setSelectedPhaseFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white py-1.5 px-2.5 text-xs text-gray-700 focus:border-indigo-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="ALL">Tất cả giai đoạn</option>
            {ONBOARDING_PHASES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.shortLabel} ({p.label})
              </option>
            ))}
          </select>

          {/* Lọc theo Trạng thái hoàn thành */}
          <select
            data-testid="select-status-filter"
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white py-1.5 px-2.5 text-xs text-gray-700 focus:border-indigo-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Cần làm ({progressSummary.totalTasks - progressSummary.completedTasks})</option>
            <option value="COMPLETED">Đã xong ({progressSummary.completedTasks})</option>
            <option value="OVERDUE">Quá hạn ({progressSummary.overdueTasks})</option>
          </select>
        </div>
      </div>

      {/* 4. Danh sách nhiệm vụ phân nhóm theo giai đoạn (Task Grouping List - AC 2) */}
      <div data-testid="onboarding-task-groups-container" className="space-y-4">
        {ONBOARDING_PHASES.map((phase) => {
          const phaseTasks = tasksGroupedByPhase[phase.id] || [];
          if (selectedPhaseFilter !== 'ALL' && selectedPhaseFilter !== phase.id) {
            return null;
          }

          const isExpanded = expandedPhases[phase.id] ?? true;
          const completedCount = phaseTasks.filter((t) => t.status === 'COMPLETED').length;
          const phaseTotal = phaseTasks.length;

          return (
            <div
              key={phase.id}
              data-testid={`phase-card-group-${phase.id}`}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden"
            >
              {/* Phase Header */}
              <div
                onClick={() => togglePhaseExpand(phase.id)}
                className={`flex items-center justify-between p-4 cursor-pointer border-l-4 ${phase.borderClass} hover:bg-gray-50/60 dark:hover:bg-gray-850/60 transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${phase.badgeClass}`}>
                    {phase.shortLabel}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span>{phase.id === 'PRE_BOARDING' ? 'Trước khi đi làm (Pre-boarding)' : phase.label}</span>
                      <span className="text-xs font-semibold text-gray-400">
                        ({completedCount}/{phaseTotal} việc)
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                      {phase.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {phaseTotal > 0 && completedCount === phaseTotal && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Hoàn tất giai đoạn</span>
                    </span>
                  )}

                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Task Items in this phase (AC 2) */}
              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                  {phaseTasks.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-400 italic">
                      Không có nhiệm vụ nào phù hợp với bộ lọc trong giai đoạn này.
                    </div>
                  ) : (
                    phaseTasks.map((task) => (
                      <TaskRowItem
                        key={task.id}
                        task={task}
                        onToggleComplete={(e) => handleToggleTaskStatus(task.id, e)}
                        onClickDetail={() => handleOpenTaskDetail(task)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Xem chi tiết nhiệm vụ & Tệp đính kèm (AC 3) */}
      <OnboardingTaskDetailModal
        isOpen={isDetailModalOpen}
        task={selectedTaskForDetail}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTaskForDetail(null);
        }}
        onUpdateStatus={handleUpdateStatusFromDetail}
        onSaveNotes={handleSaveNotesFromDetail}
      />
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: TaskRowItem (Dòng nhiệm vụ trong phase - AC 2)
// ==========================================
interface TaskRowItemProps {
  task: OnboardingCandidateTask;
  onToggleComplete: (e: React.MouseEvent) => void;
  onClickDetail: () => void;
}

const TaskRowItem: React.FC<TaskRowItemProps> = ({
  task,
  onToggleComplete,
  onClickDetail,
}) => {
  const isCompleted = task.status === 'COMPLETED';
  const roleConfig = getRoleConfig(task.responsibleRole);
  const deadlineInfo = getDeadlineDisplay(task.deadline, isCompleted);

  return (
    <div
      data-testid={`task-row-item-${task.id}`}
      onClick={onClickDetail}
      className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer transition-colors ${
        isCompleted
          ? 'bg-gray-50/50 hover:bg-gray-100/60 dark:bg-gray-900/40 dark:hover:bg-gray-850/60 opacity-80'
          : deadlineInfo.isOverdue
          ? 'bg-rose-50/30 hover:bg-rose-50/60 dark:bg-rose-950/20'
          : 'bg-white hover:bg-gray-50/70 dark:bg-gray-900 dark:hover:bg-gray-850/70'
      }`}
    >
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        {/* Checkbox đánh dấu hoàn thành (AC 2) */}
        <div className="pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            data-testid={`checkbox-task-complete-${task.id}`}
            checked={isCompleted}
            onChange={() => {
              // Synthetic event
            }}
            onClick={onToggleComplete}
            className="h-5 w-5 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer transition-transform active:scale-90"
            aria-label={`Đánh dấu hoàn thành ${task.title}`}
          />
        </div>

        {/* Thông tin nhiệm vụ */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-bold transition-all ${
                isCompleted
                  ? 'text-gray-400 line-through'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {task.title}
            </span>

            {task.isRequired && (
              <span className="inline-flex items-center rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300">
                Bắt buộc
              </span>
            )}

            {task.category && (
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {task.category}
              </span>
            )}

            {task.attachments && task.attachments.length > 0 && (
              <span
                data-testid={`badge-attachment-count-${task.id}`}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
              >
                <Paperclip className="h-3 w-3" />
                <span>{task.attachments.length} tệp</span>
              </span>
            )}
          </div>

          {task.description && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
              {task.description}
            </p>
          )}

          {/* Badges: Người chịu trách nhiệm hỗ trợ & Hạn chót (AC 2) */}
          <div className="mt-2 flex items-center gap-2.5 flex-wrap text-xs">
            {/* Người chịu trách nhiệm hỗ trợ (Assignee) */}
            <span
              data-testid={`badge-assignee-${task.id}`}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md"
            >
              <User className="h-3 w-3 text-indigo-500" />
              <span>Hỗ trợ: {task.assigneeName}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] border ${roleConfig.badgeClass}`}>
                {roleConfig.label}
              </span>
            </span>

            {/* Hạn chót (Deadline) kèm cảnh báo màu đỏ nếu trễ hạn (AC 2) */}
            <span
              data-testid={`badge-deadline-${task.id}`}
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border ${deadlineInfo.badgeClass}`}
            >
              {deadlineInfo.isOverdue && !isCompleted ? (
                <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0" />
              ) : (
                <Clock className="h-3 w-3 shrink-0" />
              )}
              <span>Hạn: {deadlineInfo.formattedDate} ({deadlineInfo.badgeText})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action: Click xem chi tiết (AC 3) */}
      <div className="shrink-0 self-end sm:self-center">
        <button
          type="button"
          data-testid={`btn-view-detail-${task.id}`}
          onClick={onClickDetail}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 hover:underline cursor-pointer"
        >
          Chi tiết →
        </button>
      </div>
    </div>
  );
};

export default OnboardingTrackingBoard;
