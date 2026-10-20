import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import client from '../src/utils/axiosClient';
import { interviewService } from '../src/services/interviewService';
import { interviewConflictService } from '../src/services/interviewConflictService';
import { interviewerCalendarService } from '../src/services/interviewerCalendarService';
import { evaluationApi, evaluationError, isVersionConflict } from '../src/services/evaluationApi';
import { tokenService } from '../src/services/token.service';
import { answers, evaluation, httpError } from './fixtures/interviewContract';
const payload = { applicationId: 'app-1', interviewRound: 'Technical',
  startTime: '2026-11-25T07:00:00Z', durationMinutes: 60, interviewType: 'ONLINE' as const,
  locationOrLink: 'https://meet.example.com/room', interviewerIds: ['usr-001'] };
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-20T00:00:00Z'));
  vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'stale-submitted-flag'), setItem: vi.fn() });
  vi.spyOn(tokenService, 'getUserData').mockReturnValue({ id: 'user-interviewer-01' } as never);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('Interview API failures remain failures', () => {
  it.each([400, 401, 403, 409, 500])('preserves HTTP %s and does not store success', async status => {
    const post = vi.spyOn(client, 'post').mockRejectedValue(httpError(status, 'SERVER_CODE'));
    await expect(interviewService.createInterviewSchedule(payload)).rejects.toMatchObject({ statusCode: status, errorCode: 'SERVER_CODE' });
    expect(post).toHaveBeenCalledTimes(1); expect(localStorage.setItem).not.toHaveBeenCalled();
  });
  it('does not misclassify a stale version as resource conflict', async () => {
    vi.spyOn(client, 'post').mockRejectedValue(httpError(409, 'INTERVIEW_VERSION_CHANGED'));
    await expect(interviewService.createInterviewSchedule(payload)).rejects.toMatchObject({ errorCode: 'INTERVIEW_VERSION_CHANGED', statusCode: 409 });
  });
  it('preserves forbidden override and never writes local audit', async () => {
    vi.spyOn(client, 'post').mockRejectedValue(httpError(403, 'FORBIDDEN'));
    await expect(interviewConflictService.overrideInterviewConflict({ ...payload, overrideReason: 'Reason' })).rejects.toMatchObject({ statusCode: 403 });
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
  it.each([400, 401, 403, 409, 500])('submit HTTP %s does not become submitted status', async status => {
    vi.spyOn(client, 'get').mockResolvedValue({ data: evaluation() });
    const failure = httpError(status, status === 409 ? 'EVALUATION_VERSION_CHANGED' : 'SERVER_CODE');
    const post = vi.spyOn(client, 'post').mockRejectedValue(failure);
    await expect(interviewerCalendarService.submitInterviewerEvaluation('itv-test-101', {
      expectedVersion: 3, criteriaEvaluations: answers, conclusion: 'RECOMMENDED',
    })).rejects.toBe(failure);
    expect(post).toHaveBeenCalledTimes(1); expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(isVersionConflict(failure)).toBe(status === 409);
    if (status === 409) expect(evaluationError(failure)).toContain('Tải lại');
  });
  it('rejects a successful HTTP response that still contains a draft', async () => {
    vi.spyOn(client, 'get').mockResolvedValue({ data: evaluation() });
    vi.spyOn(client, 'post').mockResolvedValue({ data: evaluation() });
    await expect(interviewerCalendarService.submitInterviewerEvaluation('itv-test-101', {
      expectedVersion: 3, criteriaEvaluations: answers, conclusion: 'RECOMMENDED',
    })).rejects.toThrow('chưa xác nhận');
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
  it('does not submit after discovering the viewed version is stale', async () => {
    vi.spyOn(client, 'get').mockResolvedValue({ data: evaluation({ version: 4 }) });
    const post = vi.spyOn(client, 'post');
    await expect(interviewerCalendarService.submitInterviewerEvaluation('itv-test-101', {
      expectedVersion: 3, criteriaEvaluations: answers, conclusion: 'RECOMMENDED',
    })).rejects.toThrow('Tải lại');
    expect(post).not.toHaveBeenCalled();
  });
  it.each([401, 403, 409, 500])('status HTTP %s is unknown, never a cached submitted flag', async status => {
    const failure = httpError(status, 'SERVER_CODE');
    vi.spyOn(client, 'get').mockRejectedValue(failure);
    await expect(interviewerCalendarService.checkEvaluationSubmittedStatus('itv-test-101')).rejects.toBe(failure);
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
  it('does not reopen or retry after HTTP 409', async () => {
    const failure = httpError(409, 'EVALUATION_VERSION_CHANGED');
    const post = vi.spyOn(client, 'post').mockRejectedValue(failure);
    await expect(evaluationApi.reopen('itv-test-101', 'form-1', 3, 'Reason')).rejects.toBe(failure);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/interviews/itv-test-101/evaluations/form-1/reopen', { expectedVersion: 3, reason: 'Reason' });
  });
});
