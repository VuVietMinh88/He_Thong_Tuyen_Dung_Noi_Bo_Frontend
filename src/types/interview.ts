export type InterviewFormat = 'ONLINE' | 'OFFLINE';

export type InterviewRoundType =
  | 'SCREENING'
  | 'TECHNICAL'
  | 'CULTURE_HR'
  | 'FINAL_DIRECTOR'
  | 'CUSTOM';

export interface InterviewerInfo {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarUrl?: string;
  department?: string;
}

export interface InterviewSchedulePayload {
  id?: string;
  candidateId: string;
  candidateName: string;
  candidateEmail?: string;
  applicationId?: string;
  jobTitle?: string;
  roundName: string;
  roundType?: InterviewRoundType;
  interviewDate: string; // Định dạng YYYY-MM-DD
  interviewTime: string; // Định dạng HH:mm
  scheduledDateTimeISO: string; // Chuỗi ISO chuẩn UTC / GMT+7
  durationMinutes: number; // 30, 45, 60, 90, 120 phút
  format: InterviewFormat; // ONLINE hoặc OFFLINE
  locationOrLink: string; // Địa chỉ phòng họp hoặc link họp trực tuyến
  interviewers: InterviewerInfo[];
  notes?: string;
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  createdAt?: string;
  createdByName?: string;
}

export interface InterviewRoundOption {
  type: InterviewRoundType;
  label: string;
  description: string;
  badgeColor: string;
}

export const DEFAULT_INTERVIEW_ROUNDS: InterviewRoundOption[] = [
  {
    type: 'SCREENING',
    label: 'Vòng Sàng lọc CV (Screening Interview)',
    description: 'Trao đổi sơ bộ về hồ sơ, định hướng công việc và mức lương kỳ vọng',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    type: 'TECHNICAL',
    label: 'Vòng Chuyên môn & Kỹ thuật (Technical Interview)',
    description: 'Đánh giá kiến thức chuyên môn, giải quyết tình huống kỹ thuật thực tế',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    type: 'CULTURE_HR',
    label: 'Vòng Văn hóa & HR (Culture & HR Interview)',
    description: 'Đánh giá độ phù hợp văn hóa doanh nghiệp, kỹ năng mềm và giao tiếp',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    type: 'FINAL_DIRECTOR',
    label: 'Vòng Giám đốc & Ban lãnh đạo (Final Interview)',
    description: 'Phỏng vấn vòng cuối cùng với Giám đốc khối / Ban điều hành',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    type: 'CUSTOM',
    label: 'Khác (Tùy chỉnh)',
    description: 'Vòng phỏng vấn tùy chỉnh đặc thù theo yêu cầu dự án',
    badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
  },
];

export const DEFAULT_DURATION_OPTIONS: number[] = [30, 45, 60, 90, 120];

export const MOCK_INTERNAL_INTERVIEWERS: InterviewerInfo[] = [
  {
    id: 'usr-001',
    name: 'Nguyễn Văn Hải',
    role: 'Trưởng phòng Kỹ thuật (Engineering Manager)',
    email: 'hai.nguyen@smartrecruitment.vn',
    department: 'Bộ phận Công nghệ & Kỹ thuật',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-002',
    name: 'Trần Thị Thu Thảo',
    role: 'Chuyên viên Tuyển dụng Cao cấp (Senior Recruiter)',
    email: 'thao.tran@smartrecruitment.vn',
    department: 'Phòng Nhân sự & Thu hút Tài năng',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-003',
    name: 'Lê Minh Tuấn',
    role: 'Kiến trúc sư Phần mềm (Principal Architect)',
    email: 'tuan.le@smartrecruitment.vn',
    department: 'Bộ phận Công nghệ & Kỹ thuật',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-004',
    name: 'Phạm Thị Lan Hương',
    role: 'Giám đốc Nhân sự (HR Director)',
    email: 'huong.pham@smartrecruitment.vn',
    department: 'Ban Giám đốc & Nhân sự',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-005',
    name: 'Vũ Đức Đạt',
    role: 'Trưởng nhóm Frontend (Frontend Tech Lead)',
    email: 'dat.vu@smartrecruitment.vn',
    department: 'Bộ phận Công nghệ & Kỹ thuật',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-006',
    name: 'Hoàng Minh Châu',
    role: 'Trưởng nhóm Kiểm thử (QA Lead)',
    email: 'chau.hoang@smartrecruitment.vn',
    department: 'Bộ phận Đảm bảo Chất lượng',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
  },
];

