import React from 'react';
import {
  MapPin,
  Briefcase,
  Calendar,
  Banknote,
  Users,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type { JobPostingData } from '../../services/jobPostingService';
import {
  formatSalaryDisplay,
  formatEmploymentType,
  formatJobLevel,
  getDeadlineStatus,
} from '../../services/jobPostingService';

export interface JobCardProps {
  job: JobPostingData;
  layout?: 'grid' | 'list';
  onViewDetail: (job: JobPostingData) => void;
  onApplyNow?: (job: JobPostingData) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  layout = 'grid',
  onViewDetail,
  onApplyNow,
}) => {
  const salaryText = formatSalaryDisplay(job);
  const employmentTypeText = formatEmploymentType(job.employmentType);
  const levelText = formatJobLevel(job.level);
  const deadlineInfo = getDeadlineStatus(job.deadline);

  // Badge màu sắc tùy biến theo hình thức làm việc
  const getEmploymentBadgeStyle = (type?: string) => {
    switch (type) {
      case 'REMOTE':
        return 'bg-purple-50 text-purple-700 border-purple-200/60';
      case 'HYBRID':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200/60';
      case 'INTERNSHIP':
        return 'bg-amber-50 text-amber-700 border-amber-200/60';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
    }
  };

  if (layout === 'list') {
    return (
      <article
        data-testid={`job-card-${job.id}`}
        className="group relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50/50"
      >
        <div className="flex-1 space-y-3">
          {/* Top badges */}
          <div className="flex flex-wrap items-center gap-2">
            {job.departmentName && (
              <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200/50">
                {job.departmentName}
              </span>
            )}
            <span
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${getEmploymentBadgeStyle(
                job.employmentType
              )}`}
            >
              {employmentTypeText}
            </span>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {levelText}
            </span>
            {deadlineInfo.isUrgent && (
              <span className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 border border-rose-200/60 animate-pulse">
                <Clock className="h-3 w-3" />
                {deadlineInfo.text}
              </span>
            )}
          </div>

          {/* Job Title */}
          <h3
            onClick={() => onViewDetail(job)}
            className="cursor-pointer text-lg font-bold text-slate-900 transition-colors group-hover:text-indigo-600 sm:text-xl"
          >
            {job.title}
          </h3>

          {/* Job Meta Information Row */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-sm text-slate-600">
            <div className="flex items-center gap-1.5 font-medium">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span>{job.workLocation}</span>
            </div>

            <div className="flex items-center gap-1.5 font-semibold text-emerald-600">
              <Banknote className="h-4 w-4 text-emerald-500" />
              <span>{salaryText}</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>Hạn nộp: {deadlineInfo.text}</span>
            </div>

            {job.headcount && (
              <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                <Users className="h-4 w-4 text-slate-400" />
                <span>Tuyển {job.headcount} nhân sự</span>
              </div>
            )}
          </div>

          {/* Skills tags */}
          {job.skills && job.skills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {job.skills.slice(0, 4).map((skill, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-medium"
                >
                  {skill}
                </span>
              ))}
              {job.skills.length > 4 && (
                <span className="text-xs text-slate-400 font-medium">
                  +{job.skills.length - 4} kỹ năng
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex w-full md:w-auto items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
          <button
            type="button"
            onClick={() => onViewDetail(job)}
            className="flex-1 md:flex-initial min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 active:scale-95"
          >
            Xem chi tiết
          </button>
          <button
            type="button"
            onClick={() => onApplyNow?.(job) || onViewDetail(job)}
            className="flex-1 md:flex-initial min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 active:scale-95"
          >
            <span>Ứng tuyển</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </article>
    );
  }

  // Grid layout (Default)
  return (
    <article
      data-testid={`job-card-${job.id}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/50"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {job.departmentName && (
              <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200/50">
                {job.departmentName}
              </span>
            )}
            <span
              className={`rounded-lg border px-2 py-0.5 text-xs font-semibold ${getEmploymentBadgeStyle(
                job.employmentType
              )}`}
            >
              {employmentTypeText}
            </span>
          </div>

          {deadlineInfo.isUrgent && (
            <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 border border-rose-200/60 animate-pulse">
              <Clock className="h-3 w-3" />
              {deadlineInfo.text}
            </span>
          )}
        </div>

        {/* Job Title */}
        <h3
          onClick={() => onViewDetail(job)}
          className="mt-4 cursor-pointer text-lg font-bold text-slate-900 transition-colors group-hover:text-indigo-600 line-clamp-2"
          title={job.title}
        >
          {job.title}
        </h3>

        {/* Salary Highlight */}
        <div className="mt-3 flex items-center gap-1.5 text-sm font-bold text-emerald-600">
          <Banknote className="h-4 w-4 text-emerald-500" />
          <span>{salaryText}</span>
        </div>

        {/* Meta items */}
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              Địa điểm:
            </span>
            <span className="font-semibold text-slate-800">{job.workLocation}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Briefcase className="h-3.5 w-3.5 text-slate-400" />
              Cấp bậc:
            </span>
            <span className="font-semibold text-slate-800">{levelText}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Hạn nộp:
            </span>
            <span
              className={`font-semibold ${
                deadlineInfo.isUrgent ? 'text-rose-600' : 'text-slate-800'
              }`}
            >
              {deadlineInfo.text}
            </span>
          </div>

          {job.headcount && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                Số lượng:
              </span>
              <span className="font-semibold text-slate-800">{job.headcount} người</span>
            </div>
          )}
        </div>

        {/* Skills preview tags */}
        {job.skills && job.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {job.skills.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 3 && (
              <span className="text-[11px] text-slate-400 font-medium self-center">
                +{job.skills.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => onViewDetail(job)}
          className="flex-1 min-h-[44px] rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 active:scale-95"
        >
          Xem chi tiết
        </button>
        <button
          type="button"
          onClick={() => onApplyNow?.(job) || onViewDetail(job)}
          className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 px-3 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 active:scale-95"
        >
          <span>Ứng tuyển</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
};

export default JobCard;
