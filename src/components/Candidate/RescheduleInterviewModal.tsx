import { useState, type FormEvent } from 'react';
import { AlertCircle, Bell, CalendarClock, MapPin, X } from 'lucide-react';
import { validateScheduleTime } from '../../services/interviewService';
import type { InterviewSchedulePayload } from '../../types/interview';

export interface RescheduleInterviewRequest {
  interviewDate: string;
  interviewTime: string;
  locationOrLink: string;
  reason: string;
  notifyAttendees: boolean;
}

export interface RescheduleInterviewModalProps {
  isOpen: boolean;
  interview: InterviewSchedulePayload;
  onClose: () => void;
  onSubmit: (request: RescheduleInterviewRequest) => void | Promise<void>;
}

const getVietnamToday = (): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

export default function RescheduleInterviewModal({
  isOpen,
  interview,
  onClose,
  onSubmit,
}: RescheduleInterviewModalProps) {
  const [interviewDate, setInterviewDate] = useState(interview.interviewDate);
  const [interviewTime, setInterviewTime] = useState(interview.interviewTime);
  const [locationOrLink, setLocationOrLink] = useState(interview.locationOrLink);
  const [reason, setReason] = useState('');
  const [notifyAttendees, setNotifyAttendees] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const validation = validateScheduleTime(interviewDate, interviewTime);
    if (!validation.isValid) {
      setError(validation.error || 'Vui lòng chọn ngày và giờ hợp lệ trong tương lai.');
      return;
    }
    if (!locationOrLink.trim()) {
      setError('Vui lòng nhập địa điểm hoặc đường dẫn phỏng vấn mới.');
      return;
    }
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do hoặc ghi chú thay đổi lịch.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        interviewDate,
        interviewTime,
        locationOrLink: locationOrLink.trim(),
        reason: reason.trim(),
        notifyAttendees,
      });
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Không thể cập nhật lịch phỏng vấn. Vui lòng thử lại.',
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
        aria-labelledby="reschedule-interview-title"
        className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700">
              <CalendarClock size={17} aria-hidden="true" />
              {interview.candidateName} · {interview.roundName}
            </span>
            <h2 id="reschedule-interview-title" className="mt-2 text-2xl font-bold text-slate-900">
              Đổi lịch phỏng vấn
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Nhập thời gian và thông tin mới. Lý do sẽ được gửi cùng thông báo nếu bạn chọn gửi.
            </p>
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label htmlFor="reschedule-interview-date" className="text-sm font-medium text-slate-700">
              Ngày mới <span className="text-rose-600">*</span>
              <input
                id="reschedule-interview-date"
                type="date"
                required
                min={getVietnamToday()}
                value={interviewDate}
                onChange={(event) => setInterviewDate(event.target.value)}
                className="mt-2 block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </label>
            <label htmlFor="reschedule-interview-time" className="text-sm font-medium text-slate-700">
              Giờ mới <span className="text-rose-600">*</span>
              <input
                id="reschedule-interview-time"
                type="time"
                required
                value={interviewTime}
                onChange={(event) => setInterviewTime(event.target.value)}
                className="mt-2 block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </label>
          </div>

          <label htmlFor="reschedule-interview-location" className="block text-sm font-medium text-slate-700">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} aria-hidden="true" />
              Địa điểm hoặc đường dẫn mới <span className="text-rose-600">*</span>
            </span>
            <input
              id="reschedule-interview-location"
              type="text"
              required
              maxLength={500}
              value={locationOrLink}
              onChange={(event) => setLocationOrLink(event.target.value)}
              placeholder="Địa chỉ văn phòng hoặc https://..."
              className="mt-2 block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </label>

          <label htmlFor="reschedule-interview-reason" className="block text-sm font-medium text-slate-700">
            Lý do / ghi chú thay đổi <span className="text-rose-600">*</span>
            <textarea
              id="reschedule-interview-reason"
              required
              rows={3}
              maxLength={1000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Nhập lý do đổi lịch và thông tin ứng viên cần biết..."
              className="mt-2 block w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-base outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={notifyAttendees}
              onChange={(event) => setNotifyAttendees(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="flex gap-2">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" aria-hidden="true" />
              <span>
                <span className="block font-semibold text-slate-900">
                  Gửi email / thông báo cập nhật lịch
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">
                  Thông báo cho ứng viên và hội đồng phỏng vấn.
                </span>
              </span>
            </span>
          </label>

          {error && (
            <p role="alert" className="flex items-start gap-2 text-sm text-rose-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
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
              Đóng
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-12 rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white transition hover:bg-indigo-800 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Đang cập nhật...' : 'Lưu lịch mới'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
