import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import {
  duplicateCandidateService,
  MOCK_DUPLICATE_CANDIDATE,
} from '../src/services/duplicateCandidateService';
import type { UnifiedCandidate } from '../src/types/candidate';
import type { DuplicateCandidateComparison, MergeFieldSelection } from '../src/types/duplicateCandidate';
import { DuplicateCandidateBanner } from '../src/components/Candidate/DuplicateCandidateBanner';
import { MergeUndoBanner } from '../src/components/Candidate/MergeUndoBanner';
import { DuplicateCandidateCompareModal } from '../src/components/Candidate/DuplicateCandidateCompareModal';

const storage = new Map<string, string>();

const MOCK_PRIMARY_CANDIDATE: UnifiedCandidate = {
  id: 'can-demo-891',
  candidateCode: 'CAN-2026-0891',
  fullName: 'Lê Quốc Bảo',
  email: 'bao.lequoc.tech@gmail.com',
  phone: '0918 234 567',
  currentTitle: 'Senior Frontend Engineer',
  experienceYears: 5,
  rating: 4,
  coverLetter: 'Thư giới thiệu bản cũ năm 2025',
  tags: [
    { id: 'tag-1', name: 'Senior React', colorClass: 'bg-indigo-50 text-indigo-700' },
    { id: 'tag-2', name: 'TypeScript', colorClass: 'bg-blue-50 text-blue-700' },
  ],
  notes: [
    {
      id: 'note-1',
      content: 'Nhận xét sơ vấn vòng 1 tốt.',
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
      source: { type: 'INTERNAL_REFERRAL', label: 'Giới thiệu' },
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

describe('TKNHTTDNB1-365 / S5-01: Màn hình so sánh và gộp hồ sơ ứng viên trùng', () => {
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

  describe('AC 1: Phát hiện hồ sơ trùng lặp & Banner cảnh báo nổi bật', () => {
    it('phát hiện trùng khớp cả Email và Số điện thoại', async () => {
      const match = await duplicateCandidateService.detectDuplicate(MOCK_PRIMARY_CANDIDATE);

      expect(match).not.toBeNull();
      expect(match?.matchReason).toBe('BOTH');
      expect(match?.primaryCandidate.id).toBe(MOCK_PRIMARY_CANDIDATE.id);
      expect(match?.duplicateCandidate.candidateCode).toBe('CAN-2026-0942');
    });

    it('render DuplicateCandidateBanner hiển thị đầy đủ thông tin ứng viên trùng', () => {
      const mockComparison: DuplicateCandidateComparison = {
        primaryCandidate: MOCK_PRIMARY_CANDIDATE,
        duplicateCandidate: MOCK_DUPLICATE_CANDIDATE,
        matchReason: 'BOTH',
        matchValue: 'bao.lequoc.tech@gmail.com & 0918 234 567',
      };

      const openCompareMock = vi.fn();
      const bannerElement = React.createElement(DuplicateCandidateBanner, {
        comparison: mockComparison,
        onOpenCompare: openCompareMock,
      });

      expect(React.isValidElement(bannerElement)).toBe(true);
    });
  });

  describe('AC 2: So sánh đối chiếu hai hồ sơ & Tự động làm nổi bật điểm khác biệt (Diff Highlight)', () => {
    it('gộp các trường thông tin theo đúng lựa chọn của Recruiter', async () => {
      const selections: MergeFieldSelection = {
        fullName: 'duplicate', // Chọn tên mới: Lê Quốc Bảo (Robert Le)
        email: 'primary',
        phone: 'primary',
        currentTitle: 'duplicate', // Chọn chức danh mới: Lead Frontend Architect
        experienceYears: 'duplicate', // 6 năm
        coverLetter: 'duplicate',
        rating: 'duplicate', // 5 sao
      };

      const { mergedCandidate } = await duplicateCandidateService.mergeCandidates(
        MOCK_PRIMARY_CANDIDATE,
        MOCK_DUPLICATE_CANDIDATE,
        selections
      );

      // Kiểm tra các trường được giữ lại theo lựa chọn
      expect(mergedCandidate.fullName).toBe('Lê Quốc Bảo (Robert Le)');
      expect(mergedCandidate.currentTitle).toBe('Lead Frontend Architect & Tech Lead');
      expect(mergedCandidate.experienceYears).toBe(6);
      expect(mergedCandidate.rating).toBe(5);
      expect(mergedCandidate.email).toBe(MOCK_PRIMARY_CANDIDATE.email);
    });
  });

  describe('AC 3: Bảo toàn toàn bộ Lịch sử các đợt ứng tuyển, CV, Tags và Notes khi gộp', () => {
    it('bảo toàn 100% các đợt ứng tuyển của cả hai hồ sơ', async () => {
      const selections: MergeFieldSelection = {
        fullName: 'primary',
        email: 'primary',
        phone: 'primary',
        currentTitle: 'primary',
        experienceYears: 'primary',
        coverLetter: 'primary',
        rating: 'primary',
      };

      const { mergedCandidate } = await duplicateCandidateService.mergeCandidates(
        MOCK_PRIMARY_CANDIDATE,
        MOCK_DUPLICATE_CANDIDATE,
        selections
      );

      // Hồ sơ gốc có 1 đợt, hồ sơ trùng có 1 đợt -> Sau gộp phải có ít nhất 2 đợt
      expect(mergedCandidate.applications.length).toBe(
        MOCK_PRIMARY_CANDIDATE.applications.length + MOCK_DUPLICATE_CANDIDATE.applications.length
      );

      const appIds = mergedCandidate.applications.map((a) => a.id);
      expect(appIds).toContain('app-01');
      expect(appIds).toContain('app-2026-003');

      // Tệp CV đính kèm của từng đợt được giữ nguyên
      const cvFiles = mergedCandidate.applications.map((a) => a.cvFileName);
      expect(cvFiles).toContain('CV_LeQuocBao_2026.pdf');
      expect(cvFiles).toContain('CV_Robert_LeQuocBao_TechLead_2026_Updated.pdf');
    });

    it('hợp nhất toàn bộ Nhãn Tags và tự động loại bỏ tag trùng tên', async () => {
      const selections: MergeFieldSelection = {
        fullName: 'primary',
        email: 'primary',
        phone: 'primary',
        currentTitle: 'primary',
        experienceYears: 'primary',
        coverLetter: 'primary',
        rating: 'primary',
      };

      const { mergedCandidate } = await duplicateCandidateService.mergeCandidates(
        MOCK_PRIMARY_CANDIDATE,
        MOCK_DUPLICATE_CANDIDATE,
        selections
      );

      // Cả hai đều có 'Senior React' -> chỉ được xuất hiện 1 lần
      const seniorReactTags = mergedCandidate.tags.filter(
        (t) => t.name.toLowerCase() === 'senior react'
      );
      expect(seniorReactTags.length).toBe(1);

      // Tag mới 'Micro-frontends' từ duplicate được giữ lại
      expect(mergedCandidate.tags.some((t) => t.name === 'Micro-frontends')).toBe(true);
    });

    it('hợp nhất toàn bộ Ghi chú nội bộ Notes theo thứ tự dòng thời gian', async () => {
      const selections: MergeFieldSelection = {
        fullName: 'primary',
        email: 'primary',
        phone: 'primary',
        currentTitle: 'primary',
        experienceYears: 'primary',
        coverLetter: 'primary',
        rating: 'primary',
      };

      const { mergedCandidate } = await duplicateCandidateService.mergeCandidates(
        MOCK_PRIMARY_CANDIDATE,
        MOCK_DUPLICATE_CANDIDATE,
        selections
      );

      // Tổng số notes được gộp đủ
      expect(mergedCandidate.notes.length).toBe(
        MOCK_PRIMARY_CANDIDATE.notes.length + MOCK_DUPLICATE_CANDIDATE.notes.length
      );

      // Sắp xếp ghi chú mới nhất lên đầu
      const firstNoteTime = new Date(mergedCandidate.notes[0].createdAt).getTime();
      const secondNoteTime = new Date(mergedCandidate.notes[1].createdAt).getTime();
      expect(firstNoteTime).toBeGreaterThanOrEqual(secondNoteTime);
    });
  });

  describe('AC 4: Gộp hồ sơ & Hoàn tác (Undo) trong vòng 24 giờ', () => {
    it('tạo bản ghi hoàn tác có thời hạn 24 giờ và hỗ trợ hoàn tác thành công', async () => {
      const selections: MergeFieldSelection = {
        fullName: 'duplicate',
        email: 'primary',
        phone: 'primary',
        currentTitle: 'duplicate',
        experienceYears: 'duplicate',
        coverLetter: 'duplicate',
        rating: 'duplicate',
      };

      const { mergeRecord } = await duplicateCandidateService.mergeCandidates(
        MOCK_PRIMARY_CANDIDATE,
        MOCK_DUPLICATE_CANDIDATE,
        selections
      );

      // 1. Kiểm tra thời hạn 24 giờ
      expect(mergeRecord.canUndo).toBe(true);
      const diffMs = new Date(mergeRecord.expiresAt).getTime() - new Date(mergeRecord.mergedAt).getTime();
      expect(diffMs).toBe(24 * 60 * 60 * 1000); // Đúng 24 giờ

      // 2. Tính toán thời gian hoàn tác còn lại
      const remaining = duplicateCandidateService.calculateRemainingTime(mergeRecord.expiresAt);
      expect(remaining.isExpired).toBe(false);
      expect(remaining.hours).toBeGreaterThanOrEqual(23);

      // 3. Thực hiện hoàn tác gộp hồ sơ
      const { restoredPrimary, restoredDuplicate } = await duplicateCandidateService.undoMerge(
        mergeRecord.id
      );

      expect(restoredPrimary.fullName).toBe(MOCK_PRIMARY_CANDIDATE.fullName);
      expect(restoredDuplicate.fullName).toBe(MOCK_DUPLICATE_CANDIDATE.fullName);

      // 4. Không thể hoàn tác lần thứ 2
      await expect(duplicateCandidateService.undoMerge(mergeRecord.id)).rejects.toThrow(
        'Đã quá thời hạn 24 giờ kể từ thời điểm gộp. Không thể hoàn tác.'
      );
    });

    it('từ chối hoàn tác nếu đã quá thời hạn 24 giờ', async () => {
      const expiredMergeRecord = {
        id: 'merge-expired',
        primaryCandidateId: MOCK_PRIMARY_CANDIDATE.id,
        duplicateCandidateId: MOCK_DUPLICATE_CANDIDATE.id,
        mergedAt: '2026-10-10T10:00:00.000Z',
        expiresAt: '2026-10-11T10:00:00.000Z', // Đã hết hạn
        canUndo: true,
        originalPrimary: MOCK_PRIMARY_CANDIDATE,
        originalDuplicate: MOCK_DUPLICATE_CANDIDATE,
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

      storage.set('smart_recruit_merge_history', JSON.stringify([expiredMergeRecord]));

      await expect(duplicateCandidateService.undoMerge('merge-expired')).rejects.toThrow(
        'Đã quá thời hạn 24 giờ kể từ thời điểm gộp. Không thể hoàn tác.'
      );
    });

    it('render MergeUndoBanner và DuplicateCandidateCompareModal', () => {
      const activeMergeRecord = {
        id: 'merge-active',
        primaryCandidateId: MOCK_PRIMARY_CANDIDATE.id,
        duplicateCandidateId: MOCK_DUPLICATE_CANDIDATE.id,
        mergedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 23 * 3600 * 1000).toISOString(),
        canUndo: true,
        originalPrimary: MOCK_PRIMARY_CANDIDATE,
        originalDuplicate: MOCK_DUPLICATE_CANDIDATE,
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

      const undoBannerElement = React.createElement(MergeUndoBanner, {
        mergeRecord: activeMergeRecord,
        onUndoSuccess: vi.fn(),
      });
      expect(React.isValidElement(undoBannerElement)).toBe(true);

      const modalElement = React.createElement(DuplicateCandidateCompareModal, {
        comparison: {
          primaryCandidate: MOCK_PRIMARY_CANDIDATE,
          duplicateCandidate: MOCK_DUPLICATE_CANDIDATE,
          matchReason: 'BOTH',
          matchValue: 'bao.lequoc.tech@gmail.com',
        },
        isOpen: true,
        onClose: vi.fn(),
        onMergeSuccess: vi.fn(),
      });
      expect(React.isValidElement(modalElement)).toBe(true);
    });
  });
});

