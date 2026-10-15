import React, { useEffect } from 'react';
import { X, Award } from 'lucide-react';
import {
  InterviewEvaluationForm,
  type InterviewEvaluationFormProps,
} from './InterviewEvaluationForm';

export interface InterviewEvaluationModalProps extends InterviewEvaluationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal hiển thị Phiếu đánh giá năng lực phỏng vấn
 * Hỗ trợ mở từ danh sách lịch phỏng vấn cá nhân hoặc chi tiết hồ sơ ứng viên
 */
export const InterviewEvaluationModal: React.FC<InterviewEvaluationModalProps> = ({
  isOpen,
  onClose,
  ...formProps
}) => {
  // Lắng nghe sự kiện bàn phím ESC để đóng modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-evaluation-title"
      data-testid="interview-evaluation-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      {/* Lớp nền mờ backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Nội dung cửa sổ Modal */}
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl transition-all border border-slate-200">
        {/* Thanh tiêu đề Modal */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="modal-evaluation-title"
                className="text-base sm:text-lg font-bold text-slate-900"
              >
                Đánh giá năng lực phỏng vấn
              </h2>
              <p className="text-xs text-slate-500">
                Ứng viên: <strong className="text-slate-700">{formProps.candidateName}</strong> • {formProps.jobTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nội dung form */}
        <div className="p-4 sm:p-6">
          <InterviewEvaluationForm
            {...formProps}
            onCancel={formProps.onCancel || onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default InterviewEvaluationModal;
