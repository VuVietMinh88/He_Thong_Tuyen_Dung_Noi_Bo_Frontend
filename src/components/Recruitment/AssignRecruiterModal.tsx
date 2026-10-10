import React, { useState } from "react";
import { X, Search, UserCircle2 } from "lucide-react";

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
  onAssign?: (recruiterId: string) => void;
  jobRequisitionTitle?: string;
}

export const AssignRecruiterModal: React.FC<AssignRecruiterModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  jobRequisitionTitle = "Yêu cầu tuyển dụng",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredRecruiters = mockRecruiters.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedRecruiter = mockRecruiters.find((r) => r.id === selectedId);

  const handleSave = () => {
    if (selectedId) {
      console.log("Assigned Recruiter ID:", selectedId);
      if (onAssign) onAssign(selectedId);
      alert(`Đã phân công ${selectedRecruiter?.name} phụ trách yêu cầu này!`);
      onClose();
    }
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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Phân công người tuyển dụng</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Chỉ định HR phụ trách cho: <span className="font-semibold text-slate-700">{jobRequisitionTitle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
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
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* List of Recruiters */}
          <div className="mb-5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 p-2 custom-scrollbar">
            {filteredRecruiters.length > 0 ? (
              filteredRecruiters.map((recruiter) => (
                <div
                  key={recruiter.id}
                  onClick={() => setSelectedId(recruiter.id)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition-colors ${
                    selectedId === recruiter.id
                      ? "bg-indigo-50 ring-1 ring-indigo-200"
                      : "hover:bg-slate-50"
                  }`}
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
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                    selectedId === recruiter.id ? "border-indigo-600" : "border-slate-300"
                  }`}>
                    {selectedId === recruiter.id && (
                      <div className="h-2.5 w-2.5 rounded-full bg-indigo-600"></div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">
                Không tìm thấy nhân viên nào phù hợp.
              </div>
            )}
          </div>

          {/* Selected Info Preview */}
          {selectedRecruiter && (
            <div className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Nhân sự đã chọn
              </p>
              <div className="flex items-center gap-3">
                {selectedRecruiter.avatarUrl ? (
                  <img
                    src={selectedRecruiter.avatarUrl}
                    alt={selectedRecruiter.name}
                    className="h-12 w-12 rounded-full object-cover shadow-sm ring-2 ring-white"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                    <UserCircle2 className="h-7 w-7 text-indigo-400" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-slate-900">{selectedRecruiter.name}</p>
                  <p className="text-sm text-slate-600">{selectedRecruiter.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-5 sm:px-6">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedId}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg"
          >
            Lưu phân công
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignRecruiterModal;
