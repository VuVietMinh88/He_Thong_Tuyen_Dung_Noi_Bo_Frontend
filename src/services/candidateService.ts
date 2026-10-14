import axiosClient from '../utils/axiosClient';
import type {
  CandidateProfile,
  CvSuggestedCandidateInfo,
  CandidateFilterCriteria,
} from '../types/candidate';

const STORAGE_KEY_CANDIDATE_PROFILES = 'smart_recruit_candidate_profiles';

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

export const candidateService = {
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

    return candidateList;
  },

  /**
   * Lấy chi tiết hồ sơ ứng viên theo ID
   */
  async getCandidateById(candidateId: string): Promise<CandidateProfile | null> {
    try {
      const apiResponse = await axiosClient.get<CandidateProfile>(
        `/recruitment/candidates/${candidateId}`
      );
      if (apiResponse.data) {
        return apiResponse.data;
      }
    } catch {
      // Dùng dữ liệu bộ nhớ cục bộ khi backend chưa sẵn sàng
    }

    const candidateList = loadCandidateProfilesFromStorage();
    const foundCandidate = candidateList.find(
      (candidateItem) => candidateItem.id === candidateId
    );
    return foundCandidate ?? null;
  },

  /**
   * Xác nhận áp dụng dữ liệu gợi ý từ CV vào hồ sơ ứng viên
   */
  async confirmCvSuggestion(
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
};

export default candidateService;
