import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface JobExpiredBannerProps {
  message?: string;
  className?: string;
  showExploreLink?: boolean;
}

export const JobExpiredBanner: React.FC<JobExpiredBannerProps> = ({
  message = 'Vị trí tuyển dụng này đã đóng, vui lòng tham khảo các vị trí khác.',
  className = '',
  showExploreLink = true,
}) => {
  return (
    <div
      data-testid="job-expired-banner"
      role="alert"
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs sm:text-sm text-rose-800 shadow-xs ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
          <AlertCircle className="h-4 w-4" />
        </div>
        <span className="font-semibold text-rose-900 leading-relaxed">
          {message}
        </span>
      </div>

      {showExploreLink && (
        <Link
          to="/careers"
          data-testid="explore-other-jobs-link"
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-rose-700 shadow-2xs border border-rose-200/80 hover:bg-rose-100/50 hover:text-rose-900 transition active:scale-95 shrink-0"
        >
          <span>Khám phá việc làm khác</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
};

export default JobExpiredBanner;
