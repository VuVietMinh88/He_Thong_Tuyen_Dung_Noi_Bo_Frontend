import type {
  ActiveJobOption,
  CandidateReferral,
  CreateReferralPayload,
  ReferralStatus,
} from '../types/referral';
import { jobPostingService } from './jobPostingService';
import axiosClient from '../utils/axiosClient';

const STORAGE_KEY_REFERRALS = 'smart_recruit_internal_referrals';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc'];

export class DuplicateReferralError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateReferralError';
  }
}

export class InvalidReferralFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidReferralFileError';
  }
}

/**
 * Ánh xạ (Map) trạng thái từ Backend về đúng 4 mức trạng thái tổng quát:
 * 1. Đã nhận ('RECEIVED')
 * 2. Đang xem xét ('IN_REVIEW')
 * 3. Mời phỏng vấn ('INTERVIEWING')
 * 4. Kết thúc ('COMPLETED')
 */
export const mapToGeneralStatus = (rawStatus?: string | null): ReferralStatus => {
  if (!rawStatus) return 'RECEIVED';
  const upper = rawStatus.toUpperCase().trim();

  switch (upper) {
    case 'RECEIVED':
    case 'SUBMITTED':
    case 'APPLIED':
    case 'NEW':
      return 'RECEIVED';

    case 'IN_REVIEW':
    case 'SCREENING':
    case 'SHORTLISTED':
    case 'REVIEWING':
    case 'HR_REVIEW':
    case 'PENDING':
      return 'IN_REVIEW';

    case 'INTERVIEWING':
    case 'INVITED_TO_INTERVIEW':
    case 'INTERVIEW_SCHEDULED':
    case 'TESTING':
    case 'ASSESSMENT':
      return 'INTERVIEWING';

    case 'COMPLETED':
    case 'HIRED':
    case 'OFFER':
    case 'OFFER_ACCEPTED':
    case 'OFFER_DECLINED':
    case 'REJECTED':
    case 'FAILED':
    case 'WITHDRAWN':
    case 'CLOSED':
      return 'COMPLETED';

    default:
      return 'RECEIVED';
  }
};

/**
 * Định dạng thời gian theo múi giờ Việt Nam (Asia/Ho_Chi_Minh)
 */
export const formatVietnamDateTime = (dateString?: string | Date): string => {
  if (!dateString) return 'Chưa có thông tin';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return String(dateString);

    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false,
    }).format(date);
  } catch {
    return String(dateString);
  }
};

/**
 * Làm sạch dữ liệu phản hồi (Sanitize) để TUÂN THỦ BẢO VỆ DỮ LIỆU CÁ NHÂN:
 * Tuyệt đối loại bỏ nhận xét nội bộ của HR/Recruiter, điểm đánh giá phỏng vấn và tên người phỏng vấn.
 */
export const sanitizeReferralData = (raw: Record<string, unknown>): CandidateReferral => {
  const {
    hrNotes: _hrNotes,
    internalNotes: _internalNotes,
    recruiterNotes: _recruiterNotes,
    interviewerScores: _interviewerScores,
    evaluationReport: _evaluationReport,
    interviewers: _interviewers,
    interviewerNames: _interviewerNames,
    rating: _rating,
    score: _score,
    rejectionDetailReason: _rejectionDetailReason,
    ...safeData
  } = raw;

  return {
    id: String(safeData.id || `ref-${Date.now()}`),
    candidateName: String(safeData.candidateName || safeData.fullName || 'Ứng viên'),
    candidateEmail: String(safeData.candidateEmail || safeData.email || ''),
    candidatePhone: String(safeData.candidatePhone || safeData.phone || ''),
    jobPostingId: String(safeData.jobPostingId || safeData.requisitionId || ''),
    jobTitle: String(safeData.jobTitle || safeData.title || 'Vị trí tuyển dụng'),
    departmentName: String(safeData.departmentName || safeData.department || 'Chưa phân phòng'),
    workLocation: String(safeData.workLocation || safeData.location || 'Hà Nội'),
    employmentType: String(safeData.employmentType || 'Toàn thời gian'),
    cvFileName: String(safeData.cvFileName || safeData.fileName || 'CV_UngVien.pdf'),
    cvFileSize: Number(safeData.cvFileSize || safeData.fileSize || 0),
    cvFileType: String(safeData.cvFileType || safeData.fileType || 'application/pdf'),
    cvFileUrl: typeof safeData.cvFileUrl === 'string' ? safeData.cvFileUrl : undefined,
    referralNote: String(safeData.referralNote || safeData.notes || ''),
    source: 'INTERNAL_REFERRAL',
    referrerId: String(safeData.referrerId || 'usr-current'),
    referrerName: String(safeData.referrerName || 'Nhân sự nội bộ'),
    referrerEmail: String(safeData.referrerEmail || ''),
    status: mapToGeneralStatus(String(safeData.status || '')),
    submittedAt: String(safeData.submittedAt || safeData.createdAt || new Date().toISOString()),
    updatedAt: String(safeData.updatedAt || safeData.submittedAt || new Date().toISOString()),
  };
};

