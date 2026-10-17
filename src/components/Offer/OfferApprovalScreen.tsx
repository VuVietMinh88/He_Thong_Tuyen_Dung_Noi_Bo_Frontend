import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Briefcase,
  DollarSign,
  Calendar,
  Eye,
  Edit3,
  ShieldAlert,
  Sparkles,
  Check,
  Award,
  GraduationCap,
} from 'lucide-react';
import type {
  OfferApprovalScreenProps,
  OfferApprovalDetails,
  OfferApprovalStep,
  OfferApprovalActionType,
  OfferPreviewContent,
} from '../../types/offer';
import {
  formatVndCurrency,
  formatVndWords,
  formatDateVietnamese,
  generateOfferPreviewContent,
  DEFAULT_STANDARD_POSITIONS,
} from '../../utils/offerHelper';
import { offerService } from '../../services/offerService';
import { OfferApprovalModal } from './OfferApprovalModal';
import { OfferPreviewModal } from './OfferPreviewModal';
import { OfferApprovalHistoryTimeline } from './OfferApprovalHistoryTimeline';
import { ToastContext } from '../notifications/ToastContext';

/**
 * Màn hình phê duyệt đề nghị tuyển dụng dành cho cấp Quản lý (Trưởng phòng / Giám đốc / CEO)
 * Jira Subtask: TKNHTTDNB1-498 - Thiết kế màn hình phê duyệt offer (Story TKNHTTDNB1-72)
 */
