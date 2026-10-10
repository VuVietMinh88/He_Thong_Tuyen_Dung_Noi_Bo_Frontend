import React, { useState } from "react";
import { PauseCircle, CheckSquare, XOctagon, X, Loader2, AlertTriangle } from "lucide-react";
import { jobReqStatusService } from "../../services/jobReqStatusService";

type ActionType = "PAUSED" | "CLOSED" | "CANCELLED" | null;

export interface JobReqStatusActionsUIProps {
  jobRequisitionId: string | number;
  onSuccess?: () => void;
}

export const JobReqStatusActionsUI: React.FC<JobReqStatusActionsUIProps> = ({
  jobRequisitionId,
  onSuccess,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [reason, setReason] = useState("");
  
  const [checkingAction, setCheckingAction] = useState<ActionType>(null);
  const [activeCandidatesCount, setActiveCandidatesCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleOpenAction = async (type: ActionType) => {
    setCheckingAction(type);
    setApiError(null);
    try {
      const data = await jobReqStatusService.getActiveCandidatesCount(jobRequisitionId);
      setActiveCandidatesCount(data.count || 0);
      setActionType(type);
      setReason("");
      setIsOpen(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Không thể kiểm tra số lượng ứng viên.");
    } finally {
      setCheckingAction(null);
    }
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    setActionType(null);
    setActiveCandidatesCount(0);
  };

  const handleConfirm = async () => {
    if (!actionType) return;
    
    setIsSubmitting(true);
    setApiError(null);
    try {
      await jobReqStatusService.updateStatus(jobRequisitionId, {
        status: actionType,
        reason: reason.trim() || undefined,
      });
      alert(`Đã cập nhật trạng thái thành công!`);
      if (onSuccess) onSuccess();
      handleCloseModal();
    } catch (err: any) {
      setApiError(err?.response?.data?.message || "Đã có lỗi xảy ra khi cập nhật trạng thái.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModalConfig = () => {
    switch (actionType) {
      case "PAUSED":
        return {
          title: "Xác nhận tạm dừng yêu cầu",
          description: "Yêu cầu tuyển dụng này sẽ tạm thời không nhận thêm ứng viên. Bạn có thể mở lại sau.",
          buttonColor: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-100 shadow-amber-500/20",
          iconBg: "bg-amber-100 text-amber-600",
          icon: <PauseCircle className="h-5 w-5" />,
          actionLabel: "Tạm dừng",
        };
      case "CLOSED":
        return {
          title: "Xác nhận đóng yêu cầu",
          description: "Đóng yêu cầu khi đã tuyển đủ người hoặc không còn nhu cầu. Việc mở lại sẽ cần duyệt lại.",
          buttonColor: "bg-slate-700 hover:bg-slate-800 focus:ring-slate-100 shadow-slate-700/20",
          iconBg: "bg-slate-200 text-slate-700",
          icon: <CheckSquare className="h-5 w-5" />,
          actionLabel: "Đóng yêu cầu",
        };
      case "CANCELLED":
        return {
          title: "Xác nhận hủy bỏ yêu cầu",
          description: "Hủy bỏ yêu cầu tuyển dụng này. Hành động này không thể hoàn tác.",
          buttonColor: "bg-rose-600 hover:bg-rose-700 focus:ring-rose-100 shadow-rose-600/20",
          iconBg: "bg-rose-100 text-rose-600",
          icon: <XOctagon className="h-5 w-5" />,
          actionLabel: "Hủy bỏ",
        };
      default:
        return null;
    }
  };

  const config = getModalConfig();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Quản lý trạng thái yêu cầu</h2>
          <p className="mt-1 text-sm text-slate-500">
            Thay đổi trạng thái của yêu cầu tuyển dụng này.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleOpenAction("PAUSED")}
            disabled={checkingAction !== null}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 hover:border-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-50 disabled:opacity-50"
          >
            {checkingAction === "PAUSED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PauseCircle className="h-4 w-4" />}
            Tạm dừng
          </button>

          <button
            onClick={() => handleOpenAction("CLOSED")}
            disabled={checkingAction !== null}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-50"
          >
            {checkingAction === "CLOSED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
            Đóng
          </button>

          <button
            onClick={() => handleOpenAction("CANCELLED")}
            disabled={checkingAction !== null}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 hover:border-rose-300 focus:outline-none focus:ring-4 focus:ring-rose-50 disabled:opacity-50"
          >
            {checkingAction === "CANCELLED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XOctagon className="h-4 w-4" />}
            Hủy bỏ
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isOpen && config && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-opacity"
          onClick={handleCloseModal}
        >
          <div 
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.iconBg}`}>
                  {config.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{config.title}</h3>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {apiError && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  <p className="font-medium">Lỗi: {apiError}</p>
                </div>
              )}

              <p className="mb-6 text-sm text-slate-600">{config.description}</p>

              {activeCandidatesCount > 0 && (
                <div className="mb-6 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-bold">Cảnh báo quan trọng!</p>
                    <p className="mt-1 text-sm">
                      Hiện đang có <strong>{activeCandidatesCount} ứng viên</strong> trong quy trình tuyển dụng. 
                      Bạn có chắc chắn muốn tiếp tục hành động này không?
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Lý do <span className="font-normal text-slate-400">(Tùy chọn)</span>
                </label>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Nhập lý do thay đổi trạng thái (nếu có)..."
                  className="w-full resize-none rounded-xl border border-slate-300 p-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-5">
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all focus:outline-none focus:ring-4 disabled:opacity-50 ${config.buttonColor}`}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {config.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobReqStatusActionsUI;
