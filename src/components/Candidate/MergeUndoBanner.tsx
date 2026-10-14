import React, { useState, useEffect } from 'react';
import { RotateCcw, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { MergeHistoryRecord } from '../../types/duplicateCandidate';
import { duplicateCandidateService } from '../../services/duplicateCandidateService';

interface MergeUndoBannerProps {
  mergeRecord: MergeHistoryRecord;
  onUndoSuccess: () => void;
  className?: string;
}

export const MergeUndoBanner: React.FC<MergeUndoBannerProps> = ({
  mergeRecord,
  onUndoSuccess,
  className = '',
}) => {
  const [remainingText, setRemainingText] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Đếm ngược thời gian hoàn tác 24 giờ
  useEffect(() => {
    const updateCountdown = () => {
      const { text, isExpired: expired } = duplicateCandidateService.calculateRemainingTime(
        mergeRecord.expiresAt
      );
      setRemainingText(text);
      setIsExpired(expired);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Cập nhật mỗi phút
    return () => clearInterval(interval);
  }, [mergeRecord.expiresAt]);

  const handleUndo = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await duplicateCandidateService.undoMerge(mergeRecord.id);
      setIsConfirming(false);
      onUndoSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể hoàn tác gộp hồ sơ lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMergedTimeVN = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  if (isExpired || !mergeRecord.canUndo) {
    return null;
  }

  return (
    <>
      <div
        className={`rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4 sm:p-5 text-indigo-950 shadow-xs ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 shadow-2xs">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-200/80 px-2 py-0.5 text-[11px] font-bold text-indigo-900 uppercase">
                  Đã gộp hồ sơ thành công
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                  <Clock className="h-3 w-3" />
                  Thời hạn hoàn tác: Còn {remainingText}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-indigo-900/90 leading-relaxed">
                Hồ sơ đã được hợp nhất từ ứng viên{' '}
                <strong>{mergeRecord.originalDuplicate.fullName}</strong> vào lúc{' '}
                {formatMergedTimeVN(mergeRecord.mergedAt)}. Toàn bộ lịch sử các đợt ứng tuyển, CV, Tags và Notes đã được bảo toàn.
              </p>
            </div>
          </div>

          <div className="self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => setIsConfirming(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-white px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 active:scale-98 transition shadow-2xs cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Hoàn tác gộp (Undo)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal xác nhận hoàn tác */}
      {isConfirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận hoàn tác gộp hồ sơ?</h3>
                <p className="text-xs text-slate-500">Khôi phục trạng thái hai hồ sơ ban đầu</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn hoàn tác gộp hồ sơ này? Hệ thống sẽ tách lại thành 2 hồ sơ độc lập:{' '}
              <strong>{mergeRecord.originalPrimary.fullName}</strong> và{' '}
              <strong>{mergeRecord.originalDuplicate.fullName}</strong> đúng như thời điểm trước khi gộp.
            </p>

            {error && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">{error}</p>}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleUndo}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Xác nhận hoàn tác
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MergeUndoBanner;

