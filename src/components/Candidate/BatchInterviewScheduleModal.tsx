import { featureStatus } from '../../services/backendCapabilities';
import { CapabilityNotice } from '../Interview/CapabilityNotice';
import React, { useState, useEffect, useMemo, useId } from 'react';
import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  X,
  Clock,
  Video,
  MapPin,
  CalendarCheck,
  CalendarRange,
  Search,
  ChevronUp,
  ChevronDown,
  Trash2,
  GripVertical,
  AlertCircle,
  Sparkles,
  Coffee,
  Info,
  ArrowRight,
} from 'lucide-react';
import { BatchSchedulePreviewModal } from './BatchSchedulePreviewModal';
import type { CandidateProfile } from '../../types/candidate';
import type {
  InterviewFormat,
  InterviewRoundType,
  InterviewerInfo,
  BatchCandidateScheduleItem,
  BatchInterviewScheduleSettings,
  CalculatedCandidateSlot,
  BatchScheduleValidationErrors,
  BatchCreateInterviewScheduleResult,
} from '../../types/interview';
import {
  DEFAULT_INTERVIEW_ROUNDS,
} from '../../types/interview';
import { interviewService } from '../../services/interviewService';
import {
  calculateCandidateTimeSlots,
  calculateTotalBatchDurationMinutes,
  validateBatchScheduleSettings,
  reorderCandidates,
  moveCandidateUp,
  moveCandidateDown,
  removeCandidateFromBatch,
  generateSampleMeetLink,
} from '../../utils/batchInterviewHelper';
import { toast, ToastContext } from '../notifications';

export interface BatchInterviewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: CandidateProfile[];
  initialDate?: string;
  onSuccess?: (result: BatchCreateInterviewScheduleResult) => void;
}

const BREAK_OPTIONS = [0, 5, 10, 15, 20];
const DURATION_PRESETS = [30, 45, 60, 90];

/**
 * Trả về chuỗi ngày mai YYYY-MM-DD
 */
