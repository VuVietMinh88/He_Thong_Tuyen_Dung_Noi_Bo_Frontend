import { featureStatus } from '../../services/backendCapabilities';
import { CapabilityNotice } from '../../components/Interview/CapabilityNotice';
import React, { useState, useEffect, useMemo, useCallback, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  Search,
  RefreshCw,
  ExternalLink,
  Users,
  Copy,
  Check,
  ChevronRight,
  Filter,
  Award,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { tokenService } from '../../services/token.service';
import { interviewService } from '../../services/interviewService';
import { interviewerCalendarService } from '../../services/interviewerCalendarService';
import { useToast } from '../../components/notifications/useToast';
import type {
  InterviewSchedulePayload,
  AssignedCandidateProfileResult,
} from '../../types/interview';
import { InterviewerAccessForbiddenError } from '../../types/interview';
import CandidateResponseStatus from '../../components/Candidate/CandidateResponseStatus';
import { InterviewEvaluationModal } from '../../components/Interview/InterviewEvaluationModal';
import { AssignedCandidateCvViewerModal } from '../../components/Interview/AssignedCandidateCvViewerModal';
import { resolveEvaluationCriteriaForJob } from '../../utils/interviewEvaluationHelper';

const getTodayDateStringVN = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

export const PersonalInterviewSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const searchInputId = useId();

  const [interviews, setInterviews] = useState<InterviewSchedulePayload[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'TODAY' | 'COMPLETED' | 'PENDING_EVALUATION'>('ALL');
  const [formatFilter, setFormatFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [evaluatingInterview, setEvaluatingInterview] = useState<InterviewSchedulePayload | null>(null);

  // CV & Profile secure viewing state (S7-01 / TKNHTTDNB1-476)
  const [selectedCvProfile, setSelectedCvProfile] = useState<AssignedCandidateProfileResult | null>(null);
  const [isCvModalOpen, setIsCvModalOpen] = useState<boolean>(false);
  const [isCvLoading, setIsCvLoading] = useState<boolean>(false);
  const [loadingCvId, setLoadingCvId] = useState<string | null>(null);

  const currentUser = tokenService.getUserData();

  // Ngày hôm nay theo múi giờ Việt Nam YYYY-MM-DD
  const [todayVN] = useState<string>(() => getTodayDateStringVN());

  // Tải danh sách lịch phỏng vấn cá nhân (AC 1)
  const loadSchedule = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await interviewerCalendarService.getInterviewerSchedule({
        userId: currentUser?.id,
      });
      setInterviews(data);
    } catch {
      addToast({
        message: 'Không thể tải lịch phỏng vấn cá nhân, vui lòng thử lại.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, addToast]);

  useEffect(() => {
    let isCurrent = true;
    const fetchSchedule = async () => {
      try {
        setIsLoading(true);
        const data = await interviewerCalendarService.getInterviewerSchedule({
          userId: currentUser?.id,
        });
        if (isCurrent) {
          setInterviews(data);
        }
      } catch {
        if (isCurrent) {
          addToast({
            message: 'Không thể tải lịch phỏng vấn cá nhân, vui lòng thử lại.',
            type: 'error',
          });
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    void fetchSchedule();
    return () => {
      isCurrent = false;
    };
  }, [currentUser?.id, addToast]);

  // Copy link
  const handleCopyLink = (id: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Cập nhật trạng thái
  const handleUpdateStatus = async (
    id: string,
    newStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED',
  ) => {
    try {
      const current = interviews.find(item => item.id === id);
      if (newStatus !== 'CANCELLED' || current?.version === undefined) throw new Error('Cần tải lại lịch; Backend không hỗ trợ hoàn thành lịch thủ công.');
      const reason = window.prompt('Nhập lý do hủy lịch:');
      if (reason === null) return;
      const updated = await interviewService.updateInterviewStatus(id, newStatus, { expectedVersion: current.version, reason });
      if (updated) {
        setInterviews((prev) => prev.map((item) => (item.id === id ? updated : item)));
        addToast({
          message: 'Đã hủy buổi phỏng vấn thành công.',
          type: 'success',
        });
      }
    } catch (cause) {
      addToast({
        message: cause instanceof Error ? cause.message : 'Không thể cập nhật lịch. Tải lại nếu lịch đã thay đổi.',
        type: 'error',
      });
    }
  };

  // Xử lý mở xem tệp CV và chi tiết hồ sơ ứng viên an toàn theo phân quyền (AC 2)
  const handleViewCandidateCv = async (interview: InterviewSchedulePayload) => {
    try {
      setLoadingCvId(interview.id || null);
      setIsCvLoading(true);
      setIsCvModalOpen(true);
      const profile = await interviewerCalendarService.getAssignedCandidateProfile(
        interview.applicationId || interview.candidateId,
        interview.id,
      );
      setSelectedCvProfile(profile);
    } catch (err: unknown) {
      setIsCvModalOpen(false);
      if (err instanceof InterviewerAccessForbiddenError) {
        addToast({
          message: err.message,
          type: 'error',
        });
      } else {
        const message =
          err instanceof Error
            ? err.message
            : 'Không thể tải thông tin hồ sơ ứng viên, vui lòng thử lại.';
        addToast({
          message,
          type: 'error',
        });
      }
    } finally {
      setIsCvLoading(false);
      setLoadingCvId(null);
    }
  };

  // Thống kê nhanh (AC 3)
  const stats = useMemo(() => {
    const total = interviews.length;
    const today = interviews.filter((i) => i.interviewDate === todayVN && i.status !== 'CANCELLED').length;
    const upcoming = interviews.filter(
      (i) => i.interviewDate >= todayVN && i.status === 'SCHEDULED',
    ).length;
    const completed = interviews.filter((i) => i.status === 'COMPLETED').length;
    const pendingEvaluation = interviews.filter((i) => {
      const isPast =
        interviewerCalendarService.isInterviewPast(i.interviewDate, i.interviewTime) ||
        i.status === 'COMPLETED';
      return isPast && i.isEvaluationSubmitted === false && i.status !== 'CANCELLED';
    }).length;

    return { total, today, upcoming, completed, pendingEvaluation };
  }, [interviews, todayVN]);

  // Bộ lọc danh sách
  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      // 1. Lọc theo trạng thái / mốc thời gian
      if (statusFilter === 'TODAY' && item.interviewDate !== todayVN) return false;
      if (statusFilter === 'UPCOMING' && (item.interviewDate < todayVN || item.status !== 'SCHEDULED'))
        return false;
      if (statusFilter === 'COMPLETED' && item.status !== 'COMPLETED') return false;
      if (statusFilter === 'PENDING_EVALUATION') {
        const isPast =
          interviewerCalendarService.isInterviewPast(item.interviewDate, item.interviewTime) ||
          item.status === 'COMPLETED';
        if (!isPast || item.isEvaluationSubmitted !== false || item.status === 'CANCELLED') return false;
      }

      // 2. Lọc theo hình thức
      if (formatFilter !== 'ALL' && item.format !== formatFilter) return false;

      // 3. Lọc theo ngày cụ thể
      if (dateFilter && item.interviewDate !== dateFilter) return false;

      // 4. Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.candidateName.toLowerCase().includes(q);
        const matchTitle = item.jobTitle?.toLowerCase().includes(q) ?? false;
        const matchRound = item.roundName.toLowerCase().includes(q);
        const matchInterviewer = item.interviewers.some((i) => i.name.toLowerCase().includes(q));
        if (!matchName && !matchTitle && !matchRound && !matchInterviewer) return false;
      }

      return true;
    });
  }, [interviews, statusFilter, formatFilter, dateFilter, searchQuery, todayVN]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <CapabilityNotice feature="schedules" />
      <CapabilityNotice feature="evaluations" />
      <CapabilityNotice feature="scheduleWrites" />
      <CapabilityNotice feature="assignedProfile" />
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Lịch phỏng vấn cá nhân
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Danh sách các buổi phỏng vấn bạn được phân công tham gia đánh giá ứng viên
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadSchedule}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Tổng số buổi phỏng vấn</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Hôm nay
          </span>
          <div className="text-2xl font-bold text-amber-800 mt-1">{stats.today}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Sắp tới
          </span>
          <div className="text-2xl font-bold text-indigo-800 mt-1">{stats.upcoming}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã hoàn thành
          </span>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{stats.completed}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/25 shadow-xs">
          <span className="text-xs font-semibold text-rose-700 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Chưa nộp đánh giá
          </span>
          <div className="text-2xl font-bold text-rose-800 mt-1">{stats.pendingEvaluation}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Quick status tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'TODAY', label: `Hôm nay (${stats.today})` },
              { id: 'UPCOMING', label: `Sắp diễn ra (${stats.upcoming})` },
              { id: 'PENDING_EVALUATION', label: `Chưa nộp đánh giá (${stats.pendingEvaluation})` },
              { id: 'COMPLETED', label: `Đã hoàn thành (${stats.completed})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? tab.id === 'PENDING_EVALUATION'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value as typeof formatFilter)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none"
            >
              <option value="ALL">Mọi hình thức</option>
              <option value="ONLINE">Trực tuyến (Online)</option>
              <option value="OFFLINE">Trực tiếp (Tại văn phòng)</option>
            </select>
          </div>
        </div>

        {/* Search & date picker */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <label htmlFor={searchInputId} className="sr-only">
              Tìm kiếm buổi phỏng vấn
            </label>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id={searchInputId}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên ứng viên, vị trí tuyển dụng, người phỏng vấn..."
              className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-800 outline-none focus:border-indigo-500"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-xs text-rose-600 hover:underline shrink-0 font-medium"
              >
                Xóa ngày
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interview List Cards */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
          <p className="text-sm">Đang tải lịch phỏng vấn...</p>
        </div>
      ) : filteredInterviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy lịch phỏng vấn</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Không có buổi phỏng vấn nào phù hợp với bộ lọc hiện tại của bạn.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map((item) => {
            const isToday = item.interviewDate === todayVN;
            const isCompleted = item.status === 'COMPLETED';
            const isCancelled = item.status === 'CANCELLED';
            const isPast =
              interviewerCalendarService.isInterviewPast(item.interviewDate, item.interviewTime) ||
              isCompleted;
            const needsEvaluation = isPast && item.isEvaluationSubmitted === false && !isCancelled;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-5 transition-all shadow-xs ${
                  needsEvaluation
                    ? 'border-rose-300 ring-2 ring-rose-100 bg-gradient-to-r from-white to-rose-50/15'
                    : isToday
                    ? 'border-indigo-300 ring-2 ring-indigo-100 bg-gradient-to-r from-white to-indigo-50/20'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/15'
                    : isCancelled
                    ? 'border-slate-200 opacity-60'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left Column: Date & Time Box + Info */}
                  <div className="flex items-start gap-4">
                    {/* Date Box */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider">
                        {isToday ? 'Hôm nay' : item.interviewDate.slice(5)}
                      </span>
                      <span className="text-lg sm:text-2xl font-black text-slate-900 leading-none my-0.5">
                        {item.interviewTime}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {item.durationMinutes} phút
                      </span>
                    </div>

                    {/* Candidate & Round Info */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 hover:text-indigo-600 transition">
                          {item.candidateName}
                        </h3>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {item.roundName || item.interviewRound}
                        </span>
                        {isToday && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 uppercase animate-pulse">
                            Hôm nay
                          </span>
                        )}
                        <CandidateResponseStatus response={item.candidateResponse} />

                        {/* Badge Trạng thái đánh giá năng lực (AC 1 & AC 3) */}
                        {item.isEvaluationSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Đã nộp phiếu đánh giá
                            {typeof item.evaluationScore === 'number' && (
                              <span className="ml-0.5 font-bold">({item.evaluationScore}/5.0)</span>
                            )}
                          </span>
                        ) : needsEvaluation ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            Chưa nộp phiếu đánh giá
                          </span>
                        ) : null}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 font-medium">
                        Vị trí ứng tuyển: <strong className="text-slate-800">{item.jobTitle}</strong>
                      </p>

                      {/* Format and Venue */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          {item.format === 'ONLINE' ? (
                            <>
                              <Video className="w-3.5 h-3.5 text-blue-600" />
                              Trực tuyến
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                              Tại văn phòng
                            </>
                          )}
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-xs font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                          {item.locationOrLink}
                        </span>

                        {item.format === 'ONLINE' && item.locationOrLink.startsWith('http') && (
                          <button
                            type="button"
                            onClick={() => handleCopyLink(item.id || '', item.locationOrLink)}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                          >
                            {copiedId === item.id ? (
                              <span className="inline-flex items-center gap-0.5 text-emerald-600">
                                <Check className="w-3 h-3" /> Đã sao chép
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5">
                                <Copy className="w-3 h-3" /> Sao chép link
                              </span>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Co-interviewers */}
                      <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Hội đồng ({item.interviewers.length}):</span>
                        <span className="text-slate-700 font-medium truncate max-w-sm">
                          {item.interviewers.map((i) => i.name).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap lg:flex-col items-end justify-between gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Nút Xem CV & Hồ sơ ứng viên (AC 1 & AC 2) */}
                      <button
                        type="button"
                        onClick={() => handleViewCandidateCv(item)}
                        disabled
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition cursor-pointer disabled:opacity-50"
                        title="Xem hồ sơ ứng viên và tệp CV theo phân quyền người phỏng vấn"
                      >
                        {loadingCvId === item.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                        Xem CV & Hồ sơ
                      </button>

                      {/* Nút Đánh giá năng lực */}
                      <button
                        type="button"
                        disabled={featureStatus('evaluations') !== 'AVAILABLE'}
                        onClick={() => setEvaluatingInterview(item)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer shadow-2xs ${
                          needsEvaluation
                            ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-200'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        <Award className={`w-3.5 h-3.5 ${needsEvaluation ? 'text-white' : 'text-indigo-600'}`} />
                        {item.isEvaluationSubmitted ? 'Xem lại đánh giá' : 'Đánh giá năng lực'}
                      </button>

                      {item.candidateId && (
                        <button
                          type="button"
                          onClick={() => navigate(`/candidates/${item.candidateId}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                        >
                          Hồ sơ chi tiết <ChevronRight className="w-3 h-3" />
                        </button>
                      )}

                      {item.format === 'ONLINE' && item.locationOrLink.startsWith('http') && (
                        <a
                          href={item.locationOrLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Vào phòng họp <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {!isCompleted && !isCancelled && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={featureStatus('scheduleWrites') !== 'AVAILABLE'}
                          onClick={() => handleUpdateStatus(item.id || '', 'CANCELLED')}
                          className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        >
                          Hủy lịch
                        </button>
                        <button
                          type="button"
                          disabled title="Chức năng hoàn thành lịch thủ công chưa khả dụng trong bản tích hợp này"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Hoàn thành
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {item.notes && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl">
                    <span className="font-semibold text-slate-700 not-italic">Lưu ý: </span>
                    &quot;{item.notes}&quot;
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Phiếu đánh giá năng lực phỏng vấn (TKNHTTDNB1-457) */}
      {evaluatingInterview && (
        <InterviewEvaluationModal
          interviewId={evaluatingInterview.id}
          isOpen={true}
          onClose={() => setEvaluatingInterview(null)}
          candidateId={evaluatingInterview.candidateId}
          candidateName={evaluatingInterview.candidateName}
          candidateEmail={evaluatingInterview.candidateEmail}
          jobTitle={evaluatingInterview.jobTitle || 'Chức danh tuyển dụng'}
          interviewRound={evaluatingInterview.roundName || evaluatingInterview.interviewRound}
          interviewDate={evaluatingInterview.interviewDate}
          interviewTime={evaluatingInterview.interviewTime}
          interviewFormat={evaluatingInterview.format}
          locationOrLink={evaluatingInterview.locationOrLink}
          interviewerNames={evaluatingInterview.interviewers?.map((interviewLeader) => interviewLeader.name) || []}
          interviewerIds={
            evaluatingInterview.interviewerIds ||
            evaluatingInterview.interviewers?.map((interviewerItem) => interviewerItem.id) ||
            []
          }
          interviewers={evaluatingInterview.interviewers}
          currentUserId={currentUser?.id}
          currentUserEmail={currentUser?.email}
          currentUserRoles={currentUser?.roles}
          frameworkName={`Khung năng lực ${evaluatingInterview.jobTitle || 'Chuyên môn'}`}
          frameworkCode="CF-STD-2026"
          frameworkVersion="v1.0"
          criteria={resolveEvaluationCriteriaForJob(evaluatingInterview.jobTitle)}
          onSubmit={async (evaluationData) => {
            try {
              if (evaluatingInterview?.id) {
                // Cập nhật state interviews ngay lập tức không reload trang (no reload) (AC 3)
                setInterviews((prev) =>
                  prev.map((inv) =>
                    inv.id === evaluatingInterview.id
                      ? {
                          ...inv,
                          isEvaluationSubmitted: true,
                          evaluationScore: evaluationData.calculatedTotalScore ?? undefined,
                        }
                      : inv,
                  ),
                );
              }
              addToast({
                message: `Đã hoàn tất đánh giá và nộp phiếu cho ứng viên ${evaluatingInterview.candidateName}${
                  evaluationData.calculatedTotalScore !== null ? ` (Điểm: ${evaluationData.calculatedTotalScore}/5.0)` : ''
                }. Trạng thái lịch đã cập nhật tự động!`,
                type: 'success',
              });
            } catch {
              addToast({
                message: 'Có lỗi xảy ra khi lưu kết quả đánh giá, vui lòng thử lại.',
                type: 'error',
              });
            } finally {
              setEvaluatingInterview(null);
            }
          }}
          onSaveDraft={() => {
            addToast({
              message: `Đã lưu bản nháp đánh giá cho ứng viên ${evaluatingInterview.candidateName}.`,
              type: 'success',
            });
            setEvaluatingInterview(null);
          }}
        />
      )}

      {/* Modal Xem tệp CV và Hồ sơ ứng viên được phân công an toàn (S7-01 / TKNHTTDNB1-476) */}
      <AssignedCandidateCvViewerModal
        isOpen={isCvModalOpen}
        onClose={() => {
          setIsCvModalOpen(false);
          setSelectedCvProfile(null);
        }}
        profile={selectedCvProfile}
        isLoading={isCvLoading}
      />
    </div>
  );
};

export default PersonalInterviewSchedulePage;
