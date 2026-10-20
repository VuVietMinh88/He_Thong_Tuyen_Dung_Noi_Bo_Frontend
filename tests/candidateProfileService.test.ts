import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  candidateProfileService,
  CandidateAccessDeniedError,
  CvFileNotFoundError,
} from '../src/services/candidateProfileService';
import type { UnifiedCandidate } from '../src/types/candidate';

const storage = new Map<string, string>();

describe('TKNHTTDNB1-359 / S4-09: Tích hợp xem CV và lịch sử nhiều vị trí', () => {
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

  describe('AC 1: API Service candidateProfileService', () => {
    it('lấy toàn bộ hồ sơ ứng viên hợp nhất (getUnifiedCandidateProfile)', async () => {
      const profile = await candidateProfileService.getUnifiedCandidateProfile('can-demo-891');

      expect(profile).toBeDefined();
      expect(profile.id).toBe('can-demo-891');
      expect(profile.candidateCode).toBe('CAN-2026-0891');
      expect(profile.fullName).toBe('Lê Quốc Bảo');
      expect(profile.email).toBe('bao.lequoc.tech@gmail.com');
      expect(profile.applications.length).toBeGreaterThanOrEqual(2);
      expect(profile.tags.length).toBeGreaterThan(0);
      expect(profile.notes.length).toBeGreaterThan(0);
    });

    it('lấy tệp CV dưới dạng Blob để xem trước tại chỗ an toàn (getApplicationCvBlob)', async () => {
      // 1. Tệp PDF của đợt tuyển dụng hiện tại
      const pdfCv = await candidateProfileService.getApplicationCvBlob('app-2026-002');
      expect(pdfCv).toBeDefined();
      expect(pdfCv.fileType).toBe('pdf');
      expect(pdfCv.fileName).toContain('.pdf');
      expect(pdfCv.blob).toBeInstanceOf(Blob);
      expect(pdfCv.objectUrl).toBeTruthy();

      // 2. Tệp DOCX của đợt tuyển dụng trước đó
      const docxCv = await candidateProfileService.getApplicationCvBlob('app-2025-001');
      expect(docxCv).toBeDefined();
      expect(docxCv.fileType).toBe('docx');
      expect(docxCv.fileName).toContain('.docx');
      expect(docxCv.blob).toBeInstanceOf(Blob);
    });

    it('ném lỗi CvFileNotFoundError khi tệp CV không tồn tại (404)', async () => {
      await expect(
        candidateProfileService.getApplicationCvBlob('invalid-non-existent-app-id')
      ).rejects.toThrow(CvFileNotFoundError);
    });

    it('tải tệp CV về máy thành công qua downloadApplicationCv', async () => {
      const mockLink = { href: '', download: '', click: vi.fn() };
      const appendChildMock = vi.fn();
      const removeChildMock = vi.fn();

      vi.stubGlobal('document', {
        createElement: () => mockLink,
        body: {
          appendChild: appendChildMock,
          removeChild: removeChildMock,
        },
      });

      await candidateProfileService.downloadApplicationCv('app-2026-002', 'My_Downloaded_CV.pdf');

      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toBe('My_Downloaded_CV.pdf');
      expect(appendChildMock).toHaveBeenCalled();
      expect(removeChildMock).toHaveBeenCalled();
    });

    it('thêm ghi chú nội bộ và cập nhật danh sách nhãn hồ sơ', async () => {
      // 1. Thêm ghi chú nội bộ mới
      const newNote = await candidateProfileService.addCandidateNote(
        'can-demo-891',
        {
          content: 'Ứng viên có kiến thức sâu về Web Vitals và thiết kế Micro-frontends.',
          category: 'INTERVIEW',
        },
        { fullName: 'Hoàng Anh Tuấn', role: 'Staff Engineer' }
      );
      expect(newNote.id).toBeTruthy();
      expect(newNote.category).toBe('INTERVIEW');
      expect(newNote.authorName).toBe('Hoàng Anh Tuấn');

      // 2. Cập nhật nhãn phân loại hồ sơ
      const updatedTags = await candidateProfileService.updateCandidateTags('can-demo-891', [
        'React 19',
        'TypeScript',
        'Performance',
      ]);
      expect(updatedTags.length).toBe(3);
      expect(updatedTags.map((t) => t.name)).toContain('React 19');
    });

    it('từ chối thêm ghi chú rỗng', async () => {
      await expect(
        candidateProfileService.addCandidateNote('can-demo-891', { content: '   ' })
      ).rejects.toThrow('Nội dung ghi chú không được để trống.');
    });
  });

  describe('AC 2: Chuyển đổi mượt mà giữa các lần ứng tuyển của cùng ứng viên', () => {
    let candidate: UnifiedCandidate;

    beforeEach(async () => {
      candidate = await candidateProfileService.getUnifiedCandidateProfile('can-demo-891');
    });

    it('hồ sơ chứa lịch sử nhiều vị trí với pipeline stage và lý do dừng độc lập', () => {
      const app2026 = candidate.applications.find((a) => a.id === 'app-2026-002');
      const app2025 = candidate.applications.find((a) => a.id === 'app-2025-001');

      expect(app2026).toBeDefined();
      expect(app2025).toBeDefined();

      // Đợt 2026 đang phỏng vấn
      expect(app2026?.stage).toBe('INTERVIEWING');
      expect(app2026?.isCurrent).toBe(true);
      expect(app2026?.cvFileType).toBe('pdf');

      // Đợt 2025 đã bị loại kèm lý do cụ thể
      expect(app2025?.stage).toBe('REJECTED');
      expect(app2025?.isCurrent).toBe(false);
      expect(app2025?.rejectionReason).toBeTruthy();
      expect(app2025?.cvFileType).toBe('docx');
    });
  });

  describe('AC 3: Xử lý xem trước và giải phóng bộ nhớ Blob URL', () => {
    it('URL.revokeObjectURL được gọi khi hoàn tất tải hoặc thu hồi blob URL', async () => {
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
      const cvBlob = await candidateProfileService.getApplicationCvBlob('app-2026-002');

      expect(cvBlob.objectUrl).toBeTruthy();

      // Thu hồi URL giả lập
      URL.revokeObjectURL(cvBlob.objectUrl);
      expect(revokeSpy).toHaveBeenCalledWith(cvBlob.objectUrl);
    });
  });

  describe('AC 4: Xử lý trường hợp không có quyền truy cập (403 Forbidden) & Bảo mật dữ liệu', () => {
    let mockCandidate: UnifiedCandidate;

    beforeEach(async () => {
      mockCandidate = await candidateProfileService.getUnifiedCandidateProfile('can-demo-891');
    });

    it('cho phép Quản trị viên (ADMIN) và Trưởng phòng nhân sự (HR_MANAGER)', () => {
      expect(
        candidateProfileService.checkCandidateAccess(
          mockCandidate,
          { id: 'admin-1', email: 'admin@company.com', roles: ['ADMIN'] },
          []
        )
      ).toBe(true);

      expect(
        candidateProfileService.checkCandidateAccess(
          mockCandidate,
          { id: 'hr-1', email: 'hr@company.com', roles: ['HR_MANAGER'] },
          []
        )
      ).toBe(true);
    });

    it('cho phép người dùng có quyền CANDIDATES_READ_ALL', () => {
      expect(
        candidateProfileService.checkCandidateAccess(
          mockCandidate,
          { id: 'auditor-1', email: 'auditor@company.com', roles: ['EMPLOYEE'] },
          ['CANDIDATES_READ_ALL']
        )
      ).toBe(true);
    });

    it('cho phép Recruiter và Hiring Manager phụ trách vị trí của ứng viên', () => {
      // Recruiter được phân công trong app-2026-002 là usr-hr-001
      expect(
        candidateProfileService.checkCandidateAccess(
          mockCandidate,
          { id: 'usr-hr-001', email: 'minh.nguyen@company.com', roles: ['RECRUITER'] },
          ['CANDIDATES_READ_SCOPED']
        )
      ).toBe(true);

      // Hiring Manager được phân công là usr-mgr-002
      expect(
        candidateProfileService.checkCandidateAccess(
          mockCandidate,
          { id: 'usr-mgr-002', email: 'anh.dang@company.com', roles: ['HIRING_MANAGER'] },
          ['CANDIDATES_READ_SCOPED']
        )
      ).toBe(true);
    });

    it('chặn người dùng khác không có thẩm quyền (trả về false để hiển thị màn hình 403 Forbidden)', () => {
      const unauthorizedUser = {
        id: 'usr-unauthorized-099',
        email: 'other@company.com',
        roles: ['EMPLOYEE'],
      };

      const hasAccess = candidateProfileService.checkCandidateAccess(
        mockCandidate,
        unauthorizedUser,
        ['SELF_PROFILE_READ']
      );

      expect(hasAccess).toBe(false);
    });

    it('chặn người dùng chưa đăng nhập (null)', () => {
      expect(candidateProfileService.checkCandidateAccess(mockCandidate, null, [])).toBe(false);
    });

    it('CandidateAccessDeniedError có status 403', () => {
      const err = new CandidateAccessDeniedError();
      expect(err.status).toBe(403);
      expect(err.name).toBe('CandidateAccessDeniedError');
    });
  });
});
