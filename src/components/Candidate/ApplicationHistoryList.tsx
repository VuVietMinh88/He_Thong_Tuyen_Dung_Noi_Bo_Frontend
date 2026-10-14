import React from 'react';
import {
  Calendar,
  Briefcase,
  UserCheck,
  Building2,
  AlertCircle,
  FileText,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { ApplicationRecord } from '../../types/candidate';
import { CANDIDATE_STAGE_CONFIG } from '../../types/candidate';

interface ApplicationHistoryListProps {
  applications: ApplicationRecord[];
  activeApplicationId: string;
  onSelectApplication: (applicationId: string) => void;
}

export const ApplicationHistoryList: React.FC<ApplicationHistoryListProps> = ({
  applications,
  activeApplicationId,
  onSelectApplication,
}) => {
  const formatDateVN = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  if (!applications || applications.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-gray-800">Chưa có lịch sử ứng tuyển</h4>
        <p className="text-sm text-gray-500 mt-1">Ứng viên chưa từng nộp hồ sơ vào hệ thống trước đây.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            Lịch sử các lần ứng tuyển ({applications.length})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Theo dõi tất cả vị trí ứng viên từng nộp. Click vào từng đợt để đổi bản CV xem trước tương ứng.
          </p>
        </div>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
        {applications.map((app, index) => {
          const isSelected = app.id === activeApplicationId;
          const stageConfig = CANDIDATE_STAGE_CONFIG[app.stage] || {
            label: app.stage,
            badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
            description: '',
          };

          return (
            <div key={app.id} className="relative group">
              {/* Timeline marker */}
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-indigo-600 border-white ring-4 ring-indigo-100 text-white'
                    : app.isCurrent
                    ? 'bg-emerald-500 border-white ring-2 ring-emerald-100 text-white'
                    : 'bg-white border-gray-300 text-gray-400 group-hover:border-indigo-400'
                }`}
              >
                {isSelected ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[10px] font-bold">{index + 1}</span>
                )}
              </div>

              {/* Card content */}
              <div
                onClick={() => onSelectApplication(app.id)}
                className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                  isSelected
                    ? 'bg-indigo-50/50 border-indigo-400 shadow-sm ring-1 ring-indigo-200'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200">
                        {app.jobCode}
                      </span>
                      {app.isCurrent && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          Đợt hiện tại
                        </span>
                      )}
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${stageConfig.badgeClass}`}
                      >
                        {stageConfig.label}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {app.jobTitle}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        {app.departmentName}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        Nộp ngày: {formatDateVN(app.appliedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                    >
                      {isSelected ? 'Đang xem CV' : 'Xem đợt này'}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Sub-info: Recruiter, Hiring Manager & Source */}
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>
                      <strong className="text-gray-700">Recruiter:</strong> {app.recruiterName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>
                      <strong className="text-gray-700">Hiring Manager:</strong> {app.hiringManagerName}
                    </span>
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-1.5 text-gray-600">
                    <strong className="text-gray-700">Nguồn:</strong>
                    <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                      {app.source.label}
                      {app.source.referrerName && ` (Bởi: ${app.source.referrerName})`}
                    </span>
                    <span className="ml-auto text-gray-400 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {app.cvFileName}
                    </span>
                  </div>
                </div>

                {/* Rejection / Withdrawal Reason alert */}
                {(app.rejectionReason || app.withdrawalReason) && (
                  <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">
                        {app.stage === 'REJECTED' ? 'Lý do từ chối / loại hồ sơ:' : 'Lý do ứng viên rút lui:'}
                      </strong>{' '}
                      <span>{app.rejectionReason || app.withdrawalReason}</span>
                    </div>
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

export default ApplicationHistoryList;

