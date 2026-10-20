import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  Briefcase,
  UserCheck,
  Building,
  MapPin,
  Clock,
  Send,
  Loader2,
  ShieldCheck,
  Check,
} from 'lucide-react';
import type { ActiveJobOption, CandidateReferral, CreateReferralPayload } from '../../types/referral';
import { referralService, DuplicateReferralError, InvalidReferralFileError } from '../../services/referral.service';
import { tokenService } from '../../services/token.service';
import { useToast } from '../notifications/useToast';

export interface InternalReferralFormProps {
  onSuccess?: (newReferral: CandidateReferral) => void;
  onCancel?: () => void;
  initialJobId?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const InternalReferralForm: React.FC<InternalReferralFormProps> = ({
  onSuccess,
  onCancel,
  initialJobId,
}) => {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Current logged in user (Người giới thiệu)
  const currentUser = tokenService.getUserData() || {
    id: 'usr-current',
    fullName: 'Nhân sự nội bộ',
    email: 'nhansu@congty.test',
  };

  // State vị trí tuyển dụng
  const [activeJobs, setActiveJobs] = useState<ActiveJobOption[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(true);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || '');

  // State các trường thông tin ứng viên
  const [candidateName, setCandidateName] = useState<string>('');
  const [candidateEmail, setCandidateEmail] = useState<string>('');
  const [candidatePhone, setCandidatePhone] = useState<string>('');
  const [referralNote, setReferralNote] = useState<string>('');
  const [cvFile, setCvFile] = useState<File | null>(null);

  // State kéo thả file
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Validation errors & feedback
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateError, setDuplicateError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);

