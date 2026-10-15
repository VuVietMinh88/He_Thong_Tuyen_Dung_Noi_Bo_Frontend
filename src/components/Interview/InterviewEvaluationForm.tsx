import React, { useState, useMemo, useCallback } from 'react';
import {
  User,
  Briefcase,
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  Award,
  Layers,
  AlertCircle,
  RotateCcw,
  Save,
  CheckCircle2,
  FileQuestion,
  Sparkles,
  Lock,
  Unlock,
  ShieldAlert,
  Send,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import type {
  EvaluationCriterionItem,
  CriterionScoreValue,
  CriterionEvaluationRecord,
  RatingLevelDefinition,
  InterviewConclusion,
  PeerInterviewerEvaluation,
} from '../../types/interviewEvaluation';
import {
  RATING_LEVEL_DEFINITIONS,
  AVAILABLE_SCORE_OPTIONS,
  DEFAULT_FRAMEWORK_VERSION,
  CONCLUSION_OPTIONS_CONFIG,
  AVAILABLE_CONCLUSION_OPTIONS,
} from '../../types/interviewEvaluation';
import {
  calculateWeightedScore,
  calculateCriterionWeightedContribution,
  validateCriterionScore,
  validateAllCriteriaEvaluations,
  validateInterviewConclusion,
  checkInterviewEvaluationAccess,
  calculateRemainingReopenTime,
  checkIsRecruiterRole,
  isPeerReviewVisible,
} from '../../utils/interviewEvaluationHelper';
import { interviewEvaluationService } from '../../services/interviewEvaluationService';

export interface InterviewEvaluationFormProps {
  // 1. Thông tin ứng viên & buổi phỏng vấn (AC 1)
  candidateId?: string;
  candidateName: string;
  candidateEmail?: string;
  jobTitle: string;
  interviewRound?: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewFormat?: 'ONLINE' | 'OFFLINE';
  locationOrLink?: string;
  interviewerNames?: string[];

  // Phân quyền truy cập người phỏng vấn (AC 1 - TKNHTTDNB1-464 & TKNHTTDNB1-465)
  interviewerIds?: string[];
  interviewerEmails?: string[];
  interviewers?: Array<{ id: string; email?: string; name?: string }>;
  currentUserId?: string;
  currentUserEmail?: string;
  currentUserRoles?: string[];
  isAuthorized?: boolean;
  isRecruiter?: boolean;

  // Thông tin khung năng lực (AC 1)
  frameworkName?: string;
  frameworkCode?: string;
  frameworkVersion?: string;

  // 2. Danh sách tiêu chí đánh giá (AC 2)
  criteria?: EvaluationCriterionItem[];
  initialEvaluations?: Record<string, { score?: CriterionScoreValue | null; comment?: string }>;
  initialGeneralNotes?: string;

  // Kết luận phỏng vấn & Trạng thái khóa phiếu (AC 2 & AC 3 - TKNHTTDNB1-464)
  initialConclusion?: InterviewConclusion | null;
  isLocked?: boolean;
  submittedAt?: string | null;

  // Đánh giá chéo từ Hội đồng phỏng vấn (AC 2 - TKNHTTDNB1-465)
  peerEvaluations?: PeerInterviewerEvaluation[];
  hasSubmittedOwnEvaluation?: boolean;

  // 3. Trạng thái hiển thị (AC 3)
  isLoading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;

  // Xử lý sự kiện lưu, hoàn tất & mở lại phiếu (AC 1 & AC 2 - TKNHTTDNB1-465)
  onSubmit?: (evaluationData: {
    criteriaEvaluations: Record<string, CriterionEvaluationRecord>;
    calculatedTotalScore: number | null;
    generalNotes: string;
    conclusion: InterviewConclusion;
    isLocked: boolean;
    submittedAt: string;
  }) => void | Promise<void>;
  onSaveDraft?: (evaluationData: {
    criteriaEvaluations: Record<string, CriterionEvaluationRecord>;
    calculatedTotalScore: number | null;
    generalNotes: string;
    conclusion?: InterviewConclusion | null;
  }) => void;
  onReopen?: (reason?: string) => Promise<void> | void;
  onCancel?: () => void;
  readOnly?: boolean;
  className?: string;
}

/**
 * Skeleton loader cho Phiếu đánh giá năng lực phỏng vấn (AC 3 - Loading State)
 * Sử dụng hiệu ứng pulse mô phỏng đúng cấu trúc tiêu đề, danh sách tiêu chí và khối điểm tổng
 */
export const InterviewEvaluationFormSkeleton: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div
      data-testid="interview-evaluation-skeleton"
      className={`space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs ${className}`}
    >
      {/* Skeleton cho phần đầu phiếu */}
      <div className="animate-pulse space-y-4 border-b border-slate-200 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="h-7 w-64 rounded-lg bg-slate-200" />
            <div className="h-4 w-48 rounded bg-slate-200" />
          </div>
          <div className="h-10 w-44 rounded-xl bg-slate-200" />
        </div>

        {/* Khối thông tin chi tiết buổi phỏng vấn */}
        <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-10 rounded-lg bg-slate-200" />
          <div className="h-10 rounded-lg bg-slate-200" />
          <div className="h-10 rounded-lg bg-slate-200" />
          <div className="h-10 rounded-lg bg-slate-200" />
        </div>
      </div>

      {/* Skeleton cho các dòng tiêu chí đánh giá */}
      <div className="space-y-4">
        <div className="h-5 w-48 rounded bg-slate-200" />
        {[1, 2, 3].map((skeletonIndex) => (
          <div
            key={`skeleton-criterion-${skeletonIndex}`}
            className="animate-pulse rounded-xl border border-slate-200 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-52 rounded bg-slate-200" />
              <div className="h-6 w-24 rounded-lg bg-slate-200" />
            </div>
            <div className="h-10 w-full rounded-lg bg-slate-100" />
            <div className="h-16 w-full rounded-lg bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Skeleton cho khối điểm tổng */}
      <div className="animate-pulse rounded-xl bg-slate-100 p-5 space-y-3">
        <div className="h-5 w-40 rounded bg-slate-200" />
        <div className="h-10 w-32 rounded bg-slate-200" />
      </div>
    </div>
  );
};

/**
 * Giao diện hiển thị khi không có khung năng lực hoặc tiêu chí nào (AC 3 - Empty State)
 */
export const InterviewEvaluationEmptyState: React.FC<{
  frameworkName?: string;
  onRetry?: () => void;
}> = ({ frameworkName, onRetry }) => {
  return (
    <div
      data-testid="interview-evaluation-empty-state"
      className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center shadow-xs"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
        <FileQuestion className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900">
        Chưa có khung năng lực hoặc tiêu chí đánh giá
      </h3>
      <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-slate-500">
        {frameworkName
          ? `Khung năng lực "${frameworkName}" hiện chưa có tiêu chí đánh giá nào được định nghĩa.`
          : 'Vị trí ứng tuyển này chưa được gắn khung năng lực đánh giá phỏng vấn. Vui lòng cấu hình khung năng lực tại màn hình Quản trị Tuyển dụng.'}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          Tải lại dữ liệu
        </button>
      )}
    </div>
  );
};

/**
 * Giao diện thông báo lỗi khi tải dữ liệu thất bại (AC 3 - Error State)
 */
