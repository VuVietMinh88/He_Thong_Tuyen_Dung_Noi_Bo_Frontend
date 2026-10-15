import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { CandidateProfile } from '../src/types/candidate';
import { candidateService } from '../src/services/candidateService';
import { CandidateExportExcelButton } from '../src/components/Candidate/CandidateExportExcelButton';
import { CandidateManagementPage } from '../src/pages/Candidate/CandidateManagementPage';
import axiosClient from '../src/utils/axiosClient';

describe('Task Jira TKNHTTDNB1-422: Thao tác xuất Excel danh sách ứng viên (User Story S5-08)', () => {
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
      educationLevel: 'Cử nhân CNTT - ĐH Bách Khoa',
      status: 'INTERVIEWING',
      cvParsingStatus: 'CONFIRMED',
      rating: 5,
      skills: ['React', 'TypeScript', 'Tailwind CSS'],
      source: 'Website công ty',
      cvFileName: 'NguyenVanAn_CV.pdf',
      appliedAt: '2026-10-10T10:00:00.000Z',
    },
    {
      id: 'cand-002',
      trackingCode: 'APP-2026-002',
      fullName: 'Trần Thị Bích',
      email: 'bich.tran@company.com',
      phone: '0977222333',
      appliedJobId: 'job-be-02',
      appliedJobTitle: 'Senior Java Backend Engineer (Spring Boot)',
      departmentName: 'Khối Công nghệ & Sản phẩm',
      experienceYears: 6,
      educationLevel: 'Thạc sĩ Khoa học Máy tính',
      status: 'OFFER',
      cvParsingStatus: 'CONFIRMED',
      rating: 4,
      skills: ['Java', 'Spring Boot', 'PostgreSQL'],
      source: 'LinkedIn',
      cvFileName: 'TranThiBich_Resume.pdf',
      appliedAt: '2026-10-11T11:00:00.000Z',
    },
    {
      id: 'cand-003',
      trackingCode: 'APP-2026-003',
      fullName: 'Lê Hoàng Nam',
      email: 'nam.le@gmail.com',
      phone: '0933221100',
      appliedJobId: 'job-ai-03',
      appliedJobTitle: 'AI Research Engineer',
      departmentName: 'Trung tâm Nghiên cứu AI',
      experienceYears: 3,
      status: 'Mới tiếp nhận',
      cvParsingStatus: 'PARSING',
      appliedAt: '2026-10-12T09:00:00.000Z',
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
      dispatchEvent: vi.fn(),
    };
    (globalThis as unknown as { document: unknown }).document = {
      createElement: vi.fn(() => mockAnchor),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (globalThis as unknown as { window: unknown }).window = originalWindow;
    (globalThis as unknown as { document: unknown }).document = originalDocument;
  });

  describe('1. AC 2: candidateService.exportCandidates & Xử lý tệp tải xuống', () => {
    it('gọi API POST /recruitment/candidates/export-excel khi backend phản hồi Blob thành công', async () => {
      const mockBlob = new Blob(['mock excel stream content'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: mockBlob,
      });

      const result = await candidateService.exportCandidates(mockCandidates, {
        scope: 'ALL_FILTERED',
        format: 'xlsx',
      });

      expect(postSpy).toHaveBeenCalledWith(
        '/recruitment/candidates/export-excel',
        expect.objectContaining({
          scope: 'ALL_FILTERED',
          format: 'xlsx',
          candidateIds: ['cand-001', 'cand-002', 'cand-003'],
        }),
        expect.objectContaining({
          responseType: 'blob',
        })
      );
      expect(result.count).toBe(3);
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('tự động fallback sang xử lý client-side bằng SheetJS khi API backend gặp sự cố hoặc offline', async () => {
      // Giả lập backend lỗi 500
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(
        new Error('Network Error or Backend Unavailable')
      );

      const result = await candidateService.exportCandidates(mockCandidates, {
        scope: 'ALL_FILTERED',
        format: 'xlsx',
      });

      expect(result.count).toBe(3);
      expect(result.format).toBe('xlsx');
      expect(result.filename).toMatch(/^Danh_sach_ung_vien_\d{8}_\d{4}\.xlsx$/);
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('chỉ xuất đúng các ứng viên được chọn khi scope = SELECTED_ONLY', async () => {
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(new Error('Offline'));

      const result = await candidateService.exportCandidates(mockCandidates, {
        scope: 'SELECTED_ONLY',
        candidateIds: ['cand-001', 'cand-003'],
        format: 'xlsx',
      });

      expect(result.count).toBe(2);
      expect(mockAnchor.download).toMatch(/^Danh_sach_ung_vien_\d{8}_\d{4}\.xlsx$/);
    });

    it('báo lỗi khi scope = SELECTED_ONLY nhưng không có ứng viên nào được chọn', async () => {
      await expect(
        candidateService.exportCandidates(mockCandidates, {
          scope: 'SELECTED_ONLY',
          candidateIds: [],
        })
      ).rejects.toThrow('Chưa có ứng viên nào được chọn để xuất file.');
    });

    it('báo lỗi khi danh sách ứng viên rỗng', async () => {
      await expect(
        candidateService.exportCandidates([], {
          scope: 'ALL_FILTERED',
        })
      ).rejects.toThrow('Danh sách ứng viên hiện tại rỗng, không thể xuất file.');
    });
  });

  describe('2. AC 1 & AC 3: Component Nút thao tác xuất Excel (CandidateExportExcelButton)', () => {
    it('hiển thị nút "Xuất Excel" với icon và data-testid chuẩn', () => {
      const html = renderToString(
        React.createElement(CandidateExportExcelButton, {
          candidates: mockCandidates,
          selectedCandidateIds: [],
        })
      );

      expect(html).toContain('data-testid="candidate-export-excel-btn"');
      expect(html).toContain('Xuất Excel');
    });

    it('hiển thị tiêu đề tooltip rõ ràng trên nút xuất Excel', () => {
      const html = renderToString(
        React.createElement(CandidateExportExcelButton, {
          candidates: mockCandidates,
          selectedCandidateIds: ['cand-001'],
        })
      );

      expect(html).toContain('Xuất dữ liệu danh sách ứng viên ra tệp Excel (.xlsx)');
    });
  });

  describe('3. Tích hợp thanh công cụ trang Quản lý ứng viên (CandidateManagementPage)', () => {
    it('hiển thị nút "Xuất Excel" trên thanh công cụ quản lý ứng viên (AC 1)', () => {
      const html = renderToString(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(CandidateManagementPage, {
            initialCandidates: mockCandidates,
            initialIsLoading: false,
          })
        )
      );

      expect(html).toContain('data-testid="candidate-export-excel-btn"');
      expect(html).toContain('Xuất Excel');
    });

    it('tích hợp liền mạch nút Xuất Excel cạnh nút Làm mới và Thêm ứng viên', () => {
      const html = renderToString(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(CandidateManagementPage, {
            initialCandidates: mockCandidates,
            initialIsLoading: false,
          })
        )
      );

      expect(html).toContain('Làm mới');
      expect(html).toContain('data-testid="candidate-export-excel-btn"');
      expect(html).toContain('data-testid="btn-open-manual-candidate-create"');
    });
  });
});
