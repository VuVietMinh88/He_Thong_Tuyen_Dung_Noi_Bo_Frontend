import React, { useState, useEffect } from "react";
import { X, Search, UserCircle2, Loader2, History, UserPlus, Clock } from "lucide-react";
import { recruiterAssignmentService, type AssignmentHistoryItem } from "../../services/recruiterAssignmentService";

export interface Recruiter {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

const mockRecruiters: Recruiter[] = [
  { id: "HR01", name: "Nguyễn Thị Phương", email: "phuong.nguyen@company.com" },
  { id: "HR02", name: "Trần Anh Tuấn", email: "tuan.tran@company.com", avatarUrl: "https://i.pravatar.cc/150?u=HR02" },
  { id: "HR03", name: "Lê Hoàng Phúc", email: "phuc.le@company.com" },
  { id: "HR04", name: "Phạm Thúy Vy", email: "vy.pham@company.com", avatarUrl: "https://i.pravatar.cc/150?u=HR04" },
];

export interface AssignRecruiterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignSuccess?: () => void;
  jobRequisitionId: string | number;
  jobRequisitionTitle?: string;
}

export const AssignRecruiterModal: React.FC<AssignRecruiterModalProps> = ({
  isOpen,
  onClose,
  onAssignSuccess,
  jobRequisitionId,
  jobRequisitionTitle = "Yêu cầu tuyển dụng",
}) => {
  const [activeTab, setActiveTab] = useState<"ASSIGN" | "HISTORY">("ASSIGN");

  // Assign State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<AssignmentHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setActiveTab("ASSIGN");
      setSearchTerm("");
      setSelectedId(null);
      setNote("");
      setApiError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === "HISTORY") {
      fetchHistory();
    }
  }, [isOpen, activeTab, jobRequisitionId]);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const data = await recruiterAssignmentService.getHistory(jobRequisitionId);
      setHistory(data);
    } catch (err: any) {
      setHistoryError(err?.response?.data?.message || "Không thể tải lịch sử phân công.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (!isOpen) return null;

  const filteredRecruiters = mockRecruiters.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedRecruiter = mockRecruiters.find((r) => r.id === selectedId);

  const handleSave = async () => {
    if (!selectedId) return;

    setIsSubmitting(true);
    setApiError(null);
    try {
      await recruiterAssignmentService.assignRecruiter(jobRequisitionId, {
        recruiterId: selectedId,
        note: note.trim() || undefined,
      });
      alert(`Đã phân công ${selectedRecruiter?.name} phụ trách thành công!`);
      if (onAssignSuccess) onAssignSuccess();
      onClose();
    } catch (err: any) {
      setApiError(err?.response?.data?.message || "Đã có lỗi xảy ra khi lưu phân công.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/50 pt-5">
          <div className="mb-4 flex items-center justify-between px-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Quản lý người tuyển dụng</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Cho: <span className="font-semibold text-slate-700">{jobRequisitionTitle}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex px-6">
            <button
              onClick={() => setActiveTab("ASSIGN")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === "ASSIGN" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              <UserPlus className="h-4 w-4" /> Phân công mới
            </button>
            <button
              onClick={() => setActiveTab("HISTORY")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === "HISTORY" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              <History className="h-4 w-4" /> Lịch sử
            </button>
          </div>
        </div>

        {/* ASSIGN TAB CONTENT */}
        {activeTab === "ASSIGN" && (
          <>
            <div className="p-6">
              {apiError && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  <p className="font-medium">Lỗi: {apiError}</p>
                </div>
              )}

              {/* Search Box */}
              <div className="relative mb-4">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                />
              </div>

              {/* List of Recruiters */}
              <div className="mb-4 max-h-48 overflow-y-auto rounded-xl border border-slate-200 p-2 custom-scrollbar">
                {filteredRecruiters.length > 0 ? (
                  filteredRecruiters.map((recruiter) => (
                    <div
                      key={recruiter.id}
                      onClick={() => !isSubmitting && setSelectedId(recruiter.id)}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition-colors ${selectedId === recruiter.id
                          ? "bg-indigo-50 ring-1 ring-indigo-200"
                          : "hover:bg-slate-50"
                        } ${isSubmitting && "opacity-50 cursor-not-allowed"}`}
                    >
                      {/* Avatar */}
                      {recruiter.avatarUrl ? (
                        <img
                          src={recruiter.avatarUrl}
                          alt={recruiter.name}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 ring-2 ring-white shadow-sm">
                          <UserCircle2 className="h-6 w-6" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-bold text-slate-800">{recruiter.name}</p>
                        <p className="truncate text-xs text-slate-500">{recruiter.email}</p>
                      </div>

                      {/* Checkbox equivalent */}
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${selectedId === recruiter.id ? "border-indigo-600" : "border-slate-300"
                        }`}>
                        {selectedId === recruiter.id && (
                          <div className="h-2.5 w-2.5 rounded-full bg-indigo-600"></div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-sm text-slate-500">
                    Không tìm thấy nhân viên nào phù hợp.
                  </div>
                )}
              </div>

              {/* Note input */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Ghi chú (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="VD: Chuyển giao do HR cũ nghỉ phép..."
                  className="w-full resize-none rounded-xl border border-slate-300 p-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-5 sm:px-6">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSave}
                disabled={!selectedId || isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Lưu phân công
              </button>
            </div>
          </>
        )}

        {/* HISTORY TAB CONTENT */}
        {activeTab === "HISTORY" && (
          <div className="p-6">
            {isLoadingHistory ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : historyError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-600">
                {historyError}
              </div>
            ) : history.length === 0 ? (
              <div className="py-10 text-center text-slate-500">
                <History className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm">Chưa có lịch sử phân công nào.</p>
              </div>
            ) : (
              <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="relative border-l-2 border-slate-200 pl-6 ml-2">
                  {history.map((item, index) => (
                    <div key={index} className="mb-6 last:mb-0 relative">
                      <div className="absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 border-2 border-white shadow-xs">
                        <Clock className="h-3 w-3 text-slate-500" />
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-sm font-semibold text-slate-800">
                          Giao cho: <span className="text-indigo-600">{item.assignedTo}</span>
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Bởi: <span className="font-medium text-slate-700">{item.assignedBy}</span>
                        </p>
                        {item.note && (
                          <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600 border border-slate-100">
                            <span className="font-semibold text-slate-700">Ghi chú:</span> {item.note}
                          </div>
                        )}
                        <p className="mt-2 text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(item.assignedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignRecruiterModal;
