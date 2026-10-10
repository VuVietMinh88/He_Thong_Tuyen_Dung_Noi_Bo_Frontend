import React, { useEffect, useState } from "react";
import { approvalHistoryService, type ApprovalHistoryItem } from "../../services/approvalHistoryService";
import { CheckCircle2, XCircle, Clock, User, Loader2 } from "lucide-react";

export interface ApprovalHistoryTimelineProps {
  requestId: string | number;
}

export const ApprovalHistoryTimeline: React.FC<ApprovalHistoryTimelineProps> = ({ requestId }) => {
  const [history, setHistory] = useState<ApprovalHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await approvalHistoryService.getHistory(requestId);
        setHistory(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Không thể tải lịch sử phê duyệt.");
      } finally {
        setIsLoading(false);
      }
    };

    if (requestId) {
      fetchHistory();
    }
  }, [requestId]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status: ApprovalHistoryItem["status"]) => {
    switch (status) {
      case "APPROVED":
        return {
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          icon: <CheckCircle2 className="h-6 w-6 text-emerald-500 bg-white rounded-full" />,
          label: "Đã phê duyệt",
        };
      case "REJECTED":
        return {
          color: "text-rose-600",
          bg: "bg-rose-50",
          border: "border-rose-200",
          icon: <XCircle className="h-6 w-6 text-rose-500 bg-white rounded-full" />,
          label: "Đã từ chối",
        };
      case "PENDING":
      default:
        return {
          color: "text-slate-500",
          bg: "bg-slate-50",
          border: "border-slate-200",
          icon: <Clock className="h-6 w-6 text-slate-400 bg-white rounded-full" />,
          label: "Đang chờ duyệt",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-40 w-full max-w-4xl mx-auto items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
        <p className="font-medium text-rose-600">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
        <Clock className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm font-medium text-slate-500">Chưa có dữ liệu lịch sử phê duyệt.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="mb-8 text-xl font-bold text-slate-900">Lịch sử phê duyệt</h2>
      
      <div className="relative ml-2 border-l-2 border-slate-100 pl-8 sm:ml-4 sm:pl-10">
        {history.map((item, index) => {
          const config = getStatusConfig(item.status);
          
          return (
            <div key={index} className="mb-10 last:mb-0 relative">
              {/* Timeline dot/icon */}
              <div className="absolute -left-[45px] sm:-left-[53px] flex h-8 w-8 items-center justify-center bg-white">
                {config.icon}
              </div>

              {/* Content Card */}
              <div className={`rounded-xl border p-5 ${config.bg} ${config.border} transition-all hover:shadow-sm`}>
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-base font-bold text-slate-800">{item.stepName}</h3>
                  <span className={`inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider shadow-xs ${config.color}`}>
                    {config.label}
                  </span>
                </div>
                
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200/50">
                    <User className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  {item.approverName}
                </div>

                {item.comment && (
                  <div className="mb-4 rounded-lg bg-white/70 p-3 text-sm text-slate-700 shadow-xs ring-1 ring-slate-900/5">
                    <span className="font-semibold text-slate-800">Nhận xét:</span> {item.comment}
                  </div>
                )}

                {item.actionDate && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(item.actionDate)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApprovalHistoryTimeline;
