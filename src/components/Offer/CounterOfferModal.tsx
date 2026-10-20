import { useState, type FC, type FormEvent } from 'react';
import { ArrowRight, CalendarDays, Loader2, Wallet, X } from 'lucide-react';
import type { OfferRecord } from '../../types/offer';
import {
  offerService,
  type CounterOfferRequest,
} from '../../services/offerService';
import { calculateDefaultFutureDate, formatVndCurrency } from '../../utils/offerHelper';
import { toast } from '../notifications';

export interface CounterOfferModalProps {
  offer: OfferRecord;
  onClose: () => void;
  onSuccess: (replacement: OfferRecord) => void;
}

const getDefaultStartDate = (offer: OfferRecord): string => {
  const today = new Date().toISOString().slice(0, 10);
  return offer.expectedStartDate >= today
    ? offer.expectedStartDate
    : calculateDefaultFutureDate(14);
};

export const CounterOfferModal: FC<CounterOfferModalProps> = ({
  offer,
  onClose,
  onSuccess,
}) => {
  const [salary, setSalary] = useState(String(offer.offeredSalary));
  const [allowance, setAllowance] = useState(String(offer.allowanceAmount));
  const [allowanceDescription, setAllowanceDescription] = useState(
    offer.allowanceDescription ?? '',
  );
  const [startDate, setStartDate] = useState(() => getDefaultStartDate(offer));
  const [responseDeadline, setResponseDeadline] = useState(() =>
    calculateDefaultFutureDate(5),
  );
  const [notes, setNotes] = useState(offer.additionalNotes ?? '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const minimumDate = new Date().toISOString().slice(0, 10);
    const offeredSalary = Number(salary);
    const allowanceAmount = Number(allowance);
    if (!Number.isFinite(offeredSalary) || offeredSalary < 1_000_000) {
      setError('Mức lương offer thay thế phải từ 1.000.000 ₫ trở lên.');
      return;
    }
    if (!Number.isFinite(allowanceAmount) || allowanceAmount < 0) {
      setError('Phụ cấp không được là số âm.');
      return;
    }
    if (!startDate || startDate < minimumDate) {
      setError('Ngày nhận việc phải là hôm nay hoặc một ngày trong tương lai.');
      return;
    }
    if (!responseDeadline || responseDeadline < minimumDate) {
      setError('Hạn phản hồi phải là hôm nay hoặc một ngày trong tương lai.');
      return;
    }
    if (responseDeadline > startDate) {
      setError('Hạn phản hồi phải trước hoặc cùng ngày nhận việc.');
      return;
    }

    const request: CounterOfferRequest = {
      jobTitle: offer.jobTitle,
      positionId: offer.positionId,
      offeredSalary,
      allowanceAmount,
      allowanceDescription: allowanceDescription.trim(),
      expectedStartDate: startDate,
      responseDeadline,
      outOfRangeReason: offer.outOfRangeReason,
      additionalNotes: notes.trim(),
      sendEmailToCandidate: true,
    };

    setError('');
    setIsSubmitting(true);
    try {
      const replacement = await offerService.createCounterOffer(offer.offerId, request);
      onSuccess(replacement);
    } catch (requestError: unknown) {
      const message = requestError instanceof Error
        ? requestError.message
        : 'Không thể tạo offer thay thế. Vui lòng thử lại.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="counter-offer-title"
        className="my-6 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-indigo-100 bg-indigo-50/60 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Offer thay thế · {offer.offerCode}
            </p>
            <h2 id="counter-offer-title" className="mt-1 text-xl font-bold text-slate-900">
              Điều chỉnh đề nghị tuyển dụng
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Thông tin được sao chép từ offer gốc. Chỉnh sửa điều khoản trước khi gửi lại cho {offer.candidateName}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng"
            className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">{offer.jobTitle}</p>
            <p className="mt-1 text-xs text-slate-500">
              Lương offer gốc: {formatVndCurrency(offer.offeredSalary)} · Phụ cấp:{' '}
              {formatVndCurrency(offer.allowanceAmount)}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label htmlFor="counter-offer-salary" className="block text-sm font-semibold text-slate-700">
              <span className="mb-1.5 flex items-center gap-1.5">
                <Wallet className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                Lương cơ bản mới (₫ / tháng) *
              </span>
              <input
                id="counter-offer-salary"
                type="number"
                min={1_000_000}
                step={500_000}
                required
                value={salary}
                onChange={(event) => {
                  setSalary(event.target.value);
                  setError('');
                }}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <label htmlFor="counter-offer-allowance" className="block text-sm font-semibold text-slate-700">
              Phụ cấp (₫ / tháng)
              <input
                id="counter-offer-allowance"
                type="number"
                min={0}
                step={100_000}
                value={allowance}
                onChange={(event) => {
                  setAllowance(event.target.value);
                  setError('');
                }}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <label htmlFor="counter-offer-start-date" className="block text-sm font-semibold text-slate-700">
              <span className="mb-1.5 flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                Ngày bắt đầu mới *
              </span>
              <input
                id="counter-offer-start-date"
                type="date"
                required
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  setError('');
                }}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <label htmlFor="counter-offer-deadline" className="block text-sm font-semibold text-slate-700">
              Hạn phản hồi mới *
              <input
                id="counter-offer-deadline"
                type="date"
                required
                value={responseDeadline}
                onChange={(event) => {
                  setResponseDeadline(event.target.value);
                  setError('');
                }}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>

          <label htmlFor="counter-offer-allowance-description" className="block text-sm font-semibold text-slate-700">
            Điều khoản phụ cấp / đãi ngộ
            <textarea
              id="counter-offer-allowance-description"
              rows={2}
              maxLength={1000}
              value={allowanceDescription}
              onChange={(event) => setAllowanceDescription(event.target.value)}
              className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 px-3.5 py-3 font-normal text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label htmlFor="counter-offer-notes" className="block text-sm font-semibold text-slate-700">
            Ghi chú / điều khoản bổ sung
            <textarea
              id="counter-offer-notes"
              rows={3}
              maxLength={2000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Nhập điều chỉnh hoặc nội dung muốn trao đổi thêm..."
              className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 px-3.5 py-3 font-normal text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          {error && <p role="alert" className="text-sm font-medium text-rose-700">{error}</p>}

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Đang tạo và gửi...' : 'Gửi offer thay thế'}
              {!isSubmitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};

export default CounterOfferModal;
