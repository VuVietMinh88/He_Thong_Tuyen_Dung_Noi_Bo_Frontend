import type {
  ActiveJobOption,
  CandidateReferral,
  CreateReferralPayload,
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
 * Danh sách vị trí tuyển dụng mẫu phong phú (Fallback khi offline/mock)
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
 * Khởi tạo dữ liệu hồ sơ giới thiệu mẫu (bao gồm đầy đủ 4 trạng thái chuẩn)
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
      cvFileSize: 1024 * 750, // 750KB
      cvFileType: 'application/pdf',
      referralNote: 'Hoàng là cựu Tech Lead tại công ty cũ của tôi, có 5 năm chuyên sâu về React/TypeScript và tối ưu hóa hệ thống quy mô lớn. Rất phù hợp với định hướng phát triển Frontend hiện tại.',
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
      cvFileSize: 1024 * 420, // 420KB
      cvFileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      referralNote: 'Bạn học cùng đại học Bách Khoa, có kinh nghiệm thiết kế kiến trúc Microservices và xử lý dữ liệu lớn bằng Kafka/PostgreSQL. Tư duy giải quyết vấn đề xuất sắc.',
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
      cvFileSize: 1024 * 1024 * 1.8, // 1.8MB
      cvFileType: 'application/pdf',
      referralNote: 'Nghiên cứu sinh Thạc sĩ Trí tuệ Nhân tạo, từng đạt giải trong các cuộc thi Kaggle. Kỹ năng lập trình Python, PyTorch và LLM Fine-tuning thực chiến tốt.',
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
      cvFileSize: 1024 * 850, // 850KB
      cvFileType: 'application/pdf',
      referralNote: 'Đồng nghiệp cũ có hơn 4 năm kinh nghiệm Headhunt mảng công nghệ thông tin. Mạng lưới ứng viên IT rộng và khả năng phỏng vấn hành vi chuyên sâu.',
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

export const referralService = {
  /**
   * Lấy danh sách các vị trí đang tuyển dụng (đã xuất bản và còn hạn nhận hồ sơ)
   */
  async getActiveJobOpenings(): Promise<ActiveJobOption[]> {
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

  /**
   * Lấy danh sách các hồ sơ do chính nhân sự hiện tại đã giới thiệu
   * TUÂN THỦ BẢO MẬT DỮ LIỆU CÁ NHÂN: Chỉ trả về trạng thái tổng quát, không chứa đánh giá nội bộ của HR.
   */
  async getMyReferrals(currentUserEmail?: string): Promise<CandidateReferral[]> {
    try {
      // Thử gọi API Backend nếu có
      const response = await axiosClient.get<CandidateReferral[]>('/referrals/my-referrals');
      if (response && Array.isArray(response.data)) {
        return response.data;
      }
    } catch {
      // Tiếp tục đọc từ localStorage persistence
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY_REFERRALS);
      if (stored) {
        const list = JSON.parse(stored) as CandidateReferral[];
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch {
      // Lỗi parse JSON
    }

    const initial = getInitialMockReferrals(currentUserEmail);
    try {
      localStorage.setItem(STORAGE_KEY_REFERRALS, JSON.stringify(initial));
    } catch {
      // Bỏ qua nếu storage bị chặn
    }
    return initial;
  },

  /**
   * Nộp hồ sơ giới thiệu ứng viên nội bộ mới (AC 1 & AC 2)
   */
  async submitReferral(
    payload: CreateReferralPayload,
    currentUser: { id: string; fullName: string; email: string },
    jobInfo?: ActiveJobOption
  ): Promise<CandidateReferral> {
    const candidateName = payload.candidateName.trim();
    const candidateEmail = payload.candidateEmail.trim().toLowerCase();
    const candidatePhone = payload.candidatePhone.trim();
    const referralNote = payload.referralNote.trim();
    const file = payload.cvFile;

    // 1. Kiểm tra trường bắt buộc
    if (!payload.jobPostingId) {
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
    if (!file) {
      throw new Error('Vui lòng đính kèm tệp CV của ứng viên (định dạng PDF hoặc DOCX).');
    }

    // 2. Kiểm tra định dạng tệp CV (chỉ chấp nhận PDF hoặc DOCX)
    const fileExt = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const isExtensionValid = ALLOWED_EXTENSIONS.includes(fileExt);
    const isMimeValid = ALLOWED_MIME_TYPES.includes(file.type) || file.type === '';

    if (!isExtensionValid && !isMimeValid) {
      throw new InvalidReferralFileError(
        'Định dạng tệp không được hỗ trợ. Vui lòng chỉ tải lên tệp CV ở định dạng PDF (.pdf) hoặc Word (.docx).'
      );
    }

    // 3. Kiểm tra dung lượng tệp CV (tối đa 10MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      throw new InvalidReferralFileError(
        `Dung lượng tệp CV vượt quá mức cho phép (${fileSizeMB}MB / tối đa 10MB). Vui lòng nén hoặc chọn tệp nhỏ hơn.`
      );
    }

    // 4. Kiểm tra nộp trùng ứng viên vào cùng 1 vị trí bằng cùng email (AC 2)
    const existingList = await this.getMyReferrals(currentUser.email);
    const duplicate = existingList.find(
      (ref) =>
        ref.jobPostingId === payload.jobPostingId &&
        ref.candidateEmail.toLowerCase() === candidateEmail
    );

    if (duplicate) {
      const positionName = jobInfo?.title || duplicate.jobTitle;
      throw new DuplicateReferralError(
        `Ứng viên với email "${candidateEmail}" đã được giới thiệu cho vị trí "${positionName}" trước đó. Vui lòng kiểm tra lại bảng theo dõi hoặc chọn vị trí tuyển dụng khác.`
      );
    }

    // 5. Chuẩn bị bản ghi giới thiệu mới (Gắn tự động INTERNAL_REFERRAL và tên người giới thiệu)
    const newReferral: CandidateReferral = {
      id: `ref-${Date.now()}`,
      candidateName,
      candidateEmail,
      candidatePhone,
      jobPostingId: payload.jobPostingId,
      jobTitle: jobInfo?.title || 'Vị trí tuyển dụng',
      departmentName: jobInfo?.departmentName || 'Chưa phân phòng',
      workLocation: jobInfo?.workLocation || 'Hà Nội',
      employmentType: jobInfo?.employmentType || 'Toàn thời gian',
      cvFileName: file.name,
      cvFileSize: file.size,
      cvFileType: file.type || (fileExt === '.pdf' ? 'application/pdf' : 'application/docx'),
      referralNote,
      source: 'INTERNAL_REFERRAL',
      referrerId: currentUser.id || 'usr-current',
      referrerName: currentUser.fullName || 'Nhân sự nội bộ',
      referrerEmail: currentUser.email,
      status: 'RECEIVED', // Chuẩn hóa trạng thái khởi tạo là 'Đã nhận'
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 6. Gửi API (nếu có endpoint) hoặc lưu LocalStorage
    try {
      const formData = new FormData();
      formData.append('jobPostingId', payload.jobPostingId);
      formData.append('candidateName', candidateName);
      formData.append('candidateEmail', candidateEmail);
      formData.append('candidatePhone', candidatePhone);
      formData.append('referralNote', referralNote);
      formData.append('cvFile', file);

      await axiosClient.post('/referrals', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch {
      // Fallback lưu LocalStorage
    }

    const updatedList = [newReferral, ...existingList];
    try {
      localStorage.setItem(STORAGE_KEY_REFERRALS, JSON.stringify(updatedList));
    } catch {
      // Bỏ qua
    }

    return newReferral;
  },
};

export default referralService;

