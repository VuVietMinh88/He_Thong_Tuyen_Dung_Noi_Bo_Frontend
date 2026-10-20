import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, MessageSquare, X, Edit3 } from 'lucide-react';

export type ApprovalModalMode = 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';

export interface JobPostingApprovalModalProps {
  isOpen: boolean;
  mode: ApprovalModalMode;
  jobTitle: string;
  isSubmitting?: boolean;
  onConfirm: (reasonOrNote: string, expectedRevision?: string) => void;
  onClose: () => void;
}

const PRESET_REASONS = {
  REJECT: [
    'Vị trí tuyển dụng đã tạm dừng hoặc không còn nhu cầu',
    'Mức lương vượt quá khung ngân sách cho phép',
    'Chưa được phê duyệt kế hoạch định biên nhân sự',
    'Yêu cầu tuyển dụng đã có tin đăng tương đương đang chạy',
  ],
  REQUEST_REVISION: [
    'Mô tả công việc (JD) cần bổ sung chi tiết trách nhiệm chính',
    'Yêu cầu ứng viên quá cao so với cấp bậc tuyển dụng',
    'Cần làm rõ quyền lợi và chế độ đãi ngộ cụ thể',
    'Hạn nộp hồ sơ quá ngắn, đề xuất gia hạn thêm',
    'Cần điều chỉnh từ ngữ chuyên nghiệp và chuẩn văn phong tuyển dụng',
  ],
  APPROVE: [
    'Nội dung đã được kiểm duyệt và chuẩn hóa',
    'Đồng ý xuất bản đồng thời trên cổng nội bộ và Career Page',
  ],
};

