import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Send,
  Sparkles,
  Briefcase,
  Building2,
  MapPin,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import {
  APPLICATION_SOURCES,
  CV_FILE_CONFIG,
  formatFileSizeMB,
  validateCvFile,
  validateApplicationForm,
  jobApplicationService,
  type CandidateApplicationPayload,
  type ApplicationSubmitResult,
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
  onSuccess?: (result: ApplicationSubmitResult) => void;
  onCancel?: () => void;
  isModalOrDrawer?: boolean;
}

export const PublicJobApplyForm: React.FC<PublicJobApplyFormProps> = ({
  job,
  onSuccess,
  onCancel,
  isModalOrDrawer = false,
}) => {
  const notify = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    toast[type](message);
  };

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('WEBSITE');
  const [coverLetter, setCoverLetter] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);

  // Interaction states
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<ApplicationSubmitResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File selection & validation handler
  const handleProcessFile = (file: File) => {
    const validation = validateCvFile(file);
    if (!validation.isValid) {
      setErrors((prev) => ({ ...prev, cvFile: validation.error || 'Tệp không hợp lệ' }));
      notify(validation.error || 'Tệp CV không hợp lệ.', 'error');
      return;
    }

    setCvFile(file);
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.cvFile;
      return updated;
    });
    notify(`Đã chọn tệp CV: ${file.name} (${formatFileSizeMB(file.size)})`, 'success');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCvFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.cvFile;
      return updated;
    });
  };

  const handleReupload = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Partial<CandidateApplicationPayload> = {
      jobId: job.id || 'job-general',
      jobTitle: job.title,
      fullName,
      email,
      phone,
      source,
      coverLetter,
      cvFile: cvFile || undefined,
    };

    const validationErrors = validateApplicationForm(payload);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0];
      notify(firstError, 'error');
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const result = await jobApplicationService.submitApplication({
        jobId: job.id || 'job-general',
        jobTitle: job.title,
        fullName,
        email,
        phone,
        source,
        coverLetter,
        cvFile: cvFile!,
      });

      setSubmitResult(result);
      notify('Hồ sơ ứng tuyển của bạn đã được gửi thành công!', 'success');
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      notify('Đã có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to apply again
  const handleResetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setSource('WEBSITE');
    setCoverLetter('');
    setCvFile(null);
    setErrors({});
    setSubmitResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // SUCCESS STATE
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
            Hồ sơ đã được tiếp nhận
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Ứng tuyển thành công!
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Cảm ơn bạn <strong className="text-slate-900">{submitResult.candidateName}</strong> đã quan tâm và ứng tuyển vào vị trí{' '}
            <strong className="text-indigo-600">{job.title}</strong>.
          </p>
        </div>

        {/* Application details card */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-left space-y-2.5 text-xs text-slate-600">
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
            <span className="text-slate-400">Mã hồ sơ:</span>
            <span className="font-mono font-bold text-slate-700">{submitResult.applicationId}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
            <span className="text-slate-400">Email nhận thông báo:</span>
            <span className="font-semibold text-slate-800">{submitResult.candidateEmail}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Thời gian nộp:</span>
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

      {/* Form Element */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) {
                setErrors((prev) => {
                  const updated = { ...prev };
                  delete updated.fullName;
                  return updated;
                });
              }
            }}
            placeholder="Ví dụ: Nguyễn Văn A"
            className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-[16px] sm:text-sm text-slate-900 outline-none transition focus:ring-2 ${
              errors.fullName
                ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-100'
                : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
            }`}
          />
          {errors.fullName && (
            <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {errors.fullName}
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
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.email;
                    return updated;
                  });
                }
              }}
              placeholder="ungvien@example.com"
              className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-[16px] sm:text-sm text-slate-900 outline-none transition focus:ring-2 ${
                errors.email
                  ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-100'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
              }`}
            />
            {errors.email && (
              <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errors.email}
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
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) {
                  setErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.phone;
                    return updated;
                  });
                }
              }}
              placeholder="0912 345 678"
              className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-[16px] sm:text-sm text-slate-900 outline-none transition focus:ring-2 ${
                errors.phone
                  ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-100'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
              }`}
            />
            {errors.phone && (
              <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errors.phone}
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
              onChange={(e) => {
                setSource(e.target.value);
                if (errors.source) {
                  setErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.source;
                    return updated;
                  });
                }
              }}
              className={`w-full min-h-[44px] rounded-xl border bg-white px-3.5 py-2.5 text-[16px] sm:text-sm text-slate-900 outline-none transition focus:ring-2 ${
                errors.source
                  ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-100'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
              }`}
            >
              {APPLICATION_SOURCES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          {errors.source && (
            <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {errors.source}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                isDragging
                  ? 'border-indigo-600 bg-indigo-50/60 scale-[1.01]'
                  : errors.cvFile
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

          {errors.cvFile && (
            <p className="mt-2 flex items-center gap-1 text-xs text-rose-600 font-medium">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {errors.cvFile}
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
            onChange={(e) => setCoverLetter(e.target.value)}
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
