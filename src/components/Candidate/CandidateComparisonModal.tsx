import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { CandidateComparisonMatrix } from './CandidateComparisonMatrix';
import { candidateComparisonService } from '../../services/candidateComparisonService';
import type { ComparisonCandidate, HiringDecisionStatus } from '../../types/candidateComparison';

export interface CandidateComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateIds?: string[];
  jobId?: string;
  onDecisionSaved?: (candidateId: string, status: HiringDecisionStatus) => void;
}

export const CandidateComparisonModal: React.FC<CandidateComparisonModalProps> = ({
  isOpen,
  onClose,
  candidateIds,
  jobId,
  onDecisionSaved,
}) => {
  const [candidates, setCandidates] = useState<ComparisonCandidate[]>([]);
  const [allCandidates, setAllCandidates] = useState<ComparisonCandidate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const fullList = await candidateComparisonService.getFinalRoundCandidates(jobId);
        if (!isMounted) return;

        setAllCandidates(fullList);

        // Nếu có candidateIds truyền vào, lọc theo danh sách ID
        if (candidateIds && candidateIds.length > 0) {
          const selected = fullList.filter((c) => candidateIds.includes(c.id));
          if (selected.length > 0) {
            setCandidates(selected);
          } else {
            // Nếu không tìm thấy theo ID (ví dụ ID ứng viên chung chưa map), lấy 3 ứng viên đầu
            setCandidates(fullList.slice(0, 3));
          }
        } else {
          // Mặc định chọn 3 ứng viên đầu tiên để so sánh
          setCandidates(fullList.slice(0, 3));
        }
      } catch {
        if (isMounted) {
          const fallback = candidateComparisonService.getStoredCandidates();
          setAllCandidates(fallback);
          setCandidates(fallback.slice(0, 3));
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
  }, [isOpen, candidateIds, jobId]);

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
              Đang tải dữ liệu ma trận so sánh ứng viên vòng cuối...
            </p>
          </div>
        ) : (
          <CandidateComparisonMatrix
            candidates={candidates}
            allAvailableCandidates={allCandidates}
            onDecisionChange={handleDecisionChange}
            onClose={onClose}
            isModal={true}
          />
        )}
      </div>
    </div>
  );
};

export default CandidateComparisonModal;
