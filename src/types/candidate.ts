export type CvParsingStatus =
  | 'PARSING'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'FAILED'
  | 'DISMISSED';

export interface CvSuggestedCandidateInfo {
  fullName: string;
  email: string;
  phone: string;
  confidenceScore?: number;
  extractedAt?: string;
  rawSnippet?: string;
}

export interface CandidateProfile {
  id: string;
  trackingCode?: string;
  fullName: string;
  email: string;
  phone: string;
  appliedJobId?: string;
  appliedJobTitle?: string;
  departmentName?: string;
  source?: string;
  status?: string;
  cvUrl?: string;
  cvFileName?: string;
  cvParsingStatus: CvParsingStatus;
  cvSuggestedInfo?: CvSuggestedCandidateInfo;
  cvParsingErrorMessage?: string;
  coverLetter?: string;
  appliedAt?: string;
  updatedAt?: string;
}

export interface CandidateFilterCriteria {
  keyword?: string;
  jobId?: string;
  cvParsingStatus?: CvParsingStatus | 'ALL';
}
