import React, { useState } from 'react';
import { AlertTriangle, Loader2, Mail, X } from 'lucide-react';
import { candidateStageService, type RejectCandidatePayload } from '../../services/candidateStageService';
import { toast } from '../notifications';

const REJECTION_REASONS = [
  'Không phù hợp với tiêu chí tuyển dụng',
  'Không đạt vòng sàng lọc hồ sơ',
  'Không đạt phỏng vấn',
  'Từ chối offer',
  'Vị trí đã tuyển đủ',
  'Lý do khác',
];

export interface RejectCandidateModalProps {
  candidateId: string;
  candidateName: string;
  applicationId?: string;
  onClose: () => void;
  onSuccess: (payload: RejectCandidatePayload) => void;
}

export const RejectCandidateModal: React.FC<RejectCandidateModalProps> = ({
  candidateId,
  candidateName,
  applicationId,
  onClose,
  onSuccess,
}) => {
  const [reasonOption, setReasonOption] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const reason = reasonOption === 'Lý do khác' ? customReason.trim() : reasonOption;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reason) {
      setErrorMessage('Vui lòng chọn hoặc nhập lý do từ chối.');
      return;
    }
    const payload: RejectCandidatePayload = { applicationId, reason, sendEmail };
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await candidateStageService.rejectCandidate(candidateId, payload);
      toast.success(`Đã cập nhật trạng thái từ chối cho ${candidateName}.`);
      onSuccess(payload);
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể từ chối ứng viên.';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-candidate-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-rose-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-rose-50 p-2 text-rose-600"><AlertTriangle className="h-5 w-5" /></span>
            <div>
              <h2 id="reject-candidate-title" className="text-lg font-bold text-slate-900">Từ chối ứng viên</h2>
              <p className="mt-1 text-sm text-slate-500">{candidateName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="Đóng" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <p className="rounded-lg bg-amber-50 px-3.5 py-3 text-sm leading-5 text-amber-900">
            Ứng viên sẽ được chuyển sang trạng thái từ chối. Vui lòng chọn lý do để lưu lại trong hồ sơ.
          </p>

          <div>
            <label htmlFor="reject-candidate-reason" className="mb-1.5 block text-sm font-semibold text-slate-700">Lý do từ chối</label>
            <select
              id="reject-candidate-reason"
              value={reasonOption}
              onChange={(event) => {
                setReasonOption(event.target.value);
                setErrorMessage('');
              }}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100"
            >
              <option value="" disabled>Chọn lý do</option>
              {REJECTION_REASONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          {reasonOption === 'Lý do khác' && (
            <div>
              <label htmlFor="reject-candidate-custom-reason" className="mb-1.5 block text-sm font-semibold text-slate-700">Nhập lý do</label>
              <textarea
                id="reject-candidate-custom-reason"
                rows={3}
                maxLength={1000}
                required
                value={customReason}
                onChange={(event) => setCustomReason(event.target.value)}
                placeholder="Nhập lý do từ chối cụ thể..."
                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100"
              />
            </div>
          )}

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3.5">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(event) => setSendEmail(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800"><Mail className="h-4 w-4 text-slate-500" /> Gửi email thông báo cho ứng viên</span>
              <span className="mt-1 block text-xs text-slate-500">Yêu cầu hệ thống gửi email từ chối tự động sau khi cập nhật trạng thái.</span>
            </span>
          </label>

          {errorMessage && <p role="alert" className="text-sm font-medium text-rose-600">{errorMessage}</p>}

          <footer className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Hủy</button>
            <button type="submit" disabled={isSubmitting || !reason} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Đang cập nhật...' : 'Xác nhận từ chối'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};

export default RejectCandidateModal;
