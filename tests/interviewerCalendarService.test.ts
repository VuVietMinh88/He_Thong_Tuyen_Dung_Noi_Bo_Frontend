import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import axiosClient from '../src/utils/axiosClient';
import { tokenService } from '../src/services/token.service';
import { interviewerCalendarService } from '../src/services/interviewerCalendarService';
import { LOCAL_STORAGE_INTERVIEWS_KEY } from '../src/services/interviewService';
import { InterviewerAccessForbiddenError } from '../src/types/interview';
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
    it('calls /my-schedule endpoint and enriches with evaluation status', async () => {
      const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: [sampleInterview],
      });

      const result = await interviewerCalendarService.getInterviewerSchedule({
        userId: 'user-interviewer-01',
      });

      expect(getSpy).toHaveBeenCalledWith(
        '/recruitment/interviews/my-schedule',
        expect.objectContaining({
          params: expect.objectContaining({
            userId: 'user-interviewer-01',
          }),
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('itv-test-101');
      expect(result[0].candidateName).toBe('Nguyễn Văn Ứng Viên');
      expect(result[0].isEvaluationSubmitted).toBe(false);
    });

    it('falls back to local storage and filters by user ID if API fails', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValue(new Error('Network error'));

      const storedList: InterviewSchedulePayload[] = [
        sampleInterview,
        {
          ...sampleInterview,
          id: 'itv-other-user',
          interviewerIds: ['other-user-99'],
          interviewers: [{ id: 'other-user-99', name: 'Người khác', role: 'INTERVIEWER', email: 'other99@smartrecruitment.vn' }],
        },
      ];
      storage.set(LOCAL_STORAGE_INTERVIEWS_KEY, JSON.stringify(storedList));

      const result = await interviewerCalendarService.getInterviewerSchedule({
        userId: 'user-interviewer-01',
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('itv-test-101');
    });

    it('filters schedule by status and search query keyword', async () => {
      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: [
          sampleInterview,
          {
            ...sampleInterview,
            id: 'itv-test-102',
            candidateName: 'Phạm Thị Thử Việc',
            status: 'COMPLETED',
          },
        ],
      });

      const filteredByStatus = await interviewerCalendarService.getInterviewerSchedule({
        userId: 'user-interviewer-01',
        status: 'COMPLETED',
      });
      expect(filteredByStatus).toHaveLength(1);
      expect(filteredByStatus[0].id).toBe('itv-test-102');

      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: [
          sampleInterview,
          {
            ...sampleInterview,
            id: 'itv-test-102',
            candidateName: 'Phạm Thị Thử Việc',
            status: 'COMPLETED',
          },
        ],
      });

      const filteredBySearch = await interviewerCalendarService.getInterviewerSchedule({
        userId: 'user-interviewer-01',
        search: 'Phạm Thị',
      });
      expect(filteredBySearch).toHaveLength(1);
      expect(filteredBySearch[0].candidateName).toBe('Phạm Thị Thử Việc');
    });
  });

  describe('getAssignedCandidateProfile & Access Control (AC 1 & AC 2)', () => {
    it('returns candidate profile and CV when interviewer is authorized via API', async () => {
      const mockProfile = {
        candidateId: 'can-test-101',
        applicationId: 'app-test-101',
        interviewId: 'itv-test-101',
        fullName: 'Nguyễn Văn Ứng Viên',
        email: 'candidate101@gmail.com',
        phone: '0987 654 321',
        appliedJobTitle: 'Senior Frontend Engineer',
        departmentName: 'Trung tâm Phát triển Phần mềm',
        experienceYears: 5,
        skills: ['React', 'TypeScript', 'Tailwind CSS'],
        cvUrl: 'https://smartrecruitment.vn/cvs/candidate101.pdf',
        cvFileName: 'CV_Nguyen_Van_Ung_Vien.pdf',
        cvFileType: 'pdf',
      };

      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({ data: mockProfile });

      const profile = await interviewerCalendarService.getAssignedCandidateProfile(
        'app-test-101',
        'itv-test-101',
      );

      expect(profile).toEqual(mockProfile);
      expect(profile.cvUrl).toBe('https://smartrecruitment.vn/cvs/candidate101.pdf');
    });

    it('throws InterviewerAccessForbiddenError (403) when server returns 403 Forbidden', async () => {
      const axiosError = new axios.AxiosError('Forbidden');
      axiosError.response = {
        status: 403,
        statusText: 'Forbidden',
        data: {
          code: 'FORBIDDEN',
          message: 'Bạn không có quyền truy cập hồ sơ hoặc tệp CV của ứng viên này do không thuộc hội đồng phỏng vấn được phân công.',
        },
        headers: {},
        config: {} as never,
      };
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(axiosError);

      await expect(
        interviewerCalendarService.getAssignedCandidateProfile('app-test-101', 'itv-test-101'),
      ).rejects.toThrow(InterviewerAccessForbiddenError);
    });

    it('throws InterviewerAccessForbiddenError when current user is NOT in interview panel (client validation fallback)', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Network offline'));

      // Phỏng vấn gán cho user khác (không có user-interviewer-01)
      const restrictedInterview: InterviewSchedulePayload = {
        ...sampleInterview,
        id: 'itv-restricted-999',
        interviewerIds: ['user-other-person'],
        interviewers: [{ id: 'user-other-person', name: 'Người khác', role: 'INTERVIEWER', email: 'other@smartrecruitment.vn' }],
      };
      storage.set(
        LOCAL_STORAGE_INTERVIEWS_KEY,
        JSON.stringify([restrictedInterview]),
      );

      await expect(
        interviewerCalendarService.getAssignedCandidateProfile('app-test-101', 'itv-restricted-999'),
      ).rejects.toThrow(InterviewerAccessForbiddenError);
    });
  });

  describe('submitInterviewerEvaluation & dynamic update (AC 3)', () => {
    it('submits evaluation and updates local status without page reload', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({ data: { success: true } });

      storage.set(
        LOCAL_STORAGE_INTERVIEWS_KEY,
        JSON.stringify([sampleInterview]),
      );

      const evaluationData = {
        calculatedTotalScore: 4.5,
        overallConclusion: 'PASSED',
        notes: 'Ứng viên có kỹ năng chuyên môn xuất sắc.',
      };

      await interviewerCalendarService.submitInterviewerEvaluation(
        'itv-test-101',
        evaluationData,
        'user-interviewer-01',
      );

      expect(postSpy).toHaveBeenCalledWith(
        '/recruitment/interviews/itv-test-101/evaluations',
        expect.objectContaining({
          interviewId: 'itv-test-101',
          interviewerId: 'user-interviewer-01',
          score: 4.5,
          conclusion: 'PASSED',
        }),
      );

      // Kiểm tra trạng thái đã được cập nhật
      const statusResult = await interviewerCalendarService.checkEvaluationSubmittedStatus(
        'itv-test-101',
        'user-interviewer-01',
      );

      expect(statusResult.hasSubmitted).toBe(true);
      expect(statusResult.score).toBe(4.5);
      expect(statusResult.conclusion).toBe('PASSED');
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
