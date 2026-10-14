import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  candidateMergeService,
  UndoExpiredError,
  MergePermissionDeniedError,
} from '../src/services/candidateMergeService';
import type { UnifiedCandidate } from '../src/types/candidate';
import type { MergeFieldSelection } from '../src/types/duplicateCandidate';

const storage = new Map<string, string>();

const MOCK_PRIMARY: UnifiedCandidate = {
  id: 'can-demo-891',
  candidateCode: 'CAN-2026-0891',
  fullName: 'Lê Quốc Bảo',
  email: 'bao.lequoc.tech@gmail.com',
  phone: '0918 234 567',
  currentTitle: 'Senior Frontend Engineer',
  experienceYears: 5,
  rating: 4,
  coverLetter: 'Thư giới thiệu bản 2025',
  tags: [
    { id: 'tag-1', name: 'React', colorClass: 'bg-indigo-50 text-indigo-700' },
    { id: 'tag-2', name: 'TypeScript', colorClass: 'bg-blue-50 text-blue-700' },
  ],
  notes: [
    {
      id: 'note-1',
      content: 'Đã phỏng vấn vòng 1 sơ khảo.',
      authorName: 'Đặng Tuấn Anh',
      authorRole: 'Hiring Manager',
      createdAt: '2026-10-12T10:30:00.000Z',
      category: 'SCREENING',
    },
  ],
  applications: [
    {
      id: 'app-01',
      jobPostingId: 'jp-01',
      jobCode: 'REQ-2026-089',
      jobTitle: 'Senior Frontend Developer',
      departmentName: 'Khối Công nghệ',
      appliedAt: '2026-10-09T08:00:00.000Z',
      source: { type: 'INTERNAL_REFERRAL', label: 'Giới thiệu nội bộ' },
      recruiterId: 'rec-01',
      recruiterName: 'Nguyễn Văn Minh',
      hiringManagerId: 'hm-01',
      hiringManagerName: 'Đặng Tuấn Anh',
      stage: 'INTERVIEWING',
      cvFileName: 'CV_LeQuocBao_2026.pdf',
      cvFileSize: 850000,
      cvFileType: 'pdf',
      cvFileUrl: '/assets/sample.pdf',
      isCurrent: true,
    },
  ],
  currentApplicationId: 'app-01',
  createdAt: '2026-10-09T08:00:00.000Z',
  updatedAt: '2026-10-12T10:30:00.000Z',
};

const MOCK_DUPLICATE: UnifiedCandidate = {
  id: 'can-dup-0942',
  candidateCode: 'CAN-2026-0942',
  fullName: 'Lê Quốc Bảo (Robert Le)',
  email: 'bao.lequoc.tech@gmail.com',
  phone: '0918 234 567',
  currentTitle: 'Lead Frontend Architect',
  experienceYears: 6,
  rating: 5,
  coverLetter: 'Thư giới thiệu bản cập nhật Tech Lead 2026',
  tags: [
    { id: 'tag-3', name: 'React', colorClass: 'bg-indigo-50 text-indigo-700' }, // Trùng tên tag
    { id: 'tag-4', name: 'Micro-frontends', colorClass: 'bg-emerald-50 text-emerald-700' },
  ],
  notes: [
    {
      id: 'note-2',
      content: 'Ứng viên bổ sung nhiều kinh nghiệm Lead team 8 người.',
      authorName: 'Hoàng Thùy Linh',
      authorRole: 'Recruiter',
      createdAt: '2026-10-14T07:15:00.000Z',
      category: 'INTERVIEW',
    },
  ],
  applications: [
    {
      id: 'app-02',
      jobPostingId: 'jp-02',
      jobCode: 'REQ-2026-105',
      jobTitle: 'Frontend Technical Lead',
      departmentName: 'Khối Công nghệ',
      appliedAt: '2026-10-14T07:00:00.000Z',
      source: { type: 'CAREER_PAGE', label: 'Cổng nghề nghiệp' },
      recruiterId: 'rec-01',
      recruiterName: 'Nguyễn Văn Minh',
      hiringManagerId: 'hm-01',
      hiringManagerName: 'Đặng Tuấn Anh',
      stage: 'NEW',
      cvFileName: 'CV_Robert_Lead_2026.pdf',
      cvFileSize: 920000,
      cvFileType: 'pdf',
      cvFileUrl: '/assets/sample-updated.pdf',
      isCurrent: true,
    },
  ],
  currentApplicationId: 'app-02',
  createdAt: '2026-10-14T07:00:00.000Z',
  updatedAt: '2026-10-14T07:15:00.000Z',
};

