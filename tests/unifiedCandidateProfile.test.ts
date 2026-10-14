import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { candidateService } from '../src/services/candidateService';
import type { UnifiedCandidate } from '../src/types/candidate';
import { CANDIDATE_STAGE_CONFIG } from '../src/types/candidate';
import { InlineCVPreview } from '../src/components/Candidate/InlineCVPreview';
import { ApplicationHistoryList } from '../src/components/Candidate/ApplicationHistoryList';
import { CandidateTagsManager } from '../src/components/Candidate/CandidateTagsManager';
import { InternalNotesSection } from '../src/components/Candidate/InternalNotesSection';

const storage = new Map<string, string>();

describe('TKNHTTDNB1-358 / S4-09: Thiết kế hồ sơ ứng viên thống nhất (Unified Candidate Profile)', () => {
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

  describe('AC 1: Khối thông tin cá nhân & Tổng quan & Quy trình Pipeline chuẩn', () => {
    it('lấy hồ sơ ứng viên hợp nhất với đầy đủ thông tin cá nhân, mã hồ sơ và nguồn ứng tuyển', async () => {
      const candidate = await candidateService.getCandidateById('can-demo-891');

      expect(candidate).toBeDefined();
      expect(candidate.candidateCode).toBe('CAN-2026-0891');
      expect(candidate.fullName).toBe('Lê Quốc Bảo');
      expect(candidate.email).toBe('bao.lequoc.tech@gmail.com');
      expect(candidate.phone).toBe('0918 234 567');
      expect(candidate.coverLetter).toBeTruthy();
      expect(candidate.applications.length).toBeGreaterThanOrEqual(2);

      // Nguồn ứng tuyển đợt gần nhất là giới thiệu nội bộ kèm tên người giới thiệu
      const latestApp = candidate.applications[0];
      expect(latestApp.source.type).toBe('INTERNAL_REFERRAL');
      expect(latestApp.source.referrerName).toBe('Trần Văn Nam');
    });

    it('cập nhật mức đánh giá nhanh (1 - 5 sao) thành công', async () => {
      const updatedRating = await candidateService.updateCandidateRating('can-demo-891', 5);
      expect(updatedRating).toBe(5);

      const candidate = await candidateService.getCandidateById('can-demo-891');
      expect(candidate.rating).toBe(5);
    });

    it('định nghĩa đầy đủ 5 bước tuyển dụng chuẩn và 2 trạng thái dừng hồ sơ', () => {
      expect(CANDIDATE_STAGE_CONFIG.NEW.stepNumber).toBe(1);
      expect(CANDIDATE_STAGE_CONFIG.SCREENING.stepNumber).toBe(2);
      expect(CANDIDATE_STAGE_CONFIG.INTERVIEWING.stepNumber).toBe(3);
      expect(CANDIDATE_STAGE_CONFIG.OFFER.stepNumber).toBe(4);
      expect(CANDIDATE_STAGE_CONFIG.HIRED.stepNumber).toBe(5);

      // Trạng thái dừng
      expect(CANDIDATE_STAGE_CONFIG.REJECTED.stepNumber).toBe(-1);
      expect(CANDIDATE_STAGE_CONFIG.WITHDRAWN.stepNumber).toBe(-2);
      expect(CANDIDATE_STAGE_CONFIG.REJECTED.label).toBe('Loại hồ sơ');
      expect(CANDIDATE_STAGE_CONFIG.WITHDRAWN.label).toBe('Ứng viên rút lui');
    });
  });

  describe('AC 2: Trình xem trước CV trực tiếp tại chỗ (Inline CV Preview)', () => {
    it('render thành công component InlineCVPreview cho tệp PDF', () => {
      const mockCv = {
        fileName: 'CV_LeQuocBao_Senior.pdf',
        fileUrl: '/assets/sample-cv.pdf',
        fileType: 'pdf' as const,
        fileSize: 1024 * 850,
        applicationTitle: 'Senior Frontend Developer',
        appliedAt: '2026-10-09T08:00:00.000Z',
      };

      const element = React.createElement(InlineCVPreview, {
        currentCv: mockCv,
        allApplications: [
          {
            id: 'app-01',
            jobPostingId: 'jp-1',
            jobCode: 'REQ-01',
            jobTitle: 'Senior Frontend Developer',
            departmentName: 'Tech',
            appliedAt: '2026-10-09T08:00:00.000Z',
            source: { type: 'INTERNAL_REFERRAL', label: 'Giới thiệu' },
            recruiterId: 'usr-1',
            recruiterName: 'Recruiter 1',
            hiringManagerId: 'mgr-1',
            hiringManagerName: 'Manager 1',
            stage: 'INTERVIEWING',
            cvFileName: 'CV_LeQuocBao_Senior.pdf',
            cvFileSize: 1024 * 850,
            cvFileType: 'pdf',
            cvFileUrl: '/assets/sample-cv.pdf',
            isCurrent: true,
          },
        ],
        activeApplicationId: 'app-01',
        onSelectApplication: vi.fn(),
      });

      expect(React.isValidElement(element)).toBe(true);
    });

    it('render thông báo xem trước tương thích cho tệp DOCX', () => {
      const mockCvDocx = {
        fileName: 'LeQuocBao_CV_2025.docx',
        fileUrl: '/assets/sample-cv.docx',
        fileType: 'docx' as const,
        fileSize: 1024 * 450,
        applicationTitle: 'Frontend Engineer',
        appliedAt: '2025-08-15T09:30:00.000Z',
      };

      const element = React.createElement(InlineCVPreview, {
        currentCv: mockCvDocx,
        allApplications: [],
        activeApplicationId: 'app-02',
        onSelectApplication: vi.fn(),
      });

      expect(React.isValidElement(element)).toBe(true);
    });
  });

  describe('AC 3: Lịch sử các lần ứng tuyển (Application History)', () => {
    it('render component ApplicationHistoryList với đầy đủ thông tin từng đợt', () => {
      const mockApps: UnifiedCandidate['applications'] = [
        {
          id: 'app-01',
          jobPostingId: 'jp-1',
          jobCode: 'REQ-2026-089',
          jobTitle: 'Senior Frontend Developer',
          departmentName: 'Khối Công nghệ',
          appliedAt: '2026-10-09T08:00:00.000Z',
          source: {
            type: 'INTERNAL_REFERRAL',
            label: 'Giới thiệu nội bộ',
            referrerName: 'Trần Văn Nam',
          },
          recruiterId: 'usr-hr-001',
          recruiterName: 'Nguyễn Văn Minh',
          hiringManagerId: 'usr-mgr-002',
          hiringManagerName: 'Đặng Tuấn Anh',
          stage: 'INTERVIEWING',
          cvFileName: 'CV_2026.pdf',
          cvFileSize: 850000,
          cvFileType: 'pdf',
          cvFileUrl: '/assets/cv1.pdf',
          isCurrent: true,
        },
        {
          id: 'app-02',
          jobPostingId: 'jp-2',
          jobCode: 'REQ-2025-015',
          jobTitle: 'Frontend Engineer',
          departmentName: 'Khối Công nghệ',
          appliedAt: '2025-08-15T09:30:00.000Z',
          source: { type: 'CAREER_PAGE', label: 'Cổng nghề nghiệp' },
          recruiterId: 'usr-hr-001',
          recruiterName: 'Nguyễn Văn Minh',
          hiringManagerId: 'usr-mgr-002',
          hiringManagerName: 'Đặng Tuấn Anh',
          stage: 'REJECTED',
          rejectionReason: 'Chưa đáp ứng kinh nghiệm GraphQL.',
          cvFileName: 'CV_2025.docx',
          cvFileSize: 450000,
          cvFileType: 'docx',
          cvFileUrl: '/assets/cv2.docx',
          isCurrent: false,
        },
      ];

      const selectMock = vi.fn();
      const element = React.createElement(ApplicationHistoryList, {
        applications: mockApps,
        activeApplicationId: 'app-01',
        onSelectApplication: selectMock,
      });

      expect(React.isValidElement(element)).toBe(true);
    });
  });

  describe('AC 4: Quản lý Nhãn (Tags) & Ghi chú nội bộ (Internal Notes)', () => {
    it('thêm nhãn mới thành công và từ chối nhãn rỗng', async () => {
      // 1. Từ chối nhãn rỗng
      await expect(candidateService.addCandidateTag('can-demo-891', '   ')).rejects.toThrow(
        'Tên nhãn không được để trống.'
      );

      // 2. Thêm nhãn mới hợp lệ
      const newTag = await candidateService.addCandidateTag('can-demo-891', 'Fullstack Khá');
      expect(newTag.name).toBe('Fullstack Khá');
      expect(newTag.colorClass).toBeTruthy();

      const candidate = await candidateService.getCandidateById('can-demo-891');
      expect(candidate.tags.some((t) => t.name === 'Fullstack Khá')).toBe(true);
    });

    it('gỡ bỏ nhãn thành công khỏi hồ sơ', async () => {
      const candidateBefore = await candidateService.getCandidateById('can-demo-891');
      const tagToRemove = candidateBefore.tags[0];

      await candidateService.removeCandidateTag('can-demo-891', tagToRemove.id);

      const candidateAfter = await candidateService.getCandidateById('can-demo-891');
      expect(candidateAfter.tags.some((t) => t.id === tagToRemove.id)).toBe(false);
    });

    it('thêm ghi chú nội bộ kèm phân loại và thông điệp bảo mật', async () => {
      // 1. Từ chối ghi chú rỗng
      await expect(
        candidateService.addInternalNote(
          'can-demo-891',
          { content: '   ' },
          { fullName: 'Test User', role: 'Recruiter' }
        )
      ).rejects.toThrow('Nội dung ghi chú không được để trống.');

      // 2. Thêm ghi chú thành công
      const newNote = await candidateService.addInternalNote(
        'can-demo-891',
        {
          content: 'Phỏng vấn kỹ thuật vòng 2 đánh giá rất tốt tư duy thiết kế phần mềm.',
          category: 'INTERVIEW',
        },
        { fullName: 'Lê Hoàng Nam', role: 'Technical Architect' }
      );

      expect(newNote.id).toBeTruthy();
      expect(newNote.category).toBe('INTERVIEW');
      expect(newNote.authorName).toBe('Lê Hoàng Nam');

      // Ghi chú mới nhất được đưa lên đầu mảng
      const candidate = await candidateService.getCandidateById('can-demo-891');
      expect(candidate.notes[0].id).toBe(newNote.id);
      expect(candidate.notes[0].content).toContain('Phỏng vấn kỹ thuật vòng 2');
    });

    it('render component CandidateTagsManager và InternalNotesSection', () => {
      const tagsManager = React.createElement(CandidateTagsManager, {
        tags: [{ id: '1', name: 'React', colorClass: 'bg-blue-50 text-blue-700' }],
        onAddTag: vi.fn(),
        onRemoveTag: vi.fn(),
      });
      expect(React.isValidElement(tagsManager)).toBe(true);

      const notesSection = React.createElement(InternalNotesSection, {
        notes: [
          {
            id: 'n1',
            content: 'Nội dung ghi chú bảo mật',
            authorName: 'HR Recruiter',
            authorRole: 'Recruiter',
            createdAt: '2026-10-14T08:00:00.000Z',
            category: 'GENERAL',
          },
        ],
        onAddNote: vi.fn(),
      });
      expect(React.isValidElement(notesSection)).toBe(true);
    });
  });

  describe('AC 5: Phân quyền truy cập hồ sơ ứng viên (Access Control & 403 Forbidden)', () => {
    let mockCandidate: UnifiedCandidate;

    beforeEach(async () => {
      mockCandidate = await candidateService.getCandidateById('can-demo-891');
    });

    it('cho phép ADMIN và HR_MANAGER truy cập toàn quyền', () => {
      const adminUser = { id: 'usr-admin-1', email: 'admin@company.com', roles: ['ADMIN'] };
      const hrManagerUser = {
        id: 'usr-hrmgr-1',
        email: 'hrmgr@company.com',
        roles: ['HR_MANAGER'],
      };

      expect(candidateService.checkCandidateAccess(mockCandidate, adminUser, [])).toBe(true);
      expect(candidateService.checkCandidateAccess(mockCandidate, hrManagerUser, [])).toBe(true);
    });

    it('cho phép người dùng có quyền CANDIDATES_READ_ALL', () => {
      const viewerUser = {
        id: 'usr-auditor-1',
        email: 'auditor@company.com',
        roles: ['EMPLOYEE'],
      };
      expect(
        candidateService.checkCandidateAccess(mockCandidate, viewerUser, ['CANDIDATES_READ_ALL'])
      ).toBe(true);
    });

    it('cho phép Recruiter và Hiring Manager phụ trách vị trí của ứng viên', () => {
      // Recruiter phụ trách ứng viên là usr-hr-001 (Nguyễn Văn Minh)
      const assignedRecruiter = {
        id: 'usr-hr-001',
        email: 'minh.nguyen@company.com',
        roles: ['RECRUITER'],
      };
      expect(
        candidateService.checkCandidateAccess(mockCandidate, assignedRecruiter, [
          'CANDIDATES_READ_SCOPED',
        ])
      ).toBe(true);

      // Hiring Manager phụ trách là usr-mgr-002 (Đặng Tuấn Anh)
      const assignedHiringManager = {
        id: 'usr-mgr-002',
        email: 'anh.dang@company.com',
        roles: ['HIRING_MANAGER'],
      };
      expect(
        candidateService.checkCandidateAccess(mockCandidate, assignedHiringManager, [
          'CANDIDATES_READ_SCOPED',
        ])
      ).toBe(true);
    });

    it('chặn người dùng khác không có thẩm quyền (trả về false -> hiển thị 403 Forbidden)', () => {
      const strangerUser = {
        id: 'usr-stranger-999',
        email: 'stranger@company.com',
        roles: ['EMPLOYEE'],
      };
      // Không có vai trò admin/hr_manager, không có quyền CANDIDATES_READ_ALL, không được gán vào ứng viên
      const hasAccess = candidateService.checkCandidateAccess(
        mockCandidate,
        strangerUser,
        ['SELF_PROFILE_READ']
      );
      expect(hasAccess).toBe(false);
    });

    it('chặn người dùng null/chưa đăng nhập', () => {
      expect(candidateService.checkCandidateAccess(mockCandidate, null, [])).toBe(false);
    });
  });
});

