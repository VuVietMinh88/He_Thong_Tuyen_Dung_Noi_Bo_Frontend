import React from 'react';
import { X } from 'lucide-react';
import { OfferDraftForm } from './OfferDraftForm';
import type { OfferDraftFormProps } from '../../types/offer';

export interface OfferDraftModalProps extends OfferDraftFormProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal bao bọc biểu mẫu soạn thảo đề nghị tuyển dụng
 * Hỗ trợ hiển thị dạng cửa sổ nổi tiện dụng trên trang Quản lý ứng viên
 */
export const OfferDraftModal: React.FC<OfferDraftModalProps> = ({
  isOpen,
  onClose,
  onCancel,
  ...formProps
}) => {
  if (!isOpen) {
    return null;
  }

  const handleCancelModal = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <div
      data-testid="offer-draft-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 my-auto">
        {/* Nút đóng modal góc phải */}
        <button
          type="button"
          data-testid="btn-close-offer-modal"
          onClick={handleCancelModal}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <OfferDraftForm
          {...formProps}
          onCancel={handleCancelModal}
          containerClassName="border-0 shadow-none rounded-none"
        />
      </div>
    </div>
  );
};
