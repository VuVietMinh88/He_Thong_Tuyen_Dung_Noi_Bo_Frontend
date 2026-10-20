import { interview, page, evaluation, answers, httpError } from './fixtures/interviewContract';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axiosClient from '../src/utils/axiosClient';
import { tokenService } from '../src/services/token.service';
import { interviewerCalendarService } from '../src/services/interviewerCalendarService';
import { LOCAL_STORAGE_INTERVIEWS_KEY } from '../src/services/interviewService';

import type { InterviewSchedulePayload } from '../src/types/interview';

describe('interviewerCalendarService (S7-01 / TKNHTTDNB1-476)', () => {
  const storage = new Map<string, string>();

  const mockInterviewerUser = {
    id: 'user-interviewer-01',
    email: 'interviewer01@smartrecruitment.vn',
    fullName: 'Trần Văn Phỏng Vấn',
    roles: ['INTERVIEWER'],
  };

  const sampleInterview: InterviewSchedulePayload = {
    id: 'itv-test-101',
    applicationId: 'app-test-101',
    candidateId: 'can-test-101',
    candidateName: 'Nguyễn Văn Ứng Viên',
    candidateEmail: 'candidate101@gmail.com',
    jobTitle: 'Senior Frontend Engineer',
    departmentName: 'Trung tâm Phát triển Phần mềm',
    interviewRound: 'TECHNICAL',
    roundName: 'Vòng Chuyên môn',
    interviewDate: '2026-10-18',
    interviewTime: '14:00',
    durationMinutes: 60,
    format: 'ONLINE',
    locationOrLink: 'https://meet.google.com/abc-defg-hij',
    scheduledDateTimeISO: '2026-10-18T14:00:00+07:00',
    interviewerIds: ['user-interviewer-01', 'user-interviewer-02'],
    interviewers: [
      { id: 'user-interviewer-01', name: 'Trần Văn Phỏng Vấn', role: 'INTERVIEWER', email: 'interviewer01@smartrecruitment.vn' },
      { id: 'user-interviewer-02', name: 'Lê Thị Chuyên Gia', role: 'INTERVIEWER', email: 'interviewer02@smartrecruitment.vn' },
    ],
    status: 'SCHEDULED',
    candidateResponse: { status: 'CONFIRMED' },
    isEvaluationSubmitted: false,
  };

  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-10-20T00:00:00Z').getTime());
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    });
    vi.spyOn(tokenService, 'getUserData').mockReturnValue(mockInterviewerUser as never);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('getInterviewerSchedule', () => {
    it('calls authenticated me endpoint and enriches with server evaluation status', async () => {
      const get = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({ data: page([interview({ id: 'itv-test-101' })]) })
        .mockResolvedValueOnce({ data: evaluation() });
      const result = await interviewerCalendarService.getInterviewerSchedule({ userId: 'user-interviewer-01' });
      expect(get).toHaveBeenNthCalledWith(1, '/interviews/me', { params: { page: 0, size: 100 } });
      expect(get).toHaveBeenNthCalledWith(2, '/interviews/itv-test-101/evaluations/me');
      expect(result).toHaveLength(1); expect(result[0].id).toBe('itv-test-101');
      expect(result[0].candidateName).toBe('');
      expect(result[0].isEvaluationSubmitted).toBe(false);
    });

    it('rejects offline reads instead of trusting cached authorization', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValue(new Error('Network error'));
      storage.set(LOCAL_STORAGE_INTERVIEWS_KEY, JSON.stringify([sampleInterview]));
      await expect(interviewerCalendarService.getInterviewerSchedule({ userId: 'user-interviewer-01' })).rejects.toThrow('Network error');
    });

    it('filters schedule by status and search query keyword', async () => {
      const items = [interview({ id: 'itv-test-101' }), interview({ id: 'itv-test-102', status: 'CANCELLED', roundName: 'Portfolio' })];
      const get = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({ data: page(items) }).mockResolvedValueOnce({ data: evaluation({ interviewId: 'itv-test-102' }) });
      const filtered = await interviewerCalendarService.getInterviewerSchedule({ status: 'CANCELLED' });
      expect(filtered.map(item => item.id)).toEqual(['itv-test-102']);
      get.mockResolvedValueOnce({ data: page(items) }).mockResolvedValueOnce({ data: evaluation({ interviewId: 'itv-test-102' }) });
      const searched = await interviewerCalendarService.getInterviewerSchedule({ search: 'Portfolio' });
      expect(searched.map(item => item.id)).toEqual(['itv-test-102']);
    });
  });

  describe('getAssignedCandidateProfile & Access Control (AC 1 & AC 2)', () => {
    it('keeps assigned profile and CV unavailable without a verified contract', async () => {
      const get = vi.spyOn(axiosClient, 'get');
      await expect(interviewerCalendarService.getAssignedCandidateProfile('app-test-101', 'itv-test-101')).rejects.toMatchObject({ statusCode: 501 });
      expect(get).not.toHaveBeenCalled();
    });

    it('does not invent a profile endpoint even when a mock could return 403', async () => {
      const get = vi.spyOn(axiosClient, 'get').mockRejectedValue(httpError(403, 'FORBIDDEN'));
      await expect(interviewerCalendarService.getAssignedCandidateProfile('app-test-101', 'itv-test-101')).rejects.toMatchObject({ statusCode: 501 });
      expect(get).not.toHaveBeenCalled();
    });

    it('never exposes cached CV or profile data from another panel', async () => {
      storage.set(LOCAL_STORAGE_INTERVIEWS_KEY, JSON.stringify([{ ...sampleInterview, interviewerIds: ['other-user'] }]));
      const get = vi.spyOn(axiosClient, 'get');
      await expect(interviewerCalendarService.getAssignedCandidateProfile('app-test-101', 'itv-restricted-999')).rejects.toMatchObject({ statusCode: 501 });
      expect(get).not.toHaveBeenCalled();
    });
  });

  describe('submitInterviewerEvaluation & dynamic update (AC 3)', () => {
    it('submits versioned answers and uses confirmed server status without local flags', async () => {
      const submitted = evaluation({ status: 'SUBMITTED', version: 4, conclusion: 'HIRE', totalScore: 4, submittedAt: '2026-10-20T01:00:00Z' });
      const get = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({ data: evaluation() }).mockResolvedValueOnce({ data: submitted });
      const post = vi.spyOn(axiosClient, 'post').mockResolvedValue({ data: submitted });
      await interviewerCalendarService.submitInterviewerEvaluation('itv-test-101', {
        expectedVersion: 3, criteriaEvaluations: answers, conclusion: 'RECOMMENDED',
      }, 'user-interviewer-01');
      expect(post).toHaveBeenCalledWith('/interviews/itv-test-101/evaluations/me/submit', {
        expectedVersion: 3, items: [{ criterionId: 'criterion-1', score: 4, comment: 'Evidence' }], conclusion: 'HIRE',
      });
      const status = await interviewerCalendarService.checkEvaluationSubmittedStatus('itv-test-101', 'user-interviewer-01');
      expect(status.hasSubmitted).toBe(true); expect(status.score).toBe(4); expect(status.conclusion).toBe('RECOMMENDED');
      expect(get).toHaveBeenCalledTimes(2);
      expect(storage.size).toBe(0);
    });
  });

  describe('isInterviewPast helper', () => {
    it('returns true when interview date and time is in the past', () => {
      // Ngày trong quá khứ
      const isPast = interviewerCalendarService.isInterviewPast('2020-01-01', '09:00');
      expect(isPast).toBe(true);
    });

    it('returns false when interview date is far in the future', () => {
      // Ngày tương lai xa
      const isPast = interviewerCalendarService.isInterviewPast('2035-12-31', '14:00');
      expect(isPast).toBe(false);
    });
  });
});
