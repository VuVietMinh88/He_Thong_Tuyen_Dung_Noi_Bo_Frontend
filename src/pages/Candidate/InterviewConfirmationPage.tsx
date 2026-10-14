import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  UserRound,
  Video,
  X,
} from 'lucide-react';
import type { InterviewFormat, InterviewerInfo } from '../../types/interview';

export interface InterviewConfirmationDetails {
  jobTitle: string;
  roundName: string;
  interviewDate: string;
  interviewTime: string;
  durationMinutes: number;
  format: InterviewFormat;
  locationOrLink: string;
  interviewers: InterviewerInfo[];
}

export interface InterviewRescheduleRequest {
  proposedDate: string;
  proposedTime: string;
  reason: string;
}

export interface InterviewConfirmationPageProps {
  interview: InterviewConfirmationDetails;
  onConfirm: () => void | Promise<void>;
  onReschedule: (request: InterviewRescheduleRequest) => void | Promise<void>;
}

type Feedback = { type: 'success' | 'error'; message: string } | null;

const getLocalDateInputValue = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTomorrowDateInputValue = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getLocalDateInputValue(tomorrow);
};

const formatInterviewDate = (date: string, time: string): string => {
  const localDate = new Date(`${date}T${time}`);
  if (Number.isNaN(localDate.getTime())) return `${date} ${time}`;
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(localDate);
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : 'Đã xảy ra lỗi. Vui lòng thử lại sau.';

export default function InterviewConfirmationPage({
  interview,
  onConfirm,
  onReschedule,
}: InterviewConfirmationPageProps) {
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [proposedDate, setProposedDate] = useState(getTomorrowDateInputValue);
  const [proposedTime, setProposedTime] = useState('09:00');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [formError, setFormError] = useState('');

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await onConfirm();
      setFeedback({
        type: 'success',
        message: 'Bạn đã xác nhận tham gia buổi phỏng vấn. Cảm ơn bạn!',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReschedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const proposedDateTime = new Date(`${proposedDate}T${proposedTime}`);
    if (!proposedDate || !proposedTime || Number.isNaN(proposedDateTime.getTime())) {
      setFormError('Vui lòng chọn ngày và giờ hợp lệ.');
      return;
    }
    if (proposedDateTime.getTime() <= Date.now()) {
      setFormError('Thời gian đề xuất phải ở trong tương lai.');
      return;
    }
    if (!reason.trim()) {
      setFormError('Vui lòng nhập lý do bạn muốn đổi lịch.');
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await onReschedule({
        proposedDate,
        proposedTime,
        reason: reason.trim(),
      });
      setIsRescheduleOpen(false);
      setFeedback({
        type: 'success',
        message: 'Đề nghị đổi lịch đã được gửi. Nhà tuyển dụng sẽ sớm phản hồi bạn.',
      });
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <a
          href="/careers"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Trang tuyển dụng
        </a>

        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-700">
            Lời mời phỏng vấn
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Xác nhận lịch phỏng vấn
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Vui lòng kiểm tra thông tin buổi phỏng vấn và xác nhận tham gia. Nếu
            thời gian chưa phù hợp, bạn có thể đề nghị một lịch khác.
          </p>
        </header>

        {feedback && (
          <div
            role="status"
            className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
            ) : (
              <AlertCircle className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
            )}
            <p className="text-sm leading-6">{feedback.message}</p>
          </div>
        )}

        <section
          aria-labelledby="interview-details-heading"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white px-6 py-5 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-blue-700">{interview.roundName}</p>
                <h2
                  id="interview-details-heading"
                  className="mt-1 text-xl font-bold sm:text-2xl"
                >
                  {interview.jobTitle}
                </h2>
              </div>
              <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-sm font-medium text-blue-800">
                Chờ xác nhận
              </span>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <CalendarDays size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm text-slate-500">Ngày phỏng vấn</p>
                <p className="mt-1 font-semibold capitalize">
                  {formatInterviewDate(interview.interviewDate, interview.interviewTime)}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Clock3 size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm text-slate-500">Thời gian</p>
                <p className="mt-1 font-semibold">
                  {interview.interviewTime} · {interview.durationMinutes} phút
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                {interview.format === 'ONLINE' ? (
                  <Video size={20} aria-hidden="true" />
                ) : (
                  <MapPin size={20} aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-slate-500">
                  {interview.format === 'ONLINE' ? 'Hình thức · Trực tuyến' : 'Hình thức · Trực tiếp'}
                </p>
                {interview.format === 'ONLINE' ? (
                  <a
                    href={interview.locationOrLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block break-all font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900"
                  >
                    {interview.locationOrLink}
                  </a>
                ) : (
                  <p className="mt-1 font-semibold">{interview.locationOrLink}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <BriefcaseBusiness size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm text-slate-500">Vị trí ứng tuyển</p>
                <p className="mt-1 font-semibold">{interview.jobTitle}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 px-6 py-5 sm:px-8">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <UserRound size={20} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-slate-500">Người phỏng vấn</p>
                {interview.interviewers.length > 0 ? (
                  <ul className="mt-2 space-y-3">
                    {interview.interviewers.map((interviewer) => (
                      <li key={interviewer.id}>
                        <p className="font-semibold">{interviewer.name}</p>
                        <p className="text-sm text-slate-600">{interviewer.role}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 font-medium text-slate-700">
                    Thông tin sẽ được cập nhật
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 p-6 sm:flex-row sm:justify-end sm:px-8">
            <button
              type="button"
              onClick={() => {
                setFeedback(null);
                setFormError('');
                setIsRescheduleOpen(true);
              }}
              disabled={isSubmitting}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CalendarDays size={18} aria-hidden="true" />
              Đề nghị đổi lịch
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check size={18} aria-hidden="true" />
              {isSubmitting ? 'Đang gửi...' : 'Xác nhận tham gia'}
            </button>
          </div>
        </section>

        <p className="mt-5 text-center text-sm leading-6 text-slate-500">
          Cần hỗ trợ? Vui lòng liên hệ với nhà tuyển dụng đã gửi lời mời phỏng vấn.
        </p>
      </div>

      {isRescheduleOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSubmitting) {
              setIsRescheduleOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="reschedule-heading"
            className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-700">Đề nghị lịch mới</p>
                <h2 id="reschedule-heading" className="mt-1 text-2xl font-bold">
                  Đổi lịch phỏng vấn
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Chọn thời gian phù hợp và cho nhà tuyển dụng biết lý do của bạn.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRescheduleOpen(false)}
                disabled={isSubmitting}
                aria-label="Đóng biểu mẫu"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleReschedule} className="space-y-5">
              <label className="block text-sm font-medium text-slate-700" htmlFor="proposed-date">
                Ngày đề xuất <span className="text-rose-600">*</span>
                <input
                  id="proposed-date"
                  type="date"
                  required
                  min={getLocalDateInputValue()}
                  value={proposedDate}
                  onChange={(event) => setProposedDate(event.target.value)}
                  className="mt-2 block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  aria-invalid={Boolean(formError)}
                />
              </label>

              <label className="block text-sm font-medium text-slate-700" htmlFor="proposed-time">
                Giờ đề xuất <span className="text-rose-600">*</span>
                <input
                  id="proposed-time"
                  type="time"
                  required
                  value={proposedTime}
                  onChange={(event) => setProposedTime(event.target.value)}
                  className="mt-2 block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  aria-invalid={Boolean(formError)}
                />
              </label>

              <label className="block text-sm font-medium text-slate-700" htmlFor="reschedule-reason">
                Lý do đổi lịch <span className="text-rose-600">*</span>
                <textarea
                  id="reschedule-reason"
                  required
                  rows={4}
                  maxLength={1000}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Ví dụ: Tôi có lịch cá nhân vào thời gian trên. Mong nhà tuyển dụng xem xét khung giờ đề xuất..."
                  className="mt-2 block w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  aria-invalid={Boolean(formError)}
                />
                <span className="mt-1 block text-right text-xs font-normal text-slate-500">
                  {reason.length}/1000
                </span>
              </label>

              {formError && (
                <p role="alert" className="flex items-start gap-2 text-sm text-rose-700">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {formError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsRescheduleOpen(false)}
                  disabled={isSubmitting}
                  className="min-h-12 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-12 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi đề nghị'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
