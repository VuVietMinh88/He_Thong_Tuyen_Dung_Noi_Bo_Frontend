import { useEffect, useState, type FC, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageSquareText,
  Send,
  ShieldCheck,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import type { OfferRecord, OfferStatus } from '../../types/offer';
import { formatVndCurrency } from '../../utils/offerHelper';
import {
  offerService,
  type OfferResponsePayload,
} from '../../services/offerService';
import { toast } from '../../components/notifications';

export interface OfferResponseDetails extends OfferRecord {
  applicationId?: string;
  workLocation?: string;
  benefits?: string[];
}

export interface OfferNegotiation {
  requestedSalary?: number;
  requestedTerms?: string;
}

export interface OfferResponsePageProps {
  offer: OfferResponseDetails;
  onAccept?: (offerId: string) => Promise<void> | void;
  onDecline?: (offerId: string, reason: string) => Promise<void> | void;
  onNegotiate?: (
    offerId: string,
    proposal: OfferNegotiation,
  ) => Promise<void> | void;
}

type ResponseAction = 'decline' | 'negotiate';
type ResponseState = 'accepted' | 'declined' | 'negotiated' | null;

const respondedStatuses: OfferStatus[] = ['ACCEPTED', 'DECLINED', 'NEGOTIATING'];

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return new Intl.DateTimeFormat('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const formatDeadline = (value: string): string => {
  const date = getDeadlineDate(value);
  if (!date) return 'Chưa cập nhật';
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Intl.DateTimeFormat(
    'vi-VN',
    isDateOnly
      ? { day: 'numeric', month: 'long', year: 'numeric' }
      : { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  ).format(date);
};

const getDeadlineDate = (value: string): Date | null => {
  if (!value.trim()) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const parsed = new Date(dateOnly ? `${value}T23:59:59.999` : value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const statusMessage = (status: OfferStatus): string => {
  if (status === 'ACCEPTED') return 'Bạn đã xác nhận nhận việc.';
  if (status === 'DECLINED') return 'Bạn đã gửi phản hồi từ chối offer này.';
  if (status === 'NEGOTIATING') return 'Đề xuất thương lượng của bạn đang được xem xét.';
  if (status === 'CANCELLED' || status === 'REJECTED') {
    return 'Offer này không còn khả dụng để phản hồi.';
  }
  if (status !== 'SENT_TO_CANDIDATE' && status !== 'APPROVED') {
    return 'Offer chưa được gửi đến bạn. Vui lòng quay lại sau.';
  }
  return '';
};

export const OfferResponsePage: FC<OfferResponsePageProps> = ({
  offer,
  onAccept,
  onDecline,
  onNegotiate,
}) => {
  const [now, setNow] = useState(() => new Date());
  const [activeAction, setActiveAction] = useState<ResponseAction | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [requestedSalary, setRequestedSalary] = useState('');
  const [requestedTerms, setRequestedTerms] = useState('');
  const [formError, setFormError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localResponse, setLocalResponse] = useState<{
    offerId: string;
    value: ResponseState;
  } | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!activeAction) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) setActiveAction(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAction, isSubmitting]);

  const deadline = getDeadlineDate(offer.responseDeadline);
  const isExpired = deadline !== null && deadline.getTime() < now.getTime();
  const response: ResponseState = respondedStatuses.includes(offer.status)
    ? offer.status === 'ACCEPTED'
      ? 'accepted'
      : offer.status === 'DECLINED'
        ? 'declined'
        : 'negotiated'
    : localResponse?.offerId === offer.offerId
      ? localResponse.value
      : null;
  const isAlreadyResponded = response !== null || respondedStatuses.includes(offer.status);
  const unavailableMessage = isExpired
    ? 'Thời hạn phản hồi offer đã kết thúc.'
    : !deadline
      ? 'Chưa có thời hạn phản hồi hợp lệ cho offer này.'
      : statusMessage(offer.status);
  const isActionDisabled =
    isSubmitting ||
    isExpired ||
    !deadline ||
    isAlreadyResponded ||
    Boolean(statusMessage(offer.status));

  const showModal = (action: ResponseAction) => {
    setFormError('');
    setRequestError('');
    setActiveAction(action);
  };

  const submitOfferResponse = async (
    payload: OfferResponsePayload,
    successMessage: string,
  ) => {
    const result = await offerService.respondOffer(offer, payload);
    setLocalResponse({
      offerId: offer.offerId,
      value:
        payload.decision === 'ACCEPT'
          ? 'accepted'
          : payload.decision === 'DECLINE'
            ? 'declined'
            : 'negotiated',
    });
    if (result.pipelineSynced) {
      toast.success(successMessage);
    } else {
      toast.warning(
        `Phản hồi offer đã được ghi nhận, nhưng chưa đồng bộ được pipeline (${result.pipelineSyncError ?? 'lỗi không xác định'}). Vui lòng liên hệ bộ phận tuyển dụng.`,
        7000,
      );
    }
  };

  const submitDecline = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reason = declineReason.trim();
    if (reason.length < 5) {
      setFormError('Vui lòng nhập lý do từ chối (tối thiểu 5 ký tự).');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      if (onDecline) {
        await onDecline(offer.offerId, reason);
        setLocalResponse({ offerId: offer.offerId, value: 'declined' });
        toast.success('Đã gửi phản hồi từ chối offer.');
      } else {
        await submitOfferResponse(
          { decision: 'DECLINE', reason },
          'Đã gửi phản hồi từ chối offer và cập nhật pipeline.',
        );
      }
      setActiveAction(null);
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : 'Không thể gửi phản hồi. Vui lòng thử lại.';
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitNegotiation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const salary = requestedSalary.trim() ? Number(requestedSalary) : undefined;
    const terms = requestedTerms.trim();
    if (salary !== undefined && (!Number.isFinite(salary) || salary < 1_000_000)) {
      setFormError('Mức lương đề xuất phải từ 1.000.000 ₫ trở lên.');
      return;
    }
    if (salary === undefined && !terms) {
      setFormError('Vui lòng đề xuất mức lương hoặc điều khoản bạn mong muốn.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const proposal: OfferNegotiation = {
        ...(salary !== undefined ? { requestedSalary: salary } : {}),
        ...(terms ? { requestedTerms: terms } : {}),
      };
      if (onNegotiate) {
        await onNegotiate(offer.offerId, proposal);
        setLocalResponse({ offerId: offer.offerId, value: 'negotiated' });
        toast.success('Đã gửi đề xuất thương lượng.');
      } else {
        await submitOfferResponse(
          { decision: 'NEGOTIATE', ...proposal },
          'Đã gửi đề xuất thương lượng và cập nhật pipeline.',
        );
      }
      setActiveAction(null);
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : 'Không thể gửi đề xuất. Vui lòng thử lại.';
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const acceptOffer = async () => {
    setIsSubmitting(true);
    setRequestError('');
    try {
      if (onAccept) {
        await onAccept(offer.offerId);
        setLocalResponse({ offerId: offer.offerId, value: 'accepted' });
        toast.success('Chúc mừng bạn đã nhận việc! Đội ngũ tuyển dụng sẽ liên hệ hướng dẫn các bước tiếp theo.');
      } else {
        await submitOfferResponse(
          { decision: 'ACCEPT' },
          'Chúc mừng bạn đã nhận việc! Pipeline đã được cập nhật.',
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : 'Không thể xác nhận offer. Vui lòng thử lại.';
      setRequestError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = offer.benefits?.length
    ? offer.benefits
    : offer.allowanceDescription
      ? [offer.allowanceDescription]
      : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/careers" className="flex items-center gap-2.5" aria-label="Trang tuyển dụng">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">
              SmartRecruit
            </span>
          </a>
          <span className="hidden items-center gap-1.5 text-xs font-medium text-slate-500 sm:flex">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Thư mời nhận việc bảo mật
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
            <Send className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-indigo-700">THƯ MỜI NHẬN VIỆC</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Chúc mừng bạn, {offer.candidateName}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            Chúng tôi rất vui được gửi đến bạn đề nghị tuyển dụng chính thức. Vui lòng xem
            kỹ các thông tin bên dưới và phản hồi trước thời hạn.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_350px]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-br from-indigo-700 to-violet-700 px-6 py-7 text-white sm:px-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-indigo-100">
                    {offer.departmentName || 'Cơ hội nghề nghiệp'}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{offer.jobTitle}</h2>
                  {offer.jobLevel && (
                    <span className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                      Cấp bậc: {offer.jobLevel}
                    </span>
                  )}
                </div>
                <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 font-mono text-xs text-indigo-50">
                  {offer.offerCode}
                </span>
              </div>
            </div>

            <div className="space-y-7 p-6 sm:p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Wallet className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Lương cơ bản / tháng</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {formatVndCurrency(offer.offeredSalary)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <CalendarDays className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Ngày bắt đầu dự kiến</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {formatDate(offer.expectedStartDate)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Địa điểm làm việc</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {offer.workLocation || 'Vui lòng liên hệ bộ phận tuyển dụng'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <Wallet className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Tổng thu nhập dự kiến / tháng</p>
                    <p className="mt-1 text-base font-bold text-slate-900">
                      {formatVndCurrency(offer.totalMonthlyCompensation)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-slate-900">Đãi ngộ & quyền lợi</h3>
                {benefits.length > 0 ? (
                  <ul className="mt-3 space-y-2.5">
                    {benefits.map((benefit) => (
                      <li key={benefit} className="flex gap-2.5 text-sm leading-6 text-slate-600">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                        {benefit}
                      </li>
                    ))}
                    {offer.allowanceAmount > 0 && (
                      <li className="flex gap-2.5 text-sm leading-6 text-slate-600">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                        Phụ cấp: {formatVndCurrency(offer.allowanceAmount)} / tháng
                      </li>
                    )}
                  </ul>
                ) : offer.allowanceAmount > 0 ? (
                  <p className="mt-2 text-sm text-slate-600">
                    Phụ cấp: {formatVndCurrency(offer.allowanceAmount)} / tháng
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    Thông tin quyền lợi chi tiết sẽ được trao đổi cùng bộ phận tuyển dụng.
                  </p>
                )}
              </div>

              {offer.additionalNotes && (
                <div className="rounded-xl bg-slate-50 p-4">
                  <h3 className="text-sm font-bold text-slate-900">Thông tin bổ sung</h3>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {offer.additionalNotes}
                  </p>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-5">
            <section
              className={`rounded-2xl border p-5 shadow-sm ${
                isExpired
                  ? 'border-rose-200 bg-rose-50'
                  : 'border-amber-200 bg-amber-50'
              }`}
            >
              <div className="flex gap-3">
                <Clock3
                  className={`mt-0.5 h-5 w-5 shrink-0 ${isExpired ? 'text-rose-600' : 'text-amber-700'}`}
                  aria-hidden="true"
                />
                <div>
                  <p className={`text-sm font-bold ${isExpired ? 'text-rose-900' : 'text-amber-950'}`}>
                    {isExpired ? 'Đã hết hạn phản hồi' : 'Thời hạn phản hồi'}
                  </p>
                  <p className={`mt-1 text-sm ${isExpired ? 'text-rose-800' : 'text-amber-900'}`}>
                    {formatDeadline(offer.responseDeadline)}
                  </p>
                  {!isExpired && deadline && /^\d{4}-\d{2}-\d{2}$/.test(offer.responseDeadline) && (
                    <p className="mt-1 text-xs text-amber-800">
                      Vui lòng phản hồi trước 23:59 ngày hết hạn.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">Phản hồi thư mời</h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                Chọn phương án phù hợp với bạn.
              </p>

              {response === 'accepted' ? (
                <div
                  className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                  role="status"
                  data-testid="offer-accepted-message"
                >
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-bold text-emerald-900">
                        Bạn đã xác nhận nhận việc!
                      </p>
                      <p className="mt-1 text-sm leading-5 text-emerald-800">
                        Bộ phận tuyển dụng sẽ liên hệ để hướng dẫn hoàn thiện hồ sơ và chuẩn bị cho ngày đầu tiên.
                      </p>
                    </div>
                  </div>
                  <ol className="ml-8 mt-3 list-decimal space-y-1 text-xs text-emerald-800">
                    <li>Kiểm tra email để nhận hướng dẫn tiếp theo.</li>
                    <li>Chuẩn bị giấy tờ theo danh sách từ bộ phận nhân sự.</li>
                    <li>Liên hệ HR nếu cần hỗ trợ trước ngày nhận việc.</li>
                  </ol>
                </div>
              ) : response === 'declined' ? (
                <div className="mt-5 flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4" role="status">
                  <XCircle className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
                  <p className="text-sm leading-5 text-slate-700">
                    Phản hồi từ chối của bạn đã được ghi nhận. Cảm ơn bạn đã dành thời gian trao đổi cùng chúng tôi.
                  </p>
                </div>
              ) : response === 'negotiated' ? (
                <div className="mt-5 flex gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4" role="status">
                  <MessageSquareText className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden="true" />
                  <p className="text-sm leading-5 text-indigo-900">
                    Đề xuất của bạn đã được gửi đến bộ phận tuyển dụng. Chúng tôi sẽ liên hệ lại sớm.
                  </p>
                </div>
              ) : isAlreadyResponded ? (
                <div className="mt-5 flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4" role="status">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
                  <p className="text-sm leading-5 text-slate-700">{statusMessage(offer.status)}</p>
                </div>
              ) : unavailableMessage ? (
                <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4" role="status">
                  <AlertCircle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
                  <p className="text-sm leading-5 text-amber-900">{unavailableMessage}</p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {requestError && (
                    <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
                      {requestError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={acceptOffer}
                    disabled={isActionDisabled}
                    data-testid="offer-accept-button"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {isSubmitting ? 'Đang gửi...' : 'Đồng ý nhận việc'}
                  </button>
                  <button
                    type="button"
                    onClick={() => showModal('negotiate')}
                    disabled={isActionDisabled}
                    data-testid="offer-negotiate-button"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                    Đề xuất thương lượng
                  </button>
                  <button
                    type="button"
                    onClick={() => showModal('decline')}
                    disabled={isActionDisabled}
                    data-testid="offer-decline-button"
                    className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    Từ chối offer
                  </button>
                </div>
              )}

              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs leading-5 text-slate-500">
                  Có thắc mắc về các điều khoản? Hãy liên hệ bộ phận tuyển dụng để được hỗ trợ.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </main>

      {activeAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSubmitting) setActiveAction(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-response-modal-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="offer-response-modal-title" className="text-xl font-bold text-slate-900">
                  {activeAction === 'decline' ? 'Từ chối thư mời' : 'Đề xuất thương lượng'}
                </h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {activeAction === 'decline'
                    ? 'Chia sẻ lý do để chúng tôi ghi nhận phản hồi của bạn.'
                    : 'Hãy cho chúng tôi biết mức lương hoặc điều khoản bạn mong muốn.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveAction(null)}
                disabled={isSubmitting}
                aria-label="Đóng"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {activeAction === 'decline' ? (
              <form className="mt-5 space-y-4" onSubmit={submitDecline}>
                <label className="block text-sm font-semibold text-slate-700" htmlFor="decline-reason">
                  Lý do từ chối <span className="text-rose-600">*</span>
                  <textarea
                    id="decline-reason"
                    value={declineReason}
                    onChange={(event) => setDeclineReason(event.target.value)}
                    rows={4}
                    required
                    minLength={5}
                    maxLength={1000}
                    autoFocus
                    placeholder="Nhập lý do của bạn..."
                    className="mt-2 block w-full resize-y rounded-xl border border-slate-300 px-3.5 py-3 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                {formError && <p className="text-sm text-rose-700" role="alert">{formError}</p>}
                <div className="flex justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveAction(null)}
                    disabled={isSubmitting}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang gửi...' : 'Xác nhận từ chối'}
                    {!isSubmitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </form>
            ) : (
              <form className="mt-5 space-y-4" onSubmit={submitNegotiation}>
                <label className="block text-sm font-semibold text-slate-700" htmlFor="requested-salary">
                  Mức lương mong muốn (₫ / tháng)
                  <input
                    id="requested-salary"
                    type="number"
                    min={1_000_000}
                    step={500_000}
                    value={requestedSalary}
                    onChange={(event) => setRequestedSalary(event.target.value)}
                    autoFocus
                    placeholder="Ví dụ: 35000000"
                    className="mt-2 block w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700" htmlFor="requested-terms">
                  Điều khoản mong muốn
                  <textarea
                    id="requested-terms"
                    value={requestedTerms}
                    onChange={(event) => setRequestedTerms(event.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Ví dụ: ngày bắt đầu, chế độ làm việc, phụ cấp..."
                    className="mt-2 block w-full resize-y rounded-xl border border-slate-300 px-3.5 py-3 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                {formError && <p className="text-sm text-rose-700" role="alert">{formError}</p>}
                <div className="flex justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveAction(null)}
                    disabled={isSubmitting}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang gửi...' : 'Gửi đề xuất'}
                    {!isSubmitting && <Send className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default OfferResponsePage;
