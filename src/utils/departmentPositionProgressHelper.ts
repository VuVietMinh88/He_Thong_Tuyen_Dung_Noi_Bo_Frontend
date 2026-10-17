import type { CandidateProfile } from '../types/candidate';
import {
  normalizeCandidateStage,
} from '../services/slaService';
import type {
  JobPostingData,
} from '../services/jobPostingService';
import type {
  PageResult,
  Requisition,
} from '../services/business.service';

export type DepartmentPositionStatus = 'OPEN' | 'PAUSED' | 'COMPLETED';
export type DepartmentPositionStatusFilter = 'ALL' | DepartmentPositionStatus;

export interface DepartmentPositionProgressRow {
  id: string;
  title: string;
  headcount: number;
  receivedCvs: number;
  approvedCvs: number;
  hired: number;
  progressPercent: number;
  status: DepartmentPositionStatus;
}

export const collectDepartmentRequisitions = async (
  loadPage: (page: number) => Promise<PageResult<Requisition>>,
): Promise<Requisition[]> => {
  const firstPage = await loadPage(0);
  const pages = await Promise.all(
    Array.from(
      { length: Math.max(0, firstPage.totalPages - 1) },
      (_, index) => loadPage(index + 1),
    ),
  );
  return [firstPage, ...pages].flatMap((page) => page.items);
};

export const buildDepartmentPositionProgress = (
  requisitions: Requisition[],
  postings: JobPostingData[],
  candidates: CandidateProfile[],
  departmentId: string,
): DepartmentPositionProgressRow[] => {
  const scopedRequisitions = requisitions.filter(
    (requisition) => requisition.departmentId === departmentId,
  );
  const postingsByRequisition = new Map<string, JobPostingData[]>();
  postings.forEach((posting) => {
    if (!posting.requisitionId) return;
    const linkedPostings = postingsByRequisition.get(posting.requisitionId) ?? [];
    linkedPostings.push(posting);
    postingsByRequisition.set(posting.requisitionId, linkedPostings);
  });

  return scopedRequisitions.flatMap((requisition) => {
    const linkedPostings = postingsByRequisition.get(requisition.id) ?? [];
    const normalizedStatus = requisition.status.trim().toUpperCase();
    if (normalizedStatus === 'CANCELLED' || normalizedStatus === 'DRAFT'
      || normalizedStatus === 'PENDING_APPROVAL' || normalizedStatus === 'REJECTED') {
      return [];
    }

    const postingIds = new Set(
      linkedPostings
        .map((posting) => posting.id)
        .filter((id): id is string => Boolean(id)),
    );
    const relatedCandidates = candidates.filter((candidate) =>
      candidate.appliedJobId === requisition.id
      || (candidate.appliedJobId !== undefined && postingIds.has(candidate.appliedJobId)),
    );
    const hired = relatedCandidates.filter(
      (candidate) => normalizeCandidateStage(candidate.status) === 'HIRED',
    ).length;
    const approvedCvs = relatedCandidates.filter((candidate) => {
      const stage = normalizeCandidateStage(candidate.status);
      return stage === 'SCREENING' || stage === 'INTERVIEWING' || stage === 'OFFER' || stage === 'HIRED';
    }).length;
    const headcount = Math.max(0, requisition.headcount);
    const hasClosedPosting = linkedPostings.some((posting) => posting.status === 'CLOSED');
    const hasOpenPosting = linkedPostings.some((posting) => posting.status === 'PUBLISHED');
    const isPaused = ['PAUSED', 'ON_HOLD', 'SUSPENDED'].includes(normalizedStatus)
      || (hasClosedPosting && !['FILLED'].includes(normalizedStatus));
    const status: DepartmentPositionStatus = normalizedStatus === 'FILLED'
      || (headcount > 0 && hired >= headcount)
      ? 'COMPLETED'
      : isPaused
        ? 'PAUSED'
        : hasOpenPosting || ['APPROVED', 'OPEN'].includes(normalizedStatus)
          ? 'OPEN'
          : 'PAUSED';

    return [{
      id: requisition.id,
      title: linkedPostings[0]?.positionTitle
        || linkedPostings[0]?.title
        || `Vị trí ${requisition.positionId}`,
      headcount,
      receivedCvs: relatedCandidates.length,
      approvedCvs,
      hired,
      progressPercent: headcount === 0
        ? 0
        : Math.min(100, Math.round((hired / headcount) * 100)),
      status,
    }];
  });
};

export const filterDepartmentPositionProgress = (
  rows: DepartmentPositionProgressRow[],
  keyword: string,
  status: DepartmentPositionStatusFilter,
): DepartmentPositionProgressRow[] => {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase('vi');
  return rows.filter((row) => {
    const matchesKeyword = !normalizedKeyword
      || row.title.toLocaleLowerCase('vi').includes(normalizedKeyword);
    return matchesKeyword && (status === 'ALL' || row.status === status);
  });
};
