import React from 'react';
import {
  X,
  Printer,
  Send,
  Building2,
  Calendar,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle2,
} from 'lucide-react';
import type { OfferPreviewContent } from '../../types/offer';

export interface OfferPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewContent: OfferPreviewContent;
  onConfirmSubmit?: () => Promise<void> | void;
  isSubmitting?: boolean;
}

/**
 * Modal hiển thị bản xem trước thư đề nghị tuyển dụng (Offer Letter Preview)
 * Cho phép nhà tuyển dụng kiểm tra toàn bộ câu từ, chế độ đãi ngộ và in thư trước khi gửi duyệt
 * Jira Task: TKNHTTDNB1-492 (Story TKNHTTDNB1-71)
 */
export const OfferPreviewModal: React.FC<OfferPreviewModalProps> = ({
  isOpen,
  onClose,
  previewContent,
  onConfirmSubmit,
  isSubmitting = false,
}) => {
  if (!isOpen) {
    return null;
  }

  const handlePrintOffer = () => {
    // Kích hoạt chức năng in trình duyệt để người dùng có thể lưu PDF hoặc in bản cứng
    window.print();
  };

  return (
    <div
      data-testid="offer-preview-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 my-auto overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-slate-50/80 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Xem Trước Thư Mời Nhận Việc (Offer Letter Preview)
                </h3>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  Bản xem trước
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Kiểm tra thông tin chi tiết thư đề nghị sẽ gửi tới ứng viên sau khi được phê duyệt.
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="btn-close-preview-modal"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Thân bức thư Offer (Giả lập trang văn bản A4 trang trọng) */}
        <div
          data-testid="offer-preview-letter-body"
          className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50 dark:bg-gray-950"
        >
          <div className="max-w-3xl mx-auto rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900 text-gray-800 dark:text-gray-200 space-y-6 print:shadow-none print:border-none print:p-0">
            {/* Tiêu đề & Thông tin đầu thư */}
            <div className="border-b-2 border-emerald-600 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-sm sm:text-base uppercase tracking-wider">
                    <Building2 className="h-5 w-5" />
                    <span>{previewContent.companyName}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                    {previewContent.companyAddress}
                  </p>
                </div>
                <div className="text-left sm:text-right text-xs text-gray-500 dark:text-gray-400">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {previewContent.letterReferenceNumber}
                  </p>
                  <p className="mt-0.5">Hà Nội, ngày {previewContent.issuedDateFormatted}</p>
                </div>
              </div>

              <div className="mt-6 text-center">
                <h1 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white uppercase tracking-wide">
                  {previewContent.letterTitle}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                  Về việc đề nghị tiếp nhận và tuyển dụng nhân sự chính thức
                </p>
              </div>
            </div>

            {/* Lời chào gửi ứng viên */}
            <div className="space-y-2 text-xs leading-relaxed">
              <p>
                <strong>Kính gửi:</strong>{' '}
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {previewContent.candidateName}
                </span>
                {previewContent.candidateCode && (
                  <span className="ml-1 text-gray-500">
                    (Mã ứng viên: {previewContent.candidateCode})
                  </span>
                )}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Email: {previewContent.candidateEmail} • Điện thoại:{' '}
                {previewContent.candidatePhoneNumber}
              </p>
              <p className="pt-2">
                Ban Giám Đốc và Phòng Nhân sự xin trân trọng chúc mừng Bạn đã xuất sắc hoàn thành các vòng phỏng vấn chuyên môn và đánh giá năng lực tại Công ty. Chúng tôi đánh giá rất cao năng lực cũng như sự phù hợp của Bạn đối với định hướng phát triển của đội ngũ chúng tôi.
              </p>
              <p>
                Chúng tôi trân trọng gửi tới Bạn lời mời gia nhập đội ngũ với các điều khoản đãi ngộ chi tiết như sau:
              </p>
            </div>

            {/* Khối chi tiết đãi ngộ & Chức danh */}
            <div className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/40 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                I. Vị Trí Công Tác & Chế Độ Đãi Ngộ
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Chức danh công việc:</span>
                  <p className="font-bold text-gray-900 dark:text-white mt-0.5">
                    {previewContent.jobTitle}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Phòng ban / Cấp bậc:</span>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                    {previewContent.departmentName} ({previewContent.jobLevel})
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Mức lương cơ bản:</span>
                  <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm mt-0.5">
                    {previewContent.offeredSalaryFormatted} / tháng
                  </p>
                  <p className="text-[11px] text-gray-500 italic">
                    (Bằng chữ: {previewContent.offeredSalaryInWords})
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Phụ cấp hàng tháng:</span>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mt-0.5">
                    {previewContent.allowanceAmountFormatted} / tháng
                  </p>
                  <p className="text-[11px] text-gray-500">{previewContent.allowanceDescription}</p>
                </div>
              </div>

              {/* Hộp tổng đãi ngộ */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Tổng thu nhập hàng tháng ước tính:
                </span>
                <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                  {previewContent.totalMonthlyCompensationFormatted}
                </span>
              </div>
            </div>

            {/* Cảnh báo dải lương chuẩn và lý do vượt khung (nếu có) */}
            {previewContent.isSalaryOutOfRange && previewContent.outOfRangeReason && (
              <div
                data-testid="preview-out-of-range-box"
                className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200 space-y-1"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>Ghi chú giải trình vượt dải lương chuẩn (Khung: {previewContent.standardSalaryRangeFormatted}):</span>
                </div>
                <p className="italic leading-relaxed pl-5">
                  "{previewContent.outOfRangeReason}"
                </p>
              </div>
            )}

            {/* Khối kế hoạch nhận việc và hạn phản hồi */}
            <div className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/40 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                II. Kế Hoạch Nhận Việc & Thời Hạn Phản Hồi
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <div>
                    <span className="text-gray-500">Ngày dự kiến bắt đầu làm việc:</span>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {previewContent.expectedStartDateFormatted}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <div>
                    <span className="text-gray-500">Hạn chót gửi phản hồi thư offer:</span>
                    <p className="font-bold text-rose-600 dark:text-rose-400">
                      {previewContent.responseDeadlineFormatted}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Điều khoản chung */}
            <div className="space-y-1 text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 pt-3 dark:border-gray-800">
              <p>
                • Thời gian thử việc là 02 tháng theo Bộ luật Lao động Việt Nam hiện hành.
              </p>
              <p>
                • Chế độ bảo hiểm y tế, BHXH và BHTN được đóng đầy đủ theo quy định của pháp luật và chính sách doanh nghiệp.
              </p>
              {previewContent.additionalNotes && (
                <p>• Ghi chú riêng: {previewContent.additionalNotes}</p>
              )}
            </div>

            {/* Chữ ký đại diện */}
            <div className="pt-6 grid grid-cols-2 gap-4 text-xs text-center border-t border-gray-200 dark:border-gray-800">
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-200">ĐẠI DIỆN ỨNG VIÊN</p>
                <p className="text-[11px] text-gray-400 italic mt-0.5">(Ký và ghi rõ họ tên)</p>
                <div className="h-16" />
                <p className="font-semibold">{previewContent.candidateName}</p>
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-200">
                  ĐẠI DIỆN CÔNG TY & PHÒNG NHÂN SỰ
                </p>
                <p className="text-[11px] text-gray-400 italic mt-0.5">(Ký duyệt và đóng dấu)</p>
                <div className="h-16" />
                <p className="font-semibold">Hội đồng Tuyển dụng & Quản trị Nhân tài</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Toolbar của Modal */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            data-testid="btn-back-to-edit"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay Lại Chỉnh Sửa</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="btn-print-offer"
              onClick={handlePrintOffer}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>In Thư (Print)</span>
            </button>

            {onConfirmSubmit && (
              <button
                type="button"
                data-testid="btn-confirm-submit-from-preview"
                disabled={isSubmitting}
                onClick={onConfirmSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 ring-2 ring-emerald-500/20 active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmitting ? 'Đang Gửi Duyệt...' : 'Xác Nhận Gửi Duyệt'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
