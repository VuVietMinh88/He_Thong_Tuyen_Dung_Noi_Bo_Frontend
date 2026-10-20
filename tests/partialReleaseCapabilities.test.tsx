import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import client from '../src/utils/axiosClient';
import { featureStatus, requireFeature } from '../src/services/backendCapabilities';
import { interviewApi } from '../src/services/interviewApi';
import { interviewService } from '../src/services/interviewService';
import { interviewerCalendarService } from '../src/services/interviewerCalendarService';
import { canReopenEvaluation, checkIsRecruiterRole } from '../src/utils/interviewEvaluationHelper';
import { CapabilityNotice } from '../src/components/Interview/CapabilityNotice';
import { httpError, interview, page } from './fixtures/interviewContract';

const manifest = (features: Record<string, string>) => vi.stubEnv('VITE_BACKEND_CAPABILITIES', JSON.stringify({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1', backendSha256: 'a'.repeat(64),
  verifiedAt: '2026-10-20T00:00:00Z', features,
}));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
describe('Partial release uses independent, verified capabilities', () => {
  it('fails closed without release evidence, instead of asserting API absence', async () => {
    vi.stubEnv('VITE_BACKEND_CAPABILITIES', '');
    const get = vi.spyOn(client, 'get');
    expect(featureStatus('schedules')).toBe('NOT_VERIFIED');
    await expect(interviewApi.mine()).rejects.toMatchObject({ capabilityStatus: 'NOT_VERIFIED' });
    expect(get).not.toHaveBeenCalled();
    expect(renderToString(<CapabilityNotice feature="schedules" />)).toContain('chưa được xác minh');
  });
  it.each(['NOT_IMPLEMENTED', 'ERROR', 'NOT_VERIFIED'] as const)('blocks %s with its own message', status => {
    manifest({ schedules: status });
    expect(() => requireFeature('schedules')).toThrow();
    const html = renderToString(<CapabilityNotice feature="schedules" />);
    expect(html).toContain(`data-capability-status="${status}"`);
    if (status === 'NOT_IMPLEMENTED') expect(html).toContain('Chức năng này hiện chưa được Backend hỗ trợ');
    else expect(html).not.toContain('chưa được Backend hỗ trợ');
  });
  it('does not activate a manifest for another API origin', () => {
    manifest({ schedules: 'AVAILABLE' }); vi.stubEnv('VITE_API_BASE_URL', 'https://other.example/api/v1');
    expect(featureStatus('schedules')).toBe('NOT_VERIFIED');
  });
  it.each([400, 401, 403, 404, 409, 500])('an available API HTTP %s stays an error, not unsupported', async status => {
    manifest({ schedules: 'AVAILABLE' });
    const failure = httpError(status, 'SERVER_ERROR');
    vi.spyOn(client, 'get').mockRejectedValue(failure);
    await expect(interviewApi.mine()).rejects.toBe(failure);
    expect(featureStatus('schedules')).toBe('AVAILABLE');
  });
  it('reads verified schedules while evaluation support is unverified', async () => {
    manifest({ schedules: 'AVAILABLE', evaluations: 'NOT_VERIFIED' });
    const get = vi.spyOn(client, 'get').mockResolvedValue({ data: page([interview()]) });
    const result = await interviewerCalendarService.getInterviewerSchedule();
    expect(result).toHaveLength(1); expect(result[0].isEvaluationSubmitted).toBeUndefined();
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('/interviews/me', { params: { page: 0, size: 100 } });
  });
  it('uses the scoped participant directory with no fabricated email or role', async () => {
    manifest({ participantPicker: 'AVAILABLE' });
    const get = vi.spyOn(client, 'get').mockResolvedValue({ data: { items: [{ id: 'user-1', fullName: 'Nguyễn An' }], totalElements: 1, page: 0, size: 50 } });
    await expect(interviewService.getInternalInterviewers('An', 'app-1')).resolves.toEqual([{ id: 'user-1', name: 'Nguyễn An', role: '', email: '' }]);
    expect(get).toHaveBeenCalledWith('/applications/app-1/interview-participants', { params: { q: 'An', page: 0, size: 50 } });
  });
  it('does not swallow picker failure or downgrade it to unsupported', async () => {
    manifest({ participantPicker: 'AVAILABLE' });
    const failure = httpError(500, 'SERVER_ERROR'); vi.spyOn(client, 'get').mockRejectedValue(failure);
    await expect(interviewService.getInternalInterviewers('', 'app-1')).rejects.toBe(failure);
    expect(featureStatus('participantPicker')).toBe('AVAILABLE');
  });
  it('requires application scope before asking for participants', async () => {
    manifest({ participantPicker: 'AVAILABLE' }); const get = vi.spyOn(client, 'get');
    await expect(interviewService.getInternalInterviewers()).rejects.toThrow('hồ sơ ứng tuyển');
    expect(get).not.toHaveBeenCalled();
  });
});
describe('Reopen visibility matches Backend role and grants', () => {
  const grants = ['INTERVIEWS_READ_SCOPED', 'INTERVIEWS_WRITE_SCOPED', 'CANDIDATES_READ_SCOPED'];
  it.each([['ADMIN'], ['HR_MANAGER'], ['INTERVIEWER'], []])('does not grant reopen to roles %j', (...roles) => {
    expect(canReopenEvaluation(roles as string[], grants)).toBe(false);
  });
  it('accepts recruiter with required grants and rejects every missing grant', () => {
    expect(canReopenEvaluation(['RECRUITER'], grants)).toBe(true);
    for (const grant of grants) expect(canReopenEvaluation(['RECRUITER'], grants.filter(p => p !== grant))).toBe(false);
    expect(checkIsRecruiterRole(['INTERVIEWER'], true)).toBe(false);
  });
});
