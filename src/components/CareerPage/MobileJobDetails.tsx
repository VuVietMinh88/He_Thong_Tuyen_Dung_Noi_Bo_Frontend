import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Share2,
  Bookmark,
  BookmarkCheck,
  MapPin,
  Calendar,
  Banknote,
  Users,
  Layers,
  FileText,
  CheckCircle2,
  Sparkles,
  Mail,
  Phone,
  Building2,
  Clock,
  Send,
  ChevronRight,
} from 'lucide-react';
import type { JobPostingData } from '../../services/jobPostingService';
import {
  formatSalaryDisplay,
  formatEmploymentType,
  formatJobLevel,
  getDeadlineStatus,
  isJobApplicationUnavailable,
} from '../../services/jobPostingService';
import { toast } from '../notifications';
import JobDeadlineBadge from './JobDeadlineBadge';
import JobExpiredBanner from './JobExpiredBanner';
import PublicJobApplyForm from './PublicJobApplyForm';

export interface MobileJobDetailsProps {
  job: JobPostingData;
  onBack?: () => void;
  onApplySuccess?: () => void;
}

export const MobileJobDetails: React.FC<MobileJobDetailsProps> = ({
  job,
  onBack,
  onApplySuccess,
}) => {
  const notify = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    toast[type](message);
  };

  // State: Lưu tin tuyển dụng (Bookmark)
  const [isSaved, setIsSaved] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
      const savedJobs = JSON.parse(localStorage.getItem('saved_public_jobs') || '[]');
      return Array.isArray(savedJobs) && savedJobs.includes(job.id);
    } catch {
      return false;
    }
  });

  // State: Mở Form Ứng tuyển nhanh
  const [isApplyDrawerOpen, setIsApplyDrawerOpen] = useState(false);

  // Định dạng thông tin hiển thị
  const salaryText = formatSalaryDisplay(job);
  const employmentTypeText = formatEmploymentType(job.employmentType);
  const levelText = formatJobLevel(job.level);
  const deadlineInfo = getDeadlineStatus(job.deadline);
  const applicationUnavailable = isJobApplicationUnavailable(job);

  // Toggle Lưu tin tuyển dụng
  const handleToggleSave = () => {
    try {
      const savedJobs: string[] = JSON.parse(localStorage.getItem('saved_public_jobs') || '[]');
      let updated: string[];
      if (isSaved) {
        updated = savedJobs.filter((id) => id !== job.id);
        setIsSaved(false);
        notify('Đã bỏ lưu tin tuyển dụng khỏi danh sách quan tâm.', 'info');
      } else {
        updated = job.id ? [...savedJobs, job.id] : savedJobs;
        setIsSaved(true);
        notify('Đã lưu tin tuyển dụng thành công!', 'success');
      }
      localStorage.setItem('saved_public_jobs', JSON.stringify(updated));
    } catch {
      setIsSaved(!isSaved);
    }
  };

  // Chia sẻ tin tuyển dụng qua Web Share API hoặc Clipboard
  const handleShare = async () => {
    const shareData = {
      title: `${job.title} | Tuyển dụng`,
      text: `Ứng tuyển ngay vị trí ${job.title} tại ${job.departmentName || 'Công ty'} - Mức lương: ${salaryText}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        notify('Chia sẻ tin tuyển dụng thành công!', 'success');
      } catch (err) {
        // Người dùng hủy chia sẻ (AbortError) không hiển thị lỗi
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    notify('Đã sao chép liên kết tin tuyển dụng vào bộ nhớ tạm!', 'success');
  };


  // Cuộn mượt lên đầu trang khi component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <div
      data-testid="mobile-job-details-container"
      className="relative min-h-screen bg-slate-50 text-slate-800 antialiased"
    >
      {/* 1. TOP NAVIGATION BAR (Chuẩn Touch target >= 44x44px) */}
      <header
        data-testid="mobile-top-nav"
        className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 backdrop-blur-md"
      >
        <button
          type="button"
          data-testid="back-button"
          onClick={onBack || (() => window.history.back())}
          aria-label="Quay lại danh sách việc làm"
          className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex-1 px-2 text-center">
          <span className="block truncate text-xs font-bold text-slate-900">
            {job.title}
          </span>
          <span className="block truncate text-[11px] text-slate-500">
            {job.departmentName || 'Hệ thống tuyển dụng thông minh'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Nút Chia sẻ */}
          <button
            type="button"
            data-testid="share-button"
            onClick={handleShare}
            aria-label="Chia sẻ tin tuyển dụng"
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600 active:scale-95"
          >
            <Share2 className="h-5 w-5" />
          </button>

          {/* Nút Lưu tin trên header */}
          <button
            type="button"
            data-testid="header-save-button"
            onClick={handleToggleSave}
            aria-label={isSaved ? 'Bỏ lưu tin tuyển dụng' : 'Lưu tin tuyển dụng'}
            className={`flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl transition active:scale-95 ${
              isSaved
                ? 'bg-rose-50 text-rose-600'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {isSaved ? <BookmarkCheck className="h-5 w-5 fill-rose-600" /> : <Bookmark className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* 2. NỘI DUNG CHÍNH (Được padding bottom pb-28 để KHÔNG bị che bởi Sticky Action Bar - AC2) */}
      <main className="mx-auto max-w-2xl px-4 py-5 pb-32 space-y-5">
        {/* Banner thông báo nhẹ khi tin tuyển dụng đã hết hạn (AC2) */}
        {deadlineInfo.isExpired && (
          <JobExpiredBanner message="Vị trí tuyển dụng này đã đóng, vui lòng tham khảo các vị trí khác." />
        )}

        {/* Khối Header chi tiết tin tuyển dụng (AC1) */}
        <section
          data-testid="job-header-section"
          className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6"
        >
          {/* Department badge & Level */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {job.departmentName && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200/50">
                <Building2 className="h-3.5 w-3.5" />
                {job.departmentName}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <Layers className="h-3.5 w-3.5" />
              {levelText}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/50">
              <Clock className="h-3.5 w-3.5" />
              {employmentTypeText}
            </span>
            {/* Huy hiệu trạng thái hạn nộp hồ sơ (AC1) */}
            <JobDeadlineBadge
              deadline={job.deadline}
              size="sm"
              customText={job.status === 'CLOSED' || job.publishCareerPage === false ? 'Đã gỡ' : undefined}
            />
          </div>

          {/* Job Title */}
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight">
            {job.title}
          </h1>

          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            Hệ thống Tuyển Dụng Thông Minh • Smart Recruitment System
          </p>

          {/* Quick Badges Grid (Địa điểm, Mức lương, Hạn nộp, Số lượng) */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-2 pt-3 border-t border-slate-100">
            {/* Mức lương */}
            <div
              data-testid="salary-badge"
              className="flex items-center gap-2 rounded-2xl bg-emerald-50/70 p-3 border border-emerald-100/80"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <Banknote className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  Mức lương
                </span>
                <span className="block truncate text-xs sm:text-sm font-extrabold text-emerald-900">
                  {salaryText}
                </span>
              </div>
            </div>

            {/* Địa điểm */}
            <div
              data-testid="location-badge"
              className="flex items-center gap-2 rounded-2xl bg-indigo-50/70 p-3 border border-indigo-100/80"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
                  Địa điểm
                </span>
                <span className="block truncate text-xs sm:text-sm font-bold text-slate-900">
                  {job.workLocation}
                </span>
              </div>
            </div>

            {/* Hạn nộp */}
            <div
              data-testid="deadline-badge"
              className={`flex items-center gap-2 rounded-2xl p-3 border ${
                deadlineInfo.isExpired
                  ? 'bg-rose-50/80 border-rose-200/80'
                  : deadlineInfo.isClosingSoon
                  ? 'bg-amber-50/80 border-amber-200/80'
                  : 'bg-slate-50 border-slate-200/70'
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-xs ${
                  deadlineInfo.isExpired
                    ? 'bg-rose-600'
                    : deadlineInfo.isClosingSoon
                    ? 'bg-amber-600'
                    : 'bg-slate-600'
                }`}
              >
                <Calendar className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span
                  className={`block text-[10px] font-semibold uppercase tracking-wider ${
                    deadlineInfo.isExpired
                      ? 'text-rose-700 font-bold'
                      : deadlineInfo.isClosingSoon
                      ? 'text-amber-700 font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  Hạn nộp hồ sơ
                </span>
                <span
                  className={`block truncate text-xs sm:text-sm font-bold ${
                    deadlineInfo.isExpired
                      ? 'text-rose-900'
                      : deadlineInfo.isClosingSoon
                      ? 'text-amber-900'
                      : 'text-slate-900'
                  }`}
                >
                  {deadlineInfo.text}
                </span>
              </div>
            </div>

            {/* Số lượng tuyển */}
            <div
              data-testid="headcount-badge"
              className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 border border-slate-200/70"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-white shadow-xs">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Số lượng
                </span>
                <span className="block truncate text-xs sm:text-sm font-bold text-slate-900">
                  {job.headcount || 1} nhân sự
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Khối Kỹ năng yêu cầu */}
        {job.skills && job.skills.length > 0 && (
          <section
            data-testid="skills-section"
            className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs"
          >
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Kỹ năng &amp; Công nghệ yêu cầu
            </h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-xl bg-indigo-50/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 border border-indigo-200/60 transition hover:bg-indigo-100"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 1. Mô tả công việc (Job Description) */}
        <section
          data-testid="description-section"
          className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Mô tả công việc
            </h2>
          </div>
          <div className="whitespace-pre-line text-sm text-slate-700 leading-relaxed font-normal">
            {job.jobDescription || 'Chưa có thông tin mô tả chi tiết công việc.'}
          </div>
        </section>

        {/* 2. Yêu cầu ứng viên (Requirements) */}
        <section
          data-testid="requirements-section"
          className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Yêu cầu ứng viên
            </h2>
          </div>
          <div className="whitespace-pre-line text-sm text-slate-700 leading-relaxed font-normal">
            {job.requirements || 'Chưa có thông tin yêu cầu cụ thể.'}
          </div>
        </section>

        {/* 3. Quyền lợi & Đãi ngộ (Benefits) */}
        <section
          data-testid="benefits-section"
          className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Quyền lợi &amp; Đãi ngộ
            </h2>
          </div>
          <div className="whitespace-pre-line text-sm text-slate-700 leading-relaxed font-normal">
            {job.benefits || 'Mức lương cạnh tranh, thưởng tháng 13, xét tăng lương định kỳ và bảo hiểm đầy đủ.'}
          </div>
        </section>

        {/* 4. Quy trình ứng tuyển (Recruitment Process) */}
        <section
          data-testid="recruitment-process-section"
          className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6"
        >
          <h2 className="text-sm font-extrabold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-indigo-600" />
            Quy trình tuyển dụng nhanh chóng
          </h2>
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-100">
            <div className="relative">
              <div className="absolute -left-[25px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-xs">
                1
              </div>
              <h3 className="text-xs font-bold text-slate-900">Nộp hồ sơ trực tuyến</h3>
              <p className="text-[11px] text-slate-500">Điền thông tin và tải lên CV chỉ trong 1 phút.</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[25px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-xs">
                2
              </div>
              <h3 className="text-xs font-bold text-slate-900">Sàng lọc &amp; Phản hồi</h3>
              <p className="text-[11px] text-slate-500">Nhận kết quả sàng lọc CV trong vòng 2 ngày làm việc.</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[25px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-xs">
                3
              </div>
              <h3 className="text-xs font-bold text-slate-900">Phỏng vấn chuyên môn</h3>
              <p className="text-[11px] text-slate-500">Trao đổi trực tiếp hoặc online cùng Trưởng bộ phận.</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[25px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs">
                4
              </div>
              <h3 className="text-xs font-bold text-slate-900">Nhận Offer &amp; Gia nhập</h3>
              <p className="text-[11px] text-slate-500">Thư mời nhận việc cùng gói đãi ngộ hấp dẫn.</p>
            </div>
          </div>
        </section>

        {/* 5. Thông tin liên hệ & Địa điểm (Contact Info) */}
        <section
          data-testid="contact-section"
          className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6 space-y-3"
        >
          <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-600" />
            Thông tin liên hệ &amp; Địa chỉ làm việc
          </h2>
          <div className="space-y-2.5 text-xs text-slate-600 pt-1">
            <div className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-indigo-500 shrink-0" />
              <span>Văn phòng làm việc: <strong>{job.workLocation}</strong></span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-indigo-500 shrink-0" />
              <span>
                Email nhận hồ sơ:{' '}
                <a
                  href="mailto:tuyendung@smartrecruitment.vn"
                  className="font-bold text-indigo-600 hover:underline"
                >
                  tuyendung@smartrecruitment.vn
                </a>
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-indigo-500 shrink-0" />
              <span>
                Hotline tuyển dụng:{' '}
                <a
                  href="tel:02439998888"
                  className="font-bold text-indigo-600 hover:underline"
                >
                  024 3999 8888 (Nhánh 102)
                </a>
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* 3. BOTTOM STICKY ACTION BAR (AC2 & AC3)
          - Cố định ở đáy màn hình
          - Nút Lưu tin (Touch target >= 44x44px)
          - Nút Ứng tuyển ngay nổi bật (Touch target >= 48px)
          - Kèm hỗ trợ Safe Area Inset cho iOS
      */}
      <aside
        data-testid="bottom-sticky-action-bar"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 px-4 py-3 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] backdrop-blur-md"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          {/* Nút Lưu tin (Lưu trạng thái vào localStorage) */}
          <button
            type="button"
            data-testid="bottom-save-button"
            onClick={handleToggleSave}
            aria-label={isSaved ? 'Đã lưu tin' : 'Lưu tin tuyển dụng'}
            className={`flex h-12 w-12 min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-2xl border transition active:scale-95 ${
              isSaved
                ? 'border-rose-200 bg-rose-50 text-rose-600'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {isSaved ? (
              <BookmarkCheck className="h-5 w-5 fill-rose-600" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </button>

          {/* Nút Ứng tuyển ngay (Chính, Nổi bật, Touch target >= 48px, tự động disabled khi hết hạn - AC2) */}
          <button
            type="button"
            data-testid="bottom-apply-button"
            data-disabled={applicationUnavailable}
            disabled={applicationUnavailable}
            onClick={() => !applicationUnavailable && setIsApplyDrawerOpen(true)}
            className={`flex h-12 min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl px-5 text-sm sm:text-base font-extrabold transition ${
              applicationUnavailable
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none active:scale-100'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 transition hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98]'
            }`}
          >
            <Send className="h-4 w-4" />
            {applicationUnavailable
              ? job.status === 'CLOSED' || job.publishCareerPage === false
                ? 'Tin đã được gỡ'
                : 'Đã hết hạn ứng tuyển'
              : 'Ứng tuyển ngay'}
          </button>
        </div>
      </aside>

      {/* 4. QUICK APPLY DRAWER / BOTTOM SHEET (Chuẩn trải nghiệm Mobile) */}
      {isApplyDrawerOpen && (
        <div
          data-testid="quick-apply-drawer"
          className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity"
        >
          {/* Backdrop click to close */}
          <div
            className="flex-1"
            onClick={() => setIsApplyDrawerOpen(false)}
          />

          {/* Bottom Sheet Modal */}
          <div className="relative max-h-[92vh] w-full max-w-2xl mx-auto rounded-t-3xl bg-white p-4 sm:p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Thanh kéo trang trí */}
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />

            <PublicJobApplyForm
              job={job}
              isModalOrDrawer={true}
              onCancel={() => setIsApplyDrawerOpen(false)}
              onSuccess={() => {
                if (onApplySuccess) onApplySuccess();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileJobDetails;