const getDefaultTomorrowDate = (): string => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const y = tomorrow.getFullYear();
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const d = String(tomorrow.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Item ứng viên có khả năng kéo thả sắp xếp (Sortable Item)
 */
interface SortableCandidateCardProps {
  slot: CalculatedCandidateSlot;
  index: number;
  totalCandidates: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (candidateId: string) => void;
}

const SortableCandidateCard: React.FC<SortableCandidateCardProps> = ({
  slot,
  index,
  totalCandidates,
  onMoveUp,
  onMoveDown,
  onRemove,
}) => {
  const { candidate, slotNumber, startTime, endTime, durationMinutes, breakAfterMinutes } = slot;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.candidateId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
      <div
        data-testid={`candidate-slot-card-${candidate.candidateId}`}
        className="group relative flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm dark:border-gray-700/80 dark:bg-gray-800"
      >
        {/* Nút kéo thả Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          data-testid={`drag-handle-${candidate.candidateId}`}
          title="Kéo thả để đổi thứ tự ca"
          className="mt-1 cursor-grab text-gray-400 hover:text-indigo-600 active:cursor-grabbing dark:text-gray-500 dark:hover:text-indigo-400"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Số thứ tự ca phỏng vấn */}
        <div className="flex flex-col items-center justify-center rounded-lg bg-indigo-50 px-2.5 py-1.5 text-center text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
          <span className="text-[10px] font-bold uppercase tracking-wider">Ca</span>
          <span className="text-base font-extrabold leading-none">{slotNumber}</span>
        </div>

        {/* Thông tin ứng viên */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <h4 className="text-xs font-bold text-gray-900 truncate dark:text-white">
              {candidate.candidateName}
            </h4>
            {/* Khung giờ ca phỏng vấn */}
            <span
              data-testid={`slot-time-badge-${candidate.candidateId}`}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800"
            >
              <Clock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              {startTime} - {endTime} ({durationMinutes}p)
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            {candidate.candidateEmail && <span>{candidate.candidateEmail}</span>}
            {candidate.jobTitle && (
              <>
                <span>•</span>
                <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                  {candidate.jobTitle}
                </span>
              </>
            )}
          </div>

          {candidate.interviewRound && (
            <div className="mt-1">
              <span className="inline-flex items-center rounded-sm bg-gray-100 px-1.5 py-0.2 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {candidate.interviewRound}
              </span>
            </div>
          )}
        </div>

        {/* Cụm thao tác: Đổi thứ tự & Bỏ bớt ứng viên */}
        <div className="flex items-center gap-1 self-center">
          <button
            type="button"
            data-testid={`move-up-btn-${candidate.candidateId}`}
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            title="Đẩy lên ca trước"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent dark:text-gray-500 dark:hover:bg-gray-700"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            data-testid={`move-down-btn-${candidate.candidateId}`}
            onClick={() => onMoveDown(index)}
            disabled={index === totalCandidates - 1}
            title="Chuyển xuống ca sau"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent dark:text-gray-500 dark:hover:bg-gray-700"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            data-testid={`remove-candidate-btn-${candidate.candidateId}`}
            onClick={() => onRemove(candidate.candidateId)}
            title="Bỏ ứng viên khỏi đợt xếp lịch này"
            className="rounded p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:text-gray-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Dòng hiển thị thời gian nghỉ giãn cách giữa 2 ca */}
      {breakAfterMinutes > 0 && index < totalCandidates - 1 && (
        <div
          data-testid={`break-indicator-${index}`}
          className="flex items-center justify-center gap-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400"
        >
          <div className="h-px flex-1 bg-amber-200 dark:bg-amber-800/60" />
          <Coffee className="h-3 w-3 text-amber-500" />
          <span>Nghỉ giãn cách ca: {breakAfterMinutes} phút</span>
          <div className="h-px flex-1 bg-amber-200 dark:bg-amber-800/60" />
        </div>
      )}
    </div>
  );
};

export const BatchInterviewScheduleModal: React.FC<BatchInterviewScheduleModalProps> = ({
  isOpen,
  onClose,
  candidates: initialCandidates,
  initialDate,
  onSuccess,
}) => {
  const toastContext = React.useContext(ToastContext);
  const searchInputId = useId();

  // Danh sách ứng viên cần xếp lịch (có hỗ trợ đổi thứ tự)
  const [candidatesList, setCandidatesList] = useState<BatchCandidateScheduleItem[]>(() =>
    (initialCandidates || []).map((c) => ({
      candidateId: c.id,
      candidateName: c.fullName,
      candidateEmail: c.email,
      applicationId: `app-${c.id}`,
      jobTitle: c.appliedJobTitle || 'Vị trí tuyển dụng',
      departmentName: c.departmentName,
      interviewRound: 'Vòng Chuyên môn & Kỹ thuật',
      roundType: 'TECHNICAL',
    }))
  );

  // Cấu hình thông số ca phỏng vấn
  const [interviewDate, setInterviewDate] = useState<string>(() => initialDate || getDefaultTomorrowDate());
  const [startFirstSlotTime, setStartFirstSlotTime] = useState<string>('09:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [breakMinutes, setBreakMinutes] = useState<number>(10);
  const [format, setFormat] = useState<InterviewFormat>('ONLINE');
  const [locationOrLink, setLocationOrLink] = useState<string>('https://meet.google.com/xyz-demo-rec');
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState<string[]>([]);
  const [defaultRoundType, setDefaultRoundType] = useState<InterviewRoundType>('TECHNICAL');
  const [customRoundName, setCustomRoundName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Trạng thái hội đồng & tìm kiếm
  const [allInterviewers, setAllInterviewers] = useState<InterviewerInfo[]>([]);
  const [interviewerSearch, setInterviewerSearch] = useState<string>('');
  const [isInterviewerDropdownOpen, setIsInterviewerDropdownOpen] = useState<boolean>(false);

  // Quản lý các bước: CONFIG (Cấu hình thông số ca) -> PREVIEW (Xem trước & Xác nhận) (Jira TKNHTTDNB1-434)
  const [currentStep, setCurrentStep] = useState<'CONFIG' | 'PREVIEW'>('CONFIG');

  // Validation & Processing
  const [validationErrors, setValidationErrors] = useState<BatchScheduleValidationErrors>({});

  // Thiết lập dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const notifyToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastContext?.notify) {
      toastContext.notify(message, type);
    } else {
      toast[type](message);
    }
  };

  // Đồng bộ danh sách ứng viên khi modal mở ra
  useEffect(() => {
    if (isOpen) {
      const mapped: BatchCandidateScheduleItem[] = (initialCandidates || []).map((c) => ({
        candidateId: c.id,
        candidateName: c.fullName,
        candidateEmail: c.email,
        applicationId: `app-${c.id}`,
        jobTitle: c.appliedJobTitle || 'Vị trí tuyển dụng',
        departmentName: c.departmentName,
        interviewRound: 'Vòng Chuyên môn & Kỹ thuật',
        roundType: 'TECHNICAL',
      }));
      setCandidatesList(mapped);
      setInterviewDate(initialDate || getDefaultTomorrowDate());
      setValidationErrors({});
      setCurrentStep('CONFIG');
    }
  }, [isOpen, initialCandidates, initialDate]);

  // Tải danh sách người phỏng vấn nội bộ
  useEffect(() => {
    const loadInterviewers = async () => {
      try {
        const list = await interviewService.getInternalInterviewers();
        if (list && list.length > 0) {
          setAllInterviewers(list);
        }
      } catch {
        // Fallback MOCK_INTERNAL_INTERVIEWERS
      }
    };
    if (isOpen) {
      loadInterviewers();
    }
  }, [isOpen]);

  // Cấu hình hiện tại gom nhóm
  const currentSettings: BatchInterviewScheduleSettings = useMemo(() => {
    const roundConfig = DEFAULT_INTERVIEW_ROUNDS.find((r) => r.type === defaultRoundType);
    const roundName = defaultRoundType === 'CUSTOM' ? customRoundName : roundConfig?.label;

    return {
      interviewDate,
      startFirstSlotTime,
      durationMinutes,
      breakMinutes,
      format,
      locationOrLink,
      interviewerIds: selectedInterviewerIds,
      interviewers: allInterviewers.filter((i) => selectedInterviewerIds.includes(i.id)),
      defaultRoundType,
      defaultRoundName: roundName,
      notes,
    };
  }, [
    interviewDate,
    startFirstSlotTime,
    durationMinutes,
    breakMinutes,
    format,
    locationOrLink,
    selectedInterviewerIds,
    allInterviewers,
    defaultRoundType,
    customRoundName,
    notes,
  ]);

  // Tự động tính toán các ca phỏng vấn tuần tự
  const calculatedSlots = useMemo(() => {
    return calculateCandidateTimeSlots(candidatesList, currentSettings);
  }, [candidatesList, currentSettings]);

  // Tổng thời lượng đợt xếp lịch
  const totalDurationMinutes = useMemo(() => {
    return calculateTotalBatchDurationMinutes(
      candidatesList.length,
      durationMinutes,
      breakMinutes
    );
  }, [candidatesList.length, durationMinutes, breakMinutes]);

  // Giờ kết thúc toàn bộ đợt
  const batchEndTime = useMemo(() => {
    if (calculatedSlots.length === 0) return '';
    return calculatedSlots[calculatedSlots.length - 1].endTime;
  }, [calculatedSlots]);

  // Lọc người phỏng vấn theo từ khóa tìm kiếm
  const filteredInterviewers = useMemo(() => {
    if (!interviewerSearch.trim()) return allInterviewers;
    const q = interviewerSearch.toLowerCase();
    return allInterviewers.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.role.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q)
    );
  }, [allInterviewers, interviewerSearch]);

  // Xử lý kéo thả xong (DragEndEvent)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = candidatesList.findIndex((item) => item.candidateId === active.id);
    const newIndex = candidatesList.findIndex((item) => item.candidateId === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      setCandidatesList((prev) => reorderCandidates(prev, oldIndex, newIndex));
    }
  };

  const handleMoveUp = (index: number) => {
    setCandidatesList((prev) => moveCandidateUp(prev, index));
  };

  const handleMoveDown = (index: number) => {
    setCandidatesList((prev) => moveCandidateDown(prev, index));
  };

  const handleRemoveCandidate = (candidateId: string) => {
    setCandidatesList((prev) => removeCandidateFromBatch(prev, candidateId));
  };

  const handleToggleInterviewer = (interviewerId: string) => {
    setSelectedInterviewerIds((prev) => {
      const exists = prev.includes(interviewerId);
      if (exists) {
        return prev.filter((id) => id !== interviewerId);
      }
      return [...prev, interviewerId];
    });
  };

  const handleGenerateMeetLink = () => {
    const link = generateSampleMeetLink();
    setLocationOrLink(link);
    setValidationErrors((prev) => ({ ...prev, locationOrLink: undefined }));
  };

  // Tiếp tục sang bước Xem trước & Xác nhận lịch (Task Jira TKNHTTDNB1-434 / AC 1 & AC 2)
  const handleSubmitBatch = (e: React.FormEvent) => {
    e.preventDefault();

    const { isValid, errors } = validateBatchScheduleSettings(candidatesList, currentSettings);
    if (!isValid) {
      setValidationErrors(errors);
      const firstError = Object.values(errors)[0];
      if (firstError) {
        notifyToast(firstError, 'error');
      }
      return;
    }

    setValidationErrors({});
    setCurrentStep('PREVIEW');
  };

  if (!isOpen) {
    return null;
  }

  // Bước 2: Hiển thị Xem trước & Xác nhận lịch hàng loạt (Task Jira TKNHTTDNB1-434)
  if (currentStep === 'PREVIEW') {
    return (
      <BatchSchedulePreviewModal
        isOpen={isOpen}
        settings={currentSettings}
        initialSlots={calculatedSlots}
        onBack={() => setCurrentStep('CONFIG')}
        onClose={onClose}
        onSuccess={(result) => {
          onSuccess?.(result);
          onClose();
        }}
      />
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-interview-modal-title"
      data-testid="batch-interview-schedule-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-xs"
    >
      <CapabilityNotice feature="bulkScheduling" />
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 dark:border-gray-800 dark:bg-gray-900">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-400 dark:ring-indigo-800">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="batch-interview-modal-title"
                className="text-base font-bold text-gray-900 dark:text-white"
              >
                Xếp lịch phỏng vấn đồng loạt
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Thiết lập ca phỏng vấn tự động tuần tự cho{' '}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {`${candidatesList.length} ứng viên`}
                </span>{' '}
                đã chọn
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="btn-close-batch-modal"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nội dung Form: 2 cột chia đôi cấu hình & xem trước ca */}
        <form onSubmit={handleSubmitBatch} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Cột Trái: Cấu hình thông số ca phỏng vấn (7 cột) */}
            <div className="lg:col-span-6 space-y-5">
              <div className="border-b border-gray-100 pb-2 dark:border-gray-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>1. Thông số thời gian & Vòng tuyển dụng</span>
                </h3>
              </div>

              {/* Vòng phỏng vấn */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Vòng phỏng vấn áp dụng <span className="text-rose-500">*</span>
                </label>
                <select
                  data-testid="batch-round-select"
                  value={defaultRoundType}
                  onChange={(e) => setDefaultRoundType(e.target.value as InterviewRoundType)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  {DEFAULT_INTERVIEW_ROUNDS.map((r) => (
                    <option key={r.type} value={r.type}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {defaultRoundType === 'CUSTOM' && (
                  <input
                    type="text"
                    data-testid="batch-custom-round-name"
                    value={customRoundName}
                    onChange={(e) => setCustomRoundName(e.target.value)}
                    placeholder="Nhập tên vòng phỏng vấn đặc thù..."
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  />
                )}
              </div>

              {/* Ngày phỏng vấn & Giờ bắt đầu ca đầu tiên */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Ngày phỏng vấn <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      data-testid="batch-interview-date"
                      value={interviewDate}
                      onChange={(e) => {
                        setInterviewDate(e.target.value);
                        setValidationErrors((prev) => ({
                          ...prev,
                          interviewDate: undefined,
                          startFirstSlotTime: undefined,
                        }));
                      }}
                      className={`w-full rounded-lg border px-3 py-2 text-xs font-medium text-gray-700 focus:ring-2 focus:outline-hidden dark:bg-gray-800 dark:text-gray-200 ${
                        validationErrors.interviewDate
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-gray-700'
                      }`}
                    />
                  </div>
                  {validationErrors.interviewDate && (
                    <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                      {validationErrors.interviewDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Giờ bắt đầu ca đầu tiên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    data-testid="batch-start-time"
                    value={startFirstSlotTime}
                    onChange={(e) => {
                      setStartFirstSlotTime(e.target.value);
                      setValidationErrors((prev) => ({
                        ...prev,
                        startFirstSlotTime: undefined,
                      }));
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-xs font-medium text-gray-700 focus:ring-2 focus:outline-hidden dark:bg-gray-800 dark:text-gray-200 ${
                      validationErrors.startFirstSlotTime
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-gray-700'
                    }`}
                  />
                  {validationErrors.startFirstSlotTime && (
                    <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                      {validationErrors.startFirstSlotTime}
                    </p>
                  )}
                </div>
              </div>

              {/* Thời lượng mỗi ca & Thời gian nghỉ giữa các ca */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Thời lượng */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Thời lượng mỗi ca (phút) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    data-testid="batch-duration-input"
                    min="5"
                    step="5"
                    value={durationMinutes}
                    onChange={(e) => {
                      setDurationMinutes(Number(e.target.value));
                      setValidationErrors((prev) => ({ ...prev, durationMinutes: undefined }));
                    }}
                    className={`w-full rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200 ${
                      validationErrors.durationMinutes
                        ? 'border-rose-400'
                        : 'border-gray-300 dark:border-gray-700'
                    }`}
                  />
                  {/* Phím chọn nhanh */}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {DURATION_PRESETS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        data-testid={`duration-preset-${d}`}
                        onClick={() => setDurationMinutes(d)}
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                          durationMinutes === d
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {d}p
                      </button>
                    ))}
                  </div>
                </div>

                {/* Thời gian nghỉ */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Nghỉ giãn cách giữa 2 ca (phút)
                  </label>
                  <input
                    type="number"
                    data-testid="batch-break-input"
                    min="0"
                    step="5"
                    value={breakMinutes}
                    onChange={(e) => {
                      setBreakMinutes(Number(e.target.value));
                      setValidationErrors((prev) => ({ ...prev, breakMinutes: undefined }));
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  />
                  {/* Phím chọn nhanh nghỉ */}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {BREAK_OPTIONS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        data-testid={`break-preset-${b}`}
                        onClick={() => setBreakMinutes(b)}
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                          breakMinutes === b
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {b === 0 ? '0p (Liền kề)' : `${b}p`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hội đồng phỏng vấn (Multi-select Interviewers) */}
              <div className="border-t border-gray-100 pt-3 dark:border-gray-800">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Hội đồng phỏng vấn ({selectedInterviewerIds.length} người){' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    data-testid="btn-toggle-interviewer-dropdown"
                    onClick={() => setIsInterviewerDropdownOpen((prev) => !prev)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    {isInterviewerDropdownOpen ? 'Thu gọn' : '+ Chọn người phỏng vấn'}
                  </button>
                </div>

                {/* Các chip người phỏng vấn đã chọn */}
                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg border border-gray-200 bg-gray-50/70 dark:border-gray-700 dark:bg-gray-800/40">
                  {selectedInterviewerIds.length === 0 ? (
                    <span className="text-[11px] text-gray-400">
                      Chưa chọn người phỏng vấn nào. Vui lòng chọn ít nhất 1 người.
                    </span>
                  ) : (
                    allInterviewers
                      .filter((i) => selectedInterviewerIds.includes(i.id))
                      .map((interviewer) => (
                        <span
                          key={interviewer.id}
                          data-testid={`selected-interviewer-chip-${interviewer.id}`}
                          className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-800 shadow-2xs ring-1 ring-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600"
                        >
                          <span className="font-semibold">{interviewer.name}</span>
                          <span className="text-[10px] text-gray-400">({interviewer.role})</span>
                          <button
                            type="button"
                            onClick={() => handleToggleInterviewer(interviewer.id)}
                            className="text-gray-400 hover:text-rose-600 ml-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                  )}
                </div>
                {validationErrors.interviewerIds && (
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                    {validationErrors.interviewerIds}
                  </p>
                )}

                {/* Dropdown danh sách người phỏng vấn để tích chọn */}
                {isInterviewerDropdownOpen && (
                  <div
                    data-testid="interviewer-dropdown-panel"
                    className="mt-2 rounded-xl border border-gray-200 bg-white p-2.5 shadow-lg dark:border-gray-700 dark:bg-gray-800 space-y-2 max-h-56 overflow-y-auto"
                  >
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                      <input
                        id={searchInputId}
                        type="text"
                        data-testid="interviewer-search-input"
                        placeholder="Tìm kiếm người phỏng vấn theo tên, vai trò..."
                        value={interviewerSearch}
                        onChange={(e) => setInterviewerSearch(e.target.value)}
                        className="w-full rounded-md border border-gray-200 py-1.5 pl-8 pr-3 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      />
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredInterviewers.map((item) => {
                        const isSelected = selectedInterviewerIds.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            data-testid={`interviewer-checkbox-item-${item.id}`}
                            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer dark:hover:bg-gray-750"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleInterviewer(item.id)}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                {item.role} • {item.email}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Hình thức phỏng vấn & Link / Phòng họp */}
              <div className="border-t border-gray-100 pt-3 dark:border-gray-800 space-y-3">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Hình thức & Địa điểm <span className="text-rose-500">*</span>
                </label>

                {/* Toggle Online / Offline */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-testid="format-online-btn"
                    onClick={() => {
                      setFormat('ONLINE');
                      if (!locationOrLink || !locationOrLink.startsWith('http')) {
                        handleGenerateMeetLink();
                      }
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg border p-2 text-xs font-semibold transition-all ${
                      format === 'ONLINE'
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 shadow-xs dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-500'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Video className="h-4 w-4" />
                    <span>Trực tuyến (Online)</span>
                  </button>

                  <button
                    type="button"
                    data-testid="format-offline-btn"
                    onClick={() => {
                      setFormat('OFFLINE');
                      if (locationOrLink.startsWith('http')) {
                        setLocationOrLink('Phòng họp Lotus - Tầng 8');
                      }
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg border p-2 text-xs font-semibold transition-all ${
                      format === 'OFFLINE'
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 shadow-xs dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-500'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Trực tiếp (Offline)</span>
                  </button>
                </div>

                {/* Input Link / Phòng họp */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {format === 'ONLINE' ? 'Link phòng họp trực tuyến:' : 'Tên phòng họp:'}
                    </span>
                    {format === 'ONLINE' && (
                      <button
                        type="button"
                        data-testid="btn-generate-meet-link"
                        onClick={handleGenerateMeetLink}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        <Sparkles className="h-3 w-3" />
                        Tạo Google Meet mới
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    data-testid="batch-location-link-input"
                    value={locationOrLink}
                    onChange={(e) => {
                      setLocationOrLink(e.target.value);
                      setValidationErrors((prev) => ({ ...prev, locationOrLink: undefined }));
                    }}
                    placeholder={
                      format === 'ONLINE'
                        ? 'https://meet.google.com/...'
                        : 'Phòng họp Lotus - Tầng 8...'
                    }
                    className={`w-full rounded-lg border px-3 py-2 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200 ${
                      validationErrors.locationOrLink
                        ? 'border-rose-400'
                        : 'border-gray-300 dark:border-gray-700'
                    }`}
                  />
                  {validationErrors.locationOrLink && (
                    <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                      {validationErrors.locationOrLink}
                    </p>
                  )}
                </div>

                {/* Ghi chú nội bộ cho buổi phỏng vấn */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Ghi chú ca phỏng vấn (tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    data-testid="batch-interview-notes-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ví dụ: Đề nghị ứng viên chuẩn bị CV và portfolio bản in..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Cột Phải: Danh sách ứng viên & Xem trước lịch trình tuần tự (5 cột) */}
            <div className="lg:col-span-6 flex flex-col space-y-3">
              <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                  <CalendarCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>2. Danh sách ca phỏng vấn tự động ({candidatesList.length})</span>
                </h3>

                {/* Tóm tắt tổng thời gian */}
                <span
                  data-testid="batch-total-summary-badge"
                  className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                >
                  {startFirstSlotTime} → {batchEndTime} ({totalDurationMinutes}p)
                </span>
              </div>

              {/* Hướng dẫn kéo thả đổi thứ tự */}
              <div className="flex items-center gap-1.5 rounded-lg bg-blue-50/80 px-3 py-2 text-[11px] text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                <Info className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                <span>Kéo biểu tượng dấu chấm hoặc dùng mũi tên để đổi thứ tự ca giữa các ứng viên.</span>
              </div>

              {/* Danh sách Sortable Cards */}
              <div className="flex-1 overflow-y-auto max-h-[460px] pr-1 space-y-2">
                {candidatesList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Chưa có ứng viên nào trong danh sách
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Vui lòng tích chọn ứng viên từ danh sách quản lý để xếp lịch.
                    </p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={candidatesList.map((c) => c.candidateId)}
                      strategy={verticalListSortingStrategy}
                    >
                      {calculatedSlots.map((slot, index) => (
                        <SortableCandidateCard
                          key={slot.candidate.candidateId}
                          slot={slot}
                          index={index}
                          totalCandidates={candidatesList.length}
                          onMoveUp={handleMoveUp}
                          onMoveDown={handleMoveDown}
                          onRemove={handleRemoveCandidate}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          </div>

          {/* Footer nút hành động */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {candidatesList.length > 0 && (
                <span>
                  Sẽ tạo <strong>{candidatesList.length} lịch phỏng vấn</strong> vào ngày{' '}
                  <strong>{interviewDate}</strong>.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="btn-cancel-batch"
                onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                data-testid="btn-submit-batch"
                disabled={featureStatus('bulkScheduling') !== 'AVAILABLE' || candidatesList.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>{`Tiếp tục: Xem trước & Xác nhận (${candidatesList.length})`}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export { BatchSchedulePreviewModal };
export default BatchInterviewScheduleModal;
