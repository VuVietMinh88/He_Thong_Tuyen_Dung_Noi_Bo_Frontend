import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Archive,
  DollarSign,
  Calendar,
  Clock,
  Send,
  Loader2,
} from 'lucide-react';
import type {
  FinalHiringDecisionStatus,
  FinalHiringDecisionRecord,
  CandidateEvaluationSummaryData,
} from '../../../types/candidateEvaluationSummary';
import { formatCurrencyVND } from '../../../utils/candidateEvaluationSummaryHelper';

export interface HiringDecisionModalProps {
  isOpen: boolean;
  decisionType: FinalHiringDecisionStatus;
  candidateSummary: CandidateEvaluationSummaryData;
  onClose: () => void;
  onSubmitDecision: (decision: FinalHiringDecisionRecord) => Promise<void>;
}

export const HiringDecisionModal: React.FC<HiringDecisionModalProps> = ({
  isOpen,
  decisionType,
  candidateSummary,
  onClose,
  onSubmitDecision,
}) => {
  const [offeredSalary, setOfferedSalary] = useState<number>(
    candidateSummary.compensation.expectedSalary || 35000000
  );
  const [startDate, setStartDate] = useState<string>('2026-11-01');
  const [probationMonths, setProbationMonths] = useState<number>(2);
  const [talentPoolCategory, setTalentPoolCategory] = useState<string>('Senior Frontend & Architecture');
  const [rejectionReason, setRejectionReason] = useState<string>(
    'Mức lương kỳ vọng vượt khung ngân sách vị trí'
  );
  const [sendRejectionEmail, setSendRejectionEmail] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const decisionPayload: FinalHiringDecisionRecord = {
        status: decisionType,
        decidedAt: new Date().toISOString(),
        decidedBy: 'Hội đồng Tuyển dụng & Ban Giám Đốc',
        notes: notes.trim(),
      };

      if (decisionType === 'OFFER') {
        decisionPayload.offeredSalary = offeredSalary;
        decisionPayload.offeredSalaryFormatted = formatCurrencyVND(offeredSalary);
        decisionPayload.startDate = startDate;
        decisionPayload.probationMonths = probationMonths;
      } else if (decisionType === 'TALENT_POOL') {
        decisionPayload.talentPoolCategory = talentPoolCategory;
      } else if (decisionType === 'REJECT') {
        decisionPayload.rejectionReason = rejectionReason;
        decisionPayload.rejectionEmailSent = sendRejectionEmail;
      }

      await onSubmitDecision(decisionPayload);
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu quyết định tuyển dụng:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="hiring-decision-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            {decisionType === 'OFFER' && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            )}
            {decisionType === 'TALENT_POOL' && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                <Archive className="h-5 w-5" />
              </div>
            )}
            {decisionType === 'REJECT' && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                <AlertCircle className="h-5 w-5" />
              </div>
            )}

            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {decisionType === 'OFFER' && 'Gửi đề nghị tuyển dụng (Make Offer)'}
                {decisionType === 'TALENT_POOL' && 'Lưu trữ vào kho tiềm năng (Talent Pool)'}
                {decisionType === 'REJECT' && 'Từ chối hồ sơ ứng viên (Reject)'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {candidateSummary.fullName} • {candidateSummary.candidateCode}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 1. Trường hợp: OFFER */}
          {decisionType === 'OFFER' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Mức lương đề xuất chính thức (VNĐ/tháng) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    step="500000"
                    min="1000000"
                    value={offeredSalary}
                    onChange={(e) => setOfferedSalary(Number(e.target.value))}
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm font-semibold text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                  <span>{`Bằng chữ: ${formatCurrencyVND(offeredSalary)}`}</span>
                  <span>{`Kỳ vọng: ${candidateSummary.compensation.expectedSalaryFormatted}`}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Ngày bắt đầu dự kiến *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Thời gian thử việc *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <select
                      value={probationMonths}
                      onChange={(e) => setProbationMonths(Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value={1}>1 tháng (Hưởng 85% hoặc 100% lương)</option>
                      <option value={2}>2 tháng (Quy chuẩn vị trí chuyên gia)</option>
                      <option value={0}>Không thử việc (Ký HĐLĐ chính thức)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Trường hợp: TALENT_POOL */}
          {decisionType === 'TALENT_POOL' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Phân nhóm lưu trữ nhân tài (Talent Category) *
                </label>
                <input
                  type="text"
                  value={talentPoolCategory}
                  onChange={(e) => setTalentPoolCategory(e.target.value)}
                  placeholder="VD: Senior Frontend, Technical Architect..."
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ứng viên sẽ được lưu trữ vào kho dữ liệu để ưu tiên liên hệ lại khi có dự án hoặc vị trí phù hợp trong 12 tháng tới.
              </p>
            </div>
          )}

          {/* 3. Trường hợp: REJECT */}
          {decisionType === 'REJECT' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Lý do từ chối chính *
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="Mức lương kỳ vọng vượt khung ngân sách vị trí">
                    Mức lương kỳ vọng vượt khung ngân sách vị trí
                  </option>
                  <option value="Chưa đáp ứng đủ kinh nghiệm quản lý hoặc chuyên sâu">
                    Chưa đáp ứng đủ kinh nghiệm quản lý hoặc chuyên sâu
                  </option>
                  <option value="Đã chọn được ứng viên khác phù hợp hơn">
                    Đã chọn được ứng viên khác phù hợp hơn
                  </option>
                  <option value="Thời gian bắt đầu làm việc quá dài">
                    Thời gian bắt đầu làm việc quá dài
                  </option>
                  <option value="Lý do khác">Lý do khác</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="send-rejection-email"
                  checked={sendRejectionEmail}
                  onChange={(e) => setSendRejectionEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="send-rejection-email"
                  className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Gửi email cảm ơn và thông báo từ chối lịch sự đến ứng viên
                </label>
              </div>
            </div>
          )}

          {/* Ghi chú chung của Hội đồng */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Ghi chú của Hội đồng / Ban Giám Đốc
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú phê duyệt hoặc căn cứ quyết định..."
              className="w-full rounded-xl border border-gray-300 bg-white p-3 text-xs text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Nút hành động Submit */}
          <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              data-testid="btn-submit-decision"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-all ${
                decisionType === 'OFFER'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : decisionType === 'TALENT_POOL'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>Xác nhận quyết định</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HiringDecisionModal;
