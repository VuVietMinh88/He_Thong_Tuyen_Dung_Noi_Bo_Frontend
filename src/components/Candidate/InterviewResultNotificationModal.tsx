import { useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, Mail, X } from 'lucide-react';
import { toast } from '../notifications';
import {
  interviewEvaluationService,
  type InterviewResult,
  type InterviewResultStage,
} from '../../services/interviewEvaluationService';

interface InterviewResultNotificationModalProps {
  candidateId: string;
  candidateName: string;
  applicationId?: string;
  initialResult?: InterviewResult;
  initialStage: InterviewResultStage;
  initialRejectionReason?: string;
  onClose: () => void;
  onSuccess: (result: InterviewResult, stage: InterviewResultStage) => void;
}

const createEmailTemplate = (
  result: InterviewResult,
  candidateName: string,
  reason: string,
): { subject: string; message: string } => {
  if (result === 'PASSED') {
    return {
      subject: 'Thông báo kết quả phỏng vấn',
      message: `Chào ${candidateName},\n\nCảm ơn bạn đã tham gia buổi phỏng vấn. Chúng tôi vui mừng thông báo bạn đã đạt vòng phỏng vấn và sẽ liên hệ bạn về các bước tiếp theo.\n\nTrân trọng,\nPhòng Tuyển dụng`,
    };
  }

  return {
    subject: 'Thông báo kết quả ứng tuyển',
    message: `Chào ${candidateName},\n\nCảm ơn bạn đã dành thời gian tham gia phỏng vấn. Rất tiếc, chúng tôi chưa thể tiếp tục hồ sơ của bạn ở vị trí này.${reason ? `\n\nGhi chú: ${reason}` : ''}\n\nChúc bạn sớm tìm được cơ hội phù hợp.\n\nTrân trọng,\nPhòng Tuyển dụng`,
  };
};

export default function InterviewResultNotificationModal({
  candidateId,
  candidateName,
  applicationId,
  initialResult = 'PASSED',
  initialStage,
  initialRejectionReason = '',
  onClose,
  onSuccess,
}: InterviewResultNotificationModalProps) {
  const [result, setResult] = useState<InterviewResult>(initialResult);
  const initialTemplate = createEmailTemplate(initialResult, candidateName, initialRejectionReason);
  const [subject, setSubject] = useState(initialTemplate.subject);
  const [message, setMessage] = useState(initialTemplate.message);
  const [rejectionReason, setRejectionReason] = useState(initialRejectionReason);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleResultChange = (nextResult: InterviewResult) => {
    setResult(nextResult);
    const template = createEmailTemplate(nextResult, candidateName, rejectionReason);
    setSubject(template.subject);
    setMessage(template.message);
    setErrorMessage('');
  };

  const handleRejectionReasonChange = (value: string) => {
    setRejectionReason(value);
    if (result === 'FAILED') {
      setMessage(createEmailTemplate('FAILED', candidateName, value).message);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (!subject.trim() || !message.trim()) {
      setErrorMessage('Vui lòng nhập tiêu đề và nội dung email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await interviewEvaluationService.sendResult(candidateId, {
        applicationId,
        result,
        stage: result === 'FAILED' ? 'REJECTED' : initialStage === 'REJECTED' ? 'OFFER' : initialStage,
        subject,
        message,
        ...(result === 'FAILED' && rejectionReason.trim()
          ? { rejectionReason: rejectionReason.trim() }
          : {}),
        sendEmail: true,
      });
      if (!response.emailSent) {
        throw new Error('Hồ sơ đã được cập nhật nhưng máy chủ chưa xác nhận gửi email.');
      }
      toast.success(
        result === 'PASSED'
          ? `Đã gửi thông báo đạt phỏng vấn cho ${candidateName}.`
          : `Đã gửi thông báo kết quả phỏng vấn cho ${candidateName}.`,
      );
      onSuccess(response.result, response.stage);
      onClose();
    } catch (error: unknown) {
      const messageText =
        error instanceof Error ? error.message : 'Không thể gửi thông báo kết quả phỏng vấn.';
      setErrorMessage(messageText);
      toast.error(messageText);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="interview-result-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700">
              <Mail className="h-4 w-4" aria-hidden="true" />
              Gửi kết quả phỏng vấn
            </span>
            <h2 id="interview-result-title" className="mt-1 text-xl font-bold text-slate-900">
              Thông báo cho {candidateName}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Chọn mẫu email, kiểm tra nội dung và xác nhận gửi. Kết quả hồ sơ sẽ được cập nhật cùng lúc.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div>
            <label htmlFor="interview-result-template" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Mẫu thông báo
            </label>
            <select
              id="interview-result-template"
              value={result}
              onChange={(event) => handleResultChange(event.target.value as InterviewResult)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
            >
              <option value="PASSED">Đạt phỏng vấn</option>
              <option value="FAILED">Không đạt / Từ chối</option>
            </select>
          </div>

          {result === 'FAILED' && (
            <div>
              <label htmlFor="interview-result-reason" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Lý do / ghi chú nội bộ (tuỳ chọn)
              </label>
              <textarea
                id="interview-result-reason"
                rows={2}
                maxLength={1000}
                value={rejectionReason}
                onChange={(event) => handleRejectionReasonChange(event.target.value)}
                disabled={isSubmitting}
                placeholder="Ví dụ: Chưa đáp ứng yêu cầu chuyên môn của vòng phỏng vấn."
                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
              />
            </div>
          )}

          <div>
            <label htmlFor="interview-result-subject" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Tiêu đề email <span className="text-rose-600">*</span>
            </label>
            <input
              id="interview-result-subject"
              required
              maxLength={200}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
            />
          </div>

          <div>
            <label htmlFor="interview-result-message" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Nội dung email <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="interview-result-message"
              required
              rows={9}
              maxLength={10000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={isSubmitting}
              className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
            />
          </div>

          {errorMessage && (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          )}

          <footer className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !subject.trim() || !message.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
              {isSubmitting ? 'Đang gửi...' : 'Gửi email và cập nhật kết quả'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
