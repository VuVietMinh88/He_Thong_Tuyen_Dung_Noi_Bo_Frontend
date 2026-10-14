import React, { useState, useEffect, useMemo, useId } from 'react';
import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Link2,
  Search,
  Check,
  CalendarCheck,
  Briefcase,
  Mail,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { useToast } from '../notifications/useToast';
import {
  interviewService,
  validateScheduleTime,
  calculateEndTime,
  generateMeetingLink,
} from '../../services/interviewService';
import type {
  InterviewFormat,
  InterviewRoundType,
  InterviewerInfo,
  InterviewSchedulePayload,
  CreateInterviewSchedulePayload,
} from '../../types/interview';
import {
  DEFAULT_INTERVIEW_ROUNDS,
  DEFAULT_DURATION_OPTIONS,
  InterviewPastTimeError,
  InterviewerConflictError,
} from '../../types/interview';

export interface InterviewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName: string;
  candidateEmail?: string;
  applicationId?: string;
  jobTitle?: string;
  onSuccess?: (payload: InterviewSchedulePayload) => void;
}

/**
 * Trả về chuỗi ngày YYYY-MM-DD theo múi giờ Việt Nam
 */
const getVietnamTodayString = (): string => {
  const now = new Date();
  const vnDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return vnDateStr;
};

/**
 * Trả về chuỗi ngày mai YYYY-MM-DD theo múi giờ Việt Nam
 */
const getVietnamTomorrowString = (): string => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const vnDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(tomorrow);
  return vnDateStr;
};

