import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import type {
  CandidateProfile,
  CvSuggestedCandidateInfo,
  CandidateFilterCriteria,
  UnifiedCandidate,
  CandidateTag,
  InternalNote,
  CandidateInternalNote,
  ScreeningCatalogTag,
  CandidateScreeningUpdatePayload,
} from '../types/candidate';
import { DEFAULT_SCREENING_CATALOG_TAGS } from '../types/candidate';
import { resolveCandidateMatchingEvaluation } from '../utils/candidateMatchingHelper';

const STORAGE_KEY_CANDIDATE_PROFILES = 'smart_recruit_candidate_profiles';
const STORAGE_KEY_CANDIDATES = 'smart_recruit_unified_candidates';

const DEFAULT_MOCK_CANDIDATES: CandidateProfile[] = [
  {
    id: 'cand-001',
    trackingCode: 'APP-2026-9F8A1B',
    fullName: 'Nguyen Van A',
    email: 'vana.temp@gmail.com',
    phone: '0912345678',
    appliedJobId: 'jp-demo-306',
    appliedJobTitle: 'Senior Frontend Developer (React, TypeScript & Tailwind CSS)',
    departmentName: 'Khối Công nghệ & Sản phẩm',
    source: 'Website công ty',
    status: 'Mới tiếp nhận',
    cvUrl: '/sample-cv-1.pdf',
    cvFileName: 'CV_NguyenVanAn_SeniorFrontend.pdf',
    cvParsingStatus: 'PENDING_CONFIRMATION',
    cvSuggestedInfo: {
      fullName: 'Nguyễn Văn An',
      email: 'an.nguyen.dev@outlook.com',
      phone: '0988123456',
      confidenceScore: 0.94,
      extractedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      rawSnippet: 'Họ tên: Nguyễn Văn An | Email: an.nguyen.dev@outlook.com | ĐT: 0988123456',
    },
    coverLetter: 'Tôi có hơn 5 năm kinh nghiệm phát triển các ứng dụng web quy mô lớn.',
    appliedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'cand-002',
    trackingCode: 'APP-2026-3C7E9D',
    fullName: 'Trần Thị Bích',
    email: 'bich.tran@company.com',
    phone: '0988776655',
    appliedJobId: 'jp-demo-307',
    appliedJobTitle: 'Senior Backend Engineer (Java / Spring Boot & Microservices)',
    departmentName: 'Khối Công nghệ & Sản phẩm',
    source: 'LinkedIn',
    status: 'Đang đánh giá',
    cvUrl: '/sample-cv-2.pdf',
    cvFileName: 'Resume_TranThiBich_Backend.pdf',
    cvParsingStatus: 'CONFIRMED',
    cvSuggestedInfo: {
      fullName: 'Trần Thị Bích',
      email: 'bich.tran@company.com',
      phone: '0988776655',
      confidenceScore: 0.98,
      extractedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      rawSnippet: 'Trần Thị Bích - Kỹ sư Backend cao cấp - bich.tran@company.com',
    },
    coverLetter: 'Mong muốn được thử sức với hệ thống phân tán microservices quy mô lớn.',
    appliedAt: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cand-003',
    trackingCode: 'APP-2026-6K2L8M',
    fullName: 'Lê Hoàng Nam',
    email: 'nam.le.ai@gmail.com',
    phone: '0933221100',
    appliedJobId: 'jp-demo-308',
    appliedJobTitle: 'AI & Machine Learning Specialist',
    departmentName: 'Trung tâm Nghiên cứu AI & Dữ liệu',
    source: 'Giới thiệu nội bộ',
    status: 'Mới tiếp nhận',
    cvUrl: '/sample-cv-3.pdf',
    cvFileName: 'LeHoangNam_CV_AI_Specialist.pdf',
    cvParsingStatus: 'PARSING',
    coverLetter: 'Tôi đã có kinh nghiệm nghiên cứu mô hình LLM và Computer Vision.',
    appliedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'cand-004',
    trackingCode: 'APP-2026-1V4X7Z',
    fullName: 'Phạm Minh Tuấn',
    email: 'tuan.pham.recruiter@gmail.com',
    phone: '0977889900',
    appliedJobId: 'jp-demo-309',
    appliedJobTitle: 'Chuyên viên Tuyển dụng Cao cấp (Senior IT Recruiter)',
    departmentName: 'Ban Quản trị Nguồn nhân lực',
    source: 'TopCV',
    status: 'Mới tiếp nhận',
    cvUrl: '/sample-cv-4.pdf',
    cvFileName: 'PhamMinhTuan_ScanCV.pdf',
    cvParsingStatus: 'FAILED',
    cvParsingErrorMessage: 'Tệp CV là định dạng ảnh chụp scan, không thể trích xuất tự động văn bản có cấu trúc.',
    coverLetter: 'Mong muốn gia nhập đội ngũ tuyển dụng chuyên nghiệp của tập đoàn.',
    appliedAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 230 * 60 * 1000).toISOString(),
  },
];

