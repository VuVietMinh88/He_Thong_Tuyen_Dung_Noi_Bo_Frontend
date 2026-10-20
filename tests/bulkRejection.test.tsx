import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  BulkRejectionModal,
} from '../src/components/Candidate/BulkRejectionModal';
import {
  DEFAULT_REJECTION_TEMPLATES,
  STANDARDIZED_REJECTION_REASONS,
  type BulkRejectionCandidateItem,
  checkIsDuplicateRejection,
  renderPersonalizedTemplate,
  getStoredSentRejections,
  saveStoredSentRejections,
} from '../src/types/bulkRejection';

const storage = new Map<string, string>();

describe('TKNHTTDNB1-524 / S7-09: Chọn ứng viên và xem trước thư từ chối hàng loạt (BulkRejectionModal)', () => {
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const mockCandidates: BulkRejectionCandidateItem[] = [
    {
      id: 'cand-01',
      fullName: 'Nguyễn Văn An',
      email: 'an.nguyen@example.com',
      appliedJobTitle: 'Frontend Developer',
      departmentName: 'Khối Công nghệ',
      currentStage: 'SCREENING',
      appliedAt: '2026-10-10T08:00:00.000Z',
      hasReceivedRejectionEmail: false,
    },
    {
      id: 'cand-02',
      fullName: 'Trần Thị Bích',
      email: 'bich.tran@example.com',
      appliedJobTitle: 'Frontend Developer',
      departmentName: 'Khối Công nghệ',
      currentStage: 'INTERVIEWING',
      appliedAt: '2026-10-12T09:30:00.000Z',
      hasReceivedRejectionEmail: false,
    },
    {
      id: 'cand-03',
      fullName: 'Lê Hoàng Cường',
      email: 'cuong.le@example.com',
      appliedJobTitle: 'Backend Engineer',
      departmentName: 'Khối Công nghệ',
      currentStage: 'SCREENING',
      appliedAt: '2026-10-05T10:00:00.000Z',
      hasReceivedRejectionEmail: true,
      rejectionSentAt: '08/10/2026',
      previousRejectionReason: 'Không phù hợp với tiêu chí kỹ thuật',
    },
  ];

  describe('AC 1: Chọn nhóm ứng viên hàng loạt (Bulk Candidate Selection)', () => {
    it('hiển thị đầy đủ tiêu đề modal, thống kê tóm tắt số lượng ứng viên và bộ lọc nhóm trạng thái', () => {
      const html = renderToString(
        <BulkRejectionModal
          isOpen={true}
          onClose={() => {}}
          candidates={mockCandidates}
          companyName="Công ty Công nghệ Thông minh"
          recruiterName="Ban Tuyển dụng"
        />,
      );

      // Tiêu đề & Cảnh báo chặn trùng
      expect(html).toContain('Gửi thư từ chối ứng viên hàng loạt');
      expect(html).toContain('Chặn gửi trùng lặp');

      // Thống kê nhanh: Tổng = 3, Hợp lệ = 2, Đã nhận thư = 1
      expect(html).toContain('Tổng ứng viên:');
      expect(html).toContain('Hợp lệ: 2');
      expect(html).toContain('Đã từng nhận thư: 1 (Chặn gửi trùng)');

      // Bộ lọc nhóm trạng thái
      expect(html).toContain('Tất cả nhóm');
      expect(html).toContain('Sàng lọc CV');
      expect(html).toContain('Phỏng vấn');
      expect(html).toContain('Hồ sơ mới');
    });

    it('hiển thị thông tin ứng viên kèm chức danh, email và phòng ban', () => {
      const html = renderToString(
        <BulkRejectionModal
          isOpen={true}
          onClose={() => {}}
          candidates={mockCandidates}
        />,
      );

      expect(html).toContain('Nguyễn Văn An');
      expect(html).toContain('an.nguyen@example.com');
      expect(html).toContain('Frontend Developer');

      expect(html).toContain('Trần Thị Bích');
      expect(html).toContain('bich.tran@example.com');

      expect(html).toContain('Lê Hoàng Cường');
      expect(html).toContain('cuong.le@example.com');
    });

    it('không render gì khi isOpen là false', () => {
      const html = renderToString(
        <BulkRejectionModal
          isOpen={false}
          onClose={() => {}}
          candidates={mockCandidates}
        />,
      );

      expect(html).toBe('');
    });
  });

  describe('AC 2: Xem trước thư cá nhân hóa với dữ liệu thật (Personalized Email Preview)', () => {
    it('thay thế chuẩn xác các biến dữ liệu thật của ứng viên trong template (renderPersonalizedTemplate)', () => {
      const template = 'Kính gửi bạn {HO_TEN}, cảm ơn bạn đã ứng tuyển vị trí {VI_TRI} tại {PHONG_BAN} của {CONG_TY}.';
      const candidate = mockCandidates[0];

      const rendered = renderPersonalizedTemplate(
        template,
        candidate,
        'Công ty Cổ phần AI',
        'Bộ phận HR',
        'Mong sớm gặp lại bạn.',
      );

      expect(rendered).toContain('Nguyễn Văn An');
      expect(rendered).toContain('Frontend Developer');
      expect(rendered).toContain('Khối Công nghệ');
      expect(rendered).toContain('Công ty Cổ phần AI');
      expect(rendered).toContain('[Ghi chú từ Ban Tuyển dụng]:\nMong sớm gặp lại bạn.');
    });

    it('cung cấp đầy đủ 4 mẫu thư từ chối chuẩn hóa với văn phong lịch sự, chuyên nghiệp', () => {
      expect(DEFAULT_REJECTION_TEMPLATES).toHaveLength(4);

      const screeningTpl = DEFAULT_REJECTION_TEMPLATES.find((t) => t.id === 'tpl-screening');
      expect(screeningTpl).toBeDefined();
      expect(screeningTpl?.name).toBe('Từ chối sau sàng lọc CV');
      expect(screeningTpl?.defaultBody).toContain('Hệ thống Dữ liệu Nhân tài (Talent Pool)');

      const interviewTpl = DEFAULT_REJECTION_TEMPLATES.find((t) => t.id === 'tpl-interview');
      expect(interviewTpl).toBeDefined();
      expect(interviewTpl?.name).toBe('Từ chối sau phỏng vấn chuyên môn');
      expect(interviewTpl?.defaultBody).toContain('Hội đồng đánh giá rất cao năng lực chuyên môn');

      const finalTpl = DEFAULT_REJECTION_TEMPLATES.find((t) => t.id === 'tpl-final');
      expect(finalTpl).toBeDefined();
      expect(finalTpl?.name).toBe('Từ chối sau vòng phỏng vấn cuối');
      expect(finalTpl?.defaultBody).toContain('vòng phỏng vấn cuối cùng');

      const customTpl = DEFAULT_REJECTION_TEMPLATES.find((t) => t.id === 'tpl-custom');
      expect(customTpl).toBeDefined();
      expect(customTpl?.name).toBe('Mẫu tùy chỉnh riêng');
    });

    it('hiển thị danh mục lý do từ chối chính chuẩn hóa', () => {
      expect(STANDARDIZED_REJECTION_REASONS.length).toBeGreaterThanOrEqual(5);
      expect(STANDARDIZED_REJECTION_REASONS).toContain('Không phù hợp với tiêu chí kỹ thuật / chuyên môn');
      expect(STANDARDIZED_REJECTION_REASONS).toContain('Kinh nghiệm chưa đáp ứng yêu cầu dự án');
    });

    it('hiển thị khung xem trước email hoàn chỉnh với thông tin người gửi, người nhận và nội dung cá nhân hóa', () => {
      const html = renderToString(
        <BulkRejectionModal
          isOpen={true}
          onClose={() => {}}
          candidates={mockCandidates}
          companyName="Tập đoàn Công nghệ FPT"
          recruiterName="Phòng Tuyển dụng FPT"
        />,
      );

      // Xem trước email
      expect(html).toContain('Xem trước thư cá nhân hóa (Preview)');
      expect(html).toContain('Người gửi:');
      expect(html).toContain('Phòng Tuyển dụng FPT');
      expect(html).toContain('Người nhận:');
      expect(html).toContain('an.nguyen@example.com');
      expect(html).toContain('Tập đoàn Công nghệ FPT');
    });
  });

  describe('AC 3: Hệ thống chặn gửi trùng thư từ chối (Duplicate Rejection Prevention)', () => {
    it('phát hiện đúng ứng viên đã nhận thư từ chối thông qua trường hasReceivedRejectionEmail', () => {
      const result1 = checkIsDuplicateRejection(mockCandidates[0]);
      expect(result1.isDuplicate).toBe(false);

      const result3 = checkIsDuplicateRejection(mockCandidates[2]);
      expect(result3.isDuplicate).toBe(true);
      expect(result3.sentAt).toBe('08/10/2026');
      expect(result3.reason).toBe('Không phù hợp với tiêu chí kỹ thuật');
    });

    it('phát hiện ứng viên đã nhận thư từ chối thông qua LocalStorage', () => {
      saveStoredSentRejections([
        {
          candidateId: 'cand-01',
          email: 'an.nguyen@example.com',
          reason: 'Lý do đã lưu',
          sentAt: '2026-10-14T10:00:00.000Z',
        },
      ]);

      const stored = getStoredSentRejections();
      expect(stored).toHaveLength(1);

      const check = checkIsDuplicateRejection(mockCandidates[0], stored);
      expect(check.isDuplicate).toBe(true);
    });

    it('hiển thị huy hiệu cảnh báo màu vàng cam và khóa ứng viên đã nhận thư', () => {
      const html = renderToString(
        <BulkRejectionModal
          isOpen={true}
          onClose={() => {}}
          candidates={mockCandidates}
        />,
      );

      // Cảnh báo trên hồ sơ của Lê Hoàng Cường
      expect(html).toContain('Đã nhận thư từ chối (08/10/2026)');

      // Tùy chọn mở khóa ngoại lệ
      expect(html).toContain('Cho phép gửi lại cho hồ sơ đã từng nhận thư (Ghi đè ngoại lệ)');
    });

    it('lưu vết gửi thư từ chối mới vào LocalStorage qua helper saveStoredSentRejections', () => {
      const newRecord = {
        candidateId: 'cand-test-99',
        email: 'test@example.com',
        jobTitle: 'QA Engineer',
        reason: 'Không phù hợp tiêu chí',
        sentAt: '2026-10-18T10:00:00.000Z',
      };

      saveStoredSentRejections([newRecord]);
      const stored = getStoredSentRejections();
      expect(stored).toHaveLength(1);
      expect(stored[0].candidateId).toBe('cand-test-99');
      expect(stored[0].email).toBe('test@example.com');
    });
  });
});
