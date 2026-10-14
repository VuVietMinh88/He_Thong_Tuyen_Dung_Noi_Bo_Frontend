import React, { useState } from 'react';
import { AlertTriangle, LoaderCircle, X } from 'lucide-react';
import { toast } from '../notifications';
import { applicationLookupService } from '../../services/applicationLookupService';

const WITHDRAWAL_REASONS = [
  'Đã tìm được công việc khác',
  'Lý do cá nhân',
  'Thay đổi định hướng nghề nghiệp',
  'Mức lương hoặc chế độ chưa phù hợp',
  'Khác',
] as const;

const MAX_REASON_LENGTH = 500;

export interface WithdrawApplicationModalProps {
  isOpen: boolean;
  applicationCode: string;
  onClose: () => void;
  onWithdrawn: (reason: string) => void;
}

export const WithdrawApplicationModal: React.FC<WithdrawApplicationModalProps> = ({
  isOpen,
  applicationCode,
  onClose,
  onWithdrawn,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCustomReason = selectedReason === 'Khác';

  const resetForm = () => {
    setSelectedReason('');
    setCustomReason('');
    setError('');
    setRequestError('');
  };

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reason = (isCustomReason ? customReason : selectedReason).trim();
    if (!reason) {
      setError(isCustomReason
        ? 'Vui lòng nhập lý do bạn muốn rút hồ sơ.'
        : 'Vui lòng chọn lý do rút hồ sơ.');
      return;
    }
    if (reason.length > MAX_REASON_LENGTH) {
      setError(`Lý do không được vượt quá ${MAX_REASON_LENGTH} ký tự.`);
      return;
    }

    setError('');
    setRequestError('');
    setIsSubmitting(true);
    try {
      await applicationLookupService.withdraw(applicationCode, reason);
      toast.success('Đã rút hồ sơ ứng tuyển thành công.');
      onWithdrawn(reason);
      resetForm();
      onClose();
    } catch (requestError: unknown) {
      console.error('Error withdrawing application:', requestError);
      const message = requestError instanceof Error
        ? requestError.message
        : 'Không thể rút hồ sơ lúc này. Vui lòng thử lại.';
      setRequestError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdraw-application-title"
        aria-describedby="withdraw-application-warning"
        className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="withdraw-application-title" className="text-lg font-bold text-slate-900">
                Xác nhận rút hồ sơ
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Mã hồ sơ: <span className="font-mono font-semibold text-slate-700">{applicationCode}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Đóng cửa sổ xác nhận"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5 p-5 sm:p-6">
            <div id="withdraw-application-warning" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
              <p className="text-sm leading-6">
                Sau khi xác nhận, hồ sơ sẽ được chuyển sang trạng thái <strong>Đã rút hồ sơ</strong>.
                Thao tác này không thể hoàn tác.
              </p>
            </div>

            <fieldset disabled={isSubmitting}>
              <legend className="mb-2 text-sm font-semibold text-slate-800">
                Vui lòng chọn lý do rút hồ sơ <span className="text-rose-600">*</span>
              </legend>
              <div className="space-y-2">
                {WITHDRAWAL_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition ${
                      selectedReason === reason
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-900'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="withdrawalReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => {
                        setSelectedReason(reason);
                        setError('');
                      }}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    {reason}
                  </label>
                ))}
              </div>
            </fieldset>

            {isCustomReason && (
              <div>
                <label htmlFor="withdrawal-custom-reason" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Lý do cụ thể <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="withdrawal-custom-reason"
                  value={customReason}
                  onChange={(event) => {
                    setCustomReason(event.target.value);
                    setError('');
                  }}
                  maxLength={MAX_REASON_LENGTH}
                  rows={3}
                  disabled={isSubmitting}
                  placeholder="Nhập lý do bạn muốn rút hồ sơ..."
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'withdrawal-error' : 'withdrawal-reason-count'}
                  className="w-full resize-y rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                />
                <p id="withdrawal-reason-count" className="mt-1 text-right text-xs text-slate-400">
                  {customReason.length}/{MAX_REASON_LENGTH}
                </p>
              </div>
            )}

            {error && (
              <p id="withdrawal-error" role="alert" className="text-sm font-medium text-rose-600">
                {error}
              </p>
            )}
            {requestError && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {requestError}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Đang xử lý…' : 'Xác nhận rút hồ sơ'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default WithdrawApplicationModal;
