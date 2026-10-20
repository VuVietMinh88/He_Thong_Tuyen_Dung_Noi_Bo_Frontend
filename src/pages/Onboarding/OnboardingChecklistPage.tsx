import React from 'react';
import { OnboardingChecklistTemplateManager } from '../../components/Onboarding/OnboardingChecklistTemplateManager';

export const OnboardingChecklistPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 py-4 sm:py-6">
      <OnboardingChecklistTemplateManager />
    </div>
  );
};

export default OnboardingChecklistPage;
