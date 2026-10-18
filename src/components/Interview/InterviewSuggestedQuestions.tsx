import React, { useState, useMemo, useEffect, useCallback, useId, useContext } from 'react';
import {
  HelpCircle,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  History,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Briefcase,
  Layers,
  X,
  RotateCcw,
  Star,
  ShieldAlert,
  Info,
  CheckSquare,
  Square,
  Award,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import type { QuestionDifficulty } from '../../services/questionService';
import {
  DEFAULT_SUGGESTED_QUESTIONS,
  type SuggestedQuestionItem,
  type GoodAnswerCriteria,
  type AskedInPreviousRoundInfo,
} from '../../data/suggestedQuestionsData';
import {
  interviewQuestionService,
  handleInterviewQuestionError,
} from '../../services/interviewQuestionService';
import { ToastContext } from '../notifications/ToastContext';

export type { SuggestedQuestionItem, GoodAnswerCriteria, AskedInPreviousRoundInfo };

export interface InterviewSuggestedQuestionsProps {
  /** Điều khiển mở/đóng khi sử dụng dạng Drawer hoặc Modal */
  isOpen?: boolean;
  /** Callback đóng giao diện */
  onClose?: () => void;
  /** Kiểu hiển thị: drawer (trượt từ bên phải), modal (hộp thoại giữa), inline (nhúng trực tiếp) */
  variant?: 'drawer' | 'modal' | 'inline';
  /** Chức danh vị trí tuyển dụng (tự động chọn lọc theo chức danh này) */
  jobTitle?: string;
  /** Tên ứng viên đang phỏng vấn */
  candidateName?: string;
  /** ID ứng viên */
  candidateId?: string;
  /** ID hồ sơ ứng tuyển */
  applicationId?: string;
  /** ID buổi / vòng phỏng vấn */
  interviewRoundId?: string;
  /** Tên vòng phỏng vấn hiện tại */
  currentRoundName?: string;
  /** ID người phỏng vấn */
  interviewerId?: string;
  /** Tên người phỏng vấn */
  interviewerName?: string;
  /** Danh sách tiêu chí năng lực đang có trong phiếu đánh giá */
  activeCriteria?: Array<{ id: string; name: string }>;
  /** Danh sách ID các câu hỏi đã được hỏi ở các vòng trước */
  previouslyAskedQuestionIds?: string[];
  /** Callback khi người phỏng vấn chọn câu hỏi */
  onSelectQuestion?: (question: SuggestedQuestionItem) => void;
  /** Callback khi người phỏng vấn đánh dấu đã hỏi hoặc bỏ đánh dấu */
  onToggleMarkAsked?: (questionId: string, isAsked: boolean) => void;
  /** Danh sách câu hỏi tùy biến truyền vào (nếu không truyền sẽ dùng ngân hàng tiêu chuẩn) */
  initialQuestions?: SuggestedQuestionItem[];
  /** Class tùy biến cho container */
  className?: string;
}

const resolveInitialPosition = (title?: string): string => {
  if (!title) return 'ALL';
  const lower = title.toLowerCase();
  if (lower.includes('front') || lower.includes('react') || lower.includes('vue')) {
    return 'Frontend Developer';
  }
  if (lower.includes('back') || lower.includes('node') || lower.includes('java') || lower.includes('golang')) {
    return 'Backend Engineer';
  }
  if (lower.includes('qa') || lower.includes('test') || lower.includes('kiểm thử')) {
    return 'QA / QC Engineer';
  }
  if (lower.includes('lead') || lower.includes('trưởng') || lower.includes('manager')) {
    return 'Quản lý / Tech Lead';
  }
  return 'ALL';
};

export const InterviewSuggestedQuestions: React.FC<InterviewSuggestedQuestionsProps> = ({
  isOpen = true,
  onClose,
  variant = 'drawer',
  jobTitle = '',
  candidateName = 'Ứng viên',
  candidateId,
  applicationId,
  interviewRoundId,
  currentRoundName = 'Buổi phỏng vấn',
  interviewerId,
  interviewerName,
  activeCriteria = [],
  previouslyAskedQuestionIds = [],
  onSelectQuestion,
  onToggleMarkAsked,
  initialQuestions,
  className = '',
}) => {
  const toastContext = useContext(ToastContext);
  const addToast = useCallback(
    (options: { message: string; type?: 'success' | 'error' | 'warning' | 'info'; duration?: number }) => {
      if (toastContext?.addToast) {
        return toastContext.addToast(options);
      }
      return '';
    },
    [toastContext],
  );

  const searchInputId = useId();
  const positionFilterId = useId();
  const criterionFilterId = useId();
  const difficultyFilterId = useId();
  const statusFilterId = useId();

  // Danh sách câu hỏi nguồn
  const [questions, setQuestions] = useState<SuggestedQuestionItem[]>(() => {
    return Array.isArray(initialQuestions)
      ? initialQuestions
      : DEFAULT_SUGGESTED_QUESTIONS;
  });

  // Loading và mutating state (AC 1 & AC 2)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mutatingQuestionIds, setMutatingQuestionIds] = useState<Record<string, boolean>>({});

  // State bộ lọc (AC 1)
  const [selectedPosition, setSelectedPosition] = useState<string>(() => resolveInitialPosition(jobTitle));
  const [selectedCriterion, setSelectedCriterion] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [selectedAskedFilter, setSelectedAskedFilter] = useState<'ALL' | 'UNASKED' | 'PREVIOUS_ROUND' | 'CURRENT_SESSION'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Quản lý trạng thái mở rộng Accordion câu hỏi (AC 2)
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Record<string, boolean>>({});

  // Quản lý câu hỏi đã được hỏi trong buổi này (AC 2 & AC 3)
  const [currentSessionAskedIds, setCurrentSessionAskedIds] = useState<Record<string, boolean>>(() => {
    const targetId = candidateId || applicationId;
    if (!targetId) return {};
    const initialMap: Record<string, boolean> = {};
    const stored = interviewQuestionService.getStoredUsages();
    stored.forEach((u) => {
      const matchCandidate = u.candidateId === targetId || u.applicationId === targetId;
      const matchRound =
        u.roundName === currentRoundName || (interviewRoundId && u.interviewRoundId === interviewRoundId);
      if (matchCandidate && matchRound) {
        initialMap[u.questionId] = true;
      }
    });
    return initialMap;
  });

  // Trạng thái copy feedback
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);

  // Đóng bằng phím ESC khi ở dạng Modal hoặc Drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onClose && variant !== 'inline') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, variant]);

  // Tải danh sách câu hỏi gợi ý từ service (AC 1 & AC 2)
  useEffect(() => {
    if (Array.isArray(initialQuestions)) {
      return;
    }

    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const items = await interviewQuestionService.getSuggestedQuestions({
          candidateId,
          applicationId,
          jobTitle,
          roundName: currentRoundName,
          interviewRoundId,
        });
        if (isMounted) {
          setQuestions(items);

          // Đồng bộ các câu hỏi đã đánh dấu trong buổi hiện tại từ storage
          const targetId = candidateId || applicationId;
          if (targetId) {
            const stored = interviewQuestionService.getStoredUsages();
            const sessionMap: Record<string, boolean> = {};
            stored.forEach((u) => {
              const matchCandidate = u.candidateId === targetId || u.applicationId === targetId;
              const matchRound =
                u.roundName === currentRoundName || (interviewRoundId && u.interviewRoundId === interviewRoundId);
              if (matchCandidate && matchRound) {
                sessionMap[u.questionId] = true;
              }
            });
            setCurrentSessionAskedIds((prev) => ({ ...prev, ...sessionMap }));
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const formatted = handleInterviewQuestionError(
            err,
            'Không thể tải ngân hàng câu hỏi gợi ý từ máy chủ.',
          );
          addToast({
            type: 'error',
            message: formatted.message,
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [candidateId, applicationId, jobTitle, currentRoundName, interviewRoundId, initialQuestions, addToast]);

  const handleRefreshQuestions = async () => {
    setIsLoading(true);
    try {
      const items = await interviewQuestionService.getSuggestedQuestions({
        candidateId,
        applicationId,
        jobTitle,
        roundName: currentRoundName,
        interviewRoundId,
      });
      setQuestions(items);
      addToast({
        type: 'success',
        message: 'Đã cập nhật danh sách câu hỏi gợi ý mới nhất.',
      });
    } catch (err: unknown) {
      const formatted = handleInterviewQuestionError(
        err,
        'Không thể làm mới danh sách câu hỏi.',
      );
      addToast({
        type: 'error',
        message: formatted.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Danh sách vị trí tuyển dụng duy nhất trích xuất từ ngân hàng
  const availablePositions = useMemo(() => {
    const posSet = new Set<string>();
    questions.forEach((q) => {
      if (q.positionName) posSet.add(q.positionName);
    });
    return Array.from(posSet);
  }, [questions]);

  // Danh sách tiêu chí trích xuất từ ngân hàng hoặc prop activeCriteria
  const availableCriteria = useMemo(() => {
    if (activeCriteria && activeCriteria.length > 0) {
      return activeCriteria;
    }
    const map = new Map<string, string>();
    questions.forEach((q) => {
      if (q.criterionId && q.criterionName) {
        map.set(q.criterionId, q.criterionName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [questions, activeCriteria]);

  // Toggle mở rộng câu trả lời
  const toggleExpand = (questionId: string) => {
    setExpandedQuestionIds((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Mở rộng tất cả hoặc thu gọn tất cả
  const handleToggleExpandAll = (expand: boolean) => {
    const newState: Record<string, boolean> = {};
    if (expand) {
      questions.forEach((q) => {
        newState[q.id] = true;
      });
    }
    setExpandedQuestionIds(newState);
  };

  // Đánh dấu câu hỏi đã hỏi trong buổi phỏng vấn hiện tại (AC 1, AC 2 & Toast)
  const handleToggleMarkCurrentSession = async (questionId: string) => {
    if (mutatingQuestionIds[questionId]) return;

    const previousState = !!currentSessionAskedIds[questionId];
    const nextState = !previousState;

    // 1. Cập nhật giao diện tức thì (Optimistic UI)
    setCurrentSessionAskedIds((prev) => ({
      ...prev,
      [questionId]: nextState,
    }));
    setMutatingQuestionIds((prev) => ({ ...prev, [questionId]: true }));

    try {
      if (nextState) {
        await interviewQuestionService.markQuestionAsAsked({
          questionId,
          candidateId,
          applicationId,
          interviewRoundId,
          roundName: currentRoundName,
          interviewerId,
          interviewerName,
        });
        addToast({
          type: 'success',
          message: 'Đã đánh dấu câu hỏi đã sử dụng trong buổi phỏng vấn.',
        });
      } else {
        await interviewQuestionService.unmarkQuestionAsAsked({
          questionId,
          candidateId,
          applicationId,
          interviewRoundId,
        });
        addToast({
          type: 'info',
          message: 'Đã hoàn tác đánh dấu câu hỏi.',
        });
      }

      if (onToggleMarkAsked) {
        onToggleMarkAsked(questionId, nextState);
      }
    } catch (err: unknown) {
      // 2. Rollback state nếu xảy ra lỗi
      setCurrentSessionAskedIds((prev) => ({
        ...prev,
        [questionId]: previousState,
      }));
      const formattedErr = handleInterviewQuestionError(
        err,
        nextState
          ? 'Không thể lưu trạng thái đánh dấu câu hỏi. Vui lòng thử lại.'
          : 'Không thể bỏ đánh dấu câu hỏi. Vui lòng thử lại.',
      );
      addToast({
        type: 'error',
        message: formattedErr.message,
      });
    } finally {
      setMutatingQuestionIds((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  // Sao chép nội dung câu hỏi vào clipboard
  const handleCopyQuestion = (question: SuggestedQuestionItem) => {
    navigator.clipboard.writeText(question.content);
    setCopiedQuestionId(question.id);
    setTimeout(() => setCopiedQuestionId(null), 2000);
  };

  // Đặt lại các bộ lọc về mặc định
  const handleResetFilters = () => {
    setSelectedPosition('ALL');
    setSelectedCriterion('ALL');
    setSelectedDifficulty('ALL');
    setSelectedAskedFilter('ALL');
    setSearchKeyword('');
  };

  // Kiểm tra xem một câu hỏi đã hỏi ở vòng trước hay chưa
  const checkIsAskedInPreviousRound = useCallback(
    (q: SuggestedQuestionItem): boolean => {
      if (q.askedInPreviousRound?.isAsked) return true;
      if (previouslyAskedQuestionIds.includes(q.id)) return true;
      return false;
    },
    [previouslyAskedQuestionIds],
  );

  // Lọc danh sách câu hỏi theo các tiêu chí (AC 1 & AC 2)
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // 1. Lọc theo chức danh vị trí tuyển dụng
      if (selectedPosition !== 'ALL') {
        const matchesPos =
          q.positionName === selectedPosition || q.positionName === 'Tất cả vị trí';
        if (!matchesPos) return false;
      }

      // 2. Lọc theo tiêu chí đánh giá năng lực
      if (selectedCriterion !== 'ALL') {
        if (q.criterionId !== selectedCriterion && q.criterionName !== selectedCriterion) {
          return false;
        }
      }

      // 3. Lọc theo độ khó
      if (selectedDifficulty !== 'ALL' && q.difficulty !== selectedDifficulty) {
        return false;
      }

      // 4. Lọc theo tình trạng đã hỏi
      const isAskedPrev = checkIsAskedInPreviousRound(q);
      const isAskedCurr = !!currentSessionAskedIds[q.id];

      if (selectedAskedFilter === 'PREVIOUS_ROUND' && !isAskedPrev) return false;
      if (selectedAskedFilter === 'CURRENT_SESSION' && !isAskedCurr) return false;
      if (selectedAskedFilter === 'UNASKED' && (isAskedPrev || isAskedCurr)) return false;

      // 5. Lọc theo từ khóa tìm kiếm
      if (searchKeyword.trim()) {
        const lower = searchKeyword.toLowerCase().trim();
        const matchContent = q.content.toLowerCase().includes(lower);
        const matchCriterion = q.criterionName.toLowerCase().includes(lower);
        const matchHint = q.answerHint?.toLowerCase().includes(lower) ?? false;
        const matchGoodAnswer =
          q.goodAnswerCriteria?.keyPoints?.some((pt) => pt.toLowerCase().includes(lower)) ||
          q.goodAnswerCriteria?.excellentAnswer?.toLowerCase().includes(lower);

        if (!matchContent && !matchCriterion && !matchHint && !matchGoodAnswer) {
          return false;
        }
      }

      return true;
    });
  }, [
    questions,
    selectedPosition,
    selectedCriterion,
    selectedDifficulty,
    selectedAskedFilter,
    searchKeyword,
    currentSessionAskedIds,
    checkIsAskedInPreviousRound,
  ]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = questions.length;
    const askedPrevCount = questions.filter((q) => checkIsAskedInPreviousRound(q)).length;
    const askedCurrCount = Object.values(currentSessionAskedIds).filter(Boolean).length;
    const filteredCount = filteredQuestions.length;
    return { total, askedPrevCount, askedCurrCount, filteredCount };
  }, [questions, currentSessionAskedIds, filteredQuestions, checkIsAskedInPreviousRound]);

  if (!isOpen && variant !== 'inline') return null;

  // Render thẻ độ khó trực quan
  const renderDifficultyBadge = (difficulty: QuestionDifficulty) => {
    switch (difficulty) {
      case 'EASY':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            Dễ
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            Trung bình
          </span>
        );
      case 'HARD':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            Khó
          </span>
        );
      default:
        return null;
    }
  };

  // Nội dung chính của component
  const contentBody = (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* 1. Header & Title Bar */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 text-white px-5 sm:px-6 py-4 shrink-0 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight truncate">
                  Ngân hàng câu hỏi gợi ý
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/30 text-indigo-100 border border-indigo-400/30">
                  <BookOpen className="w-3 h-3" /> Chuẩn hóa phỏng vấn
                </span>
              </div>
              <p className="text-xs text-indigo-200 truncate mt-0.5">
                Ứng viên: <strong className="text-white">{candidateName}</strong> • {currentRoundName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleRefreshQuestions}
              disabled={isLoading}
              title="Tải lại ngân hàng câu hỏi"
              className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {onClose && variant !== 'inline' && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng bảng câu hỏi"
                className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Thống kê nhanh & tiến độ */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-indigo-600/50 text-[11px] sm:text-xs">
          <div className="bg-white/10 backdrop-blur-xs px-2.5 py-1.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
            <span className="text-indigo-200">Hiển thị:</span>
            <span className="font-bold text-white">{stats.filteredCount}/{stats.total} câu</span>
          </div>

          <div className="bg-amber-500/20 backdrop-blur-xs border border-amber-400/30 px-2.5 py-1.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
            <span className="text-amber-200 flex items-center gap-1">
              <History className="w-3 h-3" /> Đã hỏi vòng trước:
            </span>
            <span className="font-bold text-amber-100">{stats.askedPrevCount}</span>
          </div>

          <div className="bg-emerald-500/20 backdrop-blur-xs border border-emerald-400/30 px-2.5 py-1.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
            <span className="text-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Đã hỏi vòng này:
            </span>
            <span className="font-bold text-emerald-100">{stats.askedCurrCount}</span>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Panel (AC 1) */}
      <div className="p-4 sm:p-5 bg-white border-b border-slate-200 shadow-2xs space-y-3 shrink-0">
        {/* Search input */}
        <div className="relative">
          <label htmlFor={searchInputId} className="sr-only">
            Tìm kiếm câu hỏi hoặc gợi ý đáp án
          </label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id={searchInputId}
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm theo nội dung câu hỏi, từ khóa kỹ thuật, gợi ý đáp án..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => setSearchKeyword('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-0.5">
          {/* Lọc theo Chức danh vị trí (AC 1) */}
          <div className="space-y-1">
            <label htmlFor={positionFilterId} className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-indigo-600" />
              Chức danh tuyển dụng
            </label>
            <select
              id={positionFilterId}
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="ALL">Tất cả chức danh</option>
              {availablePositions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Tiêu chí năng lực (AC 1) */}
          <div className="space-y-1">
            <label htmlFor={criterionFilterId} className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-600" />
              Tiêu chí năng lực
            </label>
            <select
              id={criterionFilterId}
              value={selectedCriterion}
              onChange={(e) => setSelectedCriterion(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none focus:border-indigo-500 truncate"
            >
              <option value="ALL">Tất cả tiêu chí đánh giá</option>
              {availableCriteria.map((crit) => (
                <option key={crit.id} value={crit.id}>
                  {crit.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Độ khó */}
          <div className="space-y-1">
            <label htmlFor={difficultyFilterId} className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500" />
              Mức độ khó
            </label>
            <select
              id={difficultyFilterId}
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="ALL">Mọi độ khó</option>
              <option value="EASY">Dễ (Khái niệm cơ bản)</option>
              <option value="MEDIUM">Trung bình (Ứng dụng thực tế)</option>
              <option value="HARD">Khó (Chuyên sâu & Xử lý sự cố)</option>
            </select>
          </div>

          {/* Lọc theo Tình trạng hỏi */}
          <div className="space-y-1">
            <label htmlFor={statusFilterId} className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-500" />
              Tình trạng câu hỏi
            </label>
            <select
              id={statusFilterId}
              value={selectedAskedFilter}
              onChange={(e) => setSelectedAskedFilter(e.target.value as typeof selectedAskedFilter)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="ALL">Tất cả tình trạng</option>
              <option value="UNASKED">Chưa hỏi (Nên ưu tiên)</option>
              <option value="PREVIOUS_ROUND">⚠️ Đã hỏi ở vòng trước</option>
              <option value="CURRENT_SESSION">✅ Đã hỏi trong buổi này</option>
            </select>
          </div>
        </div>

        {/* Bottom controls: Actions and Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleToggleExpandAll(true)}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              Mở rộng tất cả đáp án
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() => handleToggleExpandAll(false)}
              className="text-[11px] text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
            >
              Thu gọn tất cả
            </button>
          </div>

          {(selectedPosition !== 'ALL' ||
            selectedCriterion !== 'ALL' ||
            selectedDifficulty !== 'ALL' ||
            selectedAskedFilter !== 'ALL' ||
            searchKeyword) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* 3. Questions List Cards (AC 2) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center my-4 space-y-3 shadow-2xs">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              Đang tải danh sách câu hỏi gợi ý...
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Hệ thống đang truy xuất ngân hàng câu hỏi và lịch sử phỏng vấn của ứng viên.
            </p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center my-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Không tìm thấy câu hỏi phù hợp
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
              Thử nới lỏng bộ lọc chức danh, tiêu chí năng lực hoặc từ khóa tìm kiếm để xem thêm câu hỏi gợi ý.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
            >
              Xem tất cả câu hỏi gợi ý
            </button>
          </div>
        ) : (
          filteredQuestions.map((q, index) => {
            const isExpanded = !!expandedQuestionIds[q.id];
            const isAskedInPrev = checkIsAskedInPreviousRound(q);
            const isAskedInCurr = !!currentSessionAskedIds[q.id];
            const prevRoundInfo = q.askedInPreviousRound;

            return (
              <div
                key={q.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                  isAskedInCurr
                    ? 'border-emerald-300 ring-2 ring-emerald-100 bg-emerald-50/10'
                    : isAskedInPrev
                    ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/15'
                    : 'border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                }`}
              >
                {/* Header card: Meta, Badges, Question number */}
                <div className="p-4 sm:p-4.5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      {renderDifficultyBadge(q.difficulty)}
                      <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {q.criterionName}
                      </span>
                      {q.positionName && q.positionName !== 'Tất cả vị trí' && (
                        <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] text-slate-500 bg-slate-100 rounded">
                          {q.positionName}
                        </span>
                      )}
                    </div>

                    {/* Huy hiệu cảnh báo đã hỏi ở vòng trước (AC 2) */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isAskedInPrev && (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs animate-in fade-in"
                          title={
                            prevRoundInfo?.notes ||
                            'Ứng viên đã được hỏi câu này ở vòng trước, cân nhắc tránh hỏi lại trùng lặp.'
                          }
                        >
                          <History className="w-3.5 h-3.5 text-amber-700" />
                          {`Đã hỏi ở ${prevRoundInfo?.roundName || 'vòng trước'}`}
                        </span>
                      )}

                      {/* Huy hiệu đã hỏi trong buổi phỏng vấn hiện tại */}
                      {isAskedInCurr && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Đã hỏi vòng này
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nội dung câu hỏi chính */}
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                    {q.content}
                  </h3>

                  {/* Cảnh báo chi tiết nếu đã hỏi ở vòng trước */}
                  {isAskedInPrev && prevRoundInfo && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-semibold text-[11px] sm:text-xs">
                          {`Lưu ý tránh hỏi trùng: Câu hỏi đã được thực hiện tại ${prevRoundInfo.roundName}${
                            prevRoundInfo.interviewerName ? ` bởi ${prevRoundInfo.interviewerName}` : ''
                          }${prevRoundInfo.askedDate ? ` (${prevRoundInfo.askedDate})` : ''}.`}
                        </p>
                        {prevRoundInfo.notes && (
                          <p className="text-[11px] text-amber-800 italic">
                            Ghi chú trước: &quot;{prevRoundInfo.notes}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Thanh thao tác nhanh trên mỗi câu hỏi */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {/* Nút Đánh dấu đã hỏi / Bỏ đánh dấu */}
                      <button
                        type="button"
                        disabled={mutatingQuestionIds[q.id]}
                        onClick={() => handleToggleMarkCurrentSession(q.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                          isAskedInCurr
                            ? 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="Đánh dấu câu hỏi này đã được hội đồng đưa ra trong buổi hôm nay"
                      >
                        {mutatingQuestionIds[q.id] ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : isAskedInCurr ? (
                          <>
                            <CheckSquare className="w-3.5 h-3.5" />
                            Đã hỏi
                          </>
                        ) : (
                          <>
                            <Square className="w-3.5 h-3.5 text-slate-400" />
                            Đánh dấu đã hỏi
                          </>
                        )}
                      </button>

                      {/* Nút Sao chép câu hỏi */}
                      <button
                        type="button"
                        onClick={() => handleCopyQuestion(q)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                        title="Sao chép nội dung câu hỏi"
                      >
                        {copiedQuestionId === q.id ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <Check className="w-3.5 h-3.5" /> Đã chép
                          </span>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" /> Sao chép
                          </>
                        )}
                      </button>

                      {/* Nút Chọn câu hỏi vào phiếu đánh giá nếu có callback */}
                      {onSelectQuestion && (
                        <button
                          type="button"
                          onClick={() => onSelectQuestion(q)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                        >
                          <Award className="w-3.5 h-3.5" /> Chấm điểm câu này
                        </button>
                      )}
                    </div>

                    {/* Nút Mở rộng / Thu gọn gợi ý đáp án tốt (AC 2) */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(q.id)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      {isExpanded ? 'Ẩn gợi ý đáp án' : 'Xem gợi ý đáp án tốt'}
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 4. Khung Accordion Gợi ý đáp án tốt & Khung chấm điểm (AC 2) */}
                {isExpanded && (
                  <div className="bg-slate-50/80 border-t border-slate-200 p-4 sm:p-5 space-y-3.5 animate-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Gợi ý đáp án & Tiêu chuẩn đánh giá câu trả lời
                    </div>

                    {/* Gợi ý chung (answerHint) */}
                    {q.answerHint && (
                      <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                        <span className="font-bold text-slate-900 block mb-1">
                          💡 Định hướng câu hỏi:
                        </span>
                        <p className="leading-relaxed">{q.answerHint}</p>
                      </div>
                    )}

                    {/* Ý chính mong đợi (Key Points) */}
                    {q.goodAnswerCriteria?.keyPoints && q.goodAnswerCriteria.keyPoints.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                        <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                          Các ý then chốt cần có trong câu trả lời:
                        </span>
                        <ul className="space-y-1.5 pl-5 list-disc text-xs text-slate-700 leading-relaxed">
                          {q.goodAnswerCriteria.keyPoints.map((point, pIdx) => (
                            <li key={pIdx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Khung chấm điểm chi tiết: Xuất sắc vs Trung bình vs Red Flags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Tiêu chuẩn trả lời xuất sắc (Điểm 4 - 5) */}
                      {q.goodAnswerCriteria?.excellentAnswer && (
                        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                          <span className="font-bold text-emerald-900 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                            Câu trả lời xuất sắc (Điểm 4.0 - 5.0)
                          </span>
                          <p className="text-emerald-800 leading-relaxed text-[11px] sm:text-xs">
                            {q.goodAnswerCriteria.excellentAnswer}
                          </p>
                        </div>
                      )}

                      {/* Dấu hiệu cảnh báo / Red Flags (Điểm < 2.5) */}
                      {q.goodAnswerCriteria?.redFlags && (
                        <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5">
                          <span className="font-bold text-rose-900 flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            Dấu hiệu cảnh báo / Chưa đạt (Điểm &lt; 2.5)
                          </span>
                          <p className="text-rose-800 leading-relaxed text-[11px] sm:text-xs">
                            {q.goodAnswerCriteria.redFlags}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Tiêu chuẩn trả lời trung bình (nếu có) */}
                    {q.goodAnswerCriteria?.averageAnswer && (
                      <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 space-y-1">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-slate-500" />
                          Mức độ trung bình / Đạt yêu cầu (Điểm 2.5 - 3.5):
                        </span>
                        <p className="leading-relaxed text-[11px] sm:text-xs text-slate-600">
                          {q.goodAnswerCriteria.averageAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. Footer tóm tắt */}
      <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="w-4 h-4 text-indigo-500" />
          <span>
            Hội đồng phỏng vấn có thể tùy biến cách diễn đạt phù hợp với phản ứng của ứng viên.
          </span>
        </div>
        {onClose && variant !== 'inline' && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            Đóng
          </button>
        )}
      </div>
    </div>
  );

  // Render theo từng biến thể giao diện (variant) (AC 3)
  if (variant === 'inline') {
    return (
      <div className={`rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden ${className}`}>
        {contentBody}
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-suggested-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      >
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 z-10">
          {contentBody}
        </div>
      </div>
    );
  }

  // Variant default: Slide-over Drawer từ bên phải màn hình
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bảng câu hỏi phỏng vấn gợi ý"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen max-w-xl sm:max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ${className}`}
        >
          {contentBody}
        </div>
      </div>
    </div>
  );
};

export default InterviewSuggestedQuestions;
