import React from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Lock,
  Clock,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import type {
  OfferApprovalHistoryItem,
  OfferApprovalHistoryAction,
} from '../../types/offer';

export interface OfferApprovalHistoryTimelineProps {
  timelineItems?: OfferApprovalHistoryItem[];
  containerClassName?: string;
  emptyMessage?: string;
}

/**
 * Định dạng cấu hình hiển thị theo từng loại hành động duyệt
 */
interface ActionStyleConfig {
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}

const ACTION_STYLE_CONFIG: Record<OfferApprovalHistoryAction, ActionStyleConfig> = {
  APPROVE: {
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-600 text-white',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  REJECT: {
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60',
    badgeText: 'text-rose-800 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-800',
    iconBg: 'bg-rose-600 text-white',
    iconColor: 'text-rose-600 dark:text-rose-400',
    icon: <XCircle className="h-4 w-4" />,
  },
  REQUEST_CHANGE: {
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeText: 'text-amber-800 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-500 text-white',
    iconColor: 'text-amber-600 dark:text-amber-400',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  SUBMIT: {
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    badgeText: 'text-indigo-800 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800',
    iconBg: 'bg-indigo-600 text-white',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    icon: <Send className="h-3.5 w-3.5" />,
  },
};

/**
 * Format thời gian theo định dạng ngày giờ Việt Nam chuẩn ISO
 */
const formatTimelineTimestamp = (rawTimestamp: string): string => {
  try {
    const dateObject = new Date(rawTimestamp);
    if (isNaN(dateObject.getTime())) {
      return rawTimestamp;
    }
    return dateObject.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return rawTimestamp;
  }
};

/**
 * Component hiển thị dòng thời gian (Timeline) lịch sử phê duyệt đề nghị tuyển dụng
 * Jira Subtask: TKNHTTDNB1-499 - Tích hợp nhận xét và lịch sử phê duyệt offer (Story TKNHTTDNB1-72)
 *
 * YÊU CẦU ĐẶC BIỆT (AC 2):
 * - Toàn bộ dữ liệu hiển thị ở chế độ READ-ONLY (Chỉ xem).
 * - TUYỆT ĐỐI KHÔNG CUNG CẤP BẤT KỲ NÚT XÓA HAY CHỈNH SỬA NHẬN XÉT NÀO.
 *   Lý do: Đảm bảo tính toàn vẹn kiểm toán (audit compliance), chống giả mạo hồ sơ tuyển dụng
 *   và lưu vết pháp lý chính xác cho mọi quyết định nhân sự trong doanh nghiệp.
 */
export const OfferApprovalHistoryTimeline: React.FC<OfferApprovalHistoryTimelineProps> = ({
  timelineItems = [],
  containerClassName = '',
  emptyMessage = 'Chưa có bản ghi lịch sử phê duyệt nào cho đề nghị này.',
}) => {
  return (
    <div
      data-testid="approval-history-timeline-container"
      className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900 ${containerClassName}`}
    >
      {/* 1. Header Khối Lịch Sử */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 dark:border-gray-800 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
              <span>Lịch Sử Phê Duyệt & Ý Kiến Nhận Xét (AC 2)</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Nhật ký kiểm toán lưu vết tiến trình xử lý và phản hồi của từng cấp thẩm định
            </p>
          </div>
        </div>

        {/* Huy hiệu bảo đảm Read-only / Immutable */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span
            data-testid="badge-timeline-readonly-lock"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300"
            title="Dữ liệu lịch sử đã được khóa bảo mật, không thể chỉnh sửa hoặc xóa bỏ"
          >
            <Lock className="h-3 w-3 text-slate-500" />
            <span>Bản ghi bất biến (Read-only)</span>
          </span>
        </div>
      </div>

      {/* 2. Banner Thông Báo Kiểm Toán & Tính Toàn Vẹn Dữ Liệu */}
      {/*
        TẠI SAO DÒNG THỜI GIAN NÀY KHÔNG CÓ NÚT SỬA/XÓA?
        Theo chuẩn ISO 27001 và quy chế quản trị nhân sự, mọi ý kiến phê duyệt / từ chối
        đều cấu thành căn cứ pháp lý tuyển dụng. Việc khóa chỉnh sửa đảm bảo không bên nào
        có thể can thiệp làm sai lệch nhật ký kiểm toán sau khi đã đưa ra quyết định.
      */}
      <div
        data-testid="timeline-readonly-audit-notice"
        className="mb-6 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-300"
      >
        <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold block mb-0.5">
            Lưu ý kiểm toán nội bộ (Audit Compliance):
          </strong>
          Các ý kiến nhận xét và mốc thời gian bên dưới được hệ thống ghi nhận tự động và khóa cố định
          (Read-only). Không một cá nhân nào có quyền thay đổi hoặc xóa bỏ các nội dung này.
        </div>
      </div>

      {/* 3. Danh Sách Các Node Timeline */}
      {timelineItems.length === 0 ? (
        <div
          data-testid="timeline-empty-state"
          className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400"
        >
          <Clock className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-indigo-400 before:via-gray-200 before:to-gray-200 dark:before:from-indigo-600 dark:before:via-gray-800 dark:before:to-gray-800">
          {timelineItems.map((historyItem, historyIndex) => {
            const styleConfig =
              ACTION_STYLE_CONFIG[historyItem.action] || ACTION_STYLE_CONFIG.SUBMIT;

            return (
              <div
                key={historyItem.historyId || `history-item-${historyIndex}`}
                data-testid={`timeline-history-node-${historyItem.historyId || historyIndex}`}
                className="relative group"
              >
                {/* Dot Icon đánh dấu node trên đường thẳng timeline */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full shadow-md ${styleConfig.iconBg} ring-4 ring-white dark:ring-gray-900 transition-transform group-hover:scale-110`}
                >
                  {styleConfig.icon}
                </div>

                {/* Nội dung chi tiết của bản ghi */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 shadow-2xs transition-all hover:bg-gray-50 dark:border-gray-800/80 dark:bg-gray-850/60 dark:hover:bg-gray-800/40">
                  {/* Dòng 1: Tên người duyệt + Badge Thao tác + Thời gian xử lý */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-xs">
                        {historyItem.actorName ? historyItem.actorName.charAt(0) : 'U'}
                      </div>
                      <div>
                        <span
                          data-testid={`timeline-actor-name-${historyIndex}`}
                          className="text-xs font-bold text-gray-900 dark:text-white block sm:inline"
                        >
                          {historyItem.actorName}
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 sm:ml-2">
                          ({historyItem.actorRole})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Badge Thao tác (Duyệt / Từ chối / Yêu cầu sửa / Tạo) */}
                      <span
                        data-testid={`timeline-action-badge-${historyIndex}`}
                        className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-[11px] font-bold ${styleConfig.badgeBg} ${styleConfig.badgeText} ${styleConfig.badgeBorder}`}
                      >
                        {historyItem.actionLabel}
                      </span>

                      {/* Thời gian xử lý */}
                      <span
                        data-testid={`timeline-timestamp-${historyIndex}`}
                        className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 font-mono"
                      >
                        <Clock className="h-3 w-3" />
                        {formatTimelineTimestamp(historyItem.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Cấp thẩm định nếu có */}
                  {historyItem.stepName && (
                    <div className="mb-2.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                      Giai đoạn: Cấp {historyItem.stepOrder || 1} - {historyItem.stepName}
                    </div>
                  )}

                  {/* Dòng 2: Khối Ý kiến nhận xét chi tiết (Comment Text) */}
                  <div
                    data-testid={`timeline-comment-card-${historyIndex}`}
                    className="rounded-lg border border-gray-200/70 bg-white p-3 text-xs text-gray-800 shadow-2xs dark:border-gray-700/60 dark:bg-gray-900 dark:text-gray-200"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>Ý kiến nhận xét:</span>
                    </div>
                    <p
                      data-testid={`timeline-comment-${historyIndex}`}
                      className="italic leading-relaxed whitespace-pre-line pl-2 border-l-2 border-indigo-400 dark:border-indigo-600"
                    >
                      "{historyItem.comment}"
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OfferApprovalHistoryTimeline;
