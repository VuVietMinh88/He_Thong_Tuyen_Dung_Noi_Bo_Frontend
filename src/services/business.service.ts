import axios from 'axios';
import axiosClient from '../utils/axiosClient';

export interface PageResult<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  displayTitle: string | null;
  departmentId: string | null;
  departmentName: string | null;
  roles: string[];
  hasAvatar: boolean;
  avatarUpdatedAt: string | null;
}

export interface Department {
  id: string;
  name: string;
  active: boolean;
}

export interface Position {
  id: string;
  code: string;
  name: string;
  level: string;
  salaryMin?: number;
  salaryMax?: number;
  active: boolean;
  competencyFrameworkId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PositionInput {
  code: string;
  name: string;
  level: string;
  salaryMin: number;
  salaryMax: number;
  active: boolean;
}

export interface Requisition {
  id: string;
  positionId: string;
  departmentId: string;
  headcount: number;
  reason: 'REPLACEMENT' | 'NEW_HEADCOUNT';
  proposedSalaryMin: number | null;
  proposedSalaryMax: number | null;
  salaryJustification: string | null;
  neededBy: string | null;
  jobDescription: string | null;
  candidateRequirements: string | null;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'OPEN' | 'CLOSED' | 'CANCELLED' | string;
  createdAt: string;
  updatedAt: string;
}

export interface RequisitionInput {
  positionId: string;
  departmentId: string;
  headcount: number;
  reason: 'REPLACEMENT' | 'NEW_HEADCOUNT';
  proposedSalaryMin: number | null;
  proposedSalaryMax: number | null;
  salaryJustification: string | null;
  neededBy: string | null;
  jobDescription: string | null;
  candidateRequirements: string | null;
}

export interface CompetencyCriterion {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  sortOrder: number;
}

export interface CompetencyCriterionInput {
  id?: string;
  name: string;
  description: string | null;
  weight: number;
}

export interface CompetencyFramework {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE';
  criteria: CompetencyCriterion[];
  positions: Array<{ id: string; code: string; name: string; level: string; active: boolean }>;
}

export interface EvaluationCriteria {
  position: Pick<Position, 'id' | 'code' | 'name' | 'level' | 'active'>;
  framework: Pick<CompetencyFramework, 'id' | 'code' | 'name'>;
  criteria: CompetencyCriterion[];
}

export interface InterviewQuestion {
  id: string;
  criterion: { id: string; name: string };
  framework: { id: string; code: string; name: string };
  content: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  answerHint: string | null;
  active: boolean;
}

export interface RecruitmentCatalogItem {
  id: string;
  type: string;
  code: string;
  name: string;
  sortOrder: number;
  active: boolean;
}

export interface RequisitionFilters {
  status?: string;
  departmentId?: string;
  recruiterId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

const errorMessage = (error: unknown, fallback: string): Error => {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string') {
      return new Error(data.message);
    }
    if (!error.response) return new Error('Không thể kết nối Backend. Hãy kiểm tra server và mạng.');
  }
  return error instanceof Error ? error : new Error(fallback);
};

const call = async <T>(request: () => Promise<{ data: T }>, fallback: string): Promise<T> => {
  try {
    return (await request()).data;
  } catch (error) {
    throw errorMessage(error, fallback);
  }
};

