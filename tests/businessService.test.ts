import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosClient from '../src/utils/axiosClient';
import { businessService } from '../src/services/business.service';

afterEach(() => vi.restoreAllMocks());

describe('business API service contracts', () => {
  it('loads and updates the authenticated profile through the profile API', async () => {
    const profile = {
      id: 'user-1',
      email: 'person@example.com',
      fullName: 'Nguyen An',
      phone: null,
      displayTitle: null,
      departmentId: null,
      departmentName: null,
      roles: ['RECRUITER'],
      hasAvatar: false,
      avatarUpdatedAt: null,
    };
    const get = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({ data: profile });
    const put = vi.spyOn(axiosClient, 'put').mockResolvedValueOnce({ data: profile });

    await expect(businessService.getProfile()).resolves.toEqual(profile);
    await businessService.updateProfile({ fullName: 'Nguyen An', phone: null, displayTitle: null });

    expect(get).toHaveBeenCalledWith('/profile');
    expect(put).toHaveBeenCalledWith('/profile', {
      fullName: 'Nguyen An',
      phone: null,
      displayTitle: null,
    });
  });

  it('sends a draft requisition using the Backend reason field and code', async () => {
    const request = {
      positionId: 'position-1',
      departmentId: 'department-1',
      headcount: 2,
      reason: 'NEW_HEADCOUNT' as const,
      proposedSalaryMin: 100,
      proposedSalaryMax: 200,
      salaryJustification: null,
      neededBy: '2026-12-01',
      jobDescription: 'Description',
      candidateRequirements: null,
    };
    const post = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({ data: { ...request, id: 'req-1', status: 'DRAFT' } });

    await businessService.saveRequisition(null, request);

    expect(post).toHaveBeenCalledWith('/requisitions', request);
  });

  it('uses criterionId in interview-question writes and the position evaluation criteria route', async () => {
    const post = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({ data: { id: 'question-1' } });
    const get = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({ data: { criteria: [] } });
    await businessService.saveQuestion(null, {
      criterion: { id: 'criterion-1', name: 'Communication' },
      content: 'Describe a challenge.',
      difficulty: 'MEDIUM',
      answerHint: null,
      active: true,
    });
    await businessService.getEvaluationCriteria('position-1');

    expect(post).toHaveBeenCalledWith('/interview-questions', {
      criterionId: 'criterion-1',
      content: 'Describe a challenge.',
      difficulty: 'MEDIUM',
      answerHint: null,
      active: true,
    });
    expect(get).toHaveBeenCalledWith('/positions/position-1/evaluation-criteria');
  });
});
