import React, { useState, useMemo, useEffect, useContext, useId } from 'react';
import {
  X,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  Search,
  Filter,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckSquare,
  Square,
  Info,
  Sparkles,
  Lock,
  Unlock,
  AlertCircle,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { ToastContext } from '../notifications/ToastContext';
import bulkRejectionService from '../../services/bulkRejectionService';
import {
  DEFAULT_REJECTION_TEMPLATES,
  STANDARDIZED_REJECTION_REASONS,
  type BulkRejectionCandidateItem,
  type RejectionEmailTemplate,
  type StoredSentRejectionRecord,
  type BulkRejectionBatchResult,
  type BulkRejectionItemResult,
  type SendBulkRejectionCandidateParam,
  type SendBulkRejectionPayload,
  getStoredSentRejections,
  checkIsDuplicateRejection,
  renderPersonalizedTemplate,
} from '../../types/bulkRejection';

export interface BulkRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: BulkRejectionCandidateItem[];
  companyName?: string;
  recruiterName?: string;
  initialBatchResult?: BulkRejectionBatchResult | null;
  onSuccess?: (rejectedCount: number, candidateIds: string[]) => void;
  className?: string;
}

export const BulkRejectionModal: React.FC<BulkRejectionModalProps> = ({
  isOpen,
  onClose,
  candidates = [],
  companyName = 'Hệ thống Tuyển dụng Thông minh',
  recruiterName = 'Ban Tuyển dụng',
  initialBatchResult = null,
  onSuccess,
  className = '',
}) => {
  const toastContext = useContext(ToastContext);
  const searchInputId = useId();
  const reasonSelectId = useId();
  const customReasonInputId = useId();
  const overrideReasonInputId = useId();

  // Helper hiển thị thông báo Toast an toàn
  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    if (toastContext?.addToast) {
      toastContext.addToast({ type, message });
    }
  };

  // Tab hiển thị: Split View hoặc Tab trên Mobile (AC 2)
  const [activeTab, setActiveTab] = useState<'SELECTION' | 'PREVIEW'>('SELECTION');

  // Bộ lọc giai đoạn / nhóm trạng thái (AC 1)
  const [selectedStageFilter, setSelectedStageFilter] = useState<'ALL' | 'SCREENING' | 'INTERVIEWING' | 'NEW'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Mẫu thư được chọn (AC 2)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_REJECTION_TEMPLATES[0].id);

  // Tiêu đề & nội dung tùy biến
  const [customSubject, setCustomSubject] = useState<string>(
    () => DEFAULT_REJECTION_TEMPLATES[0].defaultSubject,
  );
  const [customBody, setCustomBody] = useState<string>(
    () => DEFAULT_REJECTION_TEMPLATES[0].defaultBody,
  );
  const [selectedReason, setSelectedReason] = useState<string>(STANDARDIZED_REJECTION_REASONS[0]);
  const [otherReason, setOtherReason] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('');

  // Cơ chế ngoại lệ cho phép gửi lại thư trùng (AC 3)
  const [allowDuplicateRejection, setAllowDuplicateRejection] = useState<boolean>(false);
  const [overrideReason, setOverrideReason] = useState<string>('');

  // Chỉ số ứng viên đang xem trước (AC 2)
  const [previewCandidateIndex, setPreviewCandidateIndex] = useState<number>(0);

  // Trạng thái gửi thư & Tiến trình gửi (AC 1 & AC 2)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [sendProgress, setSendProgress] = useState<{ current: number; total: number } | null>(null);

  // Kết quả sau khi gửi thư từ chối hàng loạt (AC 1 & AC 2)
  const [batchResult, setBatchResult] = useState<BulkRejectionBatchResult | null>(
    () => initialBatchResult ?? null,
  );
  const [resultTabFilter, setResultTabFilter] = useState<'ALL' | 'SUCCESS' | 'SKIPPED' | 'FAILED'>('ALL');
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<BulkRejectionItemResult | null>(null);

  // Đọc danh sách đã gửi từ LocalStorage để kiểm tra duplicate
  const [storedRejections, setStoredRejections] = useState<StoredSentRejectionRecord[]>(() =>
    getStoredSentRejections(),
  );

  // Đánh dấu thông tin duplicate cho từng ứng viên
  const candidatesWithDuplicateStatus = useMemo(() => {
    return candidates.map((c) => {
      const dup = checkIsDuplicateRejection(c, storedRejections);
      return {
        ...c,
        isDuplicate: dup.isDuplicate,
        duplicateSentAt: dup.sentAt,
        duplicateReason: dup.reason,
      };
    });
  }, [candidates, storedRejections]);

  // Danh sách ID ứng viên được chọn gửi thư (AC 1 & AC 3)
  // Mặc định: Chỉ chọn các ứng viên KHÔNG bị trùng lặp
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Record<string, boolean>>(() => {
    const initialMap: Record<string, boolean> = {};
    candidates.forEach((c) => {
      const dup = checkIsDuplicateRejection(c);
      if (!dup.isDuplicate) {
        initialMap[c.id] = true;
      }
    });
    return initialMap;
  });

  // Chọn template mới
  const handleSelectTemplate = (tpl: RejectionEmailTemplate) => {
    setSelectedTemplateId(tpl.id);
    setCustomSubject(tpl.defaultSubject);
    setCustomBody(tpl.defaultBody);
  };

  // Đóng bằng phím ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Lọc danh sách ứng viên hiển thị theo bộ lọc giai đoạn & từ khóa (AC 1)
  const filteredCandidates = useMemo(() => {
    return candidatesWithDuplicateStatus.filter((c) => {
      // Lọc theo nhóm giai đoạn
      if (selectedStageFilter !== 'ALL') {
        if (selectedStageFilter === 'SCREENING' && c.currentStage !== 'SCREENING') return false;
        if (selectedStageFilter === 'INTERVIEWING' && c.currentStage !== 'INTERVIEWING') return false;
        if (selectedStageFilter === 'NEW' && c.currentStage !== 'NEW') return false;
      }

      // Lọc theo từ khóa tìm kiếm
      if (searchKeyword.trim()) {
        const lower = searchKeyword.toLowerCase().trim();
        const matchName = c.fullName.toLowerCase().includes(lower);
        const matchEmail = c.email.toLowerCase().includes(lower);
        const matchJob = c.appliedJobTitle?.toLowerCase().includes(lower) ?? false;
        const matchDept = c.departmentName?.toLowerCase().includes(lower) ?? false;
        if (!matchName && !matchEmail && !matchJob && !matchDept) return false;
      }

      return true;
    });
  }, [candidatesWithDuplicateStatus, selectedStageFilter, searchKeyword]);

  // Thống kê tóm tắt (AC 1 & AC 3)
  const stats = useMemo(() => {
    const total = candidatesWithDuplicateStatus.length;
    const duplicateCount = candidatesWithDuplicateStatus.filter((c) => c.isDuplicate).length;
    const eligibleCount = total - duplicateCount;
    const currentlySelectedCount = Object.keys(selectedCandidateIds).filter(
      (id) => selectedCandidateIds[id],
    ).length;

    return {
      total,
      eligibleCount,
      duplicateCount,
      currentlySelectedCount,
    };
  }, [candidatesWithDuplicateStatus, selectedCandidateIds]);

  // Danh sách các ứng viên đang được chọn thực tế
  const selectedCandidatesList = useMemo(() => {
    return candidatesWithDuplicateStatus.filter((c) => selectedCandidateIds[c.id]);
  }, [candidatesWithDuplicateStatus, selectedCandidateIds]);

  // Đảm bảo chỉ số previewCandidateIndex luôn hợp lệ
  const safePreviewIndex = Math.min(
    Math.max(0, previewCandidateIndex),
    Math.max(0, selectedCandidatesList.length - 1),
  );
  const currentPreviewCandidate = selectedCandidatesList[safePreviewIndex] || filteredCandidates[0];

  // Thao tác chọn / bỏ chọn một ứng viên (AC 1 & AC 3)
  const handleToggleCandidate = (candidate: (typeof candidatesWithDuplicateStatus)[0]) => {
    if (candidate.isDuplicate && !allowDuplicateRejection) {
      showToast(
        'warning',
        `Ứng viên ${candidate.fullName} đã nhận thư từ chối trước đó. Vui lòng bật "Cho phép gửi lại" nếu muốn gửi đè.`,
      );
      return;
    }

    setSelectedCandidateIds((prev) => ({
      ...prev,
      [candidate.id]: !prev[candidate.id],
    }));
  };

  // Chọn tất cả ứng viên hợp lệ trong danh sách lọc
  const handleSelectAllEligible = () => {
    const nextMap = { ...selectedCandidateIds };
    filteredCandidates.forEach((c) => {
      if (!c.isDuplicate || allowDuplicateRejection) {
        nextMap[c.id] = true;
      }
    });
    setSelectedCandidateIds(nextMap);
  };

  // Bỏ chọn tất cả trong danh sách lọc
  const handleDeselectAll = () => {
    const nextMap = { ...selectedCandidateIds };
    filteredCandidates.forEach((c) => {
      delete nextMap[c.id];
    });
    setSelectedCandidateIds(nextMap);
  };

  // Điều hướng xem trước ứng viên tiếp theo / trước đó (AC 2)
  const handlePrevPreview = () => {
    setPreviewCandidateIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextPreview = () => {
    setPreviewCandidateIndex((prev) =>
      Math.min(selectedCandidatesList.length - 1, prev + 1),
    );
  };

  // Lọc danh sách kết quả sau khi gửi theo Tab (AC 1 & AC 2)
  const displayedResultItems = useMemo(() => {
    if (!batchResult) return [];
    if (resultTabFilter === 'ALL') return batchResult.items;
    return batchResult.items.filter((item) => item.status === resultTabFilter);
  }, [batchResult, resultTabFilter]);

  // Đóng hoàn tất từ màn hình kết quả
  const handleFinishAndClose = () => {
    if (batchResult && onSuccess) {
      const successfulIds = batchResult.items
        .filter((item) => item.status === 'SUCCESS')
        .map((item) => item.candidateId);
      onSuccess(batchResult.successCount, successfulIds);
    }
    setBatchResult(null);
    setSendProgress(null);
    onClose();
  };

  // Quay lại form để gửi tiếp đợt khác
  const handleResetToForm = () => {
    setBatchResult(null);
    setSendProgress(null);
    setSelectedCandidateIds({});
  };

  // Thực hiện gửi thư từ chối hàng loạt (AC 1, AC 2 & AC 3)
  const handleConfirmBulkRejection = async () => {
    if (stats.currentlySelectedCount === 0) {
      showToast('warning', 'Vui lòng chọn ít nhất một ứng viên để gửi thư từ chối.');
      return;
    }

    // Kiểm tra nếu có ứng viên trùng lặp được chọn mà chưa nhập lý do ngoại lệ
    const selectedDuplicates = selectedCandidatesList.filter((c) => c.isDuplicate);
    if (selectedDuplicates.length > 0 && !overrideReason.trim()) {
      showToast(
        'error',
        'Có ứng viên đã từng nhận thư từ chối trong danh sách chọn. Bạn bắt buộc phải nhập "Lý do ghi đè ngoại lệ" để tiếp tục.',
      );
      return;
    }

    setIsSubmitting(true);
    setSendProgress({ current: 0, total: selectedCandidatesList.length });

    try {
      const finalReason = selectedReason === 'Lý do khác' ? otherReason.trim() : selectedReason;

      // Chuẩn bị danh sách tham số ứng viên kèm nội dung cá nhân hóa
      const candidatesParam: SendBulkRejectionCandidateParam[] = selectedCandidatesList.map((c) => {
        const itemSubject = renderPersonalizedTemplate(customSubject, c, companyName, recruiterName);
        const itemBody = renderPersonalizedTemplate(customBody, c, companyName, recruiterName, customNote);
        return {
          candidateId: c.id,
          applicationId: c.applicationId,
          candidateName: c.fullName,
          email: c.email,
          jobTitle: c.appliedJobTitle,
          departmentName: c.departmentName,
          customEmailSubject: itemSubject,
          customEmailBody: itemBody,
          isDuplicate: c.isDuplicate,
          previousSentAt: c.duplicateSentAt,
        };
      });

      const payload: SendBulkRejectionPayload = {
        batchTitle: `Đợt từ chối ứng viên - ${new Date().toLocaleDateString('vi-VN')}`,
        templateId: selectedTemplateId,
        reason: finalReason,
        customNote: customNote.trim() || undefined,
        allowDuplicateRejection,
        overrideReason: allowDuplicateRejection ? overrideReason.trim() : undefined,
        companyName,
        recruiterName,
        candidates: candidatesParam,
      };

      const result = await bulkRejectionService.sendBulkRejectionEmails(payload, (curr, tot) => {
        setSendProgress({ current: curr, total: tot });
      });

      // Cập nhật lại danh sách cache đã lưu trong local state
      setStoredRejections(getStoredSentRejections());
      setBatchResult(result);

      // Kích hoạt thông báo Global Toast Notification (AC 3)
      if (result.failedCount === 0 && result.skippedCount === 0) {
        showToast(
          'success',
          `Đã gửi thư từ chối hàng loạt thành công cho ${result.successCount} ứng viên.`,
        );
      } else if (result.failedCount === 0 && result.skippedCount > 0) {
        showToast(
          'info',
          `Đã gửi thư từ chối cho ${result.successCount} ứng viên (${result.skippedCount} ứng viên được bỏ qua do đã nhận thư trước đó).`,
        );
      } else {
        showToast(
          'warning',
          `Gửi thư hoàn tất: ${result.successCount} thành công, ${result.skippedCount} bị chặn, ${result.failedCount} gặp lỗi.`,
        );
      }
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : 'Không thể hoàn tất gửi thư từ chối. Vui lòng thử lại.';
      showToast('error', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Tính toán tiêu đề và nội dung xem trước thời gian thực
  const renderedSubject = currentPreviewCandidate
    ? renderPersonalizedTemplate(customSubject, currentPreviewCandidate, companyName, recruiterName)
    : customSubject;

  const renderedBody = currentPreviewCandidate
    ? renderPersonalizedTemplate(
        customBody,
        currentPreviewCandidate,
        companyName,
        recruiterName,
        customNote,
      )
    : customBody;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-rejection-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={!isSubmitting ? (batchResult ? handleFinishAndClose : onClose) : undefined}
        aria-hidden="true"
      />

      {/* Modal Dialog Container */}
      <div
        className={`relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto z-10 ${className}`}
      >
        {batchResult ? (
          /* ========================================================================= */
          /* MÀN HÌNH KẾT QUẢ CHI TIẾT TỪNG ỨNG VIÊN (RESULT SUMMARY VIEW - AC 1 & AC 2) */
          /* ========================================================================= */
          <>
            {/* 1. Header Bar Kết Quả */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white px-5 sm:px-6 py-4 shrink-0 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                  {batchResult.failedCount === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-300" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 id="bulk-rejection-title" className="text-base sm:text-lg font-bold tracking-tight truncate">
                      Kết quả gửi thư từ chối hàng loạt
                    </h2>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                      Đã hoàn tất xử lý
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 truncate mt-0.5">
                    {`Mã đợt gửi: #${batchResult.batchId} • ${new Date(batchResult.processedAt).toLocaleString('vi-VN')}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleFinishAndClose}
                  aria-label="Đóng kết quả"
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 2. Thống kê 4 thẻ tóm tắt số liệu (Summary Metrics) */}
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Thẻ 1: Tổng số xử lý */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Tổng số xử lý</span>
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-1">
                  {batchResult.totalProcessed}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5">ứng viên trong danh sách</span>
              </div>

              {/* Thẻ 2: Gửi thành công */}
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
                  <span>Đã gửi thành công</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-1">
                  {batchResult.successCount}
                </div>
                <span className="text-[11px] text-emerald-600 font-medium mt-0.5">Đã vào hòm thư ứng viên</span>
              </div>

              {/* Thẻ 3: Bị bỏ qua / Chặn trùng */}
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
                  <span>Đã bỏ qua / Chặn</span>
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-amber-800 mt-1">
                  {batchResult.skippedCount}
                </div>
                <span className="text-[11px] text-amber-700 font-medium mt-0.5">Đã nhận thư từ trước</span>
              </div>

              {/* Thẻ 4: Gặp lỗi */}
              <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-rose-700 text-xs font-semibold">
                  <span>Gặp lỗi hệ thống</span>
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-rose-700 mt-1">
                  {batchResult.failedCount}
                </div>
                <span className="text-[11px] text-rose-600 font-medium mt-0.5">Email sai hoặc lỗi server</span>
              </div>
            </div>

            {/* 3. Thanh Tab lọc trạng thái kết quả */}
            <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setResultTabFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    resultTabFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {`Tất cả (${batchResult.totalProcessed})`}
                </button>

                <button
                  type="button"
                  onClick={() => setResultTabFilter('SUCCESS')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                    resultTabFilter === 'SUCCESS'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {`Thành công (${batchResult.successCount})`}
                </button>

                <button
                  type="button"
                  onClick={() => setResultTabFilter('SKIPPED')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                    resultTabFilter === 'SKIPPED'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {`Bị chặn trùng (${batchResult.skippedCount})`}
                </button>

                <button
                  type="button"
                  onClick={() => setResultTabFilter('FAILED')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                    resultTabFilter === 'FAILED'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {`Gặp lỗi (${batchResult.failedCount})`}
                </button>
              </div>

              <div className="text-xs text-slate-500">
                {`Hiển thị ${displayedResultItems.length} kết quả`}
              </div>
            </div>

            {/* 4. Bảng danh sách chi tiết từng ứng viên */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-white">
              {displayedResultItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Không có ứng viên nào thuộc nhóm trạng thái này.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs divide-y divide-slate-200">
                      <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4">Ứng viên</th>
                          <th className="py-3 px-4">Vị trí / Bộ phận</th>
                          <th className="py-3 px-4">Trạng thái gửi</th>
                          <th className="py-3 px-4">Chi tiết phản hồi</th>
                          <th className="py-3 px-4 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {displayedResultItems.map((item) => (
                          <tr key={item.candidateId} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 min-w-[160px]">
                              <div className="font-bold text-slate-900">{item.candidateName}</div>
                              <div className="text-[11px] text-slate-500 truncate">{item.email}</div>
                            </td>

                            <td className="py-3 px-4 min-w-[140px] text-slate-700">
                              <div className="font-medium truncate">{item.jobTitle || 'Chưa cập nhật'}</div>
                              <div className="text-[11px] text-slate-400 truncate">{item.departmentName || '---'}</div>
                            </td>

                            <td className="py-3 px-4 min-w-[130px]">
                              {item.status === 'SUCCESS' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Đã gửi thành công
                                </span>
                              )}
                              {item.status === 'SKIPPED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  <ShieldAlert className="w-3 h-3 text-amber-600" />
                                  Đã bỏ qua (Chặn trùng)
                                </span>
                              )}
                              {item.status === 'FAILED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  <AlertCircle className="w-3 h-3 text-rose-600" />
                                  Gặp lỗi gửi thư
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 min-w-[200px] text-slate-600 text-[11px] leading-relaxed">
                              <div>{item.message}</div>
                              {item.previousRejectionDate && (
                                <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                                  {`Đã gửi trước đó vào: ${item.previousRejectionDate}`}
                                </div>
                              )}
                              {item.errorDetails && (
                                <div className="text-[10px] text-rose-600 font-mono mt-0.5">
                                  {`Lỗi: ${item.errorDetails}`}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4 text-center min-w-[90px]">
                              {item.emailBody ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedItemForDetail(item)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer"
                                  title="Xem lại nội dung thư đã gửi cho ứng viên này"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Xem thư</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[11px]">---</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Footer Actions Bar Kết quả */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {`Đã hoàn tất đợt gửi: ${batchResult.successCount} thành công, ${batchResult.skippedCount} bị chặn, ${batchResult.failedCount} gặp lỗi.`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToForm}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Gửi tiếp đợt khác</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinishAndClose}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Hoàn tất & Đóng</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ========================================================================= */
          /* MÀN HÌNH CHỌN ỨNG VIÊN VÀ XEM TRƯỚC (SELECTION & PREVIEW VIEW - AC 1 & 2)  */
          /* ========================================================================= */
          <>
            {/* 1. Header Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 text-white px-5 sm:px-6 py-4 shrink-0 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                  <Mail className="w-5 h-5 text-rose-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 id="bulk-rejection-title" className="text-base sm:text-lg font-bold tracking-tight truncate">
                      Gửi thư từ chối ứng viên hàng loạt
                    </h2>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/30">
                      <ShieldAlert className="w-3 h-3" /> Chặn gửi trùng lặp
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 truncate mt-0.5">
                    Xem trước nội dung cá nhân hóa và gửi phản hồi lịch sự, duy trì thiện cảm với ứng viên
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  aria-label="Đóng cửa sổ"
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Thanh tiến trình khi đang gửi (Progress Bar - AC 1 & AC 2) */}
            {isSubmitting && sendProgress && (
              <div className="px-5 py-2.5 bg-rose-50 border-b border-rose-200 shrink-0 space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-semibold text-rose-900">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                    <span>{`Đang gửi thư: ${sendProgress.current} / ${sendProgress.total} ứng viên...`}</span>
                  </span>
                  <span className="font-bold text-rose-700">
                    {`${Math.round((sendProgress.current / Math.max(1, sendProgress.total)) * 100)}%`}
                  </span>
                </div>
                <div className="w-full h-2 bg-rose-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.round((sendProgress.current / Math.max(1, sendProgress.total)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

        {/* 2. Quick Stat Badges Bar (AC 1 & AC 3) */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              <span>{`Tổng ứng viên: ${stats.total}`}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{`Hợp lệ: ${stats.eligibleCount}`}</span>
            </span>

            {stats.duplicateCount > 0 && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold"
                title="Các ứng viên đã từng nhận thư từ chối trước đó trên hệ thống"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>{`Đã từng nhận thư: ${stats.duplicateCount} (Chặn gửi trùng)`}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
              {`Đang chọn: ${stats.currentlySelectedCount} / ${stats.total}`}
            </span>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex md:hidden border-b border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('SELECTION')}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition ${
              activeTab === 'SELECTION'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500'
            }`}
          >
            1. Chọn ứng viên & Mẫu thư ({stats.currentlySelectedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PREVIEW')}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition ${
              activeTab === 'PREVIEW'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500'
            }`}
          >
            2. Xem trước thư cá nhân hóa
          </button>
        </div>

        {/* 3. Main Split View Content Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white">
          {/* CỘT TRÁI: CHỌN ỨNG VIÊN & CẤU HÌNH MẪU THƯ (AC 1 & AC 3) */}
          <div
            className={`md:col-span-6 flex flex-col overflow-y-auto p-4 sm:p-5 space-y-4 ${
              activeTab === 'PREVIEW' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Bộ lọc giai đoạn & Tìm kiếm ứng viên (AC 1) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-rose-600" />
                  Nhóm trạng thái ứng viên
                </span>

                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={handleSelectAllEligible}
                    className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                  >
                    Chọn tất cả hợp lệ
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'ALL', label: 'Tất cả nhóm' },
                  { id: 'SCREENING', label: 'Sàng lọc CV' },
                  { id: 'INTERVIEWING', label: 'Phỏng vấn' },
                  { id: 'NEW', label: 'Hồ sơ mới' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStageFilter(st.id as typeof selectedStageFilter)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      selectedStageFilter === st.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Ô tìm kiếm nhanh */}
              <div className="relative">
                <label htmlFor={searchInputId} className="sr-only">
                  Tìm kiếm ứng viên
                </label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  id={searchInputId}
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm theo tên, email, vị trí..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-200"
                />
              </div>
            </div>

            {/* Danh sách ứng viên có Checkbox & Cảnh báo Duplicate (AC 1 & AC 3) */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
              {filteredCandidates.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Không tìm thấy ứng viên nào phù hợp bộ lọc.
                </div>
              ) : (
                filteredCandidates.map((cand) => {
                  const isChecked = !!selectedCandidateIds[cand.id];
                  const isDisabled = cand.isDuplicate && !allowDuplicateRejection;

                  return (
                    <div
                      key={cand.id}
                      onClick={() => !isDisabled && handleToggleCandidate(cand)}
                      className={`flex items-start gap-2.5 p-2 rounded-xl border transition cursor-pointer ${
                        isDisabled
                          ? 'opacity-65 bg-slate-100 border-slate-200 cursor-not-allowed'
                          : isChecked
                          ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="pt-0.5">
                        <button
                          type="button"
                          disabled={isDisabled}
                          aria-label={`Chọn ứng viên ${cand.fullName}`}
                          className="text-slate-500 hover:text-slate-700 disabled:opacity-40"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-rose-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-slate-800 truncate">
                            {cand.fullName}
                          </span>
                          {cand.currentStage && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                              {cand.currentStage === 'SCREENING'
                                ? 'Sàng lọc'
                                : cand.currentStage === 'INTERVIEWING'
                                ? 'Phỏng vấn'
                                : cand.currentStage}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 truncate">{cand.email}</p>

                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="truncate">{cand.appliedJobTitle || 'Ứng viên'}</span>
                          {cand.departmentName && (
                            <>
                              <span>•</span>
                              <span className="truncate">{cand.departmentName}</span>
                            </>
                          )}
                        </div>

                        {/* Huy hiệu cảnh báo đã từng gửi thư từ chối (AC 3) */}
                        {cand.isDuplicate && (
                          <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold">
                            <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{`Đã nhận thư từ chối (${cand.duplicateSentAt})`}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Cơ chế ngoại lệ cho phép gửi lại (AC 3) */}
            {stats.duplicateCount > 0 && (
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-amber-900 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowDuplicateRejection}
                      onChange={(e) => setAllowDuplicateRejection(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                    />
                    <span>Cho phép gửi lại cho hồ sơ đã từng nhận thư (Ghi đè ngoại lệ)</span>
                  </label>
                  {allowDuplicateRejection ? (
                    <Unlock className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </div>

                {allowDuplicateRejection && (
                  <div className="space-y-1 pt-1 animate-in fade-in duration-150">
                    <label htmlFor={overrideReasonInputId} className="text-[11px] font-bold text-amber-800">
                      Lý do ghi đè bắt buộc *
                    </label>
                    <input
                      id={overrideReasonInputId}
                      type="text"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Ví dụ: Ứng viên nộp đợt mới, gửi lại theo yêu cầu bổ sung..."
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-amber-300 bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:border-amber-600"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Chọn Mẫu thư & Lý do từ chối chuẩn hóa (AC 2) */}
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                  Chọn mẫu thư từ chối chuẩn hóa
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DEFAULT_REJECTION_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                        selectedTemplateId === tpl.id
                          ? 'bg-rose-50 border-rose-400 text-rose-900 ring-1 ring-rose-200'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="font-bold text-xs block truncate">{tpl.name}</span>
                      <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {tpl.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lý do từ chối chính (Lưu vết hồ sơ) */}
              <div className="space-y-1">
                <label htmlFor={reasonSelectId} className="text-xs font-bold text-slate-700">
                  Lý do từ chối chính (Hồ sơ nội bộ)
                </label>
                <select
                  id={reasonSelectId}
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 outline-none focus:border-rose-500"
                >
                  {STANDARDIZED_REJECTION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {selectedReason === 'Lý do khác' && (
                <div className="space-y-1">
                  <label htmlFor={customReasonInputId} className="text-[11px] font-bold text-slate-600">
                    Chi tiết lý do khác *
                  </label>
                  <input
                    id={customReasonInputId}
                    type="text"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Nhập lý do chi tiết..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 outline-none focus:border-rose-500"
                  />
                </div>
              )}

              {/* Ghi chú thêm vào email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Lời nhắn bổ sung vào email (Tùy chọn)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Hiển thị ở cuối thư</span>
                </label>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  rows={2}
                  placeholder="Ví dụ: Lời chúc cụ thể hoặc lời mời giữ liên lạc trên LinkedIn..."
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 placeholder:text-slate-400 outline-none focus:border-rose-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: XEM TRƯỚC THƯ CÁ NHÂN HÓA THỜI GIAN THỰC (AC 2) */}
          <div
            className={`md:col-span-6 flex flex-col p-4 sm:p-5 space-y-3.5 bg-slate-50/70 ${
              activeTab === 'SELECTION' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-rose-600" />
                Xem trước thư cá nhân hóa (Preview)
              </span>

              {/* Bộ điều hướng ứng viên duyệt trước */}
              {selectedCandidatesList.length > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={handlePrevPreview}
                    disabled={safePreviewIndex === 0}
                    className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    title="Ứng viên trước"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-semibold text-slate-700 px-1">
                    {safePreviewIndex + 1}/{selectedCandidatesList.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextPreview}
                    disabled={safePreviewIndex >= selectedCandidatesList.length - 1}
                    className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    title="Ứng viên kế tiếp"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Email Preview Card */}
            {currentPreviewCandidate ? (
              <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Email Metadata Header */}
                <div className="p-3.5 bg-slate-100/70 border-b border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>
                      Người gửi: <strong>{recruiterName}</strong> &lt;tuyendung@company.com&gt;
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                      Email tự động
                    </span>
                  </div>

                  <div className="text-slate-700">
                    Người nhận:{' '}
                    <strong className="text-slate-900">{currentPreviewCandidate.fullName}</strong> &lt;
                    {currentPreviewCandidate.email}&gt;
                  </div>

                  <div className="pt-1">
                    <label className="text-[11px] font-bold text-slate-600 block mb-0.5">
                      Tiêu đề email (Cá nhân hóa):
                    </label>
                    <input
                      type="text"
                      value={renderedSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 outline-none focus:border-rose-500 font-medium"
                    />
                  </div>
                </div>

                {/* Email Body Content */}
                <div className="flex-1 p-4 overflow-y-auto font-sans text-xs text-slate-800 leading-relaxed space-y-3 whitespace-pre-wrap select-text bg-white">
                  {renderedBody}
                </div>

                {/* Email Footer Brand Info */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Hệ thống Tuyển Dụng Thông Minh • Mẫu thư chuẩn mực</span>
                  <span className="text-rose-600 font-medium">Dữ liệu cá nhân hóa tự động</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                <Mail className="w-8 h-8 text-slate-300 mb-2" />
                <p>Vui lòng chọn ít nhất một ứng viên để xem trước nội dung thư cá nhân hóa.</p>
              </div>
            )}

            {/* Variable Tag Hint */}
            <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                Các biến tự động thay thế theo từng ứng viên:
              </span>
              <p className="text-[10px] text-indigo-800 leading-normal">
                <code className="bg-white px-1 py-0.5 rounded border border-indigo-200">
                  {'{HO_TEN}'}
                </code>
                ,{' '}
                <code className="bg-white px-1 py-0.5 rounded border border-indigo-200">
                  {'{VI_TRI}'}
                </code>
                ,{' '}
                <code className="bg-white px-1 py-0.5 rounded border border-indigo-200">
                  {'{PHONG_BAN}'}
                </code>
                ,{' '}
                <code className="bg-white px-1 py-0.5 rounded border border-indigo-200">
                  {'{CONG_TY}'}
                </code>
                ,{' '}
                <code className="bg-white px-1 py-0.5 rounded border border-indigo-200">
                  {'{NGUOI_GUI}'}
                </code>
              </p>
            </div>
          </div>
        </div>

        {/* 4. Footer Actions Bar */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              {`Sẽ gửi thư từ chối tới ${stats.currentlySelectedCount} ứng viên đã chọn.`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleConfirmBulkRejection}
              disabled={isSubmitting || stats.currentlySelectedCount === 0}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang gửi thư...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{`Xác nhận gửi thư từ chối (${stats.currentlySelectedCount})`}</span>
                </>
              )}
            </button>
          </div>
        </div>
          </>
        )}
      </div>

      {/* POPUP CON: XEM LẠI CHI TIẾT BỨC THƯ ĐÃ GỬI CHO ỨNG VIÊN */}
      {selectedItemForDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
        >
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setSelectedItemForDetail(null)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-300" />
                <h3 className="font-bold text-sm">Chi tiết nội dung thư từ chối</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForDetail(null)}
                aria-label="Đóng popup thư"
                className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs space-y-1">
              <div>
                <span className="text-slate-500 font-semibold">Người nhận: </span>
                <strong className="text-slate-800">{selectedItemForDetail.candidateName}</strong>{' '}
                <span className="text-slate-500">&lt;{selectedItemForDetail.email}&gt;</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Tiêu đề: </span>
                <strong className="text-slate-900">
                  {selectedItemForDetail.emailSubject || 'Thông báo kết quả ứng tuyển'}
                </strong>
              </div>
            </div>

            <div className="p-4 overflow-y-auto text-xs text-slate-800 leading-relaxed whitespace-pre-wrap flex-1 bg-white">
              {selectedItemForDetail.emailBody || selectedItemForDetail.message}
            </div>

            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedItemForDetail(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkRejectionModal;
