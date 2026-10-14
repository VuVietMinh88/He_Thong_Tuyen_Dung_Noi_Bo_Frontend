import React, { useState, useEffect, useRef } from 'react';
import {
  Bookmark,
  BookmarkPlus,
  ChevronDown,
  Pencil,
  Trash2,
  RotateCcw,
  Sparkles,
  Loader2,
} from 'lucide-react';
import type { CandidateCombinedFilterState } from '../../types/candidate';
import type { SavedFilterPreset } from '../../types/filterPreset';
import { filterPresetService } from '../../services/filterPresetService';
import {
  countActiveFilters,
  getActiveFilterBadges,
} from '../../utils/candidateFilterHelper';
import { toast } from '../notifications';
import { SaveFilterModal } from './SaveFilterModal';
import { EditFilterPresetModal } from './EditFilterPresetModal';

export interface SavedFilterDropdownProps {
  currentFilters: CandidateCombinedFilterState;
  onSelectPreset: (preset: SavedFilterPreset) => void;
  jobOptions?: Array<{ id: string; title: string }>;
  className?: string;
}

export const SavedFilterDropdown: React.FC<SavedFilterDropdownProps> = ({
  currentFilters,
  onSelectPreset,
  jobOptions = [],
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [presets, setPresets] = useState<SavedFilterPreset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Quản lý Modal lưu mới & Modal đổi tên
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [editingPreset, setEditingPreset] = useState<SavedFilterPreset | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeCount = countActiveFilters(currentFilters);

  const loadPresets = async () => {
    setIsLoading(true);
    try {
      const data = await filterPresetService.getSavedFilters();
      setPresets(data);
    } catch {
      setPresets([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPresets();
  }, []);

  // Xử lý đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Chọn bộ lọc nhanh với 1 click (AC 2)
  const handleApplyPreset = (preset: SavedFilterPreset) => {
    onSelectPreset(preset);
    setIsOpen(false);
    toast.success(`Đã kích hoạt bộ lọc "${preset.name}".`);
  };

  // Xóa bộ lọc đã lưu (AC 3 & AC 4)
  const handleDeletePreset = async (
    e: React.MouseEvent,
    preset: SavedFilterPreset
  ) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa bộ lọc "${preset.name}" không?`
    );
    if (!confirmed) return;

    setDeletingId(preset.id);
    try {
      await filterPresetService.deleteSavedFilter(preset.id);
      setPresets((prev) => prev.filter((p) => p.id !== preset.id));
      toast.success(`Đã xóa bộ lọc "${preset.name}".`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Không thể xóa bộ lọc.';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // Mở modal đổi tên (AC 3)
  const handleOpenEditModal = (
    e: React.MouseEvent,
    preset: SavedFilterPreset
  ) => {
    e.stopPropagation();
    setEditingPreset(preset);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
      data-testid="saved-filter-dropdown-container"
    >
      {/* Nút trigger mở menu Saved Presets Dropdown */}
      <button
        type="button"
        id="saved-filters-dropdown-trigger"
        data-testid="saved-filters-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold shadow-xs transition-all ${
          isOpen
            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300'
            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750'
        }`}
      >
        <Bookmark className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        <span>Bộ lọc đã lưu</span>
        {presets.length > 0 && (
          <span
            data-testid="saved-filters-count-badge"
            className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-100 px-1.5 text-[11px] font-bold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200"
          >
            {presets.length}
          </span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {/* Menu dropdown popover (AC 2) */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="saved-filters-dropdown-trigger"
          data-testid="saved-filters-dropdown-menu"
          className="absolute right-0 sm:right-auto sm:left-0 z-40 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-850">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Bộ lọc cá nhân ({presets.length})
              </span>
            </div>
            <button
              type="button"
              onClick={loadPresets}
              disabled={isLoading}
              title="Tải lại danh sách bộ lọc"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
            >
              <RotateCcw
                className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          {/* Danh sách các bộ lọc đã lưu (AC 2) */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {isLoading && presets.length === 0 ? (
              <div className="flex items-center justify-center p-6 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600 mr-2" />
                Đang tải bộ lọc...
              </div>
            ) : presets.length === 0 ? (
              <div
                data-testid="saved-filters-empty-state"
                className="p-6 text-center text-xs text-slate-500 dark:text-slate-400"
              >
                <Bookmark className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Chưa có bộ lọc nào được lưu
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Hãy thiết lập điều kiện và bấm &ldquo;Lưu bộ lọc hiện tại&rdquo; bên dưới.
                </p>
              </div>
            ) : (
              presets.map((preset) => {
                const presetBadges = getActiveFilterBadges(preset.filters, {
                  jobOptions,
                });
                const conditionCount = countActiveFilters(preset.filters);

                return (
                  <div
                    key={preset.id}
                    data-testid={`saved-preset-item-${preset.id}`}
                    onClick={() => handleApplyPreset(preset)}
                    className="group flex items-start justify-between p-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400 truncate">
                          {preset.name}
                        </span>
                        <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {conditionCount} tiêu chí
                        </span>
                      </div>

                      {preset.description && (
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {preset.description}
                        </p>
                      )}

                      {/* Tóm tắt nhanh các tiêu chí */}
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {presetBadges.slice(0, 3).map((badge) => (
                          <span
                            key={badge.id}
                            className="inline-flex items-center rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {badge.label}: {badge.displayValue}
                          </span>
                        ))}
                        {presetBadges.length > 3 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{presetBadges.length - 3} nữa
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons: Sửa tên & Xóa (AC 3) */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                      <button
                        type="button"
                        data-testid={`edit-preset-btn-${preset.id}`}
                        onClick={(e) => handleOpenEditModal(e, preset)}
                        title="Đổi tên bộ lọc"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-amber-600 hover:shadow-2xs dark:hover:bg-slate-800 dark:hover:text-amber-400 transition-all"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        data-testid={`delete-preset-btn-${preset.id}`}
                        onClick={(e) => handleDeletePreset(e, preset)}
                        disabled={deletingId === preset.id}
                        title="Xóa bộ lọc"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600 hover:shadow-2xs dark:hover:bg-slate-800 dark:hover:text-rose-400 transition-all"
                      >
                        {deletingId === preset.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer: Nút mở Modal lưu bộ lọc hiện tại (AC 1) */}
          <div className="border-t border-slate-100 p-2.5 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-850">
            <button
              type="button"
              data-testid="open-save-filter-modal-btn"
              onClick={() => {
                setIsOpen(false);
                setIsSaveModalOpen(true);
              }}
              disabled={activeCount === 0}
              className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-2xs transition-all ${
                activeCount > 0
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
              }`}
            >
              <BookmarkPlus className="h-4 w-4" />
              <span>
                {activeCount > 0
                  ? `Lưu bộ lọc hiện tại (${activeCount} tiêu chí)`
                  : 'Lưu bộ lọc hiện tại (Chưa có tiêu chí)'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Lưu bộ lọc mới (AC 1) */}
      <SaveFilterModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        currentFilters={currentFilters}
        jobOptions={jobOptions}
        onSuccess={(newPreset) => {
          setPresets((prev) => [newPreset, ...prev]);
        }}
      />

      {/* Modal Đổi tên bộ lọc (AC 3) */}
      <EditFilterPresetModal
        isOpen={Boolean(editingPreset)}
        preset={editingPreset}
        onClose={() => setEditingPreset(null)}
        onSuccess={(updatedPreset) => {
          setPresets((prev) =>
            prev.map((p) => (p.id === updatedPreset.id ? updatedPreset : p))
          );
        }}
      />
    </div>
  );
};

export default SavedFilterDropdown;
