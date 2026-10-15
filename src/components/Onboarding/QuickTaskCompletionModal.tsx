import React, { useState } from 'react';
import { CheckCircle2, X, MessageSquare, Sparkles } from 'lucide-react';
import type { OnboardingCandidateTask } from '../../types/onboardingChecklist';

export interface QuickTaskCompletionModalProps {
  isOpen: boolean;
  task: OnboardingCandidateTask | null;
  onClose: () => void;
  onConfirm: (taskId: string, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

const QUICK_NOTE_SUGGESTIONS = [
  'Đã bàn giao laptop Dell Latitude mã số LT-042',
  'Đã hoàn tất ký biên bản bàn giao và lưu hồ sơ',
  'Đã cấp tài khoản Google Workspace và GitLab',
  'Đã hướng dẫn quy trình và xác nhận thông hiểu nội quy',
];

export const QuickTaskCompletionModal: React.FC<QuickTaskCompletionModalProps> = ({
  isOpen,
  task,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [notes, setNotes] = useState<string>('');

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(task.id, notes.trim() || undefined);
    setNotes('');
  };

  const handleSkipNotes = async () => {
    await onConfirm(task.id, undefined);
    setNotes('');
  };

  return (
    <div
      data-testid="quick-task-completion-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Xác nhận hoàn thành nhiệm vụ
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Thêm ghi chú thực tế hoặc minh chứng hoàn tất (Tùy chọn)
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="btn-close-quick-completion"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
              Đầu việc:
            </span>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-xs font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
              {task.title}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
              <span>Ghi chú thực tế khi bàn giao / hoàn thành:</span>
            </label>
            <textarea
              rows={3}
              data-testid="input-quick-completion-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Đã bàn giao laptop Dell Latitude mã số LT-042 và hướng dẫn đăng nhập lần đầu..."
              className="w-full rounded-xl border border-gray-300 bg-white p-3 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Gợi ý ghi chú nhanh */}
          <div>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1.5">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Gợi ý mẫu ghi chú nhanh:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_NOTE_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setNotes(suggestion)}
                  className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 transition-colors cursor-pointer text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              data-testid="btn-skip-notes"
              onClick={handleSkipNotes}
              disabled={isLoading}
              className="rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
            >
              Hoàn thành không cần ghi chú
            </button>

            <button
              type="submit"
              data-testid="btn-confirm-completion"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isLoading ? 'Đang lưu...' : 'Lưu & Hoàn thành'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickTaskCompletionModal;
