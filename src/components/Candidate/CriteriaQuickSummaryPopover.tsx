import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Briefcase,
  GraduationCap,
  Wrench,
} from 'lucide-react';
import type { MandatoryCriterionItem, MandatoryCriterionKey } from '../../types/candidate';

export interface CriteriaQuickSummaryPopoverProps {
  criteriaList: MandatoryCriterionItem[];
  className?: string;
}

const getCriterionIcon = (key: MandatoryCriterionKey) => {
  switch (key) {
    case 'EXPERIENCE':
      return Briefcase;
    case 'EDUCATION':
      return GraduationCap;
    case 'SKILLS':
      return Wrench;
    default:
      return HelpCircle;
  }
};

const getCriterionShortLabel = (key: MandatoryCriterionKey): string => {
  switch (key) {
    case 'EXPERIENCE':
      return 'Kinh nghiệm';
    case 'EDUCATION':
      return 'Học vấn';
    case 'SKILLS':
      return 'Kỹ năng';
    default:
      return 'Tiêu chí';
  }
};

/**
 * Component hiển thị tóm tắt 3 tiêu chí bắt buộc kèm Popover chi tiết khi tương tác (AC 1)
 */
export const CriteriaQuickSummaryPopover: React.FC<CriteriaQuickSummaryPopoverProps> = ({
  criteriaList,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Đóng Popover khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (mouseEvent: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(mouseEvent.target as Node)
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

  const passedCount = criteriaList.filter((item) => item.isPassed).length;
  const totalCount = criteriaList.length;

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Cụm 3 mini badges tóm tắt tiêu chí */}
      <button
        type="button"
        onClick={() => setIsOpen((previousState) => !previousState)}
        aria-expanded={isOpen}
        aria-label={`Chi tiết 3 tiêu chí bắt buộc: ${passedCount}/${totalCount} đạt`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50/80 px-2 py-1 text-xs transition-colors hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750"
      >
        <div className="flex items-center gap-1">
          {criteriaList.map((criterionItem) => {
            const IconComponent = getCriterionIcon(criterionItem.criterionKey);
            const shortLabel = getCriterionShortLabel(criterionItem.criterionKey);

            return (
              <span
                key={criterionItem.id}
                title={`${shortLabel}: ${criterionItem.isPassed ? 'Đạt' : 'Không đạt'}`}
                className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  criterionItem.isPassed
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800'
                    : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800'
                }`}
              >
                <IconComponent className="h-2.5 w-2.5 shrink-0" />
                <span>{shortLabel}</span>
                {criterionItem.isPassed ? (
                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="h-2.5 w-2.5 text-rose-600 dark:text-rose-400" />
                )}
              </span>
            );
          })}
        </div>
      </button>

      {/* Popover chi tiết khi di chuột hoặc click vào */}
      {isOpen && (
        <div
          role="tooltip"
          className="absolute left-0 z-40 mt-1 w-80 rounded-xl border border-gray-200 bg-white p-3.5 shadow-xl ring-1 ring-black/5 transition-all dark:border-gray-700 dark:bg-gray-900 dark:ring-white/10"
        >
          <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
            <span className="text-xs font-bold text-gray-900 dark:text-white">
              Đối chiếu 3 tiêu chí bắt buộc
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                passedCount === totalCount
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
              }`}
            >
              Đạt {passedCount}/{totalCount}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {criteriaList.map((criterionItem) => {
              const IconComponent = getCriterionIcon(criterionItem.criterionKey);
              return (
                <div
                  key={criterionItem.id}
                  className="rounded-lg border border-gray-100 bg-gray-50/60 p-2 dark:border-gray-800 dark:bg-gray-850"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-gray-800 dark:text-gray-200">
                      <IconComponent className="h-3.5 w-3.5 text-indigo-500" />
                      <span>{criterionItem.criterionName}</span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        criterionItem.isPassed
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {criterionItem.isPassed ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          Đạt
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                          Không đạt
                        </>
                      )}
                    </span>
                  </div>

                  <div className="mt-1 space-y-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                    <div className="flex items-start gap-1">
                      <span className="font-medium text-gray-600 dark:text-gray-300">Yêu cầu:</span>
                      <span className="truncate">{criterionItem.jobRequirement}</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="font-medium text-gray-600 dark:text-gray-300">Ứng viên:</span>
                      <span className="truncate">{criterionItem.candidateValue}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2.5 border-t border-gray-100 pt-2 text-[10px] italic text-gray-400 dark:border-gray-800">
            Gợi ý thứ tự đọc hồ sơ, không tự động loại ứng viên.
          </div>
        </div>
      )}
    </div>
  );
};

export default CriteriaQuickSummaryPopover;
