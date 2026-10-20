import React, { useState, useId, useMemo } from 'react';
import {
  X,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building,
  Briefcase,
  Calendar,
  FileText,
  AlertCircle,
  Save,
  PlusCircle,
} from 'lucide-react';
import { useToast } from '../notifications/useToast';
import type {
  DepartmentTimeCostMetric,
  JobPositionTimeCostMetric,
  TimeCostReportData,
  UpdateRecruitmentCostPayload,
} from '../../types/timeCostReport';
import { formatCurrencyVND } from '../../types/timeCostReport';
import {
  recruitmentReportService,
  handleRecruitmentReportError,
} from '../../services/recruitmentReportService';

export interface RecruitmentCostInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedData: TimeCostReportData) => void;
  departments: DepartmentTimeCostMetric[];
  positions: JobPositionTimeCostMetric[];
  initialPositionId?: string;
  initialDepartmentId?: string;
}

interface CostFormProps {
  onClose: () => void;
  onSuccess: (updatedData: TimeCostReportData) => void;
  departments: DepartmentTimeCostMetric[];
  positions: JobPositionTimeCostMetric[];
  initialPositionId?: string;
  initialDepartmentId?: string;
}

const RecruitmentCostInputForm: React.FC<CostFormProps> = ({
  onClose,
  onSuccess,
  departments,
  positions,
  initialPositionId,
  initialDepartmentId,
}) => {
  const { addToast } = useToast();

  const deptSelectId = useId();
  const posSelectId = useId();
  const periodSelectId = useId();
  const postingFeeInputId = useId();
  const referralBonusInputId = useId();
  const notesInputId = useId();

  // Khởi tạo trạng thái ban đầu dựa trên props truyền vào
  const initialData = useMemo(() => {
    if (initialPositionId) {
      const foundPos = positions.find((p) => p.jobId === initialPositionId);
      if (foundPos) {
        const parentDept = departments.find((d) => d.departmentName === foundPos.departmentName);
        return {
          scope: 'POSITION' as const,
          deptId: parentDept?.departmentId || departments[0]?.departmentId || '',
          posId: foundPos.jobId,
          postingFees: foundPos.postingFees,
          referralBonuses: foundPos.referralBonuses,
        };
      }
    }

    if (initialDepartmentId) {
      const foundDept = departments.find((d) => d.departmentId === initialDepartmentId);
      if (foundDept) {
        return {
          scope: 'DEPARTMENT' as const,
          deptId: foundDept.departmentId,
          posId: '',
          postingFees: foundDept.totalPostingFees,
          referralBonuses: foundDept.totalReferralBonuses,
        };
      }
    }

    const firstPos = positions[0];
    const parentDept = firstPos
      ? departments.find((d) => d.departmentName === firstPos.departmentName)
      : departments[0];

    return {
      scope: 'POSITION' as const,
      deptId: parentDept?.departmentId || '',
      posId: firstPos?.jobId || '',
      postingFees: firstPos?.postingFees || 0,
      referralBonuses: firstPos?.referralBonuses || 0,
    };
  }, [initialPositionId, initialDepartmentId, positions, departments]);

  const [scope, setScope] = useState<'POSITION' | 'DEPARTMENT'>(initialData.scope);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialData.deptId);
  const [selectedPositionId, setSelectedPositionId] = useState<string>(initialData.posId);
  const [period, setPeriod] = useState<string>('Quý 4/2026');
  const [postingFees, setPostingFees] = useState<number>(initialData.postingFees);
  const [referralBonuses, setReferralBonuses] = useState<number>(initialData.referralBonuses);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lọc danh sách vị trí theo phòng ban đang chọn
  const filteredPositions = useMemo(() => {
    if (!selectedDeptId || selectedDeptId === 'ALL') return positions;
    const currentDept = departments.find((d) => d.departmentId === selectedDeptId);
    if (!currentDept) return positions;
    return positions.filter((p) => p.departmentName === currentDept.departmentName);
  }, [positions, departments, selectedDeptId]);

  // Khi thay đổi vị trí công việc -> Tự động điền chi phí hiện tại của vị trí đó
  const handlePositionChange = (posId: string) => {
    setSelectedPositionId(posId);
    setErrorMessage(null);
    const target = positions.find((p) => p.jobId === posId);
    if (target) {
      setPostingFees(target.postingFees);
      setReferralBonuses(target.referralBonuses);
      const parentDept = departments.find((d) => d.departmentName === target.departmentName);
      if (parentDept) setSelectedDeptId(parentDept.departmentId);
    }
  };

  // Khi thay đổi phòng ban
  const handleDepartmentChange = (deptId: string) => {
    setSelectedDeptId(deptId);
    setErrorMessage(null);
    if (scope === 'DEPARTMENT') {
      const dept = departments.find((d) => d.departmentId === deptId);
      if (dept) {
        setPostingFees(dept.totalPostingFees);
        setReferralBonuses(dept.totalReferralBonuses);
      }
    } else {
      const currentDept = departments.find((d) => d.departmentId === deptId);
      if (currentDept) {
        const firstMatchingPos = positions.find((p) => p.departmentName === currentDept.departmentName);
        if (firstMatchingPos) {
          setSelectedPositionId(firstMatchingPos.jobId);
          setPostingFees(firstMatchingPos.postingFees);
          setReferralBonuses(firstMatchingPos.referralBonuses);
        }
      }
    }
  };

  // Tính toán trước chi phí và so sánh chênh lệch
  const currentTargetPos = positions.find((p) => p.jobId === selectedPositionId);
  const currentTargetDept = departments.find((d) => d.departmentId === selectedDeptId);

  const newTotalCost = Math.max(0, postingFees) + Math.max(0, referralBonuses);
  const oldTotalCost =
    scope === 'POSITION'
      ? currentTargetPos?.totalCost ?? 0
      : currentTargetDept?.totalCost ?? 0;
  const costDiff = newTotalCost - oldTotalCost;

  const targetHiresCount =
    scope === 'POSITION'
      ? currentTargetPos?.hiredCount ?? 1
      : currentTargetDept?.hiredCount ?? 1;

  const newCostPerHire = targetHiresCount > 0 ? Math.round(newTotalCost / targetHiresCount) : newTotalCost;

  // Xử lý gửi form cập nhật chi phí
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (postingFees < 0 || referralBonuses < 0) {
      setErrorMessage('Chi phí quảng cáo và tiền thưởng không được mang giá trị âm.');
      return;
    }

    if (scope === 'POSITION' && !selectedPositionId) {
      setErrorMessage('Vui lòng chọn vị trí tuyển dụng cần cập nhật chi phí.');
      return;
    }

    if (scope === 'DEPARTMENT' && !selectedDeptId) {
      setErrorMessage('Vui lòng chọn khối / phòng ban cần cập nhật chi phí.');
      return;
    }

    const payload: UpdateRecruitmentCostPayload = {
      positionId: scope === 'POSITION' ? selectedPositionId : undefined,
      departmentId: scope === 'DEPARTMENT' ? selectedDeptId : undefined,
      period,
      postingFees,
      referralBonuses,
      notes: notes.trim() || undefined,
    };

    try {
      setIsSubmitting(true);
      const result = await recruitmentReportService.updateRecruitmentCost(payload);

      addToast({
        type: 'success',
        message: result.message || 'Cập nhật chi phí tuyển dụng thành công! Số liệu báo cáo đã được làm mới.',
      });

      onSuccess(result.data);
      onClose();
    } catch (err: unknown) {
      const apiErr = handleRecruitmentReportError(
        err,
        'Không thể cập nhật chi phí tuyển dụng. Vui lòng kiểm tra lại.',
      );
      setErrorMessage(apiErr.message);
      addToast({
        type: 'error',
        message: apiErr.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden transform transition-all"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cost-modal-title"
    >
      {/* Header Modal */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 id="cost-modal-title" className="text-base sm:text-lg font-bold text-slate-900">
              Nhập &amp; Cập nhật chi phí tuyển dụng
            </h3>
            <p className="text-xs text-slate-500">
              Cập nhật chi phí quảng cáo tin và thưởng giới thiệu để làm mới chỉ số Cost-per-hire
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
          aria-label="Đóng cửa sổ"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nội dung Form */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        {errorMessage && (
          <div
            data-testid="cost-modal-error"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Chọn phạm vi: Theo vị trí hay Theo phòng ban */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-700">Phạm vi cập nhật:</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setScope('POSITION')}
              className={`py-2 px-3 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                scope === 'POSITION'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs font-bold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Theo Vị trí / Chức danh</span>
            </button>
            <button
              type="button"
              onClick={() => setScope('DEPARTMENT')}
              className={`py-2 px-3 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                scope === 'DEPARTMENT'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs font-bold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Theo Khối / Phòng ban</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Khối / Phòng ban */}
          <div className="space-y-1">
            <label htmlFor={deptSelectId} className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>Khối / Phòng ban:</span>
            </label>
            <select
              id={deptSelectId}
              value={selectedDeptId}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-medium outline-none focus:border-indigo-500 cursor-pointer"
            >
              {departments.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.departmentName}
                </option>
              ))}
            </select>
          </div>

          {/* Vị trí tuyển dụng (nếu chọn theo vị trí) */}
          {scope === 'POSITION' ? (
            <div className="space-y-1">
              <label htmlFor={posSelectId} className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                <span>Vị trí công việc:</span>
              </label>
              <select
                id={posSelectId}
                value={selectedPositionId}
                onChange={(e) => handlePositionChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-medium outline-none focus:border-indigo-500 cursor-pointer"
              >
                {filteredPositions.map((pos) => (
                  <option key={pos.jobId} value={pos.jobId}>
                    {pos.jobTitle} ({pos.hiredCount} đã tuyển)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1">
              <label htmlFor={periodSelectId} className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Kỳ ghi nhận chi phí:</span>
              </label>
              <select
                id={periodSelectId}
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-medium outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Quý 4/2026">Quý 4/2026</option>
                <option value="Tháng 10/2026">Tháng 10/2026</option>
                <option value="Tháng 09/2026">Tháng 09/2026</option>
                <option value="Cả năm 2026">Cả năm 2026</option>
              </select>
            </div>
          )}
        </div>

        {/* Ô nhập Chi phí quảng cáo / đăng tin */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor={postingFeeInputId} className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
              <span>Phí đăng tin &amp; Quảng cáo (Job Posting Fees):</span>
            </label>
            <span className="text-xs font-extrabold text-indigo-700">
              {formatCurrencyVND(postingFees || 0)}
            </span>
          </div>
          <div className="relative">
            <input
              id={postingFeeInputId}
              type="number"
              min={0}
              step={500000}
              value={postingFees || ''}
              onChange={(e) => setPostingFees(Math.max(0, Number(e.target.value)))}
              placeholder="Ví dụ: 15000000"
              className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-indigo-200 bg-white text-slate-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
            <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-semibold pointer-events-none">
              VNĐ
            </span>
          </div>
          {/* Quick add buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-indigo-600 font-medium flex items-center gap-1">
              <PlusCircle className="w-3 h-3" /> Nhanh:
            </span>
            {[5000000, 10000000, 20000000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setPostingFees((prev) => prev + amt)}
                className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100/60 font-semibold transition cursor-pointer"
              >
                +{formatCurrencyVND(amt)}
              </button>
            ))}
          </div>
        </div>

        {/* Ô nhập Chi phí thưởng giới thiệu nội bộ */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor={referralBonusInputId} className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span>Thưởng giới thiệu nhân sự (Referral Bonuses):</span>
            </label>
            <span className="text-xs font-extrabold text-emerald-700">
              {formatCurrencyVND(referralBonuses || 0)}
            </span>
          </div>
          <div className="relative">
            <input
              id={referralBonusInputId}
              type="number"
              min={0}
              step={500000}
              value={referralBonuses || ''}
              onChange={(e) => setReferralBonuses(Math.max(0, Number(e.target.value)))}
              placeholder="Ví dụ: 10000000"
              className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-emerald-200 bg-white text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
            <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-semibold pointer-events-none">
              VNĐ
            </span>
          </div>
          {/* Quick add buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <PlusCircle className="w-3 h-3" /> Nhanh:
            </span>
            {[2000000, 5000000, 10000000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setReferralBonuses((prev) => prev + amt)}
                className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100/60 font-semibold transition cursor-pointer"
              >
                +{formatCurrencyVND(amt)}
              </button>
            ))}
          </div>
        </div>

        {/* Hộp xem trước tác động chi phí (Live Impact Preview - AC 2) */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
            Xem trước tác động chi phí (Live Preview):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Tổng chi phí mới</span>
              <strong className="text-slate-900 font-extrabold">{formatCurrencyVND(newTotalCost)}</strong>
            </div>

            <div className="p-2 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Cost-per-hire mới</span>
              <strong className="text-indigo-900 font-extrabold">{formatCurrencyVND(newCostPerHire)}</strong>
            </div>

            <div className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Chênh lệch</span>
              <div className="flex items-center gap-1 font-bold">
                {costDiff > 0 ? (
                  <span className="text-rose-600 flex items-center text-[11px]">
                    <TrendingUp className="w-3 h-3" /> +{formatCurrencyVND(costDiff)}
                  </span>
                ) : costDiff < 0 ? (
                  <span className="text-emerald-600 flex items-center text-[11px]">
                    <TrendingDown className="w-3 h-3" /> {formatCurrencyVND(costDiff)}
                  </span>
                ) : (
                  <span className="text-slate-500 text-[11px]">Không đổi</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ghi chú phát sinh */}
        <div className="space-y-1">
          <label htmlFor={notesInputId} className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Ghi chú / Đợt thanh toán (Tùy chọn):</span>
          </label>
          <input
            id={notesInputId}
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="VD: Quyết toán gói tin TopCV tháng 10 & thưởng referral bạn Nguyễn Văn A"
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 outline-none focus:border-indigo-500"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu &amp; Cập nhật báo cáo</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * Modal Nhập & Cập nhật chi phí tuyển dụng (Job Posting Fees & Referral Bonuses)
 * Jira Task: TKNHTTDNB1-572 / TKNHTTDNB1-84 (User Story S8-08)
 */
export const RecruitmentCostInputModal: React.FC<RecruitmentCostInputModalProps> = ({
  isOpen,
  ...props
}) => {
  if (!isOpen) return null;

  return (
    <div
      data-testid="recruitment-cost-input-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <RecruitmentCostInputForm {...props} />
    </div>
  );
};

