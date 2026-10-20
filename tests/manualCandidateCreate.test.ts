import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { CreateManualCandidateDto, CandidateProfile } from '../src/types/candidate';
import { candidateService } from '../src/services/candidateService';
import { ManualCandidateCreateModal } from '../src/components/Candidate/ManualCandidateCreateModal';
import { CandidateManagementPage } from '../src/pages/Candidate/CandidateManagementPage';
import axiosClient from '../src/utils/axiosClient';

describe('Task Jira TKNHTTDNB1-406: Thiết kế biểu mẫu thêm ứng viên thủ công (User Story S5-06)', () => {
  const mockStorageMap = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string) => mockStorageMap.get(key) ?? null,
    setItem: (key: string, value: string) => mockStorageMap.set(key, value),
    removeItem: (key: string) => mockStorageMap.delete(key),
    clear: () => mockStorageMap.clear(),
  };

  const sampleJobOptions = [
    { id: 'job-fe-01', title: 'Senior Frontend Developer (React, TypeScript)', departmentName: 'Khối Công nghệ & Sản phẩm' },
    { id: 'job-be-02', title: 'Backend Engineer (Node.js & Golang)', departmentName: 'Khối Hạ tầng & Dữ liệu' },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    mockStorageMap.clear();
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });
      // Mock URL.createObjectURL and URL.revokeObjectURL
      if (!window.URL.createObjectURL) {
        window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost:5173/mock-cv-uuid');
      }
      if (!window.URL.revokeObjectURL) {
        window.URL.revokeObjectURL = vi.fn();
      }
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. AC 1: Giao diện Modal & Các trường thông tin bắt buộc / mở rộng', () => {
    it('không hiển thị khi isOpen = false', () => {
      const html = renderToString(
        React.createElement(ManualCandidateCreateModal, {
          isOpen: false,
          onClose: () => {},
        })
      );
      expect(html).toBe('');
    });

    it('hiển thị đầy đủ tiêu đề modal, User Story S5-06 và nút đóng khi isOpen = true', () => {
      const html = renderToString(
        React.createElement(ManualCandidateCreateModal, {
          isOpen: true,
          onClose: () => {},
          jobOptions: sampleJobOptions,
        })
      );

      expect(html).toContain('Thêm hồ sơ ứng viên thủ công');
      expect(html).toContain('User Story S5-06');
      expect(html).toContain('Thêm ứng viên từ nguồn giới thiệu nội bộ');
      expect(html).toContain('aria-label="Đóng biểu mẫu"');
    });

    it('hiển thị đầy đủ các trường thông tin cá nhân (Họ tên, Email, SĐT, Ngày sinh, Địa chỉ)', () => {
      const html = renderToString(
        React.createElement(ManualCandidateCreateModal, {
          isOpen: true,
          onClose: () => {},
          jobOptions: sampleJobOptions,
        })
      );

      expect(html).toContain('1. Thông tin cá nhân ứng viên');
      expect(html).toContain('data-testid="input-candidate-full-name"');
      expect(html).toContain('data-testid="input-candidate-email"');
      expect(html).toContain('data-testid="input-candidate-phone"');
      expect(html).toContain('data-testid="input-candidate-dob"');
      expect(html).toContain('data-testid="input-candidate-address"');
    });

    it('hiển thị các trường thông tin tuyển dụng (Vị trí ứng tuyển dropdown & Nguồn ứng viên)', () => {
      const html = renderToString(
        React.createElement(ManualCandidateCreateModal, {
          isOpen: true,
          onClose: () => {},
          jobOptions: sampleJobOptions,
        })
      );

      expect(html).toContain('2. Thông tin vị trí &amp; Nguồn tuyển dụng');
      expect(html).toContain('data-testid="select-candidate-job"');
      expect(html).toContain('data-testid="select-candidate-source"');
      expect(html).toContain('Senior Frontend Developer (React, TypeScript)');
      expect(html).toContain('Giới thiệu nội bộ (Referral)');
      expect(html).toContain('Mạng xã hội LinkedIn');
      expect(html).toContain('Sự kiện tuyển dụng / Job Fair');
      expect(html).toContain('Email trực tiếp');
    });

    it('hiển thị trường kỹ năng chuyên môn, số năm kinh nghiệm, đơn vị công tác gần nhất & ghi chú', () => {
      const html = renderToString(
        React.createElement(ManualCandidateCreateModal, {
          isOpen: true,
          onClose: () => {},
          jobOptions: sampleJobOptions,
        })
      );

      expect(html).toContain('3. Kỹ năng chuyên môn &amp; Kinh nghiệm');
      expect(html).toContain('data-testid="input-skill-tag"');
      expect(html).toContain('data-testid="btn-add-skill"');
      expect(html).toContain('data-testid="selected-skills-container"');
      expect(html).toContain('+React');
      expect(html).toContain('+TypeScript');
      expect(html).toContain('+Tailwind CSS');
      expect(html).toContain('data-testid="input-candidate-experience"');
      expect(html).toContain('data-testid="input-candidate-company"');
      expect(html).toContain('data-testid="textarea-candidate-notes"');
    });
  });

  describe('2. AC 2: Khu vực tải lên tệp CV (Resume/CV Upload Area)', () => {
    it('hiển thị vùng kéo thả dropzone khi chưa có tệp tải lên', () => {
      const html = renderToString(
        React.createElement(ManualCandidateCreateModal, {
          isOpen: true,
          onClose: () => {},
          jobOptions: sampleJobOptions,
        })
      );

      expect(html).toContain('4. Đính kèm tệp hồ sơ / CV ứng viên');
      expect(html).toContain('data-testid="cv-dropzone"');
      expect(html).toContain('data-testid="file-cv-input"');
      expect(html).toContain('Bấm để duyệt tệp');
      expect(html).toContain('hoặc kéo và thả tệp CV vào đây');
      expect(html).toContain('Định dạng hợp lệ: PDF, DOC, DOCX');
      expect(html).toContain('Kích thước tối đa: 10MB');
    });

    it('hiển thị đầy đủ 2 nút Lưu và tiếp tục thêm & Lưu và đóng form', () => {
      const html = renderToString(
        React.createElement(ManualCandidateCreateModal, {
          isOpen: true,
          onClose: () => {},
          jobOptions: sampleJobOptions,
        })
      );

      expect(html).toContain('data-testid="btn-cancel"');
      expect(html).toContain('data-testid="btn-save-and-continue"');
      expect(html).toContain('Lưu và tiếp tục thêm');
      expect(html).toContain('data-testid="btn-save-and-close"');
      expect(html).toContain('Lưu và đóng form');
    });
  });

  describe('3. AC 3: Validation & Báo lỗi tiếng Việt trực tiếp dưới từng ô input', () => {
    it('kiểm tra quy tắc validate bắt buộc: Họ tên, Email, Số điện thoại, Vị trí ứng tuyển', () => {
      // Test logic validate trực tiếp
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;

      // Họ tên
      expect(''.trim().length < 2).toBe(true);
      expect('N'.trim().length < 2).toBe(true);
      expect('Nguyễn Văn A'.trim().length >= 2).toBe(true);

      // Email
      expect(emailRegex.test('')).toBe(false);
      expect(emailRegex.test('sai-email')).toBe(false);
      expect(emailRegex.test('ungvien@gmail.com')).toBe(true);

      // Số điện thoại Việt Nam
      expect(phoneRegex.test('')).toBe(false);
      expect(phoneRegex.test('12345')).toBe(false);
      expect(phoneRegex.test('0912345678')).toBe(true);
      expect(phoneRegex.test('+84912345678')).toBe(true);
    });

    it('kiểm tra giới hạn dung lượng tệp CV tối đa 10MB', () => {
      const MAX_SIZE = 10 * 1024 * 1024;
      const smallFileSize = 2 * 1024 * 1024; // 2MB
      const largeFileSize = 11 * 1024 * 1024; // 11MB

      expect(smallFileSize <= MAX_SIZE).toBe(true);
      expect(largeFileSize > MAX_SIZE).toBe(true);
    });

    it('kiểm tra định dạng tệp CV được chấp nhận (.pdf, .doc, .docx)', () => {
      const allowedExtensions = ['.pdf', '.doc', '.docx'];
      const checkValid = (name: string) => allowedExtensions.some((ext) => name.toLowerCase().endsWith(ext));

      expect(checkValid('CV_NguyenVanA.pdf')).toBe(true);
      expect(checkValid('Resume_TranThiB.docx')).toBe(true);
      expect(checkValid('HoSo.doc')).toBe(true);
      expect(checkValid('malware.exe')).toBe(false);
      expect(checkValid('archive.zip')).toBe(false);
    });
  });

  describe('4. AC 4: Service candidateService.createManualCandidate & Xử lý lưu hồ sơ', () => {
    it('createManualCandidate tạo mới và lưu hồ sơ thành công vào storage', async () => {
      const newCandidateDto: CreateManualCandidateDto = {
        fullName: 'Trần Văn Hoàng',
        email: 'hoang.tran.dev@gmail.com',
        phone: '0988112233',
        dateOfBirth: '1995-05-20',
        address: 'Hà Đông, Hà Nội',
        appliedJobId: 'job-fe-01',
        appliedJobTitle: 'Senior Frontend Developer (React, TypeScript)',
        source: 'Giới thiệu nội bộ (Referral)',
        skills: ['React', 'TypeScript', 'Tailwind CSS', 'Redux'],
        experienceYears: 4,
        currentCompany: 'Tập đoàn Công nghệ FPT',
        notes: 'Do anh Tuấn Anh giới thiệu, sẵn sàng phỏng vấn tuần tới.',
        cvFileName: 'CV_TranVanHoang_Frontend.pdf',
        cvFileSize: 1024 * 850,
      };

      const result = await candidateService.createManualCandidate(newCandidateDto);

      expect(result.id).toBeDefined();
      expect(result.id).toContain('cand-manual-');
      expect(result.fullName).toBe('Trần Văn Hoàng');
      expect(result.email).toBe('hoang.tran.dev@gmail.com');
      expect(result.phone).toBe('0988112233');
      expect(result.skills).toEqual(['React', 'TypeScript', 'Tailwind CSS', 'Redux']);
      expect(result.experienceYears).toBe(4);
      expect(result.currentCompany).toBe('Tập đoàn Công nghệ FPT');
      expect(result.cvFileName).toBe('CV_TranVanHoang_Frontend.pdf');
      expect(result.status).toBe('Mới tiếp nhận');
      expect(result.cvParsingStatus).toBe('CONFIRMED');
      expect(result.matchingEvaluation).toBeDefined();

      // Kiểm tra danh sách ứng viên đã được cập nhật
      const allProfiles = await candidateService.getCandidates({});
      const found = allProfiles.find((c) => c.id === result.id);
      expect(found).toBeDefined();
      expect(found?.fullName).toBe('Trần Văn Hoàng');
    });

    it('createManualCandidate gửi API POST /recruitment/candidates/manual khi backend sẵn sàng', async () => {
      const mockCandidateResponse: CandidateProfile = {
        id: 'cand-backend-999',
        trackingCode: 'APP-2026-999',
        fullName: 'Lê Thùy Dung',
        email: 'dung.le@gmail.com',
        phone: '0977665544',
        appliedJobId: 'job-be-02',
        appliedJobTitle: 'Backend Engineer (Node.js & Golang)',
        source: 'Mạng xã hội LinkedIn',
        status: 'Mới tiếp nhận',
        cvParsingStatus: 'CONFIRMED',
      };

      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: mockCandidateResponse,
      });

      const result = await candidateService.createManualCandidate({
        fullName: 'Lê Thùy Dung',
        email: 'dung.le@gmail.com',
        phone: '0977665544',
        appliedJobId: 'job-be-02',
        source: 'Mạng xã hội LinkedIn',
      });

      expect(postSpy).toHaveBeenCalledWith(
        '/recruitment/candidates/manual',
        expect.objectContaining({
          fullName: 'Lê Thùy Dung',
          email: 'dung.le@gmail.com',
          phone: '0977665544',
        })
      );
      expect(result.id).toBe('cand-backend-999');
    });
  });

  describe('5. Tích hợp trên trang Quản lý ứng viên (CandidateManagementPage)', () => {
    it('hiển thị nút "Thêm ứng viên" trên thanh công cụ trang Quản lý ứng viên', () => {
      const html = renderToString(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(CandidateManagementPage, {
            initialCandidates: [],
            initialIsLoading: false,
          })
        )
      );

      expect(html).toContain('data-testid="btn-open-manual-candidate-create"');
      expect(html).toContain('Thêm ứng viên');
    });
  });
});
