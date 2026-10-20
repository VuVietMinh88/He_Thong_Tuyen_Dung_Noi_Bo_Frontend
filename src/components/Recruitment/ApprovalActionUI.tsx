import React, { useState } from "react";
import { CheckCircle, Edit3, X, Loader2 } from "lucide-react";
import { approvalActionService, type ApprovalActionPayload } from "../../services/approvalActionService";

type ActionType = "APPROVE" | "REQUEST_REVISION" | null;

export interface ApprovalActionUIProps {
  requestId: string | number;
  onSuccess?: () => void;
}

export const ApprovalActionUI: React.FC<ApprovalActionUIProps> = ({ requestId, onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [comment, setComment] = useState("");
  const [expectedRevision, setExpectedRevision] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleOpenModal = (type: ActionType) => {
    setActionType(type);
    setComment("");
    setExpectedRevision("");
    setApiError(null);
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    setActionType(null);
    setExpectedRevision("");
  };

  const handleConfirm = async () => {
    if (!actionType || comment.trim() === "") return;
    if (actionType === "REQUEST_REVISION" && expectedRevision.trim() === "") return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const payload: ApprovalActionPayload = {
        action: actionType,
        comment: comment.trim(),
        expectedRevision: actionType === "REQUEST_REVISION" ? expectedRevision.trim() : undefined,
      };
      await approvalActionService.submitAction(requestId, payload);
      alert(`Đã thực hiện: ${actionType === "APPROVE" ? "Phê duyệt" : "Yêu cầu chỉnh sửa"} thành công!`);
      if (onSuccess) onSuccess();
      handleCloseModal();
    } catch (error: any) {
      setApiError(error?.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    comment.trim() !== "" &&
    (actionType === "APPROVE" || (actionType === "REQUEST_REVISION" && expectedRevision.trim() !== ""));

  return (
    <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Thao tác phê duyệt</h2>
          <p className="mt-1 text-sm text-slate-500">
            Vui lòng xem xét kỹ thông tin trước khi đưa ra quyết định.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleOpenModal("REQUEST_REVISION")}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-200 bg-white px-5 py-2.5 text-sm font-semibold text-amber-700 transition-all hover:border-amber-300 hover:bg-amber-50 focus:outline-none focus:ring-4 focus:ring-amber-50"
          >
            <Edit3 className="h-5 w-5" />
            Yêu cầu chỉnh sửa
          </button>
          
          <button
            onClick={() => handleOpenModal("APPROVE")}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-emerald-100"
          >
            <CheckCircle className="h-5 w-5" />
            Đồng ý phê duyệt
          </button>
        </div>
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-lg scale-100 rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                {actionType === "APPROVE" ? "Xác nhận phê duyệt yêu cầu" : "Yêu cầu chỉnh sửa form tuyển dụng"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {apiError && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
                <p className="font-medium">Lỗi: {apiError}</p>
              </div>
            )}

            <div className="space-y-5 mb-8">
              {actionType === "REQUEST_REVISION" && (
                <div>
                  <label htmlFor="expectedRevision" className="mb-2 block text-sm font-semibold text-slate-700">
                    Nội dung yêu cầu chỉnh sửa (expectedRevision) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="expectedRevision"
                    rows={3}
                    value={expectedRevision}
                    onChange={(e) => setExpectedRevision(e.target.value)}
                    placeholder="Mô tả cụ thể những nội dung, thông số cần được điều chỉnh lại trong form tuyển dụng..."
                    disabled={isSubmitting}
                    className={`w-full resize-none rounded-xl border p-4 text-sm outline-none transition focus:ring-2 ${
                      expectedRevision.trim() === ""
                        ? "border-amber-300 bg-amber-50/20 text-slate-900 focus:border-amber-500 focus:ring-amber-100"
                        : "border-slate-300 bg-white text-slate-900 focus:border-indigo-500 focus:ring-indigo-100"
                    }`}
                  />
                  {expectedRevision.trim() === "" && (
                    <p className="mt-1.5 text-xs font-medium text-amber-700">
                      Vui lòng nêu rõ các điểm cần chỉnh sửa trước khi gửi.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="comment" className="mb-2 block text-sm font-semibold text-slate-700">
                  Nhận xét / Ghi chú <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="comment"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Vui lòng nhập nhận xét hoặc giải thích chi tiết..."
                  disabled={isSubmitting}
                  className={`w-full resize-none rounded-xl border p-4 text-sm outline-none transition focus:ring-2 ${
                    comment.trim() === "" 
                      ? "border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-200" 
                      : "border-slate-300 bg-white text-slate-900 focus:border-indigo-500 focus:ring-indigo-100"
                  }`}
                />
                {comment.trim() === "" && (
                  <p className="mt-1.5 text-xs font-medium text-rose-500">
                    Vui lòng nhập nhận xét trước khi xác nhận.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isFormValid || isSubmitting}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  actionType === "APPROVE"
                    ? "bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700 focus:ring-emerald-100"
                    : "bg-amber-600 shadow-amber-600/20 hover:bg-amber-700 focus:ring-amber-100"
                }`}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {actionType === "APPROVE" ? "Xác nhận duyệt" : "Gửi yêu cầu chỉnh sửa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalActionUI;
