import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { CandidateComparisonMatrix } from './CandidateComparisonMatrix';
import { FinalRoundCandidateFilterPanel } from './FinalRoundCandidateFilterPanel';
import { candidateComparisonService } from '../../services/candidateComparisonService';
import { isCandidateFullyEvaluated } from '../../utils/candidateComparisonHelper';
import type {
  ComparisonCandidate,
  HiringDecisionStatus,
  CandidateEvaluationFilterStatus,
} from '../../types/candidateComparison';

export interface CandidateComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateIds?: string[];
  jobId?: string;
  initialFilterStatus?: CandidateEvaluationFilterStatus;
  initialViewMode?: 'FILTER' | 'MATRIX';
  onDecisionSaved?: (candidateId: string, status: HiringDecisionStatus) => void;
}

export const CandidateComparisonModal: React.FC<CandidateComparisonModalProps> = ({
  isOpen,
  onClose,
  candidateIds,
  jobId,
  initialFilterStatus = 'ALL',
  initialViewMode,
  onDecisionSaved,
}) => {
  const [viewMode, setViewMode] = useState<'FILTER' | 'MATRIX'>('FILTER');
  const [candidates, setCandidates] = useState<ComparisonCandidate[]>([]);
  const [allCandidates, setAllCandidates] = useState<ComparisonCandidate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const fullList = await candidateComparisonService.getFinalCandidatesWithEvaluations(
          jobId,
          'ALL'
        );
        if (!isMounted) return;

        setAllCandidates(fullList);

        // Xác định chế độ xem ban đầu:
        // Nếu có truyền initialViewMode thì ưu tiên.
        // Nếu có candidateIds >= 2 thì mở thẳng MATRIX, ngược lại mở bộ lọc FILTER
        if (initialViewMode) {
          setViewMode(initialViewMode);
        } else if (candidateIds && candidateIds.length >= 2) {
          setViewMode('MATRIX');
        } else {
          setViewMode('FILTER');
        }

        // Lọc danh sách ứng viên được chọn
        if (candidateIds && candidateIds.length > 0) {
          const selected = fullList.filter((c) => candidateIds.includes(c.id));
          if (selected.length > 0) {
            setCandidates(selected);
          } else {
            const valid = fullList.filter(isCandidateFullyEvaluated);
            setCandidates(valid.slice(0, 3));
          }
        } else {
          const valid = fullList.filter(isCandidateFullyEvaluated);
          setCandidates(valid.slice(0, 3));
        }
      } catch {
        if (isMounted) {
          const fallback = candidateComparisonService.getStoredCandidates();
          setAllCandidates(fallback);
          const valid = fallback.filter(isCandidateFullyEvaluated);
          setCandidates(valid.slice(0, 3));
          setViewMode(candidateIds && candidateIds.length >= 2 ? 'MATRIX' : 'FILTER');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, candidateIds, jobId, initialViewMode]);

  if (!isOpen) return null;

  const handleDecisionChange = async (
    candidateId: string,
    status: HiringDecisionStatus,
    note?: string
  ) => {
    try {
      await candidateComparisonService.updateHiringDecision(candidateId, status, note);
      if (onDecisionSaved) {
        onDecisionSaved(candidateId, status);
      }
    } catch (err) {
      console.error('Lỗi khi lưu quyết định tuyển dụng:', err);
    }
  };

  const handleOpenComparisonFromFilter = (selected: ComparisonCandidate[]) => {
    setCandidates(selected);
    setViewMode('MATRIX');
  };

  return (
    <div
      id="candidate-comparison-modal-backdrop"
      data-testid="candidate-comparison-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-7xl max-h-[96vh] flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 overflow-hidden border border-gray-200 dark:border-gray-800">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
            <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-300">
              Đang tải dữ liệu và trạng thái đánh giá ứng viên vòng cuối...
            </p>
          </div>
        ) : viewMode === 'FILTER' ? (
          <FinalRoundCandidateFilterPanel
            jobId={jobId}
            initialFilterStatus={initialFilterStatus}
            selectedCandidateIds={candidates.map((c) => c.id)}
            onOpenComparison={handleOpenComparisonFromFilter}
            onClose={onClose}
            isModal={true}
          />
        ) : (
          <CandidateComparisonMatrix
            candidates={candidates}
            allAvailableCandidates={allCandidates}
            onDecisionChange={handleDecisionChange}
            onBackToFilter={() => setViewMode('FILTER')}
            onClose={onClose}
            isModal={true}
          />
        )}
      </div>
    </div>
  );
};

export default CandidateComparisonModal;
