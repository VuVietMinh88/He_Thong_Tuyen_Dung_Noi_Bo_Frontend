import React from 'react';

export const FunnelSkeletonLoader: React.FC = () => {
  return (
    <div
      data-testid="funnel-skeleton-loader"
      className="space-y-6 animate-pulse"
    >
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-gray-100 dark:bg-gray-800/60 p-4 flex flex-col justify-between"
          >
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded-md" />
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded-md" />
          </div>
        ))}
      </div>

      {/* Funnel Chart Skeleton */}
      <div className="h-96 rounded-2xl bg-gray-100 dark:bg-gray-800/60 p-6 flex flex-col items-center justify-center space-y-4">
        <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded-md" />
        <div className="w-full max-w-md h-56 bg-gray-200 dark:bg-gray-700/60 rounded-xl" />
        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded-md" />
      </div>

      {/* Table Skeleton */}
      <div className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-800/60 p-5 space-y-3">
        <div className="h-5 w-56 bg-gray-200 dark:bg-gray-700 rounded-md" />
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700/60 rounded-lg" />
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700/40 rounded-lg" />
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700/20 rounded-lg" />
      </div>
    </div>
  );
};
