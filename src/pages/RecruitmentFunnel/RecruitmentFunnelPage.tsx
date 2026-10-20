import React from 'react';
import { RecruitmentFunnelDashboard } from '../../components/RecruitmentFunnel/RecruitmentFunnelDashboard';

export const RecruitmentFunnelPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RecruitmentFunnelDashboard />
      </div>
    </div>
  );
};

export default RecruitmentFunnelPage;
