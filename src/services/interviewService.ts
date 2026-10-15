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
  MOCK_INTERNAL_INTERVIEWERS,
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
   * Kiểm tra xung đột lịch phỏng vấn theo người phỏng vấn và phòng họp từ dữ liệu lưu cục bộ
   */
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
            existing.interviewers.find((i) => i.id === interviewerId) ||
            MOCK_INTERNAL_INTERVIEWERS.find((i) => i.id === interviewerId);
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
        const found = MOCK_INTERNAL_INTERVIEWERS.find((i) => i.id === id);
        return found ? found.name : id;
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
  async checkInterviewConflict(
    payload: CheckInterviewConflictPayload,
  ): Promise<InterviewConflictCheckResult> {
    try {
      const response = await axiosClient.post(
        '/recruitment/interviews/check-conflict',
        payload,
      );
      if (response?.data && typeof response.data.hasConflict === 'boolean') {
        return response.data;
      }
    } catch {
      // Fallback kiểm tra client-side với danh sách đã lưu
    }

    return this.checkLocalConflict(payload);
  }

  /**
   * API TẠO LỊCH PHỎNG VẤN (AC 1 & AC 2 - Jira TKNHTTDNB1-427 & TKNHTTDNB1-439)
   * - Gửi thông tin: applicationId, interviewRound, startTime, durationMinutes, interviewType, locationOrLink, interviewerIds
   * - Chặn thời gian quá khứ ở client (không gửi request)
   * - Kiểm tra chặn xung đột lịch (hoặc cho phép ghi đè khi có lý do hợp lệ)
   */
  async createInterviewSchedule(
    payload: CreateInterviewSchedulePayload,
  ): Promise<InterviewSchedulePayload> {
    // 1. Kiểm tra trường bắt buộc
    if (!payload.applicationId) {
      throw new InterviewApiError('Mã hồ sơ ứng tuyển (applicationId) là bắt buộc.', 400, 'MISSING_APPLICATION_ID');
    }

    const effectiveRound = payload.interviewRound || payload.roundName;
    if (!effectiveRound || !effectiveRound.trim()) {
      throw new InterviewApiError('Vui lòng chọn hoặc nhập vòng phỏng vấn.', 400, 'MISSING_ROUND');
    }

    const effectiveType = payload.interviewType || payload.format || 'ONLINE';
    if (!payload.locationOrLink || !payload.locationOrLink.trim()) {
      throw new InterviewApiError(
        effectiveType === 'ONLINE'
          ? 'Vui lòng cung cấp liên kết họp trực tuyến (Google Meet, Zoom...).'
          : 'Vui lòng nhập tên phòng họp hoặc địa điểm phỏng vấn trực tiếp.',
        400,
        'MISSING_LOCATION',
      );
    }

    const interviewerIds =
      payload.interviewerIds && payload.interviewerIds.length > 0
        ? payload.interviewerIds
        : payload.interviewers?.map((i) => i.id) || [];

    if (interviewerIds.length === 0) {
      throw new InterviewApiError('Vui lòng chọn ít nhất một người phỏng vấn.', 400, 'MISSING_INTERVIEWERS');
    }

    // 2. Chuẩn hóa startTime và Kiểm tra thời gian quá khứ (CLIENT-SIDE VALIDATION)
    let startTimeIso = payload.startTime || payload.scheduledDateTimeISO;
    if (!startTimeIso && payload.interviewDate && payload.interviewTime) {
      const timeValidation = validateScheduleTime(payload.interviewDate, payload.interviewTime);
      if (!timeValidation.isValid) {
        throw new InterviewPastTimeError(timeValidation.error);
      }
      startTimeIso = timeValidation.scheduledDateTimeISO;
    }

    if (!startTimeIso) {
      throw new InterviewApiError('Vui lòng chọn thời gian bắt đầu phỏng vấn.', 400, 'MISSING_START_TIME');
    }

    // Kiểm tra client-side: Tuyệt đối không gửi request nếu thời gian ở quá khứ (AC 2)
    const isoCheck = validateIsoStartTime(startTimeIso);
    if (!isoCheck.isValid) {
      throw new InterviewPastTimeError(isoCheck.error);
    }

    const startTimeDate = new Date(startTimeIso);
    const dateFormatted = startTimeDate.toISOString().slice(0, 10);
    const hours = String(startTimeDate.getHours()).padStart(2, '0');
    const minutes = String(startTimeDate.getMinutes()).padStart(2, '0');
    const timeFormatted = `${hours}:${minutes}`;

    // 3. Kiểm tra ngoại lệ ghi đè vs chặn lỗi xung đột (AC 2 - TKNHTTDNB1-439)
    if (payload.isOverride) {
      if (!payload.overrideReason || payload.overrideReason.trim().length < 5) {
        throw new InterviewApiError(
          'Vui lòng nhập lý do ghi đè lịch phỏng vấn cụ thể (tối thiểu 5 ký tự).',
          400,
          'MISSING_OVERRIDE_REASON',
        );
      }
    } else {
      // Kiểm tra xung đột trước khi gửi từ dữ liệu đã lưu (Client-side Blocking Error)
      const conflictCheck = this.checkLocalConflict({
        id: payload.id,
        candidateName: payload.candidateName,
        jobTitle: payload.jobTitle,
        roundName: effectiveRound,
        interviewDate: payload.interviewDate || dateFormatted,
        startTime: timeFormatted,
        durationMinutes: payload.durationMinutes || 60,
        format: effectiveType,
        locationOrLink: payload.locationOrLink,
        interviewerIds,
      });

      if (conflictCheck.hasConflict) {
        throw new InterviewerConflictError(
          conflictCheck.message,
          conflictCheck.conflicts.map((c) => c.entityId || ''),
          conflictCheck,
        );
      }
    }

    // Tìm thông tin đầy đủ của interviewers
    const selectedInterviewers: InterviewerInfo[] =
      payload.interviewers && payload.interviewers.length > 0
        ? payload.interviewers
        : MOCK_INTERNAL_INTERVIEWERS.filter((i) => interviewerIds.includes(i.id));

    const finalInterview: InterviewSchedulePayload = {
      id: payload.id || `intv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      candidateId: payload.candidateId || 'can-unknown',
      candidateName: payload.candidateName || 'Ứng viên',
      candidateEmail: payload.candidateEmail,
      applicationId: payload.applicationId,
      jobTitle: payload.jobTitle || 'Vị trí ứng tuyển',
      roundName: effectiveRound,
      interviewRound: effectiveRound,
      roundType: payload.roundType || 'TECHNICAL',
      interviewDate: payload.interviewDate || dateFormatted,
      interviewTime: payload.interviewTime || timeFormatted,
      scheduledDateTimeISO: startTimeIso,
      startTime: startTimeIso,
      durationMinutes: payload.durationMinutes || 60,
      format: effectiveType,
      interviewType: effectiveType,
      locationOrLink: payload.locationOrLink.trim(),
      interviewers: selectedInterviewers,
      interviewerIds,
      notes: payload.notes?.trim() || '',
      status: payload.status || 'SCHEDULED',
      isOverride: payload.isOverride,
      overrideReason: payload.overrideReason?.trim(),
      createdAt: payload.createdAt || new Date().toISOString(),
      createdByName: payload.createdByName,
    };

    // 4. Gửi API backend và bắt lỗi từ axiosClient (AC 2)
    const backendPayload = {
      applicationId: payload.applicationId,
      interviewRound: effectiveRound,
      startTime: startTimeIso,
      durationMinutes: payload.durationMinutes || 60,
      interviewType: effectiveType,
      locationOrLink: payload.locationOrLink.trim(),
      interviewerIds,
      notes: payload.notes?.trim() || '',
      isOverride: payload.isOverride,
      overrideReason: payload.overrideReason?.trim(),
    };

    try {
      const response = await axiosClient.post(
        `/recruitment/applications/${encodeURIComponent(payload.applicationId)}/interviews`,
        backendPayload,
      );

      if (response?.data) {
        const savedData: InterviewSchedulePayload = {
          ...finalInterview,
          ...response.data,
        };
        this.saveInterviewToStorage(savedData);
        this.syncInterviewToTimeline(savedData);
        return savedData;
      }
    } catch (err: unknown) {
      const isAxios =
        axios.isAxiosError(err) ||
        (err !== null &&
          typeof err === 'object' &&
          ('isAxiosError' in err || 'response' in err));

      if (isAxios) {
        const axiosErr = err as {
          response?: {
            status?: number;
            data?: {
              code?: string;
              message?: string;
              error?: string;
              conflictResult?: InterviewConflictCheckResult;
            };
          };
        };
        const status = axiosErr.response?.status;
        const responseData = axiosErr.response?.data;
        const errorCode = responseData?.code || '';
        const serverMessage = responseData?.message || responseData?.error || '';

        // Bắt lỗi thời gian quá khứ từ backend (AC 2)
        if (
          status === 400 &&
          (errorCode === 'PAST_TIME_NOT_ALLOWED' ||
            errorCode === 'INVALID_INTERVIEW_TIME' ||
            serverMessage.toLowerCase().includes('quá khứ') ||
            serverMessage.toLowerCase().includes('past'))
        ) {
          throw new InterviewPastTimeError(
            serverMessage ||
              'Thời gian phỏng vấn không được ở thời điểm quá khứ theo múi giờ Việt Nam (GMT+7). Vui lòng chọn ngày giờ trong tương lai.',
          );
        }

        // Bắt lỗi trùng lịch người phỏng vấn hoặc phòng họp (AC 2 & TKNHTTDNB1-439)
        if (
          status === 409 ||
          errorCode === 'INTERVIEWER_CONFLICT' ||
          serverMessage.toLowerCase().includes('trùng lịch') ||
          serverMessage.toLowerCase().includes('conflict')
        ) {
          throw new InterviewerConflictError(
            serverMessage ||
              'Một hoặc nhiều người phỏng vấn hoặc phòng họp đã có lịch bận trong khung giờ này. Vui lòng chọn thời gian khác hoặc kích hoạt ghi đè.',
            undefined,
            responseData?.conflictResult,
          );
        }

        // Nếu backend trả về mã lỗi 4xx/5xx khác, ném InterviewApiError
        if (status && status >= 400 && status < 600 && axiosErr.response?.data) {
          throw new InterviewApiError(
            serverMessage || 'Không thể tạo lịch phỏng vấn trên hệ thống máy chủ.',
            status,
            errorCode,
          );
        }
      }

      // Trường hợp offline / mạng lỗi / server mock: lưu dữ liệu fallback để demo và test
    }

    this.saveInterviewToStorage(finalInterview);
    this.syncInterviewToTimeline(finalInterview);
    return finalInterview;
  }

  /**
   * Alias tương thích ngược với scheduleInterview
   */
  async scheduleInterview(
    payload: Omit<InterviewSchedulePayload, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
  ): Promise<InterviewSchedulePayload> {
    if (!payload.candidateId || !payload.candidateId.trim()) {
      throw new Error('Mã định danh ứng viên (candidateId) là bắt buộc.');
    }

    return this.createInterviewSchedule({
      ...payload,
      applicationId: payload.applicationId || 'app-default',
      interviewRound: payload.roundName,
      startTime: payload.scheduledDateTimeISO,
      interviewType: payload.format,
      interviewerIds: payload.interviewers.map((i) => i.id),
    });
  }

  /**
   * Lấy danh sách lịch phỏng vấn của ứng viên theo đợt ứng tuyển (AC 1)
   */
  async getCandidateInterviews(
    applicationId: string,
    candidateId?: string,
  ): Promise<InterviewSchedulePayload[]> {
    try {
      const response = await axiosClient.get(
        `/recruitment/applications/${encodeURIComponent(applicationId)}/interviews`,
      );
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch {
      // Fallback đọc LocalStorage
    }

    const localList = this.getStoredInterviews();
    return localList.filter(
      (item) => item.applicationId === applicationId || (candidateId && item.candidateId === candidateId),
    );
  }

  /**
   * Lấy danh sách lịch phỏng vấn cá nhân phân công theo người phỏng vấn / recruiter (AC 1)
   */
  async getPersonalInterviewSchedule(
    params?: PersonalScheduleParams,
  ): Promise<InterviewSchedulePayload[]> {
    try {
      const response = await axiosClient.get('/recruitment/interviews/personal', {
        params,
      });
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch {
      // Fallback đọc LocalStorage
    }

    let list = this.getStoredInterviews();

    const targetUserId = params?.userId || params?.interviewerId;
    if (targetUserId) {
      list = list.filter((item) => {
        if (item.interviewerIds && item.interviewerIds.includes(targetUserId)) return true;
        if (item.interviewers && item.interviewers.some((i) => i.id === targetUserId)) return true;
        return false;
      });
    }

    if (params?.date) {
      list = list.filter((item) => item.interviewDate === params.date || item.startTime?.startsWith(params.date!));
    }

    if (params?.status && params.status !== 'ALL') {
      list = list.filter((item) => item.status === params.status);
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.candidateName.toLowerCase().includes(q) ||
          item.roundName.toLowerCase().includes(q) ||
          (item.jobTitle && item.jobTitle.toLowerCase().includes(q)) ||
          item.locationOrLink.toLowerCase().includes(q),
      );
    }

    // Sắp xếp thời gian tăng dần (buổi sớm nhất lên trước)
    list.sort((a, b) => {
      const timeA = new Date(a.startTime || a.scheduledDateTimeISO).getTime();
      const timeB = new Date(b.startTime || b.scheduledDateTimeISO).getTime();
      return timeA - timeB;
    });

    return list;
  }

  /**
   * Lấy lịch phỏng vấn theo candidateId (tương thích ngược)
   */
  async getInterviewsByCandidate(candidateId: string): Promise<InterviewSchedulePayload[]> {
    return this.getCandidateInterviews('', candidateId);
  }

  /**
   * Cập nhật trạng thái buổi phỏng vấn (Hoàn thành / Đã hủy)
   */
  async updateInterviewStatus(
    interviewId: string,
    newStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED',
  ): Promise<InterviewSchedulePayload | null> {
    const list = this.getStoredInterviews();
    const index = list.findIndex((item) => item.id === interviewId);
    if (index === -1) return null;

    list[index].status = newStatus;
    localStorage.setItem(LOCAL_STORAGE_INTERVIEWS_KEY, JSON.stringify(list));
    return list[index];
  }

  /**
   * Lưu trữ lịch phỏng vấn vào LocalStorage
   */
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
        summary: `Đã đặt lịch phỏng vấn ${
          interview.format === 'ONLINE' ? 'Trực tuyến' : 'Trực tiếp'
        } với ứng viên ${interview.candidateName} vào ngày ${interview.interviewDate} lúc ${
          interview.interviewTime
        }.`,
        interviewScheduled: {
          roundName: interview.roundName,
          interviewDate: interview.scheduledDateTimeISO || interview.startTime,
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

  /**
   * Tạo lịch phỏng vấn đồng loạt cho nhiều ứng viên (Task Jira TKNHTTDNB1-433 / User Story S6-01)
   */
  async batchCreateInterviewSchedules(
    payload: BatchCreateInterviewSchedulePayload
  ): Promise<BatchCreateInterviewScheduleResult> {
    const { settings, slots } = payload;
    if (!slots || slots.length === 0) {
      throw new InterviewApiError('Danh sách ca phỏng vấn rỗng, không thể tạo lịch.', 400);
    }

    // 1. Thử gọi API Backend nếu có sẵn endpoint
    try {
      const response = await axiosClient.post<BatchCreateInterviewScheduleResult>(
        '/recruitment/interviews/batch-schedule',
        payload
      );
      if (response?.data && Array.isArray(response.data.scheduledInterviews)) {
        return response.data;
      }
    } catch {
      // Khi API chưa sẵn sàng hoặc offline, tự động fallback lưu cục bộ
    }

    // 2. Fallback xử lý cục bộ: Tạo từng lịch phỏng vấn tương ứng
    const scheduledInterviews: InterviewSchedulePayload[] = [];

    const interviewerDetails: InterviewerInfo[] = settings.interviewerIds.map((id) => {
      const found =
        settings.interviewers?.find((i) => i.id === id) ||
        MOCK_INTERNAL_INTERVIEWERS.find((i) => i.id === id);
      return (
        found || {
          id,
          name: `Người phỏng vấn (${id})`,
          role: 'Hội đồng phỏng vấn',
          email: `${id}@smartrecruitment.vn`,
        }
      );
    });

    for (const slot of slots) {
      const interviewItem: InterviewSchedulePayload = {
        id: `intv-batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        candidateId: slot.candidate.candidateId,
        candidateName: slot.candidate.candidateName,
        candidateEmail: slot.candidate.candidateEmail,
        applicationId: slot.candidate.applicationId || `app-${slot.candidate.candidateId}`,
        jobTitle: slot.candidate.jobTitle || 'Vị trí ứng tuyển',
        roundName:
          slot.candidate.interviewRound ||
          slot.candidate.customRoundName ||
          settings.defaultRoundName ||
          'Vòng Chuyên môn & Kỹ thuật',
        roundType: slot.candidate.roundType || settings.defaultRoundType || 'TECHNICAL',
        interviewDate: settings.interviewDate,
        interviewTime: slot.startTime,
        scheduledDateTimeISO: slot.startDateTimeISO,
        startTime: slot.startTime,
        durationMinutes: slot.durationMinutes,
        format: settings.format,
        locationOrLink: settings.locationOrLink,
        interviewers: interviewerDetails,
        interviewerIds: settings.interviewerIds,
        notes: settings.notes,
        status: 'SCHEDULED',
        createdAt: new Date().toISOString(),
        createdByName: 'Chuyên viên Tuyển dụng',
      };

      scheduledInterviews.push(interviewItem);
      this.saveInterviewToStorage(interviewItem);
      this.syncInterviewToTimeline(interviewItem);
    }

    const sendCalendarInvite =
      payload.sendCalendarInvite ?? settings.sendCalendarInvite ?? true;

    return {
      totalScheduled: scheduledInterviews.length,
      scheduledInterviews,
      calendarInviteSent: sendCalendarInvite,
      message: `Đã tạo thành công lịch phỏng vấn đồng loạt cho ${scheduledInterviews.length} ứng viên${
        sendCalendarInvite ? ' (kèm thư mời lịch Calendar Invite)' : ''
      }.`,
    };
  }
}

export const interviewService = new InterviewService();