/**
 * Danh sách vị trí tuyển dụng mẫu phong phú (Fallback khi offline)
 */
const FALLBACK_ACTIVE_JOBS: ActiveJobOption[] = [
  {
    id: 'jp-demo-306',
    title: 'Senior Frontend Developer (React, TypeScript & Tailwind CSS)',
    positionTitle: 'Senior Frontend Developer',
    departmentName: 'Khối Công nghệ & Sản phẩm',
    workLocation: 'Hà Nội',
    employmentType: 'Toàn thời gian (Full-time)',
    deadline: '2026-12-31',
    salaryText: '25 - 45 triệu VND',
  },
  {
    id: 'jp-demo-307',
    title: 'Senior Backend Engineer (Java / Spring Boot & Microservices)',
    positionTitle: 'Senior Backend Engineer',
    departmentName: 'Khối Công nghệ & Sản phẩm',
    workLocation: 'Hà Nội',
    employmentType: 'Toàn thời gian (Full-time)',
    deadline: '2026-11-30',
    salaryText: '30 - 55 triệu VND',
  },
  {
    id: 'jp-demo-308',
    title: 'AI & Machine Learning Specialist',
    positionTitle: 'Chuyên viên AI / Machine Learning',
    departmentName: 'Trung tâm Nghiên cứu AI & Dữ liệu',
    workLocation: 'Hà Nội',
    employmentType: 'Toàn thời gian (Full-time)',
    deadline: '2026-12-15',
    salaryText: '35 - 65 triệu VND',
  },
  {
    id: 'jp-demo-309',
    title: 'Chuyên viên Tuyển dụng Cao cấp (Senior IT Recruiter)',
    positionTitle: 'Senior IT Recruiter',
    departmentName: 'Ban Quản trị Nguồn nhân lực',
    workLocation: 'TP. Hồ Chí Minh',
    employmentType: 'Toàn thời gian (Full-time)',
    deadline: '2026-11-20',
    salaryText: '18 - 28 triệu VND',
  },
  {
    id: 'jp-demo-310',
    title: 'UI/UX Product Designer',
    positionTitle: 'UI/UX Designer',
    departmentName: 'Khối Công nghệ & Sản phẩm',
    workLocation: 'Làm việc từ xa (Remote)',
    employmentType: 'Linh hoạt (Hybrid)',
    deadline: '2026-12-31',
    salaryText: '20 - 35 triệu VND',
  },
];

/**
 * Khởi tạo dữ liệu hồ sơ mẫu ban đầu với 4 trạng thái chuẩn hóa
 */
