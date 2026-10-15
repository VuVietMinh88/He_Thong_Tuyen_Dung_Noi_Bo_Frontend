import React, { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Loader2,
  ChevronDown,
  CheckSquare,
  ListFilter,
  FileText,
} from 'lucide-react';
import type {
  CandidateProfile,
  CandidateFilterCriteria,
  CandidateExportResult,
  CandidateExportScope,
} from '../../types/candidate';
import { candidateService } from '../../services/candidateService';
import { toast, ToastContext } from '../notifications';

export interface CandidateExportExcelButtonProps {
  /**
   * Danh sách ứng viên theo kết quả lọc/tìm kiếm hiện tại
   */
  candidates: CandidateProfile[];
  /**
   * Danh sách ID của các ứng viên đang được đánh dấu chọn qua checkbox
   */
  selectedCandidateIds: string[];
  /**
   * Tiêu chí lọc hiện tại nếu cần gửi lên backend
   */
  filterCriteria?: CandidateFilterCriteria;
  /**
   * Tên file tùy chỉnh nếu có
   */
  customFilename?: string;
  /**
   * Callback khi xuất file thành công
   */
  onExportSuccess?: (result: CandidateExportResult) => void;
  /**
   * Callback khi xuất file thất bại
   */
  onExportError?: (error: Error) => void;
  /**
   * Lớp CSS bổ sung cho container nút
   */
  className?: string;
}

export const CandidateExportExcelButton: React.FC<CandidateExportExcelButtonProps> = ({
  candidates,
  selectedCandidateIds,
  filterCriteria,
  customFilename,
  onExportSuccess,
  onExportError,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportingScope, setExportingScope] = useState<CandidateExportScope | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const toastContext = React.useContext(ToastContext);

  const notify = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    if (toastContext?.notify) {
      toastContext.notify(message, type);
    } else {
      toast[type](message);
    }
  };

  const selectedCount = selectedCandidateIds.length;
  const filteredCount = candidates.length;

  // Đóng dropdown khi nhấp chuột ra ngoài hoặc nhấn phím ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleExecuteExport = async (
    scope: CandidateExportScope,
    format: 'xlsx' | 'csv' = 'xlsx'
  ) => {
    setIsOpen(false);
    setIsExporting(true);
    setExportingScope(scope);

    try {
      const result = await candidateService.exportCandidates(candidates, {
        scope,
        candidateIds: selectedCandidateIds,
        filterCriteria,
        format,
        customFilename,
      });

      notify(
        `Xuất thành công ${result.count} ứng viên ra tệp "${result.filename}"`,
        'success'
      );

      if (onExportSuccess) {
        onExportSuccess(result);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Có lỗi không xác định xảy ra khi xuất file.';
      notify(`Xuất tệp thất bại: ${errorMessage}`, 'error');

      if (onExportError) {
        onExportError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      setIsExporting(false);
      setExportingScope(null);
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Nút chính kích hoạt Menu xuất Excel */}
      <button
        type="button"
        data-testid="candidate-export-excel-btn"
        id="candidate-export-excel-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isExporting}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Xuất dữ liệu danh sách ứng viên ra tệp Excel (.xlsx)"
        className={`inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-700 shadow-2xs transition-all hover:bg-emerald-50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-800 dark:bg-gray-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40`}
      >
        {isExporting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
            <span>
              {exportingScope === 'SELECTED_ONLY'
                ? `Đang xuất ${selectedCount} ứng viên...`
                : 'Đang xuất file Excel...'}
            </span>
          </>
        ) : (
          <>
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Xuất Excel</span>
            <ChevronDown
              className={`h-3 w-3 text-emerald-600 transition-transform duration-150 dark:text-emerald-400 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu Tùy chọn xuất file */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="candidate-export-excel-btn"
          data-testid="export-excel-dropdown-menu"
          className="absolute right-0 z-50 mt-1.5 w-76 origin-top-right rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:ring-white/10"
        >
          {/* Tiêu đề nhóm */}
          <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-700/60">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">
              Tùy chọn xuất danh sách ứng viên
            </p>
          </div>

          <div className="space-y-1 py-1">
            {/* Tùy chọn 1: Xuất tất cả theo bộ lọc hiện tại */}
            <button
              type="button"
              role="menuitem"
              data-testid="export-all-filtered-option"
              onClick={() => handleExecuteExport('ALL_FILTERED', 'xlsx')}
              disabled={filteredCount === 0 || isExporting}
              className="group flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-emerald-50/80 focus:bg-emerald-50/80 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-emerald-950/40 dark:focus:bg-emerald-950/40"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                <ListFilter className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    Xuất tất cả theo bộ lọc
                  </span>
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200">
                    {filteredCount} hồ sơ
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                  {filteredCount > 0
                    ? `Bao gồm toàn bộ kết quả lọc và tìm kiếm hiện tại`
                    : 'Không có dữ liệu phù hợp với bộ lọc'}
                </p>
              </div>
            </button>

            {/* Tùy chọn 2: Xuất X ứng viên đã chọn */}
            <button
              type="button"
              role="menuitem"
              data-testid="export-selected-option"
              onClick={() => handleExecuteExport('SELECTED_ONLY', 'xlsx')}
              disabled={selectedCount === 0 || isExporting}
              className="group flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-indigo-50/80 focus:bg-indigo-50/80 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-indigo-950/40 dark:focus:bg-indigo-950/40"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                <CheckSquare className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    Xuất {selectedCount > 0 ? selectedCount : ''} ứng viên đã chọn
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      selectedCount > 0
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/70 dark:text-indigo-200'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {selectedCount} đã chọn
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                  {selectedCount > 0
                    ? `Chỉ xuất dữ liệu của ${selectedCount} hồ sơ được đánh dấu tích`
                    : 'Vui lòng tích chọn ít nhất 1 ứng viên trong bảng'}
                </p>
              </div>
            </button>
          </div>

          {/* Footer định dạng xuất CSV thay thế */}
          <div className="mt-1 border-t border-gray-100 pt-1 dark:border-gray-700/60">
            <button
              type="button"
              role="menuitem"
              data-testid="export-csv-option"
              onClick={() =>
                handleExecuteExport(
                  selectedCount > 0 ? 'SELECTED_ONLY' : 'ALL_FILTERED',
                  'csv'
                )
              }
              disabled={filteredCount === 0 || isExporting}
              className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-[11px] font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
            >
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-gray-400" />
                Xuất định dạng CSV (.csv, UTF-8)
              </span>
              <Download className="h-3 w-3 text-gray-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateExportExcelButton;
