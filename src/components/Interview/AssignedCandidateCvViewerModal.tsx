import React, { useEffect, useState } from 'react';
import {
  X,
  FileText,
  Download,
  Briefcase,
  Mail,
  Phone,
  GraduationCap,
  Building,
  Calendar,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { AssignedCandidateProfileResult } from '../../types/interview';

export interface AssignedCandidateCvViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AssignedCandidateProfileResult | null;
  isLoading?: boolean;
}

export const AssignedCandidateCvViewerModal: React.FC<AssignedCandidateCvViewerModalProps> = ({
  isOpen,
  onClose,
  profile,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'CV' | 'PROFILE'>('CV');

  // Đóng modal khi bấm phím ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cv-viewer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
              <FileText className="w-5 h-5 text-indigo-100" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="cv-viewer-title" className="text-base sm:text-lg font-bold tracking-tight truncate">
                  {profile ? `Hồ sơ & CV: ${profile.fullName}` : 'Hồ sơ ứng viên'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <ShieldCheck className="w-3 h-3" /> Quyền người phỏng vấn
                </span>
              </div>
              <p className="text-xs text-indigo-200 truncate mt-0.5">
                {profile?.appliedJobTitle} • {profile?.interviewRound || 'Buổi phỏng vấn được mời'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {profile?.cvUrl && (
              <a
                href={profile.cvUrl}
                download={profile.cvFileName || 'CV_Ung_Vien.pdf'}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition cursor-pointer"
                title="Tải tệp CV về máy"
              >
                <Download className="w-3.5 h-3.5" />
                Tải CV
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              aria-label="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="flex sm:hidden border-b border-slate-200 bg-slate-50 px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('CV')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 text-center transition ${
              activeTab === 'CV'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Tệp CV đính kèm
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PROFILE')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 text-center transition ${
              activeTab === 'PROFILE'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Thông tin chi tiết
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="py-20 text-center text-slate-500 space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              <p className="text-xs sm:text-sm font-medium">Đang tải tệp CV và xác thực phân quyền...</p>
            </div>
          ) : !profile ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <p className="text-sm font-bold text-slate-800">Không tìm thấy thông tin hồ sơ ứng viên</p>
              <p className="text-xs text-slate-500">Vui lòng kiểm tra lại liên kết hoặc liên hệ Quản trị viên.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Candidate Overview & Interview Info (4 cols on lg) */}
              <div
                className={`lg:col-span-4 space-y-4 ${
                  activeTab === 'CV' ? 'hidden sm:block' : 'block'
                }`}
              >
                {/* Basic info box */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shrink-0">
                      {profile.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 truncate text-sm sm:text-base">
                        {profile.fullName}
                      </h3>
                      <p className="text-xs text-indigo-600 font-medium truncate">
                        {profile.appliedJobTitle}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 space-y-2 text-xs">
                    {profile.email && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-mono">{profile.email}</span>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile.experienceYears !== undefined && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Kinh nghiệm: <strong>{profile.experienceYears} năm</strong></span>
                      </div>
                    )}
                    {profile.currentCompany && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Hiện tại: {profile.currentCompany}</span>
                      </div>
                    )}
                    {profile.educationLevel && (
                      <div className="flex items-start gap-2 text-slate-600">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-relaxed">{profile.educationLevel}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interview Session Info */}
                <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-4 space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
                    Buổi phỏng vấn phân công
                  </span>
                  <div className="space-y-1.5 pt-1">
                    <div className="font-bold text-slate-900">
                      {profile.interviewRound || 'Vòng phỏng vấn'}
                    </div>
                    {profile.interviewDate && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{profile.interviewDate}</span>
                        {profile.interviewTime && (
                          <>
                            <span>•</span>
                            <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>{profile.interviewTime}</span>
                          </>
                        )}
                      </div>
                    )}
                    {profile.interviewLocationOrLink && (
                      <div className="flex items-start gap-1.5 text-slate-600 pt-0.5">
                        {profile.interviewFormat === 'ONLINE' ? (
                          <Video className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        <span className="truncate font-mono text-[11px]">
                          {profile.interviewLocationOrLink}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills tags */}
                {profile.skills && profile.skills.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Kỹ năng chuyên môn
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {profile.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary / Cover Letter */}
                {profile.summary && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1.5 text-xs text-slate-600">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Tóm tắt hồ sơ
                    </span>
                    <p className="leading-relaxed text-[11px]">{profile.summary}</p>
                  </div>
                )}
              </div>

              {/* Right Column: CV Viewer Document Preview (8 cols on lg) */}
              <div
                className={`lg:col-span-8 flex flex-col space-y-3 ${
                  activeTab === 'PROFILE' ? 'hidden sm:flex' : 'flex'
                }`}
              >
                <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {profile.cvFileName || 'CV_Ung_Vien.pdf'}
                    </span>
                  </div>

                  {profile.cvUrl && (
                    <div className="flex items-center gap-2">
                      <a
                        href={profile.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        Mở tab mới <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>

                {/* CV Document View Area */}
                <div className="flex-1 min-h-[500px] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative flex flex-col">
                  {profile.cvUrl ? (
                    <iframe
                      src={`${profile.cvUrl}#toolbar=0`}
                      title={`CV - ${profile.fullName}`}
                      className="w-full flex-1 min-h-[500px] border-0"
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-2">
                      <FileText className="w-12 h-12 text-slate-400" />
                      <p className="text-sm font-semibold text-slate-700">Chưa có liên kết tệp CV trực tuyến</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Ứng viên nộp hồ sơ bằng mẫu văn bản nội bộ hoặc tệp tin đang được xử lý đồng bộ.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đã xác thực quyền xem hồ sơ dành riêng cho người phỏng vấn được mời.</span>
          </div>

          <div className="flex items-center gap-2.5">
            {profile?.cvUrl && (
              <a
                href={profile.cvUrl}
                download={profile.cvFileName || 'CV_Ung_Vien.pdf'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold border border-slate-300 shadow-2xs transition"
              >
                <Download className="w-4 h-4 text-slate-600" />
                Tải xuống
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignedCandidateCvViewerModal;

