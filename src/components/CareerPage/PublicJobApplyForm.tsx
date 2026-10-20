import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Send,
  Sparkles,
  Briefcase,
  Building2,
  MapPin,
  ShieldCheck,
  RotateCcw,
  Copy,
  Check,
  MailCheck,
} from 'lucide-react';
import {
  APPLICATION_SOURCES,
  CV_FILE_CONFIG,
  formatFileSizeMB,
  validateCvFile,
  validateApplicationForm,
  jobApplicationService,
  DuplicateApplicationError,
  RateLimitExceededError,
  type CandidateApplicationPayload,
  type ApplicationSubmissionResponse,
} from '../../services/jobApplicationService';
import { toast } from '../notifications';

export interface PublicJobApplyFormProps {
  job: {
    id?: string;
    title: string;
    departmentName?: string;
    workLocation?: string;
    employmentType?: string;
  };
  onSuccess?: (submissionResponse: ApplicationSubmissionResponse) => void;
  onCancel?: () => void;
  isModalOrDrawer?: boolean;
}

export type SubmissionErrorCode =
  | 'DUPLICATE_APPLICATION'
  | 'RATE_LIMIT_EXCEEDED'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | null;

export const PublicJobApplyForm: React.FC<PublicJobApplyFormProps> = ({
  job,
  onSuccess,
  onCancel,
  isModalOrDrawer = false,
}) => {
  const notify = (
    notificationMessage: string,
    notificationType: 'success' | 'error' | 'info' | 'warning' = 'info'
  ) => {
    toast[notificationType](notificationMessage);
  };

  // Form input states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('WEBSITE');
  const [coverLetter, setCoverLetter] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);

  // Interaction and validation states
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionErrorCode, setSubmissionErrorCode] = useState<SubmissionErrorCode>(null);

  // Success and tracking states
  const [submitResult, setSubmitResult] =
    useState<ApplicationSubmissionResponse | null>(null);
  const [hasCopiedTrackingCode, setHasCopiedTrackingCode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý kiểm tra và lưu tệp CV được chọn
  const handleProcessSelectedFile = (selectedCandidateFile: File) => {
    const fileValidationResult = validateCvFile(selectedCandidateFile);
    if (!fileValidationResult.isValid) {
      setValidationErrors((previousErrors) => ({
        ...previousErrors,
        cvFile: fileValidationResult.error || 'Tệp không hợp lệ',
      }));
      notify(fileValidationResult.error || 'Tệp CV không hợp lệ.', 'error');
      return;
    }

    setCvFile(selectedCandidateFile);
    setValidationErrors((previousErrors) => {
      const updatedErrors = { ...previousErrors };
      delete updatedErrors.cvFile;
      return updatedErrors;
    });
    setSubmissionError(null);
    notify(
      `Đã chọn tệp CV: ${selectedCandidateFile.name} (${formatFileSizeMB(selectedCandidateFile.size)})`,
      'success'
    );
  };

  const handleFileInputChange = (
    changeEvent: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (changeEvent.target.files && changeEvent.target.files[0]) {
      handleProcessSelectedFile(changeEvent.target.files[0]);
    }
  };

  const handleDragOver = (dragEvent: React.DragEvent) => {
    dragEvent.preventDefault();
    dragEvent.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (dragEvent: React.DragEvent) => {
    dragEvent.preventDefault();
    dragEvent.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (dragEvent: React.DragEvent) => {
    dragEvent.preventDefault();
    dragEvent.stopPropagation();
    setIsDraggingFile(false);
    if (dragEvent.dataTransfer.files && dragEvent.dataTransfer.files[0]) {
      handleProcessSelectedFile(dragEvent.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = (mouseEvent?: React.MouseEvent) => {
    if (mouseEvent) mouseEvent.stopPropagation();
    setCvFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setValidationErrors((previousErrors) => {
      const updatedErrors = { ...previousErrors };
      delete updatedErrors.cvFile;
      return updatedErrors;
    });
  };

  const handleReupload = (mouseEvent?: React.MouseEvent) => {
    if (mouseEvent) mouseEvent.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Sao chép mã theo dõi vào bộ nhớ tạm (Clipboard)
  const copyTrackingCodeToClipboard = async () => {
    if (!submitResult?.trackingCode) return;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(submitResult.trackingCode);
      } else if (typeof document !== 'undefined') {
        const temporaryTextArea = document.createElement('textarea');
        temporaryTextArea.value = submitResult.trackingCode;
        document.body.appendChild(temporaryTextArea);
        temporaryTextArea.select();
        document.execCommand('copy');
        document.body.removeChild(temporaryTextArea);
      }
      setHasCopiedTrackingCode(true);
      notify('Đã sao chép mã theo dõi vào bộ nhớ tạm!', 'success');
      setTimeout(() => {
        setHasCopiedTrackingCode(false);
      }, 3000);
    } catch {
      notify('Không thể tự động sao chép. Vui lòng bôi đen mã để sao chép thủ công.', 'warning');
    }
  };

  // Gửi hồ sơ ứng tuyển
  const handleSubmitCandidateApplication = async (
    formEvent: React.FormEvent
  ) => {
    formEvent.preventDefault();

    const applicationPayload: Partial<CandidateApplicationPayload> = {
      jobId: job.id || 'job-general',
      jobTitle: job.title,
      fullName,
      email,
      phone,
      source,
      coverLetter,
      cvFile: cvFile || undefined,
    };

    const detectedValidationErrors = validateApplicationForm(applicationPayload);
    if (Object.keys(detectedValidationErrors).length > 0) {
      setValidationErrors(detectedValidationErrors);
      const firstErrorMessage = Object.values(detectedValidationErrors)[0];
      notify(firstErrorMessage, 'error');
      return;
    }

    setValidationErrors({});
    setSubmissionError(null);
    setSubmissionErrorCode(null);
    setIsSubmitting(true);

    try {
      const submissionResponse = await jobApplicationService.submitApplication({
        jobId: job.id || 'job-general',
        jobTitle: job.title,
        fullName,
        email,
        phone,
        source,
        coverLetter,
        cvFile: cvFile!,
      });

      setSubmitResult(submissionResponse);
      notify('Hồ sơ ứng tuyển của bạn đã được gửi thành công!', 'success');
      if (onSuccess) {
        onSuccess(submissionResponse);
      }
    } catch (caughtError: unknown) {
      if (caughtError instanceof DuplicateApplicationError) {
        setSubmissionErrorCode('DUPLICATE_APPLICATION');
        setSubmissionError(caughtError.message);
        notify(caughtError.message, 'error');
      } else if (caughtError instanceof RateLimitExceededError) {
        setSubmissionErrorCode('RATE_LIMIT_EXCEEDED');
        setSubmissionError(caughtError.message);
        notify(caughtError.message, 'error');
      } else {
        const fallbackErrorMessage =
          caughtError instanceof Error
            ? caughtError.message
            : 'Đã có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại sau.';
        setSubmissionErrorCode('SERVER_ERROR');
        setSubmissionError(fallbackErrorMessage);
        notify(fallbackErrorMessage, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Làm mới form để ứng tuyển vị trí khác
  const handleResetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setSource('WEBSITE');
    setCoverLetter('');
    setCvFile(null);
    setValidationErrors({});
    setSubmissionError(null);
    setSubmissionErrorCode(null);
    setSubmitResult(null);
    setHasCopiedTrackingCode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // MÀN HÌNH NỘP HỒ SƠ THÀNH CÔNG VÀ HIỂN THỊ MÃ THEO DÕI
  if (submitResult) {
    return (
      <div
        data-testid="apply-success-state"
        className="w-full max-w-xl mx-auto rounded-3xl bg-white p-6 sm:p-8 text-center space-y-6"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50 animate-bounce">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/70 px-3 py-1 text-xs font-bold text-emerald-800">
            <Sparkles className="h-3.5 w-3.5" />
            Hồ sơ đã được tiếp nhận thành công
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Ứng tuyển thành công!
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Cảm ơn bạn <strong className="text-slate-900">{submitResult.candidateName}</strong> đã quan tâm và ứng tuyển vào vị trí{' '}
            <strong className="text-indigo-600">{job.title}</strong>.
          </p>
        </div>

        {/* Khối hiển thị Mã theo dõi hồ sơ (Tracking Code) nổi bật kèm nút sao chép */}
        <div
          data-testid="tracking-code-container"
          className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-violet-50/70 p-5 text-left shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
              Mã tra cứu hồ sơ (Tracking Code)
            </span>
            <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
              Chính thức
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-indigo-100 px-4 py-3">
            <div className="min-w-0">
              <span
                data-testid="tracking-code-value"
                className="font-mono text-lg sm:text-xl font-black tracking-wider text-indigo-700 select-all"
              >
                {submitResult.trackingCode}
              </span>
            </div>

            <button
              type="button"
              data-testid="copy-tracking-code-button"
              onClick={copyTrackingCodeToClipboard}
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs active:scale-95 ${
                hasCopiedTrackingCode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
              title="Sao chép mã theo dõi hồ sơ"
            >
              {hasCopiedTrackingCode ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Sao chép mã</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-600">
            Hãy lưu lại mã tra cứu này để đối soát tiến độ tuyển dụng với phòng nhân sự khi cần thiết.
          </p>
        </div>

        {/* Thông báo gửi email xác nhận */}
        <div
          data-testid="confirmation-email-notice"
          className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-left flex items-start gap-3"
        >
          <MailCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-emerald-950">
            <p className="font-bold">Đã gửi email xác nhận ứng tuyển</p>
            <p className="leading-relaxed">
              Hệ thống đã tự động gửi email thông báo kèm mã tra cứu và tóm tắt hồ sơ tới địa chỉ{' '}
              <strong className="underline underline-offset-2">{submitResult.candidateEmail}</strong>. Vui lòng kiểm tra hộp thư đến (hoặc hòm thư Spam/Quảng cáo).
            </p>
          </div>
        </div>

        {/* Thông tin hồ sơ chi tiết */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-left space-y-2.5 text-xs text-slate-600">
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
            <span className="text-slate-400">Mã định danh hệ thống:</span>
            <span className="font-mono font-bold text-slate-700">{submitResult.applicationId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Thời gian tiếp nhận:</span>
            <span className="font-medium text-slate-700">
              {new Date(submitResult.submittedAt).toLocaleString('vi-VN')}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-indigo-50/60 border border-indigo-100/80 p-3.5 text-left flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-950 leading-relaxed">
            Bộ phận tuyển dụng sẽ xem xét hồ sơ và liên hệ với bạn trong vòng <strong>2-3 ngày làm việc</strong> qua email hoặc số điện thoại bạn đã cung cấp.
          </p>
        </div>

        {/* Action buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          {onCancel && (
            <button
              type="button"
              data-testid="finish-apply-button"
              onClick={onCancel}
              className="w-full sm:flex-1 min-h-[48px] rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 active:scale-[0.99] transition"
            >
              Hoàn tất &amp; Đóng
            </button>
          )}
          <button
            type="button"
            onClick={handleResetForm}
            className="w-full sm:flex-1 min-h-[48px] rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4 text-slate-500" />
            Nộp hồ sơ khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="public-job-apply-form-container"
      className={`w-full max-w-2xl mx-auto rounded-3xl bg-white ${
        isModalOrDrawer ? 'p-1 sm:p-2' : 'p-5 sm:p-7'
      } space-y-6`}
    >
      {/* Header section */}
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
          <Briefcase className="h-3.5 w-3.5" />
          <span>Biểu mẫu nộp hồ sơ ứng tuyển</span>
        </div>
        <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
          {job.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          {job.departmentName && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              {job.departmentName}
            </span>
          )}
          {job.workLocation && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {job.workLocation}
            </span>
          )}
        </div>
      </div>

      {/* Thông báo lỗi khi nộp hồ sơ (HTTP 409 Trùng lặp, HTTP 429 Quá giới hạn, hoặc lỗi máy chủ) */}
      {submissionError && (
        <div
          data-testid="application-error-banner"
          role="alert"
          className={`rounded-2xl border p-4 text-left flex items-start gap-3 transition-all ${
            submissionErrorCode === 'DUPLICATE_APPLICATION'
              ? 'border-amber-300 bg-amber-50/90 text-amber-900'
              : submissionErrorCode === 'RATE_LIMIT_EXCEEDED'
              ? 'border-rose-300 bg-rose-50/90 text-rose-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          {submissionErrorCode === 'RATE_LIMIT_EXCEEDED' ? (
            <Clock className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          ) : submissionErrorCode === 'DUPLICATE_APPLICATION' ? (
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1 flex-1 text-xs">
            <p className="font-extrabold text-sm">
              {submissionErrorCode === 'DUPLICATE_APPLICATION'
                ? 'Hồ sơ đã tồn tại'
                : submissionErrorCode === 'RATE_LIMIT_EXCEEDED'
                ? 'Giới hạn số lần nộp hồ sơ (Chống spam)'
                : 'Không thể gửi hồ sơ'}
            </p>
            <p className="leading-relaxed font-medium">{submissionError}</p>
            <p className="text-[11px] opacity-80 pt-0.5">
              Thông tin bạn đã nhập trên biểu mẫu được giữ nguyên để thuận tiện kiểm tra lại.
            </p>
          </div>
        </div>
      )}

      {/* Form Element */}
      <form onSubmit={handleSubmitCandidateApplication} noValidate className="space-y-5">
        {/* 1. Họ và tên */}
        <div>
          <label
            htmlFor="cand-fullname"
            className="block text-xs font-bold text-slate-700 mb-1.5"
          >
            Họ và tên <span className="text-rose-500">*</span>
          </label>
          <input
            id="cand-fullname"
            name="fullName"
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(changeEvent) => {
              setFullName(changeEvent.target.value);
              if (validationErrors.fullName) {
                setValidationErrors((previousErrors) => {
                  const updatedErrors = { ...previousErrors };
                  delete updatedErrors.fullName;
                  return updatedErrors;
                });
              }
            }}
            placeholder="Ví dụ: Nguyễn Văn A"
            className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-[16px] sm:text-sm text-slate-900 outline-none transition focus:ring-2 ${
              validationErrors.fullName
                ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-100'
                : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
            }`}
          />
          {validationErrors.fullName && (
            <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {validationErrors.fullName}
            </p>
          )}
        </div>

        {/* 2. Email & 3. Phone */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Email */}
          <div>
            <label
              htmlFor="cand-email"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Địa chỉ Email <span className="text-rose-500">*</span>
            </label>
            <input
              id="cand-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(changeEvent) => {
                setEmail(changeEvent.target.value);
                if (validationErrors.email) {
                  setValidationErrors((previousErrors) => {
                    const updatedErrors = { ...previousErrors };
                    delete updatedErrors.email;
                    return updatedErrors;
                  });
                }
              }}
              placeholder="ungvien@example.com"
              className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-[16px] sm:text-sm text-slate-900 outline-none transition focus:ring-2 ${
                validationErrors.email
                  ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-100'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
              }`}
            />
            {validationErrors.email && (
              <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Số điện thoại */}
          <div>
            <label
              htmlFor="cand-phone"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Số điện thoại <span className="text-rose-500">*</span>
            </label>
            <input
              id="cand-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(changeEvent) => {
                setPhone(changeEvent.target.value);
                if (validationErrors.phone) {
                  setValidationErrors((previousErrors) => {
                    const updatedErrors = { ...previousErrors };
                    delete updatedErrors.phone;
                    return updatedErrors;
                  });
                }
              }}
              placeholder="0912 345 678"
              className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-[16px] sm:text-sm text-slate-900 outline-none transition focus:ring-2 ${
                validationErrors.phone
                  ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-100'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
              }`}
            />
            {validationErrors.phone && (
              <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {validationErrors.phone}
              </p>
            )}
          </div>
        </div>

        {/* 4. Nguồn biết tin */}
        <div>
          <label
            htmlFor="cand-source"
            className="block text-xs font-bold text-slate-700 mb-1.5"
          >
            Nguồn biết tin <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              id="cand-source"
              name="source"
              required
              value={source}
              onChange={(changeEvent) => {
                setSource(changeEvent.target.value);
                if (validationErrors.source) {
                  setValidationErrors((previousErrors) => {
                    const updatedErrors = { ...previousErrors };
                    delete updatedErrors.source;
                    return updatedErrors;
                  });
                }
              }}
              className={`w-full min-h-[44px] rounded-xl border bg-white px-3.5 py-2.5 text-[16px] sm:text-sm text-slate-900 outline-none transition focus:ring-2 ${
                validationErrors.source
                  ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-100'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
              }`}
            >
              {APPLICATION_SOURCES.map((sourceItem) => (
                <option key={sourceItem.value} value={sourceItem.value}>
                  {sourceItem.label}
                </option>
              ))}
            </select>
          </div>
          {validationErrors.source && (
            <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {validationErrors.source}
            </p>
          )}
        </div>

        {/* 5. Tệp CV (Khu vực kéo thả và bấm chọn) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="cand-cv-file"
              className="block text-xs font-bold text-slate-700"
            >
              Tệp CV ứng tuyển <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400">Tối đa 10MB</span>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            id="cand-cv-file"
            name="cvFile"
            type="file"
            accept={CV_FILE_CONFIG.ACCEPT_ATTRIBUTE}
            onChange={handleFileInputChange}
            className="hidden"
          />

          {!cvFile ? (
            /* Khu vực kéo thả / Bấm chọn */
            <div
              data-testid="cv-dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(keyboardEvent) => {
                if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                  keyboardEvent.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                isDraggingFile
                  ? 'border-indigo-600 bg-indigo-50/60 scale-[1.01]'
                  : validationErrors.cvFile
                  ? 'border-rose-300 bg-rose-50/30 hover:border-rose-400'
                  : 'border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/20'
              }`}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 mb-3 shadow-xs">
                <UploadCloud className="h-7 w-7" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                <span className="text-indigo-600 underline underline-offset-2">Nhấp để chọn tệp</span> hoặc kéo thả vào đây
              </p>

              {/* Văn bản hướng dẫn quy định rõ ràng */}
              <p className="mt-1.5 text-xs text-slate-500 font-medium">
                {CV_FILE_CONFIG.RULE_TEXT}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Hỗ trợ chọn tệp từ điện thoại di động và máy tính
              </p>
            </div>
          ) : (
            /* Khi đã chọn file: Hiển thị tên file, dung lượng MB và nút xóa / chọn lại */
            <div
              data-testid="selected-cv-file-card"
              className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-bold text-slate-900" title={cvFile.name}>
                        {cvFile.name}
                      </p>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    </div>
                    <p className="text-xs font-semibold text-indigo-700">
                      Dung lượng: {formatFileSizeMB(cvFile.size)}
                    </p>
                  </div>
                </div>

                {/* Nút Xóa / Chọn lại */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleReupload}
                    title="Chọn tệp khác"
                    className="flex min-h-[44px] items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <span>Đổi tệp</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    title="Xóa tệp này"
                    className="flex h-11 w-11 min-h-[44px] items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {validationErrors.cvFile && (
            <p className="mt-2 flex items-center gap-1 text-xs text-rose-600 font-medium">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {validationErrors.cvFile}
            </p>
          )}
        </div>

        {/* 6. Thư giới thiệu (tùy chọn) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="cand-coverletter"
              className="block text-xs font-bold text-slate-700"
            >
              Thư giới thiệu / Lời nhắn
            </label>
            <span className="text-[11px] text-slate-400">Không bắt buộc</span>
          </div>
          <textarea
            id="cand-coverletter"
            name="coverLetter"
            rows={3}
            value={coverLetter}
            onChange={(changeEvent) => setCoverLetter(changeEvent.target.value)}
            placeholder="Giới thiệu tóm tắt về kinh nghiệm, thế mạnh bản thân hoặc lý do bạn phù hợp với vị trí này..."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[16px] sm:text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Nút hành động */}
        <div className="pt-2 flex flex-col-reverse sm:flex-row items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[48px] px-5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Hủy bỏ
            </button>
          )}

          <button
            type="submit"
            data-testid="submit-application-button"
            disabled={isSubmitting}
            className="w-full sm:flex-1 min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Đang xử lý hồ sơ...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Nộp hồ sơ ứng tuyển</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PublicJobApplyForm;
