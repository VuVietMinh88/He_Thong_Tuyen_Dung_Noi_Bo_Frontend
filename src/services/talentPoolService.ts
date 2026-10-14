/**
 * Talent Pool Service: API & Local Storage Fallback cho Quản lý Kho Ứng Viên Tiềm Năng
 * Task Jira:
 * - TKNHTTDNB1-396: Thiết kế màn hình đưa ứng viên vào kho tiềm năng (User Story S5-04)
 * - TKNHTTDNB1-397: Tích hợp tìm kiếm kho và gợi ý cho vị trí mới (User Story S5-04)
 */

import axiosClient from '../utils/axiosClient';
import type {
  TalentPoolCategory,
  AddToTalentPoolDto,
  TalentPoolEntry,
  TalentPoolCandidateSuggestion,
  TalentPoolSearchParams,
  AssignTalentToJobPayload,
  TalentPoolCandidateHistory,
} from '../types/talentPool';
import { DEFAULT_TALENT_POOL_CATEGORIES } from '../types/talentPool';

const BASE_URL = '/recruitment/talent-pool';
const CATEGORIES_STORAGE_KEY = 'recruitment_talent_pool_categories';
const ENTRIES_STORAGE_KEY = 'recruitment_talent_pool_entries';
const SUGGESTIONS_STORAGE_KEY = 'recruitment_talent_pool_suggestions';

export const MOCK_TALENT_POOL_CANDIDATES: TalentPoolCandidateSuggestion[] = [
  {
    id: 'talent-001',
    candidateId: 'cand-pool-101',
    fullName: 'Nguyễn Thành Long',
    email: 'thanhlong.nguyen@example.com',
    phone: '0912345678',
    category: 'Frontend Core',
    experienceYears: 5,
    currentTitle: 'Senior Frontend Developer',
    previousAppliedJobTitle: 'Lập trình viên React Senior',
    skills: ['React', 'TypeScript', 'Redux', 'Tailwind CSS', 'Next.js', 'Performance Optimization'],
    matchedSkills: ['React', 'TypeScript', 'Tailwind CSS'],
    missingSkills: ['Node.js'],
    matchScore: 92,
    notes: 'Ứng viên có tư duy component tốt, pass bài test kiến trúc React điểm 9.5/10. Lưu lại vì đợt trước đã chốt ứng viên khác trước 1 ngày.',
    addedToPoolAt: '2026-08-15T10:00:00Z',
    contactRecommendation: 'Sau 3 tháng',
  },
  {
    id: 'talent-002',
    candidateId: 'cand-pool-102',
    fullName: 'Trần Thu Hà',
    email: 'thuha.tran@example.com',
    phone: '0988776655',
    category: 'Frontend Core',
    experienceYears: 4,
    currentTitle: 'Fullstack JavaScript Engineer',
    previousAppliedJobTitle: 'Lập trình viên Frontend',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'REST API'],
    matchedSkills: ['React', 'TypeScript'],
    missingSkills: ['Tailwind CSS'],
    matchScore: 85,
    notes: 'Kỹ năng giao tiếp và tiếng Anh tốt, thích hợp làm việc với khách hàng quốc tế. Cần liên hệ khi có dự án mới.',
    addedToPoolAt: '2026-09-01T14:30:00Z',
    contactRecommendation: 'Sau 3 tháng',
  },
  {
    id: 'talent-003',
    candidateId: 'cand-pool-103',
    fullName: 'Lê Quốc Bảo',
    email: 'quocbao.le@example.com',
    phone: '0977112233',
    category: 'DevOps Dự phòng',
    experienceYears: 6,
    currentTitle: 'Senior DevOps / SRE Engineer',
    previousAppliedJobTitle: 'Kỹ sư DevOps Kubernetes',
    skills: ['Kubernetes', 'Docker', 'CI/CD', 'Terraform', 'AWS', 'Linux', 'Python'],
    matchedSkills: ['Kubernetes', 'Docker', 'CI/CD'],
    missingSkills: ['GCP'],
    matchScore: 95,
    notes: 'Kinh nghiệm triển khai hạ tầng k8s đa cụm rất vững. Lưu kho do dự án tạm hoãn ngân sách Cloud đợt Q3.',
    addedToPoolAt: '2026-07-20T09:15:00Z',
    contactRecommendation: 'Khi mở dự án mới',
  },
  {
    id: 'talent-004',
    candidateId: 'cand-pool-104',
    fullName: 'Phạm Minh Đức',
    email: 'minhduc.pham@example.com',
    phone: '0933445566',
    category: 'Backend High-Scale',
    experienceYears: 5,
    currentTitle: 'Backend Specialist (Go / Java)',
    previousAppliedJobTitle: 'Kỹ sư Backend Microservices',
    skills: ['Go', 'Java', 'Microservices', 'Kafka', 'Redis', 'PostgreSQL', 'Docker'],
    matchedSkills: ['Go', 'Microservices', 'Kafka'],
    missingSkills: ['Elasticsearch'],
    matchScore: 88,
    notes: 'Chuyên gia xử lý hàng đợi và transaction phân tán. Ứng viên mong muốn làm việc remote hoặc hybrid.',
    addedToPoolAt: '2026-08-10T16:00:00Z',
    contactRecommendation: 'Sau 6 tháng',
  },
  {
    id: 'talent-005',
    candidateId: 'cand-pool-105',
    fullName: 'Vũ Thúy Hằng',
    email: 'thuyhang.vu@example.com',
    phone: '0944556677',
    category: 'Frontend Core',
    experienceYears: 3,
    currentTitle: 'UI/UX Frontend Developer',
    previousAppliedJobTitle: 'Fresher / Junior Frontend',
    skills: ['React', 'Figma', 'CSS3', 'Tailwind CSS', 'JavaScript', 'Responsive Design'],
    matchedSkills: ['React', 'Tailwind CSS'],
    missingSkills: ['TypeScript', 'Next.js'],
    matchScore: 78,
    notes: 'Thẩm mỹ thiết kế giao diện xuất sắc, chuyển đổi Figma sang code pixel-perfect.',
    addedToPoolAt: '2026-09-15T11:20:00Z',
    contactRecommendation: 'Sau 1 tháng',
  },
  {
    id: 'talent-006',
    candidateId: 'cand-pool-106',
    fullName: 'Đặng Hoàng Nam',
    email: 'hoangnam.dang@example.com',
    phone: '0966778899',
    category: 'QA / Automation Tester',
    experienceYears: 4,
    currentTitle: 'QC / Automation Test Lead',
    previousAppliedJobTitle: 'Kỹ sư QA Tự Động Hóa',
    skills: ['Playwright', 'Cypress', 'Selenium', 'TypeScript', 'Jest', 'CI/CD'],
    matchedSkills: ['Playwright', 'TypeScript', 'CI/CD'],
    missingSkills: ['K6'],
    matchScore: 90,
    notes: 'Viết framework automation test gọn gàng, tư duy logic bắt lỗi sắc bén.',
    addedToPoolAt: '2026-08-25T15:45:00Z',
    contactRecommendation: 'Đầu quý tới',
  },
];

