/**
 * Types cho tính năng Giới thiệu ứng viên nội bộ (User Story S4-07 / Task TKNHTTDNB1-348)
 */

export type ReferralStatus = 'RECEIVED' | 'IN_REVIEW' | 'INTERVIEWING' | 'COMPLETED';

export interface ReferralStatusMetadata {
  label: string;
  badgeClass: string;
  dotClass: string;
  description: string;
}

export const REFERRAL_STATUS_CONFIG: Record<ReferralStatus, ReferralStatusMetadata> = {
  RECEIVED: {
    label: 'Đã nhận',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dotClass: 'bg-blue-500',
    description: 'Hồ sơ đã được tiếp nhận trên hệ thống tuyển dụng.',
  },
  IN_REVIEW: {
    label: 'Đang xem xét',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dotClass: 'bg-amber-500',
    description: 'Bộ phận Nhân sự đang rà soát và đánh giá mức độ phù hợp của hồ sơ.',
  },
  INTERVIEWING: {
    label: 'Mời phỏng vấn',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
    dotClass: 'bg-purple-500',
    description: 'Ứng viên đã vượt qua vòng sơ loại và được gửi lời mời tham gia phỏng vấn.',
  },
  COMPLETED: {
    label: 'Kết thúc',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/80',
    dotClass: 'bg-slate-400',
    description: 'Quy trình tuyển dụng cho hồ sơ này đã hoàn tất.',
  },
};

export interface CandidateReferral {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  jobPostingId: string;
  jobTitle: string;
  departmentName: string;
  workLocation: string;
  employmentType: string;
  cvFileName: string;
  cvFileSize: number; // bytes
  cvFileType: string;
  cvFileUrl?: string;
  referralNote: string;
  source: 'INTERNAL_REFERRAL';
  referrerId: string;
  referrerName: string;
  referrerEmail: string;
  status: ReferralStatus;
  submittedAt: string; // ISO 8601 string
  updatedAt?: string;
}

export interface CreateReferralPayload {
  jobPostingId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  cvFile: File;
  referralNote: string;
}

export interface ActiveJobOption {
  id: string;
  title: string;
  positionTitle: string;
  departmentName: string;
  workLocation: string;
  employmentType: string;
  deadline?: string;
  salaryText?: string;
}

