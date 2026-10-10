import React, { useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

type ActionType = "APPROVE" | "REJECT" | null;

export const ApprovalActionUI: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [comment, setComment] = useState("");

  const handleOpenModal = (type: ActionType) => {
    setActionType(type);
    setComment("");
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setActionType(null);
  };

  const handleConfirm = () => {
    console.log("Action:", actionType);
    console.log("Comment:", comment);
    alert(`Đã thực hiện: ${actionType === "APPROVE" ? "Phê duyệt" : "Từ chối"} thành công! (Xem Console)`);
    handleCloseModal();
  };

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
            onClick={() => handleOpenModal("REJECT")}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-rose-100 bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 transition-all hover:border-rose-200 hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-50"
          >
            <XCircle className="h-5 w-5" />
            Từ chối
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
                {actionType === "APPROVE" ? "Xác nhận phê duyệt yêu cầu" : "Xác nhận từ chối yêu cầu"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-8">
              <label htmlFor="comment" className="mb-2 block text-sm font-semibold text-slate-700">
                Nhận xét / Lý do <span className={actionType === "REJECT" ? "text-rose-500" : "text-slate-400"}>
                  {actionType === "REJECT" ? "*" : "(Không bắt buộc)"}
                </span>
              </label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Vui lòng nhập nhận xét của bạn..."
                className="w-full resize-none rounded-xl border border-slate-300 p-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button
                onClick={handleCloseModal}
                className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirm}
                disabled={actionType === "REJECT" && comment.trim() === ""}
                className={`inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all focus:outline-none focus:ring-4 ${
                  actionType === "APPROVE"
                    ? "bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700 focus:ring-emerald-100"
                    : "bg-rose-600 shadow-rose-600/20 hover:bg-rose-700 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-rose-600"
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalActionUI;
