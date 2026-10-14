import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { candidateTimelineService } from '../src/services/candidateTimelineService';
import axiosClient from '../src/utils/axiosClient';
import type { TimelineEvent } from '../src/types/candidateTimeline';

describe('TKNHTTDNB1-402 / S5-07: Hiển thị dòng thời gian tương tác ứng viên', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AC 1 & AC 2: candidateTimelineService - Lấy dòng thời gian tương tác', () => {
    it('lấy toàn bộ danh sách sự kiện và tự động sắp xếp mới nhất trước (Newest First)', async () => {
      const events = await candidateTimelineService.getCandidateInteractionTimeline('can-demo-891');

      expect(events).toBeDefined();
      expect(events.length).toBeGreaterThanOrEqual(7);

      // Kiểm tra sắp xếp giảm dần theo thời gian (mới nhất lên đầu)
      for (let i = 0; i < events.length - 1; i++) {
        const currentTimestamp = new Date(events[i].timestamp).getTime();
        const nextTimestamp = new Date(events[i + 1].timestamp).getTime();
        expect(currentTimestamp).toBeGreaterThanOrEqual(nextTimestamp);
      }

      // Sự kiện đầu tiên phải là sự kiện mới nhất (2026-10-12)
      expect(events[0].id).toBe('evt-007');
      expect(events[0].eventType).toBe('EVALUATION_SUBMITTED');
    });

    it('gọi API backend qua axiosClient khi có kết nối', async () => {
      const mockApiEvents: TimelineEvent[] = [
        {
          id: 'evt-api-2',
          candidateId: 'can-123',
          eventType: 'EMAIL_SENT',
          timestamp: '2026-10-14T08:00:00.000Z',
          actor: { id: 'usr-1', fullName: 'HR Leader', role: 'Recruiter' },
          title: 'Email gửi xác nhận',
          summary: 'Đã gửi email',
        },
        {
          id: 'evt-api-1',
          candidateId: 'can-123',
          eventType: 'APPLICATION_SUBMITTED',
          timestamp: '2026-10-14T09:00:00.000Z',
          actor: { id: 'usr-2', fullName: 'Ứng viên', role: 'Candidate' },
          title: 'Nộp hồ sơ',
          summary: 'Nộp CV',
        },
      ];

      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({ data: mockApiEvents });

      const result = await candidateTimelineService.getCandidateInteractionTimeline('can-123');

      expect(axiosClient.get).toHaveBeenCalledWith('/candidates/can-123/timeline', {
        params: undefined,
      });
      // Đảm bảo kết quả API cũng được sắp xếp mới nhất lên đầu
      expect(result[0].id).toBe('evt-api-1'); // 09:00 > 08:00
      expect(result[1].id).toBe('evt-api-2');
    });

    it('fallback dữ liệu mẫu nội bộ khi API ném lỗi', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Network Error'));

      const events = await candidateTimelineService.getCandidateInteractionTimeline('can-demo-891');

      expect(events).toBeDefined();
      expect(events.length).toBe(7);
      expect(events[0].eventType).toBe('EVALUATION_SUBMITTED');
    });
  });

  describe('AC 2: Bộ lọc theo danh mục sự kiện (TimelineFilterCategory)', () => {
    it('lọc danh mục "APPLICATION_SUBMITTED": chỉ trả về sự kiện Nộp hồ sơ', async () => {
      const events = await candidateTimelineService.getCandidateInteractionTimeline(
        'can-demo-891',
        { category: 'APPLICATION_SUBMITTED' }
      );

      expect(events.length).toBeGreaterThan(0);
      events.forEach((e) => {
        expect(e.eventType).toBe('APPLICATION_SUBMITTED');
        expect(e.applicationSubmitted).toBeDefined();
      });
    });

    it('lọc danh mục "STAGE_CHANGED": chỉ trả về sự kiện Chuyển giai đoạn', async () => {
      const events = await candidateTimelineService.getCandidateInteractionTimeline(
        'can-demo-891',
        { category: 'STAGE_CHANGED' }
      );

      expect(events.length).toBeGreaterThan(0);
      events.forEach((e) => {
        expect(e.eventType).toBe('STAGE_CHANGED');
        expect(e.stageChanged).toBeDefined();
      });
    });

    it('lọc danh mục "EMAIL_SENT": chỉ trả về sự kiện Email đã gửi', async () => {
      const events = await candidateTimelineService.getCandidateInteractionTimeline(
        'can-demo-891',
        { category: 'EMAIL_SENT' }
      );

      expect(events.length).toBeGreaterThan(0);
      events.forEach((e) => {
        expect(e.eventType).toBe('EMAIL_SENT');
        expect(e.emailSent).toBeDefined();
        expect(e.emailSent?.recipientEmail).toBe('bao.lequoc.tech@gmail.com');
      });
    });

    it('lọc danh mục "INTERVIEW_SCHEDULED": chỉ trả về sự kiện Lịch phỏng vấn', async () => {
      const events = await candidateTimelineService.getCandidateInteractionTimeline(
        'can-demo-891',
        { category: 'INTERVIEW_SCHEDULED' }
      );

      expect(events.length).toBeGreaterThan(0);
      events.forEach((e) => {
        expect(e.eventType).toBe('INTERVIEW_SCHEDULED');
        expect(e.interviewScheduled).toBeDefined();
        expect(e.interviewScheduled?.locationOrMeetingLink).toContain('meet.google.com');
      });
    });

    it('lọc danh mục "EVALUATION": trả về cả Đánh giá phỏng vấn và Ghi chú nội bộ', async () => {
      const events = await candidateTimelineService.getCandidateInteractionTimeline(
        'can-demo-891',
        { category: 'EVALUATION' }
      );

      expect(events.length).toBe(2);
      const types = events.map((e) => e.eventType);
      expect(types).toContain('EVALUATION_SUBMITTED');
      expect(types).toContain('NOTE_ADDED');
    });

    it('khi lọc "ALL": trả về tất cả các loại sự kiện', async () => {
      const events = await candidateTimelineService.getCandidateInteractionTimeline(
        'can-demo-891',
        { category: 'ALL' }
      );

      expect(events.length).toBe(7);
    });
  });

  describe('AC 3: Định dạng ngày giờ chuẩn múi giờ Việt Nam và thời gian tương đối', () => {
    it('formatVietnamDateTime trả về đúng định dạng HH:mm - DD/MM/YYYY theo Asia/Ho_Chi_Minh', () => {
      // 2026-10-12T02:30:00.000Z tương ứng với 09:30 giờ Việt Nam (UTC+7)
      const formatted = candidateTimelineService.formatVietnamDateTime('2026-10-12T02:30:00.000Z');
      expect(formatted).toContain('09:30');
      expect(formatted).toContain('12/10/2026');
    });

    it('formatVietnamDateTime trả về chuỗi gốc an toàn nếu chuỗi ngày không hợp lệ', () => {
      const invalid = 'invalid-date-string';
      const result = candidateTimelineService.formatVietnamDateTime(invalid);
      expect(result).toBeDefined();
    });

    it('getRelativeTimeVN trả về thời gian tương đối bằng tiếng Việt', () => {
      const now = new Date();

      // Vừa xong (< 60s)
      const justNow = new Date(now.getTime() - 20 * 1000).toISOString();
      expect(candidateTimelineService.getRelativeTimeVN(justNow)).toBe('Vừa xong');

      // Vài phút trước (< 60m)
      const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
      expect(candidateTimelineService.getRelativeTimeVN(fiveMinsAgo)).toBe('5 phút trước');

      // Vài giờ trước (< 24h)
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
      expect(candidateTimelineService.getRelativeTimeVN(twoHoursAgo)).toBe('2 giờ trước');

      // Hôm qua (1 ngày trước)
      const yesterday = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString();
      expect(candidateTimelineService.getRelativeTimeVN(yesterday)).toBe('Hôm qua');

      // Vài ngày trước (< 7 ngày)
      const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
      expect(candidateTimelineService.getRelativeTimeVN(fourDaysAgo)).toBe('4 ngày trước');
    });
  });

  describe('Đầy đủ dữ liệu chi tiết cho 5 nhóm sự kiện chuẩn', () => {
    it('kiểm tra cấu trúc chi tiết của sự kiện APPLICATION_SUBMITTED', async () => {
      const events = await candidateTimelineService.getCandidateInteractionTimeline(
        'can-demo-891',
        { category: 'APPLICATION_SUBMITTED' }
      );
      const appEvt = events[0];
      expect(appEvt.applicationSubmitted?.jobTitle).toBeDefined();
      expect(appEvt.applicationSubmitted?.departmentName).toBeDefined();
      expect(appEvt.applicationSubmitted?.source.type).toBe('INTERNAL_REFERRAL');
      expect(appEvt.applicationSubmitted?.source.referrerName).toBe('Trần Văn Nam');
      expect(appEvt.applicationSubmitted?.cvFileName).toContain('.pdf');
    });

    it('kiểm tra cấu trúc chi tiết của sự kiện STAGE_CHANGED', async () => {
      const events = await candidateTimelineService.getCandidateInteractionTimeline(
        'can-demo-891',
        { category: 'STAGE_CHANGED' }
      );
      const stageEvt = events[0];
      expect(stageEvt.stageChanged?.fromStage).toBeDefined();
      expect(stageEvt.stageChanged?.toStage).toBeDefined();
      expect(stageEvt.stageChanged?.notes).toBeTruthy();
    });

    it('kiểm tra cấu trúc chi tiết của sự kiện EMAIL_SENT', async () => {
      const events = await candidateTimelineService.getCandidateInteractionTimeline(
        'can-demo-891',
        { category: 'EMAIL_SENT' }
      );
      const emailEvt = events[0];
      expect(emailEvt.emailSent?.subject).toContain('Thư mời phỏng vấn');
      expect(emailEvt.emailSent?.deliveryStatus).toBe('OPENED');
      expect(emailEvt.emailSent?.bodySnippet).toBeTruthy();
    });

    it('kiểm tra cấu trúc chi tiết của sự kiện INTERVIEW_SCHEDULED', async () => {
      const events = await candidateTimelineService.getCandidateInteractionTimeline(
        'can-demo-891',
        { category: 'INTERVIEW_SCHEDULED' }
      );
      const intEvt = events[0];
      expect(intEvt.interviewScheduled?.roundName).toBeDefined();
      expect(intEvt.interviewScheduled?.durationMinutes).toBe(60);
      expect(intEvt.interviewScheduled?.interviewers.length).toBeGreaterThan(0);
      expect(intEvt.interviewScheduled?.candidateResponseStatus).toBe('ACCEPTED');
    });

    it('kiểm tra cấu trúc chi tiết của sự kiện EVALUATION_SUBMITTED', async () => {
      const events = await candidateTimelineService.getCandidateInteractionTimeline(
        'can-demo-891',
        { category: 'EVALUATION' }
      );
      const evalEvt = events.find((e) => e.eventType === 'EVALUATION_SUBMITTED');
      expect(evalEvt).toBeDefined();
      expect(evalEvt?.evaluationSubmitted?.competencyScore).toBe(8.8);
      expect(evalEvt?.evaluationSubmitted?.maxScore).toBe(10);
      expect(evalEvt?.evaluationSubmitted?.result).toBe('PASSED');
      expect(evalEvt?.evaluationSubmitted?.strengths?.length).toBeGreaterThan(0);
    });
  });
});
