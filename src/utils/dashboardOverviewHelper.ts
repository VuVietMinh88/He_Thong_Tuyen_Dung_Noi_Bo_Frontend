import type { CandidateProfile } from '../types/candidate';
import type { JobPostingData } from '../services/jobPostingService';
import { isJobApplicationUnavailable } from '../services/jobPostingService';
import { normalizeCandidateStage } from '../services/slaService';

export interface DashboardOverviewMetrics {
  openPositions: number;
  receivedCVs: number;
  pendingApplications: number;
  offersSentThisMonth: number;
}

export const getDashboardOverviewMetrics = (
  postings: Array<Pick<JobPostingData, 'status' | 'publishCareerPage' | 'deadline'>>,
  candidates: Array<Pick<CandidateProfile, 'status'>>,
  offeredThisMonth: number,
  referenceDate = new Date(),
): DashboardOverviewMetrics => ({
  openPositions: postings.filter(
    (posting) =>
      posting.status === 'PUBLISHED' &&
      !isJobApplicationUnavailable(posting, referenceDate),
  ).length,
  receivedCVs: candidates.length,
  pendingApplications: candidates.filter((candidate) => {
    if (!candidate.status?.trim()) return false;
    const stage = normalizeCandidateStage(candidate.status);
    return stage === 'NEW' || stage === 'SCREENING';
  }).length,
  offersSentThisMonth: offeredThisMonth,
});
