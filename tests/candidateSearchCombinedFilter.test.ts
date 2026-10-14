import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import type {
  CandidateProfile,
  CandidateCombinedFilterState,
} from '../src/types/candidate';
import {
  DEFAULT_COMBINED_FILTER_STATE,
} from '../src/types/candidate';
import {
  filterCandidatesCombined,
  getActiveFilterBadges,
  countActiveFilters,
} from '../src/utils/candidateFilterHelper';
import { CandidateSearchFilterPanel } from '../src/components/Candidate/CandidateSearchFilterPanel';

describe('Task Jira TKNHTTDNB1-390: Thiết kế tìm kiếm ứng viên và bộ lọc kết hợp (User Story S5-03)', () => {
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
      educationLevel: 'Cử nhân Công nghệ Thông tin - Đại học Bách Khoa',
      status: 'INTERVIEWING',
      cvParsingStatus: 'CONFIRMED',
      tags: [
        { id: 't1', name: 'React', colorClass: 'bg-blue-50 text-blue-700' },
        { id: 't2', name: 'TypeScript', colorClass: 'bg-indigo-50 text-indigo-700' },
        { id: 't3', name: 'Tailwind CSS', colorClass: 'bg-teal-50 text-teal-700' },
      ],
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'Redux Toolkit'],
      appliedAt: '2026-10-10T10:00:00.000Z',
    },
    {
      id: 'cand-002',
      trackingCode: 'APP-2026-002',
      fullName: 'Trần Thị Bích',
      email: 'bich.tran@company.com',
      phone: '0977222333',
      appliedJobId: 'job-be-02',
      appliedJobTitle: 'Senior Java Backend Engineer (Spring Boot, Microservices)',
      departmentName: 'Khối Công nghệ & Sản phẩm',
      experienceYears: 6,
      educationLevel: 'Thạc sĩ Khoa học Máy tính',
      status: 'OFFER',
      cvParsingStatus: 'CONFIRMED',
      tags: [
        { id: 't4', name: 'Java', colorClass: 'bg-amber-50 text-amber-700' },
        { id: 't5', name: 'Spring Boot', colorClass: 'bg-emerald-50 text-emerald-700' },
        { id: 't6', name: 'Docker', colorClass: 'bg-sky-50 text-sky-700' },
      ],
      skills: ['Java', 'Spring Boot', 'Docker', 'PostgreSQL', 'Microservices'],
      appliedAt: '2026-10-11T11:00:00.000Z',
    },
    {
      id: 'cand-003',
      trackingCode: 'APP-2026-003',
      fullName: 'Lê Hoàng Nam',
      email: 'nam.le@gmail.com',
      phone: '0933444555',
      appliedJobId: 'job-ai-03',
      appliedJobTitle: 'AI Research Scientist',
      departmentName: 'Trung tâm Nghiên cứu AI & Dữ liệu',
      experienceYears: 2,
      educationLevel: 'Cử nhân Toán Tin - Đại học Khoa học Tự nhiên',
      status: 'NEW',
      cvParsingStatus: 'PENDING_CONFIRMATION',
      tags: [
        { id: 't7', name: 'Python', colorClass: 'bg-blue-50 text-blue-700' },
        { id: 't8', name: 'PyTorch', colorClass: 'bg-rose-50 text-rose-700' },
      ],
      skills: ['Python', 'PyTorch', 'TensorFlow', 'LLM'],
      appliedAt: '2026-10-12T09:00:00.000Z',
    },
    {
      id: 'cand-004',
      trackingCode: 'APP-2026-004',
      fullName: 'Phạm Thu Trang',
      email: 'trang.pham@design.com',
      phone: '0911555666',
      appliedJobId: 'job-uiux-04',
      appliedJobTitle: 'UI/UX Product Designer',
      departmentName: 'Khối Công nghệ & Sản phẩm',
      experienceYears: 0.8,
      educationLevel: 'Cao đẳng Mỹ thuật Công nghiệp',
      status: 'REJECTED',
      cvParsingStatus: 'FAILED',
      tags: [
        { id: 't9', name: 'UI/UX', colorClass: 'bg-purple-50 text-purple-700' },
        { id: 't10', name: 'Figma', colorClass: 'bg-pink-50 text-pink-700' },
      ],
      skills: ['UI/UX', 'Figma', 'Prototyping', 'User Research'],
      appliedAt: '2026-10-13T08:00:00.000Z',
    },
  ];

  describe('1. AC 1: Thanh tìm kiếm chính (Global Search Bar)', () => {
    it('tìm kiếm chính xác theo Họ tên ứng viên', () => {
      const result = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        keyword: 'Nguyễn Văn An',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cand-001');
    });

    it('tìm kiếm chính xác theo Email ứng viên', () => {
      const result = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        keyword: 'bich.tran@company.com',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cand-002');
    });

    it('tìm kiếm chính xác theo Số điện thoại ứng viên', () => {
      const result = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        keyword: '0933444555',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cand-003');
    });

    it('tìm kiếm chính xác theo Kỹ năng chuyên môn của ứng viên', () => {
      const result = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        keyword: 'TypeScript',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cand-001');

      const pythonResult = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        keyword: 'python',
      });
      expect(pythonResult).toHaveLength(1);
      expect(pythonResult[0].id).toBe('cand-003');
    });

    it('tìm kiếm không phân biệt chữ hoa, chữ thường và khoảng trắng', () => {
      const result = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        keyword: '   SPRING BOOT   ',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cand-002');
    });
  });

  describe('2. AC 2: Hệ thống bộ lọc đa tầng (Combined Filters Panel)', () => {
    it('lọc theo Vị trí ứng tuyển (jobId)', () => {
      const result = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        jobId: 'job-fe-01',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cand-001');
    });

    it('lọc theo Phòng ban (department)', () => {
      const result = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        department: 'Trung tâm Nghiên cứu AI & Dữ liệu',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cand-003');
    });

    it('lọc theo Số năm kinh nghiệm: < 1 năm (LT_1)', () => {
      const result = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        experienceLevel: 'LT_1',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cand-004'); // 0.8 năm
    });

    it('lọc theo Số năm kinh nghiệm: 1 - 3 năm (1_TO_3)', () => {
      const result = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        experienceLevel: '1_TO_3',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cand-003'); // 2 năm
    });

    it('lọc theo Số năm kinh nghiệm: 3 - 5 năm (3_TO_5)', () => {
      const result = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        experienceLevel: '3_TO_5',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cand-001'); // 5 năm
    });

    it('lọc theo Số năm kinh nghiệm: > 5 năm (GT_5)', () => {
      const result = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        experienceLevel: 'GT_5',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cand-002'); // 6 năm
    });

    it('lọc theo Số năm kinh nghiệm tùy chỉnh Min - Max (CUSTOM)', () => {
      const result = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        experienceLevel: 'CUSTOM',
        minExperienceYears: 4,
        maxExperienceYears: 7,
      });
      expect(result).toHaveLength(2);
      expect(result.map((c) => c.id)).toEqual(['cand-001', 'cand-002']);
    });

    it('lọc theo Trình độ học vấn: Cử nhân / Đại học (BACHELOR)', () => {
      const result = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        educationLevel: 'BACHELOR',
      });
      expect(result.map((c) => c.id)).toContain('cand-001');
      expect(result.map((c) => c.id)).toContain('cand-003');
    });

    it('lọc theo Trình độ học vấn: Thạc sĩ / Tiến sĩ (MASTER_PLUS)', () => {
      const result = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        educationLevel: 'MASTER_PLUS',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cand-002');
    });

    it('lọc theo Trạng thái hồ sơ: Phỏng vấn (INTERVIEWING)', () => {
      const result = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        stageStatus: 'INTERVIEWING',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cand-001');
    });

    it('lọc theo Trạng thái hồ sơ: Trúng tuyển (OFFER_HIRED)', () => {
      const result = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        stageStatus: 'OFFER_HIRED',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cand-002');
    });

    it('lọc theo Trạng thái hồ sơ: Loại hồ sơ (REJECTED)', () => {
      const result = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        stageStatus: 'REJECTED',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cand-004');
    });

    it('lọc theo Thẻ kỹ năng (Tags/Chips: React, TypeScript)', () => {
      const result = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        skills: ['React', 'TypeScript'],
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cand-001');
    });

    it('kết hợp đồng thời nhiều điều kiện lọc đa tầng (Combined Filters)', () => {
      const result = filterCandidatesCombined(mockCandidates, {
        ...DEFAULT_COMBINED_FILTER_STATE,
        keyword: 'bich',
        department: 'Khối Công nghệ & Sản phẩm',
        experienceLevel: 'GT_5',
        educationLevel: 'MASTER_PLUS',
        stageStatus: 'OFFER_HIRED',
        skills: ['Java', 'Spring Boot'],
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cand-002');
    });
  });

  describe('3. AC 3: Thao tác nhanh trên bộ lọc & Active Filter Badges', () => {
    it('getActiveFilterBadges trả về đúng danh sách các badge đang kích hoạt', () => {
      const filterState: CandidateCombinedFilterState = {
        keyword: 'React',
        jobId: 'job-fe-01',
        department: 'Khối Công nghệ & Sản phẩm',
        experienceLevel: '3_TO_5',
        educationLevel: 'BACHELOR',
        stageStatus: 'INTERVIEWING',
        skills: ['TypeScript', 'Tailwind CSS'],
        cvParsingStatus: 'CONFIRMED',
      };

      const badges = getActiveFilterBadges(filterState, {
        jobOptions: [{ id: 'job-fe-01', title: 'Senior Frontend' }],
      });

      expect(badges.length).toBe(9); // 1 keyword + 1 job + 1 dept + 1 exp + 1 edu + 1 stage + 2 skills + 1 cv status
      expect(badges.find((b) => b.type === 'keyword')?.displayValue).toBe('"React"');
      expect(badges.find((b) => b.type === 'job')?.displayValue).toBe('Senior Frontend');
      expect(badges.find((b) => b.type === 'experience')?.displayValue).toBe('3 - 5 năm');
      expect(badges.find((b) => b.type === 'education')?.displayValue).toBe('Đại học / Cử nhân');
      expect(badges.find((b) => b.type === 'stage')?.displayValue).toBe('Phỏng vấn');
      expect(badges.filter((b) => b.type === 'skill')).toHaveLength(2);
    });

    it('countActiveFilters tính chính xác số lượng bộ lọc đang kích hoạt', () => {
      expect(countActiveFilters(DEFAULT_COMBINED_FILTER_STATE)).toBe(0);

      const activeState: CandidateCombinedFilterState = {
        ...DEFAULT_COMBINED_FILTER_STATE,
        keyword: 'an',
        experienceLevel: 'GT_5',
        skills: ['Java', 'Docker'],
      };
      expect(countActiveFilters(activeState)).toBe(4); // keyword + exp + 2 skills
    });
  });

  describe('4. AC 4: Component CandidateSearchFilterPanel & Collapsible Panel', () => {
    it('render đầy đủ thanh tìm kiếm chính với input ID candidate-search-input', () => {
      const htmlOutput = renderToString(
        React.createElement(CandidateSearchFilterPanel, {
          filters: DEFAULT_COMBINED_FILTER_STATE,
          onChangeFilters: vi.fn(),
        })
      );

      expect(htmlOutput).toContain('id="candidate-search-input"');
      expect(htmlOutput).toContain('data-testid="candidate-search-input"');
      expect(htmlOutput).toContain('Tìm theo họ tên, email, số điện thoại, kỹ năng');
    });

    it('hiển thị nút toggle Bộ lọc nâng cao với data-testid toggle-advanced-filters-btn', () => {
      const htmlOutput = renderToString(
        React.createElement(CandidateSearchFilterPanel, {
          filters: DEFAULT_COMBINED_FILTER_STATE,
          onChangeFilters: vi.fn(),
        })
      );

      expect(htmlOutput).toContain('data-testid="toggle-advanced-filters-btn"');
      expect(htmlOutput).toContain('Bộ lọc nâng cao');
    });

    it('khi defaultExpanded = true, render đầy đủ bảng bộ lọc nâng cao', () => {
      const htmlOutput = renderToString(
        React.createElement(CandidateSearchFilterPanel, {
          filters: DEFAULT_COMBINED_FILTER_STATE,
          onChangeFilters: vi.fn(),
          defaultExpanded: true,
          jobOptions: [{ id: 'job-1', title: 'Frontend Developer' }],
        })
      );

      // Bảng lọc nâng cao
      expect(htmlOutput).toContain('data-testid="advanced-filters-panel"');
      expect(htmlOutput).toContain('id="candidate-job-filter"');
      expect(htmlOutput).toContain('id="candidate-department-filter"');
      expect(htmlOutput).toContain('id="candidate-experience-filter"');
      expect(htmlOutput).toContain('id="candidate-education-filter"');
      expect(htmlOutput).toContain('id="candidate-stage-filter"');

      // Nút áp dụng và xóa bộ lọc
      expect(htmlOutput).toContain('data-testid="apply-filters-btn"');
      expect(htmlOutput).toContain('data-testid="reset-filters-btn"');

      // Danh sách chip kỹ năng
      expect(htmlOutput).toContain('Thẻ kỹ năng chuyên môn');
      expect(htmlOutput).toContain('React');
      expect(htmlOutput).toContain('TypeScript');
    });

    it('hiển thị active filter badges và nút tắt nhanh khi có bộ lọc được áp dụng', () => {
      const activeFilters: CandidateCombinedFilterState = {
        ...DEFAULT_COMBINED_FILTER_STATE,
        keyword: 'React',
        skills: ['TypeScript'],
      };

      const htmlOutput = renderToString(
        React.createElement(CandidateSearchFilterPanel, {
          filters: activeFilters,
          onChangeFilters: vi.fn(),
        })
      );

      expect(htmlOutput).toContain('data-testid="active-filter-badges-container"');
      expect(htmlOutput).toContain('data-testid="active-filters-counter-badge"');
      expect(htmlOutput).toContain('&quot;React&quot;');
      expect(htmlOutput).toContain('TypeScript');
      expect(htmlOutput).toContain('data-testid="clear-all-active-badges-btn"');
    });
  });
});
