import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  MessageCircle,
  XCircle,
} from 'lucide-react';
import type {
  CandidateInterviewResponse,
  CandidateInterviewResponseStatus,
} from '../../types/interview';

interface CandidateResponseStatusProps {
  response?: CandidateInterviewResponse;
  className?: string;
}

const STATUS_PRESENTATION: Record<
  CandidateInterviewResponseStatus,
  { label: string; className: string; Icon: typeof CheckCircle2; detail: string }
> = {
  CONFIRMED: {
    label: 'Đã xác nhận',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    Icon: CheckCircle2,
    detail: 'Ứng viên đã xác nhận tham gia buổi phỏng vấn.',
  },
  RESCHEDULE_REQUESTED: {
    label: 'Yêu cầu đổi lịch',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
    Icon: CalendarClock,
    detail: 'Ứng viên đề nghị thay đổi lịch phỏng vấn.',
  },
  DECLINED: {
    label: 'Từ chối',
    className: 'border-rose-200 bg-rose-50 text-rose-800',
    Icon: XCircle,
    detail: 'Ứng viên đã từ chối lời mời phỏng vấn.',
  },
  PENDING: {
    label: 'Chờ phản hồi',
    className: 'border-slate-200 bg-slate-100 text-slate-700',
    Icon: Clock3,
    detail: 'Ứng viên chưa gửi phản hồi cho lời mời phỏng vấn.',
  },
};

const formatResponseDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export default function CandidateResponseStatus({
  response,
  className = '',
}: CandidateResponseStatusProps) {
  const status = response?.status ?? 'PENDING';
  const presentation = STATUS_PRESENTATION[status];
  const StatusIcon = presentation.Icon;

  return (
    <details className={`group relative inline-block align-middle ${className}`}>
      <summary
        aria-label={`Trạng thái phản hồi: ${presentation.label}. Nhấn để xem chi tiết`}
        className={`inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold outline-none transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden ${presentation.className}`}
      >
        <StatusIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{presentation.label}</span>
        <ChevronDown
          className="h-3 w-3 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div
        role="region"
        aria-label={`Chi tiết phản hồi: ${presentation.label}`}
        className="absolute right-0 z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-4 text-left text-sm font-normal text-slate-700 shadow-xl sm:right-auto sm:left-0"
      >
        <div className="flex items-start gap-2">
          <MessageCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">{presentation.detail}</p>

            {status === 'CONFIRMED' && response?.respondedAt && (
              <p className="mt-2 text-xs leading-5 text-slate-600">
                <span className="font-medium">Thời gian xác nhận:</span>{' '}
                {formatResponseDateTime(response.respondedAt)}
              </p>
            )}

            {status === 'RESCHEDULE_REQUESTED' && (
              <>
                {response?.proposedDateTime && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-600">
                    <CalendarClock
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600"
                      aria-hidden="true"
                    />
                    <span>
                      <span className="font-medium">Thời gian đề xuất:</span>{' '}
                      {formatResponseDateTime(response.proposedDateTime)}
                    </span>
                  </p>
                )}
                {response?.reason && (
                  <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">
                    <span className="font-medium text-slate-700">Lý do:</span>{' '}
                    {response.reason}
                  </p>
                )}
                {!response?.proposedDateTime && !response?.reason && (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Chưa có nội dung chi tiết cho đề nghị này.
                  </p>
                )}
              </>
            )}

            {status === 'DECLINED' && (
              <>
                {response?.reason ? (
                  <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">
                    <span className="font-medium text-slate-700">Lý do từ chối:</span>{' '}
                    {response.reason}
                  </p>
                ) : (
                  <p className="mt-2 flex items-center gap-1.5 text-xs leading-5 text-slate-500">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Ứng viên không cung cấp lý do.
                  </p>
                )}
              </>
            )}

            {status === 'PENDING' && (
              <p className="mt-2 flex items-center gap-1.5 text-xs leading-5 text-slate-500">
                <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Chưa ghi nhận phản hồi từ ứng viên.
              </p>
            )}

            {status !== 'CONFIRMED' && response?.respondedAt && (
              <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
                Thời gian phản hồi: {formatResponseDateTime(response.respondedAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    </details>
  );
}
