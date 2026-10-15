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
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import type {
  EvaluationCriterionItem,
  CriterionScoreValue,
  CriterionEvaluationRecord,
  RatingLevelDefinition,
} from '../../types/interviewEvaluation';
import {
  RATING_LEVEL_DEFINITIONS,
  AVAILABLE_SCORE_OPTIONS,
  DEFAULT_FRAMEWORK_VERSION,
} from '../../types/interviewEvaluation';

export interface InterviewEvaluationFormProps {
  // 1. Thông tin ứng viên & buổi phỏng vấn (AC 1)
  candidateName: string;
  candidateEmail?: string;
  jobTitle: string;
  interviewRound?: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewFormat?: 'ONLINE' | 'OFFLINE';
  locationOrLink?: string;
  interviewerNames?: string[];

  // Thông tin khung năng lực (AC 1)
  frameworkName?: string;
  frameworkCode?: string;
  frameworkVersion?: string;

  // 2. Danh sách tiêu chí đánh giá (AC 2)
  criteria?: EvaluationCriterionItem[];
  initialEvaluations?: Record<string, { score?: CriterionScoreValue | null; comment?: string }>;
  initialGeneralNotes?: string;

  // 3. Trạng thái hiển thị (AC 3)
  isLoading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;

  // Xử lý sự kiện lưu & hoàn tất
  onSubmit?: (evaluationData: {
    criteriaEvaluations: Record<string, CriterionEvaluationRecord>;
    calculatedTotalScore: number | null;
    generalNotes: string;
  }) => void;
  onSaveDraft?: (evaluationData: {
    criteriaEvaluations: Record<string, CriterionEvaluationRecord>;
    calculatedTotalScore: number | null;
    generalNotes: string;
  }) => void;
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
 * Component chính: Phiếu đánh giá năng lực phỏng vấn (TKNHTTDNB1-457 / Story TKNHTTDNB1-65)
 */
export const InterviewEvaluationForm: React.FC<InterviewEvaluationFormProps> = ({
  candidateName,
  candidateEmail,
  jobTitle,
  interviewRound = 'Vòng Phỏng vấn chuyên môn',
  interviewDate,
  interviewTime,
  interviewFormat = 'ONLINE',
  locationOrLink,
  interviewerNames = [],
  frameworkName = 'Khung năng lực tiêu chuẩn',
  frameworkCode = 'CF-STD-2026',
  frameworkVersion = DEFAULT_FRAMEWORK_VERSION,
  criteria = [],
  initialEvaluations = {},
  initialGeneralNotes = '',
  isLoading = false,
  errorMessage = null,
  onRetry,
  onSubmit,
  onSaveDraft,
  onCancel,
  readOnly = false,
  className = '',
}) => {
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

  // Cập nhật điểm số khi người dùng nhấp chọn mức 1-5
  const handleScoreChange = useCallback(
    (criterionId: string, selectedScore: CriterionScoreValue) => {
      if (readOnly) return;

      // Cho phép bấm lại cùng 1 điểm để bỏ chọn (toggle) nếu muốn đặt lại
      setEvaluationsState((previousState) => {
        const currentRecord = previousState[criterionId];
        const nextScore = currentRecord?.score === selectedScore ? null : selectedScore;

        return {
          ...previousState,
          [criterionId]: {
            ...currentRecord,
            score: nextScore,
          },
        };
      });
    },
    [readOnly],
  );

  // Cập nhật nhận xét chi tiết của tiêu chí
  const handleCommentChange = useCallback(
    (criterionId: string, commentText: string) => {
      if (readOnly) return;

      setEvaluationsState((previousState) => ({
        ...previousState,
        [criterionId]: {
          ...previousState[criterionId],
          comment: commentText,
        },
      }));
    },
    [readOnly],
  );

  // Tính toán trước điểm tổng theo trọng số (preview calculation phục vụ subtask tiếp theo)
  const calculatedTotalScore = useMemo<number | null>(() => {
    if (criteria.length === 0) return null;

    let totalWeightedScore = 0;
    let totalWeightCounted = 0;
    let hasAnyScore = false;

    criteria.forEach((criterionItem) => {
      const evaluation = evaluationsState[criterionItem.id];
      if (evaluation && evaluation.score !== null) {
        hasAnyScore = true;
        totalWeightedScore += evaluation.score * (criterionItem.weight / 100);
        totalWeightCounted += criterionItem.weight;
      }
    });

    if (!hasAnyScore) return null;

    // Chuẩn hóa điểm tổng về thang điểm 5.0 làm tròn 2 chữ số thập phân
    const normalizedScore =
      totalWeightCounted > 0 ? (totalWeightedScore / (totalWeightCounted / 100)) : 0;

    return Math.round(normalizedScore * 100) / 100;
  }, [criteria, evaluationsState]);

  // Đếm số lượng tiêu chí đã chấm điểm
  const scoredCriteriaCount = useMemo(() => {
    return Object.values(evaluationsState).filter(
      (evaluationItem) => evaluationItem.score !== null,
    ).length;
  }, [evaluationsState]);

  // Xử lý gửi biểu mẫu hoàn tất đánh giá
  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (onSubmit) {
      onSubmit({
        criteriaEvaluations: evaluationsState,
        calculatedTotalScore,
        generalNotes: generalNotesState,
      });
    }
  };

  // Xử lý lưu nháp
  const handleSaveDraftClick = () => {
    if (onSaveDraft) {
      onSaveDraft({
        criteriaEvaluations: evaluationsState,
        calculatedTotalScore,
        generalNotes: generalNotesState,
      });
    }
  };