export const OfferApprovalScreen: React.FC<OfferApprovalScreenProps> = ({
  offerDetails: initialOfferDetails,
  offerId,
  isLoading = false,
  onApprove,
  onReject,
  onRequestChange,
  onBack,
  onViewOfferLetter,
  readOnly = false,
  containerClassName = '',
}) => {
  const toastContext = useContext(ToastContext);
  const toast = useMemo(() => {
    if (toastContext) {
      return toastContext;
    }
    return {
      notify: () => {},
      addToast: () => {},
      removeToast: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
    };
  }, [toastContext]);

  // Quản lý state dữ liệu chi tiết của Offer
  const [currentOfferData, setCurrentOfferData] = useState<OfferApprovalDetails | null>(
    initialOfferDetails || null
  );
  const [prevInitialOfferDetails, setPrevInitialOfferDetails] = useState<OfferApprovalDetails | undefined>(
    initialOfferDetails
  );
  if (initialOfferDetails !== prevInitialOfferDetails) {
    setPrevInitialOfferDetails(initialOfferDetails);
    setCurrentOfferData(initialOfferDetails || null);
  }

  const [isDataLoading, setIsDataLoading] = useState<boolean>(() => !initialOfferDetails && (isLoading || true));

  // State quản lý Modal phê duyệt / từ chối / yêu cầu sửa
  const [activeModalAction, setActiveModalAction] = useState<OfferApprovalActionType | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  // State quản lý xem trước thư Offer chính thức
  const [isPreviewLetterOpen, setIsPreviewLetterOpen] = useState<boolean>(false);

  // Tự động tải dữ liệu nếu chưa có sẵn offerDetails
  useEffect(() => {
    if (initialOfferDetails) {
      return;
    }

    let isSubscribed = true;
    const targetOfferId = offerId || 'demo-offer-001';

    offerService
      .getOfferApprovalDetails(targetOfferId)
      .then((loadedDetails) => {
        if (isSubscribed) {
          setCurrentOfferData(loadedDetails);
        }
      })
      .catch((loadingError: unknown) => {
        const errorMessage =
          (loadingError as Error)?.message || 'Không thể tải thông tin phê duyệt offer.';
        toast.error(errorMessage);
      })
      .finally(() => {
        if (isSubscribed) {
          setIsDataLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [initialOfferDetails, offerId, toast]);

  // Tìm vị trí tương ứng để lấy thêm thông tin mô tả chuẩn
  const matchingPosition = useMemo(() => {
    if (!currentOfferData) return DEFAULT_STANDARD_POSITIONS[0];
    return (
      DEFAULT_STANDARD_POSITIONS.find(
        (positionItem) => positionItem.positionId === currentOfferData.positionId
      ) || DEFAULT_STANDARD_POSITIONS[0]
    );
  }, [currentOfferData]);

  // Dữ liệu nội dung xem trước thư offer
  const letterPreviewContent: OfferPreviewContent | null = useMemo(() => {
    if (!currentOfferData) return null;

    return generateOfferPreviewContent(
      {
        jobTitle: currentOfferData.jobTitle,
        positionId: currentOfferData.positionId,
        offeredSalary: currentOfferData.offeredSalary,
        allowanceAmount: currentOfferData.allowanceAmount,
        allowanceDescription: currentOfferData.allowanceDescription,
        expectedStartDate: currentOfferData.expectedStartDate,
        responseDeadline: currentOfferData.responseDeadline,
        outOfRangeReason: currentOfferData.outOfRangeReason,
        additionalNotes: currentOfferData.additionalNotes,
        sendEmailToCandidate: currentOfferData.sendEmailToCandidate,
      },
      {
        candidateName: currentOfferData.candidateName,
        candidateCode: currentOfferData.candidateCode,
        candidateEmail: currentOfferData.candidateEmail,
        candidatePhoneNumber: currentOfferData.candidatePhoneNumber,
      },
      matchingPosition
    );
  }, [currentOfferData, matchingPosition]);

  // Lấy dòng thời gian lịch sử phê duyệt, fallback khởi tạo nếu chưa có sẵn trong payload
  const effectiveHistoryTimeline = useMemo(() => {
    if (
      currentOfferData?.approvalHistoryTimeline &&
      currentOfferData.approvalHistoryTimeline.length > 0
    ) {
      return currentOfferData.approvalHistoryTimeline;
    }
    if (currentOfferData) {
      return offerService.createDefaultApprovalHistoryTimeline(
        currentOfferData.offerId,
        currentOfferData.isSalaryOutOfRange,
        currentOfferData.status
      );
    }
    return [];
  }, [currentOfferData]);

  // Xử lý mở Modal hành động
  const handleOpenActionModal = (selectedAction: OfferApprovalActionType) => {
    setActiveModalAction(selectedAction);
  };

  const handleCloseActionModal = () => {
    if (isSubmittingAction) return;
    setActiveModalAction(null);
  };

  // Xử lý xác nhận hành động từ Modal (Approve, Reject, Request Change)
  const handleConfirmAction = async (commentOrReason: string) => {
    if (!activeModalAction || !currentOfferData) return;

    try {
      setIsSubmittingAction(true);
      const targetOfferIdentifier = currentOfferData.offerId;

      if (activeModalAction === 'APPROVE') {
        if (onApprove) {
          await onApprove(targetOfferIdentifier, commentOrReason);
        } else {
          const updatedDetails = await offerService.approveOffer(
            targetOfferIdentifier,
            commentOrReason
          );
          setCurrentOfferData(updatedDetails);
        }
        toast.success(`Đã phê duyệt đề nghị tuyển dụng ${currentOfferData.offerCode} thành công.`);
      } else if (activeModalAction === 'REJECT') {
        if (onReject) {
          await onReject(targetOfferIdentifier, commentOrReason);
        } else {
          const updatedDetails = await offerService.rejectOffer(
            targetOfferIdentifier,
            commentOrReason
          );
          setCurrentOfferData(updatedDetails);
        }
        toast.error(`Đã từ chối đề nghị tuyển dụng ${currentOfferData.offerCode}.`);
      } else if (activeModalAction === 'REQUEST_CHANGE') {
        if (onRequestChange) {
          await onRequestChange(targetOfferIdentifier, commentOrReason);
        } else {
          const updatedDetails = await offerService.requestChangeOffer(
            targetOfferIdentifier,
            commentOrReason
          );
          setCurrentOfferData(updatedDetails);
        }
        toast.warning(
          `Đã gửi yêu cầu chỉnh sửa đề nghị ${currentOfferData.offerCode} đến chuyên viên tuyển dụng.`
        );
      }

      handleCloseActionModal();
    } catch (actionError: unknown) {
      const errorMessage =
        (actionError as Error)?.message || 'Đã có lỗi xảy ra trong quá trình xử lý.';
      toast.error(errorMessage);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  if (isDataLoading || !currentOfferData) {
    return (
      <div
        data-testid="offer-approval-loading-skeleton"
        className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800"
      >
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="mt-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
          Đang tải chi tiết đề nghị tuyển dụng...
        </p>
      </div>
    );
  }

  const {
    offerCode,
    candidateName,
    candidateCode,
    candidateEmail,
    candidatePhoneNumber,
    jobTitle,
    jobLevel,
    departmentName,
    offeredSalary,
    allowanceAmount,
    allowanceDescription,
    totalMonthlyCompensation,
    standardSalaryRange,
    isSalaryOutOfRange,
    outOfRangeReason,
    expectedStartDate,
    responseDeadline,
    status,
    approvalWorkflowChain,
    candidateSummary,
    additionalNotes,
    createdBy,
    createdAt,
  } = currentOfferData;

  const isPendingApproval = status === 'PENDING_APPROVAL';

  // Tính chênh lệch so với dải chuẩn để hiển thị trực quan
  const salaryDiffNumber = standardSalaryRange
    ? offeredSalary > standardSalaryRange.maximumSalary
      ? offeredSalary - standardSalaryRange.maximumSalary
      : offeredSalary < standardSalaryRange.minimumSalary
      ? standardSalaryRange.minimumSalary - offeredSalary
      : 0
    : 0;

  const salaryDiffPercent = standardSalaryRange
    ? Math.round(
        (salaryDiffNumber /
          (offeredSalary > standardSalaryRange.maximumSalary
            ? standardSalaryRange.maximumSalary
            : standardSalaryRange.minimumSalary)) *
          100
      )
    : 0;

  return (
    <div
      data-testid="offer-approval-screen-container"
      className={`space-y-6 pb-24 ${containerClassName}`}
    >
      {/* 1. THANH ĐIỀU HƯỚNG & TIÊU ĐỀ TRÊN CÙNG */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                data-testid="btn-back-to-list"
                onClick={onBack}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer transition-colors"
                title="Quay lại danh sách"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">
                  Phê Duyệt Đề Nghị Tuyển Dụng
                </h1>
                <span
                  data-testid="badge-offer-code"
                  className="rounded-lg bg-indigo-50 px-2.5 py-1 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                >
                  {offerCode}
                </span>

                {/* Huy hiệu trạng thái duyệt tổng thể */}
                {status === 'APPROVED' && (
                  <span
                    data-testid="badge-offer-status-approved"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Đã Phê Duyệt
                  </span>
                )}
                {status === 'REJECTED' && (
                  <span
                    data-testid="badge-offer-status-rejected"
                    className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-0.5 text-xs font-bold text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Đã Từ Chối
                  </span>
                )}
                {status === 'PENDING_APPROVAL' && (
                  <span
                    data-testid="badge-offer-status-pending"
                    className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                  >
                    <Clock className="h-3.5 w-3.5 animate-pulse" /> Đang Chờ Phê Duyệt
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Tạo bởi <strong>{createdBy || 'Bộ phận Tuyển dụng'}</strong> • Ngày gửi:{' '}
                {formatDateVietnamese(createdAt ? createdAt.split('T')[0] : undefined)}
              </p>
            </div>
          </div>

          {/* Nút Xem trước thư Offer chính thức */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              data-testid="btn-view-offer-letter"
              onClick={() => {
                if (onViewOfferLetter) {
                  onViewOfferLetter();
                } else {
                  setIsPreviewLetterOpen(true);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 cursor-pointer transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>Xem Thư Mời Nhận Việc (Preview Letter)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CHUỖI CẤP DUYỆT (APPROVAL CHAIN / WORKFLOW UI - AC 2) */}
      <div
        data-testid="approval-workflow-chain-container"
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800 mb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Chuỗi Cấp Phê Duyệt (Approval Workflow)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Quy trình xét duyệt đa cấp theo thẩm quyền ngân sách và chuyên môn
              </p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {approvalWorkflowChain.filter((workflowStep) => workflowStep.status === 'APPROVED').length} /{' '}
            {approvalWorkflowChain.length} Bước hoàn thành
          </span>
        </div>

        {/* Danh sách các bước duyệt với thanh tiến trình nối nhau */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {approvalWorkflowChain.map((stepItem: OfferApprovalStep) => {
            const isApproved = stepItem.status === 'APPROVED';
            const isRejected = stepItem.status === 'REJECTED';
            const isRequestChange = stepItem.status === 'REQUEST_CHANGE';

            return (
              <div
                key={`step-${stepItem.stepOrder}`}
                data-testid={`workflow-step-${stepItem.stepOrder}`}
                className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 ${
                  stepItem.isCurrentStep
                    ? 'border-indigo-400 bg-indigo-50/50 shadow-md shadow-indigo-500/10 dark:border-indigo-500 dark:bg-indigo-950/30'
                    : isApproved
                    ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                    : isRejected
                    ? 'border-rose-200 bg-rose-50/30 dark:border-rose-900/40 dark:bg-rose-950/20'
                    : isRequestChange
                    ? 'border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20'
                    : 'border-gray-200 bg-gray-50/50 opacity-70 dark:border-gray-800 dark:bg-gray-800/40'
                }`}
              >
                {/* Header từng bước: Số bước + Trạng thái */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        isApproved
                          ? 'bg-emerald-600 text-white'
                          : isRejected
                          ? 'bg-rose-600 text-white'
                          : isRequestChange
                          ? 'bg-amber-600 text-white'
                          : stepItem.isCurrentStep
                          ? 'bg-indigo-600 text-white animate-pulse'
                          : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {isApproved ? (
                        <Check className="h-4 w-4" />
                      ) : isRejected ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        stepItem.stepOrder
                      )}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                      Cấp {stepItem.stepOrder}
                    </span>
                  </div>

                  {/* Tag trạng thái của bước */}
                  {stepItem.isCurrentStep && (
                    <span
                      data-testid={`badge-step-${stepItem.stepOrder}-current`}
                      className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-800 dark:bg-indigo-900/80 dark:text-indigo-200 animate-pulse border border-indigo-300 dark:border-indigo-700"
                    >
                      <Sparkles className="h-3 w-3" /> Đang chờ duyệt
                    </span>
                  )}
                  {isApproved && (
                    <span
                      data-testid={`badge-step-${stepItem.stepOrder}-approved`}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Đã duyệt
                    </span>
                  )}
                  {isRejected && (
                    <span
                      data-testid={`badge-step-${stepItem.stepOrder}-rejected`}
                      className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    >
                      <XCircle className="h-3 w-3" /> Từ chối
                    </span>
                  )}
                  {isRequestChange && (
                    <span
                      data-testid={`badge-step-${stepItem.stepOrder}-request-change`}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    >
                      <Edit3 className="h-3 w-3" /> Cần sửa
                    </span>
                  )}
                  {!stepItem.isCurrentStep && !isApproved && !isRejected && !isRequestChange && (
                    <span
                      data-testid={`badge-step-${stepItem.stepOrder}-waiting`}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    >
                      Chờ bước trước
                    </span>
                  )}
                </div>

                {/* Tên bước và chức danh người duyệt */}
                <div className="space-y-1 mb-3">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white leading-snug">
                    {stepItem.stepName}
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                    {stepItem.approverRole}
                  </p>
                </div>

                {/* Thông tin người duyệt */}
                <div className="flex items-center gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800/80">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-xs">
                    {stepItem.approverName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-gray-900 dark:text-white">
                      {stepItem.approverName}
                    </p>
                    {stepItem.reviewedAt ? (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        {new Date(stepItem.reviewedAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        {stepItem.approverEmail || 'Chưa thực hiện'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ghi chú nhận xét của bước duyệt */}
                {stepItem.approvalComment && (
                  <div className="mt-3 rounded-xl bg-white/80 p-2.5 text-[11px] text-gray-700 shadow-2xs dark:bg-gray-800/80 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                    <span className="font-semibold text-gray-900 dark:text-white">Ý kiến: </span>
                    <span className="italic">"{stepItem.approvalComment}"</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. THÔNG TIN ỨNG VIÊN & VỊ TRÍ TUYỂN DỤNG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card thông tin ứng viên */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-gray-800 mb-4">
              <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Thông Tin Ứng Viên
              </h2>
            </div>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-lg shadow-md">
                {candidateName.charAt(0)}
              </div>
              <div>
                <h3
                  data-testid="text-candidate-name"
                  className="text-base font-bold text-gray-900 dark:text-white"
                >
                  {candidateName}
                </h3>
                {candidateCode && (
                  <p className="text-xs text-gray-400 font-mono">Mã: {candidateCode}</p>
                )}
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800/60">
                <span className="text-gray-400">Email:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {candidateEmail || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800/60">
                <span className="text-gray-400">Số điện thoại:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {candidatePhoneNumber || 'Chưa cập nhật'}
                </span>
              </div>
              {candidateSummary?.highestEducation && (
                <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-400 flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" /> Học vấn:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white text-right">
                    {candidateSummary.highestEducation}
                  </span>
                </div>
              )}
              {candidateSummary?.yearsOfExperience !== undefined && (
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Kinh nghiệm:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {candidateSummary.yearsOfExperience} năm chuyên sâu
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Điểm tương thích & Phỏng vấn */}
          {candidateSummary?.matchingScore !== undefined && (
            <div className="mt-4 rounded-xl bg-emerald-50/70 p-3.5 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-emerald-600" /> Điểm đánh giá hồ sơ:
                </span>
                <span
                  data-testid="badge-matching-score"
                  className="font-extrabold text-emerald-700 dark:text-emerald-300 text-sm"
                >
                  {candidateSummary.matchingScore}% Phù hợp
                </span>
              </div>
              {candidateSummary.interviewScore && (
                <p className="mt-1 text-[11px] text-emerald-800 dark:text-emerald-300">
                  Điểm phỏng vấn kỹ thuật:{' '}
                  <strong>{candidateSummary.interviewScore}/10</strong> (Xuất sắc)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Card thông tin chức danh & kế hoạch nhận việc */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-gray-800 mb-4">
            <Briefcase className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Vị Trí Đề Xuất & Thời Hạn Gia Nhập (AC 1)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-400 block mb-1">Chức danh tuyển dụng:</span>
              <p
                data-testid="text-offer-job-title"
                className="text-sm font-extrabold text-gray-900 dark:text-white"
              >
                {jobTitle}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded-md bg-white px-2 py-0.5 font-semibold text-gray-700 shadow-2xs dark:bg-gray-700 dark:text-gray-200">
                  Cấp bậc: {jobLevel || 'Senior'}
                </span>
                <span className="rounded-md bg-white px-2 py-0.5 font-semibold text-gray-700 shadow-2xs dark:bg-gray-700 dark:text-gray-200">
                  Phòng ban: {departmentName || 'Kỹ thuật'}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-400 block mb-1">Lịch trình đề xuất:</span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-emerald-600" /> Ngày nhận việc:
                  </span>
                  <strong
                    data-testid="text-expected-start-date"
                    className="text-gray-900 dark:text-white"
                  >
                    {formatDateVietnamese(expectedStartDate)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-rose-500" /> Hạn phản hồi:
                  </span>
                  <strong
                    data-testid="text-response-deadline"
                    className="text-rose-600 dark:text-rose-400"
                  >
                    {formatDateVietnamese(responseDeadline)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Ghi chú thêm từ người tuyển dụng */}
          {additionalNotes && (
            <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800/30 dark:text-gray-400">
              <span className="font-bold text-gray-800 dark:text-gray-200">Ghi chú tuyển dụng: </span>
              {additionalNotes}
            </div>
          )}
        </div>
      </div>

      {/* 4. CHI TIẾT ĐÃI NGỘ, DẢI LƯƠNG CHUẨN & LÀM NỔI BẬT LÝ DO VƯỢT KHUNG (AC 1) */}
      <div
        data-testid="compensation-details-section"
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900 space-y-6"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Chi Tiết Đãi Ngộ & So Sánh Dải Lương Chuẩn (AC 1)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Đối soát kỹ lưỡng mức lương đề xuất so với khung chuẩn được Hội đồng Tuyển dụng ban hành
              </p>
            </div>
          </div>

          {/* Huy hiệu so sánh nhanh */}
          {isSalaryOutOfRange ? (
            <span
              data-testid="badge-out-of-range-warning"
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-extrabold text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
            >
              <AlertTriangle className="h-3.5 w-3.5" /> Lương Ngoài Dải Chuẩn (+{salaryDiffPercent}%)
            </span>
          ) : (
            <span
              data-testid="badge-within-standard-range"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Trong Dải Lương Chuẩn
            </span>
          )}
        </div>

        {/* 4 Thẻ chỉ số tài chính */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Mức lương cơ bản đề xuất */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 block mb-1">
              Mức lương cơ bản đề xuất:
            </span>
            <p
              data-testid="text-offered-salary"
              className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300"
            >
              {formatVndCurrency(offeredSalary)}
            </p>
            <p className="mt-1 text-[11px] text-emerald-800/80 dark:text-emerald-400 italic">
              ({formatVndWords(offeredSalary)})
            </p>
          </div>

          {/* Dải lương chuẩn của vị trí (AC 1) */}
          <div
            data-testid="standard-salary-range-box"
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
          >
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Dải lương chuẩn của vị trí:
            </span>
            <p
              data-testid="text-standard-salary-range"
              className="text-base font-extrabold text-slate-900 dark:text-white"
            >
              {standardSalaryRange
                ? `${formatVndCurrency(standardSalaryRange.minimumSalary)} – ${formatVndCurrency(
                    standardSalaryRange.maximumSalary
                  )}`
                : 'Chưa có thông tin'}
            </p>
            {standardSalaryRange && (
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Trần khung:{' '}
                <strong>{formatVndCurrency(standardSalaryRange.maximumSalary)}</strong>
              </p>
            )}
          </div>

          {/* Mức phụ cấp */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Phụ cấp hàng tháng:
            </span>
            <p
              data-testid="text-allowance-amount"
              className="text-base font-extrabold text-gray-900 dark:text-white"
            >
              {formatVndCurrency(allowanceAmount)}
            </p>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {allowanceDescription || 'Phụ cấp ăn trưa, đi lại'}
            </p>
          </div>

          {/* Tổng đãi ngộ hàng tháng */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
            <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 block mb-1">
              Tổng đãi ngộ hàng tháng:
            </span>
            <p
              data-testid="text-total-monthly-compensation"
              className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300"
            >
              {formatVndCurrency(totalMonthlyCompensation)}
            </p>
            <p className="mt-1 text-[11px] text-indigo-800/80 dark:text-indigo-400">
              Lương cơ bản + Phụ cấp cố định
            </p>
          </div>
        </div>

        {/* LÀM NỔI BẬT LÝ DO VƯỢT KHUNG KHI LƯƠNG NGOÀI DẢI CHUẨN (AC 1) */}
        {isSalaryOutOfRange ? (
          <div
            data-testid="out-of-range-highlight-banner"
            className="rounded-2xl border-2 border-rose-300 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 p-5 shadow-md dark:border-rose-800 dark:from-rose-950/40 dark:via-amber-950/30 dark:to-orange-950/20"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/30">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-rose-900 dark:text-rose-200">
                      Cảnh Báo: Mức Lương Vượt Trần Dải Chuẩn Được Duyệt
                    </h3>
                    <span className="rounded-md bg-rose-600 px-2 py-0.5 text-xs font-extrabold text-white">
                      +{formatVndCurrency(salaryDiffNumber)} (+{salaryDiffPercent}%)
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                    Mức lương đề xuất{' '}
                    <strong>{formatVndCurrency(offeredSalary)}</strong> cao hơn mức trần{' '}
                    <strong>
                      {standardSalaryRange
                        ? formatVndCurrency(standardSalaryRange.maximumSalary)
                        : ''}
                    </strong>{' '}
                    của vị trí <strong>{jobTitle}</strong>. Cần cấp Quản lý phê duyệt đặc cách dựa trên văn bản giải trình bên dưới.
                  </p>
                </div>

                {/* Khối hiển thị lý do vượt khung chi tiết */}
                <div
                  data-testid="out-of-range-reason-card"
                  className="rounded-xl border border-rose-200 bg-white/95 p-4 shadow-2xs dark:border-rose-900/60 dark:bg-gray-900/90"
                >
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-rose-800 dark:text-rose-300">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>Giải trình lý do vượt khung từ Chuyên viên Tuyển dụng:</span>
                  </div>
                  <p
                    data-testid="text-out-of-range-reason"
                    className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line pl-3 border-l-2 border-rose-500 font-medium"
                  >
                    {outOfRangeReason ||
                      'Chưa có nội dung giải trình chi tiết từ chuyên viên tuyển dụng.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            data-testid="within-range-confirmation-banner"
            className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs font-medium text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <strong className="block font-bold">Mức lương hoàn toàn nằm trong dải chuẩn</strong>
              Mức lương đề xuất phù hợp với định mức chi phí tuyển dụng đã được Ban Giám đốc phê duyệt cho vị trí này.
            </div>
          </div>
        )}
      </div>

      {/* 5. LỊCH SỬ PHÊ DUYỆT & Ý KIẾN NHẬN XÉT (APPROVAL HISTORY TIMELINE - AC 2) */}
      <OfferApprovalHistoryTimeline timelineItems={effectiveHistoryTimeline} />

      {/* 6. KHU VỰC THAO TÁC CỦA NGƯỜI DUYỆT (ACTION AREA - AC 3) */}
      {!readOnly && isPendingApproval && (
        <div
          data-testid="approval-action-area"
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Quyết Định Phê Duyệt Của Bạn (AC 3)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Lựa chọn một trong các hành động bên dưới để tiếp tục quy trình tuyển dụng
              </p>
            </div>

            {/* 3 Nút thao tác rõ ràng theo đúng AC 3 */}
            <div className="flex flex-wrap items-center gap-3">
              {/* 1. NÚT YÊU CẦU SỬA (MÀU CAM/VÀNG) */}
              <button
                type="button"
                data-testid="btn-request-change-offer"
                onClick={() => handleOpenActionModal('REQUEST_CHANGE')}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 cursor-pointer transition-all active:scale-95"
              >
                <Edit3 className="h-4 w-4" />
                <span>Yêu Cầu Sửa (Request Change)</span>
              </button>

              {/* 2. NÚT TỪ CHỐI (MÀU ĐỎ) */}
              <button
                type="button"
                data-testid="btn-reject-offer"
                onClick={() => handleOpenActionModal('REJECT')}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 cursor-pointer transition-all active:scale-95"
              >
                <XCircle className="h-4 w-4" />
                <span>Từ Chối (Reject)</span>
              </button>

              {/* 3. NÚT DUYỆT (MÀU XANH LÁ/XANH DƯƠNG) */}
              <button
                type="button"
                data-testid="btn-approve-offer"
                onClick={() => handleOpenActionModal('APPROVE')}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 cursor-pointer transition-all active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Phê Duyệt (Approve)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THANH CÔNG CỤ CỐ ĐỊNH PHÍA DƯỚI (STICKY BOTTOM ACTION BAR) DÀNH CHO QUẢN LÝ */}
      {!readOnly && isPendingApproval && (
        <div
          data-testid="sticky-bottom-action-bar"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl rounded-2xl border border-gray-200/90 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md dark:border-gray-800/90 dark:bg-gray-900/95"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold text-gray-900 dark:text-white">
                {candidateName} ({offerCode})
              </span>
              <span className="text-gray-400">•</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatVndCurrency(offeredSalary)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                data-testid="btn-sticky-request-change"
                onClick={() => handleOpenActionModal('REQUEST_CHANGE')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Yêu Cầu Sửa</span>
              </button>
              <button
                type="button"
                data-testid="btn-sticky-reject"
                onClick={() => handleOpenActionModal('REJECT')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300 cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Từ Chối</span>
              </button>
              <button
                type="button"
                data-testid="btn-sticky-approve"
                onClick={() => handleOpenActionModal('APPROVE')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Duyệt Offer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THAO TÁC PHÊ DUYỆT (OFFER APPROVAL MODAL) */}
      {activeModalAction && (
        <OfferApprovalModal
          isOpen={Boolean(activeModalAction)}
          actionMode={activeModalAction}
          offerCode={offerCode}
          candidateName={candidateName}
          jobTitle={jobTitle}
          isSubmitting={isSubmittingAction}
          onConfirm={handleConfirmAction}
          onClose={handleCloseActionModal}
        />
      )}

      {/* MODAL XEM TRƯỚC THƯ OFFER CHÍNH THỨC (OFFER PREVIEW MODAL) */}
      {letterPreviewContent && (
        <OfferPreviewModal
          isOpen={isPreviewLetterOpen}
          previewContent={letterPreviewContent}
          onClose={() => setIsPreviewLetterOpen(false)}
          onConfirmSubmit={() => {
            setIsPreviewLetterOpen(false);
            handleOpenActionModal('APPROVE');
          }}
        />
      )}
    </div>
  );
};
export default OfferApprovalScreen;
