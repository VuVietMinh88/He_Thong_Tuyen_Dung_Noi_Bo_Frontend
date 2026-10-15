/**
 * Service quản lý dữ liệu Tổng hợp đánh giá ứng viên để quyết định tuyển dụng
 * Jira Task: TKNHTTDNB1-485 / User Story S7-02
 */

import axiosClient from '../utils/axiosClient';
import type {
  CandidateEvaluationSummaryData,
  FinalHiringDecisionRecord,
} from '../types/candidateEvaluationSummary';
import { calculateConsensusSummary, evaluateCompetencyGap } from '../utils/candidateEvaluationSummaryHelper';

const STORAGE_KEY_PREFIX = 'smart_recruit_candidate_eval_summary_';

export const MOCK_EVALUATION_SUMMARY_DATA: CandidateEvaluationSummaryData = {
  id: 'cand-final-001',
  candidateCode: 'CAN-2026-0891',
  fullName: 'Nguyễn Văn An',
  email: 'an.nguyen.dev@outlook.com',
  phone: '0988123456',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  currentTitle: 'Senior Frontend Engineer',
  currentCompany: 'FPT Software',
  experienceYears: 6,
  educationLevel: 'Thạc sĩ Khoa học Máy tính - ĐH Bách Khoa Hà Nội',
  appliedJobId: 'jp-demo-306',
  appliedJobTitle: 'Senior Frontend Developer (React, TypeScript & Tailwind CSS)',
  departmentName: 'Phòng Phát triển Sản phẩm & Công nghệ',
  appliedAt: '2026-09-15T08:30:00Z',
  overallScore: 4.68,
  overallPercentage: 93.6,
  targetBenchmarkAverage: 4.2,
  consensus: {
    totalInterviewers: 3,
    strongHireCount: 2,
    hireCount: 1,
    considerCount: 0,
    doNotHireCount: 0,
    positiveCount: 3,
    consensusPercentage: 100,
    consensusLevel: 'UNANIMOUS',
    consensusHeadline: '3/3 Hội đồng đồng thuận tuyệt đối (Tuyển dụng)',
    consensusNote: 'Cả 3 thành viên Hội đồng phỏng vấn đều đánh giá cao và khuyến nghị tuyển dụng ứng viên vào vị trí Senior Lead.',
  },
  competencyBenchmarks: [
    {
      id: 'comp-1',
      name: 'Chuyên môn kỹ thuật (React & TypeScript)',
      score: 4.8,
      targetScore: 4.2,
      weight: 30,
      gap: 0.6,
      gapStatus: 'EXCEEDS',
      description: 'Nắm sâu về React Performance, Virtual DOM, Micro-frontends và kiến trúc State management quy mô lớn.',
    },
    {
      id: 'comp-2',
      name: 'Giải quyết vấn đề & Thuật toán',
      score: 4.8,
      targetScore: 4.3,
      weight: 20,
      gap: 0.5,
      gapStatus: 'EXCEEDS',
      description: 'Tư duy logic giải thuật sắc bén, đề xuất giải pháp tối ưu hóa bộ nhớ và tốc độ tải trang.',
    },
    {
      id: 'comp-3',
      name: 'Thái độ & Tinh thần trách nhiệm',
      score: 4.6,
      targetScore: 4.0,
      weight: 15,
      gap: 0.6,
      gapStatus: 'EXCEEDS',
      description: 'Tinh thần làm chủ công việc cao, cởi mở tiếp thu phản hồi và chủ động học hỏi công nghệ mới.',
    },
    {
      id: 'comp-4',
      name: 'Ngoại ngữ (Tiếng Anh chuyên môn)',
      score: 4.7,
      targetScore: 4.0,
      weight: 15,
      gap: 0.7,
      gapStatus: 'EXCEEDS',
      description: 'IELTS 7.5, giao tiếp và thuyết trình kỹ thuật lưu loát với đối tác quốc tế.',
    },
    {
      id: 'comp-5',
      name: 'Phù hợp văn hóa & Gắn kết',
      score: 4.5,
      targetScore: 4.5,
      weight: 10,
      gap: 0.0,
      gapStatus: 'MEETS',
      description: 'Chia sẻ các giá trị cốt lõi về đổi mới sáng tạo, minh bạch và tinh thần phụng sự khách hàng.',
    },
    {
      id: 'comp-6',
      name: 'Kỹ năng mềm & Phối hợp nhóm',
      score: 4.7,
      targetScore: 4.2,
      weight: 10,
      gap: 0.5,
      gapStatus: 'EXCEEDS',
      description: 'Kinh nghiệm dẫn dắt đội ngũ 5+ lập trình viên, giải quyết xung đột nhóm hiệu quả.',
    },
  ],
  evaluationRounds: [
    {
      roundId: 'round-1',
      roundOrder: 1,
      roundType: 'SCREENING',
      roundName: 'Vòng 1: Lọc hồ sơ sơ bộ & Đánh giá CV',
      roundDate: '18/09/2026',
      format: 'ONLINE',
      averageScore: 4.7,
      roundSummary: 'Hồ sơ nổi bật, thông tin kinh nghiệm 6 năm tại các tập đoàn công nghệ lớn, kỹ năng khớp 94% bản mô tả công việc.',
      interviewers: [
        {
          interviewerId: 'inv-hr-01',
          interviewerName: 'Lê Thu Hương',
          interviewerRole: 'Head of HR & Talent Acquisition',
          interviewerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
          overallScore: 4.7,
          recommendation: 'STRONG_HIRE',
          comment: 'Ứng viên có quá trình thăng tiến rõ ràng, CV chuyên nghiệp, giải trình chi tiết các dự án quy mô lớn đã từng triển khai.',
          strengths: ['Hồ sơ chuẩn chỉ', 'Học vấn Thạc sĩ CNTT ĐH Bách Khoa', 'Tiếng Anh xuất sắc (IELTS 7.5)'],
          concerns: ['Mức lương kỳ vọng khá sát trần ngân sách'],
          submittedAt: '2026-09-18T16:00:00Z',
        },
      ],
    },
    {
      roundId: 'round-2',
      roundOrder: 2,
      roundType: 'TECHNICAL',
      roundName: 'Vòng 2: Phỏng vấn Chuyên môn & Kiến trúc Kỹ thuật',
      roundDate: '24/09/2026',
      format: 'OFFLINE',
      locationOrLink: 'Phòng họp Hội đồng Tầng 8 - Tòa nhà Tech Innovation',
      averageScore: 4.8,
      roundSummary: 'Vượt qua bài test live-coding và thiết kế kiến trúc Frontend xuất sắc. Tư duy tối ưu hóa hiệu năng chuyên sâu.',
      interviewers: [
        {
          interviewerId: 'inv-tech-01',
          interviewerName: 'Trần Minh Quang',
          interviewerRole: 'Lead Technical Architect',
          interviewerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          overallScore: 4.8,
          recommendation: 'STRONG_HIRE',
          comment: 'Ứng viên nắm rất vững React internals, Virtual DOM, Micro-frontends và cơ chế quản lý state. Trả lời mạch lạc, tự tin bài toán xử lý 100.000 bản ghi real-time trên Dashboard.',
          strengths: ['Kiến trúc Frontend quy mô lớn', 'Tối ưu Core Web Vitals', 'Tư duy clean code và module hóa'],
          concerns: ['Cần bổ sung thêm kỹ năng viết kiểm thử tự động E2E với Playwright'],
          submittedAt: '2026-09-24T11:30:00Z',
          criterionScores: [
            { criterionId: 'c1', criterionName: 'React & Ecosystem', score: 5.0 },
            { criterionId: 'c2', criterionName: 'TypeScript & Type Safety', score: 4.8 },
            { criterionId: 'c3', criterionName: 'Frontend System Design', score: 4.7 },
            { criterionId: 'c4', criterionName: 'Performance Optimization', score: 4.9 },
          ],
        },
      ],
    },
    {
      roundId: 'round-3',
      roundOrder: 3,
      roundType: 'EXECUTIVE',
      roundName: 'Vòng 3: Phỏng vấn Hội đồng Tuyển dụng & Ban Lãnh Đạo',
      roundDate: '02/10/2026',
      format: 'ONLINE',
      locationOrLink: 'Google Meet Hội đồng phỏng vấn cấp cao',
      averageScore: 4.65,
      roundSummary: 'Hội đồng phỏng vấn cấp cao nhất trí ứng viên đáp ứng trọn vẹn cả chuyên môn lẫn kỹ năng làm chủ công việc.',
      interviewers: [
        {
          interviewerId: 'inv-cto-01',
          interviewerName: 'Hoàng Hải Đăng',
          interviewerRole: 'Chief Technology Officer (CTO)',
          interviewerAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
          overallScore: 4.7,
          recommendation: 'STRONG_HIRE',
          comment: 'Tư duy làm chủ công việc tốt, hiểu rõ chiến lược phát triển sản phẩm công nghệ dài hạn. Rất phù hợp để đóng vai trò dẫn dắt kỹ thuật cho squad mới.',
          strengths: ['Tư duy chiến lược công nghệ', 'Khả năng đào tạo và truyền lửa cho cấp dưới'],
          concerns: [],
          submittedAt: '2026-10-02T15:45:00Z',
        },
        {
          interviewerId: 'inv-hr-02',
          interviewerName: 'Lê Thu Hương',
          interviewerRole: 'Head of HR & Talent Acquisition',
          interviewerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
          overallScore: 4.6,
          recommendation: 'HIRE',
          comment: 'Thái độ khiêm tốn, hòa nhã, tôn trọng đồng nghiệp. Đặt các câu hỏi rất chất lượng về văn hóa doanh nghiệp và lộ trình phát triển bản thân.',
          strengths: ['Kỹ năng giao tiếp và thuyết trình', 'Độ phù hợp văn hóa', 'Khả năng thích ứng'],
          concerns: ['Cần thống nhất mức offer phù hợp để tạo động lực gắn bó lâu dài'],
          submittedAt: '2026-10-02T16:15:00Z',
        },
      ],
    },
  ],
  compensation: {
    expectedSalary: 38000000,
    expectedSalaryFormatted: '38.000.000 ₫',
    currentSalary: 32000000,
    currentSalaryFormatted: '32.000.000 ₫',
    salaryNegotiable: true,
    noticePeriodDays: 30,
    availabilityText: 'Sau 30 ngày (Bàn giao tại FPT Software)',
    workModePreference: 'HYBRID',
  },
  hiringDecision: {
    status: 'PENDING',
  },
};

