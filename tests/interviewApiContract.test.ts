import { afterEach, describe, expect, it, vi } from 'vitest';
import client from '../src/utils/axiosClient';
import { interviewApi, interviewModel, scheduleRequest, type InterviewView } from '../src/services/interviewApi';

const value: InterviewView = { id: 'interview-1', applicationId: 'application-1', roundName: 'Technical',
  startsAt: '2026-10-21T02:00:00Z', endsAt: '2026-10-21T03:00:00Z', mode: 'ONSITE', room: 'A',
  meetingUrl: null, status: 'SCHEDULED', version: 2, participantIds: ['user-1'], createdAt: '2026-10-20T00:00:00Z' };
afterEach(() => vi.restoreAllMocks());
describe('Backend PR #191 interview contract', () => {
  it('maps onsite requests without sending candidate PII or aliases', () => {
    expect(scheduleRequest({ applicationId: 'application-1', interviewRound: 'Technical',
      startTime: value.startsAt, durationMinutes: 60, interviewType: 'OFFLINE', locationOrLink: 'A',
      interviewerIds: ['user-1'], candidateEmail: 'not-sent@example.test', expectedVersion: 2,
    })).toEqual({ roundName: 'Technical', startsAt: value.startsAt, durationMinutes: 60, mode: 'ONSITE',
      room: 'A', meetingUrl: null, participantIds: ['user-1'], expectedVersion: 2, overrideConflicts: false, overrideReason: null });
  });
  it('uses Vietnam time and preserves the server version', () => {
    expect(interviewModel(value)).toMatchObject({ interviewDate: '2026-10-21', interviewTime: '09:00',
      version: 2, format: 'OFFLINE', interviewerIds: ['user-1'] });
  });
  it('reads the paginated server envelope', async () => {
    const get = vi.spyOn(client, 'get').mockResolvedValue({ data: { items: [value], totalElements: 1, page: 0, size: 100 } });
    expect(await interviewApi.list('application-1')).toHaveLength(1);
    expect(get).toHaveBeenCalledWith('/applications/application-1/interviews', { params: { page: 0, size: 100 } });
  });
  it('does not fall back to locally stored schedules on API errors', async () => {
    vi.spyOn(client, 'get').mockRejectedValue(new Error('offline'));
    await expect(interviewApi.mine()).rejects.toThrow('offline');
  });
  it('requires a reason and viewed version before cancelling', async () => {
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: { ...value, status: 'CANCELLED', version: 3 } });
    await expect(interviewApi.cancel(value.id, 2, 'Thay đổi kế hoạch')).resolves.toMatchObject({ status: 'CANCELLED', version: 3 });
    expect(post).toHaveBeenCalledWith('/interviews/interview-1/cancel', { expectedVersion: 2, reason: 'Thay đổi kế hoạch' });
    await expect(interviewApi.cancel(value.id, 2, '')).rejects.toThrow();
    expect(post).toHaveBeenCalledTimes(1);
  });
});
