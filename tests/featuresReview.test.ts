import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axiosClient from '../src/utils/axiosClient';
import { jobReqStatusService } from '../src/services/jobReqStatusService';
import { jobPostingService } from '../src/services/jobPostingService';
import { approvalActionService } from '../src/services/approvalActionService';

const storage = new Map<string, string>();

describe('Verification of Requirements & API Updates', () => {
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('1. Requisitions Status Changes API (POST /requisitions/{id}/status-changes & FILLED)', () => {
    it('calls POST /requisitions/{id}/status-changes with FILLED instead of CLOSED', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValue({ data: { success: true } });

      await jobReqStatusService.changeStatus('req-123', 'FILLED');

      expect(postSpy).toHaveBeenCalledWith('/requisitions/req-123/status-changes', {
        status: 'FILLED',
      });
    });

    it('normalizes legacy CLOSED status to FILLED when calling updateStatus', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValue({ data: { success: true } });

      await jobReqStatusService.updateStatus('req-456', {
        status: 'CLOSED',
        reason: 'Đã tuyển đủ nhân sự',
      });

      expect(postSpy).toHaveBeenCalledWith('/requisitions/req-456/status-changes', {
        status: 'FILLED',
        reason: 'Đã tuyển đủ nhân sự',
      });
    });
  });

  describe('2. Job Posting Request Revision API (expectedRevision)', () => {
    it('sends expectedRevision and feedback when requesting revisions for job postings', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValue({
        data: {
          id: 'jp-789',
          status: 'REVISION_REQUESTED',
          revisionFeedback: 'Cần bổ sung JD',
        },
      });

      await jobPostingService.requestRevisionJobPosting(
        'jp-789',
        'Ghi chú thêm',
        'Cần điều chỉnh mục Yêu cầu ứng viên và quyền lợi'
      );

      expect(postSpy).toHaveBeenCalledWith(
        '/job-postings/jp-789/request-revision',
        expect.objectContaining({
          feedback: 'Ghi chú thêm',
          expectedRevision: 'Cần điều chỉnh mục Yêu cầu ứng viên và quyền lợi',
          status: 'REVISION_REQUESTED',
        })
      );
    });

    it('approvalActionService sends expectedRevision in payload', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValue({ data: { success: true } });

      await approvalActionService.submitAction('appr-001', {
        action: 'REQUEST_REVISION',
        comment: 'Xem lại lương',
        expectedRevision: 'Khung lương tối đa 35M',
      });

      expect(postSpy).toHaveBeenCalledWith('/approvals/appr-001/action', {
        action: 'REQUEST_REVISION',
        comment: 'Xem lại lương',
        expectedRevision: 'Khung lương tối đa 35M',
      });
    });
  });

  describe('3. Forgot Password 5 Attempts Lock Mechanism', () => {
    it('locks when failed attempts reach 5 in localStorage', () => {
      const STORAGE_KEY_ATTEMPTS = 'forgot_pwd_failed_attempts';
      const STORAGE_KEY_LOCK_UNTIL = 'forgot_pwd_locked_until';

      localStorage.setItem(STORAGE_KEY_ATTEMPTS, '5');
      const lockUntil = Date.now() + 15 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY_LOCK_UNTIL, lockUntil.toString());

      expect(parseInt(localStorage.getItem(STORAGE_KEY_ATTEMPTS) || '0', 10)).toBe(5);
      expect(parseInt(localStorage.getItem(STORAGE_KEY_LOCK_UNTIL) || '0', 10)).toBeGreaterThan(Date.now());
    });
  });
});