export const candidateEvaluationSummaryService = {
  /**
   * Gọi API hoặc lấy dữ liệu tổng hợp đánh giá ứng viên (AC 1, AC 2, AC 3)
   */
  async getCandidateEvaluationSummary(candidateId?: string): Promise<CandidateEvaluationSummaryData> {
    if (candidateId) {
      try {
        const response = await axiosClient.get<CandidateEvaluationSummaryData>(
          `/recruitment/candidates/${encodeURIComponent(candidateId)}/evaluation-summary`
        );
        if (response.data && response.data.id) {
          return response.data;
        }
      } catch {
        // Fallback đọc từ LocalStorage hoặc dữ liệu mock
      }

      try {
        const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${candidateId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) {
            return parsed;
          }
        }
      } catch {
        // Bỏ qua lỗi đọc localStorage
      }
    }

    // Tự động tính toán lại consensus và gaps nếu mock có thay đổi
    const data = { ...MOCK_EVALUATION_SUMMARY_DATA };
    if (candidateId) {
      data.id = candidateId;
    }

    data.consensus = calculateConsensusSummary(data.evaluationRounds);
    data.competencyBenchmarks = data.competencyBenchmarks.map((b) => ({
      ...b,
      gap: parseFloat((b.score - b.targetScore).toFixed(2)),
      gapStatus: evaluateCompetencyGap(b.score, b.targetScore),
    }));

    return data;
  },

  /**
   * Lưu hoặc cập nhật quyết định tuyển dụng cuối cùng (AC 4)
   */
  async submitHiringDecision(
    candidateId: string,
    decision: FinalHiringDecisionRecord
  ): Promise<CandidateEvaluationSummaryData> {
    try {
      const response = await axiosClient.post<CandidateEvaluationSummaryData>(
        `/recruitment/candidates/${encodeURIComponent(candidateId)}/final-hiring-decision`,
        decision
      );
      if (response.data) {
        return response.data;
      }
    } catch {
      // Fallback lưu local
    }

    const currentSummary = await this.getCandidateEvaluationSummary(candidateId);
    const updated: CandidateEvaluationSummaryData = {
      ...currentSummary,
      hiringDecision: {
        ...decision,
        decidedAt: new Date().toISOString(),
        decidedBy: decision.decidedBy || 'Hội đồng Tuyển dụng',
      },
    };

    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${candidateId}`, JSON.stringify(updated));
    } catch {
      // Bỏ qua lỗi ghi localStorage
    }

    return updated;
  },

  /**
   * Gọi API cập nhật quyết định tuyển dụng: Offer hoặc Từ chối có lý do (AC 4 - Task TKNHTTDNB1-486)
   */
  async updateCandidateDecision(
    candidateId: string,
    decisionData: FinalHiringDecisionRecord
  ): Promise<CandidateEvaluationSummaryData> {
    try {
      const response = await axiosClient.post<CandidateEvaluationSummaryData>(
        `/recruitment/candidates/${encodeURIComponent(candidateId)}/decision`,
        decisionData
      );
      if (response.data) {
        const raw = response.data as unknown as { data?: CandidateEvaluationSummaryData };
        return raw.data || response.data;
      }
    } catch {
      // Fallback về submitHiringDecision
    }

    return this.submitHiringDecision(candidateId, decisionData);
  },
};
