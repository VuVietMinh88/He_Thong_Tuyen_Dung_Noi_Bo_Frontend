import type {
  BatchCandidateScheduleItem,
  BatchInterviewScheduleSettings,
  CalculatedCandidateSlot,
  BatchScheduleValidationErrors,
} from '../types/interview';

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
