import type {
  BatchCandidateScheduleItem,
  BatchInterviewScheduleSettings,
  CalculatedCandidateSlot,
  BatchScheduleValidationErrors,
  BatchSlotConflictInfo,
  InterviewSchedulePayload,
  InterviewerInfo,
} from '../types/interview';
import { areTimeSlotsOverlapping, calculateEndTime } from '../services/interviewService';

/**
 * Cộng thêm số phút vào chuỗi giờ HH:mm, trả về chuỗi giờ mới HH:mm
 */
export const addMinutesToTimeString = (timeStr: string, minutesToAdd: number): string => {
  if (!timeStr || !timeStr.includes(':')) {
    return '00:00';
  }

  const [hoursStr, minutesStr] = timeStr.split(':');
  const h = parseInt(hoursStr, 10);
  const m = parseInt(minutesStr, 10);

  if (isNaN(h) || isNaN(m)) {
    return '00:00';
  }

  const totalMinutes = h * 60 + m + minutesToAdd;
  const normalizedTotal = ((totalMinutes % 1440) + 1440) % 1440;

  const newH = Math.floor(normalizedTotal / 60);
  const newM = normalizedTotal % 60;

  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
};

/**
 * Tạo liên kết Google Meet mẫu phục vụ điền nhanh
 */
export const generateSampleMeetLink = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const randSegment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `https://meet.google.com/${randSegment(3)}-${randSegment(4)}-${randSegment(3)}`;
};

/**
 * Tính toán toàn bộ các ca phỏng vấn tự động tuần tự dựa trên thông số cấu hình:
 * - Giờ bắt đầu ca 1
 * - Thời lượng mỗi ca
 * - Thời gian nghỉ giãn cách giữa 2 ca liên tiếp
 */
export const calculateCandidateTimeSlots = (
  candidates: BatchCandidateScheduleItem[],
  settings: BatchInterviewScheduleSettings
): CalculatedCandidateSlot[] => {
  if (!candidates || candidates.length === 0) {
    return [];
  }

  const { interviewDate, startFirstSlotTime, durationMinutes, breakMinutes } = settings;
  const dateStr = interviewDate && interviewDate.trim() ? interviewDate.trim() : '2026-01-01';
  let currentStartTime =
    startFirstSlotTime && startFirstSlotTime.trim() ? startFirstSlotTime.trim() : '09:00';

  const duration = durationMinutes > 0 ? durationMinutes : 45;
  const bufferBreak = breakMinutes >= 0 ? breakMinutes : 0;

  return candidates.map((candidate, index) => {
    const slotNumber = index + 1;
    const startTime = currentStartTime;
    const endTime = addMinutesToTimeString(startTime, duration);

    // Tính chuỗi ISO
    const startIso = `${dateStr}T${startTime.length === 5 ? `${startTime}:00` : startTime}+07:00`;
    const startDate = new Date(startIso);
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

    const slot: CalculatedCandidateSlot = {
      candidate,
      slotNumber,
      startTime,
      endTime,
      startDateTimeISO: isNaN(startDate.getTime()) ? '' : startDate.toISOString(),
      endDateTimeISO: isNaN(endDate.getTime()) ? '' : endDate.toISOString(),
      durationMinutes: duration,
      breakAfterMinutes: index < candidates.length - 1 ? bufferBreak : 0,
    };

    // Chuẩn bị giờ bắt đầu cho ca tiếp theo: endTime + bufferBreak
    currentStartTime = addMinutesToTimeString(endTime, bufferBreak);

    return slot;
  });
};

/**
 * Tính tổng thời lượng của toàn bộ đợt phỏng vấn (tính bằng phút)
 */
export const calculateTotalBatchDurationMinutes = (
  candidateCount: number,
  durationMinutes: number,
  breakMinutes: number
): number => {
  if (candidateCount <= 0) return 0;
  const totalInterviewTime = candidateCount * durationMinutes;
  const totalBreakTime = Math.max(0, candidateCount - 1) * breakMinutes;
  return totalInterviewTime + totalBreakTime;
};