  // Load danh sách việc làm đang mở tuyển
  useEffect(() => {
    let isCurrent = true;
    setIsLoadingJobs(true);

    referralService
      .getActiveJobOpenings()
      .then((jobs) => {
        if (!isCurrent) return;
        setActiveJobs(jobs);
        if (!selectedJobId && jobs.length > 0) {
          // Mặc định chọn vị trí đầu tiên hoặc giữ nguyên
          if (initialJobId && jobs.some((j) => j.id === initialJobId)) {
            setSelectedJobId(initialJobId);
          }
        }
      })
      .catch(() => {
        if (!isCurrent) return;
        setActiveJobs([]);
      })
      .finally(() => {
        if (isCurrent) setIsLoadingJobs(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [initialJobId]);

  const selectedJob = activeJobs.find((j) => j.id === selectedJobId);

  // Xử lý chọn tệp CV
  const handleFileChange = (file: File | null) => {
    setDuplicateError('');
    if (!file) {
      setCvFile(null);
      return;
    }

    const fileExt = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const isExtensionValid = ['.pdf', '.docx', '.doc'].includes(fileExt);

    if (!isExtensionValid) {
      setErrors((prev) => ({
        ...prev,
        cvFile: 'Chỉ chấp nhận tệp định dạng PDF (.pdf) hoặc Word (.docx).',
      }));
      setCvFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setErrors((prev) => ({
        ...prev,
        cvFile: `Dung lượng tệp (${sizeMB}MB) vượt quá giới hạn 10MB cho phép.`,
      }));
      setCvFile(null);
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.cvFile;
      return next;
    });
    setCvFile(file);
  };

  // Kéo thả file
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Format dung lượng hiển thị
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Validate toàn bộ form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedJobId) {
      newErrors.jobPostingId = 'Vui lòng chọn vị trí tuyển dụng ứng tuyển.';
    }

    const trimmedName = candidateName.trim();
    if (!trimmedName) {
      newErrors.candidateName = 'Vui lòng nhập họ và tên của ứng viên.';
    } else if (trimmedName.length < 2) {
      newErrors.candidateName = 'Họ và tên ứng viên quá ngắn.';
    }

    const trimmedEmail = candidateEmail.trim();
    if (!trimmedEmail) {
      newErrors.candidateEmail = 'Vui lòng nhập địa chỉ email của ứng viên.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      newErrors.candidateEmail = 'Địa chỉ email không đúng định dạng (vd: ungvien@gmail.com).';
    }

    const trimmedPhone = candidatePhone.trim().replace(/[\s.-]/g, '');
    if (!trimmedPhone) {
      newErrors.candidatePhone = 'Vui lòng nhập số điện thoại liên hệ của ứng viên.';
    } else if (!PHONE_REGEX.test(trimmedPhone)) {
      newErrors.candidatePhone = 'Số điện thoại không hợp lệ (cần 10 chữ số, vd: 0912345678).';
    }

    if (!cvFile) {
      newErrors.cvFile = 'Vui lòng đính kèm tệp CV (định dạng PDF hoặc DOCX, tối đa 10MB).';
    }

    const trimmedNote = referralNote.trim();
    if (!trimmedNote) {
      newErrors.referralNote = 'Vui lòng cung cấp lý do giới thiệu và nhận xét mức độ phù hợp.';
    } else if (trimmedNote.length < 10) {
      newErrors.referralNote = 'Ghi chú giới thiệu cần cụ thể hơn (tối thiểu 10 ký tự).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateError('');

    if (!validateForm() || !cvFile) {
      addToast({
        type: 'warning',
        message: 'Vui lòng kiểm tra lại các trường thông tin bắt buộc còn thiếu hoặc chưa hợp lệ.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateReferralPayload = {
        jobPostingId: selectedJobId,
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail.trim(),
        candidatePhone: candidatePhone.trim(),
        referralNote: referralNote.trim(),
        cvFile,
      };

      const result = await referralService.submitReferral(payload, currentUser, selectedJob);

      setIsSubmittedSuccess(true);
      addToast({
        type: 'success',
        message: `Đã nộp hồ sơ giới thiệu cho ứng viên "${result.candidateName}" thành công!`,
      });

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      if (error instanceof DuplicateReferralError) {
        setDuplicateError(error.message);
        addToast({
          type: 'error',
          message: 'Trùng lặp hồ sơ: Ứng viên này đã được giới thiệu cho vị trí này trước đó.',
        });
      } else if (error instanceof InvalidReferralFileError) {
        setErrors((prev) => ({ ...prev, cvFile: error.message }));
        addToast({ type: 'error', message: error.message });
      } else {
        const msg = error instanceof Error ? error.message : 'Lỗi khi nộp hồ sơ giới thiệu.';
        setDuplicateError(msg);
        addToast({ type: 'error', message: msg });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setCandidateName('');
    setCandidateEmail('');
    setCandidatePhone('');
    setReferralNote('');
    setCvFile(null);
    setErrors({});
    setDuplicateError('');
    setIsSubmittedSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (isSubmittedSuccess) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-white p-8 sm:p-10 shadow-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-xs mb-4">
          <Check className="h-8 w-8 stroke-[3]" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">
          Gửi hồ sơ giới thiệu thành công!
        </h3>
        <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          Hệ thống đã tự động gắn nhãn nguồn <strong className="text-indigo-600">"Giới thiệu nội bộ"</strong> kèm thông tin người giới thiệu của bạn. Hồ sơ đã được chuyển tiếp tới Bộ phận Tuyển dụng với trạng thái <strong className="text-blue-600">"Đã nhận"</strong>.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleResetForm}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
          >
            <Send className="h-4 w-4" />
            Giới thiệu ứng viên khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      {/* Tiêu đề biểu mẫu & Thẻ Read-only Nhãn nguồn tự động */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Biểu mẫu giới thiệu ứng viên nội bộ
            </h2>
            <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
              User Story S4-07
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Giới thiệu người quen, đồng nghiệp tiềm năng vào các vị trí đang tuyển để nhận thưởng giới thiệu hấp dẫn.
          </p>
        </div>

        {/* Read-only Badge: Nhãn nguồn & Người giới thiệu tự động */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3 text-xs shadow-2xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-indigo-950 uppercase tracking-wide text-[10px]">
                Nguồn tuyển dụng:
              </span>
              <span className="inline-flex items-center rounded-md bg-indigo-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                Giới thiệu nội bộ (INTERNAL_REFERRAL)
              </span>
            </div>
            <p className="mt-0.5 text-slate-600 font-medium text-[11px]">
              Người giới thiệu: <strong className="text-slate-900">{currentUser.fullName}</strong>{' '}
              <span className="text-slate-400">({currentUser.email})</span>
            </p>
          </div>
        </div>
      </div>

      {/* Thông báo lỗi trùng lặp nếu có */}
      {duplicateError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 shadow-xs"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <p className="font-bold text-rose-900 mb-0.5">Không thể nộp hồ sơ trùng lặp:</p>
            {duplicateError}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* 1. Chọn vị trí đang tuyển */}
        <div>
          <label
            htmlFor="referral-job-select"
            className="block text-xs font-bold uppercase tracking-wide text-slate-800 mb-1.5"
          >
            1. Vị trí tuyển dụng ứng tuyển <span className="text-rose-500">*</span>
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Chỉ hiển thị các tin tuyển dụng đang mở tiếp nhận hồ sơ.
          </p>

          <div className="relative">
            <select
              id="referral-job-select"
              value={selectedJobId}
              onChange={(e) => {
                setSelectedJobId(e.target.value);
                setDuplicateError('');
                if (errors.jobPostingId) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.jobPostingId;
                    return next;
                  });
                }
              }}
              disabled={isLoadingJobs || isSubmitting}
              className={`w-full appearance-none rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 disabled:bg-slate-100 ${
                errors.jobPostingId
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
              }`}
            >
              <option value="">-- Chọn vị trí công việc cần giới thiệu ứng viên --</option>
              {activeJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} — {job.departmentName} [{job.workLocation} | {job.employmentType}]
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>

          {errors.jobPostingId && (
            <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {errors.jobPostingId}
            </p>
          )}

          {/* Card xem nhanh thông tin vị trí đã chọn */}
          {selectedJob && (
            <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3.5 text-xs">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-700">
                <span className="inline-flex items-center gap-1 font-semibold text-indigo-900">
                  <Building className="h-3.5 w-3.5 text-indigo-600" />
                  {selectedJob.departmentName}
                </span>
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {selectedJob.workLocation}
                </span>
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {selectedJob.employmentType}
                </span>
                {selectedJob.salaryText && (
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                    💰 {selectedJob.salaryText}
                  </span>
                )}
                {selectedJob.deadline && (
                  <span className="text-[11px] text-amber-700 font-medium">
                    ⏳ Hạn nộp: {selectedJob.deadline}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Thông tin ứng viên (Họ tên, Email, Số điện thoại) */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 mb-1.5">
            2. Thông tin cá nhân của ứng viên
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Cung cấp thông tin liên hệ chính xác để bộ phận tuyển dụng liên hệ phỏng vấn.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Họ và tên */}
            <div>
              <label
                htmlFor="candidate-name-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Họ và tên ứng viên <span className="text-rose-500">*</span>
              </label>
              <input
                id="candidate-name-input"
                type="text"
                value={candidateName}
                onChange={(e) => {
                  setCandidateName(e.target.value);
                  setDuplicateError('');
                  if (errors.candidateName) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.candidateName;
                      return next;
                    });
                  }
                }}
                placeholder="Ví dụ: Nguyễn Văn Hoàng"
                disabled={isSubmitting}
                className={`w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 ${
                  errors.candidateName
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              {errors.candidateName && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">
                  {errors.candidateName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="candidate-email-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Địa chỉ Email <span className="text-rose-500">*</span>
              </label>
              <input
                id="candidate-email-input"
                type="email"
                value={candidateEmail}
                onChange={(e) => {
                  setCandidateEmail(e.target.value);
                  setDuplicateError('');
                  if (errors.candidateEmail) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.candidateEmail;
                      return next;
                    });
                  }
                }}
                placeholder="ungvien@gmail.com"
                disabled={isSubmitting}
                className={`w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 ${
                  errors.candidateEmail
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              {errors.candidateEmail && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">
                  {errors.candidateEmail}
                </p>
              )}
            </div>

            {/* Số điện thoại */}
            <div>
              <label
                htmlFor="candidate-phone-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Số điện thoại liên hệ <span className="text-rose-500">*</span>
              </label>
              <input
                id="candidate-phone-input"
                type="tel"
                value={candidatePhone}
                onChange={(e) => {
                  setCandidatePhone(e.target.value);
                  setDuplicateError('');
                  if (errors.candidatePhone) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.candidatePhone;
                      return next;
                    });
                  }
                }}
                placeholder="0912345678"
                disabled={isSubmitting}
                className={`w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 ${
                  errors.candidatePhone
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              {errors.candidatePhone && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">
                  {errors.candidatePhone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 3. Tệp CV đính kèm (Drag & Drop, PDF/DOCX, <= 10MB) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-800 mb-1.5">
            3. Tệp hồ sơ ứng viên (CV đính kèm) <span className="text-rose-500">*</span>
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Hỗ trợ kéo thả hoặc chọn file. Chỉ chấp nhận định dạng <strong>PDF</strong> hoặc <strong>DOCX</strong>, dung lượng tối đa <strong>10MB</strong>.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileChange(e.target.files[0]);
              }
            }}
            className="hidden"
            id="cv-file-upload-input"
          />

          {!cvFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
                  : errors.cvFile
                  ? 'border-rose-300 bg-rose-50/20 hover:bg-rose-50/40'
                  : 'border-slate-300 bg-slate-50/60 hover:border-indigo-400 hover:bg-slate-50'
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs text-indigo-600 mb-3 border border-slate-200">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Kéo thả tệp CV vào đây hoặc <span className="text-indigo-600 hover:underline">duyệt tệp từ máy tính</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Chỉ nhận file .PDF, .DOCX (Dung lượng không quá 10MB)
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate" title={cvFile.name}>
                    {cvFile.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {formatFileSize(cvFile.size)} • Định dạng hợp lệ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => handleFileChange(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-rose-600 transition"
                  title="Gỡ tệp"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {errors.cvFile && (
            <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {errors.cvFile}
            </p>
          )}
        </div>

        {/* 4. Ghi chú giới thiệu (Referral Note) */}
        <div>
          <label
            htmlFor="referral-note-textarea"
            className="block text-xs font-bold uppercase tracking-wide text-slate-800 mb-1.5 flex items-center justify-between"
          >
            <span>
              4. Ghi chú &amp; Đánh giá giới thiệu <span className="text-rose-500">*</span>
            </span>
            <span className="text-[10px] font-normal text-slate-400">
              {referralNote.length} ký tự
            </span>
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Nêu rõ mối quan hệ với ứng viên (đồng nghiệp cũ, bạn bè...), điểm mạnh nổi bật hoặc lý do đề xuất ứng viên cho vị trí này.
          </p>

          <textarea
            id="referral-note-textarea"
            rows={4}
            value={referralNote}
            onChange={(e) => {
              setReferralNote(e.target.value);
              if (errors.referralNote) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.referralNote;
                  return next;
                });
              }
            }}
            placeholder="Ví dụ: Anh Hoàng là đồng nghiệp cũ của tôi tại dự án X, có 4 năm kinh nghiệm React/TypeScript, làm việc cẩn thận, tinh thần trách nhiệm cao và giao tiếp tốt..."
            disabled={isSubmitting}
            className={`w-full rounded-xl border bg-slate-50 p-3.5 text-xs text-slate-800 outline-none transition focus:bg-white focus:ring-2 ${
              errors.referralNote
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
                : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
            }`}
          />
          {errors.referralNote && (
            <p className="mt-1 text-[11px] font-medium text-rose-600">
              {errors.referralNote}
            </p>
          )}
        </div>

        {/* Cam kết bảo mật & Nút hành động */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500 flex items-start gap-2.5">
          <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <p className="font-semibold text-slate-700">Tuân thủ chính sách bảo mật dữ liệu nhân sự:</p>
            Thông tin ứng viên được cam kết bảo mật theo quy định nội bộ. Bạn có thể theo dõi tiến độ xử lý hồ sơ ở 4 trạng thái chuẩn hóa mà không làm ảnh hưởng đến tính khách quan của hội đồng tuyển dụng.
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-98 disabled:opacity-50 transition cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang xử lý nộp hồ sơ...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Gửi hồ sơ giới thiệu ứng viên</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InternalReferralForm;
