import React, { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Banknote,
  CheckCircle2,
  Send,
  FileText,
  Sparkles,
} from 'lucide-react';
import type { JobPostingData } from '../../services/jobPostingService';
import {
  formatSalaryDisplay,
  formatEmploymentType,
  formatJobLevel,
  getDeadlineStatus,
} from '../../services/jobPostingService';
import { useToast } from '../notifications/useToast';

export interface JobDetailModalProps {
  job: JobPostingData | null;
  isOpen: boolean;
  onClose: () => void;
  initialApplyMode?: boolean;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  initialApplyMode = false,
}) => {
  const [isApplying, setIsApplying] = useState(initialApplyMode);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [candidateNote, setCandidateNote] = useState('');
  const [cvFileName, setCvFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  const { notify } = useToast();

  if (!isOpen || !job) return null;

  const salaryText = formatSalaryDisplay(job);
  const employmentTypeText = formatEmploymentType(job.employmentType);
  const levelText = formatJobLevel(job.level);
  const deadlineInfo = getDeadlineStatus(job.deadline);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCvFileName(file.name);
    }
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !candidateEmail.trim() || !candidatePhone.trim()) {
      notify('Vui lòng điền đầy đủ họ tên, email và số điện thoại.', 'error');
      return;
    }

    setIsSubmitting(true);
    // Simulate sending application to backend
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmittedSuccess(true);
      notify('Nộp hồ sơ ứng tuyển thành công! Nhà tuyển dụng sẽ sớm liên hệ với bạn.', 'success');
    }, 800);
  };

  const handleResetForm = () => {
    setIsApplying(false);
    setIsSubmittedSuccess(false);
    setCandidateName('');
    setCandidateEmail('');
    setCandidatePhone('');
    setCandidateNote('');
    setCvFileName('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      data-testid="job-detail-modal"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-6 sm:p-8 bg-slate-50/50">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              {job.departmentName && (
                <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200/50">
                  {job.departmentName}
                </span>
              )}
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/50">
                {employmentTypeText}
              </span>
              <span className="rounded-lg bg-slate-200/70 px-2.5 py-1 text-xs font-medium text-slate-700">
                {levelText}
              </span>
              {deadlineInfo.isUrgent && (
                <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 border border-rose-200/60">
                  {deadlineInfo.text}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {job.title}
            </h2>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 pt-1">
              <div className="flex items-center gap-1.5 font-medium">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{job.workLocation}</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                <Banknote className="h-4 w-4 text-emerald-500" />
                <span>{salaryText}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Hạn nộp: {deadlineInfo.text}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition focus:outline-none"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          {isSubmittedSuccess ? (
            <div className="py-12 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                Ứng tuyển thành công!
              </h3>
              <p className="mx-auto max-w-md text-sm text-slate-600 leading-relaxed">
                Hồ sơ của bạn cho vị trí{' '}
                <strong className="text-slate-900">{job.title}</strong> đã được chuyển trực tiếp
                đến bộ phận nhân sự. Chúng tôi sẽ liên hệ lại qua email hoặc số điện thoại trong vòng 2-3 ngày làm việc.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    handleResetForm();
                    onClose();
                  }}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          ) : isApplying ? (
            /* Application Form */
            <form onSubmit={handleSubmitApplication} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Send className="h-5 w-5 text-indigo-600" />
                  Nộp hồ sơ ứng tuyển vị trí này
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Điền các thông tin cá nhân và đính kèm CV để chúng tôi có thể liên hệ phỏng vấn.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700" htmlFor="cand-name">
                    Họ và tên *
                  </label>
                  <input
                    id="cand-name"
                    type="text"
                    required
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700" htmlFor="cand-email">
                    Địa chỉ Email *
                  </label>
                  <input
                    id="cand-email"
                    type="email"
                    required
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700" htmlFor="cand-phone">
                    Số điện thoại *
                  </label>
                  <input
                    id="cand-phone"
                    type="tel"
                    required
                    value={candidatePhone}
                    onChange={(e) => setCandidatePhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700" htmlFor="cand-cv">
                    Đính kèm tệp CV (PDF / DOCX)
                  </label>
                  <div className="relative">
                    <input
                      id="cand-cv"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-3 py-2 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>
                  {cvFileName && (
                    <p className="mt-1 text-xs text-emerald-600 font-medium">✓ Đã chọn: {cvFileName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700" htmlFor="cand-note">
                  Lời nhắn / Giới thiệu bản thân (không bắt buộc)
                </label>
                <textarea
                  id="cand-note"
                  rows={3}
                  value={candidateNote}
                  onChange={(e) => setCandidateNote(e.target.value)}
                  placeholder="Chia sẻ thêm về kinh nghiệm hoặc lý do bạn mong muốn gia nhập công ty..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsApplying(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Quay lại xem JD
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  Gửi hồ sơ ngay
                </button>
              </div>
            </form>
          ) : (
            /* Job Description Details */
            <div className="space-y-8">
              {/* Skills required */}
              {job.skills && job.skills.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Kỹ năng yêu cầu
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200/50"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 1. Job Description */}
              <div>
                <h4 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  Mô tả công việc
                </h4>
                <div className="whitespace-pre-line text-sm text-slate-600 leading-relaxed rounded-2xl bg-slate-50/60 p-5 border border-slate-100">
                  {job.jobDescription || 'Chưa có thông tin mô tả chi tiết.'}
                </div>
              </div>

              {/* 2. Requirements */}
              <div>
                <h4 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Yêu cầu ứng viên
                </h4>
                <div className="whitespace-pre-line text-sm text-slate-600 leading-relaxed rounded-2xl bg-slate-50/60 p-5 border border-slate-100">
                  {job.requirements || 'Chưa có thông tin yêu cầu chi tiết.'}
                </div>
              </div>

              {/* 3. Benefits */}
              <div>
                <h4 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Quyền lợi &amp; Đãi ngộ
                </h4>
                <div className="whitespace-pre-line text-sm text-slate-600 leading-relaxed rounded-2xl bg-slate-50/60 p-5 border border-slate-100">
                  {job.benefits || 'Mức lương cạnh tranh, tháng 13, thưởng dự án, bảo hiểm sức khỏe toàn diện.'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!isSubmittedSuccess && !isApplying && (
          <div className="flex items-center justify-between border-t border-slate-100 p-6 bg-slate-50/50">
            <div className="text-xs text-slate-500">
              Cần hỗ trợ tuyển dụng? Liên hệ:{' '}
              <a href="mailto:hr@company.com" className="font-semibold text-indigo-600 hover:underline">
                hr@company.com
              </a>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => setIsApplying(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700"
              >
                <Send className="h-4 w-4" />
                Ứng tuyển vị trí này
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetailModal;
