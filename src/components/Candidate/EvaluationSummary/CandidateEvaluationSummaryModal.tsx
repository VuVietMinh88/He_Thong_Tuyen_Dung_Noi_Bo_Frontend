import React from 'react';
import { X } from 'lucide-react';
import { CandidateEvaluationSummaryView } from './CandidateEvaluationSummaryView';
import type { FinalHiringDecisionRecord } from '../../../types/candidateEvaluationSummary';

export interface CandidateEvaluationSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId?: string;
  onDecisionUpdated?: (decision: FinalHiringDecisionRecord) => void;
}

export const CandidateEvaluationSummaryModal: React.FC<CandidateEvaluationSummaryModalProps> = ({
  isOpen,
  onClose,
  candidateId,
  onDecisionUpdated,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="candidate-evaluation-summary-modal-backdrop"
      data-testid="candidate-evaluation-summary-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-7xl max-h-[96vh] flex flex-col rounded-2xl bg-slate-50 shadow-2xl dark:bg-gray-950 overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="absolute right-4 top-4 z-30">
          <button
            type="button"
            data-testid="btn-close-eval-summary-modal"
            onClick={onClose}
            className="rounded-xl bg-white/80 p-2 text-gray-500 hover:bg-white hover:text-gray-800 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-750 shadow-md backdrop-blur-xs transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <CandidateEvaluationSummaryView
            candidateId={candidateId}
            onBack={onClose}
            onDecisionUpdated={onDecisionUpdated}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
};

export default CandidateEvaluationSummaryModal;
