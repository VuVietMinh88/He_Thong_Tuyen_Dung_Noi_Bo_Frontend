import { interviewService, validateIsoStartTime } from './interviewService';
import type { OverrideInterviewPayload, InterviewSchedulePayload } from '../types/interview';
import { InterviewConflictValidationError, InterviewConflictForbiddenError,
  InterviewConflictUnauthorizedError, InterviewPastTimeError, InterviewApiError } from '../types/interview';

class InterviewConflictService {
  getOverrideHistory(): InterviewSchedulePayload[] {
    throw new Error('Lịch sử ghi đè phải được đọc từ Backend, không dùng nhật ký local.');
  }
  async overrideInterviewConflict(payload: OverrideInterviewPayload): Promise<InterviewSchedulePayload> {
    if (!payload.applicationId?.trim()) throw new InterviewConflictValidationError('Thiếu applicationId.');
    if (!payload.overrideReason?.trim()) throw new InterviewConflictValidationError('Lý do ghi đè không được để trống.');
    const time = validateIsoStartTime(payload.startTime);
    if (!time.isValid) throw new InterviewPastTimeError(time.error);
    try {
      return await interviewService.createInterviewSchedule({ ...payload,
        interviewRound: payload.interviewRound || payload.roundName || '',
        interviewType: payload.interviewType || payload.format || 'ONLINE',
        isOverride: true, overrideReason: payload.overrideReason.trim() });
    } catch (cause) {
      if (cause instanceof InterviewApiError) {
        if (cause.statusCode === 403) throw new InterviewConflictForbiddenError(cause.message);
        if (cause.statusCode === 401) throw new InterviewConflictUnauthorizedError(cause.message);
        if (cause.statusCode === 400) throw new InterviewConflictValidationError(cause.message);
      }
      throw cause;
    }
  }
}
export const interviewConflictService = new InterviewConflictService();
export default interviewConflictService;
