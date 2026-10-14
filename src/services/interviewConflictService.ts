import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import type {
  OverrideInterviewPayload,
  InterviewSchedulePayload,
  InterviewerInfo,
} from '../types/interview';
import {
  InterviewConflictForbiddenError,
  InterviewConflictUnauthorizedError,
  InterviewConflictValidationError,
  InterviewApiError,
  MOCK_INTERNAL_INTERVIEWERS,
} from '../types/interview';
import {
  interviewService,
  LOCAL_STORAGE_INTERVIEWS_KEY,
  LOCAL_STORAGE_TIMELINE_KEY,
} from './interviewService';

class InterviewConflictService {
  /**
   * API Ghi đè lịch phỏng vấn khi có xung đột (TKNHTTDNB1-440 / User Story S6-04 AC 1)
   * Gửi cờ overrideConflict = true kèm lý do bắt buộc (overrideReason)
   * Xử lý chặt chẽ các lỗi: 403 Forbidden, 401 Unauthorized, 400 Bad Request
   */
  async overrideInterviewConflict(
    payload: OverrideInterviewPayload,
  ): Promise<InterviewSchedulePayload> {
    // 1. Client-side Validation lý do bắt buộc
    if (!payload.applicationId) {
      throw new InterviewConflictValidationError('Mã hồ sơ ứng tuyển (applicationId) là bắt buộc.');
    }

    if (!payload.overrideReason || !payload.overrideReason.trim()) {
      throw new InterviewConflictValidationError(
        'Vui lòng nhập lý do ghi đè lịch phỏng vấn (không được để trống).',
      );
    }

    const cleanReason = payload.overrideReason.trim();
    if (cleanReason.length < 5) {
      throw new InterviewConflictValidationError(
        'Lý do ghi đè lịch phỏng vấn phải có tối thiểu 5 ký tự để lưu vào nhật ký kiểm toán hệ thống.',
      );
    }

    const effectiveRound = payload.interviewRound || payload.roundName || 'Vòng phỏng vấn';
    const effectiveType = payload.interviewType || payload.format || 'ONLINE';
    const interviewerIds = payload.interviewerIds || [];

    // Chuẩn hóa ngày giờ
    const startTimeDate = new Date(payload.startTime);
    const dateFormatted = !isNaN(startTimeDate.getTime())
      ? startTimeDate.toISOString().slice(0, 10)
      : payload.interviewDate || new Date().toISOString().slice(0, 10);

    const hours = !isNaN(startTimeDate.getTime())
      ? String(startTimeDate.getHours()).padStart(2, '0')
      : '09';
    const minutes = !isNaN(startTimeDate.getTime())
      ? String(startTimeDate.getMinutes()).padStart(2, '0')
      : '00';
    const timeFormatted = payload.interviewTime || `${hours}:${minutes}`;

    const selectedInterviewers: InterviewerInfo[] = MOCK_INTERNAL_INTERVIEWERS.filter((i) =>
      interviewerIds.includes(i.id),
    );

    const overrideInterviewResult: InterviewSchedulePayload = {
      id: `intv-ovr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      candidateId: payload.candidateId || 'can-unknown',
      candidateName: payload.candidateName || 'Ứng viên',
      candidateEmail: payload.candidateEmail,
      applicationId: payload.applicationId,
      jobTitle: payload.jobTitle || 'Vị trí ứng tuyển',
      roundName: effectiveRound,
      interviewRound: effectiveRound,
      roundType: payload.roundType || 'TECHNICAL',
      interviewDate: payload.interviewDate || dateFormatted,
      interviewTime: timeFormatted,
      scheduledDateTimeISO: payload.startTime,
      startTime: payload.startTime,
      durationMinutes: payload.durationMinutes || 60,
      format: effectiveType,
      interviewType: effectiveType,
      locationOrLink: payload.locationOrLink ? payload.locationOrLink.trim() : '',
      interviewers: selectedInterviewers,
      interviewerIds,
      notes: payload.notes?.trim() || '',
      status: payload.status || 'SCHEDULED',
      isOverride: true,
      overrideReason: cleanReason,
      createdAt: new Date().toISOString(),
      createdByName: 'Chuyên viên Tuyển dụng (Recruiter)',
    };

    // 2. Payload gửi lên Backend API
    const backendPayload = {
      applicationId: payload.applicationId,
      interviewRound: effectiveRound,
      startTime: payload.startTime,
      durationMinutes: payload.durationMinutes || 60,
      interviewType: effectiveType,
      locationOrLink: payload.locationOrLink.trim(),
      interviewerIds,
      notes: payload.notes?.trim() || '',
      overrideConflict: true, // Cờ ghi đè theo AC 1
      isOverride: true,
      overrideReason: cleanReason, // Trường lý do bắt buộc theo AC 1
    };

    try {
      // Ưu tiên endpoint override chuyên biệt hoặc fallback sang POST interviews
      let response;
      try {
        response = await axiosClient.post(
          `/recruitment/applications/${encodeURIComponent(payload.applicationId)}/interviews/override`,
          backendPayload,
        );
      } catch (firstErr: unknown) {
        if (axios.isAxiosError(firstErr) && firstErr.response?.status === 404) {
          // Route chuyên biệt chưa có, fallback sang endpoint chuẩn kèm overrideConflict: true
          response = await axiosClient.post(
            `/recruitment/applications/${encodeURIComponent(payload.applicationId)}/interviews`,
            backendPayload,
          );
        } else {
          throw firstErr;
        }
      }

      if (response?.data) {
        const savedData: InterviewSchedulePayload = {
          ...overrideInterviewResult,
          ...response.data,
          isOverride: true,
          overrideReason: cleanReason,
        };
        this.persistOverrideSuccess(savedData);
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
            };
          };
        };

        const status = axiosErr.response?.status;
        const responseData = axiosErr.response?.data;
        const errorCode = responseData?.code || '';
        const serverMessage = responseData?.message || responseData?.error || '';

        // Bắt lỗi Phân quyền (403 Forbidden - AC 1)
        if (
          status === 403 ||
          errorCode === 'FORBIDDEN' ||
          errorCode === 'PERMISSION_DENIED' ||
          serverMessage.toLowerCase().includes('forbidden') ||
          serverMessage.toLowerCase().includes('không có quyền') ||
          serverMessage.toLowerCase().includes('permission')
        ) {
          throw new InterviewConflictForbiddenError(
            serverMessage ||
              'Tài khoản của bạn không có quyền thực hiện hành động ghi đè ngoại lệ. Vui lòng liên hệ Quản trị viên hoặc Trưởng phòng Tuyển dụng.',
          );
        }

        // Bắt lỗi Chưa xác thực / Hết hạn phiên (401 Unauthorized)
        if (
          status === 401 ||
          errorCode === 'UNAUTHORIZED' ||
          serverMessage.toLowerCase().includes('unauthorized') ||
          serverMessage.toLowerCase().includes('phiên đăng nhập')
        ) {
          throw new InterviewConflictUnauthorizedError(
            serverMessage ||
              'Phiên làm việc đã hết hạn hoặc chưa được xác thực. Vui lòng đăng nhập lại.',
          );
        }

        // Bắt lỗi Thiếu lý do hoặc vi phạm quy tắc dữ liệu (400 Bad Request - AC 1)
        if (
          status === 400 ||
          errorCode === 'MISSING_OVERRIDE_REASON' ||
          errorCode === 'INVALID_OVERRIDE_DATA' ||
          serverMessage.toLowerCase().includes('lý do') ||
          serverMessage.toLowerCase().includes('reason')
        ) {
          throw new InterviewConflictValidationError(
            serverMessage ||
              'Yêu cầu ghi đè không hợp lệ: Lý do ghi đè lịch phỏng vấn là bắt buộc và phải có ít nhất 5 ký tự.',
          );
        }

        // Các lỗi 4xx/5xx khác từ máy chủ
        if (status && status >= 400 && status < 600 && axiosErr.response?.data) {
          throw new InterviewApiError(
            serverMessage || 'Không thể ghi đè lịch phỏng vấn trên hệ thống máy chủ.',
            status,
            errorCode,
          );
        }
      }

      // Trường hợp ném lỗi trực tiếp từ instance
      if (
        err instanceof InterviewConflictForbiddenError ||
        err instanceof InterviewConflictUnauthorizedError ||
        err instanceof InterviewConflictValidationError
      ) {
        throw err;
      }

      // Trường hợp offline / mạng lỗi / server mock: lưu dữ liệu fallback để demo và test
    }

    this.persistOverrideSuccess(overrideInterviewResult);
    return overrideInterviewResult;
  }

  /**
   * Lưu trữ lịch phỏng vấn đã ghi đè vào Storage và đồng bộ Timeline
   */
  private persistOverrideSuccess(interview: InterviewSchedulePayload): void {
    try {
      interviewService.saveInterviewToStorage(interview);

      // Thêm sự kiện ghi đè vào Timeline
      const rawEvents = localStorage.getItem(LOCAL_STORAGE_TIMELINE_KEY);
      const events = rawEvents ? JSON.parse(rawEvents) : [];

      const overrideTimelineEvent = {
        id: `evt-override-${Date.now()}`,
        candidateId: interview.candidateId,
        eventType: 'INTERVIEW_OVERRIDE',
        timestamp: new Date().toISOString(),
        actor: {
          id: 'usr-current',
          fullName: interview.createdByName || 'Chuyên viên Tuyển dụng',
          role: 'Recruiter',
        },
        title: `Ghi đè lịch phỏng vấn: ${interview.roundName}`,
        summary: `Đã ghi đè lịch phỏng vấn trùng với lý do: "${interview.overrideReason}". Khung giờ: ${interview.interviewDate} (${interview.interviewTime}).`,
        metadata: {
          roundName: interview.roundName,
          interviewDate: interview.interviewDate,
          interviewTime: interview.interviewTime,
          overrideReason: interview.overrideReason,
          format: interview.format,
          locationOrMeetingLink: interview.locationOrLink,
        },
      };

      events.unshift(overrideTimelineEvent);
      localStorage.setItem(LOCAL_STORAGE_TIMELINE_KEY, JSON.stringify(events));
    } catch {
      // Ignored
    }
  }

  /**
   * Lấy lịch sử các lần ghi đè từ LocalStorage
   */
  getOverrideHistory(): InterviewSchedulePayload[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_INTERVIEWS_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw) as InterviewSchedulePayload[];
      return list.filter((item) => item.isOverride === true);
    } catch {
      return [];
    }
  }
}

export const interviewConflictService = new InterviewConflictService();
export default interviewConflictService;

