import axiosClient from '../utils/axiosClient';
import type {
  CandidateOnboardingRecord,
  OnboardingCandidateTask,
  OnboardingTaskStatus,
} from '../types/onboardingChecklist';

const STORAGE_KEY = 'smart_recruitment_onboarding_candidate_records_v1';

export const MOCK_CANDIDATE_ONBOARDING_RECORDS: CandidateOnboardingRecord[] = [
  {
    id: 'ONB-2026-0891',
    candidateId: 'cand-final-001',
    candidateName: 'Nguyễn Văn An',
    candidateCode: 'CAN-2026-0891',
    candidateAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    candidateEmail: 'an.nguyen.dev@outlook.com',
    candidatePhone: '0912 345 678',
    jobTitle: 'Senior Frontend Developer (React, TypeScript)',
    departmentId: 'dept-it',
    departmentName: 'Khối Công nghệ thông tin & Sản phẩm (IT)',
    startDate: '2026-10-16',
    buddyName: 'Nguyễn Quang Huy',
    buddyRole: 'Senior Frontend Lead & Architect',
    buddyAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    managerName: 'Hoàng Hải Đăng',
    managerRole: 'Chief Technology Officer (CTO)',
    hrInCharge: 'Lê Thu Hương (HR Lead)',
    notes: 'Ứng viên xuất sắc vượt qua vòng phỏng vấn Hội đồng tuyển dụng. Cần ưu tiên bàn giao môi trường Micro-frontend.',
    createdAt: '2026-10-12T08:00:00Z',
    updatedAt: '2026-10-15T16:00:00Z',
    tasks: [
      {
        id: 'task-an-1',
        title: 'Cấp phát máy tính xách tay MacBook Pro M3 và phụ kiện kỹ thuật',
        description: 'Bàn giao máy tính xách tay cấu hình cao, màn hình rời 27-inch và phụ kiện theo quy chuẩn Senior Engineer.',
        phase: 'PRE_BOARDING',
        responsibleRole: 'IT_SUPPORT',
        assigneeName: 'Trần Tuấn Anh (IT Support Lead)',
        assigneeRole: 'IT Support Lead',
        deadline: '2026-10-15',
        status: 'COMPLETED',
        completedAt: '2026-10-15T10:30:00Z',
        completedBy: 'Trần Tuấn Anh',
        isRequired: true,
        category: 'Thiết bị & Công cụ',
        order: 1,
        attachments: [
          {
            id: 'att-1',
            fileName: 'Bien_ban_ban_giao_thiet_bi_MacBook_Pro.pdf',
            fileSize: '1.2 MB',
            fileType: 'PDF',
            url: '/files/equipment_handover.pdf',
            description: 'Biên bản bàn giao tài sản và trang thiết bị làm việc',
            uploadedAt: '2026-10-15T10:30:00Z',
          },
        ],
      },
      {
        id: 'task-an-2',
        title: 'Khởi tạo tài khoản Git, Jira, Slack, AWS Cloud & cấu hình VPN',
        description: 'Tạo tài khoản Google Workspace công ty, mời vào Workspace Slack, phân quyền GitLab repo và cấp file config OpenVPN.',
        phase: 'PRE_BOARDING',
        responsibleRole: 'IT_SUPPORT',
        assigneeName: 'Trần Tuấn Anh (IT Support Lead)',
        assigneeRole: 'IT Support Lead',
        deadline: '2026-10-15',
        status: 'COMPLETED',
        completedAt: '2026-10-15T14:15:00Z',
        completedBy: 'Trần Tuấn Anh',
        isRequired: true,
        category: 'Tài khoản & Phân quyền',
        actionUrl: 'https://gitlab.company.internal',
        order: 2,
      },
      {
        id: 'task-an-3',
        title: 'Gửi thư chào mừng và tài liệu Sổ tay nhân viên mới (Employee Handbook)',
        description: 'Gửi email tiếp đón chính thức, đính kèm tài liệu cẩm nang văn hóa, các câu hỏi thường gặp (FAQ) và bản đồ văn phòng.',
        phase: 'PRE_BOARDING',
        responsibleRole: 'HR',
        assigneeName: 'Lê Thu Hương (HR Lead)',
        assigneeRole: 'Head of HR',
        deadline: '2026-10-14',
        status: 'COMPLETED',
        completedAt: '2026-10-14T16:00:00Z',
        completedBy: 'Lê Thu Hương',
        isRequired: true,
        category: 'Tài liệu hướng dẫn',
        order: 3,
        attachments: [
          {
            id: 'att-2',
            fileName: 'So_tay_nhan_vien_Smart_Recruitment_2026.pdf',
            fileSize: '4.8 MB',
            fileType: 'PDF',
            url: '/files/employee_handbook_2026.pdf',
            description: 'Sổ tay hướng dẫn hội nhập toàn diện dành cho nhân sự mới',
            uploadedAt: '2026-10-14T15:00:00Z',
          },
          {
            id: 'att-3',
            fileName: 'So_do_to_chuc_va_noi_quy_lao_dong.pdf',
            fileSize: '2.1 MB',
            fileType: 'PDF',
            url: '/files/org_chart_rules.pdf',
            description: 'Sơ đồ tổ chức các phòng ban và quy chế làm việc',
            uploadedAt: '2026-10-14T15:00:00Z',
          },
        ],
      },
      {
        id: 'task-an-4',
        title: 'Ký kết hợp đồng lao động thử việc và cam kết bảo mật NDA',
        description: 'Ký văn bản HĐLĐ, nộp bản cứng hồ sơ nhân sự (CCCD, bằng cấp, ảnh 3x4) và cam kết sở hữu trí tuệ công nghệ.',
        phase: 'DAY_ONE',
        responsibleRole: 'HR',
        assigneeName: 'Lê Thu Hương (HR Lead)',
        assigneeRole: 'Head of HR',
        deadline: '2026-10-16',
        status: 'IN_PROGRESS',
        isRequired: true,
        category: 'Hồ sơ pháp lý',
        order: 4,
        attachments: [
          {
            id: 'att-4',
            fileName: 'Hop_dong_lao_dong_thu_viec_mau.docx',
            fileSize: '450 KB',
            fileType: 'DOC',
            url: '/files/probation_contract.docx',
            description: 'Mẫu hợp đồng lao động thử việc chuẩn hóa',
          },
        ],
      },
      {
        id: 'task-an-5',
        title: 'Bàn giao thẻ nhân viên có chip và chụp ảnh hồ sơ thẻ công ty',
        description: 'Cấp thẻ nhân viên NFC để mở khóa cửa ra vào, đăng ký dấu vân tay chấm công tại sảnh lễ tân tầng 12.',
        phase: 'DAY_ONE',
        responsibleRole: 'HR',
        assigneeName: 'Lê Thu Hương (HR Lead)',
        assigneeRole: 'Head of HR',
        deadline: '2026-10-16',
        status: 'NOT_STARTED',
        isRequired: false,
        category: 'Hậu cần tiếp đón',
        order: 5,
      },
      {
        id: 'task-an-6',
        title: 'Gặp gỡ Buddy kỹ thuật và Giới thiệu thành viên trong Squad Frontend',
        description: 'Gặp gỡ trực tiếp Nguyễn Quang Huy (Senior Lead), ăn trưa cùng team và tìm hiểu văn hóa code review, standup sáng.',
        phase: 'DAY_ONE',
        responsibleRole: 'DIRECT_MANAGER',
        assigneeName: 'Nguyễn Quang Huy (Buddy Lead)',
        assigneeRole: 'Senior Frontend Lead',
        deadline: '2026-10-16',
        status: 'NOT_STARTED',
        isRequired: true,
        category: 'Hội nhập đội ngũ',
        order: 6,
      },
      {
        id: 'task-an-7',
        title: 'Cài đặt môi trường lập trình local & chạy thử nghiệm Docker compose',
        description: 'Clone repo template micro-frontend, cấu hình Docker local và chạy thành công test suite.',
        phase: 'DAY_ONE',
        responsibleRole: 'DIRECT_MANAGER',
        assigneeName: 'Nguyễn Quang Huy (Buddy Lead)',
        assigneeRole: 'Senior Frontend Lead',
        deadline: '2026-10-14', // Đặt deadline quá hạn để hiển thị cảnh báo đỏ
        status: 'NOT_STARTED',
        isOverdue: true,
        isRequired: true,
        category: 'Kỹ thuật chuyên môn',
        order: 7,
      },
      {
        id: 'task-an-8',
        title: 'Hoàn thành khóa đào tạo An toàn thông tin và Bảo mật ISMS trực tuyến',
        description: 'Đăng nhập cổng E-learning công ty, hoàn thành khóa học 4 chương và đạt điểm số bài trắc nghiệm từ 80% trở lên.',
        phase: 'FIRST_WEEK',
        responsibleRole: 'NEW_HIRE',
        assigneeName: 'Nguyễn Văn An (Bản thân nhân sự)',
        deadline: '2026-10-21',
        status: 'NOT_STARTED',
        isRequired: true,
        category: 'Đào tạo nội bộ',
        actionUrl: 'https://elearning.company.internal/courses/isms-2026',
        order: 8,
      },
      {
        id: 'task-an-9',
        title: 'Thực hiện task Jira kỹ thuật đầu tay và tạo Pull Request đầu tiên',
        description: 'Chọn 1 task Good First Issue trên board Jira của Squad, tuân thủ conventional commit và hoàn thành code review.',
        phase: 'FIRST_WEEK',
        responsibleRole: 'NEW_HIRE',
        assigneeName: 'Nguyễn Văn An (Bản thân nhân sự)',
        deadline: '2026-10-23',
        status: 'NOT_STARTED',
        isRequired: true,
        category: 'Kỹ thuật chuyên môn',
        order: 9,
      },
      {
        id: 'task-an-10',
        title: 'Đánh giá sơ bộ thử việc tháng 1 và buổi trò chuyện phản hồi 1-1 với CTO',
        description: 'Đối chiếu mục tiêu 30 ngày đầu theo khung năng lực, chia sẻ cảm nhận hòa nhập và kế hoạch sprint tháng tiếp theo.',
        phase: 'FIRST_MONTH',
        responsibleRole: 'DIRECT_MANAGER',
        assigneeName: 'Hoàng Hải Đăng (CTO)',
        assigneeRole: 'Chief Technology Officer (CTO)',
        deadline: '2026-11-15',
        status: 'NOT_STARTED',
        isRequired: true,
        category: 'Đánh giá hiệu suất',
        order: 10,
      },
    ],
  },
  {
    id: 'ONB-2026-0892',
    candidateId: 'cand-002',
    candidateName: 'Trần Thị Bích',
    candidateCode: 'CAN-2026-0892',
    candidateAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    candidateEmail: 'bich.tran@company.com',
    candidatePhone: '0988 123 456',
    jobTitle: 'Content Marketing Specialist',
    departmentId: 'dept-marketing',
    departmentName: 'Khối Marketing & Truyền thông',
    startDate: '2026-10-18',
    managerName: 'Trần Văn Hoàng (Marketing Director)',
    hrInCharge: 'Lê Thu Hương (HR Lead)',
    createdAt: '2026-10-14T09:00:00Z',
    updatedAt: '2026-10-15T12:00:00Z',
    tasks: [
      {
        id: 'task-bich-1',
        title: 'Cấp phát máy tính xách tay và email tiếp thị số',
        description: 'Bàn giao laptop văn phòng có tích hợp sẵn các công cụ làm việc',
        phase: 'PRE_BOARDING',
        responsibleRole: 'IT_SUPPORT',
        assigneeName: 'Trần Tuấn Anh (IT Support)',
        deadline: '2026-10-17',
        status: 'COMPLETED',
        completedAt: '2026-10-15T11:00:00Z',
        isRequired: true,
        category: 'Thiết bị & Công cụ',
        order: 1,
      },
      {
        id: 'task-bich-2',
        title: 'Ký kết hợp đồng lao động thử việc',
        description: 'Ký hợp đồng tại văn phòng công ty',
        phase: 'DAY_ONE',
        responsibleRole: 'HR',
        assigneeName: 'Lê Thu Hương (HR Lead)',
        deadline: '2026-10-18',
        status: 'NOT_STARTED',
        isRequired: true,
        category: 'Hồ sơ pháp lý',
        order: 2,
      },
    ],
  },
];

