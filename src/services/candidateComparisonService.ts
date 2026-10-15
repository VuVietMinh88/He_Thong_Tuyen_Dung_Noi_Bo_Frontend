/**
 * Service quản lý dữ liệu So sánh ứng viên vòng cuối
 * Jira Task: TKNHTTDNB1-470 & TKNHTTDNB1-471 / User Story S7-01
 */

import axiosClient from '../utils/axiosClient';
import type {
  ComparisonCandidate,
  HiringDecisionStatus,
  CandidateEvaluationFilterStatus,
} from '../types/candidateComparison';

const STORAGE_KEY_COMPARISON_CANDIDATES = 'smart_recruit_final_round_comparison_candidates';

export const DEFAULT_FINAL_ROUND_CANDIDATES: ComparisonCandidate[] = [
  {
    id: 'cand-final-001',
    candidateCode: 'CAN-2026-0891',
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen.dev@outlook.com',
    phone: '0988123456',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    currentTitle: 'Senior Frontend Engineer',
    currentCompany: 'FPT Software',
    experienceYears: 6,
    educationLevel: 'Thạc sĩ Khoa học Máy tính - ĐH Bách Khoa',
    appliedJobId: 'jp-demo-306',
    appliedJobTitle: 'Senior Frontend Developer (React, TypeScript & Tailwind CSS)',
    matchingScore: 94,
    rating: 5,
    interviewRound: 'Vòng 3 - Phỏng vấn Hội đồng & Ban Lãnh Đạo',
    competencyScores: {
      technical: 4.8,
      attitude: 4.6,
      language: 4.7,
      cultureFit: 4.5,
      softSkills: 4.7,
      overall: 4.66,
    },
    interviewerFeedbacks: [
      {
        interviewerId: 'inv-01',
        interviewerName: 'Trần Minh Quang',
        interviewerRole: 'Lead Technical Architect',
        conclusion: 'RECOMMENDED',
        score: 4.8,
        comment:
          'Nắm rất sâu về React performance, Virtual DOM, Micro-frontends và kiến trúc State management. Tư duy giải quyết vấn đề hệ thống xuất sắc.',
        strengths: ['Kiến trúc frontend quy mô lớn', 'Tối ưu Core Web Vitals', 'Code clean, module hóa cao'],
        concerns: ['Cần chú ý thêm về testing tự động E2E với Playwright'],
      },
      {
        interviewerId: 'inv-02',
        interviewerName: 'Lê Thu Hương',
        interviewerRole: 'Head of HR & Talent Acquisition',
        conclusion: 'RECOMMENDED',
        score: 4.6,
        comment:
          'Giao tiếp tự tin, phong thái chuyên nghiệp, tiếng Anh lưu loát. Đặt nhiều câu hỏi giá trị về văn hóa công ty và định hướng sản phẩm.',
        strengths: ['Kỹ năng giao tiếp và thuyết trình', 'Tiếng Anh chuyên nghiệp (IELTS 7.5)', 'Tư duy làm chủ công việc'],
        concerns: ['Mức lương kỳ vọng khá sát trần ngân sách'],
      },
      {
        interviewerId: 'inv-03',
        interviewerName: 'Hoàng Hải Đăng',
        interviewerRole: 'Chief Technology Officer (CTO)',
        conclusion: 'RECOMMENDED',
        score: 4.6,
        comment:
          'Tư duy làm chủ công việc tốt, hiểu chiến lược phát triển sản phẩm công nghệ dài hạn.',
        strengths: ['Tư duy chiến lược công nghệ', 'Tinh thần cầu tiến'],
        concerns: [],
      },
    ],
    summaryStrengths: [
      'Chuyên môn React/TS đỉnh cao (4.8/5)',
      'Tiếng Anh giao tiếp và làm việc xuất sắc',
      'Có kinh nghiệm Lead đội ngũ 5+ thành viên',
    ],
    summaryConcerns: ['Cần đàm phán mức lương kỳ vọng để khớp khung ngân sách'],
    compensation: {
      expectedSalary: 38000000,
      expectedSalaryFormatted: '38.000.000 ₫',
      currentSalary: 32000000,
      currentSalaryFormatted: '32.000.000 ₫',
      salaryNegotiable: true,
      noticePeriodDays: 30,
      availabilityText: 'Sau 30 ngày (Bàn giao tại công ty cũ)',
      workModePreference: 'HYBRID',
      benefitsRequested: ['Chế độ thưởng KPI quý', 'Bảo hiểm sức khỏe quốc tế'],
    },
    hiringDecision: {
      status: 'PENDING',
    },
    evaluationProgress: {
      completedCount: 3,
      requiredCount: 3,
      isFullyEvaluated: true,
      pendingInterviewerNames: [],
    },
  },
  {
    id: 'cand-final-002',
    candidateCode: 'CAN-2026-0922',
    fullName: 'Trần Thị Bích',
    email: 'bich.tran@techcorp.vn',
    phone: '0988776655',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    currentTitle: 'Frontend Team Lead',
    currentCompany: 'VNG Corporation',
    experienceYears: 5,
    educationLevel: 'Cử nhân CNTT - ĐH Công Nghệ ĐHQGHN',
    appliedJobId: 'jp-demo-306',
    appliedJobTitle: 'Senior Frontend Developer (React, TypeScript & Tailwind CSS)',
    matchingScore: 92,
    rating: 5,
    interviewRound: 'Vòng 3 - Phỏng vấn Hội đồng & Ban Lãnh Đạo',
    competencyScores: {
      technical: 4.5,
      attitude: 4.9,
      language: 4.3,
      cultureFit: 4.9,
      softSkills: 4.8,
      overall: 4.68,
    },
    interviewerFeedbacks: [
      {
        interviewerId: 'inv-01',
        interviewerName: 'Trần Minh Quang',
        interviewerRole: 'Lead Technical Architect',
        conclusion: 'RECOMMENDED',
        score: 4.5,
        comment:
          'Kỹ năng lập trình React vững vàng, hiểu sâu về Tailwind CSS và Design Tokens. Có kinh nghiệm xây dựng Design System dùng chung cho nhiều dự án.',
        strengths: ['Xây dựng Design System quy chuẩn', 'Kinh nghiệm mentorship thành viên mới'],
        concerns: ['Chưa tiếp xúc nhiều với SSR Next.js App Router'],
      },
      {
        interviewerId: 'inv-02',
        interviewerName: 'Lê Thu Hương',
        interviewerRole: 'Head of HR & Talent Acquisition',
        conclusion: 'RECOMMENDED',
        score: 4.7,
        comment:
          'Khả năng gắn kết nhân sự và truyền cảm hứng tốt, lắng nghe phản hồi tích cực.',
        strengths: ['Thấu hiểu văn hóa', 'Truyền năng lượng tích cực'],
        concerns: [],
      },
      {
        interviewerId: 'inv-03',
        interviewerName: 'Hoàng Hải Đăng',
        interviewerRole: 'Chief Technology Officer (CTO)',
        conclusion: 'RECOMMENDED',
        score: 4.9,
        comment:
          'Thái độ học hỏi cực kỳ cầu thị, tinh thần gắn kết tập thể và độ phù hợp văn hóa gần như tuyệt đối (4.9/5). Rất tiềm năng trở thành key member.',
        strengths: ['Văn hóa phù hợp vượt trội', 'Thái độ trách nhiệm và cầu thị', 'Sẵn sàng onboard ngay'],
        concerns: ['Cần bổ sung một số chứng chỉ cloud trong năm đầu'],
      },
    ],
    summaryStrengths: [
      'Điểm Thái độ và Độ phù hợp văn hóa cao nhất (4.9/5)',
      'Sẵn sàng nhận việc ngay lập tức không cần chờ',
      'Mức lương kỳ vọng rất hợp lý (35.000.000 ₫)',
    ],
    summaryConcerns: ['Kinh nghiệm với SSR Next.js ở mức cơ bản'],
    compensation: {
      expectedSalary: 35000000,
      expectedSalaryFormatted: '35.000.000 ₫',
      currentSalary: 30000000,
      currentSalaryFormatted: '30.000.000 ₫',
      salaryNegotiable: true,
      noticePeriodDays: 0,
      availabilityText: 'Sẵn sàng nhận việc ngay lập tức',
      workModePreference: 'HYBRID',
      benefitsRequested: ['Đào tạo nâng cao chứng chỉ'],
    },
    hiringDecision: {
      status: 'PENDING',
    },
    evaluationProgress: {
      completedCount: 3,
      requiredCount: 3,
      isFullyEvaluated: true,
      pendingInterviewerNames: [],
    },
  },
  {
    id: 'cand-final-003',
    candidateCode: 'CAN-2026-0745',
    fullName: 'Lê Hoàng Nam',
    email: 'nam.le.tech@gmail.com',
    phone: '0933221100',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    currentTitle: 'Senior Frontend Developer',
    currentCompany: 'Tiki Vietnam',
    experienceYears: 7,
    educationLevel: 'Kỹ sư Phần mềm - ĐH Bách Khoa TP.HCM',
    appliedJobId: 'jp-demo-306',
    appliedJobTitle: 'Senior Frontend Developer (React, TypeScript & Tailwind CSS)',
    matchingScore: 89,
    rating: 4,
    interviewRound: 'Vòng 3 - Phỏng vấn Hội đồng & Ban Lãnh Đạo',
    competencyScores: {
      technical: 4.6,
      attitude: 4.3,
      language: 4.8,
      cultureFit: 4.2,
      softSkills: 4.4,
      overall: 4.46,
    },
    interviewerFeedbacks: [
      {
        interviewerId: 'inv-01',
        interviewerName: 'Trần Minh Quang',
        interviewerRole: 'Lead Technical Architect',
        conclusion: 'RECOMMENDED',
        score: 4.6,
        comment:
          'Kinh nghiệm 7 năm dồi dào, xử lý mượt mà các bài toán về WebSockets, Real-time Dashboard và đồ thị trực quan hóa dữ liệu.',
        strengths: ['Xử lý real-time data & charts', 'Kinh nghiệm 7 năm thực chiến'],
        concerns: ['Phong cách làm việc thích độc lập hơn là phối hợp nhóm'],
      },
      {
        interviewerId: 'inv-02',
        interviewerName: 'Lê Thu Hương',
        interviewerRole: 'Head of HR & Talent Acquisition',
        conclusion: 'CONSIDER',
        score: 4.3,
        comment:
          'Ứng viên chuyên môn tốt nhưng mức lương kỳ vọng 42 triệu khá cao, thời gian gắn bó ở các công ty cũ tương đối ngắn (khoảng 1.5 năm/công ty).',
        strengths: ['Ngoại ngữ tiếng Anh tốt', 'Kinh nghiệm e-commerce quy mô lớn'],
        concerns: ['Mức lương kỳ vọng cao (42 triệu)', 'Lịch sử nhảy việc thường xuyên'],
      },
    ],
    summaryStrengths: [
      'Tổng năm kinh nghiệm cao nhất (7 năm)',
      'Ngoại ngữ tiếng Anh lưu loát (4.8/5)',
      'Chuyên môn vững về data visualization',
    ],
    summaryConcerns: ['Lương kỳ vọng vượt khung ngân sách', 'Chỉ số phù hợp văn hóa ở mức trung bình (4.2/5)'],
    compensation: {
      expectedSalary: 42000000,
      expectedSalaryFormatted: '42.000.000 ₫',
      currentSalary: 37000000,
      currentSalaryFormatted: '37.000.000 ₫',
      salaryNegotiable: false,
      noticePeriodDays: 15,
      availabilityText: 'Sau 15 ngày làm việc',
      workModePreference: 'REMOTE',
      benefitsRequested: ['Chế độ làm việc từ xa hoàn toàn'],
    },
    hiringDecision: {
      status: 'PENDING',
    },
    evaluationProgress: {
      completedCount: 2,
      requiredCount: 3,
      isFullyEvaluated: false,
      pendingInterviewerNames: ['Hoàng Hải Đăng (CTO)'],
    },
  },
  {
    id: 'cand-final-004',
    candidateCode: 'CAN-2026-0610',
    fullName: 'Phạm Minh Đức',
    email: 'duc.pham@fintech.io',
    phone: '0912998877',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    currentTitle: 'Frontend Engineer',
    currentCompany: 'MoMo E-Wallet',
    experienceYears: 4,
    educationLevel: 'Cử nhân CNTT - Học viện Bưu chính Viễn thông',
    appliedJobId: 'jp-demo-306',
    appliedJobTitle: 'Senior Frontend Developer (React, TypeScript & Tailwind CSS)',
    matchingScore: 86,
    rating: 4,
    interviewRound: 'Vòng 3 - Phỏng vấn Hội đồng & Ban Lãnh Đạo',
    competencyScores: {
      technical: 4.3,
      attitude: 4.7,
      language: 4.1,
      cultureFit: 4.6,
      softSkills: 4.4,
      overall: 4.42,
    },
    interviewerFeedbacks: [
      {
        interviewerId: 'inv-01',
        interviewerName: 'Trần Minh Quang',
        interviewerRole: 'Lead Technical Architect',
        conclusion: 'RECOMMENDED',
        score: 4.3,
        comment:
          'Nắm chắc nền tảng Javascript/Typescript, tư duy giải thuật tốt, chủ động đề xuất giải pháp khi gặp bài toán khó.',
        strengths: ['Tư duy thuật toán tốt', 'Thái độ tích cực'],
        concerns: ['Số năm kinh nghiệm (4 năm) còn hơi trẻ so với tiêu chuẩn Senior Lead'],
      },
    ],
    summaryStrengths: [
      'Mức lương kỳ vọng tiết kiệm nhất (30.000.000 ₫)',
      'Thái độ trách nhiệm và nhiệt huyết cao (4.7/5)',
      'Sẵn sàng nhận việc ngay',
    ],
    summaryConcerns: ['Kinh nghiệm thực chiến 4 năm còn hơi non so với vị trí Senior'],
    compensation: {
      expectedSalary: 30000000,
      expectedSalaryFormatted: '30.000.000 ₫',
      currentSalary: 25000000,
      currentSalaryFormatted: '25.000.000 ₫',
      salaryNegotiable: true,
      noticePeriodDays: 0,
      availabilityText: 'Sẵn sàng nhận việc ngay',
      workModePreference: 'HYBRID',
      benefitsRequested: ['Được tham gia các khóa học chuyên sâu'],
    },
    hiringDecision: {
      status: 'PENDING',
    },
    evaluationProgress: {
      completedCount: 1,
      requiredCount: 3,
      isFullyEvaluated: false,
      pendingInterviewerNames: ['Lê Thu Hương (Head of HR)', 'Hoàng Hải Đăng (CTO)'],
    },
  },
  {
    id: 'cand-final-005',
    candidateCode: 'CAN-2026-0518',
    fullName: 'Vũ Hoàng Yến',
    email: 'yen.vu@shopee.vn',
    phone: '0909334455',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    currentTitle: 'Senior UI/UX & Frontend Engineer',
    currentCompany: 'Shopee Vietnam',
    experienceYears: 5,
    educationLevel: 'Kỹ sư CNTT - ĐH Quốc Tế ĐHQG TP.HCM',
    appliedJobId: 'jp-demo-306',
    appliedJobTitle: 'Senior Frontend Developer (React, TypeScript & Tailwind CSS)',
    matchingScore: 91,
    rating: 5,
    interviewRound: 'Vòng 3 - Phỏng vấn Hội đồng & Ban Lãnh Đạo',
    competencyScores: {
      technical: 4.6,
      attitude: 4.8,
      language: 4.6,
      cultureFit: 4.7,
      softSkills: 4.6,
      overall: 4.66,
    },
    interviewerFeedbacks: [
      {
        interviewerId: 'inv-01',
        interviewerName: 'Trần Minh Quang',
        interviewerRole: 'Lead Technical Architect',
        conclusion: 'RECOMMENDED',
        score: 4.6,
        comment: 'Thế mạnh lớn về UI/UX animation, CSS hiện đại và khả năng tối ưu trải nghiệm người dùng.',
        strengths: ['UI/UX chuẩn mực', 'CSS animations mượt mà'],
        concerns: [],
      },
      {
        interviewerId: 'inv-02',
        interviewerName: 'Lê Thu Hương',
        interviewerRole: 'Head of HR & Talent Acquisition',
        conclusion: 'RECOMMENDED',
        score: 4.7,
        comment: 'Tính cách cởi mở, kỹ năng thuyết trình xuất sắc và giao tiếp tự tin.',
        strengths: ['Kỹ năng mềm', 'Tiếng Anh tốt'],
        concerns: [],
      },
      {
        interviewerId: 'inv-03',
        interviewerName: 'Hoàng Hải Đăng',
        interviewerRole: 'Chief Technology Officer (CTO)',
        conclusion: 'RECOMMENDED',
        score: 4.7,
        comment: 'Đã hoàn thành xuất sắc bài phỏng vấn tình huống kiến trúc và giải quyết xung đột.',
        strengths: ['Xử lý tình huống tốt'],
        concerns: [],
      },
    ],
    summaryStrengths: [
      'Đã hoàn thành đầy đủ 3/3 phiếu đánh giá',
      'Chuyên môn UI/UX & Tailwind CSS xuất sắc',
      'Ngoại ngữ tiếng Anh tốt',
    ],
    summaryConcerns: [],
    compensation: {
      expectedSalary: 36000000,
      expectedSalaryFormatted: '36.000.000 ₫',
      currentSalary: 31000000,
      currentSalaryFormatted: '31.000.000 ₫',
      salaryNegotiable: true,
      noticePeriodDays: 30,
      availabilityText: 'Sau 30 ngày',
      workModePreference: 'HYBRID',
      benefitsRequested: ['Chế độ chăm sóc sức khỏe gia đình'],
    },
    hiringDecision: {
      status: 'PENDING',
    },
    evaluationProgress: {
      completedCount: 3,
      requiredCount: 3,
      isFullyEvaluated: true,
      pendingInterviewerNames: [],
    },
  },
];

