import React, { useState, useEffect } from 'react';
import { X, BookmarkPlus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { CandidateCombinedFilterState } from '../../types/candidate';
import type { SavedFilterPreset } from '../../types/filterPreset';
import { filterPresetService } from '../../services/filterPresetService';
import {
  countActiveFilters,
  getActiveFilterBadges,
} from '../../utils/candidateFilterHelper';
import { toast } from '../notifications';

export interface SaveFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: CandidateCombinedFilterState;
  onSuccess: (newPreset: SavedFilterPreset) => void;
  jobOptions?: Array<{ id: string; title: string }>;
}

export const SaveFilterModal: React.FC<SaveFilterModalProps> = ({
  isOpen,
  onClose,
  currentFilters,
  onSuccess,
  jobOptions = [],
}) => {
  const [filterName, setFilterName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const activeCount = countActiveFilters(currentFilters);
  const activeBadges = getActiveFilterBadges(currentFilters, { jobOptions });

  useEffect(() => {
    if (isOpen) {
      setFilterName('');
      setDescription('');
      setErrorMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  // Nút Lưu chỉ kích hoạt khi có ít nhất 1 điều kiện lọc đang áp dụng và tên không rỗng (AC 1)
  const isSaveDisabled =
    activeCount === 0 || !filterName.trim() || isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = filterName.trim();

    if (!trimmedName) {
      setErrorMessage('Vui lòng nhập tên gợi nhớ cho bộ lọc.');
      return;
    }

    if (activeCount === 0) {
      setErrorMessage('Cần có ít nhất một điều kiện lọc đang kích hoạt để lưu.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const created = await filterPresetService.createSavedFilter({
        name: trimmedName,
        description: description.trim() || undefined,
        filters: currentFilters,
      });

      toast.success(`Đã lưu bộ lọc "${created.name}" thành công.`);
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Không thể lưu bộ lọc. Vui lòng thử lại.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-filter-modal-title"
      data-testid="save-filter-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <BookmarkPlus className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="save-filter-modal-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Lưu bộ lọc hiện tại
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lưu các điều kiện đang áp dụng thành mẫu để tái sử dụng nhanh chóng.
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="close-save-filter-modal-btn"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Đóng modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div
              data-testid="save-filter-error-alert"
              className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Ô nhập tên gợi nhớ cho bộ lọc (AC 1) */}
          <div>
            <label
              htmlFor="saved-filter-name-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Tên gợi nhớ bộ lọc <span className="text-rose-500">*</span>
            </label>
            <input
              id="saved-filter-name-input"
              data-testid="saved-filter-name-input"
              type="text"
              autoFocus
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="ví dụ: Lập trình viên React Senior Hà Nội, Fresher Tester..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>

          {/* Ô nhập mô tả (Tùy chọn) */}
          <div>
            <label
              htmlFor="saved-filter-desc-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Mô tả ngắn gọn (Tùy chọn)
            </label>
            <textarea
              id="saved-filter-desc-input"
              data-testid="saved-filter-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú mục đích tuyển dụng cho đợt tìm kiếm này..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>

          {/* Hộp tóm tắt các điều kiện lọc sẽ được lưu */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <span>Điều kiện lọc sẽ được lưu:</span>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                {activeCount} tiêu chí
              </span>
            </div>

            {activeCount === 0 ? (
              <div
                data-testid="no-active-filters-warning"
                className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 py-1"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Chưa có điều kiện lọc nào được áp dụng. Vui lòng chọn ít nhất 1
                  tiêu chí lọc trước khi lưu.
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {activeBadges.map((badge) => (
                  <span
                    key={badge.id}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border ${badge.colorClass}`}
                  >
                    <span>{badge.label}:</span>
                    <strong className="font-semibold">{badge.displayValue}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              data-testid="cancel-save-filter-btn"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750"
            >
              Hủy
            </button>
            <button
              type="submit"
              data-testid="submit-save-filter-btn"
              disabled={isSaveDisabled}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Lưu bộ lọc hiện tại</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveFilterModal;
