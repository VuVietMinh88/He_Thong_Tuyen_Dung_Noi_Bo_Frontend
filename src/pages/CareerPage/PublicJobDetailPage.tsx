import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  jobPostingService,
  type JobPostingData,
} from '../../services/jobPostingService';
import MobileJobDetails from '../../components/CareerPage/MobileJobDetails';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';

export const PublicJobDetailPage: React.FC = () => {
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
          if (found) {
            setJob(found);
          } else {
            setError('Tin tuyển dụng không tồn tại hoặc đã hết hạn đăng ký.');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching job details:', err);
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
      <div
        data-testid="job-detail-loading"
        className="min-h-screen bg-slate-50 px-4 py-6"
      >
        <div className="mx-auto max-w-2xl space-y-4 animate-pulse">
          {/* Header Skeleton */}
          <div className="h-12 w-full rounded-2xl bg-slate-200" />
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="h-5 w-32 rounded-lg bg-slate-200" />
            <div className="h-8 w-3/4 rounded-lg bg-slate-200" />
            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="h-14 rounded-2xl bg-slate-100" />
              <div className="h-14 rounded-2xl bg-slate-100" />
            </div>
          </div>
          {/* Section Skeletons */}
          <div className="h-40 rounded-3xl border border-slate-200 bg-white p-6" />
          <div className="h-40 rounded-3xl border border-slate-200 bg-white p-6" />
        </div>
      </div>
    );
  }

  // Error / Not Found State
  if (error || !job) {
    return (
      <div
        data-testid="job-detail-error"
        className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center"
      >
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Không tìm thấy tin tuyển dụng
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {error || 'Tin tuyển dụng này có thể đã bị gỡ xuống hoặc địa chỉ liên kết không chính xác.'}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate('/careers')}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-md hover:bg-indigo-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Xem các việc làm khác
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tải lại trang
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MobileJobDetails
      job={job}
      onBack={() => navigate('/careers')}
    />
  );
};

export default PublicJobDetailPage;