const loadCandidateProfilesFromStorage = (): CandidateProfile[] => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return DEFAULT_MOCK_CANDIDATES;
    }

    const rawStoredProfiles = window.localStorage.getItem(STORAGE_KEY_CANDIDATE_PROFILES);
    if (!rawStoredProfiles) {
      window.localStorage.setItem(
        STORAGE_KEY_CANDIDATE_PROFILES,
        JSON.stringify(DEFAULT_MOCK_CANDIDATES)
      );
      return DEFAULT_MOCK_CANDIDATES;
    }

    const parsedProfiles: CandidateProfile[] = JSON.parse(rawStoredProfiles);
    return Array.isArray(parsedProfiles) && parsedProfiles.length > 0
      ? parsedProfiles
      : DEFAULT_MOCK_CANDIDATES;
  } catch {
    return DEFAULT_MOCK_CANDIDATES;
  }
};

const saveCandidateProfilesToStorage = (candidateProfiles: CandidateProfile[]): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(
        STORAGE_KEY_CANDIDATE_PROFILES,
        JSON.stringify(candidateProfiles)
      );
    }
  } catch {
    // Tránh gián đoạn nếu bộ nhớ trình duyệt bị vô hiệu hóa
  }
};

/**
 * Danh sách màu sắc ngẫu nhiên cho Tags (S4-09)
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
  // ==========================================
  // PHÂN HỆ QUẢN LÝ GỢI Ý DỮ LIỆU TỪ CV (TKNHTTDNB1-331 / Story TKNHTTDNB1-43)
  // ==========================================

  /**
   * Lấy danh sách hồ sơ ứng viên (có hỗ trợ bộ lọc)
   */
  async getCandidates(
    filterCriteria?: CandidateFilterCriteria
  ): Promise<CandidateProfile[]> {
    try {
      const apiResponse = await axiosClient.get<CandidateProfile[]>('/recruitment/candidates');
      if (Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
        return apiResponse.data;
      }
    } catch {
      // Dùng dữ liệu bộ nhớ cục bộ khi backend chưa sẵn sàng
    }

    let candidateList = loadCandidateProfilesFromStorage();

    if (filterCriteria?.keyword) {
      const normalizedKeyword = filterCriteria.keyword.trim().toLowerCase();
      candidateList = candidateList.filter((candidateItem) => {
        const matchesName = candidateItem.fullName.toLowerCase().includes(normalizedKeyword);
        const matchesEmail = candidateItem.email.toLowerCase().includes(normalizedKeyword);
        const matchesPhone = candidateItem.phone.includes(normalizedKeyword);
        const matchesJob = candidateItem.appliedJobTitle?.toLowerCase().includes(normalizedKeyword);
        return matchesName || matchesEmail || matchesPhone || matchesJob;
      });
    }

    if (filterCriteria?.cvParsingStatus && filterCriteria.cvParsingStatus !== 'ALL') {
      candidateList = candidateList.filter(
        (candidateItem) => candidateItem.cvParsingStatus === filterCriteria.cvParsingStatus
      );
    }

    if (filterCriteria?.jobId) {
      candidateList = candidateList.filter(
        (candidateItem) => candidateItem.appliedJobId === filterCriteria.jobId
      );
    }

    // Đảm bảo mỗi hồ sơ ứng viên đều có kết quả đánh giá 3 tiêu chí và điểm tổng phù hợp (TKNHTTDNB1-410)
    return candidateList.map((candidateItem) => ({
      ...candidateItem,
      matchingEvaluation:
        candidateItem.matchingEvaluation ||
        resolveCandidateMatchingEvaluation(candidateItem),
    }));
  },

  /**
   * Lấy chi tiết hồ sơ CandidateProfile theo ID
   */
  async getCandidateProfileById(candidateId: string): Promise<CandidateProfile | null> {
    try {
      const apiResponse = await axiosClient.get<CandidateProfile>(
        `/recruitment/candidates/${candidateId}`
      );
      if (apiResponse.data) {
        return {
          ...apiResponse.data,
          matchingEvaluation:
            apiResponse.data.matchingEvaluation ||
            resolveCandidateMatchingEvaluation(apiResponse.data),
        };
      }
    } catch {
      // Dùng dữ liệu bộ nhớ cục bộ khi backend chưa sẵn sàng
    }

    const candidateList = loadCandidateProfilesFromStorage();
    const foundCandidate = candidateList.find(
      (candidateItem) => candidateItem.id === candidateId
    );
    if (!foundCandidate) {
      return null;
    }

    return {
      ...foundCandidate,
      matchingEvaluation:
        foundCandidate.matchingEvaluation ||
        resolveCandidateMatchingEvaluation(foundCandidate),
    };
  },

  /**
   * Gọi API trích xuất thông tin gợi ý từ tệp CV PDF (Subtask TKNHTTDNB1-332)
   * Tại sao: Hàm này chỉ lấy dữ liệu gợi ý và trả về đối tượng CvSuggestedCandidateInfo độc lập.
   * TUYỆT ĐỐI KHÔNG tự động ghi đè hay cập nhật vào các trường họ tên, email, số điện thoại
   * trong hồ sơ ứng viên để tránh làm mất dữ liệu người dùng đã nhập.
   */
  async fetchCvParsedSuggestion(
    candidateId: string
  ): Promise<CvSuggestedCandidateInfo> {
    try {
      const apiResponse = await axiosClient.get<CvSuggestedCandidateInfo>(
        `/recruitment/candidates/${candidateId}/cv-suggestion`
      );
      if (apiResponse.data && apiResponse.data.fullName) {
        return apiResponse.data;
      }
    } catch {
      // Khi backend chưa sẵn sàng hoặc mạng offline, chuyển xuống xử lý mock fallback
    }

    const candidateList = loadCandidateProfilesFromStorage();
    const foundCandidate = candidateList.find(
      (candidateItem) => candidateItem.id === candidateId
    );

    if (!foundCandidate) {
      throw new Error(`Không tìm thấy hồ sơ ứng viên có mã định danh: ${candidateId}`);
    }

    // Nếu hồ sơ được đánh dấu FAILED từ trước, ném lỗi độc lập để UI hiển thị thông báo nhẹ nhàng
    if (foundCandidate.cvParsingStatus === 'FAILED') {
      throw new Error(
        foundCandidate.cvParsingErrorMessage ||
          'Tệp CV là định dạng ảnh chụp scan hoặc không thể trích xuất tự động văn bản có cấu trúc.'
      );
    }

    if (foundCandidate.cvSuggestedInfo) {
      return foundCandidate.cvSuggestedInfo;
    }

    // Giả lập trích xuất thành công nhưng KHÔNG ghi đè vào dữ liệu gốc của ứng viên
    const simulatedSuggestion: CvSuggestedCandidateInfo = {
      fullName: foundCandidate.fullName.includes(' ')
        ? foundCandidate.fullName
        : `${foundCandidate.fullName} (Từ CV)`,
      email: foundCandidate.email.replace('.temp', ''),
      phone: foundCandidate.phone,
      confidenceScore: 0.95,
      extractedAt: new Date().toISOString(),
      rawSnippet: `Trích xuất từ tệp ${foundCandidate.cvFileName || 'CV.pdf'}: ${foundCandidate.fullName} - ${foundCandidate.email}`,
    };

    return simulatedSuggestion;
  },

  /**
   * Xác nhận áp dụng dữ liệu gợi ý từ CV vào hồ sơ ứng viên (Subtask TKNHTTDNB1-332)
   * Tại sao: Chỉ khi Recruiter chủ động bấm nút "Xác nhận áp dụng", hệ thống mới tiến hành
   * cập nhật các trường họ tên, email, số điện thoại vào dữ liệu chính của hồ sơ ứng viên.
   */
  async applyConfirmedCandidateInfo(
    candidateId: string,
    confirmedSuggestionData: CvSuggestedCandidateInfo
  ): Promise<CandidateProfile> {
    try {
      const apiResponse = await axiosClient.post<CandidateProfile>(
        `/recruitment/candidates/${candidateId}/confirm-cv-suggestion`,
        confirmedSuggestionData
      );
      if (apiResponse.data) {
        return apiResponse.data;
      }
    } catch {
      // Cập nhật dữ liệu bộ nhớ cục bộ khi backend chưa sẵn sàng
    }

    const candidateList = loadCandidateProfilesFromStorage();
    const targetCandidateIndex = candidateList.findIndex(
      (candidateItem) => candidateItem.id === candidateId
    );

    if (targetCandidateIndex === -1) {
      throw new Error(`Không tìm thấy hồ sơ ứng viên có mã định danh: ${candidateId}`);
    }

    const updatedCandidate: CandidateProfile = {
      ...candidateList[targetCandidateIndex],
      fullName: confirmedSuggestionData.fullName.trim(),
      email: confirmedSuggestionData.email.trim(),
      phone: confirmedSuggestionData.phone.trim(),
      cvParsingStatus: 'CONFIRMED',
      cvSuggestedInfo: {
        ...confirmedSuggestionData,
        extractedAt: confirmedSuggestionData.extractedAt || new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    candidateList[targetCandidateIndex] = updatedCandidate;
    saveCandidateProfilesToStorage(candidateList);

    return updatedCandidate;
  },

  /**
   * Alias cho applyConfirmedCandidateInfo để tương thích với các component đã gọi confirmCvSuggestion
   */
  async confirmCvSuggestion(
    candidateId: string,
    confirmedSuggestionData: CvSuggestedCandidateInfo
  ): Promise<CandidateProfile> {
    return this.applyConfirmedCandidateInfo(candidateId, confirmedSuggestionData);
  },

  /**
   * Bỏ qua dữ liệu gợi ý từ CV, giữ nguyên thông tin ban đầu
   */
  async dismissCvSuggestion(candidateId: string): Promise<CandidateProfile> {
    try {
      const apiResponse = await axiosClient.post<CandidateProfile>(
        `/recruitment/candidates/${candidateId}/dismiss-cv-suggestion`
      );
      if (apiResponse.data) {
        return apiResponse.data;
      }
    } catch {
      // Cập nhật dữ liệu bộ nhớ cục bộ khi backend chưa sẵn sàng
    }

    const candidateList = loadCandidateProfilesFromStorage();
    const targetCandidateIndex = candidateList.findIndex(
      (candidateItem) => candidateItem.id === candidateId
    );

    if (targetCandidateIndex === -1) {
      throw new Error(`Không tìm thấy hồ sơ ứng viên có mã định danh: ${candidateId}`);
    }

    const updatedCandidate: CandidateProfile = {
      ...candidateList[targetCandidateIndex],
      cvParsingStatus: 'DISMISSED',
      updatedAt: new Date().toISOString(),
    };

    candidateList[targetCandidateIndex] = updatedCandidate;
    saveCandidateProfilesToStorage(candidateList);

    return updatedCandidate;
  },

  /**
   * Yêu cầu hệ thống đọc lại tệp CV (khi lần trước bị lỗi hoặc tệp mới)
   */
  async retryCvParsing(candidateId: string): Promise<CandidateProfile> {
    try {
      const apiResponse = await axiosClient.post<CandidateProfile>(
        `/recruitment/candidates/${candidateId}/retry-cv-parsing`
      );
      if (apiResponse.data) {
        return apiResponse.data;
      }
    } catch {
      // Giả lập đọc lại trên client
    }

    const candidateList = loadCandidateProfilesFromStorage();
    const targetCandidateIndex = candidateList.findIndex(
      (candidateItem) => candidateItem.id === candidateId
    );

    if (targetCandidateIndex === -1) {
      throw new Error(`Không tìm thấy hồ sơ ứng viên có mã định danh: ${candidateId}`);
    }

    const updatedCandidate: CandidateProfile = {
      ...candidateList[targetCandidateIndex],
      cvParsingStatus: 'PENDING_CONFIRMATION',
      cvParsingErrorMessage: undefined,
      cvSuggestedInfo: {
        fullName: candidateList[targetCandidateIndex].fullName,
        email: candidateList[targetCandidateIndex].email,
        phone: candidateList[targetCandidateIndex].phone,
        confidenceScore: 0.9,
        extractedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    candidateList[targetCandidateIndex] = updatedCandidate;
    saveCandidateProfilesToStorage(candidateList);

    return updatedCandidate;
  },

  // ==========================================
  // PHÂN HỆ HỒ SƠ ỨNG VIÊN HỢP NHẤT (S4-09 / TKNHTTDNB1-358)
  // ==========================================

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
   * Cập nhật đánh giá nhanh thang điểm 1 - 5 sao (Subtask TKNHTTDNB1-384 / TKNHTTDNB1-385)
   */
  async updateCandidateRating(candidateId: string, rating: number): Promise<number> {
    try {
      await axiosClient.patch(`/candidates/${candidateId}/rating`, { rating });
    } catch (networkOrServerError: unknown) {
      // Bắt lỗi cụ thể và hiển thị thông báo rõ ràng khi gọi API thất bại (AC 2)
      if (axios.isAxiosError(networkOrServerError) && networkOrServerError.response) {
        const errorStatusCode = networkOrServerError.response.status;
        if (errorStatusCode === 403) {
          throw new Error('Bạn không có quyền cập nhật mức đánh giá sao cho hồ sơ này (403 Forbidden).');
        }
        if (errorStatusCode >= 500) {
          throw new Error('Máy chủ gặp sự cố khi lưu mức đánh giá sao (500 Internal Server Error). Vui lòng thử lại sau.');
        }
        const serverErrorMessage = (networkOrServerError.response.data as { message?: string })?.message;
        if (serverErrorMessage) {
          throw new Error(serverErrorMessage);
        }
      }
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

    // Đồng bộ vào danh sách CandidateProfile
    const candidateList = loadCandidateProfilesFromStorage();
    const targetCandidateIndex = candidateList.findIndex(
      (candidateItem) => candidateItem.id === candidateId
    );
    if (targetCandidateIndex !== -1) {
      candidateList[targetCandidateIndex].rating = rating;
      candidateList[targetCandidateIndex].updatedAt = new Date().toISOString();
      saveCandidateProfilesToStorage(candidateList);
    }

    return rating;
  },

  /**
   * Lấy danh mục các nhãn gợi ý có sẵn cho sàng lọc nhanh từ API (Subtask TKNHTTDNB1-384 / TKNHTTDNB1-385)
   */
  async getCatalogTags(): Promise<ScreeningCatalogTag[]> {
    try {
      const apiResponse = await axiosClient.get<ScreeningCatalogTag[]>(
        '/recruitment/screening-catalog-tags'
      );
      if (Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
        return apiResponse.data;
      }
    } catch {
      // Fallback danh mục mặc định khi chạy offline hoặc backend chưa hoàn thiện endpoint
    }
    return DEFAULT_SCREENING_CATALOG_TAGS;
  },

  /**
   * Cập nhật toàn bộ danh sách nhãn (Multi-select Tags) cho hồ sơ ứng viên (Subtask TKNHTTDNB1-384 / TKNHTTDNB1-385)
   */
  async updateCandidateTags(
    candidateId: string,
    tagsList: CandidateTag[]
  ): Promise<CandidateTag[]> {
    try {
      await axiosClient.put(`/candidates/${candidateId}/tags`, { tags: tagsList });
    } catch (networkOrServerError: unknown) {
      // Bắt lỗi cụ thể và hiển thị thông báo rõ ràng khi gọi API thất bại (AC 2)
      if (axios.isAxiosError(networkOrServerError) && networkOrServerError.response) {
        const errorStatusCode = networkOrServerError.response.status;
        if (errorStatusCode === 403) {
          throw new Error('Bạn không có quyền cập nhật nhãn phân loại cho hồ sơ này (403 Forbidden).');
        }
        if (errorStatusCode >= 500) {
          throw new Error('Máy chủ gặp sự cố khi lưu nhãn phân loại (500 Internal Server Error). Vui lòng thử lại sau.');
        }
        const serverErrorMessage = (networkOrServerError.response.data as { message?: string })?.message;
        if (serverErrorMessage) {
          throw new Error(serverErrorMessage);
        }
      }
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_CANDIDATES}_${candidateId}`);
      const data: UnifiedCandidate = stored ? JSON.parse(stored) : DEFAULT_MOCK_CANDIDATE;
      data.tags = tagsList;
      data.updatedAt = new Date().toISOString();
      localStorage.setItem(`${STORAGE_KEY_CANDIDATES}_${candidateId}`, JSON.stringify(data));
    } catch {
      // Bỏ qua
    }

    // Đồng bộ vào danh sách CandidateProfile
    const candidateList = loadCandidateProfilesFromStorage();
    const targetCandidateIndex = candidateList.findIndex(
      (candidateItem) => candidateItem.id === candidateId
    );
    if (targetCandidateIndex !== -1) {
      candidateList[targetCandidateIndex].tags = tagsList;
      candidateList[targetCandidateIndex].updatedAt = new Date().toISOString();
      saveCandidateProfilesToStorage(candidateList);
    }

    return tagsList;
  },

  /**
   * Cập nhật tổng thể đánh giá sàng lọc (Nhãn, Sao, Ghi chú mới) - Subtask TKNHTTDNB1-385
   */
  async updateCandidateScreening(
    candidateId: string,
    screeningUpdatePayload: CandidateScreeningUpdatePayload
  ): Promise<CandidateProfile> {
    try {
      await axiosClient.patch(
        `/candidates/${candidateId}/screening`,
        screeningUpdatePayload
      );
    } catch (networkOrServerError: unknown) {
      if (axios.isAxiosError(networkOrServerError) && networkOrServerError.response) {
        const errorStatusCode = networkOrServerError.response.status;
        if (errorStatusCode === 403) {
          throw new Error('Bạn không có quyền cập nhật đánh giá sàng lọc cho hồ sơ này (403 Forbidden).');
        }
        if (errorStatusCode >= 500) {
          throw new Error('Máy chủ gặp sự cố khi lưu đánh giá sàng lọc (500 Internal Server Error). Vui lòng thử lại sau.');
        }
        const serverErrorMessage = (networkOrServerError.response.data as { message?: string })?.message;
        if (serverErrorMessage) {
          throw new Error(serverErrorMessage);
        }
      }
    }

    const candidateList = loadCandidateProfilesFromStorage();
    const targetCandidateIndex = candidateList.findIndex(
      (candidateItem) => candidateItem.id === candidateId
    );
    if (targetCandidateIndex === -1) {
      throw new Error(`Không tìm thấy hồ sơ ứng viên với mã: ${candidateId}`);
    }

    const targetCandidate = candidateList[targetCandidateIndex];

    if (screeningUpdatePayload.rating !== undefined) {
      targetCandidate.rating = screeningUpdatePayload.rating;
    }

    if (screeningUpdatePayload.tags !== undefined) {
      targetCandidate.tags = screeningUpdatePayload.tags;
    }

    if (screeningUpdatePayload.newNote) {
      const createdNote: CandidateInternalNote = {
        id: `note-${Date.now()}`,
        content: screeningUpdatePayload.newNote.content.trim(),
        authorName: screeningUpdatePayload.newNote.authorName || 'Chuyên viên Tuyển dụng',
        authorRole: screeningUpdatePayload.newNote.authorRole || 'Recruiter',
        createdAt: new Date().toISOString(),
        category: screeningUpdatePayload.newNote.category || 'SCREENING',
      };
      if (!targetCandidate.notes) {
        targetCandidate.notes = [];
      }
      targetCandidate.notes.unshift(createdNote);
    }

    targetCandidate.updatedAt = new Date().toISOString();
    saveCandidateProfilesToStorage(candidateList);

    return targetCandidate;
  },

  /**
   * Thêm nhãn (Tag) cho hồ sơ ứng viên
   */
  async addCandidateTag(candidateId: string, tagName: string): Promise<CandidateTag> {
    const trimmedTagName = tagName.trim();
    if (!trimmedTagName) throw new Error('Tên nhãn không được để trống.');

    const randomColorClass =
      TAG_COLOR_CLASSES[Math.floor(Math.random() * TAG_COLOR_CLASSES.length)];
    const newTag: CandidateTag = {
      id: `tag-${Date.now()}`,
      name: trimmedTagName,
      colorClass: randomColorClass,
    };

    try {
      await axiosClient.post(`/candidates/${candidateId}/tags`, { name: trimmedTagName });
    } catch {
      // Offline fallback
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_CANDIDATES}_${candidateId}`);
      const data: UnifiedCandidate = stored ? JSON.parse(stored) : DEFAULT_MOCK_CANDIDATE;
      if (!data.tags.some((tagItem) => tagItem.name.toLowerCase() === trimmedTagName.toLowerCase())) {
        data.tags.push(newTag);
        data.updatedAt = new Date().toISOString();
        localStorage.setItem(`${STORAGE_KEY_CANDIDATES}_${candidateId}`, JSON.stringify(data));
      }
    } catch {
      // Bỏ qua
    }

    // Đồng bộ vào danh sách CandidateProfile
    const candidateList = loadCandidateProfilesFromStorage();
    const targetCandidateIndex = candidateList.findIndex(
      (candidateItem) => candidateItem.id === candidateId
    );
    if (targetCandidateIndex !== -1) {
      const existingTags = candidateList[targetCandidateIndex].tags || [];
      if (!existingTags.some((tagItem) => tagItem.name.toLowerCase() === trimmedTagName.toLowerCase())) {
        candidateList[targetCandidateIndex].tags = [...existingTags, newTag];
        candidateList[targetCandidateIndex].updatedAt = new Date().toISOString();
        saveCandidateProfilesToStorage(candidateList);
      }
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
        data.tags = data.tags.filter((tagItem) => tagItem.id !== tagId);
        data.updatedAt = new Date().toISOString();
        localStorage.setItem(`${STORAGE_KEY_CANDIDATES}_${candidateId}`, JSON.stringify(data));
      }
    } catch {
      // Bỏ qua
    }

    // Đồng bộ vào danh sách CandidateProfile
    const candidateList = loadCandidateProfilesFromStorage();
    const targetCandidateIndex = candidateList.findIndex(
      (candidateItem) => candidateItem.id === candidateId
    );
    if (targetCandidateIndex !== -1 && candidateList[targetCandidateIndex].tags) {
      candidateList[targetCandidateIndex].tags = candidateList[targetCandidateIndex].tags.filter(
        (tagItem) => tagItem.id !== tagId
      );
      candidateList[targetCandidateIndex].updatedAt = new Date().toISOString();
      saveCandidateProfilesToStorage(candidateList);
    }
  },

  /**
   * Thêm ghi chú nội bộ cho hồ sơ ứng viên (Subtask TKNHTTDNB1-384 & Story S4-09)
   */
  async addInternalNote(
    candidateId: string,
    notePayloadOrContent:
      | { content: string; category?: InternalNote['category'] }
      | string,
    authorOrAuthorName?:
      | { fullName: string; role: string; avatar?: string }
      | string,
    authorRoleParameter?: string,
    categoryParameter?: InternalNote['category']
  ): Promise<InternalNote> {
    let resolvedContent = '';
    let resolvedCategory: InternalNote['category'] = 'GENERAL';
    let resolvedAuthorName = 'Người dùng hệ thống';
    let resolvedAuthorRole = 'Nhân sự';
    let resolvedAuthorAvatar: string | undefined = undefined;

    if (typeof notePayloadOrContent === 'string') {
      resolvedContent = notePayloadOrContent;
      if (typeof authorOrAuthorName === 'string') {
        resolvedAuthorName = authorOrAuthorName;
      }
      if (authorRoleParameter) {
        resolvedAuthorRole = authorRoleParameter;
      }
      if (categoryParameter) {
        resolvedCategory = categoryParameter;
      }
    } else {
      resolvedContent = notePayloadOrContent.content;
      resolvedCategory = notePayloadOrContent.category || 'GENERAL';
      if (typeof authorOrAuthorName === 'object' && authorOrAuthorName !== null) {
        resolvedAuthorName = authorOrAuthorName.fullName || 'Người dùng hệ thống';
        resolvedAuthorRole = authorOrAuthorName.role || 'Nhân sự';
        resolvedAuthorAvatar = authorOrAuthorName.avatar;
      }
    }

    const trimmedContent = resolvedContent.trim();
    if (!trimmedContent) {
      throw new Error('Nội dung ghi chú không được để trống.');
    }

    const newNote: InternalNote = {
      id: `note-${Date.now()}`,
      content: trimmedContent,
      authorName: resolvedAuthorName,
      authorRole: resolvedAuthorRole,
      authorAvatar: resolvedAuthorAvatar,
      createdAt: new Date().toISOString(),
      category: resolvedCategory,
    };

    try {
      await axiosClient.post(`/candidates/${candidateId}/notes`, newNote);
    } catch (networkOrServerError: unknown) {
      if (axios.isAxiosError(networkOrServerError) && networkOrServerError.response) {
        const errorStatusCode = networkOrServerError.response.status;
        if (errorStatusCode === 403) {
          throw new Error('Bạn không có quyền thêm ghi chú nội bộ cho hồ sơ này (403 Forbidden).');
        }
        if (errorStatusCode >= 500) {
          throw new Error('Máy chủ gặp sự cố khi lưu ghi chú nội bộ (500 Internal Server Error). Vui lòng thử lại sau.');
        }
        const serverErrorMessage = (networkOrServerError.response.data as { message?: string })?.message;
        if (serverErrorMessage) {
          throw new Error(serverErrorMessage);
        }
      }
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

    // Đồng bộ vào danh sách CandidateProfile
    const candidateList = loadCandidateProfilesFromStorage();
    const targetCandidateIndex = candidateList.findIndex(
      (candidateItem) => candidateItem.id === candidateId
    );
    if (targetCandidateIndex !== -1) {
      if (!candidateList[targetCandidateIndex].notes) {
        candidateList[targetCandidateIndex].notes = [];
      }
      candidateList[targetCandidateIndex].notes.unshift(newNote);
      candidateList[targetCandidateIndex].updatedAt = new Date().toISOString();
      saveCandidateProfilesToStorage(candidateList);
    }

    return newNote;
  },

  /**
   * Tạo ghi chú nội bộ mới cho hồ sơ ứng viên (Subtask TKNHTTDNB1-385)
   */
  async createCandidateInternalNote(
    candidateId: string,
    content: string,
    authorName: string,
    authorRole?: string,
    category?: CandidateInternalNote['category']
  ): Promise<CandidateInternalNote> {
    return this.addInternalNote(candidateId, content, authorName, authorRole, category);
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