/**
 * Kiểm tra tính hợp lệ của dữ liệu cấu hình xếp lịch hàng loạt (Validation Logic - AC 3)
 */
export const validateBatchScheduleSettings = (
  candidates: BatchCandidateScheduleItem[],
  settings: BatchInterviewScheduleSettings,
  currentDate: Date = new Date()
): { isValid: boolean; errors: BatchScheduleValidationErrors } => {
  const errors: BatchScheduleValidationErrors = {};

  // 1. Kiểm tra danh sách ứng viên
  if (!candidates || candidates.length === 0) {
    errors.candidates = 'Danh sách ứng viên cần xếp lịch không được để trống.';
  }

  // 2. Kiểm tra ngày phỏng vấn
  if (!settings.interviewDate || !settings.interviewDate.trim()) {
    errors.interviewDate = 'Vui lòng chọn ngày phỏng vấn.';
  }

  // 3. Kiểm tra giờ bắt đầu ca đầu tiên
  if (!settings.startFirstSlotTime || !settings.startFirstSlotTime.trim()) {
    errors.startFirstSlotTime = 'Vui lòng chọn giờ bắt đầu ca đầu tiên.';
  }

  // 4. Kiểm tra ngày giờ có nằm trong quá khứ hay không (AC 3)
  if (
    settings.interviewDate &&
    settings.interviewDate.trim() &&
    settings.startFirstSlotTime &&
    settings.startFirstSlotTime.trim()
  ) {
    const formattedTime =
      settings.startFirstSlotTime.trim().length === 5
        ? `${settings.startFirstSlotTime.trim()}:00`
        : settings.startFirstSlotTime.trim();
    const scheduledIso = `${settings.interviewDate.trim()}T${formattedTime}+07:00`;
    const scheduledDateTime = new Date(scheduledIso);

    if (isNaN(scheduledDateTime.getTime())) {
      errors.interviewDate = 'Ngày giờ phỏng vấn đã chọn không hợp lệ.';
    } else {
      // Cho phép độ trễ nhỏ 1 phút để tránh lỗi race condition khi bấm gửi
      const thresholdTime = currentDate.getTime() - 60 * 1000;
      if (scheduledDateTime.getTime() < thresholdTime) {
        errors.startFirstSlotTime =
          'Thời gian bắt đầu ca đầu tiên không được ở thời điểm quá khứ (múi giờ GMT+7).';
      }
    }
  }

  // 5. Thời lượng mỗi ca phải > 0 (AC 3)
  if (!settings.durationMinutes || settings.durationMinutes <= 0) {
    errors.durationMinutes = 'Thời lượng mỗi ca phỏng vấn phải lớn hơn 0 phút.';
  }

  // 6. Thời gian nghỉ giãn cách không được âm
  if (settings.breakMinutes === undefined || settings.breakMinutes === null || settings.breakMinutes < 0) {
    errors.breakMinutes = 'Thời gian nghỉ giãn cách giữa 2 ca không được âm.';
  }

  // 7. Bắt buộc có ít nhất 1 người phỏng vấn (AC 3)
  if (!settings.interviewerIds || settings.interviewerIds.length === 0) {
    errors.interviewerIds = 'Bắt buộc chọn ít nhất 1 người phỏng vấn trong hội đồng.';
  }

  // 8. Phòng họp / Link phỏng vấn trực tuyến không được để trống (AC 2)
  if (!settings.locationOrLink || !settings.locationOrLink.trim()) {
    errors.locationOrLink =
      settings.format === 'ONLINE'
        ? 'Vui lòng cung cấp link họp trực tuyến (Google Meet, Zoom...).'
        : 'Vui lòng nhập tên phòng họp hoặc địa điểm phỏng vấn trực tiếp.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Đổi thứ tự ứng viên trong mảng (kéo thả hoặc hoán đổi vị trí)
 */
export const reorderCandidates = (
  list: BatchCandidateScheduleItem[],
  fromIndex: number,
  toIndex: number
): BatchCandidateScheduleItem[] => {
  if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) {
    return [...list];
  }

  const result = [...list];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
};

/**
 * Di chuyển ứng viên lên 1 vị trí
 */
export const moveCandidateUp = (
  list: BatchCandidateScheduleItem[],
  index: number
): BatchCandidateScheduleItem[] => {
  if (index <= 0 || index >= list.length) {
    return list;
  }
  return reorderCandidates(list, index, index - 1);
};

/**
 * Di chuyển ứng viên xuống 1 vị trí
 */
export const moveCandidateDown = (
  list: BatchCandidateScheduleItem[],
  index: number
): BatchCandidateScheduleItem[] => {
  if (index < 0 || index >= list.length - 1) {
    return list;
  }
  return reorderCandidates(list, index, index + 1);
};

/**
 * Xóa một ứng viên khỏi danh sách xếp lịch hàng loạt
 */
export const removeCandidateFromBatch = (
  list: BatchCandidateScheduleItem[],
  candidateId: string
): BatchCandidateScheduleItem[] => {
  return list.filter((item) => item.candidateId !== candidateId);
};

/**
 * Kiểm tra xem một ca phỏng vấn cụ thể có bị trùng lịch với bất kỳ lịch hẹn nào đã có trong hệ thống không (AC 2)
 */
export const checkSlotConflict = (
  slot: CalculatedCandidateSlot,
  interviewDate: string,
  interviewerIds: string[],
  existingInterviews: InterviewSchedulePayload[],
  format: 'ONLINE' | 'OFFLINE' = 'ONLINE',
  locationOrLink: string = '',
  allInterviewers: InterviewerInfo[] = []
): BatchSlotConflictInfo => {
  const proposedTimeStr = slot.startTime;
  const conflicts: string[] = [];
  const conflictingInterviewerNames: string[] = [];
  let conflictType: 'INTERVIEWER' | 'ROOM' | 'BOTH' | undefined = undefined;

  for (const existing of existingInterviews) {
    if (existing.status === 'CANCELLED') continue;
    const existingDate = existing.interviewDate;
    const existingTimeStr =
      existing.interviewTime ||
      (existing.startTime ? existing.startTime.split('T')[1]?.slice(0, 5) : '') ||
      '';

    if (existingDate !== interviewDate) continue;

    const isOverlapping = areTimeSlotsOverlapping(
      interviewDate,
      proposedTimeStr,
      slot.durationMinutes,
      existingDate,
      existingTimeStr,
      existing.durationMinutes
    );

    if (!isOverlapping) continue;

    const existingEndTime = calculateEndTime(existingTimeStr, existing.durationMinutes);

    // 1. Kiểm tra Người phỏng vấn bị trùng lịch
    for (const interviewerId of interviewerIds) {
      const isAssigned =
        (existing.interviewerIds && existing.interviewerIds.includes(interviewerId)) ||
        (existing.interviewers && existing.interviewers.some((i) => i.id === interviewerId));

      if (isAssigned) {
        const found =
          existing.interviewers?.find((i) => i.id === interviewerId) ||
          allInterviewers.find((i) => i.id === interviewerId);
        const name = found?.name || interviewerId;
        if (!conflictingInterviewerNames.includes(name)) {
          conflictingInterviewerNames.push(name);
        }
        conflicts.push(
          `Người phỏng vấn ${name} đã có lịch phỏng vấn với ứng viên ${existing.candidateName} (${existing.roundName || 'Phỏng vấn'}) từ ${existingTimeStr} đến ${existingEndTime}.`
        );
        conflictType = conflictType === 'ROOM' ? 'BOTH' : 'INTERVIEWER';
      }
    }

    // 2. Kiểm tra Phòng họp trực tiếp bị chiếm dụng
    if (
      format === 'OFFLINE' &&
      existing.format === 'OFFLINE' &&
      locationOrLink &&
      existing.locationOrLink
    ) {
      const normProposed = locationOrLink.trim().toLowerCase();
      const normExisting = existing.locationOrLink.trim().toLowerCase();

      if (
        normProposed === normExisting ||
        normProposed.includes(normExisting) ||
        normExisting.includes(normProposed)
      ) {
        conflicts.push(
          `Phòng họp "${locationOrLink}" đang bị chiếm dụng bởi buổi phỏng vấn của ứng viên ${existing.candidateName} từ ${existingTimeStr} đến ${existingEndTime}.`
        );
        conflictType = conflictType === 'INTERVIEWER' ? 'BOTH' : 'ROOM';
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflictingInterviewerNames,
    reasons: conflicts,
    conflictType,
  };
};

/**
 * Quét toàn bộ danh sách ca phỏng vấn để gán nhãn cảnh báo xung đột lịch (AC 2)
 */
export const annotateSlotsWithConflicts = (
  slots: CalculatedCandidateSlot[],
  settings: BatchInterviewScheduleSettings,
  existingInterviews: InterviewSchedulePayload[],
  allInterviewers: InterviewerInfo[] = []
): CalculatedCandidateSlot[] => {
  return slots.map((slot, index) => {
    // 1. Kiểm tra với lịch đã có trong hệ thống
    const systemConflict = checkSlotConflict(
      slot,
      settings.interviewDate,
      settings.interviewerIds,
      existingInterviews,
      settings.format,
      settings.locationOrLink,
      allInterviewers
    );

    // 2. Kiểm tra trùng lặp nội bộ trong chính danh sách batch (nếu người dùng chỉnh sửa giờ ca này đè lên ca khác)
    const internalReasons: string[] = [];
    for (let i = 0; i < slots.length; i++) {
      if (i === index) continue;
      const other = slots[i];
      const isOverlap = areTimeSlotsOverlapping(
        settings.interviewDate,
        slot.startTime,
        slot.durationMinutes,
        settings.interviewDate,
        other.startTime,
        other.durationMinutes
      );
      if (isOverlap) {
        internalReasons.push(
          `Khung giờ trùng lặp với Ca ${other.slotNumber} (${other.candidate.candidateName}) trong cùng buổi phỏng vấn này.`
        );
      }
    }

    const hasConflict = systemConflict.hasConflict || internalReasons.length > 0;
    const reasons = [...systemConflict.reasons, ...internalReasons];

    return {
      ...slot,
      conflict: {
        hasConflict,
        conflictingInterviewerNames: systemConflict.conflictingInterviewerNames,
        reasons,
        conflictType:
          systemConflict.conflictType || (internalReasons.length > 0 ? 'INTERVIEWER' : undefined),
      },
    };
  });
};

/**
 * Cập nhật thủ công khung giờ riêng cho một ca phỏng vấn cụ thể (AC 1)
 */
export const updateSingleSlotTime = (
  slot: CalculatedCandidateSlot,
  interviewDate: string,
  newStartTime: string,
  newDurationMinutes: number
): CalculatedCandidateSlot => {
  const duration = newDurationMinutes > 0 ? newDurationMinutes : slot.durationMinutes;
  const endTime = addMinutesToTimeString(newStartTime, duration);
  const startIso = `${interviewDate}T${newStartTime.length === 5 ? `${newStartTime}:00` : newStartTime}+07:00`;
  const startDate = new Date(startIso);
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

  return {
    ...slot,
    startTime: newStartTime,
    endTime,
    durationMinutes: duration,
    startDateTimeISO: isNaN(startDate.getTime()) ? '' : startDate.toISOString(),
    endDateTimeISO: isNaN(endDate.getTime()) ? '' : endDate.toISOString(),
    isCustomized: true,
  };
};