export const businessService = {
  getProfile: () => call(() => axiosClient.get<Profile>('/profile'), 'Không thể tải hồ sơ.'),
  updateProfile: (input: Pick<Profile, 'fullName' | 'phone' | 'displayTitle'>) =>
    call(() => axiosClient.put<Profile>('/profile', input), 'Không thể cập nhật hồ sơ.'),

  getPositions: (page = 0) =>
    call(() => axiosClient.get<PageResult<Position>>('/positions', { params: { page, size: 100 } }), 'Không thể tải chức danh.'),
  savePosition: (id: string | null, input: PositionInput) =>
    call(
      () => id
        ? axiosClient.put<Position>(`/positions/${id}`, input)
        : axiosClient.post<Position>('/positions', input),
      'Không thể lưu chức danh.',
    ),
  assignPositionFramework: (positionId: string, frameworkId: string) =>
    call(
      () => axiosClient.put<Position>(`/positions/${positionId}/competency-framework`, { frameworkId }),
      'Không thể gán khung năng lực cho chức danh.',
    ),
  removePositionFramework: (positionId: string) =>
    call(
      () => axiosClient.delete<Position>(`/positions/${positionId}/competency-framework`),
      'Không thể gỡ khung năng lực khỏi chức danh.',
    ),
  getEvaluationCriteria: (positionId: string) =>
    call(
      () => axiosClient.get<EvaluationCriteria>(`/positions/${positionId}/evaluation-criteria`),
      'Không thể tải tiêu chí đánh giá.',
    ),

  getRequisitions: (filters: RequisitionFilters = {}) =>
    call(() => axiosClient.get<PageResult<Requisition>>('/requisitions', { 
      params: { 
        page: filters.page ?? 0, 
        size: filters.size ?? 100,
        status: filters.status || undefined,
        departmentId: filters.departmentId || undefined,
        recruiterId: filters.recruiterId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      } 
    }), 'Không thể tải yêu cầu tuyển dụng.'),
  saveRequisition: (id: string | null, input: RequisitionInput) =>
    call(
      () => id
        ? axiosClient.put<Requisition>(`/requisitions/${id}`, input)
        : axiosClient.post<Requisition>('/requisitions', input),
      'Không thể lưu yêu cầu tuyển dụng.',
    ),
  getRequisition: (id: string) =>
    call(() => axiosClient.get<Requisition>(`/requisitions/${id}`), 'Không thể tải chi tiết yêu cầu tuyển dụng.'),

  getFrameworks: (page = 0) =>
    call(() => axiosClient.get<PageResult<Pick<CompetencyFramework, 'id' | 'code' | 'name' | 'description' | 'status'> & { criterionCount: number }>>(
      '/competency-frameworks',
      { params: { page, size: 100 } },
    ), 'Không thể tải khung năng lực.'),
  getFramework: (id: string) =>
    call(() => axiosClient.get<CompetencyFramework>(`/competency-frameworks/${id}`), 'Không thể tải chi tiết khung năng lực.'),
  saveFramework: (id: string | null, input: {
    code: string; name: string; description: string | null; status: CompetencyFramework['status']; criteria: CompetencyCriterionInput[];
  }) =>
    call(
      () => id
        ? axiosClient.put<CompetencyFramework>(`/competency-frameworks/${id}`, input)
        : axiosClient.post<CompetencyFramework>('/competency-frameworks', input),
      'Không thể lưu khung năng lực.',
    ),

  getQuestions: (page = 0) =>
    call(() => axiosClient.get<PageResult<InterviewQuestion>>('/interview-questions', { params: { page, size: 100 } }), 'Không thể tải ngân hàng câu hỏi.'),
  saveQuestion: (id: string | null, input: Pick<InterviewQuestion, 'criterion' | 'content' | 'difficulty' | 'answerHint' | 'active'>) => {
    const body = {
      criterionId: input.criterion.id,
      content: input.content,
      difficulty: input.difficulty,
      answerHint: input.answerHint,
      active: input.active,
    };
    return call(
      () => id
        ? axiosClient.put<InterviewQuestion>(`/interview-questions/${id}`, body)
        : axiosClient.post<InterviewQuestion>('/interview-questions', body),
      'Không thể lưu câu hỏi phỏng vấn.',
    );
  },
  deleteQuestion: (id: string) =>
    call(() => axiosClient.delete<void>(`/interview-questions/${id}`), 'Không thể xóa câu hỏi phỏng vấn.'),

  getCatalog: (type: string) =>

    call(() => axiosClient.get<RecruitmentCatalogItem[]>(`/recruitment-catalogs/${type}/items`), 'Không thể tải danh mục.'),
  saveCatalogItem: (type: string, id: string | null, input: Pick<RecruitmentCatalogItem, 'code' | 'name' | 'active'>) =>
    call(
      () => id
        ? axiosClient.put<RecruitmentCatalogItem>(`/recruitment-catalogs/${type}/items/${id}`, input)
        : axiosClient.post<RecruitmentCatalogItem>(`/recruitment-catalogs/${type}/items`, input),
      'Không thể lưu giá trị danh mục.',
    ),
  deleteCatalogItem: (type: string, id: string) =>
    call(() => axiosClient.delete<void>(`/recruitment-catalogs/${type}/items/${id}`), 'Không thể xóa giá trị danh mục.'),
  reorderCatalogItems: (type: string, itemIds: string[]) =>
    call(() => axiosClient.put<RecruitmentCatalogItem[]>(`/recruitment-catalogs/${type}/order`, { itemIds }), 'Không thể sắp xếp danh mục.'),
  getDepartments: (page = 0) =>
    call(() => axiosClient.get<PageResult<Department>>('/departments', { params: { page, size: 100 } }), 'Không thể tải phòng ban.'),
};
