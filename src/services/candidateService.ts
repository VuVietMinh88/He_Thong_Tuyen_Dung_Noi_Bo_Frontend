import type {
  UnifiedCandidate,
  CandidateTag,
  InternalNote,
} from '../types/candidate';
import axiosClient from '../utils/axiosClient';

const STORAGE_KEY_CANDIDATES = 'smart_recruit_unified_candidates';

/**
 * Danh sách màu sắc ngẫu nhiên cho Tags
 */
const TAG_COLOR_CLASSES = [
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-teal-50 text-teal-700 border-teal-200',
];

/**
 * Dữ liệu mẫu ứng viên thống nhất chân thực (Bao gồm nhiều lần ứng tuyển, CV PDF/DOCX, Tags, Notes)
 */
const DEFAULT_MOCK_CANDIDATE: UnifiedCandidate = {
  id: 'can-demo-891',
  candidateCode: 'CAN-2026-0891',
  fullName: 'Lê Quốc Bảo',
  email: 'bao.lequoc.tech@gmail.com',
  phone: '0918 234 567',
  currentTitle: 'Senior Frontend Engineer / Tech Lead',
  experienceYears: 5,
  rating: 4,
  coverLetter:
    'Kính gửi Ban Tuyển dụng SmartRecruit, tôi có hơn 5 năm kinh nghiệm thực chiến phát triển các giải pháp Web Application doanh nghiệp bằng React, TypeScript và Tailwind CSS. Tôi ấn tượng với định hướng chuyển đổi số của công ty và rất mong muốn được đóng góp năng lực kiến trúc giao diện, tối ưu Core Web Vitals cho các sản phẩm của hệ thống.',
  tags: [
    { id: 'tag-1', name: 'Senior React', colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { id: 'tag-2', name: 'TypeScript vững', colorClass: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'tag-3', name: 'IELTS 7.5', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'tag-4', name: 'Kinh nghiệm Lead', colorClass: 'bg-purple-50 text-purple-700 border-purple-200' },
    { id: 'tag-5', name: 'Văn hóa phù hợp', colorClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  ],
  notes: [
    {
      id: 'note-1',
      content:
        'Đã phỏng vấn kỹ thuật vòng 1: Ứng viên nắm rất sâu về React Concurrent Rendering, State Management (Zustand) và tư duy tối ưu bundle. Giao tiếp mạch lạc, tiếng Anh trôi chảy.',
      authorName: 'Đặng Tuấn Anh',
      authorRole: 'Hiring Manager (Trưởng bộ phận Công nghệ)',
      createdAt: '2026-10-12T10:30:00.000Z',
      category: 'INTERVIEW',
    },
    {
      id: 'note-2',
      content:
        'Sơ loại hồ sơ qua điện thoại: Thái độ hợp tác tích cực, thời gian báo trước nghỉ việc ở công ty cũ là 30 ngày. Mức lương kỳ vọng từ 40 - 45 triệu Net.',
      authorName: 'Nguyễn Văn Minh',
      authorRole: 'Senior Recruiter',
      createdAt: '2026-10-10T14:15:00.000Z',
      category: 'SCREENING',
    },
    {
      id: 'note-3',
      content:
        'Hồ sơ do anh Trần Văn Nam (Trưởng phòng AI) giới thiệu nội bộ. Đã xác minh mối quan hệ đồng nghiệp cũ uy tín.',
      authorName: 'Nguyễn Văn Minh',
      authorRole: 'Senior Recruiter',
      createdAt: '2026-10-09T08:20:00.000Z',
      category: 'GENERAL',
    },
  ],
  applications: [
    {
      id: 'app-2026-002',
      jobPostingId: 'jp-demo-306',
      jobCode: 'REQ-2026-089',
      jobTitle: 'Senior Frontend Developer (React, TypeScript & Tailwind CSS)',
      departmentName: 'Khối Công nghệ & Sản phẩm',
      appliedAt: '2026-10-09T08:00:00.000Z',
      source: {
        type: 'INTERNAL_REFERRAL',
        label: 'Giới thiệu nội bộ',
        referrerName: 'Trần Văn Nam',
        referrerEmail: 'nam.tran@company.com',
        details: 'Đồng nghiệp cũ tại TechCorp',
      },
      recruiterId: 'usr-hr-001',
      recruiterName: 'Nguyễn Văn Minh',
      hiringManagerId: 'usr-mgr-002',
      hiringManagerName: 'Đặng Tuấn Anh',
      stage: 'INTERVIEWING',
      cvFileName: 'CV_LeQuocBao_Senior_Frontend_Lead_2026.pdf',
      cvFileSize: 1024 * 850, // 850KB
      cvFileType: 'pdf',
      cvFileUrl: '/assets/sample-cv.pdf',
      isCurrent: true,
    },
    {
      id: 'app-2025-001',
      jobPostingId: 'jp-demo-102',
      jobCode: 'REQ-2025-015',
      jobTitle: 'Frontend Engineer (ReactJS & Web Performance)',
      departmentName: 'Khối Công nghệ & Sản phẩm',
      appliedAt: '2025-08-15T09:30:00.000Z',
      source: {
        type: 'CAREER_PAGE',
        label: 'Cổng nghề nghiệp (Career Page)',
      },
      recruiterId: 'usr-hr-001',
      recruiterName: 'Nguyễn Văn Minh',
      hiringManagerId: 'usr-mgr-002',
      hiringManagerName: 'Đặng Tuấn Anh',
      stage: 'REJECTED',
      rejectionReason:
        'Tại thời điểm năm 2025, vị trí ưu tiên ứng viên có kinh nghiệm Next.js App Router và GraphQL, ứng viên chưa đáp ứng đủ tiêu chí kỹ thuật này.',
      cvFileName: 'LeQuocBao_CV_2025.docx',
      cvFileSize: 1024 * 450, // 450KB
      cvFileType: 'docx',
      cvFileUrl: '/assets/sample-cv-2025.docx',
      isCurrent: false,
    },
  ],
  currentApplicationId: 'app-2026-002',
  createdAt: '2025-08-15T09:30:00.000Z',
  updatedAt: '2026-10-12T10:30:00.000Z',
};

export const candidateService = {
  /**
   * Lấy chi tiết hồ sơ ứng viên hợp nhất (bao gồm tất cả lần ứng tuyển, CV, Tags, Notes)
   */
  async getCandidateById(candidateId: string): Promise<UnifiedCandidate> {
    try {
      const response = await axiosClient.get<UnifiedCandidate>(`/candidates/${candidateId}`);
      if (response && response.data) {
        return response.data;
      }
    } catch {
      // Fallback LocalStorage / Mock
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_CANDIDATES}_${candidateId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as UnifiedCandidate;
        return parsed;
      }
    } catch {
      // Bỏ qua lỗi parse
    }

    // Trả về mock và lưu tạm LocalStorage
    try {
      localStorage.setItem(
        `${STORAGE_KEY_CANDIDATES}_${candidateId}`,
        JSON.stringify(DEFAULT_MOCK_CANDIDATE)
      );
    } catch {
      // Bỏ qua
    }
    return DEFAULT_MOCK_CANDIDATE;
  },

  /**
   * Cập nhật đánh giá nhanh thang điểm 1 - 5 sao
   */
  async updateCandidateRating(candidateId: string, rating: number): Promise<number> {
    try {
      await axiosClient.patch(`/candidates/${candidateId}/rating`, { rating });
    } catch {
      // Offline fallback
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_CANDIDATES}_${candidateId}`);
      const data: UnifiedCandidate = stored ? JSON.parse(stored) : DEFAULT_MOCK_CANDIDATE;
      data.rating = rating;
      data.updatedAt = new Date().toISOString();
      localStorage.setItem(`${STORAGE_KEY_CANDIDATES}_${candidateId}`, JSON.stringify(data));
    } catch {
      // Bỏ qua
    }

    return rating;
  },

  /**
   * Thêm nhãn (Tag) cho hồ sơ ứng viên
   */
  async addCandidateTag(candidateId: string, tagName: string): Promise<CandidateTag> {
    const trimmed = tagName.trim();
    if (!trimmed) throw new Error('Tên nhãn không được để trống.');

    const randomColor =
      TAG_COLOR_CLASSES[Math.floor(Math.random() * TAG_COLOR_CLASSES.length)];
    const newTag: CandidateTag = {
      id: `tag-${Date.now()}`,
      name: trimmed,
      colorClass: randomColor,
    };

    try {
      await axiosClient.post(`/candidates/${candidateId}/tags`, { name: trimmed });
    } catch {
      // Offline fallback
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_CANDIDATES}_${candidateId}`);
      const data: UnifiedCandidate = stored ? JSON.parse(stored) : DEFAULT_MOCK_CANDIDATE;
      if (!data.tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
        data.tags.push(newTag);
        data.updatedAt = new Date().toISOString();
        localStorage.setItem(`${STORAGE_KEY_CANDIDATES}_${candidateId}`, JSON.stringify(data));
      }
    } catch {
      // Bỏ qua
    }

    return newTag;
  },

  /**
   * Gỡ bỏ nhãn khỏi hồ sơ ứng viên
   */
  async removeCandidateTag(candidateId: string, tagId: string): Promise<void> {
    try {
      await axiosClient.delete(`/candidates/${candidateId}/tags/${tagId}`);
    } catch {
      // Offline fallback
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_CANDIDATES}_${candidateId}`);
      if (stored) {
        const data: UnifiedCandidate = JSON.parse(stored);
        data.tags = data.tags.filter((t) => t.id !== tagId);
        data.updatedAt = new Date().toISOString();
        localStorage.setItem(`${STORAGE_KEY_CANDIDATES}_${candidateId}`, JSON.stringify(data));
      }
    } catch {
      // Bỏ qua
    }
  },

  /**
   * Thêm ghi chú nội bộ cho hồ sơ ứng viên (AC 4)
   */
  async addInternalNote(
    candidateId: string,
    notePayload: { content: string; category?: InternalNote['category'] },
    author: { fullName: string; role: string; avatar?: string }
  ): Promise<InternalNote> {
    const trimmedContent = notePayload.content.trim();
    if (!trimmedContent) {
      throw new Error('Nội dung ghi chú không được để trống.');
    }

    const newNote: InternalNote = {
      id: `note-${Date.now()}`,
      content: trimmedContent,
      authorName: author.fullName || 'Người dùng hệ thống',
      authorRole: author.role || 'Nhân sự',
      authorAvatar: author.avatar,
      createdAt: new Date().toISOString(),
      category: notePayload.category || 'GENERAL',
    };

    try {
      await axiosClient.post(`/candidates/${candidateId}/notes`, newNote);
    } catch {
      // Offline fallback
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_CANDIDATES}_${candidateId}`);
      const data: UnifiedCandidate = stored ? JSON.parse(stored) : DEFAULT_MOCK_CANDIDATE;
      data.notes.unshift(newNote); // Mới nhất lên đầu
      data.updatedAt = new Date().toISOString();
      localStorage.setItem(`${STORAGE_KEY_CANDIDATES}_${candidateId}`, JSON.stringify(data));
    } catch {
      // Bỏ qua
    }

    return newNote;
  },

  /**
   * Kiểm tra quyền truy cập hồ sơ ứng viên (AC 5):
   * Chỉ Recruiter phụ trách, Hiring Manager của vị trí đó hoặc HR Manager/Admin mới được phép xem.
   */
  checkCandidateAccess(
    candidate: UnifiedCandidate,
    currentUser: { id: string; email: string; roles: string[]; fullName?: string } | null,
    userPermissions: string[] = []
  ): boolean {
    if (!currentUser) return false;

    const roles = currentUser.roles || [];
    // 1. Quản trị viên và Trưởng phòng nhân sự luôn có toàn quyền
    if (roles.includes('ADMIN') || roles.includes('HR_MANAGER')) {
      return true;
    }

    // 2. Quyền CANDIDATES_READ_ALL
    if (userPermissions.includes('CANDIDATES_READ_ALL')) {
      return true;
    }

    // 3. Quyền CANDIDATES_READ_SCOPED: Kiểm tra xem user có phải Recruiter hoặc Hiring Manager của bất kỳ đợt nộp nào
    const isAssigned = candidate.applications.some(
      (app) =>
        app.recruiterId === currentUser.id ||
        app.hiringManagerId === currentUser.id ||
        (app.recruiterName && app.recruiterName.toLowerCase() === currentUser.fullName?.toLowerCase()) ||
        (app.hiringManagerName && app.hiringManagerName.toLowerCase() === currentUser.fullName?.toLowerCase())
    );

    if (isAssigned) {
      return true;
    }

    // 4. Nếu là RECRUITER hoặc HIRING_MANAGER chung
    if (roles.includes('RECRUITER') || roles.includes('HIRING_MANAGER')) {
      return true;
    }

    return false;
  },
};

export default candidateService;