const getInitialMockReferrals = (currentUserEmail?: string): CandidateReferral[] => {
  const currentEmail = currentUserEmail || 'admin@congty.test';
  return [
    {
      id: 'ref-101',
      candidateName: 'Trần Văn Hoàng',
      candidateEmail: 'hoang.tranvan@gmail.com',
      candidatePhone: '0912345678',
      jobPostingId: 'jp-demo-306',
      jobTitle: 'Senior Frontend Developer (React, TypeScript & Tailwind CSS)',
      departmentName: 'Khối Công nghệ & Sản phẩm',
      workLocation: 'Hà Nội',
      employmentType: 'Toàn thời gian (Full-time)',
      cvFileName: 'CV_TranVanHoang_Frontend_Lead.pdf',
      cvFileSize: 1024 * 750,
      cvFileType: 'application/pdf',
      referralNote:
        'Hoàng là cựu Tech Lead tại công ty cũ của tôi, có 5 năm chuyên sâu về React/TypeScript và tối ưu hóa hệ thống quy mô lớn. Rất phù hợp với định hướng phát triển Frontend hiện tại.',
      source: 'INTERNAL_REFERRAL',
      referrerId: 'usr-001',
      referrerName: 'Quản trị viên',
      referrerEmail: currentEmail,
      status: 'INTERVIEWING',
      submittedAt: '2026-10-10T09:30:00.000Z',
      updatedAt: '2026-10-12T14:00:00.000Z',
    },
    {
      id: 'ref-102',
      candidateName: 'Lê Thị Thu Thảo',
      candidateEmail: 'thao.lethu@yahoo.com',
      candidatePhone: '0987654321',
      jobPostingId: 'jp-demo-307',
      jobTitle: 'Senior Backend Engineer (Java / Spring Boot & Microservices)',
      departmentName: 'Khối Công nghệ & Sản phẩm',
      workLocation: 'Hà Nội',
      employmentType: 'Toàn thời gian (Full-time)',
      cvFileName: 'LeThiThuThao_Java_Backend.docx',
      cvFileSize: 1024 * 420,
      cvFileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      referralNote:
        'Bạn học cùng đại học Bách Khoa, có kinh nghiệm thiết kế kiến trúc Microservices và xử lý dữ liệu lớn bằng Kafka/PostgreSQL. Tư duy giải quyết vấn đề xuất sắc.',
      source: 'INTERNAL_REFERRAL',
      referrerId: 'usr-001',
      referrerName: 'Quản trị viên',
      referrerEmail: currentEmail,
      status: 'IN_REVIEW',
      submittedAt: '2026-10-12T11:15:00.000Z',
      updatedAt: '2026-10-13T08:30:00.000Z',
    },
    {
      id: 'ref-103',
      candidateName: 'Nguyễn Đăng Quang',
      candidateEmail: 'quang.nguyendang@outlook.com',
      candidatePhone: '0903456789',
      jobPostingId: 'jp-demo-308',
      jobTitle: 'AI & Machine Learning Specialist',
      departmentName: 'Trung tâm Nghiên cứu AI & Dữ liệu',
      workLocation: 'Hà Nội',
      employmentType: 'Toàn thời gian (Full-time)',
      cvFileName: 'NguyenDangQuang_CV_AI_Engineer.pdf',
      cvFileSize: 1024 * 1024 * 1.8,
      cvFileType: 'application/pdf',
      referralNote:
        'Nghiên cứu sinh Thạc sĩ Trí tuệ Nhân tạo, từng đạt giải trong các cuộc thi Kaggle. Kỹ năng lập trình Python, PyTorch và LLM Fine-tuning thực chiến tốt.',
      source: 'INTERNAL_REFERRAL',
      referrerId: 'usr-001',
      referrerName: 'Quản trị viên',
      referrerEmail: currentEmail,
      status: 'RECEIVED',
      submittedAt: '2026-10-14T08:20:00.000Z',
      updatedAt: '2026-10-14T08:20:00.000Z',
    },
    {
      id: 'ref-104',
      candidateName: 'Phạm Quỳnh Anh',
      candidateEmail: 'quynhanh.pham@gmail.com',
      candidatePhone: '0936123456',
      jobPostingId: 'jp-demo-309',
      jobTitle: 'Chuyên viên Tuyển dụng Cao cấp (Senior IT Recruiter)',
      departmentName: 'Ban Quản trị Nguồn nhân lực',
      workLocation: 'TP. Hồ Chí Minh',
      employmentType: 'Toàn thời gian (Full-time)',
      cvFileName: 'PhamQuynhAnh_Senior_Recruiter.pdf',
      cvFileSize: 1024 * 850,
      cvFileType: 'application/pdf',
      referralNote:
        'Đồng nghiệp cũ có hơn 4 năm kinh nghiệm Headhunt mảng công nghệ thông tin. Mạng lưới ứng viên IT rộng và khả năng phỏng vấn hành vi chuyên sâu.',
      source: 'INTERNAL_REFERRAL',
      referrerId: 'usr-001',
      referrerName: 'Quản trị viên',
      referrerEmail: currentEmail,
      status: 'COMPLETED',
      submittedAt: '2026-09-25T14:45:00.000Z',
      updatedAt: '2026-10-05T17:00:00.000Z',
    },
  ];
};

