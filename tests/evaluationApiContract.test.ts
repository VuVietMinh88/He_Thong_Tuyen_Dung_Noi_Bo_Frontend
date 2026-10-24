import { afterEach, describe, expect, it, vi } from 'vitest';
import client from '../src/utils/axiosClient';
import { evaluationApi, fromApiConclusion, toApiConclusion, type EvaluationView } from '../src/services/evaluationApi';
import { interviewerCalendarService } from '../src/services/interviewerCalendarService';

const form: EvaluationView = {
  id: 'form-1', interviewId: 'interview-1', applicationId: 'application-1', evaluatorId: 'evaluator-1',
  framework: { id: 'framework-1', code: 'CF', name: 'Snapshot' }, status: 'DRAFT', version: 3,
  items: [{ criterionId: 'criterion-1', name: 'Snapshot criterion', description: null,
    weight: 100, sortOrder: 0, score: null, comment: null }],
  conclusion: null, totalScore: null, firstSubmittedAt: null, submittedAt: null, updatedAt: '2026-10-20T00:00:00Z',
};
const answers = { 'criterion-1': { criterionId: 'criterion-1', criterionName: 'Untrusted client title',
  weight: 1, score: 4, comment: 'Observed evidence' } };
afterEach(() => vi.restoreAllMocks());
describe('Backend PR #191 evaluation contract', () => {
  it.each([
    ['RECOMMENDED', 'HIRE'], ['CONSIDER', 'CONSIDER'], ['NOT_RECOMMENDED', 'NO_HIRE'],
  ] as const)('maps conclusion %s without changing meaning', (ui, api) => {
    expect(toApiConclusion(ui)).toBe(api); expect(fromApiConclusion(api)).toBe(ui);
  });
  it('submits only allowed fields and uses the viewed optimistic version', async () => {
    const saved = { ...form, status: 'SUBMITTED' as const, version: 4, conclusion: 'HIRE' as const,
      totalScore: 4, submittedAt: '2026-10-20T01:00:00Z' };
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: saved });
    await expect(evaluationApi.save(form, answers, 'RECOMMENDED', true)).resolves.toEqual(saved);
    expect(post).toHaveBeenCalledWith('/interviews/interview-1/evaluations/me/submit', {
      expectedVersion: 3, items: [{ criterionId: 'criterion-1', score: 4, comment: 'Observed evidence' }], conclusion: 'HIRE',
    });
  });
  it('keeps draft scores nullable and does not send client weights or totals', async () => {
    const put = vi.spyOn(client, 'put').mockResolvedValue({ data: form });
    await evaluationApi.save(form, {}, null, false);
    expect(put).toHaveBeenCalledWith('/interviews/interview-1/evaluations/me', {
      expectedVersion: 3, items: [{ criterionId: 'criterion-1', score: null, comment: '' }], conclusion: null,
    });
  });
  it('does not accept a draft response as a successful submission', async () => {
    vi.spyOn(client, 'post').mockResolvedValue({ data: form });
    await expect(evaluationApi.save(form, answers, 'RECOMMENDED', true)).rejects.toThrow('chưa xác nhận');
  });
  it('propagates 409 without retrying or rewriting the viewed version', async () => {
    const failure = { isAxiosError: true, response: { status: 409 } };
    const post = vi.spyOn(client, 'post').mockRejectedValue(failure);
    await expect(evaluationApi.save(form, answers, 'CONSIDER', true)).rejects.toBe(failure);
    expect(post).toHaveBeenCalledTimes(1);
  });
  it('reopens with the interview/form ids, version and mandatory reason', async () => {
    const metadata = { id: form.id, interviewId: form.interviewId, status: 'DRAFT', version: 5, updatedAt: form.updatedAt };
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: metadata });
    await evaluationApi.reopen(form.interviewId, form.id, 4, '  Rà soát  ');
    expect(post).toHaveBeenCalledWith('/interviews/interview-1/evaluations/form-1/reopen', { expectedVersion: 4, reason: 'Rà soát' });
    await expect(evaluationApi.reopen(form.interviewId, form.id, 4, ' ')).rejects.toThrow();
    expect(post).toHaveBeenCalledTimes(1);
  });
  it('does not turn a network failure into submitted status', async () => {
    vi.spyOn(client, 'get').mockRejectedValue(new Error('offline'));
    await expect(interviewerCalendarService.checkEvaluationSubmittedStatus(form.interviewId)).rejects.toThrow('offline');
  });
  it('treats only the explicit missing-form response as not yet submitted', async () => {
    vi.spyOn(client, 'get').mockRejectedValue({ isAxiosError: true, response: { status: 404, data: { code: 'EVALUATION_NOT_FOUND' } } });
    await expect(interviewerCalendarService.checkEvaluationSubmittedStatus(form.interviewId)).resolves.toMatchObject({ hasSubmitted: false });
  });
});
