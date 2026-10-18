import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  Star,
  ShieldAlert,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  MessageSquare,
  History,
  Lock,
  ChevronDown,
  ChevronUp,
  Share2,
  Calendar,
  Award,
} from 'lucide-react';
import { tokenService } from '../../services/token.service';
import usePermission from '../../hooks/usePermission';
import { useToast } from '../../components/notifications/useToast';
import { candidateProfileService, CandidateAccessDeniedError } from '../../services/candidateProfileService';
import { candidateMergeService } from '../../services/candidateMergeService';
import type {
  UnifiedCandidate,
  ApplicationRecord,
  CandidateStage,
} from '../../types/candidate';
import type {
  DuplicateCandidateComparison,
  MergeHistoryRecord,
} from '../../types/duplicateCandidate';
import { CANDIDATE_STAGE_CONFIG } from '../../types/candidate';
import InlineCVPreview from '../../components/Candidate/InlineCVPreview';
import ApplicationHistoryList from '../../components/Candidate/ApplicationHistoryList';
import CandidateTagsManager from '../../components/Candidate/CandidateTagsManager';
import InternalNotesSection from '../../components/Candidate/InternalNotesSection';
import DuplicateCandidateBanner from '../../components/Candidate/DuplicateCandidateBanner';
import MergeUndoBanner from '../../components/Candidate/MergeUndoBanner';
import DuplicateCandidateCompareModal from '../../components/Candidate/DuplicateCandidateCompareModal';
import { MatchingScoreBadge } from '../../components/Candidate/MatchingScoreBadge';
import { CandidateCriteriaEvaluationCard } from '../../components/Candidate/CandidateCriteriaEvaluationCard';
import { resolveCandidateMatchingEvaluation } from '../../utils/candidateMatchingHelper';

import CandidateInteractionTimeline from '../../components/Candidate/CandidateInteractionTimeline';
import MoveStageModal from '../../components/Candidate/MoveStageModal';
import RejectCandidateModal from '../../components/Candidate/RejectCandidateModal';
import InterviewScheduleModal from '../../components/Candidate/InterviewScheduleModal';
import CandidateInterviewsList from '../../components/Candidate/CandidateInterviewsList';
import { interviewService } from '../../services/interviewService';
import EmailAuditLogPage from './EmailAuditLogPage';
import type { InterviewSchedulePayload } from '../../types/interview';
import type {
  MoveCandidateStagePayload,
  RejectCandidatePayload,
} from '../../services/candidateStageService';

const PIPELINE_STEPS: { stage: CandidateStage; label: string; stepNumber: number }[] = [
  { stage: 'NEW', label: 'Hồ sơ mới', stepNumber: 1 },
  { stage: 'SCREENING', label: 'Sàng lọc', stepNumber: 2 },
  { stage: 'INTERVIEWING', label: 'Phỏng vấn', stepNumber: 3 },
  { stage: 'OFFER', label: 'Đề xuất offer', stepNumber: 4 },
  { stage: 'HIRED', label: 'Nhận việc', stepNumber: 5 },
];