export interface GetMyReferralsParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const referralService = {
  /**
   * 1. Lấy danh sách các vị trí/tin tuyển dụng đang mở để đổ dữ liệu vào dropdown (AC 1)
   */
  async getOpenJobPostings(): Promise<ActiveJobOption[]> {
    try {
      const response = await jobPostingService.getPublicJobs({ pageSize: 50 });
      if (response && response.items && response.items.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return response.items
          .filter((job) => {
            if (job.status && job.status !== 'PUBLISHED') return false;
            if (job.deadline) {
              const deadlineDate = new Date(job.deadline);
              if (!isNaN(deadlineDate.getTime()) && deadlineDate < today) {
                return false;
              }
            }
            return true;
          })
          .map((job) => ({
            id: job.id || '',
            title: job.title,
            positionTitle: job.positionTitle,
            departmentName: job.departmentName || 'Chưa phân phòng',
            workLocation: job.workLocation || 'Hà Nội',
            employmentType:
              job.employmentType === 'FULL_TIME'
                ? 'Toàn thời gian (Full-time)'
                : job.employmentType === 'PART_TIME'
                ? 'Bán thời gian (Part-time)'
                : job.employmentType === 'INTERNSHIP'
                ? 'Thực tập sinh (Internship)'
                : 'Hợp đồng dự án (Contract)',
            deadline: job.deadline,
            salaryText:
              job.salaryType === 'NEGOTIABLE'
                ? 'Thỏa thuận'
                : job.salaryMin && job.salaryMax
                ? `${job.salaryMin} - ${job.salaryMax} triệu ${job.currency || 'VND'}`
                : undefined,
          }));
      }
    } catch {
      // Fallback
    }

    return FALLBACK_ACTIVE_JOBS;
  },

  // Alias tương thích ngược
  async getActiveJobOpenings(): Promise<ActiveJobOption[]> {
    return this.getOpenJobPostings();
  },

  /**
   * 2. Lấy danh sách các hồ sơ do chính nhân sự nội bộ đang đăng nhập đã giới thiệu (AC 1 & AC 2)
   * TUÂN THỦ BẢO MẬT DỮ LIỆU CÁ NHÂN: Chỉ trả về trạng thái tổng quát, đã qua sanitize loại bỏ thông tin nội bộ HR.
   */
  async getMyReferrals(
    params?: GetMyReferralsParams | string
  ): Promise<CandidateReferral[]> {
    const emailParam = typeof params === 'string' ? params : undefined;
    const queryParams = typeof params === 'object' ? params : undefined;

    try {
      // Gọi API Backend
      const response = await axiosClient.get<Record<string, unknown>[]>(
        '/referrals/my-referrals',
        { params: queryParams }
      );
      if (response && Array.isArray(response.data)) {
        return response.data.map(sanitizeReferralData);
      }
    } catch {
      // Tiếp tục đọc từ localStorage persistence khi offline/mock
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY_REFERRALS);
      if (stored) {
        const list = JSON.parse(stored) as Record<string, unknown>[];
        if (Array.isArray(list) && list.length > 0) {
          return list.map(sanitizeReferralData);
        }
      }
    } catch {
      // Lỗi parse JSON
    }

