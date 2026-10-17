import type { NotificationType } from '../types/notification';

/**
 * Định dạng thời gian tương đối bằng tiếng Việt
 * Jira Subtask: TKNHTTDNB1-541 - Thiết kế chuông và danh sách thông báo
 */
export const formatRelativeTimeVietnamese = (dateString: string): string => {
  try {
    const timestamp = new Date(dateString).getTime();
    if (isNaN(timestamp)) {
      return dateString;
    }

    const currentTimestamp = Date.now();
    const diffInMilliseconds = currentTimestamp - timestamp;

    if (diffInMilliseconds < 0) {
      return 'Vừa xong';
    }

    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    if (diffInMinutes < 1) {
      return 'Vừa xong';
    }
    if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return 'Hôm qua';
    }
    if (diffInDays < 7) {
      return `${diffInDays} ngày trước`;
    }

    const targetDate = new Date(timestamp);
    const day = targetDate.getDate().toString().padStart(2, '0');
    const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    const year = targetDate.getFullYear();
    const hours = targetDate.getHours().toString().padStart(2, '0');
    const minutes = targetDate.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
};

/**
 * Cấu hình style màu sắc và icon cho từng loại thông báo
 */
export interface NotificationTypeStyle {
  label: string;
  badgeBg: string;
  badgeText: string;
  iconBg: string;
  iconColor: string;
}

export const NOTIFICATION_TYPE_STYLES: Record<NotificationType, NotificationTypeStyle> = {
  OFFER: {
    label: 'Đề nghị tuyển dụng',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/60',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  INTERVIEW: {
    label: 'Lịch phỏng vấn',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/60',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  CANDIDATE: {
    label: 'Hồ sơ ứng viên',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/60',
    badgeText: 'text-purple-700 dark:text-purple-300',
    iconBg: 'bg-purple-100 dark:bg-purple-900/60',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  SLA_WARNING: {
    label: 'Cảnh báo SLA',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60',
    badgeText: 'text-rose-700 dark:text-rose-300',
    iconBg: 'bg-rose-100 dark:bg-rose-900/60',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  JOB_POSTING: {
    label: 'Tin tuyển dụng',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
    iconBg: 'bg-amber-100 dark:bg-amber-900/60',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  SYSTEM: {
    label: 'Hệ thống',
    badgeBg: 'bg-slate-50 dark:bg-slate-800/60',
    badgeText: 'text-slate-700 dark:text-slate-300',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    iconColor: 'text-slate-600 dark:text-slate-400',
  },
};
