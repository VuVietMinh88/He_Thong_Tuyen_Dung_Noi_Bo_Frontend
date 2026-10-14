import axiosClient from '../utils/axiosClient';
import type {
  InterviewSchedulePayload,
  InterviewerInfo,
} from '../types/interview';
import { MOCK_INTERNAL_INTERVIEWERS } from '../types/interview';

export const LOCAL_STORAGE_INTERVIEWS_KEY = 'smart_recruitment_scheduled_interviews';
export const LOCAL_STORAGE_TIMELINE_KEY = 'smart_recruitment_timeline_events';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  scheduledDate?: Date;
  scheduledDateTimeISO?: string;
}

/**
 * Kiểm tra ngày giờ phỏng vấn có nằm trong quá khứ so với thời điểm hiện tại
 * theo múi giờ Việt Nam (Asia/Ho_Chi_Minh - GMT+7).
 */
export const validateScheduleTime = (
  dateStr: string,
  timeStr: string,
  bufferMinutes = 0,
): ValidationResult => {
  if (!dateStr || !dateStr.trim()) {
    return {
      isValid: false,
      error: 'Vui lòng chọn ngày phỏng vấn.',
    };
  }

  if (!timeStr || !timeStr.trim()) {
    return {
      isValid: false,
      error: 'Vui lòng chọn giờ bắt đầu phỏng vấn.',
    };
  }

  // Định dạng ISO với offset +07:00 của Việt Nam
  const formattedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  const isoWithTimezone = `${dateStr.trim()}T${formattedTime}+07:00`;
  const scheduledDate = new Date(isoWithTimezone);

  if (isNaN(scheduledDate.getTime())) {
    return {
      isValid: false,
      error: 'Thời gian đã chọn không hợp lệ, vui lòng kiểm tra lại.',
    };
  }

  const now = new Date();
  const thresholdMs = now.getTime() - bufferMinutes * 60 * 1000;

  if (scheduledDate.getTime() < thresholdMs) {
    return {
      isValid: false,
      error:
        'Thời gian phỏng vấn không được ở thời điểm quá khứ theo múi giờ Việt Nam (GMT+7). Vui lòng chọn ngày giờ trong tương lai.',
      scheduledDate,
      scheduledDateTimeISO: scheduledDate.toISOString(),
    };
  }

  return {
    isValid: true,
    scheduledDate,
    scheduledDateTimeISO: scheduledDate.toISOString(),
  };
};

/**
 * Tính toán giờ kết thúc dự kiến dựa trên giờ bắt đầu và thời lượng (phút).
 */
