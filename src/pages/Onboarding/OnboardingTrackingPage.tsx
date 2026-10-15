import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OnboardingTrackingBoard } from '../../components/Onboarding/OnboardingTrackingBoard';

export const OnboardingTrackingPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const handleSelectCandidate = (candidateId: string) => {
    navigate(`/onboarding/tracking/${candidateId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 py-4 sm:py-6">
      <OnboardingTrackingBoard
        initialCandidateId={id}
        onSelectCandidate={handleSelectCandidate}
      />
    </div>
  );
};

export default OnboardingTrackingPage;
