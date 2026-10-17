import { useState, type FC, type FormEvent } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

const DECLINE_REASONS = [
  'Mức lương và đãi ngộ chưa phù hợp',
  'Đã nhận lời mời từ đơn vị khác',
  'Vị trí hoặc nội dung công việc chưa phù hợp',
  'Thời gian / ngày bắt đầu chưa phù hợp',
  'Địa điểm hoặc hình thức làm việc chưa phù hợp',
  'Lý do khác',
] as const;

export interface DeclineModalProps {
  isSubmitting: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export const DeclineModal: FC<DeclineModalProps> = ({
  isSubmitting,
  error,
  onClose,
  onSubmit,
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [validationError, setValidationError] = useState('');
  const isOtherReason = selectedReason === 'Lý do khác';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedDetails = details.trim();
    if (!selectedReason) {
      setValidationError('Vui lòng chọn lý do từ chối.');
      return;
    }
    if (isOtherReason && trimmedDetails.length < 5) {
      setValidationError('Vui lòng mô tả lý do khác (tối thiểu 5 ký tự).');
      return;
    }

    const reason = isOtherReason
      ? trimmedDetails
      : trimmedDetails
        ? `${selectedReason}. Chi tiết: ${trimmedDetails}`
        : selectedReason;
    setValidationError('');
    await onSubmit(reason);
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
        aria-labelledby="decline-offer-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-rose-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-rose-50 p-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="decline-offer-title" className="text-lg font-bold text-slate-900">
                Từ chối thư mời nhận việc
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Phản hồi của bạn giúp chúng tôi cải thiện quy trình tuyển dụng.
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
          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-slate-700">
              Lý do từ chối <span className="text-rose-600">*</span>
            </legend>
            <div className="space-y-2">
              {DECLINE_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition ${
                    selectedReason === reason
                      ? 'border-rose-300 bg-rose-50 text-rose-900'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="decline-reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(event) => {
                      setSelectedReason(event.target.value);
                      setValidationError('');
                    }}
                    className="h-4 w-4 accent-rose-600"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="decline-offer-details" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Ghi chú chi tiết {isOtherReason && <span className="text-rose-600">*</span>}
            </label>
            <textarea
              id="decline-offer-details"
              rows={3}
              maxLength={1000}
              required={isOtherReason}
              value={details}
              onChange={(event) => {
                setDetails(event.target.value);
                setValidationError('');
              }}
              placeholder={isOtherReason ? 'Vui lòng mô tả lý do của bạn...' : 'Bạn có thể chia sẻ thêm (không bắt buộc)...'}
              className="w-full resize-y rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
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
              Quay lại
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Đang gửi...' : 'Xác nhận từ chối'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};

export default DeclineModal;
