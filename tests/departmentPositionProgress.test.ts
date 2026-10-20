import { describe, expect, it } from 'vitest';
import type { CandidateProfile } from '../src/types/candidate';
import type { JobPostingData } from '../src/services/jobPostingService';
import type { PageResult, Requisition } from '../src/services/business.service';
import {
  buildDepartmentPositionProgress,
  collectDepartmentRequisitions,
  filterDepartmentPositionProgress,
} from '../src/utils/departmentPositionProgressHelper';

const requisition = (overrides: Partial<Requisition> = {}): Requisition => ({
  id: 'req-1',
  positionId: 'position-1',
  departmentId: 'dept-a',
  headcount: 5,
  reason: 'NEW_HEADCOUNT',
  proposedSalaryMin: null,
  proposedSalaryMax: null,
  salaryJustification: null,
  neededBy: null,
  jobDescription: null,
  candidateRequirements: null,
  status: 'OPEN',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  ...overrides,
});

const posting: JobPostingData = {
  id: 'posting-1',
  requisitionId: 'req-1',
  title: 'Kỹ sư Frontend',
  positionTitle: 'Kỹ sư Frontend',
  departmentId: 'dept-a',
  departmentName: 'Công nghệ',
  workLocation: 'Hà Nội',
  employmentType: 'FULL_TIME',
  level: 'SENIOR',
  headcount: 5,
  deadline: '2026-12-31',
  salaryType: 'RANGE',
  currency: 'VND',
  jobDescription: '',
  requirements: '',
  benefits: '',
  skills: [],
  status: 'PUBLISHED',
  publishInternal: true,
  publishCareerPage: true,
};

const candidate = (id: string, status: string): CandidateProfile => ({
  id,
  fullName: `Ứng viên ${id}`,
  email: `${id}@example.com`,
  phone: '0900000000',
  appliedJobId: 'posting-1',
  cvParsingStatus: 'CONFIRMED',
  status,
});

describe('buildDepartmentPositionProgress', () => {
  it('counts only candidates linked to each requisition and scopes rows by department', () => {
    const rows = buildDepartmentPositionProgress(
      [
        requisition(),
        requisition({ id: 'req-other', departmentId: 'dept-b' }),
      ],
      [posting],
      [
        candidate('hired', 'HIRED'),
        candidate('screening', 'SCREENING'),
        candidate('new', 'NEW'),
        { ...candidate('unrelated', 'HIRED'), appliedJobId: 'different-posting' },
      ],
      'dept-a',
    );

    expect(rows).toEqual([
      {
        id: 'req-1',
        title: 'Kỹ sư Frontend',
        headcount: 5,
        receivedCvs: 3,
        approvedCvs: 2,
        hired: 1,
        progressPercent: 20,
        status: 'OPEN',
      },
    ]);
  });

  it('marks a position complete when its approved headcount is filled', () => {
    const rows = buildDepartmentPositionProgress(
      [requisition({ headcount: 1 })],
      [posting],
      [candidate('hired', 'HIRED')],
      'dept-a',
    );

    expect(rows[0].progressPercent).toBe(100);
    expect(rows[0].status).toBe('COMPLETED');
  });

  it('filters rows by search text and status', () => {
    const rows = buildDepartmentPositionProgress(
      [requisition(), requisition({ id: 'req-2', status: 'PAUSED' })],
      [posting, { ...posting, id: 'posting-2', requisitionId: 'req-2', positionTitle: 'Kỹ sư Backend' }],
      [],
      'dept-a',
    );

    expect(filterDepartmentPositionProgress(rows, 'kỹ sư', 'PAUSED').map((row) => row.id))
      .toEqual(['req-2']);
  });
});

describe('collectDepartmentRequisitions', () => {
  it('loads each page of requisitions', async () => {
    const pages: Array<PageResult<Requisition>> = [
      { items: [requisition()], page: 0, size: 1, totalElements: 2, totalPages: 2 },
      {
        items: [requisition({ id: 'req-2' })],
        page: 1,
        size: 1,
        totalElements: 2,
        totalPages: 2,
      },
    ];

    await expect(collectDepartmentRequisitions(async (page) => pages[page]))
      .resolves.toEqual([requisition(), requisition({ id: 'req-2' })]);
  });
});
