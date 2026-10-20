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
  Share2,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import type { JobPostingData } from '../../services/jobPostingService';
import {
  formatSalaryDisplay,
  formatEmploymentType,
  formatJobLevel,
  getDeadlineStatus,
  isJobApplicationUnavailable,
} from '../../services/jobPostingService';
import { useToast } from '../notifications/useToast';
import JobDeadlineBadge from './JobDeadlineBadge';
import JobExpiredBanner from './JobExpiredBanner';
import PublicJobApplyForm from './PublicJobApplyForm';

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

  const { notify } = useToast();

  const [isSaved, setIsSaved] = useState<boolean>(() => {
    try {
      const savedJobs = JSON.parse(localStorage.getItem('saved_public_jobs') || '[]');
      return Array.isArray(savedJobs) && job?.id ? savedJobs.includes(job.id) : false;
    } catch {
      return false;
    }
  });

  const handleToggleSave = () => {
    if (!job?.id) return;
    try {
      const savedJobs: string[] = JSON.parse(localStorage.getItem('saved_public_jobs') || '[]');
      let updated: string[];
      if (isSaved) {
        updated = savedJobs.filter((id) => id !== job.id);
        setIsSaved(false);
        notify('Đã bỏ lưu tin tuyển dụng khỏi danh sách quan tâm.', 'info');
      } else {
        updated = [...savedJobs, job.id];
        setIsSaved(true);
        notify('Đã lưu tin tuyển dụng thành công!', 'success');
      }
      localStorage.setItem('saved_public_jobs', JSON.stringify(updated));
    } catch {
      setIsSaved(!isSaved);
    }
  };

  const handleShare = async () => {
    if (!job) return;
    const shareData = {
      title: `${job.title} | Tuyển dụng`,
      text: `Ứng tuyển ngay vị trí ${job.title} - Mức lương: ${formatSalaryDisplay(job)}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        notify('Chia sẻ tin tuyển dụng thành công!', 'success');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(window.location.href);
          notify('Đã sao chép liên kết tin tuyển dụng vào bộ nhớ tạm!', 'success');
        }
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      notify('Đã sao chép liên kết tin tuyển dụng vào bộ nhớ tạm!', 'success');
    }
  };

  if (!isOpen || !job) return null;

  const salaryText = formatSalaryDisplay(job);
  const employmentTypeText = formatEmploymentType(job.employmentType);
  const levelText = formatJobLevel(job.level);
  const deadlineInfo = getDeadlineStatus(job.deadline);
  const applicationUnavailable = isJobApplicationUnavailable(job);
  const applicationUnavailableText = job.status === 'CLOSED' || job.publishCareerPage === false
    ? 'Tin tuyển dụng đã được gỡ.'
    : 'Vị trí tuyển dụng này đã đóng, vui lòng tham khảo các vị trí khác.';



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
              {/* Huy hiệu trạng thái hạn nộp hồ sơ (AC1) */}
              <JobDeadlineBadge
                deadline={job.deadline}
                size="sm"
                customText={job.status === 'CLOSED' || job.publishCareerPage === false ? 'Đã gỡ' : undefined}
              />
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

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              data-testid="modal-share-button"
              onClick={handleShare}
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-indigo-600 transition active:scale-95"
              aria-label="Chia sẻ tin tuyển dụng"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              data-testid="modal-save-button"
              onClick={handleToggleSave}
              className={`flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition active:scale-95 ${
                isSaved ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
              aria-label={isSaved ? 'Đã lưu tin' : 'Lưu tin tuyển dụng'}
            >
              {isSaved ? <BookmarkCheck className="h-5 w-5 fill-rose-600" /> : <Bookmark className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition active:scale-95"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          {/* Banner thông báo khi tin hết hạn (AC2) */}
          {applicationUnavailable && (
            <JobExpiredBanner message={applicationUnavailableText} />
          )}
          {isApplying ? (
            <PublicJobApplyForm
              job={job}
              isModalOrDrawer={true}
              onCancel={() => setIsApplying(false)}
            />
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
        {!isApplying && (
          <div className="flex items-center justify-between border-t border-slate-100 p-6 bg-slate-50/50">
            <div className="text-xs text-slate-500">
              Cần hỗ trợ tuyển dụng? Liên hệ:{' '}
              <a href="mailto:hr@company.com" className="font-semibold text-indigo-600 hover:underline">
                hr@company.com
              </a>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                data-testid="modal-footer-save-button"
                onClick={handleToggleSave}
                aria-label={isSaved ? 'Đã lưu tin' : 'Lưu tin'}
                className={`flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border transition active:scale-95 ${
                  isSaved
                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isSaved ? <BookmarkCheck className="h-5 w-5 fill-rose-600" /> : <Bookmark className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 transition"
              >
                Đóng
              </button>
              <button
                type="button"
                data-testid="modal-apply-button"
                disabled={applicationUnavailable}
                onClick={() => !applicationUnavailable && setIsApplying(true)}
                className={`inline-flex min-h-[48px] items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition ${
                  applicationUnavailable
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none active:scale-100'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30 hover:from-indigo-700 hover:to-violet-700 active:scale-95'
                }`}
              >
                <Send className="h-4 w-4" />
                {applicationUnavailable
                  ? job.status === 'CLOSED' || job.publishCareerPage === false
                    ? 'Tin đã được gỡ'
                    : 'Đã hết hạn ứng tuyển'
                  : 'Ứng tuyển vị trí này'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetailModal;