  // 1. Kiểm tra trạng thái đang tải dữ liệu (AC 3)
  if (isLoading) {
    return <InterviewEvaluationFormSkeleton className={className} />;
  }

  // 2. Kiểm tra trạng thái có lỗi phát sinh (AC 3)
  if (errorMessage) {
    return <InterviewEvaluationErrorState errorMessage={errorMessage} onRetry={onRetry} />;
  }

  // 3. Kiểm tra trạng thái rỗng chưa có khung năng lực hoặc tiêu chí (AC 3)
  if (criteria.length === 0) {
    return (
      <InterviewEvaluationEmptyState frameworkName={frameworkName} onRetry={onRetry} />
    );
  }

  return (
    <form
      id="interview-evaluation-form"
      data-testid="interview-evaluation-form"
      onSubmit={handleFormSubmit}
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
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
              <Award className="h-3.5 w-3.5" />
              Phiếu Đánh Giá Năng Lực Phỏng Vấn
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
            const currentScore = currentEvaluation?.score || null;
            const currentComment = currentEvaluation?.comment || '';
            const activeLevelDefinition: RatingLevelDefinition | undefined =
              currentScore ? RATING_LEVEL_DEFINITIONS[currentScore] : undefined;

            return (
              <div
                key={criterionItem.id}
                data-testid={`criterion-row-${criterionItem.id}`}
                className={`rounded-2xl border transition-all p-4 sm:p-5 space-y-4 ${
                  currentScore !== null
                    ? 'border-indigo-200 bg-white shadow-xs'
                    : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                }`}
              >
                {/* Hàng 1: Tên tiêu chí & Trọng số (%) */}
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

                  {/* Trọng số (%) của tiêu chí (AC 2) */}
                  <div className="self-start sm:self-center shrink-0">
                    <span
                      data-testid={`criterion-weight-${criterionItem.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 shadow-2xs"
                    >
                      <Sparkles className="h-3 w-3" />
                      Trọng số: {criterionItem.weight}%
                    </span>
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

                    {/* Dãy 5 nút chọn điểm số */}
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
                            disabled={readOnly}
                            data-testid={`score-button-${criterionItem.id}-${scoreOptionValue}`}
                            onClick={() =>
                              handleScoreChange(criterionItem.id, scoreOptionValue)
                            }
                            className={`flex flex-col items-center justify-center rounded-xl border py-2.5 px-1 transition-all cursor-pointer font-bold ${
                              isSelected
                                ? levelConfig.activeButtonClass
                                : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50'
                            } ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}
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

                  {/* Cột phải (lg: 7 cột): Ô nhập nhận xét (AC 2) */}
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
                      disabled={readOnly}
                      value={currentComment}
                      onChange={(changeEvent) =>
                        handleCommentChange(criterionItem.id, changeEvent.target.value)
                      }
                      placeholder="Nhập dẫn chứng thực tế, câu trả lời tiêu biểu hoặc điểm mạnh / điểm cần cải thiện của ứng viên đối với tiêu chí này..."
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 transition resize-y"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          PHẦN 3: PHẦN CUỐI PHIẾU & Ô HIỂN THỊ ĐIỂM TỔNG (AC 2)
          Ô hiển thị Điểm tổng thiết kế trang trọng (logic tính điểm làm ở subtask sau)
      ========================================================================= */}
      <section
        data-testid="evaluation-summary-section"
        className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/60 p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" />
              Tổng kết đánh giá năng lực
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Điểm tổng hợp phản ánh mức độ phù hợp năng lực chuyên môn của ứng viên
            </p>
          </div>

          {/* Ô hiển thị Điểm tổng (AC 2) */}
          <div
            data-testid="total-score-card"
            className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-white p-3.5 sm:p-4 shadow-xs shrink-0 self-start sm:self-auto"
          >
            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Điểm tổng kết
              </span>
              <span className="text-xs text-slate-400 font-medium">Thang điểm 5.0</span>
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

        {/* Chú thích về cách tổng hợp điểm năng lực */}
        <div className="rounded-xl bg-white/80 border border-slate-200/80 p-3 text-xs text-slate-600 flex items-start gap-2.5">
          <HelpCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
          <span>
            <strong>Ghi chú:</strong> Điểm tổng năng lực được ước tính tạm thời dựa trên điểm số
            các tiêu chí và trọng số tương ứng ({scoredCriteriaCount}/{criteria.length} tiêu chí đã
            nhập). Thuật toán tính toán chính thức và đối chiếu chuẩn đầu vào sẽ được kích hoạt tại
            subtask tính điểm tiếp theo.
          </span>
        </div>

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
            disabled={readOnly}
            value={generalNotesState}
            onChange={(changeEvent) => setGeneralNotesState(changeEvent.target.value)}
            placeholder="Ghi nhận đánh giá tổng quát về thái độ, tiềm năng phát triển, văn hóa doanh nghiệp hoặc các đề xuất đặc biệt dành cho Hội đồng tuyển dụng..."
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 transition resize-y"
          />
        </div>

        {/* Cụm nút hành động */}
        {!readOnly && (
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-200/60">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
            )}

            {onSaveDraft && (
              <button
                type="button"
                onClick={handleSaveDraftClick}
                data-testid="save-draft-button"
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                Lưu bản nháp
              </button>
            )}

            {onSubmit && (
              <button
                type="submit"
                data-testid="submit-evaluation-button"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 shadow-xs transition cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                Hoàn tất & Gửi đánh giá
              </button>
            )}
          </div>
        )}
      </section>
    </form>
  );
};

export default InterviewEvaluationForm;