let inMemoryCandidateRecords: CandidateOnboardingRecord[] = JSON.parse(
  JSON.stringify(MOCK_CANDIDATE_ONBOARDING_RECORDS)
);

export const onboardingTrackingService = {
  /**
   * Lấy toàn bộ danh sách hồ sơ onboarding của nhân sự mới
   */
  async listCandidateOnboardingRecords(): Promise<CandidateOnboardingRecord[]> {
    try {
      const response = await axiosClient.get<{ data?: CandidateOnboardingRecord[] }>(
        '/onboarding/candidate-records'
      );
      if (response.data?.data && Array.isArray(response.data.data)) {
        inMemoryCandidateRecords = response.data.data;
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            inMemoryCandidateRecords = parsed;
            return parsed;
          }
        }
      }
    } catch {
      // Ignore
    }

    return inMemoryCandidateRecords;
  },

  /**
   * Lấy chi tiết hồ sơ onboarding của 1 nhân sự theo candidateId hoặc recordId
   */
  async getCandidateOnboardingRecord(idOrCandidateId: string): Promise<CandidateOnboardingRecord> {
    try {
      const response = await axiosClient.get<{ data?: CandidateOnboardingRecord }>(
        `/onboarding/candidate-records/${encodeURIComponent(idOrCandidateId)}`
      );
      if (response.data?.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    const records = await this.listCandidateOnboardingRecords();
    const found = records.find(
      (r) => r.id === idOrCandidateId || r.candidateId === idOrCandidateId
    );

    if (found) {
      return JSON.parse(JSON.stringify(found));
    }

    return JSON.parse(JSON.stringify(records[0] || MOCK_CANDIDATE_ONBOARDING_RECORDS[0]));
  },

  /**
   * Chuyển đổi trạng thái nhiệm vụ (Toggle Complete / In Progress / Not Started) - AC 2
   */
  async toggleTaskStatus(
    onboardingId: string,
    taskId: string,
    targetStatus?: OnboardingTaskStatus,
    operatorName = 'Nguyễn Văn An'
  ): Promise<CandidateOnboardingRecord> {
    const current = await this.getCandidateOnboardingRecord(onboardingId);

    const taskIndex = current.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error(`Không tìm thấy nhiệm vụ ${taskId} trong hồ sơ onboarding ${onboardingId}`);
    }

    const task = current.tasks[taskIndex];
    let newStatus: OnboardingTaskStatus;

    if (targetStatus) {
      newStatus = targetStatus;
    } else {
      // Toggle logic mặc định: Nếu chưa xong -> COMPLETED, nếu đã xong -> NOT_STARTED
      newStatus = task.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
    }

    const updatedTask: OnboardingCandidateTask = {
      ...task,
      status: newStatus,
      completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
      completedBy: newStatus === 'COMPLETED' ? operatorName : undefined,
    };

    current.tasks[taskIndex] = updatedTask;
    current.updatedAt = new Date().toISOString();

    try {
      const response = await axiosClient.patch<{ data?: CandidateOnboardingRecord }>(
        `/onboarding/candidate-records/${encodeURIComponent(onboardingId)}/tasks/${encodeURIComponent(taskId)}`,
        { status: newStatus }
      );
      if (response.data?.data) {
        return response.data.data;
      }
    } catch {
      // Fallback lưu local
    }

    const idx = inMemoryCandidateRecords.findIndex((r) => r.id === onboardingId);
    if (idx >= 0) {
      inMemoryCandidateRecords[idx] = current;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryCandidateRecords));
        }
      } catch {
        // Ignore
      }
    }

    return current;
  },

  /**
   * Cập nhật chi tiết nhiệm vụ (Ghi chú, Tệp đính kèm...) - AC 3
   */
  async updateTaskDetails(
    onboardingId: string,
    taskId: string,
    updateData: Partial<OnboardingCandidateTask>
  ): Promise<CandidateOnboardingRecord> {
    const current = await this.getCandidateOnboardingRecord(onboardingId);
    const taskIndex = current.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error(`Không tìm thấy nhiệm vụ ${taskId}`);
    }

    current.tasks[taskIndex] = {
      ...current.tasks[taskIndex],
      ...updateData,
    };
    current.updatedAt = new Date().toISOString();

    try {
      await axiosClient.put(
        `/onboarding/candidate-records/${encodeURIComponent(onboardingId)}/tasks/${encodeURIComponent(taskId)}`,
        updateData
      );
    } catch {
      // Fallback local
    }

    const targetIdx = inMemoryCandidateRecords.findIndex((r) => r.id === onboardingId);
    if (targetIdx >= 0) {
      inMemoryCandidateRecords[targetIdx] = current;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryCandidateRecords));
        }
      } catch {
        // Ignore
      }
    }

    return current;
  },
};
