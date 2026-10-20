import type {
  TimelineEvent,
  TimelineFilterCategory,
} from '../types/candidateTimeline';
import axiosClient from '../utils/axiosClient';

/**
 * Dữ liệu mẫu Timeline chân thực bao gồm đầy đủ 5 nhóm sự kiện
 */
const MOCK_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'evt-007',
    candidateId: 'can-demo-891',
    eventType: 'EVALUATION_SUBMITTED',
    timestamp: '2026-10-12T10:30:00.000Z',
    actor: {
      id: 'usr-mgr-002',
      fullName: 'Đặng Tuấn Anh',
      role: 'Hiring Manager (Trưởng bộ phận Công nghệ)',
    },
    title: 'Đã hoàn thành đánh giá phỏng vấn chuyên môn Vòng 1',
    summary: 'Ứng viên thể hiện xuất sắc kiến trúc React Concurrent Rendering, State Management và tư duy thiết kế hệ thống.',
    evaluationSubmitted: {
      evaluatorName: 'Đặng Tuấn Anh',
      evaluatorRole: 'Hiring Manager',
      roundName: 'Phỏng vấn Kỹ thuật Chuyên sâu Vòng 1',
      competencyScore: 8.8,
      maxScore: 10,
      result: 'PASSED',
      quickRating: 5,
      summaryNote:
        'Ứng viên nắm rất sâu về React 19, tối ưu bundle và tư duy xây dựng Micro-frontends. Giao tiếp mạch lạc, tiếng Anh trôi chảy.',
      strengths: ['React 19 & Concurrent Rendering', 'Tối ưu hiệu năng Core Web Vitals', 'Kinh nghiệm Lead nhóm'],
      weaknesses: ['Cần bổ sung kiến thức về CI/CD Kubernetes tự động hóa'],
    },
  },
  {
    id: 'evt-006',
    candidateId: 'can-demo-891',
    eventType: 'INTERVIEW_SCHEDULED',
    timestamp: '2026-10-11T09:00:00.000Z',
    actor: {
      id: 'usr-hr-001',
      fullName: 'Nguyễn Văn Minh',
      role: 'Senior Recruiter',
    },
    title: 'Đã lên lịch Phỏng vấn Kỹ thuật Chuyên sâu Vòng 1',
    summary: 'Thời gian: 09:30 Thứ Hai ngày 12/10/2026 qua Google Meet. Ứng viên đã xác nhận tham gia.',
    interviewScheduled: {
      roundName: 'Phỏng vấn Kỹ thuật Chuyên sâu Vòng 1',
      interviewDate: '2026-10-12T02:30:00.000Z', // 09:30 VN
      durationMinutes: 60,
      format: 'ONLINE',
      locationOrMeetingLink: 'https://meet.google.com/abc-xyz-recruit',
      interviewers: [
        { name: 'Đặng Tuấn Anh', role: 'Hiring Manager' },
        { name: 'Lê Hoàng Nam', role: 'Staff Frontend Architect' },
      ],
      candidateResponseStatus: 'ACCEPTED',
    },
  },
  {
    id: 'evt-005',
    candidateId: 'can-demo-891',
    eventType: 'EMAIL_SENT',
    timestamp: '2026-10-10T16:00:00.000Z',
    actor: {
      id: 'usr-hr-001',
      fullName: 'Nguyễn Văn Minh',
      role: 'Senior Recruiter',
    },
    title: 'Đã gửi Email: Thư mời tham dự Phỏng vấn Vòng 1',
    summary: 'Gửi thư mời kèm liên kết Google Meet và lịch trình chuẩn bị cho ứng viên.',
    emailSent: {
      emailType: 'INTERVIEW_INVITATION',
      subject: '[SmartRecruit] Thư mời phỏng vấn vị trí Senior Frontend Developer - Ứng viên Lê Quốc Bảo',
      recipientEmail: 'bao.lequoc.tech@gmail.com',
      senderName: 'Nguyễn Văn Minh (Ban Tuyển dụng)',
      bodySnippet:
        'Chào bạn Bảo, Cảm ơn bạn đã quan tâm ứng tuyển vị trí Senior Frontend Developer. Chúng tôi trân trọng mời bạn tham gia buổi phỏng vấn trực tuyến Vòng 1...',
      deliveryStatus: 'OPENED',
    },
  },
  {
    id: 'evt-004',
    candidateId: 'can-demo-891',
    eventType: 'STAGE_CHANGED',
    timestamp: '2026-10-10T15:00:00.000Z',
    actor: {
      id: 'usr-hr-001',
      fullName: 'Nguyễn Văn Minh',
      role: 'Senior Recruiter',
    },
    title: 'Chuyển trạng thái tuyển dụng: Sàng lọc ➔ Phỏng vấn',
    summary: 'Hồ sơ đã vượt qua vòng sơ loại CV và sơ vấn điện thoại, chuyển sang hội đồng chuyên môn.',
    stageChanged: {
      jobPostingId: 'jp-demo-306',
      jobTitle: 'Senior Frontend Developer (React, TypeScript & Tailwind CSS)',
      fromStage: 'SCREENING',
      toStage: 'INTERVIEWING',
      notes: 'Đã sơ vấn điện thoại: Thái độ tích cực, lương kỳ vọng 40-45M Net, báo trước 30 ngày.',
    },
  },
  {
    id: 'evt-003',
    candidateId: 'can-demo-891',
    eventType: 'NOTE_ADDED',
    timestamp: '2026-10-10T14:15:00.000Z',
    actor: {
      id: 'usr-hr-001',
      fullName: 'Nguyễn Văn Minh',
      role: 'Senior Recruiter',
    },
    title: 'Thêm ghi chú nội bộ sau cuộc gọi sơ vấn',
    summary: 'Ghi chú về mức lương kỳ vọng, thời gian sẵn sàng nhận việc và thái độ giao tiếp.',
    noteAdded: {
      category: 'SCREENING',
      content:
        'Sơ loại hồ sơ qua điện thoại: Thái độ hợp tác tích cực, thời gian báo trước nghỉ việc ở công ty cũ là 30 ngày. Mức lương kỳ vọng từ 40 - 45 triệu Net. Tiếng Anh giao tiếp tốt.',
    },
  },
  {
    id: 'evt-002',
    candidateId: 'can-demo-891',
    eventType: 'STAGE_CHANGED',
    timestamp: '2026-10-09T09:30:00.000Z',
    actor: {
      id: 'usr-hr-001',
      fullName: 'Nguyễn Văn Minh',
      role: 'Senior Recruiter',
    },
    title: 'Chuyển trạng thái tuyển dụng: Hồ sơ mới ➔ Sàng lọc',
    summary: 'Tiếp nhận hồ sơ từ cổng giới thiệu nội bộ và đưa vào danh sách rà soát ban đầu.',
    stageChanged: {
      jobPostingId: 'jp-demo-306',
      jobTitle: 'Senior Frontend Developer (React, TypeScript & Tailwind CSS)',
      fromStage: 'NEW',
      toStage: 'SCREENING',
      notes: 'Hồ sơ có người nội bộ bảo lãnh uy tín.',
    },
  },
  {
    id: 'evt-001',
    candidateId: 'can-demo-891',
    eventType: 'APPLICATION_SUBMITTED',
    timestamp: '2026-10-09T08:00:00.000Z',
    actor: {
      id: 'usr-employee-02',
      fullName: 'Trần Văn Nam',
      role: 'Trưởng phòng AI (Người giới thiệu nội bộ)',
    },
    title: 'Nộp hồ sơ ứng tuyển vị trí Senior Frontend Developer',
    summary: 'Ứng viên được giới thiệu nội bộ bởi anh Trần Văn Nam kèm CV bản PDF.',
    applicationSubmitted: {
      jobPostingId: 'jp-demo-306',
      jobCode: 'REQ-2026-089',
      jobTitle: 'Senior Frontend Developer (React, TypeScript & Tailwind CSS)',
      departmentName: 'Khối Công nghệ & Sản phẩm',
      source: {
        type: 'INTERNAL_REFERRAL',
        label: 'Giới thiệu nội bộ',
        referrerName: 'Trần Văn Nam',
        referrerEmail: 'nam.tran@company.com',
      },
      cvFileName: 'CV_LeQuocBao_Senior_Frontend_Lead_2026.pdf',
      cvFileSize: 1024 * 850,
      coverLetterSnippet: 'Kính gửi Ban Tuyển dụng SmartRecruit, tôi có hơn 5 năm kinh nghiệm thực chiến...',
    },
  },
];