// Bộ nhớ đệm trong bộ nhớ dành cho môi trường Vitest / SSR
let inMemoryCategories: TalentPoolCategory[] = [...DEFAULT_TALENT_POOL_CATEGORIES];
let inMemoryEntries: TalentPoolEntry[] = [];
let inMemorySuggestions: TalentPoolCandidateSuggestion[] = [...MOCK_TALENT_POOL_CANDIDATES];

const getLocalCategories = (): TalentPoolCategory[] => {
  if (typeof window === 'undefined') {
    return inMemoryCategories;
  }
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) {
      saveLocalCategories(DEFAULT_TALENT_POOL_CATEGORIES);
      return DEFAULT_TALENT_POOL_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : DEFAULT_TALENT_POOL_CATEGORIES;
  } catch {
    return DEFAULT_TALENT_POOL_CATEGORIES;
  }
};

const saveLocalCategories = (categories: TalentPoolCategory[]) => {
  inMemoryCategories = categories;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch {
      // Ignore storage errors
    }
  }
};

const getLocalEntries = (): TalentPoolEntry[] => {
  if (typeof window === 'undefined') {
    return inMemoryEntries;
  }
  try {
    const raw = localStorage.getItem(ENTRIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveLocalEntries = (entries: TalentPoolEntry[]) => {
  inMemoryEntries = entries;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Ignore storage errors
    }
  }
};

const getLocalSuggestions = (): TalentPoolCandidateSuggestion[] => {
  if (typeof window === 'undefined') {
    return inMemorySuggestions;
  }
  try {
    const raw = localStorage.getItem(SUGGESTIONS_STORAGE_KEY);
    if (!raw) {
      saveLocalSuggestions(MOCK_TALENT_POOL_CANDIDATES);
      return MOCK_TALENT_POOL_CANDIDATES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : MOCK_TALENT_POOL_CANDIDATES;
  } catch {
    return MOCK_TALENT_POOL_CANDIDATES;
  }
};

const saveLocalSuggestions = (suggestions: TalentPoolCandidateSuggestion[]) => {
  inMemorySuggestions = suggestions;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(suggestions));
    } catch {
      // Ignore storage errors
    }
  }
};

