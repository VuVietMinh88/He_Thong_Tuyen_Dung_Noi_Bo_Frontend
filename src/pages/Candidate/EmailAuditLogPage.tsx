import React, { useState, useMemo, useId, useEffect } from 'react';
import {
  Mail,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Eye,
  RefreshCw,
  FileText,
  Paperclip,
  Calendar,
  User,
  Layers,
  X,
  Loader2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '../../components/notifications/useToast';
import emailAuditService from '../../services/emailAuditService';
import {
  type EmailAuditLogItem,
  type EmailAuditFilterStatus,
  type EmailAuditDateRangePreset,
  formatVietnamDateTime,
  getStoredEmailAuditLogs,
} from '../../types/emailAuditLog';

export interface EmailAuditLogPageProps {
  candidateId?: string;
  candidateName?: string;
  candidateEmail?: string;
  isEmbedded?: boolean;
}

const TEMPLATE_TYPE_FILTERS: Array<{ id: string; label: string }> = [
  { id: 'ALL', label: 'Tất cả loại mẫu' },
  { id: 'APPLICATION_CONFIRMATION', label: 'Xác nhận tiếp nhận hồ sơ' },
  { id: 'INTERVIEW_INVITATION', label: 'Thư mời phỏng vấn' },
  { id: 'POST_INTERVIEW_THANK_YOU', label: 'Cảm ơn sau phỏng vấn' },
  { id: 'REJECTION', label: 'Thư từ chối' },
  { id: 'OFFER_LETTER', label: 'Đề xuất việc (Offer)' },
];

const DATE_RANGE_PRESETS: Array<{ id: EmailAuditDateRangePreset; label: string }> = [
  { id: 'ALL', label: 'Tất cả thời gian' },
  { id: 'TODAY', label: 'Hôm nay' },
  { id: 'LAST_7_DAYS', label: '7 ngày qua' },
  { id: 'LAST_30_DAYS', label: '30 ngày qua' },
  { id: 'CUSTOM', label: 'Khoảng ngày tùy chỉnh' },
];

/**
 * Kiểm tra xem ngày gửi có nằm trong khoảng thời gian đã chọn không
 */
const isDateMatchingPreset = (
  dateStr: string,
  preset: EmailAuditDateRangePreset,
  startStr?: string,
  endStr?: string,
): boolean => {
  if (preset === 'ALL') return true;
  const logDate = new Date(dateStr);
  const now = new Date();

  if (preset === 'TODAY') {
    return (
      logDate.getFullYear() === now.getFullYear() &&
      logDate.getMonth() === now.getMonth() &&
      logDate.getDate() === now.getDate()
    );
  }

  if (preset === 'LAST_7_DAYS') {
    const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 7;
  }

  if (preset === 'LAST_30_DAYS') {
    const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 30;
  }

  if (preset === 'CUSTOM') {
    if (startStr) {
      const start = new Date(startStr);
      start.setHours(0, 0, 0, 0);
      if (logDate < start) return false;
    }
    if (endStr) {
      const end = new Date(endStr);
      end.setHours(23, 59, 59, 999);
      if (logDate > end) return false;
    }
    return true;
  }

  return true;
};

/**
 * Màn hình Lịch sử gửi email cho ứng viên (Email Audit Log & Retry)
 * Jira Task: TKNHTTDNB1-536 / TKNHTTDNB1-78 (User Story S8-02)
 */
export const EmailAuditLogPage: React.FC<EmailAuditLogPageProps> = ({
  candidateId: initialCandidateId,
  candidateName: initialCandidateName,
  isEmbedded = false,
}) => {
  const { addToast } = useToast();
  const searchInputId = useId();
  const templateFilterSelectId = useId();
  const datePresetSelectId = useId();
  const startDateInputId = useId();
  const endDateInputId = useId();

  // Danh sách các bản ghi nhật ký (khởi tạo từ LocalStorage hoặc dữ liệu mẫu)
  const [logs, setLogs] = useState<EmailAuditLogItem[]>(() => getStoredEmailAuditLogs());

  // Bộ lọc trạng thái & loại mẫu & từ khóa (AC 1 & AC 2)
  const [statusFilter, setStatusFilter] = useState<EmailAuditFilterStatus>('ALL');
  const [templateFilter, setTemplateFilter] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [activeCandidateFilter, setActiveCandidateFilter] = useState<string | null>(
    initialCandidateId || null,
  );

  // Bộ lọc khoảng thời gian (Date Range Filtering - AC 2)
  const [dateRangePreset, setDateRangePreset] = useState<EmailAuditDateRangePreset>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Chế độ xem: Bảng (TABLE) hoặc Dòng thời gian (TIMELINE)
  const [viewMode, setViewMode] = useState<'TABLE' | 'TIMELINE'>('TABLE');

  // Trạng thái Retry bất đồng bộ (Queue-based async dispatch - AC 3)
  const [retryingLogIds, setRetryingLogIds] = useState<Set<string>>(new Set());
  const [isRetryingAll, setIsRetryingAll] = useState<boolean>(false);

  // Modal xem chi tiết nội dung email (Preview Modal)
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<EmailAuditLogItem | null>(null);

  // Tải dữ liệu ban đầu từ API qua emailAuditService
  useEffect(() => {
    let isCurrent = true;
    const fetchAuditLogs = async () => {
      try {
        const data = await emailAuditService.getEmailAuditLogs({
          candidateId: activeCandidateFilter || undefined,
        });
        if (isCurrent && Array.isArray(data)) {
          setLogs(data);
        }
      } catch (err: unknown) {
        if (isCurrent) {
          addToast({
            type: 'warning',
            message:
              err instanceof Error
                ? err.message
                : 'Đang hiển thị dữ liệu lịch sử email từ bộ nhớ cục bộ.',
          });
        }
      }
    };

    void fetchAuditLogs();
    return () => {
      isCurrent = false;
    };
  }, [activeCandidateFilter, addToast]);

  // Thống kê nhanh (KPI Metrics)
  const metrics = useMemo(() => {
    const total = logs.length;
    const sentCount = logs.filter((l) => l.status === 'SENT').length;
    const failedCount = logs.filter((l) => l.status === 'FAILED').length;
    const queuedCount = logs.filter((l) => l.status === 'QUEUED' || l.status === 'PENDING').length;
    const sentRate = total > 0 ? Math.round((sentCount / total) * 100) : 0;
    return { total, sentCount, failedCount, queuedCount, sentRate };
  }, [logs]);

  // Danh sách nhật ký sau khi áp dụng bộ lọc và tìm kiếm (AC 1 & AC 2)
  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      // 1. Lọc theo ứng viên cụ thể nếu có
      if (activeCandidateFilter && item.candidateId !== activeCandidateFilter) {
        return false;
      }

      // 2. Lọc theo trạng thái gửi (AC 2)
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'QUEUED') {
          if (item.status !== 'QUEUED' && item.status !== 'PENDING') {
            return false;
          }
        } else if (item.status !== statusFilter) {
          return false;
        }
      }

      // 3. Lọc theo loại mẫu email
      if (templateFilter !== 'ALL' && item.templateType !== templateFilter) {
        return false;
      }

      // 4. Lọc theo từ khóa tìm kiếm
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase().trim();
        const matchSubject = item.subject.toLowerCase().includes(kw);
        const matchCandidate = item.candidateName.toLowerCase().includes(kw);
        const matchEmail = item.candidateEmail.toLowerCase().includes(kw);
        const matchSender = item.senderName.toLowerCase().includes(kw);
        const matchTemplate = item.templateName.toLowerCase().includes(kw);
        if (!matchSubject && !matchCandidate && !matchEmail && !matchSender && !matchTemplate) {
          return false;
        }
      }

      // 5. Lọc theo khoảng thời gian (Date Range Filtering - AC 2)
      if (!isDateMatchingPreset(item.sentAt, dateRangePreset, startDate, endDate)) {
        return false;
      }

      return true;
    });
  }, [
    logs,
    activeCandidateFilter,
    statusFilter,
    templateFilter,
    searchKeyword,
    dateRangePreset,
    startDate,
    endDate,
  ]);

  /**
   * Xử lý gửi lại một email lỗi cụ thể qua emailAuditService (Retry Failed Email - AC 1 & AC 3)
   * Kích hoạt xử lý ngầm (Queue-based async dispatch) không làm đơ giao diện
   */
  const handleRetrySingle = async (logItem: EmailAuditLogItem) => {
    if (retryingLogIds.has(logItem.id)) return;

    // 1. Đưa vào tập hợp đang xử lý ngầm
    setRetryingLogIds((prev) => new Set(prev).add(logItem.id));

    // 2. Thông báo ngay cho người dùng qua Toast mà không chặn UI
    addToast({
      type: 'info',
      message: `Đã đưa email tới ${logItem.candidateName} vào hàng đợi gửi lại ngầm...`,
    });

    try {
      // 3. Gọi service API thử gửi lại email qua hàng đợi bất đồng bộ
      const response = await emailAuditService.retryFailedEmail(logItem.id);
      const updatedItem = response.logItem;

      setLogs((prevLogs) => {
        return prevLogs.map((item) => (item.id === logItem.id ? updatedItem : item));
      });

      // Cập nhật lại modal nếu đang mở
      setSelectedLogForDetail((curr) => {
        if (curr && curr.id === logItem.id) {
          return updatedItem;
        }
        return curr;
      });

      // 4. Thông báo hoàn thành
      addToast({
        type: 'success',
        message: `Gửi lại email thành công cho ứng viên ${logItem.candidateName}!`,
      });
    } catch (err: unknown) {
      addToast({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Không thể gửi lại email. Vui lòng kiểm tra lại kết nối.',
      });
    } finally {
      // 5. Xóa khỏi danh sách retrying
      setRetryingLogIds((prev) => {
        const next = new Set(prev);
        next.delete(logItem.id);
        return next;
      });
    }
  };

  /**
   * Xử lý gửi lại toàn bộ email đang gặp lỗi (Retry All Failed)
   */
  const handleRetryAllFailed = async () => {
    const failedItems = logs.filter((l) => l.status === 'FAILED');
    if (failedItems.length === 0 || isRetryingAll) return;

    setIsRetryingAll(true);
    const failedIds = new Set(failedItems.map((f) => f.id));
    setRetryingLogIds((prev) => new Set([...prev, ...failedIds]));

    addToast({
      type: 'info',
      message: `Đang đưa ${failedItems.length} email lỗi vào hàng đợi gửi lại tự động...`,
    });

    try {
      const result = await emailAuditService.retryAllFailedEmails(
        activeCandidateFilter || undefined,
      );

      // Cập nhật danh sách mới
      const refreshed = await emailAuditService.getEmailAuditLogs({
        candidateId: activeCandidateFilter || undefined,
      });
      setLogs(refreshed);

      addToast({
        type: 'success',
        message:
          result.message ||
          `Đã hoàn tất gửi lại thành công toàn bộ ${failedItems.length} email lỗi!`,
      });
    } catch (err: unknown) {
      addToast({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Gặp sự cố khi gửi lại danh sách email lỗi.',
      });
    } finally {
      setRetryingLogIds(new Set());
      setIsRetryingAll(false);
    }
  };

  /**
   * Khôi phục dữ liệu nhật ký mẫu ban đầu
   */
  const handleResetToSample = async () => {
    try {
      const sample = await emailAuditService.resetAuditLogs();
      setLogs(sample);
      setSelectedLogForDetail(null);
      addToast({
        type: 'info',
        message: 'Đã khôi phục dữ liệu nhật ký gửi email ban đầu.',
      });
    } catch {
      // Fallback
    }
  };

  return (
    <div
      data-testid="email-audit-log-page"
      className={
        isEmbedded
          ? 'space-y-5'
          : 'min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6 font-sans'
      }
    >
      {/* 1. Header & Tiêu đề trang (AC 1) */}
      {!isEmbedded && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Nhật ký & Lịch sử gửi email
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Theo dõi thời điểm gửi, mẫu thư đã dùng, trạng thái gửi và hỗ trợ gửi lại các thư bị lỗi
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0">
            <button
              type="button"
              onClick={handleResetToSample}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer shadow-2xs"
              title="Khôi phục lại danh sách nhật ký mẫu để kiểm thử"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Dữ liệu mẫu</span>
            </button>

            {metrics.failedCount > 0 && (
              <button
                type="button"
                onClick={handleRetryAllFailed}
                disabled={isRetryingAll}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRetryingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Gửi lại tất cả thư lỗi ({metrics.failedCount})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Thông báo ứng viên đang lọc (nếu có activeCandidateFilter) */}
      {activeCandidateFilter && (
        <div className="flex items-center justify-between p-3 px-4 bg-indigo-50/80 rounded-2xl border border-indigo-200 text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            <span>
              Đang hiển thị lịch sử gửi email riêng cho ứng viên:{' '}
              <strong className="font-bold text-indigo-950">
                {initialCandidateName || activeCandidateFilter}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveCandidateFilter(null)}
            className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Xem tất cả ứng viên</span>
          </button>
        </div>
      )}

      {/* 2. Thẻ số liệu thống kê nhanh (KPI Summary Cards - AC 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Tổng số email */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-slate-500">Tổng số email đã gửi</span>
            <div className="text-2xl font-black text-slate-800">{metrics.total}</div>
            <p className="text-[11px] text-slate-400">Ghi nhận toàn bộ tương tác</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Gửi thành công */}
        <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-emerald-800">Gửi thành công</span>
            <div className="text-2xl font-black text-emerald-700">
              {metrics.sentCount}{' '}
              <span className="text-xs font-semibold text-emerald-600">({metrics.sentRate}%)</span>
            </div>
            <p className="text-[11px] text-emerald-600">Ứng viên đã nhận được thư</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Gửi thất bại / Lỗi */}
        <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-rose-800">Thất bại / Cần gửi lại</span>
            <div className="text-2xl font-black text-rose-700">{metrics.failedCount}</div>
            <p className="text-[11px] text-rose-600">Có thể bấm gửi lại ngay</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Đang trong hàng đợi ngầm (Queued - AC 2) */}
        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-amber-800">Đang trong hàng đợi</span>
            <div className="text-2xl font-black text-amber-700">{metrics.queuedCount}</div>
            <p className="text-[11px] text-amber-600">Hệ thống xử lý ngầm (Queue)</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Thanh công cụ tìm kiếm, bộ lọc trạng thái, thời gian và chuyển đổi chế độ xem (AC 2 & AC 3) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Dòng 1: Tìm kiếm từ khóa & Chế độ xem */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Ô tìm kiếm từ khóa */}
          <div className="relative flex-1">
            <label htmlFor={searchInputId} className="sr-only">
              Tìm kiếm email
            </label>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id={searchInputId}
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm theo tên ứng viên, email, tiêu đề, người gửi..."
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Nút chuyển đổi Bảng / Timeline */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem dạng Bảng"
            >
              Dạng Bảng
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TIMELINE')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                viewMode === 'TIMELINE'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem dạng Dòng thời gian"
            >
              Dòng thời gian
            </button>
          </div>
        </div>

        {/* Dòng 2: Bộ lọc trạng thái, loại mẫu và khoảng thời gian (AC 2) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Bộ lọc trạng thái 4 nút (AC 2) */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({metrics.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('SENT')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'SENT'
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'text-emerald-700 hover:bg-emerald-100/60'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Thành công ({metrics.sentCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('FAILED')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'FAILED'
                  ? 'bg-rose-600 text-white shadow-2xs font-bold'
                  : 'text-rose-700 hover:bg-rose-100/60'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Thất bại ({metrics.failedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('QUEUED')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'QUEUED'
                  ? 'bg-amber-600 text-white shadow-2xs font-bold'
                  : 'text-amber-800 hover:bg-amber-100/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Hàng đợi ({metrics.queuedCount})</span>
            </button>
          </div>

          {/* Nhóm bộ lọc Loại mẫu & Thời gian (AC 2) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Bộ lọc loại mẫu */}
            <div className="relative">
              <label htmlFor={templateFilterSelectId} className="sr-only">
                Lọc theo loại mẫu email
              </label>
              <select
                id={templateFilterSelectId}
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 font-medium outline-none focus:border-indigo-500 cursor-pointer"
              >
                {TEMPLATE_TYPE_FILTERS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bộ lọc khoảng thời gian (AC 2) */}
            <div className="relative">
              <label htmlFor={datePresetSelectId} className="sr-only">
                Lọc theo khoảng thời gian
              </label>
              <select
                id={datePresetSelectId}
                value={dateRangePreset}
                onChange={(e) =>
                  setDateRangePreset(e.target.value as EmailAuditDateRangePreset)
                }
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 font-medium outline-none focus:border-indigo-500 cursor-pointer"
              >
                {DATE_RANGE_PRESETS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ô chọn ngày tùy chỉnh khi dateRangePreset === 'CUSTOM' (AC 2) */}
        {dateRangePreset === 'CUSTOM' && (
          <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex flex-wrap items-center gap-3 text-xs animate-in fade-in">
            <span className="font-bold text-indigo-950 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Khoảng ngày gửi:</span>
            </span>

            <div className="flex items-center gap-1.5">
              <label htmlFor={startDateInputId} className="text-slate-600">
                Từ ngày:
              </label>
              <input
                id={startDateInputId}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor={endDateInputId} className="text-slate-600">
                Đến ngày:
              </label>
              <input
                id={endDateInputId}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
              >
                Xóa ngày lọc
              </button>
            )}
          </div>
        )}

        {/* 4. Danh sách Nhật ký: Hiển thị dạng Bảng hoặc Dòng thời gian (AC 1 & AC 2) */}
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Mail className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Không tìm thấy nhật ký gửi email</h3>
            <p className="text-xs text-slate-400">
              Thử thay đổi bộ lọc trạng thái, khoảng thời gian hoặc xóa từ khóa tìm kiếm.
            </p>
          </div>
        ) : viewMode === 'TABLE' ? (
          /* ========================================================================= */
          /* CHẾ ĐỘ 1: BẢNG DỮ LIỆU (TABLE VIEW - AC 1)                                */
          /* ========================================================================= */
          <div className="overflow-x-auto rounded-2xl border border-slate-200/90">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3.5 whitespace-nowrap">Thời điểm gửi</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Ứng viên nhận</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Mẫu email đã dùng</th>
                  <th className="py-3 px-3.5">Tiêu đề thư</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Người gửi</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Trạng thái</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredLogs.map((log) => {
                  const isRetrying = retryingLogIds.has(log.id);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLogForDetail(log)}
                    >
                      {/* Thời điểm gửi theo Asia/Ho_Chi_Minh (AC 1) */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatVietnamDateTime(log.sentAt)}</span>
                        </div>
                        {log.retryCount > 0 && (
                          <span className="text-[10px] text-amber-600 font-medium block mt-0.5">
                            Đã thử lại {log.retryCount} lần
                          </span>
                        )}
                      </td>

                      {/* Ứng viên nhận */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-slate-900">{log.candidateName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{log.candidateEmail}</div>
                        {log.jobTitle && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                            {log.jobTitle}
                          </span>
                        )}
                      </td>

                      {/* Mẫu email đã dùng (AC 1) */}
                      <td className="py-3.5 px-3.5">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {log.templateName}
                        </span>
                      </td>

                      {/* Tiêu đề & Đính kèm */}
                      <td className="py-3.5 px-3.5 max-w-[280px]">
                        <div className="font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition">
                          {log.subject}
                        </div>
                        {log.attachments && log.attachments.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 font-medium mt-0.5">
                            <Paperclip className="w-3 h-3" />
                            <span>{log.attachments.length} tệp đính kèm</span>
                          </span>
                        )}
                      </td>

                      {/* Người gửi (Recruiter) (AC 1) */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{log.senderName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{log.senderEmail}</div>
                      </td>

                      {/* Trạng thái gửi (Badge trực quan) (AC 1 & AC 2) */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        {isRetrying ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse border border-amber-200">
                            <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                            <span>Đang gửi lại...</span>
                          </span>
                        ) : log.status === 'SENT' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Thành công (Sent)</span>
                          </span>
                        ) : log.status === 'QUEUED' || log.status === 'PENDING' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Đang trong hàng đợi (Queued)</span>
                            </span>
                            {log.queueTrackingId && (
                              <span className="text-[10px] text-amber-700 block font-mono">
                                ID: {log.queueTrackingId}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Thất bại (Failed)</span>
                            </span>
                            {log.errorMessage && (
                              <p className="text-[10px] text-rose-600 max-w-[200px] truncate" title={log.errorMessage}>
                                {log.errorMessage}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Thao tác: Xem chi tiết & Nút Gửi lại (AC 3) */}
                      <td
                        className="py-3.5 px-3.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          {log.status === 'FAILED' && (
                            <button
                              type="button"
                              onClick={() => void handleRetrySingle(log)}
                              disabled={isRetrying}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Gửi lại email này qua hàng đợi ngầm"
                            >
                              {isRetrying ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3 h-3" />
                              )}
                              <span>Gửi lại</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedLogForDetail(log)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                            title="Xem chi tiết nội dung email"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Chi tiết</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ========================================================================= */
          /* CHẾ ĐỘ 2: DÒNG THỜI GIAN (TIMELINE VIEW - AC 1 & AC 2)                    */
          /* ========================================================================= */
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:inset-y-0 before:left-3 sm:before:left-4 before:w-0.5 before:bg-slate-200">
            {filteredLogs.map((log) => {
              const isRetrying = retryingLogIds.has(log.id);

              return (
                <div key={log.id} className="relative group">
                  {/* Icon Timeline Node */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                      log.status === 'SENT'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                        : log.status === 'QUEUED' || log.status === 'PENDING'
                        ? 'bg-amber-50 border-amber-500 text-amber-600'
                        : 'bg-rose-50 border-rose-500 text-rose-600'
                    }`}
                  >
                    {log.status === 'SENT' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : log.status === 'QUEUED' || log.status === 'PENDING' ? (
                      <Clock className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Card nội dung Timeline */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 hover:border-indigo-300 transition">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {log.templateName}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatVietnamDateTime(log.sentAt)}</span>
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                          {log.subject}
                        </h4>
                      </div>

                      {/* Trạng thái Badge */}
                      {isRetrying ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse border border-amber-200">
                          <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                          <span>Đang gửi lại...</span>
                        </span>
                      ) : log.status === 'SENT' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Thành công (Sent)</span>
                        </span>
                      ) : log.status === 'QUEUED' || log.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Đang trong hàng đợi (Queued)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Thất bại (Failed)</span>
                        </span>
                      )}
                    </div>

                    {/* Tóm tắt thông tin người nhận & người gửi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl text-slate-600">
                      <div>
                        <span className="text-[11px] text-slate-400 block font-semibold">Người nhận:</span>
                        <strong className="text-slate-900">{log.candidateName}</strong> ({log.candidateEmail})
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-semibold">Người gửi:</span>
                        <strong className="text-slate-900">{log.senderName}</strong> ({log.senderEmail})
                      </div>
                    </div>

                    {/* Chi tiết lỗi nếu thất bại */}
                    {log.status === 'FAILED' && log.errorMessage && (
                      <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-rose-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Nguyên nhân gửi thất bại:</span>
                        </div>
                        <p className="text-[11px] text-rose-700 leading-relaxed font-mono">
                          {log.errorMessage}
                        </p>
                      </div>
                    )}

                    {/* Hàng nút thao tác */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedLogForDetail(log)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem toàn bộ nội dung thư</span>
                      </button>

                      {log.status === 'FAILED' && (
                        <button
                          type="button"
                          onClick={() => void handleRetrySingle(log)}
                          disabled={isRetrying}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition cursor-pointer disabled:opacity-50"
                        >
                          {isRetrying ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                          <span>Gửi lại (Retry)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL XEM CHI TIẾT NỘI DUNG EMAIL (PREVIEW DETAIL MODAL)                 */}
      {/* ========================================================================= */}
      {selectedLogForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold">Chi tiết email đã gửi</h3>
                  <p className="text-[11px] text-slate-300">
                    Thời điểm: {formatVietnamDateTime(selectedLogForDetail.sentAt)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLogForDetail(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
                title="Đóng modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs">
              {/* Thẻ trạng thái & Mẫu thư */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold">Mẫu email:</span>
                  <strong className="text-slate-800 font-bold">
                    {selectedLogForDetail.templateName}
                  </strong>
                </div>

                <div>
                  {selectedLogForDetail.status === 'SENT' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Thành công (Sent)</span>
                    </span>
                  ) : selectedLogForDetail.status === 'QUEUED' || selectedLogForDetail.status === 'PENDING' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Đang trong hàng đợi (Queued)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Thất bại (Failed)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Chi tiết lỗi nếu thất bại */}
              {selectedLogForDetail.status === 'FAILED' && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Thông báo lỗi từ máy chủ thư điện tử (SMTP):</span>
                    </span>
                    {selectedLogForDetail.errorCode && (
                      <code className="px-2 py-0.5 rounded bg-rose-200/80 text-[10px] font-bold text-rose-900">
                        {selectedLogForDetail.errorCode}
                      </code>
                    )}
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed font-mono">
                    {selectedLogForDetail.errorMessage || 'Không xác định được nguyên nhân thất bại.'}
                  </p>
                </div>
              )}

              {/* Thông tin Header Email */}
              <div className="p-3.5 bg-slate-100/80 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-700">
                  <span>
                    Người gửi:{' '}
                    <strong className="text-slate-900 font-bold">
                      {selectedLogForDetail.senderName}
                    </strong>{' '}
                    &lt;{selectedLogForDetail.senderEmail}&gt;
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Múi giờ: Asia/Ho_Chi_Minh (GMT+7)
                  </span>
                </div>
                <div className="text-slate-700">
                  Người nhận:{' '}
                  <strong className="text-slate-900 font-bold">
                    {selectedLogForDetail.candidateName}
                  </strong>{' '}
                  &lt;{selectedLogForDetail.candidateEmail}&gt;
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block text-[11px] font-semibold">Tiêu đề:</span>
                  <div className="text-slate-900 font-bold text-xs mt-0.5 select-text">
                    {selectedLogForDetail.subject}
                  </div>
                </div>
              </div>

              {/* Nội dung thư (Email Body) */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700">Nội dung thư:</span>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap select-text font-sans min-h-[140px] max-h-[300px] overflow-y-auto">
                  {selectedLogForDetail.body}
                </div>
              </div>

              {/* Tệp đính kèm (nếu có) */}
              {selectedLogForDetail.attachments && selectedLogForDetail.attachments.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700">Tệp đính kèm:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedLogForDetail.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="truncate font-medium text-slate-700">{att.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">{att.size}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Mã định danh nhật ký: <code className="font-mono">{selectedLogForDetail.id}</code>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLogForDetail(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Đóng
                </button>

                {selectedLogForDetail.status === 'FAILED' && (
                  <button
                    type="button"
                    onClick={() => {
                      void handleRetrySingle(selectedLogForDetail);
                    }}
                    disabled={retryingLogIds.has(selectedLogForDetail.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/30 transition cursor-pointer disabled:opacity-50"
                  >
                    {retryingLogIds.has(selectedLogForDetail.id) ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    <span>Gửi lại ngay</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailAuditLogPage;
