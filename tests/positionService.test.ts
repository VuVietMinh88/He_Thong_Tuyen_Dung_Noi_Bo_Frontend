import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CandidateProfile } from '../src/types/candidate';
import type { JobPostingData } from '../src/services/jobPostingService';
import type { PageResult, Requisition } from '../src/services/business.service';
import { businessService } from '../src/services/business.service';
import { jobPostingService } from '../src/services/jobPostingService';
import { tokenService } from '../src/services/token.service';
import axiosClient from '../src/utils/axiosClient';
import { positionService } from '../src/services/positionService';

vi.mock('../src/services/token.service', () => ({
  tokenService: { getUserData: vi.fn() },
}));

vi.mock('../src/services/business.service', () => ({
  businessService: { getRequisitions: vi.fn() },
}));

vi.mock('../src/services/jobPostingService', () => ({
  jobPostingService: { getManageableJobPostings: vi.fn() },
}));

vi.mock('../src/utils/axiosClient', () => ({
  default: { get: vi.fn() },
}));

const requisition: Requisition = {
  id: 'req-dept-a',
  positionId: 'position-1',
  departmentId: 'dept-a',
  headcount: 2,
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
};

const posting: JobPostingData = {
  id: 'posting-1',
  requisitionId: requisition.id,
  title: 'Frontend Developer',
  positionTitle: 'Frontend Developer',
  departmentId: 'dept-a',
  departmentName: 'Engineering',
  workLocation: 'Hà Nội',
  employmentType: 'FULL_TIME',
  level: 'SENIOR',
  headcount: 2,
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

const hiredCandidate: CandidateProfile = {
  id: 'candidate-1',
  fullName: 'Nguyễn An',
  email: 'an@example.com',
  phone: '0900000000',
  appliedJobId: posting.id,
  cvParsingStatus: 'CONFIRMED',
  status: 'HIRED',
};

describe('positionService.getPositionsByDepartment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tokenService.getUserData).mockReturnValue({
      id: 'manager-1',
      email: 'manager@example.com',
      fullName: 'Department Head',
      roles: ['HIRING_MANAGER'],
      departmentId: 'dept-a',
    });

    const page: PageResult<Requisition> = {
      items: [requisition],
      page: 0,
      size: 100,
      totalElements: 1,
      totalPages: 1,
    };
    vi.mocked(businessService.getRequisitions).mockResolvedValue(page);
    vi.mocked(jobPostingService.getManageableJobPostings).mockResolvedValue([posting]);
    vi.mocked(axiosClient.get).mockImplementation(async () =>
      ({ data: [hiredCandidate] }) as Awaited<ReturnType<typeof axiosClient.get>>,
    );
  });

  it('loads and returns recruitment progress scoped to the signed-in manager department', async () => {
    await expect(positionService.getPositionsByDepartment()).resolves.toEqual([
      {
        id: requisition.id,
        title: 'Frontend Developer',
        headcount: 2,
        receivedCvs: 1,
        approvedCvs: 1,
        hired: 1,
        progressPercent: 50,
        status: 'OPEN',
      },
    ]);

    expect(businessService.getRequisitions).toHaveBeenCalledWith({
      departmentId: 'dept-a',
      page: 0,
      size: 100,
    });
    expect(axiosClient.get).toHaveBeenCalledWith('/recruitment/candidates');
  });

  it('rejects users without the department-head role', async () => {
    vi.mocked(tokenService.getUserData).mockReturnValue({
      id: 'recruiter-1',
      email: 'recruiter@example.com',
      fullName: 'Recruiter',
      roles: ['RECRUITER'],
      departmentId: 'dept-a',
    });

    await expect(positionService.getPositionsByDepartment())
      .rejects.toThrow('Chỉ Trưởng bộ phận mới có quyền xem tiến độ vị trí phòng ban.');
    expect(businessService.getRequisitions).not.toHaveBeenCalled();
  });

  it('rejects users without a department assignment', async () => {
    vi.mocked(tokenService.getUserData).mockReturnValue({
      id: 'manager-1',
      email: 'manager@example.com',
      fullName: 'Department Head',
      roles: ['HIRING_MANAGER'],
    });

    await expect(positionService.getPositionsByDepartment())
      .rejects.toThrow('Tài khoản chưa được gán phòng ban.');
    expect(businessService.getRequisitions).not.toHaveBeenCalled();
  });
});