describe('TKNHTTDNB1-366 / S5-01: candidateMergeService (Gộp & Hoàn tác hồ sơ trong 24 giờ)', () => {
  beforeEach(() => {
    storage.clear();
    storage.set(`smart_recruit_unified_candidates_${MOCK_PRIMARY.id}`, JSON.stringify(MOCK_PRIMARY));
    storage.set(`smart_recruit_unified_candidates_${MOCK_DUPLICATE.id}`, JSON.stringify(MOCK_DUPLICATE));

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

  describe('AC 1: Phát hiện hồ sơ trùng khớp & Lấy thông tin đối chiếu', () => {
    it('checkDuplicateCandidates phát hiện hồ sơ trùng khớp email và số điện thoại', async () => {
      const result = await candidateMergeService.checkDuplicateCandidates({
        candidateId: MOCK_PRIMARY.id,
        email: MOCK_PRIMARY.email,
        phone: MOCK_PRIMARY.phone,
      });

      expect(result).not.toBeNull();
      expect(result?.matchReason).toBe('BOTH');
      expect(result?.primaryCandidate.id).toBe(MOCK_PRIMARY.id);
      expect(result?.duplicateCandidate.candidateCode).toBe('CAN-2026-0942');
    });

    it('checkDuplicateCandidates trả về null nếu không có trùng lặp', async () => {
      const result = await candidateMergeService.checkDuplicateCandidates({
        email: 'unique.person@gmail.com',
        phone: '0999 888 777',
      });

      expect(result).toBeNull();
    });

    it('getDuplicateComparison lấy thông tin chi tiết cả 2 hồ sơ để đối chiếu', async () => {
      const comparison = await candidateMergeService.getDuplicateComparison(
        MOCK_PRIMARY.id,
        MOCK_DUPLICATE.id
      );

      expect(comparison).toBeDefined();
      expect(comparison.primaryCandidate.fullName).toBe(MOCK_PRIMARY.fullName);
      expect(comparison.duplicateCandidate.fullName).toBe(MOCK_DUPLICATE.fullName);
      expect(comparison.matchReason).toBe('BOTH');
    });
  });

  describe('AC 2: Gộp hồ sơ & Bảo toàn toàn bộ lịch sử ứng tuyển, CV, Tags và Notes', () => {
    it('hợp nhất thông tin theo đúng lựa chọn và bảo toàn 100% các đợt ứng tuyển', async () => {
      const selections: MergeFieldSelection = {
        fullName: 'duplicate', // Chọn tên mới: Lê Quốc Bảo (Robert Le)
        email: 'primary',
        phone: 'primary',
        currentTitle: 'duplicate', // Lead Frontend Architect
        experienceYears: 'duplicate', // 6 năm
        coverLetter: 'duplicate',
        rating: 'duplicate', // 5 sao
      };

      const result = await candidateMergeService.mergeCandidates({
        primaryCandidateId: MOCK_PRIMARY.id,
        duplicateCandidateId: MOCK_DUPLICATE.id,
        fieldSelections: selections,
      });

      const { mergedCandidate, mergeRecord } = result;

      // 1. Kiểm tra các trường cá nhân được chọn
      expect(mergedCandidate.fullName).toBe(MOCK_DUPLICATE.fullName);
      expect(mergedCandidate.currentTitle).toBe(MOCK_DUPLICATE.currentTitle);
      expect(mergedCandidate.experienceYears).toBe(6);
      expect(mergedCandidate.rating).toBe(5);
      expect(mergedCandidate.email).toBe(MOCK_PRIMARY.email);

      // 2. Bảo toàn 100% các đợt ứng tuyển của cả 2 hồ sơ (1 đợt + 1 đợt = 2 đợt)
      expect(mergedCandidate.applications.length).toBe(2);
      const appIds = mergedCandidate.applications.map((a) => a.id);
      expect(appIds).toContain('app-01');
      expect(appIds).toContain('app-02');

      // Tệp CV đính kèm của từng đợt được bảo toàn
      const cvFiles = mergedCandidate.applications.map((a) => a.cvFileName);
      expect(cvFiles).toContain('CV_LeQuocBao_2026.pdf');
      expect(cvFiles).toContain('CV_Robert_Lead_2026.pdf');

      // Đợt nộp mới nhất app-02 (2026-10-14) phải được sắp xếp trước app-01 (2026-10-09)
      expect(mergedCandidate.applications[0].id).toBe('app-02');

      // 3. Bảo toàn và gộp Nhãn Tags (loại bỏ trùng tên 'React')
      expect(mergedCandidate.tags.length).toBe(3); // React, TypeScript, Micro-frontends
      expect(mergedCandidate.tags.some((t) => t.name === 'Micro-frontends')).toBe(true);

      // 4. Bảo toàn và gộp Ghi chú nội bộ Notes (sắp xếp mới nhất lên đầu)
      expect(mergedCandidate.notes.length).toBe(2);
      expect(mergedCandidate.notes[0].id).toBe('note-2'); // Tạo ngày 14/10 xếp trước ngày 12/10

      // 5. Bản ghi hoàn tác được tạo thành công
      expect(mergeRecord.canUndo).toBe(true);
      expect(mergeRecord.primaryCandidateId).toBe(MOCK_PRIMARY.id);
    });
  });

  describe('AC 3: Kiểm tra thời hạn 24 giờ & Thao tác Hoàn tác (Undo)', () => {
    it('tính toán chính xác thời gian hoàn tác còn lại trong khung 24 giờ', () => {
      const now = Date.now();
      const expiresAt = new Date(now + 23 * 3600 * 1000 + 45 * 60 * 1000 + 2000).toISOString();

      const remaining = candidateMergeService.calculateRemainingTime(expiresAt);
      expect(remaining.isExpired).toBe(false);
      expect(remaining.hours).toBe(23);
      expect([44, 45]).toContain(remaining.minutes);
    });

    it('hoàn tác thành công trong vòng 24 giờ và khôi phục 2 hồ sơ độc lập', async () => {
      const selections: MergeFieldSelection = {
        fullName: 'duplicate',
        email: 'primary',
        phone: 'primary',
        currentTitle: 'duplicate',
        experienceYears: 'duplicate',
        coverLetter: 'duplicate',
        rating: 'duplicate',
      };

      const { mergeRecord } = await candidateMergeService.mergeCandidates({
        primaryCandidateId: MOCK_PRIMARY.id,
        duplicateCandidateId: MOCK_DUPLICATE.id,
        fieldSelections: selections,
      });

      // Thực hiện hoàn tác
      const { restoredPrimary, restoredDuplicate } =
        await candidateMergeService.undoMergeCandidates(mergeRecord.id);

      expect(restoredPrimary.fullName).toBe(MOCK_PRIMARY.fullName);
      expect(restoredDuplicate.fullName).toBe(MOCK_DUPLICATE.fullName);

      // Không thể hoàn tác lần 2
      await expect(
        candidateMergeService.undoMergeCandidates(mergeRecord.id)
      ).rejects.toThrow(UndoExpiredError);
    });

    it('từ chối hoàn tác và ném UndoExpiredError khi đã quá 24 giờ', async () => {
      const expiredRecord = {
        id: 'merge-past-24h',
        primaryCandidateId: MOCK_PRIMARY.id,
        duplicateCandidateId: MOCK_DUPLICATE.id,
        mergedAt: '2026-10-10T10:00:00.000Z',
        expiresAt: '2026-10-11T10:00:00.000Z', // Đã quá 24 giờ
        canUndo: true,
        originalPrimary: MOCK_PRIMARY,
        originalDuplicate: MOCK_DUPLICATE,
        fieldSelections: {
          fullName: 'primary' as const,
          email: 'primary' as const,
          phone: 'primary' as const,
          currentTitle: 'primary' as const,
          experienceYears: 'primary' as const,
          coverLetter: 'primary' as const,
          rating: 'primary' as const,
        },
      };

      storage.set(
        'smart_recruit_merge_history',
        JSON.stringify([expiredRecord])
      );

      // Kiểm tra calculateRemainingTime báo hết hạn
      const remaining = candidateMergeService.calculateRemainingTime(expiredRecord.expiresAt);
      expect(remaining.isExpired).toBe(true);

      // Gọi undo phải ném lỗi UndoExpiredError
      await expect(
        candidateMergeService.undoMergeCandidates('merge-past-24h')
      ).rejects.toThrow(UndoExpiredError);
    });

    it('định dạng thời gian chuẩn múi giờ Việt Nam (Asia/Ho_Chi_Minh)', () => {
      const formatted = candidateMergeService.formatVietnamDateTime('2026-10-14T07:00:00.000Z');
      expect(formatted).toBeTruthy();
      // UTC 07:00 -> VN (UTC+7) 14:00
      expect(formatted).toContain('14:00');
      expect(formatted).toContain('14/10/2026');
    });

    it('getMergeRecordForCandidate lấy đúng bản ghi gộp cho hồ sơ', () => {
      const activeRecord = {
        id: 'rec-test-1',
        primaryCandidateId: MOCK_PRIMARY.id,
        duplicateCandidateId: MOCK_DUPLICATE.id,
        mergedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
        canUndo: true,
        originalPrimary: MOCK_PRIMARY,
        originalDuplicate: MOCK_DUPLICATE,
        fieldSelections: {
          fullName: 'primary' as const,
          email: 'primary' as const,
          phone: 'primary' as const,
          currentTitle: 'primary' as const,
          experienceYears: 'primary' as const,
          coverLetter: 'primary' as const,
          rating: 'primary' as const,
        },
      };

      storage.set('smart_recruit_merge_history', JSON.stringify([activeRecord]));

      const record = candidateMergeService.getMergeRecordForCandidate(MOCK_PRIMARY.id);
      expect(record).not.toBeNull();
      expect(record?.id).toBe('rec-test-1');
    });

    it('MergePermissionDeniedError có status 403', () => {
      const err = new MergePermissionDeniedError();
      expect(err.status).toBe(403);
      expect(err.message).toContain('403 Forbidden');
    });
  });
});