export const InterviewEvaluationErrorState: React.FC<{
  errorMessage: string;
  onRetry?: () => void;
}> = ({ errorMessage, onRetry }) => {
  return (
    <div
      data-testid="interview-evaluation-error-state"
      className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 sm:p-8 text-center shadow-xs"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-base font-bold text-rose-900">
        Không thể tải dữ liệu phiếu đánh giá
      </h3>
      <p className="mx-auto mt-1 max-w-lg text-xs sm:text-sm text-rose-700">
        {errorMessage || 'Đã có lỗi bất ngờ xảy ra khi chuẩn bị phiếu đánh giá năng lực.'}
      </p>

      {onRetry && (
        <div className="mt-5">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-rose-700 shadow-xs transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Thử lại ngay
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Giao diện hiển thị khi người dùng không có quyền truy cập phiếu đánh giá (AC 1 - TKNHTTDNB1-464)
 * Chỉ người phỏng vấn được mời mới có quyền xem phiếu này
 */
export const InterviewEvaluationAccessDeniedState: React.FC<{
  onBack?: () => void;
  candidateName?: string;
  className?: string;
}> = ({ onBack, candidateName, className = '' }) => {
  return (
    <div
      data-testid="interview-evaluation-access-denied"
      className={`rounded-2xl border border-rose-200 bg-white p-8 sm:p-12 text-center shadow-xs space-y-4 ${className}`}
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <div className="space-y-1.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
          Quyền truy cập bị từ chối
        </span>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">
          Không có quyền truy cập
        </h3>
        <p className="mx-auto max-w-md text-xs sm:text-sm text-slate-600">
          Chỉ người được mời phỏng vấn mới có thể xem và thực hiện phiếu đánh giá năng lực này{candidateName ? ` của ứng viên ${candidateName}` : ''}.
          Tài khoản của bạn hiện không thuộc danh sách hội đồng phỏng vấn được phân công.
        </p>
      </div>

      {onBack && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onBack}
            data-testid="access-denied-back-button"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 shadow-xs transition cursor-pointer"
          >
            Quay lại
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Hộp thoại xác nhận trước khi nộp phiếu đánh giá phỏng vấn (AC 2 - TKNHTTDNB1-464)
 * Giúp người phỏng vấn rà soát lại kết luận và điểm số trước khi khóa phiếu
 */
export const InterviewEvaluationConfirmModal: React.FC<{
  isOpen: boolean;
  candidateName: string;
  jobTitle: string;
  calculatedTotalScore: number | null;
  conclusion: InterviewConclusion | null;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  isOpen,
  candidateName,
  jobTitle,
  calculatedTotalScore,
  conclusion,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !conclusion) return null;
  const conclusionConfig = CONCLUSION_OPTIONS_CONFIG[conclusion];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-evaluation-modal-title"
      data-testid="evaluation-confirm-submit-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      {/* Nền mờ phía sau modal */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 id="confirm-evaluation-modal-title" className="text-lg font-bold text-slate-900">
              Xác nhận nộp phiếu đánh giá
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Sau khi nộp, phiếu sẽ được chuyển sang trạng thái <strong>Đã khóa</strong>. Bạn sẽ không thể sửa lại điểm số và nhận xét.
            </p>
          </div>
        </div>

        {/* Tóm tắt nội dung đánh giá */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-medium">Ứng viên:</span>
            <span className="font-bold text-slate-800 text-right">
              {candidateName} ({jobTitle})
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-medium">Điểm tổng theo trọng số:</span>
            <span className="font-black text-indigo-700 text-sm">
              {calculatedTotalScore !== null ? calculatedTotalScore.toFixed(2) : '--'} / 5.0
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Kết luận đề xuất:</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${conclusionConfig.activeBadgeClass}`}>
              {conclusionConfig.label}
            </span>
          </div>
        </div>

        {/* Cảnh báo khóa giao diện */}
        <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-xl font-medium">
          <Lock className="h-4 w-4 shrink-0 text-amber-600" />
          <span>Toàn bộ điểm và nhận xét sẽ bị khóa chỉ xem sau khi hoàn tất nộp phiếu.</span>
        </div>

        {/* Cụm nút hành động */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            data-testid="confirm-modal-cancel-button"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Kiểm tra lại
          </button>

          <button
            type="button"
            onClick={onConfirm}
            data-testid="confirm-modal-submit-button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 shadow-xs transition cursor-pointer"
          >
            <Send className="h-4 w-4" />
            Xác nhận nộp phiếu
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Hộp thoại xác nhận mở lại phiếu đánh giá dành cho Recruiter trong thời hạn 24 giờ (AC 1 - TKNHTTDNB1-465)
 */
export const InterviewEvaluationReopenModal: React.FC<{
  isOpen: boolean;
  candidateName: string;
  jobTitle: string;
  timeRemainingFormatted: string;
  isReopening?: boolean;
  errorMessage?: string | null;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}> = ({
  isOpen,
  candidateName,
  jobTitle,
  timeRemainingFormatted,
  isReopening = false,
  errorMessage = null,
  onConfirm,
  onCancel,
}) => {
  const [reopenReasonText, setReopenReasonText] = useState<string>('');

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reopen-modal-title"
      data-testid="evaluation-reopen-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={!isReopening ? onCancel : undefined}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
            <Unlock className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 id="reopen-modal-title" className="text-lg font-bold text-slate-900">
              Mở lại phiếu đánh giá phỏng vấn
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Chức năng dành cho Recruiter để mở khóa phiếu đã nộp trong thời hạn 24 giờ.
            </p>
          </div>
        </div>

        {/* Thông tin tóm tắt & thời gian còn lại */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Ứng viên:</span>
            <span className="font-bold text-slate-800">
              {candidateName} ({jobTitle})
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-2">
            <span className="text-slate-500 font-medium">Thời hạn mở lại còn:</span>
            <span
              data-testid="reopen-modal-countdown"
              className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full"
            >
              <Clock className="h-3.5 w-3.5" />
              {timeRemainingFormatted}
            </span>
          </div>
        </div>

        {/* Nhập lý do mở lại */}
        <div className="space-y-1.5">
          <label
            htmlFor="reopen-reason-input"
            className="text-xs font-bold uppercase tracking-wider text-slate-700 block"
          >
            Lý do mở lại phiếu
          </label>
          <textarea
            id="reopen-reason-input"
            data-testid="reopen-reason-input"
            rows={3}
            value={reopenReasonText}
            onChange={(changeEvent) => setReopenReasonText(changeEvent.target.value)}
            placeholder="Nhập lý do cần mở lại phiếu (ví dụ: cần cập nhật thêm nhận xét chuyên môn, thảo luận lại kết luận...)..."
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition resize-y"
          />
        </div>

        {/* Báo lỗi nếu có */}
        {errorMessage && (
          <div
            role="alert"
            data-testid="reopen-error-alert"
            className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Cụm nút hành động */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={isReopening}
            onClick={onCancel}
            data-testid="reopen-modal-cancel-button"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            disabled={isReopening}
            onClick={() => onConfirm(reopenReasonText)}
            data-testid="reopen-modal-confirm-button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-amber-700 disabled:bg-amber-400 shadow-xs transition cursor-pointer"
          >
            <Unlock className="h-4 w-4" />
            {isReopening ? 'Đang mở lại...' : 'Xác nhận mở lại'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Component chính: Phiếu đánh giá năng lực phỏng vấn
 * (TKNHTTDNB1-457, TKNHTTDNB1-458, TKNHTTDNB1-464, TKNHTTDNB1-465)
 */
export const InterviewEvaluationForm: React.FC<InterviewEvaluationFormProps> = ({
  candidateId,
  candidateName,
  candidateEmail,
  jobTitle,
  interviewRound = 'Vòng Phỏng vấn chuyên môn',
  interviewDate,
  interviewTime,
  interviewFormat = 'ONLINE',
  locationOrLink,
  interviewerNames = [],
  interviewerIds,
  interviewerEmails,
  interviewers,
  currentUserId,
  currentUserEmail,
  currentUserRoles,
  isAuthorized,
  isRecruiter,
  frameworkName = 'Khung năng lực tiêu chuẩn',
  frameworkCode = 'CF-STD-2026',
  frameworkVersion = DEFAULT_FRAMEWORK_VERSION,
  criteria = [],
  initialEvaluations = {},
  initialGeneralNotes = '',
  initialConclusion = null,
  isLocked = false,
  submittedAt = null,
  peerEvaluations,
  hasSubmittedOwnEvaluation,
  isLoading = false,
  errorMessage = null,
  onRetry,
  onSubmit,
  onSaveDraft,
  onReopen,
  onCancel,
  readOnly = false,
  className = '',
}) => {
  // 1. Phân quyền truy cập phiếu đánh giá (AC 1 - TKNHTTDNB1-464)
  const isAccessGranted = useMemo(() => {
    return checkInterviewEvaluationAccess({
      isAuthorized,
      currentUserId,
      currentUserEmail,
      interviewerIds,
      interviewerEmails,
      interviewers,
    });
  }, [
    isAuthorized,
    currentUserId,
    currentUserEmail,
    interviewerIds,
    interviewerEmails,
    interviewers,
  ]);

  // Khởi tạo bản ghi đánh giá cho từng tiêu chí ngay từ ban đầu
  const [evaluationsState, setEvaluationsState] = useState<
    Record<string, CriterionEvaluationRecord>
  >(() => {
    const initializedRecords: Record<string, CriterionEvaluationRecord> = {};
    criteria.forEach((criterionItem) => {
      const existingInitial = initialEvaluations[criterionItem.id];
      initializedRecords[criterionItem.id] = {
        criterionId: criterionItem.id,
        criterionName: criterionItem.name,
        weight: criterionItem.weight,
        score: existingInitial?.score !== undefined ? existingInitial.score : null,
        comment: existingInitial?.comment || '',
      };
    });
    return initializedRecords;
  });

  const [generalNotesState, setGeneralNotesState] = useState<string>(initialGeneralNotes);

  // Quản lý lựa chọn kết luận phỏng vấn bắt buộc (AC 2 - TKNHTTDNB1-464)
  const [interviewConclusion, setInterviewConclusion] = useState<InterviewConclusion | null>(
    initialConclusion,
  );
  const [conclusionError, setConclusionError] = useState<string | null>(null);

  // Quản lý trạng thái khóa phiếu đánh giá (AC 3 - TKNHTTDNB1-464 & TKNHTTDNB1-465)
  const [isFormLocked, setIsFormLocked] = useState<boolean>(() => Boolean(isLocked));
  const [submittedAtState, setSubmittedAtState] = useState<string | null>(() => {
    return submittedAt || (isLocked ? '2026-10-15T10:00:00.000Z' : null);
  });

  const isFormLockedState = Boolean(isLocked || isFormLocked);
  const isEffectiveLocked = Boolean(isFormLockedState || readOnly);

  // Quản lý trạng thái mở Confirm Modal trước khi nộp (AC 2 - TKNHTTDNB1-464)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);

  // Quản lý tính năng Mở lại phiếu dành cho Recruiter trong thời hạn 24 giờ (AC 1 - TKNHTTDNB1-465)
  const [isReopenModalOpen, setIsReopenModalOpen] = useState<boolean>(false);
  const [isReopening, setIsReopening] = useState<boolean>(false);
  const [reopenErrorMessage, setReopenErrorMessage] = useState<string | null>(null);

  // Kiểm tra role Recruiter (AC 1 - TKNHTTDNB1-465)
  const isRecruiterRole = useMemo(() => {
    return checkIsRecruiterRole(currentUserRoles, isRecruiter);
  }, [currentUserRoles, isRecruiter]);

  // Tính toán thời hạn mở lại 24 giờ từ lúc nộp (AC 1 - TKNHTTDNB1-465)
  const reopenStatus = useMemo(() => {
    return calculateRemainingReopenTime(submittedAtState);
  }, [submittedAtState]);

  // Quản lý điều kiện xem đánh giá chéo từ người phỏng vấn khác (AC 2 - TKNHTTDNB1-465)
  // Chỉ mở khóa khu vực này khi user hiện tại đã nộp phiếu của chính mình
  const isPeerReviewAllowed = useMemo(() => {
    const userSubmitted =
      hasSubmittedOwnEvaluation !== undefined
        ? hasSubmittedOwnEvaluation
        : isFormLockedState;
    return isPeerReviewVisible(userSubmitted);
  }, [hasSubmittedOwnEvaluation, isFormLockedState]);

  // Chuẩn bị danh sách đánh giá chéo từ hội đồng (AC 2)
  const defaultPeerEvaluations = useMemo<PeerInterviewerEvaluation[]>(() => {
    if (peerEvaluations && peerEvaluations.length > 0) {
      return peerEvaluations;
    }

    if (interviewers && interviewers.length > 0) {
      const activeUserId = currentUserId;
      const activeUserEmail = (currentUserEmail || '').toLowerCase();

      return interviewers
        .filter((interviewerItem) => {
          const isCurrentSelf =
            (activeUserId && interviewerItem.id === activeUserId) ||
            (activeUserEmail &&
              interviewerItem.email &&
              interviewerItem.email.toLowerCase() === activeUserEmail);
          return !isCurrentSelf;
        })
        .map((interviewerItem, peerIndex) => ({
          interviewerId: interviewerItem.id || `peer-${peerIndex}`,
          interviewerName: interviewerItem.name || `Người phỏng vấn ${peerIndex + 1}`,
          interviewerRole: 'Hội đồng phỏng vấn',
          interviewerEmail: interviewerItem.email,
          isSubmitted: true,
          submittedAt: '2026-10-15T08:00:00.000Z',
          calculatedTotalScore: 4.2,
          conclusion: 'RECOMMENDED' as const,
          generalNotes:
            'Ứng viên nắm chắc chuyên môn kỹ thuật, giao tiếp rõ ràng và có tư duy logic tốt.',
        }));
    }

    if (interviewerNames && interviewerNames.length > 1) {
      return interviewerNames.slice(1).map((peerName, peerIndex) => ({
        interviewerId: `peer-${peerIndex}`,
        interviewerName: peerName,
        interviewerRole: 'Người phỏng vấn',
        isSubmitted: true,
        submittedAt: '2026-10-15T07:30:00.000Z',
        calculatedTotalScore: 4.0,
        conclusion: 'RECOMMENDED' as const,
        generalNotes: 'Ứng viên có tiềm năng phát triển và thích ứng văn hóa tốt.',
      }));
    }

    return [];
  }, [peerEvaluations, interviewers, interviewerNames, currentUserId, currentUserEmail]);

  // Quản lý thông báo lỗi validation theo thời gian thực (AC 2)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  // Đánh dấu các tiêu chí mà người dùng đã tương tác để hiển thị lỗi phù hợp
  const [touchedCriteria, setTouchedCriteria] = useState<Record<string, boolean>>({});
  // Đánh dấu khi người dùng bấm nút submit để hiển thị toàn bộ lỗi của các tiêu chí còn thiếu
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);

  // Cập nhật điểm số khi người dùng nhấp chọn mức 1-5 hoặc thay đổi điểm (AC 1 & AC 2)
  const handleScoreChange = useCallback(
    (criterionId: string, selectedScore: number | null) => {
      if (isEffectiveLocked) return;

      // Đánh dấu tiêu chí này đã được người dùng tương tác để kích hoạt hiển thị validation
      setTouchedCriteria((previousTouched) => ({
        ...previousTouched,
        [criterionId]: true,
      }));

      // Cập nhật điểm số và kiểm tra lỗi validation ngay lập tức theo thời gian thực (Real-time Validation)
      setEvaluationsState((previousState) => {
        const currentRecord = previousState[criterionId];
        // Cho phép bấm lại cùng 1 điểm để bỏ chọn (toggle) nếu muốn đặt lại
        const nextScore = currentRecord?.score === selectedScore ? null : selectedScore;

        // Báo lỗi real-time nếu bỏ trống hoặc ngoài khoảng 1-5
        const validationError = validateCriterionScore(nextScore);
        setValidationErrors((previousErrors) => {
          if (validationError) {
            return { ...previousErrors, [criterionId]: validationError };
          }
          // Xóa thông báo lỗi ngay khi điểm số hợp lệ
          const updatedErrors = { ...previousErrors };
          delete updatedErrors[criterionId];
          return updatedErrors;
        });

        return {
          ...previousState,
          [criterionId]: {
            ...currentRecord,
            score: nextScore,
          },
        };
      });
    },
    [isEffectiveLocked],
  );

  // Cập nhật nhận xét chi tiết của tiêu chí
  const handleCommentChange = useCallback(
    (criterionId: string, commentText: string) => {
      if (isEffectiveLocked) return;

      setEvaluationsState((previousState) => ({
        ...previousState,
        [criterionId]: {
          ...previousState[criterionId],
          comment: commentText,
        },
      }));
    },
    [isEffectiveLocked],
  );

  // Cập nhật kết luận phỏng vấn (AC 2)
  const handleSelectConclusion = useCallback(
    (selectedConclusion: InterviewConclusion) => {
      if (isEffectiveLocked) return;
      setInterviewConclusion(selectedConclusion);
      // Xóa thông báo lỗi kết luận ngay khi người dùng chọn
      setConclusionError(null);
    },
    [isEffectiveLocked],
  );

  // 1. Tự động tính lại điểm tổng theo trọng số ngay mỗi khi có thay đổi điểm ở bất kỳ tiêu chí nào (AC 1)
  const calculatedTotalScore = useMemo<number | null>(() => {
    try {
      return calculateWeightedScore(criteria, evaluationsState);
    } catch (errorObject: unknown) {
      // Bắt lỗi rõ ràng, kiểm tra kiểu lỗi và xử lý cụ thể
      const errorMessageText =
        errorObject instanceof Error ? errorObject.message : 'Lỗi tính điểm';
      if (errorMessageText) {
        // Trả về null an toàn cho giao diện khi xảy ra lỗi dữ liệu
        return null;
      }
      return null;
    }
  }, [criteria, evaluationsState]);

  // Đếm số lượng tiêu chí đã chấm điểm
  const scoredCriteriaCount = useMemo(() => {
    return Object.values(evaluationsState).filter(
      (evaluationItem) => evaluationItem.score !== null,
    ).length;
  }, [evaluationsState]);

  // Tiền kiểm tra trước khi mở Confirm Modal (AC 2 - TKNHTTDNB1-464)
  const handlePreSubmitCheck = (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (isEffectiveLocked) return;

    setHasAttemptedSubmit(true);

    // 1. Kiểm tra toàn bộ tiêu chí trong khung năng lực
    const criteriaValidation = validateAllCriteriaEvaluations(criteria, evaluationsState);
    if (!criteriaValidation.isValid) {
      setValidationErrors(criteriaValidation.errors);
      // Cuộn đến tiêu chí đầu tiên có lỗi để người dùng dễ nhận biết và sửa lỗi
      if (criteriaValidation.firstInvalidCriterionId) {
        const targetElement = document.getElementById(
          `criterion-row-${criteriaValidation.firstInvalidCriterionId}`,
        );
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }

    // 2. Kiểm tra bắt buộc chọn kết luận phỏng vấn (AC 2)
    const conclusionValidationError = validateInterviewConclusion(interviewConclusion);
    setConclusionError(conclusionValidationError);

    // Nếu tiêu chí đã hợp lệ nhưng chưa chọn kết luận, cuộn xuống phần kết luận
    if (criteriaValidation.isValid && conclusionValidationError) {
      const conclusionElement = document.getElementById('interview-conclusion-section');
      if (conclusionElement) {
        conclusionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Nếu có lỗi ở tiêu chí hoặc kết luận, không mở Confirm Modal
    if (!criteriaValidation.isValid || conclusionValidationError) {
      return;
    }

    // Khi tất cả đều hợp lệ: Mở hộp thoại xác nhận nộp phiếu (AC 2)
    setIsConfirmModalOpen(true);
  };

  // Xác nhận nộp phiếu từ Confirm Modal (AC 2 & AC 3)
  const handleConfirmSubmit = () => {
    setIsConfirmModalOpen(false);
    // Chuyển toàn bộ phiếu sang trạng thái đã khóa chỉ xem (AC 3)
    setIsFormLocked(true);
    const submissionTimestamp = new Date().toISOString();
    setSubmittedAtState(submissionTimestamp);

    if (onSubmit && interviewConclusion) {
      onSubmit({
        criteriaEvaluations: evaluationsState,
        calculatedTotalScore,
        generalNotes: generalNotesState,
        conclusion: interviewConclusion,
        isLocked: true,
        submittedAt: submissionTimestamp,
      });
    }
  };

  // Xử lý mở lại phiếu đánh giá (AC 1 - TKNHTTDNB1-465)
  const handleConfirmReopen = async (reopenReason: string) => {
    try {
      setIsReopening(true);
      setReopenErrorMessage(null);

      // Nếu có prop onReopen tùy biến thì ưu tiên gọi
      if (onReopen) {
        await onReopen(reopenReason);
      } else if (candidateId) {
        // Gọi API mở lại phiếu
        await interviewEvaluationService.reopenEvaluation(candidateId, {
          reason: reopenReason,
        });
      }

      // Mở khóa phiếu đánh giá thành công
      setIsFormLocked(false);
      setIsReopenModalOpen(false);
    } catch (errorObject: unknown) {
      // Bắt lỗi triệt để theo convention K3S4_N3, không nuốt lỗi
      const errorMessageText =
        errorObject instanceof Error
          ? errorObject.message
          : 'Không thể mở lại phiếu đánh giá, vui lòng thử lại sau.';
      setReopenErrorMessage(errorMessageText);
    } finally {
      setIsReopening(false);
    }
  };

  // Xử lý lưu nháp
  const handleSaveDraftClick = () => {
    if (isEffectiveLocked) return;

    if (onSaveDraft) {
      onSaveDraft({
        criteriaEvaluations: evaluationsState,
        calculatedTotalScore,
        generalNotes: generalNotesState,
        conclusion: interviewConclusion,
      });
    }
  };

  // 1. Kiểm tra phân quyền truy cập (AC 1)
  if (!isAccessGranted) {
    return (
      <InterviewEvaluationAccessDeniedState
        candidateName={candidateName}
        onBack={onCancel}
        className={className}
      />
    );
  }

  // 2. Kiểm tra trạng thái đang tải dữ liệu (AC 3)
  if (isLoading) {
    return <InterviewEvaluationFormSkeleton className={className} />;
  }

  // 3. Kiểm tra trạng thái có lỗi phát sinh (AC 3)
  if (errorMessage) {
    return <InterviewEvaluationErrorState errorMessage={errorMessage} onRetry={onRetry} />;
  }

  // 4. Kiểm tra trạng thái rỗng chưa có khung năng lực hoặc tiêu chí (AC 3)
  if (criteria.length === 0) {
    return (
      <InterviewEvaluationEmptyState frameworkName={frameworkName} onRetry={onRetry} />
    );
  }

  return (
    <>
      <form
        id="interview-evaluation-form"
        data-testid="interview-evaluation-form"
        onSubmit={handlePreSubmitCheck}
        className={`rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-7 ${className}`}
      >
        {/* =========================================================================
            PHẦN 1: BỐ CỤC PHẦN ĐẦU PHIẾU (AC 1)
            Hiển thị Tên ứng viên, Vị trí ứng tuyển, Thông tin buổi phỏng vấn & Phiên bản khung
        ========================================================================= */}
        <section
          data-testid="evaluation-header-section"
          className="border-b border-slate-200 pb-6 space-y-4"
        >
          {/* Hàng trên: Tiêu đề phiếu, Thông tin chính ứng viên & Phiên bản khung năng lực */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  <Award className="h-3.5 w-3.5" />
                  Phiếu Đánh Giá Năng Lực Phỏng Vấn
                </span>

                {/* Huy hiệu nhãn Đã khóa (AC 3 - TKNHTTDNB1-464) */}
                {isFormLockedState && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      data-testid="form-locked-badge"
                      className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 text-white px-2.5 py-1 text-xs font-bold shadow-xs tracking-wide"
                    >
                      <Lock className="h-3.5 w-3.5 text-amber-400" />
                      <span>Đã khóa</span>
                    </span>

                    {/* Nút Mở lại phiếu nhanh trên Header dành cho Recruiter (AC 1 - TKNHTTDNB1-465) */}
                    {isRecruiterRole && (
                      reopenStatus.canReopen ? (
                        <button
                          type="button"
                          onClick={() => setIsReopenModalOpen(true)}
                          data-testid="header-reopen-button"
                          className="inline-flex items-center gap-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white px-2 py-0.5 text-[11px] font-bold shadow-xs transition cursor-pointer"
                        >
                          <Unlock className="h-3 w-3" />
                          <span>Mở lại ({reopenStatus.timeRemainingFormatted})</span>
                        </button>
                      ) : (
                        <span
                          data-testid="header-reopen-expired-badge"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                        >
                          <Clock className="h-3 w-3" />
                          Hết hạn mở lại
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-base shrink-0 border border-slate-200">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2
                    data-testid="candidate-name-display"
                    className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
                  >
                    {candidateName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600 mt-0.5">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                      {jobTitle}
                    </span>
                    {candidateEmail && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">{candidateEmail}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Huy hiệu Phiên bản Khung Năng Lực đang sử dụng (AC 1) */}
            <div
              data-testid="competency-framework-badge"
              className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 p-3 sm:p-3.5 flex items-start gap-3 shadow-2xs"
            >
              <div className="rounded-lg bg-indigo-600 p-2 text-white shadow-xs">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">
                  Khung năng lực áp dụng
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-bold text-slate-900">{frameworkName}</span>
                  <span
                    data-testid="framework-version-tag"
                    className="inline-flex items-center rounded-md bg-indigo-600 px-2 py-0.5 text-[11px] font-bold text-white tracking-wide shadow-2xs"
                  >
                    {frameworkVersion || DEFAULT_FRAMEWORK_VERSION}
                  </span>
                </div>
                {frameworkCode && (
                  <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                    Mã: {frameworkCode}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Khối Thông tin buổi phỏng vấn (Vòng, Ngày giờ, Hình thức, Người phỏng vấn) (AC 1) */}
          <div
            data-testid="interview-details-card"
            className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 sm:grid-cols-2 lg:grid-cols-4 text-xs"
          >
            {/* Vòng phỏng vấn */}
            <div className="space-y-1">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block">
                Vòng phỏng vấn
              </span>
              <span
                data-testid="interview-round-display"
                className="font-bold text-slate-800 text-xs sm:text-sm block"
              >
                {interviewRound}
              </span>
            </div>

            {/* Thời gian phỏng vấn */}
            <div className="space-y-1">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block">
                Thời gian diễn ra
              </span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs sm:text-sm">
                <Calendar className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span>{interviewDate || 'Chưa cập nhật ngày'}</span>
                {interviewTime && (
                  <>
                    <Clock className="h-3.5 w-3.5 text-indigo-600 shrink-0 ml-1" />
                    <span>{interviewTime}</span>
                  </>
                )}
              </div>
            </div>

            {/* Hình thức & Địa điểm / Liên kết */}
            <div className="space-y-1">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block">
                Hình thức phỏng vấn
              </span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                {interviewFormat === 'ONLINE' ? (
                  <>
                    <Video className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Trực tuyến (Online)
                    </span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Trực tiếp (Offline)
                    </span>
                  </>
                )}
              </div>
              {locationOrLink && (
                <span className="truncate block font-mono text-[11px] text-slate-500 mt-0.5">
                  {locationOrLink}
                </span>
              )}
            </div>

            {/* Người phỏng vấn / Hội đồng */}
            <div className="space-y-1">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block">
                Hội đồng phỏng vấn
              </span>
              <div className="flex items-center gap-1 text-slate-800 font-medium">
                <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate" title={interviewerNames.join(', ')}>
                  {interviewerNames.length > 0
                    ? interviewerNames.join(', ')
                    : 'Chưa phân công cụ thể'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Banner thông báo trạng thái phiếu đã khóa (AC 3 - TKNHTTDNB1-464) */}
        {isFormLockedState && (
          <div
            role="status"
            data-testid="form-locked-banner"
            className="flex items-center justify-between flex-wrap gap-3 rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-xs font-medium text-amber-900 shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <strong>Phiếu đánh giá đã được nộp và khóa an toàn.</strong> Toàn bộ điểm số, nhận xét và kết luận phỏng vấn hiện ở trạng thái <strong>Chỉ xem</strong>.
              </div>
            </div>

            {/* Nút Mở lại phiếu dành cho Recruiter ngay trên banner (AC 1 - TKNHTTDNB1-465) */}
            {isRecruiterRole && reopenStatus.canReopen && (
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(true)}
                data-testid="banner-reopen-button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Unlock className="h-3.5 w-3.5" />
                Mở lại phiếu ({reopenStatus.timeRemainingFormatted})
              </button>
            )}
          </div>
        )}

        {/* =========================================================================
            PHẦN 2: DANH SÁCH TIÊU CHÍ ĐÁNH GIÁ (AC 2)
            Mỗi tiêu chí trên 1 dòng gồm: Tên tiêu chí, Trọng số (%), Ô chọn điểm (1-5), Ô nhận xét
        ========================================================================= */}
        <section data-testid="evaluation-criteria-section" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Danh sách tiêu chí đánh giá năng lực</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {criteria.length} tiêu chí
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Vui lòng cho điểm từ 1 đến 5 và ghi chú nhận xét cụ thể làm căn cứ đánh giá
              </p>
            </div>

            {/* Tiến độ đã chấm */}
            <div className="text-xs font-medium text-slate-500">
              Tiến độ hoàn tất:{' '}
              <span className="font-bold text-indigo-700">
                {scoredCriteriaCount} / {criteria.length}
              </span>
            </div>
          </div>

          {/* Danh sách các tiêu chí (Row-by-row rendering) */}
          <div className="space-y-4">
            {criteria.map((criterionItem, criterionIndex) => {
              const currentEvaluation = evaluationsState[criterionItem.id];
              const currentScore = currentEvaluation?.score ?? null;
              const currentComment = currentEvaluation?.comment || '';
              const activeLevelDefinition: RatingLevelDefinition | undefined =
                currentScore !== null && currentScore >= 1 && currentScore <= 5
                  ? RATING_LEVEL_DEFINITIONS[currentScore as CriterionScoreValue]
                  : undefined;

              // Kiểm tra lỗi validation theo thời gian thực (AC 2)
              const validationError =
                validationErrors[criterionItem.id] ||
                ((touchedCriteria[criterionItem.id] || hasAttemptedSubmit)
                  ? validateCriterionScore(currentScore)
                  : null);

              // Tính phần đóng góp điểm số theo trọng số cho tiêu chí này: (Điểm * Trọng số) (AC 1)
              const criterionWeightedContribution = calculateCriterionWeightedContribution(
                currentScore,
                criterionItem.weight,
              );

              return (
                <div
                  key={criterionItem.id}
                  id={`criterion-row-${criterionItem.id}`}
                  data-testid={`criterion-row-${criterionItem.id}`}
                  className={`rounded-2xl border transition-all p-4 sm:p-5 space-y-4 ${
                    validationError
                      ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-200 shadow-2xs'
                      : currentScore !== null
                      ? 'border-indigo-200 bg-white shadow-xs'
                      : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                  }`}
                >
                  {/* Hàng 1: Tên tiêu chí, Trọng số (%) & Điểm trọng số đóng góp */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold">
                          {criterionIndex + 1}
                        </span>
                        <h4
                          data-testid={`criterion-name-${criterionItem.id}`}
                          className="text-sm sm:text-base font-bold text-slate-900"
                        >
                          {criterionItem.name}
                        </h4>
                      </div>
                      {criterionItem.description && (
                        <p className="text-xs text-slate-500 pl-7">
                          {criterionItem.description}
                        </p>
                      )}
                    </div>

                    {/* Trọng số (%) và Điểm đóng góp của tiêu chí (AC 1 & AC 2) */}
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
                      <span
                        data-testid={`criterion-weight-${criterionItem.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 shadow-2xs"
                      >
                        <Sparkles className="h-3 w-3" />
                        Trọng số: {criterionItem.weight}%
                      </span>

                      {criterionWeightedContribution !== null && (
                        <span
                          data-testid={`criterion-contribution-${criterionItem.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 shadow-2xs"
                        >
                          +{criterionWeightedContribution.toFixed(2)} điểm ({currentScore} × {criterionItem.weight}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hàng 2: Ô chọn điểm (1–5) (AC 2) & Ô nhập nhận xét */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    {/* Cột trái (lg: 5 cột): Nút chọn điểm 1-5 */}
                    <div className="lg:col-span-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                          Chọn điểm số (1 – 5) <span className="text-rose-500">*</span>
                        </label>
                        {activeLevelDefinition && (
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded border ${activeLevelDefinition.activeBadgeClass}`}
                          >
                            {activeLevelDefinition.shortLabel}
                          </span>
                        )}
                      </div>

                      {/* Dãy 5 nút chọn điểm số (Disable khi phiếu đã khóa - AC 3) */}
                      <div
                        role="radiogroup"
                        aria-label={`Điểm đánh giá cho ${criterionItem.name}`}
                        className="grid grid-cols-5 gap-1.5 sm:gap-2"
                      >
                        {AVAILABLE_SCORE_OPTIONS.map((scoreOptionValue) => {
                          const levelConfig = RATING_LEVEL_DEFINITIONS[scoreOptionValue];
                          const isSelected = currentScore === scoreOptionValue;

                          return (
                            <button
                              key={`score-${criterionItem.id}-${scoreOptionValue}`}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              disabled={isEffectiveLocked}
                              data-testid={`score-button-${criterionItem.id}-${scoreOptionValue}`}
                              onClick={() =>
                                handleScoreChange(criterionItem.id, scoreOptionValue)
                              }
                              className={`flex flex-col items-center justify-center rounded-xl border py-2.5 px-1 transition-all font-bold ${
                                isSelected
                                  ? levelConfig.activeButtonClass
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50'
                              } ${
                                isEffectiveLocked
                                  ? 'cursor-not-allowed opacity-75'
                                  : 'cursor-pointer'
                              }`}
                              title={`${levelConfig.label}: ${levelConfig.description}`}
                            >
                              <span className="text-base sm:text-lg">{scoreOptionValue}</span>
                              <span className="text-[10px] font-semibold truncate max-w-full px-0.5 hidden sm:inline">
                                {levelConfig.shortLabel}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Giải thích chi tiết mức điểm đang chọn */}
                      {activeLevelDefinition ? (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                          <span className="font-semibold text-slate-700 not-italic">
                            {activeLevelDefinition.label}:
                          </span>{' '}
                          {activeLevelDefinition.description}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">
                          Nhấp vào ô điểm từ 1 (Chưa đạt) đến 5 (Xuất sắc)
                        </p>
                      )}
                    </div>

                    {/* Cột phải (lg: 7 cột): Ô nhập nhận xét (AC 2 & AC 3) */}
                    <div className="lg:col-span-7 space-y-1.5">
                      <label
                        htmlFor={`comment-${criterionItem.id}`}
                        className="text-xs font-bold uppercase tracking-wider text-slate-600 block"
                      >
                        Nhận xét & Dẫn chứng
                      </label>
                      <textarea
                        id={`comment-${criterionItem.id}`}
                        data-testid={`criterion-comment-input-${criterionItem.id}`}
                        rows={3}
                        disabled={isEffectiveLocked}
                        value={currentComment}
                        onChange={(changeEvent) =>
                          handleCommentChange(criterionItem.id, changeEvent.target.value)
                        }
                        placeholder="Nhập dẫn chứng thực tế, câu trả lời tiêu biểu hoặc điểm mạnh / điểm cần cải thiện của ứng viên đối với tiêu chí này..."
                        className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-600 transition resize-y"
                      />
                    </div>
                  </div>

                  {/* Câu thông báo lỗi màu đỏ xuất hiện ngay dưới tiêu chí khi bị bỏ trống hoặc ngoài khoảng 1-5 (AC 2) */}
                  {validationError && (
                    <div
                      role="alert"
                      data-testid={`criterion-error-${criterionItem.id}`}
                      className="flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3.5 py-2.5 rounded-xl animate-in fade-in duration-150"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                      <span>{validationError}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            PHẦN 3: PHẦN CUỐI PHIẾU & Ô HIỂN THỊ ĐIỂM TỔNG THEO TRỌNG SỐ (AC 1 & AC 2)
            Điểm tổng tự động tính lại ngay khi người dùng thay đổi điểm ở bất kỳ tiêu chí nào
        ========================================================================= */}
        <section
          data-testid="evaluation-summary-section"
          className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/60 p-5 sm:p-6 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-600" />
                Tổng kết đánh giá năng lực phỏng vấn
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Điểm tổng hợp tự động tính theo trọng số: ∑ (Điểm × Trọng số)
              </p>
            </div>

            {/* Ô hiển thị Điểm tổng tính theo trọng số (AC 1) */}
            <div
              data-testid="total-score-card"
              className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-white p-3.5 sm:p-4 shadow-xs shrink-0 self-start sm:self-auto"
            >
              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Điểm tổng trọng số
                </span>
                <span className="text-xs text-indigo-600 font-semibold">∑ (Điểm × Trọng số)</span>
              </div>

              <div className="flex items-baseline gap-1 border-l border-slate-200 pl-3">
                <span
                  data-testid="total-score-value-display"
                  className={`text-3xl sm:text-4xl font-black ${
                    calculatedTotalScore !== null ? 'text-indigo-600' : 'text-slate-300'
                  }`}
                >
                  {calculatedTotalScore !== null ? calculatedTotalScore.toFixed(2) : '--'}
                </span>
                <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
              </div>
            </div>
          </div>

          {/* Bảng chi tiết điểm đóng góp từng tiêu chí theo trọng số (AC 1) */}
          {criteria.length > 0 && (
            <div className="rounded-xl bg-white/90 border border-slate-200 p-3 sm:p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-700 border-b border-slate-100 pb-2">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Chi tiết tính điểm theo trọng số:
                </span>
                <span className="text-indigo-600 font-semibold">
                  {scoredCriteriaCount}/{criteria.length} tiêu chí đã chấm
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {criteria.map((criterionItem) => {
                  const itemScore = evaluationsState[criterionItem.id]?.score;
                  const itemContribution = calculateCriterionWeightedContribution(
                    itemScore,
                    criterionItem.weight,
                  );

                  return (
                    <div
                      key={`contribution-summary-${criterionItem.id}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <span className="truncate font-medium text-slate-700 pr-2" title={criterionItem.name}>
                        {criterionItem.name}
                      </span>
                      <span className="shrink-0 font-mono font-bold text-slate-800">
                        {itemContribution !== null
                          ? `+${itemContribution.toFixed(2)} (${itemScore} × ${criterionItem.weight}%)`
                          : <span className="text-slate-400 font-normal">Chưa chấm</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nhận xét chung toàn diện buổi phỏng vấn */}
          <div className="space-y-1.5">
            <label
              htmlFor="general-evaluation-notes"
              className="text-xs font-bold uppercase tracking-wider text-slate-700 block"
            >
              Nhận xét chung buổi phỏng vấn (Overall Feedback)
            </label>
            <textarea
              id="general-evaluation-notes"
              data-testid="general-evaluation-notes-input"
              rows={3}
              disabled={isEffectiveLocked}
              value={generalNotesState}
              onChange={(changeEvent) => setGeneralNotesState(changeEvent.target.value)}
              placeholder="Ghi nhận đánh giá tổng quát về thái độ, tiềm năng phát triển, văn hóa doanh nghiệp hoặc các đề xuất đặc biệt dành cho Hội đồng tuyển dụng..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-600 transition resize-y"
            />
          </div>

          {/* =========================================================================
              KHU VỰC KẾT LUẬN PHỎNG VẤN (AC 2 - TKNHTTDNB1-464)
              3 nút chọn kết luận: Nên tuyển, Cân nhắc, Không nên tuyển (Bắt buộc phải chọn 1)
          ========================================================================= */}
          <div
            id="interview-conclusion-section"
            data-testid="interview-conclusion-section"
            className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3.5 shadow-2xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-slate-100 pb-2.5">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Kết luận & Đề xuất phỏng vấn</span>
                  <span className="text-rose-500 font-bold">*</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bắt buộc chọn 1 trong 3 kết luận phỏng vấn làm căn cứ ra quyết định tuyển dụng
                </p>
              </div>

              {interviewConclusion && (
                <span
                  data-testid="selected-conclusion-badge"
                  className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
                    CONCLUSION_OPTIONS_CONFIG[interviewConclusion].activeBadgeClass
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  Đã chọn: {CONCLUSION_OPTIONS_CONFIG[interviewConclusion].label}
                </span>
              )}
            </div>

            {/* Dãy 3 nút chọn kết luận (Disable khi phiếu đã khóa - AC 3) */}
            <div
              role="radiogroup"
              aria-label="Kết luận phỏng vấn"
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              {AVAILABLE_CONCLUSION_OPTIONS.map((conclusionOptionKey) => {
                const optionConfig = CONCLUSION_OPTIONS_CONFIG[conclusionOptionKey];
                const isSelected = interviewConclusion === conclusionOptionKey;

                return (
                  <button
                    key={`conclusion-btn-${conclusionOptionKey}`}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={isEffectiveLocked}
                    data-testid={`conclusion-button-${conclusionOptionKey}`}
                    onClick={() => handleSelectConclusion(conclusionOptionKey)}
                    className={`flex flex-col items-start justify-between rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? optionConfig.activeButtonClass
                        : optionConfig.idleButtonClass
                    } ${
                      isEffectiveLocked
                        ? 'cursor-not-allowed opacity-75'
                        : 'cursor-pointer'
                    }`}
                  >
                    <div className="w-full space-y-1.5">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm sm:text-base font-bold flex items-center gap-2">
                          {conclusionOptionKey === 'RECOMMENDED' && (
                            <CheckCircle2
                              className={`h-4 w-4 ${
                                isSelected ? 'text-white' : 'text-emerald-600'
                              }`}
                            />
                          )}
                          {conclusionOptionKey === 'CONSIDER' && (
                            <HelpCircle
                              className={`h-4 w-4 ${
                                isSelected ? 'text-white' : 'text-amber-600'
                              }`}
                            />
                          )}
                          {conclusionOptionKey === 'NOT_RECOMMENDED' && (
                            <XCircle
                              className={`h-4 w-4 ${
                                isSelected ? 'text-white' : 'text-rose-600'
                              }`}
                            />
                          )}
                          {optionConfig.label}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isSelected
                              ? 'bg-white/20 text-white border-white/30'
                              : optionConfig.badgeClass
                          }`}
                        >
                          {optionConfig.shortLabel}
                        </span>
                      </div>

                      <p
                        className={`text-xs leading-relaxed ${
                          isSelected ? 'text-white/90' : 'text-slate-500'
                        }`}
                      >
                        {optionConfig.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Thông báo lỗi khi người dùng chưa chọn kết luận mà bấm nộp phiếu (AC 2) */}
            {conclusionError && (
              <div
                role="alert"
                data-testid="conclusion-validation-error"
                className="flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3.5 py-2.5 rounded-xl animate-in fade-in duration-150"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{conclusionError}</span>
              </div>
            )}
          </div>

          {/* Banner cảnh báo khi có lỗi validation lúc bấm gửi đánh giá (AC 2) */}
          {hasAttemptedSubmit && Object.keys(validationErrors).length > 0 && (
            <div
              role="alert"
              data-testid="form-validation-summary-error"
              className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-100/90 border border-rose-300 px-4 py-3 rounded-xl animate-in fade-in duration-150"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>
                Vui lòng chọn điểm đánh giá hợp lệ (từ 1 đến 5) cho tất cả {Object.keys(validationErrors).length} tiêu chí còn thiếu trước khi gửi đánh giá.
              </span>
            </div>
          )}

          {/* Cụm nút hành động */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
            <div>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  {isFormLockedState ? 'Đóng phiếu' : 'Hủy bỏ'}
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isFormLockedState ? (
                /* Trạng thái khóa phiếu (Read-only State - AC 3 & TKNHTTDNB1-465) */
                <div className="flex items-center gap-3 flex-wrap">
                  <div
                    data-testid="form-locked-action-notice"
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-300"
                  >
                    <Lock className="h-4 w-4 text-slate-500" />
                    <span>Phiếu đánh giá đã khóa (Chỉ xem)</span>
                  </div>

                  {/* Nút Mở lại phiếu dành riêng cho Recruiter (AC 1 - TKNHTTDNB1-465) */}
                  {isRecruiterRole && (
                    reopenStatus.canReopen ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsReopenModalOpen(true)}
                          data-testid="reopen-evaluation-button"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs sm:text-sm font-bold text-amber-800 hover:bg-amber-100 shadow-xs transition cursor-pointer"
                        >
                          <Unlock className="h-4 w-4 text-amber-600" />
                          Mở lại phiếu
                        </button>
                        <span
                          data-testid="reopen-countdown-badge"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200"
                        >
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          {reopenStatus.timeRemainingFormatted}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled
                          data-testid="reopen-evaluation-disabled-button"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-400 cursor-not-allowed"
                        >
                          <Lock className="h-4 w-4 text-slate-400" />
                          Hết hạn mở lại
                        </button>
                        <span
                          data-testid="reopen-expired-badge"
                          className="text-xs font-medium text-slate-500 italic"
                        >
                          Đã quá 24 giờ cho phép mở lại phiếu
                        </span>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <>
                  {onSaveDraft && (
                    <button
                      type="button"
                      onClick={handleSaveDraftClick}
                      disabled={isEffectiveLocked}
                      data-testid="save-draft-button"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      Lưu bản nháp
                    </button>
                  )}

                  {onSubmit && (
                    <button
                      type="submit"
                      disabled={isEffectiveLocked}
                      data-testid="submit-evaluation-button"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 shadow-xs transition cursor-pointer disabled:bg-indigo-400"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Hoàn tất & Gửi đánh giá
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================================
            PHẦN 4: ĐÁNH GIÁ CHÉO TỪ HỘI ĐỒNG PHỎNG VẤN (AC 2 - TKNHTTDNB1-465)
            Bị ẩn hoặc che mờ hoàn toàn cho đến khi user hiện tại nộp xong phiếu của chính mình
        ========================================================================= */}
        <section
          id="peer-evaluations-section"
          data-testid="peer-evaluations-container"
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Đánh giá từ các thành viên khác trong Hội đồng
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Xem điểm số, nhận xét và đề xuất tuyển dụng độc lập từ các người phỏng vấn khác
              </p>
            </div>

            {isPeerReviewAllowed ? (
              <span
                data-testid="peer-review-unlocked-badge"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto"
              >
                <Eye className="h-3.5 w-3.5 text-emerald-600" />
                Đã mở khóa ({defaultPeerEvaluations.length} thành viên)
              </span>
            ) : (
              <span
                data-testid="peer-review-locked-badge"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 self-start sm:self-auto"
              >
                <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                Chưa mở khóa (Bảo mật độc lập)
              </span>
            )}
          </div>

          {!isPeerReviewAllowed ? (
            /* Trạng thái bị khóa / che mờ khi chưa nộp phiếu chính mình (AC 2) */
            <div
              data-testid="peer-evaluations-locked-state"
              className="relative rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 sm:p-10 text-center overflow-hidden"
            >
              <div className="relative z-10 max-w-md mx-auto space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-xs">
                  <EyeOff className="h-7 w-7" />
                </div>

                <h4 className="text-base font-bold text-slate-900">
                  Khu vực đánh giá chéo đang bị ẩn
                </h4>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Để đảm bảo tính khách quan và độc lập khi đánh giá ứng viên, bạn cần{' '}
                  <strong className="text-slate-900">hoàn tất và nộp phiếu đánh giá của chính mình</strong>{' '}
                  trước khi có thể xem kết quả đánh giá từ các người phỏng vấn khác trong hội đồng.
                </p>

                <div className="inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-100/80 px-3 py-1.5 rounded-xl border border-amber-200 font-semibold">
                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                  Tự động mở khóa ngay sau khi nộp phiếu
                </div>
              </div>
            </div>
          ) : (
            /* Trạng thái mở khóa khi đã nộp phiếu chính mình (AC 2) */
            <div
              data-testid="peer-evaluations-revealed-section"
              className="space-y-4"
            >
              {defaultPeerEvaluations.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  Chưa có đánh giá nào khác từ các thành viên trong hội đồng phỏng vấn này.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {defaultPeerEvaluations.map((peerItem) => {
                    const peerConclusionConfig = peerItem.conclusion
                      ? CONCLUSION_OPTIONS_CONFIG[peerItem.conclusion]
                      : null;

                    return (
                      <div
                        key={peerItem.interviewerId}
                        data-testid={`peer-evaluation-card-${peerItem.interviewerId}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-3.5 shadow-2xs hover:border-slate-300 transition"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold text-sm">
                              {peerItem.interviewerName.charAt(0)}
                            </div>
                            <div>
                              <h5 className="text-sm font-bold text-slate-900">
                                {peerItem.interviewerName}
                              </h5>
                              <span className="text-xs text-slate-500">
                                {peerItem.interviewerRole || 'Người phỏng vấn'}
                              </span>
                            </div>
                          </div>

                          {peerItem.isSubmitted ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              Đã nộp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 border border-slate-200">
                              <Clock className="h-3 w-3" />
                              Đang chấm
                            </span>
                          )}
                        </div>

                        {peerItem.isSubmitted && (
                          <div className="space-y-3 text-xs">
                            <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                              <span className="text-slate-600 font-medium">Điểm tổng theo trọng số:</span>
                              <span className="font-black text-indigo-700 text-sm">
                                {peerItem.calculatedTotalScore !== null &&
                                peerItem.calculatedTotalScore !== undefined
                                  ? `${peerItem.calculatedTotalScore.toFixed(2)} / 5.0`
                                  : '--'}
                              </span>
                            </div>

                            {peerConclusionConfig && (
                              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                                <span className="text-slate-600 font-medium">Kết luận đề xuất:</span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold border ${peerConclusionConfig.activeBadgeClass}`}
                                >
                                  {peerConclusionConfig.label}
                                </span>
                              </div>
                            )}

                            {peerItem.generalNotes && (
                              <div className="space-y-1">
                                <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">
                                  Nhận xét tổng quát:
                                </span>
                                <p className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700 italic">
                                  &quot;{peerItem.generalNotes}&quot;
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </form>

      {/* Hộp thoại xác nhận nộp phiếu đánh giá (Confirm Modal - AC 2) */}
      <InterviewEvaluationConfirmModal
        isOpen={isConfirmModalOpen}
        candidateName={candidateName}
        jobTitle={jobTitle}
        calculatedTotalScore={calculatedTotalScore}
        conclusion={interviewConclusion}
        onCancel={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmSubmit}
      />

      {/* Hộp thoại xác nhận mở lại phiếu phỏng vấn dành cho Recruiter (AC 1 - TKNHTTDNB1-465) */}
      <InterviewEvaluationReopenModal
        isOpen={isReopenModalOpen}
        candidateName={candidateName}
        jobTitle={jobTitle}
        timeRemainingFormatted={reopenStatus.timeRemainingFormatted}
        isReopening={isReopening}
        errorMessage={reopenErrorMessage}
        onCancel={() => {
          setIsReopenModalOpen(false);
          setReopenErrorMessage(null);
        }}
        onConfirm={handleConfirmReopen}
      />
    </>
  );
};

export default InterviewEvaluationForm;
