import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CandidateProfile } from '../src/types/candidate';
import {
  generateCandidateExportFilename,
  formatCvParsingStatus,
  formatAppliedDate,
  mapCandidatesToExcelRows,
  exportCandidatesToExcelBlob,
  exportCandidatesToExcel,
  exportCandidatesToCsv,
  downloadBlobFile,
} from '../src/utils/candidateExportHelper';

describe('Task Jira TKNHTTDNB1-422: Helper tiện ích xuất Excel danh sách ứng viên (User Story S5-08)', () => {
  const mockCandidates: CandidateProfile[] = [
    {
      id: 'cand-001',
      trackingCode: 'APP-2026-001',
      fullName: 'Nguyễn Văn An',
      email: 'an.nguyen@company.com',
      phone: '0988111222',
      appliedJobId: 'job-fe-01',
      appliedJobTitle: 'Senior Frontend Developer (React, TypeScript)',
      departmentName: 'Khối Công nghệ & Sản phẩm',
      experienceYears: 5,
      educationLevel: 'Cử nhân CNTT',
      status: 'INTERVIEWING',
      cvParsingStatus: 'CONFIRMED',
      rating: 5,
      skills: ['React', 'TypeScript', 'Tailwind CSS'],
      source: 'Website công ty',
      cvFileName: 'NguyenVanAn_CV.pdf',
      matchingEvaluation: {
        totalMatchingScore: 92,
        isOverallPassed: true,
        criteriaList: [],
        evaluatedAt: '2026-10-15T10:00:00.000Z',
      },
      notes: [
        {
          id: 'n1',
          content: 'Ứng viên giao tiếp tốt, tư duy logic cao',
          authorName: 'Đặng Tuấn Anh',
          createdAt: '2026-10-15T11:00:00.000Z',
        },
      ],
      appliedAt: '2026-10-10T08:30:00.000Z',
    },
    {
      id: 'cand-002',
      fullName: 'Trần Thị Bích',
      email: 'bich.tran@company.com',
      phone: '0977222333',
      cvParsingStatus: 'PENDING_CONFIRMATION',
      coverLetter: 'Mong muốn cống hiến cho công ty',
    },
  ];

  const mockAnchor = {
    href: '',
    download: '',
    setAttribute: vi.fn(),
    style: {},
    click: vi.fn(),
  };

  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;

  beforeEach(() => {
    vi.restoreAllMocks();
    (globalThis as unknown as { window: unknown }).window = {
      URL: {
        createObjectURL: vi.fn(() => 'blob:mock-excel-url'),
        revokeObjectURL: vi.fn(),
      },
    };
    (globalThis as unknown as { document: unknown }).document = {
      createElement: vi.fn(() => mockAnchor),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (globalThis as unknown as { window: unknown }).window = originalWindow;
    (globalThis as unknown as { document: unknown }).document = originalDocument;
  });

  describe('1. AC 2: Định dạng tên file chuẩn Danh_sach_ung_vien_YYYYMMDD_HHmm.xlsx', () => {
    it('tạo đúng định dạng tên file với ngày giờ chỉ định', () => {
      // 15/10/2026 13:45:00
      const testDate = new Date(2026, 9, 15, 13, 45, 0);
      const filename = generateCandidateExportFilename(testDate, 'xlsx');
      expect(filename).toBe('Danh_sach_ung_vien_20261015_1345.xlsx');
    });

    it('thêm số 0 (padStart) vào các tháng, ngày, giờ, phút có 1 chữ số', () => {
      // 05/04/2026 08:07:00
      const testDate = new Date(2026, 3, 5, 8, 7, 0);
      const filename = generateCandidateExportFilename(testDate, 'xlsx');
      expect(filename).toBe('Danh_sach_ung_vien_20260405_0807.xlsx');
    });

    it('hỗ trợ tạo tên file định dạng .csv', () => {
      const testDate = new Date(2026, 9, 15, 14, 20, 0);
      const filename = generateCandidateExportFilename(testDate, 'csv');
      expect(filename).toBe('Danh_sach_ung_vien_20261015_1420.csv');
    });

    it('tự động lấy ngày giờ hiện tại nếu không truyền tham số date', () => {
      const filename = generateCandidateExportFilename();
      expect(filename).toMatch(/^Danh_sach_ung_vien_\d{8}_\d{4}\.xlsx$/);
    });
  });

  describe('2. Chuyển đổi trạng thái bóc tách CV (formatCvParsingStatus)', () => {
    it('dịch chính xác các trạng thái bóc tách sang tiếng Việt', () => {
      expect(formatCvParsingStatus('PENDING_CONFIRMATION')).toBe('Chờ xác nhận gợi ý');
      expect(formatCvParsingStatus('CONFIRMED')).toBe('Đã xác nhận');
      expect(formatCvParsingStatus('PARSING')).toBe('Đang đọc CV PDF');
      expect(formatCvParsingStatus('FAILED')).toBe('Lỗi đọc CV');
      expect(formatCvParsingStatus('DISMISSED')).toBe('Đã bỏ qua');
      expect(formatCvParsingStatus(undefined)).toBe('Chưa xử lý');
    });
  });

  describe('3. Định dạng thời gian ứng tuyển (formatAppliedDate)', () => {
    it('định dạng chuỗi ngày ISO sang định dạng dd/MM/yyyy HH:mm', () => {
      const formatted = formatAppliedDate('2026-10-15T08:30:00.000Z');
      expect(formatted).toMatch(/\d{2}\/\d{2}\/2026 \d{2}:\d{2}/);
    });

    it('trả về "Mới đây" khi dateString rỗng hoặc không xác định', () => {
      expect(formatAppliedDate('')).toBe('Mới đây');
      expect(formatAppliedDate(undefined)).toBe('Mới đây');
    });
  });

  describe('4. Ánh xạ dữ liệu ứng viên sang hàng bảng tính Excel (mapCandidatesToExcelRows)', () => {
    it('ánh xạ đầy đủ các cột thông tin ứng viên có cấu trúc', () => {
      const rows = mapCandidatesToExcelRows(mockCandidates);
      expect(rows).toHaveLength(2);

      const row1 = rows[0];
      expect(row1['STT']).toBe(1);
      expect(row1['Mã ứng viên']).toBe('APP-2026-001');
      expect(row1['Họ và tên']).toBe('Nguyễn Văn An');
      expect(row1['Email']).toBe('an.nguyen@company.com');
      expect(row1['Số điện thoại']).toBe('0988111222');
      expect(row1['Vị trí ứng tuyển']).toBe('Senior Frontend Developer (React, TypeScript)');
      expect(row1['Phòng ban']).toBe('Khối Công nghệ & Sản phẩm');
      expect(row1['Trạng thái / Vòng tuyển dụng']).toBe('INTERVIEWING');
      expect(row1['Điểm phù hợp']).toBe('92%');
      expect(row1['Đánh giá sao']).toBe('5/5 sao');
      expect(row1['Năm kinh nghiệm']).toBe('5 năm');
      expect(row1['Trình độ học vấn']).toBe('Cử nhân CNTT');
      expect(row1['Kỹ năng']).toBe('React, TypeScript, Tailwind CSS');
      expect(row1['Trạng thái bóc tách CV']).toBe('Đã xác nhận');
      expect(row1['Tệp CV']).toBe('NguyenVanAn_CV.pdf');
      expect(row1['Ghi chú']).toContain('Ứng viên giao tiếp tốt');
    });

    it('xử lý an toàn khi các trường tùy chọn bị khuyết thiếu', () => {
      const rows = mapCandidatesToExcelRows(mockCandidates);
      const row2 = rows[1];

      expect(row2['STT']).toBe(2);
      expect(row2['Mã ứng viên']).toBe('cand-002');
      expect(row2['Vị trí ứng tuyển']).toBe('Chưa xác định');
      expect(row2['Phòng ban']).toBe('Chưa phân bổ');
      expect(row2['Điểm phù hợp']).toBe('N/A');
      expect(row2['Đánh giá sao']).toBe('Chưa đánh giá');
      expect(row2['Năm kinh nghiệm']).toBe('Chưa cập nhật');
      expect(row2['Kỹ năng']).toBe('Chưa cập nhật');
      expect(row2['Ghi chú']).toBe('Mong muốn cống hiến cho công ty');
    });
  });

  describe('5. Tạo Blob và tải file Excel / CSV', () => {
    it('exportCandidatesToExcelBlob tạo đối tượng Blob hợp lệ chứa tệp xlsx', () => {
      const blob = exportCandidatesToExcelBlob(mockCandidates);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
      expect(blob.type).toContain('spreadsheetml');
    });

    it('exportCandidatesToExcel ném lỗi nếu danh sách ứng viên rỗng', async () => {
      await expect(exportCandidatesToExcel([])).rejects.toThrow(
        'Danh sách ứng viên rỗng, không có dữ liệu để xuất file Excel.'
      );
    });

    it('exportCandidatesToExcel kích hoạt tải file và trả về kết quả thành công', async () => {
      const result = await exportCandidatesToExcel(mockCandidates);

      expect(result.count).toBe(2);
      expect(result.format).toBe('xlsx');
      expect(result.filename).toMatch(/^Danh_sach_ung_vien_\d{8}_\d{4}\.xlsx$/);
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(mockAnchor.download).toBe(result.filename);
    });

    it('exportCandidatesToCsv ném lỗi nếu danh sách ứng viên rỗng', async () => {
      await expect(exportCandidatesToCsv([])).rejects.toThrow(
        'Danh sách ứng viên rỗng, không có dữ liệu để xuất file CSV.'
      );
    });

    it('exportCandidatesToCsv kích hoạt tải file CSV kèm mã hóa UTF-8 BOM', async () => {
      const result = await exportCandidatesToCsv(mockCandidates);

      expect(result.count).toBe(2);
      expect(result.format).toBe('csv');
      expect(result.filename).toMatch(/^Danh_sach_ung_vien_\d{8}_\d{4}\.csv$/);
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('downloadBlobFile tạo thẻ anchor tải xuống an toàn', () => {
      const dummyBlob = new Blob(['test content'], { type: 'text/plain' });
      downloadBlobFile(dummyBlob, 'test-file.xlsx');

      expect(mockAnchor.click).toHaveBeenCalled();
      expect(mockAnchor.download).toBe('test-file.xlsx');
    });
  });
});
