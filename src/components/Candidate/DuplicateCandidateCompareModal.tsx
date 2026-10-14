import React, { useState } from 'react';
import {
  X,
  GitMerge,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Briefcase,
  FileText,
  Tag,
  MessageSquare,
  ShieldCheck,
  Building2,
  Loader2,
  Check,
} from 'lucide-react';
import type {
  DuplicateCandidateComparison,
  MergeFieldSelection,
  CandidateDataSource,
} from '../../types/duplicateCandidate';
import type { UnifiedCandidate } from '../../types/candidate';
import { CANDIDATE_STAGE_CONFIG } from '../../types/candidate';
import { candidateMergeService } from '../../services/candidateMergeService';

interface DuplicateCandidateCompareModalProps {
  comparison: DuplicateCandidateComparison;
  isOpen: boolean;
  onClose: () => void;
  onMergeSuccess: (mergedCandidate: UnifiedCandidate) => void;
}

export const DuplicateCandidateCompareModal: React.FC<DuplicateCandidateCompareModalProps> = ({
  comparison,
  isOpen,
  onClose,
  onMergeSuccess,
}) => {
  const { primaryCandidate, duplicateCandidate, matchReason, matchValue } = comparison;

  // Trạng thái chọn giá trị cho từng trường (Mặc định chọn 'primary' hoặc 'duplicate' nếu trường bên primary rỗng)
  const [selections, setSelections] = useState<MergeFieldSelection>({
    fullName: 'primary',
    email: 'primary',
    phone: 'primary',
    currentTitle: primaryCandidate.currentTitle ? 'primary' : 'duplicate',
    experienceYears: 'primary',
    coverLetter: 'primary',
    rating: primaryCandidate.rating >= duplicateCandidate.rating ? 'primary' : 'duplicate',
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'primary' | 'duplicate'>('primary');

  if (!isOpen) return null;

  const formatDateVN = (dateString: string): string => {
    return candidateMergeService.formatVietnamDateTime(dateString);
  };

  const handleSelectField = (field: keyof MergeFieldSelection, source: CandidateDataSource) => {
    setSelections((prev) => ({ ...prev, [field]: source }));
  };

  const handleExecuteMerge = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      const { mergedCandidate } = await candidateMergeService.mergeCandidates({
        primaryCandidateId: primaryCandidate.id,
        duplicateCandidateId: duplicateCandidate.id,
        fieldSelections: selections,
      });
      setShowConfirmModal(false);
      onMergeSuccess(mergedCandidate);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi gộp hồ sơ ứng viên.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Danh sách các trường cần đối chiếu (AC 2: Diff Highlight)
  const comparisonFields: {
    key: keyof MergeFieldSelection;
    label: string;
    primaryVal: string | number;
    dupVal: string | number;
    isDiff: boolean;
  }[] = [
    {
      key: 'fullName',
      label: 'Họ và tên',
      primaryVal: primaryCandidate.fullName,
      dupVal: duplicateCandidate.fullName,
      isDiff: primaryCandidate.fullName.trim() !== duplicateCandidate.fullName.trim(),
    },
    {
      key: 'email',
      label: 'Email liên hệ',
      primaryVal: primaryCandidate.email,
      dupVal: duplicateCandidate.email,
      isDiff: primaryCandidate.email.toLowerCase() !== duplicateCandidate.email.toLowerCase(),
    },
    {
      key: 'phone',
      label: 'Số điện thoại',
      primaryVal: primaryCandidate.phone,
      dupVal: duplicateCandidate.phone,
      isDiff:
        primaryCandidate.phone.replace(/\s+/g, '') !== duplicateCandidate.phone.replace(/\s+/g, ''),
    },
    {
      key: 'currentTitle',
      label: 'Chức danh hiện tại',
      primaryVal: primaryCandidate.currentTitle || 'Chưa cập nhật',
      dupVal: duplicateCandidate.currentTitle || 'Chưa cập nhật',
      isDiff: (primaryCandidate.currentTitle || '') !== (duplicateCandidate.currentTitle || ''),
    },
    {
      key: 'experienceYears',
      label: 'Số năm kinh nghiệm',
      primaryVal: `${primaryCandidate.experienceYears || 0} năm`,
      dupVal: `${duplicateCandidate.experienceYears || 0} năm`,
      isDiff: primaryCandidate.experienceYears !== duplicateCandidate.experienceYears,
    },
    {
      key: 'rating',
      label: 'Đánh giá năng lực (Rating)',
      primaryVal: `${primaryCandidate.rating} / 5 sao`,
      dupVal: `${duplicateCandidate.rating} / 5 sao`,
      isDiff: primaryCandidate.rating !== duplicateCandidate.rating,
    },
    {
      key: 'coverLetter',
      label: 'Thư giới thiệu / Ghi chú ứng tuyển',
      primaryVal: primaryCandidate.coverLetter || 'Không có',
      dupVal: duplicateCandidate.coverLetter || 'Không có',
      isDiff: (primaryCandidate.coverLetter || '') !== (duplicateCandidate.coverLetter || ''),
    },
  ];

  // Danh sách toàn bộ các đợt ứng tuyển sau khi gộp
  const allApplications = [...primaryCandidate.applications, ...duplicateCandidate.applications].sort(
    (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-2xs">
              <GitMerge className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                So sánh & Gộp hồ sơ ứng viên trùng khớp
              </h2>
              <p className="text-xs text-slate-500">
                Phát hiện trùng {matchReason === 'BOTH' ? 'Email & Số điện thoại' : matchReason}:{' '}
                <strong className="text-amber-700 font-mono">{matchValue}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
            title="Đóng modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Tab Switcher (< 768px) */}
        <div className="md:hidden flex border-b border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMobileTab('primary')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mobileTab === 'primary' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Hồ sơ gốc ({primaryCandidate.candidateCode})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('duplicate')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mobileTab === 'duplicate' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Hồ sơ trùng ({duplicateCandidate.candidateCode})
          </button>
        </div>

        {/* Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Hướng dẫn Recruiter */}
          <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-bold text-amber-950">Quy tắc gộp hồ sơ thông minh:</strong>
              <p className="leading-relaxed text-amber-800">
                Các trường có điểm khác biệt được tô viền màu vàng cam. Hãy click chọn nút tròn (Radio)
                ở bên cột bạn muốn giữ lại giá trị làm thông tin chuẩn.
                <strong> Toàn bộ lịch sử các lần ứng tuyển, tệp CV, Nhãn (Tags) và Ghi chú nội bộ của cả hai hồ sơ sẽ được giữ lại 100%.</strong>
              </p>
            </div>
          </div>

          {/* Bảng so sánh 2 cột (AC 2: Side-by-Side Comparison & Diff Highlight) */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Header Cột */}
            <div className="grid grid-cols-12 bg-slate-100 text-xs font-bold text-slate-700 border-b border-slate-200 p-3">
              <div className="col-span-12 md:col-span-4 text-slate-500 uppercase tracking-wider text-[11px]">
                Trường thông tin
              </div>
              <div
                className={`col-span-12 md:col-span-4 flex items-center justify-between text-indigo-900 ${
                  mobileTab === 'duplicate' ? 'hidden md:flex' : 'flex'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-600" />
                  Hồ sơ gốc ({primaryCandidate.candidateCode})
                </span>
                <span className="text-[10px] font-normal px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                  Đang mở
                </span>
              </div>
              <div
                className={`col-span-12 md:col-span-4 flex items-center justify-between text-amber-900 ${
                  mobileTab === 'primary' ? 'hidden md:flex' : 'flex'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Hồ sơ mới trùng ({duplicateCandidate.candidateCode})
                </span>
                <span className="text-[10px] font-normal px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                  Cần gộp
                </span>
              </div>
            </div>

            {/* Danh sách từng dòng thông tin đối chiếu */}
            <div className="divide-y divide-slate-100">
              {comparisonFields.map((field) => {
                const isSelectedPrimary = selections[field.key] === 'primary';
                const isSelectedDup = selections[field.key] === 'duplicate';

                return (
                  <div
                    key={field.key}
                    className={`grid grid-cols-12 p-3.5 transition-colors items-center gap-3 ${
                      field.isDiff ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Tên trường */}
                    <div className="col-span-12 md:col-span-4 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{field.label}</span>
                        {field.isDiff && (
                          <span className="rounded bg-amber-100 text-amber-800 px-1.5 py-0.2 text-[10px] font-bold">
                            Khác biệt
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cột Hồ sơ gốc (Primary) */}
                    <div
                      onClick={() => handleSelectField(field.key, 'primary')}
                      className={`col-span-12 md:col-span-4 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        mobileTab === 'duplicate' ? 'hidden md:block' : 'block'
                      } ${
                        isSelectedPrimary
                          ? 'border-indigo-500 bg-indigo-50/80 text-indigo-950 font-semibold ring-1 ring-indigo-300'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="leading-relaxed break-words">{field.primaryVal}</span>
                        <div
                          className={`h-4 w-4 shrink-0 rounded-full border flex items-center justify-center transition ${
                            isSelectedPrimary
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelectedPrimary && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>

                    {/* Cột Hồ sơ mới trùng (Duplicate) */}
                    <div
                      onClick={() => handleSelectField(field.key, 'duplicate')}
                      className={`col-span-12 md:col-span-4 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        mobileTab === 'primary' ? 'hidden md:block' : 'block'
                      } ${
                        isSelectedDup
                          ? 'border-amber-500 bg-amber-50 text-amber-950 font-semibold ring-1 ring-amber-300'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="leading-relaxed break-words">{field.dupVal}</span>
                        <div
                          className={`h-4 w-4 shrink-0 rounded-full border flex items-center justify-center transition ${
                            isSelectedDup
                              ? 'border-amber-600 bg-amber-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelectedDup && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AC 3: Xem trước kết quả sau khi gộp & Lịch sử các đợt ứng tuyển */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-indigo-600" />
                Xem trước kết quả lịch sử ứng tuyển sau khi gộp ({allApplications.length} đợt)
              </h4>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Bảo toàn 100% dữ liệu
              </span>
            </div>

            <div className="space-y-2.5">
              {allApplications.map((app, index) => {
                const stageCfg = CANDIDATE_STAGE_CONFIG[app.stage];
                const isFromPrimary = primaryCandidate.applications.some((a) => a.id === app.id);

                return (
                  <div
                    key={app.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">{app.jobTitle}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          {app.jobCode}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${stageCfg.badgeClass}`}
                        >
                          {stageCfg.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {app.departmentName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Nộp: {formatDateVN(app.appliedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3 text-indigo-500" />
                          {app.cvFileName}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          isFromPrimary
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {isFromPrimary ? `Hồ sơ gốc (${index + 1})` : 'Hồ sơ mới gộp'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tóm tắt Nhãn & Ghi chú */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-indigo-600" />
                  Nhãn phân loại (Hợp nhất không trùng)
                </span>
                <p className="text-slate-500 text-[11px]">
                  Tổng cộng{' '}
                  <strong className="text-slate-800">
                    {new Set([...primaryCandidate.tags, ...duplicateCandidate.tags].map((t) => t.name.toLowerCase())).size}
                  </strong>{' '}
                  nhãn sẽ được giữ lại trên hồ sơ sau khi gộp.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                  Ghi chú nội bộ tuyển dụng
                </span>
                <p className="text-slate-500 text-[11px]">
                  Tổng cộng{' '}
                  <strong className="text-slate-800">
                    {primaryCandidate.notes.length + duplicateCandidate.notes.length}
                  </strong>{' '}
                  ghi chú sẽ được gộp theo dòng thời gian, bảo toàn thông tin người đánh giá.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions (AC 4) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <p className="text-[11px] text-slate-500">
            * Sau khi gộp, bạn có thể hoàn tác trong vòng <strong>24 giờ</strong> nếu có sai sót.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Bỏ qua / Giữ nguyên hai hồ sơ
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <GitMerge className="h-4 w-4" />
              <span>Xác nhận gộp hồ sơ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Step Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <GitMerge className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận hợp nhất hồ sơ?</h3>
                <p className="text-xs text-slate-500">Hành động này sẽ gộp 2 hồ sơ thành một</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Hồ sơ <strong className="text-slate-900">{duplicateCandidate.candidateCode}</strong> sẽ được hợp nhất vào{' '}
                <strong className="text-slate-900">{primaryCandidate.candidateCode}</strong>.
              </p>

              {/* Tóm tắt thông tin chính đã chọn giữ lại (AC 2) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs">
                <span className="font-bold text-slate-800 block mb-1">Tóm tắt thông tin chuẩn được giữ lại:</span>
                <div className="flex justify-between text-slate-600">
                  <span>Họ và tên:</span>
                  <strong className="text-slate-900">
                    {selections.fullName === 'primary' ? primaryCandidate.fullName : duplicateCandidate.fullName}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Email liên hệ:</span>
                  <strong className="text-slate-900 font-mono">
                    {selections.email === 'primary' ? primaryCandidate.email : duplicateCandidate.email}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Số điện thoại:</span>
                  <strong className="text-slate-900 font-mono">
                    {selections.phone === 'primary' ? primaryCandidate.phone : duplicateCandidate.phone}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Chức danh:</span>
                  <strong className="text-slate-900">
                    {selections.currentTitle === 'primary'
                      ? primaryCandidate.currentTitle || 'Mặc định'
                      : duplicateCandidate.currentTitle || 'Mặc định'}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Đánh giá sao:</span>
                  <strong className="text-amber-600 font-bold">
                    {selections.rating === 'primary' ? primaryCandidate.rating : duplicateCandidate.rating} / 5 sao
                  </strong>
                </div>
              </div>

              {/* Cam kết bảo toàn dữ liệu */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-2.5 text-xs text-emerald-900 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Bảo toàn 100%:</strong> Toàn bộ lịch sử các đợt ứng tuyển ({allApplications.length} đợt), tệp CV, Nhãn (Tags) và Ghi chú nội bộ của cả hai hồ sơ sẽ được tích hợp đầy đủ và có thể hoàn tác trong vòng <strong>24 giờ</strong>.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Kiểm tra lại
              </button>
              <button
                type="button"
                onClick={handleExecuteMerge}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Đồng ý gộp hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuplicateCandidateCompareModal;
