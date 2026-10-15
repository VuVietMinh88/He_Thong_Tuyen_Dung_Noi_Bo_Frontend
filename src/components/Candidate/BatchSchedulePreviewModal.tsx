import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowLeft,
  CalendarCheck,
  Clock,
  Video,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Calendar,
  Edit2,
  Check,
  RotateCcw,
  Sparkles,
  Loader2,
  Users,
} from 'lucide-react';
import type {
  BatchInterviewScheduleSettings,
  CalculatedCandidateSlot,
  BatchCreateInterviewScheduleResult,
  InterviewSchedulePayload,
  InterviewerInfo,
} from '../../types/interview';
import { MOCK_INTERNAL_INTERVIEWERS } from '../../types/interview';
import { interviewService } from '../../services/interviewService';
import {
  annotateSlotsWithConflicts,
  updateSingleSlotTime,
} from '../../utils/batchInterviewHelper';
import { toast, ToastContext } from '../notifications';

export interface BatchSchedulePreviewModalProps {
  isOpen: boolean;
  settings: BatchInterviewScheduleSettings;
  initialSlots: CalculatedCandidateSlot[];
  onBack: () => void;
  onClose: () => void;
  onSuccess: (result: BatchCreateInterviewScheduleResult) => void;
}

export const BatchSchedulePreviewModal: React.FC<BatchSchedulePreviewModalProps> = ({
  isOpen,
  settings,
  initialSlots,
  onBack,
  onClose,
  onSuccess,
}) => {
  const toastContext = React.useContext(ToastContext);

  // Danh sách các ca phỏng vấn (có thể chỉnh sửa thủ công từng ca)
  const [slots, setSlots] = useState<CalculatedCandidateSlot[]>(() => initialSlots);

  // Danh sách các buổi phỏng vấn hiện có trong hệ thống để đối soát xung đột
  const [existingInterviews, setExistingInterviews] = useState<InterviewSchedulePayload[]>(
    () => interviewService.getStoredInterviews()
  );
  const [allInterviewers, setAllInterviewers] = useState<InterviewerInfo[]>(MOCK_INTERNAL_INTERVIEWERS);

  // Tùy chọn gửi thư mời lịch (Calendar Invite) - AC 3
  const [sendCalendarInvite, setSendCalendarInvite] = useState<boolean>(true);

  // Trạng thái chỉnh sửa thủ công cho từng ca
  const [editingSlotNumber, setEditingSlotNumber] = useState<number | null>(null);
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editDuration, setEditDuration] = useState<number>(45);

  // Trạng thái xử lý gửi API
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Tải danh sách lịch phỏng vấn hiện tại để phát hiện xung đột (AC 2)
  useEffect(() => {
    let isSubscribed = true;
    const loadExistingData = async () => {
      try {
        const stored = interviewService.getStoredInterviews();
        const interviewers = await interviewService.getInternalInterviewers();
        if (isSubscribed) {
          setExistingInterviews(stored);
          if (interviewers && interviewers.length > 0) {
            setAllInterviewers(interviewers);
          }
        }
      } catch {
        // Fallback dùng mock
      }
    };

    if (isOpen) {
      loadExistingData();
    }

    return () => {
      isSubscribed = false;
    };
  }, [isOpen]);

  // Đồng bộ lại slots khi initialSlots thay đổi
  useEffect(() => {
    setSlots(initialSlots);
    setEditingSlotNumber(null);
  }, [initialSlots]);

  // Tính toán và gán nhãn xung đột lịch cho từng ca
  const annotatedSlots = useMemo(() => {
    return annotateSlotsWithConflicts(slots, settings, existingInterviews, allInterviewers);
  }, [slots, settings, existingInterviews, allInterviewers]);

  // Đếm số ca bị trùng lịch
  const conflictCount = useMemo(() => {
    return annotatedSlots.filter((slot) => slot.conflict?.hasConflict).length;
  }, [annotatedSlots]);

  // Bắt đầu chỉnh sửa thủ công 1 ca (AC 1)
  const handleStartEditSlot = (slot: CalculatedCandidateSlot) => {
    setEditingSlotNumber(slot.slotNumber);
    setEditStartTime(slot.startTime);
    setEditDuration(slot.durationMinutes);
  };

  // Lưu chỉnh sửa khung giờ riêng của ca (AC 1)
  const handleSaveSlotEdit = (slotNumber: number) => {
    if (!editStartTime || !editStartTime.includes(':')) {
      toast.error('Vui lòng nhập giờ bắt đầu hợp lệ (HH:mm)');
      return;
    }

    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.slotNumber === slotNumber) {
          return updateSingleSlotTime(
            slot,
            settings.interviewDate,
            editStartTime,
            editDuration > 0 ? editDuration : 45
          );
        }
        return slot;
      })
    );

    setEditingSlotNumber(null);
  };

  // Khôi phục ca về thông số ban đầu
  const handleResetSlotToOriginal = (slotNumber: number) => {
    const original = initialSlots.find((s) => s.slotNumber === slotNumber);
    if (original) {
      setSlots((prev) =>
        prev.map((s) => (s.slotNumber === slotNumber ? { ...original, isCustomized: false } : s))
      );
    }
    setEditingSlotNumber(null);
  };

  // Xác nhận tạo lịch phỏng vấn hàng loạt qua API (AC 3 & AC 4)
  const handleConfirmBatchSchedule = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        settings: {
          ...settings,
          sendCalendarInvite,
        },
        slots: annotatedSlots,
        sendCalendarInvite,
      };

      const result = await interviewService.batchCreateInterviewSchedules(payload);

      const successMsg = `Đã tạo thành công ${result.totalScheduled} lịch phỏng vấn${
        sendCalendarInvite ? ' và tự động gửi thư mời Calendar Invite' : ''
      }!`;

      if (toastContext?.notify) {
        toastContext.notify(successMsg, 'success');
      } else {
        toast.success(successMsg);
      }

      onSuccess(result);
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error
          ? err.message
          : 'Có lỗi xảy ra trong quá trình tạo lịch phỏng vấn hàng loạt.';
      if (toastContext?.notify) {
        toastContext.notify(errMsg, 'error');
      } else {
        toast.error(errMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-preview-modal-title"
      data-testid="batch-schedule-preview-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-xs"
    >
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 dark:border-gray-800 dark:bg-gray-900">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="btn-back-to-config"
              onClick={onBack}
              disabled={isSubmitting}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-750"
              title="Quay lại cấu hình thông số"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2
                id="batch-preview-modal-title"
                className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"
              >
                <span>Xem trước & Xác nhận lịch phỏng vấn hàng loạt</span>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-800">
                  {`${annotatedSlots.length} ca phỏng vấn`}
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span>
                    Ngày phỏng vấn: <strong className="text-gray-700 dark:text-gray-300">{settings.interviewDate}</strong>
                  </span>
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  {settings.format === 'ONLINE' ? (
                    <Video className="h-3.5 w-3.5 text-indigo-500" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                  )}
                  <span>
                    Hình thức: <strong className="text-gray-700 dark:text-gray-300">
                      {settings.format === 'ONLINE' ? 'Trực tuyến (Online)' : 'Trực tiếp (Offline)'}
                    </strong>
                  </span>
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="btn-close-preview-modal"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thân Modal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Banner Thông báo trạng thái xung đột (AC 2) */}
          {conflictCount > 0 ? (
            <div
              data-testid="conflict-alert-banner"
              className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-rose-900 shadow-2xs dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-200"
            >
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <h4 className="font-bold text-rose-800 dark:text-rose-300 text-sm">
                  {`Cảnh báo: Phát hiện ${conflictCount} ca phỏng vấn bị trùng lịch!`}
                </h4>
                <p className="mt-1 text-rose-700 dark:text-rose-300/90 leading-relaxed">
                  Một số người phỏng vấn trong hội đồng đã có lịch hẹn hoặc cuộc phỏng vấn khác trùng khung giờ.
                  Bạn có thể bấm nút <strong>"Chỉnh sửa ca"</strong> bên dưới để đổi khung giờ riêng cho từng ca, hoặc quay lại điều chỉnh giãn cách ca.
                </p>
              </div>
            </div>
          ) : (
            <div
              data-testid="no-conflict-banner"
              className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 text-xs"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong>{`Tất cả ${annotatedSlots.length} ca phỏng vấn đều hợp lệ.`}</strong> Không có xung đột lịch với người phỏng vấn hoặc phòng họp.
              </span>
            </div>
          )}

          {/* Danh sách Timeline các ca phỏng vấn (AC 1 & AC 2) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
              <span className="font-semibold uppercase tracking-wider">
                Lịch trình chi tiết từng ca phỏng vấn
              </span>
              <span className="inline-flex items-center gap-1">
                {settings.format === 'ONLINE' ? (
                  <Video className="h-3.5 w-3.5 text-indigo-500" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                )}
                <span>
                  Phòng / Đường link: <strong className="text-gray-700 dark:text-gray-300">{settings.locationOrLink}</strong>
                </span>
              </span>
            </div>

            <div className="space-y-2.5">
              {annotatedSlots.map((slot) => {
                const hasConflict = Boolean(slot.conflict?.hasConflict);
                const isEditing = editingSlotNumber === slot.slotNumber;

                return (
                  <div
                    key={slot.slotNumber}
                    data-testid={`preview-slot-card-${slot.slotNumber}`}
                    className={`rounded-xl border p-4 transition-all ${
                      hasConflict
                        ? 'border-rose-400 bg-rose-50/50 shadow-xs dark:border-rose-800 dark:bg-rose-950/30 ring-1 ring-rose-400/30'
                        : slot.isCustomized
                        ? 'border-indigo-300 bg-indigo-50/40 dark:border-indigo-800 dark:bg-indigo-950/20'
                        : 'border-gray-200 bg-white shadow-2xs hover:border-gray-300 dark:border-gray-800 dark:bg-gray-800/80'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Cột 1: Thông tin Ca & Giờ phỏng vấn */}
                      <div className="flex items-start sm:items-center gap-3">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                            hasConflict
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'
                          }`}
                        >
                          {slot.slotNumber}
                        </span>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-900 dark:text-white">
                              <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span>{`${slot.startTime} - ${slot.endTime}`}</span>
                            </span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">
                              {`(${slot.durationMinutes} phút)`}
                            </span>

                            {/* Badge đã điều chỉnh riêng */}
                            {slot.isCustomized && (
                              <span
                                data-testid={`customized-badge-${slot.slotNumber}`}
                                className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900/60 dark:text-purple-300"
                              >
                                <Sparkles className="h-2.5 w-2.5" />
                                Đã điều chỉnh riêng
                              </span>
                            )}

                            {/* Badge cảnh báo xung đột (AC 2) */}
                            {hasConflict && (
                              <span
                                data-testid={`conflict-badge-${slot.slotNumber}`}
                                className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700 shadow-2xs dark:bg-rose-900/70 dark:text-rose-200 ring-1 ring-rose-300 dark:ring-rose-800"
                              >
                                <AlertTriangle className="h-3 w-3 text-rose-600 dark:text-rose-300" />
                                Trùng lịch phỏng vấn
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {slot.candidate.candidateName}
                            </span>
                            {slot.candidate.candidateEmail && (
                              <span className="text-gray-400">• {slot.candidate.candidateEmail}</span>
                            )}
                            <span className="text-gray-400">• {slot.candidate.jobTitle}</span>
                          </div>
                        </div>
                      </div>

                      {/* Cột 2: Người phỏng vấn & Thao tác chỉnh sửa */}
                      <div className="flex flex-wrap items-center gap-2.5 md:ml-auto">
                        {/* Danh sách người phỏng vấn */}
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          <div className="flex flex-wrap items-center gap-1">
                            {settings.interviewerIds.map((id) => {
                              const found =
                                settings.interviewers?.find((i) => i.id === id) ||
                                allInterviewers.find((i) => i.id === id);
                              return (
                                <span
                                  key={id}
                                  className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                                >
                                  {found?.name || id}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Nút Chỉnh sửa thủ công khung giờ riêng (AC 1) */}
                        {!isEditing ? (
                          <button
                            type="button"
                            data-testid={`btn-edit-slot-${slot.slotNumber}`}
                            onClick={() => handleStartEditSlot(slot)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
                          >
                            <Edit2 className="h-3 w-3 text-gray-500" />
                            <span>Chỉnh sửa ca</span>
                          </button>
                        ) : (
                          slot.isCustomized && (
                            <button
                              type="button"
                              onClick={() => handleResetSlotToOriginal(slot.slotNumber)}
                              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
                              title="Khôi phục giờ mặc định"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Chi tiết cảnh báo xung đột nếu có (AC 2) */}
                    {hasConflict && slot.conflict && slot.conflict.reasons.length > 0 && (
                      <div
                        data-testid={`conflict-reasons-box-${slot.slotNumber}`}
                        className="mt-3 rounded-lg border border-rose-200 bg-white/80 p-2.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-gray-900/80 dark:text-rose-300"
                      >
                        <ul className="space-y-1 list-disc list-inside">
                          {slot.conflict.reasons.map((reason, idx) => (
                            <li key={idx} className="leading-snug">
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Khung Chỉnh sửa thủ công khung giờ (AC 1 Inline Edit) */}
                    {isEditing && (
                      <div
                        data-testid={`slot-edit-panel-${slot.slotNumber}`}
                        className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/40"
                      >
                        <div className="flex items-center gap-1.5 text-xs">
                          <label className="font-semibold text-gray-700 dark:text-gray-300">
                            Giờ bắt đầu:
                          </label>
                          <input
                            type="time"
                            data-testid={`edit-slot-start-time-${slot.slotNumber}`}
                            value={editStartTime}
                            onChange={(e) => setEditStartTime(e.target.value)}
                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 text-xs">
                          <label className="font-semibold text-gray-700 dark:text-gray-300">
                            Thời lượng:
                          </label>
                          <select
                            data-testid={`edit-slot-duration-${slot.slotNumber}`}
                            value={editDuration}
                            onChange={(e) => setEditDuration(Number(e.target.value))}
                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          >
                            <option value={30}>30 phút</option>
                            <option value={45}>45 phút</option>
                            <option value={60}>60 phút</option>
                            <option value={75}>75 phút</option>
                            <option value={90}>90 phút</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            type="button"
                            data-testid={`btn-save-slot-edit-${slot.slotNumber}`}
                            onClick={() => handleSaveSlotEdit(slot.slotNumber)}
                            className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700"
                          >
                            <Check className="h-3 w-3" />
                            <span>Lưu ca</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSlotNumber(null)}
                            className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tùy chọn thông báo & gửi Calendar Invite (AC 3) */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-800/50 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                data-testid="checkbox-calendar-invite"
                checked={sendCalendarInvite}
                onChange={(e) => setSendCalendarInvite(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="space-y-0.5 text-xs">
                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Tự động gửi email thông báo kèm thư mời lịch (Calendar Invite)</span>
                </span>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  Hệ thống sẽ gửi email chứa file đính kèm <code>.ics</code> (Google Calendar / Microsoft Outlook) trực tiếp đến ứng viên và tất cả người phỏng vấn được phân công.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer Modal: Nút hành động (AC 3) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <button
            type="button"
            data-testid="btn-back-to-settings"
            onClick={onBack}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Quay lại chỉnh sửa</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="btn-cancel-preview"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              data-testid="btn-confirm-create-batch-schedule"
              onClick={handleConfirmBatchSchedule}
              disabled={isSubmitting || annotatedSlots.length === 0}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                conflictCount > 0
                  ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/20'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Đang tạo lịch phỏng vấn...</span>
                </>
              ) : (
                <>
                  <CalendarCheck className="h-4 w-4" />
                  <span>
                    {`Xác nhận tạo ${annotatedSlots.length} ca phỏng vấn${
                      conflictCount > 0 ? ` (Có ${conflictCount} cảnh báo)` : ''
                    }`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchSchedulePreviewModal;
