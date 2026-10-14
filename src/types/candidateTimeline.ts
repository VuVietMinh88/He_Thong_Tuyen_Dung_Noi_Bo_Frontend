import type { CandidateStage, CandidateSource } from './candidate';

export type TimelineEventType =
  | 'APPLICATION_SUBMITTED'
  | 'STAGE_CHANGED'
  | 'EMAIL_SENT'
  | 'INTERVIEW_SCHEDULED'
  | 'EVALUATION_SUBMITTED'
  | 'NOTE_ADDED';

export type TimelineFilterCategory =
  | 'ALL'
  | 'APPLICATION_SUBMITTED'
  | 'STAGE_CHANGED'
  | 'EMAIL_SENT'
  | 'INTERVIEW_SCHEDULED'
  | 'EVALUATION';

export interface TimelineActor {
  id: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
}

export interface ApplicationSubmittedDetails {
  jobPostingId: string;
  jobCode: string;
  jobTitle: string;
  departmentName: string;
  source: CandidateSource;
  cvFileName: string;
  cvFileSize: number;
  coverLetterSnippet?: string;
}

export interface StageChangedDetails {
  jobPostingId: string;
  jobTitle: string;
  fromStage: CandidateStage;
  toStage: CandidateStage;
  rejectionReason?: string;
  withdrawalReason?: string;
  notes?: string;
}

export interface EmailSentDetails {
  emailType: 'APPLICATION_CONFIRMATION' | 'INTERVIEW_INVITATION' | 'OFFER_LETTER' | 'REJECTION_THANK_YOU' | 'GENERAL';
  subject: string;
  recipientEmail: string;
  senderName: string;
  bodySnippet: string;
  fullBodyHtml?: string;
  deliveryStatus: 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED';
}

export interface InterviewScheduledDetails {
  roundName: string; // VD: Phỏng vấn Kỹ thuật vòng 1, Phỏng vấn Văn hóa
  interviewDate: string; // ISO timestamp
  durationMinutes: number; // VD: 60 phút
  format: 'ONLINE' | 'OFFLINE';
  locationOrMeetingLink: string;
  interviewers: Array<{
    name: string;
    role: string;
  }>;
  candidateResponseStatus: 'ACCEPTED' | 'TENTATIVE' | 'DECLINED' | 'PENDING';
}

export interface EvaluationSubmittedDetails {
  evaluatorName: string;
  evaluatorRole: string;
  roundName: string;
  competencyScore?: number; // thang điểm 10 hoặc 5
  maxScore?: number;
  result: 'PASSED' | 'FAILED' | 'CONSIDER';
  quickRating?: number; // 1 - 5 sao
  summaryNote: string;
  strengths?: string[];
  weaknesses?: string[];
}

export interface NoteAddedDetails {
  category: 'GENERAL' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'CULTURE';
  content: string;
}

export interface TimelineEvent {
  id: string;
  candidateId: string;
  eventType: TimelineEventType;
  timestamp: string; // ISO 8601
  actor: TimelineActor;
  title: string;
  summary: string;
  applicationSubmitted?: ApplicationSubmittedDetails;
  stageChanged?: StageChangedDetails;
  emailSent?: EmailSentDetails;
  interviewScheduled?: InterviewScheduledDetails;
  evaluationSubmitted?: EvaluationSubmittedDetails;
  noteAdded?: NoteAddedDetails;
}

