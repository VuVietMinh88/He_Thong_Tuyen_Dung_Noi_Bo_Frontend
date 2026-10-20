import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, BriefcaseBusiness, LoaderCircle, RotateCcw } from 'lucide-react';
import { toast } from '../../components/notifications';
import JobDeadlineBadge from '../../components/CareerPage/JobDeadlineBadge';
import { usePermission } from '../../hooks/usePermission';
import {
  jobPostingService,
  isJobApplicationUnavailable,
  type JobPostingData,
} from '../../services/jobPostingService';

const formatDate = (value?: string): string => {
  if (!value) return 'Chưa thiết lập';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

export const JobPostingManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { can } = usePermission();
  const [postings, setPostings] = useState<JobPostingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedPosting, setSelectedPosting] = useState<JobPostingData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPostings = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const items = await jobPostingService.getManageableJobPostings();
      setPostings(items);
    } catch (error: unknown) {
      console.error('Error loading manageable job postings:', error);
      setLoadError(error instanceof Error
        ? error.message
        : 'Không thể tải danh sách tin tuyển dụng.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    jobPostingService.getManageableJobPostings()
      .then((items) => {
        if (isMounted) setPostings(items);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        console.error('Error loading manageable job postings:', error);
        setLoadError(error instanceof Error
          ? error.message
          : 'Không thể tải danh sách tin tuyển dụng.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUnpublish = async () => {
    if (!selectedPosting?.id || !can('edit', 'job')) return;

    setIsSubmitting(true);
    try {
      await jobPostingService.unpublishJobPosting(selectedPosting.id);
      setPostings((current) => current.map((posting) => posting.id === selectedPosting.id
        ? { ...posting, status: 'CLOSED', publishInternal: false, publishCareerPage: false }
        : posting));
      setSelectedPosting(null);
      toast.success('Đã gỡ tin tuyển dụng thành công.');
    } catch (error: unknown) {
      console.error('Error unpublishing job posting:', error);
      toast.error(error instanceof Error ? error.message : 'Không thể gỡ tin tuyển dụng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Tuyển dụng</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Quản lý tin tuyển dụng</h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi hạn ứng tuyển, trạng thái đăng và gỡ tin khi cần thiết.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadPostings()}
          disabled={isLoading}
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 sm:self-auto"
        >
          <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </header>

      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {loadError}
          </span>
          <button type="button" onClick={() => void loadPostings()} className="font-bold underline">
            Thử lại
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div role="status" className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500">
            <LoaderCircle className="h-5 w-5 animate-spin text-indigo-600" />
            Đang tải danh sách tin tuyển dụng…
          </div>
        ) : postings.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-300" />
            <h2 className="mt-3 font-bold text-slate-800">Chưa có tin tuyển dụng</h2>
            <p className="mt-1 text-sm text-slate-500">Các tin đã xuất bản sẽ được hiển thị tại đây.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Tin tuyển dụng</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4">Hạn nộp</th>
                  <th className="px-5 py-4">Ngày đăng</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {postings.map((posting) => {
                  const isUnpublished = posting.status === 'CLOSED'
                    || posting.publishCareerPage === false;
                  const isExpired = isJobApplicationUnavailable(posting) && !isUnpublished;
                  return (
                    <tr key={posting.id} className="align-middle hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">{posting.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {posting.departmentName || 'Chưa phân phòng ban'}
                          {posting.workLocation ? ` · ${posting.workLocation}` : ''}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        {isUnpublished ? (
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            Đã gỡ
                          </span>
                        ) : isExpired ? (
                          <JobDeadlineBadge deadline={posting.deadline} size="sm" />
                        ) : posting.status === 'PUBLISHED' ? (
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Đang tuyển
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {posting.status}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        <JobDeadlineBadge
                          deadline={posting.deadline}
                          size="sm"
                          customText={isUnpublished ? 'Đã gỡ' : undefined}
                        />
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{formatDate(posting.publishedAt)}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => posting.id && navigate(`/job-postings/${posting.id}/review`)}
                            className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-white"
                          >
                            Chi tiết
                          </button>
                          {posting.status === 'PUBLISHED' && !isUnpublished && can('edit', 'job') && (
                            <button
                              type="button"
                              onClick={() => setSelectedPosting(posting)}
                              className="min-h-9 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 hover:bg-rose-100"
                            >
                              Gỡ tin
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPosting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-unpublish-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="confirm-unpublish-title" className="text-lg font-bold text-slate-900">
              Xác nhận gỡ tin tuyển dụng?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Tin <strong>{selectedPosting.title}</strong> sẽ không còn hiển thị công khai và ứng viên không thể nộp hồ sơ mới.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelectedPosting(null)}
                disabled={isSubmitting}
                className="min-h-10 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => void handleUnpublish()}
                disabled={isSubmitting}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60"
              >
                {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Đang gỡ tin…' : 'Xác nhận gỡ tin'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
};

export default JobPostingManagementPage;
