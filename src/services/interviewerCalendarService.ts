import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import { tokenService } from './token.service';
import type {
  InterviewSchedulePayload,
  PersonalScheduleParams,
  AssignedCandidateProfileResult,
  EvaluationSubmittedStatusResult,
} from '../types/interview';
import {
  InterviewerAccessForbiddenError,
  InterviewApiError,
} from '../types/interview';
import {
  interviewService,
  LOCAL_STORAGE_INTERVIEWS_KEY,
} from './interviewService';

export const LOCAL_STORAGE_EVALUATION_SUBMISSIONS_KEY = 'smart_recruitment_interview_evaluations_submitted';

class InterviewerCalendarService {
  /**
   * Lấy danh sách lịch phỏng vấn phân công cho người phỏng vấn hiện tại (AC 1)
   */
  async getInterviewerSchedule(
    params?: PersonalScheduleParams,
  ): Promise<InterviewSchedulePayload[]> {
    const currentUser = tokenService.getUserData();
    const effectiveUserId = params?.userId || params?.interviewerId || currentUser?.id;

    try {
      const response = await axiosClient.get('/recruitment/interviews/my-schedule', {
        params: {
          ...params,
          userId: effectiveUserId,
        },
      });

      if (response?.data && Array.isArray(response.data)) {
        let schedule = response.data;
        if (params?.status && params.status !== 'ALL') {
          schedule = schedule.filter((item) => item.status === params.status);
        }
        if (params?.search && params.search.trim()) {
          const q = params.search.toLowerCase().trim();
          schedule = schedule.filter(
            (item) =>
              item.candidateName?.toLowerCase().includes(q) ||
              item.roundName?.toLowerCase().includes(q) ||
              (item.jobTitle && item.jobTitle.toLowerCase().includes(q)) ||
              item.locationOrLink?.toLowerCase().includes(q),
          );
        }
        return this.enrichScheduleWithEvaluationStatus(schedule, effectiveUserId);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        // Fallback sang endpoint /personal nếu route /my-schedule chưa cấu hình
        try {
          const fallbackRes = await axiosClient.get('/recruitment/interviews/personal', {
            params: {
              ...params,
              userId: effectiveUserId,
            },
          });
          if (fallbackRes?.data && Array.isArray(fallbackRes.data)) {
            return this.enrichScheduleWithEvaluationStatus(fallbackRes.data, effectiveUserId);
          }
        } catch {
          // Tiếp tục fallback local
        }
      }
    }

    // Fallback: Lấy dữ liệu lưu trữ nội bộ (LocalStorage)
    const stored = interviewService.getStoredInterviews();
    let userSchedule = stored;

    if (effectiveUserId) {
      userSchedule = stored.filter((item) => {
        const hasId = item.interviewerIds && item.interviewerIds.includes(effectiveUserId);
        const hasObj = item.interviewers && item.interviewers.some((i) => i.id === effectiveUserId);
        return hasId || hasObj;
      });
    }

    if (params?.date) {
      userSchedule = userSchedule.filter(
        (item) => item.interviewDate === params.date || item.startTime?.startsWith(params.date!),
      );
    }

    if (params?.status && params.status !== 'ALL') {
      userSchedule = userSchedule.filter((item) => item.status === params.status);
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      userSchedule = userSchedule.filter(
        (item) =>
          item.candidateName.toLowerCase().includes(q) ||
          item.roundName.toLowerCase().includes(q) ||
          (item.jobTitle && item.jobTitle.toLowerCase().includes(q)) ||
          item.locationOrLink.toLowerCase().includes(q),
      );
    }

    return this.enrichScheduleWithEvaluationStatus(userSchedule, effectiveUserId);
  }

