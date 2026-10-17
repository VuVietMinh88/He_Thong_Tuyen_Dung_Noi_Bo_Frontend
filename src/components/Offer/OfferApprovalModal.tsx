import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Send,
  Sparkles,
} from 'lucide-react';
import type { OfferApprovalActionType } from '../../types/offer';

export interface OfferApprovalModalProps {
  isOpen: boolean;
  actionMode: OfferApprovalActionType;
  offerCode: string;
  candidateName: string;
  jobTitle: string;
  isSubmitting?: boolean;
  onConfirm: (commentOrReason: string) => Promise<void> | void;
  onClose: () => void;
}

/**
 * Các mẫu ghi chú gợi ý sẵn cho cấp quản lý thao tác nhanh
 */
const PRESET_COMMENTS: Record<OfferApprovalActionType, string[]> = {
  APPROVE: [
    'Đồng ý phê duyệt mức lương và các chế độ đãi ngộ theo đề xuất.',
    'Thông qua đề xuất đặc cách mức lương do ứng viên có năng lực chuyên môn vượt trội.',
    'Chấp thuận điều kiện tuyển dụng, đồng ý chuyển bước tiếp theo.',
  ],
  REJECT: [
    'Mức lương đề xuất vượt quá khung ngân sách cho phép của phòng ban trong quý này.',
    'Kinh nghiệm thực tế của ứng viên chưa tương xứng với dải đãi ngộ đề xuất.',
    'Vị trí tuyển dụng tạm thời đóng hoặc thay đổi kế hoạch định biên nhân sự.',
  ],
  REQUEST_CHANGE: [
    'Đề xuất đàm phán lại mức lương cơ bản về cận trên dải lương chuẩn (tối đa 42.000.000 ₫).',
    'Cần tăng tỷ trọng phụ cấp hiệu quả công việc thay vì dồn toàn bộ vào lương cơ bản.',
    'Đề xuất kéo dài thời gian phản hồi offer thêm 3 ngày để ứng viên cân nhắc kỹ lưỡng.',
    'Cần bổ sung thêm cam kết thời gian gắn bó hoặc chi tiết bằng cấp/chứng chỉ của ứng viên.',
  ],
};

/**
 * Modal xác nhận thao tác phê duyệt, từ chối hoặc yêu cầu sửa đổi đề nghị tuyển dụng
 * Jira Subtask: TKNHTTDNB1-498 - Thiết kế màn hình phê duyệt offer (Story TKNHTTDNB1-72)
 */
