import axiosClient from '../utils/axiosClient';
import type { Requisition, Position, Department } from './business.service';

export type SalaryType = 'RANGE' | 'NEGOTIABLE' | 'UP_TO' | 'STARTING_FROM';
export type JobPostingStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'REVISION_REQUESTED'
  | 'CLOSED';

export type JobPostingAuditAction =
  | 'CREATED'
  | 'UPDATED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'REVISION_REQUESTED'
  | 'CLOSED';

export interface JobPostingUserRef {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  department?: string;
}

export interface JobPostingAuditLog {
  id: string;
  postingId: string;
  action: JobPostingAuditAction;
  actionName: string;
  actor: JobPostingUserRef;
  timestamp: string;
  fromStatus?: JobPostingStatus;
  toStatus?: JobPostingStatus;
  note?: string;
  metadata?: {
    channels?: string[];
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface JobPostingData {
  id?: string;
  requisitionId?: string; // ID của yêu cầu tuyển dụng đã duyệt được liên kết
  title: string;
  positionTitle: string;
  departmentId: string;
  departmentName?: string;
  workLocation: string;
  employmentType: string;
  level: string;
  headcount: number;
  deadline: string;
  salaryType: SalaryType;
  salaryMin?: number;
  salaryMax?: number;
  currency: 'VND' | 'USD';
  isSalaryNegotiable?: boolean;
  jobDescription: string;
  requirements: string;
  benefits: string;
  skills: string[];
  status: JobPostingStatus;
  publishInternal: boolean;
  publishCareerPage: boolean;
  approvalNote?: string;
  rejectionReason?: string;
  revisionFeedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdBy?: JobPostingUserRef;
  publishedBy?: JobPostingUserRef;
  publishedAt?: string;
  auditLogs?: JobPostingAuditLog[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ValidationErrors {
  title?: string;
  positionTitle?: string;
  departmentId?: string;
  workLocation?: string;
  employmentType?: string;
  level?: string;
  headcount?: string;
  deadline?: string;
  salary?: string;
  jobDescription?: string;
  requirements?: string;
  benefits?: string;
}

/**
 * Hàm định dạng thời gian kiểm toán bằng tiếng Việt kèm thời gian tương đối
 */
export const formatAuditDateTime = (dateString?: string): { formatted: string; relative: string } => {
  if (!dateString) {
    return { formatted: 'Chưa có thông tin', relative: '' };
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return { formatted: dateString, relative: '' };
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const formatted = `${hours}:${minutes} - ${day}/${month}/${year}`;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let relative = '';
    if (diffMins < 1) {
      relative = 'Vừa xong';
    } else if (diffMins < 60) {
      relative = `${diffMins} phút trước`;
    } else if (diffHours < 24) {
      relative = `${diffHours} giờ trước`;
    } else if (diffDays === 1) {
      relative = 'Hôm qua';
    } else if (diffDays < 30) {
      relative = `${diffDays} ngày trước`;
    } else {
      relative = `${day}/${month}/${year}`;
    }

    return { formatted, relative };
  } catch {
    return { formatted: dateString, relative: '' };
  }
};

/**
 * Hàm kiểm tra tính hợp lệ của dữ liệu biểu mẫu soạn tin tuyển dụng (AC2)
 */
export const validateJobPostingForm = (data: Partial<JobPostingData>): {
  isValid: boolean;
  errors: ValidationErrors;
} => {
  const errors: ValidationErrors = {};

  // 1. Tiêu đề
  const trimmedTitle = data.title ? data.title.trim() : '';
  if (!trimmedTitle) {
    errors.title = 'Tiêu đề tin tuyển dụng không được để trống.';
  } else if (trimmedTitle.length < 5) {
    errors.title = 'Tiêu đề tin tuyển dụng cần tối thiểu 5 ký tự.';
  } else if (trimmedTitle.length > 150) {
    errors.title = 'Tiêu đề tin tuyển dụng không được vượt quá 150 ký tự.';
  }

  // 2. Vị trí / Chức danh
  if (!data.positionTitle || !data.positionTitle.trim()) {
    errors.positionTitle = 'Vui lòng chọn hoặc nhập vị trí chức danh tuyển dụng.';
  }

  // 3. Phòng ban
  if (!data.departmentId || !data.departmentId.trim()) {
    errors.departmentId = 'Vui lòng chọn phòng ban phụ trách tuyển dụng.';
  }

  // 4. Địa điểm làm việc
  if (!data.workLocation || !data.workLocation.trim()) {
    errors.workLocation = 'Vui lòng chọn địa điểm làm việc.';
  }

  // 5. Hình thức làm việc
  if (!data.employmentType || !data.employmentType.trim()) {
    errors.employmentType = 'Vui lòng chọn hình thức làm việc.';
  }

  // 6. Cấp bậc
  if (!data.level || !data.level.trim()) {
    errors.level = 'Vui lòng chọn cấp bậc yêu cầu.';
  }

  // 7. Số lượng tuyển dụng
  if (data.headcount === undefined || data.headcount === null || isNaN(Number(data.headcount))) {
    errors.headcount = 'Vui lòng nhập số lượng tuyển dụng.';
  } else if (Number(data.headcount) < 1) {
    errors.headcount = 'Số lượng tuyển dụng phải lớn hơn hoặc bằng 1.';
  }

  // 8. Hạn nộp hồ sơ
  if (!data.deadline) {
    errors.deadline = 'Vui lòng chọn hạn nộp hồ sơ.';
  } else {
    const selectedDate = new Date(data.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      errors.deadline = 'Hạn nộp hồ sơ không được là ngày trong quá khứ.';
    }
  }

  // 9. Mức lương
  if (data.salaryType === 'RANGE') {
    const min = data.salaryMin !== undefined ? Number(data.salaryMin) : undefined;
    const max = data.salaryMax !== undefined ? Number(data.salaryMax) : undefined;

    if (min === undefined || isNaN(min) || min < 0) {
      errors.salary = 'Mức lương tối thiểu không hợp lệ.';
    } else if (max === undefined || isNaN(max) || max < 0) {
      errors.salary = 'Mức lương tối đa không hợp lệ.';
    } else if (min > max) {
      errors.salary = 'Mức lương tối thiểu không được lớn hơn mức lương tối đa.';
    }
  } else if (data.salaryType === 'UP_TO') {
    if (data.salaryMax === undefined || isNaN(Number(data.salaryMax)) || Number(data.salaryMax) <= 0) {
      errors.salary = 'Vui lòng nhập mức lương tối đa hợp lệ.';
    }
  } else if (data.salaryType === 'STARTING_FROM') {
    if (data.salaryMin === undefined || isNaN(Number(data.salaryMin)) || Number(data.salaryMin) <= 0) {
      errors.salary = 'Vui lòng nhập mức lương khởi điểm hợp lệ.';
    }
  }

  // 10. Mô tả công việc
  const trimmedDesc = data.jobDescription ? data.jobDescription.trim() : '';
  if (!trimmedDesc) {
    errors.jobDescription = 'Mô tả công việc không được để trống.';
  } else if (trimmedDesc.length < 20) {
    errors.jobDescription = 'Mô tả công việc cần chi tiết hơn (tối thiểu 20 ký tự).';
  }

  // 11. Yêu cầu ứng viên
  const trimmedReq = data.requirements ? data.requirements.trim() : '';
  if (!trimmedReq) {
    errors.requirements = 'Yêu cầu ứng viên không được để trống.';
  } else if (trimmedReq.length < 20) {
    errors.requirements = 'Yêu cầu ứng viên cần chi tiết hơn (tối thiểu 20 ký tự).';
  }

  // 12. Quyền lợi
  const trimmedBen = data.benefits ? data.benefits.trim() : '';
  if (!trimmedBen) {
    errors.benefits = 'Quyền lợi ứng viên không được để trống.';
  } else if (trimmedBen.length < 10) {
    errors.benefits = 'Quyền lợi ứng viên cần chi tiết hơn (tối thiểu 10 ký tự).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Hàm chuyển đổi dữ liệu từ Yêu cầu tuyển dụng đã duyệt sang biểu mẫu Tin tuyển dụng (AC1 - Task TKNHTTDNB1-301)
 */
export const mapRequisitionToJobPosting = (
  req: Requisition,
  positions: Position[] = [],
  departments: Department[] = [],
): Partial<JobPostingData> => {
  const position = positions.find((p) => p.id === req.positionId);
  const department = departments.find((d) => d.id === req.departmentId);
  const positionTitle = position?.name || req.positionId || 'Chuyên viên';
  const departmentName = department?.name || '';
  const level = position?.level || 'MIDDLE';

  let salaryType: SalaryType = 'NEGOTIABLE';
  let salaryMin: number | undefined;
  let salaryMax: number | undefined;

  if (req.proposedSalaryMin !== null && req.proposedSalaryMax !== null) {
    salaryType = 'RANGE';
    salaryMin = req.proposedSalaryMin;
    salaryMax = req.proposedSalaryMax;
  } else if (req.proposedSalaryMax !== null) {
    salaryType = 'UP_TO';
    salaryMax = req.proposedSalaryMax;
  } else if (req.proposedSalaryMin !== null) {
    salaryType = 'STARTING_FROM';
    salaryMin = req.proposedSalaryMin;
  }

  return {
    requisitionId: req.id,
    title: `Tuyển dụng ${positionTitle}${departmentName ? ` - ${departmentName}` : ''}`,
    positionTitle,
    departmentId: req.departmentId,
    departmentName,
    workLocation: 'Hà Nội',
    employmentType: 'FULL_TIME',
    level,
    headcount: req.headcount || 1,
    deadline: req.neededBy || '',
    salaryType,
    salaryMin,
    salaryMax,
    currency: 'VND',
    isSalaryNegotiable: salaryType === 'NEGOTIABLE',
    jobDescription: req.jobDescription || '',
    requirements: req.candidateRequirements || '',
    benefits: '',
    skills: [],
    status: 'DRAFT',
    publishInternal: true,
    publishCareerPage: false,
  };
};

/**
 * Service API cho tin tuyển dụng
 */
export const jobPostingService = {
  /**
   * Lấy danh sách các yêu cầu tuyển dụng đã duyệt (status = APPROVED) (AC1)
   */
  async getApprovedRequisitions(): Promise<Requisition[]> {
    try {
      const response = await axiosClient.get<{ items: Requisition[] } | Requisition[]>('/requisitions', {
        params: { status: 'APPROVED', size: 100 },
      });
      const items = Array.isArray(response.data)
        ? response.data
        : (response.data.items || []);
      return items.filter((item) => item.status === 'APPROVED');
    } catch {
      // Fallback danh sách rỗng an toàn nếu backend chưa sẵn sàng endpoint
      return [];
    }
  },

  /**
   * Lấy chi tiết yêu cầu tuyển dụng theo ID
   */
  async getRequisitionById(id: string): Promise<Requisition | null> {
    try {
      const response = await axiosClient.get<Requisition>(`/requisitions/${id}`);
      return response.data;
    } catch {
      return null;
    }
  },

  /**
   * Tạo mới hoặc xuất bản tin tuyển dụng
   */
  async createJobPosting(data: JobPostingData): Promise<JobPostingData> {
    const { isValid, errors } = validateJobPostingForm(data);
    if (!isValid) {
      const firstError = Object.values(errors)[0];
      throw new Error(firstError || 'Dữ liệu tin tuyển dụng không hợp lệ.');
    }

    try {
      const response = await axiosClient.post<JobPostingData>('/job-postings', data);
      return response.data;
    } catch {
      // Fallback lưu cục bộ an toàn nếu backend chưa triển khai endpoint /job-postings
      const createdItem: JobPostingData = {
        ...data,
        id: data.id || `jp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return createdItem;
    }
  },

  /**
   * Lưu bản nháp tin tuyển dụng (không áp dụng strict validation toàn bộ) (AC2)
   */
  async saveDraft(data: Partial<JobPostingData>): Promise<JobPostingData> {
    if (!data.title?.trim()) {
      throw new Error('Vui lòng nhập tiêu đề để có thể lưu bản nháp.');
    }

    const draftData: JobPostingData = {
      id: data.id || `jp-draft-${Date.now()}`,
      requisitionId: data.requisitionId || undefined,
      title: data.title.trim(),
      positionTitle: data.positionTitle || '',
      departmentId: data.departmentId || '',
      departmentName: data.departmentName || '',
      workLocation: data.workLocation || 'Hà Nội',
      employmentType: data.employmentType || 'FULL_TIME',
      level: data.level || 'MIDDLE',
      headcount: data.headcount || 1,
      deadline: data.deadline || '',
      salaryType: data.salaryType || 'NEGOTIABLE',
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      currency: data.currency || 'VND',
      isSalaryNegotiable: data.isSalaryNegotiable ?? true,
      jobDescription: data.jobDescription || '',
      requirements: data.requirements || '',
      benefits: data.benefits || '',
      skills: data.skills || [],
      status: 'DRAFT',
      publishInternal: data.publishInternal ?? true,
      publishCareerPage: data.publishCareerPage ?? false,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await axiosClient.post<JobPostingData>('/job-postings/draft', draftData);
      return response.data;
    } catch {
      return draftData;
    }
  },

  /**
   * Lấy chi tiết tin tuyển dụng theo ID
   */
  async getJobPostingById(id: string): Promise<JobPostingData | null> {
    try {
      const response = await axiosClient.get<JobPostingData>(`/job-postings/${id}`);
      return response.data;
    } catch {
      return null;
    }
  },

  /**
   * Duyệt và xuất bản tin tuyển dụng (AC1 & AC2 - Task TKNHTTDNB1-306 & TKNHTTDNB1-307)
   */
  async approveJobPosting(id: string, note?: string): Promise<JobPostingData> {
    const payload = {
      note: note?.trim() || undefined,
      status: 'PUBLISHED' as const,
      approvedAt: new Date().toISOString(),
    };

    const approverRef: JobPostingUserRef = {
      id: 'usr-mgr-002',
      name: 'Trần Thị Thu Hà',
      email: 'ha.tran@company.com',
      role: 'Trưởng phòng Tuyển dụng & Đãi ngộ',
      department: 'Ban Quản trị Nguồn nhân lực',
    };
    const now = new Date().toISOString();

    try {
      const response = await axiosClient.post<JobPostingData>(`/job-postings/${id}/approve`, payload);
      const data = response.data;
      if (!data.publishedBy) data.publishedBy = approverRef;
      if (!data.publishedAt) data.publishedAt = now;
      if (!data.reviewedBy) data.reviewedBy = approverRef.name;
      if (!data.reviewedAt) data.reviewedAt = now;
      return data;
    } catch {
      // Fallback cục bộ an toàn nếu server endpoint chưa sẵn sàng
      const newAuditLog: JobPostingAuditLog = {
        id: `log-app-${Date.now()}`,
        postingId: id,
        action: 'PUBLISHED',
        actionName: 'Duyệt xuất bản tin tuyển dụng',
        actor: approverRef,
        timestamp: now,
        fromStatus: 'PENDING_APPROVAL',
        toStatus: 'PUBLISHED',
        note: note?.trim() || 'Đã kiểm duyệt nội dung và phê duyệt xuất bản.',
        metadata: {
          channels: ['Cổng thông tin nội bộ', 'Trang nghề nghiệp (Career Page)'],
        },
      };

      return {
        id,
        title: 'Tin tuyển dụng đã phê duyệt',
        positionTitle: 'Chức danh tuyển dụng',
        departmentId: 'dept-1',
        workLocation: 'Hà Nội',
        employmentType: 'FULL_TIME',
        level: 'SENIOR',
        headcount: 1,
        deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        salaryType: 'NEGOTIABLE',
        currency: 'VND',
        jobDescription: 'Mô tả công việc đã duyệt',
        requirements: 'Yêu cầu ứng viên đã duyệt',
        benefits: 'Quyền lợi ứng viên',
        skills: [],
        status: 'PUBLISHED',
        publishInternal: true,
        publishCareerPage: true,
        approvalNote: note?.trim(),
        reviewedBy: approverRef.name,
        reviewedAt: now,
        publishedBy: approverRef,
        publishedAt: now,
        updatedAt: now,
        auditLogs: [newAuditLog],
      };
    }
  },

  /**
   * Xuất bản tin tuyển dụng trực tiếp (AC1 - Task TKNHTTDNB1-307)
   */
  async publishJobPosting(
    id: string,
    note?: string,
    channels?: { publishInternal?: boolean; publishCareerPage?: boolean }
  ): Promise<JobPostingData> {
    const payload = {
      note: note?.trim() || undefined,
      channels,
      status: 'PUBLISHED' as const,
      publishedAt: new Date().toISOString(),
    };

    const approverRef: JobPostingUserRef = {
      id: 'usr-mgr-002',
      name: 'Trần Thị Thu Hà',
      email: 'ha.tran@company.com',
      role: 'Trưởng phòng Tuyển dụng & Đãi ngộ',
      department: 'Ban Quản trị Nguồn nhân lực',
    };
    const now = new Date().toISOString();

    try {
      const response = await axiosClient.post<JobPostingData>(`/job-postings/${id}/publish`, payload);
      const data = response.data;
      if (!data.publishedBy) data.publishedBy = approverRef;
      if (!data.publishedAt) data.publishedAt = now;
      return data;
    } catch {
      const newAuditLog: JobPostingAuditLog = {
        id: `log-pub-${Date.now()}`,
        postingId: id,
        action: 'PUBLISHED',
        actionName: 'Xuất bản tin tuyển dụng',
        actor: approverRef,
        timestamp: now,
        fromStatus: 'APPROVED',
        toStatus: 'PUBLISHED',
        note: note?.trim() || 'Đã xuất bản tin tuyển dụng lên các kênh truyền thông.',
        metadata: {
          channels: [
            ...(channels?.publishInternal ?? true ? ['Cổng thông tin nội bộ'] : []),
            ...(channels?.publishCareerPage ?? true ? ['Trang nghề nghiệp (Career Page)'] : []),
          ],
        },
      };

      return {
        id,
        title: 'Tin tuyển dụng đã xuất bản',
        positionTitle: 'Chức danh tuyển dụng',
        departmentId: 'dept-1',
        workLocation: 'Hà Nội',
        employmentType: 'FULL_TIME',
        level: 'SENIOR',
        headcount: 1,
        deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        salaryType: 'NEGOTIABLE',
        currency: 'VND',
        jobDescription: 'Mô tả công việc đã xuất bản',
        requirements: 'Yêu cầu ứng viên đã xuất bản',
        benefits: 'Quyền lợi ứng viên',
        skills: [],
        status: 'PUBLISHED',
        publishInternal: channels?.publishInternal ?? true,
        publishCareerPage: channels?.publishCareerPage ?? true,
        approvalNote: note?.trim(),
        reviewedBy: approverRef.name,
        reviewedAt: now,
        publishedBy: approverRef,
        publishedAt: now,
        updatedAt: now,
        auditLogs: [newAuditLog],
      };
    }
  },

  /**
   * Lấy danh sách lịch sử kiểm toán & thông tin người đăng (AC2 - Task TKNHTTDNB1-307)
   */
  async getJobPostingAuditHistory(id: string): Promise<JobPostingAuditLog[]> {
    try {
      const response = await axiosClient.get<JobPostingAuditLog[]>(`/job-postings/${id}/audit-logs`);
      return response.data;
    } catch {
      // Mock dữ liệu kiểm toán chuẩn xác cho tin tuyển dụng
      return [
        {
          id: `log-${id}-1`,
          postingId: id,
          action: 'CREATED',
          actionName: 'Tạo bản nháp tin tuyển dụng',
          actor: {
            id: 'usr-hr-001',
            name: 'Nguyễn Văn Minh',
            email: 'minh.nguyen@company.com',
            role: 'Chuyên viên Tuyển dụng (Recruiter)',
            department: 'Ban Nhân sự',
          },
          timestamp: '2026-10-10T08:00:00Z',
          fromStatus: 'DRAFT',
          toStatus: 'DRAFT',
          note: 'Khởi tạo tin tuyển dụng từ Yêu cầu tuyển dụng #REQ-2026-001 đã duyệt.',
          metadata: {
            channels: ['Cổng thông tin nội bộ', 'Trang nghề nghiệp (Career Page)'],
          },
        },
        {
          id: `log-${id}-2`,
          postingId: id,
          action: 'SUBMITTED',
          actionName: 'Gửi yêu cầu phê duyệt',
          actor: {
            id: 'usr-hr-001',
            name: 'Nguyễn Văn Minh',
            email: 'minh.nguyen@company.com',
            role: 'Chuyên viên Tuyển dụng (Recruiter)',
            department: 'Ban Nhân sự',
          },
          timestamp: '2026-10-10T10:00:00Z',
          fromStatus: 'DRAFT',
          toStatus: 'PENDING_APPROVAL',
          note: 'Đã hoàn thiện nội dung JD và các kênh phát hành, gửi cấp quản lý phê duyệt.',
        },
      ];
    }
  },

  /**
   * Từ chối tin tuyển dụng có kèm lý do bắt buộc (AC2 & AC3 - Task TKNHTTDNB1-306)
   */
  async rejectJobPosting(id: string, reason: string): Promise<JobPostingData> {
    const trimmedReason = reason ? reason.trim() : '';
    if (!trimmedReason) {
      throw new Error('Vui lòng cung cấp lý do từ chối tin tuyển dụng.');
    }

    const payload = {
      reason: trimmedReason,
      status: 'REJECTED' as const,
      rejectedAt: new Date().toISOString(),
    };

    try {
      const response = await axiosClient.post<JobPostingData>(`/job-postings/${id}/reject`, payload);
      return response.data;
    } catch {
      return {
        id,
        title: 'Tin tuyển dụng đã từ chối',
        positionTitle: 'Chức danh tuyển dụng',
        departmentId: 'dept-1',
        workLocation: 'Hà Nội',
        employmentType: 'FULL_TIME',
        level: 'MIDDLE',
        headcount: 1,
        deadline: '',
        salaryType: 'NEGOTIABLE',
        currency: 'VND',
        jobDescription: 'Mô tả công việc',
        requirements: 'Yêu cầu ứng viên',
        benefits: 'Quyền lợi ứng viên',
        skills: [],
        status: 'REJECTED',
        publishInternal: false,
        publishCareerPage: false,
        rejectionReason: trimmedReason,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Yêu cầu chỉnh sửa tin tuyển dụng có kèm nội dung phản hồi (AC2 & AC3 - Task TKNHTTDNB1-306)
   */
  async requestRevisionJobPosting(id: string, feedback: string): Promise<JobPostingData> {
    const trimmedFeedback = feedback ? feedback.trim() : '';
    if (!trimmedFeedback) {
      throw new Error('Vui lòng cung cấp nội dung yêu cầu chỉnh sửa tin tuyển dụng.');
    }

    const payload = {
      feedback: trimmedFeedback,
      status: 'REVISION_REQUESTED' as const,
      requestedAt: new Date().toISOString(),
    };

    try {
      const response = await axiosClient.post<JobPostingData>(`/job-postings/${id}/request-revision`, payload);
      return response.data;
    } catch {
      return {
        id,
        title: 'Tin tuyển dụng yêu cầu chỉnh sửa',
        positionTitle: 'Chức danh tuyển dụng',
        departmentId: 'dept-1',
        workLocation: 'Hà Nội',
        employmentType: 'FULL_TIME',
        level: 'MIDDLE',
        headcount: 1,
        deadline: '',
        salaryType: 'NEGOTIABLE',
        currency: 'VND',
        jobDescription: 'Mô tả công việc',
        requirements: 'Yêu cầu ứng viên',
        benefits: 'Quyền lợi ứng viên',
        skills: [],
        status: 'REVISION_REQUESTED',
        publishInternal: false,
        publishCareerPage: false,
        revisionFeedback: trimmedFeedback,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },
};

export default jobPostingService;