export const talentPoolService = {
  /**
   * Lấy danh sách nhóm / danh mục kho tiềm năng
   */
  async getCategories(): Promise<TalentPoolCategory[]> {
    try {
      const response = await axiosClient.get<{ data: TalentPoolCategory[] }>(
        `${BASE_URL}/categories`
      );
      if (response.data && Array.isArray(response.data.data)) {
        saveLocalCategories(response.data.data);
        return response.data.data;
      }
    } catch {
      // Sử dụng dữ liệu fallback từ local storage
    }
    return getLocalCategories();
  },

  /**
   * Tạo nhóm / danh mục kho mới
   */
  async createCategory(name: string, description?: string): Promise<TalentPoolCategory> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Tên nhóm kho tiềm năng không được để trống');
    }

    try {
      const response = await axiosClient.post<{ data: TalentPoolCategory }>(
        `${BASE_URL}/categories`,
        { name: trimmedName, description: description?.trim() }
      );
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    const currentList = getLocalCategories();
    const existing = currentList.find(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      return existing;
    }

    const newCategory: TalentPoolCategory = {
      id: `cat-${Date.now()}`,
      name: trimmedName,
      description: description?.trim() || '',
      color: 'indigo',
      candidateCount: 0,
    };

    saveLocalCategories([...currentList, newCategory]);
    return newCategory;
  },

  /**
   * Chuyển một hoặc nhiều hồ sơ ứng viên vào kho tiềm năng
   */
  async addToTalentPool(dto: AddToTalentPoolDto): Promise<TalentPoolEntry[]> {
    if (!dto.candidateIds || dto.candidateIds.length === 0) {
      throw new Error('Vui lòng chọn ít nhất một ứng viên để đưa vào kho');
    }

    const trimmedCategory = dto.category?.trim();
    if (!trimmedCategory) {
      throw new Error('Vui lòng chọn nhóm kho tiềm năng');
    }

    try {
      const response = await axiosClient.post<{ data: TalentPoolEntry[] }>(
        `${BASE_URL}/candidates`,
        {
          candidateIds: dto.candidateIds,
          category: trimmedCategory,
          tags: dto.tags || [],
          notes: dto.notes?.trim() || '',
          contactRecommendation: dto.contactRecommendation?.trim() || '',
        }
      );
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch {
      // Fallback local storage
    }

    const now = new Date().toISOString();
    const createdEntries: TalentPoolEntry[] = dto.candidateIds.map((cId) => ({
      id: `entry-${cId}-${Date.now()}`,
      candidateId: cId,
      category: trimmedCategory,
      tags: dto.tags || [],
      notes: dto.notes?.trim() || '',
      contactRecommendation: dto.contactRecommendation?.trim() || '',
      addedAt: now,
      addedBy: 'Recruiter',
    }));

    const existingEntries = getLocalEntries();
    saveLocalEntries([...createdEntries, ...existingEntries]);

    // Cập nhật số lượng ứng viên trong category
    const categories = getLocalCategories();
    const catIndex = categories.findIndex(
      (c) => c.name.toLowerCase() === trimmedCategory.toLowerCase() || c.id === trimmedCategory
    );
    if (catIndex !== -1) {
      categories[catIndex].candidateCount =
        (categories[catIndex].candidateCount || 0) + dto.candidateIds.length;
      saveLocalCategories([...categories]);
    }

    return createdEntries;
  },

  /**
   * AC 1 & AC 3 (Task TKNHTTDNB1-397):
   * Lấy danh sách hồ sơ gợi ý từ kho tiềm năng phù hợp với yêu cầu vị trí tuyển dụng
   */
  async getTalentPoolSuggestions(
    jobId: string,
    params?: TalentPoolSearchParams
  ): Promise<TalentPoolCandidateSuggestion[]> {
    try {
      const response = await axiosClient.get<{ data: TalentPoolCandidateSuggestion[] }>(
        `${BASE_URL}/suggestions`,
        {
          params: {
            jobId,
            keyword: params?.keyword,
            category: params?.category,
            minMatchScore: params?.minMatchScore,
            sortBy: params?.sortBy,
          },
        }
      );
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch {
      // Fallback dynamic calculation
    }

    let list = [...getLocalSuggestions()];

    // Lọc theo từ khóa (Họ tên, Email, Chức danh, Kỹ năng)
    if (params?.keyword && params.keyword.trim()) {
      const query = params.keyword.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.fullName.toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query) ||
          (item.currentTitle && item.currentTitle.toLowerCase().includes(query)) ||
          item.skills.some((s) => s.toLowerCase().includes(query))
      );
    }

    // Lọc theo danh mục nhóm kho
    if (params?.category && params.category !== 'ALL') {
      list = list.filter(
        (item) => item.category.toLowerCase() === params.category?.toLowerCase()
      );
    }

    // Lọc theo điểm phù hợp tối thiểu
    if (typeof params?.minMatchScore === 'number' && params.minMatchScore > 0) {
      list = list.filter((item) => item.matchScore >= (params.minMatchScore || 0));
    }

    // Sắp xếp
    const sortBy = params?.sortBy || 'MATCH_SCORE_DESC';
    if (sortBy === 'MATCH_SCORE_DESC') {
      list.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sortBy === 'EXPERIENCE_DESC') {
      list.sort((a, b) => b.experienceYears - a.experienceYears);
    } else if (sortBy === 'DATE_DESC') {
      list.sort(
        (a, b) =>
          new Date(b.addedToPoolAt).getTime() - new Date(a.addedToPoolAt).getTime()
      );
    }

    return list;
  },

  /**
   * AC 2 (Task TKNHTTDNB1-397):
   * Gán ứng viên từ kho tiềm năng vào tin tuyển dụng mới / tái kích hoạt vòng tuyển dụng
   */
  async assignCandidateToJob(payload: AssignTalentToJobPayload): Promise<TalentPoolCandidateSuggestion> {
    if (!payload.candidateId) {
      throw new Error('Mã ứng viên không hợp lệ');
    }
    if (!payload.jobId) {
      throw new Error('Vui lòng chọn vị trí tuyển dụng để gán ứng viên');
    }
    if (!payload.initialStage) {
      throw new Error('Vui lòng chọn vòng tuyển dụng khởi đầu');
    }

    try {
      const response = await axiosClient.post<{ data: TalentPoolCandidateSuggestion }>(
        `${BASE_URL}/assign`,
        payload
      );
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback update local state
    }

    const currentList = getLocalSuggestions();
    const targetIndex = currentList.findIndex(
      (item) => item.candidateId === payload.candidateId || item.id === payload.candidateId
    );

    if (targetIndex === -1) {
      throw new Error('Không tìm thấy thông tin ứng viên trong kho tiềm năng');
    }

    const updated: TalentPoolCandidateSuggestion = {
      ...currentList[targetIndex],
      isAssigned: true,
      assignedJobId: payload.jobId,
      assignedStage: payload.initialStage,
    };

    currentList[targetIndex] = updated;
    saveLocalSuggestions(currentList);
    return updated;
  },

  /**
   * AC 2 (Task TKNHTTDNB1-397):
   * Xem lịch sử đánh giá và ghi chú cũ trong kho tiềm năng của ứng viên
   */
  async getTalentPoolCandidateHistory(
    candidateId: string
  ): Promise<TalentPoolCandidateHistory> {
    try {
      const response = await axiosClient.get<{ data: TalentPoolCandidateHistory }>(
        `${BASE_URL}/candidates/${candidateId}/history`
      );
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    const currentList = getLocalSuggestions();
    const candidate = currentList.find(
      (item) => item.candidateId === candidateId || item.id === candidateId
    );

    return {
      candidateId,
      candidateName: candidate?.fullName || 'Ứng viên tiềm năng',
      addedAt: candidate?.addedToPoolAt || '2026-08-15T10:00:00Z',
      addedBy: 'Chuyên viên Tuyển dụng (Recruiter)',
      category: candidate?.category || 'Frontend Core',
      recruiterNotes:
        candidate?.notes ||
        'Ứng viên hoàn thành tốt vòng phỏng vấn chuyên môn, kỹ năng làm việc nhóm tốt. Lưu trữ để tái kích hoạt khi mở headcount mới.',
      tags: candidate?.skills || ['React', 'TypeScript', 'Tailwind CSS'],
      contactRecommendation: candidate?.contactRecommendation || 'Sau 3 tháng',
      previousApplication: {
        jobTitle: candidate?.previousAppliedJobTitle || 'Lập trình viên React Senior',
        department: 'Khối Công nghệ & Sản phẩm',
        appliedAt: '2026-07-01T08:30:00Z',
        lastStage: 'Vòng Phỏng vấn Chuyên môn',
        interviewNotes:
          'Pass 3/3 tiêu chí bắt buộc (Chuyên môn 90/100, Tiếng Anh B2, Kinh nghiệm 5 năm). Văn hóa công ty rất phù hợp.',
      },
    };
  },

  /**
   * Reset bộ nhớ test trong Vitest
   */
  _resetMemoryState() {
    inMemoryCategories = [...DEFAULT_TALENT_POOL_CATEGORIES];
    inMemoryEntries = [];
    inMemorySuggestions = [...MOCK_TALENT_POOL_CANDIDATES];
  },
};