export const OfferApprovalModal: React.FC<OfferApprovalModalProps> = ({
  isOpen,
  actionMode,
  offerCode,
  candidateName,
  jobTitle,
  isSubmitting = false,
  onConfirm,
  onClose,
}) => {
  const [commentText, setCommentText] = useState<string>(() =>
    actionMode === 'APPROVE' ? PRESET_COMMENTS.APPROVE[0] : ''
  );
  const [validationErrorMessage, setValidationErrorMessage] = useState<string>('');

  if (!isOpen) {
    return null;
  }

  // Cấu hình giao diện theo từng loại thao tác
  const modalConfiguration = {
    APPROVE: {
      title: 'Phê Duyệt Đề Nghị Tuyển Dụng',
      subtitle: 'Đồng ý thông qua điều kiện đãi ngộ và chuyển sang bước tiếp theo.',
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
      accentBg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
      headerBorder: 'border-emerald-100 dark:border-emerald-900/50',
      confirmButtonClass:
        'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 focus:ring-emerald-500/30',
      confirmButtonText: 'Xác Nhận Phê Duyệt',
      textareaPlaceholder: 'Nhập ý kiến đánh giá hoặc ghi chú phê duyệt (tùy chọn)...',
      isCommentRequired: false,
    },
    REJECT: {
      title: 'Từ Chối Đề Nghị Tuyển Dụng',
      subtitle: 'Hủy bỏ đề xuất offer này. Quá trình tuyển dụng cho offer này sẽ kết thúc.',
      icon: <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />,
      accentBg: 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
      headerBorder: 'border-rose-100 dark:border-rose-900/50',
      confirmButtonClass:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20 focus:ring-rose-500/30',
      confirmButtonText: 'Xác Nhận Từ Chối',
      textareaPlaceholder: 'Bắt buộc nhập lý do từ chối để phản hồi cho chuyên viên tuyển dụng...',
      isCommentRequired: true,
    },
    REQUEST_CHANGE: {
      title: 'Yêu Cầu Chỉnh Sửa Điều Khoản Offer',
      subtitle: 'Trả hồ sơ về cho Recruiter để điều chỉnh mức đãi ngộ hoặc các mốc thời gian.',
      icon: <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
      accentBg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
      headerBorder: 'border-amber-100 dark:border-amber-900/50',
      confirmButtonClass:
        'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20 focus:ring-amber-500/30',
      confirmButtonText: 'Gửi Yêu Cầu Sửa Đổi',
      textareaPlaceholder: 'Bắt buộc nhập các nội dung cần sửa đổi (mức lương, phụ cấp, deadline...)...',
      isCommentRequired: true,
    },
  }[actionMode];

  const handleSelectPresetComment = (presetText: string) => {
    setCommentText(presetText);
    setValidationErrorMessage('');
  };

  const handleFormSubmission = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();

    const trimmedComment = commentText.trim();
    if (modalConfiguration.isCommentRequired && trimmedComment.length < 5) {
      setValidationErrorMessage('Vui lòng nhập lý do/nội dung chi tiết tối thiểu 5 ký tự.');
      return;
    }

    setValidationErrorMessage('');
    await onConfirm(trimmedComment);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="offer-approval-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        data-testid="offer-approval-modal-card"
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
      >
        {/* Header Modal */}
        <div
          className={`flex items-start justify-between p-5 border-b ${modalConfiguration.headerBorder} bg-gradient-to-r from-gray-50/80 to-white dark:from-gray-800/40 dark:to-gray-900`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${modalConfiguration.accentBg} shadow-2xs`}>
              {modalConfiguration.icon}
            </div>
            <div>
              <h3
                data-testid="approval-modal-title"
                className="text-base font-bold text-gray-900 dark:text-white"
              >
                {modalConfiguration.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {modalConfiguration.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="btn-modal-close-icon"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 cursor-pointer disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thông tin vắn tắt offer đang xử lý */}
        <div className="px-5 py-3 bg-gray-50/60 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Ứng viên: </span>
            <strong className="text-gray-900 dark:text-white">{candidateName}</strong>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Vị trí: </span>
            <strong className="text-gray-900 dark:text-white">{jobTitle}</strong>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Mã offer: </span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {offerCode}
            </span>
          </div>
        </div>

        {/* Nội dung form nhập nhận xét / lý do */}
        <form onSubmit={handleFormSubmission} className="p-5 space-y-4">
          {/* Danh sách gợi ý mẫu */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Gợi ý nhận xét nhanh:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COMMENTS[actionMode].map((presetTextItem: string, presetIndex: number) => (
                <button
                  key={`preset-${presetIndex}`}
                  type="button"
                  data-testid={`btn-preset-reason-${presetIndex}`}
                  onClick={() => handleSelectPresetComment(presetTextItem)}
                  className={`text-[11px] text-left px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    commentText === presetTextItem
                      ? 'border-indigo-500 bg-indigo-50/80 text-indigo-800 font-semibold dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {presetTextItem}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea nhập ý kiến */}
          <div>
            <label
              htmlFor="approval-comment-textarea"
              className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1"
            >
              Ý kiến / Ghi chú của người phê duyệt{' '}
              {modalConfiguration.isCommentRequired && (
                <span className="text-rose-500">*</span>
              )}
            </label>
            <textarea
              id="approval-comment-textarea"
              rows={4}
              data-testid="textarea-approval-comment"
              value={commentText}
              onChange={(changeEvent) => {
                setCommentText(changeEvent.target.value);
                if (validationErrorMessage) {
                  setValidationErrorMessage('');
                }
              }}
              placeholder={modalConfiguration.textareaPlaceholder}
              className={`w-full rounded-xl border p-3 text-xs text-gray-900 shadow-2xs focus:outline-hidden focus:ring-2 dark:bg-gray-800 dark:text-white ${
                validationErrorMessage
                  ? 'border-rose-400 focus:ring-rose-500/20'
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-gray-700'
              }`}
            />
            {validationErrorMessage && (
              <p
                data-testid="error-modal-comment"
                className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium"
              >
                {validationErrorMessage}
              </p>
            )}
          </div>

          {/* Footer nút hành động */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              data-testid="btn-modal-cancel"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 cursor-pointer disabled:opacity-50"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              data-testid="btn-modal-confirm"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50 ${modalConfiguration.confirmButtonClass}`}
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Đang Xử Lý...' : modalConfiguration.confirmButtonText}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default OfferApprovalModal;