export const JobPostingApprovalModal: React.FC<JobPostingApprovalModalProps> = ({
  isOpen,
  mode,
  jobTitle,
  isSubmitting = false,
  onConfirm,
  onClose,
}) => {
  const [comment, setComment] = useState('');
  const [expectedRevision, setExpectedRevision] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isReject = mode === 'REJECT';
  const isRevision = mode === 'REQUEST_REVISION';
  const isApprove = mode === 'APPROVE';

  const modalTitle = isApprove
    ? 'Duyệt & Xuất bản tin tuyển dụng'
    : isReject
    ? 'Từ chối tin tuyển dụng'
    : 'Yêu cầu chỉnh sửa tin tuyển dụng';

  const modalDescription = isApprove
    ? 'Tin tuyển dụng sẽ được xuất bản công khai và gửi thông báo tới các ứng viên tiềm năng.'
    : isReject
    ? 'Vui lòng nêu rõ lý do từ chối để thông báo lại cho chuyên viên tuyển dụng nắm thông tin.'
    : 'Nhập nội dung cần chỉnh sửa (expectedRevision) để người soạn thảo cập nhật lại tin tuyển dụng theo chuẩn.';

  const handleApplyPreset = (reason: string) => {
    if (isRevision) {
      setExpectedRevision((prev) => (prev ? `${prev}\n- ${reason}` : `- ${reason}`));
    } else {
      setComment((prev) => (prev ? `${prev}\n- ${reason}` : `- ${reason}`));
    }
    setError('');
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedComment = comment.trim();
    const trimmedRevision = expectedRevision.trim();

    if (isRevision) {
      if (!trimmedRevision && !trimmedComment) {
        setError('Vui lòng nhập nội dung yêu cầu chỉnh sửa (expectedRevision).');
        return;
      }
      const mainContent = trimmedRevision || trimmedComment;
      if (mainContent.length < 5) {
        setError('Nội dung yêu cầu chỉnh sửa cần cụ thể hơn (tối thiểu 5 ký tự).');
        return;
      }
      setError('');
      onConfirm(trimmedComment || mainContent, mainContent);
      return;
    }

    if (isReject && !trimmedComment) {
      setError('Vui lòng nhập lý do từ chối tin tuyển dụng.');
      return;
    }

    if (isReject && trimmedComment.length < 5) {
      setError('Lý do từ chối cần cụ thể hơn (tối thiểu 5 ký tự).');
      return;
    }

    setError('');
    onConfirm(trimmedComment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 transition-all">
        {/* Header */}
        <div
          className={`flex items-start justify-between border-b p-5 ${
            isApprove
              ? 'border-emerald-100 bg-emerald-50/70'
              : isReject
              ? 'border-rose-100 bg-rose-50/70'
              : 'border-amber-100 bg-amber-50/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs ${
                isApprove
                  ? 'bg-emerald-600'
                  : isReject
                  ? 'bg-rose-600'
                  : 'bg-amber-600'
              }`}
            >
              {isApprove ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : isReject ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <Edit3 className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{modalTitle}</h3>
              <p className="text-xs text-slate-500 line-clamp-1">{jobTitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/80 hover:text-slate-600"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">{modalDescription}</p>

          {/* Preset Suggestions */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {isApprove ? 'Ghi chú gợi ý (Tùy chọn)' : 'Gợi ý nội dung chỉnh sửa (Bấm để thêm nhanh):'}
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESET_REASONS[mode].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors text-left"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Ô nhập expectedRevision nếu là yêu cầu chỉnh sửa */}
          {isRevision && (
            <div>
              <label
                htmlFor="expected-revision-input"
                className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Edit3 className="h-3.5 w-3.5 text-amber-600" />
                  Nội dung yêu cầu chỉnh sửa (expectedRevision)
                  <span className="text-rose-500 font-bold">*</span>
                </span>
                <span className="text-[10px] font-normal text-slate-400">
                  {expectedRevision.length} ký tự
                </span>
              </label>

              <textarea
                id="expected-revision-input"
                rows={3}
                value={expectedRevision}
                onChange={(e) => {
                  setExpectedRevision(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Mô tả cụ thể những nội dung, tiêu chí cần người soạn thảo sửa lại..."
                className={`w-full rounded-xl border p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden transition-all ${
                  error
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 ring-1 ring-rose-200'
                    : 'border-amber-300 bg-amber-50/20 focus:border-amber-500 focus:ring-1 focus:ring-amber-200'
                }`}
              />
            </div>
          )}

          {/* Comment / Reason Input */}
          <div>
            <label
              htmlFor="approval-comment-input"
              className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                {isApprove
                  ? 'Ghi chú phê duyệt (Không bắt buộc)'
                  : isRevision
                  ? 'Ghi chú thêm cho người soạn thảo (Tùy chọn)'
                  : 'Lý do từ chối'}
                {isReject && <span className="text-rose-500 font-bold">*</span>}
              </span>
              <span className="text-[10px] font-normal text-slate-400">
                {comment.length} ký tự
              </span>
            </label>

            <textarea
              id="approval-comment-input"
              rows={isRevision ? 2 : 4}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (error) setError('');
              }}
              placeholder={
                isApprove
                  ? 'Nhập ghi chú hoặc lời dặn dò bổ sung (nếu có)...'
                  : isRevision
                  ? 'Ghi chú thêm (deadline chỉnh sửa, liên hệ hỗ trợ...)...'
                  : 'Nêu rõ lý do từ chối để thông báo tới người soạn tin...'
              }
              className={`w-full rounded-xl border p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden transition-all ${
                error && !isRevision
                  ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 ring-1 ring-rose-200'
                  : 'border-slate-300 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200'
              }`}
            />

            {error && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rose-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs transition-all disabled:opacity-50 ${
                isApprove
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
                  : isReject
                  ? 'bg-rose-600 hover:bg-rose-700 active:scale-98'
                  : 'bg-amber-600 hover:bg-amber-700 active:scale-98'
              }`}
            >
              {isSubmitting && (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              <span>
                {isApprove
                  ? 'Xác nhận duyệt'
                  : isReject
                  ? 'Xác nhận từ chối'
                  : 'Gửi yêu cầu chỉnh sửa'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobPostingApprovalModal;
