import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Clock,
  MapPin,
  Video,
  Users,
  Briefcase,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import type {
  InterviewConflictCheckResult,
  ConflictItemDetail,
} from '../../types/interview';

export interface InterviewConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflictResult: InterviewConflictCheckResult | null;
  onConfirmOverride: (reason: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

export const InterviewConflictModal: React.FC<InterviewConflictModalProps> = ({
  isOpen,
  onClose,
  conflictResult,
  onConfirmOverride,
  isSubmitting = false,
}) => {
  const [isOverrideConfirmed, setIsOverrideConfirmed] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [selectedConflictIndex, setSelectedConflictIndex] = useState(0);

  if (!isOpen || !conflictResult || !conflictResult.hasConflict) {
    return null;
  }

  const conflicts = conflictResult.conflicts || [];
  const proposed = conflictResult.proposedInterview;
  const currentConflict: ConflictItemDetail | undefined = conflicts[selectedConflictIndex] || conflicts[0];
  const conflictingInterview = currentConflict?.conflictingInterview;

  const isReasonValid = overrideReason.trim().length >= 5;
  const canSubmitOverride = isOverrideConfirmed && isReasonValid && !isSubmitting;

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitOverride) return;
    onConfirmOverride(overrideReason.trim());
  };

  const getConflictTypeBadge = (type?: string) => {
    switch (type) {
      case 'BOTH':
        return {
          label: 'Trùng cả Người phỏng vấn & Phòng họp',
          className: 'bg-rose-100 text-rose-800 border-rose-300',
        };
      case 'ROOM_CONFLICT':
        return {
          label: 'Trùng phòng họp (Phòng đã có lịch)',
          className: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 'INTERVIEWER_CONFLICT':
      default:
        return {
          label: 'Trùng lịch Người phỏng vấn',
          className: 'bg-rose-100 text-rose-800 border-rose-300',
        };
    }
  };

  const badgeInfo = getConflictTypeBadge(conflictResult.conflictType);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-modal-title"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header - Danger/Warning Theme */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-600 via-rose-700 to-amber-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="conflict-modal-title" className="text-lg sm:text-xl font-bold tracking-tight">
                  Cảnh báo xung đột lịch phỏng vấn
                </h2>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeInfo.className} bg-white/90 shadow-xs hidden sm:inline-block`}
                >
                  {badgeInfo.label}
                </span>
              </div>
              <p className="text-xs text-rose-100 mt-0.5">
                Phát hiện {conflicts.length} xung đột lịch trình trong khung giờ đã chọn. Lịch phỏng vấn bị chặn lưu theo quy tắc hệ thống.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-rose-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Blocking Error Alert Banner */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-800">
                Thao tác đặt lịch phỏng vấn đang bị chặn (Blocking Error)
              </p>
              <p className="text-rose-700 leading-relaxed text-xs">
                Để tránh tình trạng chồng chéo lịch trình của hội đồng tuyển dụng hoặc tranh chấp phòng họp, hệ thống tự động chặn lưu lịch trùng. Quý Recruiter có thể quay lại điều chỉnh khung giờ hoặc áp dụng cơ chế xác nhận ghi đè có lý do.
              </p>
            </div>
          </div>

          {/* Multiple conflicts tabs (if more than 1) */}
          {conflicts.length > 1 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">
                Danh sách chi tiết {conflicts.length} vị trí xung đột:
              </p>
              <div className="flex flex-wrap gap-2">
                {conflicts.map((c, idx) => (
                  <button
                    key={`${c.type}-${c.entityName}-${idx}`}
                    type="button"
                    onClick={() => setSelectedConflictIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                      selectedConflictIndex === idx
                        ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>{c.type === 'INTERVIEWER' ? 'Người phỏng vấn:' : 'Phòng họp:'}</span>
                    <strong>{c.entityName}</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Current Conflict Reason Highlight */}
          {currentConflict && (
            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Chi tiết xung đột: </span>
                <span>{currentConflict.reason}</span>
              </div>
            </div>
          )}

          {/* Side-by-Side Comparison: Proposed vs Conflicting */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                Đối chiếu thông tin hai buổi phỏng vấn
              </h3>
              <span className="text-[11px] text-slate-500">
                Khung giờ chồng lấn trong cùng ngày
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cột 1: Buổi phỏng vấn DỰ KIẾN (Proposed) */}
              <div className="bg-slate-50/80 rounded-xl border-2 border-indigo-200 p-4 space-y-3 relative">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    Buổi phỏng vấn dự kiến đặt
                  </span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                    Mới
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Ứng viên & Vị trí:</span>
                    <strong className="text-slate-900 text-sm font-bold block">
                      {proposed?.candidateName || 'Ứng viên hiện tại'}
                    </strong>
                    <span className="text-slate-600 flex items-center gap-1 mt-0.5">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      {proposed?.jobTitle || 'Vị trí ứng tuyển'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Vòng tuyển dụng:</span>
                    <span className="font-semibold text-slate-800">
                      {proposed?.roundName || 'Vòng phỏng vấn'}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-indigo-100 space-y-1">
                    <span className="text-slate-500 block text-[11px]">Khung giờ dự kiến:</span>
                    <div className="text-slate-900 font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{proposed?.startTime} - {proposed?.endTime}</span>
                      <span className="font-normal text-slate-500">
                        ({proposed?.durationMinutes} phút)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Ngày: <strong className="text-slate-800">{proposed?.interviewDate}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Hình thức & Địa điểm:</span>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 mt-0.5">
                      {proposed?.format === 'ONLINE' ? (
                        <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                          <Video className="w-3 h-3" /> Trực tuyến
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                          <MapPin className="w-3 h-3" /> Trực tiếp
                        </span>
                      )}
                      <span className="truncate text-xs font-mono text-slate-700" title={proposed?.locationOrLink}>
                        {proposed?.locationOrLink}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Hội đồng phỏng vấn:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {proposed?.interviewerNames && proposed.interviewerNames.length > 0 ? (
                        proposed.interviewerNames.map((name, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                              currentConflict?.type === 'INTERVIEWER' && currentConflict.entityName === name
                                ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold ring-1 ring-rose-400'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">Chưa chọn</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cột 2: Buổi phỏng vấn ĐANG BỊ XUNG ĐỘT (Conflicting) */}
              <div className="bg-rose-50/50 rounded-xl border-2 border-rose-300 p-4 space-y-3 relative">
                <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Buổi phỏng vấn đang bị xung đột
                  </span>
                  <span className="text-[10px] bg-rose-200 text-rose-900 font-bold px-2 py-0.5 rounded">
                    Đã có trên hệ thống
                  </span>
                </div>

                {conflictingInterview ? (
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Ứng viên & Vị trí:</span>
                      <strong className="text-rose-900 text-sm font-bold block">
                        {conflictingInterview.candidateName}
                      </strong>
                      <span className="text-slate-600 flex items-center gap-1 mt-0.5">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        {conflictingInterview.jobTitle}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Vòng tuyển dụng:</span>
                      <span className="font-semibold text-slate-800">
                        {conflictingInterview.roundName}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-rose-200 space-y-1">
                      <span className="text-slate-500 block text-[11px]">Khung giờ đã xếp:</span>
                      <div className="text-rose-700 font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-rose-600" />
                        <span>{conflictingInterview.startTime} - {conflictingInterview.endTime}</span>
                        <span className="font-normal text-slate-500">
                          ({conflictingInterview.durationMinutes} phút)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Ngày: <strong className="text-slate-800">{conflictingInterview.interviewDate}</strong>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Hình thức & Địa điểm:</span>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800 mt-0.5">
                        {conflictingInterview.format === 'ONLINE' ? (
                          <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                            <Video className="w-3 h-3" /> Trực tuyến
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                            <MapPin className="w-3 h-3" /> Trực tiếp
                          </span>
                        )}
                        <span
                          className={`truncate text-xs font-mono ${
                            currentConflict?.type === 'ROOM'
                              ? 'text-rose-700 font-bold bg-rose-100 px-1 rounded'
                              : 'text-slate-700'
                          }`}
                          title={conflictingInterview.locationOrLink}
                        >
                          {conflictingInterview.locationOrLink}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Người phỏng vấn tham gia:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {conflictingInterview.interviewerNames && conflictingInterview.interviewerNames.length > 0 ? (
                          conflictingInterview.interviewerNames.map((name, i) => (
                            <span
                              key={i}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                currentConflict?.type === 'INTERVIEWER' && currentConflict.entityName === name
                                  ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold ring-1 ring-rose-400'
                                  : 'bg-white text-slate-700 border-slate-200'
                              }`}
                            >
                              {name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">Không có thông tin</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Không tìm thấy thông tin chi tiết của buổi phỏng vấn xung đột.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Override Exception Section */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Cơ chế ngoại lệ: Xác nhận ghi đè lịch trùng (Override)
              </span>
            </div>

            <p className="text-xs text-amber-800 leading-relaxed">
              Nếu bạn đã thống nhất trước với Hội đồng phỏng vấn hoặc có sự đồng thuận đổi người hỗ trợ, bạn có thể ghi đè bằng cách tích chọn xác nhận và nhập lý do cụ thể.
            </p>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isOverrideConfirmed}
                  onChange={(e) => setIsOverrideConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  Tôi xác nhận vẫn muốn lên lịch phỏng vấn này và chịu trách nhiệm về xung đột lịch trình.
                </span>
              </label>
            </div>

            {/* Override Reason Field */}
            {isOverrideConfirmed && (
              <div className="space-y-1.5 pt-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Lý do ghi đè lịch phỏng vấn <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      overrideReason.trim().length >= 5 ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {overrideReason.trim().length}/5 ký tự tối thiểu
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Ví dụ: Đã thống nhất với anh Hải hoán đổi ca phỏng vấn; Đã xin phép sử dụng chung phòng họp Lotus..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-amber-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition"
                />
                {!isReasonValid && overrideReason.length > 0 && (
                  <p className="text-[11px] text-rose-600">
                    Lý do ghi đè phải có ít nhất 5 ký tự để lưu vào nhật ký kiểm toán hệ thống.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Khuyến nghị: Nên đổi khung giờ để đảm bảo trải nghiệm tốt nhất cho ứng viên.</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Nút quay lại chỉnh sửa (Primary recommended action for conflict) */}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              Quay lại chỉnh sửa thời gian
            </button>

            {/* Nút Ghi đè (Chỉ kích hoạt khi tích checkbox và nhập lý do >= 5 ký tự) */}
            <button
              type="button"
              onClick={handleOverrideSubmit}
              disabled={!canSubmitOverride}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition ${
                canSubmitOverride
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-70'
              }`}
            >
              <span>{isSubmitting ? 'Đang ghi đè...' : 'Xác nhận ghi đè & Lưu lịch'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewConflictModal;

