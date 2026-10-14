import type { UnifiedCandidate } from './candidate';

export type DuplicateMatchReason = 'EMAIL' | 'PHONE' | 'BOTH';

export interface DuplicateCandidateComparison {
  primaryCandidate: UnifiedCandidate;
  duplicateCandidate: UnifiedCandidate;
  matchReason: DuplicateMatchReason;
  matchValue: string;
}

export type CandidateDataSource = 'primary' | 'duplicate';

export interface MergeFieldSelection {
  fullName: CandidateDataSource;
  email: CandidateDataSource;
  phone: CandidateDataSource;
  currentTitle: CandidateDataSource;
  experienceYears: CandidateDataSource;
  coverLetter: CandidateDataSource;
  rating: CandidateDataSource;
}

export interface MergeHistoryRecord {
  id: string;
  primaryCandidateId: string;
  duplicateCandidateId: string;
  mergedAt: string; // ISO timestamp (Asia/Ho_Chi_Minh)
  expiresAt: string; // 24 giờ sau mergedAt
  canUndo: boolean;
  originalPrimary: UnifiedCandidate;
  originalDuplicate: UnifiedCandidate;
  fieldSelections: MergeFieldSelection;
}

export interface MergeCandidatesPayload {
  primaryCandidateId: string;
  duplicateCandidateId: string;
  fieldSelections: MergeFieldSelection;
}

export interface DuplicateCheckParams {
  email?: string;
  phone?: string;
  candidateId?: string;
}

export interface MergeResultResponse {
  mergedCandidate: UnifiedCandidate;
  mergeRecord: MergeHistoryRecord;
}