export const candidateComparisonService = {
  getStoredCandidates(): ComparisonCandidate[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COMPARISON_CANDIDATES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Bỏ qua lỗi đọc localStorage nếu có
    }
    return DEFAULT_FINAL_ROUND_CANDIDATES;
  },

  saveCandidates(candidates: ComparisonCandidate[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_COMPARISON_CANDIDATES, JSON.stringify(candidates));
    } catch {
      // Bỏ qua lỗi ghi localStorage
    }
  },

  /**
   * Gọi API lấy danh sách ứng viên vòng cuối kèm dữ liệu trạng thái phiếu phỏng vấn (AC 3)
   */
  async getFinalCandidatesWithEvaluations(
    jobId?: string,
    status: CandidateEvaluationFilterStatus = 'ALL'
  ): Promise<ComparisonCandidate[]> {
    try {
      const response = await axiosClient.get<ComparisonCandidate[]>(
        '/recruitment/candidates/final-round-comparison',
        { params: { jobId: jobId || undefined, evaluationStatus: status } }
      );
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch {
      // Fallback về dữ liệu mock/localStorage
    }

    let candidates = this.getStoredCandidates();

    if (jobId) {
      candidates = candidates.filter((c) => c.appliedJobId === jobId);
    }

    if (status === 'COMPLETED') {
      candidates = candidates.filter((c) => c.evaluationProgress?.isFullyEvaluated === true);
    } else if (status === 'PENDING') {
      candidates = candidates.filter((c) => c.evaluationProgress?.isFullyEvaluated === false);
    }

    return candidates;
  },

  async getFinalRoundCandidates(jobId?: string): Promise<ComparisonCandidate[]> {
    return this.getFinalCandidatesWithEvaluations(jobId, 'ALL');
  },

  async updateHiringDecision(
    candidateId: string,
    status: HiringDecisionStatus,
    note?: string
  ): Promise<ComparisonCandidate> {
    try {
      const response = await axiosClient.post<ComparisonCandidate>(
        `/recruitment/candidates/${encodeURIComponent(candidateId)}/hiring-decision`,
        { status, note }
      );
      if (response.data) {
        return response.data;
      }
    } catch {
      // Fallback cập nhật local
    }

    const candidates = this.getStoredCandidates();
    const targetIndex = candidates.findIndex((c) => c.id === candidateId);
    if (targetIndex === -1) {
      throw new Error('Không tìm thấy thông tin ứng viên để cập nhật quyết định.');
    }

    const updatedCandidate: ComparisonCandidate = {
      ...candidates[targetIndex],
      hiringDecision: {
        status,
        decidedAt: new Date().toISOString(),
        decidedBy: 'Hội đồng Tuyển dụng',
        note,
      },
    };

    candidates[targetIndex] = updatedCandidate;
    this.saveCandidates(candidates);
    return updatedCandidate;
  },
};
