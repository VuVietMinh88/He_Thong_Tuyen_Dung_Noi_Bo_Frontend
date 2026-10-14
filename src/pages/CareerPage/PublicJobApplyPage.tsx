import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  jobPostingService,
  type JobPostingData,
  formatSalaryDisplay,
  formatEmploymentType,
  getDeadlineStatus,
  isJobApplicationUnavailable,
} from '../../services/jobPostingService';
import PublicJobApplyForm from '../../components/CareerPage/PublicJobApplyForm';
import JobExpiredBanner from '../../components/CareerPage/JobExpiredBanner';
import PublicJobHeader from '../../components/CareerPage/PublicJobHeader';
import PublicFooter from '../../components/CareerPage/PublicFooter';
import {
  ArrowLeft,
  AlertCircle,
  Building2,
  MapPin,
  Calendar,
  Banknote,
  ChevronRight,
} from 'lucide-react';

export const PublicJobApplyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobPostingData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchJob = async () => {
      if (!id) {
        setError('Không tìm thấy mã định danh tin tuyển dụng.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const found = await jobPostingService.getPublicJobById(id);
        if (isMounted) {
          if (found && !isJobApplicationUnavailable(found)) {
            setJob(found);
          } else {
            setJob(null);
            setError(found
              ? found.status === 'CLOSED' || found.publishCareerPage === false
                ? 'Tin tuyển dụng đã được gỡ và hiện không nhận hồ sơ.'
                : 'Tin tuyển dụng đã hết hạn nhận hồ sơ.'
              : 'Tin tuyển dụng không tồn tại hoặc đã hết hạn đăng ký.');
          }
        }
      } catch {
        if (isMounted) {
          setError('Không thể tải thông tin tin tuyển dụng. Vui lòng thử lại sau.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchJob();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div data-testid="job-apply-loading" className="min-h-screen bg-slate-50 flex flex-col">
        <PublicJobHeader />
        <main className="flex-1 px-4 py-8 max-w-3xl mx-auto w-full space-y-4 animate-pulse">
          <div className="h-6 w-48 rounded-lg bg-slate-200" />
          <div className="h-32 rounded-3xl bg-white border border-slate-200 p-6 space-y-3">
            <div className="h-6 w-3/4 rounded-lg bg-slate-200" />
            <div className="h-4 w-1/2 rounded-lg bg-slate-100" />
          </div>
          <div className="h-96 rounded-3xl bg-white border border-slate-200" />
        </main>
        <PublicFooter />
      </div>
    );
  }

  // Error State
  if (error || !job) {
    return (
      <div data-testid="job-apply-error" className="min-h-screen bg-slate-50 flex flex-col">
        <PublicJobHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Tin tuyển dụng không khả dụng
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {error || 'Tin tuyển dụng này có thể đã bị gỡ xuống hoặc địa chỉ liên kết không chính xác.'}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/careers')}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-md hover:bg-indigo-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Xem các việc làm khác
              </button>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const deadlineInfo = getDeadlineStatus(job.deadline);
  const salaryText = formatSalaryDisplay(job);
  const employmentTypeText = formatEmploymentType(job.employmentType);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <PublicJobHeader />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Breadcrumbs & Back Navigation */}
          <div className="flex items-center justify-between">
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto py-1">
              <Link to="/careers" className="hover:text-indigo-600 transition truncate">
                Cơ hội việc làm
              </Link>
              <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
              <Link to={`/careers/jobs/${job.id}`} className="hover:text-indigo-600 transition truncate max-w-[150px] sm:max-w-[200px]">
                {job.title}
              </Link>
              <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="font-semibold text-slate-900">Ứng tuyển</span>
            </nav>

            <button
              type="button"
              onClick={() => navigate(`/careers/jobs/${job.id}`)}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Chi tiết công việc
            </button>
          </div>

          {/* Job Overview Mini Banner */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">
                {employmentTypeText}
              </span>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Hạn nộp: {deadlineInfo.text}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-slate-600">
              {job.departmentName && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span>{job.departmentName}</span>
                </div>
              )}
              {job.workLocation && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{job.workLocation}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                <Banknote className="h-4 w-4 text-emerald-500" />
                <span>{salaryText}</span>
              </div>
            </div>
          </div>

          {/* Expired Job Warning */}
          {deadlineInfo.isExpired && (
            <div className="mb-4">
              <JobExpiredBanner message={`Vị trí tuyển dụng này đã đóng vào ngày ${deadlineInfo.text}. Bạn vẫn có thể tham khảo các vị trí khác đang mở.`} />
            </div>
          )}

          {/* Form Component */}
          <div className="shadow-xs rounded-3xl overflow-hidden">
            <PublicJobApplyForm
              job={job}
              onCancel={() => navigate(`/careers/jobs/${job.id}`)}
              onSuccess={() => {
                // Keep candidate on success screen or handle navigation
              }}
            />
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default PublicJobApplyPage;