export const UnifiedCandidateProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { permissions } = usePermission();
  const { addToast } = useToast();

  const [candidate, setCandidate] = useState<UnifiedCandidate | null>(null);
  const [activeAppId, setActiveAppId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [isCoverLetterExpanded, setIsCoverLetterExpanded] = useState<boolean>(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<'profile' | 'cv'>('profile');
  const [contentTab, setContentTab] = useState<'overview' | 'history' | 'notes' | 'timeline' | 'interviews' | 'emails'>('overview');
  const [candidateInterviews, setCandidateInterviews] = useState<InterviewSchedulePayload[]>([]);
  const [isLoadingInterviews, setIsLoadingInterviews] = useState<boolean>(false);
  const [isMoveStageModalOpen, setIsMoveStageModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);

  // Duplicate candidate & Merge history states (AC 1, AC 2, AC 4)
  const [duplicateComparison, setDuplicateComparison] = useState<DuplicateCandidateComparison | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [activeMergeRecord, setActiveMergeRecord] = useState<MergeHistoryRecord | null>(null);

  const currentUser = tokenService.getUserData();

  // Load candidate profile & detect duplicate
  const fetchCandidate = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await candidateProfileService.getUnifiedCandidateProfile(id);
      setCandidate(data);

      // Check access permission (AC 4)
      const allowed = candidateProfileService.checkCandidateAccess(data, currentUser, permissions);
      setHasAccess(allowed);
      if (!allowed) {
        addToast({
          type: 'error',
          message: 'Bạn không có quyền truy cập hồ sơ ứng viên này (403 Forbidden).',
        });
      }

      if (data.applications && data.applications.length > 0) {
        const currentApp =
          data.applications.find((a) => a.id === data.currentApplicationId) ||
          data.applications[0];
        setActiveAppId(currentApp.id);
      }

      // Phát hiện hồ sơ trùng (AC 1)
      const dup = await candidateMergeService.checkDuplicateCandidates({
        candidateId: data.id,
        email: data.email,
        phone: data.phone,
      });
      setDuplicateComparison(dup);

      // Kiểm tra bản ghi gộp còn hạn hoàn tác (AC 3)
      const mergeRec = candidateMergeService.getMergeRecordForCandidate(data.id);
      setActiveMergeRecord(mergeRec);
    } catch (err: unknown) {
      if (err instanceof CandidateAccessDeniedError || (err as { status?: number })?.status === 403) {
        setHasAccess(false);
        addToast({
          type: 'error',
          message: 'Bạn không có quyền truy cập hồ sơ ứng viên này (403 Forbidden).',
        });
      } else {
        addToast({
          type: 'error',
          message: 'Không thể tải thông tin hồ sơ ứng viên. Vui lòng thử lại.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, currentUser, permissions, addToast]);

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  // Tải danh sách lịch phỏng vấn của ứng viên (AC 1 & AC 3)
  const loadCandidateInterviews = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoadingInterviews(true);
      const data = await interviewService.getCandidateInterviews(activeAppId || '', id);
      setCandidateInterviews(data);
    } catch {
      // Ignored
    } finally {
      setIsLoadingInterviews(false);
    }
  }, [id, activeAppId]);

  useEffect(() => {
    loadCandidateInterviews();
  }, [loadCandidateInterviews]);

  // Xử lý sau khi gộp thành công (AC 2 & AC 3)
  const handleMergeSuccess = (mergedCandidate: UnifiedCandidate) => {
    setCandidate(mergedCandidate);
    setDuplicateComparison(null);
    const mergeRec = candidateMergeService.getMergeRecordForCandidate(mergedCandidate.id);
    setActiveMergeRecord(mergeRec);
    addToast({
      type: 'success',
      message: 'Đã gộp hồ sơ thành công! Toàn bộ lịch sử các đợt ứng tuyển, CV, Tags và Notes đã được hợp nhất.',
    });
  };

  // Xử lý sau khi hoàn tác thành công (AC 4)
  const handleUndoSuccess = () => {
    setActiveMergeRecord(null);
    fetchCandidate();
    addToast({
      type: 'success',
      message: 'Đã hoàn tác gộp hồ sơ thành công. Hai hồ sơ đã được khôi phục trạng thái ban đầu.',
    });
  };

  // Selected application
  const activeApplication: ApplicationRecord | undefined = candidate?.applications.find(
    (app) => app.id === activeAppId
  ) || candidate?.applications[0];

  const handleApplicationStageUpdated = (
    stage: CandidateStage,
    payload: MoveCandidateStagePayload | RejectCandidatePayload,
  ) => {
    setCandidate((previousCandidate) => {
      if (!previousCandidate) return previousCandidate;
      return {
        ...previousCandidate,
        applications: previousCandidate.applications.map((application) => (
          application.id === activeAppId
            ? {
                ...application,
                stage,
                ...(stage === 'REJECTED' && 'reason' in payload
                  ? { rejectionReason: payload.reason }
                  : {}),
              }
            : application
        )),
        updatedAt: new Date().toISOString(),
      };
    });
    setIsMoveStageModalOpen(false);
    setIsRejectModalOpen(false);
  };

  // Handle rating change
  const handleRatingChange = async (newRating: number) => {
    if (!candidate) return;
    try {
      await candidateProfileService.updateCandidateRating(candidate.id, newRating);
      setCandidate((prev) => (prev ? { ...prev, rating: newRating } : prev));
      addToast({
        type: 'success',
        message: `Đã cập nhật đánh giá ${newRating}/5 sao cho ứng viên.`,
      });
    } catch {
      addToast({
        type: 'error',
        message: 'Lỗi khi cập nhật đánh giá.',
      });
    }
  };

  // Handle add tag
  const handleAddTag = async (tagName: string) => {
    if (!candidate) return;
    try {
      const updatedTags = [...candidate.tags, { id: `tag-${Date.now()}`, name: tagName, colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' }];
      await candidateProfileService.updateCandidateTags(candidate.id, updatedTags);
      setCandidate((prev) =>
        prev ? { ...prev, tags: updatedTags } : prev
      );
      addToast({
        type: 'success',
        message: `Đã gắn nhãn "${tagName}" vào hồ sơ.`,
      });
    } catch (err: unknown) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Lỗi khi thêm nhãn.',
      });
      throw err;
    }
  };

  // Handle remove tag
  const handleRemoveTag = async (tagId: string) => {
    if (!candidate) return;
    try {
      const remainingTags = candidate.tags.filter((t) => t.id !== tagId);
      await candidateProfileService.updateCandidateTags(candidate.id, remainingTags);
      setCandidate((prev) =>
        prev ? { ...prev, tags: remainingTags } : prev
      );
      addToast({
        type: 'success',
        message: 'Đã gỡ nhãn khỏi hồ sơ.',
      });
    } catch {
      addToast({
        type: 'error',
        message: 'Lỗi khi gỡ nhãn.',
      });
    }
  };

  // Handle add note
  const handleAddNote = async (
    content: string,
    category?: 'GENERAL' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'CULTURE'
  ) => {
    if (!candidate) return;
    try {
      const user = tokenService.getUserData();
      const author = {
        fullName: user?.fullName || 'Người dùng nội bộ',
        role: user?.roles?.[0] || 'Nhân sự',
      };
      const newNote = await candidateProfileService.addCandidateNote(
        candidate.id,
        { content, category },
        author
      );
      setCandidate((prev) =>
        prev ? { ...prev, notes: [newNote, ...prev.notes] } : prev
      );
      addToast({
        type: 'success',
        message: 'Đã lưu ghi chú nội bộ thành công.',
      });
    } catch (err: unknown) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Lỗi khi lưu ghi chú.',
      });
      throw err;
    }
  };

  // Format date helper (Asia/Ho_Chi_Minh)
  const formatDateVN = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // 1. Loading state
  if (isLoading) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-600">Đang tải hồ sơ ứng viên hợp nhất...</p>
      </div>
    );
  }

  // 2. 403 Forbidden Access State (AC 5)
  if (!hasAccess || !candidate) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border border-rose-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <span className="inline-block px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          403 Forbidden — Quyền riêng tư & Bảo mật
        </span>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Bạn không có quyền truy cập hồ sơ ứng viên này
        </h2>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Theo tiêu chuẩn bảo vệ dữ liệu cá nhân của hệ thống, chỉ{' '}
          <strong>Recruiter phụ trách</strong>,{' '}
          <strong>Hiring Manager của vị trí tuyển dụng</strong> hoặc{' '}
          <strong>Bộ phận Quản lý nhân sự</strong> mới được cấp quyền xem chi tiết hồ sơ, CV và
          lịch sử ứng tuyển của ứng viên này.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang trước
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-xs"
          >
            Về Bảng điều khiển
          </button>
        </div>
      </div>
    );
  }

  // Current stage metadata
  const currentStage = activeApplication?.stage || 'NEW';
  const stageConfig = CANDIDATE_STAGE_CONFIG[currentStage];
  const isTerminated = currentStage === 'REJECTED' || currentStage === 'WITHDRAWN';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        {/* Mobile View Switcher */}
        <div className="flex lg:hidden bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMobileTab('profile')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mobileTab === 'profile'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Thông tin hồ sơ
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('cv')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mobileTab === 'cv'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Xem trước CV
          </button>
        </div>
      </div>

      {/* 1. Thanh cảnh báo phát hiện trùng lặp hồ sơ (AC 1) */}
      {duplicateComparison && (
        <DuplicateCandidateBanner
          comparison={duplicateComparison}
          onOpenCompare={() => setIsCompareModalOpen(true)}
        />
      )}

      {/* 2. Thanh trạng thái & Hoàn tác gộp trong 24 giờ (AC 4) */}
      {activeMergeRecord && (
        <MergeUndoBanner
          mergeRecord={activeMergeRecord}
          onUndoSuccess={handleUndoSuccess}
        />
      )}

      {/* Main Candidate Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left info */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 font-mono">
                {candidate.candidateCode}
              </span>

              {/* Source Badge */}
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                <Share2 className="w-3 h-3 text-slate-500" />
                {activeApplication?.source.label || 'Cổng tuyển dụng'}
                {activeApplication?.source.referrerName && (
                  <strong className="text-indigo-600 font-semibold">
                    : {activeApplication.source.referrerName}
                  </strong>
                )}
              </span>

              {/* Overall Stage Badge */}
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${stageConfig.badgeClass}`}
              >
                {stageConfig.label}
              </span>

              {/* Huy hiệu Điểm tổng phù hợp & cờ Đạt / Không đạt (Task TKNHTTDNB1-410) */}
              <MatchingScoreBadge
                totalMatchingScore={
                  (candidate.matchingEvaluation || resolveCandidateMatchingEvaluation(candidate)).totalMatchingScore
                }
                isOverallPassed={
                  (candidate.matchingEvaluation || resolveCandidateMatchingEvaluation(candidate)).isOverallPassed
                }
                variant="standard"
              />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {candidate.fullName}
              </h1>
              {candidate.currentTitle && (
                <p className="text-sm sm:text-base font-medium text-gray-600 mt-1 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  {candidate.currentTitle}
                  {candidate.experienceYears && (
                    <span className="text-xs text-gray-500 font-normal">
                      • {candidate.experienceYears} năm kinh nghiệm
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Contact info */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-gray-600 pt-1">
              <a
                href={`mailto:${candidate.email}`}
                className="inline-flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
              >
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{candidate.email}</span>
              </a>
              <a
                href={`tel:${candidate.phone}`}
                className="inline-flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
              >
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{candidate.phone}</span>
              </a>
              <span className="inline-flex items-center gap-1.5 text-gray-400">
                <Clock className="w-4 h-4" />
                Hồ sơ tạo: {formatDateVN(candidate.createdAt)}
              </span>
            </div>
          </div>

          {/* Right rating widget */}
          <div className="lg:text-right shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-700 block mb-1">
              Đánh giá tổng quan (1 - 5 sao)
            </span>
            <div className="flex items-center lg:justify-end gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled =
                  hoverRating !== null
                    ? star <= hoverRating
                    : star <= candidate.rating;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => handleRatingChange(star)}
                    className="p-1 hover:scale-110 transition-transform focus:outline-none"
                    title={`Đánh giá ${star} sao`}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        isFilled
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              {candidate.rating > 0
                ? `Mức đánh giá hiện tại: ${candidate.rating}/5 sao`
                : 'Chưa có đánh giá sao'}
            </p>
          </div>
        </div>

        {/* Pipeline Stepper */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Tiến trình tuyển dụng cho vị trí: {activeApplication?.jobTitle || 'Chưa chọn'}
            </span>
            {activeApplication?.jobCode && (
              <span className="text-xs text-gray-500 font-mono">
                Mã tuyển dụng: {activeApplication.jobCode}
              </span>
            )}
          </div>

          {!isTerminated ? (
            <>
              <div className="grid grid-cols-5 gap-2 sm:gap-4 relative">
                {PIPELINE_STEPS.map((step) => {
                const currentStepNum = stageConfig.stepNumber;
                const isPassed = currentStepNum > step.stepNumber;
                const isCurrent = currentStepNum === step.stepNumber;

                return (
                  <div
                    key={step.stage}
                    className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                      isCurrent
                        ? 'bg-indigo-50 border border-indigo-200'
                        : isPassed
                        ? 'bg-emerald-50/60 border border-emerald-100'
                        : 'bg-gray-50 border border-gray-100 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-all ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        step.stepNumber
                      )}
                    </div>
                    <span
                      className={`text-[11px] sm:text-xs font-semibold truncate w-full ${
                        isCurrent
                          ? 'text-indigo-900 font-bold'
                          : isPassed
                          ? 'text-emerald-800'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  data-testid="btn-view-evaluation-summary-profile"
                  onClick={() => navigate(`/candidates/${candidate.id}/evaluation-summary`)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3.5 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-100 shadow-2xs"
                  title="Xem hồ sơ tổng hợp đánh giá toàn diện để ra quyết định tuyển dụng (User Story S7-02)"
                >
                  <Award className="w-4 h-4 text-purple-600" />
                  Tổng hợp đánh giá
                </button>
                <button
                  type="button"
                  onClick={() => setIsInterviewModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  <Calendar className="w-4 h-4" />
                  Đặt lịch phỏng vấn
                </button>
                <button
                  type="button"
                  onClick={() => setIsMoveStageModalOpen(true)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Chuyển giai đoạn
                </button>
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(true)}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  Từ chối ứng viên
                </button>
              </div>
            </>
          ) : (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                currentStage === 'REJECTED'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {currentStage === 'REJECTED' ? (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5 text-xs sm:text-sm">
                <div className="font-bold flex items-center gap-2">
                  <span>{stageConfig.label}</span>
                  <span className="font-normal text-xs opacity-75">
                    (Đã dừng quy trình ứng tuyển)
                  </span>
                </div>
                <p className="opacity-90">
                  {activeApplication?.rejectionReason ||
                    activeApplication?.withdrawalReason ||
                    stageConfig.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Split Screen 2 Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (55% on lg): Information & Tabs */}
        <div
          className={`lg:col-span-6 xl:col-span-7 space-y-5 ${
            mobileTab === 'cv' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            <button
              type="button"
              onClick={() => setContentTab('overview')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                contentTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Tổng quan & Đợt hiện tại
            </button>
            <button
              type="button"
              onClick={() => setContentTab('history')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                contentTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <History className="w-4 h-4" />
              Lịch sử ứng tuyển ({candidate.applications.length})
            </button>
            <button
              type="button"
              onClick={() => setContentTab('notes')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                contentTab === 'notes'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Ghi chú nội bộ ({candidate.notes.length})
            </button>
            <button
              type="button"
              onClick={() => setContentTab('timeline')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                contentTab === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              Nhật ký tương tác
            </button>
            <button
              type="button"
              onClick={() => setContentTab('interviews')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                contentTab === 'interviews'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Lịch phỏng vấn ({candidateInterviews.length})
            </button>
            <button
              type="button"
              onClick={() => setContentTab('emails')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                contentTab === 'emails'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Mail className="w-4 h-4" />
              Nhật ký email
            </button>
          </div>

          {/* Tab 1: Overview & Details */}
          {contentTab === 'overview' && (
            <div className="space-y-5">
              {/* Upcoming interview banner if any */}
              {candidateInterviews.some((i) => i.status === 'SCHEDULED') && (
                <div className="bg-gradient-to-r from-indigo-50 via-white to-purple-50 p-4 rounded-xl border border-indigo-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-indigo-700 tracking-wider">
                          Lịch phỏng vấn sắp tới
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-100 text-indigo-800">
                          {candidateInterviews.find((i) => i.status === 'SCHEDULED')?.roundName}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5">
                        {candidateInterviews.find((i) => i.status === 'SCHEDULED')?.interviewDate} lúc{' '}
                        {candidateInterviews.find((i) => i.status === 'SCHEDULED')?.interviewTime} (
                        {candidateInterviews.find((i) => i.status === 'SCHEDULED')?.format === 'ONLINE'
                          ? 'Trực tuyến'
                          : 'Trực tiếp'}
                        )
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setContentTab('interviews')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg transition shadow-2xs cursor-pointer"
                  >
                    Xem chi tiết lịch phỏng vấn →
                  </button>
                </div>
              )}

              {/* THẺ ĐÁNH GIÁ TIÊU CHÍ BẮT BUỘC & ĐIỂM PHÙ HỢP (TASK TKNHTTDNB1-410 / STORY TKNHTTDNB1-57) */}
              <CandidateCriteriaEvaluationCard
                evaluation={
                  candidate.matchingEvaluation ||
                  resolveCandidateMatchingEvaluation(candidate)
                }
              />

              {/* Cover Letter Section */}
              {candidate.coverLetter && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Thư giới thiệu / Đôi nét về ứng viên
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsCoverLetterExpanded(!isCoverLetterExpanded)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1"
                    >
                      {isCoverLetterExpanded ? (
                        <>
                          Thu gọn <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          Xem thêm <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                  <p
                    className={`text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line ${
                      !isCoverLetterExpanded ? 'line-clamp-3' : ''
                    }`}
                  >
                    {candidate.coverLetter}
                  </p>
                </div>
              )}

              {/* Tags Manager */}
              <CandidateTagsManager
                tags={candidate.tags}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
              />

              {/* Active Application Summary Card */}
              {activeApplication && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    Chi tiết đợt ứng tuyển đang xem
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-700">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-400 block mb-0.5">Vị trí ứng tuyển</span>
                      <strong className="text-gray-900">{activeApplication.jobTitle}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-400 block mb-0.5">Phòng ban</span>
                      <strong className="text-gray-900">{activeApplication.departmentName}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-400 block mb-0.5">Chuyên viên tuyển dụng (Recruiter)</span>
                      <strong className="text-gray-900">{activeApplication.recruiterName}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-400 block mb-0.5">Trưởng bộ phận (Hiring Manager)</span>
                      <strong className="text-gray-900">{activeApplication.hiringManagerName}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Internal Notes Section Preview */}
              <InternalNotesSection
                notes={candidate.notes}
                onAddNote={handleAddNote}
              />
            </div>
          )}

          {/* Tab 2: Application History */}
          {contentTab === 'history' && (
            <ApplicationHistoryList
              applications={candidate.applications}
              activeApplicationId={activeAppId}
              onSelectApplication={(appId) => setActiveAppId(appId)}
            />
          )}

          {/* Tab 3: Internal Notes Dedicated */}
          {contentTab === 'notes' && (
            <InternalNotesSection
              notes={candidate.notes}
              onAddNote={handleAddNote}
            />
          )}

          {/* Tab 4: Candidate Interaction Timeline */}
          {contentTab === 'timeline' && (
            <CandidateInteractionTimeline candidateId={candidate.id} />
          )}

          {/* Tab 5: Candidate Interviews List (AC 1 & AC 3) */}
          {contentTab === 'interviews' && (
            <CandidateInterviewsList
              interviews={candidateInterviews}
              isLoading={isLoadingInterviews}
              onScheduleNew={() => setIsInterviewModalOpen(true)}
              onStatusChange={async (interviewId, newStatus) => {
                await interviewService.updateInterviewStatus(interviewId, newStatus);
                await loadCandidateInterviews();
              }}
            />
          )}

          {/* Tab 6: Email Audit Log & Retry (S8-02) */}
          {contentTab === 'emails' && (
            <EmailAuditLogPage
              candidateId={candidate.id}
              candidateName={candidate.fullName}
              candidateEmail={candidate.email}
              isEmbedded
            />
          )}
        </div>

        {/* Right Column (45% on lg): Inline CV Preview (Sticky) */}
        <div
          className={`lg:col-span-6 xl:col-span-5 lg:sticky lg:top-4 ${
            mobileTab === 'profile' ? 'hidden lg:block' : 'block'
          }`}
        >
          {activeApplication && (
            <InlineCVPreview
              currentCv={{
                fileName: activeApplication.cvFileName,
                fileUrl: activeApplication.cvFileUrl,
                fileType: activeApplication.cvFileType,
                fileSize: activeApplication.cvFileSize,
                applicationTitle: activeApplication.jobTitle,
                appliedAt: activeApplication.appliedAt,
              }}
              allApplications={candidate.applications}
              activeApplicationId={activeAppId}
              onSelectApplication={(id) => setActiveAppId(id)}
            />
          )}

          {/* Security footnote reminder */}
          <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Tài liệu CV được mã hóa và bảo vệ theo tiêu chuẩn bảo mật dữ liệu nhân sự nội bộ.
            </span>
          </div>
        </div>
      </div>

      {/* Modal So sánh & Gộp hồ sơ ứng viên trùng (AC 2, AC 3 & AC 4) */}
      {duplicateComparison && (
        <DuplicateCandidateCompareModal
          comparison={duplicateComparison}
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          onMergeSuccess={handleMergeSuccess}
        />
      )}
      {candidate && activeApplication && isMoveStageModalOpen && (
        <MoveStageModal
          candidateId={candidate.id}
          candidateName={candidate.fullName}
          applicationId={activeApplication.id}
          currentStage={activeApplication.stage}
          allowException
          onClose={() => setIsMoveStageModalOpen(false)}
          onSuccess={(payload) => handleApplicationStageUpdated(payload.toStage, payload)}
        />
      )}
      {candidate && activeApplication && isRejectModalOpen && (
        <RejectCandidateModal
          candidateId={candidate.id}
          candidateName={candidate.fullName}
          applicationId={activeApplication.id}
          currentStage={activeApplication.stage}
          onClose={() => setIsRejectModalOpen(false)}
          onSuccess={(payload) =>
            handleApplicationStageUpdated(
              payload.interviewResult === 'PASSED' ? 'OFFER' : 'REJECTED',
              payload,
            )
          }
        />
      )}
      {candidate && isInterviewModalOpen && (
        <InterviewScheduleModal
          isOpen={isInterviewModalOpen}
          onClose={() => setIsInterviewModalOpen(false)}
          candidateId={candidate.id}
          candidateName={candidate.fullName}
          candidateEmail={candidate.email}
          applicationId={activeApplication?.id}
          jobTitle={activeApplication?.jobTitle}
          onSuccess={() => {
            fetchCandidate();
            loadCandidateInterviews();
            setContentTab('interviews');
          }}
        />
      )}
    </div>
  );
};

export default UnifiedCandidateProfilePage;
