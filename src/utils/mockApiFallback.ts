import {
  mockDepartments,
  mockPositions,
  mockRequisitions,
  mockJobPostings,
  mockCandidates,
  mockFunnelReport,
  mockSourceReport,
  mockTimeCostReport,
  mockSlaSettings,
  mockOffers,
  mockOnboardingTracking,
  mockUsers,
} from './mockApiData';

/**
 * Trình điều phối dữ liệu mẫu dự phòng khi Backend chưa khởi động hoặc gặp Network Error.
 * Giúp người dùng kiểm thử toàn diện mọi giao diện, bảng dữ liệu, bộ lọc và biểu đồ.
 */
export function getMockApiResponse(url = '', method = 'get', _params?: unknown, _data?: unknown): unknown | null {
  const cleanUrl = url.toLowerCase().trim();
  const httpMethod = method.toLowerCase();

  // Để notificationService tự quản lý trạng thái thông báo qua localStorage
  if (cleanUrl.includes('/notifications')) {
    return null;
  }

  // Xử lý các thao tác ghi dữ liệu (POST, PUT, DELETE, PATCH)
  if (httpMethod !== 'get') {
    let parsedData: unknown = _data;
    if (typeof _data === 'string') {
      try {
        parsedData = JSON.parse(_data);
      } catch {}
    }
    if (parsedData && typeof parsedData === 'object') {
      const record = parsedData as Record<string, unknown>;
      return {
        ...record,
        id: (typeof record.id === 'string' ? record.id : `mock-${Date.now()}`),
      };
    }
    return {
      success: true,
      message: 'Thao tác dữ liệu mẫu thành công',
      id: `mock-${Date.now()}`,
    };
  }

  // 1. QUYỀN HẠN NGƯỜI DÙNG HIỆN TẠI (RBAC)
  if (cleanUrl.includes('/auth/permissions') || cleanUrl.includes('/users/me/permissions') || cleanUrl.includes('/permissions')) {
    return {
      permissions: [
        'REQUISITIONS_READ_ALL',
        'REQUISITIONS_READ_SCOPED',
        'JOB_POSTINGS_READ_ALL',
        'JOB_POSTINGS_READ_SCOPED',
        'CANDIDATES_READ_ALL',
        'CANDIDATES_READ_SCOPED',
        'INTERVIEWS_READ_ALL',
        'INTERVIEWS_READ_SCOPED',
        'ORGANIZATION_READ_ALL',
        'USER_ADMIN_READ_ALL',
        'SELF_PROFILE_READ',
        'SELF_SECURITY_WRITE',
      ],
    };
  }

  // 2. KHUNG NĂNG LỰC (COMPETENCY FRAMEWORKS)
  if (cleanUrl.includes('/competency-frameworks') || cleanUrl.includes('/frameworks')) {
    return {
      items: [
        { id: 'fw-01', code: 'DEV-FE', name: 'Khung năng lực Lập trình viên Frontend', description: 'Tiêu chuẩn đánh giá React, TypeScript, UI/UX', status: 'ACTIVE', criterionCount: 5 },
        { id: 'fw-02', code: 'DEV-BE', name: 'Khung năng lực Lập trình viên Backend', description: 'Tiêu chuẩn đánh giá Java, Spring Boot, Microservices', status: 'ACTIVE', criterionCount: 6 },
        { id: 'fw-03', code: 'HR-CORE', name: 'Khung năng lực Chuyên viên Tuyển dụng', description: 'Tiêu chuẩn đánh giá kỹ năng phỏng vấn, tuyển chọn và đàm phán', status: 'ACTIVE', criterionCount: 4 },
      ],
      totalElements: 3,
      totalPages: 1,
      page: 0,
      size: 100,
    };
  }

  // 3. YÊU CẦU TUYỂN DỤNG (REQUISITIONS)
  if (cleanUrl.includes('/requisitions') || cleanUrl.includes('/jobs')) {
    return {
      items: mockRequisitions,
      total: mockRequisitions.length,
      totalElements: mockRequisitions.length,
      totalPages: 1,
      page: 0,
      size: 100,
    };
  }

  // 4. TIN TUYỂN DỤNG (JOB POSTINGS)
  if (cleanUrl.includes('/job-postings') || cleanUrl.includes('/public-jobs')) {
    return {
      items: mockJobPostings,
      total: mockJobPostings.length,
      totalElements: mockJobPostings.length,
      totalPages: 1,
      page: 0,
      size: 100,
    };
  }

  // 5. HỒ SƠ ỨNG VIÊN (CANDIDATES)
  if (cleanUrl.includes('/candidates/')) {
    return null;
  }
  if (cleanUrl.endsWith('/candidates') || cleanUrl.includes('/candidates?') || cleanUrl.includes('/recruitment/candidates')) {
    return {
      items: mockCandidates,
      total: mockCandidates.length,
      totalElements: mockCandidates.length,
      totalPages: 1,
      page: 0,
      size: 100,
    };
  }

  // 6. PHỄU TUYỂN DỤNG (RECRUITMENT FUNNEL)
  if (cleanUrl.includes('/recruitment-funnel') || cleanUrl.includes('/funnel')) {
    return mockFunnelReport;
  }

  // 7. BÁO CÁO NGUỒN ỨNG VIÊN (SOURCES)
  if (cleanUrl.includes('/sources') || cleanUrl.includes('/reports/sources')) {
    return mockSourceReport;
  }

  // 8. BÁO CÁO THỜI GIAN & CHI PHÍ (TIME & COST)
  if (cleanUrl.includes('/time-cost') || cleanUrl.includes('/reports/time-cost')) {
    return mockTimeCostReport;
  }

  // 9. CẤU HÌNH SLA
  if (cleanUrl.includes('/sla')) {
    return mockSlaSettings;
  }

  // 10. PHÒNG BAN (DEPARTMENTS)
  if (cleanUrl.includes('/departments')) {
    return {
      items: mockDepartments,
      total: mockDepartments.length,
      totalElements: mockDepartments.length,
      totalPages: 1,
      page: 0,
      size: 100,
    };
  }

  // 11. CHỨC DANH CÔNG VIỆC (POSITIONS)
  if (cleanUrl.includes('/positions')) {
    return {
      items: mockPositions,
      total: mockPositions.length,
      totalElements: mockPositions.length,
      totalPages: 1,
      page: 0,
      size: 100,
    };
  }

  // 12. ĐỀ NGHỊ TUYỂN DỤNG (OFFERS)
  if (cleanUrl.includes('/offers')) {
    return {
      items: mockOffers,
      total: mockOffers.length,
      totalElements: mockOffers.length,
      totalPages: 1,
      page: 0,
      size: 100,
    };
  }

  // 13. TIẾP NHẬN NHÂN SỰ MỚI (ONBOARDING)
  if (cleanUrl.includes('/onboarding')) {
    return {
      items: mockOnboardingTracking,
      total: mockOnboardingTracking.length,
      totalElements: mockOnboardingTracking.length,
      totalPages: 1,
      page: 0,
      size: 100,
    };
  }

  // 14. TÀI KHOẢN NGƯỜI DÙNG (USERS)
  if (cleanUrl.includes('/users')) {
    return {
      items: mockUsers,
      total: mockUsers.length,
      totalElements: mockUsers.length,
      totalPages: 1,
      page: 0,
      size: 100,
    };
  }

  // 15. NGÂN HÀNG CÂU HỎI PHỎNG VẤN
  if (cleanUrl.includes('/questions') || cleanUrl.includes('/interview-questions')) {
    return {
      items: [
        { id: 'q-01', content: 'Hãy giải thích cơ chế Virtual DOM và Reconciliation trong React.', difficulty: 'HARD', category: 'Frontend', active: true },
        { id: 'q-02', content: 'Làm thế nào để xử lý Race Condition trong Spring Boot Microservices?', difficulty: 'HARD', category: 'Backend', active: true },
        { id: 'q-03', content: 'Bạn giải quyết mâu thuẫn giữa Product Owner và Dev Team như thế nào?', difficulty: 'MEDIUM', category: 'Kỹ năng mềm', active: true },
      ],
      totalElements: 3,
      totalPages: 1,
      page: 0,
      size: 100,
    };
  }

  // 16. GIỚI THIỆU ỨNG VIÊN NỘI BỘ (REFERRALS)
  if (cleanUrl.includes('/referrals')) {
    return {
      items: [
        { id: 'ref-01', candidateName: 'Lê Hoàng Long', positionTitle: 'Java Backend Specialist', referrerName: 'Quản Trị Viên', bonusAmount: 5000000, status: 'HIRED', createdAt: '2026-10-16' },
        { id: 'ref-02', candidateName: 'Phạm Minh Tuấn', positionTitle: 'DevOps Specialist', referrerName: 'Trần Quốc Tuấn', bonusAmount: 5000000, status: 'INTERVIEWING', createdAt: '2026-10-19' },
      ],
      totalElements: 2,
      totalPages: 1,
      page: 0,
      size: 100,
    };
  }

  // 17. LỊCH PHỎNG VẤN (INTERVIEWS)
  if (cleanUrl.includes('/interviews')) {
    return {
      items: [
        { id: 'int-01', candidateName: 'Nguyễn Văn Hùng', candidateId: 'cand-01', round: 'Vòng 2: Phỏng vấn Kỹ thuật Chuyên sâu', date: '2026-10-24', time: '09:30 - 11:00', room: 'Phòng Họp Ban Công Nghệ (P.402)', interviewerNames: ['Trần Quốc Tuấn', 'Nguyễn Văn Hùng'], status: 'SCHEDULED' },
        { id: 'int-02', candidateName: 'Phạm Minh Tuấn', candidateId: 'cand-04', round: 'Vòng 1: Phỏng vấn Văn hóa & Định hướng', date: '2026-10-25', time: '14:00 - 15:00', room: 'Google Meet Online', interviewerNames: ['Nguyễn Phương Anh'], status: 'SCHEDULED' },
      ],
      totalElements: 2,
      totalPages: 1,
      page: 0,
      size: 100,
    };
  }

  return null;
}
