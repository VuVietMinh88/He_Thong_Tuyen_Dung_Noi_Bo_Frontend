import { useState, type FC, type FormEvent } from 'react';
import { CalendarDays, Loader2, MessageSquareText, Wallet, X } from 'lucide-react';
import type { OfferNegotiation } from '../../services/offerService';

export interface NegotiateModalProps {
  isSubmitting: boolean;
  error?: string;
  currentSalary: number;
  currentStartDate: string;
  onClose: () => void;
  onSubmit: (proposal: OfferNegotiation) => Promise<void>;
}

const getTodayDate = (): string => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

export const NegotiateModal: FC<NegotiateModalProps> = ({
  isSubmitting,
  error,
  currentSalary,
  currentStartDate,
  onClose,
  onSubmit,
}) => {
  const [requestedSalary, setRequestedSalary] = useState('');
  const [requestedStartDate, setRequestedStartDate] = useState('');
  const [requestedTerms, setRequestedTerms] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const salaryText = requestedSalary.trim();
    const salary = salaryText ? Number(salaryText) : undefined;
    const startDate = requestedStartDate.trim();
    const terms = requestedTerms.trim();

    if (salary !== undefined && (!Number.isFinite(salary) || salary < 1_000_000)) {
      setValidationError('Mức lương đề xuất phải từ 1.000.000 ₫ trở lên.');
      return;
    }
    if (startDate && startDate < getTodayDate()) {
      setValidationError('Ngày nhận việc mong muốn không được ở trong quá khứ.');
      return;
    }
    if (salary === undefined && !startDate && !terms) {
      setValidationError('Vui lòng nhập ít nhất một nội dung đề xuất.');
      return;
    }

    const proposal: OfferNegotiation = {
      ...(salary !== undefined ? { requestedSalary: salary } : {}),
      ...(startDate ? { requestedStartDate: startDate } : {}),
      ...(terms ? { requestedTerms: terms } : {}),
    };
    setValidationError('');
    await onSubmit(proposal);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="negotiate-offer-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-indigo-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <MessageSquareText className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="negotiate-offer-title" className="text-lg font-bold text-slate-900">
                Đề xuất thương lượng
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Chia sẻ điều khoản mong muốn để bộ phận tuyển dụng xem xét.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div>
            <label htmlFor="negotiate-offer-salary" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <Wallet className="h-4 w-4 text-slate-400" aria-hidden="true" />
              Mức lương mong muốn (₫ / tháng)
            </label>
            <input
              id="negotiate-offer-salary"
              type="number"
              min={1_000_000}
              step={500_000}
              value={requestedSalary}
              onChange={(event) => {
                setRequestedSalary(event.target.value);
                setValidationError('');
              }}
              placeholder={`Hiện tại: ${currentSalary.toLocaleString('vi-VN')} ₫`}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label htmlFor="negotiate-offer-start-date" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden="true" />
              Ngày nhận việc mong muốn
            </label>
            <input
              id="negotiate-offer-start-date"
              type="date"
              min={getTodayDate()}
              value={requestedStartDate}
              onChange={(event) => {
                setRequestedStartDate(event.target.value);
                setValidationError('');
              }}
              aria-describedby="negotiate-offer-start-date-current"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <p id="negotiate-offer-start-date-current" className="mt-1.5 text-xs text-slate-500">
              Ngày hiện tại trong thư mời: {currentStartDate || 'Chưa cập nhật'}
            </p>
          </div>

          <div>
            <label htmlFor="negotiate-offer-terms" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Ghi chú bổ sung
            </label>
            <textarea
              id="negotiate-offer-terms"
              rows={3}
              maxLength={1000}
              value={requestedTerms}
              onChange={(event) => {
                setRequestedTerms(event.target.value);
                setValidationError('');
              }}
              placeholder="Điều khoản hoặc quyền lợi khác bạn mong muốn..."
              className="w-full resize-y rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {(validationError || error) && (
            <p role="alert" className="text-sm font-medium text-rose-700">
              {validationError || error}
            </p>
          )}

          <footer className="flex justify-end gap-3 border-t border-slate-100 pt-4">
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
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Đang gửi...' : 'Gửi đề xuất'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};

export default NegotiateModal;
