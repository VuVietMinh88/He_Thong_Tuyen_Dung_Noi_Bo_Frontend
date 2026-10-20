import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Send,
  Save,
  ArrowLeft,
  Building2,
  TrendingUp,
  TrendingDown,
  Info,
  Sparkles,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import type {
  OfferDraftFormProps,
  OfferFormValues,
  JobPositionOption,
  StandardSalaryRange,
  ActiveOfferConflict,
  OfferPreviewContent,
  OfferRecord,
} from '../../types/offer';
import {
  DEFAULT_STANDARD_POSITIONS,
  formatVndCurrency,
  evaluateSalaryAgainstRange,
  calculateTotalMonthlyPackage,
  createOfferFormValidationSchema,
  calculateDefaultFutureDate,
  generateOfferPreviewContent,
  createOfferRecordFromValues,
} from '../../utils/offerHelper';
import { offerService } from '../../services/offerService';
import { OfferPreviewModal } from './OfferPreviewModal';
import { ToastContext } from '../notifications/ToastContext';

/**
 * Biểu mẫu soạn thảo đề nghị tuyển dụng (Offer Letter)
 * Jira Subtask: TKNHTTDNB1-491 & TKNHTTDNB1-492 (Story TKNHTTDNB1-71)
 */
export const OfferDraftForm: React.FC<OfferDraftFormProps> = ({
  candidateId,
  candidateName = 'Ứng viên tiềm năng',
  candidateCode,
  candidateEmail,
  candidatePhoneNumber,
  expectedCandidateSalary,
  initialJobTitle,
  initialPositionId,
  initialOfferedSalary,
  initialAllowanceAmount = 1500000,
  initialAllowanceDescription = 'Phụ cấp ăn trưa và gửi xe hàng tháng',
  initialExpectedStartDate,
  initialResponseDeadline,
  initialOutOfRangeReason = '',
  initialAdditionalNotes = '',
  availablePositions = DEFAULT_STANDARD_POSITIONS,
  existingActiveOffer = null,
  isSubmitting = false,
  isSavingDraft = false,
  onSubmitOffer,
  onSaveDraft,
  onPreviewOffer,
  onSubmitSuccess,
  onCancel,
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

  // 1. Khởi tạo chức danh và dải lương chuẩn ban đầu
  const initialSelectedPosition = useMemo(() => {
    if (initialPositionId) {
      return (
        availablePositions.find(
          (positionOption: JobPositionOption) =>
            positionOption.positionId === initialPositionId
        ) || availablePositions[0]
      );
    }
    if (initialJobTitle) {
      return (
        availablePositions.find(
          (positionOption: JobPositionOption) =>
            positionOption.positionTitle.toLowerCase() ===
            initialJobTitle.toLowerCase()
        ) || availablePositions[0]
      );
    }
    return availablePositions[0];
  }, [availablePositions, initialPositionId, initialJobTitle]);

  const [selectedPositionId, setSelectedPositionId] = useState<string>(
    initialSelectedPosition ? initialSelectedPosition.positionId : ''
  );

  // Trạng thái modal xem trước thư offer
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewContentData, setPreviewContentData] = useState<OfferPreviewContent | null>(null);

  // Trạng thái loading cục bộ khi người dùng thao tác
  const [isLocalSubmitting, setIsLocalSubmitting] = useState<boolean>(false);
  const [isLocalSavingDraft, setIsLocalSavingDraft] = useState<boolean>(false);

  // Trạng thái kiểm tra trùng lặp offer còn hiệu lực
  const [activeOfferConflict, setActiveOfferConflict] = useState<ActiveOfferConflict | null>(() => {
    if (existingActiveOffer) {
      return {
        hasActiveOffer: true,
        activeOffer: existingActiveOffer,
        conflictMessage: `Ứng viên này đã có một đề nghị tuyển dụng đang còn hiệu lực (${existingActiveOffer.offerCode} - ${existingActiveOffer.jobTitle}).`,
      };
    }
    return null;
  });

  // Tự động kiểm tra xung đột offer khi candidateId thay đổi
  useEffect(() => {
    let isCurrentRequest = true;

    if (candidateId && !existingActiveOffer) {
      offerService
        .checkActiveOfferConflict(candidateId)
        .then((conflictCheckResult) => {
          if (isCurrentRequest && conflictCheckResult.hasActiveOffer) {
            setActiveOfferConflict(conflictCheckResult);
          }
        })
        .catch(() => {
          // Bỏ qua lỗi mạng trong background check để không chặn luồng soạn thảo ban đầu
        });
    }

    return () => {
      isCurrentRequest = false;
    };
  }, [candidateId, existingActiveOffer]);

  // Lấy dải lương chuẩn của chức danh đang được lựa chọn
  const activeStandardSalaryRange: StandardSalaryRange | undefined = useMemo(() => {
    const currentPosition = availablePositions.find(
      (positionOption: JobPositionOption) =>
        positionOption.positionId === selectedPositionId
    );
    return currentPosition?.standardSalaryRange;
  }, [availablePositions, selectedPositionId]);

  // Thiết lập ngày mặc định: Ngày nhận việc sau 14 ngày, hạn phản hồi sau 5 ngày
  const defaultExpectedStartDate = useMemo(() => {
    return initialExpectedStartDate || calculateDefaultFutureDate(14);
  }, [initialExpectedStartDate]);

  const defaultResponseDeadline = useMemo(() => {
    return initialResponseDeadline || calculateDefaultFutureDate(5);
  }, [initialResponseDeadline]);

  // Xác định mức lương ban đầu: Ưu tiên giá trị truyền vào hoặc cận dưới của dải chuẩn
  const defaultOfferedSalary = useMemo(() => {
    if (initialOfferedSalary && initialOfferedSalary > 0) {
      return initialOfferedSalary;
    }
    if (expectedCandidateSalary && expectedCandidateSalary > 0) {
      return expectedCandidateSalary;
    }
    if (activeStandardSalaryRange) {
      return activeStandardSalaryRange.minimumSalary;
    }
    return 20000000;
  }, [initialOfferedSalary, expectedCandidateSalary, activeStandardSalaryRange]);

  // 2. Khởi tạo React Hook Form với resolver động theo dải lương thực tế
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<OfferFormValues>({
    resolver: (formValues, validationContext, validationOptions) => {
      // Đánh giá trạng thái vượt khung tại đúng thời điểm validate
      const currentSalaryEvaluation = evaluateSalaryAgainstRange(
        Number(formValues.offeredSalary) || 0,
        activeStandardSalaryRange
      );
      const dynamicSchema = createOfferFormValidationSchema(
        currentSalaryEvaluation.isSalaryOutOfRange
      );
      return zodResolver(dynamicSchema)(
        formValues,
        validationContext,
        validationOptions
      );
    },
    defaultValues: {
      jobTitle: initialSelectedPosition
        ? initialSelectedPosition.positionTitle
        : initialJobTitle || '',
      positionId: selectedPositionId,
      offeredSalary: defaultOfferedSalary,
      allowanceAmount: initialAllowanceAmount,
      allowanceDescription: initialAllowanceDescription,
      expectedStartDate: defaultExpectedStartDate,
      responseDeadline: defaultResponseDeadline,
      outOfRangeReason: initialOutOfRangeReason,
      additionalNotes: initialAdditionalNotes,
      sendEmailToCandidate: true,
    },
    mode: 'onChange',
  });

  // Theo dõi trực tiếp các trường để cập nhật tính toán realtime
  const watchedOfferedSalary = useWatch({
    control,
    name: 'offeredSalary',
    defaultValue: defaultOfferedSalary,
  });

  const watchedAllowanceAmount = useWatch({
    control,
    name: 'allowanceAmount',
    defaultValue: initialAllowanceAmount,
  });

  // Đánh giá đối chiếu lương đề xuất với dải chuẩn realtime
  const salaryComparison = useMemo(() => {
    return evaluateSalaryAgainstRange(
      Number(watchedOfferedSalary) || 0,
      activeStandardSalaryRange
    );
  }, [watchedOfferedSalary, activeStandardSalaryRange]);

  // Trạng thái lương vượt khung được suy diễn trực tiếp từ giá trị thực tế
  const isSalaryOutOfRange = salaryComparison.isSalaryOutOfRange;

  // Tính tổng đãi ngộ hàng tháng (Lương + Phụ cấp)
  const totalMonthlyCompensation = useMemo(() => {
    return calculateTotalMonthlyPackage(
      Number(watchedOfferedSalary) || 0,
      Number(watchedAllowanceAmount) || 0
    );
  }, [watchedOfferedSalary, watchedAllowanceAmount]);

  // Xử lý khi người tuyển dụng thay đổi chức danh từ danh mục
  const handlePositionSelectionChange = (
    changeEvent: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const nextPositionId = changeEvent.target.value;
    setSelectedPositionId(nextPositionId);
    setValue('positionId', nextPositionId);

    const matchingPosition = availablePositions.find(
      (positionOption: JobPositionOption) =>
        positionOption.positionId === nextPositionId
    );

    if (matchingPosition) {
      setValue('jobTitle', matchingPosition.positionTitle, {
        shouldValidate: true,
      });
      // Tự động kiểm tra lại điều kiện hợp lệ của mức lương so với dải mới
      trigger('offeredSalary');
    }
  };

  // Các nút gán ngày nhanh tiện ích cho Recruiter
  const handleSetQuickStartDateDays = (additionalDays: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + additionalDays);
    const formattedDateString = targetDate.toISOString().split('T')[0];
    setValue('expectedStartDate', formattedDateString, {
      shouldValidate: true,
    });
  };

  const handleSetQuickDeadlineDays = (additionalDays: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + additionalDays);
    const formattedDateString = targetDate.toISOString().split('T')[0];
    setValue('responseDeadline', formattedDateString, {
      shouldValidate: true,
    });
  };

  // 3. XỬ LÝ HÀNH ĐỘNG: LƯU BẢN NHÁP (SAVE DRAFT - AC 1)
  // Cho phép lưu form mà không cần phải thỏa mãn toàn bộ validation bắt buộc
  const handleSaveDraft = async () => {
    try {
      setIsLocalSavingDraft(true);
      const currentFormValues = getValues();

      if (onSaveDraft) {
        await onSaveDraft(currentFormValues);
      } else {
        await offerService.saveOfferDraft(
          candidateId || 'temp-candidate',
          currentFormValues
        );
      }

      toast.success('Đã lưu bản nháp đề nghị tuyển dụng thành công.');
    } catch (saveError: unknown) {
      const errorMessage =
        (saveError as Error)?.message || 'Lỗi khi lưu bản nháp đề nghị tuyển dụng.';
      toast.error(errorMessage);
    } finally {
      setIsLocalSavingDraft(false);
    }
  };

  // 4. XỬ LÝ HÀNH ĐỘNG: XEM TRƯỚC THƯ OFFER (PREVIEW - AC 1)
  const handleOpenPreviewModal = () => {
    const currentFormValues = getValues();
    const currentPosition = availablePositions.find(
      (positionOption: JobPositionOption) =>
        positionOption.positionId === selectedPositionId
    );

    const generatedPreview = generateOfferPreviewContent(
      currentFormValues,
      {
        candidateName,
        candidateCode,
        candidateEmail,
        candidatePhoneNumber,
      },
      currentPosition
    );

    setPreviewContentData(generatedPreview);
    setIsPreviewModalOpen(true);

    if (onPreviewOffer) {
      onPreviewOffer(currentFormValues);
    }
  };

  // 5. XỬ LÝ HÀNH ĐỘNG: GỬI DUYỆT ĐỀ NGHỊ (SUBMIT FOR APPROVAL - AC 1 & AC 2)
  const handleFormSubmit = async (formDataValues: OfferFormValues) => {
    // Chặn gửi duyệt ngay nếu ứng viên này đã có một offer khác đang còn hiệu lực
    if (activeOfferConflict?.hasActiveOffer) {
      toast.error(
        activeOfferConflict.conflictMessage ||
          'Không thể gửi duyệt: Ứng viên này đã có một đề nghị tuyển dụng đang còn hiệu lực.'
      );
      return;
    }

    try {
      setIsLocalSubmitting(true);

      // Kiểm tra API backend xem có xung đột mới phát sinh hay không
      if (candidateId) {
        const conflictCheckResult = await offerService.checkActiveOfferConflict(candidateId);
        if (conflictCheckResult.hasActiveOffer) {
          setActiveOfferConflict(conflictCheckResult);
          toast.error(
            conflictCheckResult.conflictMessage ||
              'Ứng viên đã có đề nghị tuyển dụng đang còn hiệu lực tại cùng thời điểm.'
          );
          return;
        }
      }

      let submittedOfferRecord: OfferRecord;

      if (onSubmitOffer) {
        await onSubmitOffer(formDataValues);
        submittedOfferRecord = createOfferRecordFromValues(
          candidateId || 'cand-001',
          candidateName,
          candidateCode,
          candidateEmail,
          candidatePhoneNumber,
          formDataValues,
          isSalaryOutOfRange,
          salaryComparison.comparisonStatus
        );
      } else {
        submittedOfferRecord = await offerService.submitOfferForApproval(
          candidateId || 'temp-candidate',
          formDataValues
        );
      }

      toast.success(
        `Đã gửi duyệt đề nghị tuyển dụng cho ứng viên ${candidateName} thành công.`
      );

      // Đóng modal xem trước nếu đang mở
      setIsPreviewModalOpen(false);

      if (onSubmitSuccess) {
        onSubmitSuccess(submittedOfferRecord);
      }
    } catch (submissionError: unknown) {
      // Xử lý lỗi API triệt để: không nuốt lỗi, bắt và hiển thị thông báo
      const responseError = submissionError as {
        response?: { status?: number; data?: { message?: string } };
        statusCode?: number;
        message?: string;
      };

      const statusCode = responseError.response?.status || responseError.statusCode;
      const errorMessage =
        responseError.response?.data?.message ||
        responseError.message ||
        'Đã xảy ra lỗi khi gửi duyệt đề nghị tuyển dụng.';

      if (statusCode === 409) {
        setActiveOfferConflict({
          hasActiveOffer: true,
          conflictMessage: errorMessage,
        });
      }

      toast.error(errorMessage);
    } finally {
      setIsLocalSubmitting(false);
    }
  };

  const isFormSubmitting = isSubmitting || isLocalSubmitting;
  const isFormSavingDraft = isSavingDraft || isLocalSavingDraft;

  return (
    <div
      data-testid="offer-draft-form-container"
      className={`rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 overflow-hidden ${containerClassName}`}
    >
      {/* Header Biểu mẫu */}
      <div className="border-b border-gray-100 bg-gradient-to-r from-emerald-50/70 via-indigo-50/40 to-white px-6 py-5 dark:border-gray-800 dark:from-emerald-950/20 dark:via-indigo-950/20 dark:to-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Soạn Thảo Đề Nghị Tuyển Dụng (Offer Letter)
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  <Sparkles className="h-3 w-3" /> Chuẩn dải lương
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Thiết lập chế độ đãi ngộ, ngày nhận việc và điều khoản gửi đến ứng viên.
              </p>
            </div>
          </div>

          {/* Huy hiệu thông tin ứng viên */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 self-start sm:self-auto rounded-xl border border-gray-200/80 bg-white/80 px-3.5 py-2 shadow-2xs dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-xs">
                <span className="font-bold text-gray-900 dark:text-white">
                  {candidateName}
                </span>
                {candidateCode && (
                  <span className="ml-1.5 text-gray-400 dark:text-gray-500">
                    ({candidateCode})
                  </span>
                )}
                {candidateId && (
                  <span className="sr-only">ID: {candidateId}</span>
                )}
              </div>
            </div>
            {(candidateEmail || candidatePhoneNumber || expectedCandidateSalary) && (
              <div className="text-[11px] text-gray-500 dark:text-gray-400 sm:border-l sm:border-gray-200 sm:pl-2.5 sm:dark:border-gray-700">
                {candidateEmail && <span className="mr-2">{candidateEmail}</span>}
                {candidatePhoneNumber && <span className="mr-2">{candidatePhoneNumber}</span>}
                {expectedCandidateSalary && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Kỳ vọng: {formatVndCurrency(expectedCandidateSalary)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CẢNH BÁO TRÙNG OFFER CÒN HIỆU LỰC (AC 2) */}
      {activeOfferConflict?.hasActiveOffer && (
        <div
          data-testid="active-offer-conflict-alert"
          className="mx-6 mt-6 rounded-xl border border-rose-300 bg-rose-50/90 p-4 text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200 animate-in fade-in duration-200"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-200 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wide">
                  Cảnh báo: Ứng viên đang có đề nghị tuyển dụng còn hiệu lực
                </h4>
                <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                  Không thể gửi duyệt
                </span>
              </div>
              <p className="text-xs leading-relaxed">
                {activeOfferConflict.conflictMessage ||
                  'Ứng viên đã có một offer đang trong quy trình phê duyệt hoặc đã gửi. Vui lòng hủy hoặc kết thúc offer cũ trước khi gửi đề xuất mới.'}
              </p>
              {activeOfferConflict.activeOffer && (
                <div className="mt-2 text-[11px] text-rose-800 dark:text-rose-300 font-semibold bg-white/60 dark:bg-black/20 p-2 rounded-lg border border-rose-200 dark:border-rose-900/50">
                  Mã offer hiện tại: <strong>{activeOfferConflict.activeOffer.offerCode}</strong> •
                  Vị trí: <strong>{activeOfferConflict.activeOffer.jobTitle}</strong> •
                  Trạng thái: <strong>{activeOfferConflict.activeOffer.status}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nội dung form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
        {/* KHỐI 1: CHỨC DANH VÀ VỊ TRÍ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-gray-800">
            <Briefcase className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
              1. Thông Tin Vị Trí & Chức Danh
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chọn chức danh từ danh mục chuẩn */}
            <div>
              <label
                htmlFor="positionSelect"
                className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1"
              >
                Chức danh / Vị trí tuyển dụng <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="positionSelect"
                  data-testid="select-job-title"
                  value={selectedPositionId}
                  onChange={handlePositionSelectionChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs font-semibold text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white cursor-pointer"
                >
                  {availablePositions.map((positionOption: JobPositionOption) => (
                    <option
                      key={positionOption.positionId}
                      value={positionOption.positionId}
                    >
                      {positionOption.positionTitle} ({positionOption.jobLevel} -{' '}
                      {positionOption.departmentName})
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Lựa chọn vị trí để hệ thống tự động tải dải lương chuẩn được duyệt.
              </p>
            </div>

            {/* Hiển thị tóm tắt thông tin chức danh đã chọn */}
            <div className="flex flex-col justify-center rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 dark:border-emerald-950/60 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Khung chuẩn doanh nghiệp:</span>
              </div>
              <div className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                Cấp bậc:{' '}
                <strong>
                  {availablePositions.find(
                    (positionOption: JobPositionOption) =>
                      positionOption.positionId === selectedPositionId
                  )?.jobLevel || 'Chuyên viên'}
                </strong>{' '}
                • Phòng ban:{' '}
                <strong>
                  {availablePositions.find(
                    (positionOption: JobPositionOption) =>
                      positionOption.positionId === selectedPositionId
                  )?.departmentName || 'Công nghệ thông tin'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* KHỐI 2: MỨC LƯƠNG, DẢI LƯƠNG CHUẨN VÀ PHỤ CẤP */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-gray-800">
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
              2. Chế Độ Đãi Ngộ & Dải Lương Chuẩn
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Cột 1: Ô nhập mức lương đề xuất kèm hiển thị dải lương chuẩn ngay bên cạnh */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <label
                  htmlFor="offeredSalaryInput"
                  className="text-xs font-bold text-gray-700 dark:text-gray-300"
                >
                  Mức lương đề xuất (VNĐ/tháng) <span className="text-rose-500">*</span>
                </label>

                {/* YÊU CẦU 2 (AC 2): Hiển thị dải lương chuẩn của vị trí ngay cạnh ô nhập */}
                <div
                  data-testid="standard-salary-range-display"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <span className="text-slate-400 dark:text-slate-400">Dải chuẩn:</span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                    {`${salaryComparison.formattedMinimumSalary} – ${salaryComparison.formattedMaximumSalary}`}
                  </span>
                </div>
              </div>

              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  id="offeredSalaryInput"
                  type="number"
                  step="500000"
                  min="1000000"
                  data-testid="input-offered-salary"
                  placeholder="Nhập mức lương (VD: 32000000)"
                  {...register('offeredSalary', { valueAsNumber: true })}
                  className={`w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm font-bold text-gray-900 shadow-2xs focus:outline-hidden focus:ring-2 dark:bg-gray-800 dark:text-white ${
                    errors.offeredSalary
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : isSalaryOutOfRange
                      ? 'border-amber-400 focus:ring-amber-500/20 dark:border-amber-500'
                      : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-gray-700'
                  }`}
                />
              </div>

              {/* Thông tin phụ trợ: Chuyển đổi thành dạng chữ và trạng thái so sánh */}
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Bằng số: {formatVndCurrency(Number(watchedOfferedSalary) || 0)}
                </span>

                {/* Huy hiệu so sánh dải lương */}
                {salaryComparison.comparisonStatus === 'WITHIN' && (
                  <span
                    data-testid="salary-status-badge-within"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                  >
                    <CheckCircle2 className="h-3 w-3" /> Trong dải chuẩn
                  </span>
                )}
                {salaryComparison.comparisonStatus === 'ABOVE' && (
                  <span
                    data-testid="salary-status-badge-above"
                    className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 font-bold text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
                  >
                    <TrendingUp className="h-3 w-3" /> Vượt mức trần (+
                    {salaryComparison.differencePercentage}%)
                  </span>
                )}
                {salaryComparison.comparisonStatus === 'BELOW' && (
                  <span
                    data-testid="salary-status-badge-below"
                    className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                  >
                    <TrendingDown className="h-3 w-3" /> Dưới mức sàn (
                    {salaryComparison.differencePercentage}%)
                  </span>
                )}
              </div>

              {errors.offeredSalary && (
                <p
                  data-testid="error-offered-salary"
                  className="text-xs text-rose-600 dark:text-rose-400 font-medium"
                >
                  {errors.offeredSalary.message}
                </p>
              )}
            </div>

            {/* Cột 2: Ô nhập mức phụ cấp */}
            <div className="space-y-2">
              <label
                htmlFor="allowanceAmountInput"
                className="block text-xs font-bold text-gray-700 dark:text-gray-300"
              >
                Mức phụ cấp hàng tháng (VNĐ)
              </label>

              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  id="allowanceAmountInput"
                  type="number"
                  step="100000"
                  min="0"
                  data-testid="input-allowance"
                  placeholder="Nhập mức phụ cấp (VD: 1500000)"
                  {...register('allowanceAmount', { valueAsNumber: true })}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                <span>
                  Phụ cấp: {formatVndCurrency(Number(watchedAllowanceAmount) || 0)}
                </span>
                <input
                  type="text"
                  placeholder="Ghi chú phụ cấp (cơm trưa, điện thoại...)"
                  {...register('allowanceDescription')}
                  className="text-right text-[11px] text-gray-600 dark:text-gray-300 border-b border-dashed border-gray-300 focus:outline-hidden dark:border-gray-600"
                />
              </div>

              {errors.allowanceAmount && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {errors.allowanceAmount.message}
                </p>
              )}
            </div>
          </div>

          {/* CẢNH BÁO DẢI LƯƠNG CHUẨN TRỰC QUAN (AC 2) */}
          {isSalaryOutOfRange && (
            <div
              data-testid="salary-range-warning-banner"
              className={`rounded-xl border p-4 transition-all duration-200 ${
                salaryComparison.comparisonStatus === 'ABOVE'
                  ? 'border-rose-200 bg-rose-50/80 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200'
                  : 'border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    salaryComparison.comparisonStatus === 'ABOVE'
                      ? 'bg-rose-200 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                      : 'bg-amber-200 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wide">
                      {salaryComparison.comparisonStatus === 'ABOVE'
                        ? 'Cảnh báo: Mức lương vượt trần dải lương chuẩn'
                        : 'Cảnh báo: Mức lương thấp hơn sàn dải lương chuẩn'}
                    </h4>
                    <span className="rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] font-bold shadow-2xs dark:bg-black/30">
                      Bắt buộc nhập lý do vượt khung
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {salaryComparison.alertMessage}
                  </p>
                  <p className="text-[11px] font-semibold opacity-90">
                    Trường <strong>"Lý do vượt khung"</strong> bên dưới đã được tự động chuyển thành bắt buộc để phục vụ công tác phê duyệt của Ban Giám Đốc / Trưởng phòng Nhân sự.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Thẻ tổng hợp tổng thu nhập hàng tháng */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/40">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
              <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Tổng thu nhập hàng tháng ước tính (Lương + Phụ cấp):</span>
            </div>
            <div
              data-testid="total-compensation-display"
              className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 mt-1 sm:mt-0"
            >
              {formatVndCurrency(totalMonthlyCompensation)}
            </div>
          </div>
        </div>

        {/* KHỐI 3: KẾ HOẠCH GIA NHẬP VÀ THỜI HẠN PHẢN HỒI */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-gray-800">
            <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
              3. Kế Hoạch Nhận Việc & Thời Hạn Phản Hồi
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Ngày dự kiến nhận việc */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="startDateInput"
                  className="text-xs font-bold text-gray-700 dark:text-gray-300"
                >
                  Ngày dự kiến nhận việc (Onboarding) <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleSetQuickStartDateDays(14)}
                    className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
                  >
                    +14 ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickStartDateDays(30)}
                    className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
                  >
                    +30 ngày
                  </button>
                </div>
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  id="startDateInput"
                  type="date"
                  data-testid="input-expected-start-date"
                  {...register('expectedStartDate')}
                  className={`w-full rounded-xl border py-2.5 pl-9 pr-3 text-xs font-semibold text-gray-900 shadow-2xs focus:outline-hidden focus:ring-2 dark:bg-gray-800 dark:text-white ${
                    errors.expectedStartDate
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-gray-700'
                  }`}
                />
              </div>

              {errors.expectedStartDate && (
                <p
                  data-testid="error-expected-start-date"
                  className="text-xs text-rose-600 dark:text-rose-400 font-medium"
                >
                  {errors.expectedStartDate.message}
                </p>
              )}
            </div>

            {/* Hạn phản hồi đề nghị tuyển dụng */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="deadlineInput"
                  className="text-xs font-bold text-gray-700 dark:text-gray-300"
                >
                  Hạn chót phản hồi đề nghị (Deadline) <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleSetQuickDeadlineDays(3)}
                    className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
                  >
                    +3 ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickDeadlineDays(5)}
                    className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
                  >
                    +5 ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickDeadlineDays(7)}
                    className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
                  >
                    +7 ngày
                  </button>
                </div>
              </div>

              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  id="deadlineInput"
                  type="date"
                  data-testid="input-response-deadline"
                  {...register('responseDeadline')}
                  className={`w-full rounded-xl border py-2.5 pl-9 pr-3 text-xs font-semibold text-gray-900 shadow-2xs focus:outline-hidden focus:ring-2 dark:bg-gray-800 dark:text-white ${
                    errors.responseDeadline
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-gray-700'
                  }`}
                />
              </div>

              {errors.responseDeadline && (
                <p
                  data-testid="error-response-deadline"
                  className="text-xs text-rose-600 dark:text-rose-400 font-medium"
                >
                  {errors.responseDeadline.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* KHỐI 4: LÝ DO VƯỢT KHUNG (TEXTAREA - AC 1 & AC 2) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={`h-4 w-4 ${
                  isSalaryOutOfRange
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-gray-400'
                }`}
              />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                4. Giải Trình Lý Do Vượt Khung (Nếu có)
              </h3>
            </div>

            {/* Chỉ báo bắt buộc theo trạng thái lương */}
            {isSalaryOutOfRange ? (
              <span
                data-testid="out-of-range-required-indicator"
                className="rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
              >
                * Bắt buộc nhập (Do lương vượt dải chuẩn)
              </span>
            ) : (
              <span
                data-testid="out-of-range-optional-indicator"
                className="text-[11px] text-gray-400 dark:text-gray-500 font-medium"
              >
                (Tùy chọn khi lương trong dải chuẩn)
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="outOfRangeReasonInput"
              className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1"
            >
              Lý do vượt khung / Căn cứ đề xuất đặc cách{' '}
              {isSalaryOutOfRange && (
                <span className="text-rose-500">*</span>
              )}
            </label>

            <textarea
              id="outOfRangeReasonInput"
              rows={3}
              data-testid="textarea-out-of-range-reason"
              placeholder={
                isSalaryOutOfRange
                  ? 'Bắt buộc nhập: Giải trình lý do đặc cách (năng lực vượt trội, chứng chỉ quốc tế, kinh nghiệm đặc thù hoặc cạnh tranh thu hút nhân tài)...'
                  : 'Ghi chú thêm giải trình đặc thù nếu có nhu cầu lưu trữ nội bộ...'
              }
              {...register('outOfRangeReason')}
              className={`w-full rounded-xl border p-3 text-xs text-gray-900 shadow-2xs focus:outline-hidden focus:ring-2 dark:bg-gray-800 dark:text-white ${
                errors.outOfRangeReason
                  ? 'border-rose-400 focus:ring-rose-500/20'
                  : isSalaryOutOfRange
                  ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-500/20 dark:border-amber-700'
                  : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-gray-700'
              }`}
            />

            {errors.outOfRangeReason && (
              <p
                data-testid="error-out-of-range-reason"
                className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium"
              >
                {errors.outOfRangeReason.message}
              </p>
            )}
          </div>
        </div>

        {/* KHỐI 5: GHI CHÚ NỘI BỘ & TÙY CHỌN GỬI THƯ */}
        <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              data-testid="checkbox-send-email"
              {...register('sendEmailToCandidate')}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800"
            />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Tự động gửi email thông báo kèm thư mời nhận việc chính thức (Offer Letter) cho ứng viên
            </span>
          </label>

          <div>
            <label
              htmlFor="additionalNotesInput"
              className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1"
            >
              Ghi chú thêm cho hồ sơ tuyển dụng (Nội bộ):
            </label>
            <input
              id="additionalNotesInput"
              type="text"
              data-testid="input-additional-notes"
              placeholder="VD: Cần duyệt thêm từ Giám đốc Khối trước ngày gửi..."
              {...register('additionalNotes')}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* NÚT THAO TÁC BIỂU MẪU (AC 1) */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          {onCancel && (
            <button
              type="button"
              data-testid="btn-cancel-offer"
              onClick={onCancel}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Hủy Bỏ / Quay Lại</span>
            </button>
          )}

          {/* 1. NÚT XEM TRƯỚC THƯ OFFER (AC 1) */}
          <button
            type="button"
            data-testid="btn-preview-offer"
            onClick={handleOpenPreviewModal}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-100 hover:border-indigo-300 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300 cursor-pointer"
          >
            <Eye className="h-4 w-4" />
            <span>Xem Trước (Preview)</span>
          </button>

          {/* 2. NÚT LƯU BẢN NHÁP (AC 1) */}
          <button
            type="button"
            data-testid="btn-save-draft-offer"
            disabled={isFormSavingDraft || isFormSubmitting}
            onClick={handleSaveDraft}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 cursor-pointer disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isFormSavingDraft ? 'Đang Lưu Nháp...' : 'Lưu Bản Nháp'}</span>
          </button>

          {/* 3. NÚT GỬI DUYỆT (AC 1) */}
          <button
            type="submit"
            data-testid="btn-submit-offer"
            disabled={isFormSubmitting || isFormSavingDraft || !!activeOfferConflict?.hasActiveOffer}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 ring-2 ring-emerald-500/20 active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            <span>
              {isFormSubmitting
                ? 'Đang Gửi Duyệt...'
                : 'Gửi Duyệt Đề Nghị (Submit)'}
            </span>
          </button>
        </div>
      </form>

      {/* MODAL XEM TRƯỚC THƯ OFFER (AC 1) */}
      {isPreviewModalOpen && previewContentData && (
        <OfferPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          previewContent={previewContentData}
          onConfirmSubmit={handleSubmit(handleFormSubmit)}
          isSubmitting={isFormSubmitting}
        />
      )}
    </div>
  );
};
