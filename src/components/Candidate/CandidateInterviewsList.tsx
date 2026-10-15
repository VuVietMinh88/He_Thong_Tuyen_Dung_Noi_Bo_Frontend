import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  XCircle,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Award,
} from 'lucide-react';
import type { InterviewSchedulePayload } from '../../types/interview';
import CandidateResponseStatus from './CandidateResponseStatus';
import { InterviewEvaluationModal } from '../Interview/InterviewEvaluationModal';
import { resolveEvaluationCriteriaForJob } from '../../utils/interviewEvaluationHelper';

interface CandidateInterviewsListProps {
  interviews: InterviewSchedulePayload[];
  isLoading?: boolean;
  onScheduleNew?: () => void;
  onStatusChange?: (interviewId: string, newStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED') => void;
}

export const CandidateInterviewsList: React.FC<CandidateInterviewsListProps> = ({
  interviews,
  isLoading = false,
  onScheduleNew,
  onStatusChange,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [evaluatingInterview, setEvaluatingInterview] = useState<InterviewSchedulePayload | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
        <p className="text-sm">Đang tải danh sách lịch phỏng vấn...</p>
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Chưa có lịch phỏng vấn</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
          Ứng viên này hiện chưa được xếp lịch phỏng vấn nào cho đợt tuyển dụng này. Bạn có thể lên lịch phỏng vấn chuyên môn hoặc HR ngay.
        </p>
        {onScheduleNew && (
          <button
            type="button"
            onClick={onScheduleNew}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Lên lịch phỏng vấn đầu tiên
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Lịch phỏng vấn đã xếp ({interviews.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Danh sách các vòng phỏng vấn đã được phân công và xác nhận
          </p>
        </div>

        {onScheduleNew && (
          <button
            type="button"
            onClick={onScheduleNew}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Lên lịch vòng mới
          </button>
        )}
      </div>

      {/* List of cards */}
      <div className="space-y-3.5">
        {interviews.map((item) => {
          const isCompleted = item.status === 'COMPLETED';
          const isCancelled = item.status === 'CANCELLED';

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
                isCompleted
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : isCancelled
                  ? 'border-slate-200 opacity-60'
                  : 'border-slate-200 hover:border-indigo-300'
              }`}
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm sm:text-base text-slate-900">
                    {item.roundName || item.interviewRound}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isCancelled
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Đã hoàn thành
                      </>
                    ) : isCancelled ? (
                      <>
                        <XCircle className="w-3 h-3" /> Đã hủy
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" /> Đã lên lịch
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <CandidateResponseStatus response={item.candidateResponse} />
                  <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                    {item.format === 'ONLINE' ? 'Trực tuyến' : 'Trực tiếp'}
                  </span>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 text-xs sm:text-sm">
                {/* Time & Duration */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-semibold">{item.interviewDate}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-bold text-indigo-700">
                      {item.interviewTime} ({item.durationMinutes} phút)
                    </span>
                  </div>

                  {/* Format & Location / Link */}
                  <div className="flex items-start gap-2 text-slate-700 pt-1">
                    {item.format === 'ONLINE' ? (
                      <Video className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    ) : (
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] uppercase font-bold text-slate-400 block">
                        {item.format === 'ONLINE' ? 'Liên kết phòng họp' : 'Địa điểm phòng họp'}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="truncate font-mono text-xs text-slate-800">
                          {item.locationOrLink}
                        </span>
                        {item.format === 'ONLINE' && item.locationOrLink.startsWith('http') && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopy(item.id || '', item.locationOrLink)}
                              title="Sao chép liên kết"
                              className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                            >
                              {copiedId === item.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <a
                              href={item.locationOrLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Tham gia phòng họp"
                              className="p-1 text-slate-400 hover:text-indigo-600 transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interviewers list */}
                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase font-bold text-slate-400 block">
                    Hội đồng phỏng vấn ({item.interviewers.length} người)
                  </span>
                  <div className="space-y-1">
                    {item.interviewers.map((interviewer) => (
                      <div key={interviewer.id} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {interviewer.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-800">{interviewer.name}</span>
                        <span className="text-[11px] text-slate-500">({interviewer.role})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {item.notes && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 italic bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/50">
                  <span className="font-semibold text-slate-700 not-italic">Ghi chú dặn dò: </span>
                  &quot;{item.notes}&quot;
                </div>
              )}

              {/* Action buttons (Đánh giá năng lực / Hoàn thành / Hủy lịch) */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEvaluatingInterview(item)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer shadow-2xs"
                >
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  Đánh giá năng lực
                </button>

                {!isCompleted && !isCancelled && onStatusChange && (
                  <>
                    <button
                      type="button"
                      onClick={() => onStatusChange(item.id || '', 'CANCELLED')}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    >
                      Hủy lịch hẹn
                    </button>
                    <button
                      type="button"
                      onClick={() => onStatusChange(item.id || '', 'COMPLETED')}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đánh dấu đã hoàn thành
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Đánh giá năng lực phỏng vấn */}
      {evaluatingInterview && (
        <InterviewEvaluationModal
          isOpen={true}
          onClose={() => setEvaluatingInterview(null)}
          candidateName={evaluatingInterview.candidateName}
          candidateEmail={evaluatingInterview.candidateEmail}
          jobTitle={evaluatingInterview.jobTitle || 'Chức danh ứng tuyển'}
          interviewRound={evaluatingInterview.roundName || evaluatingInterview.interviewRound}
          interviewDate={evaluatingInterview.interviewDate}
          interviewTime={evaluatingInterview.interviewTime}
          interviewFormat={evaluatingInterview.format}
          locationOrLink={evaluatingInterview.locationOrLink}
          interviewerNames={evaluatingInterview.interviewers?.map((interviewLeader) => interviewLeader.name) || []}
          frameworkName={`Khung năng lực ${evaluatingInterview.jobTitle || 'Chuyên môn'}`}
          frameworkCode="CF-STD-2026"
          frameworkVersion="v1.0"
          criteria={resolveEvaluationCriteriaForJob(evaluatingInterview.jobTitle)}
          onSubmit={() => {
            setEvaluatingInterview(null);
          }}
          onSaveDraft={() => {
            setEvaluatingInterview(null);
          }}
        />
      )}
    </div>
  );
};

export default CandidateInterviewsList;
