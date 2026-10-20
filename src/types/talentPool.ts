/**
 * Types cho module Kho ứng viên tiềm năng (Talent Pool)
 * Task Jira: TKNHTTDNB1-396 - Thiết kế màn hình đưa ứng viên vào kho tiềm năng (User Story S5-04)
 */

export interface TalentPoolCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  candidateCount?: number;
}

export const DEFAULT_TALENT_POOL_CATEGORIES: TalentPoolCategory[] = [
  {
    id: 'cat-frontend',
    name: 'Frontend Core',
    description: 'Ứng viên Frontend vững React, TypeScript, Performance',
    color: 'indigo',
    candidateCount: 14,
  },
  {
    id: 'cat-backend',
    name: 'Backend High-Scale',
    description: 'Ứng viên Backend kiến trúc phân tán (Node, Go, Java, Microservices)',
    color: 'emerald',
    candidateCount: 22,
  },
  {
    id: 'cat-devops',
    name: 'DevOps Dự phòng',
    description: 'Kỹ sư CI/CD, Kubernetes, Cloud Infrastructure, Docker',
    color: 'blue',
    candidateCount: 8,
  },
  {
    id: 'cat-management',
    name: 'Management Track',
    description: 'Ứng viên tiềm năng vai trò Team Lead, PM, Tech Lead',
    color: 'purple',
    candidateCount: 5,
  },
  {
    id: 'cat-ai-data',
    name: 'AI / Data Science',
    description: 'Chuyên gia AI, GenAI, Machine Learning, Data Analytics',
    color: 'amber',
    candidateCount: 11,
  },
  {
    id: 'cat-qa',
    name: 'QA / Automation Tester',
    description: 'Kiểm thử phần mềm tự động (Playwright, Cypress), QC Lead',
    color: 'cyan',
    candidateCount: 7,
  },
];

export const SUGGESTED_TALENT_TAGS: string[] = [
  'Fast-learning',
  'Good English',
  'Strong Algorithms',
  'Solid Architecture',
  'Leadership Potential',
  'Problem Solving',
  'High Motivation',
  'Cultural Fit',
];

export const CONTACT_TIMELINE_OPTIONS: string[] = [
  'Sau 1 tháng',
  'Sau 3 tháng',
  'Sau 6 tháng',
  'Khi mở dự án mới',
  'Đầu quý tới',
];

export interface AddToTalentPoolDto {
  candidateIds: string[];
  category: string;
  tags: string[];
  notes: string;
  contactRecommendation?: string;
}

export interface TalentPoolEntry {
  id: string;
  candidateId: string;
  category: string;
  tags: string[];
  notes: string;
  contactRecommendation?: string;
  addedAt: string;
  addedBy?: string;
}

/**
 * Types cho Gợi ý kho tiềm năng & Tái kích hoạt cho vị trí mới (Task Jira: TKNHTTDNB1-397)
 */
export interface TalentPoolCandidateSuggestion {
  id: string;
  candidateId: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  category: string;
  experienceYears: number;
  currentTitle?: string;
  previousAppliedJobTitle?: string;
  skills: string[];
  matchedSkills: string[];
  missingSkills?: string[];
  matchScore: number; // 0-100%
  notes?: string;
  addedToPoolAt: string;
  contactRecommendation?: string;
  isAssigned?: boolean;
  assignedJobId?: string;
  assignedStage?: string;
}

export interface TalentPoolSearchParams {
  keyword?: string;
  category?: string;
  minMatchScore?: number;
  sortBy?: 'MATCH_SCORE_DESC' | 'EXPERIENCE_DESC' | 'DATE_DESC';
}

export interface AssignTalentToJobPayload {
  candidateId: string;
  jobId: string;
  jobTitle?: string;
  initialStage: string;
  notes?: string;
}

export interface TalentPoolCandidateHistory {
  candidateId: string;
  candidateName: string;
  addedAt: string;
  addedBy: string;
  category: string;
  recruiterNotes: string;
  tags: string[];
  contactRecommendation?: string;
  previousApplication?: {
    jobTitle: string;
    department: string;
    appliedAt: string;
    lastStage: string;
    interviewNotes?: string;
  };
}