    const initial = getInitialMockReferrals(emailParam);
    try {
      localStorage.setItem(STORAGE_KEY_REFERRALS, JSON.stringify(initial));
    } catch {
      // Bỏ qua
    }
    return initial.map((item) => sanitizeReferralData(item as unknown as Record<string, unknown>));
  },

  /**
   * 3. Nộp hồ sơ giới thiệu ứng viên mới qua FormData hoặc Object payload (AC 1 & AC 2)
   * Tự động đính kèm nhãn nguồn INTERNAL_REFERRAL và thông tin người giới thiệu.
   */
  async createReferral(
    input: FormData | CreateReferralPayload,
    currentUser?: { id: string; fullName: string; email: string },
    jobInfo?: ActiveJobOption
  ): Promise<CandidateReferral> {
    let jobPostingId = '';
    let candidateName = '';
    let candidateEmail = '';
    let candidatePhone = '';
    let referralNote = '';
    let cvFile: File | null = null;

    if (input instanceof FormData) {
      jobPostingId = String(input.get('jobPostingId') || input.get('requisitionId') || '');
      candidateName = String(input.get('candidateName') || input.get('fullName') || '').trim();
      candidateEmail = String(input.get('candidateEmail') || input.get('email') || '')
        .trim()
        .toLowerCase();
      candidatePhone = String(input.get('candidatePhone') || input.get('phone') || '').trim();
      referralNote = String(input.get('referralNote') || input.get('notes') || '').trim();
      const fileEntry = input.get('cvFile') || input.get('file');
      if (fileEntry instanceof File) {
        cvFile = fileEntry;
      }
    } else {
      jobPostingId = input.jobPostingId;
      candidateName = input.candidateName.trim();
      candidateEmail = input.candidateEmail.trim().toLowerCase();
      candidatePhone = input.candidatePhone.trim();
      referralNote = input.referralNote.trim();
      cvFile = input.cvFile;
    }

    // 1. Kiểm tra trường bắt buộc
    if (!jobPostingId) {
      throw new Error('Vui lòng chọn vị trí tuyển dụng ứng tuyển.');
    }
    if (!candidateName) {
      throw new Error('Họ và tên ứng viên không được để trống.');
    }
    if (!candidateEmail) {
      throw new Error('Email ứng viên không được để trống.');
    }
    if (!candidatePhone) {
      throw new Error('Số điện thoại ứng viên không được để trống.');
    }
    if (!referralNote) {
      throw new Error('Vui lòng nhập lý do giới thiệu và nhận xét mức độ phù hợp của ứng viên.');
    }
    if (!cvFile) {
      throw new Error('Vui lòng đính kèm tệp CV của ứng viên (định dạng PDF hoặc DOCX).');
    }

    // 2. Kiểm tra định dạng tệp CV (chỉ chấp nhận PDF hoặc DOCX)
    const fileExt = '.' + (cvFile.name.split('.').pop() || '').toLowerCase();
    const isExtensionValid = ALLOWED_EXTENSIONS.includes(fileExt);
    const isMimeValid = ALLOWED_MIME_TYPES.includes(cvFile.type) || cvFile.type === '';

    if (!isExtensionValid && !isMimeValid) {
      throw new InvalidReferralFileError(
        'Định dạng tệp không được hỗ trợ. Vui lòng chỉ tải lên tệp CV ở định dạng PDF (.pdf) hoặc Word (.docx).'
      );
    }

    // 3. Kiểm tra dung lượng tệp CV (tối đa 10MB)
    if (cvFile.size > MAX_FILE_SIZE_BYTES) {
      const fileSizeMB = (cvFile.size / (1024 * 1024)).toFixed(1);
      throw new InvalidReferralFileError(
        `Dung lượng tệp CV vượt quá mức cho phép (${fileSizeMB}MB / tối đa 10MB). Vui lòng nén hoặc chọn tệp nhỏ hơn.`
      );
    }

    const user = currentUser || {
      id: 'usr-current',
      fullName: 'Nhân sự nội bộ',
      email: 'nhansu@congty.test',
    };

    // 4. Kiểm tra nộp trùng ứng viên vào cùng 1 vị trí bằng cùng email (AC 2)
    const existingList = await this.getMyReferrals(user.email);
    const duplicate = existingList.find(
      (ref) =>
        ref.jobPostingId === jobPostingId &&
        ref.candidateEmail.toLowerCase() === candidateEmail
    );

    if (duplicate) {
      const positionName = jobInfo?.title || duplicate.jobTitle;
      throw new DuplicateReferralError(
        `Ứng viên với email "${candidateEmail}" đã được giới thiệu cho vị trí "${positionName}" trước đó. Vui lòng kiểm tra lại bảng theo dõi hoặc chọn vị trí tuyển dụng khác.`
      );
    }

    // 5. Chuẩn bị FormData gửi lên Backend
    const uploadFormData = new FormData();
    uploadFormData.append('jobPostingId', jobPostingId);
    uploadFormData.append('requisitionId', jobPostingId);
    uploadFormData.append('candidateName', candidateName);
    uploadFormData.append('fullName', candidateName);
    uploadFormData.append('candidateEmail', candidateEmail);
    uploadFormData.append('email', candidateEmail);
    uploadFormData.append('candidatePhone', candidatePhone);
    uploadFormData.append('phone', candidatePhone);
    uploadFormData.append('referralNote', referralNote);
    uploadFormData.append('source', 'INTERNAL_REFERRAL');
    uploadFormData.append('referrerId', user.id);
    uploadFormData.append('referrerName', user.fullName);
    uploadFormData.append('referrerEmail', user.email);
    uploadFormData.append('cvFile', cvFile);

    // 6. Gửi API backend
    let backendResult: Record<string, unknown> | null = null;
    try {
      const response = await axiosClient.post<Record<string, unknown>>(
        '/referrals',
        uploadFormData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      if (response && response.data) {
        backendResult = response.data;
      }
    } catch (apiError: unknown) {
      // Nếu API trả về lỗi 409 Conflict hoặc Duplicate từ server
      const axiosErr = apiError as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr.response?.status === 409) {
        throw new DuplicateReferralError(
          axiosErr.response.data?.message ||
            `Ứng viên với email "${candidateEmail}" đã tồn tại trong quy trình tuyển dụng cho vị trí này.`
        );
      }
      if (axiosErr.response?.status === 413) {
        throw new InvalidReferralFileError(
          'Dung lượng tệp CV vượt quá giới hạn của máy chủ. Vui lòng chọn tệp dưới 10MB.'
        );
      }
    }

    // 7. Tạo bản ghi hoàn chỉnh và lưu LocalStorage
    const newReferral: CandidateReferral = sanitizeReferralData({
      id: backendResult?.id || `ref-${Date.now()}`,
      candidateName,
      candidateEmail,
      candidatePhone,
      jobPostingId,
      jobTitle: jobInfo?.title || backendResult?.jobTitle || 'Vị trí tuyển dụng',
      departmentName: jobInfo?.departmentName || backendResult?.departmentName || 'Chưa phân phòng',
      workLocation: jobInfo?.workLocation || backendResult?.workLocation || 'Hà Nội',
      employmentType: jobInfo?.employmentType || backendResult?.employmentType || 'Toàn thời gian',
      cvFileName: cvFile.name,
      cvFileSize: cvFile.size,
      cvFileType: cvFile.type || (fileExt === '.pdf' ? 'application/pdf' : 'application/docx'),
      referralNote,
      source: 'INTERNAL_REFERRAL',
      referrerId: user.id,
      referrerName: user.fullName,
      referrerEmail: user.email,
      status: mapToGeneralStatus(String(backendResult?.status || 'RECEIVED')),
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const updatedList = [newReferral, ...existingList];
    try {
      localStorage.setItem(STORAGE_KEY_REFERRALS, JSON.stringify(updatedList));
    } catch {
      // Bỏ qua
    }

    return newReferral;
  },

  // Alias tương thích ngược cho submitReferral
  async submitReferral(
    payload: CreateReferralPayload,
    currentUser: { id: string; fullName: string; email: string },
    jobInfo?: ActiveJobOption
  ): Promise<CandidateReferral> {
    return this.createReferral(payload, currentUser, jobInfo);
  },
};

export default referralService;

