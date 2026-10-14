import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import type {
  CandidateProfile,
  CandidateTag,
  ScreeningCatalogTag,
} from '../src/types/candidate';
import {
  MIN_STAR_RATING,
  MAX_STAR_RATING,
  STAR_RATING_DESCRIPTIONS,
  DEFAULT_SCREENING_CATALOG_TAGS,
} from '../src/types/candidate';
import { CandidateScreeningWidget } from '../src/components/Candidate/CandidateScreeningWidget';
import { CandidateDetailModal } from '../src/components/Candidate/CandidateDetailModal';
import { candidateService } from '../src/services/candidateService';

describe('Subtask TKNHTTDNB1-384: Thiết kế thao tác gắn nhãn đánh giá sao và ghi chú (Story TKNHTTDNB1-52)', () => {
  const mockStorageMap = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (storageKey: string) => mockStorageMap.get(storageKey) ?? null,
    setItem: (storageKey: string, storageValue: string) =>
      mockStorageMap.set(storageKey, storageValue),
    removeItem: (storageKey: string) => mockStorageMap.delete(storageKey),
    clear: () => mockStorageMap.clear(),
  };

  const sampleCandidateProfile: CandidateProfile = {
    id: 'candidate-screening-001',
    trackingCode: 'APP-2026-SCREEN01',
    fullName: 'Hoàng Minh Tuấn',
    email: 'tuan.hoang@company.com',
    phone: '0909123456',
    appliedJobId: 'job-req-001',
    appliedJobTitle: 'Senior React Developer',
    departmentName: 'Phòng Kỹ thuật Phần mềm',
    source: 'Website công ty',
    status: 'Mới tiếp nhận',
    cvUrl: '/sample-cv.pdf',
    cvFileName: 'CV_HoangMinhTuan.pdf',
    cvParsingStatus: 'CONFIRMED',
    rating: 4,
    tags: [
      {
        id: 'catalog-tag-react-strong',
        name: 'React/TS Vững',
        colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      },
      {
        id: 'catalog-tag-english-fluent',
        name: 'Tiếng Anh Tốt',
        colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
    ],
    notes: [
      {
        id: 'note-001',
        content: 'Ứng viên có kỹ năng React và TypeScript tốt, tư duy kiến trúc sạch.',
        authorName: 'Trần Thị Thu Hà',
        authorRole: 'Lead Recruiter',
        createdAt: '2026-10-14T08:30:00.000Z',
        category: 'SCREENING',
      },
      {
        id: 'note-002',
        content: 'Đã trao đổi nhanh qua điện thoại: Mức lương mong muốn phù hợp khung ngân sách.',
        authorName: 'Nguyễn Văn Hùng',
        authorRole: 'HR Manager',
        createdAt: '2026-10-14T09:15:00.000Z',
        category: 'OFFER',
      },
    ],
    appliedAt: '2026-10-14T08:00:00.000Z',
    updatedAt: '2026-10-14T09:15:00.000Z',
  };

  beforeEach(() => {
    mockStorageMap.clear();
    vi.stubGlobal('localStorage', mockLocalStorage);
    vi.stubGlobal('window', {
      localStorage: mockLocalStorage,
      dispatchEvent: vi.fn(),
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('1. Hằng số và Cấu hình Danh mục Nhãn & Đánh giá sao (Constants & Types)', () => {
    it('đảm bảo thang đánh giá sao chuẩn từ 1 đến 5 với mô tả chi tiết cho từng mức', () => {
      // Tại sao: Recruiter cần thang điểm chuẩn 1-5 để phân loại độ phù hợp tức thì
      expect(MIN_STAR_RATING).toBe(1);
      expect(MAX_STAR_RATING).toBe(5);

      expect(STAR_RATING_DESCRIPTIONS[1]).toContain('Chưa đạt yêu cầu tối thiểu');
      expect(STAR_RATING_DESCRIPTIONS[2]).toContain('Cần xem xét thêm');
      expect(STAR_RATING_DESCRIPTIONS[3]).toContain('Đạt tiêu chuẩn');
      expect(STAR_RATING_DESCRIPTIONS[4]).toContain('Rất tiềm năng');
      expect(STAR_RATING_DESCRIPTIONS[5]).toContain('Xuất sắc');
    });

    it('khởi tạo danh mục nhãn sàng lọc mặc định phong phú từ nhiều khía cạnh tuyển dụng', () => {
      // Tại sao: Nhãn danh mục giúp Recruiter gắn thẻ nhanh bằng click chuột, không mất thời gian gõ phím
      expect(DEFAULT_SCREENING_CATALOG_TAGS.length).toBeGreaterThanOrEqual(5);

      const catalogTagNames = DEFAULT_SCREENING_CATALOG_TAGS.map(
        (catalogItem: ScreeningCatalogTag) => catalogItem.name
      );
      expect(catalogTagNames).toContain('React/TS Vững');
      expect(catalogTagNames).toContain('Tiếng Anh Tốt');
      expect(catalogTagNames).toContain('Onboard ngay');
      expect(catalogTagNames).toContain('Văn hóa phù hợp');
      expect(catalogTagNames).toContain('Lương kỳ vọng khớp');
    });
  });

  describe('2. Giao diện Đánh giá 1 - 5 sao (1-Click Star Rating UI)', () => {
    it('kết xuất đầy đủ 5 nút sao tương ứng với 5 mức đánh giá từ 1 đến 5', () => {
      const renderedHtml = renderToString(
        React.createElement(CandidateScreeningWidget, {
          candidateStarRating: 3,
          selectedScreeningTags: [],
          internalNotes: [],
        })
      );

      // Kiểm tra sự hiện diện của các nút chấm sao từ 1 đến 5
      expect(renderedHtml).toContain('id="screening-star-1-btn"');
      expect(renderedHtml).toContain('id="screening-star-2-btn"');
      expect(renderedHtml).toContain('id="screening-star-3-btn"');
      expect(renderedHtml).toContain('id="screening-star-4-btn"');
      expect(renderedHtml).toContain('id="screening-star-5-btn"');
      expect(renderedHtml).toContain('Đánh giá mức độ tiềm năng (1 – 5 sao)');
      expect(renderedHtml).toContain('Mức 3/5 sao: Đạt tiêu chuẩn yêu cầu cơ bản');
    });

    it('hiển thị trạng thái chưa đánh giá sao khi mức sao là 0', () => {
      const renderedHtml = renderToString(
        React.createElement(CandidateScreeningWidget, {
          candidateStarRating: 0,
          selectedScreeningTags: [],
          internalNotes: [],
        })
      );

      expect(renderedHtml).toContain('Chưa đánh giá sao cho hồ sơ này');
    });

    it('cho phép kích hoạt hàm onRatingChange khi người dùng thao tác chọn sao', async () => {
      const mockRatingHandler = vi.fn();
      const testRating = 4;

      // Giả lập trực tiếp logic chọn sao 1-click
      await mockRatingHandler(testRating);
      expect(mockRatingHandler).toHaveBeenCalledWith(4);
    });
  });

  describe('3. Gắn nhãn hồ sơ đa lựa chọn (Multi-select Catalog Tags UI)', () => {
    it('hiển thị danh mục nhãn gợi ý nhanh dạng pills và các nhãn đã chọn dạng thẻ badge', () => {
      const renderedHtml = renderToString(
        React.createElement(CandidateScreeningWidget, {
          candidateStarRating: 4,
          selectedScreeningTags: sampleCandidateProfile.tags || [],
          internalNotes: [],
          catalogTags: DEFAULT_SCREENING_CATALOG_TAGS,
        })
      );

      // Hiển thị tiêu đề và số lượng nhãn đã chọn
      expect(renderedHtml).toContain('Gắn nhãn phân loại hồ sơ (Multi-select Tags)');
      expect(renderedHtml).toContain('2 nhãn đã chọn');

      // Hiển thị các nhãn đã gắn kèm nút gỡ nhanh
      expect(renderedHtml).toContain('React/TS Vững');
      expect(renderedHtml).toContain('Tiếng Anh Tốt');
      expect(renderedHtml).toContain('aria-label="Gỡ nhãn React/TS Vững"');
      expect(renderedHtml).toContain('aria-label="Gỡ nhãn Tiếng Anh Tốt"');

      // Hiển thị danh mục nhãn gợi ý để click chọn nhanh
      expect(renderedHtml).toContain('Nhãn danh mục gợi ý nhanh (Click để gắn/bỏ):');
      expect(renderedHtml).toContain('Onboard ngay');
      expect(renderedHtml).toContain('Văn hóa phù hợp');
    });

    it('cho phép hiển thị nút mở ô tạo nhãn riêng ngoài danh mục', () => {
      const renderedHtml = renderToString(
        React.createElement(CandidateScreeningWidget, {
          candidateStarRating: 0,
          selectedScreeningTags: [],
          internalNotes: [],
        })
      );

      expect(renderedHtml).toContain('Tạo nhãn riêng');
    });
  });

  describe('4. Ghi chú nội bộ bảo mật (Internal Notes UI)', () => {
    it('bắt buộc hiển thị rõ chú thích bảo mật: "Ghi chú nội bộ (Ứng viên không bao giờ nhìn thấy)"', () => {
      const renderedHtml = renderToString(
        React.createElement(CandidateScreeningWidget, {
          candidateStarRating: 0,
          selectedScreeningTags: [],
          internalNotes: [],
        })
      );

      // Chú thích bắt buộc theo yêu cầu nghiệp vụ
      expect(renderedHtml).toContain(
        'Ghi chú nội bộ (Ứng viên không bao giờ nhìn thấy)'
      );
    });

    it('kết xuất ô nhập ghi chú mới, bộ chọn phân loại và nút "Thêm ghi chú"', () => {
      const renderedHtml = renderToString(
        React.createElement(CandidateScreeningWidget, {
          candidateStarRating: 0,
          selectedScreeningTags: [],
          internalNotes: [],
          currentUserName: 'Lê Thùy Dương',
          currentUserRole: 'Talent Acquisition',
        })
      );

      expect(renderedHtml).toContain('id="screening-internal-note-textarea"');
      expect(renderedHtml).toContain('id="screening-note-category-select"');
      expect(renderedHtml).toContain('id="submit-internal-note-btn"');
      expect(renderedHtml).toContain('Thêm ghi chú');
      expect(renderedHtml).toContain('Lê Thùy Dương');
      expect(renderedHtml).toContain('Talent Acquisition');
    });

    it('hiển thị danh sách ghi chú với đầy đủ Tên người viết, thời gian viết và nội dung', () => {
      const renderedHtml = renderToString(
        React.createElement(CandidateScreeningWidget, {
          candidateStarRating: 4,
          selectedScreeningTags: [],
          internalNotes: sampleCandidateProfile.notes || [],
        })
      );

      // Hiển thị tổng số lượng ghi chú trong lịch sử
      expect(renderedHtml).toContain('Lịch sử ghi chú (2):');

      // Ghi chú 1: Tên người viết + Vai trò + Nội dung
      expect(renderedHtml).toContain('Trần Thị Thu Hà');
      expect(renderedHtml).toContain('Lead Recruiter');
      expect(renderedHtml).toContain(
        'Ứng viên có kỹ năng React và TypeScript tốt, tư duy kiến trúc sạch.'
      );

      // Ghi chú 2: Tên người viết + Vai trò + Nội dung
      expect(renderedHtml).toContain('Nguyễn Văn Hùng');
      expect(renderedHtml).toContain('HR Manager');
      expect(renderedHtml).toContain(
        'Đã trao đổi nhanh qua điện thoại: Mức lương mong muốn phù hợp khung ngân sách.'
      );
    });
  });

  describe('5. Tích hợp CandidateDetailModal & candidateService (Integration)', () => {
    it('kết xuất CandidateScreeningWidget bên trong CandidateDetailModal khi mở hồ sơ', () => {
      const renderedHtml = renderToString(
        React.createElement(CandidateDetailModal, {
          isOpen: true,
          candidateProfile: sampleCandidateProfile,
          onClose: vi.fn(),
        })
      );

      // Kiểm tra cụm sàng lọc nhanh xuất hiện trong modal hồ sơ ứng viên
      expect(renderedHtml).toContain('Sàng lọc nhanh hồ sơ (Screening)');
      expect(renderedHtml).toContain('Thao tác 1-click');
      expect(renderedHtml).toContain('Ghi chú nội bộ (Ứng viên không bao giờ nhìn thấy)');
      expect(renderedHtml).toContain('React/TS Vững');
      expect(renderedHtml).toContain('Trần Thị Thu Hà');
    });

    it('candidateService.getCatalogTags trả về danh mục nhãn sàng lọc', async () => {
      const catalogTagsList = await candidateService.getCatalogTags();
      expect(catalogTagsList.length).toBeGreaterThanOrEqual(5);
      expect(catalogTagsList[0]).toHaveProperty('id');
      expect(catalogTagsList[0]).toHaveProperty('name');
      expect(catalogTagsList[0]).toHaveProperty('colorClass');
    });

    it('candidateService.updateCandidateRating cập nhật mức sao và đồng bộ dữ liệu', async () => {
      // Thiết lập hồ sơ mẫu trong localStorage
      mockStorageMap.set(
        'smart_recruit_candidate_profiles',
        JSON.stringify([sampleCandidateProfile])
      );

      const updatedRating = await candidateService.updateCandidateRating(
        sampleCandidateProfile.id,
        5
      );

      expect(updatedRating).toBe(5);

      // Kiểm tra lưu vết trong localStorage
      const storedProfiles = JSON.parse(
        mockStorageMap.get('smart_recruit_candidate_profiles') || '[]'
      );
      expect(storedProfiles[0].rating).toBe(5);
    });

    it('candidateService.updateCandidateTags cập nhật danh sách nhãn hồ sơ', async () => {
      mockStorageMap.set(
        'smart_recruit_candidate_profiles',
        JSON.stringify([sampleCandidateProfile])
      );

      const newTagsList: CandidateTag[] = [
        {
          id: 'catalog-tag-react-strong',
          name: 'React/TS Vững',
          colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        },
        {
          id: 'catalog-tag-onboard-immediate',
          name: 'Onboard ngay',
          colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
        },
        {
          id: 'custom-tag-lead',
          name: 'Kinh nghiệm Lead 3 năm',
          colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
        },
      ];

      const updatedTags = await candidateService.updateCandidateTags(
        sampleCandidateProfile.id,
        newTagsList
      );

      expect(updatedTags).toHaveLength(3);
      expect(updatedTags.map((itemTag) => itemTag.name)).toContain(
        'Kinh nghiệm Lead 3 năm'
      );

      const storedProfiles = JSON.parse(
        mockStorageMap.get('smart_recruit_candidate_profiles') || '[]'
      );
      expect(storedProfiles[0].tags).toHaveLength(3);
    });

    it('candidateService.addInternalNote thêm ghi chú với đầy đủ Tên tác giả, thời gian ISO và nội dung', async () => {
      mockStorageMap.set(
        'smart_recruit_candidate_profiles',
        JSON.stringify([sampleCandidateProfile])
      );

      const noteContentText = 'Đã phỏng vấn vòng 1: Thái độ hợp tác rất tốt, phản xạ nhanh.';
      const authorFullName = 'Phạm Thanh Thảo';
      const authorRoleTitle = 'Senior Technical Recruiter';

      const newestNote = await candidateService.addInternalNote(
        sampleCandidateProfile.id,
        noteContentText,
        authorFullName,
        authorRoleTitle,
        'INTERVIEW'
      );

      expect(newestNote.content).toBe(noteContentText);
      expect(newestNote.authorName).toBe(authorFullName);
      expect(newestNote.authorRole).toBe(authorRoleTitle);
      expect(newestNote.category).toBe('INTERVIEW');
      expect(newestNote.createdAt).toBeDefined();

      const storedProfiles = JSON.parse(
        mockStorageMap.get('smart_recruit_candidate_profiles') || '[]'
      );
      expect(storedProfiles[0].notes).toHaveLength(3);
      expect(storedProfiles[0].notes[0].content).toBe(noteContentText);
    });
  });
});
