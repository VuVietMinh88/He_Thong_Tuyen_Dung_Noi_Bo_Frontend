import { interviewApi, scheduleRequest, type InterviewConflict } from './interviewApi';
import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import type {
  InterviewSchedulePayload,
  CreateInterviewSchedulePayload,
  PersonalScheduleParams,
  InterviewerInfo,
  CheckInterviewConflictPayload,
  InterviewConflictCheckResult,
  ConflictItemDetail,
  BatchCreateInterviewSchedulePayload,
  BatchCreateInterviewScheduleResult,
} from '../types/interview';
import {
  InterviewPastTimeError,
  InterviewerConflictError,
  InterviewApiError,
} from '../types/interview';

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
 * Kiểm tra chuỗi ISO startTime có nằm trong quá khứ hay không
 */
export const validateIsoStartTime = (startTimeIso: string, bufferMinutes = 0): ValidationResult => {
  if (!startTimeIso || !startTimeIso.trim()) {
    return {
      isValid: false,
      error: 'Vui lòng cung cấp thời gian bắt đầu phỏng vấn.',
    };
  }

  const scheduledDate = new Date(startTimeIso);
  if (isNaN(scheduledDate.getTime())) {
    return {
      isValid: false,
      error: 'Thời gian phỏng vấn không hợp lệ.',
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
 * Kiểm tra xem hai khung giờ có bị chồng lấn (trùng thời gian) hay không
 */
export const areTimeSlotsOverlapping = (
  date1: string,
  time1: string,
  duration1: number,
  date2: string,
  time2: string,
  duration2: number,
): boolean => {
  if (date1 !== date2) return false;
  if (!time1 || !time2 || !time1.includes(':') || !time2.includes(':')) return false;

  const [h1, m1] = time1.split(':').map((s) => parseInt(s, 10));
  const [h2, m2] = time2.split(':').map((s) => parseInt(s, 10));

  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return false;

  const start1 = h1 * 60 + m1;
  const end1 = start1 + duration1;

  const start2 = h2 * 60 + m2;
  const end2 = start2 + duration2;

  // Hai khoảng [start1, end1) và [start2, end2) trùng nhau khi:
  return Math.max(start1, start2) < Math.min(end1, end2);
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
  async getInternalInterviewers(_searchQuery?: string): Promise<InterviewerInfo[]> {
    throw new InterviewApiError('Backend PR #191 chưa có API chọn người phỏng vấn theo phạm vi hồ sơ. Không dùng danh sách mẫu.', 501);
  }


  checkLocalConflict(
    payload: CheckInterviewConflictPayload,
  ): InterviewConflictCheckResult {
    const storedList = this.getStoredInterviews().filter(
      (item) => item.status === 'SCHEDULED' && (!payload.id || item.id !== payload.id),
    );

    const conflicts: ConflictItemDetail[] = [];
    const proposedTimeStr = payload.startTime.includes('T')
      ? payload.startTime.split('T')[1].slice(0, 5)
      : payload.startTime.slice(0, 5);

    const proposedEndTime = calculateEndTime(proposedTimeStr, payload.durationMinutes);

    for (const existing of storedList) {
      const existingTimeStr =
        existing.interviewTime ||
        (existing.startTime ? existing.startTime.split('T')[1].slice(0, 5) : '');

      const isOverlapping = areTimeSlotsOverlapping(
        payload.interviewDate,
        proposedTimeStr,
        payload.durationMinutes,
        existing.interviewDate,
        existingTimeStr,
        existing.durationMinutes,
      );

      if (!isOverlapping) continue;

      const existingEndTime = calculateEndTime(existingTimeStr, existing.durationMinutes);
      const conflictingSummary = {
        id: existing.id || '',
        candidateName: existing.candidateName,
        jobTitle: existing.jobTitle || 'Vị trí ứng tuyển',
        roundName: existing.roundName || existing.interviewRound || 'Vòng phỏng vấn',
        interviewDate: existing.interviewDate,
        startTime: existingTimeStr,
        endTime: existingEndTime,
        durationMinutes: existing.durationMinutes,
        format: existing.format,
        locationOrLink: existing.locationOrLink,
        interviewerNames: existing.interviewers.map((i) => i.name),
      };

      // 1. Kiểm tra Người phỏng vấn trùng lịch
      for (const interviewerId of payload.interviewerIds) {
        const isAssigned =
          (existing.interviewerIds && existing.interviewerIds.includes(interviewerId)) ||
          (existing.interviewers && existing.interviewers.some((i) => i.id === interviewerId));

        if (isAssigned) {
          const matched =
            existing.interviewers.find((i) => i.id === interviewerId);
          const name = matched?.name || `Người phỏng vấn (${interviewerId})`;
          const role = matched?.role || 'Hội đồng phỏng vấn';

          conflicts.push({
            type: 'INTERVIEWER',
            entityId: interviewerId,
            entityName: name,
            entityRoleOrLocation: role,
            reason: `Người phỏng vấn ${name} (${role}) đã có lịch phỏng vấn với ứng viên ${existing.candidateName} (${existing.roundName}) từ ${existingTimeStr} đến ${existingEndTime}.`,
            conflictingInterview: conflictingSummary,
          });
        }
      }

      // 2. Kiểm tra Phòng họp bị chiếm dụng (OFFLINE)
      if (
        payload.format === 'OFFLINE' &&
        existing.format === 'OFFLINE' &&
        payload.locationOrLink &&
        existing.locationOrLink
      ) {
        const normProposed = payload.locationOrLink.trim().toLowerCase();
        const normExisting = existing.locationOrLink.trim().toLowerCase();

        if (
          normProposed === normExisting ||
          normProposed.includes(normExisting) ||
          normExisting.includes(normProposed)
        ) {
          conflicts.push({
            type: 'ROOM',
            entityName: payload.locationOrLink,
            entityRoleOrLocation: 'Phòng họp trực tiếp',
            reason: `Phòng họp "${payload.locationOrLink}" đang được sử dụng cho buổi phỏng vấn của ứng viên ${existing.candidateName} từ ${existingTimeStr} đến ${existingEndTime}.`,
            conflictingInterview: conflictingSummary,
          });
        }
      }
    }

    if (conflicts.length === 0) {
      return {
        hasConflict: false,
        conflicts: [],
      };
    }

    const hasInterviewer = conflicts.some((c) => c.type === 'INTERVIEWER');
    const hasRoom = conflicts.some((c) => c.type === 'ROOM');
    const conflictType =
      hasInterviewer && hasRoom ? 'BOTH' : hasInterviewer ? 'INTERVIEWER_CONFLICT' : 'ROOM_CONFLICT';

    const proposedInterview = {
      candidateName: payload.candidateName || 'Ứng viên hiện tại',
      jobTitle: payload.jobTitle || 'Vị trí ứng tuyển',
      roundName: payload.roundName || 'Vòng phỏng vấn',
      interviewDate: payload.interviewDate,
      startTime: proposedTimeStr,
      endTime: proposedEndTime,
      durationMinutes: payload.durationMinutes,
      format: payload.format,
      locationOrLink: payload.locationOrLink,
      interviewerNames: payload.interviewerIds.map((id) => {
        return id;
      }),
    };

    return {
      hasConflict: true,
      conflictType,
      message: `Phát hiện xung đột lịch phỏng vấn (${
        conflictType === 'BOTH'
          ? 'Người phỏng vấn và Phòng họp'
          : conflictType === 'INTERVIEWER_CONFLICT'
          ? 'Người phỏng vấn'
          : 'Phòng họp'
      }) trong khung giờ đã chọn.`,
      conflicts,
      proposedInterview,
    };
  }

  /**
   * Kiểm tra xung đột lịch phỏng vấn theo người phỏng vấn và phòng họp (AC 1 & AC 3 - TKNHTTDNB1-439)
   */
  async checkInterviewConflict(payload: CheckInterviewConflictPayload): Promise<InterviewConflictCheckResult> {
    if (!payload.applicationId) throw new InterviewApiError('Thiếu mã hồ sơ ứng tuyển để kiểm tra trùng lịch.', 400);
    const request = scheduleRequest({ applicationId: payload.applicationId, interviewRound: payload.roundName || '',
      startTime: `${payload.interviewDate}T${payload.startTime.length === 5 ? payload.startTime + ':00' : payload.startTime}+07:00`,
      durationMinutes: payload.durationMinutes, interviewType: payload.format, locationOrLink: payload.locationOrLink,
      interviewerIds: payload.interviewerIds });
    const { expectedVersion: _version, overrideConflicts: _override, overrideReason: _reason, ...fields } = request;
    const { data } = await axiosClient.post<InterviewConflict[]>('/interviews/conflicts', {
      ...fields, applicationId: payload.applicationId, interviewId: payload.id ?? null,
    });
    if (!Array.isArray(data)) throw new InterviewApiError('Response kiểm tra trùng lịch không hợp lệ.');
    const hasRoom = data.some(item => item.resourceType === 'ROOM');
    const hasParticipant = data.some(item => item.resourceType !== 'ROOM');
    return { hasConflict: data.length > 0,
      conflictType: hasRoom && hasParticipant ? 'BOTH' : hasRoom ? 'ROOM_CONFLICT' : hasParticipant ? 'INTERVIEWER_CONFLICT' : undefined,
      conflicts: data.map(item => ({
      type: item.resourceType === 'ROOM' ? 'ROOM' : 'INTERVIEWER',
      entityId: item.participantId ?? undefined, entityName: item.room || item.participantId || '',
      reason: 'Tài nguyên đã có lịch trong khung giờ này.',
      conflictingInterview: { id: item.interviewId, candidateName: '', jobTitle: '', roundName: '',
        interviewDate: '', startTime: item.startsAt, endTime: item.endsAt,
        durationMinutes: (Date.parse(item.endsAt) - Date.parse(item.startsAt)) / 60000,
        format: payload.format, locationOrLink: item.room || '' },
    })) };
  }


  async createInterviewSchedule(payload: CreateInterviewSchedulePayload): Promise<InterviewSchedulePayload> {
    if (!payload.applicationId?.trim()) throw new InterviewApiError('Thiếu mã hồ sơ ứng tuyển (applicationId).', 400);
    if (!(payload.roundName || payload.interviewRound)?.trim()) throw new InterviewApiError('Thiếu vòng phỏng vấn.', 400);
    if (!payload.interviewerIds?.length) throw new InterviewApiError('Cần chọn người phỏng vấn.', 400);
    if (!payload.locationOrLink?.trim()) throw new InterviewApiError('Cần địa điểm hoặc liên kết họp.', 400);
    if (payload.isOverride && !payload.overrideReason?.trim()) throw new InterviewApiError('Lý do ghi đè không được để trống.', 400);
    const time = payload.startTime || payload.scheduledDateTimeISO || '';
    const validation = validateIsoStartTime(time);
    if (!validation.isValid) throw new InterviewPastTimeError(validation.error);
    try {
      const saved = await interviewApi.create({ ...payload, startTime: time });
      return { ...saved, candidateId: payload.candidateId || '', candidateName: payload.candidateName || '',
        candidateEmail: payload.candidateEmail, jobTitle: payload.jobTitle, interviewers: payload.interviewers || [] };
    } catch (cause) {
      if (axios.isAxiosError(cause) && cause.response?.status === 409 && cause.response.data?.code === 'INTERVIEW_CONFLICT') {
        throw new InterviewerConflictError(cause.response.data.message);
      }
      if (axios.isAxiosError(cause)) {
        const data = cause.response?.data;
        throw new InterviewApiError(data?.message || cause.message, cause.response?.status, data?.code);
      }
      throw cause;
    }
  }


  async scheduleInterview(
    payload: Omit<InterviewSchedulePayload, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
  ): Promise<InterviewSchedulePayload> {
    if (!payload.candidateId || !payload.candidateId.trim()) {
      throw new Error('Mã định danh ứng viên (candidateId) là bắt buộc.');
    }

    return this.createInterviewSchedule({
      ...payload,
      applicationId: payload.applicationId || '',
      interviewRound: payload.roundName,
      startTime: payload.scheduledDateTimeISO,
      interviewType: payload.format,
      interviewerIds: payload.interviewers.map((i) => i.id),
    });
  }

  /**
   * Lấy danh sách lịch phỏng vấn của ứng viên theo đợt ứng tuyển (AC 1)
   */
  async getCandidateInterviews(applicationId: string, _candidateId?: string): Promise<InterviewSchedulePayload[]> {
    return interviewApi.list(applicationId);
  }


  async getPersonalInterviewSchedule(params?: PersonalScheduleParams): Promise<InterviewSchedulePayload[]> {
    return interviewApi.mine(params);
  }


  async getInterviewsByCandidate(candidateId: string): Promise<InterviewSchedulePayload[]> {
    return this.getCandidateInterviews('', candidateId);
  }

  /**
   * Cập nhật trạng thái buổi phỏng vấn (Hoàn thành / Đã hủy)
   */
  async updateInterviewStatus(
    interviewId: string, newStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED',
    cancellation?: { expectedVersion: number; reason: string },
  ): Promise<InterviewSchedulePayload | null> {
    if (newStatus !== 'CANCELLED') throw new InterviewApiError('Backend không hỗ trợ đổi trạng thái lịch thủ công.');
    if (!cancellation) throw new InterviewApiError('Cần tải lại lịch và nhập lý do trước khi hủy.');
    return interviewApi.cancel(interviewId, cancellation.expectedVersion, cancellation.reason);
  }

  async rescheduleInterview(interviewId: string, payload: CreateInterviewSchedulePayload) {
    return interviewApi.update(interviewId, payload);
  }


  saveInterviewToStorage(interview: InterviewSchedulePayload): void {
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
  getStoredInterviews(): InterviewSchedulePayload[] {
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
  async batchCreateInterviewSchedules(_payload: BatchCreateInterviewSchedulePayload): Promise<BatchCreateInterviewScheduleResult> {
    throw new InterviewApiError('Đặt lịch hàng loạt cần Backend nhóm PR #192–#200. Chưa có trong contract #191.', 501);
  }
}

export const interviewService = new InterviewService();
export default interviewService;
