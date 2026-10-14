import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Mail,
  Calendar,
  Star,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Building2,
  Video,
  MapPin,
  CheckCircle2,
  ExternalLink,
  RotateCw,
  Lock,
  ArrowRight,
  Share2,
  Layers,
} from 'lucide-react';
import type {
  TimelineEvent,
  TimelineFilterCategory,
} from '../../types/candidateTimeline';
import { CANDIDATE_STAGE_CONFIG } from '../../types/candidate';
import { candidateTimelineService } from '../../services/candidateTimelineService';

interface CandidateInteractionTimelineProps {
  candidateId: string;
  className?: string;
}

export const CandidateInteractionTimeline: React.FC<CandidateInteractionTimelineProps> = ({
  candidateId,
  className = '',
}) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [activeFilter, setActiveFilter] = useState<TimelineFilterCategory>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEmailIds, setExpandedEmailIds] = useState<Set<string>>(new Set());

  const fetchTimeline = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await candidateTimelineService.getCandidateInteractionTimeline(
        candidateId,
        { category: activeFilter }
      );
      setEvents(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải dòng thời gian tương tác.');
    } finally {
      setIsLoading(false);
    }
  }, [candidateId, activeFilter]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const toggleExpandEmail = (eventId: string) => {
    setExpandedEmailIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const filterTabs: { key: TimelineFilterCategory; label: string }[] = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'APPLICATION_SUBMITTED', label: 'Nộp hồ sơ' },
    { key: 'STAGE_CHANGED', label: 'Chuyển giai đoạn' },
    { key: 'EMAIL_SENT', label: 'Email đã gửi' },
    { key: 'INTERVIEW_SCHEDULED', label: 'Lịch phỏng vấn' },
    { key: 'EVALUATION', label: 'Đánh giá & Ghi chú' },
  ];

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6 space-y-6 ${className}`}>
      {/* Header & Security Footnote (AC 1 & AC 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Nhật ký toàn bộ tương tác với ứng viên
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Theo dõi ai đã liên hệ, nội dung trao đổi và tiến trình tuyển dụng (Mới nhất nằm ở trên cùng)
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold shrink-0">
          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Bảo mật nội bộ — Ứng viên không thể nhìn thấy</span>
        </div>
      </div>

      {/* Filter Tabs (AC 2) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton State (AC 3) */}
      {isLoading && (
        <div className="space-y-4 py-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-16 bg-gray-100 rounded-xl w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State (AC 3) */}
      {!isLoading && error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-6 text-center space-y-3">
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchTimeline}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Thử tải lại
          </button>
        </div>
      )}

      {/* Empty State (AC 3) */}
      {!isLoading && !error && events.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-1" />
          <h4 className="text-sm font-bold text-gray-700">Chưa có sự kiện tương tác nào</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Không tìm thấy sự kiện nào trong danh mục đã chọn. Hãy chuyển sang bộ lọc &quot;Tất cả&quot; để xem toàn bộ lịch sử.
          </p>
        </div>
      )}

      {/* Timeline Events List (Vertical Timeline - AC 1 & AC 2) */}
      {!isLoading && !error && events.length > 0 && (
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {events.map((evt) => {
            const timeVN = candidateTimelineService.formatVietnamDateTime(evt.timestamp);
            const relativeTime = candidateTimelineService.getRelativeTimeVN(evt.timestamp);

            return (
              <div key={evt.id} className="relative group">
                {/* Event Marker Node on Vertical Line */}
                <div className="absolute -left-6 sm:-left-8 top-1.5 flex items-center justify-center">
                  {evt.eventType === 'APPLICATION_SUBMITTED' && (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs ring-4 ring-blue-50">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {evt.eventType === 'STAGE_CHANGED' && (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs ring-4 ring-purple-50">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {evt.eventType === 'EMAIL_SENT' && (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs ring-4 ring-indigo-50">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {evt.eventType === 'INTERVIEW_SCHEDULED' && (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs ring-4 ring-amber-50">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {(evt.eventType === 'EVALUATION_SUBMITTED' || evt.eventType === 'NOTE_ADDED') && (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs ring-4 ring-emerald-50">
                      <Star className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Event Card Content */}
                <div className="bg-slate-50/60 rounded-2xl border border-slate-200/90 p-4 sm:p-5 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all space-y-3">
                  {/* Top line: Title & Time */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {evt.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <strong className="text-gray-700">{evt.actor.fullName}</strong> ({evt.actor.role})
                        </span>
                      </div>
                    </div>

                    <div className="self-start sm:self-center shrink-0 flex items-center gap-2 text-[11px] text-gray-500">
                      <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {relativeTime}
                      </span>
                      <span>{timeVN}</span>
                    </div>
                  </div>

                  {/* Summary paragraph */}
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    {evt.summary}
                  </p>

                  {/* Detail Case 1: APPLICATION_SUBMITTED */}
                  {evt.applicationSubmitted && (
                    <div className="rounded-xl bg-white border border-slate-200 p-3.5 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {evt.applicationSubmitted.jobTitle}
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          {evt.applicationSubmitted.jobCode}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {evt.applicationSubmitted.departmentName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="w-3 h-3 text-slate-400" />
                          Nguồn: {evt.applicationSubmitted.source.label}
                          {evt.applicationSubmitted.source.referrerName && ` (Bởi: ${evt.applicationSubmitted.source.referrerName})`}
                        </span>
                        <span className="flex items-center gap-1 text-indigo-600 font-medium">
                          <FileText className="w-3 h-3" />
                          {evt.applicationSubmitted.cvFileName}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Detail Case 2: STAGE_CHANGED */}
                  {evt.stageChanged && (
                    <div className="rounded-xl bg-white border border-slate-200 p-3.5 space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full font-semibold border ${CANDIDATE_STAGE_CONFIG[evt.stageChanged.fromStage]?.badgeClass}`}>
                          {CANDIDATE_STAGE_CONFIG[evt.stageChanged.fromStage]?.label}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <span className={`px-2.5 py-1 rounded-full font-semibold border ${CANDIDATE_STAGE_CONFIG[evt.stageChanged.toStage]?.badgeClass}`}>
                          {CANDIDATE_STAGE_CONFIG[evt.stageChanged.toStage]?.label}
                        </span>
                      </div>
                      {evt.stageChanged.notes && (
                        <p className="text-[11px] text-slate-600 italic">
                          Lưu ý: {evt.stageChanged.notes}
                        </p>
                      )}
                      {evt.stageChanged.rejectionReason && (
                        <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 font-medium">
                          Lý do loại hồ sơ: {evt.stageChanged.rejectionReason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Detail Case 3: EMAIL_SENT */}
                  {evt.emailSent && (
                    <div className="rounded-xl bg-white border border-slate-200 p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="font-bold text-slate-900 truncate">
                            {evt.emailSent.subject}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          {evt.emailSent.deliveryStatus === 'OPENED' ? 'Đã mở email' : 'Đã gửi thành công'}
                        </span>
                      </div>

                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Người nhận: <strong className="text-slate-800 font-mono">{evt.emailSent.recipientEmail}</strong> • Gửi bởi: {evt.emailSent.senderName}
                      </p>

                      {/* Expand / Collapse email body */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => toggleExpandEmail(evt.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition cursor-pointer"
                        >
                          {expandedEmailIds.has(evt.id) ? (
                            <>
                              Thu gọn nội dung email <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              Xem chi tiết nội dung email đã gửi <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>

                        {expandedEmailIds.has(evt.id) && (
                          <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-xs leading-relaxed whitespace-pre-line animate-in fade-in duration-200">
                            {evt.emailSent.bodySnippet}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Detail Case 4: INTERVIEW_SCHEDULED */}
                  {evt.interviewScheduled && (
                    <div className="rounded-xl bg-white border border-amber-200/80 bg-amber-50/20 p-3.5 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {evt.interviewScheduled.roundName}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ứng viên đã xác nhận tham gia
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Thời lượng: {evt.interviewScheduled.durationMinutes} phút
                        </span>
                        <span className="flex items-center gap-1.5">
                          {evt.interviewScheduled.format === 'ONLINE' ? (
                            <Video className="w-3.5 h-3.5 text-indigo-500" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          Hình thức: {evt.interviewScheduled.format === 'ONLINE' ? 'Trực tuyến' : 'Trực tiếp'}
                        </span>
                        <div className="sm:col-span-2 flex items-center gap-1.5">
                          <span className="text-slate-400">Người phỏng vấn:</span>
                          <strong className="text-slate-800">
                            {evt.interviewScheduled.interviewers.map((i) => `${i.name} (${i.role})`).join(', ')}
                          </strong>
                        </div>
                      </div>

                      {evt.interviewScheduled.format === 'ONLINE' && (
                        <div className="pt-1">
                          <a
                            href={evt.interviewScheduled.locationOrMeetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-semibold text-[11px]"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Vào phòng họp Google Meet</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detail Case 5: EVALUATION_SUBMITTED */}
                  {evt.evaluationSubmitted && (
                    <div className="rounded-xl bg-white border border-emerald-200 bg-emerald-50/20 p-3.5 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {evt.evaluationSubmitted.roundName}
                          </span>
                          {evt.evaluationSubmitted.quickRating && (
                            <div className="flex items-center text-amber-500">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= (evt.evaluationSubmitted?.quickRating || 0)
                                      ? 'fill-amber-400 text-amber-500'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {evt.evaluationSubmitted.competencyScore && (
                            <span className="font-bold text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Điểm: {evt.evaluationSubmitted.competencyScore}/{evt.evaluationSubmitted.maxScore || 10}
                            </span>
                          )}
                          <span className="font-bold text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Kết luận: ĐẠT
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-700 text-xs leading-relaxed">
                        {evt.evaluationSubmitted.summaryNote}
                      </p>

                      {evt.evaluationSubmitted.strengths && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] text-slate-500 font-medium">Thế mạnh nổi bật:</span>
                          {evt.evaluationSubmitted.strengths.map((str, idx) => (
                            <span key={idx} className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                              ✓ {str}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detail Case 6: NOTE_ADDED */}
                  {evt.noteAdded && (
                    <div className="rounded-xl bg-white border border-slate-200 p-3 space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="font-semibold text-slate-800">Phân loại: Sơ vấn hồ sơ (Screening)</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-xs pl-5">
                        {evt.noteAdded.content}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CandidateInteractionTimeline;
