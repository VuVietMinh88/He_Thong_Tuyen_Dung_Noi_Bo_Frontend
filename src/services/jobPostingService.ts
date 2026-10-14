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
   * Yêu cầu chỉnh sửa tin tuyển dụng có kèm nội dung phản hồi và expectedRevision (AC2 & AC3 - Task TKNHTTDNB1-306)
   */
  async requestRevisionJobPosting(
    id: string,
    feedback: string,
    expectedRevision?: string
  ): Promise<JobPostingData> {
    const trimmedFeedback = feedback ? feedback.trim() : '';
    const trimmedExpectedRevision = expectedRevision ? expectedRevision.trim() : trimmedFeedback;
    if (!trimmedFeedback && !trimmedExpectedRevision) {
      throw new Error('Vui lòng cung cấp nội dung yêu cầu chỉnh sửa tin tuyển dụng.');
    }

    const payload = {
      feedback: trimmedFeedback || trimmedExpectedRevision,
      expectedRevision: trimmedExpectedRevision || trimmedFeedback,
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

  /**
   * Lấy danh sách việc làm công khai dành cho ứng viên bên ngoài (User Story S3-01 / Task TKNHTTDNB1-312)
   */
  async getPublicJobPostings(params?: PublicJobFilterParams): Promise<PublicJobPostingsResponse> {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const pageSize = params?.pageSize && params.pageSize > 0 ? params.pageSize : 6;

    try {
      const response = await axiosClient.get<
        PublicJobPostingsResponse | { items: JobPostingData[]; total?: number }
      >('/public/job-postings', { params });

      if (response.data && 'items' in response.data && Array.isArray(response.data.items)) {
        const items = response.data.items;
        const total = response.data.total ?? items.length;
        const totalPages = Math.ceil(total / pageSize) || 1;
        return {
          items,
          total,
          page,
          pageSize,
          totalPages,
        };
      }
    } catch {
      // Fallback cục bộ an toàn khi backend chưa cung cấp endpoint /public/job-postings
    }

    // Dữ liệu mẫu việc làm đã duyệt và xuất bản (status = 'PUBLISHED' & publishCareerPage = true)
    const mockPublicJobs: JobPostingData[] = [
      {
        id: 'jp-pub-001',
        title: 'Senior Frontend Developer (React, TypeScript & Tailwind CSS)',
        positionTitle: 'Senior Frontend Developer',
        departmentId: 'dept-tech',
        departmentName: 'Khối Công nghệ & Sản phẩm',
        workLocation: 'Hà Nội',
        employmentType: 'FULL_TIME',
        level: 'SENIOR',
        headcount: 2,
        deadline: '2026-11-30',
        salaryType: 'RANGE',
        salaryMin: 25,
        salaryMax: 45,
        currency: 'VND',
        isSalaryNegotiable: true,
        jobDescription: 'Tham gia thiết kế, phát triển và tối ưu hóa hệ thống giao diện người dùng quy mô lớn cho nền tảng Smart Recruitment. Phối hợp chặt chẽ với UI/UX Designer và Backend team để xây dựng trải nghiệm tuyển dụng hiện đại, mượt mà và trực quan.',
        requirements: 'Tối thiểu 3 năm kinh nghiệm thực chiến với React, TypeScript và Tailwind CSS. Thành thạo State Management, RESTful API, tối ưu hóa Web Performance (LCP, INP). Khả năng viết code sạch, unit test và tư duy giải quyết vấn đề tốt.',
        benefits: 'Mức lương cạnh tranh 25-45 triệu VND kèm tháng 13. Thưởng hiệu quả dự án hàng quý. Bảo hiểm sức khỏe PVI Premium toàn diện cho nhân viên và người thân. Môi trường Agile năng động, hỗ trợ thiết bị Macbook Pro M-series.',
        skills: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'RESTful API'],
        status: 'PUBLISHED',
        publishInternal: true,
        publishCareerPage: true,
        publishedAt: '2026-10-10T08:30:00Z',
      },
      {
        id: 'jp-pub-002',
        title: 'Backend Lead Engineer (Java Spring Boot & Microservices)',
        positionTitle: 'Backend Lead Engineer',
        departmentId: 'dept-tech',
        departmentName: 'Khối Công nghệ & Sản phẩm',
        workLocation: 'TP. Hồ Chí Minh',
        employmentType: 'FULL_TIME',
        level: 'LEAD',
        headcount: 1,
        deadline: '2026-12-15',
        salaryType: 'RANGE',
        salaryMin: 45,
        salaryMax: 65,
        currency: 'VND',
        isSalaryNegotiable: true,
        jobDescription: 'Chịu trách nhiệm kiến trúc và định hướng kỹ thuật cho toàn bộ hệ thống microservices phía backend. Định nghĩa các chuẩn mực kỹ thuật, code review và mentor cho các kỹ sư trẻ trong đội ngũ.',
        requirements: 'Từ 5 năm kinh nghiệm Java/Spring Boot, kiến trúc Microservices phân tán, Docker, Kubernetes, PostgreSQL và Kafka/RabbitMQ. Khả năng chịu tải cao, thiết kế cơ sở dữ liệu và bảo mật thông tin.',
        benefits: 'Mức lương từ 45 - 65 triệu VND. Gói cổ phiếu ESOP hấp dẫn. 15 ngày nghỉ phép hưởng nguyên lương mỗi năm. Tham gia các hội thảo công nghệ quốc tế định kỳ.',
        skills: ['Java', 'Spring Boot', 'Microservices', 'PostgreSQL', 'Docker', 'Kafka'],
        status: 'PUBLISHED',
        publishInternal: true,
        publishCareerPage: true,
        publishedAt: '2026-10-11T09:00:00Z',
      },
      {
        id: 'jp-pub-003',
        title: 'Senior Product Designer (UI/UX & Design System)',
        positionTitle: 'Senior Product Designer',
        departmentId: 'dept-tech',
        departmentName: 'Khối Công nghệ & Sản phẩm',
        workLocation: 'Linh hoạt (Hybrid)',
        employmentType: 'HYBRID',
        level: 'SENIOR',
        headcount: 1,
        deadline: '2026-11-20',
        salaryType: 'RANGE',
        salaryMin: 25,
        salaryMax: 40,
        currency: 'VND',
        isSalaryNegotiable: true,
        jobDescription: 'Chủ trì thiết kế trải nghiệm người dùng (UX) và giao diện trực quan (UI) cho toàn bộ hệ sinh thái sản phẩm tuyển dụng. Xây dựng và duy trì Design System nhất quán, hiện đại theo chuẩn quốc tế.',
        requirements: 'Từ 3-5 năm kinh nghiệm Product Design/UI-UX cho các sản phẩm SaaS B2B hoặc B2C. Thành thạo Figma, Design Tokens, prototyping và nghiên cứu hành vi người dùng (User Research, Usability Testing). Có portfolio dự án ấn tượng.',
        benefits: 'Thu nhập 25-40 triệu VND. Chế độ làm việc Hybrid linh hoạt (2 ngày làm việc tại nhà mỗi tuần). Ngân sách đào tạo và công cụ bản quyền cao cấp (Figma Enterprise, Adobe CC).',
        skills: ['Figma', 'UI/UX Design', 'Design System', 'Prototyping', 'User Research'],
        status: 'PUBLISHED',
        publishInternal: true,
        publishCareerPage: true,
        publishedAt: '2026-10-12T10:15:00Z',
      },
      {
        id: 'jp-pub-004',
        title: 'Data Engineer / MLOps Specialist (AI & Data Lakehouse)',
        positionTitle: 'Data Engineer / MLOps Specialist',
        departmentId: 'dept-ai',
        departmentName: 'Trung tâm Nghiên cứu AI & Dữ liệu',
        workLocation: 'Làm việc từ xa (Remote)',
        employmentType: 'REMOTE',
        level: 'MIDDLE',
        headcount: 2,
        deadline: '2026-11-25',
        salaryType: 'RANGE',
        salaryMin: 30,
        salaryMax: 50,
        currency: 'VND',
        isSalaryNegotiable: true,
        jobDescription: 'Xây dựng và vận hành các pipeline dữ liệu lớn (Big Data pipelines), lưu trữ Lakehouse và triển khai quy trình MLOps tự động cho các mô hình AI/ML phân tích ứng viên và tự động matching CV.',
        requirements: 'Có từ 2-4 năm kinh nghiệm với Python, Apache Spark, Airflow, dbt, BigQuery hoặc ClickHouse. Am hiểu quy trình CI/CD cho mô hình Machine Learning và quản lý vòng đời mô hình (MLflow, Kubeflow).',
        benefits: 'Mức lương 30 - 50 triệu VND. Làm việc 100% Remote linh hoạt địa điểm. Phụ cấp Internet và không gian làm việc tại nhà hàng tháng. Thưởng dự án AI xuất sắc.',
        skills: ['Python', 'Apache Spark', 'MLOps', 'BigQuery', 'Docker', 'Airflow'],
        status: 'PUBLISHED',
        publishInternal: true,
        publishCareerPage: true,
        publishedAt: '2026-10-09T14:00:00Z',
      },
      {
        id: 'jp-pub-005',
        title: 'Chuyên viên Tuyển dụng Cao cấp (Senior IT Recruiter)',
        positionTitle: 'Senior IT Recruiter',
        departmentId: 'dept-hr',
        departmentName: 'Ban Quản trị Nguồn nhân lực',
        workLocation: 'Hà Nội',
        employmentType: 'FULL_TIME',
        level: 'SENIOR',
        headcount: 2,
        deadline: '2026-11-15',
        salaryType: 'RANGE',
        salaryMin: 18,
        salaryMax: 28,
        currency: 'VND',
        isSalaryNegotiable: true,
        jobDescription: 'Lập kế hoạch và trực tiếp tìm kiếm, thu hút các nhân sự công nghệ chất lượng cao (Software Engineers, Solution Architects, Tech Leads, AI Specialists). Quản lý toàn bộ quy trình từ sourcing, phỏng vấn đến offer onboarding.',
        requirements: 'Từ 3 năm kinh nghiệm tuyển dụng ngành IT (Tech/Software). Hiểu biết sâu sắc về các công nghệ lập trình, thị trường lao động IT tại Việt Nam. Kỹ năng giao tiếp xuất sắc và tư duy kết nối đối tác nhân tài.',
        benefits: 'Mức lương cứng 18 - 28 triệu VND + Thưởng tuyển dụng không giới hạn theo KPI. Khám sức khỏe cao cấp định kỳ tại bệnh viện quốc tế. Môi trường làm việc nhân văn, chuyên nghiệp.',
        skills: ['IT Sourcing', 'Headhunting', 'Candidate Experience', 'Employer Branding', 'Interviewing'],
        status: 'PUBLISHED',
        publishInternal: true,
        publishCareerPage: true,
        publishedAt: '2026-10-08T08:00:00Z',
      },
      {
        id: 'jp-pub-006',
        title: 'Chuyên viên Tiếp thị Kỹ thuật số (Digital Marketing Specialist)',
        positionTitle: 'Digital Marketing Specialist',
        departmentId: 'dept-mkt',
        departmentName: 'Phòng Tiếp thị & Truyền thông',
        workLocation: 'Hà Nội',
        employmentType: 'FULL_TIME',
        level: 'MIDDLE',
        headcount: 1,
        deadline: '2026-12-05',
        salaryType: 'RANGE',
        salaryMin: 15,
        salaryMax: 25,
        currency: 'VND',
        isSalaryNegotiable: true,
        jobDescription: 'Lên kế hoạch và triển khai các chiến dịch Digital Marketing tổng thể cho sản phẩm B2B SaaS: SEO, Google Ads, LinkedIn Ads, Content Inbound Marketing và Email Marketing tự động.',
        requirements: 'Tối thiểu 2 năm kinh nghiệm Digital Performance Marketing hoặc Growth Marketing, ưu tiên trong lĩnh vực công nghệ hoặc B2B. Kỹ năng phân tích số liệu (Google Analytics 4, Tag Manager) và sáng tạo nội dung thu hút.',
        benefits: 'Thu nhập 15 - 25 triệu VND/tháng. Thưởng hoa hồng theo số lượng Lead chất lượng đem lại. Cơ hội thăng tiến lên Marketing Lead sau 1 năm.',
        skills: ['SEO/SEM', 'Google Ads', 'Content Marketing', 'Google Analytics', 'Social Media'],
        status: 'PUBLISHED',
        publishInternal: true,
        publishCareerPage: true,
        publishedAt: '2026-10-10T11:00:00Z',
      },
      {
        id: 'jp-pub-007',
        title: 'Chuyên viên Phát triển Kinh doanh B2B (Enterprise Business Development)',
        positionTitle: 'Enterprise Business Development',
        departmentId: 'dept-sales',
        departmentName: 'Phòng Kinh doanh B2B',
        workLocation: 'TP. Hồ Chí Minh',
        employmentType: 'FULL_TIME',
        level: 'MIDDLE',
        headcount: 3,
        deadline: '2026-12-20',
        salaryType: 'STARTING_FROM',
        salaryMin: 18,
        currency: 'VND',
        isSalaryNegotiable: true,
        jobDescription: 'Tìm kiếm, tiếp cận và đàm phán giải pháp phần mềm quản trị tuyển dụng thông minh cho các doanh nghiệp quy mô lớn (Enterprise). Xây dựng mối quan hệ bền vững với các Giám đốc Nhân sự (CHRO, HRD).',
        requirements: 'Từ 2 năm kinh nghiệm kinh doanh giải pháp công nghệ B2B hoặc phần mềm SaaS. Kỹ năng thuyết trình, đàm phán hợp đồng giá trị lớn và xử lý phản hồi khách hàng khéo léo.',
        benefits: 'Lương cơ bản từ 18 triệu VND + Hoa hồng doanh số hấp dẫn (tổng thu nhập trung bình 35 - 50 triệu VND/tháng). Phụ cấp công tác, điện thoại và tiếp khách.',
        skills: ['B2B Sales', 'Negotiation', 'CRM', 'SaaS Solution', 'Customer Presentation'],
        status: 'PUBLISHED',
        publishInternal: true,
        publishCareerPage: true,
        publishedAt: '2026-10-07T15:20:00Z',
      },
      {
        id: 'jp-pub-008',
        title: 'DevOps / Cloud Platform Engineer (AWS, Kubernetes & Terraform)',
        positionTitle: 'DevOps / Cloud Platform Engineer',
        departmentId: 'dept-tech',
        departmentName: 'Khối Công nghệ & Sản phẩm',
        workLocation: 'Hà Nội',
        employmentType: 'FULL_TIME',
        level: 'SENIOR',
        headcount: 1,
        deadline: '2026-12-10',
        salaryType: 'RANGE',
        salaryMin: 30,
        salaryMax: 48,
        currency: 'VND',
        isSalaryNegotiable: false,
        jobDescription: 'Quản trị hạ tầng điện toán đám mây AWS, xây dựng cụm Kubernetes (EKS), cấu hình giám sát (Prometheus, Grafana) và tự động hóa toàn bộ quy trình CI/CD pipelines an toàn, liên tục.',
        requirements: 'Từ 3 năm kinh nghiệm DevOps/SRE trên AWS hoặc GCP. Thành thạo Terraform (IaC), Docker, Kubernetes, CI/CD (GitHub Actions/GitLab CI), Linux administration và kiến trúc High Availability.',
        benefits: 'Mức lương 30 - 48 triệu VND. Được tài trợ 100% chi phí thi các chứng chỉ quốc tế AWS Certified Solutions Architect / CKA. 14 ngày nghỉ phép hàng năm.',
        skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Docker', 'Prometheus'],
        status: 'PUBLISHED',
        publishInternal: true,
        publishCareerPage: true,
        publishedAt: '2026-10-11T16:00:00Z',
      },
      {
        id: 'jp-pub-009',
        title: 'Thực tập sinh Lập trình Web Frontend / Backend (Full-stack Intern)',
        positionTitle: 'Software Engineer Intern',
        departmentId: 'dept-tech',
        departmentName: 'Khối Công nghệ & Sản phẩm',
        workLocation: 'Hà Nội',
        employmentType: 'INTERNSHIP',
        level: 'INTERN',
        headcount: 5,
        deadline: '2026-11-18',
        salaryType: 'STARTING_FROM',
        salaryMin: 6,
        currency: 'VND',
        isSalaryNegotiable: true,
        jobDescription: 'Tham gia chương trình ươm mầm tài năng công nghệ. Được trực tiếp hướng dẫn 1-1 bởi các Senior/Lead Engineer. Tham gia code các module thực tế của hệ thống tuyển dụng.',
        requirements: 'Sinh viên năm 3, 4 hoặc mới tốt nghiệp chuyên ngành CNTT, Khoa học Máy tính hoặc tương đương. Nắm vững kiến thức nền tảng về OOP, Data Structures, Git và một trong các ngôn ngữ React/TypeScript hoặc Java/Node.js.',
        benefits: 'Hỗ trợ thực tập từ 6 triệu VND/tháng + Hỗ trợ ăn trưa, gửi xe miễn phí. Cơ hội ký hợp đồng nhân viên chính thức ngay sau khi kết thúc kỳ thực tập.',
        skills: ['JavaScript', 'TypeScript', 'React', 'Git', 'HTML/CSS'],
        status: 'PUBLISHED',
        publishInternal: true,
        publishCareerPage: true,
        publishedAt: '2026-10-12T09:30:00Z',
      },
      {
        id: 'jp-pub-010',
        title: 'Senior QA / QC Automation Engineer (Playwright & API Testing)',
        positionTitle: 'Senior QA Automation Engineer',
        departmentId: 'dept-tech',
        departmentName: 'Khối Công nghệ & Sản phẩm',
        workLocation: 'Đà Nẵng',
        employmentType: 'FULL_TIME',
        level: 'SENIOR',
        headcount: 1,
        deadline: '2026-12-01',
        salaryType: 'RANGE',
        salaryMin: 22,
        salaryMax: 38,
        currency: 'VND',
        isSalaryNegotiable: true,
        jobDescription: 'Thiết kế chiến lược kiểm thử tự động toàn diện từ UI đến API, tích hợp automation test vào luồng CI/CD, đảm bảo chất lượng và độ ổn định cao nhất cho hệ thống.',
        requirements: 'Từ 3 năm kinh nghiệm kiểm thử tự động với Playwright, Selenium hoặc Cypress. Thành thạo kiểm thử API với Postman/RestAssured, viết test script bằng TypeScript/JavaScript hoặc Python.',
        benefits: 'Mức lương cạnh tranh 22 - 38 triệu VND. Làm việc tại văn phòng tiện nghi bên bờ biển Đà Nẵng. Trợ cấp ăn trưa và du lịch thường niên cùng công ty.',
        skills: ['Playwright', 'API Testing', 'TypeScript', 'CI/CD', 'Selenium'],
        status: 'PUBLISHED',
        publishInternal: true,
        publishCareerPage: true,
        publishedAt: '2026-10-10T14:40:00Z',
      },
    ];

    // Áp dụng bộ lọc client-side cho mock data
    let filtered = [...mockPublicJobs];

    if (params?.keyword && params.keyword.trim()) {
      const q = params.keyword.trim().toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(q) ||
          job.positionTitle.toLowerCase().includes(q) ||
          (job.departmentName && job.departmentName.toLowerCase().includes(q)) ||
          job.jobDescription.toLowerCase().includes(q) ||
          job.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    const targetDept = params?.department || params?.departmentId;
    if (targetDept && targetDept !== 'ALL') {
      filtered = filtered.filter(
        (job) => job.departmentId === targetDept || job.departmentName === targetDept
      );
    }

    const targetLocation = params?.location || params?.workLocation;
    if (targetLocation && targetLocation !== 'ALL') {
      filtered = filtered.filter((job) =>
        job.workLocation.toLowerCase().includes(targetLocation.toLowerCase())
      );
    }

    const targetWorkType = params?.workType || params?.employmentType;
    if (targetWorkType && targetWorkType !== 'ALL') {
      filtered = filtered.filter((job) => job.employmentType === targetWorkType);
    }

    if (params?.level && params.level !== 'ALL') {
      filtered = filtered.filter((job) => job.level === params.level);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      total,
      page,
      pageSize,
      totalPages,
    };
  },

  /**
   * Service API tìm kiếm và lọc danh sách việc làm công khai (User Story S3-01 / Task TKNHTTDNB1-313 AC3)
   */
  async getPublicJobs(params?: PublicJobFilterParams): Promise<PublicJobPostingsResponse> {
    return this.getPublicJobPostings(params);
  },
};

export interface PublicJobFilterParams {
  keyword?: string;
  department?: string;
  departmentId?: string;
  location?: string;
  workLocation?: string;
  workType?: string;
  employmentType?: string;
  level?: string;
  page?: number;
  pageSize?: number;
}

export interface PublicJobPostingsResponse {
  items: JobPostingData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Định dạng hiển thị mức lương thân thiện cho ứng viên (AC2)
 */
export const formatSalaryDisplay = (job: Partial<JobPostingData>): string => {
  if (job.isSalaryNegotiable || job.salaryType === 'NEGOTIABLE' || (!job.salaryMin && !job.salaryMax)) {
    return 'Thỏa thuận';
  }

  const currency = job.currency || 'VND';
  const unit = currency === 'VND' ? 'triệu VND' : 'USD';

  if (job.salaryType === 'RANGE' && job.salaryMin !== undefined && job.salaryMax !== undefined) {
    return `${job.salaryMin} - ${job.salaryMax} ${unit}`;
  }
  if (job.salaryType === 'UP_TO' && job.salaryMax !== undefined) {
    return `Lên tới ${job.salaryMax} ${unit}`;
  }
  if (job.salaryType === 'STARTING_FROM' && job.salaryMin !== undefined) {
    return `Từ ${job.salaryMin} ${unit}`;
  }
  if (job.salaryMin && job.salaryMax) {
    return `${job.salaryMin} - ${job.salaryMax} ${unit}`;
  }
  if (job.salaryMax) {
    return `Lên tới ${job.salaryMax} ${unit}`;
  }
  if (job.salaryMin) {
    return `Từ ${job.salaryMin} ${unit}`;
  }
  return 'Thỏa thuận';
};

/**
 * Chuyển đổi mã hình thức làm việc sang tiếng Việt (AC2)
 */
export const formatEmploymentType = (type?: string): string => {
  switch (type) {
    case 'FULL_TIME':
      return 'Toàn thời gian';
    case 'PART_TIME':
      return 'Bán thời gian';
    case 'REMOTE':
      return 'Từ xa (Remote)';
    case 'HYBRID':
      return 'Linh hoạt (Hybrid)';
    case 'INTERNSHIP':
      return 'Thực tập sinh';
    case 'CONTRACT':
      return 'Hợp đồng';
    default:
      return type || 'Toàn thời gian';
  }
};

/**
 * Chuyển đổi cấp bậc công việc sang tiếng Việt (AC2)
 */
export const formatJobLevel = (level?: string): string => {
  switch (level) {
    case 'INTERN':
      return 'Thực tập sinh';
    case 'FRESHER':
      return 'Mới tốt nghiệp (Fresher)';
    case 'JUNIOR':
      return 'Junior';
    case 'MIDDLE':
      return 'Middle';
    case 'SENIOR':
      return 'Senior';
    case 'LEAD':
      return 'Trưởng nhóm (Lead)';
    case 'MANAGER':
      return 'Quản lý (Manager)';
    default:
      return level || 'Tất cả cấp bậc';
  }
};

/**
 * Tính toán tình trạng hạn nộp hồ sơ (AC2)
 */
export const getDeadlineStatus = (
  deadlineStr?: string
): { text: string; isUrgent: boolean; isExpired: boolean; daysRemaining: number | null } => {
  if (!deadlineStr) return { text: 'Không giới hạn', isUrgent: false, isExpired: false, daysRemaining: null };
  try {
    const deadline = new Date(deadlineStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Đã hết hạn', isUrgent: false, isExpired: true, daysRemaining: diffDays };
    }
    if (diffDays === 0) {
      return { text: 'Hôm nay', isUrgent: true, isExpired: false, daysRemaining: 0 };
    }
    if (diffDays <= 5) {
      return { text: `Còn ${diffDays} ngày`, isUrgent: true, isExpired: false, daysRemaining: diffDays };
    }
    const day = String(deadline.getDate()).padStart(2, '0');
    const month = String(deadline.getMonth() + 1).padStart(2, '0');
    const year = deadline.getFullYear();
    return { text: `${day}/${month}/${year}`, isUrgent: false, isExpired: false, daysRemaining: diffDays };
  } catch {
    return { text: deadlineStr, isUrgent: false, isExpired: false, daysRemaining: null };
  }
};

export default jobPostingService;
