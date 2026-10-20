import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Send,
  PlusCircle,
  Globe,
  RefreshCw,
  Search,
  Filter,
  Check,
  Building,
  Mail,
  Calendar,
  Layers,
  ArrowRight,
  MessageSquare,
  Lock,
} from 'lucide-react';
import {
  jobPostingService,
  formatAuditDateTime,
  type JobPostingData,
  type JobPostingAuditLog,
  type JobPostingAuditAction,
  type JobPostingStatus,
} from '../../services/jobPostingService';

export interface JobPostingAuditHistoryProps {
  postingId?: string;
  posting?: JobPostingData;
  initialLogs?: JobPostingAuditLog[];
  onRefresh?: () => void;
  className?: string;
}

/**
 * Trả về cấu hình hiển thị (icon, màu sắc) cho từng loại hành động
 */
const getActionDisplayConfig = (action: JobPostingAuditAction) => {
  switch (action) {
    case 'CREATED':
      return {
        icon: PlusCircle,
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        badgeBg: 'bg-blue-100 text-blue-800',
        label: 'Tạo tin tuyển dụng',
      };
    case 'UPDATED':
      return {
        icon: Layers,
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        badgeBg: 'bg-indigo-100 text-indigo-800',
        label: 'Cập nhật nội dung',
      };
    case 'SUBMITTED':
      return {
        icon: Send,
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        badgeBg: 'bg-purple-100 text-purple-800',
        label: 'Gửi yêu cầu duyệt',
      };
    case 'APPROVED':
    case 'PUBLISHED':
      return {
        icon: CheckCircle2,
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        badgeBg: 'bg-emerald-100 text-emerald-800',
        label: 'Duyệt & Xuất bản',
      };
    case 'REJECTED':
      return {
        icon: AlertCircle,
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        badgeBg: 'bg-rose-100 text-rose-800',
        label: 'Từ chối tin tuyển dụng',
      };
    case 'REVISION_REQUESTED':
      return {
        icon: RotateCcw,
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        badgeBg: 'bg-amber-100 text-amber-800',
        label: 'Yêu cầu chỉnh sửa',
      };
    case 'CLOSED':
      return {
        icon: Lock,
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-300',
        badgeBg: 'bg-slate-200 text-slate-800',
        label: 'Đóng tin tuyển dụng',
      };
    default:
      return {
        icon: Clock,
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        badgeBg: 'bg-slate-100 text-slate-800',
        label: 'Thao tác hệ thống',
      };
  }
};

/**
 * Trả về nhãn trạng thái tiếng Việt
 */
const getStatusLabel = (status?: JobPostingStatus): string => {
  switch (status) {
    case 'DRAFT':
      return 'Bản nháp';
    case 'PENDING_APPROVAL':
      return 'Chờ phê duyệt';
    case 'APPROVED':
      return 'Đã phê duyệt';
    case 'PUBLISHED':
      return 'Đã xuất bản';
    case 'REJECTED':
      return 'Đã từ chối';
    case 'REVISION_REQUESTED':
      return 'Yêu cầu sửa';
    case 'CLOSED':
      return 'Đã đóng';
    default:
      return status || '';
  }
};

