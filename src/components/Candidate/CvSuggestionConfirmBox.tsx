import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  AlertCircle,
  FileText,
  User,
  Mail,
  Phone,
  RefreshCw,
  Loader2,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import type {
  CandidateProfile,
  CvSuggestedCandidateInfo,
  CvParsingStatus,
} from '../../types/candidate';

export interface CvSuggestionConfirmBoxProps {
  candidateProfile: CandidateProfile;
  onApplySuggestion: (confirmedData: CvSuggestedCandidateInfo) => Promise<void> | void;
  onDismissSuggestion: () => Promise<void> | void;
  onRetryParsing?: () => Promise<void> | void;
  isProcessing?: boolean;
  className?: string;
}

export const CvSuggestionConfirmBox: React.FC<CvSuggestionConfirmBoxProps> = ({
  candidateProfile,
  onApplySuggestion,
  onDismissSuggestion,
  onRetryParsing,
  isProcessing = false,
  className = '',
}) => {
  const currentParsingStatus: CvParsingStatus = candidateProfile.cvParsingStatus;
  const suggestedInfo = candidateProfile.cvSuggestedInfo;

  // Quản lý trạng thái nhập liệu cục bộ để Recruiter có thể chỉnh sửa trước khi xác nhận áp dụng
  const [editableFullName, setEditableFullName] = useState<string>(
    suggestedInfo?.fullName || ''
  );
  const [editableEmail, setEditableEmail] = useState<string>(
    suggestedInfo?.email || ''
  );
  const [editablePhoneNumber, setEditablePhoneNumber] = useState<string>(
    suggestedInfo?.phone || ''
  );
  const [validationErrorMessage, setValidationErrorMessage] = useState<string>('');

  // Theo dõi ID hoặc thời điểm trích xuất để cập nhật dữ liệu khi chuyển đổi ứng viên
  const [previousProfileId, setPreviousProfileId] = useState<string>(
    candidateProfile.id
  );
  if (previousProfileId !== candidateProfile.id) {
    setPreviousProfileId(candidateProfile.id);
    setEditableFullName(suggestedInfo?.fullName || '');
    setEditableEmail(suggestedInfo?.email || '');
    setEditablePhoneNumber(suggestedInfo?.phone || '');
    setValidationErrorMessage('');
  }

  // Kiểm tra sự khác biệt giữa dữ liệu gợi ý (sau chỉnh sửa) và dữ liệu hồ sơ hiện tại
  const hasNameChanged: boolean =
    editableFullName.trim() !== candidateProfile.fullName.trim();
  const hasEmailChanged: boolean =
    editableEmail.trim() !== candidateProfile.email.trim();
  const hasPhoneChanged: boolean =
    editablePhoneNumber.trim() !== candidateProfile.phone.trim();
  const hasAnyDifference: boolean =
    hasNameChanged || hasEmailChanged || hasPhoneChanged;

  const handleResetToExtractedValues = () => {
    if (suggestedInfo) {
      setEditableFullName(suggestedInfo.fullName || '');
      setEditableEmail(suggestedInfo.email || '');
      setEditablePhoneNumber(suggestedInfo.phone || '');
      setValidationErrorMessage('');
    }
  };

  const handleConfirmCvSuggestion = async (
    eventElement: React.MouseEvent<HTMLButtonElement>
  ) => {
    eventElement.preventDefault();

    const trimmedFullName = editableFullName.trim();
    const trimmedEmail = editableEmail.trim();
    const trimmedPhoneNumber = editablePhoneNumber.trim();

    // Xác thực tối thiểu để đảm bảo Recruiter không áp dụng dữ liệu trống
    if (!trimmedFullName) {
      setValidationErrorMessage('Họ và tên không được để trống.');
      return;
    }
    if (!trimmedEmail) {
      setValidationErrorMessage('Địa chỉ email không được để trống.');
      return;
    }
    if (!trimmedPhoneNumber) {
      setValidationErrorMessage('Số điện thoại không được để trống.');
      return;
    }

    setValidationErrorMessage('');

    const confirmedPayload: CvSuggestedCandidateInfo = {
      fullName: trimmedFullName,
      email: trimmedEmail,
      phone: trimmedPhoneNumber,
      confidenceScore: suggestedInfo?.confidenceScore,
      extractedAt: suggestedInfo?.extractedAt || new Date().toISOString(),
      rawSnippet: suggestedInfo?.rawSnippet,
    };

    await onApplySuggestion(confirmedPayload);
  };

  const handleDismissCvSuggestion = async (
    eventElement: React.MouseEvent<HTMLButtonElement>
  ) => {
    eventElement.preventDefault();
    await onDismissSuggestion();
  };

  const handleRetryCvParsing = async (
    eventElement: React.MouseEvent<HTMLButtonElement>
  ) => {
    eventElement.preventDefault();
    if (onRetryParsing) {
      await onRetryParsing();
    }
  };

  // 1. TRẠNG THÁI: ĐANG ĐỌC DỮ LIỆU TỪ TỆP CV PDF (PARSING)
  if (currentParsingStatus === 'PARSING') {
    return (
      <div
        className={`rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/40 p-5 shadow-xs dark:border-blue-900/40 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 ${className}`}
        aria-live="polite"
      >
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Hệ thống đang trích xuất dữ liệu từ CV PDF...
              </h4>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                Đang xử lý
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Công nghệ bóc tách văn bản đang tự động đọc thông tin Họ tên, Email và Số điện thoại từ tệp{' '}
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {candidateProfile.cvFileName || 'CV của ứng viên'}
              </span>
              . Quá trình này thường diễn ra trong vài giây.
            </p>

            {/* Skeleton giả lập nạp dữ liệu */}
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="h-9 animate-pulse rounded-lg bg-blue-100/60 dark:bg-blue-900/30" />
              <div className="h-9 animate-pulse rounded-lg bg-blue-100/60 dark:bg-blue-900/30" />
              <div className="h-9 animate-pulse rounded-lg bg-blue-100/60 dark:bg-blue-900/30" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. TRẠNG THÁI: ĐỌC THẤT BẠI / XẢY RA LỖI (FAILED)
  // Thiết kế hiển thị nhẹ nhàng, tinh tế, không làm vỡ bố cục hồ sơ
  if (currentParsingStatus === 'FAILED') {
    return (
      <div
        className={`rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20 ${className}`}
        role="alert"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Chưa thể tự động đọc dữ liệu từ tệp CV
              </h4>
              <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                {candidateProfile.cvParsingErrorMessage ||
                  'Tệp CV có thể là định dạng ảnh chụp scan hoặc không thể trích xuất tự động văn bản. Bạn vẫn có thể nhập tay thông tin trực tiếp vào hồ sơ.'}
              </p>
            </div>
          </div>

          {onRetryParsing && (
            <button
              type="button"
              id="retry-cv-parsing-btn"
              onClick={handleRetryCvParsing}
              disabled={isProcessing}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-100 focus:ring-2 focus:ring-amber-400 focus:outline-hidden disabled:opacity-50 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`}
              />
              Thử đọc lại CV
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. TRẠNG THÁI: ĐÃ XÁC NHẬN DỮ LIỆU TỪ CV (CONFIRMED)
  if (currentParsingStatus === 'CONFIRMED') {
    return (
      <div
        className={`rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/20 ${className}`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  Đã xác nhận dữ liệu gợi ý từ CV
                </h4>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Đã đồng bộ
                </span>
              </div>
              <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                Thông tin hồ sơ ứng viên đã được đối chiếu và chuẩn hóa theo dữ liệu từ tệp CV.
              </p>
            </div>
          </div>

          {suggestedInfo?.confidenceScore && (
            <div className="text-xs text-emerald-700 dark:text-emerald-400">
              Độ tin cậy: <span className="font-semibold">{Math.round(suggestedInfo.confidenceScore * 100)}%</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. TRẠNG THÁI: ĐÃ BỎ QUA GỢI Ý (DISMISSED)
  if (currentParsingStatus === 'DISMISSED') {
    return (
      <div
        className={`rounded-xl border border-gray-200 bg-gray-50/70 p-4 shadow-xs dark:border-gray-700 dark:bg-gray-800/40 ${className}`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Đã bỏ qua dữ liệu gợi ý từ CV
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hồ sơ đang giữ nguyên thông tin ban đầu do ứng viên nhập.
              </p>
            </div>
          </div>

          {onRetryParsing && (
            <button
              type="button"
              onClick={handleRetryCvParsing}
              disabled={isProcessing}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Xem lại gợi ý từ CV
            </button>
          )}
        </div>
      </div>
    );
  }

  // 5. TRẠNG THÁI: CÓ DỮ LIỆU GỢI Ý CHỜ XÁC NHẬN (PENDING_CONFIRMATION)
  // Đây là màn hình chính của Subtask TKNHTTDNB1-331
  return (
    <section
      aria-label="Khu vực xác nhận dữ liệu gợi ý từ CV"
      className={`overflow-hidden rounded-xl border border-indigo-200 bg-white shadow-sm ring-1 ring-indigo-500/10 dark:border-indigo-900/60 dark:bg-gray-900 ${className}`}
    >
      {/* Header khu vực gợi ý */}
      <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-white px-5 py-3.5 dark:border-indigo-900/40 dark:from-indigo-950/40 dark:via-blue-950/20 dark:to-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Dữ liệu gợi ý đọc từ tệp CV
                </h3>
                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  Chờ Recruiter xác nhận
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Đối chiếu thông tin hiện tại với dữ liệu trích xuất từ CV. Bạn có thể sửa trực tiếp ô gợi ý trước khi áp dụng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {suggestedInfo?.confidenceScore && (
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-800">
                {`Độ chính xác: ${Math.round(suggestedInfo.confidenceScore * 100)}%`}
              </span>
            )}
            <button
              type="button"
              onClick={handleResetToExtractedValues}
              title="Khôi phục lại dữ liệu gốc bóc tách từ CV"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <RotateCcw className="h-3 w-3" />
              Đặt lại gốc
            </button>
          </div>
        </div>
      </div>

      {/* Thông báo lỗi validation cục bộ nếu có */}
      {validationErrorMessage && (
        <div className="border-b border-rose-200 bg-rose-50 px-5 py-2 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {validationErrorMessage}
        </div>
      )}

      {/* Bảng đối chiếu so sánh trực quan 2 cột */}
      <div className="p-5">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Cột 1: Thông tin hiện tại của hồ sơ */}
          <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/40">
            <div className="mb-3 flex items-center justify-between border-b border-gray-200/80 pb-2 dark:border-gray-700">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Thông tin hồ sơ hiện tại
              </span>
              <span className="text-xs text-gray-400">Chỉ đọc</span>
            </div>

            <div className="space-y-3.5">
              {/* Họ tên hiện tại */}
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  Họ và tên
                </label>
                <div
                  id="current-candidate-fullname"
                  className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  {candidateProfile.fullName || '(Chưa có thông tin)'}
                </div>
              </div>

              {/* Email hiện tại */}
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  Địa chỉ Email
                </label>
                <div
                  id="current-candidate-email"
                  className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  {candidateProfile.email || '(Chưa có thông tin)'}
                </div>
              </div>

              {/* Số điện thoại hiện tại */}
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  Số điện thoại
                </label>
                <div
                  id="current-candidate-phone"
                  className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  {candidateProfile.phone || '(Chưa có thông tin)'}
                </div>
              </div>
            </div>
          </div>

          {/* Cột 2: Dữ liệu gợi ý từ CV (Cho phép Recruiter sửa trực tiếp) */}
          <div className="rounded-lg border border-indigo-200 bg-indigo-50/30 p-4 ring-1 ring-indigo-400/20 dark:border-indigo-800 dark:bg-indigo-950/20">
            <div className="mb-3 flex items-center justify-between border-b border-indigo-200/60 pb-2 dark:border-indigo-800/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                Gợi ý từ tệp CV (Có thể chỉnh sửa)
              </span>
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                Cho phép nhập
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Họ tên gợi ý */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="suggested-candidate-fullname-input"
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    <User className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    Họ và tên gợi ý
                  </label>
                  {hasNameChanged && (
                    <span className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                      Khác hiện tại
                    </span>
                  )}
                </div>
                <input
                  id="suggested-candidate-fullname-input"
                  type="text"
                  value={editableFullName}
                  onChange={(changeEvent) =>
                    setEditableFullName(changeEvent.target.value)
                  }
                  placeholder="Nhập họ và tên gợi ý..."
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:ring-2 focus:outline-hidden dark:bg-gray-900 dark:text-gray-100 ${
                    hasNameChanged
                      ? 'border-indigo-400 ring-1 ring-indigo-300 focus:border-indigo-600 focus:ring-indigo-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700'
                  }`}
                />
              </div>

              {/* Email gợi ý */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="suggested-candidate-email-input"
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    <Mail className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    Email gợi ý
                  </label>
                  {hasEmailChanged && (
                    <span className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                      Khác hiện tại
                    </span>
                  )}
                </div>
                <input
                  id="suggested-candidate-email-input"
                  type="email"
                  value={editableEmail}
                  onChange={(changeEvent) =>
                    setEditableEmail(changeEvent.target.value)
                  }
                  placeholder="Nhập email gợi ý..."
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:ring-2 focus:outline-hidden dark:bg-gray-900 dark:text-gray-100 ${
                    hasEmailChanged
                      ? 'border-indigo-400 ring-1 ring-indigo-300 focus:border-indigo-600 focus:ring-indigo-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700'
                  }`}
                />
              </div>

              {/* Số điện thoại gợi ý */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="suggested-candidate-phone-input"
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    <Phone className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    Số điện thoại gợi ý
                  </label>
                  {hasPhoneChanged && (
                    <span className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                      Khác hiện tại
                    </span>
                  )}
                </div>
                <input
                  id="suggested-candidate-phone-input"
                  type="tel"
                  value={editablePhoneNumber}
                  onChange={(changeEvent) =>
                    setEditablePhoneNumber(changeEvent.target.value)
                  }
                  placeholder="Nhập số điện thoại gợi ý..."
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:ring-2 focus:outline-hidden dark:bg-gray-900 dark:text-gray-100 ${
                    hasPhoneChanged
                      ? 'border-indigo-400 ring-1 ring-indigo-300 focus:border-indigo-600 focus:ring-indigo-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Trích đoạn từ CV (nếu có) */}
        {suggestedInfo?.rawSnippet && (
          <div className="mt-4 rounded-md bg-gray-50 p-2.5 text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Đoạn trích từ CV:
            </span>{' '}
            <span className="italic">"{suggestedInfo.rawSnippet}"</span>
          </div>
        )}
      </div>

      {/* Footer chứa nút Xác nhận áp dụng và Bỏ qua */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/80 px-5 py-3 dark:border-gray-800 dark:bg-gray-900/60">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {hasAnyDifference ? (
            <span className="flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
              <ArrowRight className="h-3.5 w-3.5" />
              Sẽ cập nhật các trường có sự khác biệt vào hồ sơ ứng viên
            </span>
          ) : (
            <span>Dữ liệu gợi ý khớp với thông tin hiện tại</span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Nút Bỏ qua gợi ý */}
          <button
            type="button"
            id="dismiss-cv-suggestion-btn"
            onClick={handleDismissCvSuggestion}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-2xs transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-300 focus:outline-hidden disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <X className="h-3.5 w-3.5 text-gray-500" />
            Bỏ qua
          </button>

          {/* Nút Xác nhận áp dụng */}
          <button
            type="button"
            id="confirm-cv-suggestion-btn"
            onClick={handleConfirmCvSuggestion}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            {isProcessing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Xác nhận áp dụng
          </button>
        </div>
      </div>
    </section>
  );
};

export default CvSuggestionConfirmBox;
