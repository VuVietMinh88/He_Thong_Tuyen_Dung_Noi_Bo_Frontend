import React from 'react';
import { AlertTriangle, GitMerge, ArrowRight, Sparkles } from 'lucide-react';
import type { DuplicateCandidateComparison } from '../../types/duplicateCandidate';

interface DuplicateCandidateBannerProps {
  comparison: DuplicateCandidateComparison;
  onOpenCompare: () => void;
  className?: string;
}

export const DuplicateCandidateBanner: React.FC<DuplicateCandidateBannerProps> = ({
  comparison,
  onOpenCompare,
  className = '',
}) => {
  const { duplicateCandidate, matchReason, matchValue } = comparison;

  const reasonText =
    matchReason === 'BOTH'
      ? `Email và Số điện thoại (${matchValue})`
      : matchReason === 'EMAIL'
      ? `Email (${matchValue})`
      : `Số điện thoại (${matchValue})`;

  return (
    <div
      className={`rounded-2xl border border-amber-200 bg-amber-50/90 p-4 sm:p-5 text-amber-900 shadow-xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-2xs">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-200/80 px-2 py-0.5 text-[11px] font-bold text-amber-900 uppercase">
                <Sparkles className="h-3 w-3" />
                Cảnh báo trùng lặp hồ sơ
              </span>
              <span className="text-xs text-amber-800 font-medium">
                Khớp {reasonText}
              </span>
            </div>

            <p className="text-sm font-semibold text-amber-950">
              Phát hiện hồ sơ trùng khớp với ứng viên{' '}
              <strong className="underline underline-offset-2">
                {duplicateCandidate.fullName}
              </strong>{' '}
              ({duplicateCandidate.candidateCode}).
            </p>

            <p className="text-xs text-amber-800/90 leading-relaxed max-w-2xl">
              Hồ sơ này có thể cùng một ứng viên nộp qua các kênh hoặc thời điểm khác nhau.
              Bạn có thể so sánh hai hồ sơ cạnh nhau để chọn thông tin chuẩn nhất và gộp lại mà không làm mất lịch sử các lần ứng tuyển.
            </p>
          </div>
        </div>

        <div className="self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={onOpenCompare}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-98 transition cursor-pointer"
          >
            <GitMerge className="h-4 w-4" />
            <span>Xem & So sánh để gộp</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateCandidateBanner;