export const JobPostingAuditHistory: React.FC<JobPostingAuditHistoryProps> = ({
  postingId,
  posting,
  initialLogs,
  onRefresh,
  className = '',
}) => {
  const [logs, setLogs] = useState<JobPostingAuditLog[]>(initialLogs || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Hàm tải dữ liệu lịch sử kiểm toán từ API (AC2 & AC3)
  const fetchAuditLogs = useCallback(
    async (isManualRefresh = false) => {
      const targetId = postingId || posting?.id;
      if (!targetId) return;

      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const data = await jobPostingService.getJobPostingAuditHistory(targetId);
        setLogs(data);
        if (onRefresh && isManualRefresh) {
          onRefresh();
        }
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Không thể tải lịch sử kiểm toán của tin tuyển dụng.';
        setError(errorMsg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [postingId, posting?.id, onRefresh]
  );

  useEffect(() => {
    if (initialLogs && initialLogs.length > 0) {
      setLogs(initialLogs);
      return;
    }
    if (postingId || posting?.id) {
      void fetchAuditLogs();
    }
  }, [postingId, posting?.id, initialLogs, fetchAuditLogs]);

  // Đồng bộ nếu posting có auditLogs cập nhật
  useEffect(() => {
    if (posting?.auditLogs && posting.auditLogs.length > 0) {
      setLogs(posting.auditLogs);
    }
  }, [posting?.auditLogs]);

  // Bộ lọc log theo hành động và từ khóa
  const filteredLogs = logs.filter((log) => {
    const matchAction = filterAction === 'ALL' || log.action === filterAction;
    const matchKeyword =
      !searchKeyword.trim() ||
      log.actionName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      log.actor.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      log.actor.email.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (log.note && log.note.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchAction && matchKeyword;
  });

  // Thông tin người tạo / người đăng
  const creator = posting?.createdBy || {
    id: 'usr-hr-001',
    name: 'Nguyễn Văn Minh',
    email: 'minh.nguyen@company.com',
    role: 'Chuyên viên Tuyển dụng (Recruiter)',
    department: posting?.departmentName || 'Ban Nhân sự',
  };

  // Thông tin người duyệt / xuất bản (AC2: Ai đã duyệt, thời gian duyệt/xuất bản)
  const isPublished = posting?.status === 'PUBLISHED' || posting?.status === 'APPROVED';
  const approver = posting?.publishedBy || {
    id: 'usr-mgr-002',
    name: posting?.reviewedBy || 'Trần Thị Thu Hà',
    email: 'ha.tran@company.com',
    role: 'Trưởng phòng Tuyển dụng & Đãi ngộ',
    department: 'Ban Quản trị Nguồn nhân lực',
  };
  const approvalTime = posting?.publishedAt || posting?.reviewedAt || posting?.updatedAt;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header & Summary Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              Lịch Sử Người Đăng &amp; Tiến Trình Phê Duyệt
            </h2>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
              {logs.length} sự kiện
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Theo dõi vết kiểm toán (Audit Trail) chi tiết: người khởi tạo, thời gian đăng tin, cấp phê duyệt và các lần chuyển đổi trạng thái.
          </p>
        </div>

        {/* Nút Refresh & Reload */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchAuditLogs(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-98 disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
            title="Tải lại lịch sử kiểm toán mới nhất"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`}
            />
            <span>{isRefreshing ? 'Đang làm mới...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {/* 2. Publisher & Approver Highlight Cards (AC2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Thẻ Người Tạo / Người Đăng */}
        <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50/70 p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <User className="h-4 w-4" />
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Người đăng tin (Creator / Publisher)
                </span>
                <h3 className="text-sm font-bold text-slate-900">{creator.name}</h3>
              </div>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 border border-blue-200">
              Khởi tạo
            </span>
          </div>

          <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{creator.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{creator.role || 'Chuyên viên tuyển dụng'} • {creator.department || 'Nhân sự'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>
                Thời gian tạo: <strong>{formatAuditDateTime(posting?.createdAt || logs[0]?.timestamp).formatted}</strong>
              </span>
            </div>
          </div>

          {/* Kênh phát hành */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-400">Kênh đã cấu hình:</span>
            {posting?.publishInternal && (
              <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 border border-indigo-100">
                <Lock className="h-2.5 w-2.5" /> Cổng nội bộ
              </span>
            )}
            {posting?.publishCareerPage && (
              <span className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-0.5 font-medium text-teal-700 border border-teal-100">
                <Globe className="h-2.5 w-2.5" /> Trang nghề nghiệp
              </span>
            )}
          </div>
        </div>

        {/* Thẻ Cấp Phê Duyệt Xuất Bản */}
        <div className={`rounded-2xl border p-5 shadow-xs relative overflow-hidden ${
          isPublished
            ? 'border-emerald-200 bg-linear-to-br from-white to-emerald-50/40'
            : 'border-slate-200 bg-linear-to-br from-white to-slate-50/50'
        }`}>
          <div className={`absolute top-0 right-0 h-16 w-16 rounded-bl-full pointer-events-none ${
            isPublished ? 'bg-emerald-500/10' : 'bg-slate-400/5'
          }`} />
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  isPublished ? 'text-emerald-700' : 'text-slate-500'
                }`}>
                  Người phê duyệt (Approver / Authority)
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {isPublished ? approver.name : 'Đang chờ phê duyệt'}
                </h3>
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold border ${
              isPublished
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {isPublished ? 'Đã duyệt xuất bản' : 'Chờ cấp quản lý'}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{isPublished ? approver.email : 'hoptuyendung@company.com'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{isPublished ? approver.role : 'Hội đồng tuyển dụng / Giám đốc Nhân sự'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>
                Thời gian duyệt:{' '}
                <strong>
                  {isPublished ? formatAuditDateTime(approvalTime).formatted : 'Chưa có thông tin'}
                </strong>
              </span>
            </div>
          </div>

          {/* Ghi chú duyệt */}
          {posting?.approvalNote && (
            <div className="mt-3.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-2.5 text-xs text-emerald-900">
              <span className="font-bold">Ghi chú:</span> {posting.approvalNote}
            </div>
          )}
        </div>
      </div>

      {/* 3. Error Alert (AC3) */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void fetchAuditLogs(true)}
            className="rounded-lg bg-rose-600 px-3 py-1 font-bold text-white hover:bg-rose-700 active:scale-98 transition-all"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 4. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm theo người thực hiện, hành động hoặc ghi chú..."
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Action Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-hidden"
            aria-label="Lọc theo loại hành động"
          >
            <option value="ALL">Tất cả hành động ({logs.length})</option>
            <option value="CREATED">Tạo tin tuyển dụng</option>
            <option value="SUBMITTED">Gửi duyệt</option>
            <option value="PUBLISHED">Duyệt xuất bản</option>
            <option value="REVISION_REQUESTED">Yêu cầu sửa</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>
      </div>

      {/* 5. Audit Log Timeline (AC2) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-600" />
          Dòng thời gian sự kiện (Audit Trail Timeline)
        </h3>

        {/* Loading State (AC3) */}
        {isLoading ? (
          <div className="space-y-6 py-6" role="status">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="flex gap-4 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                  <div className="h-10 w-full rounded bg-slate-50" />
                </div>
              </div>
            ))}
            <span className="sr-only">Đang tải lịch sử kiểm toán...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          /* Empty State */
          <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
            <Clock className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">
              {logs.length === 0
                ? 'Chưa ghi nhận sự kiện kiểm toán nào cho tin tuyển dụng này.'
                : 'Không có sự kiện nào phù hợp với bộ lọc tìm kiếm.'}
            </p>
            {logs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFilterAction('ALL');
                  setSearchKeyword('');
                }}
                className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        ) : (
          /* Timeline Events List */
          <div className="relative pl-6 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            <div className="space-y-8">
              {filteredLogs.map((log, index) => {
                const config = getActionDisplayConfig(log.action);
                const IconComponent = config.icon;
                const time = formatAuditDateTime(log.timestamp);
                const isLatest = index === 0;

                return (
                  <div key={log.id || index} className="relative group">
                    {/* Node Icon on Timeline */}
                    <div
                      className={`absolute -left-6 top-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-2xs ring-2 ring-slate-100 transition-all group-hover:scale-110 ${config.bg} ${config.text}`}
                    >
                      <IconComponent className="h-3.5 w-3.5" />
                    </div>

                    {/* Event Content Card */}
                    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-slate-300 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-bold ${config.badgeBg}`}
                          >
                            {log.actionName || config.label}
                          </span>
                          {isLatest && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              Mới nhất
                            </span>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{time.formatted}</span>
                          {time.relative && (
                            <span className="text-[11px] text-slate-400">({time.relative})</span>
                          )}
                        </div>
                      </div>

                      {/* Actor Information */}
                      <div className="flex items-center gap-2 text-xs text-slate-700 mt-2">
                        <span className="font-semibold text-slate-900">{log.actor.name}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">{log.actor.email}</span>
                        {log.actor.role && (
                          <>
                            <span className="text-slate-400">•</span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                              {log.actor.role}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Status Transition (nếu có) */}
                      {(log.fromStatus || log.toStatus) && (
                        <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-slate-400">Trạng thái:</span>
                          <span className="rounded bg-white px-2 py-0.5 border border-slate-200">
                            {getStatusLabel(log.fromStatus)}
                          </span>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                          <span className="rounded bg-indigo-50 px-2 py-0.5 text-indigo-700 border border-indigo-200">
                            {getStatusLabel(log.toStatus)}
                          </span>
                        </div>
                      )}

                      {/* Note / Feedback Comment */}
                      {log.note && (
                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50/80 p-3 text-xs text-slate-700 border border-slate-100">
                          <MessageSquare className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <div className="leading-relaxed">
                            <span className="font-bold text-slate-900">Ghi chú:</span> {log.note}
                          </div>
                        </div>
                      )}

                      {/* Channels Indicator in metadata */}
                      {log.metadata?.channels && log.metadata.channels.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                          <span>Kênh xuất bản:</span>
                          {log.metadata.channels.map((chan, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-slate-700 font-medium"
                            >
                              <Check className="h-2.5 w-2.5 text-emerald-600" /> {chan}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobPostingAuditHistory;
