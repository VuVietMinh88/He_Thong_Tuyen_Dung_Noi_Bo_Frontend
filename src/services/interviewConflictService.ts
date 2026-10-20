import axios from 'axios';
import { interviewService, validateIsoStartTime } from './interviewService';
import type { OverrideInterviewPayload, InterviewSchedulePayload } from '../types/interview';
import { InterviewConflictValidationError, InterviewConflictForbiddenError,
  InterviewConflictUnauthorizedError, InterviewPastTimeError } from '../types/interview';

class InterviewConflictService {
  getOverrideHistory(): InterviewSchedulePayload[] {
    throw new Error('Lịch sử ghi đè phải được đọc từ Backend, không dùng nhật ký local.');
  }
  async overrideInterviewConflict(payload: OverrideInterviewPayload): Promise<InterviewSchedulePayload> {
    if (!payload.overrideReason?.trim()) throw new InterviewConflictValidationError('Cần nhập lý do ghi đè xung đột.');
    const time = validateIsoStartTime(payload.startTime);
    if (!time.isValid) throw new InterviewPastTimeError(time.error);
    try {
      return await interviewService.createInterviewSchedule({ ...payload,
        interviewRound: payload.interviewRound || payload.roundName || '',
        interviewType: payload.interviewType || payload.format || 'ONLINE',
        isOverride: true, overrideReason: payload.overrideReason.trim() });
    } catch (cause) {
      if (axios.isAxiosError(cause)) {
        if (cause.response?.status === 403) throw new InterviewConflictForbiddenError(cause.response.data?.message);
        if (cause.response?.status === 401) throw new InterviewConflictUnauthorizedError(cause.response.data?.message);
      }
      throw cause;
    }
  }
}
export const interviewConflictService = new InterviewConflictService();
export default interviewConflictService;