export const InterviewScheduleModal: React.FC<InterviewScheduleModalProps> = ({
  isOpen,
  onClose,
  candidateId,
  candidateName,
  candidateEmail,
  applicationId,
  jobTitle = 'Ứng viên tiềm năng',
  onSuccess,
}) => {
  const { addToast } = useToast();
  const searchInputId = useId();

  // Form State
  const [roundType, setRoundType] = useState<InterviewRoundType>('TECHNICAL');
  const [customRoundName, setCustomRoundName] = useState<string>('');
  const [interviewDate, setInterviewDate] = useState<string>(getVietnamTomorrowString());
  const [interviewTime, setInterviewTime] = useState<string>('09:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [format, setFormat] = useState<InterviewFormat>('ONLINE');
  const [locationOrLink, setLocationOrLink] = useState<string>('https://meet.google.com/hxr-mopq-txy');
  const [selectedInterviewers, setSelectedInterviewers] = useState<InterviewerInfo[]>([]);
  const [notes, setNotes] = useState<string>('');

  // Auxiliary UI state
  const [availableInterviewers, setAvailableInterviewers] = useState<InterviewerInfo[]>([]);
  const [interviewerSearch, setInterviewerSearch] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasCopiedLink, setHasCopiedLink] = useState<boolean>(false);

  const todayVN = useMemo(() => getVietnamTodayString(), []);

  // Tải danh sách người phỏng vấn khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    interviewService
      .getInternalInterviewers()
      .then((data) => {
        if (isMounted) {
          setAvailableInterviewers(data);
          // Mặc định chọn người đầu tiên nếu chưa chọn ai
          setSelectedInterviewers((prev) => {
            if (prev.length === 0 && data.length > 0) {
              return [data[0]];
            }
            return prev;
          });
        }
      })
      .catch(() => {
        // Fallback
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Vòng phỏng vấn đang chọn
  const activeRoundOption = useMemo(() => {
    return (
      DEFAULT_INTERVIEW_ROUNDS.find((r) => r.type === roundType) ||
      DEFAULT_INTERVIEW_ROUNDS[0]
    );
  }, [roundType]);

  const effectiveRoundName = useMemo(() => {
    if (roundType === 'CUSTOM') {
      return customRoundName.trim() || 'Vòng phỏng vấn tùy chỉnh';
    }
    return activeRoundOption.label;
  }, [roundType, customRoundName, activeRoundOption]);

  // Validation ngày giờ theo múi giờ Việt Nam
  const timeValidation = useMemo(() => {
    return validateScheduleTime(interviewDate, interviewTime);
  }, [interviewDate, interviewTime]);

  // Giờ kết thúc dự kiến
  const endTime = useMemo(() => {
    return calculateEndTime(interviewTime, durationMinutes);
  }, [interviewTime, durationMinutes]);

  // Danh sách người phỏng vấn lọc theo ô tìm kiếm
  const filteredInterviewers = useMemo(() => {
    if (!interviewerSearch.trim()) return availableInterviewers;
    const q = interviewerSearch.toLowerCase().trim();
    return availableInterviewers.filter(
      (person) =>
        person.name.toLowerCase().includes(q) ||
        person.role.toLowerCase().includes(q) ||
        person.email.toLowerCase().includes(q) ||
        (person.department && person.department.toLowerCase().includes(q)),
    );
  }, [availableInterviewers, interviewerSearch]);

  // Kiểm tra tính hợp lệ của toàn bộ form
  const isFormValid = useMemo(() => {
    if (!candidateId) return false;
    if (!effectiveRoundName.trim()) return false;
    if (!timeValidation.isValid) return false;
    if (!locationOrLink.trim()) return false;
    if (selectedInterviewers.length === 0) return false;
    return true;
  }, [
    candidateId,
    effectiveRoundName,
    timeValidation.isValid,
    locationOrLink,
    selectedInterviewers.length,
  ]);

  // Format ngày để xem trước thân thiện (Hook được gọi vô điều kiện)
  const formattedPreviewDate = useMemo(() => {
    if (!interviewDate) return '';
    try {
      const dateParts = interviewDate.split('-');
      if (dateParts.length !== 3) return interviewDate;
      const d = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10));
      return new Intl.DateTimeFormat('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(d);
    } catch {
      return interviewDate;
    }
  }, [interviewDate]);

  // Toggle chọn / bỏ chọn người phỏng vấn
  const handleToggleInterviewer = (interviewer: InterviewerInfo) => {
    if (selectedInterviewers.some((item) => item.id === interviewer.id)) {
      setSelectedInterviewers(selectedInterviewers.filter((item) => item.id !== interviewer.id));
    } else {
      setSelectedInterviewers([...selectedInterviewers, interviewer]);
    }
  };

  const handleRemoveInterviewer = (id: string) => {
    setSelectedInterviewers(selectedInterviewers.filter((item) => item.id !== id));
  };

  // Tạo link mẫu
  const handleGenerateMeetingLink = (provider: 'google_meet' | 'zoom') => {
    const link = generateMeetingLink(provider);
    setLocationOrLink(link);
    addToast({
      message: `Đã tự động tạo liên kết ${provider === 'google_meet' ? 'Google Meet' : 'Zoom'}: ${link}`,
      type: 'info',
    });
  };

  // Chọn phòng họp mẫu cho hình thức Offline
  const handleSelectOfficeRoom = (roomName: string) => {
    setLocationOrLink(roomName);
  };

  // Copy link xem trước
  const handleCopyLink = () => {
    if (!locationOrLink) return;
    navigator.clipboard.writeText(locationOrLink);
    setHasCopiedLink(true);
    setTimeout(() => setHasCopiedLink(false), 2000);
  };

  // Xử lý gửi biểu mẫu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      if (!timeValidation.isValid) {
        addToast({
          message: timeValidation.error || 'Thời gian phỏng vấn không hợp lệ.',
          type: 'error',
        });
        return;
      }
      if (selectedInterviewers.length === 0) {
        addToast({
          message: 'Vui lòng chọn ít nhất một người tham gia phỏng vấn.',
          type: 'warning',
        });
        return;
      }
      if (!locationOrLink.trim()) {
        addToast({
          message: 'Vui lòng cung cấp link họp trực tuyến hoặc tên phòng họp.',
          type: 'warning',
        });
        return;
      }
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateInterviewSchedulePayload = {
        applicationId: applicationId || 'app-current',
        candidateId,
        candidateName,
        candidateEmail,
        jobTitle,
        interviewRound: effectiveRoundName,
        roundType,
        startTime:
          timeValidation.scheduledDateTimeISO ||
          `${interviewDate}T${interviewTime}:00+07:00`,
        interviewDate,
        interviewTime,
        durationMinutes,
        interviewType: format,
        format,
        locationOrLink: locationOrLink.trim(),
        interviewerIds: selectedInterviewers.map((i) => i.id),
        interviewers: selectedInterviewers,
        notes: notes.trim(),
        status: 'SCHEDULED',
      };

      const result = await interviewService.createInterviewSchedule(payload);

      addToast({
        message: `Đã xếp lịch ${effectiveRoundName} cho ứng viên ${candidateName} vào ngày ${interviewDate} (${interviewTime} - ${endTime}).`,
        type: 'success',
      });

      if (onSuccess) {
        onSuccess(result);
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof InterviewPastTimeError) {
        addToast({
          message: err.message,
          type: 'error',
        });
      } else if (err instanceof InterviewerConflictError) {
        addToast({
          message: err.message,
          type: 'warning',
        });
      } else {
        const message =
          err instanceof Error ? err.message : 'Không thể lưu lịch phỏng vấn, vui lòng thử lại.';
        addToast({
          message,
          type: 'error',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-modal-title"
    >
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Calendar className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <h2 id="interview-modal-title" className="text-lg sm:text-xl font-bold tracking-tight">
                Đặt lịch phỏng vấn ứng viên
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-indigo-200">
                <span className="font-semibold text-white">{candidateName}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {jobTitle}
                </span>
                {candidateEmail && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {candidateEmail}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 2 Column Split Layout */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Cột trái: Form nhập liệu (7/12 cols trên lg) */}
            <div className="lg:col-span-7 space-y-5">
              {/* 1. Vòng phỏng vấn */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                  Vòng phỏng vấn <span className="text-rose-500">*</span>
                </label>
                <select
                  value={roundType}
                  onChange={(e) => setRoundType(e.target.value as InterviewRoundType)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  {DEFAULT_INTERVIEW_ROUNDS.map((r) => (
                    <option key={r.type} value={r.type}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">{activeRoundOption.description}</p>

                {roundType === 'CUSTOM' && (
                  <div className="pt-1.5">
                    <input
                      type="text"
                      value={customRoundName}
                      onChange={(e) => setCustomRoundName(e.target.value)}
                      placeholder="Nhập tên vòng phỏng vấn đặc thù (VD: Vòng Thử thách Hackathon, Vòng Thuyết trình Case Study...)"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-indigo-200 bg-indigo-50/30 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>
                )}
              </div>

              {/* 2. Ngày, Giờ & Thời lượng */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Thời gian & Thời lượng
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Múi giờ Asia/Ho_Chi_Minh (GMT+7)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Ngày phỏng vấn <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      min={todayVN}
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Giờ bắt đầu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                  </div>
                </div>

                {/* Duration Pills */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Thời lượng buổi phỏng vấn
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_DURATION_OPTIONS.map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setDurationMinutes(dur)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          durationMinutes === dur
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50'
                        }`}
                      >
                        {dur} phút
                      </button>
                    ))}
                  </div>
                  {endTime && (
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      Khung giờ dự kiến: <strong className="text-slate-800">{interviewTime} - {endTime}</strong> ({durationMinutes} phút)
                    </p>
                  )}
                </div>

                {/* Validation Cảnh báo ngày giờ quá khứ */}
                {!timeValidation.isValid && timeValidation.error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Thời gian không hợp lệ</p>
                      <p className="opacity-90">{timeValidation.error}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Hình thức phỏng vấn & Địa điểm/Link */}
              <div className="space-y-3">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                  Hình thức phỏng vấn <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormat('ONLINE');
                      if (!locationOrLink.startsWith('http')) {
                        setLocationOrLink('https://meet.google.com/hxr-mopq-txy');
                      }
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      format === 'ONLINE'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-sm ring-2 ring-indigo-200'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Video className="w-4 h-4 text-indigo-600" />
                    Trực tuyến (Online)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormat('OFFLINE');
                      if (locationOrLink.startsWith('http')) {
                        setLocationOrLink('Phòng họp Lotus - Tầng 8, Tòa nhà FPT Tower, số 10 Phạm Văn Bạch, Cầu Giấy, HN');
                      }
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      format === 'OFFLINE'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-sm ring-2 ring-indigo-200'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    Trực tiếp (Tại văn phòng)
                  </button>
                </div>

                {/* Input địa điểm / link */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-600">
                      {format === 'ONLINE' ? 'Liên kết phòng họp trực tuyến' : 'Địa điểm / Tên phòng họp'} <span className="text-rose-500">*</span>
                    </label>
                    {format === 'ONLINE' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleGenerateMeetingLink('google_meet')}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          Tạo Google Meet mẫu
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => handleGenerateMeetingLink('zoom')}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                        >
                          Tạo Zoom mẫu
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      {format === 'ONLINE' ? <Link2 className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                    </div>
                    <input
                      type="text"
                      value={locationOrLink}
                      onChange={(e) => setLocationOrLink(e.target.value)}
                      placeholder={
                        format === 'ONLINE'
                          ? 'Dán đường dẫn phòng họp (Google Meet, Zoom, MS Teams...)'
                          : 'Nhập tên phòng họp, số tầng, địa chỉ văn phòng...'
                      }
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>

                  {/* Offline room presets */}
                  {format === 'OFFLINE' && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-500">Gợi ý nhanh:</span>
                      {[
                        'Phòng họp Lotus - Tầng 8',
                        'Phòng họp Sakura - Tầng 5',
                        'Phòng Hội nghị A - Tòa FPT Tower',
                      ].map((room) => (
                        <button
                          key={room}
                          type="button"
                          onClick={() => handleSelectOfficeRoom(room)}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition cursor-pointer"
                        >
                          {room}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Chọn người phỏng vấn (Multi-select) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                    Người phỏng vấn <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Đã chọn {selectedInterviewers.length} người
                  </span>
                </div>

                {/* Selected Interviewers Chips */}
                {selectedInterviewers.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    {selectedInterviewers.map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 bg-white rounded-lg border border-indigo-200 text-xs shadow-xs text-slate-800 font-medium"
                      >
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                          {item.name.charAt(0)}
                        </span>
                        <span>{item.name}</span>
                        <span className="text-[10px] text-slate-500">({item.role})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInterviewer(item.id)}
                          className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          aria-label={`Bỏ chọn ${item.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    Vui lòng chọn ít nhất 1 người tham gia phỏng vấn từ danh sách dưới đây.
                  </p>
                )}

                {/* Search interviewer */}
                <div className="relative">
                  <label htmlFor={searchInputId} className="sr-only">
                    Tìm kiếm người phỏng vấn
                  </label>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id={searchInputId}
                    type="text"
                    value={interviewerSearch}
                    onChange={(e) => setInterviewerSearch(e.target.value)}
                    placeholder="Tìm kiếm người phỏng vấn theo tên, chức danh, email..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Interviewers selectable list */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-white">
                  {filteredInterviewers.length > 0 ? (
                    filteredInterviewers.map((person) => {
                      const isSelected = selectedInterviewers.some((i) => i.id === person.id);
                      return (
                        <div
                          key={person.id}
                          onClick={() => handleToggleInterviewer(person)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                            isSelected
                              ? 'bg-indigo-50/80 border border-indigo-200 text-indigo-900 font-medium'
                              : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                              {person.avatarUrl ? (
                                <img
                                  src={person.avatarUrl}
                                  alt={person.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                person.name.charAt(0)
                              )}
                            </div>
                            <div className="truncate">
                              <p className="font-semibold text-slate-900 truncate">{person.name}</p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {person.role} • {person.department || person.email}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500">
                      Không tìm thấy nhân sự phù hợp với từ khóa &quot;{interviewerSearch}&quot;
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Ghi chú & Dặn dò ứng viên */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                    Ghi chú / Hướng dẫn ứng viên
                  </label>
                  <span className="text-[11px] text-slate-400">{notes.length}/500</span>
                </div>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Ứng viên vui lòng chuẩn bị máy tính xách tay và portfolio dự án; Kiểm tra camera và tai nghe trước 10 phút..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
              </div>
            </div>

            {/* Cột phải: Bản xem trước Live Preview (5/12 cols trên lg) */}
            <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 to-indigo-50/30 rounded-2xl border border-indigo-100 p-4 sm:p-5 space-y-4 lg:sticky lg:top-0">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-indigo-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Bản xem trước lịch hẹn (Live Preview)
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Trực quan
                </span>
              </div>

              {/* Candidate Info Summary */}
              <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {candidateName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {candidateName}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">{jobTitle}</p>
                  </div>
                </div>
                {candidateEmail && (
                  <p className="text-[11px] text-indigo-600 font-mono pt-1">
                    {candidateEmail}
                  </p>
                )}
              </div>

              {/* Round & Time Badge */}
              <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs space-y-2.5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Vòng tuyển dụng
                  </span>
                  <div className="mt-0.5">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md border ${activeRoundOption.badgeColor}`}>
                      {effectiveRoundName}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Thời gian phỏng vấn
                  </span>
                  <div className="mt-1 space-y-1">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 capitalize">
                      {formattedPreviewDate || 'Chưa chọn ngày'}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{interviewTime} - {endTime}</span>
                      <span className="text-slate-400 font-normal">({durationMinutes} phút)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Hình thức & Địa điểm
                  </span>
                  <div className="mt-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                        format === 'ONLINE'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {format === 'ONLINE' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                        {format === 'ONLINE' ? 'Trực tuyến' : 'Trực tiếp'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 break-all bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-start justify-between gap-2">
                      <span className="font-mono text-[11px] leading-relaxed">
                        {locationOrLink || 'Chưa nhập địa điểm / link'}
                      </span>
                      {format === 'ONLINE' && locationOrLink.startsWith('http') && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={handleCopyLink}
                            title="Sao chép liên kết"
                            className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                          >
                            {hasCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={locationOrLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Mở liên kết"
                            className="p-1 text-slate-400 hover:text-indigo-600 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Hội đồng phỏng vấn ({selectedInterviewers.length})
                  </span>
                  <div className="mt-1 space-y-1.5">
                    {selectedInterviewers.map((interviewer) => (
                      <div key={interviewer.id} className="flex items-center gap-2 text-xs text-slate-800">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {interviewer.name.charAt(0)}
                        </div>
                        <span className="font-semibold truncate">{interviewer.name}</span>
                        <span className="text-[11px] text-slate-500 truncate">- {interviewer.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {notes && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Dặn dò & Ghi chú
                    </span>
                    <p className="mt-1 text-xs text-slate-600 italic bg-amber-50/50 p-2 rounded border border-amber-200/60 leading-relaxed">
                      &quot;{notes}&quot;
                    </p>
                  </div>
                )}
              </div>

              {/* Status Readiness Banner */}
              {isFormValid ? (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Mọi thông tin đã đầy đủ và hợp lệ để lên lịch.</span>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Cần hoàn thiện:</p>
                    <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-[11px]">
                      {!timeValidation.isValid && <li>Ngày giờ phỏng vấn phải ở tương lai</li>}
                      {selectedInterviewers.length === 0 && <li>Chọn ít nhất 1 người phỏng vấn</li>}
                      {!locationOrLink.trim() && <li>Nhập liên kết họp hoặc địa điểm</li>}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CalendarCheck className="w-4 h-4" />
              {isSubmitting ? 'Đang lên lịch...' : 'Lên lịch phỏng vấn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewScheduleModal;
