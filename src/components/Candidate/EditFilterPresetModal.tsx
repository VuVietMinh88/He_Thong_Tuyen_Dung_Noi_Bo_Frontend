import React, { useState, useEffect } from 'react';
import { X, Pencil, Loader2, AlertCircle, Check } from 'lucide-react';
import type { SavedFilterPreset } from '../../types/filterPreset';
import { filterPresetService } from '../../services/filterPresetService';
import { toast } from '../notifications';

export interface EditFilterPresetModalProps {
  preset: SavedFilterPreset | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPreset: SavedFilterPreset) => void;
}

export const EditFilterPresetModal: React.FC<EditFilterPresetModalProps> = ({
  preset,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [filterName, setFilterName] = useState<string>(() => preset?.name || '');
  const [description, setDescription] = useState<string>(
    () => preset?.description || ''
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (preset && isOpen) {
      setFilterName(preset.name);
      setDescription(preset.description || '');
      setErrorMessage('');
    }
  }, [preset, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !preset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = filterName.trim();
    if (!trimmedName) {
      setErrorMessage('Tên bộ lọc không được để trống.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const updated = await filterPresetService.updateSavedFilter(preset.id, {
        name: trimmedName,
        description: description.trim() || undefined,
      });

      toast.success(`Đã đổi tên bộ lọc thành "${updated.name}".`);
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Không thể cập nhật bộ lọc. Vui lòng thử lại.';
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
      aria-labelledby="edit-filter-modal-title"
      data-testid="edit-filter-preset-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Pencil className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="edit-filter-modal-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Đổi tên bộ lọc đã lưu
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cập nhật tên gợi nhớ hoặc ghi chú mô tả của bộ lọc.
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="close-edit-filter-modal-btn"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="edit-filter-name-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Tên bộ lọc <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-filter-name-input"
              data-testid="edit-filter-name-input"
              type="text"
              autoFocus
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>

          <div>
            <label
              htmlFor="edit-filter-desc-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Mô tả ngắn gọn
            </label>
            <textarea
              id="edit-filter-desc-input"
              data-testid="edit-filter-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              data-testid="cancel-edit-filter-btn"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750"
            >
              Hủy
            </button>
            <button
              type="submit"
              data-testid="submit-edit-filter-btn"
              disabled={!filterName.trim() || isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Cập nhật</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFilterPresetModal;