export const candidateTimelineService = {
  /**
   * 1. Lấy dòng thời gian toàn bộ tương tác của ứng viên (AC 1, AC 2, AC 3)
   * Luôn sắp xếp theo thứ tự mới nhất trước (Newest First).
   */
  async getCandidateInteractionTimeline(
    candidateId: string,
    params?: { category?: TimelineFilterCategory }
  ): Promise<TimelineEvent[]> {
    try {
      const response = await axiosClient.get<TimelineEvent[]>(
        `/candidates/${candidateId}/timeline`,
        { params }
      );
      if (response && response.data && Array.isArray(response.data)) {
        // Sắp xếp mới nhất lên đầu
        return response.data.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
    } catch {
      // Fallback offline mock data
    }

    // Lọc theo category nếu có
    let events = [...MOCK_TIMELINE_EVENTS];

    if (params?.category && params.category !== 'ALL') {
      if (params.category === 'EVALUATION') {
        events = events.filter(
          (e) => e.eventType === 'EVALUATION_SUBMITTED' || e.eventType === 'NOTE_ADDED'
        );
      } else {
        events = events.filter((e) => e.eventType === params.category);
      }
    }

    // Sắp xếp mới nhất lên đầu (Newest First - AC 2)
    return events.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },

  /**
   * 2. Định dạng ngày giờ theo múi giờ Việt Nam (Asia/Ho_Chi_Minh) dạng: HH:mm - DD/MM/YYYY
   */
  formatVietnamDateTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const timeStr = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);

      const dateStr = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);

      return `${timeStr} - ${dateStr}`;
    } catch {
      return dateString;
    }
  },

  /**
   * 3. Tính toán thời gian tương đối bằng tiếng Việt
   */
  getRelativeTimeVN(dateString: string): string {
    try {
      const date = new Date(dateString);
      const diffMs = Date.now() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays === 1) return 'Hôm qua';
      if (diffDays < 7) return `${diffDays} ngày trước`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;

      return this.formatVietnamDateTime(dateString);
    } catch {
      return '';
    }
  },
};

export default candidateTimelineService;