export const calculateEndTime = (timeStr: string, durationMinutes: number): string => {
  if (!timeStr || !timeStr.includes(':')) return '';
  const [hoursStr, minutesStr] = timeStr.split(':');
  const startHours = parseInt(hoursStr, 10);
  const startMinutes = parseInt(minutesStr, 10);

  if (isNaN(startHours) || isNaN(startMinutes)) return '';

  const totalMinutes = startHours * 60 + startMinutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;

  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

/**
 * Sinh ngẫu nhiên liên kết phòng họp trực tuyến mẫu (Google Meet, Zoom, MS Teams).
 */
export const generateMeetingLink = (
  provider: 'google_meet' | 'zoom' | 'teams' = 'google_meet',
): string => {
  const randomLetters = (length: number) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let res = '';
    for (let i = 0; i < length; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  if (provider === 'zoom') {
    const meetingId = Math.floor(1000000000 + Math.random() * 9000000000);
    const pwd = randomLetters(6);
    return `https://zoom.us/j/${meetingId}?pwd=${pwd}`;
  }

  if (provider === 'teams') {
    const threadId = randomLetters(12);
    return `https://teams.microsoft.com/l/meetup-join/19%3ameeting_${threadId}%40thread.v2/0`;
  }

  // Mặc định Google Meet
  return `https://meet.google.com/${randomLetters(3)}-${randomLetters(4)}-${randomLetters(3)}`;
};

class InterviewService {
  /**
   * Lấy danh sách nhân sự nội bộ có thể tham gia phỏng vấn
   */
  async getInternalInterviewers(searchQuery?: string): Promise<InterviewerInfo[]> {
    try {
      const response = await axiosClient.get('/recruitment/interviewers', {
        params: { search: searchQuery },
      });
      if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch {
      // API fallback dùng danh sách mẫu
    }

    if (!searchQuery || !searchQuery.trim()) {
      return [...MOCK_INTERNAL_INTERVIEWERS];
    }

    const query = searchQuery.trim().toLowerCase();
    return MOCK_INTERNAL_INTERVIEWERS.filter(
      (interviewer) =>
        interviewer.name.toLowerCase().includes(query) ||
        interviewer.role.toLowerCase().includes(query) ||
        interviewer.email.toLowerCase().includes(query) ||
        (interviewer.department && interviewer.department.toLowerCase().includes(query)),
    );
  }

  /**
   * Lưu lịch phỏng vấn mới cho ứng viên
   */
  async scheduleInterview(
    payload: Omit<InterviewSchedulePayload, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
  ): Promise<InterviewSchedulePayload> {
    // 1. Validation dữ liệu bắt buộc
    if (!payload.candidateId) {
      throw new Error('Mã định danh ứng viên (candidateId) là bắt buộc.');
    }
    if (!payload.roundName || !payload.roundName.trim()) {
      throw new Error('Vui lòng chọn hoặc nhập vòng phỏng vấn.');
    }
    if (!payload.interviewers || payload.interviewers.length === 0) {
      throw new Error('Vui lòng chọn ít nhất một người phỏng vấn.');
    }
    if (!payload.locationOrLink || !payload.locationOrLink.trim()) {
      throw new Error(
        payload.format === 'ONLINE'
          ? 'Vui lòng cung cấp liên kết họp trực tuyến (Google Meet, Zoom...).'
          : 'Vui lòng nhập tên phòng họp hoặc địa điểm phỏng vấn trực tiếp.',
      );
    }

    // 2. Validate thời gian theo múi giờ Việt Nam
    const timeValidation = validateScheduleTime(payload.interviewDate, payload.interviewTime);
    if (!timeValidation.isValid) {
      throw new Error(timeValidation.error || 'Thời gian phỏng vấn không hợp lệ.');
    }

    const newInterview: InterviewSchedulePayload = {
      ...payload,
      id: payload.id || `intv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      scheduledDateTimeISO:
        timeValidation.scheduledDateTimeISO ||
        `${payload.interviewDate}T${payload.interviewTime}:00+07:00`,
      status: payload.status || 'SCHEDULED',
      createdAt: payload.createdAt || new Date().toISOString(),
    };

    // 3. Gửi API backend nếu có
    try {
      const response = await axiosClient.post(
        `/recruitment/candidates/${encodeURIComponent(payload.candidateId)}/interviews`,
        newInterview,
      );
      if (response?.data) {
        this.saveInterviewToStorage(response.data);
        this.syncInterviewToTimeline(response.data);
        return response.data;
      }
    } catch {
      // Fallback lưu local storage
    }

    this.saveInterviewToStorage(newInterview);
    this.syncInterviewToTimeline(newInterview);
    return newInterview;
  }

  /**
   * Lấy danh sách lịch phỏng vấn theo ứng viên
   */
  async getInterviewsByCandidate(candidateId: string): Promise<InterviewSchedulePayload[]> {
    try {
      const response = await axiosClient.get(
        `/recruitment/candidates/${encodeURIComponent(candidateId)}/interviews`,
      );
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch {
      // Fallback đọc từ LocalStorage
    }

    const localList = this.getStoredInterviews();
    return localList.filter((item) => item.candidateId === candidateId);
  }

  /**
   * Lưu trữ lịch phỏng vấn vào LocalStorage
   */
  private saveInterviewToStorage(interview: InterviewSchedulePayload): void {
    try {
      const existing = this.getStoredInterviews();
      const updated = [interview, ...existing.filter((item) => item.id !== interview.id)];
      localStorage.setItem(LOCAL_STORAGE_INTERVIEWS_KEY, JSON.stringify(updated));
    } catch {
      // Ignored in non-browser env
    }
  }

  /**
   * Lấy danh sách lịch từ LocalStorage
   */
  private getStoredInterviews(): InterviewSchedulePayload[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_INTERVIEWS_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as InterviewSchedulePayload[];
    } catch {
      return [];
    }
  }

  /**
   * Đồng bộ tạo sự kiện lịch phỏng vấn vào dòng thời gian (Timeline) của ứng viên
   */
  private syncInterviewToTimeline(interview: InterviewSchedulePayload): void {
    try {
      const rawEvents = localStorage.getItem(LOCAL_STORAGE_TIMELINE_KEY);
      const events = rawEvents ? JSON.parse(rawEvents) : [];

      const newTimelineEvent = {
        id: `evt-intv-${Date.now()}`,
        candidateId: interview.candidateId,
        eventType: 'INTERVIEW_SCHEDULED',
        timestamp: new Date().toISOString(),
        actor: {
          id: 'usr-current',
          fullName: interview.createdByName || 'Chuyên viên Tuyển dụng',
          role: 'Recruiter',
        },
        title: `Lên lịch: ${interview.roundName}`,
        summary: `Đã đặt lịch phỏng vấn ${interview.format === 'ONLINE' ? 'Trực tuyến' : 'Trực tiếp'} với ứng viên ${interview.candidateName} vào ngày ${interview.interviewDate} lúc ${interview.interviewTime}.`,
        interviewScheduled: {
          roundName: interview.roundName,
          interviewDate: interview.scheduledDateTimeISO,
          durationMinutes: interview.durationMinutes,
          format: interview.format,
          locationOrMeetingLink: interview.locationOrLink,
          interviewers: interview.interviewers.map((i) => ({
            name: i.name,
            role: i.role,
          })),
          candidateResponseStatus: 'PENDING',
        },
      };

      events.unshift(newTimelineEvent);
      localStorage.setItem(LOCAL_STORAGE_TIMELINE_KEY, JSON.stringify(events));
    } catch {
      // Ignored
    }
  }
}

export const interviewService = new InterviewService();