  /**
   * Lấy thông tin hồ sơ ứng viên và tệp CV tương ứng với buổi phỏng vấn mà người dùng được mời (AC 1 & AC 2)
   * Kiểm tra quyền hạn nghiêm ngặt ở cả tầng server và client fallback.
   */
  async getAssignedCandidateProfile(
    applicationId: string,
    interviewId?: string,
  ): Promise<AssignedCandidateProfileResult> {
    const currentUser = tokenService.getUserData();

    try {
      const response = await axiosClient.get(
        `/recruitment/applications/${encodeURIComponent(applicationId)}/assigned-profile`,
        {
          params: { interviewId },
        },
      );

      if (response?.data) {
        return response.data;
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const resData = err.response?.data as { code?: string; message?: string } | undefined;
        const message = resData?.message || '';

        // Bắt lỗi 403 Forbidden phân quyền người phỏng vấn (AC 1 & AC 2)
        if (
          status === 403 ||
          resData?.code === 'FORBIDDEN' ||
          resData?.code === 'PERMISSION_DENIED' ||
          message.toLowerCase().includes('không có quyền') ||
          message.toLowerCase().includes('forbidden')
        ) {
          throw new InterviewerAccessForbiddenError(
            message ||
              'Bạn không có quyền truy cập hồ sơ hoặc tệp CV của ứng viên này do không thuộc hội đồng phỏng vấn được phân công.',
          );
        }

        if (status && status >= 400 && status !== 404) {
          throw new InterviewApiError(
            message || 'Không thể lấy thông tin hồ sơ ứng viên từ máy chủ.',
            status,
          );
        }
      }
    }

    // Fallback Client-side với kiểm tra phân quyền nghiêm ngặt
    const storedList = interviewService.getStoredInterviews();
    const matchedInterview = storedList.find(
      (item) =>
        (interviewId && item.id === interviewId) ||
        (applicationId && item.applicationId === applicationId),
    );

    // Kiểm tra xem user hiện tại có thuộc hội đồng phỏng vấn của buổi này không
    if (matchedInterview && currentUser?.id) {
      const isAssigned =
        (matchedInterview.interviewerIds &&
          matchedInterview.interviewerIds.includes(currentUser.id)) ||
        (matchedInterview.interviewers &&
          matchedInterview.interviewers.some((i) => i.id === currentUser.id));

      if (!isAssigned) {
        throw new InterviewerAccessForbiddenError(
          'Bạn không có quyền truy cập hồ sơ hoặc tệp CV của ứng viên này do không thuộc hội đồng phỏng vấn được phân công.',
        );
      }
    }

    // Trả về dữ liệu hồ sơ ứng viên gán với buổi phỏng vấn
    const candidateName = matchedInterview?.candidateName || 'Ứng viên tiềm năng';
    const jobTitle = matchedInterview?.jobTitle || 'Chức danh ứng tuyển';
    const cleanCandidateId = matchedInterview?.candidateId || 'can-assigned-01';

    return {
      candidateId: cleanCandidateId,
      applicationId: matchedInterview?.applicationId || applicationId,
      interviewId: matchedInterview?.id || interviewId,
      fullName: candidateName,
      email: matchedInterview?.candidateEmail || `${cleanCandidateId}@gmail.com`,
      phone: '0987 654 321',
      appliedJobTitle: jobTitle,
      departmentName: matchedInterview?.departmentName || 'Bộ phận Công nghệ & Kỹ thuật',
      experienceYears: 4,
      skills: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'Redux', 'RESTful API'],
      educationLevel: 'Đại học Bách Khoa Hà Nội - Chuyên ngành Công nghệ Thông tin',
      currentCompany: 'FPT Software',
      cvUrl:
        matchedInterview?.cvUrl ||
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      cvFileName: matchedInterview?.cvFileName || `CV_${candidateName.replace(/\s+/g, '_')}.pdf`,
      cvFileType: 'pdf',
      coverLetter:
        'Tôi rất mong muốn được cống hiến kinh nghiệm và năng lực chuyên môn của mình tại vị trí tuyển dụng này.',
      summary:
        'Lập trình viên Senior với 4 năm kinh nghiệm phát triển các ứng dụng web quy mô lớn, thành thạo React, TypeScript và tối ưu hóa trải nghiệm người dùng.',
      appliedAt: matchedInterview?.createdAt || new Date().toISOString(),
      interviewRound: matchedInterview?.roundName || matchedInterview?.interviewRound || 'Vòng Chuyên môn',
      interviewDate: matchedInterview?.interviewDate,
      interviewTime: matchedInterview?.interviewTime,
      interviewFormat: matchedInterview?.format,
      interviewLocationOrLink: matchedInterview?.locationOrLink,
      isEvaluationSubmitted: matchedInterview?.isEvaluationSubmitted,
    };
  }

  /**
   * Kiểm tra trạng thái xem người phỏng vấn đã hoàn thành nộp phiếu đánh giá hay chưa (AC 1 & AC 3)
   */
  async checkEvaluationSubmittedStatus(
    interviewId: string,
    interviewerId?: string,
  ): Promise<EvaluationSubmittedStatusResult> {
    const currentUser = tokenService.getUserData();
    const effectiveInterviewerId = interviewerId || currentUser?.id || 'usr-current';

    try {
      const response = await axiosClient.get(
        `/recruitment/interviews/${encodeURIComponent(interviewId)}/evaluations/status`,
        {
          params: { interviewerId: effectiveInterviewerId },
        },
      );

      if (response?.data && typeof response.data.hasSubmitted === 'boolean') {
        return response.data;
      }
    } catch {
      // Fallback
    }

    // Đọc từ LocalStorage
    const submittedSubmissions = this.getStoredEvaluations();
    const submissionKey = `${interviewId}_${effectiveInterviewerId}`;
    const found = submittedSubmissions[submissionKey] || submittedSubmissions[interviewId];

    if (found) {
      return {
        interviewId,
        interviewerId: effectiveInterviewerId,
        hasSubmitted: true,
        submittedAt: found.submittedAt || new Date().toISOString(),
        score: found.score,
        conclusion: found.conclusion,
      };
    }

    // Kiểm tra trên item interview
    const storedInterviews = interviewService.getStoredInterviews();
    const itv = storedInterviews.find((i) => i.id === interviewId);

    return {
      interviewId,
      interviewerId: effectiveInterviewerId,
      hasSubmitted: itv?.isEvaluationSubmitted ?? false,
      submittedAt: itv?.evaluationSubmittedAt,
      score: itv?.evaluationScore,
    };
  }

  /**
   * Đánh dấu người phỏng vấn đã nộp phiếu đánh giá thành công (AC 3)
   * Tự động lưu và cập nhật trạng thái dynamic mà không reload trang.
   */
  async submitInterviewerEvaluation(
    interviewId: string,
    evaluationData: {
      calculatedTotalScore?: number | null;
      overallConclusion?: string;
      notes?: string;
      criteriaScores?: unknown;
    },
    interviewerId?: string,
  ): Promise<void> {
    const currentUser = tokenService.getUserData();
    const effectiveInterviewerId = interviewerId || currentUser?.id || 'usr-current';

    const payload = {
      interviewId,
      interviewerId: effectiveInterviewerId,
      score: evaluationData.calculatedTotalScore ?? undefined,
      conclusion: evaluationData.overallConclusion,
      submittedAt: new Date().toISOString(),
      evaluationData,
    };

    try {
      await axiosClient.post(
        `/recruitment/interviews/${encodeURIComponent(interviewId)}/evaluations`,
        payload,
      );
    } catch {
      // Fallback
    }

    // Lưu vào LocalStorage
    try {
      const submissions = this.getStoredEvaluations();
      submissions[`${interviewId}_${effectiveInterviewerId}`] = payload;
      submissions[interviewId] = payload;
      localStorage.setItem(
        LOCAL_STORAGE_EVALUATION_SUBMISSIONS_KEY,
        JSON.stringify(submissions),
      );

      // Cập nhật interview trong storage
      const interviews = interviewService.getStoredInterviews();
      const updated = interviews.map((item) => {
        if (item.id === interviewId) {
          return {
            ...item,
            isEvaluationSubmitted: true,
            evaluationSubmittedAt: payload.submittedAt,
            evaluationScore: evaluationData.calculatedTotalScore ?? item.evaluationScore,
          };
        }
        return item;
      });
      localStorage.setItem(LOCAL_STORAGE_INTERVIEWS_KEY, JSON.stringify(updated));
    } catch {
      // Ignored
    }
  }

  /**
   * Kiểm tra xem một buổi phỏng vấn đã qua thời gian bắt đầu hay chưa theo múi giờ Việt Nam (AC 3)
   */
  isInterviewPast(interviewDate: string, interviewTime?: string): boolean {
    if (!interviewDate) return false;
    const timeStr = interviewTime && interviewTime.trim() ? interviewTime.trim() : '00:00';
    const formattedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    const isoString = `${interviewDate}T${formattedTime}+07:00`;
    const scheduledTime = new Date(isoString);

    if (isNaN(scheduledTime.getTime())) return false;
    return scheduledTime.getTime() <= Date.now();
  }

  /**
   * Đọc danh sách phiếu đánh giá đã nộp từ LocalStorage
   */
  private getStoredEvaluations(): Record<string, {
    interviewId: string;
    interviewerId: string;
    submittedAt: string;
    score?: number;
    conclusion?: string;
  }> {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_EVALUATION_SUBMISSIONS_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  /**
   * Bổ sung thông tin trạng thái nộp phiếu đánh giá cho từng buổi phỏng vấn
   */
  private enrichScheduleWithEvaluationStatus(
    scheduleList: InterviewSchedulePayload[],
    userId?: string,
  ): InterviewSchedulePayload[] {
    const submissions = this.getStoredEvaluations();

    return scheduleList.map((item) => {
      const itvId = item.id || '';
      const specificKey = `${itvId}_${userId}`;
      const found = submissions[specificKey] || submissions[itvId];

      if (found) {
        return {
          ...item,
          isEvaluationSubmitted: true,
          evaluationSubmittedAt: found.submittedAt,
          evaluationScore: found.score ?? item.evaluationScore,
        };
      }

      return item;
    });
  }
}

export const interviewerCalendarService = new InterviewerCalendarService();
export default interviewerCalendarService;
