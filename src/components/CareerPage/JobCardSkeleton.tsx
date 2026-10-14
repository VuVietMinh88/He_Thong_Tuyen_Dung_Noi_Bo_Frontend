import React from 'react';

export interface JobCardSkeletonProps {
  layout?: 'grid' | 'list';
  count?: number;
}

export const JobCardSkeleton: React.FC<JobCardSkeletonProps> = ({
  layout = 'grid',
  count = 6,
}) => {
  const items = Array.from({ length: count });

  if (layout === 'list') {
    return (
      <div className="space-y-4" data-testid="job-skeleton-list">
        {items.map((_, index) => (
          <div
            key={index}
            data-testid="job-card-skeleton"
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs animate-pulse"
          >
            <div className="flex-1 space-y-3 w-full">
              {/* Badges */}
              <div className="flex gap-2">
                <div className="h-5 w-24 rounded-lg bg-slate-200" />
                <div className="h-5 w-20 rounded-lg bg-slate-200" />
                <div className="h-5 w-16 rounded-lg bg-slate-100" />
              </div>
              {/* Title */}
              <div className="h-6 w-3/4 rounded-lg bg-slate-200" />
              {/* Meta row */}
              <div className="flex gap-4">
                <div className="h-4 w-24 rounded bg-slate-100" />
                <div className="h-4 w-28 rounded bg-slate-100" />
                <div className="h-4 w-28 rounded bg-slate-100" />
              </div>
              {/* Skills */}
              <div className="flex gap-2 pt-1">
                <div className="h-5 w-16 rounded-md bg-slate-100" />
                <div className="h-5 w-20 rounded-md bg-slate-100" />
                <div className="h-5 w-14 rounded-md bg-slate-100" />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex w-full md:w-auto gap-3 pt-3 md:pt-0">
              <div className="h-10 w-28 rounded-xl bg-slate-200" />
              <div className="h-10 w-32 rounded-xl bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Grid layout
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="job-skeleton-grid"
    >
      {items.map((_, index) => (
        <div
          key={index}
          data-testid="job-card-skeleton"
          className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs animate-pulse"
        >
          <div>
            {/* Badges */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <div className="h-5 w-24 rounded-lg bg-slate-200" />
                <div className="h-5 w-20 rounded-lg bg-slate-200" />
              </div>
              <div className="h-5 w-16 rounded-full bg-slate-100" />
            </div>

            {/* Title */}
            <div className="mt-4 space-y-2">
              <div className="h-5 w-full rounded-lg bg-slate-200" />
              <div className="h-5 w-2/3 rounded-lg bg-slate-200" />
            </div>

            {/* Salary */}
            <div className="mt-3 h-5 w-32 rounded-lg bg-slate-200" />

            {/* Meta rows */}
            <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <div className="h-3.5 w-16 rounded bg-slate-100" />
                <div className="h-3.5 w-20 rounded bg-slate-200" />
              </div>
              <div className="flex justify-between">
                <div className="h-3.5 w-16 rounded bg-slate-100" />
                <div className="h-3.5 w-20 rounded bg-slate-200" />
              </div>
              <div className="flex justify-between">
                <div className="h-3.5 w-16 rounded bg-slate-100" />
                <div className="h-3.5 w-24 rounded bg-slate-200" />
              </div>
            </div>

            {/* Skills */}
            <div className="mt-4 flex gap-1.5">
              <div className="h-5 w-14 rounded-md bg-slate-100" />
              <div className="h-5 w-16 rounded-md bg-slate-100" />
              <div className="h-5 w-14 rounded-md bg-slate-100" />
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex gap-2 border-t border-slate-100 pt-4">
            <div className="h-9 flex-1 rounded-xl bg-slate-200" />
            <div className="h-9 flex-1 rounded-xl bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default JobCardSkeleton;
