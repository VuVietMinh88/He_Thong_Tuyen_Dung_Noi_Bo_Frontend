import type { CandidateProfile } from '../types/candidate';
import type { SlaSettings } from '../types/sla';
import {
  checkJobDeadlineStatus,
  type JobPostingData,
} from '../services/jobPostingService';
import { slaService } from '../services/slaService';

export type DashboardTrendRange = 'WEEKLY' | 'MONTHLY';

export interface RecruitmentTrendPoint {
  bucket: string;
  label: string;
  applications: number;
}

export interface DashboardActionItem {
  id: string;
  title: string;
  detail: string;
  kind: 'CANDIDATE' | 'JOB_POSTING';
  priority: 'OVERDUE' | 'DUE_SOON';
  priorityLabel: string;
  href: string;
  sortDays: number;
}

const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStartOfWeek = (date: Date): Date => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
};

const formatBucketLabel = (date: Date, range: DashboardTrendRange): string =>
  new Intl.DateTimeFormat('vi-VN', range === 'WEEKLY'
    ? { day: '2-digit', month: '2-digit' }
    : { month: 'short' },
  ).format(date);

export const buildRecruitmentTrend = (
  candidates: CandidateProfile[],
  range: DashboardTrendRange,
  referenceDate = new Date(),
): RecruitmentTrendPoint[] => {
  const buckets: RecruitmentTrendPoint[] = [];
  const bucketIndexes = new Map<string, number>();

  if (range === 'WEEKLY') {
    const currentWeek = getStartOfWeek(referenceDate);
    for (let offset = 7; offset >= 0; offset -= 1) {
      const weekStart = new Date(currentWeek);
      weekStart.setDate(weekStart.getDate() - offset * 7);
      const bucket = getLocalDateKey(weekStart);
      bucketIndexes.set(bucket, buckets.length);
      buckets.push({
        bucket,
        label: formatBucketLabel(weekStart, range),
        applications: 0,
      });
    }
  } else {
    const currentMonthStart = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      1,
    );
    for (let offset = 5; offset >= 0; offset -= 1) {
      const monthStart = new Date(
        currentMonthStart.getFullYear(),
        currentMonthStart.getMonth() - offset,
        1,
      );
      const bucket = getLocalDateKey(monthStart).slice(0, 7);
      bucketIndexes.set(bucket, buckets.length);
      buckets.push({
        bucket,
        label: formatBucketLabel(monthStart, range),
        applications: 0,
      });
    }
  }

  candidates.forEach((candidate) => {
    if (!candidate.appliedAt) return;
    const appliedAt = new Date(candidate.appliedAt);
    if (Number.isNaN(appliedAt.getTime())) return;

    const bucket = range === 'WEEKLY'
      ? getLocalDateKey(getStartOfWeek(appliedAt))
      : getLocalDateKey(appliedAt).slice(0, 7);
    const bucketIndex = bucketIndexes.get(bucket);
    if (bucketIndex !== undefined) buckets[bucketIndex].applications += 1;
  });

  return buckets;
};

export const getDashboardActionItems = (
  candidates: CandidateProfile[],
  postings: JobPostingData[],
  slaSettings: SlaSettings,
  referenceDate = new Date(),
): DashboardActionItem[] => {
  const items: DashboardActionItem[] = [];

  candidates.forEach((candidate) => {
    const evaluation = slaService.calculateCandidateSla(
      candidate,
      slaSettings,
      referenceDate.getTime(),
    );
    if (!evaluation.isOverdue && !evaluation.isWarning) return;

    items.push({
      id: `candidate-${candidate.id}`,
      title: candidate.fullName,
      detail: `${evaluation.stageName} · ${evaluation.isOverdue
        ? `Quá hạn ${evaluation.overdueDays} ngày`
        : `Còn ${evaluation.remainingDays} ngày đến hạn`}`,
      kind: 'CANDIDATE',
      priority: evaluation.isOverdue ? 'OVERDUE' : 'DUE_SOON',
      priorityLabel: evaluation.isOverdue ? 'Quá hạn' : 'Sắp đến hạn',
      href: `/candidates/${encodeURIComponent(candidate.id)}`,
      sortDays: evaluation.isOverdue ? evaluation.overdueDays : -evaluation.remainingDays,
    });
  });

  postings.forEach((posting) => {
    if (posting.status !== 'PUBLISHED' || !posting.deadline) return;
    const deadline = checkJobDeadlineStatus(posting.deadline, referenceDate);
    if (!deadline.isExpired && !deadline.isClosingSoon) return;
    const isExpired = deadline.isExpired;
    const dayCount = Math.abs(deadline.daysRemaining ?? 0);
    items.push({
      id: `posting-${posting.id ?? posting.title}`,
      title: posting.title,
      detail: isExpired
        ? `Tin tuyển dụng đã hết hạn ${dayCount} ngày`
        : deadline.daysRemaining === 0
          ? 'Hạn tuyển dụng kết thúc hôm nay'
          : `Còn ${deadline.daysRemaining} ngày đến hạn tuyển dụng`,
      kind: 'JOB_POSTING',
      priority: isExpired ? 'OVERDUE' : 'DUE_SOON',
      priorityLabel: isExpired ? 'Đã hết hạn' : 'Sắp hết hạn',
      href: '/job-postings',
      sortDays: isExpired ? dayCount : -(deadline.daysRemaining ?? 0),
    });
  });

  return items.sort((left, right) => right.sortDays - left.sortDays);
};
