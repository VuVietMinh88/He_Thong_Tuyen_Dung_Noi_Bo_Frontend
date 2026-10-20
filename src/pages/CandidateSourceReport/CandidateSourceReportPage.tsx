import React from 'react';
import { CandidateSourceReportDashboard } from '../../components/CandidateSourceReport';

export const CandidateSourceReportPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CandidateSourceReportDashboard />
      </div>
    </div>
  );
};

export default CandidateSourceReportPage;
