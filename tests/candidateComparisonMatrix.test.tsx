import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { CandidateComparisonMatrix } from '../src/components/Candidate/CandidateComparisonMatrix';
import { DEFAULT_FINAL_ROUND_CANDIDATES } from '../src/services/candidateComparisonService';
import type { ComparisonCandidate } from '../src/types/candidateComparison';

describe('CandidateComparisonMatrix (Task Jira: TKNHTTDNB1-470)', () => {
  const mockCandidates: ComparisonCandidate[] = [
    {
      ...DEFAULT_FINAL_ROUND_CANDIDATES[0],
      id: 'cand-001',
      fullName: 'Nguyễn Văn An',
      experienceYears: 6,
      competencyScores: {
        technical: 4.8, // Top technical
        attitude: 4.6,
        language: 4.7,
        cultureFit: 4.5,
        softSkills: 4.7,
        overall: 4.66,
      },
    },
    {
      ...DEFAULT_FINAL_ROUND_CANDIDATES[1],
      id: 'cand-002',
      fullName: 'Trần Thị Bích',
      experienceYears: 5,
      competencyScores: {
        technical: 4.5,
        attitude: 4.9, // Top attitude
        language: 4.3,
        cultureFit: 4.9, // Top culture fit
        softSkills: 4.8,
        overall: 4.68, // Top overall
      },
    },
    {
      ...DEFAULT_FINAL_ROUND_CANDIDATES[2],
      id: 'cand-003',
      fullName: 'Lê Hoàng Nam',
      experienceYears: 7, // Top experience
      competencyScores: {
        technical: 4.6,
        attitude: 4.3,
        language: 4.8, // Top language
        cultureFit: 4.2,
        softSkills: 4.4,
        overall: 4.46,
      },
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('AC 1: Bảng so sánh dạng cột (Side-by-side Matrix)', () => {
    it('render đầy đủ cấu trúc ma trận với cột tiêu chí bên trái và các cột ứng viên song song', () => {
      const html = renderToString(
        <CandidateComparisonMatrix
          candidates={mockCandidates}
          allAvailableCandidates={DEFAULT_FINAL_ROUND_CANDIDATES}
        />
      );

      // Container chính
      expect(html).toContain('data-testid="candidate-comparison-matrix"');
      // Badge đếm số lượng ứng viên đang so sánh
      expect(html).toContain('3 / 5 ứng viên');
      // Tiêu đề cột sticky bên trái
      expect(html).toContain('Trục tiêu chí đánh giá');

      // Tên các ứng viên trong header cột
      expect(html).toContain('Nguyễn Văn An');
      expect(html).toContain('Trần Thị Bích');
      expect(html).toContain('Lê Hoàng Nam');
    });

    it('hiển thị nút thêm ứng viên khi số lượng ứng viên < 5', () => {
      const html = renderToString(
        <CandidateComparisonMatrix
          candidates={mockCandidates.slice(0, 3)}
          allAvailableCandidates={DEFAULT_FINAL_ROUND_CANDIDATES}
        />
      );

      expect(html).toContain('data-testid="btn-add-candidate-to-compare"');
      expect(html).toContain('Thêm ứng viên so sánh');
    });

    it('hiển thị cảnh báo khi danh sách có dưới 2 ứng viên', () => {
      const html = renderToString(
        <CandidateComparisonMatrix
          candidates={mockCandidates.slice(0, 1)}
          allAvailableCandidates={DEFAULT_FINAL_ROUND_CANDIDATES}
        />
      );

      expect(html).toContain('data-testid="min-candidates-warning"');
      expect(html).toContain('Vui lòng chọn ít nhất 2 ứng viên');
    });
  });

  describe('AC 2: Các trục tiêu chí so sánh chi tiết', () => {
    it('render đầy đủ Nhóm I: Thông tin chung & Kinh nghiệm', () => {
      const html = renderToString(
        <CandidateComparisonMatrix candidates={mockCandidates} />
      );

      expect(html).toContain('I. THÔNG TIN CHUNG &amp; KINH NGHIỆM');
      expect(html).toContain('Vị trí &amp; Công ty hiện tại');
      expect(html).toContain('Tổng năm kinh nghiệm');
      expect(html).toContain('Trình độ học vấn');
      expect(html).toContain('Điểm sơ lọc hồ sơ (Matching)');

      // Kiểm tra dữ liệu các ứng viên
      expect(html).toContain('6 năm');
      expect(html).toContain('5 năm');
      expect(html).toContain('7 năm');
    });

    it('render đầy đủ Nhóm II: Đánh giá khung năng lực (1.0 - 5.0)', () => {
      const html = renderToString(
        <CandidateComparisonMatrix candidates={mockCandidates} />
      );

      expect(html).toContain('II. ĐÁNH GIÁ KHUNG NĂNG LỰC');
      expect(html).toContain('1. Chuyên môn kỹ thuật');
      expect(html).toContain('2. Thái độ &amp; Trách nhiệm');
      expect(html).toContain('3. Ngoại ngữ (Tiếng Anh)');
      expect(html).toContain('4. Phù hợp văn hóa');
      expect(html).toContain('5. Kỹ năng mềm &amp; Làm việc nhóm');
      expect(html).toContain('ĐIỂM TRUNG BÌNH TỔNG HỢP');

      // Điểm số cụ thể
      expect(html).toContain('4.8 / 5.0');
      expect(html).toContain('4.9 / 5.0');
      expect(html).toContain('4.68');
    });

    it('render đầy đủ Nhóm III: Đánh giá tổng hợp từ Hội đồng phỏng vấn', () => {
      const html = renderToString(
        <CandidateComparisonMatrix candidates={mockCandidates} />
      );

      expect(html).toContain('III. ĐÁNH GIÁ TỔNG HỢP TỪ HỘI ĐỒNG PHỎNG VẤN');
      expect(html).toContain('Nhận xét từ người phỏng vấn');
      expect(html).toContain('Điểm mạnh chính');
      expect(html).toContain('Điểm cần lưu ý / Rủi ro');

      // Badge nhận xét: Nên tuyển / Cân nhắc
      expect(html).toContain('Nên tuyển');
      expect(html).toContain('Trần Minh Quang');
    });

    it('render đầy đủ Nhóm IV: Kỳ vọng đãi ngộ & Thời gian bắt đầu làm việc', () => {
      const html = renderToString(
        <CandidateComparisonMatrix candidates={mockCandidates} />
      );

      expect(html).toContain('IV. KỲ VỌNG ĐÃI NGỘ &amp; THỜI GIAN BẮT ĐẦU LÀM VIỆC');
      expect(html).toContain('Mức lương kỳ vọng');
      expect(html).toContain('Thời gian bắt đầu làm việc');
      expect(html).toContain('Hình thức làm việc');

      // Mức lương & Onboard
      expect(html).toContain('38.000.000 ₫');
      expect(html).toContain('35.000.000 ₫');
      expect(html).toContain('Sẵn sàng nhận việc ngay lập tức');
      expect(html).toContain('data-testid="badge-immediate-start-cand-002"');
    });

    it('render đầy đủ Nhóm V: Hành động ra quyết định tuyển dụng', () => {
      const html = renderToString(
        <CandidateComparisonMatrix candidates={mockCandidates} />
      );

      expect(html).toContain('V. HÀNH ĐỘNG &amp; RA QUYẾT ĐỊNH TUYỂN DỤNG');
      expect(html).toContain('data-testid="btn-decision-offer-cand-001"');
      expect(html).toContain('data-testid="btn-decision-backup-cand-001"');
      expect(html).toContain('data-testid="btn-decision-reject-cand-001"');
      expect(html).toContain('Chọn Tuyển dụng (Offer)');
      expect(html).toContain('Dự phòng (Talent Pool)');
    });
  });

  describe('AC 3: Đánh dấu điểm nổi bật (Highlights)', () => {
    it('tự động đánh dấu highlight xanh cho ứng viên có điểm Chuyên môn kỹ thuật cao nhất (Nguyễn Văn An: 4.8)', () => {
      const html = renderToString(
        <CandidateComparisonMatrix candidates={mockCandidates} />
      );

      expect(html).toContain('data-testid="badge-top-technical-cand-001"');
      expect(html).toContain('Điểm cao nhất');
    });

    it('tự động đánh dấu highlight xanh cho ứng viên có điểm Thái độ & Văn hóa cao nhất (Trần Thị Bích: 4.9)', () => {
      const html = renderToString(
        <CandidateComparisonMatrix candidates={mockCandidates} />
      );

      expect(html).toContain('data-testid="badge-top-attitude-cand-002"');
      expect(html).toContain('data-testid="badge-top-culture-fit-cand-002"');
    });

    it('tự động đánh dấu highlight xanh cho ứng viên có tổng năm kinh nghiệm cao nhất (Lê Hoàng Nam: 7 năm)', () => {
      const html = renderToString(
        <CandidateComparisonMatrix candidates={mockCandidates} />
      );

      expect(html).toContain('data-testid="badge-top-experience-cand-003"');
      expect(html).toContain('Nhiều nhất');
    });

    it('tự động đánh dấu highlight xanh và vương miện cho TOP 1 NĂNG LỰC TỔNG THỂ (Trần Thị Bích: 4.68)', () => {
      const html = renderToString(
        <CandidateComparisonMatrix candidates={mockCandidates} />
      );

      expect(html).toContain('data-testid="badge-top-overall-cand-002"');
      expect(html).toContain('TOP 1 NĂNG LỰC');
    });
  });

  describe('AC 4: UX, Toolbar & Thao tác', () => {
    it('render nút In / Xuất PDF trên thanh toolbar', () => {
      const html = renderToString(
        <CandidateComparisonMatrix candidates={mockCandidates} />
      );

      expect(html).toContain('data-testid="btn-print-comparison"');
      expect(html).toContain('In / Xuất PDF');
    });

    it('render nút đóng modal khi thuộc tính isModal = true', () => {
      const onCloseMock = vi.fn();
      const html = renderToString(
        <CandidateComparisonMatrix
          candidates={mockCandidates}
          isModal={true}
          onClose={onCloseMock}
        />
      );

      expect(html).toContain('data-testid="btn-close-comparison-modal"');
    });
  });
});
