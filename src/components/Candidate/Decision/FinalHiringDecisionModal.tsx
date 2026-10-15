import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Archive,
  DollarSign,
  Calendar,
  Clock,
  Send,
  Loader2,
  Mail,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import type {
  FinalHiringDecisionStatus,
  FinalHiringDecisionRecord,
  StandardizedRejectionReason,
  DecisionValidationErrors,
} from '../../../types/candidateEvaluationSummary';
import { STANDARDIZED_REJECTION_REASONS } from '../../../types/candidateEvaluationSummary';
import {
  formatCurrencyVND,
  validateFinalHiringDecision,
} from '../../../utils/candidateEvaluationSummaryHelper';
import { candidateEvaluationSummaryService } from '../../../services/candidateEvaluationSummaryService';
import { useToast } from '../../notifications/useToast';

export interface FinalHiringDecisionModalProps {
  isOpen: boolean;
  initialDecisionType?: FinalHiringDecisionStatus;
  candidateId: string;
  candidateName: string;
  candidateCode?: string;
  jobTitle?: string;
  expectedSalary?: number;
  expectedSalaryFormatted?: string;
  onClose: () => void;
  onSuccess?: (decision: FinalHiringDecisionRecord) => void;
}

export const FinalHiringDecisionModal: React.FC<FinalHiringDecisionModalProps> = ({
  isOpen,
  initialDecisionType = 'OFFER',
  candidateId,
  candidateName,
  candidateCode,
  jobTitle,
  expectedSalary = 35000000,
  expectedSalaryFormatted,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useToast();

  // 1. Loại quyết định hiện tại: OFFER | REJECT | TALENT_POOL (AC 1)
  const [decisionType, setDecisionType] = useState<FinalHiringDecisionStatus>(initialDecisionType);

  // 2. Dữ liệu form trường hợp Chấp thuận (Make Offer - AC 2)
  const [offeredSalary, setOfferedSalary] = useState<number>(expectedSalary || 35000000);
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [responseDeadline, setResponseDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [probationMonths, setProbationMonths] = useState<number>(2);
  const [sendOfferEmail, setSendOfferEmail] = useState<boolean>(true);

  // 3. Dữ liệu form trường hợp Từ chối (Reject - AC 3)
  const [rejectionReason, setRejectionReason] = useState<StandardizedRejectionReason>(
    'Chưa đáp ứng chuyên môn kỹ thuật'
  );
  const [sendRejectionEmail, setSendRejectionEmail] = useState<boolean>(true);

  // 4. Dữ liệu trường hợp Talent Pool & Ghi chú chung
  const [talentPoolCategory, setTalentPoolCategory] = useState<string>('Frontend & UI/UX Specialist');
  const [notes, setNotes] = useState<string>('');

  // 5. Validation & Trạng thái tải (AC 4)
  const [validationErrors, setValidationErrors] = useState<DecisionValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Đồng bộ lại loại quyết định khi mở modal hoặc thay đổi prop
  useEffect(() => {
    if (isOpen) {
      setDecisionType(initialDecisionType);
      setValidationErrors({});
    }
  }, [isOpen, initialDecisionType]);

  if (!isOpen) return null;

  // Xử lý submit ra quyết định (AC 4)
  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate dữ liệu theo từng loại quyết định
    const validation = validateFinalHiringDecision(decisionType, {
      offeredSalary,
      startDate,
      responseDeadline,
      rejectionReason,
      notes,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors({});
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
        decisionPayload.responseDeadline = responseDeadline;
        decisionPayload.probationMonths = probationMonths;
        decisionPayload.sendOfferEmail = sendOfferEmail;
      } else if (decisionType === 'REJECT') {
        decisionPayload.rejectionReason = rejectionReason;
        decisionPayload.rejectionEmailSent = sendRejectionEmail;
      } else if (decisionType === 'TALENT_POOL') {
        decisionPayload.talentPoolCategory = talentPoolCategory;
      }

      // Gọi API cập nhật quyết định tuyển dụng (AC 4)
      await candidateEvaluationSummaryService.updateCandidateDecision(
        candidateId,
        decisionPayload
      );

      // Hiển thị thông báo Toast tiếng Việt thành công (AC 4)
      if (decisionType === 'OFFER') {
        addToast({
          type: 'success',
          message: `Đã phê duyệt đề nghị tuyển dụng (Offer: ${formatCurrencyVND(offeredSalary)}) cho ứng viên ${candidateName} thành công!`,
        });
      } else if (decisionType === 'REJECT') {
        addToast({
          type: 'success',
          message: `Đã ghi nhận quyết định từ chối hồ sơ ứng viên ${candidateName} với lý do: "${rejectionReason}".`,
        });
      } else {
        addToast({
          type: 'success',
          message: `Đã lưu hồ sơ ứng viên ${candidateName} vào kho dữ liệu tiềm năng.`,
        });
      }

      if (onSuccess) {
        onSuccess(decisionPayload);
      }
      onClose();
    } catch (err: unknown) {
      console.error('Lỗi khi cập nhật quyết định tuyển dụng:', err);
      addToast({
        type: 'error',
        message: 'Đã xảy ra lỗi khi gửi quyết định tuyển dụng. Vui lòng thử lại.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="final-hiring-decision-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* 1. Modal Header (AC 1) */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-850/60">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Xác nhận quyết định tuyển dụng cuối cùng</span>
            </h2>
            <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{candidateName}</span>
              {candidateCode && <span>• Mã: {candidateCode}</span>}
              {jobTitle && <span>• {jobTitle}</span>}
            </div>
          </div>

          <button
            type="button"
            data-testid="btn-close-decision-modal"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2. Bộ chọn loại quyết định (Tabs Selector - AC 1) */}
        <div className="border-b border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="tablist">
            {/* Tab: Chấp thuận (Make Offer) */}
            <button
              type="button"
              data-testid="tab-decision-offer"
              onClick={() => {
                setDecisionType('OFFER');
                setValidationErrors({});
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
                decisionType === 'OFFER'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Chấp thuận (Make Offer)</span>
            </button>

            {/* Tab: Từ chối (Reject) */}
            <button
              type="button"
              data-testid="tab-decision-reject"
              onClick={() => {
                setDecisionType('REJECT');
                setValidationErrors({});
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
                decisionType === 'REJECT'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              <XCircle className="h-4 w-4" />
              <span>Từ chối (Reject)</span>
            </button>

            {/* Tab: Lưu kho tiềm năng (Talent Pool) */}
            <button
              type="button"
              data-testid="tab-decision-talent-pool"
              onClick={() => {
                setDecisionType('TALENT_POOL');
                setValidationErrors({});
              }}
              className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
                decisionType === 'TALENT_POOL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
              }`}
            >
              <Archive className="h-4 w-4" />
              <span>Kho tiềm năng</span>
            </button>
          </div>
        </div>

        {/* 3. Form nhập liệu chi tiết */}
        <form onSubmit={handleSubmitDecision} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TRƯỜNG HỢP 1: CHẤP THUẬN (MAKE OFFER - AC 2) */}
          {decisionType === 'OFFER' && (
            <div data-testid="form-offer-section" className="space-y-4">
              <div className="rounded-xl bg-emerald-50/60 p-3 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300">
                Gửi đề nghị tuyển dụng chính thức. Hệ thống sẽ tự động cập nhật trạng thái hồ sơ sang giai đoạn <strong>Đề xuất offer</strong>.
              </div>

              {/* Mức lương đề xuất (Offer Salary) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Mức lương đề xuất chính thức (VNĐ/tháng) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    data-testid="input-offered-salary"
                    step="500000"
                    min="1000000"
                    value={offeredSalary}
                    onChange={(e) => {
                      setOfferedSalary(Number(e.target.value));
                      if (validationErrors.offeredSalary) {
                        setValidationErrors((prev) => ({ ...prev, offeredSalary: undefined }));
                      }
                    }}
                    className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm font-bold text-gray-900 focus:outline-hidden focus:ring-2 dark:bg-gray-800 dark:text-white ${
                      validationErrors.offeredSalary
                        ? 'border-rose-400 focus:ring-rose-500/20'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-gray-700'
                    }`}
                  />
                </div>
                {validationErrors.offeredSalary && (
                  <p data-testid="error-offered-salary" className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {validationErrors.offeredSalary}
                  </p>
                )}
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Bằng chữ: {formatCurrencyVND(offeredSalary)}
                  </span>
                  {expectedSalaryFormatted && (
                    <span>Lương kỳ vọng: {expectedSalaryFormatted}</span>
                  )}
                </div>
              </div>

              {/* Ngày dự kiến gia nhập & Hạn chót phản hồi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Ngày dự kiến gia nhập (Onboarding Date) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Ngày dự kiến gia nhập (Onboarding) *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      data-testid="input-start-date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (validationErrors.startDate) {
                          setValidationErrors((prev) => ({ ...prev, startDate: undefined }));
                        }
                      }}
                      className={`w-full rounded-xl border py-2 pl-9 pr-3 text-xs text-gray-900 focus:outline-hidden focus:ring-2 dark:bg-gray-800 dark:text-white ${
                        validationErrors.startDate
                          ? 'border-rose-400 focus:ring-rose-500/20'
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-gray-700'
                      }`}
                    />
                  </div>
                  {validationErrors.startDate && (
                    <p data-testid="error-start-date" className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                      {validationErrors.startDate}
                    </p>
                  )}
                </div>

                {/* Hạn chót phản hồi offer */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Hạn chót phản hồi offer *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      data-testid="input-response-deadline"
                      value={responseDeadline}
                      onChange={(e) => {
                        setResponseDeadline(e.target.value);
                        if (validationErrors.responseDeadline) {
                          setValidationErrors((prev) => ({ ...prev, responseDeadline: undefined }));
                        }
                      }}
                      className={`w-full rounded-xl border py-2 pl-9 pr-3 text-xs text-gray-900 focus:outline-hidden focus:ring-2 dark:bg-gray-800 dark:text-white ${
                        validationErrors.responseDeadline
                          ? 'border-rose-400 focus:ring-rose-500/20'
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-gray-700'
                      }`}
                    />
                  </div>
                  {validationErrors.responseDeadline && (
                    <p data-testid="error-response-deadline" className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                      {validationErrors.responseDeadline}
                    </p>
                  )}
                </div>
              </div>

              {/* Thời gian thử việc */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Thời gian thử việc
                </label>
                <select
                  data-testid="select-probation-months"
                  value={probationMonths}
                  onChange={(e) => setProbationMonths(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2 px-3 text-xs text-gray-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value={2}>2 tháng thử việc (Hưởng 85% lương cơ bản)</option>
                  <option value={1}>1 tháng thử việc (Vị trí chuyên gia chuyển đổi)</option>
                  <option value={0}>Không thử việc (Ký hợp đồng chính thức ngay)</option>
                </select>
              </div>

              {/* Checkbox gửi email Offer Letter (AC 2) */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="checkbox-send-offer-email"
                  data-testid="checkbox-send-offer-email"
                  checked={sendOfferEmail}
                  onChange={(e) => setSendOfferEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label
                  htmlFor="checkbox-send-offer-email"
                  className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  <span>Chuẩn bị gửi thư mời nhận việc (Offer Letter) qua email</span>
                </label>
              </div>
            </div>
          )}

          {/* TRƯỜNG HỢP 2: TỪ CHỐI (REJECT - AC 3) */}
          {decisionType === 'REJECT' && (
            <div data-testid="form-reject-section" className="space-y-4">
              <div className="rounded-xl bg-rose-50/60 p-3 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span>
                  Bắt buộc ghi nhận lý do từ chối chuẩn hóa để phục vụ báo cáo chất lượng tuyển dụng và đo lường tỷ lệ chuyển đổi.
                </span>
              </div>

              {/* Dropdown Lý do từ chối chính (AC 3) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Lý do từ chối chính *
                </label>
                <select
                  data-testid="select-rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value as StandardizedRejectionReason);
                    if (validationErrors.rejectionReason) {
                      setValidationErrors((prev) => ({ ...prev, rejectionReason: undefined }));
                    }
                  }}
                  className={`w-full rounded-xl border bg-white py-2 px-3 text-xs text-gray-900 focus:outline-hidden focus:ring-2 dark:bg-gray-800 dark:text-white ${
                    validationErrors.rejectionReason
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-gray-700'
                  }`}
                >
                  {STANDARDIZED_REJECTION_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
                {validationErrors.rejectionReason && (
                  <p data-testid="error-rejection-reason" className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {validationErrors.rejectionReason}
                  </p>
                )}
              </div>

              {/* Checkbox Gửi thư từ chối cảm ơn (AC 3) */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="checkbox-send-rejection-email"
                  data-testid="checkbox-send-rejection-email"
                  checked={sendRejectionEmail}
                  onChange={(e) => setSendRejectionEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <label
                  htmlFor="checkbox-send-rejection-email"
                  className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  <span>Gửi thư từ chối cảm ơn (Rejection Email) lịch sự đến ứng viên</span>
                </label>
              </div>
            </div>
          )}

          {/* TRƯỜNG HỢP 3: TALENT POOL */}
          {decisionType === 'TALENT_POOL' && (
            <div data-testid="form-talent-pool-section" className="space-y-4">
              <div className="rounded-xl bg-amber-50/60 p-3 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
                Lưu trữ hồ sơ ứng viên vào Kho tiềm năng. Hệ thống sẽ đề xuất hồ sơ này khi phát sinh đợt tuyển dụng tương đồng.
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Phân nhóm chuyên môn (Talent Category) *
                </label>
                <input
                  type="text"
                  data-testid="input-talent-category"
                  value={talentPoolCategory}
                  onChange={(e) => setTalentPoolCategory(e.target.value)}
                  placeholder="VD: Senior Frontend, Technical Architect..."
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white py-2 px-3 text-xs text-gray-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Ghi chú chi tiết phản hồi nội bộ (Internal Notes) - AC 3 */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Ghi chú chi tiết phản hồi nội bộ {rejectionReason === 'Lý do khác' && decisionType === 'REJECT' && '* (Bắt buộc)'}
            </label>
            <textarea
              rows={3}
              data-testid="textarea-decision-notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (validationErrors.notes) {
                  setValidationErrors((prev) => ({ ...prev, notes: undefined }));
                }
              }}
              placeholder={
                decisionType === 'REJECT'
                  ? 'Nhập chi tiết đánh giá chưa đạt hoặc lý do nội bộ của hội đồng...'
                  : 'Nhập ghi chú điều khoản đặc biệt hoặc phê duyệt của Ban Giám Đốc...'
              }
              className={`w-full rounded-xl border bg-white p-3 text-xs text-gray-900 focus:outline-hidden focus:ring-2 dark:bg-gray-800 dark:text-white ${
                validationErrors.notes
                  ? 'border-rose-400 focus:ring-rose-500/20'
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-gray-700'
              }`}
            />
            {validationErrors.notes && (
              <p data-testid="error-decision-notes" className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                {validationErrors.notes}
              </p>
            )}
          </div>

          {/* 4. Footer Buttons (AC 4) */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              data-testid="btn-cancel-decision"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              data-testid="btn-confirm-final-decision"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md transition-all active:scale-98 cursor-pointer ${
                decisionType === 'OFFER'
                  ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-500/20'
                  : decisionType === 'REJECT'
                  ? 'bg-rose-600 hover:bg-rose-700 ring-2 ring-rose-500/20'
                  : 'bg-amber-600 hover:bg-amber-700 ring-2 ring-amber-500/20'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>
                    {decisionType === 'OFFER' && 'Xác nhận gửi Offer'}
                    {decisionType === 'REJECT' && 'Xác nhận Từ chối'}
                    {decisionType === 'TALENT_POOL' && 'Lưu vào Kho tiềm năng'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FinalHiringDecisionModal;
