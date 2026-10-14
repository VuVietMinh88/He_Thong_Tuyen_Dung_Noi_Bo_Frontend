import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { CandidateProfile } from '../src/types/candidate';
import { talentPoolService } from '../src/services/talentPoolService';
import { AddToTalentPoolModal } from '../src/components/Candidate/AddToTalentPoolModal';
import { CandidateManagementPage } from '../src/pages/Candidate/CandidateManagementPage';
import { CandidateDetailModal } from '../src/components/Candidate/CandidateDetailModal';

describe('Task Jira TKNHTTDNB1-396: Thiết kế màn hình đưa ứng viên vào kho tiềm năng (User Story S5-04)', () => {
  const sampleCandidate1: CandidateProfile = {
    id: 'cand-001',
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen@example.com',
    phone: '0912345678',
    trackingCode: 'CAND-AN-01',
    appliedJobId: 'job-react-01',
    appliedJobTitle: 'Lập trình viên React Senior',
    departmentName: 'Khối Công nghệ & Sản phẩm',
    cvParsingStatus: 'CONFIRMED',
    experienceYears: 5,
  };

  const sampleCandidate2: CandidateProfile = {
    id: 'cand-002',
    fullName: 'Trần Thị Bình',
    email: 'binh.tran@example.com',
    phone: '0987654321',
    trackingCode: 'CAND-BINH-02',
    appliedJobId: 'job-devops-02',
    appliedJobTitle: 'Kỹ sư DevOps Kubernetes',
    departmentName: 'Khối Hạ tầng & Vận hành',
    cvParsingStatus: 'CONFIRMED',
    experienceYears: 3,
  };

  const sampleCandidate3: CandidateProfile = {
    id: 'cand-003',
    fullName: 'Lê Hoàng Nam',
    email: 'nam.le@example.com',
    phone: '0901234567',
    trackingCode: 'CAND-NAM-03',
    appliedJobId: 'job-lead-03',
    appliedJobTitle: 'Engineering Manager',
    departmentName: 'Ban Quản trị Kỹ thuật',
    cvParsingStatus: 'CONFIRMED',
    experienceYears: 7,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    talentPoolService._resetMemoryState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. AC 1: Modal chuyển vào Kho tiềm năng (Single & Bulk Action)', () => {
    it('không hiển thị khi isOpen = false', () => {
      const html = renderToString(
        React.createElement(AddToTalentPoolModal, {
          isOpen: false,
          onClose: () => {},
          candidates: [sampleCandidate1],
        })
      );
      expect(html).toBe('');
    });

    it('hiển thị thẻ chi tiết tóm tắt ứng viên khi chọn 1 ứng viên (Single Mode)', () => {
      const html = renderToString(
        React.createElement(AddToTalentPoolModal, {
          isOpen: true,
          onClose: () => {},
          candidates: [sampleCandidate1],
        })
      );

      expect(html).toContain('Chuyển vào Kho ứng viên tiềm năng');
      expect(html).toContain('data-testid="add-to-talent-pool-modal"');
      expect(html).toContain('data-testid="single-candidate-summary-cand-001"');
      expect(html).toContain('Nguyễn Văn An');
      expect(html).toContain('Lập trình viên React Senior');
      expect(html).toContain('an.nguyen@example.com');
      expect(html).toContain('Khối Công nghệ &amp; Sản phẩm');
      expect(html).not.toContain('Thao tác hàng loạt (Bulk Action)');
    });

    it('hiển thị danh sách cuộn và badge Bulk Action khi chọn nhiều ứng viên', () => {
      const html = renderToString(
        React.createElement(AddToTalentPoolModal, {
          isOpen: true,
          onClose: () => {},
          candidates: [sampleCandidate1, sampleCandidate2, sampleCandidate3],
        })
      );

      expect(html).toContain('Thao tác hàng loạt (Bulk Action)');
      expect(html).toContain('data-testid="bulk-candidates-list"');
      expect(html).toContain('data-testid="bulk-candidate-item-cand-001"');
      expect(html).toContain('data-testid="bulk-candidate-item-cand-002"');
      expect(html).toContain('data-testid="bulk-candidate-item-cand-003"');
      expect(html).toContain('data-testid="remove-candidate-btn-cand-001"');
      expect(html).toContain('data-testid="remove-candidate-btn-cand-002"');
      expect(html).toContain('data-testid="remove-candidate-btn-cand-003"');
      expect(html).toContain('Ứng viên được chọn (3)');
    });
  });

  describe('2. AC 2: Gắn nhóm & Thẻ phân loại (Talent Pool Categorization)', () => {
    it('hiển thị dropdown chọn Nhóm kho tiềm năng với các nhóm mặc định', () => {
      const html = renderToString(
        React.createElement(AddToTalentPoolModal, {
          isOpen: true,
          onClose: () => {},
          candidates: [sampleCandidate1],
        })
      );

      expect(html).toContain('data-testid="talent-pool-category-select"');
      expect(html).toContain('Frontend Core');
      expect(html).toContain('DevOps Dự phòng');
      expect(html).toContain('Management Track');
      expect(html).toContain('AI / Data Science');
      expect(html).toContain('data-testid="toggle-custom-category-btn"');
    });

    it('hiển thị ô nhập tag kỹ năng và các nút gợi ý tag nhanh', () => {
      const html = renderToString(
        React.createElement(AddToTalentPoolModal, {
          isOpen: true,
          onClose: () => {},
          candidates: [sampleCandidate1],
        })
      );

      expect(html).toContain('data-testid="tag-input-field"');
      expect(html).toContain('Gắn thẻ kỹ năng &amp; ưu điểm nổi bật (Tags)');
      expect(html).toContain('Gợi ý nhanh:');

      // Kiểm tra sự xuất hiện của các tag gợi ý
      expect(html).toContain('data-testid="suggested-tag-btn-Fast-learning"');
      expect(html).toContain('data-testid="suggested-tag-btn-Good English"');
      expect(html).toContain('data-testid="suggested-tag-btn-Strong Algorithms"');
      expect(html).toContain('data-testid="suggested-tag-btn-Leadership Potential"');
    });
  });

  describe('3. AC 3: Ghi chú đánh giá (Recruiter Notes) & Thời điểm liên hệ lại', () => {
    it('hiển thị textarea ghi chú đánh giá chi tiết của Recruiter', () => {
      const html = renderToString(
        React.createElement(AddToTalentPoolModal, {
          isOpen: true,
          onClose: () => {},
          candidates: [sampleCandidate1],
        })
      );

      expect(html).toContain('data-testid="recruiter-notes-textarea"');
      expect(html).toContain('Ghi chú &amp; Đánh giá của Recruiter');
    });

    it('hiển thị danh sách các mốc thời điểm liên hệ lại nhanh', () => {
      const html = renderToString(
        React.createElement(AddToTalentPoolModal, {
          isOpen: true,
          onClose: () => {},
          candidates: [sampleCandidate1],
        })
      );

      expect(html).toContain('data-testid="timeline-option-Sau 1 tháng"');
      expect(html).toContain('data-testid="timeline-option-Sau 3 tháng"');
      expect(html).toContain('data-testid="timeline-option-Sau 6 tháng"');
      expect(html).toContain('data-testid="timeline-option-Khi mở dự án mới"');
      expect(html).toContain('data-testid="contact-recommendation-input"');
    });
  });

  describe('4. AC 4: Validation & UX nút xác nhận', () => {
    it('nút xác nhận hiển thị đúng số lượng ứng viên cần lưu', () => {
      const htmlSingle = renderToString(
        React.createElement(AddToTalentPoolModal, {
          isOpen: true,
          onClose: () => {},
          candidates: [sampleCandidate1],
        })
      );
      expect(htmlSingle).toContain('Lưu vào kho tiềm năng');

      const htmlBulk = renderToString(
        React.createElement(AddToTalentPoolModal, {
          isOpen: true,
          onClose: () => {},
          candidates: [sampleCandidate1, sampleCandidate2],
        })
      );
      expect(htmlBulk).toContain('Lưu 2 ứng viên vào kho');
    });

    it('hiển thị nút Hủy bỏ và nút Đóng cửa sổ', () => {
      const html = renderToString(
        React.createElement(AddToTalentPoolModal, {
          isOpen: true,
          onClose: () => {},
          candidates: [sampleCandidate1],
        })
      );

      expect(html).toContain('data-testid="cancel-talent-pool-btn"');
      expect(html).toContain('data-testid="close-talent-pool-modal-btn"');
      expect(html).toContain('data-testid="confirm-add-to-talent-pool-btn"');
    });
  });

  describe('5. talentPoolService: API & Local Storage Fallback', () => {
    it('getCategories trả về danh sách các nhóm kho tiềm năng mặc định', async () => {
      const cats = await talentPoolService.getCategories();
      expect(cats.length).toBeGreaterThanOrEqual(6);
      expect(cats.some((c) => c.name === 'Frontend Core')).toBe(true);
      expect(cats.some((c) => c.name === 'DevOps Dự phòng')).toBe(true);
      expect(cats.some((c) => c.name === 'Management Track')).toBe(true);
    });

    it('createCategory tạo nhóm kho mới thành công và không bị trùng', async () => {
      const created = await talentPoolService.createCategory(
        'Golang Distributed Systems',
        'Lập trình viên Golang hiệu năng cao'
      );
      expect(created.name).toBe('Golang Distributed Systems');

      const cats = await talentPoolService.getCategories();
      expect(cats.some((c) => c.name === 'Golang Distributed Systems')).toBe(true);
    });

    it('createCategory ném lỗi khi tên nhóm để trống', async () => {
      await expect(talentPoolService.createCategory('   ')).rejects.toThrow(
        'Tên nhóm kho tiềm năng không được để trống'
      );
    });

    it('addToTalentPool lưu thành công nhiều ứng viên với đầy đủ thẻ và ghi chú', async () => {
      const entries = await talentPoolService.addToTalentPool({
        candidateIds: ['cand-001', 'cand-002'],
        category: 'Frontend Core',
        tags: ['React', 'Fast-learning', 'Good English'],
        notes: 'Chuyên môn xuất sắc, lưu trữ để mở headcount vào Q3',
        contactRecommendation: 'Sau 3 tháng',
      });

      expect(entries).toHaveLength(2);
      expect(entries[0].candidateId).toBe('cand-001');
      expect(entries[0].category).toBe('Frontend Core');
      expect(entries[0].tags).toContain('Fast-learning');
      expect(entries[0].contactRecommendation).toBe('Sau 3 tháng');
      expect(entries[1].candidateId).toBe('cand-002');
    });

    it('addToTalentPool ném lỗi khi danh sách candidateIds rỗng', async () => {
      await expect(
        talentPoolService.addToTalentPool({
          candidateIds: [],
          category: 'Frontend Core',
          tags: [],
          notes: '',
        })
      ).rejects.toThrow('Vui lòng chọn ít nhất một ứng viên để đưa vào kho');
    });

    it('addToTalentPool ném lỗi khi category để trống', async () => {
      await expect(
        talentPoolService.addToTalentPool({
          candidateIds: ['cand-001'],
          category: '   ',
          tags: [],
          notes: '',
        })
      ).rejects.toThrow('Vui lòng chọn nhóm kho tiềm năng');
    });
  });

  describe('6. Tích hợp giao diện trên CandidateManagementPage và CandidateDetailModal', () => {
    it('CandidateManagementPage hiển thị cột checkbox và nút "Lưu tiềm năng" trên từng hàng', () => {
      const html = renderToString(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(CandidateManagementPage, {
            initialCandidates: [sampleCandidate1, sampleCandidate2],
            initialIsLoading: false,
          })
        )
      );

      expect(html).toContain('data-testid="select-all-candidates-checkbox"');
      expect(html).toContain('data-testid="select-candidate-checkbox-cand-001"');
      expect(html).toContain('data-testid="select-candidate-checkbox-cand-002"');
      expect(html).toContain('data-testid="add-to-talent-pool-btn-cand-001"');
      expect(html).toContain('data-testid="add-to-talent-pool-btn-cand-002"');
      expect(html).toContain('Lưu tiềm năng');
    });

    it('CandidateDetailModal hiển thị nút "Lưu kho tiềm năng" ở thanh tiêu đề', () => {
      const html = renderToString(
        React.createElement(CandidateDetailModal, {
          isOpen: true,
          candidateProfile: sampleCandidate1,
          onClose: () => {},
        })
      );

      expect(html).toContain('data-testid="detail-add-to-talent-pool-btn"');
      expect(html).toContain('Lưu kho tiềm năng');
    });
  });
});
