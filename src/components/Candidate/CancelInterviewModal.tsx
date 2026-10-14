import { useState, type FormEvent } from 'react';
import { AlertTriangle, Bell, CalendarX2, X } from 'lucide-react';
import type { InterviewSchedulePayload } from '../../types/interview';

export interface CancelInterviewRequest {
  reason: string;
  notifyAttendees: boolean;
}

export interface CancelInterviewModalProps {
  isOpen: boolean;
  interview: InterviewSchedulePayload;
  onClose: () => void;
  onSubmit: (request: CancelInterviewRequest) => void | Promise<void>;
}

export default function CancelInterviewModal({
  isOpen,
  interview,
  onClose,
  onSubmit,
}: CancelInterviewModalProps) {
  const [reason, setReason] = useState('');
  const [notifyAttendees, setNotifyAttendees] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!reason.trim()) {
      setError('Vui lòng nhập lý do hủy lịch phỏng vấn.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ reason: reason.trim(), notifyAttendees });
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Không thể hủy lịch phỏng vấn. Vui lòng thử lại.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-interview-title"
        className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-rose-700">
              <CalendarX2 size={17} aria-hidden="true" />
              {interview.candidateName} · {interview.roundName}
            </span>
            <h2 id="cancel-interview-title" className="mt-2 text-2xl font-bold text-slate-900">
              Hủy lịch phỏng vấn?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng hộp thoại"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="mb-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <p>
            Lịch phỏng vấn với <strong>{interview.candidateName}</strong> sẽ được hủy. Hãy nhập lý
            do để ứng viên và hội đồng nắm được thông tin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label htmlFor="cancel-interview-reason" className="block text-sm font-medium text-slate-700">
            Lý do hủy lịch <span className="text-rose-600">*</span>
            <textarea
              id="cancel-interview-reason"
              required
              rows={4}
              maxLength={1000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ví dụ: Vị trí tuyển dụng tạm dừng hoặc người phỏng vấn bận đột xuất..."
              className="mt-2 block w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-base outline-none placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
            />
            <span className="mt-1 block text-right text-xs font-normal text-slate-500">
              {reason.length}/1000
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/60 p-4 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={notifyAttendees}
              onChange={(event) => setNotifyAttendees(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="flex gap-2">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" aria-hidden="true" />
              <span>
                <span className="block font-semibold text-slate-900">
                  Gửi email / thông báo hủy lịch
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">
                  Thông báo cho ứng viên và hội đồng phỏng vấn.
                </span>
              </span>
            </span>
          </label>

          {error && (
            <p role="alert" className="flex items-start gap-2 text-sm text-rose-700">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-12 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Giữ lịch
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-12 rounded-xl bg-rose-700 px-5 py-3 font-semibold text-white transition hover:bg-rose-800 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Đang hủy...' : 'Xác nhận hủy lịch'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
