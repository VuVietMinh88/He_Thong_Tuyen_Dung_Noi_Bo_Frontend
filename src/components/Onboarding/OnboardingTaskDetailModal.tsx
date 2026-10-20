import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  User,
  FileText,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertTriangle,
  Send,
  Paperclip,
  ShieldAlert,
} from 'lucide-react';
import type {
  OnboardingCandidateTask,
  OnboardingTaskStatus,
} from '../../types/onboardingChecklist';
import {
  getPhaseConfig,
  getRoleConfig,
} from '../../utils/onboardingChecklistHelper';
import {
  getDeadlineDisplay,
} from '../../utils/onboardingTrackingHelper';

export interface OnboardingTaskDetailModalProps {
  isOpen: boolean;
  task: OnboardingCandidateTask | null;
  onClose: () => void;
  onUpdateStatus: (taskId: string, newStatus: OnboardingTaskStatus) => void;
  onSaveNotes?: (taskId: string, notes: string) => void;
}

export const OnboardingTaskDetailModal: React.FC<OnboardingTaskDetailModalProps> = ({
  isOpen,
  task,
  onClose,
  onUpdateStatus,
  onSaveNotes,
}) => {
  const [internalNotes, setInternalNotes] = useState<string>(task?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);

  useEffect(() => {
    setInternalNotes(task?.notes || '');
  }, [task]);

  if (!isOpen || !task) return null;

  const phaseConfig = getPhaseConfig(task.phase);
  const roleConfig = getRoleConfig(task.responsibleRole);
  const deadlineInfo = getDeadlineDisplay(task.deadline, task.status === 'COMPLETED');

  const handleSaveNotesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveNotes) {
      setIsSavingNotes(true);
      onSaveNotes(task.id, internalNotes.trim());
      setTimeout(() => setIsSavingNotes(false), 300);
    }
  };

  return (
    <div
      data-testid="onboarding-task-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-850/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${phaseConfig.badgeClass}`}>
                {phaseConfig.label}
              </span>
              {task.isRequired && (
                <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300">
                  <ShieldAlert className="h-3 w-3" />
                  <span>Bắt buộc hoàn thành</span>
                </span>
              )}
              {task.category && (
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {task.category}
                </span>
              )}
            </div>

            <h2 data-testid="task-detail-title" className="text-base font-bold text-gray-900 dark:text-white pt-1">
              {task.title}
            </h2>
          </div>

          <button
            type="button"
            data-testid="btn-close-task-detail"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200 cursor-pointer shrink-0"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* 1. Trạng thái & Chuyển đổi trạng thái nhanh */}
          <div className="rounded-xl p-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
                Trạng thái hiện tại:
              </span>
              <div className="flex items-center gap-2">
                <span
                  data-testid="task-detail-status-badge"
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 ${
                    task.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : task.status === 'IN_PROGRESS'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : deadlineInfo.isOverdue
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  {task.status === 'COMPLETED' && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {deadlineInfo.isOverdue && task.status !== 'COMPLETED' && (
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                  )}
                  <span>
                    {task.status === 'COMPLETED'
                      ? 'Đã hoàn thành'
                      : task.status === 'IN_PROGRESS'
                      ? 'Đang xử lý'
                      : deadlineInfo.isOverdue
                      ? 'Quá hạn'
                      : 'Chưa bắt đầu'}
                  </span>
                </span>

                {task.completedAt && (
                  <span className="text-[11px] text-gray-500">
                    Xong lúc: {new Date(task.completedAt).toLocaleDateString('vi-VN')} {task.completedBy && `bởi ${task.completedBy}`}
                  </span>
                )}
              </div>
            </div>

            {/* Nút đổi trạng thái */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                data-testid="btn-status-in-progress"
                onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS')}
                className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition-colors cursor-pointer ${
                  task.status === 'IN_PROGRESS'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50 dark:bg-gray-800 dark:border-blue-800'
                }`}
              >
                Đang xử lý
              </button>

              <button
                type="button"
                data-testid="btn-status-complete"
                onClick={() => onUpdateStatus(task.id, task.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED')}
                className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1 ${
                  task.status === 'COMPLETED'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-gray-800 dark:border-emerald-800'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{task.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}</span>
              </button>
            </div>
          </div>

          {/* 2. Thông tin Người chịu trách nhiệm & Hạn chót (AC 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Người hỗ trợ */}
            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-850">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-indigo-500" />
                <span>Người chịu trách nhiệm hỗ trợ (Assignee):</span>
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-bold text-gray-900 dark:text-white text-xs">
                  {task.assigneeName}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${roleConfig.badgeClass}`}>
                  {roleConfig.label}
                </span>
              </div>
            </div>

            {/* Hạn chót */}
            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-850">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                <span>Hạn chót hoàn thành (Deadline):</span>
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-bold text-gray-900 dark:text-white text-xs">
                  {deadlineInfo.formattedDate}
                </span>
                <span className={`px-2 py-0.5 rounded-md border text-[10px] ${deadlineInfo.badgeClass}`}>
                  {deadlineInfo.badgeText}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Mô tả hướng dẫn chi tiết (AC 3) */}
          <div>
            <span className="text-xs font-bold text-gray-900 dark:text-white block mb-1.5 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-indigo-500" />
              <span>Ghi chú hướng dẫn chi tiết</span>
            </span>
            <div className="rounded-xl bg-gray-50 p-3.5 text-gray-700 dark:bg-gray-800/80 dark:text-gray-300 leading-relaxed border border-gray-200 dark:border-gray-700">
              {task.description || 'Chưa có ghi chú hướng dẫn cho đầu việc này.'}
            </div>

            {task.actionUrl && (
              <div className="mt-2.5">
                <a
                  href={task.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Truy cập hệ thống thực hiện trực tiếp</span>
                </a>
              </div>
            )}
          </div>

          {/* 4. Tài liệu biểu mẫu đính kèm (AC 3) */}
          <div>
            <span className="text-xs font-bold text-gray-900 dark:text-white block mb-1.5 flex items-center gap-1.5">
              <Paperclip className="h-4 w-4 text-indigo-500" />
              <span>Tài liệu & Biểu mẫu đính kèm ({task.attachments?.length || 0})</span>
            </span>

            {task.attachments && task.attachments.length > 0 ? (
              <div data-testid="task-attachments-list" className="space-y-2">
                {task.attachments.map((file) => (
                  <div
                    key={file.id}
                    data-testid={`attachment-item-${file.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-850 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate block text-xs"
                        >
                          {file.fileName}
                        </a>
                        <span className="text-[11px] text-gray-400 block truncate">
                          {file.description || 'Tài liệu hướng dẫn tiếp nhận'} {file.fileSize && `• ${file.fileSize}`}
                        </span>
                      </div>
                    </div>

                    <a
                      href={file.url}
                      download
                      className="inline-flex items-center gap-1 p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700 cursor-pointer shrink-0"
                      title="Tải về"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">
                Không có tài liệu hoặc biểu mẫu đính kèm cho đầu việc này.
              </p>
            )}
          </div>

          {/* 5. Ghi chú cá nhân / Minh chứng hoàn thành */}
          <form onSubmit={handleSaveNotesSubmit} className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <label className="block text-xs font-bold text-gray-900 dark:text-white mb-1">
              Ghi chú phản hồi / Cập nhật tiến độ của nhân sự
            </label>
            <div className="space-y-2">
              <textarea
                rows={2}
                data-testid="textarea-task-notes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Nhập ghi chú hoặc link xác nhận đã hoàn thành nhiệm vụ này..."
                className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs text-gray-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  data-testid="btn-save-task-notes"
                  disabled={isSavingNotes}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
                >
                  <Send className="h-3 w-3" />
                  <span>{isSavingNotes ? 'Đang lưu...' : 'Lưu ghi chú'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTaskDetailModal;
